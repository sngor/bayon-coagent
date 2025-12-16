/**
 * Advanced Caching & Optimization System for Strands AI
 * 
 * Provides intelligent caching, request deduplication, and performance optimization
 * for all Strands AI agents to improve response times and reduce costs
 */

import { z } from 'zod';

// Cache entry schema
export const CacheEntrySchema = z.object({
    key: z.string(),
    value: z.any(),
    timestamp: z.number(),
    ttl: z.number(), // Time to live in milliseconds
    metadata: z.object({
        serviceType: z.string(),
        userId: z.string().optional(),
        inputHash: z.string(),
        qualityScore: z.number().optional(),
        tokenUsage: z.number().optional(),
    }),
});

// Cache configuration
export const CacheConfigSchema = z.object({
    serviceType: z.string(),
    defaultTTL: z.number().default(300000), // 5 minutes default
    maxEntries: z.number().default(1000),
    enableDeduplication: z.boolean().default(true),
    enableCompression: z.boolean().default(true),
    qualityThreshold: z.number().default(80), // Only cache high-quality results
});

export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;

/**
 * Intelligent Cache Manager
 */
class IntelligentCacheManager {
    private cache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, Promise<any>> = new Map();
    private configs: Map<string, CacheConfig> = new Map();

    constructor() {
        this.initializeConfigs();
        this.startCleanupInterval();
    }

    /**
     * Initialize cache configurations for each service
     */
    private initializeConfigs(): void {
        const serviceConfigs: Record<string, Partial<CacheConfig>> = {
            'research-agent': {
                defaultTTL: 1800000, // 30 minutes - research data changes slowly
                maxEntries: 500,
                qualityThreshold: 85,
            },
            'content-studio': {
                defaultTTL: 900000, // 15 minutes - content can be reused
                maxEntries: 1000,
                qualityThreshold: 80,
            },
            'listing-description': {
                defaultTTL: 3600000, // 1 hour - property descriptions stable
                maxEntries: 2000,
                qualityThreshold: 85,
            },
            'market-intelligence': {
                defaultTTL: 600000, // 10 minutes - market data changes frequently
                maxEntries: 300,
                qualityThreshold: 80,
            },
            'brand-strategy': {
                defaultTTL: 7200000, // 2 hours - strategies are comprehensive
                maxEntries: 200,
                qualityThreshold: 85,
            },
            'image-analysis': {
                defaultTTL: 1800000, // 30 minutes - image analysis is expensive
                maxEntries: 800,
                qualityThreshold: 80,
            },
            'agent-orchestration': {
                defaultTTL: 300000, // 5 minutes - workflows are dynamic
                maxEntries: 100,
                qualityThreshold: 85,
            },
        };

        Object.entries(serviceConfigs).forEach(([serviceType, config]) => {
            this.configs.set(serviceType, {
                serviceType,
                defaultTTL: 300000,
                maxEntries: 1000,
                enableDeduplication: true,
                enableCompression: true,
                qualityThreshold: 80,
                ...config,
            });
        });
    }

    /**
     * Generate cache key from input parameters
     */
    private generateCacheKey(serviceType: string, inputs: any, userId?: string): string {
        // Create a stable hash of the inputs
        const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
        const inputHash = this.simpleHash(inputString);

        // Include user ID for personalized results, exclude for general content
        const userSpecificServices = ['brand-strategy', 'listing-description'];
        const keyParts = [serviceType, inputHash];

        if (userId && userSpecificServices.includes(serviceType)) {
            keyParts.push(userId);
        }

        return keyParts.join(':');
    }

    /**
     * Simple hash function for cache keys
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get cached result if available and valid
     */
    async get(serviceType: string, inputs: any, userId?: string): Promise<any | null> {
        const key = this.generateCacheKey(serviceType, inputs, userId);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Check quality threshold
        const config = this.configs.get(serviceType);
        if (config && entry.metadata.qualityScore && entry.metadata.qualityScore < config.qualityThreshold) {
            return null;
        }

        console.log(`🎯 Cache hit for ${serviceType}: ${key}`);
        return entry.value;
    }

    /**
     * Store result in cache
     */
    async set(
        serviceType: string,
        inputs: any,
        result: any,
        userId?: string,
        qualityScore?: number,
        tokenUsage?: number
    ): Promise<void> {
        const config = this.configs.get(serviceType);
        if (!config) {
            return;
        }

        // Don't cache low-quality results
        if (qualityScore && qualityScore < config.qualityThreshold) {
            return;
        }

        const key = this.generateCacheKey(serviceType, inputs, userId);
        const now = Date.now();

        const entry: CacheEntry = {
            key,
            value: result,
            timestamp: now,
            ttl: config.defaultTTL,
            metadata: {
                serviceType,
                userId,
                inputHash: this.simpleHash(JSON.stringify(inputs)),
                qualityScore,
                tokenUsage,
            },
        };

        this.cache.set(key, entry);

        // Enforce max entries limit
        if (this.cache.size > config.maxEntries) {
            this.evictOldestEntries(serviceType, Math.floor(config.maxEntries * 0.1));
        }

        console.log(`💾 Cached result for ${serviceType}: ${key} (TTL: ${config.defaultTTL}ms)`);
    }

    /**
     * Execute with request deduplication
     */
    async executeWithDeduplication<T>(
        serviceType: string,
        inputs: any,
        executor: () => Promise<T>,
        userId?: string
    ): Promise<T> {
        const config = this.configs.get(serviceType);
        if (!config || !config.enableDeduplication) {
            return executor();
        }

        const key = this.generateCacheKey(serviceType, inputs, userId);

        // Check if there's already a pending request for this key
        const pendingRequest = this.pendingRequests.get(key);
        if (pendingRequest) {
            console.log(`⏳ Deduplicating request for ${serviceType}: ${key}`);
            return pendingRequest as Promise<T>;
        }

        // Execute the request and store the promise
        const requestPromise = executor();
        this.pendingRequests.set(key, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up the pending request
            this.pendingRequests.delete(key);
        }
    }

    /**
     * Evict oldest entries for a service type
     */
    private evictOldestEntries(serviceType: string, count: number): void {
        const serviceEntries = Array.from(this.cache.entries())
            .filter(([_, entry]) => entry.metadata.serviceType === serviceType)
            .sort(([_, a], [__, b]) => a.timestamp - b.timestamp);

        for (let i = 0; i < Math.min(count, serviceEntries.length); i++) {
            const [key] = serviceEntries[i];
            this.cache.delete(key);
        }
    }

    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanupInterval(): void {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 60000); // Clean up every minute
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.timestamp + entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): any {
        const stats: any = {
            totalEntries: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            services: {},
        };

        // Calculate stats per service
        for (const [key, entry] of this.cache.entries()) {
            const serviceType = entry.metadata.serviceType;
            if (!stats.services[serviceType]) {
                stats.services[serviceType] = {
                    entries: 0,
                    avgAge: 0,
                    avgQuality: 0,
                    totalTokens: 0,
                };
            }

            stats.services[serviceType].entries++;
            stats.services[serviceType].avgAge += Date.now() - entry.timestamp;
            if (entry.metadata.qualityScore) {
                stats.services[serviceType].avgQuality += entry.metadata.qualityScore;
            }
            if (entry.metadata.tokenUsage) {
                stats.services[serviceType].totalTokens += entry.metadata.tokenUsage;
            }
        }

        // Calculate averages
        Object.keys(stats.services).forEach(serviceType => {
            const service = stats.services[serviceType];
            service.avgAge = Math.round(service.avgAge / service.entries / 1000); // Convert to seconds
            service.avgQuality = Math.round((service.avgQuality / service.entries) * 10) / 10;
        });

        return stats;
    }

    /**
     * Clear cache for specific service or all
     */
    clearCache(serviceType?: string): void {
        if (serviceType) {
            for (const [key, entry] of this.cache.entries()) {
                if (entry.metadata.serviceType === serviceType) {
                    this.cache.delete(key);
                }
            }
            console.log(`🗑️ Cleared cache for ${serviceType}`);
        } else {
            this.cache.clear();
            console.log('🗑️ Cleared all cache entries');
        }
    }
}

/**
 * Performance Optimizer
 */
class PerformanceOptimizer {
    private cacheManager: IntelligentCacheManager;

    constructor(cacheManager: IntelligentCacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Optimize service execution with caching and deduplication
     */
    async optimizeExecution<T>(
        serviceType: string,
        inputs: any,
        executor: () => Promise<T>,
        options?: {
            userId?: string;
            qualityScorer?: (result: T) => number;
            tokenCounter?: (result: T) => number;
            bypassCache?: boolean;
        }
    ): Promise<T> {
        const { userId, qualityScorer, tokenCounter, bypassCache = false } = options || {};

        // Check cache first (unless bypassed)
        if (!bypassCache) {
            const cachedResult = await this.cacheManager.get(serviceType, inputs, userId);
            if (cachedResult) {
                return cachedResult;
            }
        }

        // Execute with deduplication
        const result = await this.cacheManager.executeWithDeduplication(
            serviceType,
            inputs,
            executor,
            userId
        );

        // Calculate quality and token usage if scorers provided
        const qualityScore = qualityScorer ? qualityScorer(result) : undefined;
        const tokenUsage = tokenCounter ? tokenCounter(result) : undefined;

        // Cache the result
        await this.cacheManager.set(serviceType, inputs, result, userId, qualityScore, tokenUsage);

        return result;
    }

    /**
     * Batch optimize multiple requests
     */
    async batchOptimize<T>(
        requests: Array<{
            serviceType: string;
            inputs: any;
            executor: () => Promise<T>;
            userId?: string;
        }>
    ): Promise<T[]> {
        // Group requests by service type for better optimization
        const groupedRequests = new Map<string, typeof requests>();

        requests.forEach(request => {
            const key = `${request.serviceType}:${request.userId || 'anonymous'}`;
            if (!groupedRequests.has(key)) {
                groupedRequests.set(key, []);
            }
            groupedRequests.get(key)!.push(request);
        });

        // Execute groups in parallel
        const results: T[] = [];
        const promises: Promise<void>[] = [];

        for (const [_, groupRequests] of groupedRequests) {
            const promise = Promise.all(
                groupRequests.map(request =>
                    this.optimizeExecution(
                        request.serviceType,
                        request.inputs,
                        request.executor,
                        { userId: request.userId }
                    )
                )
            ).then(groupResults => {
                results.push(...groupResults);
            });

            promises.push(promise);
        }

        await Promise.all(promises);
        return results;
    }

    /**
     * Get optimization statistics
     */
    getOptimizationStats(): any {
        const cacheStats = this.cacheManager.getCacheStats();

        return {
            cache: cacheStats,
            optimization: {
                cacheHitRate: this.calculateCacheHitRate(),
                avgResponseTimeImprovement: this.estimateResponseTimeImprovement(),
                tokenSavings: this.estimateTokenSavings(),
            },
        };
    }

    /**
     * Calculate cache hit rate (simplified estimation)
     */
    private calculateCacheHitRate(): number {
        // In production, this would track actual hit/miss ratios
        return 0.35; // 35% estimated hit rate
    }

    /**
     * Estimate response time improvement from caching
     */
    private estimateResponseTimeImprovement(): number {
        // Cache hits are typically 95% faster than full execution
        const hitRate = this.calculateCacheHitRate();
        return hitRate * 0.95; // 95% improvement on cache hits
    }

    /**
     * Estimate token usage savings
     */
    private estimateTokenSavings(): number {
        // Cache hits save 100% of token usage
        const hitRate = this.calculateCacheHitRate();
        return hitRate * 1.0; // 100% token savings on cache hits
    }
}

// Export singleton instances
export const cacheManager = new IntelligentCacheManager();
export const performanceOptimizer = new PerformanceOptimizer(cacheManager);

/**
 * Decorator function for easy service optimization
 */
export function withOptimization(serviceType: string) {
    return function <T extends (...args: any[]) => Promise<any>>(
        target: any,
        propertyName: string,
        descriptor: TypedPropertyDescriptor<T>
    ) {
        const method = descriptor.value!;

        descriptor.value = async function (this: any, ...args: any[]) {
            const [inputs, userId] = args;

            return performanceOptimizer.optimizeExecution(
                serviceType,
                inputs,
                () => method.apply(this, args),
                { userId }
            );
        } as T;

        return descriptor;
    };
}

/**
 * Utility functions for common optimization patterns
 */
export const OptimizationUtils = {
    /**
     * Create a quality scorer for text-based results
     */
    createTextQualityScorer: (minLength: number = 100) => (result: any): number => {
        if (!result || typeof result !== 'object') return 0;

        let score = 70; // Base score

        // Check for content length
        const content = result.content || result.report || result.strategy || result.analysis || '';
        if (content.length > minLength) score += 10;
        if (content.length > minLength * 2) score += 5;

        // Check for structured data
        if (result.keyFindings || result.recommendations) score += 5;
        if (result.citations || result.sources) score += 5;
        if (result.seoKeywords || result.hashtags) score += 5;

        return Math.min(score, 100);
    },

    /**
     * Create a token counter for text-based results
     */
    createTextTokenCounter: () => (result: any): number => {
        if (!result || typeof result !== 'object') return 0;

        const content = JSON.stringify(result);
        return Math.round(content.length / 4); // Rough token estimation
    },

    /**
     * Create cache key for common patterns
     */
    createCacheKey: (serviceType: string, ...keyParts: string[]): string => {
        return [serviceType, ...keyParts].join(':');
    },
};