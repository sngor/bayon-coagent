/**
 * Rate Limiter for MLS and Social Media API Endpoints
 * 
 * Implements sliding window rate limiting for MLS and social media operations
 * to prevent abuse and ensure fair usage.
 * 
 * Requirements: Security considerations - Rate limiting for API endpoints
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { DynamoDBItem } from '@/aws/dynamodb/types';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number; // Time window in milliseconds
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number; // Seconds until rate limit resets
}

/**
 * Rate limit record stored in DynamoDB
 */
interface RateLimitRecord {
    userId: string;
    operation: string;
    requests: Array<{
        timestamp: number;
    }>;
    updatedAt: string;
}

/**
 * Rate limit configurations for MLS and social media operations
 */
export const MLS_SOCIAL_RATE_LIMITS = {
    // MLS operations
    mlsImport: {
        maxRequests: 5,
        windowMs: 60 * 60 * 1000, // 5 imports per hour
    },
    mlsSync: {
        maxRequests: 20,
        windowMs: 60 * 60 * 1000, // 20 syncs per hour
    },
    mlsAuth: {
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 10 auth attempts per hour
    },

    // Social media operations
    socialPublish: {
        maxRequests: 30,
        windowMs: 60 * 60 * 1000, // 30 posts per hour
    },
    socialAuth: {
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 10 auth attempts per hour
    },
    imageOptimize: {
        maxRequests: 100,
        windowMs: 60 * 60 * 1000, // 100 image optimizations per hour
    },

    // General API operations
    apiRequest: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 100 requests per minute
    },
} as const;

export type MLSSocialOperation = keyof typeof MLS_SOCIAL_RATE_LIMITS;

/**
 * Checks if a user has exceeded the rate limit for an operation
 * 
 * @param userId - User ID to check rate limit for
 * @param operation - Operation type
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkMLSSocialRateLimit(
    userId: string,
    operation: MLSSocialOperation
): Promise<RateLimitResult> {
    // Bypass rate limiting in local development
    if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AWS !== 'true') {
        return {
            allowed: true,
            remaining: 999,
            resetAt: new Date(Date.now() + 3600000),
        };
    }

    const config = MLS_SOCIAL_RATE_LIMITS[operation];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
        const repository = getRepository();

        // Generate DynamoDB keys for rate limit record
        const PK = `USER#${userId}`;
        const SK = `RATELIMIT#MLS_SOCIAL#${operation}`;

        // Get existing rate limit record
        const existingRecord = await repository.get<RateLimitRecord>(PK, SK);

        // Filter requests within the current time window
        const recentRequests = existingRecord?.requests
            ? existingRecord.requests.filter(req => req.timestamp > windowStart)
            : [];

        // Calculate remaining requests
        const remaining = Math.max(0, config.maxRequests - recentRequests.length);

        // Calculate reset time (earliest request timestamp + window)
        let resetAt: Date;
        if (recentRequests.length > 0) {
            const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
            resetAt = new Date(oldestRequest + config.windowMs);
        } else {
            resetAt = new Date(now + config.windowMs);
        }

        // Check if request is allowed
        const allowed = recentRequests.length < config.maxRequests;

        // If allowed, add the new request to the history
        if (allowed) {
            const updatedRequests = [
                ...recentRequests,
                { timestamp: now },
            ];

            // Save updated rate limit record to DynamoDB
            const item: DynamoDBItem<RateLimitRecord> = {
                PK,
                SK,
                EntityType: 'RateLimit',
                Data: {
                    userId,
                    operation,
                    requests: updatedRequests,
                    updatedAt: new Date().toISOString(),
                },
                CreatedAt: existingRecord ? (existingRecord as any).CreatedAt || now : now,
                UpdatedAt: now,
            };

            await repository.put(item);
        }

        // Calculate retry after in seconds
        const retryAfter = allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000);

        return {
            allowed,
            remaining: allowed ? remaining - 1 : 0,
            resetAt,
            retryAfter,
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);

        // On error, allow the request but log the failure
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: new Date(now + config.windowMs),
        };
    }
}

/**
 * Gets the current rate limit status without incrementing the counter
 * 
 * @param userId - User ID to check
 * @param operation - Operation type
 * @returns Current rate limit status
 */
export async function getMLSSocialRateLimitStatus(
    userId: string,
    operation: MLSSocialOperation
): Promise<RateLimitResult> {
    const config = MLS_SOCIAL_RATE_LIMITS[operation];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
        const repository = getRepository();

        const PK = `USER#${userId}`;
        const SK = `RATELIMIT#MLS_SOCIAL#${operation}`;

        const existingRecord = await repository.get<RateLimitRecord>(PK, SK);

        const recentRequests = existingRecord?.requests
            ? existingRecord.requests.filter(req => req.timestamp > windowStart)
            : [];

        const remaining = Math.max(0, config.maxRequests - recentRequests.length);

        let resetAt: Date;
        if (recentRequests.length > 0) {
            const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
            resetAt = new Date(oldestRequest + config.windowMs);
        } else {
            resetAt = new Date(now + config.windowMs);
        }

        const allowed = recentRequests.length < config.maxRequests;
        const retryAfter = allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000);

        return {
            allowed,
            remaining,
            resetAt,
            retryAfter,
        };
    } catch (error) {
        console.error('Rate limit status check failed:', error);

        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: new Date(now + config.windowMs),
        };
    }
}

/**
 * Formats a rate limit error message for display to users
 * 
 * @param operation - Operation type that was rate limited
 * @param retryAfter - Seconds until rate limit resets
 * @returns User-friendly error message
 */
export function formatMLSSocialRateLimitError(
    operation: MLSSocialOperation,
    retryAfter: number
): string {
    const config = MLS_SOCIAL_RATE_LIMITS[operation];
    const hours = Math.floor(retryAfter / 3600);
    const minutes = Math.floor((retryAfter % 3600) / 60);
    const seconds = retryAfter % 60;

    let timeString = '';
    if (hours > 0) {
        timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) {
            timeString += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    } else if (minutes > 0) {
        timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        if (seconds > 0) {
            timeString += ` and ${seconds} second${seconds > 1 ? 's' : ''}`;
        }
    } else {
        timeString = `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    const operationNames: Record<MLSSocialOperation, string> = {
        mlsImport: 'MLS imports',
        mlsSync: 'MLS syncs',
        mlsAuth: 'MLS authentication attempts',
        socialPublish: 'social media posts',
        socialAuth: 'social media authentication attempts',
        imageOptimize: 'image optimizations',
        apiRequest: 'API requests',
    };

    const operationName = operationNames[operation];

    return `Rate limit exceeded. You can perform ${config.maxRequests} ${operationName} per ${config.windowMs / 60000} minutes. Please try again in ${timeString}.`;
}

/**
 * Rate limit middleware for server actions
 * Wraps a server action with rate limiting
 * 
 * @param operation - Operation type
 * @param handler - Server action handler
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
    operation: MLSSocialOperation,
    handler: T
): T {
    return (async (...args: any[]) => {
        // Extract userId from first argument (assuming it's always passed)
        const userId = args[0];

        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        // Check rate limit
        const rateLimitResult = await checkMLSSocialRateLimit(userId, operation);

        if (!rateLimitResult.allowed) {
            return {
                success: false,
                error: formatMLSSocialRateLimitError(operation, rateLimitResult.retryAfter || 0),
                rateLimited: true,
                retryAfter: rateLimitResult.retryAfter,
            };
        }

        // Execute handler
        return handler(...args);
    }) as T;
}
