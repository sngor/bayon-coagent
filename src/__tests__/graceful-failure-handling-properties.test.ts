/**
 * Property-Based Tests for Graceful Failure Handling
 * 
 * **Feature: microservices-architecture, Property 10: Graceful Failure Handling**
 * 
 * Property: For any partial system failure, the system should provide meaningful
 * feedback and fallback options to users
 * 
 * **Validates: Requirements 4.3**
 * 
 * This test validates that the system handles failures gracefully with user-friendly
 * messages and fallback mechanisms.
 */

import * as fc from 'fast-check';
import { withFallback, createUserFriendlyError } from '../lambda/utils/fallback';
import { CircuitBreaker, CircuitState, CircuitBreakerError } from '../lib/circuit-breaker';

describe('Graceful Failure Handling Properties', () => {
    /**
     * Property 10: Graceful Failure Handling
     * 
     * For any partial system failure, the system should provide meaningful feedback
     * and fallback options through caching, defaults, or user-friendly error messages.
     */
    it(
        'should provide fallback data when service fails',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 100 }), // Service name
                    fc.string({ minLength: 1, maxLength: 100 }), // Operation name
                    fc.boolean(), // Whether to enable cache
                    fc.oneof(fc.constant(undefined), fc.object()), // Default response
                    async (service, operation, enableCache, defaultResponse) => {
                        let callCount = 0;

                        // Service that always fails
                        const failingService = async () => {
                            callCount++;
                            throw new Error('Service unavailable');
                        };

                        // Test fallback mechanism
                        const result = await withFallback(
                            service,
                            operation,
                            failingService,
                            {},
                            {
                                enableCache,
                                defaultResponse,
                                userMessage: 'Service temporarily unavailable',
                            }
                        );

                        // Verify fallback behavior
                        if (defaultResponse !== undefined) {
                            // Should use default response
                            expect(result.success).toBe(true);
                            expect(result.fromDefault).toBe(true);
                            expect(result.data).toEqual(defaultResponse);
                        } else {
                            // Should fail gracefully with user message
                            expect(result.success).toBe(false);
                            expect(result.userMessage).toBe('Service temporarily unavailable');
                        }

                        // Service should have been called once
                        expect(callCount).toBe(1);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    it(
        'should provide user-friendly error messages',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // Service name
                    fc.string({ minLength: 1, maxLength: 50 }), // Operation name
                    fc.constantFrom(
                        'timeout',
                        'unavailable',
                        'connection',
                        'throttl',
                        'rate limit',
                        'unauthorized',
                        'forbidden',
                        'not found',
                        'unknown'
                    ), // Error type
                    async (service, operation, errorType) => {
                        const error = new Error(`Service ${errorType} error`);

                        // Create user-friendly error
                        const userError = createUserFriendlyError(service, operation, error);

                        // Verify error structure
                        expect(userError).toHaveProperty('code');
                        expect(userError).toHaveProperty('message');
                        expect(userError).toHaveProperty('details');
                        expect(userError.details).toHaveProperty('service', service);
                        expect(userError.details).toHaveProperty('operation', operation);
                        expect(userError.details).toHaveProperty('timestamp');
                        expect(userError.details).toHaveProperty('retryable');

                        // Verify message is user-friendly (not technical)
                        expect(userError.message).not.toContain('Error:');
                        expect(userError.message).not.toContain('Exception');
                        expect(userError.message.length).toBeGreaterThan(10);

                        // Verify retryable classification
                        const retryableErrors = ['timeout', 'unavailable', 'connection', 'throttl', 'rate limit'];
                        const shouldBeRetryable = retryableErrors.includes(errorType);
                        expect(userError.details.retryable).toBe(shouldBeRetryable);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    it(
        'should maintain partial functionality during failures',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 2, max: 5 }), // Number of services
                    fc.integer({ min: 0, max: 4 }), // Number of failing services
                    async (totalServices, failingCount) => {
                        // Ensure we don't fail more services than we have
                        const actualFailingCount = Math.min(failingCount, totalServices);
                        const workingCount = totalServices - actualFailingCount;

                        const services: Array<{ name: string; working: boolean }> = [];

                        // Create service list
                        for (let i = 0; i < totalServices; i++) {
                            services.push({
                                name: `service-${i}`,
                                working: i >= actualFailingCount, // First N services fail
                            });
                        }

                        // Call all services
                        const results = await Promise.allSettled(
                            services.map(async (svc) => {
                                if (!svc.working) {
                                    throw new Error(`${svc.name} unavailable`);
                                }
                                return { service: svc.name, data: 'success' };
                            })
                        );

                        // Count successes and failures
                        const successCount = results.filter(r => r.status === 'fulfilled').length;
                        const failureCount = results.filter(r => r.status === 'rejected').length;

                        // Verify partial functionality maintained
                        expect(successCount).toBe(workingCount);
                        expect(failureCount).toBe(actualFailingCount);

                        // If any services work, system should be partially functional
                        if (workingCount > 0) {
                            expect(successCount).toBeGreaterThan(0);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    it(
        'should provide meaningful feedback for circuit breaker states',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // Service name
                    fc.integer({ min: 3, max: 10 }), // Failure threshold
                    async (serviceName, failureThreshold) => {
                        const breaker = new CircuitBreaker(serviceName, {
                            failureThreshold,
                            recoveryTimeoutMs: 1000,
                            successThreshold: 2,
                        });

                        const failingService = async () => {
                            throw new Error('Service failure');
                        };

                        // Cause circuit to open
                        for (let i = 0; i < failureThreshold; i++) {
                            try {
                                await breaker.execute(failingService);
                            } catch (error) {
                                // Expected failures
                            }
                        }

                        // Verify circuit is open
                        expect(breaker.getState()).toBe(CircuitState.OPEN);

                        // Try to call service while circuit is open
                        try {
                            await breaker.execute(failingService);
                            fail('Should have thrown CircuitBreakerError');
                        } catch (error) {
                            // Verify meaningful error message
                            expect(error).toBeInstanceOf(CircuitBreakerError);
                            expect((error as CircuitBreakerError).message).toContain(serviceName);
                            expect((error as CircuitBreakerError).message).toContain('OPEN');
                            expect((error as CircuitBreakerError).state).toBe(CircuitState.OPEN);
                        }

                        // Get circuit stats for monitoring
                        const stats = breaker.getStats();
                        expect(stats.name).toBe(serviceName);
                        expect(stats.state).toBe(CircuitState.OPEN);
                        expect(stats.failureCount).toBeGreaterThanOrEqual(failureThreshold);
                    }
                ),
                { numRuns: 50 }
            );
        },
        30000
    );

    it(
        'should handle cascading failures gracefully',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 2, max: 5 }), // Number of dependent services
                    async (serviceCount) => {
                        const breakers: CircuitBreaker[] = [];
                        const results: Array<{ service: string; success: boolean; error?: string }> = [];

                        // Create circuit breakers for each service
                        for (let i = 0; i < serviceCount; i++) {
                            breakers.push(
                                new CircuitBreaker(`service-${i}`, {
                                    failureThreshold: 3,
                                    recoveryTimeoutMs: 500,
                                })
                            );
                        }

                        // Simulate cascading failures
                        for (let i = 0; i < serviceCount; i++) {
                            const breaker = breakers[i];

                            // Cause failures
                            for (let j = 0; j < 3; j++) {
                                try {
                                    await breaker.execute(async () => {
                                        throw new Error(`Service ${i} unavailable`);
                                    });
                                } catch (error) {
                                    // Expected
                                }
                            }

                            // Try to use service after circuit opens
                            try {
                                await breaker.execute(async () => ({ success: true }));
                                results.push({ service: `service-${i}`, success: true });
                            } catch (error) {
                                results.push({
                                    service: `service-${i}`,
                                    success: false,
                                    error: error instanceof Error ? error.message : String(error),
                                });
                            }
                        }

                        // Verify all services failed gracefully
                        expect(results.length).toBe(serviceCount);

                        // All should have failed with meaningful errors
                        results.forEach(result => {
                            expect(result.success).toBe(false);
                            expect(result.error).toBeDefined();
                            expect(result.error).toContain('OPEN');
                        });

                        // Verify all circuits are open
                        breakers.forEach(breaker => {
                            expect(breaker.getState()).toBe(CircuitState.OPEN);
                        });
                    }
                ),
                { numRuns: 50 }
            );
        },
        30000
    );

    it(
        'should provide fallback options for different failure scenarios',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('cache', 'default', 'queue', 'none'), // Fallback strategy
                    async (strategy) => {
                        const failingService = async () => {
                            throw new Error('Service unavailable');
                        };

                        let result;

                        switch (strategy) {
                            case 'cache':
                                result = await withFallback(
                                    'test-service',
                                    'test-operation',
                                    failingService,
                                    {},
                                    {
                                        enableCache: true,
                                        userMessage: 'Showing cached data',
                                    }
                                );
                                break;

                            case 'default':
                                result = await withFallback(
                                    'test-service',
                                    'test-operation',
                                    failingService,
                                    {},
                                    {
                                        defaultResponse: { fallback: true },
                                        userMessage: 'Showing default data',
                                    }
                                );
                                break;

                            case 'queue':
                                result = await withFallback(
                                    'test-service',
                                    'test-operation',
                                    failingService,
                                    {},
                                    {
                                        queueForRetry: true,
                                        userMessage: 'Operation queued for later',
                                    }
                                );
                                break;

                            case 'none':
                                result = await withFallback(
                                    'test-service',
                                    'test-operation',
                                    failingService,
                                    {},
                                    {
                                        userMessage: 'Service unavailable',
                                    }
                                );
                                break;
                        }

                        // Verify appropriate fallback behavior
                        expect(result).toHaveProperty('success');
                        expect(result).toHaveProperty('userMessage');
                        expect(result.userMessage.length).toBeGreaterThan(0);

                        if (strategy === 'default') {
                            expect(result.success).toBe(true);
                            expect(result.fromDefault).toBe(true);
                        } else if (strategy === 'none') {
                            expect(result.success).toBe(false);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );
});
