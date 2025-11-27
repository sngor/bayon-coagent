/**
 * Admin System Configuration Lambda
 * 
 * Handles admin operations for system configuration management:
 * - Get system configuration
 * - Update system configuration
 * - List configuration history
 * 
 * Requirements: 8.1 - Admin Service functionality
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getRepository } from '../aws/dynamodb/repository';
import { logAdminOperation } from './utils/admin-audit-logger';

interface SystemConfig {
    featureFlags?: Record<string, boolean>;
    rateLimits?: Record<string, number>;
    maintenanceMode?: boolean;
    allowedDomains?: string[];
    maxUploadSize?: number;
    sessionTimeout?: number;
}

interface UpdateConfigParams {
    config: SystemConfig;
    reason?: string;
}

/**
 * Lambda handler for admin system configuration operations
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Admin system config event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    // Extract admin user info from authorizer context
    const adminUserId = event.requestContext.authorizer?.userId;
    const adminEmail = event.requestContext.authorizer?.email;
    const sourceIp = event.requestContext.identity?.sourceIp;

    if (!adminUserId) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Unauthorized', {
            service: 'admin-system-config',
            code: ErrorCode.UNAUTHORIZED,
        });
        return toAPIGatewayResponse(errorResponse, 403);
    }

    try {
        // Route based on path and method
        if (path.endsWith('/config') && httpMethod === 'GET') {
            return await handleGetConfig(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/config') && httpMethod === 'PUT') {
            return await handleUpdateConfig(event, adminUserId, adminEmail, sourceIp);
        } else if (path.endsWith('/config/history') && httpMethod === 'GET') {
            return await handleGetConfigHistory(event, adminUserId, adminEmail, sourceIp);
        } else {
            const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
            const errorResponse = formatErrorResponse('Endpoint not found', {
                service: 'admin-system-config',
                code: ErrorCode.NOT_FOUND,
                path,
                method: httpMethod,
            });
            return toAPIGatewayResponse(errorResponse, 404);
        }
    } catch (error) {
        console.error('Admin system config error:', error);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse(error as Error, {
            service: 'admin-system-config',
            code: ErrorCode.INTERNAL_ERROR,
        });
        return toAPIGatewayResponse(errorResponse);
    }
}

/**
 * Handle get configuration request
 */
async function handleGetConfig(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const repository = getRepository();

    // Get current system configuration
    const config = await repository.get('SYSTEM', 'CONFIG#CURRENT');

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_CONFIG',
        resourceType: 'SYSTEM_CONFIG',
        sourceIp,
        success: true,
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        config || {
            featureFlags: {},
            rateLimits: {},
            maintenanceMode: false,
            allowedDomains: [],
            maxUploadSize: 10485760, // 10MB
            sessionTimeout: 3600, // 1 hour
        },
        'Configuration retrieved successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle update configuration request
 */
async function handleUpdateConfig(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    if (!event.body) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Request body is required', {
            service: 'admin-system-config',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    const params: UpdateConfigParams = JSON.parse(event.body);

    if (!params.config) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('config is required', {
            service: 'admin-system-config',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    const repository = getRepository();

    // Get current configuration for history
    const currentConfig = await repository.get('SYSTEM', 'CONFIG#CURRENT');

    // Update current configuration
    const timestamp = Date.now();
    await repository.create('SYSTEM', 'CONFIG#CURRENT', 'SystemConfig', {
        ...params.config,
        updatedBy: adminUserId,
        updatedAt: timestamp,
        reason: params.reason,
    });

    // Save to history
    await repository.create('SYSTEM', `CONFIG#HISTORY#${timestamp}`, 'SystemConfigHistory', {
        config: currentConfig,
        newConfig: params.config,
        updatedBy: adminUserId,
        updatedAt: timestamp,
        reason: params.reason,
    });

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'UPDATE_CONFIG',
        resourceType: 'SYSTEM_CONFIG',
        sourceIp,
        success: true,
        details: {
            reason: params.reason,
            changedFields: Object.keys(params.config),
        },
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        { updatedAt: timestamp },
        'Configuration updated successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle get configuration history request
 */
async function handleGetConfigHistory(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 20;

    const repository = getRepository();

    // Query configuration history
    const history = await repository.query('SYSTEM', {
        beginsWith: 'CONFIG#HISTORY#',
        limit,
        scanIndexForward: false, // Most recent first
    });

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_CONFIG_HISTORY',
        resourceType: 'SYSTEM_CONFIG',
        sourceIp,
        success: true,
        details: {
            resultCount: history.length,
        },
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        { history },
        'Configuration history retrieved successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}
