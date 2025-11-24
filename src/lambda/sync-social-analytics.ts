/**
 * Social Analytics Synchronization Lambda Function
 * 
 * Automatically syncs analytics data from connected social media platforms
 * including Facebook Insights, LinkedIn Analytics, and Twitter Analytics.
 * Implements sophisticated rate limiting, error handling, and data validation.
 * 
 * Schedule: Daily at 2 AM UTC via EventBridge
 * Timeout: 15 minutes
 * Memory: 2048 MB
 * 
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
// OAuth and types will be imported dynamically in Lambda environment
import type { Platform, OAuthConnection } from '../integrations/social/types';
import {
    PublishChannelType,
    AnalyticsSyncStatus,
    EngagementMetrics,
    Analytics
} from '../lib/content-workflow-types';

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
        console.log(JSON.stringify({
            level: 'INFO',
            message,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    warn: (message: string, context?: any) => {
        console.warn(JSON.stringify({
            level: 'WARN',
            message,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    error: (message: string, error?: Error, context?: any) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    debug: (message: string, context?: any) => {
        console.log(JSON.stringify({
            level: 'DEBUG',
            message,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    child: (context: any) => createSimpleLogger({ ...defaultContext, ...context })
});

// Initialize logger with Lambda context
const lambdaLogger = createSimpleLogger({
    service: 'sync-social-analytics-lambda',
    environment: process.env.NODE_ENV || 'production',
    version: process.env.LAMBDA_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'us-east-1'
});

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        dryRun?: boolean;
        maxUsers?: number;
        userIds?: string[];
        platforms?: Platform[];
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

interface SyncResult {
    totalUsers: number;
    totalConnections: number;
    successfulSyncs: number;
    failedSyncs: number;
    skippedSyncs: number;
    rateLimitedSyncs: number;
    errors: SyncError[];
    executionTime: number;
    platformStats: Record<Platform, {
        connections: number;
        synced: number;
        failed: number;
        rateLimited: number;
    }>;
}

interface SyncError {
    userId: string;
    platform: Platform;
    error: string;
    retryable: boolean;
    retryAfter?: Date;
}

interface UserConnection {
    userId: string;
    platform: Platform;
    connection: OAuthConnection;
    lastSyncTime?: Date;
    needsSync: boolean;
}

/**
 * Lambda handler for social analytics synchronization
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<{
    statusCode: number;
    body: string;
    result: SyncResult;
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

    const result: SyncResult = {
        totalUsers: 0,
        totalConnections: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        skippedSyncs: 0,
        rateLimitedSyncs: 0,
        errors: [],
        executionTime: 0,
        platformStats: {
            facebook: { connections: 0, synced: 0, failed: 0, rateLimited: 0 },
            instagram: { connections: 0, synced: 0, failed: 0, rateLimited: 0 },
            linkedin: { connections: 0, synced: 0, failed: 0, rateLimited: 0 },
            twitter: { connections: 0, synced: 0, failed: 0, rateLimited: 0 }
        }
    };

    try {
        // Get configuration from event
        const dryRun = event.detail?.dryRun || false;
        const maxUsers = event.detail?.maxUsers || 1000;
        const userIds = event.detail?.userIds;
        const platforms = event.detail?.platforms || ['facebook', 'instagram', 'linkedin', 'twitter'];
        const forceSync = event.detail?.forceSync || false;

        operationLogger.info('Processing configuration', {
            dryRun,
            maxUsers,
            userIdsCount: userIds?.length || 'all',
            platforms,
            forceSync
        });

        // Get all active social media connections with health validation
        const activeConnections = await getActiveSocialConnections(
            maxUsers,
            userIds,
            platforms,
            operationLogger
        );

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

        result.totalConnections = activeConnections.length;
        result.totalUsers = new Set(activeConnections.map(c => c.userId)).size;

        operationLogger.info(`Found ${activeConnections.length} active connections for ${result.totalUsers} users`);

        // Filter connections that need syncing (unless forced)
        const connectionsToSync = forceSync
            ? activeConnections
            : activeConnections.filter(conn => conn.needsSync);

        if (connectionsToSync.length === 0) {
            operationLogger.info('No connections need syncing at this time');
            result.skippedSyncs = activeConnections.length;
            result.executionTime = Date.now() - startTime;
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No connections need syncing',
                    result
                }),
                result
            };
        }

        operationLogger.info(`Processing ${connectionsToSync.length} connections that need syncing`);

        // Process each connection with comprehensive error handling
        for (const userConnection of connectionsToSync) {
            // Check remaining execution time (leave 60 seconds buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 60000) {
                operationLogger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTime,
                    processedSoFar: result.successfulSyncs + result.failedSyncs
                });
                break;
            }

            const connectionLogger = operationLogger.child({
                userId: userConnection.userId,
                platform: userConnection.platform,
                accountId: userConnection.connection.platformUserId
            });

            // Update platform stats
            result.platformStats[userConnection.platform].connections++;

            try {
                if (dryRun) {
                    // Dry run mode - just log what would be synced
                    connectionLogger.info('DRY RUN: Would sync analytics for connection', {
                        platformUsername: userConnection.connection.platformUsername,
                        lastSyncTime: userConnection.lastSyncTime?.toISOString(),
                        connectionHealth: userConnection.connection.expiresAt > Date.now() ? 'healthy' : 'expired'
                    });
                    result.skippedSyncs++;
                    continue;
                }

                connectionLogger.info('Starting analytics sync for connection', {
                    platformUsername: userConnection.connection.platformUsername,
                    lastSyncTime: userConnection.lastSyncTime?.toISOString()
                });

                // Perform the analytics sync using the analytics service
                const { syncExternalAnalytics } = await import('../services/analytics-service');
                const syncResult = await syncExternalAnalytics({
                    userId: userConnection.userId,
                    channel: mapPlatformToChannelType(userConnection.platform),
                    forceSync: true // Force sync since we already filtered
                });

                if (syncResult.success && syncResult.data) {
                    result.successfulSyncs++;
                    result.platformStats[userConnection.platform].synced++;

                    connectionLogger.info('Successfully synced analytics', {
                        itemsSynced: syncResult.data.itemsSynced,
                        errors: syncResult.data.errors?.length || 0,
                        nextSyncTime: syncResult.data.nextSyncTime?.toISOString()
                    });

                    // Update connection usage timestamp
                    await updateConnectionUsage(userConnection.userId, userConnection.platform, connectionLogger);

                } else {
                    result.failedSyncs++;
                    result.platformStats[userConnection.platform].failed++;

                    const error: SyncError = {
                        userId: userConnection.userId,
                        platform: userConnection.platform,
                        error: syncResult.error || 'Unknown sync error',
                        retryable: true
                    };
                    result.errors.push(error);

                    connectionLogger.error('Analytics sync failed', new Error(syncResult.error), {
                        syncMessage: syncResult.message
                    });
                }

            } catch (error) {
                result.failedSyncs++;
                result.platformStats[userConnection.platform].failed++;

                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const isRateLimited = isRateLimitError(error);

                if (isRateLimited) {
                    result.rateLimitedSyncs++;
                    result.platformStats[userConnection.platform].rateLimited++;
                }

                const syncError: SyncError = {
                    userId: userConnection.userId,
                    platform: userConnection.platform,
                    error: errorMessage,
                    retryable: !errorMessage.includes('token') && !errorMessage.includes('auth'),
                    retryAfter: isRateLimited ? extractRetryAfterFromError(error) : undefined
                };
                result.errors.push(syncError);

                connectionLogger.error('Error syncing analytics for connection', error as Error, {
                    isRateLimited,
                    retryable: syncError.retryable
                });

                // Handle rate limiting by scheduling retry
                if (isRateLimited && syncError.retryAfter) {
                    await scheduleRetryForRateLimit(
                        userConnection.userId,
                        userConnection.platform,
                        syncError.retryAfter,
                        connectionLogger
                    );
                }
            }
        }

        result.executionTime = Date.now() - startTime;

        operationLogger.info('Social analytics synchronization completed', {
            totalUsers: result.totalUsers,
            totalConnections: result.totalConnections,
            successfulSyncs: result.successfulSyncs,
            failedSyncs: result.failedSyncs,
            skippedSyncs: result.skippedSyncs,
            rateLimitedSyncs: result.rateLimitedSyncs,
            errorCount: result.errors.length,
            executionTime: result.executionTime,
            platformStats: result.platformStats
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${result.totalConnections} connections: ${result.successfulSyncs} synced, ${result.failedSyncs} failed, ${result.skippedSyncs} skipped`,
                result
            }),
            result
        };

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        operationLogger.error('Critical failure in social analytics sync Lambda', error as Error, {
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
 * Get all active social media connections with connection health validation
 */
async function getActiveSocialConnections(
    maxUsers: number,
    userIds?: string[],
    platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'],
    logger = lambdaLogger
): Promise<UserConnection[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const activeConnections: UserConnection[] = [];

        logger.info('Querying for active social media connections', {
            maxUsers,
            userIdsFilter: userIds ? 'enabled' : 'disabled',
            platforms
        });

        // Get OAuth connection manager
        const { getOAuthConnectionManager } = await import('../integrations/oauth/connection-manager');
        const manager = getOAuthConnectionManager();

        // If specific user IDs are provided, query them directly
        if (userIds && userIds.length > 0) {
            for (const userId of userIds.slice(0, maxUsers)) {
                for (const platform of platforms) {
                    try {
                        const connection = await manager.getConnection(userId, platform);

                        if (connection && isConnectionHealthy(connection)) {
                            const lastSyncTime = await getLastSyncTime(userId, platform);
                            const needsSync = shouldSync(lastSyncTime);

                            activeConnections.push({
                                userId,
                                platform,
                                connection,
                                lastSyncTime,
                                needsSync
                            });
                        }
                    } catch (error) {
                        logger.warn('Failed to get connection for user', {
                            userId,
                            platform,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
            }
        } else {
            // Query all users with OAuth connections
            // This is a simplified approach - in production, you might want to use GSI or maintain a separate index
            const queryCommand = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': 'OAUTH_CONNECTIONS'
                },
                Limit: maxUsers * platforms.length
            });

            const response = await docClient.send(queryCommand);
            const items = response.Items || [];

            for (const item of items) {
                try {
                    const userId = item.PK?.replace('USER#', '');
                    const platform = item.SK?.replace('OAUTH#', '') as Platform;

                    if (!userId || !platforms.includes(platform)) {
                        continue;
                    }

                    const connection = await manager.getConnection(userId, platform);

                    if (connection && isConnectionHealthy(connection)) {
                        const lastSyncTime = await getLastSyncTime(userId, platform);
                        const needsSync = shouldSync(lastSyncTime);

                        activeConnections.push({
                            userId,
                            platform,
                            connection,
                            lastSyncTime,
                            needsSync
                        });
                    }
                } catch (error) {
                    logger.warn('Failed to process connection item', {
                        PK: item.PK,
                        SK: item.SK,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        }

        logger.info(`Found ${activeConnections.length} active connections`);
        return activeConnections;

    } catch (error) {
        logger.error('Failed to get active social connections', error as Error);
        throw error;
    }
}

/**
 * Check if OAuth connection is healthy and valid
 */
function isConnectionHealthy(connection: OAuthConnection): boolean {
    // Check if token is not expired (with 1 hour buffer)
    const bufferTime = 60 * 60 * 1000; // 1 hour
    const isNotExpired = connection.expiresAt > Date.now() + bufferTime;

    // Check if connection has required scopes for analytics
    const hasAnalyticsScopes = connection.scope &&
        connection.scope.some(scope =>
            scope.includes('insights') ||
            scope.includes('analytics') ||
            scope.includes('read_insights')
        );

    return isNotExpired && hasAnalyticsScopes;
}

/**
 * Get last sync time for a user and platform
 */
async function getLastSyncTime(userId: string, platform: Platform): Promise<Date | undefined> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': `ANALYTICS_SYNC#${platform}`
            },
            ScanIndexForward: false,
            Limit: 1
        });

        const response = await docClient.send(queryCommand);
        const item = response.Items?.[0];

        return item?.Data?.lastSyncTime ? new Date(item.Data.lastSyncTime) : undefined;
    } catch (error) {
        // If we can't get last sync time, assume it needs sync
        return undefined;
    }
}

/**
 * Determine if a connection needs syncing based on last sync time
 */
function shouldSync(lastSyncTime?: Date): boolean {
    if (!lastSyncTime) {
        return true; // Never synced before
    }

    const syncInterval = 24 * 60 * 60 * 1000; // 24 hours
    const timeSinceLastSync = Date.now() - lastSyncTime.getTime();

    return timeSinceLastSync >= syncInterval;
}

/**
 * Map platform to channel type for analytics service
 */
function mapPlatformToChannelType(platform: Platform): PublishChannelType {
    const mapping: Record<Platform, PublishChannelType> = {
        facebook: PublishChannelType.FACEBOOK,
        instagram: PublishChannelType.INSTAGRAM,
        linkedin: PublishChannelType.LINKEDIN,
        twitter: PublishChannelType.TWITTER
    };

    return mapping[platform];
}

/**
 * Update connection usage timestamp
 */
async function updateConnectionUsage(
    userId: string,
    platform: Platform,
    logger: Logger
): Promise<void> {
    try {
        const { getOAuthConnectionManager } = await import('../integrations/oauth/connection-manager');
        const manager = getOAuthConnectionManager();
        await manager.updateConnectionMetadata(userId, platform, {
            lastUsed: Date.now(),
            lastAnalyticsSync: Date.now()
        });

        logger.debug('Updated connection usage timestamp', {
            userId,
            platform
        });
    } catch (error) {
        logger.error('Failed to update connection usage', error as Error, {
            userId,
            platform
        });
        // Don't throw - this is a non-critical operation
    }
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorCode === 'rate_limit_exceeded' ||
        errorCode === '429';
}

/**
 * Extract retry-after time from rate limit error
 */
function extractRetryAfterFromError(error: any): Date | undefined {
    try {
        // Check for Retry-After header value
        if (error.retryAfter) {
            const retryAfterSeconds = parseInt(error.retryAfter);
            if (!isNaN(retryAfterSeconds)) {
                return new Date(Date.now() + retryAfterSeconds * 1000);
            }
        }

        // Check for rate limit reset time in error message
        const resetTimeMatch = error.message?.match(/reset.*?(\d{10,13})/i);
        if (resetTimeMatch) {
            const resetTime = parseInt(resetTimeMatch[1]);
            return new Date(resetTime < 10000000000 ? resetTime * 1000 : resetTime);
        }

        // Default to 1 hour if we can't determine specific time
        return new Date(Date.now() + 60 * 60 * 1000);
    } catch {
        return new Date(Date.now() + 60 * 60 * 1000);
    }
}

/**
 * Schedule retry for rate-limited sync
 */
async function scheduleRetryForRateLimit(
    userId: string,
    platform: Platform,
    retryAfter: Date,
    logger: Logger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `ANALYTICS_SYNC#${platform}#RETRY`
            },
            UpdateExpression: 'SET #data = :data',
            ExpressionAttributeNames: {
                '#data': 'Data'
            },
            ExpressionAttributeValues: {
                ':data': {
                    userId,
                    platform,
                    retryAfter: retryAfter.toISOString(),
                    scheduledAt: new Date().toISOString(),
                    reason: 'rate_limit',
                    attempts: 1
                }
            }
        });

        await docClient.send(updateCommand);

        logger.info('Scheduled retry for rate-limited sync', {
            userId,
            platform,
            retryAfter: retryAfter.toISOString(),
            delayMinutes: Math.round((retryAfter.getTime() - Date.now()) / (60 * 1000))
        });

    } catch (error) {
        logger.error('Failed to schedule retry for rate limit', error as Error, {
            userId,
            platform
        });
    }
}

/**
 * Health check function for monitoring
 */
export async function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: Record<string, number>;
    timestamp: string;
}> {
    const checks: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};
    const startTime = Date.now();

    try {
        // Check DynamoDB connectivity
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const dbStartTime = Date.now();

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
        metrics.dynamodbLatencyMs = Date.now() - dbStartTime;
    } catch (error) {
        checks.dynamodb = false;
        metrics.dynamodbLatencyMs = -1;
        lambdaLogger.error('DynamoDB health check failed', error as Error);
    }

    try {
        // Check OAuth connection manager availability
        const oauthStartTime = Date.now();
        const { getOAuthConnectionManager } = await import('../integrations/oauth/connection-manager');
        const manager = getOAuthConnectionManager();
        checks.oauthManager = !!manager;
        metrics.oauthManagerLatencyMs = Date.now() - oauthStartTime;
    } catch (error) {
        checks.oauthManager = false;
        metrics.oauthManagerLatencyMs = -1;
        lambdaLogger.error('OAuth manager health check failed', error as Error);
    }

    try {
        // Check analytics service availability
        const analyticsStartTime = Date.now();
        // Test import of analytics service
        await import('../services/analytics-service');
        checks.analyticsService = true;
        metrics.analyticsServiceLatencyMs = Date.now() - analyticsStartTime;
    } catch (error) {
        checks.analyticsService = false;
        metrics.analyticsServiceLatencyMs = -1;
        lambdaLogger.error('Analytics service health check failed', error as Error);
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    metrics.memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    metrics.memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    checks.memoryHealthy = metrics.memoryUsedMB < 1800; // Alert if using > 1.8GB

    const allHealthy = Object.values(checks).every(check => check);
    metrics.totalHealthCheckMs = Date.now() - startTime;

    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        metrics,
        timestamp: new Date().toISOString()
    };
}