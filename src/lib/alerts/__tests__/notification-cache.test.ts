/**
 * Notification Cache Tests
 * 
 * Basic tests to verify caching functionality
 */

import { NotificationCache } from '../notification-cache';

describe('NotificationCache', () => {
    describe('Basic Operations', () => {
        it('should store and retrieve values', () => {
            const cache = new NotificationCache<string>();

            cache.set('key1', 'value1');
            const result = cache.get('key1');

            expect(result).toBe('value1');
        });

        it('should return null for missing keys', () => {
            const cache = new NotificationCache<string>();

            const result = cache.get('nonexistent');

            expect(result).toBeNull();
        });

        it('should delete values', () => {
            const cache = new NotificationCache<string>();

            cache.set('key1', 'value1');
            cache.delete('key1');
            const result = cache.get('key1');

            expect(result).toBeNull();
        });

        it('should clear all values', () => {
            const cache = new NotificationCache<string>();

            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
            expect(cache.size()).toBe(0);
        });
    });

    describe('TTL Expiration', () => {
        it('should expire values after TTL', async () => {
            const cache = new NotificationCache<string>({
                defaultTTL: 100, // 100ms
            });

            cache.set('key1', 'value1');

            // Should be available immediately
            expect(cache.get('key1')).toBe('value1');

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be expired
            expect(cache.get('key1')).toBeNull();
        });

        it('should respect custom TTL', async () => {
            const cache = new NotificationCache<string>({
                defaultTTL: 1000, // 1 second default
            });

            cache.set('key1', 'value1', 100); // 100ms custom TTL

            // Wait for custom TTL to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be expired
            expect(cache.get('key1')).toBeNull();
        });
    });

    describe('LRU Eviction', () => {
        it('should evict least recently used items when full', () => {
            const cache = new NotificationCache<string>({
                maxSize: 3,
            });

            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // Cache is now full, adding another should evict key1
            cache.set('key4', 'value4');

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
            expect(cache.get('key3')).toBe('value3');
            expect(cache.get('key4')).toBe('value4');
        });

        it('should update access order on get', () => {
            const cache = new NotificationCache<string>({
                maxSize: 3,
            });

            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // Access key1 to make it most recently used
            cache.get('key1');

            // Add key4, should evict key2 (least recently used)
            cache.set('key4', 'value4');

            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBe('value3');
            expect(cache.get('key4')).toBe('value4');
        });
    });

    describe('Statistics', () => {
        it('should track cache hits and misses', () => {
            const cache = new NotificationCache<string>({
                enableStats: true,
            });

            cache.set('key1', 'value1');

            // Hit
            cache.get('key1');

            // Miss
            cache.get('key2');

            const stats = cache.getStats();

            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBe(0.5);
        });

        it('should track evictions', () => {
            const cache = new NotificationCache<string>({
                maxSize: 2,
                enableStats: true,
            });

            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3'); // Should evict key1

            const stats = cache.getStats();

            expect(stats.evictions).toBe(1);
        });

        it('should reset statistics', () => {
            const cache = new NotificationCache<string>({
                enableStats: true,
            });

            cache.set('key1', 'value1');
            cache.get('key1');
            cache.get('key2');

            cache.resetStats();

            const stats = cache.getStats();

            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.hitRate).toBe(0);
        });
    });
});
