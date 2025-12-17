/**
 * Real-Time Notification Processor
 * 
 * Handles real-time notifications via WebSocket API Gateway
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface RealtimeNotificationEvent {
    userId: string;
    type: 'content_generated' | 'content_published' | 'job_progress' | 'system_alert' | 'usage_warning';
    message: string;
    data?: any;
    timestamp: string;
}

interface ProgressUpdateEvent {
    userId: string;
    jobId: string;
    jobType: string;
    progress: number; // 0-100
    status: 'started' | 'processing' | 'completed' | 'failed';
    message: string;
    estimatedTimeRemaining?: number;
    timestamp: string;
}

const config = getConfig();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

// WebSocket API Gateway Management API client
const apiGatewayManagement = new ApiGatewayManagementApiClient({
    region: config.region,
    endpoint: process.env.WEBSOCKET_API_ENDPOINT
});

export const handler = async (
    event: EventBridgeEvent<string, RealtimeNotificationEvent | ProgressUpdateEvent>,
    context: Context
) => {
    console.log('Processing real-time notification event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'Real-time Notification':
                await handleRealtimeNotification(event.detail as RealtimeNotificationEvent);
                break;

            case 'Job Progress Update':
                await handleProgressUpdate(event.detail as ProgressUpdateEvent);
                break;

            default:
                console.warn('Unknown notification event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notification processed successfully' })
        };

    } catch (error) {
        console.error('Error processing notification event:', error);
        throw error;
    }
};

async function handleRealtimeNotification(detail: RealtimeNotificationEvent) {
    console.log('Handling real-time notification for user:', detail.userId);

    // Get active WebSocket connections for the user
    const connections = await getUserConnections(detail.userId);

    if (connections.length === 0) {
        console.log('No active connections for user:', detail.userId);
        return;
    }

    // Prepare notification payload
    const notification = {
        type: 'notification',
        event: detail.type,
        message: detail.message,
        data: detail.data,
        timestamp: detail.timestamp
    };

    // Send to all user connections
    await sendToConnections(connections, notification);
}

async function handleProgressUpdate(detail: ProgressUpdateEvent) {
    console.log('Handling progress update for job:', detail.jobId);

    // Get active WebSocket connections for the user
    const connections = await getUserConnections(detail.userId);

    if (connections.length === 0) {
        console.log('No active connections for user:', detail.userId);
        return;
    }

    // Prepare progress payload
    const progressUpdate = {
        type: 'progress',
        jobId: detail.jobId,
        jobType: detail.jobType,
        progress: detail.progress,
        status: detail.status,
        message: detail.message,
        estimatedTimeRemaining: detail.estimatedTimeRemaining,
        timestamp: detail.timestamp
    };

    // Send to all user connections
    await sendToConnections(connections, progressUpdate);

    // Store progress in database for recovery
    await storeProgressUpdate(detail);
}

async function getUserConnections(userId: string): Promise<string[]> {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'WEBSOCKET#'
        }
    };

    const result = await dynamoClient.send(new QueryCommand(params));

    return result.Items?.map(item => item.ConnectionId) || [];
}

async function sendToConnections(connections: string[], payload: any) {
    const message = JSON.stringify(payload);
    const promises = connections.map(async (connectionId) => {
        try {
            await apiGatewayManagement.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: Buffer.from(message)
            }));

            console.log('Message sent to connection:', connectionId);

        } catch (error: any) {
            console.error('Failed to send message to connection:', connectionId, error);

            // If connection is stale, remove it
            if (error.statusCode === 410) {
                await removeStaleConnection(connectionId);
            }
        }
    });

    await Promise.allSettled(promises);
}

async function removeStaleConnection(connectionId: string) {
    // Find and remove the stale connection from DynamoDB
    // This is a simplified version - in practice, you'd need to query by GSI
    console.log('Removing stale connection:', connectionId);

    // Implementation would depend on your connection storage pattern
}

async function storeProgressUpdate(detail: ProgressUpdateEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `PROGRESS#${detail.jobId}`,
            EntityType: 'Progress',
            UserId: detail.userId,
            JobId: detail.jobId,
            JobType: detail.jobType,
            Progress: detail.progress,
            Status: detail.status,
            Message: detail.message,
            EstimatedTimeRemaining: detail.estimatedTimeRemaining,
            UpdatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Progress update stored for job:', detail.jobId);
}

// WebSocket connection management functions
export const connectHandler = async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing userId parameter' })
        };
    }

    // Store connection in DynamoDB
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${userId}`,
            SK: `WEBSOCKET#${connectionId}`,
            EntityType: 'WebSocketConnection',
            UserId: userId,
            ConnectionId: connectionId,
            ConnectedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }
    };

    await dynamoClient.send(new PutCommand(params));

    console.log('WebSocket connected:', { userId, connectionId });

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Connected successfully' })
    };
};

export const disconnectHandler = async (event: any) => {
    const connectionId = event.requestContext.connectionId;

    // Remove connection from DynamoDB
    // This is simplified - you'd need to find the user first
    console.log('WebSocket disconnected:', connectionId);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Disconnected successfully' })
    };
};