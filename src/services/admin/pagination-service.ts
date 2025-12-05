/**
 * Pagination Service for Admin Platform
 * 
 * Provides cursor-based pagination utilities for DynamoDB queries.
 * Implements efficient pagination patterns with configurable page sizes.
 */

export interface PaginationOptions {
    limit?: number;
    lastKey?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    lastKey?: string;
    hasMore: boolean;
    total?: number;
}

export interface CursorToken {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
}

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 10,
};

/**
 * Encodes a DynamoDB LastEvaluatedKey into a cursor token
 */
export function encodeCursor(lastKey: Record<string, any> | undefined): string | undefined {
    if (!lastKey) {
        return undefined;
    }

    try {
        const token: CursorToken = {
            PK: lastKey.PK,
            SK: lastKey.SK,
            ...(lastKey.GSI1PK && { GSI1PK: lastKey.GSI1PK }),
            ...(lastKey.GSI1SK && { GSI1SK: lastKey.GSI1SK }),
        };

        return Buffer.from(JSON.stringify(token)).toString('base64');
    } catch (error) {
        console.error('Failed to encode cursor:', error);
        return undefined;
    }
}

/**
 * Decodes a cursor token back into a DynamoDB ExclusiveStartKey
 */
export function decodeCursor(cursor: string | undefined): Record<string, any> | undefined {
    if (!cursor) {
        return undefined;
    }

    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const token: CursorToken = JSON.parse(decoded);

        return {
            PK: token.PK,
            SK: token.SK,
            ...(token.GSI1PK && { GSI1PK: token.GSI1PK }),
            ...(token.GSI1SK && { GSI1SK: token.GSI1SK }),
        };
    } catch (error) {
        console.error('Failed to decode cursor:', error);
        return undefined;
    }
}

/**
 * Validates and normalizes pagination options
 */
export function normalizePaginationOptions(options?: PaginationOptions): {
    limit: number;
    exclusiveStartKey?: Record<string, any>;
} {
    const limit = Math.min(
        Math.max(
            options?.limit || PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
            PAGINATION_DEFAULTS.MIN_PAGE_SIZE
        ),
        PAGINATION_DEFAULTS.MAX_PAGE_SIZE
    );

    const exclusiveStartKey = decodeCursor(options?.lastKey);

    return {
        limit,
        exclusiveStartKey,
    };
}

/**
 * Creates a paginated result from DynamoDB query response
 */
export function createPaginatedResult<T>(
    items: T[],
    lastEvaluatedKey: Record<string, any> | undefined,
    requestedLimit: number
): PaginatedResult<T> {
    const lastKey = encodeCursor(lastEvaluatedKey);
    const hasMore = !!lastEvaluatedKey;

    return {
        items,
        lastKey,
        hasMore,
    };
}

/**
 * Batch processing utility for large datasets
 * Processes items in batches to avoid memory issues
 */
export async function processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Query result caching with pagination support
 */
export class QueryCache<T> {
    private cache: Map<string, { data: PaginatedResult<T>; timestamp: number }>;
    private readonly ttl: number;

    constructor(ttlSeconds: number = 120) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }

    /**
     * Generates a cache key from query parameters
     */
    private getCacheKey(params: Record<string, any>): string {
        return JSON.stringify(params);
    }

    /**
     * Gets cached query result
     */
    get(params: Record<string, any>): PaginatedResult<T> | null {
        const key = this.getCacheKey(params);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if expired
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Sets cached query result
     */
    set(params: Record<string, any>, data: PaginatedResult<T>): void {
        const key = this.getCacheKey(params);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Invalidates cache entries matching a pattern
     */
    invalidate(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clears all cached entries
     */
    clear(): void {
        this.cache.clear();
    }
}

/**
 * GSI optimization utilities
 */
export const GSIOptimization = {
    /**
     * Determines the best GSI to use for a query based on filters
     */
    selectOptimalGSI(
        filters: Record<string, any>,
        availableGSIs: string[]
    ): string | null {
        // Priority order for common admin queries
        const gsiPriority = ['GSI1', 'GSI2', 'GSI3'];

        for (const gsi of gsiPriority) {
            if (availableGSIs.includes(gsi)) {
                // Check if filters match GSI keys
                const gsiPK = `${gsi}PK`;
                const gsiSK = `${gsi}SK`;

                if (filters[gsiPK] || filters[gsiSK]) {
                    return gsi;
                }
            }
        }

        return null;
    },

    /**
     * Builds GSI query parameters from filters
     */
    buildGSIQuery(
        gsi: string,
        filters: Record<string, any>
    ): {
        indexName: string;
        keyConditionExpression: string;
        expressionAttributeNames: Record<string, string>;
        expressionAttributeValues: Record<string, any>;
    } {
        const gsiPK = `${gsi}PK`;
        const gsiSK = `${gsi}SK`;

        const keyConditionExpression = filters[gsiSK]
            ? `#${gsiPK} = :${gsiPK} AND begins_with(#${gsiSK}, :${gsiSK})`
            : `#${gsiPK} = :${gsiPK}`;

        const expressionAttributeNames: Record<string, string> = {
            [`#${gsiPK}`]: gsiPK,
        };

        const expressionAttributeValues: Record<string, any> = {
            [`:${gsiPK}`]: filters[gsiPK],
        };

        if (filters[gsiSK]) {
            expressionAttributeNames[`#${gsiSK}`] = gsiSK;
            expressionAttributeValues[`:${gsiSK}`] = filters[gsiSK];
        }

        return {
            indexName: gsi,
            keyConditionExpression,
            expressionAttributeNames,
            expressionAttributeValues,
        };
    },
};

/**
 * Batch operation utilities for bulk actions
 */
export const BatchOperations = {
    /**
     * DynamoDB batch write size limit
     */
    BATCH_WRITE_SIZE: 25,

    /**
     * DynamoDB batch get size limit
     */
    BATCH_GET_SIZE: 100,

    /**
     * Splits items into batches for DynamoDB operations
     */
    createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        return batches;
    },

    /**
     * Processes batches with retry logic
     */
    async processBatchesWithRetry<T, R>(
        batches: T[][],
        processor: (batch: T[]) => Promise<R>,
        maxRetries: number = 3
    ): Promise<R[]> {
        const results: R[] = [];

        for (const batch of batches) {
            let retries = 0;
            let success = false;

            while (!success && retries < maxRetries) {
                try {
                    const result = await processor(batch);
                    results.push(result);
                    success = true;
                } catch (error) {
                    retries++;
                    if (retries >= maxRetries) {
                        console.error(`Batch processing failed after ${maxRetries} retries:`, error);
                        throw error;
                    }

                    // Exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
                }
            }
        }

        return results;
    },
};
