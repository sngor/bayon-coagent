/**
 * Client Dashboard Caching Service
 * 
 * Implements caching strategy for:
 * - Dashboard data (5-minute TTL)
 * - Property search results (5-minute TTL) - already implemented in property-search.ts
 * - MLS data (agent-specific caching)
 * 
 * Requirements: Performance optimization (Task 26)
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    key?: string; // Custom cache key
}

/**
 * Generic cache manager
 */
export class CacheManager<T> {
    private cache: Map<string, CacheEntry<T>>;
    private defaultTTL: number;

    constructor(defaultTTL: number = 5 * 60 * 1000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    /**
     * Get cached data
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if cache entry is still valid
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cached data
     */
    set(key: string, data: T, options?: CacheOptions): void {
        const ttl = options?.ttl || this.defaultTTL;

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });

        // Clean up old entries periodically
        this.cleanup();
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete cached data
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Remove expired cache entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        entries: Array<{ key: string; age: number; ttl: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            ttl: entry.ttl,
        }));

        return {
            size: this.cache.size,
            entries,
        };
    }
}

/**
 * Dashboard data cache (5-minute TTL)
 */
export const dashboardCache = new CacheManager<any>(5 * 60 * 1000);

/**
 * MLS data cache (agent-specific, 5-minute TTL)
 */
export const mlsDataCache = new CacheManager<any>(5 * 60 * 1000);

/**
 * Analytics cache (1-minute TTL for real-time updates)
 */
export const analyticsCache = new CacheManager<any>(1 * 60 * 1000);

/**
 * Generate cache key for dashboard
 */
export function getDashboardCacheKey(dashboardId: string): string {
    return `dashboard:${dashboardId}`;
}

/**
 * Generate cache key for MLS data
 */
export function getMLSDataCacheKey(agentId: string, dataType: string): string {
    return `mls:${agentId}:${dataType}`;
}

/**
 * Generate cache key for analytics
 */
export function getAnalyticsCacheKey(dashboardId: string, type: string): string {
    return `analytics:${dashboardId}:${type}`;
}

/**
 * Cache decorator for async functions
 */
export function withCache<T>(
    cache: CacheManager<T>,
    keyGenerator: (...args: any[]) => string,
    options?: CacheOptions
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const key = keyGenerator(...args);

            // Try to get from cache
            const cached = cache.get(key);
            if (cached !== null) {
                console.log(`Cache hit for ${key}`);
                return cached;
            }

            // Execute original method
            console.log(`Cache miss for ${key}`);
            const result = await originalMethod.apply(this, args);

            // Store in cache
            cache.set(key, result, options);

            return result;
        };

        return descriptor;
    };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
    dashboardCache.clear();
    mlsDataCache.clear();
    analyticsCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
    return {
        dashboard: dashboardCache.getStats(),
        mls: mlsDataCache.getStats(),
        analytics: analyticsCache.getStats(),
    };
}
