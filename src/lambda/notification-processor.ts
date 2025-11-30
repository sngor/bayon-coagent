/**
 * Notification Processor Lambda Function
 * 
 * Processes notification queues and sends digest emails for Market Intelligence Alerts.
 * Handles both scheduled digest generation and queued real-time notifications.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { notificationService } from '../lib/alerts/notification-service';
import { NotificationJob, NotificationPreferences } from '../lib/alerts/notification-types';
import { invokeIntegrationService, invokeBackgroundService } from './utils/request-signer';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        type: 'daily-digest' | 'weekly-digest' | 'process-queue';
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

/**
 * Lambda handler for notification processing
 */
export const handler = async (event: LambdaEvent, context: LambdaContext) => {
    console.log('Notification processor started', { event, context: context.functionName });

    try {
        const eventType = event.detail?.type || 'process-queue';

        switch (eventType) {
            case 'daily-digest':
                return await processDailyDigests(event.detail?.userIds);

            case 'weekly-digest':
                return await processWeeklyDigests(event.detail?.userIds);

            case 'process-queue':
            default:
                return await processNotificationQueue();
        }
    } catch (error) {
        console.error('Notification processor failed:', error);
        throw error;
    }
};

/**
 * Processes daily digest generation for all users or specified users
 */
async function processDailyDigests(userIds?: string[]): Promise<{
    statusCode: number;
    body: string;
    processed: number;
    errors: string[];
}> {
    console.log('Processing daily digests', { userIds });

    const results = {
        processed: 0,
        errors: [] as string[],
    };

    try {
        // Get users who have daily digest enabled
        const users = userIds ? userIds : await getUsersWithDailyDigest();

        console.log(`Found ${users.length} users for daily digest`);

        for (const userId of users) {
            try {
                const result = await notificationService.sendDailyDigest(userId);

                if (result.success) {
                    results.processed++;
                    console.log(`Daily digest sent to user ${userId}: ${result.emailsSent} emails`);
                } else {
                    results.errors.push(`Failed to send daily digest to user ${userId}: ${result.errors.join(', ')}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing daily digest for user ${userId}: ${errorMessage}`);
                console.error(`Error processing daily digest for user ${userId}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed daily digests for ${results.processed} users`,
                processed: results.processed,
                errors: results.errors,
            }),
            processed: results.processed,
            errors: results.errors,
        };
    } catch (error) {
        console.error('Failed to process daily digests:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to process daily digests',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            processed: results.processed,
            errors: results.errors,
        };
    }
}

/**
 * Processes weekly digest generation for all users or specified users
 */
async function processWeeklyDigests(userIds?: string[]): Promise<{
    statusCode: number;
    body: string;
    processed: number;
    errors: string[];
}> {
    console.log('Processing weekly digests', { userIds });

    const results = {
        processed: 0,
        errors: [] as string[],
    };

    try {
        // Get users who have weekly digest enabled
        const users = userIds ? userIds : await getUsersWithWeeklyDigest();

        console.log(`Found ${users.length} users for weekly digest`);

        for (const userId of users) {
            try {
                const result = await notificationService.sendWeeklyDigest(userId);

                if (result.success) {
                    results.processed++;
                    console.log(`Weekly digest sent to user ${userId}: ${result.emailsSent} emails`);
                } else {
                    results.errors.push(`Failed to send weekly digest to user ${userId}: ${result.errors.join(', ')}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing weekly digest for user ${userId}: ${errorMessage}`);
                console.error(`Error processing weekly digest for user ${userId}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed weekly digests for ${results.processed} users`,
                processed: results.processed,
                errors: results.errors,
            }),
            processed: results.processed,
            errors: results.errors,
        };
    } catch (error) {
        console.error('Failed to process weekly digests:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to process weekly digests',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            processed: results.processed,
            errors: results.errors,
        };
    }
}

/**
 * Processes queued notifications (for quiet hours, retries, etc.)
 */
async function processNotificationQueue(): Promise<{
    statusCode: number;
    body: string;
    processed: number;
    errors: string[];
}> {
    console.log('Processing notification queue');

    const results = {
        processed: 0,
        errors: [] as string[],
    };

    try {
        // Get pending notification jobs
        const jobs = await getPendingNotificationJobs();

        console.log(`Found ${jobs.length} pending notification jobs`);

        for (const job of jobs) {
            try {
                await processNotificationJob(job);
                results.processed++;
                console.log(`Processed notification job ${job.id}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing job ${job.id}: ${errorMessage}`);
                console.error(`Error processing job ${job.id}:`, error);

                // Update job with error
                await updateJobStatus(job, 'failed', errorMessage);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${results.processed} notification jobs`,
                processed: results.processed,
                errors: results.errors,
            }),
            processed: results.processed,
            errors: results.errors,
        };
    } catch (error) {
        console.error('Failed to process notification queue:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to process notification queue',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            processed: results.processed,
            errors: results.errors,
        };
    }
}

/**
 * Gets users who have daily digest enabled
 */
async function getUsersWithDailyDigest(): Promise<string[]> {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

    const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'SK = :sk AND #data.frequency = :frequency AND #data.emailNotifications = :enabled',
        ExpressionAttributeNames: {
            '#data': 'Data',
        },
        ExpressionAttributeValues: {
            ':sk': 'SETTINGS#NOTIFICATIONS',
            ':frequency': 'daily',
            ':enabled': true,
        },
        ProjectionExpression: 'PK',
    });

    const response = await docClient.send(command);

    return response.Items?.map(item => item.PK.replace('USER#', '')) || [];
}

/**
 * Gets users who have weekly digest enabled
 */
async function getUsersWithWeeklyDigest(): Promise<string[]> {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

    const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'SK = :sk AND #data.frequency = :frequency AND #data.emailNotifications = :enabled',
        ExpressionAttributeNames: {
            '#data': 'Data',
        },
        ExpressionAttributeValues: {
            ':sk': 'SETTINGS#NOTIFICATIONS',
            ':frequency': 'weekly',
            ':enabled': true,
        },
        ProjectionExpression: 'PK',
    });

    const response = await docClient.send(command);

    return response.Items?.map(item => item.PK.replace('USER#', '')) || [];
}

/**
 * Gets pending notification jobs that are ready to be processed
 */
async function getPendingNotificationJobs(): Promise<NotificationJob[]> {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
    const now = new Date().toISOString();

    const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'begins_with(SK, :skPrefix) AND #data.#status = :status AND #data.scheduledFor <= :now',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':skPrefix': 'NOTIFICATION_JOB#',
            ':status': 'pending',
            ':now': now,
        },
    });

    const response = await docClient.send(command);

    return response.Items?.map(item => item.Data as NotificationJob) || [];
}

/**
 * Processes a single notification job
 */
async function processNotificationJob(job: NotificationJob): Promise<void> {
    // Update job status to processing
    await updateJobStatus(job, 'processing');

    try {
        if (job.type === 'real-time') {
            // Process real-time notifications
            // Example: If we need to call Integration Service to send via external channels
            // This demonstrates how to use signed requests for cross-service communication
            /*
            try {
                await invokeIntegrationService('/notifications/send', 'POST', {
                    userId: job.userId,
                    notificationId: job.id,
                    type: job.type,
                    data: job.data,
                });
                console.log(`Notification ${job.id} sent via Integration Service`);
            } catch (error) {
                console.warn(`Failed to send via Integration Service:`, error);
                // Fall back to local processing
            }
            */
            await updateJobStatus(job, 'sent');
        } else if (job.type === 'digest') {
            // Process digest notifications
            // Example: If we need to call Background Service to aggregate analytics
            /*
            try {
                const analytics = await invokeBackgroundService<{ data: any }>(
                    '/analytics/digest',
                    'POST',
                    {
                        userId: job.userId,
                        period: 'daily',
                    }
                );
                console.log(`Analytics retrieved for digest ${job.id}`);
            } catch (error) {
                console.warn(`Failed to get analytics via Background Service:`, error);
            }
            */
            await updateJobStatus(job, 'sent');
        }

        // Delete the job after successful processing
        await deleteNotificationJob(job);
    } catch (error) {
        // Increment attempts and update status
        const newAttempts = job.attempts + 1;

        if (newAttempts >= job.maxAttempts) {
            await updateJobStatus(job, 'failed', error instanceof Error ? error.message : 'Unknown error');
        } else {
            // Reschedule for retry (exponential backoff)
            const retryDelay = Math.pow(2, newAttempts) * 60 * 1000; // 2^attempts minutes
            const newScheduledFor = new Date(Date.now() + retryDelay).toISOString();

            await updateJobStatus(job, 'pending', undefined, newAttempts, newScheduledFor);
        }

        throw error;
    }
}

/**
 * Updates the status of a notification job
 */
async function updateJobStatus(
    job: NotificationJob,
    status: 'pending' | 'processing' | 'sent' | 'failed',
    error?: string,
    attempts?: number,
    scheduledFor?: string
): Promise<void> {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

    let updateExpression = 'SET #data.#status = :status, #data.attempts = :attempts, UpdatedAt = :updatedAt';
    const expressionAttributeNames: Record<string, string> = {
        '#data': 'Data',
        '#status': 'status',
    };
    const expressionAttributeValues: Record<string, any> = {
        ':status': status,
        ':attempts': attempts !== undefined ? attempts : job.attempts,
        ':updatedAt': Date.now(),
    };

    if (status === 'processing' || status === 'sent') {
        updateExpression += ', #data.processedAt = :processedAt';
        expressionAttributeValues[':processedAt'] = new Date().toISOString();
    }

    if (error) {
        updateExpression += ', #data.#error = :error';
        expressionAttributeNames['#error'] = 'error';
        expressionAttributeValues[':error'] = error;
    }

    if (scheduledFor) {
        updateExpression += ', #data.scheduledFor = :scheduledFor';
        expressionAttributeValues[':scheduledFor'] = scheduledFor;
    }

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${job.userId}`,
            SK: `NOTIFICATION_JOB#${job.id}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
}

/**
 * Deletes a notification job after successful processing
 */
async function deleteNotificationJob(job: NotificationJob): Promise<void> {
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

    const command = new DeleteCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${job.userId}`,
            SK: `NOTIFICATION_JOB#${job.id}`,
        },
    });

    await docClient.send(command);
}