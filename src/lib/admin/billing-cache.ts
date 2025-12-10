/**
 * Billing Cache Service
 * 
 * Implements caching strategy for expensive billing operations
 */

import { BillingMetrics, BillingAnalytics, TimeRange } from '@/lib/types/billing-types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class BillingCacheService {
    private cache = new Map<string, CacheEntry<any>>();

    // Cache TTL in milliseconds
    private readonly TTL = {
        metrics: 5 * 60 * 1000,      // 5 minutes for dashboard metrics
        analytics: 15 * 60 * 1000,   // 15 minutes for analytics
        search: 2 * 60 * 1000,       // 2 minutes for search results
    };

    /**
     * Generate cache key for metrics
     */
    private getMetricsKey(): string {
        return 'billing:metrics';
    }

    /**
     * Generate cache key for analytics
     */
    private getAnalyticsKey(timeRange: TimeRange): string {
        return `billing:analytics:${timeRange}`;
    }

    /**
     * Generate cache key for search results
     */
    private getSearchKey(searchType: string, criteria: any): string {
        const criteriaHash = JSON.stringify(criteria);
        return `billing:search:${searchType}:${criteriaHash}`;
    }

    /**
     * Get cached data if valid
     */
    private get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cache entry
     */
    private set<T>(key: string, data: T, ttl: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
        };

        this.cache.set(key, entry);
    }

    /**
     * Cache billing metrics
     */
    cacheMetrics(metrics: BillingMetrics): void {
        this.set(this.getMetricsKey(), metrics, this.TTL.metrics);
    }

    /**
     * Get cached billing metrics
     */
    getCachedMetrics(): BillingMetrics | null {
        return this.get<BillingMetrics>(this.getMetricsKey());
    }

    /**
     * Cache billing analytics
     */
    cacheAnalytics(timeRange: TimeRange, analytics: BillingAnalytics): void {
        this.set(this.getAnalyticsKey(timeRange), analytics, this.TTL.analytics);
    }

    /**
     * Get cached billing analytics
     */
    getCachedAnalytics(timeRange: TimeRange): BillingAnalytics | null {
        return this.get<BillingAnalytics>(this.getAnalyticsKey(timeRange));
    }

    /**
     * Cache search results
     */
    cacheSearchResults(searchType: string, criteria: any, results: any): void {
        this.set(this.getSearchKey(searchType, criteria), results, this.TTL.search);
    }

    /**
     * Get cached search results
     */
    getCachedSearchResults(searchType: string, criteria: any): any | null {
        return this.get(this.getSearchKey(searchType, criteria));
    }

    /**
     * Invalidate all billing cache
     */
    invalidateAll(): void {
        const billingKeys = Array.from(this.cache.keys()).filter(key =>
            key.startsWith('billing:')
        );

        billingKeys.forEach(key => this.cache.delete(key));
    }

    /**
     * Invalidate specific cache type
     */
    invalidate(type: 'metrics' | 'analytics' | 'search'): void {
        const keys = Array.from(this.cache.keys()).filter(key =>
            key.startsWith(`billing:${type}`)
        );

        keys.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        totalEntries: number;
        billingEntries: number;
        hitRate: number;
        memoryUsage: number;
    } {
        const totalEntries = this.cache.size;
        const billingEntries = Array.from(this.cache.keys()).filter(key =>
            key.startsWith('billing:')
        ).length;

        // Simple memory estimation (not precise but useful for monitoring)
        const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;

        return {
            totalEntries,
            billingEntries,
            hitRate: 0, // Would need hit/miss tracking for accurate calculation
            memoryUsage,
        };
    }
}

export const billingCache = new BillingCacheService();