/**
 * WebSocket Disconnect Handler
 * Handles WebSocket disconnections and cleans up connection info
 * 
 * Features:
 * - Connection cleanup in DynamoDB
 * - User presence management
 * - Graceful error handling
 * - Proper logging for monitoring
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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
 * Cleans up user's other stale connections (optional cleanup)
 */
async function cleanupStaleConnections(userId: string, currentConnectionId: string): Promise<void> {
    try {
        const docClient = getDocumentClient();
        const tableName = getRealtimeConnectionsTableName();

        // Query for user's other connections
        const queryResult = await docClient.send(new QueryCommand({
            TableName: tableName,
            IndexName: 'UserIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':currentConnection': currentConnectionId
            },
            FilterExpression: 'connectionId <> :currentConnection'
        }));

        // Delete stale connections (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const staleConnections = queryResult.Items?.filter(item =>
            item.lastActivity < oneHourAgo
        ) || [];

        if (staleConnections.length > 0) {
            console.log(`Cleaning up ${staleConnections.length} stale connections for user ${userId}`);

            for (const connection of staleConnections) {
                await docClient.send(new DeleteCommand({
                    TableName: tableName,
                    Key: { connectionId: connection.connectionId }
                }));
            }
        }
    } catch (error) {
        // Don't fail the disconnect if cleanup fails
        console.warn('Failed to cleanup stale connections:', error);
    }
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('WebSocket Disconnect Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;

    try {
        const docClient = getDocumentClient();
        const tableName = getRealtimeConnectionsTableName();

        // First, try to get the connection to find the userId
        let userId: string | undefined;
        try {
            const queryResult = await docClient.send(new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'connectionId = :connectionId',
                ExpressionAttributeValues: {
                    ':connectionId': connectionId
                },
                Limit: 1
            }));

            if (queryResult.Items && queryResult.Items.length > 0) {
                userId = queryResult.Items[0].userId;
            }
        } catch (queryError) {
            console.warn('Could not query connection before deletion:', queryError);
        }

        // Delete the connection record
        await docClient.send(new DeleteCommand({
            TableName: tableName,
            Key: { connectionId },
            // Don't fail if connection doesn't exist
            ReturnValues: 'ALL_OLD'
        }));

        console.log('WebSocket connection disconnected successfully', {
            connectionId,
            userId: userId || 'unknown'
        });

        // Optional: Clean up stale connections for this user
        if (userId) {
            await cleanupStaleConnections(userId, connectionId);
        }

        // Broadcast user offline status to relevant rooms
        // This will be handled by the notification broadcast function via DynamoDB streams

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Disconnected successfully',
                connectionId,
                timestamp: Date.now()
            })
        };

    } catch (error: any) {
        // Use established error handling pattern
        const wrappedError = wrapDynamoDBError(error);

        console.error('Error handling WebSocket disconnection:', {
            error: wrappedError.message,
            connectionId,
            originalError: error
        });

        // Return success even if cleanup fails - connection is gone anyway
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Disconnected (with cleanup errors)',
                connectionId,
                timestamp: Date.now()
            })
        };
    }
};