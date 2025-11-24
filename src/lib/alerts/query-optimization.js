"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceMonitor = exports.createResultMerger = exports.createQueryOptimizer = exports.performanceMonitor = exports.resultMerger = exports.queryOptimizer = exports.QueryPerformanceMonitor = exports.QueryResultMerger = exports.AlertQueryOptimizer = void 0;
class AlertQueryOptimizer {
    optimizeQuery(userId, filters = {}, options = {}) {
        const { types, status, priority, dateRange, searchQuery } = filters;
        const { limit = 50, sortOrder = 'desc' } = options;
        if (types && types.length === 1 && !status && !priority && !dateRange && !searchQuery) {
            return this.createTypeQuery(userId, types[0], limit, sortOrder);
        }
        if (types && types.length > 1 && types.length <= 3 && !status && !priority && !dateRange && !searchQuery) {
            return this.createParallelTypeQueries(userId, types, limit, sortOrder);
        }
        if (status && status.length === 1 && !types && !priority && !dateRange && !searchQuery) {
            return this.createStatusQuery(userId, status[0], limit, sortOrder);
        }
        return this.createMainTableQuery(userId, filters, options);
    }
    createTypeQuery(userId, alertType, limit, sortOrder) {
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
            estimatedCost: 1,
            estimatedLatency: 50,
        };
    }
    createParallelTypeQueries(userId, alertTypes, limit, sortOrder) {
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
            estimatedCost: alertTypes.length,
            estimatedLatency: 75,
        };
    }
    createStatusQuery(userId, alertStatus, limit, sortOrder) {
        return this.createMainTableQuery(userId, { status: [alertStatus] }, { limit, sortOrder });
    }
    createMainTableQuery(userId, filters, options) {
        const { status, priority, dateRange } = filters;
        const { limit = 50, sortOrder = 'desc' } = options;
        const filterExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        if (status && status.length > 0) {
            const statusPlaceholders = status.map((_, index) => `:status${index}`);
            filterExpressions.push(`#data.#status IN (${statusPlaceholders.join(', ')})`);
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#status'] = 'status';
            status.forEach((s, index) => {
                expressionAttributeValues[`:status${index}`] = s;
            });
        }
        if (priority && priority.length > 0) {
            const priorityPlaceholders = priority.map((_, index) => `:priority${index}`);
            filterExpressions.push(`#data.#priority IN (${priorityPlaceholders.join(', ')})`);
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#priority'] = 'priority';
            priority.forEach((p, index) => {
                expressionAttributeValues[`:priority${index}`] = p;
            });
        }
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
            estimatedCost: 3,
            estimatedLatency: 100,
        };
    }
    estimateQueryPerformance(filters, options) {
        const { types, status, priority, dateRange, searchQuery } = filters;
        let selectivity = 1.0;
        let indexUtilization = 0.0;
        let recommendedStrategy = 'main_table';
        if (types && types.length > 0) {
            selectivity *= types.length / 6;
            indexUtilization = Math.max(indexUtilization, 0.9);
            recommendedStrategy = types.length === 1 ? 'gsi1_type' : 'parallel_queries';
        }
        if (status && status.length > 0) {
            selectivity *= status.length / 4;
        }
        if (priority && priority.length > 0) {
            selectivity *= priority.length / 3;
        }
        if (dateRange) {
            selectivity *= 0.3;
        }
        if (searchQuery) {
            selectivity *= 0.1;
            indexUtilization = 0.0;
            recommendedStrategy = 'main_table';
        }
        return {
            selectivity,
            indexUtilization,
            recommendedStrategy,
        };
    }
}
exports.AlertQueryOptimizer = AlertQueryOptimizer;
class QueryResultMerger {
    mergeAndSort(results, sortOrder = 'desc', limit) {
        const allResults = results.flat();
        allResults.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
        });
        return limit ? allResults.slice(0, limit) : allResults;
    }
    deduplicate(results) {
        const seen = new Set();
        return results.filter(item => {
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    }
}
exports.QueryResultMerger = QueryResultMerger;
class QueryPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    recordQuery(strategy, latency, success = true) {
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
    getMetrics() {
        const result = {};
        for (const [strategy, metrics] of this.metrics.entries()) {
            result[strategy] = {
                ...metrics,
                errorRate: metrics.errors / metrics.count,
            };
        }
        return result;
    }
    reset() {
        this.metrics.clear();
    }
}
exports.QueryPerformanceMonitor = QueryPerformanceMonitor;
exports.queryOptimizer = new AlertQueryOptimizer();
exports.resultMerger = new QueryResultMerger();
exports.performanceMonitor = new QueryPerformanceMonitor();
const createQueryOptimizer = () => new AlertQueryOptimizer();
exports.createQueryOptimizer = createQueryOptimizer;
const createResultMerger = () => new QueryResultMerger();
exports.createResultMerger = createResultMerger;
const createPerformanceMonitor = () => new QueryPerformanceMonitor();
exports.createPerformanceMonitor = createPerformanceMonitor;
