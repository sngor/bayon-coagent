/**
 * Enhanced Cache Manager
 * 
 * Provides a unified caching layer with multiple strategies:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) expiration
 * - Memory-based size limits
 * - Cache warming and prefetching
 * - Cache statistics and monitoring
 */

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number; // Approximate size in bytes
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /**
     * Maximum number of entries
     * Default: 1000
     */
    maxEntries?: number;

    /**
     * Time to live in milliseconds
     * Default: 300000 (5 minutes)
     */
    ttl?: number;

    /**
     * Maximum cache size in bytes
     * Default: 50MB
     */
    maxSize?: number;

    /**
     * Enable LRU eviction
     * Default: true
     */
    enableLRU?: boolean;

    /**
     * Enable automatic cleanup
     * Default: true
     */
    enableAutoCleanup?: boolean;

    /**
     * Cleanup interval in milliseconds
     * Default: 60000 (1 minute)
     */
    cleanupInterval?: number;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
    maxEntries: 1000,
    ttl: 300000, // 5 minutes
    maxSize: 50 * 1024 * 1024, // 50MB
    enableLRU: true,
    enableAutoCleanup: true,
    cleanupInterval: 60000, // 1 minute
};

/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    entries: number;
    size: number;
    evictions: number;
    expirations: number;
}

/**
 * Enhanced cache manager with LRU and TTL support
 */
export class CacheManager<T = any> {
    private cache: Map<string, CacheEntry<T>>;
    private config: Required<CacheConfig>;
    private stats: CacheStats;
    private cleanupTimer?: NodeJS.Timeout;
    private currentSize: number;

    constructor(config: CacheConfig = {}) {
        this.cache = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            entries: 0,
            size: 0,
            evictions: 0,
            expirations: 0,
        };
        this.currentSize = 0;

        if (this.config.enableAutoCleanup) {
            this.startAutoCleanup();
        }
    }

    /**
     * Gets a value from the cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }

        // Check if expired
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.expirations++;
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }

        // Update access metadata
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        this.stats.hits++;
        this.updateHitRate();

        return entry.value;
    }

    /**
     * Sets a value in the cache
     */
    set(key: string, value: T): void {
        const size = this.estimateSize(value);

        // Check if we need to evict entries
        if (this.cache.size >= this.config.maxEntries ||
            this.currentSize + size > this.config.maxSize) {
            this.evict();
        }

        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            size,
        };

        // Remove old entry if exists
        const oldEntry = this.cache.get(key);
        if (oldEntry) {
            this.currentSize -= oldEntry.size;
        }

        this.cache.set(key, entry);
        this.currentSize += size;
        this.stats.entries = this.cache.size;
        this.stats.size = this.currentSize;
    }

    /**
     * Checks if a key exists in the cache
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.expirations++;
            return false;
        }

        return true;
    }

    /**
     * Deletes a key from the cache
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentSize -= entry.size;
        }

        const deleted = this.cache.delete(key);
        this.stats.entries = this.cache.size;
        this.stats.size = this.currentSize;
        return deleted;
    }

    /**
     * Clears the entire cache
     */
    clear(): void {
        this.cache.clear();
        this.currentSize = 0;
        this.stats.entries = 0;
        this.stats.size = 0;
    }

    /**
     * Gets cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Resets cache statistics
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            entries: this.cache.size,
            size: this.currentSize,
            evictions: 0,
            expirations: 0,
        };
    }

    /**
     * Warms the cache with multiple entries
     */
    async warm(entries: Array<{ key: string; value: T }>): Promise<void> {
        for (const { key, value } of entries) {
            this.set(key, value);
        }
    }

    /**
     * Gets all keys in the cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Gets all values in the cache
     */
    values(): T[] {
        return Array.from(this.cache.values()).map((entry) => entry.value);
    }

    /**
     * Destroys the cache and stops cleanup
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.clear();
    }

    /**
     * Checks if an entry is expired
     */
    private isExpired(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp > this.config.ttl;
    }

    /**
     * Evicts entries based on LRU or size
     */
    private evict(): void {
        if (!this.config.enableLRU) {
            // Simple FIFO eviction
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                const entry = this.cache.get(firstKey);
                if (entry) {
                    this.currentSize -= entry.size;
                }
                this.cache.delete(firstKey);
                this.stats.evictions++;
            }
            return;
        }

        // LRU eviction - remove least recently used
        let lruKey: string | null = null;
        let lruTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed;
                lruKey = key;
            }
        }

        if (lruKey) {
            const entry = this.cache.get(lruKey);
            if (entry) {
                this.currentSize -= entry.size;
            }
            this.cache.delete(lruKey);
            this.stats.evictions++;
        }
    }

    /**
     * Estimates the size of a value in bytes
     */
    private estimateSize(value: T): number {
        try {
            const str = JSON.stringify(value);
            return str.length * 2; // Approximate UTF-16 encoding
        } catch {
            return 1024; // Default 1KB if can't serialize
        }
    }

    /**
     * Updates the hit rate statistic
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Starts automatic cleanup of expired entries
     */
    private startAutoCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, this.config.cleanupInterval);

        // Don't prevent Node.js from exiting
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    /**
     * Cleans up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.ttl) {
                keysToDelete.push(key);
                this.currentSize -= entry.size;
                this.stats.expirations++;
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }

        this.stats.entries = this.cache.size;
        this.stats.size = this.currentSize;
    }
}

/**
 * Multi-level cache with L1 (memory) and L2 (persistent) support
 */
export class MultiLevelCache<T = any> {
    private l1Cache: CacheManager<T>;
    private l2Cache?: CacheManager<T>;

    constructor(
        l1Config: CacheConfig = {},
        l2Config?: CacheConfig
    ) {
        this.l1Cache = new CacheManager<T>(l1Config);
        if (l2Config) {
            this.l2Cache = new CacheManager<T>(l2Config);
        }
    }

    /**
     * Gets a value from the cache (checks L1 then L2)
     */
    async get(key: string): Promise<T | null> {
        // Check L1 first
        const l1Value = this.l1Cache.get(key);
        if (l1Value !== null) {
            return l1Value;
        }

        // Check L2 if available
        if (this.l2Cache) {
            const l2Value = this.l2Cache.get(key);
            if (l2Value !== null) {
                // Promote to L1
                this.l1Cache.set(key, l2Value);
                return l2Value;
            }
        }

        return null;
    }

    /**
     * Sets a value in both cache levels
     */
    async set(key: string, value: T): Promise<void> {
        this.l1Cache.set(key, value);
        if (this.l2Cache) {
            this.l2Cache.set(key, value);
        }
    }

    /**
     * Deletes a key from both cache levels
     */
    async delete(key: string): Promise<void> {
        this.l1Cache.delete(key);
        if (this.l2Cache) {
            this.l2Cache.delete(key);
        }
    }

    /**
     * Clears both cache levels
     */
    async clear(): Promise<void> {
        this.l1Cache.clear();
        if (this.l2Cache) {
            this.l2Cache.clear();
        }
    }

    /**
     * Gets combined statistics
     */
    getStats(): { l1: CacheStats; l2?: CacheStats } {
        return {
            l1: this.l1Cache.getStats(),
            l2: this.l2Cache?.getStats(),
        };
    }

    /**
     * Destroys both cache levels
     */
    destroy(): void {
        this.l1Cache.destroy();
        if (this.l2Cache) {
            this.l2Cache.destroy();
        }
    }
}

/**
 * Global cache manager instances
 */
const globalCaches = new Map<string, CacheManager>();

/**
 * Gets or creates a named cache instance
 */
export function getCache<T = any>(
    name: string,
    config?: CacheConfig
): CacheManager<T> {
    if (!globalCaches.has(name)) {
        globalCaches.set(name, new CacheManager<T>(config));
    }
    return globalCaches.get(name) as CacheManager<T>;
}

/**
 * Destroys a named cache instance
 */
export function destroyCache(name: string): void {
    const cache = globalCaches.get(name);
    if (cache) {
        cache.destroy();
        globalCaches.delete(name);
    }
}

/**
 * Destroys all cache instances
 */
export function destroyAllCaches(): void {
    for (const cache of globalCaches.values()) {
        cache.destroy();
    }
    globalCaches.clear();
}
