/**
 * Chat Message Handler
 * Handles sending and receiving chat messages between agents
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface ChatMessageBody {
    action: 'sendMessage';
    roomId: string;
    message: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    metadata?: {
        fileName?: string;
        fileSize?: number;
        imageUrl?: string;
        mentions?: string[];
    };
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Chat Message Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    // Create API Gateway Management API client
    const apiGatewayClient = captureAWSv3Client(new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    }));

    try {
        // Parse message body
        const body: ChatMessageBody = JSON.parse(event.body || '{}');

        if (!body.roomId || !body.message) {
            throw new Error('Missing required fields: roomId and message');
        }

        // Get sender info from connection
        const connectionResult = await docClient.send(new GetCommand({
            TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
            Key: { connectionId }
        }));

        const connection = connectionResult.Item;
        if (!connection) {
            throw new Error('Connection not found');
        }

        const senderId = connection.userId;
        const timestamp = Date.now();
        const messageId = uuidv4();

        // Store message in database
        const messageData = {
            roomId: body.roomId,
            timestamp,
            messageId,
            senderId,
            message: body.message,
            messageType: body.messageType || 'text',
            metadata: body.metadata || {},
            TTL: Math.floor(Date.now() / 1000) + parseInt(process.env.CHAT_HISTORY_TTL || '2592000'), // 30 days default
            createdAt: timestamp
        };

        await docClient.send(new PutCommand({
            TableName: process.env.CHAT_MESSAGES_TABLE || `BayonCoAgent-ChatMessages-${process.env.NODE_ENV}`,
            Item: messageData
        }));

        // Get all connections in the room
        const roomConnectionsResult = await docClient.send(new QueryCommand({
            TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
            IndexName: 'RoomIndex',
            KeyConditionExpression: 'roomId = :roomId',
            ExpressionAttributeValues: {
                ':roomId': body.roomId
            }
        }));

        const roomConnections = roomConnectionsResult.Items || [];

        // Prepare message to broadcast
        const broadcastMessage = {
            type: 'chatMessage',
            data: {
                messageId,
                roomId: body.roomId,
                senderId,
                message: body.message,
                messageType: body.messageType || 'text',
                metadata: body.metadata || {},
                timestamp
            }
        };

        // Broadcast message to all connections in the room
        const broadcastPromises = roomConnections.map(async (conn) => {
            try {
                await apiGatewayClient.send(new PostToConnectionCommand({
                    ConnectionId: conn.connectionId,
                    Data: JSON.stringify(broadcastMessage)
                }));
                console.log(`Message sent to connection ${conn.connectionId}`);
            } catch (error) {
                console.error(`Failed to send message to connection ${conn.connectionId}:`, error);

                // If connection is stale, remove it from database
                if (error.name === 'GoneException') {
                    await docClient.send(new DeleteCommand({
                        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                        Key: { connectionId: conn.connectionId }
                    }));
                }
            }
        });

        await Promise.allSettled(broadcastPromises);

        // Send confirmation back to sender
        const confirmationMessage = {
            type: 'messageConfirmation',
            data: {
                messageId,
                status: 'sent',
                timestamp
            }
        };

        await apiGatewayClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(confirmationMessage)
        }));

        console.log(`Chat message ${messageId} processed successfully for room ${body.roomId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Message sent successfully',
                messageId,
                timestamp
            })
        };

    } catch (error) {
        console.error('Error processing chat message:', error);

        // Send error response to sender
        try {
            const errorResponse = {
                type: 'error',
                message: error.message || 'Failed to send message',
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