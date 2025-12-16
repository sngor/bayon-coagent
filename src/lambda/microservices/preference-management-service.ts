/**
 * Preference Management Service Microservice
 * 
 * Manages user notification preferences including:
 * - Channel preferences (email, SMS, push, webhook)
 * - Category preferences (marketing, transactional, alerts, reminders)
 * - Quiet hours and frequency settings
 * - Preference adherence validation
 * 
 * **Validates: Requirements 5.2**
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Types
interface NotificationChannel {
    type: 'email' | 'sms' | 'push' | 'webhook';
    endpoint: string;
    active: boolean;
    priority: number;
}

interface NotificationPreference {
    userId: string;
    channels: NotificationChannel[];
    categories: {
        marketing: boolean;
        transactional: boolean;
        alerts: boolean;
        reminders: boolean;
    };
    quietHours?: {
        start: string; // HH:MM format
        end: string;   // HH:MM format
        timezone: string;
    };
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    createdAt: string;
    updatedAt: string;
}

interface NotificationRequest {
    id: string;
    userId: string;
    category: 'marketing' | 'transactional' | 'alerts' | 'reminders';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    channels: string[];
    metadata?: Record<string, any>;
    scheduledAt?: string;
}

interface PreferenceAdherenceResult {
    adheres: boolean;
    reasons: string[];
    allowedChannels: string[];
    blockedChannels: string[];
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-table';

class PreferenceManagementService {
    async getUserPreferences(userId: string): Promise<NotificationPreference | null> {
        try {
            const command = new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: 'NOTIFICATION_PREFERENCES',
                }),
            });

            const result = await dynamoClient.send(command);

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return {
                userId: item.userId,
                channels: item.channels || [],
                categories: item.categories || {
                    marketing: true,
                    transactional: true,
                    alerts: true,
                    reminders: true,
                },
                quietHours: item.quietHours,
                frequency: item.frequency || 'immediate',
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    async updatePreferences(preferences: NotificationPreference): Promise<boolean> {
        try {
            const now = new Date().toISOString();
            const item = {
                PK: `USER#${preferences.userId}`,
                SK: 'NOTIFICATION_PREFERENCES',
                userId: preferences.userId,
                channels: preferences.channels,
                categories: preferences.categories,
                quietHours: preferences.quietHours,
                frequency: preferences.frequency,
                createdAt: preferences.createdAt || now,
                updatedAt: now,
            };

            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall(item),
            });

            await dynamoClient.send(command);
            return true;
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }

    async createDefaultPreferences(userId: string): Promise<NotificationPreference> {
        const now = new Date().toISOString();
        const defaultPreferences: NotificationPreference = {
            userId,
            channels: [
                {
                    type: 'email',
                    endpoint: `user-${userId}@example.com`,
                    active: true,
                    priority: 1,
                },
            ],
            categories: {
                marketing: true,
                transactional: true,
                alerts: true,
                reminders: true,
            },
            frequency: 'immediate',
            createdAt: now,
            updatedAt: now,
        };

        await this.updatePreferences(defaultPreferences);
        return defaultPreferences;
    }

    async checkPreferenceAdherence(
        request: NotificationRequest,
        preferences?: NotificationPreference
    ): Promise<PreferenceAdherenceResult> {
        // Get preferences if not provided
        if (!preferences) {
            const userPrefs = await this.getUserPreferences(request.userId);
            if (!userPrefs) {
                preferences = await this.createDefaultPreferences(request.userId);
            } else {
                preferences = userPrefs;
            }
        }

        const reasons: string[] = [];
        const allowedChannels: string[] = [];
        const blockedChannels: string[] = [];

        // Check category preferences
        if (!preferences.categories[request.category]) {
            reasons.push(`Category '${request.category}' is disabled in user preferences`);
            blockedChannels.push(...request.channels);
            return {
                adheres: false,
                reasons,
                allowedChannels,
                blockedChannels,
            };
        }

        // Check quiet hours for non-urgent notifications
        if (request.priority !== 'urgent' && this.isInQuietHours(preferences)) {
            reasons.push('Notification blocked due to quiet hours (non-urgent)');
            blockedChannels.push(...request.channels);
            return {
                adheres: false,
                reasons,
                allowedChannels,
                blockedChannels,
            };
        }

        // Check frequency limits for low priority notifications
        if (request.priority === 'low' && preferences.frequency !== 'immediate') {
            const shouldBlock = await this.checkFrequencyLimits(request.userId, preferences.frequency);
            if (shouldBlock) {
                reasons.push(`Frequency limit exceeded for '${preferences.frequency}' setting`);
                blockedChannels.push(...request.channels);
                return {
                    adheres: false,
                    reasons,
                    allowedChannels,
                    blockedChannels,
                };
            }
        }

        // Filter channels based on active preferences
        const activeChannelTypes = preferences.channels
            .filter(ch => ch.active)
            .map(ch => ch.type);

        for (const channel of request.channels) {
            if (request.priority === 'urgent') {
                // Urgent notifications bypass channel restrictions
                allowedChannels.push(channel);
            } else if (activeChannelTypes.includes(channel as any)) {
                allowedChannels.push(channel);
            } else {
                blockedChannels.push(channel);
                reasons.push(`Channel '${channel}' is not active in user preferences`);
            }
        }

        return {
            adheres: allowedChannels.length > 0,
            reasons,
            allowedChannels,
            blockedChannels,
        };
    }

    private isInQuietHours(preferences: NotificationPreference): boolean {
        if (!preferences.quietHours) {
            return false;
        }

        const now = new Date();

        // Convert to user's timezone if specified
        let currentTime: string;
        if (preferences.quietHours.timezone) {
            try {
                const userTime = new Date(now.toLocaleString('en-US', { timeZone: preferences.quietHours.timezone }));
                currentTime = userTime.toTimeString().slice(0, 5); // HH:MM format
            } catch {
                // Fallback to UTC if timezone is invalid
                currentTime = now.toTimeString().slice(0, 5);
            }
        } else {
            currentTime = now.toTimeString().slice(0, 5);
        }

        const { start, end } = preferences.quietHours;

        // Handle quiet hours that span midnight
        if (start > end) {
            return currentTime >= start || currentTime <= end;
        } else {
            return currentTime >= start && currentTime <= end;
        }
    }

    private async checkFrequencyLimits(userId: string, frequency: string): Promise<boolean> {
        // This would typically check against a record of recent notifications
        // For now, we'll implement a simple time-based check

        try {
            const command = new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: 'LAST_NOTIFICATION',
                }),
            });

            const result = await dynamoClient.send(command);

            if (!result.Item) {
                return false; // No previous notification, allow this one
            }

            const item = unmarshall(result.Item);
            const lastNotificationTime = new Date(item.timestamp);
            const now = new Date();
            const timeDiff = now.getTime() - lastNotificationTime.getTime();

            switch (frequency) {
                case 'hourly':
                    return timeDiff < 60 * 60 * 1000; // 1 hour
                case 'daily':
                    return timeDiff < 24 * 60 * 60 * 1000; // 24 hours
                case 'weekly':
                    return timeDiff < 7 * 24 * 60 * 60 * 1000; // 7 days
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error checking frequency limits:', error);
            return false; // Allow notification if we can't check
        }
    }

    async recordNotificationSent(userId: string): Promise<void> {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${userId}`,
                    SK: 'LAST_NOTIFICATION',
                    timestamp: new Date().toISOString(),
                }),
            });

            await dynamoClient.send(command);
        } catch (error) {
            console.error('Error recording notification sent:', error);
            // Don't throw - this is not critical
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
    const service = new PreferenceManagementService();

    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const userId = pathParameters.userId;

        switch (method) {
            case 'GET':
                if (!userId) {
                    return service.createResponse(400, null, 'Missing userId parameter');
                }

                const preferences = await service.getUserPreferences(userId);
                if (!preferences) {
                    const defaultPrefs = await service.createDefaultPreferences(userId);
                    return service.createResponse(200, defaultPrefs);
                }
                return service.createResponse(200, preferences);

            case 'POST':
                if (event.path?.includes('/check-adherence')) {
                    const request: NotificationRequest = JSON.parse(event.body || '{}');
                    if (!request.userId) {
                        return service.createResponse(400, null, 'Missing userId in request');
                    }

                    const adherenceResult = await service.checkPreferenceAdherence(request);
                    return service.createResponse(200, adherenceResult);
                } else {
                    const newPreferences: NotificationPreference = JSON.parse(event.body || '{}');
                    if (!newPreferences.userId) {
                        return service.createResponse(400, null, 'Missing userId in preferences');
                    }

                    const success = await service.updatePreferences(newPreferences);
                    return service.createResponse(200, { success });
                }

            case 'PUT':
                if (!userId) {
                    return service.createResponse(400, null, 'Missing userId parameter');
                }

                const updatedPreferences: Partial<NotificationPreference> = JSON.parse(event.body || '{}');
                const existingPrefs = await service.getUserPreferences(userId);

                if (!existingPrefs) {
                    return service.createResponse(404, null, 'User preferences not found');
                }

                const mergedPreferences: NotificationPreference = {
                    ...existingPrefs,
                    ...updatedPreferences,
                    userId, // Ensure userId is preserved
                };

                const updateSuccess = await service.updatePreferences(mergedPreferences);
                return service.createResponse(200, { success: updateSuccess });

            default:
                return service.createResponse(405, null, 'Method not allowed');
        }
    } catch (error) {
        console.error('Preference management service error:', error);
        return service.createResponse(500, null, 'Internal server error');
    }
};

// Export service class for testing
export { PreferenceManagementService };