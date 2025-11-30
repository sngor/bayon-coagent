/**
 * Admin Service Health Check Lambda
 * 
 * Provides health check endpoint for Admin Service
 */

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CloudWatchClient, ListMetricsCommand } from '@aws-sdk/client-cloudwatch';
import { createHealthCheckResponse } from '../aws/api-gateway/config';

const dynamoClient = new DynamoDBClient({});
const cognitoClient = new CognitoIdentityProviderClient({});
const cloudWatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

interface HealthCheckDependencies {
    [key: string]: 'healthy' | 'unhealthy';
    dynamodb: 'healthy' | 'unhealthy';
    cognito: 'healthy' | 'unhealthy';
    cloudWatch: 'healthy' | 'unhealthy';
}

interface HealthCheckMetrics {
    [key: string]: number;
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
 * Check Cognito health
 */
async function checkCognito(): Promise<'healthy' | 'unhealthy'> {
    try {
        await cognitoClient.send(new DescribeUserPoolCommand({
            UserPoolId: USER_POOL_ID,
        }));
        return 'healthy';
    } catch (error) {
        console.error('Cognito health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Check CloudWatch health
 */
async function checkCloudWatch(): Promise<'healthy' | 'unhealthy'> {
    try {
        await cloudWatchClient.send(new ListMetricsCommand({
            Namespace: 'AWS/Lambda',
        }));
        return 'healthy';
    } catch (error) {
        console.error('CloudWatch health check failed:', error);
        return 'unhealthy';
    }
}

/**
 * Lambda handler for health check
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Admin Service health check requested');

    try {
        // Check all dependencies in parallel
        const [dynamoStatus, cognitoStatus, cloudWatchStatus] = await Promise.all([
            checkDynamoDB(),
            checkCognito(),
            checkCloudWatch(),
        ]);

        const dependencies: HealthCheckDependencies = {
            dynamodb: dynamoStatus,
            cognito: cognitoStatus,
            cloudWatch: cloudWatchStatus,
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
            'admin-service',
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
            'admin-service',
            'unhealthy',
            {
                dynamodb: 'unhealthy',
                cognito: 'unhealthy',
                cloudWatch: 'unhealthy',
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
