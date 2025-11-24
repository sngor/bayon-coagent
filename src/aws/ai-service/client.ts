/**
 * AI Service Client
 * 
 * Client for interacting with the AI Processing Service via API Gateway and SQS.
 * Provides async job submission and polling for results.
 */

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { v4 as uuidv4 } from 'uuid';

export interface AIJobSubmission {
    jobType: 'blog-post' | 'social-media' | 'listing-description' | 'market-update';
    userId: string;
    input: Record<string, any>;
}

export interface AIJobStatus {
    jobId: string;
    userId: string;
    jobType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
}

/**
 * AI Service Client for submitting and tracking AI processing jobs
 */
export class AIServiceClient {
    private sqsClient: SQSClient;
    private dynamoClient: DynamoDBClient;
    private queueUrl: string;
    private tableName: string;

    constructor() {
        const config = getConfig();
        const credentials = getAWSCredentials();

        this.sqsClient = new SQSClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });

        this.dynamoClient = new DynamoDBClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });

        // Get queue URL and table name from environment
        this.queueUrl = process.env.AI_JOB_REQUEST_QUEUE_URL || '';
        this.tableName = process.env.DYNAMODB_TABLE_NAME || '';
    }

    /**
     * Submits an AI processing job to the queue
     * 
     * @param submission - Job submission details
     * @returns Job ID for tracking
     */
    async submitJob(submission: AIJobSubmission): Promise<string> {
        const jobId = uuidv4();
        const now = new Date().toISOString();

        // Create job record in DynamoDB
        const job = {
            PK: `USER#${submission.userId}`,
            SK: `AIJOB#${jobId}`,
            JobId: jobId,
            UserId: submission.userId,
            JobType: submission.jobType,
            Status: 'pending',
            Input: JSON.stringify(submission.input),
            CreatedAt: now,
            UpdatedAt: now,
            EntityType: 'AIJob',
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(job),
        }));

        // Send job to SQS queue
        const message = {
            jobId,
            userId: submission.userId,
            ...submission.input,
        };

        await this.sqsClient.send(new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                jobId: { DataType: 'String', StringValue: jobId },
                userId: { DataType: 'String', StringValue: submission.userId },
                jobType: { DataType: 'String', StringValue: submission.jobType },
            },
        }));

        return jobId;
    }

    /**
     * Gets the status of an AI processing job
     * 
     * @param jobId - Job ID to check
     * @param userId - User ID who owns the job
     * @returns Job status or null if not found
     */
    async getJobStatus(jobId: string, userId: string): Promise<AIJobStatus | null> {
        const result = await this.dynamoClient.send(new GetItemCommand({
            TableName: this.tableName,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `AIJOB#${jobId}`,
            }),
        }));

        if (!result.Item) {
            return null;
        }

        const item = unmarshall(result.Item);

        return {
            jobId: item.JobId,
            userId: item.UserId,
            jobType: item.JobType,
            status: item.Status,
            createdAt: item.CreatedAt,
            updatedAt: item.UpdatedAt,
            completedAt: item.CompletedAt,
            result: item.Result ? JSON.parse(item.Result) : undefined,
            error: item.Error,
        };
    }

    /**
     * Polls for job completion with exponential backoff
     * 
     * @param jobId - Job ID to poll
     * @param userId - User ID who owns the job
     * @param maxAttempts - Maximum number of polling attempts (default: 60)
     * @param initialDelay - Initial delay in ms (default: 1000)
     * @returns Job status when completed or failed
     */
    async pollForCompletion(
        jobId: string,
        userId: string,
        maxAttempts: number = 60,
        initialDelay: number = 1000
    ): Promise<AIJobStatus> {
        let delay = initialDelay;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const status = await this.getJobStatus(jobId, userId);

            if (!status) {
                throw new Error(`Job ${jobId} not found`);
            }

            if (status.status === 'completed' || status.status === 'failed') {
                return status;
            }

            // Wait before next poll with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 10000); // Max 10 seconds
        }

        throw new Error(`Job ${jobId} did not complete within timeout`);
    }

    /**
     * Submits a job and waits for completion
     * 
     * @param submission - Job submission details
     * @returns Completed job status with result
     */
    async submitAndWait(submission: AIJobSubmission): Promise<AIJobStatus> {
        const jobId = await this.submitJob(submission);
        return this.pollForCompletion(jobId, submission.userId);
    }
}

/**
 * Singleton instance of AI Service Client
 */
let aiServiceClientInstance: AIServiceClient | null = null;

/**
 * Gets the singleton AI Service Client instance
 */
export function getAIServiceClient(): AIServiceClient {
    if (!aiServiceClientInstance) {
        aiServiceClientInstance = new AIServiceClient();
    }
    return aiServiceClientInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetAIServiceClient(): void {
    aiServiceClientInstance = null;
}
