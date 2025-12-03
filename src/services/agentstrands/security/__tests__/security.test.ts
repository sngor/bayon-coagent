/**
 * AgentStrands Security Module Tests
 * 
 * Tests for input validation, rate limiting, encryption, and audit logging.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
    validateTaskInput,
    validateStrandConfig,
    sanitizeContent,
    detectPII,
    maskPII,
    hash,
    hashWithSalt,
    verifyHash,
    generateSecureToken,
    rateLimiter,
    RATE_LIMIT_CONFIGS,
} from '../index';

describe('Input Validation', () => {
    describe('validateTaskInput', () => {
        it('should validate valid task input', () => {
            const validInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                strandId: '123e4567-e89b-12d3-a456-426614174001',
                type: 'analysis',
                description: 'Test task description',
                input: { key: 'value' },
                dependencies: [],
                priority: 'normal' as const,
                createdAt: new Date().toISOString(),
            };

            expect(() => validateTaskInput(validInput)).not.toThrow();
        });

        it('should reject invalid UUID format', () => {
            const invalidInput = {
                id: 'invalid-uuid',
                strandId: '123e4567-e89b-12d3-a456-426614174001',
                type: 'analysis',
                description: 'Test',
                input: {},
                dependencies: [],
                createdAt: new Date().toISOString(),
            };

            expect(() => validateTaskInput(invalidInput)).toThrow();
        });

        it('should reject description that is too long', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                strandId: '123e4567-e89b-12d3-a456-426614174001',
                type: 'analysis',
                description: 'x'.repeat(5001), // Exceeds 5000 char limit
                input: {},
                dependencies: [],
                createdAt: new Date().toISOString(),
            };

            expect(() => validateTaskInput(invalidInput)).toThrow();
        });

        it('should reject too many dependencies', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                strandId: '123e4567-e89b-12d3-a456-426614174001',
                type: 'analysis',
                description: 'Test',
                input: {},
                dependencies: Array(21).fill('123e4567-e89b-12d3-a456-426614174000'), // Exceeds 20 limit
                createdAt: new Date().toISOString(),
            };

            expect(() => validateTaskInput(invalidInput)).toThrow();
        });
    });

    describe('validateStrandConfig', () => {
        it('should validate valid strand config', () => {
            const validConfig = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'data-analyst' as const,
                userId: 'user123',
                capabilities: ['analyze', 'report'],
            };

            expect(() => validateStrandConfig(validConfig)).not.toThrow();
        });

        it('should reject invalid strand type', () => {
            const invalidConfig = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'invalid-type',
                userId: 'user123',
                capabilities: [],
            };

            expect(() => validateStrandConfig(invalidConfig)).toThrow();
        });
    });
});

describe('Content Sanitization', () => {
    it('should remove script tags', () => {
        const malicious = '<script>alert("xss")</script>Hello';
        const sanitized = sanitizeContent(malicious);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).toContain('Hello');
    });

    it('should remove iframe tags', () => {
        const malicious = '<iframe src="evil.com"></iframe>Content';
        const sanitized = sanitizeContent(malicious);

        expect(sanitized).not.toContain('<iframe>');
        expect(sanitized).toContain('Content');
    });

    it('should remove event handlers', () => {
        const malicious = '<div onclick="alert(1)">Click me</div>';
        const sanitized = sanitizeContent(malicious);

        expect(sanitized).not.toContain('onclick');
    });

    it('should truncate very long content', () => {
        const longContent = 'x'.repeat(200000);
        const sanitized = sanitizeContent(longContent);

        expect(sanitized.length).toBeLessThanOrEqual(100000);
    });
});

describe('PII Detection and Masking', () => {
    it('should detect email addresses', () => {
        const text = 'Contact me at john@example.com';
        const result = detectPII(text);

        expect(result.hasPII).toBe(true);
        expect(result.types).toContain('email');
    });

    it('should detect phone numbers', () => {
        const text = 'Call me at 555-123-4567';
        const result = detectPII(text);

        expect(result.hasPII).toBe(true);
        expect(result.types).toContain('phone');
    });

    it('should detect SSN', () => {
        const text = 'SSN: 123-45-6789';
        const result = detectPII(text);

        expect(result.hasPII).toBe(true);
        expect(result.types).toContain('ssn');
    });

    it('should mask email addresses', () => {
        const text = 'Email: john@example.com';
        const masked = maskPII(text);

        expect(masked).not.toContain('john@example.com');
        expect(masked).toContain('[EMAIL]');
    });

    it('should mask phone numbers', () => {
        const text = 'Phone: 555-123-4567';
        const masked = maskPII(text);

        expect(masked).not.toContain('555-123-4567');
        expect(masked).toContain('[PHONE]');
    });
});

describe('Hashing', () => {
    it('should create consistent hashes', () => {
        const data = 'test data';
        const hash1 = hash(data);
        const hash2 = hash(data);

        expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different data', () => {
        const hash1 = hash('data1');
        const hash2 = hash('data2');

        expect(hash1).not.toBe(hash2);
    });

    it('should hash with salt', () => {
        const data = 'password';
        const { hash: hash1, salt } = hashWithSalt(data);
        const { hash: hash2 } = hashWithSalt(data, salt);

        expect(hash1).toBe(hash2);
    });

    it('should verify hash correctly', () => {
        const data = 'password';
        const { hash: hashed, salt } = hashWithSalt(data);

        expect(verifyHash(data, hashed, salt)).toBe(true);
        expect(verifyHash('wrong', hashed, salt)).toBe(false);
    });
});

describe('Token Generation', () => {
    it('should generate secure tokens', () => {
        const token1 = generateSecureToken();
        const token2 = generateSecureToken();

        expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(token2).toHaveLength(64);
        expect(token1).not.toBe(token2);
    });

    it('should generate tokens of specified length', () => {
        const token = generateSecureToken(16);

        expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });
});

describe('Rate Limiting', () => {
    beforeEach(() => {
        // Clear rate limits before each test
        rateLimiter.clearRateLimits();
    });

    afterEach(() => {
        rateLimiter.clearRateLimits();
    });

    it('should allow requests within limit', async () => {
        const userId = 'test-user';

        const result = await rateLimiter.checkRateLimit(userId, 'taskExecution');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeLessThan(RATE_LIMIT_CONFIGS.taskExecution.maxRequests);
    });

    it('should block requests exceeding limit', async () => {
        const userId = 'test-user';
        const config = RATE_LIMIT_CONFIGS.taskExecution;

        // Make requests up to the limit
        for (let i = 0; i < config.maxRequests; i++) {
            await rateLimiter.checkRateLimit(userId, 'taskExecution');
        }

        // Next request should be blocked
        const result = await rateLimiter.checkRateLimit(userId, 'taskExecution');

        expect(result.allowed).toBe(false);
        expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different users separately', async () => {
        const user1 = 'user1';
        const user2 = 'user2';

        const result1 = await rateLimiter.checkRateLimit(user1, 'taskExecution');
        const result2 = await rateLimiter.checkRateLimit(user2, 'taskExecution');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
    });

    it('should track different operation types separately', async () => {
        const userId = 'test-user';

        const result1 = await rateLimiter.checkRateLimit(userId, 'taskExecution');
        const result2 = await rateLimiter.checkRateLimit(userId, 'feedbackSubmission');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
    });

    it('should reset rate limit', async () => {
        const userId = 'test-user';

        // Use up some requests
        await rateLimiter.checkRateLimit(userId, 'taskExecution');
        await rateLimiter.checkRateLimit(userId, 'taskExecution');

        // Reset
        await rateLimiter.resetRateLimit(userId, 'taskExecution');

        // Should have full limit again
        const status = await rateLimiter.getRateLimitStatus(userId, 'taskExecution');
        expect(status.remaining).toBe(RATE_LIMIT_CONFIGS.taskExecution.maxRequests);
    });

    it('should get all rate limit statuses', async () => {
        const userId = 'test-user';

        const statuses = await rateLimiter.getAllRateLimitStatuses(userId);

        expect(statuses).toHaveProperty('taskExecution');
        expect(statuses).toHaveProperty('feedbackSubmission');
        expect(statuses).toHaveProperty('memoryOperation');
    });
});

describe('Security Configuration', () => {
    it('should have valid rate limit configs', () => {
        for (const [key, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
            expect(config.maxRequests).toBeGreaterThan(0);
            expect(config.windowMs).toBeGreaterThan(0);
            expect(config.keyPrefix).toBeTruthy();
        }
    });
});
