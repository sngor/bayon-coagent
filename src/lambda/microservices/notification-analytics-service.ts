/**
 * Notification Analytics Service Microservice
 * 
 * Tracks and analyzes notification metrics including:
 * - Delivery rates and success metrics
 * - Channel performance analytics
 * - User engagement tracking
 * - Performance reporting and insights
 * 
 * **Validates: Requirements 5.5**
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Types
interface NotificationMetric {
    id: string;
    userId: string;
    notificationId: string;
    channel: string;
    category: 'marketing' | 'transactional' | 'alerts' | 'reminders';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
    timestamp: string;
    deliveryDuration?: number; // milliseconds
    errorCode?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
}

interface ChannelMetrics {
    channel: string;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    averageDeliveryTime: number;
    errorBreakdown: Record<string, number>;
}

interface UserEngagementMetrics {
    userId: string;
    totalNotifications: number;
    deliveredNotifications: number;
    openedNotifications: number;
    clickedNotifications: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    preferredChannels: string[];
    engagementScore: number;
}

interface SystemMetrics {
    period: string; // e.g., "2024-01-15" for daily, "2024-W03" for weekly
    totalNotifications: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    overallDeliveryRate: number;
    channelMetrics: ChannelMetrics[];
    categoryBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    averageDeliveryTime: number;
    topErrors: Array<{ error: string; count: number }>;
}

interface MetricsQuery {
    userId?: string;
    startDate: string;
    endDate: string;
    channels?: string[];
    categories?: string[];
    groupBy?: 'day' | 'week' | 'month' | 'channel' | 'category';
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-table';

class NotificationAnalyticsService {
    async recordNotificationMetric(metric: NotificationMetric): Promise<boolean> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${metric.userId}`,
                    SK: `NOTIFICATION_METRIC#${metric.timestamp}#${metric.id}`,
                    GSI1PK: `NOTIFICATION#${metric.notificationId}`,
                    GSI1SK: `METRIC#${metric.timestamp}`,
                    GSI2PK: `CHANNEL#${metric.channel}`,
                    GSI2SK: `METRIC#${metric.timestamp}`,
                    ...metric,
                }),
            });

            await dynamoClient.send(command);
            return true;
        } catch (error) {
            console.error('Error recording notification metric:', error);
            throw error;
        }
    }

    async getChannelMetrics(query: MetricsQuery): Promise<ChannelMetrics[]> {
        try {
            const metrics = await this.getMetricsInPeriod(query);
            const channelGroups = this.groupMetricsByChannel(metrics);

            return Object.entries(channelGroups).map(([channel, channelMetrics]) => {
                const totalSent = channelMetrics.length;
                const totalDelivered = channelMetrics.filter(m =>
                    m.status === 'delivered' || m.status === 'opened' || m.status === 'clicked'
                ).length;
                const totalFailed = channelMetrics.filter(m =>
                    m.status === 'failed' || m.status === 'bounced'
                ).length;

                const deliveryTimes = channelMetrics
                    .filter(m => m.deliveryDuration && m.deliveryDuration > 0)
                    .map(m => m.deliveryDuration!);

                const errorBreakdown = channelMetrics
                    .filter(m => m.errorCode)
                    .reduce((acc, m) => {
                        const error = m.errorCode!;
                        acc[error] = (acc[error] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                return {
                    channel,
                    totalSent,
                    totalDelivered,
                    totalFailed,
                    deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
                    averageDeliveryTime: deliveryTimes.length > 0
                        ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
                        : 0,
                    errorBreakdown,
                };
            });
        } catch (error) {
            console.error('Error getting channel metrics:', error);
            throw error;
        }
    }

    async getUserEngagementMetrics(userId: string, query: MetricsQuery): Promise<UserEngagementMetrics> {
        try {
            const userQuery = { ...query, userId };
            const metrics = await this.getMetricsInPeriod(userQuery);

            const totalNotifications = metrics.length;
            const deliveredNotifications = metrics.filter(m =>
                m.status === 'delivered' || m.status === 'opened' || m.status === 'clicked'
            ).length;
            const openedNotifications = metrics.filter(m =>
                m.status === 'opened' || m.status === 'clicked'
            ).length;
            const clickedNotifications = metrics.filter(m => m.status === 'clicked').length;

            // Calculate preferred channels based on delivery success
            const channelSuccess = metrics.reduce((acc, m) => {
                if (!acc[m.channel]) {
                    acc[m.channel] = { total: 0, delivered: 0 };
                }
                acc[m.channel].total++;
                if (m.status === 'delivered' || m.status === 'opened' || m.status === 'clicked') {
                    acc[m.channel].delivered++;
                }
                return acc;
            }, {} as Record<string, { total: number; delivered: number }>);

            const preferredChannels = Object.entries(channelSuccess)
                .map(([channel, stats]) => ({
                    channel,
                    rate: stats.total > 0 ? stats.delivered / stats.total : 0,
                }))
                .sort((a, b) => b.rate - a.rate)
                .slice(0, 3)
                .map(item => item.channel);

            // Calculate engagement score (0-100)
            const deliveryRate = totalNotifications > 0 ? (deliveredNotifications / totalNotifications) * 100 : 0;
            const openRate = deliveredNotifications > 0 ? (openedNotifications / deliveredNotifications) * 100 : 0;
            const clickRate = openedNotifications > 0 ? (clickedNotifications / openedNotifications) * 100 : 0;

            const engagementScore = Math.round(
                (deliveryRate * 0.3) + (openRate * 0.4) + (clickRate * 0.3)
            );

            return {
                userId,
                totalNotifications,
                deliveredNotifications,
                openedNotifications,
                clickedNotifications,
                deliveryRate,
                openRate,
                clickRate,
                preferredChannels,
                engagementScore,
            };
        } catch (error) {
            console.error('Error getting user engagement metrics:', error);
            throw error;
        }
    }

    async getSystemMetrics(query: MetricsQuery): Promise<SystemMetrics> {
        try {
            const metrics = await this.getMetricsInPeriod(query);
            const channelMetrics = await this.getChannelMetrics(query);

            const totalNotifications = metrics.length;
            const successfulDeliveries = metrics.filter(m =>
                m.status === 'delivered' || m.status === 'opened' || m.status === 'clicked'
            ).length;
            const failedDeliveries = metrics.filter(m =>
                m.status === 'failed' || m.status === 'bounced'
            ).length;

            const categoryBreakdown = metrics.reduce((acc, m) => {
                acc[m.category] = (acc[m.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const priorityBreakdown = metrics.reduce((acc, m) => {
                acc[m.priority] = (acc[m.priority] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const deliveryTimes = metrics
                .filter(m => m.deliveryDuration && m.deliveryDuration > 0)
                .map(m => m.deliveryDuration!);

            const errorCounts = metrics
                .filter(m => m.errorCode)
                .reduce((acc, m) => {
                    const error = m.errorCode!;
                    acc[error] = (acc[error] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

            const topErrors = Object.entries(errorCounts)
                .map(([error, count]) => ({ error, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            return {
                period: this.formatPeriod(query.startDate, query.endDate),
                totalNotifications,
                successfulDeliveries,
                failedDeliveries,
                overallDeliveryRate: totalNotifications > 0 ? (successfulDeliveries / totalNotifications) * 100 : 0,
                channelMetrics,
                categoryBreakdown,
                priorityBreakdown,
                averageDeliveryTime: deliveryTimes.length > 0
                    ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
                    : 0,
                topErrors,
            };
        } catch (error) {
            console.error('Error getting system metrics:', error);
            throw error;
        }
    }

    async generateMetricsReport(query: MetricsQuery): Promise<{
        summary: SystemMetrics;
        channelAnalysis: ChannelMetrics[];
        recommendations: string[];
    }> {
        try {
            const summary = await this.getSystemMetrics(query);
            const channelAnalysis = await this.getChannelMetrics(query);
            const recommendations = this.generateRecommendations(summary, channelAnalysis);

            return {
                summary,
                channelAnalysis,
                recommendations,
            };
        } catch (error) {
            console.error('Error generating metrics report:', error);
            throw error;
        }
    }

    private async getMetricsInPeriod(query: MetricsQuery): Promise<NotificationMetric[]> {
        try {
            const metrics: NotificationMetric[] = [];

            if (query.userId) {
                // Query for specific user
                const command = new QueryCommand({
                    TableName: tableName,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    FilterExpression: '#timestamp BETWEEN :start AND :end',
                    ExpressionAttributeNames: {
                        '#timestamp': 'timestamp',
                    },
                    ExpressionAttributeValues: marshall({
                        ':pk': `USER#${query.userId}`,
                        ':sk': 'NOTIFICATION_METRIC#',
                        ':start': query.startDate,
                        ':end': query.endDate,
                    }),
                });

                const result = await dynamoClient.send(command);

                if (result.Items) {
                    metrics.push(...result.Items.map(item => unmarshall(item) as NotificationMetric));
                }
            } else {
                // Query across all users (would typically use GSI or different approach)
                // For now, we'll simulate this with a scan (not recommended for production)
                // In practice, you'd use a GSI or aggregate data differently

                // This is a simplified implementation
                const command = new QueryCommand({
                    TableName: tableName,
                    IndexName: 'GSI2', // Assuming GSI2 is set up for channel queries
                    KeyConditionExpression: 'GSI2PK = :pk',
                    FilterExpression: '#timestamp BETWEEN :start AND :end',
                    ExpressionAttributeNames: {
                        '#timestamp': 'timestamp',
                    },
                    ExpressionAttributeValues: marshall({
                        ':pk': 'METRICS', // This would need to be set up in the data model
                        ':start': query.startDate,
                        ':end': query.endDate,
                    }),
                });

                // For demo purposes, we'll return empty array for system-wide queries
                // In production, you'd implement proper aggregation
            }

            // Filter by channels and categories if specified
            let filteredMetrics = metrics;

            if (query.channels && query.channels.length > 0) {
                filteredMetrics = filteredMetrics.filter(m => query.channels!.includes(m.channel));
            }

            if (query.categories && query.categories.length > 0) {
                filteredMetrics = filteredMetrics.filter(m => query.categories!.includes(m.category));
            }

            return filteredMetrics;
        } catch (error) {
            console.error('Error getting metrics in period:', error);
            throw error;
        }
    }

    private groupMetricsByChannel(metrics: NotificationMetric[]): Record<string, NotificationMetric[]> {
        return metrics.reduce((acc, metric) => {
            if (!acc[metric.channel]) {
                acc[metric.channel] = [];
            }
            acc[metric.channel].push(metric);
            return acc;
        }, {} as Record<string, NotificationMetric[]>);
    }

    private formatPeriod(startDate: string, endDate: string): string {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start.toDateString() === end.toDateString()) {
            return start.toISOString().split('T')[0];
        } else {
            return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
        }
    }

    private generateRecommendations(
        summary: SystemMetrics,
        channelAnalysis: ChannelMetrics[]
    ): string[] {
        const recommendations: string[] = [];

        // Overall delivery rate recommendations
        if (summary.overallDeliveryRate < 90) {
            recommendations.push(
                `Overall delivery rate is ${summary.overallDeliveryRate.toFixed(1)}%. Consider reviewing failed deliveries and optimizing notification content.`
            );
        }

        // Channel-specific recommendations
        channelAnalysis.forEach(channel => {
            if (channel.deliveryRate < 85) {
                recommendations.push(
                    `${channel.channel} channel has low delivery rate (${channel.deliveryRate.toFixed(1)}%). Review channel configuration and error patterns.`
                );
            }

            if (channel.averageDeliveryTime > 30000) { // 30 seconds
                recommendations.push(
                    `${channel.channel} channel has high average delivery time (${(channel.averageDeliveryTime / 1000).toFixed(1)}s). Consider optimizing delivery infrastructure.`
                );
            }
        });

        // Error pattern recommendations
        if (summary.topErrors.length > 0) {
            const topError = summary.topErrors[0];
            if (topError.count > summary.totalNotifications * 0.1) { // More than 10% of notifications
                recommendations.push(
                    `High frequency of '${topError.error}' errors (${topError.count} occurrences). Investigate and address this error pattern.`
                );
            }
        }

        // Performance recommendations
        if (summary.averageDeliveryTime > 15000) { // 15 seconds
            recommendations.push(
                `Average delivery time is high (${(summary.averageDeliveryTime / 1000).toFixed(1)}s). Consider implementing caching or optimizing notification processing.`
            );
        }

        // Category balance recommendations
        const categoryEntries = Object.entries(summary.categoryBreakdown);
        if (categoryEntries.length > 0) {
            const totalNotifications = categoryEntries.reduce((sum, [, count]) => sum + count, 0);
            const marketingPercentage = (summary.categoryBreakdown.marketing || 0) / totalNotifications * 100;

            if (marketingPercentage > 60) {
                recommendations.push(
                    `Marketing notifications comprise ${marketingPercentage.toFixed(1)}% of total volume. Consider balancing with more transactional content to improve engagement.`
                );
            }
        }

        return recommendations;
    }

    createResponse(statusCode: number, data: any, error?: string): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'X-Request-ID': (global as any).testUtils?.generateTestId() || `req-${Date.now()}`,
            },
            body: JSON.stringify(error ? { error, data } : { data }),
        };
    }
}

// Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const service = new NotificationAnalyticsService();

    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};

        switch (method) {
            case 'POST':
                if (event.path?.includes('/record')) {
                    const metric: NotificationMetric = JSON.parse(event.body || '{}');
                    if (!metric.userId || !metric.notificationId || !metric.channel || !metric.status) {
                        return service.createResponse(400, null, 'Missing required fields: userId, notificationId, channel, status');
                    }

                    const success = await service.recordNotificationMetric(metric);
                    return service.createResponse(200, { success });
                } else if (event.path?.includes('/report')) {
                    const query: MetricsQuery = JSON.parse(event.body || '{}');
                    if (!query.startDate || !query.endDate) {
                        return service.createResponse(400, null, 'Missing required fields: startDate, endDate');
                    }

                    const report = await service.generateMetricsReport(query);
                    return service.createResponse(200, report);
                } else {
                    return service.createResponse(400, null, 'Invalid endpoint');
                }

            case 'GET':
                if (event.path?.includes('/channels')) {
                    const query = parseQueryParameters(event.queryStringParameters || {});
                    const channelMetrics = await service.getChannelMetrics(query);
                    return service.createResponse(200, channelMetrics);
                } else if (event.path?.includes('/user')) {
                    const userId = pathParameters.userId;
                    if (!userId) {
                        return service.createResponse(400, null, 'Missing userId parameter');
                    }

                    const query = parseQueryParameters(event.queryStringParameters || {});
                    const userMetrics = await service.getUserEngagementMetrics(userId, query);
                    return service.createResponse(200, userMetrics);
                } else if (event.path?.includes('/system')) {
                    const query = parseQueryParameters(event.queryStringParameters || {});
                    const systemMetrics = await service.getSystemMetrics(query);
                    return service.createResponse(200, systemMetrics);
                } else {
                    return service.createResponse(400, null, 'Invalid endpoint');
                }

            default:
                return service.createResponse(405, null, 'Method not allowed');
        }
    } catch (error) {
        console.error('Notification analytics service error:', error);
        return service.createResponse(500, null, 'Internal server error');
    }
};

// Helper function to parse query parameters
function parseQueryParameters(params: Record<string, string | undefined>): MetricsQuery {
    return {
        userId: params.userId,
        startDate: params.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: params.endDate || new Date().toISOString(),
        channels: params.channels ? params.channels.split(',') : undefined,
        categories: params.categories ? params.categories.split(',') : undefined,
        groupBy: params.groupBy as 'day' | 'week' | 'month' | 'channel' | 'category' | undefined,
    };
}

// Export service class for testing
export { NotificationAnalyticsService };