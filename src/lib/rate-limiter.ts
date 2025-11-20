/**
 * Rate Limiter for Reimagine Image Toolkit
 * 
 * Implements sliding window rate limiting using DynamoDB for distributed state.
 * Tracks upload and edit operations per user with configurable limits.
 * 
 * Requirements: Security considerations
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
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  upload: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  edit: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Checks if a user has exceeded the rate limit for an operation
 * 
 * Uses a sliding window algorithm:
 * 1. Retrieves existing request history from DynamoDB
 * 2. Filters out requests outside the time window
 * 3. Checks if adding a new request would exceed the limit
 * 4. Updates the request history if allowed
 * 
 * @param userId - User ID to check rate limit for
 * @param operation - Operation type ('upload' or 'edit')
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  userId: string,
  operation: 'upload' | 'edit'
): Promise<RateLimitResult> {
  // Bypass rate limiting in local development
  if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AWS !== 'true') {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
    };
  }

  const config = RATE_LIMITS[operation];
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const repository = getRepository();
    
    // Generate DynamoDB keys for rate limit record
    const PK = `USER#${userId}`;
    const SK = `RATELIMIT#${operation}`;

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
    // This prevents rate limiting from blocking legitimate requests due to infrastructure issues
    return {
      allowed: true,
      remaining: RATE_LIMITS[operation].maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }
}

/**
 * Gets the current rate limit status for a user without incrementing the counter
 * 
 * @param userId - User ID to check
 * @param operation - Operation type ('upload' or 'edit')
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  userId: string,
  operation: 'upload' | 'edit'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[operation];
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const repository = getRepository();
    
    // Generate DynamoDB keys for rate limit record
    const PK = `USER#${userId}`;
    const SK = `RATELIMIT#${operation}`;

    // Get existing rate limit record
    const existingRecord = await repository.get<RateLimitRecord>(PK, SK);

    // Filter requests within the current time window
    const recentRequests = existingRecord?.requests
      ? existingRecord.requests.filter(req => req.timestamp > windowStart)
      : [];

    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - recentRequests.length);

    // Calculate reset time
    let resetAt: Date;
    if (recentRequests.length > 0) {
      const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
      resetAt = new Date(oldestRequest + config.windowMs);
    } else {
      resetAt = new Date(now + config.windowMs);
    }

    // Check if more requests are allowed
    const allowed = recentRequests.length < config.maxRequests;

    // Calculate retry after in seconds
    const retryAfter = allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter,
    };
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    
    // On error, return optimistic status
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
export function formatRateLimitError(
  operation: 'upload' | 'edit',
  retryAfter: number
): string {
  const config = RATE_LIMITS[operation];
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

  const operationName = operation === 'upload' ? 'image uploads' : 'edit operations';
  
  return `Rate limit exceeded. You can perform ${config.maxRequests} ${operationName} per hour. Please try again in ${timeString}.`;
}
