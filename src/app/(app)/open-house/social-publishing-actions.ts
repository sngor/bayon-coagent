// @ts-nocheck
'use server';

/**
 * Social Media Publishing Actions for Open House Marketing
 * 
 * Provides server actions for:
 * - Publishing open house marketing content to social media platforms
 * - Scheduling posts for future publication
 * - Retrieving social media connection status
 * - Tracking publishing status
 * 
 * Validates: Requirements 16.7
 */

import { randomUUID } from 'crypto';
import { getRepository } from '@/aws/dynamodb/repository';
import { getSocialConnectionKeys, getSocialPostKeys, getScheduledContentKeys } from '@/aws/dynamodb/keys';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { createEnhancedPublishingService } from '@/services/publishing/enhanced-publishing-service';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import type { Platform, SocialPost, OAuthConnection } from '@/integrations/social/types';
import type { GenerateOpenHouseSocialPostsOutput } from '@/aws/bedrock/flows/generate-open-house-marketing';

// Type aliases for individual platform posts
type FacebookPost = NonNullable<GenerateOpenHouseSocialPostsOutput['facebook']>;
type InstagramPost = NonNullable<GenerateOpenHouseSocialPostsOutput['instagram']>;
type LinkedInPost = NonNullable<GenerateOpenHouseSocialPostsOutput['linkedin']>;
type TwitterPost = NonNullable<GenerateOpenHouseSocialPostsOutput['twitter']>;
import {
    ScheduledContent,
    ScheduledContentStatus,
    PublishChannelType,
    ContentCategory
} from '@/lib/content-workflow-types';

/**
 * Get social media connections for the current user
 */
export async function getSocialConnections() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const oauthManager = getOAuthConnectionManager();
        const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

        const connections = await Promise.all(
            platforms.map(async (platform) => {
                const connection = await oauthManager.getConnection(user.id, platform);
                return {
                    platform,
                    connected: !!connection,
                    username: connection?.platformUsername,
                };
            })
        );

        return {
            success: true,
            connections,
        };
    } catch (error) {
        console.error('Failed to get social connections:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connections',
        };
    }
}

/**
 * Publish open house social post immediately
 */
export async function publishOpenHouseSocialPost(
    sessionId: string,
    platform: Platform,
    postContent: FacebookPost | InstagramPost | LinkedInPost | TwitterPost
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Get OAuth connection
        const oauthManager = getOAuthConnectionManager();
        const connection = await oauthManager.getConnection(user.id, platform);

        if (!connection) {
            return {
                success: false,
                error: `No ${platform} connection found. Please connect your account.`,
            };
        }

        // Convert post content to SocialPost format
        const socialPost = convertToSocialPost(sessionId, platform, postContent);

        // Publish using enhanced publishing service
        const publishingService = createEnhancedPublishingService();
        const result = await publishingService.publishToPlatform(
            socialPost,
            platform,
            connection,
            user.id
        );

        if (result.success) {
            return {
                success: true,
                postId: result.postId,
                postUrl: result.postUrl,
            };
        } else {
            return {
                success: false,
                error: result.errorDetails?.userMessage || result.error || 'Failed to publish post',
            };
        }
    } catch (error) {
        console.error('Failed to publish social post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish post',
        };
    }
}

/**
 * Schedule open house social post for future publication
 */
export async function scheduleOpenHouseSocialPost(
    sessionId: string,
    platform: Platform,
    postContent: FacebookPost | InstagramPost | LinkedInPost | TwitterPost,
    publishTime: Date
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Validate future date
        if (publishTime <= new Date()) {
            return {
                success: false,
                error: 'Publishing time must be in the future',
            };
        }

        // Get OAuth connection to validate it exists
        const oauthManager = getOAuthConnectionManager();
        const connection = await oauthManager.getConnection(user.id, platform);

        if (!connection) {
            return {
                success: false,
                error: `No ${platform} connection found. Please connect your account.`,
            };
        }

        // Extract content from post
        const content = extractPostContent(platform, postContent);
        const title = `Open House - ${platform} Post`;

        // Create scheduled content
        const scheduleId = randomUUID();
        const now = new Date();

        const scheduledContent: ScheduledContent = {
            id: scheduleId,
            userId: user.id,
            contentId: sessionId,
            title,
            content,
            contentType: ContentCategory.SOCIAL_MEDIA,
            publishTime,
            channels: [{
                type: mapPlatformToChannelType(platform),
                accountId: connection.platformUserId,
                accountName: connection.platformUsername,
                isActive: true,
                connectionStatus: 'connected' as const,
            }],
            status: ScheduledContentStatus.SCHEDULED,
            metadata: {
                generatedAt: now,
                tags: ['open-house', platform, sessionId],
            },
            retryCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        const keys = getScheduledContentKeys(
            user.id,
            scheduleId,
            ScheduledContentStatus.SCHEDULED,
            publishTime.toISOString()
        );

        await repository.create(
            keys.PK,
            keys.SK,
            'ScheduledContent',
            scheduledContent,
            {
                GSI2PK: `SCHEDULE#${ScheduledContentStatus.SCHEDULED}`,
                GSI2SK: `TIME#${publishTime.toISOString()}`,
            }
        );

        return {
            success: true,
            scheduleId,
            publishTime: publishTime.toISOString(),
        };
    } catch (error) {
        console.error('Failed to schedule social post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to schedule post',
        };
    }
}

/**
 * Get publishing status for a scheduled post
 */
export async function getPublishingStatus(scheduleId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const repository = getRepository();
        const keys = getScheduledContentKeys(user.id, scheduleId);

        const item = await repository.getItem<ScheduledContent>(keys.PK, keys.SK);

        if (!item) {
            return {
                success: false,
                error: 'Scheduled post not found',
            };
        }

        const scheduledContent = item.Data;

        return {
            success: true,
            status: scheduledContent.status,
            publishTime: scheduledContent.publishTime,
            publishResults: scheduledContent.publishResults,
        };
    } catch (error) {
        console.error('Failed to get publishing status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get status',
        };
    }
}

/**
 * Cancel a scheduled post
 */
export async function cancelScheduledPost(scheduleId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const repository = getRepository();
        const keys = getScheduledContentKeys(user.id, scheduleId);

        // Update status to cancelled
        await repository.update(keys.PK, keys.SK, {
            status: ScheduledContentStatus.CANCELLED,
            updatedAt: new Date(),
            GSI2PK: `SCHEDULE#${ScheduledContentStatus.CANCELLED}`,
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error('Failed to cancel scheduled post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel post',
        };
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert platform-specific post content to SocialPost format
 */
function convertToSocialPost(
    sessionId: string,
    platform: Platform,
    postContent: FacebookPost | InstagramPost | LinkedInPost | TwitterPost
): SocialPost {
    let content = '';
    let hashtags: string[] = [];

    switch (platform) {
        case 'facebook':
            content = (postContent as FacebookPost).post;
            hashtags = (postContent as FacebookPost).hashtags || [];
            break;
        case 'instagram':
            content = (postContent as InstagramPost).caption;
            hashtags = (postContent as InstagramPost).hashtags || [];
            break;
        case 'linkedin':
            content = (postContent as LinkedInPost).post;
            hashtags = (postContent as LinkedInPost).hashtags || [];
            break;
        case 'twitter':
            content = (postContent as TwitterPost).tweet;
            hashtags = (postContent as TwitterPost).hashtags || [];
            break;
    }

    return {
        listingId: sessionId,
        content,
        images: [], // Images would be added from session photos
        hashtags,
        platform,
    };
}

/**
 * Extract text content from platform-specific post
 */
function extractPostContent(
    platform: Platform,
    postContent: FacebookPost | InstagramPost | LinkedInPost | TwitterPost
): string {
    switch (platform) {
        case 'facebook':
            return (postContent as FacebookPost).post;
        case 'instagram':
            return (postContent as InstagramPost).caption;
        case 'linkedin':
            return (postContent as LinkedInPost).post;
        case 'twitter':
            return (postContent as TwitterPost).tweet;
        default:
            return '';
    }
}

/**
 * Map Platform to PublishChannelType
 */
function mapPlatformToChannelType(platform: Platform): PublishChannelType {
    const mapping: Record<Platform, PublishChannelType> = {
        facebook: PublishChannelType.FACEBOOK,
        instagram: PublishChannelType.INSTAGRAM,
        linkedin: PublishChannelType.LINKEDIN,
        twitter: PublishChannelType.TWITTER,
        followupboss: PublishChannelType.BLOG, // Fallback
        facebook_lead_ads: PublishChannelType.FACEBOOK,
        calendly: PublishChannelType.BLOG, // Fallback
        hubspot: PublishChannelType.BLOG, // Fallback
    };

    return mapping[platform];
}
