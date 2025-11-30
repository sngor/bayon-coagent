/**
 * AI Service Health Check Lambda
 * 
 * Provides health check endpoint for AI Processing Service
 */

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { createHealthCheckResponse } from '../aws/api-gateway/config';

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});
const bedrockClient = new BedrockClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const REQUEST_QUEUE_URL = process.env.AI_JOB_REQUEST_QUEUE_URL!;

interface HealthCheckDependencies {
    [key: string]: 'healthy' | 'unhealthy';
    dynamodb: 'healthy' | 'unhealthy';
    sqs: 'healthy' | 'unhealthy';
    bedrock: 'healthy' | 'unhealthy';
}

interface HealthCheckMetrics {
    [key: string]: number;
    queueDepth: number;
    uptime: number;
    memoryUsed: number;
    memoryTotal: number;
}

/**
 * Check DynamoDB health
 */
async function checkDynamoDB(): Promise<'healthy' | 'unhealthy'> {
    try {
        await dynamoClient.send(new DescribeTableCommand({
            TableName: TABLE_NAME,
        }));
        return 'healthy';
    } catch (error) {
        console.error('DynamoDB health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Check SQS health
 */
async function checkSQS(): Promise<{ status: 'healthy' | 'unhealthy'; depth: number }> {
    try {
        const response = await sqsClient.send(new GetQueueAttributesCommand({
            QueueUrl: REQUEST_QUEUE_URL,
            AttributeNames: ['ApproximateNumberOfMessages'],
        }));

        const depth = parseInt(response.Attributes?.ApproximateNumberOfMessages || '0', 10);

        return {
            status: 'healthy',
            depth,
        };
    } catch (error) {
        console.error('SQS health check failed:', error);
        return {
            status: 'unhealthy',
            depth: 0,
        };
    }
}

/**
 * Check Bedrock health
 */
async function checkBedrock(): Promise<'healthy' | 'unhealthy'> {
    try {
        await bedrockClient.send(new ListFoundationModelsCommand({}));
        return 'healthy';
    } catch (error) {
        console.error('Bedrock health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Lambda handler for health check
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('AI Service health check requested');

    try {
        // Check all dependencies in parallel
        const [dynamoStatus, sqsResult, bedrockStatus] = await Promise.all([
            checkDynamoDB(),
            checkSQS(),
            checkBedrock(),
        ]);

        const dependencies: HealthCheckDependencies = {
            dynamodb: dynamoStatus,
            sqs: sqsResult.status,
            bedrock: bedrockStatus,
        };

        // Calculate metrics
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        const memoryTotal = process.memoryUsage().heapTotal / 1024 / 1024; // MB
        const uptime = process.uptime(); // seconds

        const metrics: HealthCheckMetrics = {
            queueDepth: sqsResult.depth,
            uptime,
            memoryUsed: Math.round(memoryUsed * 100) / 100,
            memoryTotal: Math.round(memoryTotal * 100) / 100,
        };

        // Determine overall health status
        const allHealthy = Object.values(dependencies).every(status => status === 'healthy');
        const overallStatus = allHealthy ? 'healthy' : 'degraded';

        const healthCheck = createHealthCheckResponse(
            'ai-service',
            overallStatus,
            dependencies,
            metrics
        );

        return {
            statusCode: overallStatus === 'healthy' ? 200 : 503,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(healthCheck),
        };
    } catch (error) {
        console.error('Health check failed:', error);

        const healthCheck = createHealthCheckResponse(
            'ai-service',
            'unhealthy',
            {
                dynamodb: 'unhealthy',
                sqs: 'unhealthy',
                bedrock: 'unhealthy',
            },
            {}
        );

        return {
            statusCode: 503,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(healthCheck),
        };
    }
};
