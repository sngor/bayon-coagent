/**
 * Digest Service Microservice
 * 
 * Creates periodic notification summaries and digests including:
 * - Daily, weekly, and monthly digest generation
 * - Content aggregation and summarization
 * - Personalized digest delivery
 * - Digest preference management
 * 
 * **Validates: Requirements 5.3**
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Types
interface DigestItem {
    id: string;
    type: 'notification' | 'activity' | 'alert' | 'reminder';
    title: string;
    content: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    metadata?: Record<string, any>;
}

interface DigestConfiguration {
    userId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    deliveryTime: string; // HH:MM format
    timezone: string;
    categories: string[];
    maxItems: number;
    includeImages: boolean;
    format: 'text' | 'html' | 'markdown';
    enabled: boolean;
}

interface DigestContent {
    id: string;
    userId: string;
    period: string; // e.g., "2024-01-15" for daily, "2024-W03" for weekly
    frequency: 'daily' | 'weekly' | 'monthly';
    items: DigestItem[];
    summary: string;
    generatedAt: string;
    deliveredAt?: string;
    deliveryStatus: 'pending' | 'delivered' | 'failed';
}

interface DigestGenerationRequest {
    userId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
    categories?: string[];
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-table';

class DigestService {
    async generateDigest(request: DigestGenerationRequest): Promise<DigestContent> {
        try {
            // Get user's digest configuration
            const config = await this.getDigestConfiguration(request.userId);
            if (!config || !config.enabled) {
                throw new Error('Digest generation is not enabled for this user');
            }

            // Calculate period based on frequency
            const period = this.calculatePeriod(request.frequency, request.startDate);
            const { startDate, endDate } = this.getPeriodDates(request.frequency, period);

            // Collect digest items from the specified period
            const items = await this.collectDigestItems(
                request.userId,
                startDate,
                endDate,
                request.categories || config.categories
            );

            // Limit items based on configuration
            const limitedItems = items
                .sort((a, b) => {
                    // Sort by priority first, then by timestamp
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                })
                .slice(0, config.maxItems);

            // Generate summary
            const summary = this.generateSummary(limitedItems, request.frequency);

            // Create digest content
            const digest: DigestContent = {
                id: `digest-${request.userId}-${period}-${Date.now()}`,
                userId: request.userId,
                period,
                frequency: request.frequency,
                items: limitedItems,
                summary,
                generatedAt: new Date().toISOString(),
                deliveryStatus: 'pending',
            };

            // Save digest to database
            await this.saveDigest(digest);

            return digest;
        } catch (error) {
            console.error('Error generating digest:', error);
            throw error;
        }
    }

    async getDigestConfiguration(userId: string): Promise<DigestConfiguration | null> {
        try {
            const command = new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: 'DIGEST_CONFIG',
                }),
            });

            const result = await dynamoClient.send(command);

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return {
                userId: item.userId,
                frequency: item.frequency || 'daily',
                deliveryTime: item.deliveryTime || '09:00',
                timezone: item.timezone || 'UTC',
                categories: item.categories || ['notifications', 'activities', 'alerts'],
                maxItems: item.maxItems || 10,
                includeImages: item.includeImages || false,
                format: item.format || 'html',
                enabled: item.enabled !== false,
            };
        } catch (error) {
            console.error('Error getting digest configuration:', error);
            throw error;
        }
    }

    async updateDigestConfiguration(config: DigestConfiguration): Promise<boolean> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${config.userId}`,
                    SK: 'DIGEST_CONFIG',
                    ...config,
                    updatedAt: new Date().toISOString(),
                }),
            });

            await dynamoClient.send(command);
            return true;
        } catch (error) {
            console.error('Error updating digest configuration:', error);
            throw error;
        }
    }

    private async collectDigestItems(
        userId: string,
        startDate: string,
        endDate: string,
        categories: string[]
    ): Promise<DigestItem[]> {
        const items: DigestItem[] = [];

        try {
            // Query for notifications in the period
            const notificationCommand = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                FilterExpression: '#timestamp BETWEEN :start AND :end',
                ExpressionAttributeNames: {
                    '#timestamp': 'timestamp',
                },
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'NOTIFICATION#',
                    ':start': startDate,
                    ':end': endDate,
                }),
            });

            const notificationResult = await dynamoClient.send(notificationCommand);

            if (notificationResult.Items) {
                for (const item of notificationResult.Items) {
                    const notification = unmarshall(item);
                    if (categories.includes(notification.category)) {
                        items.push({
                            id: notification.id,
                            type: 'notification',
                            title: notification.title,
                            content: notification.message,
                            timestamp: notification.timestamp,
                            priority: notification.priority || 'medium',
                            category: notification.category,
                            metadata: notification.metadata,
                        });
                    }
                }
            }

            // Query for activities in the period
            const activityCommand = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                FilterExpression: '#timestamp BETWEEN :start AND :end',
                ExpressionAttributeNames: {
                    '#timestamp': 'timestamp',
                },
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'ACTIVITY#',
                    ':start': startDate,
                    ':end': endDate,
                }),
            });

            const activityResult = await dynamoClient.send(activityCommand);

            if (activityResult.Items) {
                for (const item of activityResult.Items) {
                    const activity = unmarshall(item);
                    if (categories.includes('activities')) {
                        items.push({
                            id: activity.id,
                            type: 'activity',
                            title: activity.title || activity.action,
                            content: activity.description || activity.details,
                            timestamp: activity.timestamp,
                            priority: 'low',
                            category: 'activities',
                            metadata: activity.metadata,
                        });
                    }
                }
            }

            return items;
        } catch (error) {
            console.error('Error collecting digest items:', error);
            return [];
        }
    }

    private calculatePeriod(frequency: string, startDate?: string): string {
        const date = startDate ? new Date(startDate) : new Date();

        switch (frequency) {
            case 'daily':
                return date.toISOString().split('T')[0]; // YYYY-MM-DD
            case 'weekly':
                const year = date.getFullYear();
                const week = this.getWeekNumber(date);
                return `${year}-W${week.toString().padStart(2, '0')}`;
            case 'monthly':
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            default:
                throw new Error(`Unsupported frequency: ${frequency}`);
        }
    }

    private getPeriodDates(frequency: string, period: string): { startDate: string; endDate: string } {
        switch (frequency) {
            case 'daily':
                const date = new Date(period);
                return {
                    startDate: date.toISOString(),
                    endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                };
            case 'weekly':
                const [year, weekStr] = period.split('-W');
                const week = parseInt(weekStr);
                const startOfWeek = this.getDateFromWeek(parseInt(year), week);
                const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
                return {
                    startDate: startOfWeek.toISOString(),
                    endDate: endOfWeek.toISOString(),
                };
            case 'monthly':
                const [monthYear, monthStr] = period.split('-');
                const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
                const startOfMonth = new Date(parseInt(monthYear), month, 1);
                const endOfMonth = new Date(parseInt(monthYear), month + 1, 0);
                return {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString(),
                };
            default:
                throw new Error(`Unsupported frequency: ${frequency}`);
        }
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    private getDateFromWeek(year: number, week: number): Date {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay();
        return new Date(year, 0, 1 + daysToAdd);
    }

    private generateSummary(items: DigestItem[], frequency: string): string {
        if (items.length === 0) {
            return `No new items for your ${frequency} digest.`;
        }

        const categoryCounts = items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const priorityCounts = items.reduce((acc, item) => {
            acc[item.priority] = (acc[item.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        let summary = `Your ${frequency} digest contains ${items.length} items:\n\n`;

        // Category breakdown
        const categories = Object.entries(categoryCounts)
            .map(([category, count]) => `${count} ${category}`)
            .join(', ');
        summary += `Categories: ${categories}\n`;

        // Priority breakdown
        if (priorityCounts.urgent || priorityCounts.high) {
            const urgentCount = priorityCounts.urgent || 0;
            const highCount = priorityCounts.high || 0;
            summary += `Important items: ${urgentCount + highCount} (${urgentCount} urgent, ${highCount} high priority)\n`;
        }

        // Recent highlights
        const recentItems = items.slice(0, 3);
        if (recentItems.length > 0) {
            summary += '\nRecent highlights:\n';
            recentItems.forEach((item, index) => {
                summary += `${index + 1}. ${item.title}\n`;
            });
        }

        return summary;
    }

    private async saveDigest(digest: DigestContent): Promise<void> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${digest.userId}`,
                    SK: `DIGEST#${digest.period}#${digest.frequency}`,
                    ...digest,
                }),
            });

            await dynamoClient.send(command);
        } catch (error) {
            console.error('Error saving digest:', error);
            throw error;
        }
    }

    async markDigestDelivered(digestId: string, userId: string): Promise<boolean> {
        try {
            // This would typically update the digest record with delivery status
            // For now, we'll just record the delivery timestamp
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${userId}`,
                    SK: `DIGEST_DELIVERY#${digestId}`,
                    digestId,
                    deliveredAt: new Date().toISOString(),
                    status: 'delivered',
                }),
            });

            await dynamoClient.send(command);
            return true;
        } catch (error) {
            console.error('Error marking digest as delivered:', error);
            return false;
        }
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
    const service = new DigestService();

    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};

        switch (method) {
            case 'POST':
                if (event.path?.includes('/generate')) {
                    const request: DigestGenerationRequest = JSON.parse(event.body || '{}');
                    if (!request.userId || !request.frequency) {
                        return service.createResponse(400, null, 'Missing required fields: userId, frequency');
                    }

                    const digest = await service.generateDigest(request);
                    return service.createResponse(200, digest);
                } else if (event.path?.includes('/config')) {
                    const config: DigestConfiguration = JSON.parse(event.body || '{}');
                    if (!config.userId) {
                        return service.createResponse(400, null, 'Missing userId in configuration');
                    }

                    const success = await service.updateDigestConfiguration(config);
                    return service.createResponse(200, { success });
                } else {
                    return service.createResponse(400, null, 'Invalid endpoint');
                }

            case 'GET':
                const userId = pathParameters.userId;
                if (!userId) {
                    return service.createResponse(400, null, 'Missing userId parameter');
                }

                const config = await service.getDigestConfiguration(userId);
                return service.createResponse(200, config);

            case 'PUT':
                if (event.path?.includes('/delivered')) {
                    const { digestId, userId } = JSON.parse(event.body || '{}');
                    if (!digestId || !userId) {
                        return service.createResponse(400, null, 'Missing digestId or userId');
                    }

                    const success = await service.markDigestDelivered(digestId, userId);
                    return service.createResponse(200, { success });
                } else {
                    return service.createResponse(400, null, 'Invalid endpoint');
                }

            default:
                return service.createResponse(405, null, 'Method not allowed');
        }
    } catch (error) {
        console.error('Digest service error:', error);
        return service.createResponse(500, null, 'Internal server error');
    }
};

// Export service class for testing
export { DigestService };