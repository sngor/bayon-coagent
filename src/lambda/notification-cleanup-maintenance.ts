/**
 * Notification Cleanup and Maintenance Lambda Function
 * 
 * Performs cleanup and maintenance tasks for the notification system.
 * Validates Requirements: 6.3
 * 
 * This Lambda is triggered on a schedule to:
 * - Expire and clean up old notifications
 * - Aggregate metrics for reporting and analysis
 * - Archive old delivery records
 * - Perform database maintenance tasks
 * - Clean up orphaned records
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    ScanCommand,
    QueryCommand,
    UpdateCommand,
    BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    Notification,
    NotificationStatus,
    DeliveryRecord,
    DeliveryStatus,
    NotificationChannel,
    NotificationMetrics,
    TimeRange,
} from '@/lib/notifications/types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

// Configuration constants
const NOTIFICATION_RETENTION_DAYS = 90; // Keep notifications for 90 days
const EXPIRED_NOTIFICATION_RETENTION_DAYS = 7; // Keep expired notifications for 7 days
const DELIVERY_RECORD_RETENTION_DAYS = 30; // Keep delivery records for 30 days
const METRICS_AGGREGATION_DAYS = 1; // Aggregate metrics daily
const BATCH_SIZE = 25; // DynamoDB batch write limit

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        tasks?: CleanupTask[];
        dryRun?: boolean;
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    awsRequestId: string;
}

type CleanupTask =
    | 'expire_notifications'
    | 'cleanup_old_notifications'
    | 'cleanup_delivery_records'
    | 'aggregate_metrics'
    | 'cleanup_orphaned_records'
    | 'all';

interface CleanupResult {
    statusCode: number;
    body: string;
    results: {
        expiredNotifications: number;
        deletedNotifications: number;
        deletedDeliveryRecords: number;
        aggregatedMetrics: boolean;
        cleanedOrphanedRecords: number;
    };
    errors: string[];
}

/**
 * Lambda handler for cleanup and maintenance
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<CleanupResult> => {
    console.log('[Cleanup] Started', {
        event,
        requestId: context.awsRequestId,
    });

    const tasks = event.detail?.tasks || ['all'];
    const dryRun = event.detail?.dryRun || false;

    const results = {
        expiredNotifications: 0,
        deletedNotifications: 0,
        deletedDeliveryRecords: 0,
        aggregatedMetrics: false,
        cleanedOrphanedRecords: 0,
    };

    const errors: string[] = [];

    try {
        // Execute requested tasks
        const shouldRunAll = tasks.includes('all');

        if (shouldRunAll || tasks.includes('expire_notifications')) {
            try {
                results.expiredNotifications = await expireNotifications(dryRun);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Expire notifications failed: ${errorMessage}`);
                console.error('[Cleanup] Expire notifications failed:', error);
            }
        }

        if (shouldRunAll || tasks.includes('cleanup_old_notifications')) {
            try {
                results.deletedNotifications = await cleanupOldNotifications(dryRun);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Cleanup old notifications failed: ${errorMessage}`);
                console.error('[Cleanup] Cleanup old notifications failed:', error);
            }
        }

        if (shouldRunAll || tasks.includes('cleanup_delivery_records')) {
            try {
                results.deletedDeliveryRecords = await cleanupDeliveryRecords(dryRun);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Cleanup delivery records failed: ${errorMessage}`);
                console.error('[Cleanup] Cleanup delivery records failed:', error);
            }
        }

        if (shouldRunAll || tasks.includes('aggregate_metrics')) {
            try {
                await aggregateMetrics(dryRun);
                results.aggregatedMetrics = true;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Aggregate metrics failed: ${errorMessage}`);
                console.error('[Cleanup] Aggregate metrics failed:', error);
            }
        }

        if (shouldRunAll || tasks.includes('cleanup_orphaned_records')) {
            try {
                results.cleanedOrphanedRecords = await cleanupOrphanedRecords(dryRun);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Cleanup orphaned records failed: ${errorMessage}`);
                console.error('[Cleanup] Cleanup orphaned records failed:', error);
            }
        }

        console.log('[Cleanup] Completed', { results, errors });

        return {
            statusCode: errors.length > 0 ? 207 : 200, // 207 Multi-Status if partial success
            body: JSON.stringify({
                message: 'Cleanup completed',
                dryRun,
                results,
                errors,
            }),
            results,
            errors,
        };
    } catch (error) {
        console.error('[Cleanup] Failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Cleanup failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            results,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
};

/**
 * Expires notifications that have passed their expiration date
 * Validates Requirements: 6.3
 */
async function expireNotifications(dryRun: boolean): Promise<number> {
    console.log('[Cleanup] Expiring notifications', { dryRun });

    const now = new Date().toISOString();
    let expiredCount = 0;

    try {
        // Find notifications with expiresAt < now and status != expired
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'EntityType = :entityType AND #data.#expiresAt < :now AND #data.#status <> :expired',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#expiresAt': 'expiresAt',
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':entityType': 'Notification',
                ':now': now,
                ':expired': NotificationStatus.EXPIRED,
            },
        });

        const response = await docClient.send(command);
        const notifications = response.Items || [];

        console.log(`[Cleanup] Found ${notifications.length} expired notifications`);

        for (const item of notifications) {
            const notification = item.Data as Notification;

            if (!dryRun) {
                // Update notification status to expired
                await updateNotificationStatus(notification.id, notification.userId, NotificationStatus.EXPIRED);
            }

            expiredCount++;
        }

        console.log(`[Cleanup] Expired ${expiredCount} notifications`);
        return expiredCount;
    } catch (error) {
        console.error('[Cleanup] Failed to expire notifications:', error);
        throw error;
    }
}

/**
 * Cleans up old notifications based on retention policy
 * Validates Requirements: 6.3
 */
async function cleanupOldNotifications(dryRun: boolean): Promise<number> {
    console.log('[Cleanup] Cleaning up old notifications', { dryRun });

    const retentionCutoff = new Date(
        Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const expiredRetentionCutoff = new Date(
        Date.now() - EXPIRED_NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    let deletedCount = 0;

    try {
        // Find old notifications to delete
        // Delete expired notifications older than 7 days
        // Delete read/dismissed notifications older than 90 days
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression:
                'EntityType = :entityType AND (' +
                '(#data.#status = :expired AND #data.#updatedAt < :expiredCutoff) OR ' +
                '(#data.#status IN (:read, :dismissed) AND #data.#updatedAt < :retentionCutoff)' +
                ')',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status',
                '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues: {
                ':entityType': 'Notification',
                ':expired': NotificationStatus.EXPIRED,
                ':read': NotificationStatus.READ,
                ':dismissed': NotificationStatus.DISMISSED,
                ':expiredCutoff': expiredRetentionCutoff,
                ':retentionCutoff': retentionCutoff,
            },
        });

        const response = await docClient.send(command);
        const notifications = response.Items || [];

        console.log(`[Cleanup] Found ${notifications.length} old notifications to delete`);

        // Delete in batches
        const batches = chunkArray(notifications, BATCH_SIZE);

        for (const batch of batches) {
            if (!dryRun) {
                await deleteBatch(batch);
            }
            deletedCount += batch.length;
        }

        console.log(`[Cleanup] Deleted ${deletedCount} old notifications`);
        return deletedCount;
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup old notifications:', error);
        throw error;
    }
}

/**
 * Cleans up old delivery records based on retention policy
 * Validates Requirements: 6.3
 */
async function cleanupDeliveryRecords(dryRun: boolean): Promise<number> {
    console.log('[Cleanup] Cleaning up old delivery records', { dryRun });

    const retentionCutoff = new Date(
        Date.now() - DELIVERY_RECORD_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    let deletedCount = 0;

    try {
        // Find old delivery records to delete
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'EntityType = :entityType AND #data.#lastAttempt < :cutoff',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#lastAttempt': 'lastAttemptAt',
            },
            ExpressionAttributeValues: {
                ':entityType': 'DeliveryRecord',
                ':cutoff': retentionCutoff,
            },
        });

        const response = await docClient.send(command);
        const records = response.Items || [];

        console.log(`[Cleanup] Found ${records.length} old delivery records to delete`);

        // Delete in batches
        const batches = chunkArray(records, BATCH_SIZE);

        for (const batch of batches) {
            if (!dryRun) {
                await deleteBatch(batch);
            }
            deletedCount += batch.length;
        }

        console.log(`[Cleanup] Deleted ${deletedCount} old delivery records`);
        return deletedCount;
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup delivery records:', error);
        throw error;
    }
}

/**
 * Aggregates metrics for reporting and analysis
 * Validates Requirements: 6.3
 */
async function aggregateMetrics(dryRun: boolean): Promise<void> {
    console.log('[Cleanup] Aggregating metrics', { dryRun });

    try {
        // Calculate metrics for yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timeRange: TimeRange = {
            startDate: yesterday.toISOString(),
            endDate: today.toISOString(),
        };

        // Get all delivery records for the time range
        const deliveryRecords = await getDeliveryRecordsForTimeRange(timeRange);

        // Calculate metrics
        const metrics = calculateMetrics(deliveryRecords, timeRange);

        if (!dryRun) {
            // Store aggregated metrics
            await storeMetrics(metrics);
        }

        console.log('[Cleanup] Metrics aggregated', {
            timeRange,
            totalNotifications: metrics.totalNotifications,
        });
    } catch (error) {
        console.error('[Cleanup] Failed to aggregate metrics:', error);
        throw error;
    }
}

/**
 * Cleans up orphaned records (delivery records without notifications, etc.)
 * Validates Requirements: 6.3
 */
async function cleanupOrphanedRecords(dryRun: boolean): Promise<number> {
    console.log('[Cleanup] Cleaning up orphaned records', { dryRun });

    let cleanedCount = 0;

    try {
        // Find delivery records
        const command = new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'EntityType = :entityType',
            ExpressionAttributeValues: {
                ':entityType': 'DeliveryRecord',
            },
        });

        const response = await docClient.send(command);
        const deliveryRecords = response.Items || [];

        console.log(`[Cleanup] Checking ${deliveryRecords.length} delivery records for orphans`);

        const orphanedRecords: any[] = [];

        for (const item of deliveryRecords) {
            const record = item.Data as DeliveryRecord;

            // Check if the notification still exists
            const notificationExists = await checkNotificationExists(record.notificationId);

            if (!notificationExists) {
                orphanedRecords.push(item);
            }
        }

        console.log(`[Cleanup] Found ${orphanedRecords.length} orphaned delivery records`);

        // Delete orphaned records in batches
        const batches = chunkArray(orphanedRecords, BATCH_SIZE);

        for (const batch of batches) {
            if (!dryRun) {
                await deleteBatch(batch);
            }
            cleanedCount += batch.length;
        }

        console.log(`[Cleanup] Cleaned ${cleanedCount} orphaned records`);
        return cleanedCount;
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup orphaned records:', error);
        throw error;
    }
}

/**
 * Updates notification status
 */
async function updateNotificationStatus(
    notificationId: string,
    userId: string,
    status: NotificationStatus
): Promise<void> {
    const now = new Date().toISOString();

    // Update user's notification record
    const userCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${userId}`,
            SK: `NOTIFICATION#${now.split('T')[0]}#${notificationId}`,
        },
        UpdateExpression: 'SET #data.#status = :status, UpdatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': Date.now(),
        },
    });

    await docClient.send(userCommand);

    // Update notification metadata record
    const metadataCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `NOTIFICATION#${notificationId}`,
            SK: 'METADATA',
        },
        UpdateExpression: 'SET #data.#status = :status, UpdatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': Date.now(),
        },
    });

    await docClient.send(metadataCommand);
}

/**
 * Deletes a batch of items
 */
async function deleteBatch(items: any[]): Promise<void> {
    if (items.length === 0) return;

    const deleteRequests = items.map(item => ({
        DeleteRequest: {
            Key: {
                PK: item.PK,
                SK: item.SK,
            },
        },
    }));

    const command = new BatchWriteCommand({
        RequestItems: {
            [TABLE_NAME]: deleteRequests,
        },
    });

    await docClient.send(command);
}

/**
 * Gets delivery records for a time range
 */
async function getDeliveryRecordsForTimeRange(timeRange: TimeRange): Promise<DeliveryRecord[]> {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
            'EntityType = :entityType AND ' +
            '#data.#lastAttempt >= :startDate AND ' +
            '#data.#lastAttempt < :endDate',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#lastAttempt': 'lastAttemptAt',
        },
        ExpressionAttributeValues: {
            ':entityType': 'DeliveryRecord',
            ':startDate': timeRange.startDate,
            ':endDate': timeRange.endDate,
        },
    });

    const response = await docClient.send(command);
    return response.Items?.map(item => item.Data as DeliveryRecord) || [];
}

/**
 * Calculates metrics from delivery records
 * Validates Requirements: 6.3
 */
function calculateMetrics(records: DeliveryRecord[], timeRange: TimeRange): NotificationMetrics {
    const metrics: NotificationMetrics = {
        timeRange,
        totalNotifications: 0,
        deliveryRates: {
            [NotificationChannel.IN_APP]: { sent: 0, delivered: 0, failed: 0, rate: 0 },
            [NotificationChannel.EMAIL]: { sent: 0, delivered: 0, failed: 0, rate: 0 },
            [NotificationChannel.PUSH]: { sent: 0, delivered: 0, failed: 0, rate: 0 },
        },
        averageDeliveryTime: {
            [NotificationChannel.IN_APP]: 0,
            [NotificationChannel.EMAIL]: 0,
            [NotificationChannel.PUSH]: 0,
        },
        failureReasons: [],
    };

    // Track unique notifications
    const uniqueNotifications = new Set<string>();

    // Track delivery times for averaging
    const deliveryTimes: Record<NotificationChannel, number[]> = {
        [NotificationChannel.IN_APP]: [],
        [NotificationChannel.EMAIL]: [],
        [NotificationChannel.PUSH]: [],
    };

    // Track failure reasons
    const failureReasonCounts = new Map<string, number>();

    for (const record of records) {
        uniqueNotifications.add(record.notificationId);

        const channelMetrics = metrics.deliveryRates[record.channel];

        if (record.status === DeliveryStatus.SENT || record.status === DeliveryStatus.DELIVERED) {
            channelMetrics.sent++;
        }

        if (record.status === DeliveryStatus.DELIVERED) {
            channelMetrics.delivered++;

            // Calculate delivery time if available
            if (record.deliveredAt) {
                const deliveryTime = new Date(record.deliveredAt).getTime() -
                    new Date(record.lastAttemptAt).getTime();
                deliveryTimes[record.channel].push(deliveryTime);
            }
        }

        if (record.status === DeliveryStatus.FAILED ||
            record.status === DeliveryStatus.BOUNCED ||
            record.status === DeliveryStatus.COMPLAINED) {
            channelMetrics.failed++;

            if (record.failureReason) {
                const count = failureReasonCounts.get(record.failureReason) || 0;
                failureReasonCounts.set(record.failureReason, count + 1);
            }
        }
    }

    metrics.totalNotifications = uniqueNotifications.size;

    // Calculate delivery rates
    for (const channel of Object.values(NotificationChannel)) {
        const channelMetrics = metrics.deliveryRates[channel];
        if (channelMetrics.sent > 0) {
            channelMetrics.rate = (channelMetrics.delivered / channelMetrics.sent) * 100;
        }
    }

    // Calculate average delivery times
    for (const channel of Object.values(NotificationChannel)) {
        const times = deliveryTimes[channel];
        if (times.length > 0) {
            const sum = times.reduce((a, b) => a + b, 0);
            metrics.averageDeliveryTime[channel] = sum / times.length;
        }
    }

    // Convert failure reasons to array
    metrics.failureReasons = Array.from(failureReasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

    return metrics;
}

/**
 * Stores aggregated metrics
 */
async function storeMetrics(metrics: NotificationMetrics): Promise<void> {
    const date = metrics.timeRange.startDate.split('T')[0];

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `METRICS#${date}`,
            SK: 'NOTIFICATION_STATS',
        },
        UpdateExpression: 'SET #data = :data, UpdatedAt = :updatedAt, EntityType = :entityType',
        ExpressionAttributeNames: {
            '#data': 'Data',
        },
        ExpressionAttributeValues: {
            ':data': metrics,
            ':updatedAt': Date.now(),
            ':entityType': 'NotificationMetrics',
        },
    });

    await docClient.send(command);
}

/**
 * Checks if a notification exists
 */
async function checkNotificationExists(notificationId: string): Promise<boolean> {
    try {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `NOTIFICATION#${notificationId}`,
                ':sk': 'METADATA',
            },
            Limit: 1,
        });

        const response = await docClient.send(command);
        return (response.Items?.length || 0) > 0;
    } catch (error) {
        console.error(`[Cleanup] Error checking notification ${notificationId}:`, error);
        return false;
    }
}

/**
 * Splits an array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
