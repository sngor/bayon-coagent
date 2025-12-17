/**
 * Intelligent AI Response Caching Service
 * 
 * This service implements smart caching for AI responses to reduce Bedrock costs
 * and improve response times for similar content generation requests.
 */

import { createHash } from 'crypto';
import { z } from 'zod';

export interface CacheConfig {
    defaultTTL: number; // Time to live in seconds
    maxCacheSize: number; // Maximum number of cached items
    similarityThreshold: number; // 0-1, how similar prompts need to be to match
}

export interface CachedResponse<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    promptHash: string;
    metadata: {
        modelId: string;
        contentType: string;
        parameters: Record<string, any>;
    };
}

export interface PromptSimilarity {
    hash: string;
    similarity: number;
    cached: CachedResponse;
}

/**
 * Intelligent caching service for AI responses
 */
export class IntelligentAICache {
    private cache = new Map<string, CachedResponse>();
    private promptIndex = new Map<string, string[]>(); // Content type -> prompt hashes

    constructor(private config: CacheConfig) { }

    /**
     * Generate a cache key from prompt and parameters
     */
    generateKey(
        modelId: string,
        prompt: string | { systemPrompt: string; userPrompt: string },
        parameters: Record<string, any> = {}
    ): string {
        const promptStr = typeof prompt === 'string'
            ? prompt
            : `${prompt.systemPrompt}|||${prompt.userPrompt}`;

        const keyData = {
            modelId,
            prompt: promptStr,
            parameters: this.normalizeParameters(parameters)
        };

        return createHash('sha256')
            .update(JSON.stringify(keyData))
            .digest('hex');
    }

    /**
     * Get cached response if available and not expired
     */
    async get<T>(key: string): Promise<T | null> {
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if expired
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            this.removeFromIndex(cached.metadata.contentType, key);
            return null;
        }

        return cached.data as T;
    }

    /**
     * Find similar cached responses for content reuse
     */
    async findSimilar<T>(
        prompt: string,
        contentType: string,
        threshold: number = this.config.similarityThreshold
    ): Promise<PromptSimilarity[]> {
        const hashes = this.promptIndex.get(contentType) || [];
        const similarities: PromptSimilarity[] = [];

        for (const hash of hashes) {
            const cached = this.cache.get(hash);
            if (!cached) continue;

            // Extract original prompt from cached data
            const similarity = this.calculateSimilarity(prompt, this.extractPrompt(cached));

            if (similarity >= threshold) {
                similarities.push({
                    hash,
                    similarity,
                    cached
                });
            }
        }

        // Sort by similarity (highest first)
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Cache a response with intelligent categorization
     */
    async set<T>(
        key: string,
        data: T,
        options: {
            modelId: string;
            contentType: string;
            parameters?: Record<string, any>;
            ttl?: number;
        }
    ): Promise<void> {
        // Enforce cache size limit
        if (this.cache.size >= this.config.maxCacheSize) {
            this.evictOldest();
        }

        const cached: CachedResponse<T> = {
            data,
            timestamp: Date.now(),
            ttl: options.ttl || this.config.defaultTTL,
            promptHash: key,
            metadata: {
                modelId: options.modelId,
                contentType: options.contentType,
                parameters: options.parameters || {}
            }
        };

        this.cache.set(key, cached);
        this.addToIndex(options.contentType, key);
    }

    /**
     * Get cache statistics for monitoring
     */
    getStats() {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        for (const [, cached] of this.cache) {
            if (now - cached.timestamp > cached.ttl * 1000) {
                expired++;
            } else {
                valid++;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries: valid,
            expiredEntries: expired,
            hitRate: this.calculateHitRate(),
            cacheTypes: Object.fromEntries(this.promptIndex.entries())
        };
    }

    /**
     * Clear expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, cached] of this.cache) {
            if (now - cached.timestamp > cached.ttl * 1000) {
                this.cache.delete(key);
                this.removeFromIndex(cached.metadata.contentType, key);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.promptIndex.clear();
    }

    private normalizeParameters(params: Record<string, any>): Record<string, any> {
        // Sort keys and round numbers for consistent hashing
        const normalized: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'number') {
                normalized[key] = Math.round(value * 100) / 100; // Round to 2 decimals
            } else {
                normalized[key] = value;
            }
        }

        return Object.keys(normalized)
            .sort()
            .reduce((obj, key) => {
                obj[key] = normalized[key];
                return obj;
            }, {} as Record<string, any>);
    }

    private addToIndex(contentType: string, hash: string): void {
        if (!this.promptIndex.has(contentType)) {
            this.promptIndex.set(contentType, []);
        }
        this.promptIndex.get(contentType)!.push(hash);
    }

    private removeFromIndex(contentType: string, hash: string): void {
        const hashes = this.promptIndex.get(contentType);
        if (hashes) {
            const index = hashes.indexOf(hash);
            if (index > -1) {
                hashes.splice(index, 1);
            }
        }
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, cached] of this.cache) {
            if (cached.timestamp < oldestTime) {
                oldestTime = cached.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const cached = this.cache.get(oldestKey)!;
            this.cache.delete(oldestKey);
            this.removeFromIndex(cached.metadata.contentType, oldestKey);
        }
    }

    private calculateSimilarity(prompt1: string, prompt2: string): number {
        // Simple similarity calculation using Jaccard similarity
        const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
        const words2 = new Set(prompt2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    private extractPrompt(cached: CachedResponse): string {
        // This would need to be implemented based on how you store prompts
        // For now, return empty string
        return '';
    }

    private calculateHitRate(): number {
        // This would need to track hits/misses over time
        // For now, return 0
        return 0;
    }
}

/**
 * Content-specific cache configurations
 */
export const CACHE_CONFIGS = {
    blogPost: {
        defaultTTL: 3600, // 1 hour
        maxCacheSize: 1000,
        similarityThreshold: 0.7
    },
    socialMedia: {
        defaultTTL: 1800, // 30 minutes
        maxCacheSize: 2000,
        similarityThreshold: 0.8
    },
    listingDescription: {
        defaultTTL: 7200, // 2 hours
        maxCacheSize: 500,
        similarityThreshold: 0.6
    },
    marketUpdate: {
        defaultTTL: 900, // 15 minutes (market data changes frequently)
        maxCacheSize: 200,
        similarityThreshold: 0.9
    },
    research: {
        defaultTTL: 14400, // 4 hours
        maxCacheSize: 300,
        similarityThreshold: 0.7
    }
} as const;

/**
 * Create cache instances for different content types
 */
export const aiCaches = {
    blogPost: new IntelligentAICache(CACHE_CONFIGS.blogPost),
    socialMedia: new IntelligentAICache(CACHE_CONFIGS.socialMedia),
    listingDescription: new IntelligentAICache(CACHE_CONFIGS.listingDescription),
    marketUpdate: new IntelligentAICache(CACHE_CONFIGS.marketUpdate),
    research: new IntelligentAICache(CACHE_CONFIGS.research)
};

/**
 * Get the appropriate cache for a content type
 */
export function getCacheForContentType(contentType: string): IntelligentAICache {
    return aiCaches[contentType as keyof typeof aiCaches] || aiCaches.blogPost;
}

/**
 * Cache cleanup scheduler (call this periodically)
 */
export function cleanupAllCaches(): { [key: string]: number } {
    const results: { [key: string]: number } = {};

    for (const [type, cache] of Object.entries(aiCaches)) {
        results[type] = cache.cleanup();
    }

    return results;
}