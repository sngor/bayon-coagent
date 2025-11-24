"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedPublishingService = void 0;
exports.createEnhancedPublishingService = createEnhancedPublishingService;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const connection_manager_1 = require("@/integrations/oauth/connection-manager");
const publisher_1 = require("@/integrations/social/publisher");
const content_optimizer_1 = require("@/integrations/social/content-optimizer");
const image_optimizer_1 = require("@/integrations/social/image-optimizer");
const publishing_error_handler_1 = require("./publishing-error-handler");
const logger_1 = require("@/aws/logging/logger");
const content_workflow_types_1 = require("@/lib/content-workflow-types");
class EnhancedPublishingService {
    constructor() {
        this.publisher = (0, publisher_1.createSocialPublisher)();
        this.contentOptimizer = (0, content_optimizer_1.createContentOptimizer)();
        this.imageOptimizer = (0, image_optimizer_1.createImageOptimizer)();
        this.oauthManager = (0, connection_manager_1.getOAuthConnectionManager)();
        this.logger = (0, logger_1.createLogger)({ service: 'enhanced-publishing' });
    }
    async publishToPlatform(post, platform, connection, userId) {
        const operationLogger = this.logger.child({
            userId,
            platform,
            listingId: post.listingId,
            operation: 'publish_to_platform'
        });
        operationLogger.info('Starting platform publish operation');
        const publishOperation = async () => {
            switch (platform) {
                case 'facebook':
                    return await this.publisher.publishToFacebook(post, connection);
                case 'instagram':
                    return await this.publisher.publishToInstagram(post, connection);
                case 'linkedin':
                    return await this.publisher.publishToLinkedIn(post, connection);
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        };
        const result = await publishing_error_handler_1.publishingErrorHandler.executeWithRetry(publishOperation, platform, 'publish_content', {
            userId,
            listingId: post.listingId,
            contentLength: post.content.length,
            imageCount: post.images?.length || 0
        });
        const enhancedResult = {
            success: result.success,
            postId: result.postId,
            postUrl: result.postUrl,
            error: result.error?.message,
            attempts: result.attempts,
            totalDuration: result.totalDuration,
            circuitBreakerTriggered: result.circuitBreakerTriggered
        };
        if (!result.success && result.error) {
            enhancedResult.errorDetails = publishing_error_handler_1.publishingErrorHandler.getErrorDetails(result.error);
        }
        await this.storeEnhancedPostMetadata(userId, post, platform, enhancedResult);
        operationLogger.info('Platform publish operation completed', {
            success: result.success,
            attempts: result.attempts,
            duration: result.totalDuration,
            circuitBreakerTriggered: result.circuitBreakerTriggered
        });
        return enhancedResult;
    }
    async publishScheduledContent(scheduledContent, userId) {
        const operationLogger = this.logger.child({
            userId,
            scheduleId: scheduledContent.id,
            operation: 'publish_scheduled_content'
        });
        operationLogger.info('Starting scheduled content publishing', {
            channelCount: scheduledContent.channels.length,
            publishTime: scheduledContent.publishTime,
            contentType: scheduledContent.contentType
        });
        const results = [];
        const publishResults = [];
        let successCount = 0;
        let failedCount = 0;
        await this.updateScheduledContentStatus(userId, scheduledContent.id, content_workflow_types_1.ScheduledContentStatus.PUBLISHING);
        for (const channel of scheduledContent.channels) {
            const channelLogger = operationLogger.child({
                channelType: channel.type,
                channelId: channel.accountId
            });
            const status = {
                platform: this.mapChannelTypeToPlatform(channel.type),
                status: 'publishing'
            };
            results.push(status);
            const startTime = Date.now();
            try {
                if (this.isSocialMediaChannel(channel.type)) {
                    const result = await this.publishToSocialMedia(scheduledContent, channel, userId, channelLogger);
                    status.status = result.success ? 'success' : 'failed';
                    status.postId = result.postId;
                    status.postUrl = result.postUrl;
                    status.attempts = result.attempts;
                    status.duration = result.totalDuration;
                    if (!result.success) {
                        status.error = result.errorDetails?.userMessage || result.error || 'Unknown error';
                        status.recoveryActions = result.errorDetails?.recoveryActions;
                        if (result.circuitBreakerTriggered) {
                            status.status = 'circuit_breaker_open';
                        }
                    }
                    publishResults.push({
                        channel,
                        success: result.success,
                        platformPostId: result.postId,
                        publishedUrl: result.postUrl,
                        error: result.error,
                        attempts: result.attempts,
                        duration: result.totalDuration,
                        recoveryActions: result.errorDetails?.recoveryActions,
                        publishedAt: result.success ? new Date() : undefined
                    });
                    if (result.success) {
                        successCount++;
                    }
                    else {
                        failedCount++;
                    }
                }
                else {
                    const result = await this.publishToOtherChannel(scheduledContent, channel, channelLogger);
                    status.status = result.success ? 'success' : 'failed';
                    status.postUrl = result.postUrl;
                    status.attempts = 1;
                    status.duration = Date.now() - startTime;
                    if (!result.success) {
                        status.error = result.error;
                    }
                    publishResults.push({
                        channel,
                        success: result.success,
                        publishedUrl: result.postUrl,
                        error: result.error,
                        attempts: 1,
                        duration: Date.now() - startTime,
                        publishedAt: result.success ? new Date() : undefined
                    });
                    if (result.success) {
                        successCount++;
                    }
                    else {
                        failedCount++;
                    }
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                channelLogger.error('Channel publishing failed', error, {
                    channelType: channel.type,
                    duration: Date.now() - startTime
                });
                status.status = 'failed';
                status.error = errorMessage;
                status.attempts = 1;
                status.duration = Date.now() - startTime;
                publishResults.push({
                    channel,
                    success: false,
                    error: errorMessage,
                    attempts: 1,
                    duration: Date.now() - startTime
                });
                failedCount++;
            }
        }
        const finalStatus = successCount > 0 ? content_workflow_types_1.ScheduledContentStatus.PUBLISHED : content_workflow_types_1.ScheduledContentStatus.FAILED;
        const statusUpdate = {
            scheduleId: scheduledContent.id,
            status: finalStatus,
            publishResults,
            updatedAt: new Date()
        };
        if (finalStatus === content_workflow_types_1.ScheduledContentStatus.FAILED) {
            statusUpdate.failureReason = this.generateFailureReason(publishResults);
            statusUpdate.recoverySuggestions = this.generateRecoverySuggestions(publishResults);
        }
        await this.updateScheduledContentWithResults(userId, statusUpdate);
        const message = `Published to ${successCount} channel(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`;
        operationLogger.info('Scheduled content publishing completed', {
            successCount,
            failedCount,
            finalStatus,
            totalDuration: Date.now() - Date.now()
        });
        return {
            success: successCount > 0,
            message,
            results,
            statusUpdate
        };
    }
    async publishToSocialMedia(scheduledContent, channel, userId, logger) {
        const platform = this.mapChannelTypeToPlatform(channel.type);
        const connection = await this.oauthManager.getConnection(userId, platform);
        if (!connection) {
            throw new Error(`No ${platform} connection found. Please reconnect your account.`);
        }
        const post = await this.createSocialPostFromScheduledContent(scheduledContent, platform, userId);
        return await this.publishToPlatform(post, platform, connection, userId);
    }
    async publishToOtherChannel(scheduledContent, channel, logger) {
        try {
            switch (channel.type) {
                case content_workflow_types_1.PublishChannelType.BLOG:
                    return await this.publishToBlog(scheduledContent);
                case content_workflow_types_1.PublishChannelType.NEWSLETTER:
                    return await this.publishToNewsletter(scheduledContent);
                default:
                    throw new Error(`Unsupported channel type: ${channel.type}`);
            }
        }
        catch (error) {
            logger.error(`Failed to publish to ${channel.type}`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async createSocialPostFromScheduledContent(scheduledContent, platform, userId) {
        const hashtags = await this.generateHashtagsForContent(scheduledContent.content, scheduledContent.contentType, platform);
        return {
            listingId: scheduledContent.contentId,
            content: scheduledContent.content,
            images: [],
            hashtags,
            platform
        };
    }
    async storeEnhancedPostMetadata(userId, post, platform, result) {
        const postId = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const storedPost = {
            postId,
            listingId: post.listingId,
            platform,
            platformPostId: result.postId || '',
            platformPostUrl: result.postUrl || '',
            content: post.content,
            images: post.images,
            hashtags: post.hashtags,
            status: result.success ? 'published' : 'failed',
            publishedAt: now,
            createdAt: now,
            attempts: result.attempts,
            totalDuration: result.totalDuration,
            error: result.error,
            errorDetails: result.errorDetails,
            circuitBreakerTriggered: result.circuitBreakerTriggered
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
    async updateScheduledContentStatus(userId, scheduleId, status) {
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getScheduledContentKeys)(userId, scheduleId);
        await repository.update(keys.PK, keys.SK, {
            status,
            updatedAt: new Date(),
            GSI1PK: `SCHEDULE#${status}`
        });
    }
    async updateScheduledContentWithResults(userId, statusUpdate) {
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getScheduledContentKeys)(userId, statusUpdate.scheduleId);
        await repository.update(keys.PK, keys.SK, {
            status: statusUpdate.status,
            publishResults: statusUpdate.publishResults,
            failureReason: statusUpdate.failureReason,
            recoverySuggestions: statusUpdate.recoverySuggestions,
            updatedAt: statusUpdate.updatedAt,
            GSI1PK: `SCHEDULE#${statusUpdate.status}`
        });
    }
    generateFailureReason(publishResults) {
        const failedResults = publishResults.filter(r => !r.success);
        if (failedResults.length === 0) {
            return 'Unknown failure';
        }
        const errorCounts = new Map();
        failedResults.forEach(result => {
            const error = result.error || 'Unknown error';
            errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
        });
        const mostCommonError = Array.from(errorCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];
        return `${mostCommonError[0]} (${mostCommonError[1]} channel${mostCommonError[1] > 1 ? 's' : ''})`;
    }
    generateRecoverySuggestions(publishResults) {
        const suggestions = new Set();
        publishResults
            .filter(r => !r.success && r.recoveryActions)
            .forEach(result => {
            result.recoveryActions.forEach(action => suggestions.add(action));
        });
        return Array.from(suggestions).slice(0, 5);
    }
    mapChannelTypeToPlatform(channelType) {
        const mapping = {
            [content_workflow_types_1.PublishChannelType.FACEBOOK]: 'facebook',
            [content_workflow_types_1.PublishChannelType.INSTAGRAM]: 'instagram',
            [content_workflow_types_1.PublishChannelType.LINKEDIN]: 'linkedin',
            [content_workflow_types_1.PublishChannelType.TWITTER]: 'linkedin',
            [content_workflow_types_1.PublishChannelType.BLOG]: 'facebook',
            [content_workflow_types_1.PublishChannelType.NEWSLETTER]: 'facebook'
        };
        return mapping[channelType];
    }
    isSocialMediaChannel(channelType) {
        return [
            content_workflow_types_1.PublishChannelType.FACEBOOK,
            content_workflow_types_1.PublishChannelType.INSTAGRAM,
            content_workflow_types_1.PublishChannelType.LINKEDIN,
            content_workflow_types_1.PublishChannelType.TWITTER
        ].includes(channelType);
    }
    async generateHashtagsForContent(content, contentType, platform) {
        const baseHashtags = ['#realestate', '#property', '#homes'];
        const maxHashtags = platform === 'instagram' ? 30 : 15;
        return baseHashtags.slice(0, maxHashtags);
    }
    async publishToBlog(scheduledContent) {
        return {
            success: true,
            postUrl: `https://blog.example.com/posts/${scheduledContent.id}`
        };
    }
    async publishToNewsletter(scheduledContent) {
        return {
            success: true,
            postUrl: `https://newsletter.example.com/campaigns/${scheduledContent.id}`
        };
    }
    getCircuitBreakerStatus() {
        return publishing_error_handler_1.publishingErrorHandler.getCircuitBreakerStatus();
    }
    resetCircuitBreaker(platform) {
        publishing_error_handler_1.publishingErrorHandler.resetCircuitBreaker(platform);
    }
}
exports.EnhancedPublishingService = EnhancedPublishingService;
function createEnhancedPublishingService() {
    return new EnhancedPublishingService();
}
