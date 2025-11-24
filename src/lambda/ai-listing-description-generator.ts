/**
 * AI Listing Description Generation Lambda
 * 
 * Processes listing description generation requests from SQS queue
 */

import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { generateListingDescription } from '../aws/bedrock/flows/listing-description-generator';
import { AWSXRay } from 'aws-xray-sdk-core';
import { publishAiJobCompletedEvent } from './utils/eventbridge-client';
import { invokeIntegrationService } from './utils/request-signer';
import { retry } from '../lib/retry-utility';

// Wrap AWS SDK clients with X-Ray
const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const RESPONSE_QUEUE_URL = process.env.AI_JOB_RESPONSE_QUEUE_URL!;

interface ListingDescriptionJobInput {
    jobId: string;
    userId: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    price: number;
    address: string;
    features?: string[];
    neighborhood?: string;
    persona?: string;
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
            jobType: 'listing-description',
            status: error ? 'failed' : 'completed',
            result: error ? undefined : result,
            error,
            completedAt: new Date().toISOString(),
        }),
        MessageAttributes: {
            jobId: { DataType: 'String', StringValue: jobId },
            userId: { DataType: 'String', StringValue: userId },
            jobType: { DataType: 'String', StringValue: 'listing-description' },
        },
    }));
}

/**
 * Processes a single listing description generation job
 */
async function processJob(record: SQSRecord): Promise<void> {
    const job: ListingDescriptionJobInput = JSON.parse(record.body);
    const { jobId, userId, propertyType, bedrooms, bathrooms, squareFeet, price, address, features, neighborhood, persona } = job;

    console.log(`Processing listing description job ${jobId} for user ${userId}`);

    try {
        // Update status to processing
        await updateJobStatus(jobId, userId, 'processing');

        // Generate listing description using Bedrock flow with retry logic
        const result = await retry(
            async () => await generateListingDescription({
                propertyType,
                bedrooms,
                bathrooms,
                squareFeet,
                price,
                address,
                features,
                neighborhood,
                persona,
            }, {
                userId,
            }),
            {
                maxRetries: 3,
                baseDelay: 1000,
                backoffMultiplier: 2,
                operationName: 'ai-listing-description-generation',
                onRetry: (error, attempt, delay) => {
                    console.log(`Retrying listing description generation (attempt ${attempt}, delay ${delay}ms):`, error.message);
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
            jobType: 'listing-description',
            status: 'completed',
            completedAt: new Date().toISOString(),
            traceId: process.env._X_AMZN_TRACE_ID,
        });

        // Example: If we need to call Integration Service to sync with MLS
        // This demonstrates how to use signed requests for cross-service communication
        // Uncomment when integration is needed:
        /*
        try {
            await invokeIntegrationService('/mls/update-listing', 'POST', {
                userId,
                listingId: propertyAddress,
                description: result.description,
            });
            console.log(`Listing description ${jobId} synced to MLS via Integration Service`);
        } catch (error) {
            console.warn(`Failed to sync to MLS via Integration Service:`, error);
            // Non-critical - continue processing
        }
        */

        console.log(`Successfully completed listing description job ${jobId}`);
    } catch (error) {
        const { formatErrorResponse, ErrorCode } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(error as Error, {
            service: 'ai-listing-description-generator',
            code: ErrorCode.AI_SERVICE_ERROR,
            userId,
            requestId: jobId,
            retryable: true,
            additionalDetails: {
                jobType: 'listing-description',
                propertyType,
                address,
            },
        });

        const errorMessage = errorResponse.error.message;
        console.error(`Failed to process listing description job ${jobId}:`, JSON.stringify(errorResponse));

        // Update status to failed with error
        await updateJobStatus(jobId, userId, 'failed', undefined, errorMessage);

        // Send error response to queue
        await sendJobResponse(jobId, userId, undefined, JSON.stringify(errorResponse));

        // Publish AI Job Failed event
        await publishAiJobCompletedEvent({
            jobId,
            userId,
            jobType: 'listing-description',
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
    console.log(`Processing ${event.Records.length} listing description generation jobs`);

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
