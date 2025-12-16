/**
 * Live Updates Handler
 * Handles real-time status updates for content, projects, and user activities
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface LiveUpdateBody {
    action: 'updateStatus';
    resourceType: 'content' | 'project' | 'user' | 'system';
    resourceId: string;
    status: string;
    progress?: number;
    metadata?: {
        stage?: string;
        error?: string;
        completedSteps?: string[];
        totalSteps?: number;
        estimatedCompletion?: number;
    };
    notifyUsers?: string[]; // Specific users to notify
    notifyRooms?: string[]; // Specific rooms to notify
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Live Updates Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    // Create API Gateway Management API client
    const apiGatewayClient = captureAWSv3Client(new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    }));

    try {
        // Parse request body
        const body: LiveUpdateBody = JSON.parse(event.body || '{}');

        if (!body.resourceType || !body.resourceId || !body.status) {
            throw new Error('Missing required fields: resourceType, resourceId, and status');
        }

        // Get connection info
        const connectionResult = await docClient.send(new GetCommand({
            TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
            Key: { connectionId }
        }));

        const connection = connectionResult.Item;
        if (!connection) {
            throw new Error('Connection not found');
        }

        const userId = connection.userId;
        const timestamp = Date.now();

        // Store/update status in live status table
        const statusData = {
            resourceId: body.resourceId,
            resourceType: body.resourceType,
            status: body.status,
            progress: body.progress || 0,
            metadata: body.metadata || {},
            updatedBy: userId,
            updatedAt: timestamp,
            TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days TTL
        };

        await docClient.send(new PutCommand({
            TableName: process.env.LIVE_STATUS_TABLE || `BayonCoAgent-LiveStatus-${process.env.NODE_ENV}`,
            Item: statusData
        }));

        // Prepare update notification
        const updateNotification = {
            type: 'liveUpdate',
            data: {
                resourceType: body.resourceType,
                resourceId: body.resourceId,
                status: body.status,
                progress: body.progress || 0,
                metadata: body.metadata || {},
                updatedBy: userId,
                timestamp
            }
        };

        // Determine who to notify
        const connectionsToNotify = new Set<string>();

        // Add specific users if provided
        if (body.notifyUsers && body.notifyUsers.length > 0) {
            for (const targetUserId of body.notifyUsers) {
                const userConnectionsResult = await docClient.send(new QueryCommand({
                    TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                    IndexName: 'UserIndex',
                    KeyConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues: {
                        ':userId': targetUserId
                    }
                }));

                const userConnections = userConnectionsResult.Items || [];
                userConnections.forEach(conn => connectionsToNotify.add(conn.connectionId));
            }
        }

        // Add specific rooms if provided
        if (body.notifyRooms && body.notifyRooms.length > 0) {
            for (const roomId of body.notifyRooms) {
                const roomConnectionsResult = await docClient.send(new QueryCommand({
                    TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                    IndexName: 'RoomIndex',
                    KeyConditionExpression: 'roomId = :roomId',
                    ExpressionAttributeValues: {
                        ':roomId': roomId
                    }
                }));

                const roomConnections = roomConnectionsResult.Items || [];
                roomConnections.forEach(conn => connectionsToNotify.add(conn.connectionId));
            }
        }

        // If no specific targets, notify based on resource type and ownership
        if (connectionsToNotify.size === 0) {
            // For content updates, notify the owner and collaborators
            if (body.resourceType === 'content') {
                // Get content info from main table to find owner and collaborators
                const contentResult = await docClient.send(new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE || `BayonCoAgent-${process.env.NODE_ENV}`,
                    Key: {
                        PK: `USER#${userId}`,
                        SK: `CONTENT#${body.resourceId}`
                    }
                }));

                if (contentResult.Item) {
                    // Notify content owner
                    const ownerConnectionsResult = await docClient.send(new QueryCommand({
                        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                        IndexName: 'UserIndex',
                        KeyConditionExpression: 'userId = :userId',
                        ExpressionAttributeValues: {
                            ':userId': userId
                        }
                    }));

                    const ownerConnections = ownerConnectionsResult.Items || [];
                    ownerConnections.forEach(conn => connectionsToNotify.add(conn.connectionId));

                    // TODO: Add logic to notify collaborators if content has shared access
                }
            }
        }

        // Send notifications to all target connections
        const notificationPromises = Array.from(connectionsToNotify).map(async (targetConnectionId) => {
            try {
                await apiGatewayClient.send(new PostToConnectionCommand({
                    ConnectionId: targetConnectionId,
                    Data: JSON.stringify(updateNotification)
                }));
                console.log(`Live update sent to connection ${targetConnectionId}`);
            } catch (error) {
                console.error(`Failed to send live update to connection ${targetConnectionId}:`, error);

                // If connection is stale, remove it from database
                if (error.name === 'GoneException') {
                    await docClient.send(new DeleteCommand({
                        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                        Key: { connectionId: targetConnectionId }
                    }));
                }
            }
        });

        await Promise.allSettled(notificationPromises);

        // Send confirmation back to sender
        const confirmationMessage = {
            type: 'updateConfirmation',
            data: {
                resourceId: body.resourceId,
                status: 'updated',
                notifiedConnections: connectionsToNotify.size,
                timestamp
            }
        };

        await apiGatewayClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(confirmationMessage)
        }));

        console.log(`Live update processed for ${body.resourceType} ${body.resourceId}, notified ${connectionsToNotify.size} connections`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Live update sent successfully',
                resourceId: body.resourceId,
                notifiedConnections: connectionsToNotify.size,
                timestamp
            })
        };

    } catch (error) {
        console.error('Error processing live update:', error);

        // Send error response
        try {
            const errorResponse = {
                type: 'error',
                message: error.message || 'Failed to process live update',
                timestamp: Date.now()
            };

            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(errorResponse)
            }));
        } catch (sendError) {
            console.error('Failed to send error response:', sendError);
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};