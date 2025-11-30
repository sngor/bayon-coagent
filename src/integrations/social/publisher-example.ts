/**
 * Social Media Publisher - Example Usage
 * 
 * Demonstrates how to use the Social Media Publisher Service
 * to publish listing content to Facebook, Instagram, and LinkedIn.
 */

import { createSocialPublisher } from './publisher';
import { getOAuthConnectionManager } from '../oauth/connection-manager';
import { createContentOptimizer } from './content-optimizer';
import { Platform, SocialPost, PublishResult } from './types';
import { Listing } from '../mls/types';

/**
 * Example 1: Publish a listing to a single platform
 */
async function publishToSinglePlatform(
    userId: string,
    listing: Listing,
    platform: Platform
): Promise<PublishResult> {
    const publisher = createSocialPublisher();
    const connectionManager = getOAuthConnectionManager();
    const contentOptimizer = createContentOptimizer();

    // Get OAuth connection for the platform
    const connection = await connectionManager.getConnection(userId, platform);

    if (!connection) {
        throw new Error(`Not connected to ${platform}. Please connect in settings.`);
    }

    // Format content for the platform
    const formattedContent = await contentOptimizer.formatForPlatform(listing, platform);
    const hashtags = await contentOptimizer.generateHashtags(listing, platform);

    // Prepare post
    const post: SocialPost = {
        listingId: listing.mlsId,
        content: formattedContent.text,
        images: listing.photos.map(photo => photo.url),
        hashtags,
        platform,
    };

    // Publish based on platform
    let result: PublishResult = {
        success: false,
        error: 'Unsupported platform'
    };

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

    if (result.success) {
        console.log(`✅ Published to ${platform}:`, result.postUrl);
    } else {
        console.error(`❌ Failed to publish to ${platform}:`, result.error);
    }

    return result;
}

/**
 * Example 2: Publish a listing to multiple platforms
 */
async function publishToMultiplePlatforms(
    userId: string,
    listing: Listing,
    platforms: Platform[]
): Promise<Record<Platform, PublishResult>> {
    const publisher = createSocialPublisher();
    const connectionManager = getOAuthConnectionManager();
    const contentOptimizer = createContentOptimizer();

    const results: Record<string, PublishResult> = {};

    for (const platform of platforms) {
        try {
            // Get connection
            const connection = await connectionManager.getConnection(userId, platform);

            if (!connection) {
                console.warn(`⚠️  Not connected to ${platform}, skipping...`);
                results[platform] = {
                    success: false,
                    error: `Not connected to ${platform}`,
                };
                continue;
            }

            // Format content for this platform
            const formattedContent = await contentOptimizer.formatForPlatform(listing, platform);
            const hashtags = await contentOptimizer.generateHashtags(listing, platform);

            // Prepare post
            const post: SocialPost = {
                listingId: listing.mlsId,
                content: formattedContent.text,
                images: listing.photos.map(photo => photo.url),
                hashtags,
                platform,
            };

            // Publish
            let result: PublishResult = {
                success: false,
                error: 'Unsupported platform'
            };

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

            results[platform] = result;

            if (result.success) {
                console.log(`✅ Published to ${platform}:`, result.postUrl);
            } else {
                console.error(`❌ Failed to publish to ${platform}:`, result.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Error publishing to ${platform}:`, errorMessage);
            results[platform] = {
                success: false,
                error: errorMessage,
            };
        }
    }

    return results as Record<Platform, PublishResult>;
}

/**
 * Example 3: Publish with retry logic
 */
async function publishWithRetry(
    userId: string,
    listing: Listing,
    platform: Platform,
    maxRetries: number = 3
): Promise<PublishResult> {
    const publisher = createSocialPublisher();
    const connectionManager = getOAuthConnectionManager();
    const contentOptimizer = createContentOptimizer();

    let lastError: string = '';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Get connection
            const connection = await connectionManager.getConnection(userId, platform);

            if (!connection) {
                throw new Error(`Not connected to ${platform}`);
            }

            // Format content
            const formattedContent = await contentOptimizer.formatForPlatform(listing, platform);
            const hashtags = await contentOptimizer.generateHashtags(listing, platform);

            // Prepare post
            const post: SocialPost = {
                listingId: listing.mlsId,
                content: formattedContent.text,
                images: listing.photos.map(photo => photo.url),
                hashtags,
                platform,
            };

            // Publish
            let result: PublishResult = {
                success: false,
                error: 'Unsupported platform'
            };

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

            if (result.success) {
                console.log(`✅ Published to ${platform} on attempt ${attempt + 1}`);
                return result;
            }

            lastError = result.error || 'Unknown error';

            // Check if we should retry
            if (lastError.includes('rate limit') || lastError.includes('timeout')) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Non-retryable error
            break;
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Attempt ${attempt + 1} failed:`, lastError);

            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return {
        success: false,
        error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
}

/**
 * Example 4: Unpublish posts when listing is sold
 */
async function unpublishListingPosts(
    userId: string,
    listingId: string
): Promise<void> {
    const publisher = createSocialPublisher();
    const connectionManager = getOAuthConnectionManager();

    // Get all posts for this listing from DynamoDB
    // (This would be implemented in a separate service)
    const posts = await getPostsForListing(userId, listingId);

    console.log(`Found ${posts.length} posts to unpublish`);

    for (const post of posts) {
        if (post.status !== 'published') {
            console.log(`⏭️  Skipping ${post.platform} post (status: ${post.status})`);
            continue;
        }

        try {
            const connection = await connectionManager.getConnection(userId, post.platform);

            if (!connection) {
                console.warn(`⚠️  Not connected to ${post.platform}, cannot unpublish`);
                continue;
            }

            await publisher.unpublishPost(
                post.platform,
                post.platformPostId,
                connection
            );

            console.log(`✅ Unpublished ${post.platform} post: ${post.platformPostUrl}`);

            // Update post status in database
            await updatePostStatus(userId, post.postId, 'unpublished');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Failed to unpublish ${post.platform} post:`, errorMessage);
        }
    }
}

/**
 * Example 5: Publish with custom content
 */
async function publishCustomContent(
    userId: string,
    listingId: string,
    customContent: string,
    platforms: Platform[]
): Promise<Record<Platform, PublishResult>> {
    const publisher = createSocialPublisher();
    const connectionManager = getOAuthConnectionManager();
    const contentOptimizer = createContentOptimizer();

    const results: Record<string, PublishResult> = {};

    for (const platform of platforms) {
        try {
            const connection = await connectionManager.getConnection(userId, platform);

            if (!connection) {
                results[platform] = {
                    success: false,
                    error: `Not connected to ${platform}`,
                };
                continue;
            }

            // Use custom content but still generate hashtags
            const listing = await getListingById(listingId);
            const hashtags = await contentOptimizer.generateHashtags(listing, platform);

            const post: SocialPost = {
                listingId,
                content: customContent,
                images: listing.photos.map(photo => photo.url),
                hashtags,
                platform,
            };

            let result: PublishResult = {
                success: false,
                error: 'Unsupported platform'
            };

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

            results[platform] = result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results[platform] = {
                success: false,
                error: errorMessage,
            };
        }
    }

    return results as Record<Platform, PublishResult>;
}

/**
 * Helper functions (would be implemented elsewhere)
 */

async function getPostsForListing(userId: string, listingId: string): Promise<any[]> {
    // Query DynamoDB using GSI1 (LISTING#{listingId})
    // This would be implemented in a repository service
    return [];
}

async function updatePostStatus(
    userId: string,
    postId: string,
    status: 'published' | 'failed' | 'unpublished'
): Promise<void> {
    // Update post status in DynamoDB
    // This would be implemented in a repository service
}

async function getListingById(listingId: string): Promise<Listing> {
    // Get listing from DynamoDB
    // This would be implemented in a repository service
    throw new Error('Not implemented');
}

/**
 * Example usage in a server action
 */
export async function exampleServerAction(
    userId: string,
    listingId: string,
    platforms: Platform[]
) {
    try {
        // Get listing
        const listing = await getListingById(listingId);

        // Publish to selected platforms
        const results = await publishToMultiplePlatforms(userId, listing, platforms);

        // Count successes and failures
        const successes = Object.values(results).filter(r => r.success).length;
        const failures = Object.values(results).filter(r => !r.success).length;

        return {
            success: successes > 0,
            message: `Published to ${successes} platform(s). ${failures} failed.`,
            results,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            message: `Failed to publish: ${errorMessage}`,
            results: {},
        };
    }
}
