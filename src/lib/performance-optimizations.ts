/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for optimizing DynamoDB queries, implementing caching,
 * and managing large datasets efficiently.
 * 
 * Task: 18.2 Performance optimization
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { EntityType } from '@/aws/dynamodb/types';

// ==================== Query Optimization ====================

/**
 * Configuration for query optimization
 */
export interface QueryOptimizationConfig {
    enableCaching?: boolean;
    cacheTimeout?: number; // milliseconds
    batchSize?: number;
    maxRetries?: number;
    enablePagination?: boolean;
    pageSize?: number;
}

/**
 * Default optimization configuration
 */
const DEFAULT_CONFIG: Required<QueryOptimizationConfig> = {
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    batchSize: 25, // DynamoDB batch limit
    maxRetries: 3,
    enablePagination: true,
    pageSize: 100,
};

/**
 * In-memory cache for query results
 */
class QueryCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    set(key: string, data: any, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

const queryCache = new QueryCache();

// Clean up cache every 10 minutes
setInterval(() => queryCache.cleanup(), 10 * 60 * 1000);

/**
 * Generate cache key for query parameters
 */
function generateCacheKey(
    pk: string,
    sk?: string,
    options?: any
): string {
    const keyParts = [pk];
    if (sk) keyParts.push(sk);
    if (options) {
        keyParts.push(JSON.stringify(options));
    }
    return keyParts.join('|');
}

/**
 * Optimized query function with caching and batching
 */
export async function optimizedQuery<T>(
    pk: string,
    sk?: string,
    options?: any,
    config: QueryOptimizationConfig = {}
): Promise<{ items: T[]; lastEvaluatedKey?: any; fromCache?: boolean }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const repository = getRepository();

    // Check cache first
    if (finalConfig.enableCaching) {
        const cacheKey = generateCacheKey(pk, sk, options);
        const cachedResult = queryCache.get(cacheKey);
        if (cachedResult) {
            return { ...cachedResult, fromCache: true };
        }
    }

    try {
        // Execute query with pagination if enabled
        let allItems: T[] = [];
        let lastEvaluatedKey: any = undefined;
        let hasMoreData = true;

        while (hasMoreData) {
            const queryOptions = {
                ...options,
                limit: finalConfig.enablePagination ? finalConfig.pageSize : undefined,
                exclusiveStartKey: lastEvaluatedKey,
            };

            const result = await repository.query<T>(pk, sk, queryOptions);

            allItems = allItems.concat(result.items);
            lastEvaluatedKey = result.lastEvaluatedKey;

            // Stop if we don't have more data or pagination is disabled
            hasMoreData = !!lastEvaluatedKey && finalConfig.enablePagination;

            // For non-paginated queries, break after first iteration
            if (!finalConfig.enablePagination) {
                hasMoreData = false;
            }
        }

        const queryResult = {
            items: allItems,
            lastEvaluatedKey,
        };

        // Cache the result
        if (finalConfig.enableCaching) {
            const cacheKey = generateCacheKey(pk, sk, options);
            queryCache.set(cacheKey, queryResult, finalConfig.cacheTimeout);
        }

        return queryResult;

    } catch (error) {
        console.error('Optimized query failed:', error);
        throw error;
    }
}

/**
 * Batch write operations with automatic chunking
 */
export async function optimizedBatchWrite<T>(
    items: Array<{
        pk: string;
        sk: string;
        entityType: EntityType;
        data: T;
        gsiKeys?: Record<string, string>;
    }>,
    config: QueryOptimizationConfig = {}
): Promise<{ success: boolean; failedItems: any[]; processedCount: number }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const repository = getRepository();

    const failedItems: any[] = [];
    let processedCount = 0;

    // Split items into batches
    const batches = [];
    for (let i = 0; i < items.length; i += finalConfig.batchSize) {
        batches.push(items.slice(i, i + finalConfig.batchSize));
    }

    // Process each batch with retry logic
    for (const batch of batches) {
        let retryCount = 0;
        let batchSuccess = false;

        while (retryCount < finalConfig.maxRetries && !batchSuccess) {
            try {
                // Execute batch write
                const promises = batch.map(item =>
                    repository.create(
                        item.pk,
                        item.sk,
                        item.entityType,
                        item.data,
                        item.gsiKeys
                    )
                );

                await Promise.all(promises);
                processedCount += batch.length;
                batchSuccess = true;

            } catch (error) {
                retryCount++;
                console.warn(`Batch write attempt ${retryCount} failed:`, error);

                if (retryCount >= finalConfig.maxRetries) {
                    failedItems.push(...batch);
                } else {
                    // Exponential backoff
                    const delay = Math.pow(2, retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    return {
        success: failedItems.length === 0,
        failedItems,
        processedCount,
    };
}

// ==================== Data Aggregation ====================

/**
 * Aggregate analytics data to reduce chart rendering load
 */
export function aggregateAnalyticsData<T extends { date: string; value: number }>(
    data: T[],
    targetPoints: number = 100
): T[] {
    if (data.length <= targetPoints) {
        return data;
    }

    const groupSize = Math.ceil(data.length / targetPoints);
    const aggregated: T[] = [];

    for (let i = 0; i < data.length; i += groupSize) {
        const group = data.slice(i, i + groupSize);
        const avgValue = group.reduce((sum, item) => sum + item.value, 0) / group.length;

        // Use the first item as template and update the value
        const aggregatedItem = {
            ...group[0],
            value: Math.round(avgValue * 100) / 100, // Round to 2 decimal places
        };

        aggregated.push(aggregatedItem);
    }

    return aggregated;
}

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function for limiting API calls
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== Memory Management ====================

/**
 * Lazy loading utility for large datasets
 */
export class LazyLoader<T> {
    private items: T[] = [];
    private loadedCount = 0;
    private pageSize: number;
    private loader: (offset: number, limit: number) => Promise<T[]>;

    constructor(
        loader: (offset: number, limit: number) => Promise<T[]>,
        pageSize: number = 50
    ) {
        this.loader = loader;
        this.pageSize = pageSize;
    }

    async loadMore(): Promise<T[]> {
        try {
            const newItems = await this.loader(this.loadedCount, this.pageSize);
            this.items.push(...newItems);
            this.loadedCount += newItems.length;
            return newItems;
        } catch (error) {
            console.error('Failed to load more items:', error);
            return [];
        }
    }

    getLoadedItems(): T[] {
        return this.items;
    }

    getLoadedCount(): number {
        return this.loadedCount;
    }

    hasMore(): boolean {
        // This would need to be determined by the loader implementation
        return true; // Placeholder
    }

    reset(): void {
        this.items = [];
        this.loadedCount = 0;
    }
}

// ==================== Performance Monitoring ====================

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
    private metrics = new Map<string, number[]>();

    recordQuery(operation: string, duration: number): void {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        this.metrics.get(operation)!.push(duration);
    }

    getMetrics(): Record<string, {
        count: number;
        avg: number;
        min: number;
        max: number;
        p95: number;
    }> {
        const result: Record<string, any> = {};

        for (const [operation, durations] of this.metrics.entries()) {
            const sorted = [...durations].sort((a, b) => a - b);
            const count = durations.length;
            const sum = durations.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const p95Index = Math.floor(count * 0.95);
            const p95 = sorted[p95Index] || max;

            result[operation] = {
                count,
                avg: Math.round(avg * 100) / 100,
                min,
                max,
                p95,
            };
        }

        return result;
    }

    reset(): void {
        this.metrics.clear();
    }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance<T extends (...args: any[]) => any>(
    target: T,
    operationName?: string
): T {
    return ((...args: any[]) => {
        const startTime = performance.now();
        const name = operationName || target.name || 'anonymous';

        try {
            const result = target(...args);

            // Handle both sync and async functions
            if (result instanceof Promise) {
                return result.finally(() => {
                    const duration = performance.now() - startTime;
                    performanceMonitor.recordQuery(name, duration);
                });
            } else {
                const duration = performance.now() - startTime;
                performanceMonitor.recordQuery(name, duration);
                return result;
            }
        } catch (error) {
            const duration = performance.now() - startTime;
            performanceMonitor.recordQuery(`${name}_error`, duration);
            throw error;
        }
    }) as T;
}

// ==================== List Optimization ====================

/**
 * Determine optimal rendering strategy for lists
 */
export function getOptimalListStrategy(
    itemCount: number,
    estimatedItemHeight: number = 80,
    containerHeight: number = 600
): {
    strategy: 'standard' | 'virtual-scroll' | 'pagination';
    reason: string;
    config: {
        itemHeight?: number;
        containerHeight?: number;
        pageSize?: number;
        visibleItems?: number;
    };
} {
    const visibleItems = Math.ceil(containerHeight / estimatedItemHeight);

    // For small lists, use standard rendering
    if (itemCount <= visibleItems * 2) {
        return {
            strategy: 'standard',
            reason: 'Small list, standard rendering is optimal',
            config: {}
        };
    }

    // For medium lists, consider pagination
    if (itemCount <= 500) {
        return {
            strategy: 'pagination',
            reason: 'Medium list, pagination provides good UX',
            config: {
                pageSize: Math.min(50, Math.max(20, visibleItems * 2))
            }
        };
    }

    // For large lists, use virtual scrolling
    return {
        strategy: 'virtual-scroll',
        reason: 'Large list benefits from virtual scrolling',
        config: {
            itemHeight: estimatedItemHeight,
            containerHeight,
            visibleItems
        }
    };
}

/**
 * Estimate performance impact of different rendering strategies
 */
export function estimateRenderingPerformance(
    itemCount: number,
    strategy: 'standard' | 'virtual-scroll' | 'pagination'
): {
    domNodes: number;
    memoryUsage: string;
    renderTime: string;
    scrollPerformance: string;
} {
    switch (strategy) {
        case 'virtual-scroll':
            return {
                domNodes: 20, // Only visible items
                memoryUsage: 'Low',
                renderTime: 'Fast',
                scrollPerformance: 'Excellent'
            };

        case 'pagination':
            const pageSize = Math.min(50, itemCount);
            return {
                domNodes: pageSize,
                memoryUsage: 'Medium',
                renderTime: pageSize > 30 ? 'Medium' : 'Fast',
                scrollPerformance: 'Good'
            };

        case 'standard':
        default:
            return {
                domNodes: itemCount,
                memoryUsage: itemCount > 100 ? 'High' : 'Medium',
                renderTime: itemCount > 100 ? 'Slow' : 'Fast',
                scrollPerformance: itemCount > 200 ? 'Poor' : 'Good'
            };
    }
}

// ==================== Export Cache Management ====================

/**
 * Clear all performance caches
 */
export function clearPerformanceCaches(): void {
    queryCache.clear();
    performanceMonitor.reset();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    queryCache: {
        size: number;
        hitRate?: number;
    };
    performanceMetrics: Record<string, any>;
} {
    return {
        queryCache: {
            size: queryCache.size(),
        },
        performanceMetrics: performanceMonitor.getMetrics(),
    };
}

/**
 * Preload data for better perceived performance
 */
export async function preloadData<T>(
    loaders: Array<() => Promise<T>>,
    maxConcurrent: number = 3
): Promise<T[]> {
    const results: T[] = [];

    // Process loaders in batches to avoid overwhelming the system
    for (let i = 0; i < loaders.length; i += maxConcurrent) {
        const batch = loaders.slice(i, i + maxConcurrent);
        const batchResults = await Promise.allSettled(
            batch.map(loader => loader())
        );

        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.warn('Preload failed:', result.reason);
            }
        });
    }

    return results;
}