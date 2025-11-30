/**
 * AI Blog Post Generation Lambda
 * 
 * Processes blog post generation requests from SQS queue
 */

import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { marshall } from '@aws-sdk/util-dynamodb';
import { generateBlogPost } from '../aws/bedrock/flows/generate-blog-post';
import AWSXRay from 'aws-xray-sdk-core';
import { publishAiJobCompletedEvent } from './utils/eventbridge-client';
import { invokeIntegrationService, invokeBackgroundService } from './utils/request-signer';
import { retry } from '../lib/retry-utility';
import {
    executeWithFallback,
    aiResponseCache,
    backgroundJobQueue
} from '../lib/fallback-mechanisms';

// Wrap AWS SDK clients with X-Ray
const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const RESPONSE_QUEUE_URL = process.env.AI_JOB_RESPONSE_QUEUE_URL!;

interface BlogPostJobInput {
    jobId: string;
    userId: string;
    topic: string;
    tone?: string;
    keywords?: string[];
    targetAudience?: string;
    length?: 'short' | 'medium' | 'long';
}

interface JobStatus {
    jobId: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    jobType: 'blog-post';
    input: BlogPostJobInput;
    result?: any;
    error?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

/**
 * Updates job status in DynamoDB
 */
async function updateJobStatus(
    jobId: string,
    userId: string,
    status: JobStatus['status'],
    result?: any,
    error?: string
): Promise<void> {
    const now = new Date().toISOString();

    let updateExpression = status === 'completed' || status === 'failed'
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
            jobType: 'blog-post',
            status: error ? 'failed' : 'completed',
            result: error ? undefined : result,
            error,
            completedAt: new Date().toISOString(),
        }),
        MessageAttributes: {
            jobId: { DataType: 'String', StringValue: jobId },
            userId: { DataType: 'String', StringValue: userId },
            jobType: { DataType: 'String', StringValue: 'blog-post' },
        },
    }));
}

/**
 * Processes a single blog post generation job
 */
async function processJob(record: SQSRecord): Promise<void> {
    const job: BlogPostJobInput = JSON.parse(record.body);
    const { jobId, userId, topic, tone, keywords, targetAudience, length } = job;

    console.log(`Processing blog post job ${jobId} for user ${userId}`);

    try {
        // Update status to processing
        await updateJobStatus(jobId, userId, 'processing');

        // Generate blog post using Bedrock flow with retry logic and fallback
        const cacheKey = `${topic}_${tone}_${length}`;
        const fallbackResult = await executeWithFallback(
            async () => await generateBlogPost({
                topic,
                includeWebSearch: true,
                searchDepth: 'basic',
            }),
            {
                operationName: 'ai-blog-post-generation',
                userId,
                cacheKey: {
                    prompt: cacheKey,
                    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                },
                queueOnFailure: {
                    type: 'ai',
                    payload: job,
                    priority: 'medium',
                },
            }
        );

        // Check if we used a fallback
        if (!fallbackResult.success) {
            throw new Error(fallbackResult.message || 'Failed to generate blog post');
        }

        const result = fallbackResult.data;
        const usedFallback = fallbackResult.metadata?.usedFallback || false;

        if (usedFallback) {
            console.log(`Used fallback for job ${jobId}: ${fallbackResult.metadata?.fallbackType}`);
        }

        // Update status to completed with result
        await updateJobStatus(jobId, userId, 'completed', result);

        // Send response to queue
        await sendJobResponse(jobId, userId, result);

        // Publish AI Job Completed event
        await publishAiJobCompletedEvent({
            jobId,
            userId,
            jobType: 'blog-post',
            status: 'completed',
            completedAt: new Date().toISOString(),
            traceId: process.env._X_AMZN_TRACE_ID,
        });

        // Example: If we need to call Integration Service to publish content
        // This demonstrates how to use signed requests for cross-service communication
        // Uncomment when integration is needed:
        /*
        try {
            await invokeIntegrationService('/publish/blog', 'POST', {
                userId,
                contentId: jobId,
                content: result,
            });
            console.log(`Blog post ${jobId} published via Integration Service`);
        } catch (error) {
            console.warn(`Failed to publish via Integration Service:`, error);
            // Non-critical - continue processing
        }
        */

        console.log(`Successfully completed blog post job ${jobId}`);
    } catch (error) {
        const { formatErrorResponse, ErrorCode } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(error as Error, {
            service: 'ai-blog-post-generator',
            code: ErrorCode.AI_SERVICE_ERROR,
            userId,
            requestId: jobId,
            retryable: true,
            additionalDetails: {
                jobType: 'blog-post',
                topic,
            },
        });

        const errorMessage = errorResponse.error.message;
        console.error(`Failed to process blog post job ${jobId}:`, JSON.stringify(errorResponse));

        // Update status to failed with error
        await updateJobStatus(jobId, userId, 'failed', undefined, errorMessage);

        // Send error response to queue
        await sendJobResponse(jobId, userId, undefined, JSON.stringify(errorResponse));

        // Publish AI Job Failed event
        await publishAiJobCompletedEvent({
            jobId,
            userId,
            jobType: 'blog-post',
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
    console.log(`Processing ${event.Records.length} blog post generation jobs`);

    // Process jobs in parallel (with concurrency limit)
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
