/**
 * Cache manager for Strands agents
 * Implements caching patterns similar to the AWS service layer
 */

import { z } from 'zod';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export const CacheConfigSchema = z.object({
    maxSize: z.number().positive().default(100),
    defaultTtl: z.number().positive().default(300000), // 5 minutes
    cleanupInterval: z.number().positive().default(60000), // 1 minute
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

/**
 * In-memory cache for research results
 * Follows the singleton pattern used in AWS clients
 */
export class StrandsCacheManager<T = any> {
    private cache = new Map<string, CacheEntry<T>>();
    private cleanupTimer: NodeJS.Timeout | null = null;
    private readonly config: CacheConfig;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = CacheConfigSchema.parse(config);
        this.startCleanup();
    }

    /**
     * Generate cache key from input object
     */
    private generateKey(input: Record<string, any>): string {
        // Create deterministic key from input
        const sortedKeys = Object.keys(input).sort();
        const keyParts = sortedKeys.map(key => `${key}:${JSON.stringify(input[key])}`);
        return Buffer.from(keyParts.join('|')).toString('base64');
    }

    /**
     * Check if cache entry is valid
     */
    private isValid(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Get cached result if available and valid
     */
    public get(input: Record<string, any>): T | null {
        const key = this.generateKey(input);
        const entry = this.cache.get(key);

        if (!entry || !this.isValid(entry)) {
            if (entry) {
                this.cache.delete(key);
            }
            return null;
        }

        return entry.data;
    }

    /**
     * Store result in cache
     */
    public set(input: Record<string, any>, data: T, ttl?: number): void {
        const key = this.generateKey(input);

        // Enforce max size
        if (this.cache.size >= this.config.maxSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.config.defaultTtl,
        });
    }

    /**
     * Clear expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Start periodic cleanup
     */
    private startCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * Stop cleanup and clear cache
     */
    public destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    public getStats(): { size: number; maxSize: number; hitRate?: number } {
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
        };
    }
}

// Singleton instances for different agent types
const cacheInstances = new Map<string, StrandsCacheManager>();

export function getCacheManager<T>(agentType: string, config?: Partial<CacheConfig>): StrandsCacheManager<T> {
    if (!cacheInstances.has(agentType)) {
        cacheInstances.set(agentType, new StrandsCacheManager<T>(config));
    }
    return cacheInstances.get(agentType)!;
}