/**
 * AI Visibility Cache Service
 * 
 * Provides caching layer for AI visibility data with 24-hour TTL
 * Reduces API calls and improves response times
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { AIMention, AIVisibilityScore, AIMonitoringConfig } from './types/common/common';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

/**
 * Cache key types
 */
type CacheKeyType =
    | 'visibility-score'
    | 'mentions'
    | 'mentions-filtered'
    | 'config'
    | 'competitor-visibility';

/**
 * AI Visibility Cache Service
 * Implements in-memory caching with TTL for AI visibility data
 */
export class AIVisibilityCacheService {
    private readonly cache: Map<string, CacheEntry<any>>;
    private readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    private readonly repository: ReturnType<typeof getRepository>;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(repository?: ReturnType<typeof getRepository>) {
        this.cache = new Map();
        this.repository = repository || getRepository();

        // Clean up expired entries every hour
        this.cleanupInterval = setInterval(() => this.cleanupExpiredEntries(), 60 * 60 * 1000);
    }

    /**
     * Destroy the cache service and clean up resources
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }

    /**
     * Generate cache key
     * @param type Cache key type
     * @param userId User ID
     * @param params Additional parameters
     * @returns Cache key string
     */
    private generateKey(
        type: CacheKeyType,
        userId: string,
        params?: Record<string, any>
    ): string {
        const baseKey = `${type}:${userId}`;

        if (!params) {
            return baseKey;
        }

        // Sort params for consistent key generation
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        return `${baseKey}:${sortedParams}`;
    }

    /**
     * Get cached data
     * @param key Cache key
     * @returns Cached data or null if not found/expired
     */
    private get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs TTL in milliseconds (default: 24 hours)
     */
    private set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs,
        };

        this.cache.set(key, entry);
    }

    /**
     * Invalidate cache for a user
     * @param userId User ID
     * @param type Optional specific cache type to invalidate
     */
    invalidate(userId: string, type?: CacheKeyType): void {
        if (type) {
            // Invalidate specific type
            const prefix = `${type}:${userId}`;
            for (const key of this.cache.keys()) {
                if (key.startsWith(prefix)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Invalidate all cache for user
            for (const key of this.cache.keys()) {
                if (key.includes(userId)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[AIVisibilityCacheService] Cleaned up ${cleanedCount} expired cache entries`);
        }
    }

    /**
     * Get visibility score with caching
     * @param userId User ID
     * @param forceRefresh Force refresh from database
     * @returns Visibility score or null
     */
    async getVisibilityScore(
        userId: string,
        forceRefresh: boolean = false
    ): Promise<AIVisibilityScore | null> {
        const cacheKey = this.generateKey('visibility-score', userId);

        // Check cache first
        if (!forceRefresh) {
            const cached = this.get<AIVisibilityScore>(cacheKey);
            if (cached) {
                console.log(`[AIVisibilityCacheService] Cache hit for visibility score: ${userId}`);
                return cached;
            }
        }

        // Fetch from database
        console.log(`[AIVisibilityCacheService] Cache miss for visibility score: ${userId}`);
        const scoreResult = await this.repository.query(
            `USER#${userId}`,
            'AI_VISIBILITY_SCORE#',
            {
                limit: 1,
                scanIndexForward: false,
            }
        );

        const score = (scoreResult.items[0] as any)?.Data as AIVisibilityScore | undefined;

        if (score) {
            this.set(cacheKey, score);
        }

        return score || null;
    }

    /**
     * Get mentions with caching
     * @param userId User ID
     * @param options Query options
     * @param forceRefresh Force refresh from database
     * @returns Array of mentions
     */
    async getMentions(
        userId: string,
        options?: {
            limit?: number;
            platform?: string;
            startDate?: string;
            endDate?: string;
        },
        forceRefresh: boolean = false
    ): Promise<AIMention[]> {
        const cacheKey = this.generateKey(
            options ? 'mentions-filtered' : 'mentions',
            userId,
            options
        );

        // Check cache first
        if (!forceRefresh) {
            const cached = this.get<AIMention[]>(cacheKey);
            if (cached) {
                console.log(`[AIVisibilityCacheService] Cache hit for mentions: ${userId}`);
                return cached;
            }
        }

        // Fetch from database
        console.log(`[AIVisibilityCacheService] Cache miss for mentions: ${userId}`);
        const limit = options?.limit || 20;

        let mentions: AIMention[] = [];

        if (options?.platform) {
            const result = await this.repository.query(
                `USER#${userId}`,
                `AI_MENTION#${options.platform}#`,
                {
                    limit,
                    scanIndexForward: false,
                }
            );
            mentions = result.items.map((item: any) => item.Data as AIMention);
        } else {
            const result = await this.repository.query(
                `USER#${userId}`,
                'AI_MENTION#',
                {
                    limit,
                    scanIndexForward: false,
                }
            );
            mentions = result.items.map((item: any) => item.Data as AIMention);
        }

        // Filter by date range if provided
        if (options?.startDate || options?.endDate) {
            mentions = mentions.filter(mention => {
                const mentionDate = new Date(mention.timestamp);
                if (options.startDate && mentionDate < new Date(options.startDate)) {
                    return false;
                }
                if (options.endDate && mentionDate > new Date(options.endDate)) {
                    return false;
                }
                return true;
            });
        }

        // Cache the results
        this.set(cacheKey, mentions);

        return mentions;
    }

    /**
     * Get monitoring config with caching
     * @param userId User ID
     * @param forceRefresh Force refresh from database
     * @returns Monitoring config or null
     */
    async getMonitoringConfig(
        userId: string,
        forceRefresh: boolean = false
    ): Promise<AIMonitoringConfig | null> {
        const cacheKey = this.generateKey('config', userId);

        // Check cache first
        if (!forceRefresh) {
            const cached = this.get<AIMonitoringConfig>(cacheKey);
            if (cached) {
                console.log(`[AIVisibilityCacheService] Cache hit for config: ${userId}`);
                return cached;
            }
        }

        // Fetch from database
        console.log(`[AIVisibilityCacheService] Cache miss for config: ${userId}`);
        const config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

        if (config) {
            this.set(cacheKey, config);
        }

        return config;
    }

    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats(): {
        size: number;
        entries: Array<{ key: string; age: number; ttl: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            ttl: entry.expiresAt - now,
        }));

        return {
            size: this.cache.size,
            entries,
        };
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        console.log('[AIVisibilityCacheService] Cache cleared');
    }
}

/**
 * Singleton instance
 */
let cacheInstance: AIVisibilityCacheService | null = null;

/**
 * Get or create cache service instance
 * @returns AIVisibilityCacheService instance
 */
export function getAIVisibilityCacheService(): AIVisibilityCacheService {
    if (!cacheInstance) {
        cacheInstance = new AIVisibilityCacheService();
    }
    return cacheInstance;
}

/**
 * Invalidate cache for a user
 * Convenience function for invalidating cache
 * @param userId User ID
 * @param type Optional specific cache type to invalidate
 */
export function invalidateAIVisibilityCache(
    userId: string,
    type?: 'visibility-score' | 'mentions' | 'mentions-filtered' | 'config' | 'competitor-visibility'
): void {
    const cache = getAIVisibilityCacheService();
    cache.invalidate(userId, type);
}
