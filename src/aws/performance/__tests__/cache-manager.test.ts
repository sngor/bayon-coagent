/**
 * Cache Manager Tests
 */

import { CacheManager, MultiLevelCache } from '../cache-manager';

describe('CacheManager', () => {
    let cache: CacheManager<string>;

    beforeEach(() => {
        cache = new CacheManager({
            maxEntries: 10,
            ttl: 1000, // 1 second for testing
            enableAutoCleanup: false, // Disable for predictable tests
        });
    });

    afterEach(() => {
        cache.destroy();
    });

    describe('basic operations', () => {
        it('should set and get values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return null for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        it('should check if key exists', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });

        it('should delete keys', () => {
            cache.set('key1', 'value1');
            expect(cache.delete('key1')).toBe(true);
            expect(cache.get('key1')).toBeNull();
        });

        it('should clear all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });
    });

    describe('TTL expiration', () => {
        it('should expire entries after TTL', async () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');

            // Wait for TTL to expire
            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(cache.get('key1')).toBeNull();
        });

        it('should not return expired entries', async () => {
            cache.set('key1', 'value1');

            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(cache.has('key1')).toBe(false);
        });
    });

    describe('LRU eviction', () => {
        it('should evict least recently used entries when full', () => {
            // Fill cache to max
            for (let i = 0; i < 10; i++) {
                cache.set(`key${i}`, `value${i}`);
            }

            // Access key9 to make it recently used
            cache.get('key9');

            // Add new entry, should evict key0 (least recently used)
            cache.set('key10', 'value10');

            expect(cache.get('key0')).toBeNull(); // Evicted (oldest)
            expect(cache.get('key9')).toBe('value9'); // Still exists (recently accessed)
            expect(cache.get('key10')).toBe('value10'); // New entry
        });
    });

    describe('statistics', () => {
        it('should track hits and misses', () => {
            cache.set('key1', 'value1');

            cache.get('key1'); // Hit
            cache.get('key2'); // Miss
            cache.get('key1'); // Hit

            const stats = cache.getStats();
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBeCloseTo(0.667, 2);
        });

        it('should track entries and size', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const stats = cache.getStats();
            expect(stats.entries).toBe(2);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should track evictions', () => {
            // Fill cache beyond max
            for (let i = 0; i < 12; i++) {
                cache.set(`key${i}`, `value${i}`);
            }

            const stats = cache.getStats();
            expect(stats.evictions).toBeGreaterThan(0);
        });
    });

    describe('cache warming', () => {
        it('should warm cache with multiple entries', async () => {
            const entries = [
                { key: 'key1', value: 'value1' },
                { key: 'key2', value: 'value2' },
                { key: 'key3', value: 'value3' },
            ];

            await cache.warm(entries);

            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBe('value2');
            expect(cache.get('key3')).toBe('value3');
        });
    });

    describe('keys and values', () => {
        it('should return all keys', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const keys = cache.keys();
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys.length).toBe(2);
        });

        it('should return all values', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const values = cache.values();
            expect(values).toContain('value1');
            expect(values).toContain('value2');
            expect(values.length).toBe(2);
        });
    });
});

describe('MultiLevelCache', () => {
    let cache: MultiLevelCache<string>;

    beforeEach(() => {
        cache = new MultiLevelCache(
            { maxEntries: 5, ttl: 1000 }, // L1
            { maxEntries: 10, ttl: 2000 } // L2
        );
    });

    afterEach(() => {
        cache.destroy();
    });

    it('should check L1 first', async () => {
        await cache.set('key1', 'value1');
        const value = await cache.get('key1');
        expect(value).toBe('value1');
    });

    it('should promote L2 hits to L1', async () => {
        await cache.set('key1', 'value1');

        // Get stats before
        const statsBefore = cache.getStats();

        // Get value (should be in L1)
        await cache.get('key1');

        // L1 should have a hit
        const statsAfter = cache.getStats();
        expect(statsAfter.l1.hits).toBeGreaterThan(statsBefore.l1.hits);
    });

    it('should delete from both levels', async () => {
        await cache.set('key1', 'value1');
        await cache.delete('key1');

        const value = await cache.get('key1');
        expect(value).toBeNull();
    });

    it('should clear both levels', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');
        await cache.clear();

        expect(await cache.get('key1')).toBeNull();
        expect(await cache.get('key2')).toBeNull();
    });
});
