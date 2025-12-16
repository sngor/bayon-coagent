/**
 * WebSocket Connect Handler
 * Handles new WebSocket connections and stores connection info
 * 
 * Features:
 * - JWT token validation using Cognito
 * - Connection tracking in DynamoDB
 * - User presence management
 * - Error handling with proper logging
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { handleError, validateRequiredFields, ErrorCodes, RealtimeError } from '../utils/error-handler';
import { wrapDynamoDBError } from '@/aws/dynamodb';
import { getDocumentClient } from '@/aws/dynamodb';
import { validateSession } from '../cognito-authorizer';
import getConfig from 'next/config';

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface ConnectionData {
    connectionId: string;
    userId: string;
    connectedAt: number;
    TTL: number;
    status: 'connected' | 'disconnected';
    lastActivity: number;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * Extracts JWT token from WebSocket connection request
 */
function extractToken(event: any): string | null {
    // Check query string parameters first
    if (event.queryStringParameters?.token) {
        return event.queryStringParameters.token;
    }

    // Check headers as fallback
    if (event.headers) {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (authHeader) {
            const match = authHeader.match(/^Bearer\s+(.+)$/i);
            return match ? match[1] : null;
        }
    }

    return null;
}

/**
 * Gets the realtime connections table name from environment
 */
function getRealtimeConnectionsTableName(): string {
    const config = getConfig();
    return process.env.REALTIME_CONNECTIONS_TABLE ||
        `BayonCoAgent-RealtimeConnections-${config.environment}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('WebSocket Connect Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const userId = event.queryStringParameters?.userId;
    const token = extractToken(event);

    if (!userId || !token) {
        console.error('Missing userId or token in connection request', {
            hasUserId: !!userId,
            hasToken: !!token,
            queryParams: event.queryStringParameters
        });
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing userId or token',
                error: 'MISSING_CREDENTIALS'
            })
        };
    }

    try {
        // Validate JWT token using established auth pattern
        const isValidSession = await validateSession(userId, token);
        if (!isValidSession) {
            console.error('Invalid session for WebSocket connection', { userId, connectionId });
            return {
                statusCode: 401,
                body: JSON.stringify({
                    message: 'Invalid or expired token',
                    error: 'INVALID_TOKEN'
                })
            };
        }

        // Use established DynamoDB client pattern
        const docClient = getDocumentClient();
        const tableName = getRealtimeConnectionsTableName();

        // Store connection info with proper metadata
        const connectionData: ConnectionData = {
            connectionId,
            userId,
            connectedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours TTL
            status: 'connected',
            lastActivity: Date.now(),
            userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'] || undefined,
            ipAddress: event.requestContext.identity?.sourceIp || undefined
        };

        await docClient.send(new PutCommand({
            TableName: tableName,
            Item: connectionData,
            // Prevent overwriting existing connections
            ConditionExpression: 'attribute_not_exists(connectionId)'
        }));

        console.log('WebSocket connection established successfully', {
            connectionId,
            userId,
            tableName
        });

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Connected successfully',
                connectionId,
                timestamp: Date.now()
            })
        };

    } catch (error: any) {
        // Use established error handling pattern
        const wrappedError = wrapDynamoDBError(error);

        console.error('Error handling WebSocket connection:', {
            error: wrappedError.message,
            connectionId,
            userId,
            originalError: error
        });

        // Return appropriate error response
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    message: 'Connection already exists',
                    error: 'CONNECTION_EXISTS'
                })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: 'CONNECTION_FAILED'
            })
        };
    }
};