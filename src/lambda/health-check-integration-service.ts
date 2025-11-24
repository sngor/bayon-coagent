/**
 * Integration Service Health Check Lambda
 * 
 * Provides health check endpoint for External Integration Service
 */

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, ListSecretsCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { createHealthCheckResponse } from '../aws/api-gateway/config';

const dynamoClient = new DynamoDBClient({});
const secretsClient = new SecretsManagerClient({});
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

interface HealthCheckDependencies {
    dynamodb: 'healthy' | 'unhealthy';
    secretsManager: 'healthy' | 'unhealthy';
    s3: 'healthy' | 'unhealthy';
}

interface HealthCheckMetrics {
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
 * Check Secrets Manager health
 */
async function checkSecretsManager(): Promise<'healthy' | 'unhealthy'> {
    try {
        await secretsClient.send(new ListSecretsCommand({
            MaxResults: 1,
        }));
        return 'healthy';
    } catch (error) {
        console.error('Secrets Manager health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Check S3 health
 */
async function checkS3(): Promise<'healthy' | 'unhealthy'> {
    try {
        await s3Client.send(new HeadBucketCommand({
            Bucket: BUCKET_NAME,
        }));
        return 'healthy';
    } catch (error) {
        console.error('S3 health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Lambda handler for health check
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Integration Service health check requested');

    try {
        // Check all dependencies in parallel
        const [dynamoStatus, secretsStatus, s3Status] = await Promise.all([
            checkDynamoDB(),
            checkSecretsManager(),
            checkS3(),
        ]);

        const dependencies: HealthCheckDependencies = {
            dynamodb: dynamoStatus,
            secretsManager: secretsStatus,
            s3: s3Status,
        };

        // Calculate metrics
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        const memoryTotal = process.memoryUsage().heapTotal / 1024 / 1024; // MB
        const uptime = process.uptime(); // seconds

        const metrics: HealthCheckMetrics = {
            uptime,
            memoryUsed: Math.round(memoryUsed * 100) / 100,
            memoryTotal: Math.round(memoryTotal * 100) / 100,
        };

        // Determine overall health status
        const allHealthy = Object.values(dependencies).every(status => status === 'healthy');
        const overallStatus = allHealthy ? 'healthy' : 'degraded';

        const healthCheck = createHealthCheckResponse(
            'integration-service',
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
            'integration-service',
            'unhealthy',
            {
                dynamodb: 'unhealthy',
                secretsManager: 'unhealthy',
                s3: 'unhealthy',
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
