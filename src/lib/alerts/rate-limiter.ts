/**
 * Rate Limiter for Notification System
 * 
 * Implements rate limiting to prevent system overload while allowing
 * critical notifications to bypass limits.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';

export interface RateLimitConfig {
    // User-level limits
    userLimits: {
        perMinute: number;
        perHour: number;
        perDay: number;
    };
    // System-wide limits
    systemLimits: {
        perMinute: number;
        perHour: number;
    };
    // Priority bypass settings
    priorityBypass: {
        critical: boolean;
        high: boolean;
    };
}

export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number; // seconds
    currentCount: number;
    limit: number;
}

export interface RateLimitRecord {
    userId?: string;
    scope: 'user' | 'system';
    window: 'minute' | 'hour' | 'day';
    count: number;
    windowStart: number;
    expiresAt: number;
}

/**
 * Rate Limiter class
 * Implements sliding window rate limiting with priority bypass
 */
export class RateLimiter {
    private repository: DynamoDBRepository;
    private config: RateLimitConfig;

    constructor(config?: Partial<RateLimitConfig>) {
        this.repository = new DynamoDBRepository();
        this.config = {
            userLimits: {
                perMinute: config?.userLimits?.perMinute ?? 10,
                perHour: config?.userLimits?.perHour ?? 100,
                perDay: config?.userLimits?.perDay ?? 500,
            },
            systemLimits: {
                perMinute: config?.systemLimits?.perMinute ?? 1000,
                perHour: config?.systemLimits?.perHour ?? 10000,
            },
            priorityBypass: {
                critical: config?.priorityBypass?.critical ?? true,
                high: config?.priorityBypass?.high ?? false,
            },
        };
    }

    /**
     * Checks if a notification can be sent based on rate limits
     */
    async checkRateLimit(
        userId: string,
        priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    ): Promise<RateLimitResult> {
        // Check if priority bypasses rate limits
        if (this.shouldBypassRateLimit(priority)) {
            return {
                allowed: true,
                currentCount: 0,
                limit: Infinity,
            };
        }

        // Check user-level limits
        const userLimitResult = await this.checkUserLimits(userId);
        if (!userLimitResult.allowed) {
            return userLimitResult;
        }

        // Check system-wide limits
        const systemLimitResult = await this.checkSystemLimits();
        if (!systemLimitResult.allowed) {
            return systemLimitResult;
        }

        return {
            allowed: true,
            currentCount: userLimitResult.currentCount,
            limit: userLimitResult.limit,
        };
    }

    /**
     * Records a notification send for rate limiting
     */
    async recordNotification(userId: string): Promise<void> {
        const now = Date.now();

        // Record for each time window
        await Promise.all([
            this.incrementCounter(userId, 'user', 'minute', now),
            this.incrementCounter(userId, 'user', 'hour', now),
            this.incrementCounter(userId, 'user', 'day', now),
            this.incrementCounter(undefined, 'system', 'minute', now),
            this.incrementCounter(undefined, 'system', 'hour', now),
        ]);
    }

    /**
     * Gets current rate limit status for a user
     */
    async getRateLimitStatus(userId: string): Promise<{
        perMinute: RateLimitResult;
        perHour: RateLimitResult;
        perDay: RateLimitResult;
    }> {
        const [perMinute, perHour, perDay] = await Promise.all([
            this.checkLimit(userId, 'user', 'minute', this.config.userLimits.perMinute),
            this.checkLimit(userId, 'user', 'hour', this.config.userLimits.perHour),
            this.checkLimit(userId, 'user', 'day', this.config.userLimits.perDay),
        ]);

        return { perMinute, perHour, perDay };
    }

    /**
     * Resets rate limits for a user (admin function)
     */
    async resetUserLimits(userId: string): Promise<void> {
        const now = Date.now();
        const windows: Array<'minute' | 'hour' | 'day'> = ['minute', 'hour', 'day'];

        await Promise.all(
            windows.map(window => this.deleteCounter(userId, 'user', window))
        );
    }

    // ==================== Private Methods ====================

    /**
     * Checks if priority should bypass rate limits
     */
    private shouldBypassRateLimit(priority: 'low' | 'medium' | 'high' | 'critical'): boolean {
        if (priority === 'critical' && this.config.priorityBypass.critical) {
            return true;
        }
        if (priority === 'high' && this.config.priorityBypass.high) {
            return true;
        }
        return false;
    }

    /**
     * Checks user-level rate limits
     */
    private async checkUserLimits(userId: string): Promise<RateLimitResult> {
        // Check minute limit first (most restrictive)
        const minuteResult = await this.checkLimit(
            userId,
            'user',
            'minute',
            this.config.userLimits.perMinute
        );
        if (!minuteResult.allowed) {
            return minuteResult;
        }

        // Check hour limit
        const hourResult = await this.checkLimit(
            userId,
            'user',
            'hour',
            this.config.userLimits.perHour
        );
        if (!hourResult.allowed) {
            return hourResult;
        }

        // Check day limit
        const dayResult = await this.checkLimit(
            userId,
            'user',
            'day',
            this.config.userLimits.perDay
        );
        if (!dayResult.allowed) {
            return dayResult;
        }

        return minuteResult;
    }

    /**
     * Checks system-wide rate limits
     */
    private async checkSystemLimits(): Promise<RateLimitResult> {
        // Check minute limit
        const minuteResult = await this.checkLimit(
            undefined,
            'system',
            'minute',
            this.config.systemLimits.perMinute
        );
        if (!minuteResult.allowed) {
            return minuteResult;
        }

        // Check hour limit
        const hourResult = await this.checkLimit(
            undefined,
            'system',
            'hour',
            this.config.systemLimits.perHour
        );
        if (!hourResult.allowed) {
            return hourResult;
        }

        return minuteResult;
    }

    /**
     * Checks a specific rate limit
     */
    private async checkLimit(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day',
        limit: number
    ): Promise<RateLimitResult> {
        const record = await this.getCounter(userId, scope, window);
        const now = Date.now();

        // Check if window has expired
        if (record && record.expiresAt < now) {
            // Window expired, allow the request
            return {
                allowed: true,
                currentCount: 0,
                limit,
            };
        }

        const currentCount = record?.count ?? 0;

        if (currentCount >= limit) {
            const retryAfter = record ? Math.ceil((record.expiresAt - now) / 1000) : 60;
            return {
                allowed: false,
                reason: `Rate limit exceeded for ${scope} ${window} window`,
                retryAfter,
                currentCount,
                limit,
            };
        }

        return {
            allowed: true,
            currentCount,
            limit,
        };
    }

    /**
     * Gets a rate limit counter
     */
    private async getCounter(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day'
    ): Promise<RateLimitRecord | null> {
        const { pk, sk } = this.getCounterKeys(userId, scope, window);

        try {
            return await this.repository.get<RateLimitRecord>(pk, sk);
        } catch (error) {
            return null;
        }
    }

    /**
     * Increments a rate limit counter
     */
    private async incrementCounter(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day',
        timestamp: number
    ): Promise<void> {
        const { pk, sk } = this.getCounterKeys(userId, scope, window);
        const windowStart = this.getWindowStart(timestamp, window);
        const expiresAt = this.getWindowExpiry(windowStart, window);

        try {
            // Try to get existing counter
            const existing = await this.repository.get<RateLimitRecord>(pk, sk);

            if (existing && existing.windowStart === windowStart) {
                // Same window, increment count
                await this.repository.update(pk, sk, {
                    count: existing.count + 1,
                });
            } else {
                // New window, create new counter
                const record: RateLimitRecord = {
                    userId,
                    scope,
                    window,
                    count: 1,
                    windowStart,
                    expiresAt,
                };

                await this.repository.put({
                    PK: pk,
                    SK: sk,
                    EntityType: 'RateLimitCounter',
                    Data: record,
                    CreatedAt: timestamp,
                    UpdatedAt: timestamp,
                    // Set TTL for automatic cleanup
                    TTL: Math.floor(expiresAt / 1000),
                });
            }
        } catch (error) {
            console.error('Failed to increment rate limit counter:', error);
            // Don't throw - rate limiting failures shouldn't block notifications
        }
    }

    /**
     * Deletes a rate limit counter
     */
    private async deleteCounter(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day'
    ): Promise<void> {
        const { pk, sk } = this.getCounterKeys(userId, scope, window);

        try {
            await this.repository.delete(pk, sk);
        } catch (error) {
            console.error('Failed to delete rate limit counter:', error);
        }
    }

    /**
     * Gets DynamoDB keys for a counter
     */
    private getCounterKeys(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day'
    ): { pk: string; sk: string } {
        if (scope === 'user' && userId) {
            return {
                pk: `USER#${userId}`,
                sk: `RATE_LIMIT#${window.toUpperCase()}`,
            };
        } else {
            return {
                pk: 'SYSTEM',
                sk: `RATE_LIMIT#${window.toUpperCase()}`,
            };
        }
    }

    /**
     * Gets the start of the current window
     */
    private getWindowStart(timestamp: number, window: 'minute' | 'hour' | 'day'): number {
        const date = new Date(timestamp);

        switch (window) {
            case 'minute':
                date.setSeconds(0, 0);
                return date.getTime();
            case 'hour':
                date.setMinutes(0, 0, 0);
                return date.getTime();
            case 'day':
                date.setHours(0, 0, 0, 0);
                return date.getTime();
        }
    }

    /**
     * Gets the expiry time for a window
     */
    private getWindowExpiry(windowStart: number, window: 'minute' | 'hour' | 'day'): number {
        switch (window) {
            case 'minute':
                return windowStart + 60 * 1000;
            case 'hour':
                return windowStart + 60 * 60 * 1000;
            case 'day':
                return windowStart + 24 * 60 * 60 * 1000;
        }
    }
}

// Export singleton instance with default config
export const rateLimiter = new RateLimiter();

// Export factory function for custom config
export const createRateLimiter = (config?: Partial<RateLimitConfig>) => {
    return new RateLimiter(config);
};
