/**
 * DynamoDB Query Optimization Utilities
 * 
 * Provides optimized query patterns, caching, and performance monitoring
 * for DynamoDB operations in the content workflow system.
 * 
 * Performance targets:
 * - Query response times <100ms for cached data
 * - Batch operations <2 seconds for 100+ items
 * - Efficient GSI usage to minimize costs
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { EntityType } from '@/aws/dynamodb/types';

/**
 * Query cache for frequently accessed data
 */
class QueryCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
    private maxSize = 1000; // Maximum cache entries
    private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

    set(key: string, data: any, ttl: number = this.defaultTTL): void {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    getStats(): { size: number; hitRate: number; memoryUsage: number } {
        return {
            size: this.cache.size,
            hitRate: 0, // Would need to track hits/misses for accurate calculation
            memoryUsage: JSON.stringify([...this.cache.entries()]).length
        };
    }
}

/**
 * Performance monitoring for DynamoDB operations
 */
class DynamoDBPerformanceMonitor {
    private metrics = new Map<string, {
        count: number;
        totalTime: number;
        avgTime: number;
        minTime: number;
        maxTime: number;
        errors: number;
    }>();

    recordQuery(operation: string, duration: number, success: boolean = true): void {
        const existing = this.metrics.get(operation) || {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errors: 0
        };

        existing.count++;
        existing.totalTime += duration;
        existing.avgTime = existing.totalTime / existing.count;
        existing.minTime = Math.min(existing.minTime, duration);
        existing.maxTime = Math.max(existing.maxTime, duration);

        if (!success) {
            existing.errors++;
        }

        this.metrics.set(operation, existing);
    }

    getMetrics(): Record<string, any> {
        const result: Record<string, any> = {};
        this.metrics.forEach((value, key) => {
            result[key] = { ...value };
        });
        return result;
    }

    getSlowQueries(threshold: number = 1000): Array<{ operation: string; avgTime: number }> {
        const slowQueries: Array<{ operation: string; avgTime: number }> = [];

        this.metrics.forEach((value, key) => {
            if (value.avgTime > threshold) {
                slowQueries.push({ operation: key, avgTime: value.avgTime });
            }
        });

        return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
    }

    clear(): void {
        this.metrics.clear();
    }
}

// Global instances
const queryCache = new QueryCache();
const performanceMonitor = new DynamoDBPerformanceMonitor();

/**
 * Optimized query builder with caching and performance monitoring
 */
export class OptimizedDynamoDBClient {
    private repository = getRepository();

    /**
     * Execute a query with caching and performance monitoring
     */
    async query<T>(
        pk: string,
        sk: string,
        options: {
            indexName?: string;
            filterExpression?: string;
            expressionAttributeNames?: Record<string, string>;
            expressionAttributeValues?: Record<string, any>;
            limit?: number;
            scanIndexForward?: boolean;
            exclusiveStartKey?: Record<string, any>;
        } = {},
        cacheOptions: {
            useCache?: boolean;
            ttl?: number;
            cacheKey?: string;
        } = {}
    ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any>; fromCache?: boolean }> {
        const startTime = performance.now();
        const operation = `query:${pk}:${sk}:${options.indexName || 'primary'}`;

        // Generate cache key
        const cacheKey = cacheOptions.cacheKey ||
            `${operation}:${JSON.stringify(options)}`;

        // Try cache first if enabled
        if (cacheOptions.useCache !== false) {
            const cachedResult = queryCache.get(cacheKey);
            if (cachedResult) {
                performanceMonitor.recordQuery(operation, performance.now() - startTime, true);
                return { ...cachedResult, fromCache: true };
            }
        }

        try {
            const result = await this.repository.query<T>(pk, sk, options);
            const duration = performance.now() - startTime;

            // Cache the result if caching is enabled
            if (cacheOptions.useCache !== false) {
                queryCache.set(cacheKey, result, cacheOptions.ttl);
            }

            performanceMonitor.recordQuery(operation, duration, true);
            return { ...result, fromCache: false };

        } catch (error) {
            const duration = performance.now() - startTime;
            performanceMonitor.recordQuery(operation, duration, false);
            throw error;
        }
    }

    /**
     * Optimized batch get operation
     */
    async batchGet<T>(
        keys: Array<{ pk: string; sk: string }>,
        options: {
            useCache?: boolean;
            ttl?: number;
        } = {}
    ): Promise<T[]> {
        const startTime = performance.now();
        const operation = `batchGet:${keys.length}items`;

        // Check cache for individual items first
        const cachedItems: T[] = [];
        const uncachedKeys: Array<{ pk: string; sk: string }> = [];

        if (options.useCache !== false) {
            keys.forEach(key => {
                const cacheKey = `item:${key.pk}:${key.sk}`;
                const cached = queryCache.get(cacheKey);
                if (cached) {
                    cachedItems.push(cached);
                } else {
                    uncachedKeys.push(key);
                }
            });
        } else {
            uncachedKeys.push(...keys);
        }

        let fetchedItems: T[] = [];

        // Fetch uncached items in batches (DynamoDB limit is 100 items per batch)
        if (uncachedKeys.length > 0) {
            const batchSize = 100;
            const batches: Array<Array<{ pk: string; sk: string }>> = [];

            for (let i = 0; i < uncachedKeys.length; i += batchSize) {
                batches.push(uncachedKeys.slice(i, i + batchSize));
            }

            try {
                const batchPromises = batches.map(async (batch) => {
                    // Note: This would need to be implemented in the repository
                    // For now, we'll simulate with individual gets
                    const itemPromises = batch.map(key =>
                        this.repository.get<T>(key.pk, key.sk)
                    );
                    const results = await Promise.all(itemPromises);
                    return results.map(result => result.item).filter(Boolean) as T[];
                });

                const batchResults = await Promise.all(batchPromises);
                fetchedItems = batchResults.flat();

                // Cache fetched items
                if (options.useCache !== false) {
                    fetchedItems.forEach((item: any, index) => {
                        const key = uncachedKeys[index];
                        if (key) {
                            const cacheKey = `item:${key.pk}:${key.sk}`;
                            queryCache.set(cacheKey, item, options.ttl);
                        }
                    });
                }

            } catch (error) {
                const duration = performance.now() - startTime;
                performanceMonitor.recordQuery(operation, duration, false);
                throw error;
            }
        }

        const duration = performance.now() - startTime;
        performanceMonitor.recordQuery(operation, duration, true);

        return [...cachedItems, ...fetchedItems];
    }

    /**
     * Optimized batch write operation with retry logic
     */
    async batchWrite<T>(
        items: T[],
        options: {
            entityType: EntityType;
            getKeys: (item: T) => { pk: string; sk: string };
            maxRetries?: number;
            batchSize?: number;
        }
    ): Promise<{ processedItems: number; unprocessedItems: T[] }> {
        const startTime = performance.now();
        const operation = `batchWrite:${items.length}items`;
        const maxRetries = options.maxRetries || 3;
        const batchSize = options.batchSize || 25; // DynamoDB batch write limit

        let processedItems = 0;
        let unprocessedItems: T[] = [];

        try {
            // Split items into batches
            const batches: T[][] = [];
            for (let i = 0; i < items.length; i += batchSize) {
                batches.push(items.slice(i, i + batchSize));
            }

            // Process batches with retry logic
            for (const batch of batches) {
                let retryCount = 0;
                let currentBatch = batch;

                while (retryCount < maxRetries && currentBatch.length > 0) {
                    try {
                        // Create batch write requests
                        const writePromises = currentBatch.map(async (item) => {
                            const keys = options.getKeys(item);
                            return this.repository.create(
                                keys.pk,
                                keys.sk,
                                options.entityType,
                                item
                            );
                        });

                        await Promise.all(writePromises);
                        processedItems += currentBatch.length;
                        currentBatch = []; // All items processed successfully

                    } catch (error) {
                        retryCount++;

                        if (retryCount >= maxRetries) {
                            unprocessedItems.push(...currentBatch);
                            break;
                        }

                        // Exponential backoff
                        const delay = Math.pow(2, retryCount) * 100;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            const duration = performance.now() - startTime;
            performanceMonitor.recordQuery(operation, duration, true);

            return { processedItems, unprocessedItems };

        } catch (error) {
            const duration = performance.now() - startTime;
            performanceMonitor.recordQuery(operation, duration, false);
            throw error;
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return performanceMonitor.getMetrics();
    }

    /**
     * Get slow queries
     */
    getSlowQueries(threshold: number = 1000) {
        return performanceMonitor.getSlowQueries(threshold);
    }

    /**
     * Clear cache and metrics
     */
    clearCache() {
        queryCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return queryCache.getStats();
    }
}

/**
 * Optimized query patterns for content workflow
 */
export class ContentWorkflowQueries {
    private client = new OptimizedDynamoDBClient();

    /**
     * Get scheduled content for a date range with optimized GSI query
     */
    async getScheduledContentByDateRange(
        userId: string,
        startDate: Date,
        endDate: Date,
        options: {
            status?: string[];
            channels?: string[];
            limit?: number;
            useCache?: boolean;
        } = {}
    ) {
        const cacheKey = `scheduled-content:${userId}:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(options)}`;

        return this.client.query(
            `USER#${userId}`,
            'SCHEDULE#',
            {
                indexName: 'GSI1', // Use GSI for efficient time-based queries
                filterExpression: '#publishTime BETWEEN :startDate AND :endDate' +
                    (options.status ? ' AND #status IN (:status)' : '') +
                    (options.channels ? ' AND contains(#channels, :channel)' : ''),
                expressionAttributeNames: {
                    '#publishTime': 'publishTime',
                    ...(options.status && { '#status': 'status' }),
                    ...(options.channels && { '#channels': 'channels' })
                },
                expressionAttributeValues: {
                    ':startDate': startDate.toISOString(),
                    ':endDate': endDate.toISOString(),
                    ...(options.status && { ':status': options.status }),
                    ...(options.channels && { ':channel': options.channels[0] }) // Simplified for example
                },
                limit: options.limit,
                scanIndexForward: true
            },
            {
                useCache: options.useCache,
                ttl: 2 * 60 * 1000, // 2 minutes cache for scheduled content
                cacheKey
            }
        );
    }

    /**
     * Get analytics data with optimized aggregation
     */
    async getAnalyticsByContentType(
        userId: string,
        contentType: string,
        startDate: Date,
        endDate: Date,
        options: { useCache?: boolean } = {}
    ) {
        const cacheKey = `analytics:${userId}:${contentType}:${startDate.toISOString()}:${endDate.toISOString()}`;

        return this.client.query(
            `USER#${userId}`,
            'ANALYTICS#',
            {
                indexName: 'GSI2', // Content type analytics GSI
                filterExpression: '#contentType = :contentType AND #publishedAt BETWEEN :startDate AND :endDate',
                expressionAttributeNames: {
                    '#contentType': 'contentType',
                    '#publishedAt': 'publishedAt'
                },
                expressionAttributeValues: {
                    ':contentType': contentType,
                    ':startDate': startDate.toISOString(),
                    ':endDate': endDate.toISOString()
                },
                scanIndexForward: false // Get most recent first
            },
            {
                useCache: options.useCache,
                ttl: 10 * 60 * 1000, // 10 minutes cache for analytics
                cacheKey
            }
        );
    }

    /**
     * Get templates with optimized search
     */
    async getTemplatesByType(
        userId: string,
        contentType: string,
        options: {
            includeShared?: boolean;
            brokerageId?: string;
            useCache?: boolean;
        } = {}
    ) {
        const cacheKey = `templates:${userId}:${contentType}:${options.includeShared}:${options.brokerageId}`;

        const queries = [];

        // User's personal templates
        queries.push(
            this.client.query(
                `USER#${userId}`,
                'TEMPLATE#',
                {
                    indexName: 'GSI3', // Template discovery GSI
                    filterExpression: '#contentType = :contentType',
                    expressionAttributeNames: {
                        '#contentType': 'contentType'
                    },
                    expressionAttributeValues: {
                        ':contentType': contentType
                    }
                },
                {
                    useCache: options.useCache,
                    ttl: 15 * 60 * 1000, // 15 minutes cache for templates
                    cacheKey: `${cacheKey}:personal`
                }
            )
        );

        // Shared brokerage templates if requested
        if (options.includeShared && options.brokerageId) {
            queries.push(
                this.client.query(
                    `BROKERAGE#${options.brokerageId}`,
                    'TEMPLATE#',
                    {
                        filterExpression: '#contentType = :contentType',
                        expressionAttributeNames: {
                            '#contentType': 'contentType'
                        },
                        expressionAttributeValues: {
                            ':contentType': contentType
                        }
                    },
                    {
                        useCache: options.useCache,
                        ttl: 15 * 60 * 1000,
                        cacheKey: `${cacheKey}:shared`
                    }
                )
            );
        }

        const results = await Promise.all(queries);

        // Combine and deduplicate results
        const allItems = results.flatMap(result => result.items);
        const uniqueItems = allItems.filter((item: any, index, array) =>
            array.findIndex((i: any) => i.id === item.id) === index
        );

        return {
            items: uniqueItems,
            fromCache: results.every(r => r.fromCache)
        };
    }

    /**
     * Bulk update scheduled content status
     */
    async bulkUpdateScheduledContentStatus(
        items: Array<{ userId: string; scheduleId: string; status: string }>,
        options: { batchSize?: number } = {}
    ) {
        return this.client.batchWrite(
            items,
            {
                entityType: 'ScheduledContent' as EntityType,
                getKeys: (item) => ({
                    pk: `USER#${item.userId}`,
                    sk: `SCHEDULE#${item.scheduleId}`
                }),
                batchSize: options.batchSize
            }
        );
    }
}

/**
 * Global optimized client instance
 */
export const optimizedDynamoDBClient = new OptimizedDynamoDBClient();
export const contentWorkflowQueries = new ContentWorkflowQueries();

/**
 * Performance monitoring utilities
 */
export function getQueryPerformanceReport() {
    const metrics = optimizedDynamoDBClient.getPerformanceMetrics();
    const slowQueries = optimizedDynamoDBClient.getSlowQueries();
    const cacheStats = optimizedDynamoDBClient.getCacheStats();

    return {
        metrics,
        slowQueries,
        cacheStats,
        recommendations: generatePerformanceRecommendations(slowQueries, cacheStats)
    };
}

function generatePerformanceRecommendations(
    slowQueries: Array<{ operation: string; avgTime: number }>,
    cacheStats: { size: number; hitRate: number; memoryUsage: number }
): string[] {
    const recommendations: string[] = [];

    if (slowQueries.length > 0) {
        recommendations.push(`Consider optimizing ${slowQueries.length} slow queries`);

        slowQueries.forEach(query => {
            if (query.avgTime > 2000) {
                recommendations.push(`Critical: ${query.operation} averaging ${query.avgTime.toFixed(0)}ms`);
            }
        });
    }

    if (cacheStats.hitRate < 0.7) {
        recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    }

    if (cacheStats.memoryUsage > 50 * 1024 * 1024) { // 50MB
        recommendations.push('Cache memory usage is high, consider reducing cache size');
    }

    if (recommendations.length === 0) {
        recommendations.push('Performance is optimal');
    }

    return recommendations;
}

/**
 * Query optimization analyzer
 */
export function analyzeQueryPattern(
    operation: string,
    pk: string,
    sk: string,
    options: any
): {
    efficiency: 'excellent' | 'good' | 'poor';
    recommendations: string[];
    estimatedCost: 'low' | 'medium' | 'high';
} {
    const recommendations: string[] = [];
    let efficiency: 'excellent' | 'good' | 'poor' = 'excellent';
    let estimatedCost: 'low' | 'medium' | 'high' = 'low';

    // Check for scan operations (inefficient)
    if (!pk || pk.includes('*') || pk.includes('%')) {
        efficiency = 'poor';
        estimatedCost = 'high';
        recommendations.push('Avoid scan operations, use specific partition keys');
    }

    // Check for missing GSI usage on time-based queries
    if (options.filterExpression?.includes('publishTime') && !options.indexName) {
        efficiency = 'good';
        estimatedCost = 'medium';
        recommendations.push('Consider using GSI1 for time-based queries');
    }

    // Check for large result sets without pagination
    if (!options.limit || options.limit > 100) {
        efficiency = 'good';
        recommendations.push('Consider adding pagination for large result sets');
    }

    // Check for complex filter expressions
    if (options.filterExpression && options.filterExpression.split('AND').length > 3) {
        efficiency = 'good';
        recommendations.push('Complex filters may impact performance, consider data modeling optimization');
    }

    return { efficiency, recommendations, estimatedCost };
}