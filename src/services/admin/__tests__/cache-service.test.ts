/**
 * Cache Service Tests
 * 
 * Tests for the caching service including TTL, invalidation, and metrics.
 */

import { CacheService, getCacheService, CacheKeys, CacheTTL } from '../cache-service';

describe('CacheService', () => {
    let cache: CacheService;

    beforeEach(() => {
        cache = new CacheService();
    });

    describe('Basic Operations', () => {
        it('should store and retrieve values', () => {
            cache.set('test-key', { data: 'value' }, 60);
            const result = cache.get('test-key');
            expect(result).toEqual({ data: 'value' });
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent');
            expect(result).toBeNull();
        });

        it('should overwrite existing values', () => {
            cache.set('test-key', 'value1', 60);
            cache.set('test-key', 'value2', 60);
            const result = cache.get('test-key');
            expect(result).toBe('value2');
        });
    });

    describe('TTL Expiration', () => {
        it('should expire values after TTL', async () => {
            cache.set('test-key', 'value', 0.1); // 100ms TTL

            // Should exist immediately
            expect(cache.get('test-key')).toBe('value');

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be expired
            expect(cache.get('test-key')).toBeNull();
        });

        it('should not expire values before TTL', async () => {
            cache.set('test-key', 'value', 1); // 1 second TTL

            // Wait 500ms
            await new Promise(resolve => setTimeout(resolve, 500));

            // Should still exist
            expect(cache.get('test-key')).toBe('value');
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate specific keys', () => {
            cache.set('key1', 'value1', 60);
            cache.set('key2', 'value2', 60);

            cache.invalidate('key1');

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
        });

        it('should invalidate keys matching pattern', () => {
            cache.set('user:123', 'value1', 60);
            cache.set('user:456', 'value2', 60);
            cache.set('post:789', 'value3', 60);

            cache.invalidatePattern('^user:');

            expect(cache.get('user:123')).toBeNull();
            expect(cache.get('user:456')).toBeNull();
            expect(cache.get('post:789')).toBe('value3');
        });

        it('should clear all cache entries', () => {
            cache.set('key1', 'value1', 60);
            cache.set('key2', 'value2', 60);
            cache.set('key3', 'value3', 60);

            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBeNull();
        });
    });

    describe('Cache Metrics', () => {
        it('should track cache hits', () => {
            cache.set('test-key', 'value', 60);

            cache.get('test-key'); // Hit
            cache.get('test-key'); // Hit

            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(2);
            expect(metrics.misses).toBe(0);
        });

        it('should track cache misses', () => {
            cache.get('non-existent'); // Miss
            cache.get('another-miss'); // Miss

            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(0);
            expect(metrics.misses).toBe(2);
        });

        it('should track evictions', () => {
            cache.set('key1', 'value1', 60);
            cache.invalidate('key1');

            const metrics = cache.getMetrics();
            expect(metrics.evictions).toBe(1);
        });

        it('should track cache size', () => {
            cache.set('key1', 'value1', 60);
            cache.set('key2', 'value2', 60);
            cache.set('key3', 'value3', 60);

            const metrics = cache.getMetrics();
            expect(metrics.size).toBe(3);
        });

        it('should calculate hit rate correctly', () => {
            cache.set('test-key', 'value', 60);

            cache.get('test-key'); // Hit
            cache.get('test-key'); // Hit
            cache.get('non-existent'); // Miss

            const hitRate = cache.getHitRate();
            expect(hitRate).toBeCloseTo(0.667, 2); // 2/3 = 0.667
        });

        it('should reset metrics', () => {
            cache.set('test-key', 'value', 60);
            cache.get('test-key');
            cache.get('non-existent');

            cache.resetMetrics();

            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(0);
            expect(metrics.misses).toBe(0);
        });
    });

    describe('getOrSet', () => {
        it('should call factory on cache miss', async () => {
            let callCount = 0;
            const factory = async () => {
                callCount++;
                return 'computed-value';
            };

            const result = await cache.getOrSet('test-key', factory, 60);

            expect(result).toBe('computed-value');
            expect(callCount).toBe(1);
        });

        it('should not call factory on cache hit', async () => {
            let callCount = 0;
            const factory = async () => {
                callCount++;
                return 'computed-value';
            };

            // First call - cache miss
            await cache.getOrSet('test-key', factory, 60);

            // Second call - cache hit
            const result = await cache.getOrSet('test-key', factory, 60);

            expect(result).toBe('computed-value');
            expect(callCount).toBe(1); // Only called once
        });

        it('should cache the factory result', async () => {
            const factory = async () => ({ data: 'value' });

            await cache.getOrSet('test-key', factory, 60);

            const cached = cache.get('test-key');
            expect(cached).toEqual({ data: 'value' });
        });
    });

    describe('Cache Size Limits', () => {
        it('should evict oldest entries when cache is full', () => {
            const smallCache = new CacheService(3); // Max 3 entries

            smallCache.set('key1', 'value1', 60);
            smallCache.set('key2', 'value2', 60);
            smallCache.set('key3', 'value3', 60);
            smallCache.set('key4', 'value4', 60); // Should evict key1

            expect(smallCache.get('key1')).toBeNull();
            expect(smallCache.get('key2')).toBe('value2');
            expect(smallCache.get('key3')).toBe('value3');
            expect(smallCache.get('key4')).toBe('value4');
        });
    });

    describe('Singleton Instance', () => {
        it('should return the same instance', () => {
            const instance1 = getCacheService();
            const instance2 = getCacheService();

            expect(instance1).toBe(instance2);
        });

        it('should share cache across instances', () => {
            const instance1 = getCacheService();
            const instance2 = getCacheService();

            instance1.set('test-key', 'value', 60);

            expect(instance2.get('test-key')).toBe('value');
        });
    });

    describe('Cache Keys', () => {
        it('should generate platform metrics key', () => {
            const key = CacheKeys.platformMetrics('2024-01-01', '2024-01-31');
            expect(key).toBe('metrics:platform:2024-01-01:2024-01-31');
        });

        it('should generate system health key', () => {
            const key = CacheKeys.systemHealth();
            expect(key).toBe('health:system');
        });

        it('should generate feature flags key', () => {
            const key = CacheKeys.featureFlags();
            expect(key).toBe('config:feature-flags');
        });

        it('should generate feature flag key', () => {
            const key = CacheKeys.featureFlag('new-ui');
            expect(key).toBe('config:feature-flag:new-ui');
        });
    });

    describe('Cache TTL Constants', () => {
        it('should have correct TTL values', () => {
            expect(CacheTTL.PLATFORM_METRICS).toBe(300); // 5 minutes
            expect(CacheTTL.SYSTEM_HEALTH).toBe(60); // 1 minute
            expect(CacheTTL.FEATURE_FLAGS).toBe(0); // No expiry
            expect(CacheTTL.USER_ACTIVITY).toBe(300); // 5 minutes
        });
    });
});
