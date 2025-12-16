/**
 * Cache Service
 * 
 * Implements distributed caching with TTL management and cache invalidation
 * to improve system performance and reduce database load.
 * 
 * **Validates: Requirements 11.1**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'cache-service',
    version: '1.0.0',
    description: 'Distributed caching service with TTL management',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const CacheSetSchema = z.object({
    key: z.string().min(1, 'Cache key is required'),
    value: z.any(),
    ttl: z.number().int().min(1).max(604800).optional(), // Max 7 days
    namespace: z.string().optional().default('default'),
    tags: z.array(z.string()).optional().default([]),
});

const CacheGetSchema = z.object({
    key: z.string().min(1, 'Cache key is required'),
    namespace: z.string().optional().default('default'),
});

const CacheDeleteSchema = z.object({
    key: z.string().min(1, 'Cache key is required'),
    namespace: z.string().optional().default('default'),
});

const CacheInvalidateSchema = z.object({
    pattern: z.string().min(1, 'Pattern is required'),
    namespace: z.string().optional().default('default'),
    tags: z.array(z.string()).optional(),
});

// Response types
interface CacheEntry {
    key: string;
    value: any;
    ttl: number;
    createdAt: string;
    expiresAt: string;
    accessCount: number;
    lastAccessed: string;
    namespace: string;
    tags: string[];
    size: number;
}

interface CacheStats {
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    memoryUsage: number;
    nodeDistribution: Record<string, number>;
    namespaceStats: Record<string, {
        keyCount: number;
        size: number;
        hitRate: number;
    }>;
}

interface CacheConfig {
    defaultTtl: number;
    maxSize: number;
    maxMemory: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
    compressionEnabled: boolean;
    distributedNodes: string[];
    compressionThreshold: number;
}

/**
 * Cache Service Handler
 */
class CacheServiceHandler extends BaseLambdaHandler {
    private cache: Map<string, CacheEntry> = new Map();
    private accessOrder: string[] = []; // For LRU eviction
    private stats = {
        totalRequests: 0,
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
    };
    private config: CacheConfig = {
        defaultTtl: 3600, // 1 hour
        maxSize: 10000,
        maxMemory: 100 * 1024 * 1024, // 100MB
        evictionPolicy: 'lru',
        compressionEnabled: true,
        distributedNodes: ['cache-node-1:6379', 'cache-node-2:6379', 'cache-node-3:6379'],
        compressionThreshold: 1024, // Compress values larger than 1KB
    };

    constructor() {
        super(SERVICE_CONFIG);
        this.startCleanupTimer();
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/set')) {
                return await this.setCacheEntry(event);
            }

            if (httpMethod === 'GET' && path.includes('/get')) {
                return await this.getCacheEntry(event);
            }

            if (httpMethod === 'DELETE' && path.includes('/delete')) {
                return await this.deleteCacheEntry(event);
            }

            if (httpMethod === 'POST' && path.includes('/invalidate')) {
                return await this.invalidateCache(event);
            }

            if (httpMethod === 'GET' && path.includes('/exists')) {
                return await this.checkExists(event);
            }

            if (httpMethod === 'POST' && path.includes('/expire')) {
                return await this.expireKey(event);
            }

            if (httpMethod === 'GET' && path.includes('/ttl')) {
                return await this.getTtl(event);
            }

            if (httpMethod === 'GET' && path.includes('/stats')) {
                return await this.getStats(event);
            }

            if (httpMethod === 'POST' && path.includes('/flush')) {
                return await this.flushCache(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Set cache entry
     */
    private async setCacheEntry(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; key: string }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                CacheSetSchema.parse(data)
            );

            const { key, value, ttl, namespace, tags } = requestBody;
            const effectiveTtl = ttl || this.config.defaultTtl;
            const fullKey = this.buildKey(key, namespace);

            // Check if we need to evict entries
            await this.ensureCapacity();

            // Compress value if needed
            const processedValue = this.shouldCompress(value)
                ? this.compressValue(value)
                : value;

            const now = new Date();
            const expiresAt = new Date(now.getTime() + effectiveTtl * 1000);

            const entry: CacheEntry = {
                key: fullKey,
                value: processedValue,
                ttl: effectiveTtl,
                createdAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                accessCount: 0,
                lastAccessed: now.toISOString(),
                namespace,
                tags,
                size: this.calculateSize(processedValue),
            };

            // Update cache
            this.cache.set(fullKey, entry);
            this.updateAccessOrder(fullKey);
            this.stats.totalSize += entry.size;

            // Distribute to nodes (simulated)
            const nodeIndex = this.hashKey(fullKey) % this.config.distributedNodes.length;
            const targetNode = this.config.distributedNodes[nodeIndex];

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache Entry Set',
                {
                    key: fullKey,
                    namespace,
                    ttl: effectiveTtl,
                    size: entry.size,
                    targetNode,
                    tags,
                }
            );

            return this.createSuccessResponse({ success: true, key: fullKey });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_SET_FAILED',
                error instanceof Error ? error.message : 'Failed to set cache entry',
                400
            );
        }
    }

    /**
     * Get cache entry
     */
    private async getCacheEntry(event: APIGatewayProxyEvent): Promise<ApiResponse<{ value: any; hit: boolean }>> {
        try {
            const key = event.queryStringParameters?.key;
            const namespace = event.queryStringParameters?.namespace || 'default';

            if (!key) {
                throw new Error('Cache key is required');
            }

            const fullKey = this.buildKey(key, namespace);
            this.stats.totalRequests++;

            const entry = this.cache.get(fullKey);

            if (!entry) {
                this.stats.misses++;
                await this.publishServiceEvent(
                    EventSource.INTEGRATION,
                    'Cache Miss',
                    { key: fullKey, namespace }
                );
                return this.createSuccessResponse({ value: null, hit: false });
            }

            // Check TTL expiration
            if (new Date() > new Date(entry.expiresAt)) {
                this.cache.delete(fullKey);
                this.removeFromAccessOrder(fullKey);
                this.stats.totalSize -= entry.size;
                this.stats.misses++;

                await this.publishServiceEvent(
                    EventSource.INTEGRATION,
                    'Cache Expired',
                    { key: fullKey, namespace, expiredAt: entry.expiresAt }
                );

                return this.createSuccessResponse({ value: null, hit: false });
            }

            // Update access statistics
            entry.accessCount++;
            entry.lastAccessed = new Date().toISOString();
            this.updateAccessOrder(fullKey);
            this.stats.hits++;

            // Decompress value if needed
            const value = this.isCompressed(entry.value)
                ? this.decompressValue(entry.value)
                : entry.value;

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache Hit',
                { key: fullKey, namespace, accessCount: entry.accessCount }
            );

            return this.createSuccessResponse({ value, hit: true });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get cache entry',
                400
            );
        }
    }

    /**
     * Delete cache entry
     */
    private async deleteCacheEntry(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; deleted: boolean }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                CacheDeleteSchema.parse(data)
            );

            const { key, namespace } = requestBody;
            const fullKey = this.buildKey(key, namespace);

            const entry = this.cache.get(fullKey);
            const deleted = this.cache.delete(fullKey);

            if (deleted && entry) {
                this.removeFromAccessOrder(fullKey);
                this.stats.totalSize -= entry.size;

                await this.publishServiceEvent(
                    EventSource.INTEGRATION,
                    'Cache Entry Deleted',
                    { key: fullKey, namespace, size: entry.size }
                );
            }

            return this.createSuccessResponse({ success: true, deleted });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_DELETE_FAILED',
                error instanceof Error ? error.message : 'Failed to delete cache entry',
                400
            );
        }
    }

    /**
     * Invalidate cache entries by pattern or tags
     */
    private async invalidateCache(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; invalidatedCount: number }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                CacheInvalidateSchema.parse(data)
            );

            const { pattern, namespace, tags } = requestBody;
            let invalidatedCount = 0;

            for (const [key, entry] of this.cache.entries()) {
                let shouldInvalidate = false;

                // Check namespace match
                if (entry.namespace !== namespace) continue;

                // Check pattern match
                if (pattern === '*' || key.includes(pattern)) {
                    shouldInvalidate = true;
                }

                // Check tag match
                if (tags && tags.length > 0) {
                    const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
                    if (hasMatchingTag) {
                        shouldInvalidate = true;
                    }
                }

                if (shouldInvalidate) {
                    this.cache.delete(key);
                    this.removeFromAccessOrder(key);
                    this.stats.totalSize -= entry.size;
                    invalidatedCount++;
                }
            }

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache Invalidated',
                { pattern, namespace, tags, invalidatedCount }
            );

            return this.createSuccessResponse({ success: true, invalidatedCount });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_INVALIDATE_FAILED',
                error instanceof Error ? error.message : 'Failed to invalidate cache',
                400
            );
        }
    }

    /**
     * Check if key exists
     */
    private async checkExists(event: APIGatewayProxyEvent): Promise<ApiResponse<{ exists: boolean }>> {
        try {
            const key = event.queryStringParameters?.key;
            const namespace = event.queryStringParameters?.namespace || 'default';

            if (!key) {
                throw new Error('Cache key is required');
            }

            const fullKey = this.buildKey(key, namespace);
            const entry = this.cache.get(fullKey);

            if (!entry) {
                return this.createSuccessResponse({ exists: false });
            }

            // Check TTL expiration
            if (new Date() > new Date(entry.expiresAt)) {
                this.cache.delete(fullKey);
                this.removeFromAccessOrder(fullKey);
                this.stats.totalSize -= entry.size;
                return this.createSuccessResponse({ exists: false });
            }

            return this.createSuccessResponse({ exists: true });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_EXISTS_FAILED',
                error instanceof Error ? error.message : 'Failed to check cache existence',
                400
            );
        }
    }

    /**
     * Set expiration for key
     */
    private async expireKey(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; updated: boolean }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                z.object({
                    key: z.string().min(1),
                    ttl: z.number().int().min(1),
                    namespace: z.string().optional().default('default'),
                }).parse(data)
            );

            const { key, ttl, namespace } = requestBody;
            const fullKey = this.buildKey(key, namespace);

            const entry = this.cache.get(fullKey);
            if (!entry) {
                return this.createSuccessResponse({ success: true, updated: false });
            }

            // Update TTL
            const now = new Date();
            entry.expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();
            entry.ttl = ttl;
            this.cache.set(fullKey, entry);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache TTL Updated',
                { key: fullKey, namespace, newTtl: ttl }
            );

            return this.createSuccessResponse({ success: true, updated: true });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_EXPIRE_FAILED',
                error instanceof Error ? error.message : 'Failed to expire cache key',
                400
            );
        }
    }

    /**
     * Get TTL for key
     */
    private async getTtl(event: APIGatewayProxyEvent): Promise<ApiResponse<{ ttl: number }>> {
        try {
            const key = event.queryStringParameters?.key;
            const namespace = event.queryStringParameters?.namespace || 'default';

            if (!key) {
                throw new Error('Cache key is required');
            }

            const fullKey = this.buildKey(key, namespace);
            const entry = this.cache.get(fullKey);

            if (!entry) {
                return this.createSuccessResponse({ ttl: -2 }); // Key doesn't exist
            }

            const now = new Date();
            const expiresAt = new Date(entry.expiresAt);

            if (now > expiresAt) {
                this.cache.delete(fullKey);
                this.removeFromAccessOrder(fullKey);
                this.stats.totalSize -= entry.size;
                return this.createSuccessResponse({ ttl: -2 }); // Key expired
            }

            const ttl = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            return this.createSuccessResponse({ ttl });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_TTL_FAILED',
                error instanceof Error ? error.message : 'Failed to get cache TTL',
                400
            );
        }
    }

    /**
     * Get cache statistics
     */
    private async getStats(event: APIGatewayProxyEvent): Promise<ApiResponse<CacheStats>> {
        try {
            // Calculate namespace statistics
            const namespaceStats: Record<string, { keyCount: number; size: number; hitRate: number }> = {};

            for (const entry of this.cache.values()) {
                if (!namespaceStats[entry.namespace]) {
                    namespaceStats[entry.namespace] = { keyCount: 0, size: 0, hitRate: 0 };
                }
                namespaceStats[entry.namespace].keyCount++;
                namespaceStats[entry.namespace].size += entry.size;
            }

            // Calculate node distribution (simulated)
            const nodeDistribution: Record<string, number> = {};
            this.config.distributedNodes.forEach(node => {
                nodeDistribution[node] = 0;
            });

            for (const key of this.cache.keys()) {
                const nodeIndex = this.hashKey(key) % this.config.distributedNodes.length;
                const node = this.config.distributedNodes[nodeIndex];
                nodeDistribution[node]++;
            }

            const stats: CacheStats = {
                totalKeys: this.cache.size,
                totalSize: this.stats.totalSize,
                hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
                missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
                evictionCount: this.stats.evictions,
                memoryUsage: this.stats.totalSize,
                nodeDistribution,
                namespaceStats,
            };

            return this.createSuccessResponse(stats);

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_STATS_FAILED',
                error instanceof Error ? error.message : 'Failed to get cache statistics',
                500
            );
        }
    }

    /**
     * Flush all cache entries
     */
    private async flushCache(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; clearedCount: number }>> {
        try {
            const namespace = event.queryStringParameters?.namespace;
            let clearedCount = 0;

            if (namespace) {
                // Clear specific namespace
                for (const [key, entry] of this.cache.entries()) {
                    if (entry.namespace === namespace) {
                        this.cache.delete(key);
                        this.removeFromAccessOrder(key);
                        this.stats.totalSize -= entry.size;
                        clearedCount++;
                    }
                }
            } else {
                // Clear all
                clearedCount = this.cache.size;
                this.cache.clear();
                this.accessOrder = [];
                this.stats.totalSize = 0;
            }

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache Flushed',
                { namespace, clearedCount }
            );

            return this.createSuccessResponse({ success: true, clearedCount });

        } catch (error) {
            return this.createErrorResponseData(
                'CACHE_FLUSH_FAILED',
                error instanceof Error ? error.message : 'Failed to flush cache',
                400
            );
        }
    }

    // Helper methods
    private buildKey(key: string, namespace: string): string {
        return `${namespace}:${key}`;
    }

    private hashKey(key: string): number {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private shouldCompress(value: any): boolean {
        if (!this.config.compressionEnabled) return false;
        const size = this.calculateSize(value);
        return size > this.config.compressionThreshold;
    }

    private compressValue(value: any): any {
        // Simplified compression simulation
        return {
            __compressed: true,
            data: JSON.stringify(value),
            originalSize: this.calculateSize(value),
        };
    }

    private decompressValue(value: any): any {
        if (this.isCompressed(value)) {
            return JSON.parse(value.data);
        }
        return value;
    }

    private isCompressed(value: any): boolean {
        return value && typeof value === 'object' && value.__compressed === true;
    }

    private calculateSize(value: any): number {
        // Simplified size calculation
        return JSON.stringify(value).length;
    }

    private updateAccessOrder(key: string): void {
        // Remove from current position
        this.removeFromAccessOrder(key);
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    private async ensureCapacity(): Promise<void> {
        // Check size limit
        if (this.cache.size >= this.config.maxSize) {
            await this.evictEntries(Math.ceil(this.config.maxSize * 0.1)); // Evict 10%
        }

        // Check memory limit
        if (this.stats.totalSize >= this.config.maxMemory) {
            await this.evictEntries(Math.ceil(this.cache.size * 0.2)); // Evict 20%
        }
    }

    private async evictEntries(count: number): Promise<void> {
        const entries = Array.from(this.cache.entries());
        let toEvict: string[] = [];

        switch (this.config.evictionPolicy) {
            case 'lru':
                toEvict = this.accessOrder.slice(0, count);
                break;
            case 'lfu':
                toEvict = entries
                    .sort(([, a], [, b]) => a.accessCount - b.accessCount)
                    .slice(0, count)
                    .map(([key]) => key);
                break;
            case 'fifo':
                toEvict = entries
                    .sort(([, a], [, b]) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .slice(0, count)
                    .map(([key]) => key);
                break;
            case 'ttl':
                toEvict = entries
                    .sort(([, a], [, b]) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
                    .slice(0, count)
                    .map(([key]) => key);
                break;
        }

        for (const key of toEvict) {
            const entry = this.cache.get(key);
            if (entry) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                this.stats.totalSize -= entry.size;
                this.stats.evictions++;
            }
        }

        if (toEvict.length > 0) {
            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Cache Entries Evicted',
                { evictedCount: toEvict.length, policy: this.config.evictionPolicy }
            );
        }
    }

    private startCleanupTimer(): void {
        // Clean up expired entries every 60 seconds
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 60000);
    }

    private cleanupExpiredEntries(): void {
        const now = new Date();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > new Date(entry.expiresAt)) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                this.stats.totalSize -= entry.size;
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.info(`Cleaned up ${cleanedCount} expired cache entries`);
        }
    }
}

// Export the Lambda handler
export const handler = new CacheServiceHandler().lambdaHandler.bind(
    new CacheServiceHandler()
);