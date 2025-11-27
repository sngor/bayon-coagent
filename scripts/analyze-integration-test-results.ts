#!/usr/bin/env tsx

/**
 * Analyze Integration Test Results
 * 
 * This script analyzes the integration test metrics to:
 * 1. Calculate actual costs based on token usage
 * 2. Compare optimized model selection vs single-model approach
 * 3. Generate performance and cost reports
 */

import * as fs from 'fs';
import * as path from 'path';

interface FlowMetrics {
    flowName: string;
    modelId: string;
    executionTimeMs: number;
    tokenUsage?: {
        input: number;
        output: number;
    };
    success: boolean;
    error?: string;
}

// AWS Bedrock pricing (per 1M tokens)
const PRICING = {
    'haiku': {
        input: 0.25,
        output: 1.25,
    },
    'sonnet-3-5': {
        input: 3.00,
        output: 15.00,
    },
    'sonnet-3': {
        input: 3.00,
        output: 15.00,
    },
    'opus': {
        input: 15.00,
        output: 75.00,
    },
};

function getModelPricing(modelId: string) {
    if (modelId.includes('haiku')) return PRICING['haiku'];
    if (modelId.includes('3-5-sonnet')) return PRICING['sonnet-3-5'];
    if (modelId.includes('opus')) return PRICING['opus'];
    return PRICING['sonnet-3'];
}

function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = getModelPricing(modelId);
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
}

function estimateTokens(flowName: string, modelId: string): { input: number; output: number } {
    // Estimate token usage based on flow type
    // These are rough estimates - actual usage will vary

    if (flowName.includes('Bio') || flowName.includes('Sentiment')) {
        return { input: 200, output: 100 };
    }

    if (flowName.includes('SocialMedia') || flowName.includes('ListingDescription')) {
        return { input: 300, output: 200 };
    }

    if (flowName.includes('BlogPost') || flowName.includes('NeighborhoodGuide') || flowName.includes('Research')) {
        return { input: 500, output: 3000 };
    }

    if (flowName.includes('VideoScript') || flowName.includes('FAQs') || flowName.includes('MarketUpdate')) {
        return { input: 400, output: 800 };
    }

    if (flowName.includes('Reviews') || flowName.includes('MarketingPlan')) {
        return { input: 600, output: 600 };
    }

    if (flowName.includes('NAP') || flowName.includes('Competitor') || flowName.includes('Keyword')) {
        return { input: 800, output: 400 };
    }

    return { input: 500, output: 500 };
}

async function analyzeResults() {
    const metricsPath = path.join(process.cwd(), 'integration-test-metrics.json');

    if (!fs.existsSync(metricsPath)) {
        console.error('❌ No integration test metrics found.');
        console.error('   Run integration tests first: npm test -- ai-model-optimization-integration.test.ts');
        process.exit(1);
    }

    const metrics: FlowMetrics[] = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    console.log('\n📊 Integration Test Results Analysis\n');
    console.log('═'.repeat(80));

    // Calculate performance metrics
    const successfulFlows = metrics.filter(m => m.success);
    const failedFlows = metrics.filter(m => !m.success);

    console.log('\n📈 Performance Metrics\n');
    console.log(`Total flows tested: ${metrics.length}`);
    console.log(`Successful: ${successfulFlows.length} (${(successfulFlows.length / metrics.length * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failedFlows.length} (${(failedFlows.length / metrics.length * 100).toFixed(1)}%)`);

    if (failedFlows.length > 0) {
        console.log('\n❌ Failed Flows:');
        failedFlows.forEach(f => {
            console.log(`   - ${f.flowName}: ${f.error}`);
        });
    }

    // Group by model
    const haikuFlows = successfulFlows.filter(m => m.modelId.includes('haiku'));
    const sonnetFlows = successfulFlows.filter(m => m.modelId.includes('sonnet'));

    const haikuAvg = haikuFlows.length > 0
        ? haikuFlows.reduce((sum, m) => sum + m.executionTimeMs, 0) / haikuFlows.length
        : 0;
    const sonnetAvg = sonnetFlows.length > 0
        ? sonnetFlows.reduce((sum, m) => sum + m.executionTimeMs, 0) / sonnetFlows.length
        : 0;

    console.log('\n⚡ Latency Analysis\n');
    console.log(`Haiku flows (${haikuFlows.length}): ${Math.round(haikuAvg)}ms average (target: <2000ms)`);
    console.log(`Sonnet flows (${sonnetFlows.length}): ${Math.round(sonnetAvg)}ms average (target: <3000ms)`);

    // Calculate costs
    console.log('\n💰 Cost Analysis\n');

    let totalOptimizedCost = 0;
    let totalSingleModelCost = 0;

    const costBreakdown: Array<{
        flowName: string;
        optimizedModel: string;
        optimizedCost: number;
        singleModelCost: number;
        savings: number;
    }> = [];

    successfulFlows.forEach(flow => {
        const tokens = flow.tokenUsage || estimateTokens(flow.flowName, flow.modelId);

        // Calculate cost with optimized model
        const optimizedCost = calculateCost(flow.modelId, tokens.input, tokens.output);
        totalOptimizedCost += optimizedCost;

        // Calculate cost if we used Sonnet 3.5 for everything
        const singleModelCost = calculateCost('sonnet-3-5', tokens.input, tokens.output);
        totalSingleModelCost += singleModelCost;

        const savings = singleModelCost - optimizedCost;

        costBreakdown.push({
            flowName: flow.flowName,
            optimizedModel: flow.modelId.includes('haiku') ? 'Haiku' : 'Sonnet 3.5',
            optimizedCost,
            singleModelCost,
            savings,
        });
    });

    console.log('Cost per flow (estimated):');
    console.log('-'.repeat(80));
    costBreakdown.forEach(item => {
        const savingsPercent = ((item.savings / item.singleModelCost) * 100).toFixed(0);
        console.log(
            `${item.flowName.padEnd(35)} ${item.optimizedModel.padEnd(12)} ` +
            `$${item.optimizedCost.toFixed(4)} vs $${item.singleModelCost.toFixed(4)} ` +
            `(${savingsPercent}% savings)`
        );
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal cost (optimized):     $${totalOptimizedCost.toFixed(4)}`);
    console.log(`Total cost (single model):  $${totalSingleModelCost.toFixed(4)}`);
    console.log(`Total savings:              $${(totalSingleModelCost - totalOptimizedCost).toFixed(4)}`);
    console.log(`Savings percentage:         ${((totalSingleModelCost - totalOptimizedCost) / totalSingleModelCost * 100).toFixed(1)}%`);

    // Extrapolate to monthly usage
    const monthlyInvocations = 10000; // Assume 10k invocations per month
    const monthlyOptimizedCost = (totalOptimizedCost / successfulFlows.length) * monthlyInvocations;
    const monthlySingleModelCost = (totalSingleModelCost / successfulFlows.length) * monthlyInvocations;
    const monthlySavings = monthlySingleModelCost - monthlyOptimizedCost;

    console.log('\n📅 Monthly Cost Projection (10,000 invocations)\n');
    console.log(`Optimized approach:  $${monthlyOptimizedCost.toFixed(2)}/month`);
    console.log(`Single model:        $${monthlySingleModelCost.toFixed(2)}/month`);
    console.log(`Monthly savings:     $${monthlySavings.toFixed(2)}/month`);
    console.log(`Annual savings:      $${(monthlySavings * 12).toFixed(2)}/year`);

    console.log('\n✅ Analysis complete!\n');

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFlows: metrics.length,
            successfulFlows: successfulFlows.length,
            failedFlows: failedFlows.length,
            successRate: (successfulFlows.length / metrics.length * 100).toFixed(1) + '%',
        },
        performance: {
            haikuAverageLatency: Math.round(haikuAvg),
            sonnetAverageLatency: Math.round(sonnetAvg),
        },
        costs: {
            totalOptimizedCost,
            totalSingleModelCost,
            totalSavings: totalSingleModelCost - totalOptimizedCost,
            savingsPercentage: ((totalSingleModelCost - totalOptimizedCost) / totalSingleModelCost * 100).toFixed(1) + '%',
            monthlyProjection: {
                optimized: monthlyOptimizedCost,
                singleModel: monthlySingleModelCost,
                savings: monthlySavings,
            },
        },
        flowBreakdown: costBreakdown,
    };

    const reportPath = path.join(process.cwd(), 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

analyzeResults().catch(console.error);
