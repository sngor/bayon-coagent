/**
 * AI Cache Types
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    metadata?: Record<string, any>;
}

export interface CacheOptions {
    /**
     * Time to live in milliseconds
     * Default: 1 hour (3600000 ms)
     */
    ttl?: number;

    /**
     * Custom metadata to store with the entry
     */
    metadata?: Record<string, any>;
}

export interface AICache {
    /**
     * Get a value from the cache
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in the cache
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

    /**
     * Delete a value from the cache
     */
    delete(key: string): Promise<void>;

    /**
     * Clear the entire cache
     */
    clear(): Promise<void>;

    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        size: number;
        hits?: number;
        misses?: number;
    }>;
}
