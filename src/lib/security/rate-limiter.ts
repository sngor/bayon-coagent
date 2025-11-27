/**
 * Rate Limiter for API Routes
 * 
 * Provides rate limiting functionality for API endpoints to prevent abuse.
 * Uses in-memory storage for simplicity. For production with multiple instances,
 * consider using Redis or DynamoDB for distributed rate limiting.
 * 
 * Requirements: 10.1, 10.2 (Security and Abuse Prevention)
 */

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * In-memory rate limiter
 */
class InMemoryRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * Check if a request should be allowed
     */
    check(identifier: string): RateLimitResult {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];

        // Remove requests outside the time window
        const recentRequests = requests.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        // Check if limit exceeded
        const allowed = recentRequests.length < this.config.maxRequests;

        if (allowed) {
            // Add current request
            recentRequests.push(now);
            this.requests.set(identifier, recentRequests);
        }

        // Calculate reset time
        const oldestRequest = recentRequests[0] || now;
        const resetAt = oldestRequest + this.config.windowMs;

        // Cleanup old entries periodically (1% chance)
        if (Math.random() < 0.01) {
            this.cleanup(now);
        }

        return {
            allowed,
            remaining: Math.max(0, this.config.maxRequests - recentRequests.length),
            resetAt,
        };
    }

    /**
     * Cleanup old entries to prevent memory leaks
     */
    private cleanup(now: number): void {
        for (const [identifier, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(
                timestamp => now - timestamp < this.config.windowMs
            );
            if (recentRequests.length === 0) {
                this.requests.delete(identifier);
            } else {
                this.requests.set(identifier, recentRequests);
            }
        }
    }

    /**
     * Reset rate limit for an identifier
     */
    reset(identifier: string): void {
        this.requests.delete(identifier);
    }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
    // Strict rate limit for authentication endpoints
    auth: new InMemoryRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
    }),

    // Standard rate limit for API endpoints
    api: new InMemoryRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
    }),

    // Lenient rate limit for dashboard access
    dashboard: new InMemoryRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
    }),

    // Strict rate limit for contact forms
    contactForm: new InMemoryRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10, // 10 submissions per hour
    }),

    // Rate limit for file uploads
    upload: new InMemoryRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 uploads per minute
    }),
};

/**
 * Extract identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request, userId?: string): string {
    if (userId) {
        return `user:${userId}`;
    }

    // Try to get IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return `ip:${forwardedFor.split(',')[0].trim()}`;
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return `ip:${realIp}`;
    }

    // Fallback to a generic identifier
    return 'ip:unknown';
}

/**
 * Middleware helper to check rate limit
 */
export async function checkRateLimit(
    request: Request,
    limiter: InMemoryRateLimiter,
    userId?: string
): Promise<RateLimitResult> {
    const identifier = getIdentifier(request, userId);
    return limiter.check(identifier);
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            resetAt: new Date(result.resetAt).toISOString(),
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
                'X-RateLimit-Limit': '60',
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetAt.toString(),
            },
        }
    );
}
