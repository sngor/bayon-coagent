/**
 * @fileOverview Caching utilities for website analysis
 * 
 * Provides in-memory caching for crawled website data to improve performance
 * and reduce redundant network requests. Cache entries expire after 24 hours.
 * 
 * Requirements: 1.3 (Performance optimization)
 */

import type { CrawledData } from '@/ai/schemas/website-analysis-schemas';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

/**
 * In-memory cache for website crawl data
 * Uses Map for O(1) lookups
 */
class WebsiteAnalysisCache {
    private cache: Map<string, CacheEntry<CrawledData>>;
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.cache = new Map();
        this.startCleanupInterval();
    }

    /**
     * Generate cache key from URL
     * Normalizes URL to ensure consistent keys
     */
    private getCacheKey(url: string): string {
        try {
            const urlObj = new URL(url);
            // Normalize: lowercase hostname, remove trailing slash, remove www prefix
            const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
            const pathname = urlObj.pathname.replace(/\/$/, '') || '/';
            return `${hostname}${pathname}`;
        } catch {
            // If URL parsing fails, use the raw URL
            return url.toLowerCase();
        }
    }

    /**
     * Get cached data for a URL
     * Returns null if not found or expired
     */
    get(url: string): CrawledData | null {
        const key = this.getCacheKey(url);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Store crawled data in cache
     * @param url - The website URL
     * @param data - The crawled data to cache
     * @param ttl - Time to live in milliseconds (default: 24 hours)
     */
    set(url: string, data: CrawledData, ttl: number = this.DEFAULT_TTL): void {
        const key = this.getCacheKey(url);
        const now = Date.now();

        const entry: CacheEntry<CrawledData> = {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        };

        this.cache.set(key, entry);
    }

    /**
     * Check if URL is cached and not expired
     */
    has(url: string): boolean {
        const key = this.getCacheKey(url);
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Remove a specific URL from cache
     */
    delete(url: string): boolean {
        const key = this.getCacheKey(url);
        return this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        entries: Array<{ url: string; age: number; expiresIn: number }>;
    } {
        const now = Date.now();
        const entries: Array<{ url: string; age: number; expiresIn: number }> = [];

        this.cache.forEach((entry, key) => {
            entries.push({
                url: key,
                age: Math.round((now - entry.timestamp) / 1000 / 60), // minutes
                expiresIn: Math.round((entry.expiresAt - now) / 1000 / 60), // minutes
            });
        });

        return {
            size: this.cache.size,
            entries,
        };
    }

    /**
     * Remove expired entries from cache
     * Called periodically to prevent memory leaks
     */
    private cleanup(): void {
        const now = Date.now();
        let removedCount = 0;

        this.cache.forEach((entry, key) => {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                removedCount++;
            }
        });

        // Cleanup completed silently
    }

    /**
     * Start periodic cleanup of expired entries
     * Runs every hour
     */
    private startCleanupInterval(): void {
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);

        // Ensure cleanup runs on process exit
        if (typeof process !== 'undefined') {
            process.on('beforeExit', () => {
                if (this.cleanupInterval) {
                    clearInterval(this.cleanupInterval);
                }
            });
        }
    }

    /**
     * Stop the cleanup interval
     * Useful for testing or graceful shutdown
     */
    stopCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

/**
 * Singleton cache instance
 * Shared across all website analysis operations
 */
const crawlCache = new WebsiteAnalysisCache();

/**
 * Get the singleton cache instance
 */
export function getCrawlCache(): WebsiteAnalysisCache {
    return crawlCache;
}

/**
 * Request deduplication map
 * Prevents multiple simultaneous requests for the same URL
 */
const pendingRequests = new Map<string, Promise<CrawledData>>();

/**
 * Deduplicate concurrent requests for the same URL
 * If a request is already in progress, return the existing promise
 * 
 * @param url - The URL being requested
 * @param fetchFn - The function to execute if no request is pending
 * @returns Promise that resolves to the crawled data
 */
export async function deduplicateRequest(
    url: string,
    fetchFn: () => Promise<CrawledData>
): Promise<CrawledData> {
    const normalizedUrl = url.toLowerCase().trim();

    // Check if request is already pending
    const pending = pendingRequests.get(normalizedUrl);
    if (pending) {
        return pending;
    }

    // Start new request
    const promise = fetchFn()
        .finally(() => {
            // Clean up after request completes (success or failure)
            pendingRequests.delete(normalizedUrl);
        });

    pendingRequests.set(normalizedUrl, promise);
    return promise;
}

/**
 * Get number of pending requests
 * Useful for monitoring and testing
 */
export function getPendingRequestCount(): number {
    return pendingRequests.size;
}

/**
 * Clear all pending requests
 * Useful for testing
 */
export function clearPendingRequests(): void {
    pendingRequests.clear();
}
