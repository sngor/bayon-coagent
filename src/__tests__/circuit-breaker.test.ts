/**
 * Circuit Breaker Pattern Tests
 * 
 * Tests the circuit breaker implementation for external API calls.
 * 
 * Requirements: 1.3 - Circuit breaker pattern for external calls
 */

import {
    CircuitBreaker,
    CircuitState,
    CircuitBreakerError,
    createCircuitBreaker,
    withCircuitBreaker,
    circuitBreakerRegistry,
} from '../lib/circuit-breaker';

describe('Circuit Breaker', () => {
    beforeEach(() => {
        // Clear registry before each test
        circuitBreakerRegistry.clear();
    });

    describe('Basic Functionality', () => {
        it('should execute successful requests in CLOSED state', async () => {
            const breaker = createCircuitBreaker('test-service');

            const result = await breaker.execute(async () => {
                return 'success';
            });

            expect(result).toBe('success');
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('should count failures and open circuit after threshold', async () => {
            const breaker = createCircuitBreaker('test-service', {
                failureThreshold: 3,
            });

            // Fail 3 times
            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(async () => {
                        throw new Error('Service failure');
                    });
                } catch (error) {
                    // Expected
                }
            }

            expect(breaker.getState()).toBe(CircuitState.OPEN);
        });

        it('should fail fast when circuit is OPEN', async () => {
            const breaker = createCircuitBreaker('test-service', {
                failureThreshold: 2,
            });

            // Fail twice to open circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute(async () => {
                        throw new Error('Service failure');
                    });
                } catch (error) {
                    // Expected
                }
            }

            // Next request should fail fast
            await expect(
                breaker.execute(async () => 'success')
            ).rejects.toThrow(CircuitBreakerError);
        });

        it('should transition to HALF_OPEN after recovery timeout', async () => {
            const breaker = createCircuitBreaker('test-service', {
                failureThreshold: 2,
                recoveryTimeout: 100, // 100ms for testing
            });

            // Open the circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute(async () => {
                        throw new Error('Service failure');
                    });
                } catch (error) {
                    // Expected
                }
            }

            expect(breaker.getState()).toBe(CircuitState.OPEN);

            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // Next request should transition to HALF_OPEN
            const result = await breaker.execute(async () => 'recovered');

            expect(result).toBe('recovered');
        });

        it('should close circuit after successful requests in HALF_OPEN', async () => {
            const breaker = createCircuitBreaker('test-service', {
                failureThreshold: 2,
                recoveryTimeout: 100,
                successThreshold: 2,
            });

            // Open the circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute(async () => {
                        throw new Error('Service failure');
                    });
                } catch (error) {
                    // Expected
                }
            }

            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // Execute 2 successful requests
            await breaker.execute(async () => 'success1');
            await breaker.execute(async () => 'success2');

            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('Timeout Handling', () => {
        it('should timeout long-running requests', async () => {
            const breaker = createCircuitBreaker('test-service', {
                requestTimeout: 100, // 100ms timeout
            });

            await expect(
                breaker.execute(async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    return 'too slow';
                })
            ).rejects.toThrow('Request timeout');
        });
    });

    describe('withCircuitBreaker Helper', () => {
        it('should create and use circuit breaker', async () => {
            const result = await withCircuitBreaker(
                'helper-test',
                async () => 'success'
            );

            expect(result).toBe('success');
        });

        it('should reuse existing circuit breaker', async () => {
            await withCircuitBreaker('reuse-test', async () => 'first');

            const breaker = circuitBreakerRegistry.get('reuse-test');
            expect(breaker).toBeDefined();

            await withCircuitBreaker('reuse-test', async () => 'second');

            const sameBreaker = circuitBreakerRegistry.get('reuse-test');
            expect(sameBreaker).toBe(breaker);
        });
    });

    describe('Circuit Breaker Registry', () => {
        it('should manage multiple circuit breakers', () => {
            createCircuitBreaker('service1');
            createCircuitBreaker('service2');
            createCircuitBreaker('service3');

            const allBreakers = circuitBreakerRegistry.getAll();
            expect(allBreakers).toHaveLength(3);
        });

        it('should get statistics for all breakers', () => {
            createCircuitBreaker('service1');
            createCircuitBreaker('service2');

            const stats = circuitBreakerRegistry.getAllStats();
            expect(stats).toHaveLength(2);
            expect(stats[0]).toHaveProperty('name');
            expect(stats[0]).toHaveProperty('state');
            expect(stats[0]).toHaveProperty('failureCount');
        });

        it('should reset all breakers', async () => {
            const breaker1 = createCircuitBreaker('service1', {
                failureThreshold: 1,
            });
            const breaker2 = createCircuitBreaker('service2', {
                failureThreshold: 1,
            });

            // Open both circuits
            try {
                await breaker1.execute(async () => {
                    throw new Error('fail');
                });
            } catch (error) {
                // Expected
            }

            try {
                await breaker2.execute(async () => {
                    throw new Error('fail');
                });
            } catch (error) {
                // Expected
            }

            expect(breaker1.getState()).toBe(CircuitState.OPEN);
            expect(breaker2.getState()).toBe(CircuitState.OPEN);

            // Reset all
            circuitBreakerRegistry.resetAll();

            expect(breaker1.getState()).toBe(CircuitState.CLOSED);
            expect(breaker2.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('Manual Control', () => {
        it('should manually open circuit', () => {
            const breaker = createCircuitBreaker('manual-open-test');

            expect(breaker.getState()).toBe(CircuitState.CLOSED);

            breaker.open();

            expect(breaker.getState()).toBe(CircuitState.OPEN);
        });

        it('should manually reset circuit', async () => {
            const breaker = createCircuitBreaker('manual-reset-test', {
                failureThreshold: 1,
            });

            // Open the circuit
            try {
                await breaker.execute(async () => {
                    throw new Error('fail');
                });
            } catch (error) {
                // Expected
            }

            expect(breaker.getState()).toBe(CircuitState.OPEN);

            breaker.reset();

            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('Configuration Validation', () => {
        it('should use correct thresholds for OAuth services', () => {
            const breaker = createCircuitBreaker('google-oauth-token-exchange', {
                failureThreshold: 3,
                recoveryTimeout: 30000,
                requestTimeout: 10000,
            });

            const stats = breaker.getStats();
            expect(stats.options.failureThreshold).toBe(3);
            expect(stats.options.recoveryTimeout).toBe(30000);
            expect(stats.options.requestTimeout).toBe(10000);
        });

        it('should use correct thresholds for MLS API', () => {
            const breaker = createCircuitBreaker('mlsgrid-api', {
                failureThreshold: 5,
                recoveryTimeout: 60000,
                requestTimeout: 30000,
            });

            const stats = breaker.getStats();
            expect(stats.options.failureThreshold).toBe(5);
            expect(stats.options.recoveryTimeout).toBe(60000);
            expect(stats.options.requestTimeout).toBe(30000);
        });
    });
});
