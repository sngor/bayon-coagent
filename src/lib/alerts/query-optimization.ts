/**
 * Alert Query Optimization
 * 
 * Provides optimized query strategies for DynamoDB to improve performance
 * and reduce costs through efficient index usage and query patterns.
 */

import { AlertFilters, AlertQueryOptions, AlertType, AlertStatus, AlertPriority } from './types';
import { QueryOptions } from '@/aws/dynamodb/types';

export interface OptimizedQuery {
    strategy: 'main_table' | 'gsi1_type' | 'gsi2_status' | 'parallel_queries';
    queries: QueryConfig[];
    estimatedCost: number; // Relative cost estimate
    estimatedLatency: number; // Estimated latency in ms
}

export interface QueryConfig {
    indexName?: string;
    keyConditionExpression?: string;
    filterExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
    limit?: number;
    scanIndexForward?: boolean;
}

/**
 * Query Optimizer for Alert queries
 * Analyzes filters and options to determine the most efficient query strategy
 */
export class AlertQueryOptimizer {
    /**
     * Optimizes a query based on filters and options
     */
    optimizeQuery(
        userId: string,
        filters: AlertFilters = {},
        options: AlertQueryOptions = {}
    ): OptimizedQuery {
        const { types, status, priority, dateRange, searchQuery } = filters;
        const { limit = 50, sortOrder = 'desc' } = options;

        // Strategy 1: Single type query using GSI1
        if (types && types.length === 1 && !status && !priority && !dateRange && !searchQuery) {
            return this.createTypeQuery(userId, types[0], limit, sortOrder);
        }

        // Strategy 2: Multiple specific types using parallel GSI1 queries
        if (types && types.length > 1 && types.length <= 3 && !status && !priority && !dateRange && !searchQuery) {
            return this.createParallelTypeQueries(userId, types, limit, sortOrder);
        }

        // Strategy 3: Status-based query (if we had a status GSI)
        if (status && status.length === 1 && !types && !priority && !dateRange && !searchQuery) {
            return this.createStatusQuery(userId, status[0], limit, sortOrder);
        }

        // Strategy 4: Main table scan with filters (least efficient but most flexible)
        return this.createMainTableQuery(userId, filters, options);
    }

    /**
     * Creates an optimized single-type query using GSI1
     */
    private createTypeQuery(
        userId: string,
        alertType: AlertType,
        limit: number,
        sortOrder: 'asc' | 'desc'
    ): OptimizedQuery {
        return {
            strategy: 'gsi1_type',
            queries: [{
                indexName: 'GSI1',
                keyConditionExpression: 'GSI1PK = :gsi1pk',
                expressionAttributeValues: {
                    ':gsi1pk': `ALERT#${userId}#${alertType}`,
                },
                limit,
                scanIndexForward: sortOrder === 'asc',
            }],
            estimatedCost: 1, // Single query, using index
            estimatedLatency: 50,
        };
    }

    /**
     * Creates parallel queries for multiple types using GSI1
     */
    private createParallelTypeQueries(
        userId: string,
        alertTypes: AlertType[],
        limit: number,
        sortOrder: 'asc' | 'desc'
    ): OptimizedQuery {
        const limitPerType = Math.ceil(limit / alertTypes.length);

        const queries = alertTypes.map(alertType => ({
            indexName: 'GSI1',
            keyConditionExpression: 'GSI1PK = :gsi1pk',
            expressionAttributeValues: {
                ':gsi1pk': `ALERT#${userId}#${alertType}`,
            },
            limit: limitPerType,
            scanIndexForward: sortOrder === 'asc',
        }));

        return {
            strategy: 'parallel_queries',
            queries,
            estimatedCost: alertTypes.length, // Multiple parallel queries
            estimatedLatency: 75, // Parallel execution, but more overhead
        };
    }

    /**
     * Creates a status-based query (would require GSI2 in real implementation)
     */
    private createStatusQuery(
        userId: string,
        alertStatus: AlertStatus,
        limit: number,
        sortOrder: 'asc' | 'desc'
    ): OptimizedQuery {
        // Note: This would require a GSI2 with status in the key
        // For now, fall back to main table query with filter
        return this.createMainTableQuery(userId, { status: [alertStatus] }, { limit, sortOrder });
    }

    /**
     * Creates a main table query with filters
     */
    private createMainTableQuery(
        userId: string,
        filters: AlertFilters,
        options: AlertQueryOptions
    ): OptimizedQuery {
        const { status, priority, dateRange } = filters;
        const { limit = 50, sortOrder = 'desc' } = options;

        const filterExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        // Add status filter
        if (status && status.length > 0) {
            const statusPlaceholders = status.map((_, index) => `:status${index}`);
            filterExpressions.push(`#data.#status IN (${statusPlaceholders.join(', ')})`);
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#status'] = 'status';
            status.forEach((s, index) => {
                expressionAttributeValues[`:status${index}`] = s;
            });
        }

        // Add priority filter
        if (priority && priority.length > 0) {
            const priorityPlaceholders = priority.map((_, index) => `:priority${index}`);
            filterExpressions.push(`#data.#priority IN (${priorityPlaceholders.join(', ')})`);
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#priority'] = 'priority';
            priority.forEach((p, index) => {
                expressionAttributeValues[`:priority${index}`] = p;
            });
        }

        // Add date range filter
        if (dateRange) {
            if (dateRange.start) {
                filterExpressions.push('#data.#createdAt >= :startDate');
                expressionAttributeNames['#data'] = 'Data';
                expressionAttributeNames['#createdAt'] = 'createdAt';
                expressionAttributeValues[':startDate'] = dateRange.start;
            }
            if (dateRange.end) {
                filterExpressions.push('#data.#createdAt <= :endDate');
                expressionAttributeNames['#data'] = 'Data';
                expressionAttributeNames['#createdAt'] = 'createdAt';
                expressionAttributeValues[':endDate'] = dateRange.end;
            }
        }

        return {
            strategy: 'main_table',
            queries: [{
                filterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
                expressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
                expressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
                limit,
                scanIndexForward: sortOrder === 'asc',
            }],
            estimatedCost: 3, // Main table query with filters is more expensive
            estimatedLatency: 100,
        };
    }

    /**
     * Estimates query performance based on filters
     */
    estimateQueryPerformance(filters: AlertFilters, options: AlertQueryOptions): {
        selectivity: number; // 0-1, how selective the query is
        indexUtilization: number; // 0-1, how well indexes are utilized
        recommendedStrategy: string;
    } {
        const { types, status, priority, dateRange, searchQuery } = filters;

        let selectivity = 1.0;
        let indexUtilization = 0.0;
        let recommendedStrategy = 'main_table';

        // Calculate selectivity (lower is better)
        if (types && types.length > 0) {
            selectivity *= types.length / 6; // 6 total alert types
            indexUtilization = Math.max(indexUtilization, 0.9); // GSI1 can be used
            recommendedStrategy = types.length === 1 ? 'gsi1_type' : 'parallel_queries';
        }

        if (status && status.length > 0) {
            selectivity *= status.length / 4; // 4 possible statuses
        }

        if (priority && priority.length > 0) {
            selectivity *= priority.length / 3; // 3 priority levels
        }

        if (dateRange) {
            selectivity *= 0.3; // Date ranges are typically selective
        }

        if (searchQuery) {
            selectivity *= 0.1; // Search queries are very selective but require scanning
            indexUtilization = 0.0; // Can't use indexes for text search
            recommendedStrategy = 'main_table';
        }

        return {
            selectivity,
            indexUtilization,
            recommendedStrategy,
        };
    }
}

/**
 * Query Result Merger
 * Merges and sorts results from parallel queries
 */
export class QueryResultMerger {
    /**
     * Merges results from multiple queries and sorts them
     */
    mergeAndSort<T extends { createdAt: string }>(
        results: T[][],
        sortOrder: 'asc' | 'desc' = 'desc',
        limit?: number
    ): T[] {
        // Flatten all results
        const allResults = results.flat();

        // Sort by creation date
        allResults.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
        });

        // Apply limit if specified
        return limit ? allResults.slice(0, limit) : allResults;
    }

    /**
     * Deduplicates results based on ID
     */
    deduplicate<T extends { id: string }>(results: T[]): T[] {
        const seen = new Set<string>();
        return results.filter(item => {
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    }
}

/**
 * Query Performance Monitor
 * Tracks query performance metrics
 */
export class QueryPerformanceMonitor {
    private metrics: Map<string, {
        count: number;
        totalLatency: number;
        avgLatency: number;
        errors: number;
    }> = new Map();

    /**
     * Records query execution metrics
     */
    recordQuery(
        strategy: string,
        latency: number,
        success: boolean = true
    ): void {
        const key = strategy;
        const existing = this.metrics.get(key) || {
            count: 0,
            totalLatency: 0,
            avgLatency: 0,
            errors: 0,
        };

        existing.count++;
        existing.totalLatency += latency;
        existing.avgLatency = existing.totalLatency / existing.count;

        if (!success) {
            existing.errors++;
        }

        this.metrics.set(key, existing);
    }

    /**
     * Gets performance metrics
     */
    getMetrics(): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [strategy, metrics] of this.metrics.entries()) {
            result[strategy] = {
                ...metrics,
                errorRate: metrics.errors / metrics.count,
            };
        }

        return result;
    }

    /**
     * Resets all metrics
     */
    reset(): void {
        this.metrics.clear();
    }
}

// Export singleton instances
export const queryOptimizer = new AlertQueryOptimizer();
export const resultMerger = new QueryResultMerger();
export const performanceMonitor = new QueryPerformanceMonitor();

// Export factory functions
export const createQueryOptimizer = () => new AlertQueryOptimizer();
export const createResultMerger = () => new QueryResultMerger();
export const createPerformanceMonitor = () => new QueryPerformanceMonitor();