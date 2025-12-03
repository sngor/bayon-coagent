/**
 * DynamoDB Query Optimizer
 * 
 * Provides utilities for optimizing DynamoDB queries including:
 * - Batch operation optimization
 * - Parallel query execution
 * - Query result caching
 * - Projection expression optimization
 */

import { DynamoDBRepository } from '../dynamodb/repository';
import { QueryOptions, QueryResult, DynamoDBKey } from '../dynamodb/types';

/**
 * Batch query optimizer for parallel execution
 */
export class QueryOptimizer {
    private repository: DynamoDBRepository;
    private queryCache: Map<string, { result: any; timestamp: number }>;
    private cacheTTL: number;

    constructor(repository: DynamoDBRepository, cacheTTL: number = 60000) {
        this.repository = repository;
        this.queryCache = new Map();
        this.cacheTTL = cacheTTL;
    }

    /**
     * Executes multiple queries in parallel
     */
    async parallelQuery<T>(
        queries: Array<{
            pk: string;
            skPrefix?: string;
            options?: QueryOptions;
        }>
    ): Promise<QueryResult<T>[]> {
        const promises = queries.map(({ pk, skPrefix, options }) =>
            this.repository.query<T>(pk, skPrefix, options)
        );

        return Promise.all(promises);
    }

    /**
     * Executes a query with caching
     */
    async cachedQuery<T>(
        pk: string,
        skPrefix?: string,
        options?: QueryOptions
    ): Promise<QueryResult<T>> {
        const cacheKey = this.generateCacheKey(pk, skPrefix, options);
        const cached = this.queryCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.result;
        }

        const result = await this.repository.query<T>(pk, skPrefix, options);

        this.queryCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
        });

        return result;
    }

    /**
     * Batch get with automatic chunking and parallel execution
     */
    async optimizedBatchGet<T>(keys: DynamoDBKey[]): Promise<T[]> {
        if (keys.length === 0) {
            return [];
        }

        // DynamoDB batch get limit is 100 items
        const BATCH_SIZE = 100;
        const batches: DynamoDBKey[][] = [];

        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            batches.push(keys.slice(i, i + BATCH_SIZE));
        }

        // Execute batches in parallel
        const results = await Promise.all(
            batches.map((batch) => this.repository.batchGet<T>(batch))
        );

        // Flatten results
        return results.flatMap((result) => result.items);
    }

    /**
     * Optimizes query options by adding projection expressions
     * to reduce data transfer
     */
    optimizeProjection(
        options: QueryOptions,
        fields: string[]
    ): QueryOptions {
        if (fields.length === 0) {
            return options;
        }

        const expressionAttributeNames: Record<string, string> = {
            ...options.expressionAttributeNames,
        };

        const projectionFields = fields.map((field, index) => {
            const placeholder = `#field${index}`;
            expressionAttributeNames[placeholder] = field;
            return placeholder;
        });

        return {
            ...options,
            expressionAttributeNames,
            projectionExpression: projectionFields.join(', '),
        };
    }

    /**
     * Paginates through all results efficiently
     */
    async *paginateQuery<T>(
        pk: string,
        skPrefix?: string,
        options: QueryOptions = {}
    ): AsyncGenerator<T[], void, unknown> {
        let lastEvaluatedKey: DynamoDBKey | undefined;

        do {
            const result = await this.repository.query<T>(pk, skPrefix, {
                ...options,
                exclusiveStartKey: lastEvaluatedKey,
            });

            if (result.items.length > 0) {
                yield result.items;
            }

            lastEvaluatedKey = result.lastEvaluatedKey;
        } while (lastEvaluatedKey);
    }

    /**
     * Clears the query cache
     */
    clearCache(): void {
        this.queryCache.clear();
    }

    /**
     * Clears expired cache entries
     */
    clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of this.queryCache.entries()) {
            if (now - value.timestamp >= this.cacheTTL) {
                this.queryCache.delete(key);
            }
        }
    }

    /**
     * Gets cache statistics
     */
    getCacheStats(): {
        size: number;
        validEntries: number;
        expiredEntries: number;
    } {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const value of this.queryCache.values()) {
            if (now - value.timestamp < this.cacheTTL) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            size: this.queryCache.size,
            validEntries,
            expiredEntries,
        };
    }

    private generateCacheKey(
        pk: string,
        skPrefix?: string,
        options?: QueryOptions
    ): string {
        return JSON.stringify({ pk, skPrefix, options });
    }
}

/**
 * Creates an optimized query builder with common patterns
 */
export class QueryBuilder {
    private options: QueryOptions = {};

    /**
     * Sets the limit for the query
     */
    limit(limit: number): this {
        this.options.limit = limit;
        return this;
    }

    /**
     * Sets the scan direction
     */
    scanForward(forward: boolean): this {
        this.options.scanIndexForward = forward;
        return this;
    }

    /**
     * Adds a filter expression
     */
    filter(expression: string, values: Record<string, any>): this {
        this.options.filterExpression = expression;
        this.options.expressionAttributeValues = {
            ...this.options.expressionAttributeValues,
            ...values,
        };
        return this;
    }

    /**
     * Adds projection (select specific fields)
     */
    select(fields: string[]): this {
        const expressionAttributeNames: Record<string, string> = {
            ...this.options.expressionAttributeNames,
        };

        const projectionFields = fields.map((field, index) => {
            const placeholder = `#field${index}`;
            expressionAttributeNames[placeholder] = field;
            return placeholder;
        });

        this.options.expressionAttributeNames = expressionAttributeNames;
        this.options.projectionExpression = projectionFields.join(', ');
        return this;
    }

    /**
     * Sets pagination token
     */
    startFrom(key: DynamoDBKey): this {
        this.options.exclusiveStartKey = key;
        return this;
    }

    /**
     * Builds the query options
     */
    build(): QueryOptions {
        return this.options;
    }
}

/**
 * Utility for optimizing batch operations
 */
export class BatchOptimizer {
    /**
     * Optimizes batch write operations by grouping and parallelizing
     */
    static async optimizedBatchWrite<T>(
        repository: DynamoDBRepository,
        items: T[],
        keyGenerator: (item: T) => { PK: string; SK: string },
        batchSize: number = 25
    ): Promise<void> {
        if (items.length === 0) {
            return;
        }

        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        // Execute batches in parallel (with concurrency limit)
        const CONCURRENCY_LIMIT = 5;
        for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
            const batchGroup = batches.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(
                batchGroup.map((batch) => {
                    const dynamoItems = batch.map((item) => ({
                        ...keyGenerator(item),
                        Data: item,
                        EntityType: 'BatchItem' as const,
                        CreatedAt: Date.now(),
                        UpdatedAt: Date.now(),
                    }));
                    return repository.batchWrite(dynamoItems, []);
                })
            );
        }
    }

    /**
     * Deduplicates keys before batch get
     */
    static deduplicateKeys(keys: DynamoDBKey[]): DynamoDBKey[] {
        const seen = new Set<string>();
        return keys.filter((key) => {
            const keyStr = `${key.PK}#${key.SK}`;
            if (seen.has(keyStr)) {
                return false;
            }
            seen.add(keyStr);
            return true;
        });
    }
}
