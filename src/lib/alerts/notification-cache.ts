/**
 * Notification Cache
 * 
 * Implements in-memory caching for frequently accessed notification data
 * to reduce database queries and improve performance.
 */

import { NotificationPreferences } from './notification-types';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export interface CacheConfig {
    // Default TTL in milliseconds
    defaultTTL: number;
    // Maximum cache size (number of entries)
    maxSize: number;
    // Enable cache statistics
    enableStats: boolean;
}

export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    hitRate: number;
}

/**
 * Simple in-memory LRU cache implementation
 */
export class NotificationCache<T = any> {
    private cache: Map<string, CacheEntry<T>>;
    private accessOrder: string[]; // For LRU tracking
    private config: CacheConfig;
    private stats: CacheStats;

    constructor(config?: Partial<CacheConfig>) {
        this.cache = new Map();
        this.accessOrder = [];
        this.config = {
            defaultTTL: config?.defaultTTL ?? 5 * 60 * 1000, // 5 minutes
            maxSize: config?.maxSize ?? 1000,
            enableStats: config?.enableStats ?? true,
        };
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0,
            hitRate: 0,
        };
    }

    /**
     * Gets a value from the cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.recordMiss();
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            this.recordMiss();
            return null;
        }

        // Update access order for LRU
        this.updateAccessOrder(key);
        this.recordHit();

        return entry.data;
    }

    /**
     * Sets a value in the cache
     */
    set(key: string, value: T, ttl?: number): void {
        const now = Date.now();
        const expiresAt = now + (ttl ?? this.config.defaultTTL);

        // Check if we need to evict
        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const entry: CacheEntry<T> = {
            data: value,
            timestamp: now,
            expiresAt,
        };

        this.cache.set(key, entry);
        this.updateAccessOrder(key);
        this.updateSize();
    }

    /**
     * Deletes a value from the cache
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.removeFromAccessOrder(key);
            this.updateSize();
        }
        return deleted;
    }

    /**
     * Clears the entire cache
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.updateSize();
    }

    /**
     * Checks if a key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return false;
        }

        return true;
    }

    /**
     * Gets cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Resets cache statistics
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: this.cache.size,
            hitRate: 0,
        };
    }

    /**
     * Gets all keys in the cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Gets the cache size
     */
    size(): number {
        return this.cache.size;
    }

    // ==================== Private Methods ====================

    /**
     * Evicts the least recently used entry
     */
    private evictLRU(): void {
        if (this.accessOrder.length === 0) {
            return;
        }

        const lruKey = this.accessOrder[0];
        this.cache.delete(lruKey);
        this.accessOrder.shift();

        if (this.config.enableStats) {
            this.stats.evictions++;
        }
    }

    /**
     * Updates the access order for LRU tracking
     */
    private updateAccessOrder(key: string): void {
        // Remove from current position
        this.removeFromAccessOrder(key);
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    /**
     * Removes a key from the access order
     */
    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Records a cache hit
     */
    private recordHit(): void {
        if (this.config.enableStats) {
            this.stats.hits++;
            this.updateHitRate();
        }
    }

    /**
     * Records a cache miss
     */
    private recordMiss(): void {
        if (this.config.enableStats) {
            this.stats.misses++;
            this.updateHitRate();
        }
    }

    /**
     * Updates the hit rate
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Updates the size stat
     */
    private updateSize(): void {
        if (this.config.enableStats) {
            this.stats.size = this.cache.size;
        }
    }
}

/**
 * Specialized cache for notification preferences
 */
export class NotificationPreferencesCache extends NotificationCache<NotificationPreferences> {
    constructor() {
        super({
            defaultTTL: 10 * 60 * 1000, // 10 minutes for preferences
            maxSize: 5000, // Support many users
            enableStats: true,
        });
    }

    /**
     * Gets preferences by user ID
     */
    getUserPreferences(userId: string): NotificationPreferences | null {
        return this.get(`user:${userId}:preferences`);
    }

    /**
     * Sets preferences for a user
     */
    setUserPreferences(userId: string, preferences: NotificationPreferences): void {
        this.set(`user:${userId}:preferences`, preferences);
    }

    /**
     * Invalidates preferences for a user
     */
    invalidateUserPreferences(userId: string): void {
        this.delete(`user:${userId}:preferences`);
    }
}

/**
 * Specialized cache for notification templates
 */
export class NotificationTemplateCache extends NotificationCache<string> {
    constructor() {
        super({
            defaultTTL: 60 * 60 * 1000, // 1 hour for templates
            maxSize: 100, // Limited number of templates
            enableStats: true,
        });
    }

    /**
     * Gets a template by name and type
     */
    getTemplate(name: string, type: 'html' | 'text'): string | null {
        return this.get(`template:${name}:${type}`);
    }

    /**
     * Sets a template
     */
    setTemplate(name: string, type: 'html' | 'text', content: string): void {
        this.set(`template:${name}:${type}`, content);
    }

    /**
     * Invalidates a template
     */
    invalidateTemplate(name: string): void {
        this.delete(`template:${name}:html`);
        this.delete(`template:${name}:text`);
    }
}

// Export singleton instances
export const preferencesCache = new NotificationPreferencesCache();
export const templateCache = new NotificationTemplateCache();

// Export factory functions
export const createNotificationCache = <T = any>(config?: Partial<CacheConfig>) => {
    return new NotificationCache<T>(config);
};
