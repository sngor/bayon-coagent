/**
 * Error Handler Tests
 * 
 * Tests for the error handling and retry logic system.
 */

import './setup';

import {
    ErrorHandler,
    MLSSocialError,
    ErrorCategory,
    ErrorSeverity,
    handleError,
    withRetry,
    withGracefulDegradation,
} from '../error-handler';

describe('ErrorHandler', () => {
    let handler: ErrorHandler;

    beforeEach(() => {
        handler = new ErrorHandler();
        // Suppress console output during tests
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Error Classification', () => {
        it('should classify authentication errors', () => {
            const error = new Error('Authentication failed: Invalid credentials');
            const enhanced = handler.handle(error, 'authenticate');

            expect(enhanced.category).toBe(ErrorCategory.AUTHENTICATION);
            expect(enhanced.severity).toBe(ErrorSeverity.HIGH);
            expect(enhanced.retryable).toBe(false);
            expect(enhanced.userMessage).toContain('check your credentials');
        });

        it('should classify OAuth errors', () => {
            const error = new Error('OAuth token expired');
            const enhanced = handler.handle(error, 'oauthConnect');

            expect(enhanced.category).toBe(ErrorCategory.AUTHENTICATION);
            expect(enhanced.severity).toBe(ErrorSeverity.HIGH);
            expect(enhanced.userMessage).toContain('reconnect your account');
        });

        it('should classify rate limit errors', () => {
            const error = new Error('Rate limit exceeded');
            const enhanced = handler.handle(error, 'apiCall');

            expect(enhanced.category).toBe(ErrorCategory.RATE_LIMIT);
            expect(enhanced.severity).toBe(ErrorSeverity.MEDIUM);
            expect(enhanced.retryable).toBe(true);
            expect(enhanced.userMessage).toContain('rate limit');
        });

        it('should classify network errors', () => {
            const error = new Error('Network error: ECONNREFUSED');
            const enhanced = handler.handle(error, 'fetchData');

            expect(enhanced.category).toBe(ErrorCategory.NETWORK);
            expect(enhanced.severity).toBe(ErrorSeverity.MEDIUM);
            expect(enhanced.retryable).toBe(true);
            expect(enhanced.userMessage).toContain('network connection');
        });

        it('should classify timeout errors', () => {
            const error = new Error('Request timed out');
            const enhanced = handler.handle(error, 'longOperation');

            expect(enhanced.category).toBe(ErrorCategory.TIMEOUT);
            expect(enhanced.severity).toBe(ErrorSeverity.MEDIUM);
            expect(enhanced.retryable).toBe(true);
        });

        it('should classify validation errors', () => {
            const error = new Error('Validation failed: required field missing');
            const enhanced = handler.handle(error, 'validateInput');

            expect(enhanced.category).toBe(ErrorCategory.VALIDATION);
            expect(enhanced.severity).toBe(ErrorSeverity.LOW);
            expect(enhanced.retryable).toBe(false);
        });

        it('should classify external API errors', () => {
            const error = new Error('Facebook API error: Invalid request');
            const enhanced = handler.handle(error, 'publishToFacebook');

            expect(enhanced.category).toBe(ErrorCategory.EXTERNAL_API);
            expect(enhanced.severity).toBe(ErrorSeverity.MEDIUM);
            expect(enhanced.retryable).toBe(true);
        });

        it('should default to internal error for unknown errors', () => {
            const error = new Error('Something went wrong');
            const enhanced = handler.handle(error, 'unknownOperation');

            expect(enhanced.category).toBe(ErrorCategory.INTERNAL);
            expect(enhanced.severity).toBe(ErrorSeverity.HIGH);
            expect(enhanced.retryable).toBe(true);
        });
    });

    describe('Retry Logic', () => {
        it('should retry on retryable errors', async () => {
            let attempts = 0;
            const operation = jest.fn(async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Network error');
                }
                return 'success';
            });

            const result = await handler.withRetry(
                operation,
                'testOperation',
                { maxAttempts: 3, baseDelay: 10 }
            );

            expect(result).toBe('success');
            expect(attempts).toBe(3);
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should not retry on non-retryable errors', async () => {
            let attempts = 0;
            const operation = jest.fn(async () => {
                attempts++;
                throw new Error('Authentication failed');
            });

            await expect(
                handler.withRetry(
                    operation,
                    'testOperation',
                    { maxAttempts: 3, baseDelay: 10 }
                )
            ).rejects.toThrow();

            expect(attempts).toBe(1);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should respect maxAttempts', async () => {
            let attempts = 0;
            const operation = jest.fn(async () => {
                attempts++;
                throw new Error('Network error');
            });

            await expect(
                handler.withRetry(
                    operation,
                    'testOperation',
                    { maxAttempts: 2, baseDelay: 10 }
                )
            ).rejects.toThrow();

            expect(attempts).toBe(2);
        });

        it('should use exponential backoff', async () => {
            const delays: number[] = [];
            let attempts = 0;

            const operation = jest.fn(async () => {
                attempts++;
                if (attempts < 4) {
                    throw new Error('Network error');
                }
                return 'success';
            });

            // Mock sleep to capture delays
            const originalSleep = (handler as any).sleep;
            (handler as any).sleep = jest.fn(async (ms: number) => {
                delays.push(ms);
                return originalSleep.call(handler, 1); // Use minimal delay for test
            });

            await handler.withRetry(
                operation,
                'testOperation',
                {
                    maxAttempts: 4,
                    baseDelay: 100,
                    exponential: true,
                    jitter: false,
                }
            );

            // Verify exponential backoff: 100, 200, 400
            expect(delays[0]).toBe(100);
            expect(delays[1]).toBe(200);
            expect(delays[2]).toBe(400);
        });

        it('should add jitter when enabled', async () => {
            const delays: number[] = [];
            let attempts = 0;

            const operation = jest.fn(async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Network error');
                }
                return 'success';
            });

            // Mock sleep to capture delays
            const originalSleep = (handler as any).sleep;
            (handler as any).sleep = jest.fn(async (ms: number) => {
                delays.push(ms);
                return originalSleep.call(handler, 1);
            });

            await handler.withRetry(
                operation,
                'testOperation',
                {
                    maxAttempts: 3,
                    baseDelay: 100,
                    exponential: true,
                    jitter: true,
                }
            );

            // Verify jitter is added (delays should be slightly different from base)
            expect(delays[0]).toBeGreaterThanOrEqual(100);
            expect(delays[0]).toBeLessThanOrEqual(125); // 100 + 25% jitter
        });

        it('should respect maxDelay', async () => {
            const delays: number[] = [];
            let attempts = 0;

            const operation = jest.fn(async () => {
                attempts++;
                if (attempts < 5) {
                    throw new Error('Network error');
                }
                return 'success';
            });

            const originalSleep = (handler as any).sleep;
            (handler as any).sleep = jest.fn(async (ms: number) => {
                delays.push(ms);
                return originalSleep.call(handler, 1);
            });

            await handler.withRetry(
                operation,
                'testOperation',
                {
                    maxAttempts: 5,
                    baseDelay: 100,
                    maxDelay: 300,
                    exponential: true,
                    jitter: false,
                }
            );

            // Verify delays are capped at maxDelay
            // Expected: 100, 200, 300, 300 (capped)
            expect(delays[0]).toBe(100);
            expect(delays[1]).toBe(200);
            expect(delays[2]).toBe(300);
            expect(delays[3]).toBe(300);
        });
    });

    describe('Graceful Degradation', () => {
        it('should return fallback on error', async () => {
            const operation = jest.fn(async () => {
                throw new Error('Operation failed');
            });

            const result = await handler.withGracefulDegradation(
                operation,
                'fallback',
                'testOperation'
            );

            expect(result).toBe('fallback');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should return operation result on success', async () => {
            const operation = jest.fn(async () => 'success');

            const result = await handler.withGracefulDegradation(
                operation,
                'fallback',
                'testOperation'
            );

            expect(result).toBe('success');
        });

        it('should log warning when using fallback', async () => {
            const warnSpy = jest.spyOn(console, 'log');
            const operation = jest.fn(async () => {
                throw new Error('Operation failed');
            });

            await handler.withGracefulDegradation(
                operation,
                'fallback',
                'testOperation'
            );

            // Verify warning was logged (in JSON format for CloudWatch)
            expect(warnSpy).toHaveBeenCalled();
        });
    });

    describe('Convenience Functions', () => {
        it('should handle errors with handleError', () => {
            const error = new Error('Test error');
            const enhanced = handleError(error, 'testOperation', { userId: '123' });

            expect(enhanced).toBeInstanceOf(MLSSocialError);
            expect(enhanced.context.userId).toBe('123');
        });

        it('should retry with withRetry', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 2) throw new Error('Network error');
                return 'success';
            };

            const result = await withRetry(
                operation,
                'testOperation',
                { maxAttempts: 3, baseDelay: 10 }
            );

            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });

        it('should degrade gracefully with withGracefulDegradation', async () => {
            const operation = async () => {
                throw new Error('Failed');
            };

            const result = await withGracefulDegradation(
                operation,
                'fallback',
                'testOperation'
            );

            expect(result).toBe('fallback');
        });
    });

    describe('MLSSocialError', () => {
        it('should create error with all properties', () => {
            const error = new MLSSocialError(
                'Technical message',
                ErrorCategory.NETWORK,
                ErrorSeverity.MEDIUM,
                'User-friendly message',
                true,
                { userId: '123' }
            );

            expect(error.message).toBe('Technical message');
            expect(error.category).toBe(ErrorCategory.NETWORK);
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.userMessage).toBe('User-friendly message');
            expect(error.retryable).toBe(true);
            expect(error.context.userId).toBe('123');
            expect(error.timestamp).toBeDefined();
        });

        it('should have correct name', () => {
            const error = new MLSSocialError(
                'Test',
                ErrorCategory.INTERNAL,
                ErrorSeverity.LOW,
                'Test',
                false
            );

            expect(error.name).toBe('MLSSocialError');
        });
    });

    describe('Context Preservation', () => {
        it('should preserve context through error handling', () => {
            const error = new Error('Test error');
            const context = {
                userId: '123',
                listingId: 'abc',
                platform: 'facebook',
            };

            const enhanced = handler.handle(error, 'testOperation', context);

            expect(enhanced.context.userId).toBe('123');
            expect(enhanced.context.listingId).toBe('abc');
            expect(enhanced.context.platform).toBe('facebook');
        });

        it('should add operation to context', () => {
            const error = new Error('Test error');
            const enhanced = handler.handle(error, 'testOperation');

            expect(enhanced.context.originalError).toBeDefined();
        });
    });
});
