/**
 * Cost Monitor Usage Examples
 * 
 * Demonstrates how to use the CostMonitor class for tracking AI operation costs,
 * setting up alerts, and getting optimization suggestions.
 */

import { createCostMonitor } from './cost-monitor';
import { CostOperation, CostAlert } from './types';

/**
 * Example 1: Basic cost tracking
 */
async function example1_BasicCostTracking() {
    console.log('Example 1: Basic Cost Tracking\n');

    const costMonitor = createCostMonitor({
        tableName: 'bayon-coagent-dev',
        enableAlerts: false, // Disable alerts for this example
    });

    // Track a cost operation
    const operation: CostOperation = {
        id: 'op-123',
        strandId: 'strand-content-generator',
        userId: 'user-456',
        taskType: 'blog-post-generation',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        inputTokens: 1500,
        outputTokens: 3000,
        cost: costMonitor.calculateOperationCost(
            'anthropic.claude-3-5-sonnet-20241022-v2:0',
            1500,
            3000
        ),
        timestamp: new Date().toISOString(),
        metadata: {
            contentType: 'blog-post',
            quality: 'high',
        },
    };

    await costMonitor.trackCost(operation);

    console.log('✓ Cost tracked successfully');
    console.log(`  Operation ID: ${operation.id}`);
    console.log(`  Cost: $${operation.cost.toFixed(4)}`);
    console.log(`  Input tokens: ${operation.inputTokens}`);
    console.log(`  Output tokens: ${operation.outputTokens}`);
}

/**
 * Example 2: Calculate costs by dimension
 */
async function example2_CostsByDimension() {
    console.log('\nExample 2: Calculate Costs by Dimension\n');

    const costMonitor = createCostMonitor();

    // Calculate costs by strand for the last 7 days
    const strandCosts = await costMonitor.calculateCosts('strand', '7d');

    console.log('Costs by Strand (Last 7 Days):');
    console.log(`  Total: $${strandCosts.total.toFixed(2)}`);
    console.log(`  Period: ${strandCosts.period.start} to ${strandCosts.period.end}`);
    console.log('\n  Top Cost Drivers:');
    strandCosts.topDrivers.forEach((driver, index) => {
        console.log(`    ${index + 1}. ${driver.name}: $${driver.cost.toFixed(2)} (${driver.percentage.toFixed(1)}%)`);
    });

    // Calculate costs by user
    const userCosts = await costMonitor.calculateCosts('user', '7d');

    console.log('\n  Costs by User:');
    console.log(`  Total: $${userCosts.total.toFixed(2)}`);

    // Calculate costs by task type
    const taskCosts = await costMonitor.calculateCosts('task-type', '7d');

    console.log('\n  Costs by Task Type:');
    console.log(`  Total: $${taskCosts.total.toFixed(2)}`);
}

/**
 * Example 3: Set up cost alerts
 */
async function example3_CostAlerts() {
    console.log('\nExample 3: Cost Alerts\n');

    const costMonitor = createCostMonitor({
        enableAlerts: true,
        alertThresholds: {
            perStrand: 25, // $25 per strand per day
            perUser: 50, // $50 per user per day
            perTaskType: 40, // $40 per task type per day
            totalDaily: 200, // $200 total per day
        },
    });

    // Set up alert callback
    costMonitor.setAlert(25, 'strand', (alert: CostAlert) => {
        console.log('🚨 ALERT TRIGGERED:');
        console.log(`  Type: ${alert.type}`);
        console.log(`  Severity: ${alert.severity}`);
        console.log(`  Message: ${alert.message}`);
        console.log(`  Current Cost: $${alert.currentCost.toFixed(2)}`);
        console.log(`  Threshold: $${alert.threshold.toFixed(2)}`);
        console.log(`  Dimension: ${alert.dimension} (${alert.dimensionValue})`);

        // In production, you might:
        // - Send email notification
        // - Post to Slack
        // - Create incident ticket
        // - Throttle operations
    });

    console.log('✓ Alert configured for strand costs > $25/day');

    // Simulate tracking operations that trigger alert
    for (let i = 0; i < 10; i++) {
        const operation: CostOperation = {
            id: `op-${i}`,
            strandId: 'strand-expensive',
            userId: 'user-123',
            taskType: 'complex-analysis',
            model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            inputTokens: 5000,
            outputTokens: 8000,
            cost: costMonitor.calculateOperationCost(
                'anthropic.claude-3-5-sonnet-20241022-v2:0',
                5000,
                8000
            ),
            timestamp: new Date().toISOString(),
            metadata: {},
        };

        await costMonitor.trackCost(operation);
    }
}

/**
 * Example 4: Get optimization suggestions
 */
async function example4_OptimizationSuggestions() {
    console.log('\nExample 4: Optimization Suggestions\n');

    const costMonitor = createCostMonitor();

    // Get optimization suggestions
    const optimizations = await costMonitor.suggestOptimizations();

    console.log(`Found ${optimizations.length} optimization opportunities:\n`);

    optimizations.forEach((opt, index) => {
        console.log(`${index + 1}. ${opt.title}`);
        console.log(`   Priority: ${opt.priority.toUpperCase()} | Effort: ${opt.effort}`);
        console.log(`   Potential Savings: $${opt.potentialSavings.toFixed(2)}`);
        console.log(`   Description: ${opt.description}`);
        console.log(`   Actions:`);
        opt.actions.forEach(action => {
            console.log(`     • ${action}`);
        });
        console.log(`   Affected: ${opt.affectedComponents.join(', ')}`);
        console.log('');
    });
}

/**
 * Example 5: Get cost summary for specific dimension
 */
async function example5_CostSummary() {
    console.log('\nExample 5: Cost Summary\n');

    const costMonitor = createCostMonitor();

    // Get cost summary for a specific strand
    const strandSummary = await costMonitor.getCostSummary(
        'strand',
        'strand-content-generator',
        '30d'
    );

    console.log('Strand Cost Summary (Last 30 Days):');
    console.log(`  Total Cost: $${strandSummary.total.toFixed(2)}`);
    console.log(`  Operations: ${strandSummary.operations}`);
    console.log(`  Average Cost: $${strandSummary.avgCost.toFixed(4)}`);
    console.log(`  Trend: ${strandSummary.trend.toUpperCase()}`);

    // Get cost summary for a user
    const userSummary = await costMonitor.getCostSummary(
        'user',
        'user-123',
        '7d'
    );

    console.log('\nUser Cost Summary (Last 7 Days):');
    console.log(`  Total Cost: $${userSummary.total.toFixed(2)}`);
    console.log(`  Operations: ${userSummary.operations}`);
    console.log(`  Average Cost: $${userSummary.avgCost.toFixed(4)}`);
    console.log(`  Trend: ${userSummary.trend.toUpperCase()}`);
}

/**
 * Example 6: Calculate operation cost
 */
function example6_CalculateOperationCost() {
    console.log('\nExample 6: Calculate Operation Cost\n');

    const costMonitor = createCostMonitor();

    // Calculate cost for different models
    const models = [
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'anthropic.claude-3-opus-20240229-v1:0',
    ];

    const inputTokens = 2000;
    const outputTokens = 4000;

    console.log(`Token Usage: ${inputTokens} input, ${outputTokens} output\n`);

    models.forEach(model => {
        const cost = costMonitor.calculateOperationCost(model, inputTokens, outputTokens);
        const modelName = model.split('.')[1].split('-').slice(0, 3).join(' ');
        console.log(`  ${modelName}: $${cost.toFixed(4)}`);
    });

    console.log('\n💡 Tip: Use Haiku for simple tasks to reduce costs by ~90%');
}

/**
 * Example 7: Real-world workflow
 */
async function example7_RealWorldWorkflow() {
    console.log('\nExample 7: Real-World Workflow\n');

    const costMonitor = createCostMonitor({
        enableAlerts: true,
        alertThresholds: {
            perUser: 100,
            totalDaily: 500,
        },
    });

    // Set up alert handler
    costMonitor.setAlert(100, 'user', async (alert: CostAlert) => {
        console.log(`⚠️  User ${alert.dimensionValue} exceeded budget`);

        // In production:
        // 1. Send notification to user
        // 2. Optionally throttle operations
        // 3. Log to monitoring system
        // 4. Update billing dashboard
    });

    console.log('Simulating daily operations...\n');

    // Simulate a day of operations
    const operations = [
        { type: 'blog-post', model: 'sonnet', tokens: { in: 1500, out: 3000 } },
        { type: 'social-media', model: 'haiku', tokens: { in: 500, out: 800 } },
        { type: 'listing-description', model: 'haiku', tokens: { in: 800, out: 1200 } },
        { type: 'market-analysis', model: 'sonnet', tokens: { in: 3000, out: 5000 } },
        { type: 'email-campaign', model: 'haiku', tokens: { in: 600, out: 1000 } },
    ];

    let totalCost = 0;

    for (const op of operations) {
        const modelId = op.model === 'sonnet'
            ? 'anthropic.claude-3-5-sonnet-20241022-v2:0'
            : 'anthropic.claude-3-haiku-20240307-v1:0';

        const cost = costMonitor.calculateOperationCost(
            modelId,
            op.tokens.in,
            op.tokens.out
        );

        const operation: CostOperation = {
            id: `op-${Date.now()}`,
            strandId: `strand-${op.type}`,
            userId: 'user-real-estate-agent',
            taskType: op.type,
            model: modelId,
            inputTokens: op.tokens.in,
            outputTokens: op.tokens.out,
            cost,
            timestamp: new Date().toISOString(),
            metadata: { workflow: 'daily-content-generation' },
        };

        await costMonitor.trackCost(operation);
        totalCost += cost;

        console.log(`  ✓ ${op.type}: $${cost.toFixed(4)} (${op.model})`);
    }

    console.log(`\n  Total Daily Cost: $${totalCost.toFixed(4)}`);

    // Get optimization suggestions
    const optimizations = await costMonitor.suggestOptimizations();

    if (optimizations.length > 0) {
        console.log(`\n  💡 ${optimizations.length} optimization opportunities available`);
        console.log(`     Potential savings: $${optimizations[0].potentialSavings.toFixed(2)}`);
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await example1_BasicCostTracking();
        await example2_CostsByDimension();
        await example3_CostAlerts();
        await example4_OptimizationSuggestions();
        await example5_CostSummary();
        example6_CalculateOperationCost();
        await example7_RealWorldWorkflow();

        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
    }
}

// Export examples for individual use
export {
    example1_BasicCostTracking,
    example2_CostsByDimension,
    example3_CostAlerts,
    example4_OptimizationSuggestions,
    example5_CostSummary,
    example6_CalculateOperationCost,
    example7_RealWorldWorkflow,
    runAllExamples,
};

// Run if executed directly
if (require.main === module) {
    runAllExamples();
}
