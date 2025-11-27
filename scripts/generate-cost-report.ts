#!/usr/bin/env tsx
/**
 * Generate Cost Report Script
 * 
 * Generates a cost analysis report from execution logs.
 * Usage: tsx scripts/generate-cost-report.ts [userId] [days]
 */

import { queryExecutionLogs } from '../src/aws/bedrock/cost-storage';
import {
    generateDashboardMetrics,
    aggregateFeatureCosts,
    formatCost,
    formatTokenCount,
    type FeatureCostSummary,
} from '../src/aws/bedrock/cost-tracker';

async function generateReport(userId: string, days: number = 30) {
    console.log(`\n📊 Cost Report for User: ${userId}`);
    console.log(`📅 Period: Last ${days} days\n`);
    console.log('='.repeat(80));

    try {
        // Query execution logs
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        console.log(`\n🔍 Querying logs from ${startDate.toISOString()} to ${endDate.toISOString()}...`);

        const logs = await queryExecutionLogs(userId, startDate, endDate);

        if (logs.length === 0) {
            console.log('\n⚠️  No execution logs found for this period.');
            return;
        }

        console.log(`✅ Found ${logs.length} execution logs\n`);

        // Generate metrics
        const metrics = generateDashboardMetrics(logs, days);
        const featureCosts = aggregateFeatureCosts(logs);

        // Print summary
        console.log('📈 SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Cost:              ${formatCost(metrics.currentPeriod.totalCost)}`);
        console.log(`Total Invocations:       ${metrics.currentPeriod.totalInvocations.toLocaleString()}`);
        console.log(`Avg Cost/Invocation:     ${formatCost(metrics.currentPeriod.averageCostPerInvocation)}`);
        console.log(`Daily Average:           ${formatCost(metrics.projections.dailyAverage)}`);
        console.log(`Monthly Projection:      ${formatCost(metrics.projections.monthlyProjection)}`);

        // Print cost by category
        console.log('\n\n💼 COST BY CATEGORY');
        console.log('='.repeat(80));
        const sortedCategories = Object.entries(metrics.currentPeriod.costByCategory)
            .sort(([, a], [, b]) => b - a);

        for (const [category, cost] of sortedCategories) {
            const percentage = (cost / metrics.currentPeriod.totalCost) * 100;
            console.log(`${category.padEnd(25)} ${formatCost(cost).padStart(15)} (${percentage.toFixed(1)}%)`);
        }

        // Print cost by model
        console.log('\n\n🤖 COST BY MODEL');
        console.log('='.repeat(80));
        const sortedModels = Object.entries(metrics.currentPeriod.costByModel)
            .sort(([, a], [, b]) => b - a);

        for (const [modelId, cost] of sortedModels) {
            const percentage = (cost / metrics.currentPeriod.totalCost) * 100;
            const modelName = modelId.split('.').pop() || modelId;
            console.log(`${modelName.padEnd(40)} ${formatCost(cost).padStart(15)} (${percentage.toFixed(1)}%)`);
        }

        // Print top costly features
        console.log('\n\n🔥 TOP 10 COSTLY FEATURES');
        console.log('='.repeat(80));
        console.log('Feature'.padEnd(40) + 'Cost'.padStart(15) + 'Invocations'.padStart(15) + 'Avg/Call'.padStart(15));
        console.log('-'.repeat(80));

        for (const feature of metrics.currentPeriod.topCostlyFeatures) {
            const avgCost = feature.totalCost / feature.invocationCount;
            console.log(
                feature.flowName.padEnd(40) +
                formatCost(feature.totalCost).padStart(15) +
                feature.invocationCount.toString().padStart(15) +
                formatCost(avgCost).padStart(15)
            );
        }

        // Print detailed feature breakdown
        console.log('\n\n📋 DETAILED FEATURE BREAKDOWN');
        console.log('='.repeat(80));

        const sortedFeatures = Object.values(featureCosts)
            .sort((a, b) => b.totalCost - a.totalCost);

        for (const feature of sortedFeatures) {
            console.log(`\n${feature.flowName}`);
            console.log(`  Category:        ${feature.featureCategory}`);
            console.log(`  Invocations:     ${feature.invocationCount.toLocaleString()}`);
            console.log(`  Total Cost:      ${formatCost(feature.totalCost)}`);
            console.log(`  Avg Cost/Call:   ${formatCost(feature.averageCostPerInvocation)}`);
            console.log(`  Input Tokens:    ${formatTokenCount(feature.totalTokens.input)}`);
            console.log(`  Output Tokens:   ${formatTokenCount(feature.totalTokens.output)}`);

            if (Object.keys(feature.modelBreakdown).length > 0) {
                console.log(`  Model Breakdown:`);
                for (const [modelId, breakdown] of Object.entries(feature.modelBreakdown)) {
                    const modelName = modelId.split('.').pop() || modelId;
                    console.log(`    ${modelName}: ${breakdown.invocationCount} calls, ${formatCost(breakdown.totalCost)}`);
                }
            }
        }

        // Print daily trend
        if (metrics.trends.dailyCosts.length > 0) {
            console.log('\n\n📅 DAILY COST TREND');
            console.log('='.repeat(80));
            console.log('Date'.padEnd(15) + 'Cost'.padStart(15) + 'Invocations'.padStart(15));
            console.log('-'.repeat(80));

            for (const day of metrics.trends.dailyCosts.slice(-14)) { // Last 14 days
                console.log(
                    day.date.padEnd(15) +
                    formatCost(day.cost).padStart(15) +
                    day.invocations.toString().padStart(15)
                );
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Report generated successfully!\n');

    } catch (error) {
        console.error('\n❌ Error generating report:', error);
        process.exit(1);
    }
}

// Parse command line arguments
const userId = process.argv[2];
const days = parseInt(process.argv[3] || '30', 10);

if (!userId) {
    console.error('Usage: tsx scripts/generate-cost-report.ts <userId> [days]');
    console.error('Example: tsx scripts/generate-cost-report.ts user123 30');
    process.exit(1);
}

// Run the report
generateReport(userId, days).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

