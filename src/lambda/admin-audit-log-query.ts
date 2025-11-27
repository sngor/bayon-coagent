/**
 * Admin Audit Log Query Lambda
 * 
 * Provides audit log query functionality for admin service:
 * - Query audit logs by admin user
 * - Query audit logs by action type
 * - Query audit logs by time range
 * - Query audit logs by resource
 * 
 * Requirements: 8.2, 8.3 - Admin audit logging
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    CloudWatchLogsClient,
    FilterLogEventsCommand,
    DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { getConfig } from '../aws/config';
import { logAdminOperation } from './utils/admin-audit-logger';

const config = getConfig();
const logsClient = new CloudWatchLogsClient({ region: config.region });

const AUDIT_LOG_GROUP = '/aws/bayon-coagent/admin-audit';

interface AuditLogQuery {
    adminUserId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    nextToken?: string;
}

/**
 * Lambda handler for admin audit log query operations
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Admin audit log query event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    // Extract admin user info from authorizer context
    const adminUserId = event.requestContext.authorizer?.userId;
    const adminEmail = event.requestContext.authorizer?.email;
    const sourceIp = event.requestContext.identity?.sourceIp;

    if (!adminUserId) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Unauthorized', {
            service: 'admin-audit-log-query',
            code: ErrorCode.UNAUTHORIZED,
        });
        return toAPIGatewayResponse(errorResponse, 403);
    }

    try {
        // Route based on path and method
        if (path.endsWith('/audit-logs') && httpMethod === 'GET') {
            return await handleQueryAuditLogs(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/audit-logs/streams') && httpMethod === 'GET') {
            return await handleGetLogStreams(event, adminUserId, adminEmail, sourceIp);
        } else {
            const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
            const errorResponse = formatErrorResponse('Endpoint not found', {
                service: 'admin-audit-log-query',
                code: ErrorCode.NOT_FOUND,
                path,
                method: httpMethod,
            });
            return toAPIGatewayResponse(errorResponse, 404);
        }
    } catch (error) {
        console.error('Admin audit log query error:', error);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse(error as Error, {
            service: 'admin-audit-log-query',
            code: ErrorCode.INTERNAL_ERROR,
        });
        return toAPIGatewayResponse(errorResponse);
    }
}

/**
 * Handle query audit logs request
 */
async function handleQueryAuditLogs(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const query: AuditLogQuery = {
        adminUserId: event.queryStringParameters?.adminUserId,
        action: event.queryStringParameters?.action,
        resourceType: event.queryStringParameters?.resourceType,
        resourceId: event.queryStringParameters?.resourceId,
        startTime: event.queryStringParameters?.startTime,
        endTime: event.queryStringParameters?.endTime,
        limit: event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 100,
        nextToken: event.queryStringParameters?.nextToken,
    };

    const endTime = query.endTime ? new Date(query.endTime).getTime() : Date.now();
    const startTime = query.startTime
        ? new Date(query.startTime).getTime()
        : endTime - 24 * 60 * 60 * 1000; // Default: last 24 hours

    // Build filter pattern
    const filterPatterns: string[] = [];

    if (query.adminUserId) {
        filterPatterns.push(`{ $.adminUserId = "${query.adminUserId}" }`);
    }

    if (query.action) {
        filterPatterns.push(`{ $.action = "${query.action}" }`);
    }

    if (query.resourceType) {
        filterPatterns.push(`{ $.resourceType = "${query.resourceType}" }`);
    }

    if (query.resourceId) {
        filterPatterns.push(`{ $.resourceId = "${query.resourceId}" }`);
    }

    const filterPattern = filterPatterns.length > 0 ? filterPatterns.join(' && ') : undefined;

    // Query CloudWatch Logs
    const command = new FilterLogEventsCommand({
        logGroupName: AUDIT_LOG_GROUP,
        startTime,
        endTime,
        filterPattern,
        limit: query.limit,
        nextToken: query.nextToken,
    });

    try {
        const response = await logsClient.send(command);

        const logs = response.events?.map(event => {
            try {
                return {
                    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : undefined,
                    message: event.message ? JSON.parse(event.message) : undefined,
                    logStreamName: event.logStreamName,
                };
            } catch (error) {
                return {
                    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : undefined,
                    message: event.message,
                    logStreamName: event.logStreamName,
                };
            }
        }) || [];

        // Log admin operation
        await logAdminOperation({
            adminUserId,
            adminEmail,
            action: 'QUERY_AUDIT_LOGS',
            resourceType: 'AUDIT_LOG',
            sourceIp,
            success: true,
            details: {
                query,
                resultCount: logs.length,
            },
        });

        const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
        const successResponse = formatSuccessResponse(
            {
                logs,
                nextToken: response.nextToken,
                searchedLogStreams: response.searchedLogStreams?.length || 0,
            },
            'Audit logs retrieved successfully'
        );

        return toAPIGatewaySuccessResponse(successResponse);
    } catch (error: any) {
        // If log group doesn't exist, return empty results
        if (error.name === 'ResourceNotFoundException') {
            const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
            const successResponse = formatSuccessResponse(
                {
                    logs: [],
                    nextToken: undefined,
                    searchedLogStreams: 0,
                },
                'No audit logs found (log group does not exist yet)'
            );

            return toAPIGatewaySuccessResponse(successResponse);
        }

        throw error;
    }
}

/**
 * Handle get log streams request
 */
async function handleGetLogStreams(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // Get log streams
    const command = new DescribeLogStreamsCommand({
        logGroupName: AUDIT_LOG_GROUP,
        orderBy: 'LastEventTime',
        descending: true,
        limit,
        nextToken,
    });

    try {
        const response = await logsClient.send(command);

        const streams = response.logStreams?.map(stream => ({
            name: stream.logStreamName,
            creationTime: stream.creationTime ? new Date(stream.creationTime).toISOString() : undefined,
            firstEventTime: stream.firstEventTimestamp
                ? new Date(stream.firstEventTimestamp).toISOString()
                : undefined,
            lastEventTime: stream.lastEventTimestamp
                ? new Date(stream.lastEventTimestamp).toISOString()
                : undefined,
            storedBytes: stream.storedBytes,
        })) || [];

        // Log admin operation
        await logAdminOperation({
            adminUserId,
            adminEmail,
            action: 'GET_LOG_STREAMS',
            resourceType: 'AUDIT_LOG',
            sourceIp,
            success: true,
            details: {
                streamCount: streams.length,
            },
        });

        const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
        const successResponse = formatSuccessResponse(
            {
                streams,
                nextToken: response.nextToken,
            },
            'Log streams retrieved successfully'
        );

        return toAPIGatewaySuccessResponse(successResponse);
    } catch (error: any) {
        // If log group doesn't exist, return empty results
        if (error.name === 'ResourceNotFoundException') {
            const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
            const successResponse = formatSuccessResponse(
                {
                    streams: [],
                    nextToken: undefined,
                },
                'No log streams found (log group does not exist yet)'
            );

            return toAPIGatewaySuccessResponse(successResponse);
        }

        throw error;
    }
}
