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
import { getListingKeys, getSocialPostKeys, getScheduledContentKeys } from '@/aws/dynamodb/keys';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import { createSocialPublisher } from '@/integrations/social/publisher';
import { createContentOptimizer } from '@/integrations/social/content-optimizer';
import { createImageOptimizer } from '@/integrations/social/image-optimizer';
import { Platform, SocialPost, PublishResult } from '@/integrations/social/types';
import { Listing } from '@/integrations/mls/types';
import { schedulingService } from '@/services/scheduling-service';
import {
    ScheduledContent,
    PublishChannel,
    ScheduledContentStatus,
    ContentCategory,
    PublishChannelType
} from '@/lib/content-workflow-types';

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
 * Enhanced with enterprise-grade error handling, retry logic, and circuit breaker pattern
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

        // Initialize services with enhanced error handling
        const contentOptimizer = createContentOptimizer();
        const imageOptimizer = createImageOptimizer();
        const oauthManager = getOAuthConnectionManager();

        // Import enhanced publishing service
        const { createEnhancedPublishingService } = await import('@/services/enhanced-publishing-service');
        const enhancedPublisher = createEnhancedPublishingService();

        // Publishing queue - process platforms sequentially with enhanced error handling
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

                // Use enhanced publishing with comprehensive error handling
                const result = await enhancedPublisher.publishToPlatform(post, platform, connection, user.id);

                // Update status based on enhanced result
                if (result.success) {
                    status.status = 'success';
                    status.postId = result.postId;
                    status.postUrl = result.postUrl;
                    status.attempts = result.attempts;
                    status.duration = result.totalDuration;
                } else {
                    if (result.circuitBreakerTriggered) {
                        status.status = 'circuit_breaker_open';
                    } else {
                        status.status = 'failed';
                    }
                    status.error = result.errorDetails?.userMessage || result.error || 'Unknown error';
                    status.attempts = result.attempts;
                    status.duration = result.totalDuration;
                    status.recoveryActions = result.errorDetails?.recoveryActions;
                }
            } catch (error) {
                status.status = 'failed';
                status.error = error instanceof Error ? error.message : 'Unknown error';
                status.attempts = 1;

                // Enhanced error logging
                const { logger } = await import('@/aws/logging/logger');
                logger.error(`Failed to publish to ${platform}`, error as Error, {
                    userId: user.id,
                    listingId: request.listingId,
                    platform,
                    operation: 'publish_listing'
                });
            }
        }

        // Revalidate library page to show updated posts
        revalidatePath('/library/listings');

        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        const circuitBreakerCount = results.filter(r => r.status === 'circuit_breaker_open').length;

        let message = `Published to ${successCount} platform(s)`;
        if (failedCount > 0) {
            message += `, ${failedCount} failed`;
        }
        if (circuitBreakerCount > 0) {
            message += `, ${circuitBreakerCount} temporarily unavailable`;
        }

        return {
            success: successCount > 0,
            message,
            results,
        };
    } catch (error) {
        // Enhanced error logging for critical failures
        const { logger } = await import('@/aws/logging/logger');
        logger.error('Critical failure in publishListing', error as Error, {
            listingId: request.listingId,
            platforms: request.platforms,
            timestamp: new Date().toISOString(),
            operation: 'publish_listing'
        });

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

// ==================== Scheduled Publishing Functions ====================

/**
 * Publish scheduled content when the scheduled time arrives
 * This function is called by the background Lambda job
 * 
 * Enhanced with enterprise-grade error handling, retry logic, and circuit breaker pattern
 * 
 * Requirement 1.5: Automatically publish content at scheduled time
 */
export async function publishScheduledContent(
    scheduledContentId: string
): Promise<{ success: boolean; message: string; results?: PublishingStatus[]; statusUpdate?: any }> {
    try {
        // Get the scheduled content from the scheduling service
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Get scheduled content details
        const repository = getRepository();
        const keys = getScheduledContentKeys(user.id, scheduledContentId);
        const scheduledItem = await repository.getItem<ScheduledContent>(keys.PK, keys.SK);

        if (!scheduledItem) {
            return { success: false, message: 'Scheduled content not found' };
        }

        const scheduledContent = scheduledItem.Data;

        // Check if it's time to publish
        const now = new Date();
        if (scheduledContent.publishTime > now) {
            return {
                success: false,
                message: `Content not ready for publishing. Scheduled for ${scheduledContent.publishTime.toISOString()}`
            };
        }

        // Use enhanced publishing service with comprehensive error handling
        const { createEnhancedPublishingService } = await import('@/services/enhanced-publishing-service');
        const enhancedPublisher = createEnhancedPublishingService();

        const result = await enhancedPublisher.publishScheduledContent(scheduledContent, user.id);

        return {
            success: result.success,
            message: result.message,
            results: result.results,
            statusUpdate: result.statusUpdate
        };

    } catch (error) {
        // Enhanced error logging with structured context
        const { logger } = await import('@/aws/logging/logger');
        logger.error('Critical failure in publishScheduledContent', error as Error, {
            scheduledContentId,
            timestamp: new Date().toISOString(),
            operation: 'publish_scheduled_content'
        });

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to publish scheduled content',
        };
    }
}

/**
 * Publish content to blog with SEO optimization
 * 
 * Requirement: Add blog publishing capability with SEO optimization
 */
async function publishToBlog(
    scheduledContent: ScheduledContent
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
    try {
        // For now, this is a placeholder implementation
        // In a real implementation, this would integrate with a blog platform
        // like WordPress, Ghost, or a custom blog system

        // Generate SEO-optimized content
        const seoOptimizedContent = await optimizeContentForSEO(
            scheduledContent.content,
            scheduledContent.title,
            scheduledContent.contentType
        );

        // Simulate blog publishing
        // In reality, this would make API calls to the blog platform
        console.log('Publishing to blog:', {
            title: scheduledContent.title,
            content: seoOptimizedContent.content,
            metaDescription: seoOptimizedContent.metaDescription,
            keywords: seoOptimizedContent.keywords,
            slug: seoOptimizedContent.slug,
        });

        // Return success with mock URL
        return {
            success: true,
            postUrl: `https://blog.example.com/posts/${seoOptimizedContent.slug}`,
        };
    } catch (error) {
        console.error('Failed to publish to blog:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish to blog',
        };
    }
}

/**
 * Publish content to newsletter
 * 
 * Requirement: Add newsletter publishing capability
 */
async function publishToNewsletter(
    scheduledContent: ScheduledContent
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
    try {
        // For now, this is a placeholder implementation
        // In a real implementation, this would integrate with email service providers
        // like Mailchimp, Constant Contact, or SendGrid

        // Generate email-safe HTML content
        const emailContent = await formatContentForEmail(
            scheduledContent.content,
            scheduledContent.title
        );

        // Simulate newsletter publishing
        console.log('Publishing to newsletter:', {
            subject: scheduledContent.title,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
        });

        // Return success with mock URL
        return {
            success: true,
            postUrl: `https://newsletter.example.com/campaigns/${Date.now()}`,
        };
    } catch (error) {
        console.error('Failed to publish to newsletter:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish to newsletter',
        };
    }
}

/**
 * Optimize content for SEO
 */
async function optimizeContentForSEO(
    content: string,
    title: string,
    contentType: ContentCategory
): Promise<{
    content: string;
    metaDescription: string;
    keywords: string[];
    slug: string;
}> {
    // Generate SEO-friendly slug
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Extract keywords from content
    const keywords = extractKeywords(content, contentType);

    // Generate meta description
    const metaDescription = content
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .slice(0, 25)
        .join(' ') + '...';

    // Add SEO enhancements to content
    const seoContent = addSEOStructure(content, title, keywords);

    return {
        content: seoContent,
        metaDescription,
        keywords,
        slug,
    };
}

/**
 * Extract relevant keywords from content
 */
function extractKeywords(content: string, contentType: ContentCategory): string[] {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Get top keywords
    const topKeywords = Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);

    // Add content-type specific keywords
    const typeKeywords: Record<ContentCategory, string[]> = {
        [ContentCategory.BLOG_POST]: ['real estate', 'property', 'home', 'market'],
        [ContentCategory.SOCIAL_MEDIA]: ['realtor', 'agent', 'listing'],
        [ContentCategory.LISTING_DESCRIPTION]: ['home', 'property', 'house', 'listing'],
        [ContentCategory.MARKET_UPDATE]: ['market', 'trends', 'prices', 'analysis'],
        [ContentCategory.NEIGHBORHOOD_GUIDE]: ['neighborhood', 'community', 'area', 'local'],
        [ContentCategory.VIDEO_SCRIPT]: ['video', 'tour', 'walkthrough'],
        [ContentCategory.NEWSLETTER]: ['newsletter', 'update', 'news'],
        [ContentCategory.EMAIL_TEMPLATE]: ['email', 'template', 'communication'],
    };

    return [...topKeywords, ...(typeKeywords[contentType] || [])].slice(0, 8);
}

/**
 * Add SEO structure to content
 */
function addSEOStructure(content: string, title: string, keywords: string[]): string {
    // Add structured data and SEO elements
    let seoContent = content;

    // Add title if not present
    if (!seoContent.includes(title)) {
        seoContent = `# ${title}\n\n${seoContent}`;
    }

    // Add keyword-rich introduction if content is long enough
    if (seoContent.length > 500) {
        const keywordPhrase = keywords.slice(0, 3).join(', ');
        const intro = `This comprehensive guide covers ${keywordPhrase} and provides valuable insights for real estate professionals and homeowners alike.\n\n`;

        // Insert after title
        const lines = seoContent.split('\n');
        if (lines[0].startsWith('#')) {
            lines.splice(2, 0, intro);
            seoContent = lines.join('\n');
        }
    }

    return seoContent;
}

/**
 * Format content for email with HTML and text versions
 */
async function formatContentForEmail(
    content: string,
    title: string
): Promise<{ html: string; text: string }> {
    // Convert markdown-like content to HTML
    let html = content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = `<p>${html}</p>`;

    // Add email-safe styling
    html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${title}</h1>
            ${html}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>This email was sent from your Bayon Coagent platform.</p>
            </div>
        </div>
    `;

    // Generate plain text version
    const text = content
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/<[^>]*>/g, '')
        .trim();

    return { html, text };
}

/**
 * Generate hashtags for scheduled content based on content type
 */
async function generateHashtagsForScheduledContent(
    content: string,
    contentType: ContentCategory,
    platform: Platform
): Promise<string[]> {
    const maxHashtags = platform === 'instagram' ? 30 : 15;
    const hashtags: string[] = [];

    // Content type specific hashtags
    const typeHashtags: Record<ContentCategory, string[]> = {
        [ContentCategory.BLOG_POST]: ['#realestateblog', '#propertyinsights', '#marketupdate', '#realestatenews'],
        [ContentCategory.SOCIAL_MEDIA]: ['#realestate', '#realtor', '#property', '#homes'],
        [ContentCategory.LISTING_DESCRIPTION]: ['#forsale', '#dreamhome', '#newhome', '#househunting'],
        [ContentCategory.MARKET_UPDATE]: ['#marketupdate', '#realestatemarkets', '#propertytrends', '#marketanalysis'],
        [ContentCategory.NEIGHBORHOOD_GUIDE]: ['#neighborhood', '#community', '#localarea', '#livingin'],
        [ContentCategory.VIDEO_SCRIPT]: ['#realestatevideo', '#propertytour', '#virtualtour', '#homevideo'],
        [ContentCategory.NEWSLETTER]: ['#newsletter', '#realestateupdates', '#propertyupdates', '#marketinsights'],
        [ContentCategory.EMAIL_TEMPLATE]: ['#realestateemail', '#propertymarketing', '#clientcommunication'],
    };

    // Add content type hashtags
    hashtags.push(...(typeHashtags[contentType] || []));

    // Add general real estate hashtags
    const generalHashtags = [
        '#realestate',
        '#realtor',
        '#property',
        '#homes',
        '#realtorlife',
        '#realestateagent',
        '#homebuyers',
        '#realestateinvestor',
        '#luxuryhomes',
        '#dreamhome'
    ];

    hashtags.push(...generalHashtags);

    // Extract keywords from content for additional hashtags
    const contentKeywords = extractKeywordsFromContent(content);
    contentKeywords.forEach(keyword => {
        if (keyword.length > 2) {
            hashtags.push(`#${keyword.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`);
        }
    });

    // Remove duplicates and limit
    const uniqueHashtags = Array.from(new Set(hashtags));
    return uniqueHashtags.slice(0, maxHashtags);
}

/**
 * Extract keywords from content for hashtag generation
 */
function extractKeywordsFromContent(content: string): string[] {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top 5 keywords
    return Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

// ==================== Enhanced Error Handling and Monitoring ====================

/**
 * Get circuit breaker status for all platforms
 * Used for monitoring and admin dashboard
 */
export async function getCircuitBreakerStatus(): Promise<{
    success: boolean;
    message: string;
    status?: Record<string, any>;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        const { createEnhancedPublishingService } = await import('@/services/enhanced-publishing-service');
        const enhancedPublisher = createEnhancedPublishingService();

        const status = enhancedPublisher.getCircuitBreakerStatus();

        return {
            success: true,
            message: 'Circuit breaker status retrieved',
            status
        };
    } catch (error) {
        const { logger } = await import('@/aws/logging/logger');
        logger.error('Failed to get circuit breaker status', error as Error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get circuit breaker status'
        };
    }
}

/**
 * Reset circuit breaker for a platform (admin function)
 */
export async function resetCircuitBreaker(
    platform: Platform
): Promise<{ success: boolean; message: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }

        // TODO: Add admin permission check
        // const isAdmin = await checkAdminPermissions(user.id);
        // if (!isAdmin) {
        //     return { success: false, message: 'Admin permissions required' };
        // }

        const { createEnhancedPublishingService } = await import('@/services/enhanced-publishing-service');
        const enhancedPublisher = createEnhancedPublishingService();

        enhancedPublisher.resetCircuitBreaker(platform);

        const { logger } = await import('@/aws/logging/logger');
        logger.info(`Circuit breaker reset for ${platform}`, {
            userId: user.id,
            platform,
            operation: 'reset_circuit_breaker'
        });

        return {
            success: true,
            message: `Circuit breaker reset for ${platform}`
        };
    } catch (error) {
        const { logger } = await import('@/aws/logging/logger');
        logger.error(`Failed to reset circuit breaker for ${platform}`, error as Error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to reset circuit breaker'
        };
    }
}

/**
 * Publish content to a specific channel (used by Lambda for direct publishing)
 * 
 * This is a simplified version for Lambda to use directly without needing
 * the full listing context.
 */
export async function publishContentToChannel(params: {
    userId: string;
    content: string;
    mediaUrls?: string[];
    channel: PublishChannel;
    metadata?: Record<string, any>;
}): Promise<{
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
}> {
    try {
        const { userId, content, mediaUrls, channel, metadata } = params;

        // Get OAuth connection for the channel
        const oauthManager = getOAuthConnectionManager();
        const connection = await oauthManager.getConnection(userId, channel.type as Platform);

        if (!connection) {
            return {
                success: false,
                error: `No ${channel.type} connection found for user`,
            };
        }

        // Import enhanced publishing service
        const { createEnhancedPublishingService } = await import('@/services/enhanced-publishing-service');
        const enhancedPublisher = createEnhancedPublishingService();

        // Create a simplified post object
        const post: SocialPost = {
            listingId: metadata?.contentId || 'scheduled-content',
            content,
            images: mediaUrls || [],
            hashtags: metadata?.hashtags || [],
            platform: channel.type as Platform,
        };

        // Publish using enhanced service
        const result = await enhancedPublisher.publishToPlatform(
            post,
            channel.type as Platform,
            connection,
            userId
        );

        return {
            success: result.success,
            postId: result.postId,
            postUrl: result.postUrl,
            error: result.error,
        };

    } catch (error) {
        const { logger } = await import('@/aws/logging/logger');
        logger.error('Failed to publish content to channel', error as Error, {
            userId: params.userId,
            channelType: params.channel.type,
            operation: 'publish_content_to_channel'
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish to channel',
        };
    }
}
