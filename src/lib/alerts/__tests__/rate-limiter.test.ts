/**
 * Rate Limiter Tests
 * 
 * Basic tests to verify rate limiting functionality
 */

import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
    describe('Priority Bypass', () => {
        it('should allow critical priority to bypass rate limits', async () => {
            const limiter = new RateLimiter({
                userLimits: { perMinute: 1, perHour: 1, perDay: 1 },
                priorityBypass: { critical: true, high: false },
            });

            // First request should be allowed
            const result1 = await limiter.checkRateLimit('user1', 'critical');
            expect(result1.allowed).toBe(true);

            // Second critical request should also be allowed (bypass)
            const result2 = await limiter.checkRateLimit('user1', 'critical');
            expect(result2.allowed).toBe(true);
        });

        it('should not allow medium priority to bypass rate limits', async () => {
            const limiter = new RateLimiter({
                userLimits: { perMinute: 1, perHour: 1, perDay: 1 },
                priorityBypass: { critical: true, high: false },
            });

            // First request should be allowed
            const result1 = await limiter.checkRateLimit('user1', 'medium');
            expect(result1.allowed).toBe(true);

            // Record the notification
            await limiter.recordNotification('user1');

            // Second medium request should be blocked
            const result2 = await limiter.checkRateLimit('user1', 'medium');
            expect(result2.allowed).toBe(false);
            expect(result2.reason).toContain('Rate limit exceeded');
        });
    });

    describe('Rate Limit Status', () => {
        it('should return current rate limit status', async () => {
            const limiter = new RateLimiter({
                userLimits: { perMinute: 10, perHour: 100, perDay: 500 },
            });

            const status = await limiter.getRateLimitStatus('user1');

            expect(status.perMinute).toBeDefined();
            expect(status.perHour).toBeDefined();
            expect(status.perDay).toBeDefined();
            expect(status.perMinute.limit).toBe(10);
            expect(status.perHour.limit).toBe(100);
            expect(status.perDay.limit).toBe(500);
        });
    });
});
