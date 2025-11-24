/**
 * AI Social Media Post Generation Lambda
 * 
 * Processes social media post generation requests from SQS queue
 */

import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { generateSocialMediaPost } from '../aws/bedrock/flows/generate-social-media-post';
import { AWSXRay } from 'aws-xray-sdk-core';
import { publishAiJobCompletedEvent } from './utils/eventbridge-client';
import { invokeIntegrationService } from './utils/request-signer';
import { retry } from '../lib/retry-utility';

// Wrap AWS SDK clients with X-Ray
const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const RESPONSE_QUEUE_URL = process.env.AI_JOB_RESPONSE_QUEUE_URL!;

interface SocialMediaJobInput {
    jobId: string;
    userId: string;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    topic: string;
    tone?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
    callToAction?: string;
}

/**
 * Updates job status in DynamoDB
 */
async function updateJobStatus(
    jobId: string,
    userId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    result?: any,
    error?: string
): Promise<void> {
    const now = new Date().toISOString();

    const updateExpression = status === 'completed' || status === 'failed'
        ? 'SET #status = :status, #updatedAt = :updatedAt, #completedAt = :completedAt'
        : 'SET #status = :status, #updatedAt = :updatedAt';

    const expressionAttributeValues: Record<string, any> = {
        ':status': { S: status },
        ':updatedAt': { S: now },
    };

    if (status === 'completed' || status === 'failed') {
        expressionAttributeValues[':completedAt'] = { S: now };
    }

    if (result) {
        expressionAttributeValues[':result'] = { S: JSON.stringify(result) };
        updateExpression += ', #result = :result';
    }

    if (error) {
        expressionAttributeValues[':error'] = { S: error };
        updateExpression += ', #error = :error';
    }

    await dynamoClient.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: { S: `USER#${userId}` },
            SK: { S: `AIJOB#${jobId}` },
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
            '#status': 'Status',
            '#updatedAt': 'UpdatedAt',
            ...(status === 'completed' || status === 'failed' ? { '#completedAt': 'CompletedAt' } : {}),
            ...(result ? { '#result': 'Result' } : {}),
            ...(error ? { '#error': 'Error' } : {}),
        },
        ExpressionAttributeValues: expressionAttributeValues,
    }));
}

/**
 * Sends job result to response queue
 */
async function sendJobResponse(jobId: string, userId: string, result: any, error?: string): Promise<void> {
    await sqsClient.send(new SendMessageCommand({
        QueueUrl: RESPONSE_QUEUE_URL,
        MessageBody: JSON.stringify({
            jobId,
            userId,
            jobType: 'social-media',
            status: error ? 'failed' : 'completed',
            result: error ? undefined : result,
            error,
            completedAt: new Date().toISOString(),
        }),
        MessageAttributes: {
            jobId: { DataType: 'String', StringValue: jobId },
            userId: { DataType: 'String', StringValue: userId },
            jobType: { DataType: 'String', StringValue: 'social-media' },
        },
    }));
}

/**
 * Processes a single social media post generation job
 */
async function processJob(record: SQSRecord): Promise<void> {
    const job: SocialMediaJobInput = JSON.parse(record.body);
    const { jobId, userId, platform, topic, tone, includeHashtags, includeEmojis, callToAction } = job;

    console.log(`Processing social media job ${jobId} for user ${userId} on ${platform}`);

    try {
        // Update status to processing
        await updateJobStatus(jobId, userId, 'processing');

        // Generate social media post using Bedrock flow with retry logic
        const result = await retry(
            async () => await generateSocialMediaPost({
                platform,
                topic,
                tone,
                includeHashtags,
                includeEmojis,
                callToAction,
            }, {
                userId,
            }),
            {
                maxRetries: 3,
                baseDelay: 1000,
                backoffMultiplier: 2,
                operationName: 'ai-social-media-generation',
                onRetry: (error, attempt, delay) => {
                    console.log(`Retrying social media generation (attempt ${attempt}, delay ${delay}ms):`, error.message);
                },
            }
        );

        // Update status to completed with result
        await updateJobStatus(jobId, userId, 'completed', result);

        // Send response to queue
        await sendJobResponse(jobId, userId, result);

        // Publish AI Job Completed event
        await publishAiJobCompletedEvent({
            jobId,
            userId,
            jobType: 'social-media',
            status: 'completed',
            completedAt: new Date().toISOString(),
            traceId: process.env._X_AMZN_TRACE_ID,
        });

        // Example: If we need to call Integration Service to schedule social media post
        // This demonstrates how to use signed requests for cross-service communication
        // Uncomment when integration is needed:
        /*
        try {
            await invokeIntegrationService('/schedule/social', 'POST', {
                userId,
                contentId: jobId,
                content: result,
                platform: platform || 'facebook',
            });
            console.log(`Social media post ${jobId} scheduled via Integration Service`);
        } catch (error) {
            console.warn(`Failed to schedule via Integration Service:`, error);
            // Non-critical - continue processing
        }
        */

        console.log(`Successfully completed social media job ${jobId}`);
    } catch (error) {
        const { formatErrorResponse, ErrorCode } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(error as Error, {
            service: 'ai-social-media-generator',
            code: ErrorCode.AI_SERVICE_ERROR,
            userId,
            requestId: jobId,
            retryable: true,
            additionalDetails: {
                jobType: 'social-media',
                platform,
                topic,
            },
        });

        const errorMessage = errorResponse.error.message;
        console.error(`Failed to process social media job ${jobId}:`, JSON.stringify(errorResponse));

        // Update status to failed with error
        await updateJobStatus(jobId, userId, 'failed', undefined, errorMessage);

        // Send error response to queue
        await sendJobResponse(jobId, userId, undefined, JSON.stringify(errorResponse));

        // Publish AI Job Failed event
        await publishAiJobCompletedEvent({
            jobId,
            userId,
            jobType: 'social-media',
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: errorMessage,
            traceId: errorResponse.error.details.traceId,
        });

        // Re-throw to trigger SQS retry/DLQ
        throw error;
    }
}

/**
 * Lambda handler for SQS events
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    console.log(`Processing ${event.Records.length} social media generation jobs`);

    // Process jobs in parallel
    const results = await Promise.allSettled(
        event.Records.map(record => processJob(record))
    );

    // Log results
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Completed: ${succeeded} succeeded, ${failed} failed`);

    // If any failed, throw to trigger partial batch failure
    if (failed > 0) {
        throw new Error(`${failed} jobs failed processing`);
    }
};
