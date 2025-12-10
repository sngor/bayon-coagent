/**
 * Research Cache Service
 * Implements intelligent caching for research results with TTL and LRU eviction
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

export class ResearchCacheService<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private stats = { hits: 0, misses: 0 };
    private readonly maxSize: number;
    private readonly defaultTtl: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(
        private readonly name: string,
        options: {
            maxSize?: number;
            defaultTtl?: number;
            cleanupInterval?: number;
        } = {}
    ) {
        this.maxSize = options.maxSize || 100;
        this.defaultTtl = options.defaultTtl || 600000; // 10 minutes

        // Start cleanup interval
        if (options.cleanupInterval !== 0) {
            this.cleanupInterval = setInterval(
                () => this.cleanup(),
                options.cleanupInterval || 60000 // 1 minute
            );
        }
    }

    /**
     * Generate cache key from research parameters with better hashing
     */
    private generateKey(params: {
        topic: string;
        searchDepth?: string;
        includeMarketAnalysis?: boolean;
    }): string {
        const normalized = {
            topic: params.topic.toLowerCase().trim().replace(/\s+/g, ' '), // Normalize whitespace
            searchDepth: params.searchDepth || 'advanced',
            includeMarketAnalysis: params.includeMarketAnalysis ?? true,
        };

        // Create a more stable hash for similar topics
        const keyString = `${normalized.topic}:${normalized.searchDepth}:${normalized.includeMarketAnalysis}`;

        // Simple hash for better key distribution
        let hash = 0;
        for (let i = 0; i < keyString.length; i++) {
            const char = keyString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `research:${Math.abs(hash)}:${keyString.substring(0, 50)}`;
    }

    /**
     * Get cached result
     */
    get(params: Parameters<typeof this.generateKey>[0]): T | null {
        const key = this.generateKey(params);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Update access stats
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;

        console.log(`Cache hit for ${this.name}:`, key);
        return entry.data;
    }

    /**
     * Set cache entry
     */
    set(params: Parameters<typeof this.generateKey>[0], data: T, ttl?: number): void {
        const key = this.generateKey(params);

        // Evict if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTtl,
            accessCount: 1,
            lastAccessed: Date.now(),
        });

        console.log(`Cached ${this.name} result:`, key);
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`Evicted LRU entry from ${this.name}:`, oldestKey);
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired entries from ${this.name} cache`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }

    /**
     * Clear cache
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
        console.log(`Cleared ${this.name} cache`);
    }

    /**
     * Destroy cache and cleanup
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Global cache instances
const caches = new Map<string, ResearchCacheService<any>>();

/**
 * Get or create cache instance
 */
export function getResearchCache<T>(
    name: string,
    options?: ConstructorParameters<typeof ResearchCacheService>[1]
): ResearchCacheService<T> {
    if (!caches.has(name)) {
        caches.set(name, new ResearchCacheService<T>(name, options));
    }
    return caches.get(name)!;
}

/**
 * Get cache statistics for all caches
 */
export function getAllCacheStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of caches.entries()) {
        stats[name] = cache.getStats();
    }
    return stats;
}