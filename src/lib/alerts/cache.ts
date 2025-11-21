/**
 * Alert Caching System
 * 
 * Provides in-memory caching for frequently accessed alert data
 * to reduce DynamoDB queries and improve performance.
 */

import { Alert, AlertsResponse, AlertFilters, AlertQueryOptions } from './types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface AlertCacheKey {
    userId: string;
    filters: string; // Serialized filters
    options: string; // Serialized options
}

/**
 * Alert Cache class
 * Provides in-memory caching with TTL support
 */
export class AlertCache {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
    private readonly maxCacheSize = 1000; // Maximum number of cache entries

    /**
     * Generates a cache key from user ID, filters, and options
     */
    private generateKey(userId: string, filters?: AlertFilters, options?: AlertQueryOptions): string {
        const filtersKey = JSON.stringify(filters || {});
        const optionsKey = JSON.stringify(options || {});
        return `alerts:${userId}:${Buffer.from(filtersKey).toString('base64')}:${Buffer.from(optionsKey).toString('base64')}`;
    }

    /**
     * Generates a cache key for unread count
     */
    private generateUnreadCountKey(userId: string): string {
        return `unread_count:${userId}`;
    }

    /**
     * Generates a cache key for alert statistics
     */
    private generateStatsKey(userId: string): string {
        return `stats:${userId}`;
    }

    /**
     * Cleans up expired cache entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Ensures cache doesn't exceed maximum size
     */
    private enforceMaxSize(): void {
        if (this.cache.size <= this.maxCacheSize) return;

        // Remove oldest entries first
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        const entriesToRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
        entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }

    /**
     * Gets cached alerts
     */
    get(userId: string, filters?: AlertFilters, options?: AlertQueryOptions): AlertsResponse | null {
        this.cleanup();

        const key = this.generateKey(userId, filters, options);
        const entry = this.cache.get(key);

        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Sets cached alerts
     */
    set(
        userId: string,
        data: AlertsResponse,
        filters?: AlertFilters,
        options?: AlertQueryOptions,
        ttl: number = this.defaultTTL
    ): void {
        this.cleanup();
        this.enforceMaxSize();

        const key = this.generateKey(userId, filters, options);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Gets cached unread count
     */
    getUnreadCount(userId: string): number | null {
        this.cleanup();

        const key = this.generateUnreadCountKey(userId);
        const entry = this.cache.get(key);

        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Sets cached unread count
     */
    setUnreadCount(userId: string, count: number, ttl: number = this.defaultTTL): void {
        this.cleanup();
        this.enforceMaxSize();

        const key = this.generateUnreadCountKey(userId);
        this.cache.set(key, {
            data: count,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Gets cached alert statistics
     */
    getStats(userId: string): any | null {
        this.cleanup();

        const key = this.generateStatsKey(userId);
        const entry = this.cache.get(key);

        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Sets cached alert statistics
     */
    setStats(userId: string, stats: any, ttl: number = this.defaultTTL): void {
        this.cleanup();
        this.enforceMaxSize();

        const key = this.generateStatsKey(userId);
        this.cache.set(key, {
            data: stats,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Invalidates all cache entries for a user
     */
    invalidateUser(userId: string): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (key.includes(userId)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Invalidates cache entries that might be affected by an alert update
     */
    invalidateAlertUpdate(userId: string, alertId: string): void {
        // Invalidate all user-related cache entries since alert status changes
        // can affect counts, statistics, and filtered results
        this.invalidateUser(userId);
    }

    /**
     * Invalidates cache entries that might be affected by new alerts
     */
    invalidateNewAlert(userId: string): void {
        // Invalidate all user-related cache entries since new alerts
        // affect counts, statistics, and all query results
        this.invalidateUser(userId);
    }

    /**
     * Clears all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
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
            maxSize: this.maxCacheSize,
            hitRate: 0, // Would need to track hits/misses to calculate
            entries,
        };
    }
}

// Export singleton instance
export const alertCache = new AlertCache();

// Export factory function
export const getAlertCache = () => alertCache;