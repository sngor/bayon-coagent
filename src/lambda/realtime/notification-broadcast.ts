/**
 * Notification Broadcast Handler
 * Handles broadcasting notifications via DynamoDB streams
 * Triggered when connection status changes or system events occur
 */

import { DynamoDBStreamHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Create API Gateway Management API client
const apiGatewayClient = captureAWSv3Client(new ApiGatewayManagementApiClient({
    endpoint: process.env.WEBSOCKET_API_ENDPOINT?.replace('wss://', 'https://').replace('/development', '').replace('/production', '')
}));

export const handler: DynamoDBStreamHandler = async (event) => {
    console.log('Notification Broadcast Event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        try {
            await processStreamRecord(record);
        } catch (error) {
            console.error('Error processing stream record:', error);
            // Continue processing other records even if one fails
        }
    }
};

async function processStreamRecord(record: any) {
    const eventName = record.eventName;

    if (eventName === 'INSERT') {
        // New connection established
        const newConnection = unmarshall(record.dynamodb.NewImage);
        await handleUserOnline(newConnection);

    } else if (eventName === 'REMOVE') {
        // Connection removed
        const oldConnection = unmarshall(record.dynamodb.OldImage);
        await handleUserOffline(oldConnection);

    } else if (eventName === 'MODIFY') {
        // Connection updated (e.g., joined/left room)
        const oldConnection = unmarshall(record.dynamodb.OldImage);
        const newConnection = unmarshall(record.dynamodb.NewImage);
        await handleConnectionUpdate(oldConnection, newConnection);
    }
}

async function handleUserOnline(connection: any) {
    console.log(`User ${connection.userId} came online`);

    // Get user's team members or collaborators to notify
    const collaborators = await getUserCollaborators(connection.userId);

    if (collaborators.length === 0) return;

    // Get active connections for collaborators
    const activeConnections = await getActiveConnectionsForUsers(collaborators);

    // Prepare online notification
    const onlineNotification = {
        type: 'userOnline',
        data: {
            userId: connection.userId,
            timestamp: Date.now(),
            status: 'online'
        }
    };

    // Send notifications
    await broadcastToConnections(activeConnections, onlineNotification);
}

async function handleUserOffline(connection: any) {
    console.log(`User ${connection.userId} went offline`);

    // Check if user has other active connections
    const userConnectionsResult = await docClient.send(new QueryCommand({
        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': connection.userId
        }
    }));

    const hasOtherConnections = userConnectionsResult.Items && userConnectionsResult.Items.length > 0;

    if (hasOtherConnections) {
        console.log(`User ${connection.userId} still has other active connections`);
        return;
    }

    // User is completely offline, notify collaborators
    const collaborators = await getUserCollaborators(connection.userId);

    if (collaborators.length === 0) return;

    const activeConnections = await getActiveConnectionsForUsers(collaborators);

    const offlineNotification = {
        type: 'userOffline',
        data: {
            userId: connection.userId,
            timestamp: Date.now(),
            status: 'offline',
            lastSeen: connection.lastActivity || Date.now()
        }
    };

    await broadcastToConnections(activeConnections, offlineNotification);
}

async function handleConnectionUpdate(oldConnection: any, newConnection: any) {
    // Handle room join/leave notifications
    if (oldConnection.roomId !== newConnection.roomId) {
        if (newConnection.roomId && !oldConnection.roomId) {
            // User joined a room
            await handleRoomJoin(newConnection);
        } else if (!newConnection.roomId && oldConnection.roomId) {
            // User left a room
            await handleRoomLeave(oldConnection);
        } else if (newConnection.roomId !== oldConnection.roomId) {
            // User switched rooms
            await handleRoomLeave(oldConnection);
            await handleRoomJoin(newConnection);
        }
    }
}

async function handleRoomJoin(connection: any) {
    console.log(`User ${connection.userId} joined room ${connection.roomId}`);

    // Get other room members
    const roomMembersResult = await docClient.send(new QueryCommand({
        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
        IndexName: 'RoomIndex',
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
            ':roomId': connection.roomId
        }
    }));

    const roomMembers = (roomMembersResult.Items || [])
        .filter(member => member.connectionId !== connection.connectionId);

    if (roomMembers.length === 0) return;

    const joinNotification = {
        type: 'roomMemberJoined',
        data: {
            roomId: connection.roomId,
            userId: connection.userId,
            timestamp: Date.now(),
            roomType: connection.roomType || 'chat'
        }
    };

    const connectionIds = roomMembers.map(member => member.connectionId);
    await broadcastToConnections(connectionIds, joinNotification);
}

async function handleRoomLeave(connection: any) {
    console.log(`User ${connection.userId} left room ${connection.roomId}`);

    // Get remaining room members
    const roomMembersResult = await docClient.send(new QueryCommand({
        TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
        IndexName: 'RoomIndex',
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
            ':roomId': connection.roomId
        }
    }));

    const roomMembers = roomMembersResult.Items || [];

    if (roomMembers.length === 0) return;

    const leaveNotification = {
        type: 'roomMemberLeft',
        data: {
            roomId: connection.roomId,
            userId: connection.userId,
            timestamp: Date.now()
        }
    };

    const connectionIds = roomMembers.map(member => member.connectionId);
    await broadcastToConnections(connectionIds, leaveNotification);
}

async function getUserCollaborators(userId: string): Promise<string[]> {
    // TODO: Implement logic to get user's team members, collaborators, or contacts
    // For now, return empty array - this would be expanded based on business logic

    try {
        // Example: Get user's team members from main table
        const teamResult = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE || `BayonCoAgent-${process.env.NODE_ENV}`,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'TEAM#'
            }
        }));

        const teamMembers = (teamResult.Items || [])
            .map(item => item.memberId)
            .filter(Boolean);

        return teamMembers;
    } catch (error) {
        console.error('Error getting user collaborators:', error);
        return [];
    }
}

async function getActiveConnectionsForUsers(userIds: string[]): Promise<string[]> {
    const connectionIds: string[] = [];

    for (const userId of userIds) {
        try {
            const userConnectionsResult = await docClient.send(new QueryCommand({
                TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                IndexName: 'UserIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            }));

            const userConnections = userConnectionsResult.Items || [];
            connectionIds.push(...userConnections.map(conn => conn.connectionId));
        } catch (error) {
            console.error(`Error getting connections for user ${userId}:`, error);
        }
    }

    return connectionIds;
}

async function broadcastToConnections(connectionIds: string[], message: any) {
    const broadcastPromises = connectionIds.map(async (connectionId) => {
        try {
            await apiGatewayClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(message)
            }));
            console.log(`Notification sent to connection ${connectionId}`);
        } catch (error) {
            console.error(`Failed to send notification to connection ${connectionId}:`, error);

            // If connection is stale, remove it from database
            if (error.name === 'GoneException') {
                await docClient.send(new DeleteCommand({
                    TableName: process.env.REALTIME_CONNECTIONS_TABLE || `BayonCoAgent-RealtimeConnections-${process.env.NODE_ENV}`,
                    Key: { connectionId }
                }));
            }
        }
    });

    await Promise.allSettled(broadcastPromises);
}