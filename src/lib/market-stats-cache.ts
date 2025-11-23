/**
 * Market Stats Cache Manager
 * 
 * Handles caching of market statistics in IndexedDB with 24-hour expiration
 * and pre-caching for favorited locations.
 */

import { cachedContentStore } from './indexeddb-wrapper';
import { MarketStats } from '@/components/mobile/market-stats';

export interface CachedMarketStats extends MarketStats {
    id: string;
    userId: string;
    favorited?: boolean;
    dataAge?: number;
    stale?: boolean;
}

export interface MarketStatsCacheOptions {
    expirationHours?: number;
    location: string;
    userId: string;
}

export class MarketStatsCache {
    private static readonly DEFAULT_EXPIRATION_HOURS = 24;
    private static readonly CACHE_TYPE = 'market-stats';

    /**
     * Cache market stats for a location
     */
    static async cacheMarketStats(
        stats: MarketStats,
        options: MarketStatsCacheOptions
    ): Promise<string> {
        const { expirationHours = this.DEFAULT_EXPIRATION_HOURS, location, userId } = options;

        const cachedStats: CachedMarketStats = {
            ...stats,
            id: this.generateCacheId(userId, location),
            userId,
            cached: true,
            timestamp: Date.now(),
        };

        const cacheId = await cachedContentStore.cacheContent(
            this.CACHE_TYPE,
            cachedStats,
            expirationHours,
            location
        );

        console.log(`Market stats cached for ${location} (expires in ${expirationHours}h)`);
        return cacheId;
    }

    /**
     * Get cached market stats for a location
     */
    static async getCachedMarketStats(
        location: string,
        userId: string
    ): Promise<CachedMarketStats | null> {
        try {
            const cachedItem = await cachedContentStore.getCachedContentByLocation(
                this.CACHE_TYPE,
                location
            );

            if (!cachedItem) {
                return null;
            }

            const stats = cachedItem.data as CachedMarketStats;

            // Verify the cached data belongs to the correct user
            if (stats.userId !== userId) {
                console.warn(`Cached market stats for ${location} belongs to different user`);
                return null;
            }

            // Calculate data age
            const ageInHours = (Date.now() - stats.timestamp) / (1000 * 60 * 60);
            const isStale = ageInHours > this.DEFAULT_EXPIRATION_HOURS;

            return {
                ...stats,
                dataAge: ageInHours,
                stale: isStale,
                cached: true,
            };
        } catch (error) {
            console.error(`Failed to get cached market stats for ${location}:`, error);
            return null;
        }
    }

    /**
     * Get all cached market stats for a user
     */
    static async getAllCachedMarketStats(userId: string): Promise<CachedMarketStats[]> {
        try {
            const cachedItems = await cachedContentStore.getCachedContentByType(this.CACHE_TYPE);

            return cachedItems
                .map(item => item.data as CachedMarketStats)
                .filter(stats => stats.userId === userId)
                .map(stats => {
                    const ageInHours = (Date.now() - stats.timestamp) / (1000 * 60 * 60);
                    const isStale = ageInHours > this.DEFAULT_EXPIRATION_HOURS;

                    return {
                        ...stats,
                        dataAge: ageInHours,
                        stale: isStale,
                        cached: true,
                    };
                })
                .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
        } catch (error) {
            console.error('Failed to get all cached market stats:', error);
            return [];
        }
    }

    /**
     * Remove cached market stats for a location
     */
    static async removeCachedMarketStats(location: string): Promise<void> {
        try {
            const cachedItem = await cachedContentStore.getCachedContentByLocation(
                this.CACHE_TYPE,
                location
            );

            if (cachedItem) {
                await cachedContentStore.delete(cachedItem.id);
                console.log(`Removed cached market stats for ${location}`);
            }
        } catch (error) {
            console.error(`Failed to remove cached market stats for ${location}:`, error);
        }
    }

    /**
     * Clear all cached market stats for a user
     */
    static async clearAllCachedMarketStats(userId: string): Promise<void> {
        try {
            const cachedItems = await cachedContentStore.getCachedContentByType(this.CACHE_TYPE);

            const userItems = cachedItems.filter(item => {
                const stats = item.data as CachedMarketStats;
                return stats.userId === userId;
            });

            await Promise.all(
                userItems.map(item => cachedContentStore.delete(item.id))
            );

            console.log(`Cleared ${userItems.length} cached market stats for user ${userId}`);
        } catch (error) {
            console.error('Failed to clear cached market stats:', error);
        }
    }

    /**
     * Pre-cache market stats for favorited locations
     */
    static async preCacheFavoritedLocations(
        favoritedLocations: string[],
        userId: string,
        fetchMarketStats: (location: string) => Promise<MarketStats>
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        console.log(`Pre-caching market stats for ${favoritedLocations.length} favorited locations`);

        for (const location of favoritedLocations) {
            try {
                // Check if we already have fresh cached data
                const cached = await this.getCachedMarketStats(location, userId);
                if (cached && !cached.stale) {
                    console.log(`Skipping ${location} - fresh data already cached`);
                    success++;
                    continue;
                }

                // Fetch fresh data
                const stats = await fetchMarketStats(location);

                // Cache the data with favorited flag
                await this.cacheMarketStats(
                    { ...stats, favorited: true },
                    { location, userId }
                );

                success++;
                console.log(`Pre-cached market stats for favorited location: ${location}`);
            } catch (error) {
                failed++;
                console.error(`Failed to pre-cache market stats for ${location}:`, error);
            }
        }

        console.log(`Pre-caching complete: ${success} success, ${failed} failed`);
        return { success, failed };
    }

    /**
     * Get cache statistics
     */
    static async getCacheStats(userId: string): Promise<{
        totalCached: number;
        freshData: number;
        staleData: number;
        favoritedLocations: number;
        oldestCacheAge: number;
        newestCacheAge: number;
    }> {
        try {
            const allCached = await this.getAllCachedMarketStats(userId);

            const freshData = allCached.filter(stats => !stats.stale).length;
            const staleData = allCached.filter(stats => stats.stale).length;
            const favoritedLocations = allCached.filter(stats => stats.favorited).length;

            const ages = allCached.map(stats => stats.dataAge || 0);
            const oldestCacheAge = ages.length > 0 ? Math.max(...ages) : 0;
            const newestCacheAge = ages.length > 0 ? Math.min(...ages) : 0;

            return {
                totalCached: allCached.length,
                freshData,
                staleData,
                favoritedLocations,
                oldestCacheAge,
                newestCacheAge,
            };
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return {
                totalCached: 0,
                freshData: 0,
                staleData: 0,
                favoritedLocations: 0,
                oldestCacheAge: 0,
                newestCacheAge: 0,
            };
        }
    }

    /**
     * Cleanup expired cache entries
     */
    static async cleanupExpiredCache(): Promise<number> {
        try {
            // The IndexedDB wrapper already handles cleanup of expired content
            // This method is for additional cleanup if needed
            await cachedContentStore.cleanupExpiredContent();

            const remainingCached = await cachedContentStore.getCachedContentByType(this.CACHE_TYPE);
            console.log(`Cache cleanup complete. ${remainingCached.length} market stats entries remaining`);

            return remainingCached.length;
        } catch (error) {
            console.error('Failed to cleanup expired cache:', error);
            return 0;
        }
    }

    /**
     * Check if location is in cache and fresh
     */
    static async isLocationCached(location: string, userId: string): Promise<{
        cached: boolean;
        fresh: boolean;
        ageInHours?: number;
    }> {
        try {
            const cachedStats = await this.getCachedMarketStats(location, userId);

            if (!cachedStats) {
                return { cached: false, fresh: false };
            }

            return {
                cached: true,
                fresh: !cachedStats.stale,
                ageInHours: cachedStats.dataAge,
            };
        } catch (error) {
            console.error(`Failed to check cache status for ${location}:`, error);
            return { cached: false, fresh: false };
        }
    }

    /**
     * Generate cache ID for a user and location
     */
    private static generateCacheId(userId: string, location: string): string {
        const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-');
        return `market-stats-${userId}-${normalizedLocation}-${Date.now()}`;
    }

    /**
     * Validate market stats data
     */
    static validateMarketStats(stats: any): stats is MarketStats {
        return (
            typeof stats === 'object' &&
            stats !== null &&
            typeof stats.location === 'string' &&
            typeof stats.medianPrice === 'number' &&
            typeof stats.inventoryLevel === 'number' &&
            typeof stats.daysOnMarket === 'number' &&
            ['up', 'down', 'stable'].includes(stats.priceTrend) &&
            typeof stats.timestamp === 'number' &&
            typeof stats.cached === 'boolean'
        );
    }

    /**
     * Get locations that need cache refresh
     */
    static async getLocationsNeedingRefresh(
        locations: string[],
        userId: string
    ): Promise<string[]> {
        const needsRefresh: string[] = [];

        for (const location of locations) {
            const cacheStatus = await this.isLocationCached(location, userId);
            if (!cacheStatus.cached || !cacheStatus.fresh) {
                needsRefresh.push(location);
            }
        }

        return needsRefresh;
    }
}

export default MarketStatsCache;