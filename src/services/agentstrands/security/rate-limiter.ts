/**
 * AgentStrands Rate Limiting Service
 * 
 * Provides rate limiting for strand operations to prevent abuse and ensure
 * fair resource allocation across users and strands.
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-strand rate limiting
 * - Sliding window algorithm
 * - Configurable limits by operation type
 * - Automatic cleanup of expired entries
 * 
 * Validates: Security Requirements from design.md
 */

// ============================================================================
// Rate Limit Configuration
// ============================================================================

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyPrefix: string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
}

/**
 * Rate limit configurations for different operation types
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    // Task execution limits
    taskExecution: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        keyPrefix: 'task_exec',
    },

    // Feedback submission limits
    feedbackSubmission: {
        maxRequests: 50,
        windowMs: 60000, // 1 minute
        keyPrefix: 'feedback',
    },

    // Memory operations limits
    memoryOperation: {
        maxRequests: 200,
        windowMs: 60000, // 1 minute
        keyPrefix: 'memory',
    },

    // Handoff operations limits
    handoffOperation: {
        maxRequests: 50,
        windowMs: 60000, // 1 minute
        keyPrefix: 'handoff',
    },

    // Opportunity detection limits
    opportunityDetection: {
        maxRequests: 20,
        windowMs: 300000, // 5 minutes
        keyPrefix: 'opportunity',
    },

    // Analytics query limits
    analyticsQuery: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        keyPrefix: 'analytics',
    },

    // Quality assurance limits
    qualityCheck: {
        maxRequests: 50,
        windowMs: 60000, // 1 minute
        keyPrefix: 'quality',
    },

    // Strand creation limits
    strandCreation: {
        maxRequests: 10,
        windowMs: 3600000, // 1 hour
        keyPrefix: 'strand_create',
    },
};

// ============================================================================
// Rate Limiter Class
// ============================================================================

interface RequestRecord {
    timestamp: number;
    count: number;
}

export class AgentStrandsRateLimiter {
    private requestCounts: Map<string, RequestRecord[]> = new Map();
    private lastRequestTimes: Map<string, number> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start cleanup interval to remove expired entries
        this.startCleanup();
    }

    /**
     * Check if a request is allowed under rate limits
     */
    async checkRateLimit(
        userId: string,
        operationType: keyof typeof RATE_LIMIT_CONFIGS,
        identifier?: string
    ): Promise<RateLimitResult> {
        const config = RATE_LIMIT_CONFIGS[operationType];
        if (!config) {
            throw new Error(`Unknown operation type: ${operationType}`);
        }

        const key = this.buildKey(config.keyPrefix, userId, identifier);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Get or initialize request records
        let records = this.requestCounts.get(key) || [];

        // Remove expired records
        records = records.filter(record => record.timestamp > windowStart);

        // Calculate current request count
        const currentCount = records.reduce((sum, record) => sum + record.count, 0);

        // Check if limit exceeded
        if (currentCount >= config.maxRequests) {
            const oldestRecord = records[0];
            const resetTime = new Date(oldestRecord.timestamp + config.windowMs);
            const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

            return {
                allowed: false,
                remaining: 0,
                resetTime,
                retryAfter,
            };
        }

        // Add new record
        records.push({
            timestamp: now,
            count: 1,
        });

        this.requestCounts.set(key, records);

        return {
            allowed: true,
            remaining: config.maxRequests - currentCount - 1,
            resetTime: new Date(now + config.windowMs),
        };
    }

    /**
     * Record a request (for tracking purposes)
     */
    async recordRequest(
        userId: string,
        operationType: keyof typeof RATE_LIMIT_CONFIGS,
        identifier?: string
    ): Promise<void> {
        await this.checkRateLimit(userId, operationType, identifier);
    }

    /**
     * Get current rate limit status
     */
    async getRateLimitStatus(
        userId: string,
        operationType: keyof typeof RATE_LIMIT_CONFIGS,
        identifier?: string
    ): Promise<{
        limit: number;
        remaining: number;
        resetTime: Date;
        windowMs: number;
    }> {
        const config = RATE_LIMIT_CONFIGS[operationType];
        const key = this.buildKey(config.keyPrefix, userId, identifier);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Get current records
        let records = this.requestCounts.get(key) || [];
        records = records.filter(record => record.timestamp > windowStart);

        const currentCount = records.reduce((sum, record) => sum + record.count, 0);
        const remaining = Math.max(0, config.maxRequests - currentCount);

        const oldestRecord = records[0];
        const resetTime = oldestRecord
            ? new Date(oldestRecord.timestamp + config.windowMs)
            : new Date(now + config.windowMs);

        return {
            limit: config.maxRequests,
            remaining,
            resetTime,
            windowMs: config.windowMs,
        };
    }

    /**
     * Reset rate limits for a specific key (admin function)
     */
    async resetRateLimit(
        userId: string,
        operationType: keyof typeof RATE_LIMIT_CONFIGS,
        identifier?: string
    ): Promise<void> {
        const config = RATE_LIMIT_CONFIGS[operationType];
        const key = this.buildKey(config.keyPrefix, userId, identifier);
        this.requestCounts.delete(key);
    }

    /**
     * Get all rate limit statuses for a user
     */
    async getAllRateLimitStatuses(userId: string): Promise<
        Record<string, {
            limit: number;
            remaining: number;
            resetTime: Date;
            windowMs: number;
        }>
    > {
        const statuses: Record<string, any> = {};

        for (const operationType of Object.keys(RATE_LIMIT_CONFIGS)) {
            statuses[operationType] = await this.getRateLimitStatus(
                userId,
                operationType as keyof typeof RATE_LIMIT_CONFIGS
            );
        }

        return statuses;
    }

    /**
     * Build cache key
     */
    private buildKey(prefix: string, userId: string, identifier?: string): string {
        return identifier ? `${prefix}:${userId}:${identifier}` : `${prefix}:${userId}`;
    }

    /**
     * Start cleanup interval to remove expired entries
     */
    private startCleanup(): void {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [key, records] of this.requestCounts.entries()) {
            // Find the longest window duration
            const maxWindow = Math.max(
                ...Object.values(RATE_LIMIT_CONFIGS).map(c => c.windowMs)
            );

            // Filter out records older than the longest window
            const validRecords = records.filter(
                record => record.timestamp > now - maxWindow
            );

            if (validRecords.length === 0) {
                this.requestCounts.delete(key);
            } else {
                this.requestCounts.set(key, validRecords);
            }
        }
    }

    /**
     * Clear all rate limits (for testing)
     */
    clearRateLimits(): void {
        this.requestCounts.clear();
        this.lastRequestTimes.clear();
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// ============================================================================
// Global Instance
// ============================================================================

export const rateLimiter = new AgentStrandsRateLimiter();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check rate limit for task execution
 */
export async function checkTaskExecutionLimit(
    userId: string,
    strandId?: string
): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(userId, 'taskExecution', strandId);
}

/**
 * Check rate limit for feedback submission
 */
export async function checkFeedbackLimit(
    userId: string
): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(userId, 'feedbackSubmission');
}

/**
 * Check rate limit for memory operations
 */
export async function checkMemoryOperationLimit(
    userId: string,
    strandId?: string
): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(userId, 'memoryOperation', strandId);
}

/**
 * Check rate limit for opportunity detection
 */
export async function checkOpportunityDetectionLimit(
    userId: string
): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(userId, 'opportunityDetection');
}

/**
 * Check rate limit for quality checks
 */
export async function checkQualityCheckLimit(
    userId: string
): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(userId, 'qualityCheck');
}

/**
 * Middleware function to enforce rate limits
 */
export async function enforceRateLimit(
    userId: string,
    operationType: keyof typeof RATE_LIMIT_CONFIGS,
    identifier?: string
): Promise<void> {
    const result = await rateLimiter.checkRateLimit(userId, operationType, identifier);

    if (!result.allowed) {
        const error = new Error(
            `Rate limit exceeded for ${operationType}. Try again in ${result.retryAfter} seconds.`
        ) as any;
        error.statusCode = 429;
        error.retryAfter = result.retryAfter;
        error.resetTime = result.resetTime;
        throw error;
    }
}
