/**
 * In-Memory Adapter for AI Cache
 */

import { AICache, CacheEntry, CacheOptions } from './types';

export class InMemoryAdapter implements AICache {
    private cache: Map<string, CacheEntry<any>>;
    private hits: number = 0;
    private misses: number = 0;
    private defaultTTL: number = 60 * 60 * 1000; // 1 hour

    constructor() {
        this.cache = new Map();

        // Setup periodic cleanup every 5 minutes
        if (typeof setInterval !== 'undefined') {
            setInterval(() => this.cleanup(), 5 * 60 * 1000);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.data as T;
    }

    async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
        const ttl = options?.ttl ?? this.defaultTTL;
        const now = Date.now();

        const entry: CacheEntry<T> = {
            data: value,
            timestamp: now,
            expiresAt: now + ttl,
            metadata: options?.metadata
        };

        this.cache.set(key, entry);
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    async getStats(): Promise<{ size: number; hits: number; misses: number }> {
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses
        };
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}
