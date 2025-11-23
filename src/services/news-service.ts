/**
 * News service with intelligent caching and rate limiting
 * Reduces NewsAPI costs and improves performance
 */

import { getRealEstateNews, type GetRealEstateNewsInput, type GetRealEstateNewsOutput } from '@/aws/bedrock/flows/get-real-estate-news';
import { NEWS_CONFIG } from '@/lib/news-config';

interface CachedNews {
    data: GetRealEstateNewsOutput;
    timestamp: number;
    location: string;
}

class NewsService {
    private cache = new Map<string, CachedNews>();
    private pendingRequests = new Map<string, Promise<GetRealEstateNewsOutput>>();
    private requestCount = 0;
    private lastHourReset = Date.now();

    /**
     * Get news with intelligent caching and deduplication
     */
    async getNews(input: GetRealEstateNewsInput): Promise<GetRealEstateNewsOutput> {
        const cacheKey = this.getCacheKey(input.location);

        // Check if we have a pending request for the same location
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
            console.log('Returning pending request for:', cacheKey);
            return pendingRequest;
        }

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            if (NEWS_CONFIG.LOG_CACHE_HITS) {
                console.log('Returning cached news for:', cacheKey);
            }
            return cached.data;
        }

        // Check rate limits
        if (!this.canMakeRequest()) {
            if (cached) {
                console.log('Rate limit reached, returning expired cache for:', cacheKey);
                return cached.data;
            }
            throw new Error('Rate limit exceeded and no cached data available');
        }

        // Create new request and cache it to prevent duplicates
        const request = this.fetchNews(input);
        this.pendingRequests.set(cacheKey, request);

        try {
            const result = await request;

            // Cache the result
            this.setCacheEntry(cacheKey, result, input.location || '');

            return result;
        } finally {
            // Remove from pending requests
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Prefetch news for common locations to improve UX
     */
    async prefetchCommonLocations() {
        if (!NEWS_CONFIG.ENABLE_PREFETCH) {
            return;
        }

        const commonLocations = NEWS_CONFIG.COMMON_LOCATIONS;

        const prefetchPromises = commonLocations.map(location => {
            const cacheKey = this.getCacheKey(location);
            const cached = this.cache.get(cacheKey);

            // Only prefetch if not cached or cache is old
            if (!cached || !this.isCacheValid(cached)) {
                return this.getNews({ location }).catch(error => {
                    console.warn('Prefetch failed for location:', location, error.message);
                });
            }
        });

        await Promise.allSettled(prefetchPromises);
    }

    /**
     * Clear old cache entries to prevent memory leaks
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > NEWS_CONFIG.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Check if we can make a new API request based on rate limits
     */
    private canMakeRequest(): boolean {
        const now = Date.now();

        // Reset hourly counter if needed
        if (now - this.lastHourReset > 60 * 60 * 1000) {
            this.requestCount = 0;
            this.lastHourReset = now;
        }

        return this.requestCount < NEWS_CONFIG.MAX_REQUESTS_PER_HOUR;
    }

    /**
     * Increment request counter
     */
    private incrementRequestCount() {
        this.requestCount++;
    }

    /**
     * Get cache statistics for monitoring
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const cached of this.cache.values()) {
            if (now - cached.timestamp <= NEWS_CONFIG.CACHE_DURATION) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            pendingRequests: this.pendingRequests.size
        };
    }

    private async fetchNews(input: GetRealEstateNewsInput): Promise<GetRealEstateNewsOutput> {
        try {
            this.incrementRequestCount();
            return await getRealEstateNews(input);
        } catch (error: any) {
            console.error('News fetch failed:', error.message);

            // Try to return expired cache as fallback
            const cacheKey = this.getCacheKey(input.location);
            const cached = this.cache.get(cacheKey);
            if (cached && NEWS_CONFIG.ENABLE_FALLBACK_NEWS) {
                console.log('Returning expired cache as fallback');
                return cached.data;
            }

            throw error;
        }
    }

    private getCacheKey(location?: string): string {
        return (location || 'general').toLowerCase().trim();
    }

    private isCacheValid(cached: CachedNews): boolean {
        return Date.now() - cached.timestamp < NEWS_CONFIG.CACHE_DURATION;
    }

    private setCacheEntry(key: string, data: GetRealEstateNewsOutput, location: string) {
        // Implement LRU-style cache eviction
        if (this.cache.size >= NEWS_CONFIG.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            location
        });
    }
}

// Singleton instance
export const newsService = new NewsService();

// Cleanup expired cache every 10 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        newsService.clearExpiredCache();
    }, 10 * 60 * 1000);
}