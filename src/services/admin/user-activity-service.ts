/**
 * User Activity Service
 * 
 * Handles user activity tracking, categorization, and reporting for admin platform.
 * Provides insights into user engagement, feature usage, and activity patterns.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    getUserActivitySummaryKeys,
    getUserActivityIndexKeys,
    getAnalyticsEventKeys,
} from '@/aws/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';
import {
    normalizePaginationOptions,
    createPaginatedResult,
    QueryCache,
} from './pagination-service';
import {
    getCacheService,
    CacheKeys,
    CacheTTL,
} from './cache-service';

export interface UserActivity {
    userId: string;
    email: string;
    name: string;
    lastLogin: number;
    totalSessions: number;
    totalContentCreated: number;
    featureUsage: Record<string, number>;
    aiUsage: {
        requests: number;
        tokens: number;
        cost: number;
    };
    activityLevel: 'active' | 'inactive' | 'dormant';
    signupDate: number;
}

export interface UserActivityTimeline {
    userId: string;
    events: Array<{
        timestamp: number;
        eventType: string;
        description: string;
        metadata: Record<string, any>;
    }>;
}

export class UserActivityService {
    private repository: DynamoDBRepository;
    private cache = getCacheService();
    private queryCache: QueryCache<UserActivity>;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.queryCache = new QueryCache<UserActivity>(CacheTTL.USER_ACTIVITY);
    }

    /**
     * Determines activity level based on last login date
     */
    private categorizeActivityLevel(lastLogin: number): 'active' | 'inactive' | 'dormant' {
        const now = Date.now();
        const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);

        if (daysSinceLogin <= 7) {
            return 'active';
        } else if (daysSinceLogin <= 30) {
            return 'inactive';
        } else {
            return 'dormant';
        }
    }

    /**
     * Gets activity summary for all users with filtering and sorting
     */
    async getAllUserActivity(options?: {
        activityLevel?: 'active' | 'inactive' | 'dormant';
        sortBy?: 'lastLogin' | 'totalSessions' | 'contentCreated';
        limit?: number;
        lastKey?: string;
    }): Promise<{
        users: UserActivity[];
        lastKey?: string;
    }> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // If filtering by activity level, use GSI1
        if (options?.activityLevel) {
            const command = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `ACTIVITY_LEVEL#${options.activityLevel}`,
                },
                Limit: options.limit || 50,
                ExclusiveStartKey: options.lastKey ? JSON.parse(options.lastKey) : undefined,
                ScanIndexForward: false, // Most recent first
            });

            const result = await client.send(command);
            const users = (result.Items || []).map(item => item.Data as UserActivity);

            return {
                users: this.sortUsers(users, options.sortBy),
                lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
            };
        }

        // Otherwise, query the activity index
        const command = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'USER_ACTIVITY_INDEX',
            },
            Limit: options?.limit || 50,
            ExclusiveStartKey: options?.lastKey ? JSON.parse(options.lastKey) : undefined,
        });

        const result = await client.send(command);
        const users = (result.Items || []).map(item => item.Data as UserActivity);

        return {
            users: this.sortUsers(users, options?.sortBy),
            lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        };
    }

    /**
     * Sorts users based on the specified field
     */
    private sortUsers(
        users: UserActivity[],
        sortBy?: 'lastLogin' | 'totalSessions' | 'contentCreated'
    ): UserActivity[] {
        if (!sortBy) {
            return users;
        }

        return [...users].sort((a, b) => {
            switch (sortBy) {
                case 'lastLogin':
                    return b.lastLogin - a.lastLogin;
                case 'totalSessions':
                    return b.totalSessions - a.totalSessions;
                case 'contentCreated':
                    return b.totalContentCreated - a.totalContentCreated;
                default:
                    return 0;
            }
        });
    }

    /**
     * Gets detailed activity timeline for a specific user
     */
    async getUserActivityTimeline(
        userId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<UserActivityTimeline> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Query analytics events for this user using GSI1
        const command = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
            },
            ScanIndexForward: false, // Most recent first
        });

        const result = await client.send(command);
        const events = (result.Items || [])
            .filter(item => item.EntityType === 'AnalyticsEvent')
            .map(item => {
                const data = item.Data;
                return {
                    timestamp: data.timestamp,
                    eventType: data.eventType,
                    description: this.formatEventDescription(data),
                    metadata: data.eventData || {},
                };
            });

        // Filter by date range if provided
        let filteredEvents = events;
        if (startDate || endDate) {
            const startTime = startDate ? startDate.getTime() : 0;
            const endTime = endDate ? endDate.getTime() : Date.now();
            filteredEvents = events.filter(
                event => event.timestamp >= startTime && event.timestamp <= endTime
            );
        }

        return {
            userId,
            events: filteredEvents,
        };
    }

    /**
     * Formats an event into a human-readable description
     */
    private formatEventDescription(event: any): string {
        const eventType = event.eventType;
        const eventData = event.eventData || {};

        switch (eventType) {
            case 'page_view':
                return `Viewed ${eventData.page || 'page'}`;
            case 'feature_use':
                return `Used ${eventData.feature || 'feature'}`;
            case 'content_create':
                return `Created ${eventData.contentType || 'content'}`;
            case 'ai_request':
                return `Made AI request: ${eventData.prompt?.substring(0, 50) || 'request'}...`;
            case 'error':
                return `Error: ${eventData.message || 'Unknown error'}`;
            default:
                return `${eventType}`;
        }
    }

    /**
     * Exports user activity data as CSV
     */
    async exportUserActivity(userIds?: string[]): Promise<string> {
        let users: UserActivity[];

        if (userIds && userIds.length > 0) {
            // Fetch specific users
            users = [];
            for (const userId of userIds) {
                const keys = getUserActivitySummaryKeys(userId);
                try {
                    const data = await this.repository.get<UserActivity>(keys.PK, keys.SK);
                    if (data) {
                        users.push(data);
                    }
                } catch (error) {
                    console.error(`Failed to fetch activity for user ${userId}:`, error);
                }
            }
        } else {
            // Fetch all users
            const result = await this.getAllUserActivity({ limit: 1000 });
            users = result.users;
        }

        // Generate CSV
        const headers = [
            'User ID',
            'Email',
            'Name',
            'Last Login',
            'Activity Level',
            'Total Sessions',
            'Content Created',
            'AI Requests',
            'AI Tokens',
            'AI Cost',
            'Signup Date',
        ];

        const rows = users.map(user => [
            user.userId,
            user.email,
            user.name,
            new Date(user.lastLogin).toISOString(),
            user.activityLevel,
            user.totalSessions.toString(),
            user.totalContentCreated.toString(),
            user.aiUsage.requests.toString(),
            user.aiUsage.tokens.toString(),
            user.aiUsage.cost.toFixed(2),
            new Date(user.signupDate).toISOString(),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        return csvContent;
    }

    /**
     * Updates or creates a user activity summary
     * This would typically be called by a background job that aggregates analytics events
     */
    async updateUserActivitySummary(
        userId: string,
        email: string,
        name: string,
        activityData: {
            lastLogin: number;
            totalSessions: number;
            totalContentCreated: number;
            featureUsage: Record<string, number>;
            aiUsage: {
                requests: number;
                tokens: number;
                cost: number;
            };
            signupDate: number;
        }
    ): Promise<void> {
        const activityLevel = this.categorizeActivityLevel(activityData.lastLogin);

        const userActivity: UserActivity = {
            userId,
            email,
            name,
            lastLogin: activityData.lastLogin,
            totalSessions: activityData.totalSessions,
            totalContentCreated: activityData.totalContentCreated,
            featureUsage: activityData.featureUsage,
            aiUsage: activityData.aiUsage,
            activityLevel,
            signupDate: activityData.signupDate,
        };

        // Store in main activity table with GSI for activity level filtering
        const summaryKeys = getUserActivitySummaryKeys(
            userId,
            activityLevel,
            activityData.lastLogin
        );

        await this.repository.put({
            PK: summaryKeys.PK,
            SK: summaryKeys.SK,
            EntityType: 'UserActivitySummary',
            Data: userActivity,
            GSI1PK: summaryKeys.GSI1PK,
            GSI1SK: summaryKeys.GSI1SK,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });

        // Also store in index for efficient scanning
        const indexKeys = getUserActivityIndexKeys(userId);
        await this.repository.put({
            PK: indexKeys.PK,
            SK: indexKeys.SK,
            EntityType: 'UserActivityIndex',
            Data: userActivity,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }

    /**
     * Calculates user activity summary from analytics events
     * This is a helper method for the background aggregation job
     */
    async calculateUserActivityFromEvents(
        userId: string,
        email: string,
        name: string,
        signupDate: number
    ): Promise<void> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Query all events for this user
        const command = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
            },
        });

        const result = await client.send(command);
        const events = (result.Items || []).filter(item => item.EntityType === 'AnalyticsEvent');

        // Calculate metrics
        let lastLogin = signupDate;
        const sessions = new Set<string>();
        let contentCreated = 0;
        const featureUsage: Record<string, number> = {};
        let aiRequests = 0;
        let aiTokens = 0;
        let aiCost = 0;

        events.forEach(item => {
            const event = item.Data;

            // Track last login
            if (event.timestamp > lastLogin) {
                lastLogin = event.timestamp;
            }

            // Track sessions
            if (event.sessionId) {
                sessions.add(event.sessionId);
            }

            // Track content creation
            if (event.eventType === 'content_create') {
                contentCreated++;
            }

            // Track feature usage
            if (event.eventType === 'feature_use' && event.eventData?.feature) {
                const feature = event.eventData.feature;
                featureUsage[feature] = (featureUsage[feature] || 0) + 1;
            }

            // Track AI usage
            if (event.eventType === 'ai_request') {
                aiRequests++;
                if (event.eventData?.tokens) {
                    aiTokens += event.eventData.tokens;
                }
                if (event.eventData?.cost) {
                    aiCost += event.eventData.cost;
                }
            }
        });

        // Update the activity summary
        await this.updateUserActivitySummary(userId, email, name, {
            lastLogin,
            totalSessions: sessions.size,
            totalContentCreated: contentCreated,
            featureUsage,
            aiUsage: {
                requests: aiRequests,
                tokens: aiTokens,
                cost: aiCost,
            },
            signupDate,
        });
    }
}

// Export singleton instance
export const userActivityService = new UserActivityService();
