/**
 * API Rate Limiting Utility
 * 
 * Implements in-memory rate limiting for API endpoints
 * Uses a sliding window algorithm to track requests
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
    requests: number[]; // Timestamps of requests
}

interface RateLimitResult {
    allowed: boolean;
    remaining?: number;
    resetAt?: number;
    retryAfter?: number;
}

// In-memory store for rate limit tracking
// In production, this should be replaced with Redis or DynamoDB
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request is within rate limits
 * 
 * @param identifier - Unique identifier (e.g., userId)
 * @param namespace - Rate limit namespace (e.g., 'open-house-api')
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
    identifier: string,
    namespace: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `${namespace}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry) {
        entry = {
            count: 0,
            resetAt: now + windowMs,
            requests: []
        };
        rateLimitStore.set(key, entry);
    }

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    entry.count = entry.requests.length;

    // Check if limit exceeded
    if (entry.count >= limit) {
        const oldestRequest = entry.requests[0];
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

        return {
            allowed: false,
            remaining: 0,
            resetAt: oldestRequest + windowMs,
            retryAfter: Math.max(retryAfter, 1)
        };
    }

    // Add current request
    entry.requests.push(now);
    entry.count = entry.requests.length;
    entry.resetAt = now + windowMs;

    return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt
    };
}

/**
 * Clear rate limit for a specific identifier
 * Useful for testing or manual resets
 * 
 * @param identifier - Unique identifier
 * @param namespace - Rate limit namespace
 */
export function clearRateLimit(identifier: string, namespace: string): void {
    const key = `${namespace}:${identifier}`;
    rateLimitStore.delete(key);
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Get current rate limit status without incrementing
 * 
 * @param identifier - Unique identifier
 * @param namespace - Rate limit namespace
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
    identifier: string,
    namespace: string,
    limit: number,
    windowSeconds: number
): RateLimitResult {
    const key = `${namespace}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    const entry = rateLimitStore.get(key);

    if (!entry) {
        return {
            allowed: true,
            remaining: limit,
            resetAt: now + windowMs
        };
    }

    // Count requests in current window
    const activeRequests = entry.requests.filter(timestamp => timestamp > windowStart);
    const remaining = Math.max(0, limit - activeRequests.length);

    if (activeRequests.length >= limit) {
        const oldestRequest = activeRequests[0];
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

        return {
            allowed: false,
            remaining: 0,
            resetAt: oldestRequest + windowMs,
            retryAfter: Math.max(retryAfter, 1)
        };
    }

    return {
        allowed: true,
        remaining,
        resetAt: entry.resetAt
    };
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredRateLimits(): void {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
        // Remove entries where all requests are expired
        const activeRequests = entry.requests.filter(timestamp => timestamp > now - 3600000); // 1 hour

        if (activeRequests.length === 0) {
            rateLimitStore.delete(key);
        } else {
            entry.requests = activeRequests;
            entry.count = activeRequests.length;
        }
    }
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}
