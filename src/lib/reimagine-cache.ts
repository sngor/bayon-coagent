/**
 * Caching utilities for Reimagine Image Toolkit
 * 
 * Provides in-memory caching for AI suggestions with TTL support
 * to reduce redundant Bedrock invocations and improve performance.
 * 
 * Requirements: Performance considerations
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  /**
   * Sets a value in the cache with TTL
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time to live in milliseconds
   */
  set(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Gets a value from the cache
   * Returns undefined if not found or expired
   * 
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Checks if a key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Deletes a key from the cache
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes expired entries from the cache
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets the current size of the cache
   * 
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton cache instance for suggestions
// 5-minute TTL as specified in requirements
const SUGGESTIONS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const suggestionsCache = new Cache<any>();

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    suggestionsCache.cleanup();
  }, 60 * 1000);
}

/**
 * Gets cached suggestions for an image
 * 
 * @param imageId - Image ID
 * @returns Cached suggestions or undefined
 */
export function getCachedSuggestions(imageId: string): any | undefined {
  return suggestionsCache.get(`suggestions:${imageId}`);
}

/**
 * Caches suggestions for an image
 * 
 * @param imageId - Image ID
 * @param suggestions - Suggestions to cache
 */
export function cacheSuggestions(imageId: string, suggestions: any): void {
  suggestionsCache.set(`suggestions:${imageId}`, suggestions, SUGGESTIONS_TTL_MS);
}

/**
 * Invalidates cached suggestions for an image
 * 
 * @param imageId - Image ID
 */
export function invalidateSuggestions(imageId: string): void {
  suggestionsCache.delete(`suggestions:${imageId}`);
}

/**
 * Clears all cached suggestions
 */
export function clearSuggestionsCache(): void {
  suggestionsCache.clear();
}

/**
 * Gets cache statistics
 * 
 * @returns Cache statistics
 */
export function getCacheStats(): {
  size: number;
  ttlMs: number;
} {
  return {
    size: suggestionsCache.size(),
    ttlMs: SUGGESTIONS_TTL_MS,
  };
}
