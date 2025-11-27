/**
 * Admin Monitoring Dashboard Lambda
 * 
 * Provides monitoring dashboard data for admin service:
 * - System health metrics
 * - Service performance metrics
 * - Error rates and trends
 * - Resource utilization
 * 
 * Requirements: 8.1, 8.4 - Admin Service functionality with read-only data access
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    CloudWatchClient,
    GetMetricStatisticsCommand,
    Dimension,
} from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { getConfig } from '../aws/config';
import { logAdminOperation } from './utils/admin-audit-logger';

const config = getConfig();
const cloudWatchClient = new CloudWatchClient({ region: config.region });
const dynamoClient = new DynamoDBClient({ region: config.region });
const lambdaClient = new LambdaClient({ region: config.region });

interface MetricQuery {
    service?: string;
    metric?: string;
    period?: number;
    startTime?: string;
    endTime?: string;
}

/**
 * Lambda handler for admin monitoring dashboard operations
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Admin monitoring dashboard event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    // Extract admin user info from authorizer context
    const adminUserId = event.requestContext.authorizer?.userId;
    const adminEmail = event.requestContext.authorizer?.email;
    const sourceIp = event.requestContext.identity?.sourceIp;

    if (!adminUserId) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Unauthorized', {
            service: 'admin-monitoring-dashboard',
            code: ErrorCode.UNAUTHORIZED,
        });
        return toAPIGatewayResponse(errorResponse, 403);
    }

    try {
        // Route based on path and method
        if (path.endsWith('/dashboard/overview') && httpMethod === 'GET') {
            return await handleGetOverview(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/dashboard/metrics') && httpMethod === 'GET') {
            return await handleGetMetrics(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/dashboard/services') && httpMethod === 'GET') {
            return await handleGetServices(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/dashboard/errors') && httpMethod === 'GET') {
            return await handleGetErrors(event, adminUserId, adminEmail, sourceIp);
        } else {
            const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
            const errorResponse = formatErrorResponse('Endpoint not found', {
                service: 'admin-monitoring-dashboard',
                code: ErrorCode.NOT_FOUND,
                path,
                method: httpMethod,
            });
            return toAPIGatewayResponse(errorResponse, 404);
        }
    } catch (error) {
        console.error('Admin monitoring dashboard error:', error);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse(error as Error, {
            service: 'admin-monitoring-dashboard',
            code: ErrorCode.INTERNAL_ERROR,
        });
        return toAPIGatewayResponse(errorResponse);
    }
}

/**
 * Handle get overview request
 */
async function handleGetOverview(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

    // Get DynamoDB table info
    const tableInfo = await dynamoClient.send(
        new DescribeTableCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME!,
        })
    );

    // Get Lambda functions count
    const functionsResponse = await lambdaClient.send(
        new ListFunctionsCommand({
            MaxItems: 100,
        })
    );

    // Get API Gateway request count
    const apiRequestsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApiGateway',
        MetricName: 'Count',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour
        Statistics: ['Sum'],
    });

    const apiRequests = await cloudWatchClient.send(apiRequestsCommand);

    // Get Lambda invocations
    const lambdaInvocationsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
    });

    const lambdaInvocations = await cloudWatchClient.send(lambdaInvocationsCommand);

    // Get Lambda errors
    const lambdaErrorsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
    });

    const lambdaErrors = await cloudWatchClient.send(lambdaErrorsCommand);

    const overview = {
        database: {
            tableName: tableInfo.Table?.TableName,
            status: tableInfo.Table?.TableStatus,
            itemCount: tableInfo.Table?.ItemCount,
            sizeBytes: tableInfo.Table?.TableSizeBytes,
        },
        functions: {
            count: functionsResponse.Functions?.length || 0,
        },
        metrics: {
            apiRequests: apiRequests.Datapoints?.[0]?.Sum || 0,
            lambdaInvocations: lambdaInvocations.Datapoints?.[0]?.Sum || 0,
            lambdaErrors: lambdaErrors.Datapoints?.[0]?.Sum || 0,
            errorRate:
                lambdaInvocations.Datapoints?.[0]?.Sum
                    ? ((lambdaErrors.Datapoints?.[0]?.Sum || 0) /
                        lambdaInvocations.Datapoints[0].Sum) *
                    100
                    : 0,
        },
        timestamp: endTime.toISOString(),
    };

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_DASHBOARD_OVERVIEW',
        resourceType: 'MONITORING_DATA',
        sourceIp,
        success: true,
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(overview, 'Overview retrieved successfully');

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle get metrics request
 */
async function handleGetMetrics(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const query: MetricQuery = {
        service: event.queryStringParameters?.service,
        metric: event.queryStringParameters?.metric,
        period: event.queryStringParameters?.period ? parseInt(event.queryStringParameters.period) : 300,
        startTime: event.queryStringParameters?.startTime,
        endTime: event.queryStringParameters?.endTime,
    };

    const endTime = query.endTime ? new Date(query.endTime) : new Date();
    const startTime = query.startTime
        ? new Date(query.startTime)
        : new Date(endTime.getTime() - 60 * 60 * 1000); // Default: last hour

    const metrics: any[] = [];

    // Get Lambda metrics
    if (!query.service || query.service === 'lambda') {
        const metricNames = query.metric
            ? [query.metric]
            : ['Invocations', 'Errors', 'Duration', 'Throttles', 'ConcurrentExecutions'];

        for (const metricName of metricNames) {
            const command = new GetMetricStatisticsCommand({
                Namespace: 'AWS/Lambda',
                MetricName: metricName,
                StartTime: startTime,
                EndTime: endTime,
                Period: query.period,
                Statistics: ['Sum', 'Average', 'Maximum'],
            });

            const response = await cloudWatchClient.send(command);

            metrics.push({
                service: 'lambda',
                metric: metricName,
                datapoints: response.Datapoints?.map(dp => ({
                    timestamp: dp.Timestamp?.toISOString(),
                    sum: dp.Sum,
                    average: dp.Average,
                    maximum: dp.Maximum,
                })),
            });
        }
    }

    // Get API Gateway metrics
    if (!query.service || query.service === 'apigateway') {
        const metricNames = query.metric ? [query.metric] : ['Count', '4XXError', '5XXError', 'Latency'];

        for (const metricName of metricNames) {
            const command = new GetMetricStatisticsCommand({
                Namespace: 'AWS/ApiGateway',
                MetricName: metricName,
                StartTime: startTime,
                EndTime: endTime,
                Period: query.period,
                Statistics: ['Sum', 'Average', 'Maximum'],
            });

            const response = await cloudWatchClient.send(command);

            metrics.push({
                service: 'apigateway',
                metric: metricName,
                datapoints: response.Datapoints?.map(dp => ({
                    timestamp: dp.Timestamp?.toISOString(),
                    sum: dp.Sum,
                    average: dp.Average,
                    maximum: dp.Maximum,
                })),
            });
        }
    }

    // Get DynamoDB metrics
    if (!query.service || query.service === 'dynamodb') {
        const metricNames = query.metric
            ? [query.metric]
            : ['ConsumedReadCapacityUnits', 'ConsumedWriteCapacityUnits', 'UserErrors', 'SystemErrors'];

        for (const metricName of metricNames) {
            const command = new GetMetricStatisticsCommand({
                Namespace: 'AWS/DynamoDB',
                MetricName: metricName,
                Dimensions: [
                    {
                        Name: 'TableName',
                        Value: process.env.DYNAMODB_TABLE_NAME!,
                    },
                ],
                StartTime: startTime,
                EndTime: endTime,
                Period: query.period,
                Statistics: ['Sum', 'Average', 'Maximum'],
            });

            const response = await cloudWatchClient.send(command);

            metrics.push({
                service: 'dynamodb',
                metric: metricName,
                datapoints: response.Datapoints?.map(dp => ({
                    timestamp: dp.Timestamp?.toISOString(),
                    sum: dp.Sum,
                    average: dp.Average,
                    maximum: dp.Maximum,
                })),
            });
        }
    }

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_METRICS',
        resourceType: 'MONITORING_DATA',
        sourceIp,
        success: true,
        details: {
            service: query.service,
            metric: query.metric,
            period: query.period,
        },
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse({ metrics }, 'Metrics retrieved successfully');

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle get services request
 */
async function handleGetServices(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    // Get Lambda functions
    const functionsResponse = await lambdaClient.send(
        new ListFunctionsCommand({
            MaxItems: 100,
        })
    );

    const services = functionsResponse.Functions?.map(fn => ({
        name: fn.FunctionName,
        runtime: fn.Runtime,
        memorySize: fn.MemorySize,
        timeout: fn.Timeout,
        lastModified: fn.LastModified,
        codeSize: fn.CodeSize,
    })) || [];

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_SERVICES',
        resourceType: 'MONITORING_DATA',
        sourceIp,
        success: true,
        details: {
            serviceCount: services.length,
        },
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse({ services }, 'Services retrieved successfully');

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle get errors request
 */
async function handleGetErrors(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    // Get Lambda errors
    const lambdaErrorsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour buckets
        Statistics: ['Sum'],
    });

    const lambdaErrors = await cloudWatchClient.send(lambdaErrorsCommand);

    // Get API Gateway errors
    const api4xxCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApiGateway',
        MetricName: '4XXError',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
    });

    const api4xxErrors = await cloudWatchClient.send(api4xxCommand);

    const api5xxCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApiGateway',
        MetricName: '5XXError',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
    });

    const api5xxErrors = await cloudWatchClient.send(api5xxCommand);

    const errors = {
        lambda: {
            datapoints: lambdaErrors.Datapoints?.map(dp => ({
                timestamp: dp.Timestamp?.toISOString(),
                count: dp.Sum,
            })),
            total: lambdaErrors.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0,
        },
        apiGateway: {
            '4xx': {
                datapoints: api4xxErrors.Datapoints?.map(dp => ({
                    timestamp: dp.Timestamp?.toISOString(),
                    count: dp.Sum,
                })),
                total: api4xxErrors.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0,
            },
            '5xx': {
                datapoints: api5xxErrors.Datapoints?.map(dp => ({
                    timestamp: dp.Timestamp?.toISOString(),
                    count: dp.Sum,
                })),
                total: api5xxErrors.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0,
            },
        },
    };

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_ERRORS',
        resourceType: 'MONITORING_DATA',
        sourceIp,
        success: true,
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(errors, 'Errors retrieved successfully');

    return toAPIGatewaySuccessResponse(successResponse);
}
