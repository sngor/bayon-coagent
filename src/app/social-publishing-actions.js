"use strict";
'use server';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishingPreview = getPublishingPreview;
exports.publishListing = publishListing;
exports.retryPublish = retryPublish;
exports.getListingPosts = getListingPosts;
exports.getUserListings = getUserListings;
exports.checkPlatformConnections = checkPlatformConnections;
exports.publishScheduledContent = publishScheduledContent;
exports.getCircuitBreakerStatus = getCircuitBreakerStatus;
exports.resetCircuitBreaker = resetCircuitBreaker;
const cache_1 = require("next/cache");
const cognito_client_1 = require("@/aws/auth/cognito-client");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const connection_manager_1 = require("@/integrations/oauth/connection-manager");
const content_optimizer_1 = require("@/integrations/social/content-optimizer");
const image_optimizer_1 = require("@/integrations/social/image-optimizer");
const content_workflow_types_1 = require("@/lib/content-workflow-types");
async function getPublishingPreview(listingId, platforms) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getListingKeys)(user.id, listingId);
        const listingItem = await repository.getItem(keys.PK, keys.SK);
        if (!listingItem) {
            return { success: false, message: 'Listing not found' };
        }
        const listing = {
            ...listingItem.Data,
            listingId,
        };
        const contentOptimizer = (0, content_optimizer_1.createContentOptimizer)();
        const previews = [];
        for (const platform of platforms) {
            const formattedContent = await contentOptimizer.formatForPlatform(listing, platform);
            const hashtags = await contentOptimizer.generateHashtags(listing, platform);
            const imageCount = Math.min(listing.photos?.length || 0, platform === 'facebook' ? 10 : platform === 'instagram' ? 10 : 9);
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
    }
    catch (error) {
        console.error('Failed to generate publishing preview:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate preview',
        };
    }
}
async function publishListing(request) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return {
                success: false,
                message: 'Not authenticated',
                results: [],
            };
        }
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getListingKeys)(user.id, request.listingId);
        const listingItem = await repository.getItem(keys.PK, keys.SK);
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
        const contentOptimizer = (0, content_optimizer_1.createContentOptimizer)();
        const imageOptimizer = (0, image_optimizer_1.createImageOptimizer)();
        const oauthManager = (0, connection_manager_1.getOAuthConnectionManager)();
        const { createEnhancedPublishingService } = await Promise.resolve().then(() => __importStar(require('@/services/enhanced-publishing-service')));
        const enhancedPublisher = createEnhancedPublishingService();
        const results = [];
        for (const platform of request.platforms) {
            const status = {
                platform,
                status: 'pending',
            };
            results.push(status);
            try {
                status.status = 'publishing';
                const connection = await oauthManager.getConnection(user.id, platform);
                if (!connection) {
                    throw new Error(`No ${platform} connection found. Please connect your account in settings.`);
                }
                const formattedContent = await contentOptimizer.formatForPlatform(listing, platform);
                const hashtags = request.customHashtags || await contentOptimizer.generateHashtags(listing, platform);
                const imageUrls = listing.photos?.map(p => p.url) || [];
                const optimizedImages = await imageOptimizer.optimizeImages(imageUrls, platform, request.listingId, user.id);
                const post = {
                    listingId: request.listingId,
                    content: request.customContent || formattedContent.text,
                    images: optimizedImages.map(img => img.optimizedUrl),
                    hashtags,
                    platform,
                };
                const result = await enhancedPublisher.publishToPlatform(post, platform, connection, user.id);
                if (result.success) {
                    status.status = 'success';
                    status.postId = result.postId;
                    status.postUrl = result.postUrl;
                    status.attempts = result.attempts;
                    status.duration = result.totalDuration;
                }
                else {
                    if (result.circuitBreakerTriggered) {
                        status.status = 'circuit_breaker_open';
                    }
                    else {
                        status.status = 'failed';
                    }
                    status.error = result.errorDetails?.userMessage || result.error || 'Unknown error';
                    status.attempts = result.attempts;
                    status.duration = result.totalDuration;
                    status.recoveryActions = result.errorDetails?.recoveryActions;
                }
            }
            catch (error) {
                status.status = 'failed';
                status.error = error instanceof Error ? error.message : 'Unknown error';
                status.attempts = 1;
                const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
                logger.error(`Failed to publish to ${platform}`, error, {
                    userId: user.id,
                    listingId: request.listingId,
                    platform,
                    operation: 'publish_listing'
                });
            }
        }
        (0, cache_1.revalidatePath)('/library/listings');
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
    }
    catch (error) {
        const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
        logger.error('Critical failure in publishListing', error, {
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
async function retryPublish(listingId, platform) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
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
    }
    catch (error) {
        console.error('Failed to retry publish:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retry publish',
        };
    }
}
async function getListingPosts(listingId) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const repository = (0, repository_1.getRepository)();
        const result = await repository.querySocialPostsByListing(listingId);
        return {
            success: true,
            message: 'Posts retrieved successfully',
            posts: result.items,
        };
    }
    catch (error) {
        console.error('Failed to get listing posts:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get posts',
        };
    }
}
async function getUserListings() {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const repository = (0, repository_1.getRepository)();
        const result = await repository.query(`USER#${user.id}`, 'LISTING#');
        const listings = result.items.map((item) => {
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
    }
    catch (error) {
        console.error('Failed to get user listings:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get listings',
        };
    }
}
async function checkPlatformConnections() {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const oauthManager = (0, connection_manager_1.getOAuthConnectionManager)();
        const platforms = ['facebook', 'instagram', 'linkedin'];
        const connections = {
            facebook: false,
            instagram: false,
            linkedin: false,
        };
        for (const platform of platforms) {
            const connection = await oauthManager.getConnection(user.id, platform);
            connections[platform] = connection !== null;
        }
        return {
            success: true,
            message: 'Platform connections checked',
            connections,
        };
    }
    catch (error) {
        console.error('Failed to check platform connections:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to check connections',
        };
    }
}
async function publishScheduledContent(scheduledContentId) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getScheduledContentKeys)(user.id, scheduledContentId);
        const scheduledItem = await repository.getItem(keys.PK, keys.SK);
        if (!scheduledItem) {
            return { success: false, message: 'Scheduled content not found' };
        }
        const scheduledContent = scheduledItem.Data;
        const now = new Date();
        if (scheduledContent.publishTime > now) {
            return {
                success: false,
                message: `Content not ready for publishing. Scheduled for ${scheduledContent.publishTime.toISOString()}`
            };
        }
        const { createEnhancedPublishingService } = await Promise.resolve().then(() => __importStar(require('@/services/enhanced-publishing-service')));
        const enhancedPublisher = createEnhancedPublishingService();
        const result = await enhancedPublisher.publishScheduledContent(scheduledContent, user.id);
        return {
            success: result.success,
            message: result.message,
            results: result.results,
            statusUpdate: result.statusUpdate
        };
    }
    catch (error) {
        const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
        logger.error('Critical failure in publishScheduledContent', error, {
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
async function publishToBlog(scheduledContent) {
    try {
        const seoOptimizedContent = await optimizeContentForSEO(scheduledContent.content, scheduledContent.title, scheduledContent.contentType);
        console.log('Publishing to blog:', {
            title: scheduledContent.title,
            content: seoOptimizedContent.content,
            metaDescription: seoOptimizedContent.metaDescription,
            keywords: seoOptimizedContent.keywords,
            slug: seoOptimizedContent.slug,
        });
        return {
            success: true,
            postUrl: `https://blog.example.com/posts/${seoOptimizedContent.slug}`,
        };
    }
    catch (error) {
        console.error('Failed to publish to blog:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish to blog',
        };
    }
}
async function publishToNewsletter(scheduledContent) {
    try {
        const emailContent = await formatContentForEmail(scheduledContent.content, scheduledContent.title);
        console.log('Publishing to newsletter:', {
            subject: scheduledContent.title,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
        });
        return {
            success: true,
            postUrl: `https://newsletter.example.com/campaigns/${Date.now()}`,
        };
    }
    catch (error) {
        console.error('Failed to publish to newsletter:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to publish to newsletter',
        };
    }
}
async function optimizeContentForSEO(content, title, contentType) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    const keywords = extractKeywords(content, contentType);
    const metaDescription = content
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .slice(0, 25)
        .join(' ') + '...';
    const seoContent = addSEOStructure(content, title, keywords);
    return {
        content: seoContent,
        metaDescription,
        keywords,
        slug,
    };
}
function extractKeywords(content, contentType) {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
    const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));
    const wordCount = new Map();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    const topKeywords = Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    const typeKeywords = {
        [content_workflow_types_1.ContentCategory.BLOG_POST]: ['real estate', 'property', 'home', 'market'],
        [content_workflow_types_1.ContentCategory.SOCIAL_MEDIA]: ['realtor', 'agent', 'listing'],
        [content_workflow_types_1.ContentCategory.LISTING_DESCRIPTION]: ['home', 'property', 'house', 'listing'],
        [content_workflow_types_1.ContentCategory.MARKET_UPDATE]: ['market', 'trends', 'prices', 'analysis'],
        [content_workflow_types_1.ContentCategory.NEIGHBORHOOD_GUIDE]: ['neighborhood', 'community', 'area', 'local'],
        [content_workflow_types_1.ContentCategory.VIDEO_SCRIPT]: ['video', 'tour', 'walkthrough'],
        [content_workflow_types_1.ContentCategory.NEWSLETTER]: ['newsletter', 'update', 'news'],
        [content_workflow_types_1.ContentCategory.EMAIL_TEMPLATE]: ['email', 'template', 'communication'],
    };
    return [...topKeywords, ...(typeKeywords[contentType] || [])].slice(0, 8);
}
function addSEOStructure(content, title, keywords) {
    let seoContent = content;
    if (!seoContent.includes(title)) {
        seoContent = `# ${title}\n\n${seoContent}`;
    }
    if (seoContent.length > 500) {
        const keywordPhrase = keywords.slice(0, 3).join(', ');
        const intro = `This comprehensive guide covers ${keywordPhrase} and provides valuable insights for real estate professionals and homeowners alike.\n\n`;
        const lines = seoContent.split('\n');
        if (lines[0].startsWith('#')) {
            lines.splice(2, 0, intro);
            seoContent = lines.join('\n');
        }
    }
    return seoContent;
}
async function formatContentForEmail(content, title) {
    let html = content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;
    html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${title}</h1>
            ${html}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>This email was sent from your Bayon Coagent platform.</p>
            </div>
        </div>
    `;
    const text = content
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/<[^>]*>/g, '')
        .trim();
    return { html, text };
}
async function generateHashtagsForScheduledContent(content, contentType, platform) {
    const maxHashtags = platform === 'instagram' ? 30 : 15;
    const hashtags = [];
    const typeHashtags = {
        [content_workflow_types_1.ContentCategory.BLOG_POST]: ['#realestateblog', '#propertyinsights', '#marketupdate', '#realestatenews'],
        [content_workflow_types_1.ContentCategory.SOCIAL_MEDIA]: ['#realestate', '#realtor', '#property', '#homes'],
        [content_workflow_types_1.ContentCategory.LISTING_DESCRIPTION]: ['#forsale', '#dreamhome', '#newhome', '#househunting'],
        [content_workflow_types_1.ContentCategory.MARKET_UPDATE]: ['#marketupdate', '#realestatemarkets', '#propertytrends', '#marketanalysis'],
        [content_workflow_types_1.ContentCategory.NEIGHBORHOOD_GUIDE]: ['#neighborhood', '#community', '#localarea', '#livingin'],
        [content_workflow_types_1.ContentCategory.VIDEO_SCRIPT]: ['#realestatevideo', '#propertytour', '#virtualtour', '#homevideo'],
        [content_workflow_types_1.ContentCategory.NEWSLETTER]: ['#newsletter', '#realestateupdates', '#propertyupdates', '#marketinsights'],
        [content_workflow_types_1.ContentCategory.EMAIL_TEMPLATE]: ['#realestateemail', '#propertymarketing', '#clientcommunication'],
    };
    hashtags.push(...(typeHashtags[contentType] || []));
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
    const contentKeywords = extractKeywordsFromContent(content);
    contentKeywords.forEach(keyword => {
        if (keyword.length > 2) {
            hashtags.push(`#${keyword.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`);
        }
    });
    const uniqueHashtags = Array.from(new Set(hashtags));
    return uniqueHashtags.slice(0, maxHashtags);
}
function extractKeywordsFromContent(content) {
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
    const wordCount = new Map();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    return Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}
async function getCircuitBreakerStatus() {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const { createEnhancedPublishingService } = await Promise.resolve().then(() => __importStar(require('@/services/enhanced-publishing-service')));
        const enhancedPublisher = createEnhancedPublishingService();
        const status = enhancedPublisher.getCircuitBreakerStatus();
        return {
            success: true,
            message: 'Circuit breaker status retrieved',
            status
        };
    }
    catch (error) {
        const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
        logger.error('Failed to get circuit breaker status', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get circuit breaker status'
        };
    }
}
async function resetCircuitBreaker(platform) {
    try {
        const user = await (0, cognito_client_1.getCurrentUser)();
        if (!user) {
            return { success: false, message: 'Not authenticated' };
        }
        const { createEnhancedPublishingService } = await Promise.resolve().then(() => __importStar(require('@/services/enhanced-publishing-service')));
        const enhancedPublisher = createEnhancedPublishingService();
        enhancedPublisher.resetCircuitBreaker(platform);
        const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
        logger.info(`Circuit breaker reset for ${platform}`, {
            userId: user.id,
            platform,
            operation: 'reset_circuit_breaker'
        });
        return {
            success: true,
            message: `Circuit breaker reset for ${platform}`
        };
    }
    catch (error) {
        const { logger } = await Promise.resolve().then(() => __importStar(require('@/aws/logging/logger')));
        logger.error(`Failed to reset circuit breaker for ${platform}`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to reset circuit breaker'
        };
    }
}
