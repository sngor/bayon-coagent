/**
 * Simple in-memory cache for DynamoDB queries
 * Helps reduce redundant API calls and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) { // 30 seconds default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a cache key from query parameters
   */
  private generateKey(pk: string, sk?: string, prefix?: string): string {
    if (sk) {
      return `item:${pk}:${sk}`;
    }
    return `query:${pk}:${prefix || 'all'}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(pk: string, sk?: string, prefix?: string): T | null {
    const key = this.generateKey(pk, sk, prefix);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(data: T, pk: string, sk?: string, prefix?: string, ttl?: number): void {
    const key = this.generateKey(pk, sk, prefix);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(pk: string, sk?: string, prefix?: string): void {
    const key = this.generateKey(pk, sk, prefix);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a partition key
   */
  invalidatePartition(pk: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pk)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
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
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
let cacheInstance: QueryCache | null = null;

/**
 * Get the singleton cache instance
 */
export function getCache(): QueryCache {
  if (!cacheInstance) {
    cacheInstance = new QueryCache();
    
    // Set up periodic cleanup (every 5 minutes)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        cacheInstance?.cleanup();
      }, 5 * 60 * 1000);
    }
  }
  return cacheInstance;
}

/**
 * Reset the cache instance
 * Useful for testing
 */
export function resetCache(): void {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
}
