/**
 * Tests for DynamoDB Query Cache
 * 
 * Tests caching functionality for hooks.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getCache, resetCache } from './cache';

describe('Query Cache', () => {
  beforeEach(() => {
    resetCache();
  });

  afterEach(() => {
    resetCache();
  });

  describe('get and set operations', () => {
    it('should store and retrieve cached data', () => {
      const cache = getCache();
      const testData = { id: '123', name: 'Test' };
      
      cache.set(testData, 'USER#123', 'PROFILE');
      const retrieved = cache.get('USER#123', 'PROFILE');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache entries', () => {
      const cache = getCache();
      
      const retrieved = cache.get('USER#999', 'PROFILE');
      
      expect(retrieved).toBeNull();
    });

    it('should handle query cache keys correctly', () => {
      const cache = getCache();
      const testData = [{ id: '1' }, { id: '2' }];
      
      cache.set(testData, 'USER#123', undefined, 'CONTENT#');
      const retrieved = cache.get('USER#123', undefined, 'CONTENT#');
      
      expect(retrieved).toEqual(testData);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire cached data after TTL', async () => {
      const cache = getCache();
      const testData = { id: '123', name: 'Test' };
      
      // Set with 100ms TTL
      cache.set(testData, 'USER#123', 'PROFILE', undefined, 100);
      
      // Should be available immediately
      expect(cache.get('USER#123', 'PROFILE')).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(cache.get('USER#123', 'PROFILE')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const cache = getCache();
      const testData = { id: '123', name: 'Test' };
      
      cache.set(testData, 'USER#123', 'PROFILE');
      
      // Should be available (default TTL is 30 seconds)
      expect(cache.get('USER#123', 'PROFILE')).toEqual(testData);
    });
  });

  describe('invalidation', () => {
    it('should invalidate specific cache entry', () => {
      const cache = getCache();
      const testData = { id: '123', name: 'Test' };
      
      cache.set(testData, 'USER#123', 'PROFILE');
      expect(cache.get('USER#123', 'PROFILE')).toEqual(testData);
      
      cache.invalidate('USER#123', 'PROFILE');
      expect(cache.get('USER#123', 'PROFILE')).toBeNull();
    });

    it('should invalidate all entries for a partition key', () => {
      const cache = getCache();
      
      cache.set({ id: '1' }, 'USER#123', 'PROFILE');
      cache.set({ id: '2' }, 'USER#123', 'AGENT#main');
      cache.set({ id: '3' }, 'USER#456', 'PROFILE');
      
      cache.invalidatePartition('USER#123');
      
      expect(cache.get('USER#123', 'PROFILE')).toBeNull();
      expect(cache.get('USER#123', 'AGENT#main')).toBeNull();
      expect(cache.get('USER#456', 'PROFILE')).not.toBeNull();
    });

    it('should clear all cached data', () => {
      const cache = getCache();
      
      cache.set({ id: '1' }, 'USER#123', 'PROFILE');
      cache.set({ id: '2' }, 'USER#456', 'PROFILE');
      
      cache.clear();
      
      expect(cache.get('USER#123', 'PROFILE')).toBeNull();
      expect(cache.get('USER#456', 'PROFILE')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      const cache = getCache();
      
      // Set items with different TTLs
      cache.set({ id: '1' }, 'USER#123', 'PROFILE', undefined, 100);
      cache.set({ id: '2' }, 'USER#456', 'PROFILE', undefined, 5000);
      
      // Wait for first item to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Run cleanup
      cache.cleanup();
      
      // First should be gone, second should remain
      expect(cache.get('USER#123', 'PROFILE')).toBeNull();
      expect(cache.get('USER#456', 'PROFILE')).not.toBeNull();
    });
  });

  describe('statistics', () => {
    it('should return cache statistics', () => {
      const cache = getCache();
      
      cache.set({ id: '1' }, 'USER#123', 'PROFILE');
      cache.set({ id: '2' }, 'USER#456', 'PROFILE');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toHaveLength(2);
      expect(stats.keys).toContain('item:USER#123:PROFILE');
      expect(stats.keys).toContain('item:USER#456:PROFILE');
    });
  });

  describe('singleton behavior', () => {
    it('should return the same cache instance', () => {
      const cache1 = getCache();
      const cache2 = getCache();
      
      expect(cache1).toBe(cache2);
    });

    it('should share data across instances', () => {
      const cache1 = getCache();
      const cache2 = getCache();
      
      cache1.set({ id: '123' }, 'USER#123', 'PROFILE');
      
      expect(cache2.get('USER#123', 'PROFILE')).toEqual({ id: '123' });
    });
  });
});
