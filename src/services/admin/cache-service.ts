/**
 * Cache Service for Admin Platform
 * 
 * Provides in-memory caching with TTL support for frequently accessed data:
 * - Platform metrics (5 minute TTL)
 * - System health metrics (1 minute TTL)
 * - Feature flags (in-memory, invalidated on updates)
 * 
 * Includes cache hit/miss metrics for monitoring performance.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

interface CacheMetrics {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
}

export class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private metrics: CacheMetrics;
    private readonly maxSize: number;

    constructor(maxSize: number = 1000) {
        this.cache = new Map();
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0,
        };
        this.maxSize = maxSize;
    }

    /**
     * Gets a value from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.metrics.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.metrics.misses++;
            this.metrics.evictions++;
            this.metrics.size = this.cache.size;
            return null;
        }

        this.metrics.hits++;
        return entry.data as T;
    }

    /**
     * Sets a value in cache with TTL in seconds
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.metrics.evictions++;
            }
        }

        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiresAt });
        this.metrics.size = this.cache.size;
    }

    /**
     * Invalidates a specific cache key
     */
    invalidate(key: string): void {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.metrics.evictions++;
            this.metrics.size = this.cache.size;
        }
    }

    /**
     * Invalidates all cache keys matching a pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => {
            this.cache.delete(key);
            this.metrics.evictions++;
        });

        this.metrics.size = this.cache.size;
    }

    /**
     * Clears all cache entries
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.metrics.evictions += size;
        this.metrics.size = 0;
    }

    /**
     * Gets cache metrics
     */
    getMetrics(): CacheMetrics {
        return { ...this.metrics };
    }

    /**
     * Gets cache hit rate
     */
    getHitRate(): number {
        const total = this.metrics.hits + this.metrics.misses;
        return total === 0 ? 0 : this.metrics.hits / total;
    }

    /**
     * Resets cache metrics
     */
    resetMetrics(): void {
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: this.cache.size,
        };
    }

    /**
     * Gets or sets a value with a factory function
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await factory();
        this.set(key, data, ttlSeconds);
        return data;
    }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Gets the singleton cache instance
 */
export function getCacheService(): CacheService {
    if (!cacheInstance) {
        cacheInstance = new CacheService();
    }
    return cacheInstance;
}

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
    // Platform metrics: 5 minute TTL
    platformMetrics: (startDate: string, endDate: string) =>
        `metrics:platform:${startDate}:${endDate}`,

    // System health: 1 minute TTL
    systemHealth: () => `health:system`,

    // Feature flags: no expiry, invalidated on updates
    featureFlags: () => `config:feature-flags`,
    featureFlag: (flagId: string) => `config:feature-flag:${flagId}`,

    // User activity: 5 minute TTL
    userActivity: (options: string) => `activity:users:${options}`,
    userTimeline: (userId: string, startDate?: string, endDate?: string) =>
        `activity:timeline:${userId}:${startDate || "all"}:${endDate || "all"}`,

    // Content moderation: 2 minute TTL
    contentModeration: (options: string) => `moderation:content:${options}`,

    // Support tickets: 2 minute TTL
    supportTickets: (options: string) => `support:tickets:${options}`,

    // Billing: 5 minute TTL
    billingMetrics: () => `billing:metrics`,
    userBilling: (userId: string) => `billing:user:${userId}`,

    // Engagement reports: 10 minute TTL
    engagementReport: (startDate: string, endDate: string) =>
        `reports:engagement:${startDate}:${endDate}`,

    // API usage: 5 minute TTL
    apiUsage: () => `api:usage`,

    // Audit logs: 2 minute TTL
    auditLogs: (options: string) => `audit:logs:${options}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
    PLATFORM_METRICS: 300, // 5 minutes
    SYSTEM_HEALTH: 60, // 1 minute
    FEATURE_FLAGS: 0, // No expiry, invalidated on updates
    USER_ACTIVITY: 300, // 5 minutes
    CONTENT_MODERATION: 120, // 2 minutes
    SUPPORT_TICKETS: 120, // 2 minutes
    BILLING: 300, // 5 minutes
    ENGAGEMENT_REPORTS: 600, // 10 minutes
    API_USAGE: 300, // 5 minutes
    AUDIT_LOGS: 120, // 2 minutes
};
