'use server';

/**
 * Social Publishing Server Actions
 * 
 * Handles publishing listings to social media platforms.
 * Implements publishing queue, retry logic, and status tracking.
 * 
 * Requirements:
 * - 7.1: Display platform selection options with preview
 * - 7.3: Create posts for all selected platforms
 * - 9.5: Allow users to edit hashtags before publishing
 */

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { getRepository } from '@/aws/dynamodb/repository';
import { getListingKeys, getSocialPostKeys } from '@/aws/dynamodb/keys';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import { createSocialPublisher } from '@/integrations/social/publisher';
import { createContentOptimizer } from '@/integrations/social/content-optimizer';
import { createImageOptimizer } from '@/integrations/social/image-optimizer';
import { Platform, SocialPost, PublishResult } from '@/integrations/social/types';
import { Listing } from '@/integrations/mls/types';

/**
 * Publishing request from UI
 */
export interface PublishingRequest {
    listingId: string;
    platforms: Platform[];
    customContent?: string;
    customHashtags?: string[];
}

/**
 * Publishing status for real-time updates
 */
export interface PublishingStatus {
    platform: Platform;
    status: 'pending' | 'publishing' | 'success' | 'failed';
    postId?: string;
    postUrl?: string;
    error?: string;
}

/**
 * Publishing result
 */
export interface PublishingResponse {
    success: boolean;
    message: string;
    results: PublishingStatus[];
}

/**
 * Preview data for platform selection
 */
export interface PublishingPreview {
    platform: Platform;
    content: string;
    hashtags: string[];
    imageCount: number;
    characterCount: number;
    truncated: boolean;
}

/**
 * Get publishing preview for a listing
 * Shows how content will look on each platform
 * 
 * Requirement 7.1: Display platform selection options with preview
 */
export async function getPublishingPreview(
    listingId: string,
    platforms: Platform[]
): Promise<{ success: boolean; message: string; previews?: PublishingPreview[] }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Get listing from database
        const repository = getRepository();
        const keys = getListingKeys(user.id, listingId);
        const listingItem = await repository.getItem<Listing>(keys.PK, keys.SK);

        if (!listingItem) {
            return { success: false, message: 'Listing not found' };
        }

        const listing = {
            ...listingItem.Data,
            listingId,
        };

        // Generate previews for each platform
        const contentOptimizer = createContentOptimizer();
        const previews: PublishingPreview[] = [];

        for (const platform of platforms) {
            // Format content for platform
            const formattedContent = await contentOptimizer.formatForPlatform(
                listing,
                platform
            );

            // Generate hashtags
            const hashtags = await contentOptimizer.generateHashtags(
                listing,
                platform
            );

            // Count images (limited by platform)
            const imageCount = Math.min(
                listing.photos?.length || 0,
                platform === 'facebook' ? 10 : platform === 'instagram' ? 10 : 9
            );

            previews.push({
                platform,
                content: formattedContent.text,
                hashtags,
                imageCount,
                characterCount: formattedContent.characterCount,
                truncated: formattedContent.truncated,
            });
        }

        return {
            success: true,
            message: 'Preview generated successfully',
            previews,
        };
    } catch (error) {
        console.error('Failed to generate publishing preview:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate preview',
        };
    }
}

/**
 * Publish listing to social media platforms
 * Implements publishing queue and handles multiple platforms
 * 
 * Requirement 7.3: Create posts for all selected platforms
 * Requirement 9.5: Allow users to edit hashtags
 */
export async function publishListing(
    request: PublishingRequest
): Promise<PublishingResponse> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Not authenticated',
                results: [],
            };
        }

        // Get listing from database
        const repository = getRepository();
        const keys = getListingKeys(user.id, request.listingId);
        const listingItem = await repository.getItem<Listing>(keys.PK, keys.SK);

        if (!listingItem) {
            return {
                success: false,
                message: 'Listing not found',
                results: [],
            };
        }

        const listing = {
            ...listingItem.Data,
            listingId: request.listingId,
        };

        // Initialize services
        const contentOptimizer = createContentOptimizer();
        const imageOptimizer = createImageOptimizer();
        const publisher = createSocialPublisher();
        const oauthManager = getOAuthConnectionManager();

        // Publishing queue - process platforms sequentially to avoid rate limits
        const results: PublishingStatus[] = [];

        for (const platform of request.platforms) {
            const status: PublishingStatus = {
                platform,
                status: 'pending',
            };
            results.push(status);

            try {
                // Update status to publishing
                status.status = 'publishing';

                // Get OAuth connection for platform
                const connection = await oauthManager.getConnection(
                    user.id,
                    platform
                );

                if (!connection) {
                    throw new Error(`No ${platform} connection found. Please connect your account in settings.`);
                }

                // Format content for platform
                const formattedContent = await contentOptimizer.formatForPlatform(
                    listing,
                    platform
                );

                // Generate or use custom hashtags
                const hashtags = request.customHashtags || await contentOptimizer.generateHashtags(
                    listing,
                    platform
                );

                // Optimize images for platform
                const imageUrls = listing.photos?.map(p => p.url) || [];
                const optimizedImages = await imageOptimizer.optimizeImages(
                    imageUrls,
                    platform,
                    request.listingId,
                    user.id
                );

                // Create social post
                const post: SocialPost = {
                    listingId: request.listingId,
                    content: request.customContent || formattedContent.text,
                    images: optimizedImages.map(img => img.optimizedUrl),
                    hashtags,
                    platform,
                };

                // Publish to platform
                let result: PublishResult;
                switch (platform) {
                    case 'facebook':
                        result = await publisher.publishToFacebook(post, connection);
                        break;
                    case 'instagram':
                        result = await publisher.publishToInstagram(post, connection);
                        break;
                    case 'linkedin':
                        result = await publisher.publishToLinkedIn(post, connection);
                        break;
                }

                // Update status based on result
                if (result.success) {
                    status.status = 'success';
                    status.postId = result.postId;
                    status.postUrl = result.postUrl;
                } else {
                    status.status = 'failed';
                    status.error = result.error;
                }
            } catch (error) {
                status.status = 'failed';
                status.error = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to publish to ${platform}:`, error);
            }
        }

        // Revalidate library page to show updated posts
        revalidatePath('/library/listings');

        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;

        return {
            success: successCount > 0,
            message: `Published to ${successCount} platform(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
            results,
        };
    } catch (error) {
        console.error('Failed to publish listing:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to publish listing',
            results: [],
        };
    }
}

/**
 * Retry failed post
 * Allows user to retry publishing to a specific platform
 * 
 * Requirement 7.5: Allow retry for failed posts
 */
export async function retryPublish(
    listingId: string,
    platform: Platform
): Promise<{ success: boolean; message: string; result?: PublishingStatus }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Publish to single platform
        const response = await publishListing({
            listingId,
            platforms: [platform],
        });

        const result = response.results[0];

        return {
            success: result.status === 'success',
            message: result.status === 'success'
                ? `Successfully published to ${platform}`
                : `Failed to publish to ${platform}: ${result.error}`,
            result,
        };
    } catch (error) {
        console.error('Failed to retry publish:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retry publish',
        };
    }
}

/**
 * Get published posts for a listing
 * Shows all posts associated with a listing across platforms
 */
export async function getListingPosts(
    listingId: string
): Promise<{ success: boolean; message: string; posts?: any[] }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        const repository = getRepository();

        // Query posts by listing ID using GSI
        const result = await repository.querySocialPostsByListing<any>(listingId);

        return {
            success: true,
            message: 'Posts retrieved successfully',
            posts: result.items,
        };
    } catch (error) {
        console.error('Failed to get listing posts:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get posts',
        };
    }
}

/**
 * Get all listings for the current user
 * Used in listing selection interface
 */
export async function getUserListings(): Promise<{
    success: boolean;
    message: string;
    listings?: Listing[];
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        const repository = getRepository();

        // Query all listings for user
        const result = await repository.query<Listing>(
            `USER#${user.id}`,
            'LISTING#'
        );

        // Extract listingId from SK and add to listing data
        const listings = result.items.map((item: any) => {
            const listingId = item.SK ? item.SK.replace('LISTING#', '') : 'unknown';
            return {
                ...item.Data,
                listingId,
            };
        });

        return {
            success: true,
            message: 'Listings retrieved successfully',
            listings,
        };
    } catch (error) {
        console.error('Failed to get user listings:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get listings',
        };
    }
}

/**
 * Check platform connections
 * Returns which platforms are connected and ready for publishing
 */
export async function checkPlatformConnections(): Promise<{
    success: boolean;
    message: string;
    connections?: Record<Platform, boolean>;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        const oauthManager = getOAuthConnectionManager();
        const platforms: Platform[] = ['facebook', 'instagram', 'linkedin'];

        const connections: Record<Platform, boolean> = {
            facebook: false,
            instagram: false,
            linkedin: false,
        };

        for (const platform of platforms) {
            const connection = await oauthManager.getConnection(
                user.id,
                platform
            );
            connections[platform] = connection !== null;
        }

        return {
            success: true,
            message: 'Platform connections checked',
            connections,
        };
    } catch (error) {
        console.error('Failed to check platform connections:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to check connections',
        };
    }
}
