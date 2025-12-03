/**
 * Fallback Manager Usage Examples
 * 
 * Demonstrates how to use the FallbackManager for handling
 * strand failures with automatic retry and fallback strategies.
 */

import { getFallbackManager, FallbackManager } from './fallback-manager';
import type { AgentStrand } from '../agent-core';
import type { WorkerTask } from '../worker-protocol';
import type { RoutingContext, FallbackStrategy } from './types';

/**
 * Example 1: Basic fallback execution
 */
async function basicFallbackExample() {
    const fallbackManager = getFallbackManager();

    // Simulate a failed strand
    const failedStrand: AgentStrand = {
        id: 'strand_123',
        type: 'content-generator',
        state: 'error',
        capabilities: {
            qualityScore: 0.8,
            speedScore: 0.7,
            reliabilityScore: 0.6,
            supportedFormats: ['text', 'markdown'],
        },
        memory: {
            workingMemory: {},
            shortTermMemory: [],
            longTermMemoryId: undefined,
        },
        metrics: {
            totalTasks: 100,
            successfulTasks: 85,
            failedTasks: 15,
            avgExecutionTime: 5000,
            successRate: 0.85,
            currentLoad: 0.5,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    };

    // Task that failed
    const task: WorkerTask = {
        id: 'task_456',
        type: 'content-generator',
        description: 'Generate blog post about market trends',
        input: {
            topic: 'Real estate market trends 2024',
            length: 'long',
            tone: 'professional',
        },
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'failed',
    };

    // Routing context
    const context: RoutingContext = {
        userId: 'user_789',
        priority: 'normal',
        confidenceThreshold: 0.7,
        humanReviewAvailable: true,
        maxRetries: 3,
        retryCount: 0,
    };

    // Execute fallback
    const error = new Error('Timeout: Model took too long to respond');
    const result = await fallbackManager.executeFallback(
        failedStrand,
        task,
        context,
        error
    );

    if (result.success) {
        console.log('✓ Fallback succeeded!');
        console.log(`  Strategy: ${result.strategy.name}`);
        console.log(`  Attempts: ${result.attempts}`);
        console.log(`  Total time: ${result.totalTime}ms`);
        console.log(`  Result:`, result.result);
    } else {
        console.log('✗ Fallback failed');
        console.log(`  Attempts: ${result.attempts}`);
        console.log(`  Error: ${result.error?.message}`);
        console.log(`  History:`, result.history);
    }
}

/**
 * Example 2: Custom fallback strategy
 */
async function customStrategyExample() {
    const fallbackManager = getFallbackManager();

    // Register a custom fallback strategy
    const customStrategy: FallbackStrategy = {
        id: 'custom_premium_fallback',
        name: 'Premium model fallback',
        alternativeStrand: {
            id: 'premium_strand',
            type: 'content-generator',
            state: 'active',
            capabilities: {
                qualityScore: 0.95,
                speedScore: 0.6,
                reliabilityScore: 0.9,
                supportedFormats: ['text', 'markdown', 'html'],
            },
            memory: {
                workingMemory: {},
                shortTermMemory: [],
                longTermMemoryId: undefined,
            },
            metrics: {
                totalTasks: 50,
                successfulTasks: 48,
                failedTasks: 2,
                avgExecutionTime: 8000,
                successRate: 0.96,
                currentLoad: 0.3,
            },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        },
        retryWithBackoff: {
            initialDelayMs: 500,
            maxDelayMs: 5000,
            multiplier: 2,
        },
    };

    fallbackManager.registerStrategy(customStrategy);

    console.log('✓ Custom strategy registered:', customStrategy.name);

    // Retrieve the strategy
    const retrieved = fallbackManager.getStrategy('custom_premium_fallback');
    console.log('✓ Strategy retrieved:', retrieved?.name);
}

/**
 * Example 3: Fallback statistics and tracking
 */
async function statisticsExample() {
    const fallbackManager = getFallbackManager({
        enableTracking: true,
        trackingRetentionDays: 30,
        enableStrategyLearning: true,
    });

    // Simulate some fallback executions
    const failedStrand: AgentStrand = {
        id: 'strand_abc',
        type: 'data-analyst',
        state: 'error',
        capabilities: {
            qualityScore: 0.7,
            speedScore: 0.8,
            reliabilityScore: 0.7,
            supportedFormats: ['json', 'csv'],
        },
        memory: {
            workingMemory: {},
            shortTermMemory: [],
            longTermMemoryId: undefined,
        },
        metrics: {
            totalTasks: 200,
            successfulTasks: 170,
            failedTasks: 30,
            avgExecutionTime: 3000,
            successRate: 0.85,
            currentLoad: 0.6,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    };

    // Execute multiple fallbacks
    for (let i = 0; i < 5; i++) {
        const task: WorkerTask = {
            id: `task_${i}`,
            type: 'data-analyst',
            description: `Analyze data set ${i}`,
            input: { dataSet: `data_${i}` },
            dependencies: [],
            createdAt: new Date().toISOString(),
            status: 'failed',
        };

        const context: RoutingContext = {
            userId: 'user_test',
            priority: 'normal',
            humanReviewAvailable: false,
        };

        const error = new Error(i % 2 === 0 ? 'Timeout error' : 'Rate limit exceeded');
        await fallbackManager.executeFallback(failedStrand, task, context, error);
    }

    // Get statistics
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago

    const stats = await fallbackManager.getStatistics(startDate, endDate);

    console.log('\n=== Fallback Statistics ===');
    console.log(`Total attempts: ${stats.totalAttempts}`);
    console.log(`Successful: ${stats.successfulFallbacks}`);
    console.log(`Failed: ${stats.failedFallbacks}`);
    console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`Avg attempts per fallback: ${stats.avgAttemptsPerFallback.toFixed(1)}`);
    console.log(`Avg fallback time: ${stats.avgFallbackTime.toFixed(0)}ms`);

    console.log('\nCommon failure reasons:');
    stats.commonFailureReasons.forEach(({ reason, count }) => {
        console.log(`  - ${reason}: ${count} times`);
    });

    console.log('\nMost effective strategies:');
    stats.effectiveStrategies.forEach(({ strategyId, successRate }) => {
        console.log(`  - ${strategyId}: ${(successRate * 100).toFixed(1)}% success rate`);
    });
}

/**
 * Example 4: Tracking records and filtering
 */
async function trackingRecordsExample() {
    const fallbackManager = getFallbackManager({
        enableTracking: true,
    });

    // Get all tracking records
    const allRecords = fallbackManager.getTrackingRecords();
    console.log(`Total tracking records: ${allRecords.length}`);

    // Filter by user
    const userRecords = fallbackManager.getTrackingRecords({
        userId: 'user_test',
    });
    console.log(`Records for user_test: ${userRecords.length}`);

    // Filter by success
    const successfulRecords = fallbackManager.getTrackingRecords({
        success: true,
    });
    console.log(`Successful fallbacks: ${successfulRecords.length}`);

    // Filter by date range
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

    const recentRecords = fallbackManager.getTrackingRecords({
        startDate,
        endDate,
    });
    console.log(`Records in last 7 days: ${recentRecords.length}`);

    // Display detailed information for recent records
    console.log('\n=== Recent Fallback Records ===');
    recentRecords.slice(0, 3).forEach(record => {
        console.log(`\nTask: ${record.taskId}`);
        console.log(`  User: ${record.userId}`);
        console.log(`  Failed strand: ${record.failedStrand.type}`);
        console.log(`  Success: ${record.result.success ? '✓' : '✗'}`);
        console.log(`  Strategy: ${record.result.strategy.name}`);
        console.log(`  Attempts: ${record.result.attempts}`);
        console.log(`  Time: ${record.result.totalTime}ms`);
        console.log(`  Created: ${record.createdAt}`);
    });
}

/**
 * Example 5: Configuring fallback behavior
 */
async function configurationExample() {
    // Create fallback manager with custom configuration
    const fallbackManager = new FallbackManager({
        maxAttempts: 5,
        enableBackoff: true,
        initialBackoffMs: 2000,
        maxBackoffMs: 30000,
        backoffMultiplier: 3,
        enableTracking: true,
        trackingRetentionDays: 60,
        enableStrategyLearning: true,
    });

    console.log('✓ FallbackManager configured with custom settings:');
    console.log('  - Max attempts: 5');
    console.log('  - Initial backoff: 2000ms');
    console.log('  - Max backoff: 30000ms');
    console.log('  - Backoff multiplier: 3x');
    console.log('  - Tracking retention: 60 days');
    console.log('  - Strategy learning: enabled');
}

/**
 * Example 6: Handling different error types
 */
async function errorHandlingExample() {
    const fallbackManager = getFallbackManager();

    const failedStrand: AgentStrand = {
        id: 'strand_error_test',
        type: 'market-forecaster',
        state: 'error',
        capabilities: {
            qualityScore: 0.75,
            speedScore: 0.7,
            reliabilityScore: 0.8,
            supportedFormats: ['json'],
        },
        memory: {
            workingMemory: {},
            shortTermMemory: [],
            longTermMemoryId: undefined,
        },
        metrics: {
            totalTasks: 150,
            successfulTasks: 130,
            failedTasks: 20,
            avgExecutionTime: 4000,
            successRate: 0.87,
            currentLoad: 0.4,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    };

    const task: WorkerTask = {
        id: 'task_error_test',
        type: 'market-forecaster',
        description: 'Forecast market trends',
        input: { region: 'California', timeframe: '6 months' },
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'failed',
    };

    const context: RoutingContext = {
        userId: 'user_error_test',
        priority: 'high',
        humanReviewAvailable: true,
    };

    // Test different error types
    const errorTypes = [
        new Error('Timeout: Request exceeded 30 seconds'),
        new Error('Rate limit exceeded: Too many requests'),
        new Error('Network connection failed'),
        new Error('Invalid input: Missing required field'),
        new Error('Model unavailable: Service temporarily down'),
    ];

    console.log('\n=== Testing Different Error Types ===');

    for (const error of errorTypes) {
        console.log(`\nError: ${error.message}`);

        const result = await fallbackManager.executeFallback(
            failedStrand,
            task,
            context,
            error
        );

        console.log(`  Result: ${result.success ? '✓ Success' : '✗ Failed'}`);
        console.log(`  Strategy: ${result.strategy.name}`);
        console.log(`  Attempts: ${result.attempts}`);
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('=== Fallback Manager Examples ===\n');

    console.log('1. Basic Fallback Execution');
    await basicFallbackExample();

    console.log('\n2. Custom Strategy Registration');
    await customStrategyExample();

    console.log('\n3. Fallback Statistics');
    await statisticsExample();

    console.log('\n4. Tracking Records');
    await trackingRecordsExample();

    console.log('\n5. Configuration');
    await configurationExample();

    console.log('\n6. Error Handling');
    await errorHandlingExample();

    console.log('\n=== All Examples Complete ===');
}

// Export examples
export {
    basicFallbackExample,
    customStrategyExample,
    statisticsExample,
    trackingRecordsExample,
    configurationExample,
    errorHandlingExample,
    runAllExamples,
};

// Run if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
