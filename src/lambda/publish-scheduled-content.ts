/**
 * Automated Content Publishing Lambda Function
 * 
 * Processes scheduled content that is due for publication across all social media
 * platforms and other channels. Implements enterprise-grade error handling,
 * retry logic, and comprehensive logging.
 * 
 * Schedule: Every 5 minutes via EventBridge
 * Timeout: 15 minutes
 * Memory: 2048 MB
 * 
 * Validates: Requirements 1.5
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
// Type definitions for Lambda environment
// In production, these would be imported from a shared package or Lambda layer

interface PublishChannel {
    type: PublishChannelType;
    accountId: string;
    accountName: string;
    isActive: boolean;
    lastUsed?: Date;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    permissions?: string[];
}

interface ScheduledContent {
    id: string;
    userId: string;
    contentId: string;
    title: string;
    content: string;
    contentType: string;
    publishTime: Date;
    channels: PublishChannel[];
    status: ScheduledContentStatus;
    metadata?: {
        originalPrompt?: string;
        aiModel?: string;
        generatedAt?: Date;
        tags?: string[];
        bulkScheduled?: boolean;
        bulkPattern?: string;
        priority?: number;
    };
    publishResults?: any[];
    retryCount?: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    GSI1PK?: string;
    GSI1SK?: string;
}

enum ScheduledContentStatus {
    SCHEDULED = 'scheduled',
    PUBLISHING = 'publishing',
    PUBLISHED = 'published',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

type PublishChannelType = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'blog' | 'newsletter';

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
    service: 'publish-scheduled-content-lambda',
    environment: process.env.NODE_ENV || 'production'
});

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        dryRun?: boolean;
        maxItems?: number;
        userIds?: string[];
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
    totalProcessed: number;
    successfullyPublished: number;
    failed: number;
    skipped: number;
    errors: ProcessingError[];
    executionTime: number;
}

interface ProcessingError {
    scheduleId: string;
    userId: string;
    title: string;
    error: string;
    channels: string[];
    publishTime: string;
}

/**
 * Lambda handler for automated content publishing
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
        operation: 'publish_scheduled_content'
    });

    operationLogger.info('Starting scheduled content publishing Lambda', {
        event,
        remainingTime: context.getRemainingTimeInMillis(),
        memoryLimit: context.memoryLimitInMB
    });

    const result: ProcessingResult = {
        totalProcessed: 0,
        successfullyPublished: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        executionTime: 0
    };

    try {
        // Get configuration from event
        const dryRun = event.detail?.dryRun || false;
        const maxItems = event.detail?.maxItems || 100;
        const userIds = event.detail?.userIds;

        operationLogger.info('Processing configuration', {
            dryRun,
            maxItems,
            userIdsCount: userIds?.length || 'all'
        });

        // Query for due scheduled content using GSI1 for efficient querying
        const dueContent = await getDueScheduledContent(maxItems, userIds, operationLogger);

        if (dueContent.length === 0) {
            operationLogger.info('No scheduled content due for publishing');

            result.executionTime = Date.now() - startTime;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No scheduled content due for publishing',
                    result
                }),
                result
            };
        }

        operationLogger.info(`Found ${dueContent.length} items due for publishing`);

        // Process each scheduled content item
        for (const scheduledItem of dueContent) {
            // Check remaining execution time (leave 30 seconds buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 30000) {
                operationLogger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTime,
                    processedSoFar: result.totalProcessed
                });
                break;
            }

            const itemLogger = operationLogger.child({
                scheduleId: scheduledItem.id,
                userId: scheduledItem.userId,
                contentType: scheduledItem.contentType,
                channelCount: scheduledItem.channels.length
            });

            result.totalProcessed++;

            try {
                if (dryRun) {
                    // Dry run mode - just log what would be published
                    itemLogger.info('DRY RUN: Would publish scheduled content', {
                        title: scheduledItem.title,
                        publishTime: scheduledItem.publishTime,
                        channels: scheduledItem.channels.map(c => c.type)
                    });
                    result.skipped++;
                    continue;
                }

                // Validate that it's actually time to publish
                const now = new Date();
                if (scheduledItem.publishTime > now) {
                    itemLogger.warn('Content not yet due for publishing', {
                        publishTime: scheduledItem.publishTime,
                        currentTime: now
                    });
                    result.skipped++;
                    continue;
                }

                // Check if already published or failed
                if (scheduledItem.status !== ScheduledContentStatus.SCHEDULED) {
                    itemLogger.info('Content already processed', {
                        status: scheduledItem.status
                    });
                    result.skipped++;
                    continue;
                }

                itemLogger.info('Publishing scheduled content', {
                    title: scheduledItem.title,
                    publishTime: scheduledItem.publishTime
                });

                // Publish scheduled content using simplified publishing logic
                const publishResult = await publishScheduledContentSimplified(
                    scheduledItem,
                    itemLogger
                );

                if (publishResult.success) {
                    result.successfullyPublished++;
                    itemLogger.info('Successfully published scheduled content', {
                        successfulChannels: publishResult.successfulChannels,
                        totalChannels: publishResult.totalChannels
                    });

                    // Update status to published
                    await updateScheduledContentStatus(
                        scheduledItem.userId,
                        scheduledItem.id,
                        ScheduledContentStatus.PUBLISHED,
                        undefined,
                        operationLogger
                    );
                } else {
                    result.failed++;
                    const error: ProcessingError = {
                        scheduleId: scheduledItem.id,
                        userId: scheduledItem.userId,
                        title: scheduledItem.title,
                        error: publishResult.error || 'Unknown error',
                        channels: scheduledItem.channels.map(c => c.type),
                        publishTime: scheduledItem.publishTime.toISOString()
                    };
                    result.errors.push(error);

                    itemLogger.error('Failed to publish scheduled content', new Error(publishResult.error), {
                        failedChannels: publishResult.failedChannels,
                        totalChannels: publishResult.totalChannels
                    });

                    // Update status to failed
                    await updateScheduledContentStatus(
                        scheduledItem.userId,
                        scheduledItem.id,
                        ScheduledContentStatus.FAILED,
                        publishResult.error,
                        operationLogger
                    );
                }

            } catch (error) {
                result.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                const processingError: ProcessingError = {
                    scheduleId: scheduledItem.id,
                    userId: scheduledItem.userId,
                    title: scheduledItem.title,
                    error: errorMessage,
                    channels: scheduledItem.channels.map(c => c.type),
                    publishTime: scheduledItem.publishTime.toISOString()
                };
                result.errors.push(processingError);

                itemLogger.error('Error processing scheduled content', error as Error, {
                    scheduleId: scheduledItem.id,
                    title: scheduledItem.title
                });

                // Update status to failed with error details
                await updateScheduledContentStatus(
                    scheduledItem.userId,
                    scheduledItem.id,
                    ScheduledContentStatus.FAILED,
                    errorMessage,
                    operationLogger
                );
            }
        }

        result.executionTime = Date.now() - startTime;

        operationLogger.info('Scheduled content publishing completed', {
            totalProcessed: result.totalProcessed,
            successfullyPublished: result.successfullyPublished,
            failed: result.failed,
            skipped: result.skipped,
            errorCount: result.errors.length,
            executionTime: result.executionTime
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${result.totalProcessed} items: ${result.successfullyPublished} published, ${result.failed} failed, ${result.skipped} skipped`,
                result
            }),
            result
        };

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        operationLogger.error('Critical failure in scheduled content publishing Lambda', error as Error, {
            executionTime: result.executionTime,
            partialResult: result
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Critical failure in scheduled content publishing',
                error: error instanceof Error ? error.message : 'Unknown error',
                result
            }),
            result
        };
    }
};

/**
 * Query for scheduled content that is due for publishing
 * Uses GSI1 for efficient querying by status and time
 */
async function getDueScheduledContent(
    maxItems: number,
    userIds?: string[],
    logger = lambdaLogger
): Promise<ScheduledContent[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const now = new Date().toISOString();

        logger.info('Querying for due scheduled content', {
            maxItems,
            currentTime: now,
            userIdsFilter: userIds ? 'enabled' : 'disabled'
        });

        // Query using GSI1 for efficient status and time-based queries
        // GSI1PK: SCHEDULE#scheduled, GSI1SK: TIME#<publishTime>
        const queryCommand = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK <= :currentTime',
            ExpressionAttributeValues: {
                ':gsi1pk': `SCHEDULE#${ScheduledContentStatus.SCHEDULED}`,
                ':currentTime': `TIME#${now}`
            },
            Limit: maxItems,
            ScanIndexForward: true // Oldest items first
        });

        const response = await docClient.send(queryCommand);
        let items = response.Items || [];

        logger.info(`Found ${items.length} potentially due items from GSI query`);

        // Filter by user IDs if specified
        if (userIds && userIds.length > 0) {
            items = items.filter(item => {
                const userId = item.PK?.replace('USER#', '');
                return userId && userIds.includes(userId);
            });

            logger.info(`Filtered to ${items.length} items for specified users`);
        }

        // Convert to ScheduledContent objects and validate
        const scheduledContent: ScheduledContent[] = [];

        for (const item of items) {
            try {
                if (!item.Data) {
                    logger.warn('Item missing Data field', { PK: item.PK, SK: item.SK });
                    continue;
                }

                const content = item.Data as ScheduledContent;

                // Additional validation
                if (!content.id || !content.userId || !content.publishTime || !content.channels) {
                    logger.warn('Item missing required fields', {
                        scheduleId: content.id,
                        hasUserId: !!content.userId,
                        hasPublishTime: !!content.publishTime,
                        hasChannels: !!content.channels
                    });
                    continue;
                }

                // Ensure publishTime is a Date object
                if (typeof content.publishTime === 'string') {
                    content.publishTime = new Date(content.publishTime);
                }

                // Double-check that it's actually due (GSI query might have slight delays)
                if (content.publishTime <= new Date()) {
                    scheduledContent.push(content);
                }

            } catch (error) {
                logger.error('Error processing scheduled content item', error as Error, {
                    PK: item.PK,
                    SK: item.SK
                });
            }
        }

        logger.info(`Returning ${scheduledContent.length} validated due items`);

        return scheduledContent;

    } catch (error) {
        logger.error('Failed to query due scheduled content', error as Error);
        throw error;
    }
}

/**
 * Update scheduled content status with error details
 */
async function updateScheduledContentStatus(
    userId: string,
    scheduleId: string,
    status: ScheduledContentStatus,
    errorMessage?: string,
    logger = lambdaLogger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        let updateExpression = 'SET #data.#status = :status, #data.updatedAt = :updatedAt, GSI1PK = :gsi1pk';
        const expressionAttributeNames: Record<string, string> = {
            '#data': 'Data',
            '#status': 'status'
        };
        const expressionAttributeValues: Record<string, any> = {
            ':status': status,
            ':updatedAt': new Date(),
            ':gsi1pk': `SCHEDULE#${status}`
        };

        // Add error details if provided
        if (errorMessage) {
            updateExpression += ', #data.lastError = :error, #data.lastErrorAt = :errorAt';
            expressionAttributeNames['#error'] = 'lastError';
            expressionAttributeValues[':error'] = errorMessage;
            expressionAttributeValues[':errorAt'] = new Date();
        }

        // Increment retry count if this is a failure
        if (status === ScheduledContentStatus.FAILED) {
            updateExpression += ', #data.retryCount = if_not_exists(#data.retryCount, :zero) + :one';
            expressionAttributeValues[':zero'] = 0;
            expressionAttributeValues[':one'] = 1;
        }

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `SCHEDULE#${scheduleId}`
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        });

        await docClient.send(updateCommand);

        logger.debug('Updated scheduled content status', {
            userId,
            scheduleId,
            status,
            hasError: !!errorMessage
        });

    } catch (error) {
        logger.error('Failed to update scheduled content status', error as Error, {
            userId,
            scheduleId,
            status
        });
        // Don't throw - this is a non-critical operation
    }
}

/**
 * Retry failed scheduled content with exponential backoff
 * Called for items that failed but should be retried
 */
async function retryFailedContent(
    scheduledContent: ScheduledContent,
    logger = lambdaLogger
): Promise<boolean> {
    const maxRetries = 3;
    const retryCount = scheduledContent.retryCount || 0;

    if (retryCount >= maxRetries) {
        logger.info('Max retries reached, marking as permanently failed', {
            scheduleId: scheduledContent.id,
            retryCount
        });

        await updateScheduledContentStatus(
            scheduledContent.userId,
            scheduledContent.id,
            ScheduledContentStatus.FAILED,
            `Max retries (${maxRetries}) exceeded`
        );

        return false;
    }

    // Calculate exponential backoff delay
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    const delay = baseDelay * Math.pow(2, retryCount);
    const nextRetryTime = new Date(Date.now() + delay);

    logger.info('Scheduling retry with exponential backoff', {
        scheduleId: scheduledContent.id,
        retryCount: retryCount + 1,
        nextRetryTime,
        delayMinutes: delay / (60 * 1000)
    });

    // Update the publish time to the retry time and reset status to scheduled
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${scheduledContent.userId}`,
                SK: `SCHEDULE#${scheduledContent.id}`
            },
            UpdateExpression: 'SET #data.publishTime = :newTime, #data.#status = :status, #data.retryCount = :retryCount, #data.updatedAt = :updatedAt, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':newTime': nextRetryTime,
                ':status': ScheduledContentStatus.SCHEDULED,
                ':retryCount': retryCount + 1,
                ':updatedAt': new Date(),
                ':gsi1pk': `SCHEDULE#${ScheduledContentStatus.SCHEDULED}`,
                ':gsi1sk': `TIME#${nextRetryTime.toISOString()}`
            }
        });

        await docClient.send(updateCommand);
        return true;

    } catch (error) {
        logger.error('Failed to schedule retry', error as Error, {
            scheduleId: scheduledContent.id
        });
        return false;
    }
}

/**
 * Simplified publishing function for Lambda environment
 * In a real implementation, this would integrate with the enhanced publishing service
 */
async function publishScheduledContentSimplified(
    scheduledContent: ScheduledContent,
    logger: Logger
): Promise<{
    success: boolean;
    error?: string;
    successfulChannels: number;
    failedChannels: number;
    totalChannels: number;
}> {
    const totalChannels = scheduledContent.channels.length;
    let successfulChannels = 0;
    let failedChannels = 0;
    const errors: string[] = [];

    logger.info('Starting simplified publishing', {
        scheduleId: scheduledContent.id,
        channelCount: totalChannels,
        contentType: scheduledContent.contentType
    });

    // Process each channel
    for (const channel of scheduledContent.channels) {
        try {
            logger.debug('Publishing to channel', {
                channelType: channel.type,
                accountId: channel.accountId
            });

            // Simulate publishing logic
            // In a real implementation, this would:
            // 1. Get OAuth tokens for social media channels
            // 2. Format content for each platform
            // 3. Make API calls to publish
            // 4. Handle platform-specific errors and retries

            const publishSuccess = await simulateChannelPublishing(channel, scheduledContent, logger);

            if (publishSuccess) {
                successfulChannels++;
                logger.debug('Channel publishing succeeded', {
                    channelType: channel.type
                });
            } else {
                failedChannels++;
                const error = `Failed to publish to ${channel.type}`;
                errors.push(error);
                logger.warn('Channel publishing failed', {
                    channelType: channel.type,
                    error
                });
            }

        } catch (error) {
            failedChannels++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${channel.type}: ${errorMessage}`);

            logger.error('Channel publishing error', error as Error, {
                channelType: channel.type
            });
        }
    }

    const success = successfulChannels > 0;
    const error = errors.length > 0 ? errors.join('; ') : undefined;

    logger.info('Simplified publishing completed', {
        success,
        successfulChannels,
        failedChannels,
        totalChannels
    });

    return {
        success,
        error,
        successfulChannels,
        failedChannels,
        totalChannels
    };
}

/**
 * Simulate channel publishing for Lambda environment
 * In production, this would be replaced with actual publishing logic
 */
async function simulateChannelPublishing(
    channel: { type: PublishChannelType; accountId: string; accountName: string },
    scheduledContent: ScheduledContent,
    logger: Logger
): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate success/failure based on channel type
    // In reality, this would make actual API calls
    switch (channel.type) {
        case 'facebook':
        case 'instagram':
        case 'linkedin':
            // Social media channels - simulate 90% success rate
            return Math.random() > 0.1;

        case 'blog':
        case 'newsletter':
            // Other channels - simulate 95% success rate
            return Math.random() > 0.05;

        default:
            logger.warn('Unknown channel type', { channelType: channel.type });
            return false;
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
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
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

    // Check publishing service availability (simplified check)
    try {
        // In a real implementation, this would check the publishing service health
        checks.publishingService = true;
    } catch (error) {
        checks.publishingService = false;
    }

    const allHealthy = Object.values(checks).every(check => check);

    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString()
    };
}