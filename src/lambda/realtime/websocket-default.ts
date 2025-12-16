/**
 * WebSocket Default Handler
 * Handles unrecognized WebSocket routes and provides helpful error messages
 * 
 * Features:
 * - Route validation and error reporting
 * - Connection health updates
 * - Proper error responses
 * - Debugging information
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../../aws/dynamodb/client';
import { getConfig } from '../../aws/config';
import { wrapDynamoDBError } from '../../aws/dynamodb/errors';

/**
 * Gets the realtime connections table name from environment
 */
function getRealtimeConnectionsTableName(): string {
    const config = getConfig();
    return process.env.REALTIME_CONNECTIONS_TABLE ||
        `BayonCoAgent-RealtimeConnections-${config.environment}`;
}

/**
 * Updates connection's last activity timestamp
 */
async function updateConnectionActivity(connectionId: string): Promise<void> {
    try {
        const docClient = getDocumentClient();
        const tableName = getRealtimeConnectionsTableName();

        await docClient.send(new UpdateCommand({
            TableName: tableName,
            Key: { connectionId },
            UpdateExpression: 'SET lastActivity = :timestamp',
            ExpressionAttributeValues: {
                ':timestamp': Date.now()
            },
            // Don't fail if connection doesn't exist
            ReturnValues: 'NONE'
        }));
    } catch (error) {
        // Don't fail the request if activity update fails
        console.warn('Failed to update connection activity:', error);
    }
}

/**
 * Available WebSocket routes for error messaging
 */
const AVAILABLE_ROUTES = [
    'sendMessage',
    'joinRoom',
    'leaveRoom',
    'updateStatus'
];

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('WebSocket Default Route Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;

    try {
        // Parse the message body to get the action
        let action: string | undefined;
        let messageData: any = {};

        if (event.body) {
            try {
                const parsedBody = JSON.parse(event.body);
                action = parsedBody.action;
                messageData = parsedBody;
            } catch (parseError) {
                console.warn('Failed to parse WebSocket message body:', parseError);
            }
        }

        // Update connection activity
        await updateConnectionActivity(connectionId);

        // Log the unrecognized route for debugging
        console.warn('Unrecognized WebSocket route or action:', {
            connectionId,
            routeKey,
            action,
            availableRoutes: AVAILABLE_ROUTES
        });

        // Provide helpful error message
        const errorMessage = action
            ? `Unrecognized action: "${action}". Available actions: ${AVAILABLE_ROUTES.join(', ')}`
            : `Unrecognized route: "${routeKey}". Available routes: ${AVAILABLE_ROUTES.join(', ')}`;

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: errorMessage,
                error: 'UNRECOGNIZED_ROUTE',
                availableRoutes: AVAILABLE_ROUTES,
                receivedAction: action,
                receivedRoute: routeKey,
                timestamp: Date.now()
            })
        };

    } catch (error: any) {
        // Use established error handling pattern
        const wrappedError = wrapDynamoDBError(error);

        console.error('Error in WebSocket default handler:', {
            error: wrappedError.message,
            connectionId,
            routeKey,
            originalError: error
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: 'DEFAULT_HANDLER_ERROR',
                timestamp: Date.now()
            })
        };
    }
};