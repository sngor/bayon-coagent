/**
 * Admin Metrics Aggregation Lambda
 * 
 * Scheduled Lambda function that runs hourly to aggregate analytics metrics.
 * Calculates daily/weekly active users, feature usage statistics, and stores
 * aggregated metrics for fast queries.
 * 
 * Triggered by: EventBridge (hourly schedule)
 * Environment Variables:
 * - DYNAMODB_TABLE_NAME: DynamoDB table name
 * - AWS_REGION: AWS region
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';

interface AnalyticsEvent {
    eventId: string;
    userId: string;
    eventType: 'page_view' | 'feature_use' | 'content_create' | 'ai_request' | 'error';
    eventData: Record<string, any>;
    timestamp: number;
    sessionId: string;
    metadata: {
        userAgent: string;
        ipAddress: string;
        platform: string;
    };
}

interface PlatformMetrics {
    activeUsers: number;
    totalUsers: number;
    newSignups24h: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionDuration: number;
    featureUsage: Record<string, number>;
    contentCreated: {
        total: number;
        byType: Record<string, number>;
    };
    aiUsage: {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
    };
}

/**
 * Queries analytics events for a specific date
 */
async function queryAnalyticsEvents(date: string): Promise<AnalyticsEvent[]> {
    const events: AnalyticsEvent[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
        const command = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `ANALYTICS#${date}`,
            },
            ExclusiveStartKey: lastEvaluatedKey,
        });

        const response = await docClient.send(command);

        if (response.Items) {
            events.push(...response.Items.map(item => item.Data as AnalyticsEvent));
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return events;
}

/**
 * Queries all user profiles to get total user count
 */
async function getTotalUserCount(): Promise<number> {
    // This is a simplified version - in production, you might want to maintain a counter
    // or use a more efficient method
    return 0; // Placeholder - would need to scan or maintain a counter
}

/**
 * Calculates daily active users from events
 */
function calculateDailyActiveUsers(events: AnalyticsEvent[]): number {
    const uniqueUsers = new Set(events.map(e => e.userId));
    return uniqueUsers.size;
}

/**
 * Calculates weekly active users from events of the past 7 days
 */
async function calculateWeeklyActiveUsers(date: Date): Promise<number> {
    const uniqueUsers = new Set<string>();

    // Query events for the past 7 days
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(date);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const events = await queryAnalyticsEvents(dateStr);
        events.forEach(e => uniqueUsers.add(e.userId));
    }

    return uniqueUsers.size;
}

/**
 * Calculates average session duration from events
 */
function calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessionDurations = new Map<string, { start: number; end: number }>();

    // Group events by session
    events.forEach(event => {
        const session = sessionDurations.get(event.sessionId);
        if (!session) {
            sessionDurations.set(event.sessionId, {
                start: event.timestamp,
                end: event.timestamp,
            });
        } else {
            session.start = Math.min(session.start, event.timestamp);
            session.end = Math.max(session.end, event.timestamp);
        }
    });

    // Calculate average duration
    if (sessionDurations.size === 0) {
        return 0;
    }

    const totalDuration = Array.from(sessionDurations.values())
        .reduce((sum, session) => sum + (session.end - session.start), 0);

    return Math.floor(totalDuration / sessionDurations.size);
}

/**
 * Aggregates feature usage from events
 */
function aggregateFeatureUsage(events: AnalyticsEvent[]): Record<string, number> {
    const featureUsage: Record<string, number> = {};

    events
        .filter(e => e.eventType === 'feature_use')
        .forEach(event => {
            const feature = event.eventData?.feature || 'unknown';
            featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        });

    return featureUsage;
}

/**
 * Aggregates content creation statistics
 */
function aggregateContentCreated(events: AnalyticsEvent[]): {
    total: number;
    byType: Record<string, number>;
} {
    const byType: Record<string, number> = {};

    events
        .filter(e => e.eventType === 'content_create')
        .forEach(event => {
            const contentType = event.eventData?.contentType || 'unknown';
            byType[contentType] = (byType[contentType] || 0) + 1;
        });

    const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

    return { total, byType };
}

/**
 * Aggregates AI usage statistics
 */
function aggregateAIUsage(events: AnalyticsEvent[]): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
} {
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;

    events
        .filter(e => e.eventType === 'ai_request')
        .forEach(event => {
            totalRequests++;
            totalTokens += event.eventData?.tokens || 0;
            totalCost += event.eventData?.cost || 0;
        });

    return { totalRequests, totalTokens, totalCost };
}

/**
 * Counts new signups in the last 24 hours
 */
async function countNewSignups(date: Date): Promise<number> {
    // This would need to query user creation events
    // For now, return 0 as placeholder
    return 0;
}

/**
 * Stores aggregated metrics in DynamoDB
 */
async function storeAggregatedMetrics(date: string, metrics: PlatformMetrics): Promise<void> {
    const command = new BatchWriteCommand({
        RequestItems: {
            [tableName]: [
                {
                    PutRequest: {
                        Item: {
                            PK: `METRICS#${date}`,
                            SK: 'DAILY',
                            EntityType: 'AggregatedMetrics',
                            Data: {
                                date,
                                ...metrics,
                            },
                            CreatedAt: Date.now(),
                            UpdatedAt: Date.now(),
                        },
                    },
                },
            ],
        },
    });

    await docClient.send(command);
}

/**
 * Main handler function
 */
export const handler: Handler<ScheduledEvent> = async (event, context) => {
    console.log('Starting metrics aggregation job', {
        time: event.time,
        requestId: context.awsRequestId,
    });

    try {
        // Get yesterday's date (aggregate previous day's data)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        console.log(`Aggregating metrics for date: ${dateStr}`);

        // Query all events for the date
        const events = await queryAnalyticsEvents(dateStr);
        console.log(`Found ${events.length} events for ${dateStr}`);

        // Calculate metrics
        const dailyActiveUsers = calculateDailyActiveUsers(events);
        const weeklyActiveUsers = await calculateWeeklyActiveUsers(yesterday);
        const averageSessionDuration = calculateAverageSessionDuration(events);
        const featureUsage = aggregateFeatureUsage(events);
        const contentCreated = aggregateContentCreated(events);
        const aiUsage = aggregateAIUsage(events);
        const totalUsers = await getTotalUserCount();
        const newSignups24h = await countNewSignups(yesterday);

        const metrics: PlatformMetrics = {
            activeUsers: dailyActiveUsers,
            totalUsers,
            newSignups24h,
            dailyActiveUsers,
            weeklyActiveUsers,
            averageSessionDuration,
            featureUsage,
            contentCreated,
            aiUsage,
        };

        console.log('Calculated metrics:', metrics);

        // Store aggregated metrics
        await storeAggregatedMetrics(dateStr, metrics);

        console.log(`Successfully aggregated metrics for ${dateStr}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Metrics aggregation completed successfully',
                date: dateStr,
                metrics,
            }),
        };
    } catch (error) {
        console.error('Error aggregating metrics:', error);
        throw error;
    }
};
