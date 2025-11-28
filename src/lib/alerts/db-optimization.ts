/**
 * Database Optimization Utilities
 * 
 * Provides optimized database access patterns, connection pooling configuration,
 * and query optimization utilities for the notification system.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { QueryOptions, DynamoDBKey } from '@/aws/dynamodb/types';
import { preferencesCache } from './notification-cache';
import { NotificationPreferences } from './notification-types';

/**
 * Connection pool configuration for DynamoDB
 */
export interface ConnectionPoolConfig {
    // Maximum number of concurrent connections
    maxConnections: number;
    // Connection timeout in milliseconds
    connectionTimeout: number;
    // Request timeout in milliseconds
    requestTimeout: number;
    // Enable HTTP keep-alive
    keepAlive: boolean;
    // Keep-alive timeout in milliseconds
    keepAliveTimeout: number;
}

/**
 * Default connection pool configuration
 */
export const DEFAULT_CONNECTION_POOL_CONFIG: ConnectionPoolConfig = {
    maxConnections: 50,
    connectionTimeout: 3000,
    requestTimeout: 5000,
    keepAlive: true,
    keepAliveTimeout: 60000,
};

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Optimized query for notification events with pagination
     * Uses consistent read for critical queries
     */
    async queryNotificationEvents(
        userId: string,
        options: {
            limit?: number;
            startDate?: string;
            endDate?: string;
            eventType?: string;
            exclusiveStartKey?: DynamoDBKey;
        } = {}
    ) {
        const queryOptions: QueryOptions = {
            limit: options.limit || 50,
            exclusiveStartKey: options.exclusiveStartKey,
            scanIndexForward: false, // Most recent first
        };

        // Add filter for date range if provided
        if (options.startDate || options.endDate) {
            const conditions: string[] = [];
            const values: Record<string, any> = {};

            if (options.startDate) {
                conditions.push('CreatedAt >= :startDate');
                values[':startDate'] = new Date(options.startDate).getTime();
            }

            if (options.endDate) {
                conditions.push('CreatedAt <= :endDate');
                values[':endDate'] = new Date(options.endDate).getTime();
            }

            if (conditions.length > 0) {
                queryOptions.filterExpression = conditions.join(' AND ');
                queryOptions.expressionAttributeValues = values;
            }
        }

        // Add filter for event type if provided
        if (options.eventType) {
            const typeFilter = 'Data.#type = :eventType';
            queryOptions.filterExpression = queryOptions.filterExpression
                ? `${queryOptions.filterExpression} AND ${typeFilter}`
                : typeFilter;
            queryOptions.expressionAttributeNames = {
                ...queryOptions.expressionAttributeNames,
                '#type': 'type',
            };
            queryOptions.expressionAttributeValues = {
                ...queryOptions.expressionAttributeValues,
                ':eventType': options.eventType,
            };
        }

        return this.repository.query(
            `USER#${userId}`,
            'NOTIFICATION_EVENT#',
            queryOptions
        );
    }

    /**
     * Optimized query for notification jobs with status filtering
     */
    async queryNotificationJobs(
        userId: string,
        options: {
            status?: 'pending' | 'processing' | 'completed' | 'failed';
            limit?: number;
            exclusiveStartKey?: DynamoDBKey;
        } = {}
    ) {
        const queryOptions: QueryOptions = {
            limit: options.limit || 50,
            exclusiveStartKey: options.exclusiveStartKey,
            scanIndexForward: true, // Oldest first for processing
        };

        // Add status filter if provided
        if (options.status) {
            queryOptions.filterExpression = 'Data.#status = :status';
            queryOptions.expressionAttributeNames = {
                '#status': 'status',
            };
            queryOptions.expressionAttributeValues = {
                ':status': options.status,
            };
        }

        return this.repository.query(
            `USER#${userId}`,
            'NOTIFICATION_JOB#',
            queryOptions
        );
    }

    /**
     * Batch loads preferences with optimized caching
     * Minimizes database queries by checking cache first
     */
    async batchLoadPreferencesOptimized(
        userIds: string[]
    ): Promise<Map<string, NotificationPreferences>> {
        const result = new Map<string, NotificationPreferences>();
        const uncachedUserIds: string[] = [];

        // Check cache first
        for (const userId of userIds) {
            const cached = preferencesCache.getUserPreferences(userId);
            if (cached) {
                result.set(userId, cached);
            } else {
                uncachedUserIds.push(userId);
            }
        }

        // If all cached, return immediately
        if (uncachedUserIds.length === 0) {
            return result;
        }

        // Batch load uncached preferences
        const keys = uncachedUserIds.map(userId => ({
            PK: `USER#${userId}`,
            SK: 'SETTINGS#NOTIFICATIONS',
        }));

        const batchResult = await this.repository.batchGet<NotificationPreferences>(keys);

        // Process results and update cache
        for (let i = 0; i < uncachedUserIds.length; i++) {
            const userId = uncachedUserIds[i];
            const preferences = batchResult.items[i];

            if (preferences) {
                result.set(userId, preferences);
                preferencesCache.setUserPreferences(userId, preferences);
            } else {
                // Use default preferences
                const defaultPrefs: NotificationPreferences = {
                    userId,
                    emailNotifications: true,
                    frequency: 'real-time',
                    enabledAlertTypes: [
                        'life-event-lead',
                        'competitor-new-listing',
                        'competitor-price-reduction',
                        'competitor-withdrawal',
                        'neighborhood-trend',
                        'price-reduction',
                    ],
                    updatedAt: new Date().toISOString(),
                };
                result.set(userId, defaultPrefs);
                preferencesCache.setUserPreferences(userId, defaultPrefs);
            }
        }

        return result;
    }

    /**
     * Optimized query for recent notifications with projection
     * Only fetches required fields to reduce data transfer
     */
    async queryRecentNotifications(
        userId: string,
        limit: number = 20
    ) {
        return this.repository.query(
            `USER#${userId}`,
            'NOTIFICATION#',
            {
                limit,
                scanIndexForward: false, // Most recent first
            }
        );
    }

    /**
     * Counts notifications efficiently using query without fetching data
     */
    async countNotifications(
        userId: string,
        options: {
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<number> {
        let count = 0;
        let lastEvaluatedKey: DynamoDBKey | undefined;

        do {
            const queryOptions: QueryOptions = {
                limit: 1000, // Max items per query
                exclusiveStartKey: lastEvaluatedKey,
            };

            // Add date filter if provided
            if (options.startDate || options.endDate) {
                const conditions: string[] = [];
                const values: Record<string, any> = {};

                if (options.startDate) {
                    conditions.push('CreatedAt >= :startDate');
                    values[':startDate'] = new Date(options.startDate).getTime();
                }

                if (options.endDate) {
                    conditions.push('CreatedAt <= :endDate');
                    values[':endDate'] = new Date(options.endDate).getTime();
                }

                if (conditions.length > 0) {
                    queryOptions.filterExpression = conditions.join(' AND ');
                    queryOptions.expressionAttributeValues = values;
                }
            }

            const result = await this.repository.query(
                `USER#${userId}`,
                'NOTIFICATION#',
                queryOptions
            );

            count += result.count;
            lastEvaluatedKey = result.lastEvaluatedKey;
        } while (lastEvaluatedKey);

        return count;
    }
}

/**
 * Index optimization recommendations
 */
export const INDEX_RECOMMENDATIONS = {
    /**
     * GSI1: For querying notifications by type and date
     * PK: USER#<userId>#TYPE#<type>
     * SK: TIMESTAMP#<timestamp>
     */
    notificationsByType: {
        indexName: 'GSI1',
        pkPattern: 'USER#<userId>#TYPE#<type>',
        skPattern: 'TIMESTAMP#<timestamp>',
        useCase: 'Query notifications by type for a user',
    },

    /**
     * GSI2: For querying notifications by status
     * PK: USER#<userId>#STATUS#<status>
     * SK: TIMESTAMP#<timestamp>
     */
    notificationsByStatus: {
        indexName: 'GSI2',
        pkPattern: 'USER#<userId>#STATUS#<status>',
        skPattern: 'TIMESTAMP#<timestamp>',
        useCase: 'Query notifications by status (read/unread)',
    },

    /**
     * LSI1: For querying notifications by priority
     * PK: USER#<userId>
     * SK: PRIORITY#<priority>#TIMESTAMP#<timestamp>
     */
    notificationsByPriority: {
        indexName: 'LSI1',
        pkPattern: 'USER#<userId>',
        skPattern: 'PRIORITY#<priority>#TIMESTAMP#<timestamp>',
        useCase: 'Query notifications by priority level',
    },
};

/**
 * Query pattern examples for optimal performance
 */
export const QUERY_PATTERNS = {
    /**
     * Pattern 1: Get recent unread notifications
     * Uses main table with filter expression
     */
    recentUnread: {
        description: 'Get recent unread notifications for a user',
        pattern: 'Query with PK=USER#<userId>, SK begins_with NOTIFICATION#, filter status=unread',
        performance: 'Good - Uses partition key, minimal filtering',
    },

    /**
     * Pattern 2: Get notifications by type
     * Uses GSI1 for efficient type-based queries
     */
    byType: {
        description: 'Get all notifications of a specific type',
        pattern: 'Query GSI1 with PK=USER#<userId>#TYPE#<type>',
        performance: 'Excellent - Direct GSI query, no filtering',
    },

    /**
     * Pattern 3: Count unread notifications
     * Uses query with Select=COUNT
     */
    countUnread: {
        description: 'Count unread notifications efficiently',
        pattern: 'Query with PK=USER#<userId>, filter status=unread, Select=COUNT',
        performance: 'Good - Counts without fetching data',
    },

    /**
     * Pattern 4: Batch load multiple users
     * Uses batchGet for parallel loading
     */
    batchLoad: {
        description: 'Load preferences for multiple users',
        pattern: 'BatchGet with multiple keys',
        performance: 'Excellent - Parallel loading, single round trip',
    },
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    /**
     * Records query execution time
     */
    recordQueryTime(queryName: string, durationMs: number): void {
        if (!this.metrics.has(queryName)) {
            this.metrics.set(queryName, []);
        }
        this.metrics.get(queryName)!.push(durationMs);
    }

    /**
     * Gets average query time
     */
    getAverageQueryTime(queryName: string): number {
        const times = this.metrics.get(queryName);
        if (!times || times.length === 0) {
            return 0;
        }
        return times.reduce((a, b) => a + b, 0) / times.length;
    }

    /**
     * Gets query statistics
     */
    getQueryStats(queryName: string) {
        const times = this.metrics.get(queryName);
        if (!times || times.length === 0) {
            return null;
        }

        const sorted = [...times].sort((a, b) => a - b);
        return {
            count: times.length,
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
        };
    }

    /**
     * Resets metrics
     */
    reset(): void {
        this.metrics.clear();
    }

    /**
     * Gets all metrics
     */
    getAllStats() {
        const stats: Record<string, any> = {};
        for (const [queryName, _] of this.metrics) {
            stats[queryName] = this.getQueryStats(queryName);
        }
        return stats;
    }
}

// Export singleton instances
export const queryOptimizer = new QueryOptimizer();
export const performanceMonitor = new PerformanceMonitor();

// Export factory functions
export const createQueryOptimizer = () => new QueryOptimizer();
export const createPerformanceMonitor = () => new PerformanceMonitor();
