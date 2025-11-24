#!/usr/bin/env tsx
/**
 * Test Script for Trace Correlation
 * 
 * Demonstrates structured logging with X-Ray trace correlation.
 * Run with: npx tsx scripts/test-trace-correlation.ts
 */

import { logger, createLogger, generateCorrelationId } from '../src/aws/logging';
import { tracer } from '../src/aws/xray';

async function simulateUserLogin(userId: string, email: string) {
    const correlationId = generateCorrelationId();
    const requestLogger = logger.child({
        correlationId,
        service: 'auth-service',
        operation: 'user-login',
    });

    requestLogger.info('Login request received', { userId, email });

    // Start X-Ray trace
    const traceContext = await tracer.startTrace('user-login', {
        userId,
        requestId: correlationId,
        metadata: {
            email,
            timestamp: new Date().toISOString(),
        },
    });

    if (traceContext) {
        requestLogger.info('Trace started', {
            traceId: traceContext.traceId,
            correlationId: traceContext.correlationId,
        });
    }

    try {
        // Simulate authentication
        requestLogger.info('Validating credentials', { userId });
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate database lookup
        requestLogger.info('Looking up user in database', { userId });
        await tracer.traceAsync('database-query', async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Simulate token generation
        requestLogger.info('Generating auth token', { userId });
        await tracer.traceAsync('token-generation', async () => {
            await new Promise(resolve => setTimeout(resolve, 30));
        });

        requestLogger.info('Login successful', {
            userId,
            email,
            duration: 180,
        });

        await tracer.closeSegment();
        return { success: true, traceId: traceContext?.traceId };
    } catch (error) {
        requestLogger.error('Login failed', error as Error, { userId, email });
        await tracer.closeSegment(error as Error);
        throw error;
    }
}

async function simulateContentGeneration(userId: string, contentType: string) {
    const correlationId = generateCorrelationId();
    const requestLogger = logger.child({
        correlationId,
        service: 'ai-service',
        operation: 'generate-content',
    });

    requestLogger.info('Content generation request received', {
        userId,
        contentType,
    });

    const traceContext = await tracer.startTrace('generate-content', {
        userId,
        requestId: correlationId,
        metadata: {
            contentType,
            timestamp: new Date().toISOString(),
        },
    });

    if (traceContext) {
        requestLogger.info('Trace started', {
            traceId: traceContext.traceId,
            correlationId: traceContext.correlationId,
        });
    }

    try {
        // Simulate AI processing
        requestLogger.info('Invoking AI model', { contentType });
        await tracer.traceAsync('bedrock-invocation', async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        // Simulate content validation
        requestLogger.info('Validating generated content', { contentType });
        await tracer.traceAsync('content-validation', async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Simulate saving to database
        requestLogger.info('Saving content to database', { contentType });
        await tracer.traceAsync('database-save', async () => {
            await new Promise(resolve => setTimeout(resolve, 75));
        });

        requestLogger.info('Content generation completed', {
            userId,
            contentType,
            duration: 325,
        });

        await tracer.closeSegment();
        return { success: true, traceId: traceContext?.traceId };
    } catch (error) {
        requestLogger.error('Content generation failed', error as Error, {
            userId,
            contentType,
        });
        await tracer.closeSegment(error as Error);
        throw error;
    }
}

async function simulateErrorScenario(userId: string) {
    const correlationId = generateCorrelationId();
    const requestLogger = logger.child({
        correlationId,
        service: 'integration-service',
        operation: 'oauth-callback',
    });

    requestLogger.info('OAuth callback received', { userId });

    const traceContext = await tracer.startTrace('oauth-callback', {
        userId,
        requestId: correlationId,
    });

    if (traceContext) {
        requestLogger.info('Trace started', {
            traceId: traceContext.traceId,
            correlationId: traceContext.correlationId,
        });
    }

    try {
        requestLogger.info('Validating OAuth token', { userId });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Simulate an error
        throw new Error('Invalid OAuth token');
    } catch (error) {
        requestLogger.error('OAuth callback failed', error as Error, { userId });
        await tracer.closeSegment(error as Error);
        return { success: false, traceId: traceContext?.traceId, error };
    }
}

async function main() {
    console.log('=== Testing Structured Logging with Trace Correlation ===\n');

    // Test 1: Successful user login
    console.log('Test 1: User Login');
    const loginResult = await simulateUserLogin('user-123', 'user@example.com');
    console.log('Result:', loginResult);
    console.log('');

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 2: Content generation
    console.log('Test 2: Content Generation');
    const contentResult = await simulateContentGeneration('user-123', 'blog-post');
    console.log('Result:', contentResult);
    console.log('');

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 3: Error scenario
    console.log('Test 3: Error Scenario');
    const errorResult = await simulateErrorScenario('user-456');
    console.log('Result:', errorResult);
    console.log('');

    console.log('=== Test Complete ===');
    console.log('\nNote: If X-Ray is not enabled, trace IDs will not be included in logs.');
    console.log('To enable X-Ray, set XRAY_ENABLED=true in your environment.\n');

    console.log('To query these logs in CloudWatch Insights, use:');
    console.log('1. Find logs by correlation ID');
    console.log('2. Find logs by trace ID (if X-Ray is enabled)');
    console.log('3. Analyze service performance');
    console.log('\nSee src/aws/logging/TRACE_CORRELATION_GUIDE.md for more details.');
}

// Run the tests
main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
