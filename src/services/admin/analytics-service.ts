/**
 * Analytics Service
 * 
 * Handles analytics event tracking and metrics aggregation for the admin platform.
 * Tracks user events, feature usage, and platform metrics.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    getAnalyticsEventKeys,
    getAggregatedMetricsKeys,
} from '@/aws/dynamodb/keys';
import { v4 as uuidv4 } from 'uuid';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';
import { getCacheService, CacheKeys, CacheTTL } from './cache-service';

export interface AnalyticsEvent {
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

// Batch configuration
const BATCH_SIZE = 25; // DynamoDB BatchWrite limit
const BATCH_FLUSH_INTERVAL = 5000; // 5 seconds

export interface PlatformMetrics {
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

export class AnalyticsService {
    private repository: DynamoDBRepository;
    private eventBatch: any[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private cache = getCacheService();

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Validates an analytics event
     */
    private validateEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): void {
        // Validate required fields
        if (!event.userId || typeof event.userId !== 'string') {
            throw new Error('Invalid userId: must be a non-empty string');
        }

        if (!event.eventType) {
            throw new Error('Invalid eventType: must be specified');
        }

        const validEventTypes = ['page_view', 'feature_use', 'content_create', 'ai_request', 'error'];
        if (!validEventTypes.includes(event.eventType)) {
            throw new Error(`Invalid eventType: must be one of ${validEventTypes.join(', ')}`);
        }

        if (!event.sessionId || typeof event.sessionId !== 'string') {
            throw new Error('Invalid sessionId: must be a non-empty string');
        }

        if (!event.metadata || typeof event.metadata !== 'object') {
            throw new Error('Invalid metadata: must be an object');
        }

        if (!event.metadata.userAgent || typeof event.metadata.userAgent !== 'string') {
            throw new Error('Invalid metadata.userAgent: must be a non-empty string');
        }

        if (!event.metadata.ipAddress || typeof event.metadata.ipAddress !== 'string') {
            throw new Error('Invalid metadata.ipAddress: must be a non-empty string');
        }

        if (!event.metadata.platform || typeof event.metadata.platform !== 'string') {
            throw new Error('Invalid metadata.platform: must be a non-empty string');
        }
    }

    /**
     * Sanitizes event data to prevent injection and ensure data quality
     */
    private sanitizeEventData(data: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            // Skip null or undefined values
            if (value === null || value === undefined) {
                continue;
            }

            // Sanitize strings (trim and limit length)
            if (typeof value === 'string') {
                sanitized[key] = value.trim().substring(0, 1000);
            }
            // Keep numbers as-is
            else if (typeof value === 'number') {
                sanitized[key] = value;
            }
            // Keep booleans as-is
            else if (typeof value === 'boolean') {
                sanitized[key] = value;
            }
            // Recursively sanitize objects
            else if (typeof value === 'object' && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeEventData(value);
            }
            // Sanitize arrays
            else if (Array.isArray(value)) {
                sanitized[key] = value.slice(0, 100).map(item => {
                    if (typeof item === 'string') {
                        return item.trim().substring(0, 1000);
                    }
                    if (typeof item === 'object' && item !== null) {
                        return this.sanitizeEventData(item);
                    }
                    return item;
                });
            }
        }

        return sanitized;
    }

    /**
     * Tracks a user event with validation and sanitization
     */
    async trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
        // Validate event
        this.validateEvent(event);

        const eventId = uuidv4();
        const timestamp = Date.now();
        const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

        const keys = getAnalyticsEventKeys(date, eventId, timestamp, event.userId);

        // Sanitize event data
        const sanitizedEventData = this.sanitizeEventData(event.eventData || {});

        const fullEvent: AnalyticsEvent = {
            ...event,
            eventData: sanitizedEventData,
            eventId,
            timestamp,
        };

        // Use put method directly to include TTL
        const now = Date.now();
        await this.repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'AnalyticsEvent',
            Data: fullEvent,
            CreatedAt: now,
            UpdatedAt: now,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            TTL: keys.TTL,
        });
    }

    /**
     * Tracks multiple events in a batch for high-volume scenarios
     */
    async trackEventBatch(events: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Process events in batches of 25 (DynamoDB limit)
        for (let i = 0; i < events.length; i += BATCH_SIZE) {
            const batch = events.slice(i, i + BATCH_SIZE);
            const putRequests = batch.map(event => {
                // Validate and sanitize each event
                this.validateEvent(event);

                const eventId = uuidv4();
                const timestamp = Date.now();
                const date = new Date(timestamp).toISOString().split('T')[0];

                const keys = getAnalyticsEventKeys(date, eventId, timestamp, event.userId);
                const sanitizedEventData = this.sanitizeEventData(event.eventData || {});

                const fullEvent: AnalyticsEvent = {
                    ...event,
                    eventData: sanitizedEventData,
                    eventId,
                    timestamp,
                };

                return {
                    PutRequest: {
                        Item: {
                            PK: keys.PK,
                            SK: keys.SK,
                            EntityType: 'AnalyticsEvent',
                            Data: fullEvent,
                            GSI1PK: keys.GSI1PK,
                            GSI1SK: keys.GSI1SK,
                            TTL: keys.TTL,
                        },
                    },
                };
            });

            // Execute batch write
            const command = new BatchWriteCommand({
                RequestItems: {
                    [tableName]: putRequests,
                },
            });

            await client.send(command);
        }
    }

    /**
     * Adds an event to the batch queue for async processing
     * Useful for high-volume event tracking
     */
    queueEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): void {
        this.eventBatch.push(event);

        // Flush immediately if batch is full
        if (this.eventBatch.length >= BATCH_SIZE) {
            this.flushBatch();
        }
        // Otherwise, schedule a flush
        else if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.flushBatch();
            }, BATCH_FLUSH_INTERVAL);
        }
    }

    /**
     * Flushes the event batch to DynamoDB
     */
    private async flushBatch(): Promise<void> {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        if (this.eventBatch.length === 0) {
            return;
        }

        const eventsToWrite = [...this.eventBatch];
        this.eventBatch = [];

        try {
            await this.trackEventBatch(eventsToWrite);
        } catch (error) {
            console.error('Failed to flush event batch:', error);
            // Re-queue failed events
            this.eventBatch.unshift(...eventsToWrite);
        }
    }

    /**
     * Manually flush any pending events
     */
    async flush(): Promise<void> {
        await this.flushBatch();
    }

    /**
     * Gets platform metrics for a date range by querying aggregated daily metrics
     * Uses caching with 5 minute TTL
     */
    async getPlatformMetrics(
        startDate: Date,
        endDate: Date
    ): Promise<PlatformMetrics> {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const cacheKey = CacheKeys.platformMetrics(startDateStr, endDateStr);

        // Try to get from cache
        return this.cache.getOrSet(
            cacheKey,
            async () => {
                // Query aggregated metrics for each day in the range
                const dailyMetrics: PlatformMetrics[] = [];
                const currentDate = new Date(startDate);

                while (currentDate <= endDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const keys = getAggregatedMetricsKeys(dateStr);

                    try {
                        const data = await this.repository.get<PlatformMetrics & { date: string }>(
                            keys.PK,
                            keys.SK
                        );

                        if (data) {
                            dailyMetrics.push(data);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch metrics for ${dateStr}:`, error);
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // If no metrics found, return empty metrics
                if (dailyMetrics.length === 0) {
                    return {
                        activeUsers: 0,
                        totalUsers: 0,
                        newSignups24h: 0,
                        dailyActiveUsers: 0,
                        weeklyActiveUsers: 0,
                        averageSessionDuration: 0,
                        featureUsage: {},
                        contentCreated: {
                            total: 0,
                            byType: {},
                        },
                        aiUsage: {
                            totalRequests: 0,
                            totalTokens: 0,
                            totalCost: 0,
                        },
                    };
                }

                // Aggregate metrics across the date range
                const aggregated: PlatformMetrics = {
                    activeUsers: 0,
                    totalUsers: 0,
                    newSignups24h: 0,
                    dailyActiveUsers: 0,
                    weeklyActiveUsers: 0,
                    averageSessionDuration: 0,
                    featureUsage: {},
                    contentCreated: {
                        total: 0,
                        byType: {},
                    },
                    aiUsage: {
                        totalRequests: 0,
                        totalTokens: 0,
                        totalCost: 0,
                    },
                };

                // Sum up metrics
                dailyMetrics.forEach(metrics => {
                    // Use the most recent values for these
                    aggregated.activeUsers = Math.max(aggregated.activeUsers, metrics.activeUsers || 0);
                    aggregated.totalUsers = Math.max(aggregated.totalUsers, metrics.totalUsers || 0);
                    aggregated.weeklyActiveUsers = Math.max(aggregated.weeklyActiveUsers, metrics.weeklyActiveUsers || 0);

                    // Sum these values
                    aggregated.newSignups24h += metrics.newSignups24h || 0;
                    aggregated.dailyActiveUsers += metrics.dailyActiveUsers || 0;

                    // Average session duration (weighted average)
                    aggregated.averageSessionDuration += (metrics.averageSessionDuration || 0) / dailyMetrics.length;

                    // Aggregate feature usage
                    Object.entries(metrics.featureUsage || {}).forEach(([feature, count]) => {
                        aggregated.featureUsage[feature] = (aggregated.featureUsage[feature] || 0) + count;
                    });

                    // Aggregate content created
                    aggregated.contentCreated.total += metrics.contentCreated?.total || 0;
                    Object.entries(metrics.contentCreated?.byType || {}).forEach(([type, count]) => {
                        aggregated.contentCreated.byType[type] = (aggregated.contentCreated.byType[type] || 0) + count;
                    });

                    // Aggregate AI usage
                    aggregated.aiUsage.totalRequests += metrics.aiUsage?.totalRequests || 0;
                    aggregated.aiUsage.totalTokens += metrics.aiUsage?.totalTokens || 0;
                    aggregated.aiUsage.totalCost += metrics.aiUsage?.totalCost || 0;
                });

                // Calculate average DAU
                aggregated.dailyActiveUsers = Math.floor(aggregated.dailyActiveUsers / dailyMetrics.length);

                return aggregated;
            },
            CacheTTL.PLATFORM_METRICS
        );
    }

    /**
     * Gets feature usage statistics by querying aggregated metrics
     */
    async getFeatureUsage(
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, number>> {
        const metrics = await this.getPlatformMetrics(startDate, endDate);
        return metrics.featureUsage;
    }

    /**
     * Gets user engagement metrics by querying aggregated metrics
     */
    async getUserEngagement(
        startDate: Date,
        endDate: Date
    ): Promise<{
        dau: number;
        wau: number;
        mau: number;
        retention: Record<string, number>;
    }> {
        const metrics = await this.getPlatformMetrics(startDate, endDate);

        // Calculate MAU (Monthly Active Users) by querying last 30 days
        const thirtyDaysAgo = new Date(endDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyMetrics = await this.getPlatformMetrics(thirtyDaysAgo, endDate);

        return {
            dau: metrics.dailyActiveUsers,
            wau: metrics.weeklyActiveUsers,
            mau: monthlyMetrics.activeUsers,
            retention: {}, // Retention calculation would require more complex logic
        };
    }

    /**
     * Stores aggregated metrics for a date
     * This would be called by a background job
     */
    async storeAggregatedMetrics(
        date: string,
        metrics: PlatformMetrics
    ): Promise<void> {
        const keys = getAggregatedMetricsKeys(date);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'AggregatedMetrics',
            {
                date,
                ...metrics,
            }
        );
    }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
