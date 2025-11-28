/**
 * Notification Retry Processor Lambda Function
 * 
 * Processes failed notification deliveries with exponential backoff retry logic.
 * Validates Requirements: 4.3, 5.4
 * 
 * This Lambda is triggered on a schedule to:
 * - Find failed notification deliveries
 * - Retry deliveries with exponential backoff
 * - Move permanently failed notifications to dead letter queue
 * - Track retry attempts and failure reasons
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
    DeliveryRecord,
    DeliveryStatus,
    NotificationChannel,
    Notification,
    NotificationPreferences,
    NotificationRecipient,
} from '@/lib/notifications/types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
const DLQ_URL = process.env.NOTIFICATION_DLQ_URL;
const MAX_RETRY_ATTEMPTS = 6;
const MAX_AGE_HOURS = 24;

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        maxAge?: number;
        maxAttempts?: number;
        channels?: NotificationChannel[];
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    awsRequestId: string;
}

interface RetryResult {
    statusCode: number;
    body: string;
    attempted: number;
    successful: number;
    failed: number;
    movedToDLQ: number;
    errors: string[];
}

/**
 * Lambda handler for retry processing
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<RetryResult> => {
    console.log('[Retry Processor] Started', {
        event,
        requestId: context.awsRequestId,
    });

    try {
        const maxAge = event.detail?.maxAge || MAX_AGE_HOURS;
        const maxAttempts = event.detail?.maxAttempts || MAX_RETRY_ATTEMPTS;
        const channels = event.detail?.channels;

        return await processFailedDeliveries(maxAge, maxAttempts, channels);
    } catch (error) {
        console.error('[Retry Processor] Failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Retry processing failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            attempted: 0,
            successful: 0,
            failed: 0,
            movedToDLQ: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
};

/**
 * Processes failed deliveries with retry logic
 */
async function processFailedDeliveries(
    maxAge: number,
    maxAttempts: number,
    channels?: NotificationChannel[]
): Promise<RetryResult> {
    console.log('[Retry Processor] Processing failed deliveries', {
        maxAge,
        maxAttempts,
        channels,
    });

    const results = {
        attempted: 0,
        successful: 0,
        failed: 0,
        movedToDLQ: 0,
        errors: [] as string[],
    };

    try {
        // Get failed delivery records
        const failedDeliveries = await getFailedDeliveries(maxAge, maxAttempts);
        console.log(`[Retry Processor] Found ${failedDeliveries.length} failed deliveries`);

        for (const delivery of failedDeliveries) {
            // Filter by channel if specified
            if (channels && !channels.includes(delivery.channel)) {
                continue;
            }

            results.attempted++;

            try {
                // Check if max attempts reached
                if (delivery.attempts >= maxAttempts) {
                    console.log(`[Retry Processor] Max attempts reached for delivery ${delivery.id}, moving to DLQ`);
                    await moveToDeadLetterQueue(delivery);
                    results.movedToDLQ++;
                    continue;
                }

                // Calculate exponential backoff delay
                const retryDelay = calculateRetryDelay(delivery.attempts);
                const lastAttemptTime = new Date(delivery.lastAttemptAt).getTime();
                const nextRetryTime = lastAttemptTime + retryDelay;

                // Check if it's time to retry
                if (Date.now() < nextRetryTime) {
                    console.log(`[Retry Processor] Too soon to retry delivery ${delivery.id}, next retry at ${new Date(nextRetryTime).toISOString()}`);
                    continue;
                }

                // Get the notification
                const notification = await getNotification(delivery.notificationId);
                if (!notification) {
                    results.errors.push(`Notification ${delivery.notificationId} not found`);
                    results.failed++;
                    continue;
                }

                // Get user preferences
                const preferences = await getUserPreferences(delivery.userId);
                if (!preferences) {
                    results.errors.push(`Preferences not found for user ${delivery.userId}`);
                    results.failed++;
                    continue;
                }

                // Get user profile for email
                const userProfile = await getUserProfile(delivery.userId);

                // Create recipient object
                const recipient: NotificationRecipient = {
                    userId: delivery.userId,
                    email: userProfile.email || preferences.channels.email.address,
                    pushSubscription: preferences.channels.push.subscription,
                    preferences,
                };

                // Attempt retry
                console.log(`[Retry Processor] Retrying delivery ${delivery.id} (attempt ${delivery.attempts + 1})`);
                const success = await retryDelivery(notification, recipient, delivery);

                if (success) {
                    results.successful++;
                    console.log(`[Retry Processor] Successfully retried delivery ${delivery.id}`);
                } else {
                    results.failed++;
                    console.log(`[Retry Processor] Retry failed for delivery ${delivery.id}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing delivery ${delivery.id}: ${errorMessage}`);
                results.failed++;
                console.error(`[Retry Processor] Error for delivery ${delivery.id}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${results.attempted} failed deliveries`,
                attempted: results.attempted,
                successful: results.successful,
                failed: results.failed,
                movedToDLQ: results.movedToDLQ,
                errors: results.errors,
            }),
            attempted: results.attempted,
            successful: results.successful,
            failed: results.failed,
            movedToDLQ: results.movedToDLQ,
            errors: results.errors,
        };
    } catch (error) {
        console.error('[Retry Processor] Failed to process deliveries:', error);
        throw error;
    }
}

/**
 * Gets failed delivery records that are eligible for retry
 */
async function getFailedDeliveries(maxAge: number, maxAttempts: number): Promise<DeliveryRecord[]> {
    const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000).toISOString();

    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'EntityType = :entityType AND #data.#status = :status AND #data.#attempts < :maxAttempts AND #data.#lastAttempt > :cutoff',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
            '#attempts': 'attempts',
            '#lastAttempt': 'lastAttemptAt',
        },
        ExpressionAttributeValues: {
            ':entityType': 'DeliveryRecord',
            ':status': DeliveryStatus.FAILED,
            ':maxAttempts': maxAttempts,
            ':cutoff': cutoffTime,
        },
    });

    const response = await docClient.send(command);
    return response.Items?.map(item => item.Data as DeliveryRecord) || [];
}

/**
 * Gets a notification by ID
 */
async function getNotification(notificationId: string): Promise<Notification | null> {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `NOTIFICATION#${notificationId}`,
            ':sk': 'METADATA',
        },
    });

    const response = await docClient.send(command);
    return response.Items?.[0]?.Data as Notification || null;
}

/**
 * Gets user notification preferences
 */
async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'NOTIFICATION_PREFERENCES',
        },
    });

    const response = await docClient.send(command);
    return response.Items?.[0]?.Data as NotificationPreferences || null;
}

/**
 * Gets user profile information
 */
async function getUserProfile(userId: string): Promise<{ email?: string }> {
    try {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'PROFILE',
            },
        });

        const response = await docClient.send(command);
        return {
            email: response.Items?.[0]?.Data?.email,
        };
    } catch (error) {
        return {};
    }
}

/**
 * Calculates retry delay using exponential backoff
 * Validates Requirements: 4.3
 * 
 * Delay schedule: 1min, 2min, 4min, 8min, 16min, 32min
 */
function calculateRetryDelay(attempts: number): number {
    const baseDelay = 60 * 1000; // 1 minute in milliseconds
    return Math.pow(2, attempts) * baseDelay;
}

/**
 * Retries a failed delivery
 */
async function retryDelivery(
    notification: Notification,
    recipient: NotificationRecipient,
    delivery: DeliveryRecord
): Promise<boolean> {
    try {
        // Update delivery record to mark as processing
        await updateDeliveryRecord(delivery, {
            status: DeliveryStatus.PROCESSING,
            attempts: delivery.attempts + 1,
        });

        // Import channel handlers dynamically to avoid circular dependencies
        const { getChannelRegistry } = await import('@/lib/notifications/channels/channel-registry');
        const channelRegistry = getChannelRegistry();

        // Get the specific channel handler
        const handler = channelRegistry.getHandler(delivery.channel);
        if (!handler) {
            throw new Error(`No handler found for channel ${delivery.channel}`);
        }

        // Check if handler can handle this notification
        if (!handler.canHandle(notification, recipient.preferences)) {
            throw new Error(`Handler cannot process notification for channel ${delivery.channel}`);
        }

        // Attempt delivery
        const result = await handler.deliver(notification, recipient);

        if (result.success) {
            // Update delivery record to mark as successful
            await updateDeliveryRecord(delivery, {
                status: DeliveryStatus.DELIVERED,
                deliveredAt: new Date().toISOString(),
                attempts: delivery.attempts + 1,
            });
            return true;
        } else {
            // Update delivery record to mark as failed again
            await updateDeliveryRecord(delivery, {
                status: DeliveryStatus.FAILED,
                failureReason: result.error || 'Retry failed',
                attempts: delivery.attempts + 1,
            });
            return false;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Update delivery record to mark as failed
        await updateDeliveryRecord(delivery, {
            status: DeliveryStatus.FAILED,
            failureReason: errorMessage,
            attempts: delivery.attempts + 1,
        });

        return false;
    }
}

/**
 * Updates a delivery record
 */
async function updateDeliveryRecord(
    delivery: DeliveryRecord,
    updates: Partial<DeliveryRecord>
): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {
        '#data': 'Data',
    };
    const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': Date.now(),
    };

    // Build update expression dynamically
    for (const [key, value] of Object.entries(updates)) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`#data.${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
    }

    updateExpressions.push('UpdatedAt = :updatedAt');

    // Update both records (by user and by notification)
    const userCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${delivery.userId}`,
            SK: `DELIVERY#${delivery.notificationId}#${delivery.channel}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(userCommand);

    const notificationCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `NOTIFICATION#${delivery.notificationId}`,
            SK: `DELIVERY#${delivery.channel}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(notificationCommand);
}

/**
 * Moves a permanently failed delivery to the dead letter queue
 */
async function moveToDeadLetterQueue(delivery: DeliveryRecord): Promise<void> {
    if (!DLQ_URL) {
        console.warn('[Retry Processor] DLQ URL not configured, skipping DLQ move');
        return;
    }

    try {
        const command = new SendMessageCommand({
            QueueUrl: DLQ_URL,
            MessageBody: JSON.stringify({
                deliveryId: delivery.id,
                notificationId: delivery.notificationId,
                userId: delivery.userId,
                channel: delivery.channel,
                attempts: delivery.attempts,
                lastAttemptAt: delivery.lastAttemptAt,
                failureReason: delivery.failureReason,
                metadata: delivery.metadata,
                movedToDLQAt: new Date().toISOString(),
            }),
            MessageAttributes: {
                DeliveryId: {
                    DataType: 'String',
                    StringValue: delivery.id,
                },
                NotificationId: {
                    DataType: 'String',
                    StringValue: delivery.notificationId,
                },
                Channel: {
                    DataType: 'String',
                    StringValue: delivery.channel,
                },
            },
        });

        await sqsClient.send(command);

        // Update delivery record to mark as moved to DLQ
        await updateDeliveryRecord(delivery, {
            status: DeliveryStatus.FAILED,
            failureReason: `Max retry attempts (${delivery.attempts}) reached, moved to DLQ`,
        });

        console.log(`[Retry Processor] Moved delivery ${delivery.id} to DLQ`);
    } catch (error) {
        console.error(`[Retry Processor] Failed to move delivery ${delivery.id} to DLQ:`, error);
        throw error;
    }
}
