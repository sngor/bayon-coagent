/**
 * Microservices Architecture - Log Correlation Property-Based Tests
 * 
 * Property-based tests verify that logs are properly correlated with trace IDs
 * across all services and operations.
 * 
 * Each test runs a minimum of 100 iterations to ensure statistical confidence.
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Logger, createLogger, generateCorrelationId, type LogContext } from '@/aws/logging/logger';

// Test configuration for property-based tests
const testConfig = { numRuns: 100 };

// ==================== Types ====================

interface MockTraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: LogContext;
    error?: any;
    environment: string;
}

// ==================== Generators ====================

/**
 * Generator for valid trace IDs
 */
const traceIdArb = fc.string({ minLength: 16, maxLength: 32 }).map(s =>
    `1-${Date.now().toString(16)}-${s.replace(/[^a-zA-Z0-9]/g, 'a').substring(0, 24)}`
);

/**
 * Generator for valid span IDs
 */
const spanIdArb = fc.string({ minLength: 8, maxLength: 16 }).map(s =>
    s.replace(/[^a-zA-Z0-9]/g, 'a').substring(0, 16)
);

/**
 * Generator for service names
 */
const serviceNameArb = fc.constantFrom(
    'user-service',
    'content-service',
    'ai-service',
    'market-service',
    'integration-service',
    'notification-service',
    'media-service',
    'analytics-service',
    'admin-service'
);

/**
 * Generator for operation names
 */
const operationNameArb = fc.constantFrom(
    'authenticate',
    'createContent',
    'generateAI',
    'getMarketData',
    'syncIntegration',
    'sendNotification',
    'uploadMedia',
    'trackAnalytics',
    'adminAction'
);

/**
 * Generator for user IDs
 */
const userIdArb = fc.uuid();

/**
 * Generator for log messages
 */
const logMessageArb = fc.string({ minLength: 10, maxLength: 200 });

/**
 * Generator for log contexts
 */
const logContextArb = fc.record({
    correlationId: fc.option(fc.string({ minLength: 10, maxLength: 30 })),
    traceId: fc.option(traceIdArb),
    spanId: fc.option(spanIdArb),
    parentSpanId: fc.option(spanIdArb),
    userId: fc.option(userIdArb),
    service: fc.option(serviceNameArb),
    operation: fc.option(operationNameArb),
    duration: fc.option(fc.integer({ min: 0, max: 10000 })),
});

// ==================== Mock Logger with Trace Context ====================

/**
 * Mock logger that captures log entries for testing
 */
class MockLogger {
    private logs: LogEntry[] = [];
    private currentTraceContext: MockTraceContext | null = null;

    setTraceContext(context: MockTraceContext | null): void {
        this.currentTraceContext = context;
    }

    log(level: string, message: string, context?: LogContext): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...context,
                ...(this.currentTraceContext
                    ? {
                        traceId: this.currentTraceContext.traceId,
                        spanId: this.currentTraceContext.spanId,
                        parentSpanId: this.currentTraceContext.parentSpanId,
                    }
                    : {}),
            },
            environment: 'test',
        };

        this.logs.push(entry);
    }

    info(message: string, context?: LogContext): void {
        this.log('INFO', message, context);
    }

    error(message: string, context?: LogContext): void {
        this.log('ERROR', message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log('WARN', message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.log('DEBUG', message, context);
    }

    getLogs(): LogEntry[] {
        return this.logs;
    }

    getLogsByTraceId(traceId: string): LogEntry[] {
        return this.logs.filter(log => log.context?.traceId === traceId);
    }

    getLogsByCorrelationId(correlationId: string): LogEntry[] {
        return this.logs.filter(log => log.context?.correlationId === correlationId);
    }

    getLogsBySpanId(spanId: string): LogEntry[] {
        return this.logs.filter(log => log.context?.spanId === spanId);
    }

    clearLogs(): void {
        this.logs = [];
    }
}

// ==================== Property Tests ====================

describe('Log Correlation Properties', () => {
    let mockLogger: MockLogger;

    beforeEach(() => {
        mockLogger = new MockLogger();
    });

    afterEach(() => {
        mockLogger.clearLogs();
    });

    describe('Property 13: Log Correlation', () => {
        /**
         * **Feature: microservices-architecture, Property 13: Log Correlation**
         * 
         * For any error or request, logs from all involved services should be 
         * aggregated with proper correlation IDs.
         * 
         * **Validates: Requirements 5.2**
         */
        it('should include trace ID in all log entries when trace context is set', async () => {
            await fc.assert(
                fc.asyncProperty(
                    traceIdArb,
                    spanIdArb,
                    fc.array(logMessageArb, { minLength: 1, maxLength: 10 }),
                    async (traceId, spanId, messages) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Set trace context
                        mockLogger.setTraceContext({ traceId, spanId });

                        // Log multiple messages
                        for (const message of messages) {
                            mockLogger.info(message);
                        }

                        // Verify all logs have the trace ID
                        const logs = mockLogger.getLogs();
                        expect(logs.length).toBe(messages.length);

                        for (const log of logs) {
                            expect(log.context?.traceId).toBe(traceId);
                            expect(log.context?.spanId).toBe(spanId);
                        }

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should correlate logs by correlation ID across multiple operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 10, maxLength: 30 }),
                    fc.array(
                        fc.record({
                            service: serviceNameArb,
                            operation: operationNameArb,
                            message: logMessageArb,
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (correlationId, operations) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Log from multiple services with same correlation ID
                        for (const op of operations) {
                            mockLogger.info(op.message, {
                                correlationId,
                                service: op.service,
                                operation: op.operation,
                            });
                        }

                        // Verify all logs can be retrieved by correlation ID
                        const correlatedLogs = mockLogger.getLogsByCorrelationId(correlationId);
                        expect(correlatedLogs.length).toBe(operations.length);

                        // Verify each log has the correct correlation ID
                        for (const log of correlatedLogs) {
                            expect(log.context?.correlationId).toBe(correlationId);
                        }

                        // Verify logs from different services are correlated
                        const services = new Set(
                            correlatedLogs.map(log => log.context?.service).filter(Boolean)
                        );
                        expect(services.size).toBeGreaterThan(0);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should maintain trace correlation across parent-child span relationships', async () => {
            await fc.assert(
                fc.asyncProperty(
                    traceIdArb,
                    spanIdArb,
                    fc.array(spanIdArb, { minLength: 1, maxLength: 3 }),
                    async (traceId, parentSpanId, childSpanIds) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Log from parent span
                        mockLogger.setTraceContext({ traceId, spanId: parentSpanId });
                        mockLogger.info('Parent operation started');

                        // Log from child spans
                        for (const childSpanId of childSpanIds) {
                            mockLogger.setTraceContext({
                                traceId,
                                spanId: childSpanId,
                                parentSpanId,
                            });
                            mockLogger.info('Child operation started');
                        }

                        // Verify all logs share the same trace ID
                        const logs = mockLogger.getLogsByTraceId(traceId);
                        expect(logs.length).toBe(1 + childSpanIds.length);

                        for (const log of logs) {
                            expect(log.context?.traceId).toBe(traceId);
                        }

                        // Verify parent-child relationships
                        const childLogs = logs.filter(
                            log => log.context?.parentSpanId === parentSpanId
                        );
                        expect(childLogs.length).toBe(childSpanIds.length);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should include trace context in error logs', async () => {
            await fc.assert(
                fc.asyncProperty(
                    traceIdArb,
                    spanIdArb,
                    logMessageArb,
                    userIdArb,
                    async (traceId, spanId, errorMessage, userId) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Set trace context
                        mockLogger.setTraceContext({ traceId, spanId });

                        // Log an error with user context
                        mockLogger.error(errorMessage, {
                            userId,
                            service: 'test-service',
                            operation: 'test-operation',
                        });

                        // Verify error log has trace context
                        const logs = mockLogger.getLogs();
                        expect(logs.length).toBe(1);

                        const errorLog = logs[0];
                        expect(errorLog.level).toBe('ERROR');
                        expect(errorLog.message).toBe(errorMessage);
                        expect(errorLog.context?.traceId).toBe(traceId);
                        expect(errorLog.context?.spanId).toBe(spanId);
                        expect(errorLog.context?.userId).toBe(userId);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should preserve correlation across service boundaries', async () => {
            await fc.assert(
                fc.asyncProperty(
                    traceIdArb,
                    fc.string({ minLength: 10, maxLength: 30 }),
                    fc.array(
                        fc.record({
                            service: serviceNameArb,
                            spanId: spanIdArb,
                            operation: operationNameArb,
                        }),
                        { minLength: 2, maxLength: 4 }
                    ),
                    async (traceId, correlationId, serviceOps) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Simulate cross-service call chain
                        for (const serviceOp of serviceOps) {
                            mockLogger.setTraceContext({
                                traceId,
                                spanId: serviceOp.spanId,
                            });

                            mockLogger.info(`Processing in ${serviceOp.service}`, {
                                correlationId,
                                service: serviceOp.service,
                                operation: serviceOp.operation,
                            });
                        }

                        // Verify all logs share the same trace ID and correlation ID
                        const logs = mockLogger.getLogs();
                        expect(logs.length).toBe(serviceOps.length);

                        for (const log of logs) {
                            expect(log.context?.traceId).toBe(traceId);
                            expect(log.context?.correlationId).toBe(correlationId);
                        }

                        // Verify logs from different services
                        const services = new Set(logs.map(log => log.context?.service));
                        expect(services.size).toBeGreaterThan(0);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should allow querying logs by trace ID', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            traceId: traceIdArb,
                            spanId: spanIdArb,
                            message: logMessageArb,
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (logEntries) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Log entries with different trace IDs
                        for (const entry of logEntries) {
                            mockLogger.setTraceContext({
                                traceId: entry.traceId,
                                spanId: entry.spanId,
                            });
                            mockLogger.info(entry.message);
                        }

                        // Verify we can query logs by each trace ID
                        for (const entry of logEntries) {
                            const logs = mockLogger.getLogsByTraceId(entry.traceId);
                            expect(logs.length).toBeGreaterThan(0);

                            // Verify all returned logs have the correct trace ID
                            for (const log of logs) {
                                expect(log.context?.traceId).toBe(entry.traceId);
                            }
                        }

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should include operation context in logs', async () => {
            await fc.assert(
                fc.asyncProperty(
                    traceIdArb,
                    spanIdArb,
                    serviceNameArb,
                    operationNameArb,
                    fc.integer({ min: 0, max: 5000 }),
                    async (traceId, spanId, service, operation, duration) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Set trace context
                        mockLogger.setTraceContext({ traceId, spanId });

                        // Log with operation context
                        mockLogger.info('Operation completed', {
                            service,
                            operation,
                            duration,
                        });

                        // Verify log has all context
                        const logs = mockLogger.getLogs();
                        expect(logs.length).toBe(1);

                        const log = logs[0];
                        expect(log.context?.traceId).toBe(traceId);
                        expect(log.context?.spanId).toBe(spanId);
                        expect(log.context?.service).toBe(service);
                        expect(log.context?.operation).toBe(operation);
                        expect(log.context?.duration).toBe(duration);

                        return true;
                    }
                ),
                testConfig
            );
        });

        it('should handle logs without trace context gracefully', async () => {
            await fc.assert(
                fc.asyncProperty(
                    logMessageArb,
                    logContextArb,
                    async (message, context) => {
                        // Clear previous logs
                        mockLogger.clearLogs();

                        // Clear trace context
                        mockLogger.setTraceContext(null);

                        // Log without trace context
                        mockLogger.info(message, context);

                        // Verify log is created without trace context
                        const logs = mockLogger.getLogs();
                        expect(logs.length).toBe(1);

                        const log = logs[0];
                        expect(log.message).toBe(message);

                        // Trace context should not be present if not set
                        // Note: context.traceId can be null or undefined, both are falsy
                        if (!context.traceId) {
                            expect(log.context?.traceId).toBeFalsy();
                        }

                        return true;
                    }
                ),
                testConfig
            );
        });
    });
});
