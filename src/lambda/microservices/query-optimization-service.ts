/**
 * Query Optimization Service
 * 
 * Analyzes and improves data access patterns to optimize database queries
 * and reduce response times across the system.
 * 
 * **Validates: Requirements 11.2**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'query-optimization-service',
    version: '1.0.0',
    description: 'Query optimization and data access pattern analysis service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const QueryAnalysisSchema = z.object({
    queryId: z.string().min(1, 'Query ID is required'),
    query: z.string().min(1, 'Query is required'),
    queryType: z.enum(['select', 'insert', 'update', 'delete', 'aggregate']),
    database: z.string().min(1, 'Database is required'),
    table: z.string().min(1, 'Table is required'),
    executionTime: z.number().min(0),
    rowsAffected: z.number().min(0),
    indexesUsed: z.array(z.string()).optional().default([]),
    parameters: z.record(z.any()).optional().default({}),
    timestamp: z.string().optional(),
});

const OptimizationRequestSchema = z.object({
    queryId: z.string().min(1, 'Query ID is required'),
    optimizationLevel: z.enum(['basic', 'advanced', 'aggressive']).default('basic'),
    includeIndexSuggestions: z.boolean().default(true),
    includeQueryRewrite: z.boolean().default(true),
    includeCachingStrategy: z.boolean().default(true),
});

// Response types
interface QueryMetrics {
    queryId: string;
    averageExecutionTime: number;
    totalExecutions: number;
    slowestExecution: number;
    fastestExecution: number;
    errorRate: number;
    cacheHitRate: number;
    indexEfficiency: number;
    resourceUsage: {
        cpuTime: number;
        memoryUsage: number;
        diskReads: number;
        networkIO: number;
    };
}

interface OptimizationSuggestion {
    type: 'index' | 'query_rewrite' | 'caching' | 'partitioning' | 'denormalization';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImprovement: number; // Percentage
    implementationComplexity: 'low' | 'medium' | 'high';
    estimatedCost: number;
    details: {
        before?: string;
        after?: string;
        indexDefinition?: string;
        cacheStrategy?: string;
        partitioningKey?: string;
    };
}

interface QueryPattern {
    patternId: string;
    pattern: string;
    frequency: number;
    averageExecutionTime: number;
    tables: string[];
    commonParameters: Record<string, any>;
    optimizationOpportunities: string[];
}

interface DataAccessPattern {
    patternType: 'sequential' | 'random' | 'batch' | 'streaming';
    frequency: number;
    peakHours: number[];
    resourceIntensity: 'low' | 'medium' | 'high';
    cachingEffectiveness: number;
    optimizationPotential: number;
}

/**
 * Query Optimization Service Handler
 */
class QueryOptimizationServiceHandler extends BaseLambdaHandler {
    private queryMetrics: Map<string, QueryMetrics> = new Map();
    private queryHistory: Array<{
        queryId: string;
        query: string;
        executionTime: number;
        timestamp: number;
        success: boolean;
    }> = [];
    private queryPatterns: Map<string, QueryPattern> = new Map();
    private accessPatterns: Map<string, DataAccessPattern> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
        this.initializePatternAnalysis();
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/analyze')) {
                return await this.analyzeQuery(event);
            }

            if (httpMethod === 'POST' && path.includes('/optimize')) {
                return await this.optimizeQuery(event);
            }

            if (httpMethod === 'GET' && path.includes('/metrics')) {
                return await this.getQueryMetrics(event);
            }

            if (httpMethod === 'GET' && path.includes('/patterns')) {
                return await this.getQueryPatterns(event);
            }

            if (httpMethod === 'GET' && path.includes('/suggestions')) {
                return await this.getOptimizationSuggestions(event);
            }

            if (httpMethod === 'POST' && path.includes('/batch-analyze')) {
                return await this.batchAnalyzeQueries(event);
            }

            if (httpMethod === 'GET' && path.includes('/access-patterns')) {
                return await this.getAccessPatterns(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Analyze query performance and patterns
     */
    private async analyzeQuery(event: APIGatewayProxyEvent): Promise<ApiResponse<{ analysis: QueryMetrics; suggestions: OptimizationSuggestion[] }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                QueryAnalysisSchema.parse(data)
            );

            const { queryId, query, queryType, database, table, executionTime, rowsAffected, indexesUsed, parameters } = requestBody;

            // Update query history
            this.queryHistory.push({
                queryId,
                query,
                executionTime,
                timestamp: Date.now(),
                success: true,
            });

            // Update or create query metrics
            let metrics = this.queryMetrics.get(queryId);
            if (!metrics) {
                metrics = {
                    queryId,
                    averageExecutionTime: executionTime,
                    totalExecutions: 1,
                    slowestExecution: executionTime,
                    fastestExecution: executionTime,
                    errorRate: 0,
                    cacheHitRate: 0,
                    indexEfficiency: this.calculateIndexEfficiency(indexesUsed, query),
                    resourceUsage: {
                        cpuTime: executionTime * 0.7, // Estimated
                        memoryUsage: rowsAffected * 1024, // Estimated
                        diskReads: rowsAffected * 0.1, // Estimated
                        networkIO: query.length * 8, // Estimated
                    },
                };
            } else {
                // Update metrics
                metrics.totalExecutions++;
                metrics.averageExecutionTime = (
                    (metrics.averageExecutionTime * (metrics.totalExecutions - 1)) + executionTime
                ) / metrics.totalExecutions;
                metrics.slowestExecution = Math.max(metrics.slowestExecution, executionTime);
                metrics.fastestExecution = Math.min(metrics.fastestExecution, executionTime);
                metrics.indexEfficiency = this.calculateIndexEfficiency(indexesUsed, query);
            }

            this.queryMetrics.set(queryId, metrics);

            // Analyze query patterns
            await this.analyzeQueryPattern(query, queryType, table, executionTime);

            // Generate optimization suggestions
            const suggestions = await this.generateOptimizationSuggestions(queryId, query, metrics);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Query Analyzed',
                {
                    queryId,
                    queryType,
                    database,
                    table,
                    executionTime,
                    suggestionsCount: suggestions.length,
                }
            );

            return this.createSuccessResponse({ analysis: metrics, suggestions });

        } catch (error) {
            return this.createErrorResponseData(
                'QUERY_ANALYSIS_FAILED',
                error instanceof Error ? error.message : 'Failed to analyze query',
                400
            );
        }
    }

    /**
     * Optimize query based on analysis
     */
    private async optimizeQuery(event: APIGatewayProxyEvent): Promise<ApiResponse<{ optimizedQuery: string; suggestions: OptimizationSuggestion[] }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                OptimizationRequestSchema.parse(data)
            );

            const { queryId, optimizationLevel, includeIndexSuggestions, includeQueryRewrite, includeCachingStrategy } = requestBody;

            const metrics = this.queryMetrics.get(queryId);
            if (!metrics) {
                throw new Error(`Query metrics not found for ID: ${queryId}`);
            }

            // Get original query from history
            const queryHistory = this.queryHistory.find(h => h.queryId === queryId);
            if (!queryHistory) {
                throw new Error(`Query history not found for ID: ${queryId}`);
            }

            const originalQuery = queryHistory.query;
            let optimizedQuery = originalQuery;
            const suggestions: OptimizationSuggestion[] = [];

            // Apply query rewriting optimizations
            if (includeQueryRewrite) {
                const rewriteResult = this.rewriteQuery(originalQuery, optimizationLevel);
                optimizedQuery = rewriteResult.query;
                suggestions.push(...rewriteResult.suggestions);
            }

            // Generate index suggestions
            if (includeIndexSuggestions) {
                const indexSuggestions = this.generateIndexSuggestions(originalQuery, metrics);
                suggestions.push(...indexSuggestions);
            }

            // Generate caching strategy suggestions
            if (includeCachingStrategy) {
                const cachingSuggestions = this.generateCachingSuggestions(queryId, metrics);
                suggestions.push(...cachingSuggestions);
            }

            // Add partitioning suggestions for large tables
            if (metrics.resourceUsage.diskReads > 10000) {
                suggestions.push({
                    type: 'partitioning',
                    priority: 'high',
                    description: 'Consider table partitioning to improve query performance',
                    expectedImprovement: 40,
                    implementationComplexity: 'high',
                    estimatedCost: 8,
                    details: {
                        partitioningKey: 'created_date',
                    },
                });
            }

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Query Optimized',
                {
                    queryId,
                    optimizationLevel,
                    suggestionsCount: suggestions.length,
                    estimatedImprovement: suggestions.reduce((sum, s) => sum + s.expectedImprovement, 0) / suggestions.length,
                }
            );

            return this.createSuccessResponse({ optimizedQuery, suggestions });

        } catch (error) {
            return this.createErrorResponseData(
                'QUERY_OPTIMIZATION_FAILED',
                error instanceof Error ? error.message : 'Failed to optimize query',
                400
            );
        }
    }

    /**
     * Get query metrics
     */
    private async getQueryMetrics(event: APIGatewayProxyEvent): Promise<ApiResponse<QueryMetrics | QueryMetrics[]>> {
        try {
            const queryId = event.queryStringParameters?.queryId;

            if (queryId) {
                const metrics = this.queryMetrics.get(queryId);
                if (!metrics) {
                    throw new Error(`Query metrics not found for ID: ${queryId}`);
                }
                return this.createSuccessResponse(metrics);
            } else {
                // Return all metrics
                const allMetrics = Array.from(this.queryMetrics.values());
                return this.createSuccessResponse(allMetrics);
            }

        } catch (error) {
            return this.createErrorResponseData(
                'METRICS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve query metrics',
                400
            );
        }
    }

    /**
     * Get query patterns
     */
    private async getQueryPatterns(event: APIGatewayProxyEvent): Promise<ApiResponse<QueryPattern[]>> {
        try {
            const table = event.queryStringParameters?.table;
            let patterns = Array.from(this.queryPatterns.values());

            if (table) {
                patterns = patterns.filter(p => p.tables.includes(table));
            }

            // Sort by frequency
            patterns.sort((a, b) => b.frequency - a.frequency);

            return this.createSuccessResponse(patterns);

        } catch (error) {
            return this.createErrorResponseData(
                'PATTERNS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve query patterns',
                500
            );
        }
    }

    /**
     * Get optimization suggestions
     */
    private async getOptimizationSuggestions(event: APIGatewayProxyEvent): Promise<ApiResponse<OptimizationSuggestion[]>> {
        try {
            const priority = event.queryStringParameters?.priority as 'low' | 'medium' | 'high' | 'critical';
            const type = event.queryStringParameters?.type as OptimizationSuggestion['type'];

            // Generate suggestions for all queries
            const allSuggestions: OptimizationSuggestion[] = [];

            for (const [queryId, metrics] of this.queryMetrics.entries()) {
                const queryHistory = this.queryHistory.find(h => h.queryId === queryId);
                if (queryHistory) {
                    const suggestions = await this.generateOptimizationSuggestions(queryId, queryHistory.query, metrics);
                    allSuggestions.push(...suggestions);
                }
            }

            // Filter by priority and type
            let filteredSuggestions = allSuggestions;
            if (priority) {
                filteredSuggestions = filteredSuggestions.filter(s => s.priority === priority);
            }
            if (type) {
                filteredSuggestions = filteredSuggestions.filter(s => s.type === type);
            }

            // Sort by priority and expected improvement
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            filteredSuggestions.sort((a, b) => {
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return b.expectedImprovement - a.expectedImprovement;
            });

            return this.createSuccessResponse(filteredSuggestions);

        } catch (error) {
            return this.createErrorResponseData(
                'SUGGESTIONS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve optimization suggestions',
                500
            );
        }
    }

    /**
     * Batch analyze multiple queries
     */
    private async batchAnalyzeQueries(event: APIGatewayProxyEvent): Promise<ApiResponse<{ processedCount: number; results: any[] }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                z.object({
                    queries: z.array(QueryAnalysisSchema),
                }).parse(data)
            );

            const { queries } = requestBody;
            const results = [];

            for (const queryData of queries) {
                try {
                    // Create a mock event for individual analysis
                    const mockEvent = {
                        ...event,
                        body: JSON.stringify(queryData),
                    };

                    const result = await this.analyzeQuery(mockEvent as APIGatewayProxyEvent);
                    results.push({
                        queryId: queryData.queryId,
                        success: true,
                        data: result.body.data,
                    });
                } catch (error) {
                    results.push({
                        queryId: queryData.queryId,
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Batch Query Analysis Completed',
                {
                    totalQueries: queries.length,
                    processedCount: results.filter(r => r.success).length,
                    failedCount: results.filter(r => !r.success).length,
                }
            );

            return this.createSuccessResponse({
                processedCount: results.filter(r => r.success).length,
                results,
            });

        } catch (error) {
            return this.createErrorResponseData(
                'BATCH_ANALYSIS_FAILED',
                error instanceof Error ? error.message : 'Failed to batch analyze queries',
                400
            );
        }
    }

    /**
     * Get data access patterns
     */
    private async getAccessPatterns(event: APIGatewayProxyEvent): Promise<ApiResponse<DataAccessPattern[]>> {
        try {
            const patternType = event.queryStringParameters?.patternType as DataAccessPattern['patternType'];
            let patterns = Array.from(this.accessPatterns.values());

            if (patternType) {
                patterns = patterns.filter(p => p.patternType === patternType);
            }

            // Sort by optimization potential
            patterns.sort((a, b) => b.optimizationPotential - a.optimizationPotential);

            return this.createSuccessResponse(patterns);

        } catch (error) {
            return this.createErrorResponseData(
                'ACCESS_PATTERNS_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve access patterns',
                500
            );
        }
    }

    // Helper methods
    private calculateIndexEfficiency(indexesUsed: string[], query: string): number {
        if (indexesUsed.length === 0) return 0;

        // Simple heuristic: more indexes used = better efficiency
        // In reality, this would be much more complex
        const queryComplexity = query.split(' ').length;
        const indexScore = indexesUsed.length * 20;
        return Math.min(100, indexScore / queryComplexity * 100);
    }

    private async analyzeQueryPattern(query: string, queryType: string, table: string, executionTime: number): Promise<void> {
        // Extract pattern from query (simplified)
        const normalizedQuery = this.normalizeQuery(query);
        const patternId = this.generatePatternId(normalizedQuery);

        let pattern = this.queryPatterns.get(patternId);
        if (!pattern) {
            pattern = {
                patternId,
                pattern: normalizedQuery,
                frequency: 1,
                averageExecutionTime: executionTime,
                tables: [table],
                commonParameters: {},
                optimizationOpportunities: [],
            };
        } else {
            pattern.frequency++;
            pattern.averageExecutionTime = (
                (pattern.averageExecutionTime * (pattern.frequency - 1)) + executionTime
            ) / pattern.frequency;

            if (!pattern.tables.includes(table)) {
                pattern.tables.push(table);
            }
        }

        // Identify optimization opportunities
        pattern.optimizationOpportunities = this.identifyOptimizationOpportunities(normalizedQuery, pattern);

        this.queryPatterns.set(patternId, pattern);
    }

    private normalizeQuery(query: string): string {
        // Replace specific values with placeholders
        return query
            .replace(/\d+/g, '?')
            .replace(/'[^']*'/g, '?')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    private generatePatternId(normalizedQuery: string): string {
        // Simple hash function for pattern ID
        let hash = 0;
        for (let i = 0; i < normalizedQuery.length; i++) {
            const char = normalizedQuery.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `pattern_${Math.abs(hash)}`;
    }

    private identifyOptimizationOpportunities(query: string, pattern: QueryPattern): string[] {
        const opportunities = [];

        if (query.includes('select *')) {
            opportunities.push('Use specific column names instead of SELECT *');
        }

        if (query.includes('order by') && !query.includes('limit')) {
            opportunities.push('Consider adding LIMIT to ORDER BY queries');
        }

        if (pattern.frequency > 100 && pattern.averageExecutionTime > 1000) {
            opportunities.push('High-frequency slow query - consider caching');
        }

        if (query.includes('like') && query.includes('%')) {
            opportunities.push('LIKE with leading wildcard - consider full-text search');
        }

        return opportunities;
    }

    private async generateOptimizationSuggestions(queryId: string, query: string, metrics: QueryMetrics): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // Index suggestions
        if (metrics.indexEfficiency < 50) {
            suggestions.push({
                type: 'index',
                priority: 'high',
                description: 'Add indexes to improve query performance',
                expectedImprovement: 60,
                implementationComplexity: 'medium',
                estimatedCost: 3,
                details: {
                    indexDefinition: 'CREATE INDEX idx_example ON table_name (column1, column2)',
                },
            });
        }

        // Caching suggestions
        if (metrics.totalExecutions > 50 && metrics.averageExecutionTime > 500) {
            suggestions.push({
                type: 'caching',
                priority: 'medium',
                description: 'Implement query result caching for frequently executed queries',
                expectedImprovement: 80,
                implementationComplexity: 'low',
                estimatedCost: 2,
                details: {
                    cacheStrategy: 'Redis with 1-hour TTL',
                },
            });
        }

        // Query rewrite suggestions
        if (query.includes('select *')) {
            suggestions.push({
                type: 'query_rewrite',
                priority: 'medium',
                description: 'Replace SELECT * with specific column names',
                expectedImprovement: 25,
                implementationComplexity: 'low',
                estimatedCost: 1,
                details: {
                    before: query,
                    after: query.replace('select *', 'select id, name, created_at'),
                },
            });
        }

        return suggestions;
    }

    private rewriteQuery(query: string, optimizationLevel: string): { query: string; suggestions: OptimizationSuggestion[] } {
        let optimizedQuery = query;
        const suggestions: OptimizationSuggestion[] = [];

        // Basic optimizations
        if (query.includes('select *')) {
            optimizedQuery = optimizedQuery.replace('select *', 'select id, name, created_at');
            suggestions.push({
                type: 'query_rewrite',
                priority: 'medium',
                description: 'Replaced SELECT * with specific columns',
                expectedImprovement: 25,
                implementationComplexity: 'low',
                estimatedCost: 1,
                details: {
                    before: query,
                    after: optimizedQuery,
                },
            });
        }

        // Advanced optimizations
        if (optimizationLevel === 'advanced' || optimizationLevel === 'aggressive') {
            if (query.includes('order by') && !query.includes('limit')) {
                optimizedQuery += ' LIMIT 1000';
                suggestions.push({
                    type: 'query_rewrite',
                    priority: 'high',
                    description: 'Added LIMIT to ORDER BY query to prevent excessive sorting',
                    expectedImprovement: 40,
                    implementationComplexity: 'low',
                    estimatedCost: 1,
                    details: {
                        before: query,
                        after: optimizedQuery,
                    },
                });
            }
        }

        return { query: optimizedQuery, suggestions };
    }

    private generateIndexSuggestions(query: string, metrics: QueryMetrics): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        if (metrics.indexEfficiency < 30) {
            suggestions.push({
                type: 'index',
                priority: 'critical',
                description: 'Critical: Add composite index for WHERE clause columns',
                expectedImprovement: 70,
                implementationComplexity: 'medium',
                estimatedCost: 4,
                details: {
                    indexDefinition: 'CREATE INDEX idx_composite ON table_name (column1, column2, column3)',
                },
            });
        } else if (metrics.indexEfficiency < 60) {
            suggestions.push({
                type: 'index',
                priority: 'high',
                description: 'Add covering index to eliminate key lookups',
                expectedImprovement: 45,
                implementationComplexity: 'medium',
                estimatedCost: 3,
                details: {
                    indexDefinition: 'CREATE INDEX idx_covering ON table_name (key_column) INCLUDE (data_columns)',
                },
            });
        }

        return suggestions;
    }

    private generateCachingSuggestions(queryId: string, metrics: QueryMetrics): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        if (metrics.totalExecutions > 100 && metrics.averageExecutionTime > 200) {
            suggestions.push({
                type: 'caching',
                priority: 'high',
                description: 'Implement Redis caching for frequently executed query',
                expectedImprovement: 85,
                implementationComplexity: 'low',
                estimatedCost: 2,
                details: {
                    cacheStrategy: 'Redis with smart TTL based on data volatility',
                },
            });
        } else if (metrics.totalExecutions > 20) {
            suggestions.push({
                type: 'caching',
                priority: 'medium',
                description: 'Consider application-level caching',
                expectedImprovement: 60,
                implementationComplexity: 'low',
                estimatedCost: 1,
                details: {
                    cacheStrategy: 'In-memory cache with 15-minute TTL',
                },
            });
        }

        return suggestions;
    }

    private initializePatternAnalysis(): void {
        // Initialize some common access patterns
        this.accessPatterns.set('sequential_read', {
            patternType: 'sequential',
            frequency: 0.4,
            peakHours: [9, 10, 11, 14, 15, 16],
            resourceIntensity: 'medium',
            cachingEffectiveness: 0.8,
            optimizationPotential: 0.7,
        });

        this.accessPatterns.set('random_lookup', {
            patternType: 'random',
            frequency: 0.3,
            peakHours: [8, 9, 17, 18],
            resourceIntensity: 'low',
            cachingEffectiveness: 0.9,
            optimizationPotential: 0.8,
        });

        this.accessPatterns.set('batch_processing', {
            patternType: 'batch',
            frequency: 0.2,
            peakHours: [2, 3, 4, 22, 23],
            resourceIntensity: 'high',
            cachingEffectiveness: 0.3,
            optimizationPotential: 0.6,
        });

        this.accessPatterns.set('streaming_data', {
            patternType: 'streaming',
            frequency: 0.1,
            peakHours: [0, 1, 2, 3, 4, 5],
            resourceIntensity: 'high',
            cachingEffectiveness: 0.2,
            optimizationPotential: 0.5,
        });
    }
}

// Export the Lambda handler
export const handler = new QueryOptimizationServiceHandler().lambdaHandler.bind(
    new QueryOptimizationServiceHandler()
);