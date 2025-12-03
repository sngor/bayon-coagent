/**
 * Adaptive Router Usage Examples
 * 
 * Examples demonstrating how to use the adaptive routing system
 * for intelligent task routing with confidence-based decisions.
 */

import { getAdaptiveRouter } from './adaptive-router';
import { getAgentCore } from '../agent-core';
import { createWorkerTask } from '../worker-protocol';
import type { RoutingContext } from './types';

/**
 * Example 1: Basic task routing with confidence threshold
 */
export async function example1_BasicRouting() {
    console.log('\n=== Example 1: Basic Task Routing ===\n');

    const router = getAdaptiveRouter();
    const agentCore = getAgentCore();

    // Create a task
    const task = createWorkerTask({
        type: 'content-generator',
        description: 'Generate a blog post about market trends',
        input: {
            topic: 'Real estate market trends 2024',
            tone: 'professional',
            length: 'medium',
        },
    });

    // Define routing context
    const context: RoutingContext = {
        userId: 'user_123',
        priority: 'normal',
        confidenceThreshold: 0.7,
        humanReviewAvailable: true,
    };

    // Get available strands
    const availableStrands = agentCore.getStrandsByType('content-generator');

    // Route the task
    const decision = await router.routeTask(task, availableStrands, context);

    console.log('Routing Decision:');
    console.log(`- Selected Strand: ${decision.selectedStrand.id}`);
    console.log(`- Confidence: ${decision.confidence.toFixed(2)}`);
    console.log(`- Action: ${decision.action}`);
    console.log(`- Rationale: ${decision.rationale}`);
    console.log(`- Estimated Cost: $${decision.estimatedCost.toFixed(4)}`);
    console.log(`- Estimated Time: ${decision.estimatedTime}ms`);
    console.log(`- Alternatives: ${decision.alternativeStrands.length}`);
}

/**
 * Example 2: High-priority urgent task routing
 */
export async function example2_UrgentTaskRouting() {
    console.log('\n=== Example 2: Urgent Task Routing ===\n');

    const router = getAdaptiveRouter();
    const agentCore = getAgentCore();

    const task = createWorkerTask({
        type: 'data-analyst',
        description: 'Analyze urgent market data for client meeting',
        input: {
            dataSource: 'market-api',
            analysisType: 'trend-analysis',
            urgency: 'high',
        },
    });

    const context: RoutingContext = {
        userId: 'user_456',
        priority: 'urgent', // Urgent priority
        confidenceThreshold: 0.6, // Lower threshold for urgent tasks
        humanReviewAvailable: false,
    };

    const availableStrands = agentCore.getStrandsByType('data-analyst');
    const decision = await router.routeTask(task, availableStrands, context);

    console.log('Urgent Task Routing:');
    console.log(`- Action: ${decision.action}`);
    console.log(`- Confidence: ${decision.confidence.toFixed(2)}`);
    console.log(`- Selected for speed: ${decision.selectedStrand.capabilities.speedScore.toFixed(2)}`);
}

/**
 * Example 3: Low confidence handling with human review
 */
export async function example3_LowConfidenceHandling() {
    console.log('\n=== Example 3: Low Confidence Handling ===\n');

    const router = getAdaptiveRouter();

    const task = createWorkerTask({
        type: 'market-forecaster',
        description: 'Predict market trends for next quarter',
        input: {
            region: 'San Francisco Bay Area',
            timeframe: 'Q1 2024',
        },
    });

    // Simulate a low-confidence result
    const mockResult = {
        taskId: task.id,
        status: 'success' as const,
        output: { prediction: 'Market will remain stable' },
        metadata: {
            confidence: 0.45, // Low confidence
            executionTime: 5000,
        },
    };

    const context: RoutingContext = {
        userId: 'user_789',
        priority: 'high',
        confidenceThreshold: 0.7,
        humanReviewAvailable: true,
    };

    const action = await router.handleLowConfidence(task, mockResult, context);

    console.log('Low Confidence Handling:');
    console.log(`- Result Confidence: ${mockResult.metadata.confidence}`);
    console.log(`- Threshold: ${context.confidenceThreshold}`);
    console.log(`- Recommended Action: ${action}`);
}

/**
 * Example 4: Fallback strategy execution
 */
export async function example4_FallbackExecution() {
    console.log('\n=== Example 4: Fallback Strategy ===\n');

    const router = getAdaptiveRouter();
    const agentCore = getAgentCore();

    const task = createWorkerTask({
        type: 'content-generator',
        description: 'Generate complex marketing content',
        input: {
            contentType: 'marketing-plan',
            complexity: 'high',
        },
    });

    const failedStrand = agentCore.getStrandsByType('content-generator')[0];

    const context: RoutingContext = {
        userId: 'user_101',
        priority: 'normal',
        humanReviewAvailable: false,
        retryCount: 0,
        maxRetries: 3,
    };

    const fallback = await router.executeFallback(failedStrand, task, context);

    if (fallback) {
        console.log('Fallback Strategy:');
        console.log(`- Strategy: ${fallback.name}`);
        console.log(`- Retry with backoff: ${fallback.retryWithBackoff ? 'Yes' : 'No'}`);
        if (fallback.retryWithBackoff) {
            console.log(`  - Initial delay: ${fallback.retryWithBackoff.initialDelayMs}ms`);
            console.log(`  - Max delay: ${fallback.retryWithBackoff.maxDelayMs}ms`);
            console.log(`  - Multiplier: ${fallback.retryWithBackoff.multiplier}x`);
        }
        console.log(`- Simplify model: ${fallback.simplifyModel ? 'Yes' : 'No'}`);
    }
}

/**
 * Example 5: Load-based routing with metrics
 */
export async function example5_LoadBasedRouting() {
    console.log('\n=== Example 5: Load-Based Routing ===\n');

    const router = getAdaptiveRouter({
        enableLoadBalancing: true,
    });
    const agentCore = getAgentCore();

    // Update load metrics for strands
    const strands = agentCore.getStrandsByType('data-analyst');
    strands.forEach((strand, index) => {
        router.updateLoadMetrics(strand.id, {
            strandId: strand.id,
            currentLoad: index * 0.3, // Simulate different loads
            avgResponseTime: 3000 + (index * 1000),
            successRate: 0.95 - (index * 0.05),
            queueDepth: index * 2,
        });
    });

    const task = createWorkerTask({
        type: 'data-analyst',
        description: 'Analyze property data',
        input: { propertyId: 'prop_123' },
    });

    const context: RoutingContext = {
        userId: 'user_202',
        priority: 'normal',
        humanReviewAvailable: false,
    };

    const decision = await router.routeTask(task, strands, context);

    console.log('Load-Based Routing:');
    console.log(`- Selected Strand: ${decision.selectedStrand.id}`);
    const loadMetrics = router.getLoadMetrics(decision.selectedStrand.id);
    if (loadMetrics) {
        console.log(`- Current Load: ${(loadMetrics.currentLoad * 100).toFixed(0)}%`);
        console.log(`- Avg Response Time: ${loadMetrics.avgResponseTime}ms`);
        console.log(`- Success Rate: ${(loadMetrics.successRate * 100).toFixed(0)}%`);
    }
}

/**
 * Example 6: Routing analytics
 */
export async function example6_RoutingAnalytics() {
    console.log('\n=== Example 6: Routing Analytics ===\n');

    const router = getAdaptiveRouter();
    const agentCore = getAgentCore();

    // Simulate multiple routing decisions
    const tasks = [
        { type: 'content-generator' as const, priority: 'normal' as const },
        { type: 'data-analyst' as const, priority: 'high' as const },
        { type: 'market-forecaster' as const, priority: 'urgent' as const },
        { type: 'content-generator' as const, priority: 'normal' as const },
        { type: 'data-analyst' as const, priority: 'low' as const },
    ];

    for (const taskConfig of tasks) {
        const task = createWorkerTask({
            type: taskConfig.type,
            description: `Task for ${taskConfig.type}`,
            input: {},
        });

        const context: RoutingContext = {
            userId: 'user_analytics',
            priority: taskConfig.priority,
            humanReviewAvailable: true,
        };

        const strands = agentCore.getStrandsByType(taskConfig.type);
        await router.routeTask(task, strands, context);

        // Simulate outcome
        await router.updateDecisionOutcome(task.id, {
            success: Math.random() > 0.1,
            executionTime: 3000 + Math.random() * 2000,
            actualCost: 0.001 + Math.random() * 0.002,
            confidence: 0.7 + Math.random() * 0.3,
        });
    }

    // Get analytics
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    const analytics = await router.getAnalytics(startDate, endDate);

    console.log('Routing Analytics:');
    console.log(`- Total Decisions: ${analytics.totalDecisions}`);
    console.log(`- Average Confidence: ${analytics.avgConfidence.toFixed(2)}`);
    console.log(`- Human Review Rate: ${(analytics.humanReviewRate * 100).toFixed(1)}%`);
    console.log(`- Fallback Rate: ${(analytics.fallbackRate * 100).toFixed(1)}%`);
    console.log(`- Retry Rate: ${(analytics.retryRate * 100).toFixed(1)}%`);
    console.log('\nDecisions by Action:');
    Object.entries(analytics.byAction).forEach(([action, count]) => {
        console.log(`  - ${action}: ${count}`);
    });
    console.log('\nRouting Accuracy:');
    console.log(`  - Cost Accuracy: ${(analytics.routingAccuracy.costAccuracy * 100).toFixed(1)}%`);
    console.log(`  - Time Accuracy: ${(analytics.routingAccuracy.timeAccuracy * 100).toFixed(1)}%`);
    console.log(`  - Confidence Accuracy: ${(analytics.routingAccuracy.confidenceAccuracy * 100).toFixed(1)}%`);
}

/**
 * Example 7: Custom confidence thresholds
 */
export async function example7_CustomThresholds() {
    console.log('\n=== Example 7: Custom Confidence Thresholds ===\n');

    const router = getAdaptiveRouter({
        confidenceThresholds: {
            autoExecute: 0.8,    // Higher threshold for auto-execution
            humanReview: 0.6,    // Route to human if below 0.6
            retry: 0.4,          // Retry if below 0.4
            abort: 0.2,          // Abort if below 0.2
        },
    });

    console.log('Custom Thresholds Configured:');
    console.log('- Auto Execute: ≥ 0.8');
    console.log('- Human Review: 0.6 - 0.8');
    console.log('- Retry: 0.4 - 0.6');
    console.log('- Abort: < 0.2');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    await example1_BasicRouting();
    await example2_UrgentTaskRouting();
    await example3_LowConfidenceHandling();
    await example4_FallbackExecution();
    await example5_LoadBasedRouting();
    await example6_RoutingAnalytics();
    await example7_CustomThresholds();
}

// Run examples if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
