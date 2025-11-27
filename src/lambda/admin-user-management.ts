/**
 * Admin User Management Lambda
 * 
 * Handles admin operations for user management:
 * - List users
 * - Update user attributes
 * - Delete users
 * 
 * Requirements: 8.1 - Admin Service functionality
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminGetUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminDeleteUserCommand,
    AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { getConfig } from '../aws/config';
import { logAdminOperation } from './utils/admin-audit-logger';

const config = getConfig();
const cognitoClient = new CognitoIdentityProviderClient({
    region: config.region,
    endpoint: config.cognito.endpoint,
});

interface ListUsersParams {
    limit?: number;
    paginationToken?: string;
    filter?: string;
}

interface UpdateUserParams {
    username: string;
    attributes: Record<string, string>;
}

interface DeleteUserParams {
    username: string;
}

/**
 * Lambda handler for admin user management operations
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Admin user management event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    // Extract admin user info from authorizer context
    const adminUserId = event.requestContext.authorizer?.userId;
    const adminEmail = event.requestContext.authorizer?.email;
    const sourceIp = event.requestContext.identity?.sourceIp;

    if (!adminUserId) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Unauthorized', {
            service: 'admin-user-management',
            code: ErrorCode.UNAUTHORIZED,
        });
        return toAPIGatewayResponse(errorResponse, 403);
    }

    try {
        // Route based on path and method
        if (path.endsWith('/users') && httpMethod === 'GET') {
            return await handleListUsers(event, adminUserId, adminEmail, sourceIp);
        } else if (path.match(/\/users\/[^/]+$/) && httpMethod === 'GET') {
            return await handleGetUser(event, adminUserId, adminEmail, sourceIp);
        } else if (path.match(/\/users\/[^/]+$/) && httpMethod === 'PUT') {
            return await handleUpdateUser(event, adminUserId, adminEmail, sourceIp);
        } else if (path.match(/\/users\/[^/]+$/) && httpMethod === 'DELETE') {
            return await handleDeleteUser(event, adminUserId, adminEmail, sourceIp);
        } else {
            const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
            const errorResponse = formatErrorResponse('Endpoint not found', {
                service: 'admin-user-management',
                code: ErrorCode.NOT_FOUND,
                path,
                method: httpMethod,
            });
            return toAPIGatewayResponse(errorResponse, 404);
        }
    } catch (error) {
        console.error('Admin user management error:', error);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse(error as Error, {
            service: 'admin-user-management',
            code: ErrorCode.INTERNAL_ERROR,
        });
        return toAPIGatewayResponse(errorResponse);
    }
}

/**
 * Handle list users request
 */
async function handleListUsers(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const params: ListUsersParams = {
        limit: event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 60,
        paginationToken: event.queryStringParameters?.paginationToken,
        filter: event.queryStringParameters?.filter,
    };

    const command = new ListUsersCommand({
        UserPoolId: config.cognito.userPoolId,
        Limit: params.limit,
        PaginationToken: params.paginationToken,
        Filter: params.filter,
    });

    const response = await cognitoClient.send(command);

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'LIST_USERS',
        resourceType: 'USER',
        sourceIp,
        success: true,
        details: {
            filter: params.filter,
            resultCount: response.Users?.length || 0,
        },
    });

    const users = response.Users?.map(user => ({
        username: user.Username,
        email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
        emailVerified: user.Attributes?.find(attr => attr.Name === 'email_verified')?.Value === 'true',
        status: user.UserStatus,
        enabled: user.Enabled,
        createdAt: user.UserCreateDate?.toISOString(),
        lastModifiedAt: user.UserLastModifiedDate?.toISOString(),
        attributes: user.Attributes?.reduce((acc, attr) => {
            if (attr.Name && attr.Value) {
                acc[attr.Name] = attr.Value;
            }
            return acc;
        }, {} as Record<string, string>),
    })) || [];

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        {
            users,
            paginationToken: response.PaginationToken,
        },
        'Users retrieved successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle get user request
 */
async function handleGetUser(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const username = event.pathParameters?.username;

    if (!username) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('username is required', {
            service: 'admin-user-management',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    const command = new AdminGetUserCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: username,
    });

    const response = await cognitoClient.send(command);

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'GET_USER',
        resourceType: 'USER',
        resourceId: username,
        sourceIp,
        success: true,
    });

    const user = {
        username: response.Username,
        email: response.UserAttributes?.find(attr => attr.Name === 'email')?.Value,
        emailVerified: response.UserAttributes?.find(attr => attr.Name === 'email_verified')?.Value === 'true',
        status: response.UserStatus,
        enabled: response.Enabled,
        createdAt: response.UserCreateDate?.toISOString(),
        lastModifiedAt: response.UserLastModifiedDate?.toISOString(),
        attributes: response.UserAttributes?.reduce((acc, attr) => {
            if (attr.Name && attr.Value) {
                acc[attr.Name] = attr.Value;
            }
            return acc;
        }, {} as Record<string, string>),
    };

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(user, 'User retrieved successfully');

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle update user request
 */
async function handleUpdateUser(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const username = event.pathParameters?.username;

    if (!username) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('username is required', {
            service: 'admin-user-management',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    if (!event.body) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('Request body is required', {
            service: 'admin-user-management',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    const params: UpdateUserParams = JSON.parse(event.body);

    if (!params.attributes || Object.keys(params.attributes).length === 0) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('attributes are required', {
            service: 'admin-user-management',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Convert attributes to Cognito format
    const userAttributes: AttributeType[] = Object.entries(params.attributes).map(([name, value]) => ({
        Name: name,
        Value: value,
    }));

    const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: username,
        UserAttributes: userAttributes,
    });

    await cognitoClient.send(command);

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'UPDATE_USER',
        resourceType: 'USER',
        resourceId: username,
        sourceIp,
        success: true,
        details: {
            updatedAttributes: Object.keys(params.attributes),
        },
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        { username },
        'User updated successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle delete user request
 */
async function handleDeleteUser(
    event: APIGatewayProxyEvent,
    adminUserId: string,
    adminEmail: string | undefined,
    sourceIp: string | undefined
): Promise<APIGatewayProxyResult> {
    const username = event.pathParameters?.username;

    if (!username) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');
        const errorResponse = formatErrorResponse('username is required', {
            service: 'admin-user-management',
            code: ErrorCode.BAD_REQUEST,
        });
        return toAPIGatewayResponse(errorResponse, 400);
    }

    const command = new AdminDeleteUserCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: username,
    });

    await cognitoClient.send(command);

    // Log admin operation
    await logAdminOperation({
        adminUserId,
        adminEmail,
        action: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: username,
        sourceIp,
        success: true,
    });

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');
    const successResponse = formatSuccessResponse(
        { username },
        'User deleted successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}
