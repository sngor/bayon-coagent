/**
 * Market Intelligence Caching Service
 * Provides intelligent caching for expensive market research operations
 */

import { createLogger } from '@/aws/logging/logger';
import { getRepository } from '@/aws/dynamodb/repository';

const logger = createLogger({ service: 'market-cache' });

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    location: string;
    analysisType: string;
}

export class MarketCacheService {
    private static readonly CACHE_DURATION = {
        'market-update': 30 * 60 * 1000, // 30 minutes
        'trend-analysis': 60 * 60 * 1000, // 1 hour
        'opportunity-identification': 45 * 60 * 1000, // 45 minutes
        'competitive-analysis': 2 * 60 * 60 * 1000, // 2 hours
        'neighborhood-insights': 4 * 60 * 60 * 1000, // 4 hours
    };

    private repository = getRepository();

    /**
     * Get cached analysis if available and not expired
     */
    async getCachedAnalysis<T>(
        location: string,
        analysisType: string,
        additionalKey?: string
    ): Promise<T | null> {
        try {
            const cacheKey = this.generateCacheKey(location, analysisType, additionalKey);
            const cached = await this.repository.get(
                `CACHE#MARKET`,
                `ANALYSIS#${cacheKey}`
            );

            if (!cached) {
                return null;
            }

            const entry = cached as CacheEntry<T>;

            // Check if expired
            if (Date.now() > entry.expiresAt) {
                // Clean up expired entry
                await this.invalidateCache(location, analysisType, additionalKey);
                return null;
            }

            logger.info('Cache hit for market analysis', {
                location,
                analysisType,
                cacheKey,
                age: Date.now() - entry.timestamp
            });

            return entry.data;
        } catch (error) {
            logger.warn('Failed to retrieve cached analysis:', {
                location,
                analysisType,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    /**
     * Cache analysis result
     */
    async cacheAnalysis<T>(
        location: string,
        analysisType: string,
        data: T,
        additionalKey?: string
    ): Promise<void> {
        try {
            const cacheKey = this.generateCacheKey(location, analysisType, additionalKey);
            const duration = this.getCacheDuration(analysisType);
            const now = Date.now();

            const entry: CacheEntry<T> = {
                data,
                timestamp: now,
                expiresAt: now + duration,
                location,
                analysisType,
            };

            await this.repository.put({
                PK: `CACHE#MARKET`,
                SK: `ANALYSIS#${cacheKey}`,
                EntityType: 'SavedContent',
                Data: entry,
                CreatedAt: now,
                UpdatedAt: now,
                TTL: Math.floor((now + duration) / 1000), // DynamoDB TTL
            });

            logger.info('Cached market analysis', {
                location,
                analysisType,
                cacheKey,
                duration
            });
        } catch (error) {
            logger.warn('Failed to cache analysis:', {
                location,
                analysisType,
                error: error instanceof Error ? error.message : String(error)
            });
            // Don't throw - caching failure shouldn't break the main operation
        }
    }

    /**
     * Invalidate cached analysis
     */
    async invalidateCache(
        location: string,
        analysisType: string,
        additionalKey?: string
    ): Promise<void> {
        try {
            const cacheKey = this.generateCacheKey(location, analysisType, additionalKey);
            await this.repository.delete(`CACHE#MARKET`, `ANALYSIS#${cacheKey}`);

            logger.info('Invalidated cache entry', {
                location,
                analysisType,
                cacheKey
            });
        } catch (error) {
            logger.warn('Failed to invalidate cache:', {
                location,
                analysisType,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Clear all cache entries for a location
     */
    async clearLocationCache(location: string): Promise<void> {
        try {
            // Query all cache entries for this location
            const entries = await this.repository.query(
                `CACHE#MARKET`,
                `ANALYSIS#${location.toLowerCase().replace(/\s+/g, '-')}`
            );

            // Delete each entry
            const entriesArray = Array.isArray(entries) ? entries : entries.items || [];
            for (const entry of entriesArray) {
                await this.repository.delete(entry.PK, entry.SK);
            }

            logger.info('Cleared location cache', { location, entriesCleared: entriesArray.length });
        } catch (error) {
            logger.warn('Failed to clear location cache:', {
                location,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Generate cache key
     */
    private generateCacheKey(
        location: string,
        analysisType: string,
        additionalKey?: string
    ): string {
        const baseKey = `${location.toLowerCase().replace(/\s+/g, '-')}-${analysisType}`;
        return additionalKey ? `${baseKey}-${additionalKey}` : baseKey;
    }

    /**
     * Get cache duration for analysis type
     */
    private getCacheDuration(analysisType: string): number {
        return MarketCacheService.CACHE_DURATION[
            analysisType as keyof typeof MarketCacheService.CACHE_DURATION
        ] || MarketCacheService.CACHE_DURATION['market-update'];
    }
}

export const marketCacheService = new MarketCacheService();