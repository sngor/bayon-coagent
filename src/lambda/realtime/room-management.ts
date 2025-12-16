/**
 * Room Management Handler
 * Handles joining and leaving chat rooms/collaboration spaces
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface RoomActionBody {
    action: 'joinRoom' | 'leaveRoom';
    roomId: string;
    roomType?: 'chat' | 'collaboration' | 'content-review' | 'team';
    metadata?: {
        contentId?: string;
        projectId?: string;
        teamId?: string;
    };
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Room Management Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    // Create API Gateway Management API client
    const apiGatewayClient = captureAWSv3Client(new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    }));

    try {
        // Parse request body
        const body: RoomActionBody = JSON.parse(event.body || '{}');

        if (!body.roomId) {
            throw new Error('Missing required field: roomId');
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

        if (body.action === 'joinRoom') {
            // Update connection with room info
            await docClient.send(new UpdateCommand({
                TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                Key: { connectionId },
                UpdateExpression: 'SET roomId = :roomId, roomType = :roomType, joinedAt = :joinedAt, lastActivity = :lastActivity',
                ExpressionAttributeValues: {
                    ':roomId': body.roomId,
                    ':roomType': body.roomType || 'chat',
                    ':joinedAt': Date.now(),
                    ':lastActivity': Date.now()
                }
            }));

            // Get current room members
            const roomMembersResult = await docClient.send(new QueryCommand({
                TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                IndexName: 'RoomIndex',
                KeyConditionExpression: 'roomId = :roomId',
                ExpressionAttributeValues: {
                    ':roomId': body.roomId
                }
            }));

            const roomMembers = roomMembersResult.Items || [];

            // Notify existing room members about new user joining
            const joinNotification = {
                type: 'userJoined',
                data: {
                    roomId: body.roomId,
                    userId,
                    timestamp: Date.now(),
                    roomType: body.roomType || 'chat',
                    metadata: body.metadata || {}
                }
            };

            // Send notification to all other room members
            const notificationPromises = roomMembers
                .filter(member => member.connectionId !== connectionId)
                .map(async (member) => {
                    try {
                        await apiGatewayClient.send(new PostToConnectionCommand({
                            ConnectionId: member.connectionId,
                            Data: JSON.stringify(joinNotification)
                        }));
                    } catch (error) {
                        console.error(`Failed to notify connection ${member.connectionId}:`, error);
                    }
                });

            await Promise.allSettled(notificationPromises);

            // Send confirmation to joining user
            const confirmationMessage = {
                type: 'roomJoined',
                data: {
                    roomId: body.roomId,
                    roomType: body.roomType || 'chat',
                    memberCount: roomMembers.length,
                    timestamp: Date.now()
                }
            };

            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(confirmationMessage)
            }));

            console.log(`User ${userId} joined room ${body.roomId}`);

        } else if (body.action === 'leaveRoom') {
            // Remove room info from connection
            await docClient.send(new UpdateCommand({
                TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                Key: { connectionId },
                UpdateExpression: 'REMOVE roomId, roomType, joinedAt SET lastActivity = :lastActivity',
                ExpressionAttributeValues: {
                    ':lastActivity': Date.now()
                }
            }));

            // Get remaining room members
            const roomMembersResult = await docClient.send(new QueryCommand({
                TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                IndexName: 'RoomIndex',
                KeyConditionExpression: 'roomId = :roomId',
                ExpressionAttributeValues: {
                    ':roomId': body.roomId
                }
            }));

            const remainingMembers = roomMembersResult.Items || [];

            // Notify remaining room members about user leaving
            const leaveNotification = {
                type: 'userLeft',
                data: {
                    roomId: body.roomId,
                    userId,
                    timestamp: Date.now()
                }
            };

            const notificationPromises = remainingMembers.map(async (member) => {
                try {
                    await apiGatewayClient.send(new PostToConnectionCommand({
                        ConnectionId: member.connectionId,
                        Data: JSON.stringify(leaveNotification)
                    }));
                } catch (error) {
                    console.error(`Failed to notify connection ${member.connectionId}:`, error);
                }
            });

            await Promise.allSettled(notificationPromises);

            // Send confirmation to leaving user
            const confirmationMessage = {
                type: 'roomLeft',
                data: {
                    roomId: body.roomId,
                    timestamp: Date.now()
                }
            };

            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(confirmationMessage)
            }));

            console.log(`User ${userId} left room ${body.roomId}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `${body.action} completed successfully`,
                roomId: body.roomId
            })
        };

    } catch (error) {
        console.error('Error in room management:', error);

        // Send error response
        try {
            const errorResponse = {
                type: 'error',
                message: error.message || 'Room operation failed',
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