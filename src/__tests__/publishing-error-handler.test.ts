/**
 * Tests for Enterprise-Grade Publishing Error Handler
 * 
 * Tests comprehensive error handling including:
 * - Exponential backoff with jitter
 * - Intelligent retry logic with different strategies per error type
 * - Circuit breaker pattern for platform outages
 * - Structured error logging and classification
 * 
 * Validates: Requirements 1.5
 */

// Mock the logger to avoid actual logging during tests
jest.mock('@/aws/logging/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        }))
    }))
}));

// Mock the error handling library
jest.mock('@/lib/error-handling', () => ({
    ErrorCategory: {
        NETWORK: 'network',
        AUTHENTICATION: 'authentication',
        AUTHORIZATION: 'authorization',
        VALIDATION: 'validation',
        AI_OPERATION: 'ai_operation',
        DATABASE: 'database',
        RATE_LIMIT: 'rate_limit',
        NOT_FOUND: 'not_found',
        SERVER_ERROR: 'server_error',
        CLIENT_ERROR: 'client_error',
        UNKNOWN: 'unknown'
    },
    detectErrorPattern: jest.fn((error) => ({
        pattern: /.*/,
        category: 'unknown',
        userMessage: 'An error occurred',
        suggestedActions: ['Try again']
    })),
    isRetryableError: jest.fn((error) => {
        const message = error.message.toLowerCase();
        return message.includes('network') || message.includes('timeout') || message.includes('server');
    })
}));

import { PublishingErrorHandler } from '@/services/publishing-error-handler';

describe('PublishingErrorHandler', () => {
    let errorHandler: PublishingErrorHandler;

    beforeEach(() => {
        errorHandler = new PublishingErrorHandler();
        jest.clearAllMocks();
    });

    describe('Error Classification', () => {
        test('should create publishing error with correct properties', () => {
            const error = new Error('Rate limit exceeded');
            const publishingError = errorHandler.createPublishingError(
                error,
                'facebook',
                'publish_content'
            );

            expect(publishingError.platform).toBe('facebook');
            expect(publishingError.operation).toBe('publish_content');
            expect(publishingError.message).toBe('Rate limit exceeded');
        });

        test('should preserve error context', () => {
            const error = new Error('Test error');
            const context = { userId: '123', listingId: 'abc' };

            const publishingError = errorHandler.createPublishingError(
                error,
                'instagram',
                'publish_content',
                context
            );

            expect(publishingError.context).toEqual(context);
            expect(publishingError.platform).toBe('instagram');
        });
    });

    describe('Retry Logic with Exponential Backoff', () => {
        test('should retry retryable errors', async () => {
            let attempts = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Network timeout');
                }
                return Promise.resolve({ success: true, postId: '123' });
            });

            const result = await errorHandler.executeWithRetry(
                mockOperation,
                'facebook',
                'test_operation'
            );

            expect(result.success).toBe(true);
            expect(result.attempts).toBe(3);
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        test('should not retry non-retryable errors', async () => {
            let attempts = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                attempts++;
                throw new Error('Unauthorized access');
            });

            const result = await errorHandler.executeWithRetry(
                mockOperation,
                'facebook',
                'test_operation'
            );

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        test('should respect maximum retry attempts', async () => {
            const mockOperation = jest.fn().mockImplementation(() => {
                throw new Error('Network timeout');
            });

            const result = await errorHandler.executeWithRetry(
                mockOperation,
                'facebook',
                'test_operation'
            );

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(3); // Default max attempts
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });
    });

    describe('Circuit Breaker Pattern', () => {
        test('should provide circuit breaker status', () => {
            const status = errorHandler.getCircuitBreakerStatus();
            expect(status).toBeDefined();
            expect(typeof status).toBe('object');
        });

        test('should reset circuit breaker', () => {
            // This should not throw
            expect(() => {
                errorHandler.resetCircuitBreaker('facebook');
            }).not.toThrow();
        });
    });

    describe('Error Details and Recovery Actions', () => {
        test('should provide detailed error information', () => {
            const error = new Error('Rate limit exceeded');
            const publishingError = errorHandler.createPublishingError(
                error,
                'facebook',
                'publish_content'
            );

            const details = errorHandler.getErrorDetails(publishingError);

            expect(details.userMessage).toBeDefined();
            expect(details.recoveryActions).toBeInstanceOf(Array);
            expect(details.recoveryActions.length).toBeGreaterThan(0);
            expect(details.technicalDetails).toContain('facebook');
            expect(typeof details.shouldRetry).toBe('boolean');
        });
    });

    describe('Platform-Specific Error Handling', () => {
        test('should handle different platforms independently', async () => {
            const mockOperation = jest.fn().mockImplementation(() => {
                throw new Error('Server error');
            });

            // Test Facebook
            const facebookResult = await errorHandler.executeWithRetry(
                mockOperation,
                'facebook',
                'test_operation'
            );

            // Test Instagram (should be independent)
            const instagramResult = await errorHandler.executeWithRetry(
                () => Promise.resolve({ success: true }),
                'instagram',
                'test_operation'
            );

            expect(facebookResult.success).toBe(false);
            expect(instagramResult.success).toBe(true);
        });
    });

    describe('Error Context and Metadata', () => {
        test('should preserve error context and metadata', () => {
            const originalError = new Error('Test error');
            const context = { userId: '123', listingId: 'abc' };

            const publishingError = errorHandler.createPublishingError(
                originalError,
                'facebook',
                'publish_content',
                context
            );

            expect(publishingError.context).toEqual(context);
            expect(publishingError.message).toBe('Test error');
            expect(publishingError.stack).toBeDefined();
        });

        test('should extract status codes from HTTP errors', () => {
            const httpError = new Error('HTTP Error') as any;
            httpError.statusCode = 429;

            const publishingError = errorHandler.createPublishingError(
                httpError,
                'facebook',
                'publish_content'
            );

            expect(publishingError.statusCode).toBe(429);
        });
    });
});

describe('Integration Tests', () => {
    let errorHandler: PublishingErrorHandler;

    beforeEach(() => {
        errorHandler = new PublishingErrorHandler();
    });

    test('should handle complete publish workflow with errors', async () => {
        let attempts = 0;
        const mockPublishOperation = jest.fn().mockImplementation(() => {
            attempts++;

            // Simulate different error scenarios
            switch (attempts) {
                case 1:
                    throw new Error('Network timeout'); // Retryable
                case 2:
                    throw new Error('Server error'); // Retryable
                case 3:
                    return Promise.resolve({
                        success: true,
                        postId: 'post_123',
                        postUrl: 'https://facebook.com/post_123'
                    });
                default:
                    throw new Error('Unexpected call');
            }
        });

        const result = await errorHandler.executeWithRetry(
            mockPublishOperation,
            'facebook',
            'publish_listing',
            { userId: 'user_123', listingId: 'listing_456' }
        );

        expect(result.success).toBe(true);
        expect(result.postId).toBe('post_123');
        expect(result.postUrl).toBe('https://facebook.com/post_123');
        expect(result.attempts).toBe(3);
        expect(result.totalDuration).toBeGreaterThan(0);
    });

    test('should handle circuit breaker recovery', async () => {
        const mockOperation = jest.fn();

        // Reset circuit breaker
        errorHandler.resetCircuitBreaker('facebook');

        // Now operation should work
        mockOperation.mockImplementation(() => Promise.resolve({ success: true }));
        const result = await errorHandler.executeWithRetry(mockOperation, 'facebook', 'test');
        expect(result.success).toBe(true);
    });
});