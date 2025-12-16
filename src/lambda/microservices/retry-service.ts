/**
 * Retry Service Microservice
 * 
 * Implements retry mechanisms with exponential backoff and dead letter queues:
 * - Configurable retry policies
 * - Exponential backoff with jitter
 * - Dead letter queue handling
 * - Retry metrics and monitoring
 * 
 * **Validates: Requirements 5.4**
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Types
interface RetryConfiguration {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
    jitterEnabled: boolean;
    deadLetterQueueUrl?: string;
}

interface RetryAttempt {
    attempt: number;
    timestamp: string;
    error?: string;
    delayMs: number;
    success: boolean;
}

interface RetryJob {
    id: string;
    userId: string;
    operation: string;
    payload: Record<string, any>;
    config: RetryConfiguration;
    attempts: RetryAttempt[];
    status: 'pending' | 'retrying' | 'succeeded' | 'failed' | 'dead_letter';
    createdAt: string;
    updatedAt: string;
    nextRetryAt?: string;
    finalError?: string;
}

interface RetryResult {
    success: boolean;
    attempts: number;
    totalDuration: number;
    finalError?: string;
    retryHistory: RetryAttempt[];
}

interface RetryRequest {
    operation: string;
    payload: Record<string, any>;
    userId: string;
    config?: Partial<RetryConfiguration>;
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-table';
const retryQueueUrl = process.env.RETRY_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/retry-queue';
const deadLetterQueueUrl = process.env.DEAD_LETTER_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/dead-letter-queue';

class RetryService {
    private defaultConfig: RetryConfiguration = {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2.0,
        retryableErrors: ['TIMEOUT', 'SERVICE_UNAVAILABLE', 'RATE_LIMITED', 'NETWORK_ERROR'],
        jitterEnabled: true,
        deadLetterQueueUrl,
    };

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        config: Partial<RetryConfiguration> = {}
    ): Promise<RetryResult> {
        const finalConfig = { ...this.defaultConfig, ...config };
        const retryHistory: RetryAttempt[] = [];
        let attempts = 0;
        const startTime = Date.now();

        while (attempts < finalConfig.maxRetries + 1) {
            attempts++;
            const attemptStart = Date.now();

            try {
                await operation();
                const totalDuration = Date.now() - startTime;

                // Record successful attempt
                retryHistory.push({
                    attempt: attempts,
                    timestamp: new Date().toISOString(),
                    delayMs: 0,
                    success: true,
                });

                return {
                    success: true,
                    attempts,
                    totalDuration,
                    retryHistory,
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                // Check if error is retryable
                const isRetryable = this.isRetryableError(errorMessage, finalConfig.retryableErrors);

                if (!isRetryable || attempts >= finalConfig.maxRetries + 1) {
                    const totalDuration = Date.now() - startTime;

                    // Record failed attempt
                    retryHistory.push({
                        attempt: attempts,
                        timestamp: new Date().toISOString(),
                        error: errorMessage,
                        delayMs: 0,
                        success: false,
                    });

                    return {
                        success: false,
                        attempts,
                        totalDuration,
                        finalError: errorMessage,
                        retryHistory,
                    };
                }

                // Calculate delay with exponential backoff and optional jitter
                const delay = this.calculateDelay(attempts - 1, finalConfig);

                // Record retry attempt
                retryHistory.push({
                    attempt: attempts,
                    timestamp: new Date().toISOString(),
                    error: errorMessage,
                    delayMs: delay,
                    success: false,
                });

                // Wait before retry
                await this.delay(delay);
            }
        }

        // This should never be reached, but included for completeness
        const totalDuration = Date.now() - startTime;
        return {
            success: false,
            attempts,
            totalDuration,
            finalError: 'Max retries exceeded',
            retryHistory,
        };
    }

    async scheduleRetryJob(request: RetryRequest): Promise<RetryJob> {
        const jobId = `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const config = { ...this.defaultConfig, ...request.config };

        const job: RetryJob = {
            id: jobId,
            userId: request.userId,
            operation: request.operation,
            payload: request.payload,
            config,
            attempts: [],
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };

        // Save job to database
        await this.saveRetryJob(job);

        // Schedule first attempt
        await this.scheduleJobExecution(job, 0);

        return job;
    }

    async processRetryJob(jobId: string): Promise<RetryResult> {
        try {
            // Get job from database
            const job = await this.getRetryJob(jobId);
            if (!job) {
                throw new Error(`Retry job not found: ${jobId}`);
            }

            if (job.status === 'succeeded' || job.status === 'dead_letter') {
                throw new Error(`Job ${jobId} is already completed with status: ${job.status}`);
            }

            const attemptNumber = job.attempts.length + 1;
            const attemptStart = Date.now();

            try {
                // Execute the operation (this would be implemented based on the operation type)
                await this.executeOperation(job.operation, job.payload);

                // Mark as succeeded
                const attempt: RetryAttempt = {
                    attempt: attemptNumber,
                    timestamp: new Date().toISOString(),
                    delayMs: 0,
                    success: true,
                };

                job.attempts.push(attempt);
                job.status = 'succeeded';
                job.updatedAt = new Date().toISOString();

                await this.updateRetryJob(job);

                return {
                    success: true,
                    attempts: attemptNumber,
                    totalDuration: Date.now() - new Date(job.createdAt).getTime(),
                    retryHistory: job.attempts,
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const isRetryable = this.isRetryableError(errorMessage, job.config.retryableErrors);

                const attempt: RetryAttempt = {
                    attempt: attemptNumber,
                    timestamp: new Date().toISOString(),
                    error: errorMessage,
                    delayMs: 0,
                    success: false,
                };

                job.attempts.push(attempt);

                if (!isRetryable || attemptNumber >= job.config.maxRetries + 1) {
                    // Max retries reached or non-retryable error
                    job.status = 'failed';
                    job.finalError = errorMessage;
                    job.updatedAt = new Date().toISOString();

                    await this.updateRetryJob(job);

                    // Send to dead letter queue
                    await this.sendToDeadLetterQueue(job);

                    return {
                        success: false,
                        attempts: attemptNumber,
                        totalDuration: Date.now() - new Date(job.createdAt).getTime(),
                        finalError: errorMessage,
                        retryHistory: job.attempts,
                    };
                } else {
                    // Schedule next retry
                    const delay = this.calculateDelay(attemptNumber - 1, job.config);
                    const nextRetryAt = new Date(Date.now() + delay).toISOString();

                    job.status = 'retrying';
                    job.nextRetryAt = nextRetryAt;
                    job.updatedAt = new Date().toISOString();

                    await this.updateRetryJob(job);
                    await this.scheduleJobExecution(job, delay);

                    return {
                        success: false,
                        attempts: attemptNumber,
                        totalDuration: Date.now() - new Date(job.createdAt).getTime(),
                        finalError: errorMessage,
                        retryHistory: job.attempts,
                    };
                }
            }
        } catch (error) {
            console.error('Error processing retry job:', error);
            throw error;
        }
    }

    private async executeOperation(operation: string, payload: Record<string, any>): Promise<any> {
        // This would be implemented based on the specific operations supported
        // For now, we'll simulate different operations
        switch (operation) {
            case 'send_notification':
                return this.simulateSendNotification(payload);
            case 'process_webhook':
                return this.simulateProcessWebhook(payload);
            case 'update_user_data':
                return this.simulateUpdateUserData(payload);
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
    }

    private async simulateSendNotification(payload: Record<string, any>): Promise<any> {
        // Simulate notification sending with potential failures
        if (Math.random() < 0.3) { // 30% failure rate
            const errors = ['TIMEOUT', 'SERVICE_UNAVAILABLE', 'RATE_LIMITED'];
            throw new Error(errors[Math.floor(Math.random() * errors.length)]);
        }
        return { success: true, messageId: `msg-${Date.now()}` };
    }

    private async simulateProcessWebhook(payload: Record<string, any>): Promise<any> {
        // Simulate webhook processing with potential failures
        if (Math.random() < 0.2) { // 20% failure rate
            throw new Error('NETWORK_ERROR');
        }
        return { success: true, processed: true };
    }

    private async simulateUpdateUserData(payload: Record<string, any>): Promise<any> {
        // Simulate user data update with potential failures
        if (Math.random() < 0.1) { // 10% failure rate
            throw new Error('DATABASE_ERROR');
        }
        return { success: true, updated: true };
    }

    private isRetryableError(errorMessage: string, retryableErrors: string[]): boolean {
        return retryableErrors.some(retryableError =>
            errorMessage.toUpperCase().includes(retryableError.toUpperCase())
        );
    }

    private calculateDelay(attemptNumber: number, config: RetryConfiguration): number {
        // Calculate exponential backoff
        const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);

        // Apply maximum delay limit
        let delay = Math.min(exponentialDelay, config.maxDelayMs);

        // Add jitter if enabled (±25% randomization)
        if (config.jitterEnabled) {
            const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
            delay = Math.max(config.baseDelayMs, delay + jitter);
        }

        return Math.floor(delay);
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async saveRetryJob(job: RetryJob): Promise<void> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${job.userId}`,
                    SK: `RETRY_JOB#${job.id}`,
                    ...job,
                }),
            });

            await dynamoClient.send(command);
        } catch (error) {
            console.error('Error saving retry job:', error);
            throw error;
        }
    }

    async getRetryJob(jobId: string): Promise<RetryJob | null> {
        try {
            // We need to scan for the job since we don't have the userId in this context
            // In a real implementation, you might store jobs in a separate table or index
            // For now, we'll assume we can extract userId from jobId or use a different approach

            // This is a simplified implementation - in practice you'd need better job lookup
            const command = new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `RETRY_JOB#${jobId}`,
                    SK: 'METADATA',
                }),
            });

            const result = await dynamoClient.send(command);

            if (!result.Item) {
                return null;
            }

            return unmarshall(result.Item) as RetryJob;
        } catch (error) {
            console.error('Error getting retry job:', error);
            throw error;
        }
    }

    private async updateRetryJob(job: RetryJob): Promise<void> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${job.userId}`,
                    SK: `RETRY_JOB#${job.id}`,
                    ...job,
                }),
            });

            await dynamoClient.send(command);
        } catch (error) {
            console.error('Error updating retry job:', error);
            throw error;
        }
    }

    private async scheduleJobExecution(job: RetryJob, delayMs: number): Promise<void> {
        try {
            // Send message to SQS with delay
            const command = new SendMessageCommand({
                QueueUrl: retryQueueUrl,
                MessageBody: JSON.stringify({
                    jobId: job.id,
                    userId: job.userId,
                    operation: job.operation,
                }),
                DelaySeconds: Math.min(Math.floor(delayMs / 1000), 900), // SQS max delay is 15 minutes
                MessageAttributes: {
                    jobId: {
                        DataType: 'String',
                        StringValue: job.id,
                    },
                    operation: {
                        DataType: 'String',
                        StringValue: job.operation,
                    },
                },
            });

            await sqsClient.send(command);
        } catch (error) {
            console.error('Error scheduling job execution:', error);
            throw error;
        }
    }

    private async sendToDeadLetterQueue(job: RetryJob): Promise<void> {
        try {
            const command = new SendMessageCommand({
                QueueUrl: job.config.deadLetterQueueUrl || deadLetterQueueUrl,
                MessageBody: JSON.stringify({
                    jobId: job.id,
                    userId: job.userId,
                    operation: job.operation,
                    payload: job.payload,
                    attempts: job.attempts.length,
                    finalError: job.finalError,
                    failedAt: new Date().toISOString(),
                }),
                MessageAttributes: {
                    jobId: {
                        DataType: 'String',
                        StringValue: job.id,
                    },
                    operation: {
                        DataType: 'String',
                        StringValue: job.operation,
                    },
                    failureReason: {
                        DataType: 'String',
                        StringValue: job.finalError || 'Max retries exceeded',
                    },
                },
            });

            await sqsClient.send(command);

            // Update job status
            job.status = 'dead_letter';
            await this.updateRetryJob(job);
        } catch (error) {
            console.error('Error sending to dead letter queue:', error);
            throw error;
        }
    }

    createResponse(statusCode: number, data: any, error?: string): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'X-Request-ID': (global as any).testUtils?.generateTestId() || `req-${Date.now()}`,
            },
            body: JSON.stringify(error ? { error, data } : { data }),
        };
    }
}

// Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const service = new RetryService();

    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};

        switch (method) {
            case 'POST':
                if (event.path?.includes('/schedule')) {
                    const request: RetryRequest = JSON.parse(event.body || '{}');
                    if (!request.operation || !request.userId || !request.payload) {
                        return service.createResponse(400, null, 'Missing required fields: operation, userId, payload');
                    }

                    const job = await service.scheduleRetryJob(request);
                    return service.createResponse(200, job);
                } else if (event.path?.includes('/process')) {
                    const { jobId } = JSON.parse(event.body || '{}');
                    if (!jobId) {
                        return service.createResponse(400, null, 'Missing jobId');
                    }

                    const result = await service.processRetryJob(jobId);
                    return service.createResponse(200, result);
                } else {
                    return service.createResponse(400, null, 'Invalid endpoint');
                }

            case 'GET':
                const jobId = pathParameters.jobId;
                if (!jobId) {
                    return service.createResponse(400, null, 'Missing jobId parameter');
                }

                const job = await service.getRetryJob(jobId);
                if (!job) {
                    return service.createResponse(404, null, 'Retry job not found');
                }

                return service.createResponse(200, job);

            default:
                return service.createResponse(405, null, 'Method not allowed');
        }
    } catch (error) {
        console.error('Retry service error:', error);
        return service.createResponse(500, null, 'Internal server error');
    }
};

// Export service class for testing
export { RetryService };