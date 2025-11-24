/**
 * AI Market Update Generation Lambda
 * 
 * Processes market update generation requests from SQS queue
 */

import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { generateMarketUpdate } from '../aws/bedrock/flows/generate-market-update';
import { AWSXRay } from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const RESPONSE_QUEUE_URL = process.env.AI_JOB_RESPONSE_QUEUE_URL!;

interface MarketUpdateJobInput {
    jobId: string;
    userId: string;
    location: string;
    marketData?: {
        averagePrice?: number;
        medianPrice?: number;
        daysOnMarket?: number;
        inventoryLevel?: number;
        priceChange?: number;
    };
    timeframe?: 'weekly' | 'monthly' | 'quarterly';
    tone?: string;
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
            jobType: 'market-update',
            status: error ? 'failed' : 'completed',
            result: error ? undefined : result,
            error,
            completedAt: new Date().toISOString(),
        }),
        MessageAttributes: {
            jobId: { DataType: 'String', StringValue: jobId },
            userId: { DataType: 'String', StringValue: userId },
            jobType: { DataType: 'String', StringValue: 'market-update' },
        },
    }));
}

/**
 * Processes a single market update generation job
 */
async function processJob(record: SQSRecord): Promise<void> {
    const job: MarketUpdateJobInput = JSON.parse(record.body);
    const { jobId, userId, location, marketData, timeframe, tone } = job;

    console.log(`Processing market update job ${jobId} for user ${userId}`);

    try {
        // Update status to processing
        await updateJobStatus(jobId, userId, 'processing');

        // Generate market update using Bedrock flow
        const result = await generateMarketUpdate({
            location,
            marketData,
            timeframe,
            tone,
        }, {
            userId,
        });

        // Update status to completed with result
        await updateJobStatus(jobId, userId, 'completed', result);

        // Send response to queue
        await sendJobResponse(jobId, userId, result);

        console.log(`Successfully completed market update job ${jobId}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to process market update job ${jobId}:`, errorMessage);

        // Update status to failed with error
        await updateJobStatus(jobId, userId, 'failed', undefined, errorMessage);

        // Send error response to queue
        await sendJobResponse(jobId, userId, undefined, errorMessage);

        // Re-throw to trigger SQS retry/DLQ
        throw error;
    }
}

/**
 * Lambda handler for SQS events
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<void> {
    console.log(`Processing ${event.Records.length} market update generation jobs`);

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
