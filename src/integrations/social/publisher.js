"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPublisherService = void 0;
exports.createSocialPublisher = createSocialPublisher;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const constants_1 = require("./constants");
const schemas_1 = require("./schemas");
class SocialPublisherService {
    async publishToFacebook(post, connection) {
        try {
            const pageId = this.getFacebookPageId(connection);
            if (!pageId) {
                throw new Error('No Facebook page selected. Please select a page in settings.');
            }
            const pageAccessToken = await this.getFacebookPageAccessToken(connection.accessToken, pageId);
            const message = this.formatPostContent(post);
            const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.facebook}/${pageId}/photos`;
            if (post.images && post.images.length > 0) {
                const result = await this.publishFacebookPhotos(endpoint, pageAccessToken, message, post.images);
                await this.storePostMetadata(connection.userId, post, 'facebook', result);
                return result;
            }
            else {
                const result = await this.publishFacebookStatus(pageId, pageAccessToken, message);
                await this.storePostMetadata(connection.userId, post, 'facebook', result);
                return result;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Facebook publish error:', errorMessage, error);
            await this.storeFailedPost(connection.userId, post, 'facebook', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async publishToInstagram(post, connection) {
        try {
            const instagramAccountId = this.getInstagramAccountId(connection);
            if (!instagramAccountId) {
                throw new Error('No Instagram business account found. Please connect an Instagram business account.');
            }
            if (!post.images || post.images.length === 0) {
                throw new Error('Instagram posts require at least one image');
            }
            const caption = this.formatPostContent(post);
            const result = await this.publishInstagramPost(instagramAccountId, connection.accessToken, caption, post.images);
            await this.storePostMetadata(connection.userId, post, 'instagram', result);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Instagram publish error:', errorMessage, error);
            await this.storeFailedPost(connection.userId, post, 'instagram', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async publishToLinkedIn(post, connection) {
        try {
            const userUrn = `urn:li:person:${connection.platformUserId}`;
            const text = this.formatPostContent(post);
            const result = await this.publishLinkedInPost(userUrn, connection.accessToken, text, post.images);
            await this.storePostMetadata(connection.userId, post, 'linkedin', result);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('LinkedIn publish error:', errorMessage, error);
            await this.storeFailedPost(connection.userId, post, 'linkedin', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async unpublishPost(platform, platformPostId, connection) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to unpublish ${platform} post:`, errorMessage);
            throw error;
        }
    }
    formatPostContent(post) {
        const parts = [post.content];
        if (post.hashtags && post.hashtags.length > 0) {
            parts.push('');
            parts.push(post.hashtags.join(' '));
        }
        return parts.join('\n');
    }
    getFacebookPageId(connection) {
        const pages = connection.metadata?.pages;
        if (!pages || pages.length === 0) {
            return null;
        }
        const selectedPageId = connection.metadata?.selectedPageId;
        if (selectedPageId) {
            return selectedPageId;
        }
        return pages[0]?.id || null;
    }
    async getFacebookPageAccessToken(userAccessToken, pageId) {
        const response = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.facebook}/${pageId}?fields=access_token&access_token=${userAccessToken}`, {
            method: 'GET',
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get page access token: ${error}`);
        }
        const data = await response.json();
        return data.access_token;
    }
    async publishFacebookPhotos(endpoint, accessToken, message, images) {
        if (images.length === 1) {
            const formData = new FormData();
            formData.append('url', images[0]);
            formData.append('caption', message);
            formData.append('access_token', accessToken);
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
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
        return await this.publishFacebookPhotos(endpoint, accessToken, message, [images[0]]);
    }
    async publishFacebookStatus(pageId, accessToken, message) {
        const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.facebook}/${pageId}/feed`;
        const formData = new FormData();
        formData.append('message', message);
        formData.append('access_token', accessToken);
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
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
    getInstagramAccountId(connection) {
        const businessAccounts = connection.metadata?.businessAccounts;
        if (!businessAccounts || businessAccounts.length === 0) {
            return null;
        }
        const selectedAccountId = connection.metadata?.selectedInstagramAccountId;
        if (selectedAccountId) {
            return selectedAccountId;
        }
        return businessAccounts[0]?.instagram_business_account?.id || null;
    }
    async publishInstagramPost(accountId, accessToken, caption, images) {
        const containerEndpoint = `${constants_1.PLATFORM_API_ENDPOINTS.instagram}/${accountId}/media`;
        const containerParams = new URLSearchParams({
            image_url: images[0],
            caption: caption,
            access_token: accessToken,
        });
        const containerResponse = await fetch(`${containerEndpoint}?${containerParams.toString()}`, {
            method: 'POST',
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
        });
        if (!containerResponse.ok) {
            const error = await containerResponse.text();
            throw new Error(`Instagram container creation error: ${error}`);
        }
        const containerData = await containerResponse.json();
        const creationId = containerData.id;
        const publishEndpoint = `${constants_1.PLATFORM_API_ENDPOINTS.instagram}/${accountId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: accessToken,
        });
        const publishResponse = await fetch(`${publishEndpoint}?${publishParams.toString()}`, {
            method: 'POST',
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
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
    async publishLinkedInPost(userUrn, accessToken, text, images) {
        const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.linkedin}/ugcPosts`;
        const payload = {
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
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
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
    async unpublishFacebookPost(postId, accessToken) {
        const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.facebook}/${postId}`;
        const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete Facebook post: ${error}`);
        }
    }
    async unpublishInstagramPost(postId, accessToken) {
        const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.instagram}/${postId}`;
        const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete Instagram post: ${error}`);
        }
    }
    async unpublishLinkedInPost(postId, accessToken) {
        const endpoint = `${constants_1.PLATFORM_API_ENDPOINTS.linkedin}/ugcPosts/${postId}`;
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            signal: AbortSignal.timeout(constants_1.SOCIAL_API_TIMEOUT_MS),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete LinkedIn post: ${error}`);
        }
    }
    async storePostMetadata(userId, post, platform, result) {
        if (!result.success || !result.postId) {
            return;
        }
        const postId = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const storedPost = {
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
        schemas_1.StoredSocialPostSchema.parse(storedPost);
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getSocialPostKeys)(userId, postId, post.listingId);
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            EntityType: 'SocialPost',
            Data: storedPost,
            CreatedAt: now,
            UpdatedAt: now,
        });
    }
    async storeFailedPost(userId, post, platform, error) {
        const postId = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const storedPost = {
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
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getSocialPostKeys)(userId, postId, post.listingId);
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            EntityType: 'SocialPost',
            Data: storedPost,
            CreatedAt: now,
            UpdatedAt: now,
        });
    }
}
exports.SocialPublisherService = SocialPublisherService;
function createSocialPublisher() {
    return new SocialPublisherService();
}
