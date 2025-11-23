/**
 * Social Analytics Synchronization Lambda Function
 * 
 * Processes scheduled synchronization of social media analytics data from external
 * platforms (Facebook, Instagram, LinkedIn, Twitter). Implements enterprise-grade
 * error handling, rate limiting, and comprehensive logging.
 * 
 * Schedule: Daily at 2 AM via EventBridge
 * Timeout: 15 minutes
 * Memory: 2048 MB
 * 
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Type definitions for Lambda environment
interface OAuthConnection {
    id: string;
    userId: string;
    platform: Platform;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scope: string[];
    platformUserId: string;
    platformUsername: string;
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

interface Analytics {
    id: string;
    userId: string;
    contentId: string;
    contentType: ContentCategory;
    channel: PublishChannelType;
    publishedAt: Date;
    metrics: EngagementMetrics;
    platformMetrics?: {
        platformPostId?: string;
        publishedUrl?: string;
        metadata?: Record<string, any>;
    };
    lastSynced: Date;
    syncStatus: AnalyticsSyncStatus;
    GSI1PK?: string;
    GSI1SK?: string;
}

interface EngagementMetrics {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    saves?: number;
    engagementRate: number;
    reach?: number;
    impressions?: number;
}

interface ExternalAnalyticsData {
    platform: PublishChannelType;
    postId: string;
    metrics: Record<string, number>;
    rawData: any;
    retrievedAt: Date;
}

interface SyncResult {
    channel: PublishChannelType;
    success: boolean;
    itemsSynced: number;
    errors: string[];
    lastSyncTime: Date;
    nextSyncTime: Date;
    rateLimitStatus?: {
        remaining: number;
        resetTime: Date;
    };
}

type Platform = "facebook" | "instagram" | "linkedin" | "twitter";

enum PublishChannelType {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    BLOG = 'blog',
    NEWSLETTER = 'newsletter'
}

enum ContentCategory {
    BLOG_POST = 'blog_post',
    SOCIAL_MEDIA = 'social_media',
    LISTING_DESCRIPTION = 'listing_description',
    MARKET_UPDATE = 'market_update',
    NEIGHBORHOOD_GUIDE = 'neighborhood_guide',
    VIDEO_SCRIPT = 'video_script',
    NEWSLETTER = 'newsletter',
    EMAIL_TEMPLATE = 'email_template'
}

enum AnalyticsSyncStatus {
    PENDING = 'pending',
    SYNCING = 'syncing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Logger interface for Lambda environment
interface Logger {
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    debug(message: string, context?: any): void;
    child(context: any): Logger;
}

// Simple logger implementation for Lambda
const createSimpleLogger = (defaultContext: any = {}): Logger => ({
    info: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'INFO', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    warn: (message: string, context?: any) => {
        console.warn(JSON.stringify({ level: 'WARN', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    error: (message: string, error?: Error, context?: any) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    debug: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'DEBUG', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    child: (context: any) => createSimpleLogger({ ...defaultContext, ...context })
});

// Initialize logger with Lambda context
const lambdaLogger = createSimpleLogger({
    service: 'sync-social-analytics-lambda',
    environment: process.env.NODE_ENV || 'production'
});

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        dryRun?: boolean;
        maxUsers?: number;
        userIds?: string[];
        channels?: PublishChannelType[];
        forceSync?: boolean;
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

interface ProcessingResult {
    totalUsers: number;
    totalConnections: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalItemsSynced: number;
    errors: ProcessingError[];
    executionTime: number;
    rateLimitHits: number;
}

interface ProcessingError {
    userId: string;
    channel: PublishChannelType;
    error: string;
    itemsAffected: number;
}

/**
 * Custom error class for rate limit handling
 */
class RateLimitError extends Error {
    constructor(message: string, public retryAfter?: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

/**
 * Rate limiter for external analytics APIs with exponential backoff and queuing
 */
class ExternalAnalyticsRateLimiter {
    private requestQueue: Array<{ timestamp: number; resolve: () => void }> = [];
    private rateLimits: Map<PublishChannelType, {
        requestsPerHour: number;
        requestsPerMinute: number;
        currentRequests: number;
        windowStart: number;
        isLimited: boolean;
        retryAfter?: number;
    }> = new Map();

    constructor(private channel: PublishChannelType) {
        this.initializeRateLimits();
    }

    /**
     * Initialize rate limits for different platforms
     */
    private initializeRateLimits(): void {
        const limits = {
            [PublishChannelType.FACEBOOK]: {
                requestsPerHour: 200,
                requestsPerMinute: 10,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [PublishChannelType.INSTAGRAM]: {
                requestsPerHour: 200,
                requestsPerMinute: 10,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [PublishChannelType.LINKEDIN]: {
                requestsPerHour: 500,
                requestsPerMinute: 20,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [PublishChannelType.TWITTER]: {
                requestsPerHour: 300,
                requestsPerMinute: 15,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
        };

        Object.entries(limits).forEach(([channel, limit]) => {
            this.rateLimits.set(channel as PublishChannelType, limit);
        });
    }

    /**
     * Wait for rate limit clearance with exponential backoff
     */
    async waitForRateLimit(): Promise<void> {
        const limit = this.rateLimits.get(this.channel);
        if (!limit) return;

        // Check if we're currently rate limited
        if (limit.isLimited && limit.retryAfter && Date.now() < limit.retryAfter) {
            const waitTime = limit.retryAfter - Date.now();
            await this.sleep(waitTime);
            limit.isLimited = false;
            limit.retryAfter = undefined;
        }

        // Check if we need to reset the window
        const now = Date.now();
        const windowDuration = 60 * 1000; // 1 minute window

        if (now - limit.windowStart > windowDuration) {
            limit.currentRequests = 0;
            limit.windowStart = now;
        }

        // Check if we're approaching rate limits
        if (limit.currentRequests >= limit.requestsPerMinute) {
            const waitTime = windowDuration - (now - limit.windowStart);
            if (waitTime > 0) {
                await this.sleep(waitTime);
                limit.currentRequests = 0;
                limit.windowStart = Date.now();
            }
        }
    }

    /**
     * Record a successful request
     */
    recordRequest(): void {
        const limit = this.rateLimits.get(this.channel);
        if (limit) {
            limit.currentRequests++;
        }
    }

    /**
     * Handle rate limit response from API
     */
    handleRateLimit(retryAfterMs: number): void {
        const limit = this.rateLimits.get(this.channel);
        if (limit) {
            limit.isLimited = true;
            limit.retryAfter = Date.now() + retryAfterMs;
        }
    }

    /**
     * Get current rate limit status
     */
    getStatus(): { remaining: number; resetTime: Date } {
        const limit = this.rateLimits.get(this.channel);
        if (!limit) {
            return { remaining: 0, resetTime: new Date() };
        }

        const remaining = Math.max(0, limit.requestsPerMinute - limit.currentRequests);
        const resetTime = new Date(limit.windowStart + 60 * 1000);

        return { remaining, resetTime };
    }

    /**
     * Sleep utility with exponential backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Lambda handler for social analytics synchronization
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<{
    statusCode: number;
    body: string;
    result: ProcessingResult;
}> => {
    const startTime = Date.now();
    const correlationId = context.awsRequestId;

    const operationLogger = lambdaLogger.child({
        correlationId,
        functionName: context.functionName,
        operation: 'sync_social_analytics'
    });

    operationLogger.info('Starting social analytics synchronization Lambda', {
        event,
        remainingTime: context.getRemainingTimeInMillis(),
        memoryLimit: context.memoryLimitInMB
    });

    const result: ProcessingResult = {
        totalUsers: 0,
        totalConnections: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalItemsSynced: 0,
        errors: [],
        executionTime: 0,
        rateLimitHits: 0
    };

    try {
        // Get configuration from event
        const dryRun = event.detail?.dryRun || false;
        const maxUsers = event.detail?.maxUsers || 100;
        const userIds = event.detail?.userIds;
        const channels = event.detail?.channels || [
            PublishChannelType.FACEBOOK,
            PublishChannelType.INSTAGRAM,
            PublishChannelType.LINKEDIN,
            PublishChannelType.TWITTER
        ];
        const forceSync = event.detail?.forceSync || false;

        operationLogger.info('Processing configuration', {
            dryRun,
            maxUsers,
            userIdsCount: userIds?.length || 'all',
            channels: channels.length,
            forceSync
        });

        // Get all active social media connections
        const activeConnections = await getActiveSocialConnections(maxUsers, userIds, channels, operationLogger);

        if (activeConnections.length === 0) {
            operationLogger.info('No active social media connections found');

            result.executionTime = Date.now() - startTime;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No active social media connections found',
                    result
                }),
                result
            };
        }

        operationLogger.info(`Found ${activeConnections.length} active connections to sync`);
        result.totalConnections = activeConnections.length;

        // Group connections by user for efficient processing
        const connectionsByUser = groupConnectionsByUser(activeConnections);
        result.totalUsers = connectionsByUser.size;

        // Process each user's connections
        for (const [userId, userConnections] of connectionsByUser) {
            // Check remaining execution time (leave 2 minutes buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 120000) {
                operationLogger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTime,
                    processedUsers: result.totalUsers - connectionsByUser.size + 1
                });
                break;
            }

            const userLogger = operationLogger.child({
                userId,
                connectionCount: userConnections.length
            });

            try {
                if (dryRun) {
                    // Dry run mode - just log what would be synced
                    userLogger.info('DRY RUN: Would sync analytics for user connections', {
                        connections: userConnections.map(c => ({ platform: c.platform, username: c.platformUsername }))
                    });
                    continue;
                }

                // Process each connection for this user
                for (const connection of userConnections) {
                    const connectionLogger = userLogger.child({
                        platform: connection.platform,
                        platformUsername: connection.platformUsername
                    });

                    try {
                        // Check if sync is needed (unless forced)
                        if (!forceSync && !await isSyncNeeded(userId, connection.platform as PublishChannelType, connectionLogger)) {
                            connectionLogger.info('Sync not needed - last sync was within 24 hours');
                            continue;
                        }

                        // Validate connection token
                        if (connection.expiresAt < Date.now()) {
                            connectionLogger.warn('OAuth token expired, skipping sync');
                            result.errors.push({
                                userId,
                                channel: connection.platform as PublishChannelType,
                                error: 'OAuth token expired',
                                itemsAffected: 0
                            });
                            result.failedSyncs++;
                            continue;
                        }

                        connectionLogger.info('Starting analytics sync for connection');

                        // Sync analytics for this connection
                        const syncResult = await syncConnectionAnalytics(
                            userId,
                            connection,
                            connectionLogger
                        );

                        if (syncResult.success) {
                            result.successfulSyncs++;
                            result.totalItemsSynced += syncResult.itemsSynced;
                            connectionLogger.info('Successfully synced connection analytics', {
                                itemsSynced: syncResult.itemsSynced,
                                errors: syncResult.errors.length
                            });
                        } else {
                            result.failedSyncs++;
                            result.errors.push({
                                userId,
                                channel: connection.platform as PublishChannelType,
                                error: syncResult.errors.join('; '),
                                itemsAffected: syncResult.itemsSynced
                            });
                            connectionLogger.error('Failed to sync connection analytics', undefined, {
                                errors: syncResult.errors
                            });
                        }

                        // Track rate limit hits
                        if (syncResult.rateLimitStatus && syncResult.rateLimitStatus.remaining === 0) {
                            result.rateLimitHits++;
                        }

                    } catch (error) {
                        result.failedSyncs++;
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                        const processingError: ProcessingError = {
                            userId,
                            channel: connection.platform as PublishChannelType,
                            error: errorMessage,
                            itemsAffected: 0
                        };
                        result.errors.push(processingError);

                        connectionLogger.error('Error processing connection', error as Error, {
                            platform: connection.platform
                        });
                    }
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                userLogger.error('Error processing user connections', error as Error);

                // Add error for each connection of this user
                userConnections.forEach(connection => {
                    result.errors.push({
                        userId,
                        channel: connection.platform as PublishChannelType,
                        error: errorMessage,
                        itemsAffected: 0
                    });
                    result.failedSyncs++;
                });
            }
        }

        result.executionTime = Date.now() - startTime;

        operationLogger.info('Social analytics synchronization completed', {
            totalUsers: result.totalUsers,
            totalConnections: result.totalConnections,
            successfulSyncs: result.successfulSyncs,
            failedSyncs: result.failedSyncs,
            totalItemsSynced: result.totalItemsSynced,
            errorCount: result.errors.length,
            rateLimitHits: result.rateLimitHits,
            executionTime: result.executionTime
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${result.totalConnections} connections: ${result.successfulSyncs} successful, ${result.failedSyncs} failed, ${result.totalItemsSynced} items synced`,
                result
            }),
            result
        };

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        operationLogger.error('Critical failure in social analytics synchronization Lambda', error as Error, {
            executionTime: result.executionTime,
            partialResult: result
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Critical failure in social analytics synchronization',
                error: error instanceof Error ? error.message : 'Unknown error',
                result
            }),
            result
        };
    }
};

/**
 * Get all active social media connections that need analytics sync
 */
async function getActiveSocialConnections(
    maxUsers: number,
    userIds?: string[],
    channels?: PublishChannelType[],
    logger = lambdaLogger
): Promise<OAuthConnection[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const connections: OAuthConnection[] = [];

        logger.info('Querying for active social media connections', {
            maxUsers,
            userIdsFilter: userIds ? 'enabled' : 'disabled',
            channelsFilter: channels?.length || 'all'
        });

        if (userIds && userIds.length > 0) {
            // Query specific users
            for (const userId of userIds.slice(0, maxUsers)) {
                const userConnections = await getUserSocialConnections(userId, channels);
                connections.push(...userConnections);
            }
        } else {
            // Scan for all users with social connections (this is expensive but necessary for daily sync)
            // In production, consider maintaining a GSI for active connections
            const scanCommand = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1', // Assuming we have a GSI for entity types
                KeyConditionExpression: 'GSI1PK = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'SocialConnection'
                },
                Limit: maxUsers * 4, // Assume max 4 social platforms per user
                FilterExpression: 'attribute_exists(#data.#accessToken) AND #data.#expiresAt > :now',
                ExpressionAttributeNames: {
                    '#data': 'Data',
                    '#accessToken': 'accessToken',
                    '#expiresAt': 'expiresAt'
                },
                ExpressionAttributeValues: {
                    ':entityType': 'SocialConnection',
                    ':now': Date.now()
                }
            });

            const response = await docClient.send(scanCommand);
            const items = response.Items || [];

            // Extract connections and filter by channels if specified
            for (const item of items) {
                if (item.Data) {
                    const connection = item.Data as OAuthConnection;
                    if (!channels || channels.includes(connection.platform as PublishChannelType)) {
                        connections.push(connection);
                    }
                }
            }
        }

        logger.info(`Found ${connections.length} active social media connections`);
        return connections;

    } catch (error) {
        logger.error('Failed to get active social media connections', error as Error);
        return [];
    }
}

/**
 * Get social media connections for a specific user
 */
async function getUserSocialConnections(
    userId: string,
    channels?: PublishChannelType[]
): Promise<OAuthConnection[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const connections: OAuthConnection[] = [];

        const supportedPlatforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

        for (const platform of supportedPlatforms) {
            if (channels && !channels.includes(platform as PublishChannelType)) {
                continue;
            }

            const queryCommand = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk AND SK = :sk',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': `OAUTH#${platform}`
                }
            });

            const response = await docClient.send(queryCommand);
            if (response.Items && response.Items.length > 0) {
                const item = response.Items[0];
                if (item.Data) {
                    const connection = item.Data as OAuthConnection;
                    // Only include non-expired connections
                    if (connection.expiresAt > Date.now()) {
                        connections.push(connection);
                    }
                }
            }
        }

        return connections;
    } catch (error) {
        console.error(`Failed to get social connections for user ${userId}:`, error);
        return [];
    }
}

/**
 * Group connections by user ID for efficient processing
 */
function groupConnectionsByUser(connections: OAuthConnection[]): Map<string, OAuthConnection[]> {
    const grouped = new Map<string, OAuthConnection[]>();

    connections.forEach(connection => {
        if (!grouped.has(connection.userId)) {
            grouped.set(connection.userId, []);
        }
        grouped.get(connection.userId)!.push(connection);
    });

    return grouped;
}

/**
 * Check if analytics sync is needed for a user's channel
 */
async function isSyncNeeded(
    userId: string,
    channel: PublishChannelType,
    logger: Logger
): Promise<boolean> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        // Query for the most recent analytics record for this channel
        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':skPrefix': 'ANALYTICS#'
            },
            FilterExpression: '#channel = :channel',
            ExpressionAttributeNames: {
                '#channel': 'Data.channel'
            },
            ExpressionAttributeValues: {
                ':channel': channel
            },
            ScanIndexForward: false, // Get most recent first
            Limit: 1
        });

        const response = await docClient.send(queryCommand);

        if (response.Items && response.Items.length > 0) {
            const item = response.Items[0];
            if (item.Data && item.Data.lastSynced) {
                const lastSyncTime = new Date(item.Data.lastSynced).getTime();
                const timeSinceLastSync = Date.now() - lastSyncTime;
                const syncInterval = 24 * 60 * 60 * 1000; // 24 hours

                return timeSinceLastSync >= syncInterval;
            }
        }

        // If no previous sync found, sync is needed
        return true;
    } catch (error) {
        logger.error('Failed to check if sync is needed', error as Error);
        // Default to sync needed on error
        return true;
    }
}

/**
 * Sync analytics for a specific connection
 */
async function syncConnectionAnalytics(
    userId: string,
    connection: OAuthConnection,
    logger: Logger
): Promise<SyncResult> {
    const channel = connection.platform as PublishChannelType;
    const syncResult: SyncResult = {
        channel,
        success: true,
        itemsSynced: 0,
        errors: [],
        lastSyncTime: new Date(),
        nextSyncTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    try {
        // Get content items that need analytics sync
        const itemsToSync = await getContentItemsForSync(userId, channel, logger);

        if (itemsToSync.length === 0) {
            logger.info('No content items found to sync');
            return syncResult;
        }

        logger.info(`Found ${itemsToSync.length} items to sync`);

        // Initialize rate limiter for this channel
        const rateLimiter = new ExternalAnalyticsRateLimiter(channel);

        // Sync each content item with rate limiting and error handling
        for (const item of itemsToSync) {
            try {
                // Wait for rate limit if needed
                await rateLimiter.waitForRateLimit();

                // Fetch analytics data from external platform
                const externalData = await fetchExternalAnalyticsData(
                    channel,
                    connection.accessToken,
                    item.platformMetrics?.platformPostId,
                    logger
                );

                if (externalData) {
                    // Normalize and merge with existing data
                    const normalizedMetrics = normalizeExternalMetrics(channel, externalData);

                    // Validate and detect anomalies
                    const validationResult = validateAndDetectAnomalies(
                        item.metrics,
                        normalizedMetrics,
                        logger
                    );

                    if (validationResult.isValid) {
                        // Update analytics record
                        await updateAnalyticsWithExternalData(
                            userId,
                            item.contentId,
                            channel,
                            normalizedMetrics,
                            externalData,
                            logger
                        );

                        syncResult.itemsSynced++;
                    } else {
                        syncResult.errors.push(
                            `Validation failed for content ${item.contentId}: ${validationResult.reason}`
                        );
                    }
                }

                // Update rate limiter
                rateLimiter.recordRequest();

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                syncResult.errors.push(`Failed to sync content ${item.contentId}: ${errorMessage}`);

                // Handle rate limit errors specifically
                if (isRateLimitError(error)) {
                    const retryAfter = extractRetryAfterFromError(error);
                    rateLimiter.handleRateLimit(retryAfter);

                    // Add to queue for retry
                    await queueForRetry(userId, channel, item.contentId, retryAfter, logger);
                }
            }
        }

        // Update last sync time
        await updateLastSyncTime(userId, channel, logger);

        // Set overall success based on error rate
        const errorRate = syncResult.errors.length / itemsToSync.length;
        syncResult.success = errorRate < 0.1; // Allow up to 10% error rate

        // Store rate limit status
        syncResult.rateLimitStatus = rateLimiter.getStatus();

        return syncResult;

    } catch (error) {
        logger.error('Failed to sync connection analytics', error as Error);
        syncResult.success = false;
        syncResult.errors.push(error instanceof Error ? error.message : 'Unknown error');
        return syncResult;
    }
}

/**
 * Get content items that need analytics sync for a specific channel
 */
async function getContentItemsForSync(
    userId: string,
    channel: PublishChannelType,
    logger: Logger
): Promise<Analytics[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':skPrefix': 'ANALYTICS#'
            },
            FilterExpression: '#channel = :channel AND attribute_exists(#platformPostId) AND #platformPostId <> :empty AND #syncStatus <> :syncing',
            ExpressionAttributeNames: {
                '#channel': 'Data.channel',
                '#platformPostId': 'Data.platformMetrics.platformPostId',
                '#syncStatus': 'Data.syncStatus'
            },
            ExpressionAttributeValues: {
                ':channel': channel,
                ':empty': '',
                ':syncing': AnalyticsSyncStatus.SYNCING
            }
        });

        const response = await docClient.send(queryCommand);
        const items = response.Items || [];

        return items
            .map(item => item.Data as Analytics)
            .filter(analytics =>
                analytics.platformMetrics?.platformPostId && // Must have platform post ID
                analytics.syncStatus !== AnalyticsSyncStatus.SYNCING // Not currently syncing
            );

    } catch (error) {
        logger.error('Failed to get content items for sync', error as Error);
        return [];
    }
}

/**
 * Fetch analytics data from external platform
 */
async function fetchExternalAnalyticsData(
    channel: PublishChannelType,
    accessToken: string,
    platformPostId?: string,
    logger?: Logger
): Promise<ExternalAnalyticsData | null> {
    if (!platformPostId) {
        return null;
    }

    try {
        switch (channel) {
            case PublishChannelType.FACEBOOK:
                return await fetchFacebookInsights(accessToken, platformPostId);
            case PublishChannelType.INSTAGRAM:
                return await fetchInstagramAnalytics(accessToken, platformPostId);
            case PublishChannelType.LINKEDIN:
                return await fetchLinkedInAnalytics(accessToken, platformPostId);
            case PublishChannelType.TWITTER:
                return await fetchTwitterAnalytics(accessToken, platformPostId);
            default:
                throw new Error(`Unsupported channel: ${channel}`);
        }
    } catch (error) {
        logger?.error(`Failed to fetch ${channel} analytics`, error as Error);
        throw error;
    }
}

/**
 * Fetch Facebook Insights data
 */
async function fetchFacebookInsights(
    accessToken: string,
    postId: string
): Promise<ExternalAnalyticsData> {
    const url = `https://graph.facebook.com/v18.0/${postId}/insights`;
    const params = new URLSearchParams({
        access_token: accessToken,
        metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_reactions_haha_total,post_reactions_sorry_total,post_reactions_anger_total'
    });

    const response = await fetch(`${url}?${params}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new RateLimitError('Facebook API rate limit exceeded', response.headers.get('retry-after'));
        }
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Facebook insights format to our standard format
    const metrics: Record<string, number> = {};

    if (data.data) {
        data.data.forEach((insight: any) => {
            if (insight.values && insight.values.length > 0) {
                const value = insight.values[0].value || 0;
                switch (insight.name) {
                    case 'post_impressions':
                        metrics.impressions = value;
                        break;
                    case 'post_engaged_users':
                        metrics.engagedUsers = value;
                        break;
                    case 'post_clicks':
                        metrics.clicks = value;
                        break;
                    case 'post_reactions_like_total':
                        metrics.likes = value;
                        break;
                    default:
                        metrics[insight.name] = value;
                }
            }
        });
    }

    return {
        platform: PublishChannelType.FACEBOOK,
        postId,
        metrics,
        rawData: data,
        retrievedAt: new Date(),
    };
}

/**
 * Fetch Instagram Analytics data
 */
async function fetchInstagramAnalytics(
    accessToken: string,
    postId: string
): Promise<ExternalAnalyticsData> {
    const url = `https://graph.facebook.com/v18.0/${postId}/insights`;
    const params = new URLSearchParams({
        access_token: accessToken,
        metric: 'impressions,reach,likes,comments,saves,shares'
    });

    const response = await fetch(`${url}?${params}`, {
        signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new RateLimitError('Instagram API rate limit exceeded', response.headers.get('retry-after'));
        }
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const metrics: Record<string, number> = {};

    if (data.data) {
        data.data.forEach((insight: any) => {
            if (insight.values && insight.values.length > 0) {
                metrics[insight.name] = insight.values[0].value || 0;
            }
        });
    }

    return {
        platform: PublishChannelType.INSTAGRAM,
        postId,
        metrics,
        rawData: data,
        retrievedAt: new Date(),
    };
}

/**
 * Fetch LinkedIn Analytics data
 */
async function fetchLinkedInAnalytics(
    accessToken: string,
    postId: string
): Promise<ExternalAnalyticsData> {
    const url = `https://api.linkedin.com/v2/socialActions/${postId}/statistics`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
        },
        signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new RateLimitError('LinkedIn API rate limit exceeded', response.headers.get('retry-after'));
        }
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const metrics: Record<string, number> = {
        likes: data.numLikes || 0,
        comments: data.numComments || 0,
        shares: data.numShares || 0,
        clicks: data.numClicks || 0,
        impressions: data.numImpressions || 0,
    };

    return {
        platform: PublishChannelType.LINKEDIN,
        postId,
        metrics,
        rawData: data,
        retrievedAt: new Date(),
    };
}

/**
 * Fetch Twitter Analytics data
 */
async function fetchTwitterAnalytics(
    accessToken: string,
    postId: string
): Promise<ExternalAnalyticsData> {
    const url = `https://api.twitter.com/2/tweets/${postId}`;
    const params = new URLSearchParams({
        'tweet.fields': 'public_metrics'
    });

    const response = await fetch(`${url}?${params}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new RateLimitError('Twitter API rate limit exceeded', response.headers.get('retry-after'));
        }
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const metrics: Record<string, number> = {};

    if (data.data && data.data.public_metrics) {
        const publicMetrics = data.data.public_metrics;
        metrics.views = publicMetrics.impression_count || 0;
        metrics.likes = publicMetrics.like_count || 0;
        metrics.shares = publicMetrics.retweet_count || 0;
        metrics.comments = publicMetrics.reply_count || 0;
        metrics.clicks = publicMetrics.url_link_clicks || 0;
    }

    return {
        platform: PublishChannelType.TWITTER,
        postId,
        metrics,
        rawData: data,
        retrievedAt: new Date(),
    };
}

/**
 * Normalize external metrics to our standard format
 */
function normalizeExternalMetrics(
    channel: PublishChannelType,
    externalData: ExternalAnalyticsData
): EngagementMetrics {
    const metrics = externalData.metrics;

    // Base metrics structure
    const normalized: EngagementMetrics = {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        clicks: 0,
        saves: 0,
        engagementRate: 0,
        reach: 0,
        impressions: 0,
    };

    // Platform-specific normalization
    switch (channel) {
        case PublishChannelType.FACEBOOK:
            normalized.impressions = metrics.impressions || 0;
            normalized.likes = metrics.likes || 0;
            normalized.clicks = metrics.clicks || 0;
            normalized.views = metrics.impressions || 0; // Use impressions as views
            normalized.reach = metrics.engagedUsers || 0;
            break;

        case PublishChannelType.INSTAGRAM:
            normalized.impressions = metrics.impressions || 0;
            normalized.reach = metrics.reach || 0;
            normalized.likes = metrics.likes || 0;
            normalized.comments = metrics.comments || 0;
            normalized.saves = metrics.saves || 0;
            normalized.shares = metrics.shares || 0;
            normalized.views = metrics.impressions || 0;
            break;

        case PublishChannelType.LINKEDIN:
            normalized.likes = metrics.likes || 0;
            normalized.comments = metrics.comments || 0;
            normalized.shares = metrics.shares || 0;
            normalized.clicks = metrics.clicks || 0;
            normalized.impressions = metrics.impressions || 0;
            normalized.views = metrics.impressions || 0;
            break;

        case PublishChannelType.TWITTER:
            normalized.views = metrics.views || 0;
            normalized.likes = metrics.likes || 0;
            normalized.shares = metrics.shares || 0;
            normalized.comments = metrics.comments || 0;
            normalized.clicks = metrics.clicks || 0;
            normalized.impressions = metrics.views || 0; // Twitter uses views as impressions
            break;
    }

    // Calculate engagement rate
    const totalEngagements = normalized.likes + normalized.shares + normalized.comments + (normalized.saves || 0);
    const totalReach = normalized.reach || normalized.impressions || normalized.views;
    normalized.engagementRate = totalReach > 0 ? (totalEngagements / totalReach) * 100 : 0;

    return normalized;
}

/**
 * Validate and detect anomalies in external metrics
 */
function validateAndDetectAnomalies(
    currentMetrics: EngagementMetrics,
    newMetrics: EngagementMetrics,
    logger?: Logger
): { isValid: boolean; reason?: string } {
    // Basic validation - metrics should not decrease significantly
    const decreaseThreshold = 0.5; // Allow 50% decrease (could be data correction)

    const metricsToCheck = ['views', 'likes', 'shares', 'comments', 'clicks'] as const;

    for (const metric of metricsToCheck) {
        const current = currentMetrics[metric] || 0;
        const newValue = newMetrics[metric] || 0;

        // Check for significant decrease
        if (current > 0 && newValue < current * decreaseThreshold) {
            logger?.warn('Potential anomaly detected', {
                metric,
                currentValue: current,
                newValue,
                decreasePercent: ((current - newValue) / current) * 100
            });

            // For now, we'll log but still accept the data
            // In production, you might want to flag for manual review
        }

        // Check for unrealistic values
        if (newValue < 0) {
            return {
                isValid: false,
                reason: `Negative value for ${metric}: ${newValue}`
            };
        }

        // Check for extremely large increases (potential data error)
        const increaseThreshold = 100; // 10000% increase
        if (current > 0 && newValue > current * increaseThreshold) {
            logger?.warn('Extremely large increase detected', {
                metric,
                currentValue: current,
                newValue,
                increasePercent: ((newValue - current) / current) * 100
            });
        }
    }

    return { isValid: true };
}

/**
 * Update analytics record with external data
 */
async function updateAnalyticsWithExternalData(
    userId: string,
    contentId: string,
    channel: PublishChannelType,
    normalizedMetrics: EngagementMetrics,
    externalData: ExternalAnalyticsData,
    logger?: Logger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        // Find the analytics record to update
        const pk = `USER#${userId}`;
        const sk = `ANALYTICS#${contentId}#${channel}`;

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #data.#metrics = :metrics, #data.#lastSynced = :lastSynced, #data.#syncStatus = :syncStatus, #data.#platformMetrics.#rawData = :rawData',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#metrics': 'metrics',
                '#lastSynced': 'lastSynced',
                '#syncStatus': 'syncStatus',
                '#platformMetrics': 'platformMetrics',
                '#rawData': 'rawData'
            },
            ExpressionAttributeValues: {
                ':metrics': normalizedMetrics,
                ':lastSynced': new Date(),
                ':syncStatus': AnalyticsSyncStatus.COMPLETED,
                ':rawData': externalData.rawData
            }
        });

        await docClient.send(updateCommand);

        logger?.debug('Updated analytics record with external data', {
            contentId,
            channel,
            metricsUpdated: Object.keys(normalizedMetrics).length
        });

    } catch (error) {
        logger?.error('Failed to update analytics with external data', error as Error, {
            userId,
            contentId,
            channel
        });
        throw error;
    }
}

/**
 * Update last sync time for a user's channel
 */
async function updateLastSyncTime(
    userId: string,
    channel: PublishChannelType,
    logger?: Logger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        // Store sync timestamp in a dedicated record
        const pk = `USER#${userId}`;
        const sk = `SYNC#${channel}`;

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#updatedAt': 'UpdatedAt'
            },
            ExpressionAttributeValues: {
                ':data': {
                    userId,
                    channel,
                    lastSyncTime: new Date(),
                    syncType: 'analytics'
                },
                ':updatedAt': new Date()
            }
        });

        await docClient.send(updateCommand);

    } catch (error) {
        logger?.error('Failed to update last sync time', error as Error, {
            userId,
            channel
        });
        // Don't throw - this is not critical
    }
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
    return error instanceof RateLimitError ||
        (error instanceof Error && error.message.toLowerCase().includes('rate limit'));
}

/**
 * Extract retry after time from error
 */
function extractRetryAfterFromError(error: any): number {
    if (error instanceof RateLimitError && error.retryAfter) {
        const retryAfter = parseInt(error.retryAfter, 10);
        if (!isNaN(retryAfter)) {
            return retryAfter * 1000; // Convert seconds to milliseconds
        }
    }

    // Default retry after 15 minutes
    return 15 * 60 * 1000;
}

/**
 * Queue content for retry after rate limit
 */
async function queueForRetry(
    userId: string,
    channel: PublishChannelType,
    contentId: string,
    retryAfter: number,
    logger?: Logger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const pk = `USER#${userId}`;
        const sk = `RETRY#${channel}#${contentId}`;

        const retryRecord = {
            userId,
            channel,
            contentId,
            retryAfter: new Date(Date.now() + retryAfter),
            attempts: 1,
            createdAt: new Date(),
        };

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#updatedAt': 'UpdatedAt'
            },
            ExpressionAttributeValues: {
                ':data': retryRecord,
                ':updatedAt': new Date()
            }
        });

        await docClient.send(updateCommand);

        logger?.info('Queued content for retry', {
            contentId,
            channel,
            retryAfter: new Date(Date.now() + retryAfter)
        });

    } catch (error) {
        logger?.error('Failed to queue for retry', error as Error);
    }
}

/**
 * Health check function for monitoring
 */
export async function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
}> {
    const checks: Record<string, boolean> = {};

    try {
        // Check DynamoDB connectivity
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const testQuery = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'HEALTH_CHECK'
            },
            Limit: 1
        });

        await docClient.send(testQuery);
        checks.dynamodb = true;
    } catch (error) {
        checks.dynamodb = false;
    }

    // Check external API connectivity (simplified check)
    try {
        // Test Facebook API connectivity
        const response = await fetch('https://graph.facebook.com/v18.0/', {
            signal: AbortSignal.timeout(5000)
        });
        checks.facebookApi = response.ok;
    } catch (error) {
        checks.facebookApi = false;
    }

    try {
        // Test LinkedIn API connectivity
        const response = await fetch('https://api.linkedin.com/v2/', {
            signal: AbortSignal.timeout(5000)
        });
        checks.linkedinApi = response.status !== 500; // 401 is expected without auth
    } catch (error) {
        checks.linkedinApi = false;
    }

    try {
        // Test Twitter API connectivity
        const response = await fetch('https://api.twitter.com/2/', {
            signal: AbortSignal.timeout(5000)
        });
        checks.twitterApi = response.status !== 500; // 401 is expected without auth
    } catch (error) {
        checks.twitterApi = false;
    }

    const allHealthy = Object.values(checks).every(check => check);

    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
    };
}