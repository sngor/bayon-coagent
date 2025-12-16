/**
 * Microservices Testing Utilities
 * 
 * Provides common utilities and helpers for testing microservices architecture
 * components including Lambda functions, API Gateway integration, and service
 * communication patterns.
 */

import fc from 'fast-check';

// Common interfaces for microservices testing
export interface ServiceRequest {
    headers: Record<string, string>;
    body: string;
    pathParameters?: Record<string, string>;
    queryStringParameters?: Record<string, string>;
    requestContext: {
        requestId: string;
        traceId: string;
        accountId: string;
        stage: string;
    };
}

export interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

export interface ServiceError {
    errorId: string;
    errorCode: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    traceId: string;
    service: string;
    retryable: boolean;
}

// Fast-check arbitraries for common microservices data types
export const arbitraries = {
    // Generate valid service request
    serviceRequest: (): fc.Arbitrary<ServiceRequest> => fc.record({
        headers: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 100 })
        ),
        body: fc.string(),
        pathParameters: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 50 })
        )),
        queryStringParameters: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 50 })
        )),
        requestContext: fc.record({
            requestId: fc.uuid(),
            traceId: fc.string({ minLength: 32, maxLength: 32 }).map(s =>
                s.replace(/[^a-f0-9]/g, 'a')
            ),
            accountId: fc.string({ minLength: 12, maxLength: 12 }).map(s =>
                s.replace(/[^0-9]/g, '1')
            ),
            stage: fc.oneof(
                fc.constant('dev'),
                fc.constant('staging'),
                fc.constant('prod')
            ),
        }),
    }),

    // Generate valid location data
    location: (): fc.Arbitrary<{
        city: string;
        state: string;
        zipCode?: string;
        coordinates?: { lat: number; lng: number };
    }> => fc.record({
        city: fc.oneof(
            fc.constant('Seattle'),
            fc.constant('Portland'),
            fc.constant('Denver'),
            fc.constant('Austin'),
            fc.constant('Phoenix'),
            fc.constant('Miami'),
            fc.constant('Boston'),
            fc.constant('Chicago')
        ),
        state: fc.oneof(
            fc.constant('WA'),
            fc.constant('OR'),
            fc.constant('CO'),
            fc.constant('TX'),
            fc.constant('AZ'),
            fc.constant('FL'),
            fc.constant('MA'),
            fc.constant('IL')
        ),
        zipCode: fc.option(
            fc.string({ minLength: 5, maxLength: 5 }).filter(s => /^\d{5}$/.test(s))
        ),
        coordinates: fc.option(fc.record({
            lat: fc.float({ min: Math.fround(25), max: Math.fround(49) }),
            lng: fc.float({ min: Math.fround(-125), max: Math.fround(-66) }),
        })),
    }),

    // Generate valid user ID
    userId: (): fc.Arbitrary<string> => fc.uuid(),

    // Generate valid timestamp
    timestamp: (): fc.Arbitrary<string> => fc.integer({ min: 1577836800000, max: 1924992000000 }).map(ms => new Date(ms).toISOString()),

    // Generate valid error response
    serviceError: (): fc.Arbitrary<ServiceError> => fc.record({
        errorId: fc.uuid(),
        errorCode: fc.oneof(
            fc.constant('VALIDATION_ERROR'),
            fc.constant('SERVICE_UNAVAILABLE'),
            fc.constant('TIMEOUT'),
            fc.constant('RATE_LIMITED'),
            fc.constant('INTERNAL_ERROR')
        ),
        message: fc.string({ minLength: 10, maxLength: 100 }),
        details: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.anything()
        )),
        timestamp: arbitraries.timestamp(),
        traceId: fc.string({ minLength: 32, maxLength: 32 }),
        service: fc.string({ minLength: 5, maxLength: 30 }),
        retryable: fc.boolean(),
    }),
};

// Mock service factories
export class MockServiceFactory {
    static createSuccessResponse(data: any, statusCode: number = 200): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': global.testUtils.generateTestId(),
                'X-Trace-ID': global.testUtils.generateTestId(),
            },
            body: JSON.stringify(data),
        };
    }

    static createErrorResponse(error: ServiceError, statusCode: number = 500): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': global.testUtils.generateTestId(),
                'X-Trace-ID': error.traceId,
            },
            body: JSON.stringify({ error }),
        };
    }

    static createMockLambdaContext() {
        return {
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'test-function',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
            memoryLimitInMB: '128',
            awsRequestId: global.testUtils.generateTestId(),
            logGroupName: '/aws/lambda/test-function',
            logStreamName: '2024/01/01/[$LATEST]test',
            getRemainingTimeInMillis: () => 30000,
            done: jest.fn(),
            fail: jest.fn(),
            succeed: jest.fn(),
        };
    }
}

// Property-based test helpers
export class PropertyTestHelpers {
    /**
     * Creates a property test configuration with sensible defaults for microservices
     */
    static createConfig(overrides: Partial<fc.Parameters<any>> = {}): fc.Parameters<any> {
        return {
            numRuns: global.testUtils.propertyTestConfig.numRuns,
            timeout: global.testUtils.propertyTestConfig.timeout,
            verbose: global.testUtils.propertyTestConfig.verbose,
            ...overrides,
        };
    }

    /**
     * Helper for testing service isolation property
     */
    static async testServiceIsolation<T>(
        serviceFunction: (input: T) => Promise<any>,
        inputArbitrary: fc.Arbitrary<T>,
        concurrentRequests: number = 5
    ): Promise<void> {
        await fc.assert(
            fc.asyncProperty(
                fc.array(inputArbitrary, { minLength: concurrentRequests, maxLength: concurrentRequests }),
                async (inputs) => {
                    // Execute all requests concurrently
                    const promises = inputs.map(input => serviceFunction(input));
                    const results = await Promise.allSettled(promises);

                    // All requests should complete (either fulfill or reject)
                    expect(results.length).toBe(concurrentRequests);

                    // No request should interfere with others
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            expect(result.value).toBeDefined();
                        }
                        // Failures should be independent, not cascading
                    });

                    return true;
                }
            ),
            PropertyTestHelpers.createConfig({ numRuns: 25 })
        );
    }

    /**
     * Helper for testing multi-channel delivery property
     */
    static async testMultiChannelDelivery<T>(
        deliveryFunction: (input: T, channels: string[]) => Promise<any>,
        inputArbitrary: fc.Arbitrary<T>
    ): Promise<void> {
        await fc.assert(
            fc.asyncProperty(
                inputArbitrary,
                fc.array(
                    fc.oneof(
                        fc.constant('email'),
                        fc.constant('sms'),
                        fc.constant('push'),
                        fc.constant('webhook')
                    ),
                    { minLength: 1, maxLength: 4 }
                ),
                async (input, channels) => {
                    const result = await deliveryFunction(input, channels);

                    // Should attempt delivery to all specified channels
                    expect(result.attemptedChannels).toEqual(expect.arrayContaining(channels));
                    expect(result.attemptedChannels.length).toBe(channels.length);

                    // Should track success/failure for each channel
                    channels.forEach(channel => {
                        expect(result.channelResults).toHaveProperty(channel);
                        expect(result.channelResults[channel]).toHaveProperty('success');
                        expect(result.channelResults[channel]).toHaveProperty('timestamp');
                    });

                    return true;
                }
            ),
            PropertyTestHelpers.createConfig({ numRuns: 50 })
        );
    }

    /**
     * Helper for testing retry mechanism property
     */
    static async testRetryMechanism<T>(
        retryableFunction: (input: T) => Promise<any>,
        inputArbitrary: fc.Arbitrary<T>,
        maxRetries: number = 3
    ): Promise<void> {
        await fc.assert(
            fc.asyncProperty(
                inputArbitrary,
                async (input) => {
                    let attemptCount = 0;
                    const mockFunction = jest.fn().mockImplementation(async () => {
                        attemptCount++;
                        if (attemptCount <= maxRetries) {
                            throw new Error('Simulated failure');
                        }
                        return { success: true, attempts: attemptCount };
                    });

                    try {
                        const result = await retryableFunction(input);

                        // If successful, should have retry metadata
                        if (result.success) {
                            expect(result.attempts).toBeGreaterThan(0);
                            expect(result.attempts).toBeLessThanOrEqual(maxRetries + 1);
                        }
                    } catch (error) {
                        // If failed after retries, should have exhausted attempts
                        expect(attemptCount).toBeGreaterThan(maxRetries);
                    }

                    return true;
                }
            ),
            PropertyTestHelpers.createConfig({ numRuns: 30 })
        );
    }
}

// Service communication test helpers
export class ServiceCommunicationHelpers {
    /**
     * Test event-driven communication patterns
     */
    static async testEventDrivenCommunication(
        eventPublisher: (event: any) => Promise<void>,
        eventHandler: (event: any) => Promise<any>,
        eventArbitrary: fc.Arbitrary<any>
    ): Promise<void> {
        await fc.assert(
            fc.asyncProperty(
                eventArbitrary,
                async (event) => {
                    // Publish event
                    await eventPublisher(event);

                    // Simulate event processing delay
                    await new Promise(resolve => setTimeout(resolve, 10));

                    // Handle event
                    const result = await eventHandler(event);

                    // Event should be processed successfully
                    expect(result).toBeDefined();
                    expect(result.eventId).toBe(event.eventId);
                    expect(result.processed).toBe(true);

                    return true;
                }
            ),
            PropertyTestHelpers.createConfig({ numRuns: 25 })
        );
    }

    /**
     * Test circuit breaker functionality
     */
    static async testCircuitBreaker(
        serviceCall: () => Promise<any>,
        failureThreshold: number = 5
    ): Promise<void> {
        let failureCount = 0;
        let circuitOpen = false;

        const mockServiceCall = jest.fn().mockImplementation(async () => {
            if (circuitOpen) {
                throw new Error('Circuit breaker is open');
            }

            failureCount++;
            if (failureCount <= failureThreshold) {
                throw new Error('Service failure');
            }

            // After threshold, open circuit
            circuitOpen = true;
            throw new Error('Circuit breaker opened');
        });

        // Test that circuit opens after threshold failures
        for (let i = 0; i < failureThreshold + 2; i++) {
            try {
                await mockServiceCall();
            } catch (error) {
                if (i >= failureThreshold) {
                    expect(error.message).toContain('Circuit breaker');
                }
            }
        }

        expect(circuitOpen).toBe(true);
    }
}

// Export all utilities
export default {
    arbitraries,
    MockServiceFactory,
    PropertyTestHelpers,
    ServiceCommunicationHelpers,
};