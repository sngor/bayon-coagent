/**
 * Load Balancer Usage Examples
 * 
 * Demonstrates how to use the LoadBalancer for intelligent task distribution
 * based on real-time load and performance metrics.
 */

import { LoadBalancer, getLoadBalancer, resetLoadBalancer } from './load-balancer';
import type { LoadBalancerConfig } from './load-balancer';
import type { AgentStrand } from '../agent-core';
import type { WorkerTask } from '../worker-protocol';
import type { RoutingContext } from './types';

/**
 * Example 1: Basic load balancing with default configuration
 */
export async function basicLoadBalancing() {
    console.log('=== Example 1: Basic Load Balancing ===\n');

    // Get load balancer with default configuration
    const loadBalancer = getLoadBalancer();

    // Create mock strands
    const strands: AgentStrand[] = [
        createMockStrand('strand-1', 'content-generator', 0.3),
        createMockStrand('strand-2', 'content-generator', 0.7),
        createMockStrand('strand-3', 'content-generator', 0.5),
    ];

    // Create a task
    const task: WorkerTask = {
        id: 'task-1',
        type: 'content-generator',
        description: 'Generate blog post',
        input: { topic: 'Real Estate Market Trends' },
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    // Create routing context
    const context: RoutingContext = {
        userId: 'user-123',
        priority: 'normal',
        humanReviewAvailable: true,
    };

    // Select optimal strand
    const selectedStrand = loadBalancer.selectStrand(task, strands, context);
    console.log(`Selected strand: ${selectedStrand.id} (load: ${selectedStrand.metrics.currentLoad})`);

    // Get load distribution
    const distribution = loadBalancer.getLoadDistribution();
    console.log('\nLoad Distribution:');
    console.log(`  Total strands: ${distribution.totalStrands}`);
    console.log(`  Average load: ${(distribution.avgLoad * 100).toFixed(1)}%`);
    console.log(`  Balance score: ${distribution.balanceScore.toFixed(2)}`);
    console.log(`  Overloaded: ${distribution.overloadedStrands.length}`);
}

/**
 * Example 2: Load balancing with custom strategy
 */
export async function customStrategyLoadBalancing() {
    console.log('\n=== Example 2: Custom Strategy Load Balancing ===\n');

    // Reset to create new instance
    resetLoadBalancer();

    // Configure with least-loaded strategy
    const config: Partial<LoadBalancerConfig> = {
        strategy: 'least-loaded',
        overloadThreshold: 0.75,
        enableMonitoring: true,
        monitoringIntervalMs: 3000,
    };

    const loadBalancer = getLoadBalancer(config);

    // Create strands with varying loads
    const strands: AgentStrand[] = [
        createMockStrand('strand-1', 'data-analyst', 0.9),
        createMockStrand('strand-2', 'data-analyst', 0.2),
        createMockStrand('strand-3', 'data-analyst', 0.6),
    ];

    const task: WorkerTask = {
        id: 'task-2',
        type: 'data-analyst',
        description: 'Analyze market data',
        input: { region: 'San Francisco' },
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    const context: RoutingContext = {
        userId: 'user-456',
        priority: 'high',
        humanReviewAvailable: false,
    };

    // Select strand - should pick strand-2 (lowest load)
    const selectedStrand = loadBalancer.selectStrand(task, strands, context);
    console.log(`Selected strand: ${selectedStrand.id} (load: ${selectedStrand.metrics.currentLoad})`);
    console.log('Expected: strand-2 (least loaded)');
}

/**
 * Example 3: Real-time load monitoring and updates
 */
export async function realTimeLoadMonitoring() {
    console.log('\n=== Example 3: Real-time Load Monitoring ===\n');

    resetLoadBalancer();

    const loadBalancer = getLoadBalancer({
        strategy: 'adaptive',
        enableMonitoring: true,
        enableHealthChecks: true,
    });

    // Create strands
    const strands: AgentStrand[] = [
        createMockStrand('strand-1', 'content-generator', 0.4),
        createMockStrand('strand-2', 'content-generator', 0.6),
    ];

    // Update load metrics over time
    console.log('Initial load metrics:');
    strands.forEach(strand => {
        loadBalancer.updateLoadMetrics(strand.id, {
            strandId: strand.id,
            currentLoad: strand.metrics.currentLoad,
            avgResponseTime: 2000,
            successRate: 0.95,
            queueDepth: 5,
            lastUpdated: new Date().toISOString(),
        });

        const metrics = loadBalancer.getLoadMetrics(strand.id);
        console.log(`  ${strand.id}: load=${(metrics!.currentLoad * 100).toFixed(0)}%, ` +
            `response=${metrics!.avgResponseTime}ms, success=${(metrics!.successRate * 100).toFixed(0)}%`);
    });

    // Simulate load increase on strand-1
    console.log('\nSimulating load increase on strand-1...');
    loadBalancer.updateLoadMetrics('strand-1', {
        strandId: 'strand-1',
        currentLoad: 0.85,
        avgResponseTime: 5000,
        successRate: 0.90,
        queueDepth: 20,
        lastUpdated: new Date().toISOString(),
    });

    // Check health status
    const health1 = loadBalancer.getHealthStatus('strand-1');
    console.log(`\nStrand-1 health: ${health1?.status} (score: ${health1?.healthScore.toFixed(2)})`);
    if (health1?.issues.length) {
        console.log('Issues:', health1.issues);
    }

    // Get updated distribution
    const distribution = loadBalancer.getLoadDistribution();
    console.log('\nLoad Distribution:');
    console.log(`  Balance score: ${distribution.balanceScore.toFixed(2)}`);
    console.log(`  Overloaded strands: ${distribution.overloadedStrands.join(', ') || 'none'}`);
}

/**
 * Example 4: Priority-based load balancing
 */
export async function priorityBasedLoadBalancing() {
    console.log('\n=== Example 4: Priority-based Load Balancing ===\n');

    resetLoadBalancer();

    const loadBalancer = getLoadBalancer({
        strategy: 'adaptive',
    });

    const strands: AgentStrand[] = [
        createMockStrand('fast-strand', 'content-generator', 0.6, 1500),
        createMockStrand('slow-strand', 'content-generator', 0.3, 5000),
    ];

    // Update metrics
    strands.forEach(strand => {
        loadBalancer.updateLoadMetrics(strand.id, {
            strandId: strand.id,
            currentLoad: strand.metrics.currentLoad,
            avgResponseTime: strand.metrics.avgExecutionTime,
            successRate: 0.95,
            queueDepth: 5,
            lastUpdated: new Date().toISOString(),
        });
    });

    // Normal priority task
    const normalTask: WorkerTask = {
        id: 'task-normal',
        type: 'content-generator',
        description: 'Generate content',
        input: {},
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    const normalContext: RoutingContext = {
        userId: 'user-789',
        priority: 'normal',
        humanReviewAvailable: true,
    };

    const normalStrand = loadBalancer.selectStrand(normalTask, strands, normalContext);
    console.log(`Normal priority task routed to: ${normalStrand.id}`);

    // Urgent priority task
    const urgentTask: WorkerTask = {
        id: 'task-urgent',
        type: 'content-generator',
        description: 'Generate urgent content',
        input: {},
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    const urgentContext: RoutingContext = {
        userId: 'user-789',
        priority: 'urgent',
        humanReviewAvailable: true,
    };

    const urgentStrand = loadBalancer.selectStrand(urgentTask, strands, urgentContext);
    console.log(`Urgent priority task routed to: ${urgentStrand.id}`);
    console.log('Note: Urgent tasks prefer faster strands even if more loaded');
}

/**
 * Example 5: Health checks and degraded strand handling
 */
export async function healthCheckExample() {
    console.log('\n=== Example 5: Health Checks ===\n');

    resetLoadBalancer();

    const loadBalancer = getLoadBalancer({
        strategy: 'adaptive',
        enableHealthChecks: true,
        overloadThreshold: 0.8,
    });

    const strands: AgentStrand[] = [
        createMockStrand('healthy-strand', 'content-generator', 0.5),
        createMockStrand('degraded-strand', 'content-generator', 0.85),
        createMockStrand('unhealthy-strand', 'content-generator', 0.95),
    ];

    // Update metrics to reflect different health states
    loadBalancer.updateLoadMetrics('healthy-strand', {
        strandId: 'healthy-strand',
        currentLoad: 0.5,
        avgResponseTime: 2000,
        successRate: 0.98,
        queueDepth: 5,
        lastUpdated: new Date().toISOString(),
    });

    loadBalancer.updateLoadMetrics('degraded-strand', {
        strandId: 'degraded-strand',
        currentLoad: 0.85,
        avgResponseTime: 8000,
        successRate: 0.75,
        queueDepth: 50,
        lastUpdated: new Date().toISOString(),
    });

    loadBalancer.updateLoadMetrics('unhealthy-strand', {
        strandId: 'unhealthy-strand',
        currentLoad: 0.95,
        avgResponseTime: 15000,
        successRate: 0.60,
        queueDepth: 150,
        lastUpdated: new Date().toISOString(),
    });

    // Perform health checks
    console.log('Health Status:');
    for (const strand of strands) {
        const health = await loadBalancer.performHealthCheck(strand);
        console.log(`\n${strand.id}:`);
        console.log(`  Status: ${health.status}`);
        console.log(`  Score: ${health.healthScore.toFixed(2)}`);
        if (health.issues.length > 0) {
            console.log(`  Issues: ${health.issues.join(', ')}`);
        }
    }

    // Try to route a task - should avoid unhealthy strand
    const task: WorkerTask = {
        id: 'task-health',
        type: 'content-generator',
        description: 'Generate content',
        input: {},
        dependencies: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    const context: RoutingContext = {
        userId: 'user-health',
        priority: 'normal',
        humanReviewAvailable: true,
    };

    const selectedStrand = loadBalancer.selectStrand(task, strands, context);
    console.log(`\nTask routed to: ${selectedStrand.id}`);
    console.log('Note: Unhealthy strands are filtered out');
}

/**
 * Example 6: Load distribution analysis
 */
export async function loadDistributionAnalysis() {
    console.log('\n=== Example 6: Load Distribution Analysis ===\n');

    resetLoadBalancer();

    const loadBalancer = getLoadBalancer();

    // Create strands with unbalanced load
    const strands: AgentStrand[] = [
        createMockStrand('strand-1', 'content-generator', 0.9),
        createMockStrand('strand-2', 'content-generator', 0.2),
        createMockStrand('strand-3', 'content-generator', 0.8),
        createMockStrand('strand-4', 'content-generator', 0.3),
    ];

    // Update metrics
    strands.forEach(strand => {
        loadBalancer.updateLoadMetrics(strand.id, {
            strandId: strand.id,
            currentLoad: strand.metrics.currentLoad,
            avgResponseTime: 3000,
            successRate: 0.95,
            queueDepth: Math.floor(strand.metrics.currentLoad * 50),
            lastUpdated: new Date().toISOString(),
        });
    });

    // Analyze distribution
    const distribution = loadBalancer.getLoadDistribution();

    console.log('Load Distribution Analysis:');
    console.log(`  Total strands: ${distribution.totalStrands}`);
    console.log(`  Average load: ${(distribution.avgLoad * 100).toFixed(1)}%`);
    console.log(`  Load std dev: ${distribution.loadStdDev.toFixed(3)}`);
    console.log(`  Balance score: ${distribution.balanceScore.toFixed(2)} (0=poor, 1=perfect)`);
    console.log(`\nOverloaded strands (>${(0.8 * 100).toFixed(0)}% load):`);
    distribution.overloadedStrands.forEach(id => {
        const metrics = loadBalancer.getLoadMetrics(id);
        console.log(`  ${id}: ${(metrics!.currentLoad * 100).toFixed(0)}%`);
    });
    console.log(`\nUnderutilized strands (<30% load when avg>${(distribution.avgLoad * 100).toFixed(0)}%):`);
    distribution.underutilizedStrands.forEach(id => {
        const metrics = loadBalancer.getLoadMetrics(id);
        console.log(`  ${id}: ${(metrics!.currentLoad * 100).toFixed(0)}%`);
    });
}

/**
 * Helper function to create mock strand
 */
function createMockStrand(
    id: string,
    type: string,
    load: number,
    avgTime: number = 3000
): AgentStrand {
    return {
        id,
        type,
        state: 'active',
        capabilities: {
            qualityScore: 0.85,
            speedScore: 0.80,
            reliabilityScore: 0.90,
            supportedFormats: ['text', 'json'],
            maxConcurrentTasks: 10,
        },
        memory: {
            workingMemory: {},
            shortTermMemory: [],
            longTermMemoryId: undefined,
        },
        metrics: {
            totalTasks: 100,
            successfulTasks: 95,
            failedTasks: 5,
            avgExecutionTime: avgTime,
            totalCost: 10.50,
            currentLoad: load,
            successRate: 0.95,
            lastTaskAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    };
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    await basicLoadBalancing();
    await customStrategyLoadBalancing();
    await realTimeLoadMonitoring();
    await priorityBasedLoadBalancing();
    await healthCheckExample();
    await loadDistributionAnalysis();

    // Cleanup
    resetLoadBalancer();
    console.log('\n=== All examples completed ===');
}

// Run examples if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
