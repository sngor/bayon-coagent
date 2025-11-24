/**
 * Tests for Retry Utility
 * 
 * Validates retry logic with exponential backoff, jitter, and configurable options
 */

import {
    retryWithExponentialBackoff,
    retry,
    calculateRetryDelay,
    defaultShouldRetry,
    getRetryStats,
    resetRetryStats,
    createRetryWrapper,
    DEFAULT_RETRY_OPTIONS,
} from '../retry-utility';

describe('Retry Utility', () => {
    beforeEach(() => {
        resetRetryStats();
    });

    describe('calculateRetryDelay', () => {
        it('should calculate exponential backoff correctly', () => {
            const options = {
                ...DEFAULT_RETRY_OPTIONS,
                baseDelay: 1000,
                backoffMultiplier: 2,
                enableJitter: false,
            };

            expect(calculateRetryDelay(1, options)).toBe(1000); // 1000 * 2^0
            expect(calculateRetryDelay(2, options)).toBe(2000); // 1000 * 2^1
            expect(calculateRetryDelay(3, options)).toBe(4000); // 1000 * 2^2
            expect(calculateRetryDelay(4, options)).toBe(8000); // 1000 * 2^3
        });

        it('should cap delay at maxDelay', () => {
            const options = {
                ...DEFAULT_RETRY_OPTIONS,
                baseDelay: 1000,
                backoffMultiplier: 2,
                maxDelay: 5000,
                enableJitter: false,
            };

            expect(calculateRetryDelay(1, options)).toBe(1000);
            expect(calculateRetryDelay(2, options)).toBe(2000);
            expect(calculateRetryDelay(3, options)).toBe(4000);
            expect(calculateRetryDelay(4, options)).toBe(5000); // Capped at maxDelay
            expect(calculateRetryDelay(5, options)).toBe(5000); // Still capped
        });

        it('should add jitter when enabled', () => {
            const options = {
                ...DEFAULT_RETRY_OPTIONS,
                baseDelay: 1000,
                backoffMultiplier: 2,
                enableJitter: true,
                jitterFactor: 0.3,
            };

            const delay1 = calculateRetryDelay(1, options);
            const delay2 = calculateRetryDelay(1, options);

            // Delays should be different due to jitter (with very high probability)
            // We'll just check they're in the expected range
            expect(delay1).toBeGreaterThanOrEqual(700);
            expect(delay1).toBeLessThanOrEqual(1300);
            expect(delay2).toBeGreaterThanOrEqual(700);
            expect(delay2).toBeLessThanOrEqual(1300);
        });
    });

    describe('defaultShouldRetry', () => {
        it('should retry on network errors', () => {
            expect(defaultShouldRetry(new Error('Network error'))).toBe(true);
            expect(defaultShouldRetry(new Error('fetch failed'))).toBe(true);
            expect(defaultShouldRetry(new Error('Connection timeout'))).toBe(true);
            expect(defaultShouldRetry(new Error('ECONNREFUSED'))).toBe(true);
        });

        it('should retry on server errors', () => {
            expect(defaultShouldRetry(new Error('500 Internal Server Error'))).toBe(true);
            expect(defaultShouldRetry(new Error('502 Bad Gateway'))).toBe(true);
            expect(defaultShouldRetry(new Error('503 Service Unavailable'))).toBe(true);
            expect(defaultShouldRetry(new Error('504 Gateway Timeout'))).toBe(true);
        });

        it('should retry on rate limiting', () => {
            expect(defaultShouldRetry(new Error('429 Too Many Requests'))).toBe(true);
            expect(defaultShouldRetry(new Error('Rate limit exceeded'))).toBe(true);
        });

        it('should not retry on client errors', () => {
            expect(defaultShouldRetry(new Error('400 Bad Request'))).toBe(false);
            expect(defaultShouldRetry(new Error('401 Unauthorized'))).toBe(false);
            expect(defaultShouldRetry(new Error('403 Forbidden'))).toBe(false);
            expect(defaultShouldRetry(new Error('404 Not Found'))).toBe(false);
            expect(defaultShouldRetry(new Error('Validation error'))).toBe(false);
        });
    });

    describe('retryWithExponentialBackoff', () => {
        it('should succeed on first attempt', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                return 'success';
            };

            const result = await retryWithExponentialBackoff(operation, {
                maxRetries: 3,
                operationName: 'test-operation',
            });

            expect(result.data).toBe('success');
            expect(result.attempts).toBe(1);
            expect(result.hadRetries).toBe(false);
            expect(callCount).toBe(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                if (callCount < 3) {
                    throw new Error('Network error');
                }
                return 'success';
            };

            const result = await retryWithExponentialBackoff(operation, {
                maxRetries: 3,
                baseDelay: 10, // Short delay for testing
                operationName: 'test-operation',
            });

            expect(result.data).toBe('success');
            expect(result.attempts).toBe(3);
            expect(result.hadRetries).toBe(true);
            expect(callCount).toBe(3);
        });

        it('should throw error after max retries', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                throw new Error('Network error');
            };

            await expect(
                retryWithExponentialBackoff(operation, {
                    maxRetries: 2,
                    baseDelay: 10,
                    operationName: 'test-operation',
                })
            ).rejects.toThrow('Network error');

            expect(callCount).toBe(3); // Initial + 2 retries
        });

        it('should not retry on non-retryable errors', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                throw new Error('400 Bad Request');
            };

            await expect(
                retryWithExponentialBackoff(operation, {
                    maxRetries: 3,
                    baseDelay: 10,
                    operationName: 'test-operation',
                })
            ).rejects.toThrow('400 Bad Request');

            expect(callCount).toBe(1); // No retries
        });

        it('should call onRetry callback', async () => {
            let callCount = 0;
            let retryCallCount = 0;
            const operation = async () => {
                callCount++;
                if (callCount < 2) {
                    throw new Error('Network error');
                }
                return 'success';
            };

            const onRetry = (error: Error, attempt: number, delay: number) => {
                retryCallCount++;
                expect(error).toBeInstanceOf(Error);
                expect(attempt).toBe(1);
                expect(delay).toBeGreaterThan(0);
            };

            await retryWithExponentialBackoff(operation, {
                maxRetries: 3,
                baseDelay: 10,
                onRetry,
                operationName: 'test-operation',
            });

            expect(retryCallCount).toBe(1);
        });

        it('should call onMaxRetriesExceeded callback', async () => {
            let callCount = 0;
            let maxRetriesCallCount = 0;
            const operation = async () => {
                callCount++;
                throw new Error('Network error');
            };

            const onMaxRetriesExceeded = (error: Error, attempts: number) => {
                maxRetriesCallCount++;
                expect(error).toBeInstanceOf(Error);
                expect(attempts).toBe(3);
            };

            await expect(
                retryWithExponentialBackoff(operation, {
                    maxRetries: 2,
                    baseDelay: 10,
                    onMaxRetriesExceeded,
                    operationName: 'test-operation',
                })
            ).rejects.toThrow();

            expect(maxRetriesCallCount).toBe(1);
        });

        it('should respect custom shouldRetry function', async () => {
            let callCount = 0;
            let shouldRetryCallCount = 0;
            const operation = async () => {
                callCount++;
                throw new Error('Custom error');
            };

            const shouldRetry = (error: Error, attempt: number) => {
                shouldRetryCallCount++;
                return false;
            };

            await expect(
                retryWithExponentialBackoff(operation, {
                    maxRetries: 3,
                    baseDelay: 10,
                    shouldRetry,
                    operationName: 'test-operation',
                })
            ).rejects.toThrow('Custom error');

            expect(callCount).toBe(1);
            expect(shouldRetryCallCount).toBe(1);
        });

        it('should track retry statistics', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                if (callCount < 2) {
                    throw new Error('Network error');
                }
                return 'success';
            };

            await retryWithExponentialBackoff(operation, {
                maxRetries: 3,
                baseDelay: 10,
                operationName: 'test-stats',
            });

            const stats = getRetryStats('test-stats');
            expect(stats).toMatchObject({
                operationName: 'test-stats',
                totalAttempts: 2,
                successfulAttempts: 1,
                failedAttempts: 0,
                averageAttempts: 2,
            });
        });
    });

    describe('retry', () => {
        it('should return data directly without metadata', async () => {
            let callCount = 0;
            const operation = async () => {
                callCount++;
                return 'success';
            };

            const result = await retry(operation, {
                maxRetries: 3,
                operationName: 'test-operation',
            });

            expect(result).toBe('success');
            expect(callCount).toBe(1);
        });
    });

    describe('createRetryWrapper', () => {
        it('should create a wrapped function with retry logic', async () => {
            let callCount = 0;
            const originalFn = async () => {
                callCount++;
                return 'success';
            };

            const wrappedFn = createRetryWrapper(originalFn, {
                maxRetries: 3,
                operationName: 'wrapped-operation',
            });

            const result = await wrappedFn();

            expect(result).toBe('success');
            expect(callCount).toBe(1);
        });

        it('should pass arguments to wrapped function', async () => {
            let receivedArgs: any[] = [];
            const originalFn = async (...args: any[]) => {
                receivedArgs = args;
                return 'success';
            };

            const wrappedFn = createRetryWrapper(originalFn, {
                maxRetries: 3,
                operationName: 'wrapped-operation',
            });

            await wrappedFn('arg1', 'arg2', 123);

            expect(receivedArgs).toEqual(['arg1', 'arg2', 123]);
        });

        it('should retry wrapped function on failure', async () => {
            let callCount = 0;
            const originalFn = async () => {
                callCount++;
                if (callCount < 2) {
                    throw new Error('Network error');
                }
                return 'success';
            };

            const wrappedFn = createRetryWrapper(originalFn, {
                maxRetries: 3,
                baseDelay: 10,
                operationName: 'wrapped-operation',
            });

            const result = await wrappedFn();

            expect(result).toBe('success');
            expect(callCount).toBe(2);
        });
    });

    describe('retry statistics', () => {
        it('should track multiple operations', async () => {
            const op1 = async () => 'success1';
            const op2 = async () => 'success2';

            await retry(op1, { operationName: 'operation-1' });
            await retry(op2, { operationName: 'operation-2' });

            const allStats = getRetryStats() as Map<string, any>;
            expect(allStats.size).toBe(2);
            expect(allStats.has('operation-1')).toBe(true);
            expect(allStats.has('operation-2')).toBe(true);
        });

        it('should reset statistics', async () => {
            const operation = async () => 'success';

            await retry(operation, { operationName: 'test-reset' });

            let stats = getRetryStats('test-reset');
            expect(stats).toMatchObject({
                successfulAttempts: 1,
            });

            resetRetryStats('test-reset');

            stats = getRetryStats('test-reset');
            expect(stats).toMatchObject({
                successfulAttempts: 0,
                failedAttempts: 0,
            });
        });
    });

    describe('exponential backoff with jitter', () => {
        it('should prevent thundering herd with jitter', async () => {
            const delays: number[] = [];
            let callCount = 0;
            const operation = async () => {
                callCount++;
                if (callCount < 3) {
                    throw new Error('Network error');
                }
                return 'success';
            };

            await retryWithExponentialBackoff(operation, {
                maxRetries: 3,
                baseDelay: 1000,
                backoffMultiplier: 2,
                enableJitter: true,
                jitterFactor: 0.3,
                onRetry: (error, attempt, delay) => {
                    delays.push(delay);
                },
                operationName: 'test-jitter',
            });

            // Verify delays are within expected ranges with jitter
            expect(delays[0]).toBeGreaterThanOrEqual(700); // 1000 * (1 - 0.3)
            expect(delays[0]).toBeLessThanOrEqual(1300); // 1000 * (1 + 0.3)

            expect(delays[1]).toBeGreaterThanOrEqual(1400); // 2000 * (1 - 0.3)
            expect(delays[1]).toBeLessThanOrEqual(2600); // 2000 * (1 + 0.3)
        });
    });
});
