/**
 * Social Media Publisher Service
 * 
 * Publishes listing content to Facebook, Instagram, and LinkedIn.
 * Handles platform-specific API calls, error handling, and post metadata storage.
 * 
 * Requirements Coverage:
 * - 7.3: Create posts for all selected platforms
 * - 7.4: Record post ID and timestamp for tracking
 * - 7.5: Log errors, notify user, and allow retry
 */

import { randomUUID } from 'crypto';
import { getRepository } from '@/aws/dynamodb/repository';
import { getSocialPostKeys } from '@/aws/dynamodb/keys';
import {
    Platform,
    SocialPost,
    PublishResult,
    OAuthConnection,
    StoredSocialPost,
} from './types';
import {
    PLATFORM_API_ENDPOINTS,
    SOCIAL_API_TIMEOUT_MS,
} from './constants';
import { StoredSocialPostSchema } from './schemas';

/**
 * Social Publisher Interface
 * Defines the contract for social media publishing
 */
export interface SocialPublisher {
    publishToFacebook(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult>;
    publishToInstagram(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult>;
    publishToLinkedIn(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult>;
    unpublishPost(
        platform: Platform,
        postId: string,
        connection: OAuthConnection
    ): Promise<void>;
}

/**
 * Social Publisher Service Implementation
 */
export class SocialPublisherService implements SocialPublisher {
    /**
     * Publish listing to Facebook
     * Requirement 7.3: Create posts for selected platforms
     * Requirement 7.4: Record post ID and timestamp
     * Requirement 7.5: Error handling and logging
     */
    async publishToFacebook(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult> {
        try {
            // Get Facebook page ID from connection metadata
            const pageId = this.getFacebookPageId(connection);
            if (!pageId) {
                throw new Error('No Facebook page selected. Please select a page in settings.');
            }

            // Get page access token
            const pageAccessToken = await this.getFacebookPageAccessToken(
                connection.accessToken,
                pageId
            );

            // Prepare post content
            const message = this.formatPostContent(post);

            // Publish to Facebook
            const endpoint = `${PLATFORM_API_ENDPOINTS.facebook}/${pageId}/photos`;

            // If we have images, post as photo(s)
            if (post.images && post.images.length > 0) {
                const result = await this.publishFacebookPhotos(
                    endpoint,
                    pageAccessToken,
                    message,
                    post.images
                );

                // Store post metadata
                await this.storePostMetadata(connection.userId, post, 'facebook', result);

                return result;
            } else {
                // Post as text-only status
                const result = await this.publishFacebookStatus(
                    pageId,
                    pageAccessToken,
                    message
                );

                // Store post metadata
                await this.storePostMetadata(connection.userId, post, 'facebook', result);

                return result;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Facebook publish error:', errorMessage, error);

            // Store failed post metadata
            await this.storeFailedPost(connection.userId, post, 'facebook', errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Publish listing to Instagram
     * Requirement 7.3: Create posts for selected platforms
     * Requirement 7.4: Record post ID and timestamp
     * Requirement 7.5: Error handling and logging
     */
    async publishToInstagram(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult> {
        try {
            // Get Instagram business account ID from connection metadata
            const instagramAccountId = this.getInstagramAccountId(connection);
            if (!instagramAccountId) {
                throw new Error('No Instagram business account found. Please connect an Instagram business account.');
            }

            // Instagram requires at least one image
            if (!post.images || post.images.length === 0) {
                throw new Error('Instagram posts require at least one image');
            }

            // Prepare caption
            const caption = this.formatPostContent(post);

            // Publish to Instagram (two-step process: create container, then publish)
            const result = await this.publishInstagramPost(
                instagramAccountId,
                connection.accessToken,
                caption,
                post.images
            );

            // Store post metadata
            await this.storePostMetadata(connection.userId, post, 'instagram', result);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Instagram publish error:', errorMessage, error);

            // Store failed post metadata
            await this.storeFailedPost(connection.userId, post, 'instagram', errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Publish listing to LinkedIn
     * Requirement 7.3: Create posts for selected platforms
     * Requirement 7.4: Record post ID and timestamp
     * Requirement 7.5: Error handling and logging
     */
    async publishToLinkedIn(
        post: SocialPost,
        connection: OAuthConnection
    ): Promise<PublishResult> {
        try {
            // Get LinkedIn user URN
            const userUrn = `urn:li:person:${connection.platformUserId}`;

            // Prepare post content
            const text = this.formatPostContent(post);

            // Publish to LinkedIn
            const result = await this.publishLinkedInPost(
                userUrn,
                connection.accessToken,
                text,
                post.images
            );

            // Store post metadata
            await this.storePostMetadata(connection.userId, post, 'linkedin', result);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('LinkedIn publish error:', errorMessage, error);

            // Store failed post metadata
            await this.storeFailedPost(connection.userId, post, 'linkedin', errorMessage);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Unpublish (delete) a post from a platform
     * Used when listing status changes to sold
     */
    async unpublishPost(
        platform: Platform,
        platformPostId: string,
        connection: OAuthConnection
    ): Promise<void> {
        try {
            switch (platform) {
                case 'facebook':
                    await this.unpublishFacebookPost(platformPostId, connection.accessToken);
                    break;
                case 'instagram':
                    await this.unpublishInstagramPost(platformPostId, connection.accessToken);
                    break;
                case 'linkedin':
                    await this.unpublishLinkedInPost(platformPostId, connection.accessToken);
                    break;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to unpublish ${platform} post:`, errorMessage);
            throw error;
        }
    }

    /**
     * Private helper methods
     */

    /**
     * Format post content with text and hashtags
     */
    private formatPostContent(post: SocialPost): string {
        const parts: string[] = [post.content];

        if (post.hashtags && post.hashtags.length > 0) {
            parts.push('');
            parts.push(post.hashtags.join(' '));
        }

        return parts.join('\n');
    }

    /**
     * Get Facebook page ID from connection metadata
     */
    private getFacebookPageId(connection: OAuthConnection): string | null {
        const pages = connection.metadata?.pages as any[];
        if (!pages || pages.length === 0) {
            return null;
        }

        // Use the first page or a selected page from metadata
        const selectedPageId = connection.metadata?.selectedPageId as string;
        if (selectedPageId) {
            return selectedPageId;
        }

        return pages[0]?.id || null;
    }

    /**
     * Get Facebook page access token
     */
    private async getFacebookPageAccessToken(
        userAccessToken: string,
        pageId: string
    ): Promise<string> {
        const response = await fetch(
            `${PLATFORM_API_ENDPOINTS.facebook}/${pageId}?fields=access_token&access_token=${userAccessToken}`,
            {
                method: 'GET',
                signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get page access token: ${error}`);
        }

        const data = await response.json();
        return data.access_token;
    }

    /**
     * Publish photos to Facebook
     */
    private async publishFacebookPhotos(
        endpoint: string,
        accessToken: string,
        message: string,
        images: string[]
    ): Promise<PublishResult> {
        // For single image
        if (images.length === 1) {
            const formData = new FormData();
            formData.append('url', images[0]);
            formData.append('caption', message);
            formData.append('access_token', accessToken);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Facebook API error: ${error}`);
            }

            const data = await response.json();
            return {
                success: true,
                postId: data.id || data.post_id,
                postUrl: `https://facebook.com/${data.id || data.post_id}`,
            };
        }

        // For multiple images, we need to create an album or use batch upload
        // For simplicity, we'll post the first image with the message
        // In production, implement proper multi-image album creation
        return await this.publishFacebookPhotos(endpoint, accessToken, message, [images[0]]);
    }

    /**
     * Publish text-only status to Facebook
     */
    private async publishFacebookStatus(
        pageId: string,
        accessToken: string,
        message: string
    ): Promise<PublishResult> {
        const endpoint = `${PLATFORM_API_ENDPOINTS.facebook}/${pageId}/feed`;

        const formData = new FormData();
        formData.append('message', message);
        formData.append('access_token', accessToken);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Facebook API error: ${error}`);
        }

        const data = await response.json();
        return {
            success: true,
            postId: data.id,
            postUrl: `https://facebook.com/${data.id}`,
        };
    }

    /**
     * Get Instagram business account ID from connection metadata
     */
    private getInstagramAccountId(connection: OAuthConnection): string | null {
        const businessAccounts = connection.metadata?.businessAccounts as any[];
        if (!businessAccounts || businessAccounts.length === 0) {
            return null;
        }

        // Use the first business account or a selected one
        const selectedAccountId = connection.metadata?.selectedInstagramAccountId as string;
        if (selectedAccountId) {
            return selectedAccountId;
        }

        return businessAccounts[0]?.instagram_business_account?.id || null;
    }

    /**
     * Publish post to Instagram (two-step process)
     */
    private async publishInstagramPost(
        accountId: string,
        accessToken: string,
        caption: string,
        images: string[]
    ): Promise<PublishResult> {
        // Step 1: Create media container
        const containerEndpoint = `${PLATFORM_API_ENDPOINTS.instagram}/${accountId}/media`;

        const containerParams = new URLSearchParams({
            image_url: images[0], // Instagram Graph API supports single image per post
            caption: caption,
            access_token: accessToken,
        });

        const containerResponse = await fetch(`${containerEndpoint}?${containerParams.toString()}`, {
            method: 'POST',
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!containerResponse.ok) {
            const error = await containerResponse.text();
            throw new Error(`Instagram container creation error: ${error}`);
        }

        const containerData = await containerResponse.json();
        const creationId = containerData.id;

        // Step 2: Publish the container
        const publishEndpoint = `${PLATFORM_API_ENDPOINTS.instagram}/${accountId}/media_publish`;

        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: accessToken,
        });

        const publishResponse = await fetch(`${publishEndpoint}?${publishParams.toString()}`, {
            method: 'POST',
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!publishResponse.ok) {
            const error = await publishResponse.text();
            throw new Error(`Instagram publish error: ${error}`);
        }

        const publishData = await publishResponse.json();
        return {
            success: true,
            postId: publishData.id,
            postUrl: `https://instagram.com/p/${publishData.id}`,
        };
    }

    /**
     * Publish post to LinkedIn
     */
    private async publishLinkedInPost(
        userUrn: string,
        accessToken: string,
        text: string,
        images: string[]
    ): Promise<PublishResult> {
        const endpoint = `${PLATFORM_API_ENDPOINTS.linkedin}/ugcPosts`;

        // Build post payload
        const payload: any = {
            author: userUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text,
                    },
                    shareMediaCategory: images.length > 0 ? 'IMAGE' : 'NONE',
                },
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
        };

        // Add media if images are provided
        if (images.length > 0) {
            payload.specificContent['com.linkedin.ugc.ShareContent'].media = images.map((imageUrl) => ({
                status: 'READY',
                originalUrl: imageUrl,
            }));
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`LinkedIn API error: ${error}`);
        }

        const data = await response.json();
        const postId = data.id;

        return {
            success: true,
            postId: postId,
            postUrl: `https://www.linkedin.com/feed/update/${postId}`,
        };
    }

    /**
     * Unpublish Facebook post
     */
    private async unpublishFacebookPost(
        postId: string,
        accessToken: string
    ): Promise<void> {
        const endpoint = `${PLATFORM_API_ENDPOINTS.facebook}/${postId}`;

        const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete Facebook post: ${error}`);
        }
    }

    /**
     * Unpublish Instagram post
     */
    private async unpublishInstagramPost(
        postId: string,
        accessToken: string
    ): Promise<void> {
        const endpoint = `${PLATFORM_API_ENDPOINTS.instagram}/${postId}`;

        const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete Instagram post: ${error}`);
        }
    }

    /**
     * Unpublish LinkedIn post
     */
    private async unpublishLinkedInPost(
        postId: string,
        accessToken: string
    ): Promise<void> {
        const endpoint = `${PLATFORM_API_ENDPOINTS.linkedin}/ugcPosts/${postId}`;

        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            signal: AbortSignal.timeout(SOCIAL_API_TIMEOUT_MS),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete LinkedIn post: ${error}`);
        }
    }

    /**
     * Store successful post metadata in DynamoDB
     * Requirement 7.4: Record post ID and timestamp
     */
    private async storePostMetadata(
        userId: string,
        post: SocialPost,
        platform: Platform,
        result: PublishResult
    ): Promise<void> {
        if (!result.success || !result.postId) {
            return;
        }

        const postId = randomUUID();
        const now = Date.now();

        const storedPost: StoredSocialPost = {
            postId,
            listingId: post.listingId,
            platform,
            platformPostId: result.postId,
            platformPostUrl: result.postUrl || '',
            content: post.content,
            images: post.images,
            hashtags: post.hashtags,
            status: 'published',
            publishedAt: now,
            createdAt: now,
        };

        // Validate data
        StoredSocialPostSchema.parse(storedPost);

        // Store in DynamoDB
        const repository = getRepository();
        const keys = getSocialPostKeys(userId, postId, post.listingId);

        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            EntityType: 'SocialPost' as const,
            Data: storedPost,
            CreatedAt: now,
            UpdatedAt: now,
        });
    }

    /**
     * Store failed post metadata in DynamoDB
     * Requirement 7.5: Log errors for failed posts
     */
    private async storeFailedPost(
        userId: string,
        post: SocialPost,
        platform: Platform,
        error: string
    ): Promise<void> {
        const postId = randomUUID();
        const now = Date.now();

        const storedPost: StoredSocialPost = {
            postId,
            listingId: post.listingId,
            platform,
            platformPostId: '',
            platformPostUrl: '',
            content: post.content,
            images: post.images,
            hashtags: post.hashtags,
            status: 'failed',
            publishedAt: now,
            error,
            createdAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        const keys = getSocialPostKeys(userId, postId, post.listingId);

        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            EntityType: 'SocialPost' as const,
            Data: storedPost,
            CreatedAt: now,
            UpdatedAt: now,
        });
    }
}

/**
 * Factory function to create social publisher
 */
export function createSocialPublisher(): SocialPublisher {
    return new SocialPublisherService();
}
