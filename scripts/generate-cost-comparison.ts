#!/usr/bin/env tsx
/**
 * Generate Cost Comparison Report Script
 * 
 * Compares costs between two periods to show optimization impact.
 * Usage: tsx scripts/generate-cost-comparison.ts [userId] [beforeDays] [afterDays]
 */

import { queryExecutionLogs } from '../src/aws/bedrock/cost-storage';
import {
    generateCostComparison,
    formatCost,
    type CostComparison,
} from '../src/aws/bedrock/cost-tracker';

async function generateComparisonReport(
    userId: string,
    beforeDays: number = 60,
    afterDays: number = 30
) {
    console.log(`\n📊 Cost Comparison Report for User: ${userId}`);
    console.log(`📅 Comparing: Last ${afterDays} days vs Previous ${beforeDays} days\n`);
    console.log('='.repeat(80));

    try {
        // Query logs for "before" period
        const beforeEndDate = new Date();
        beforeEndDate.setDate(beforeEndDate.getDate() - afterDays);
        const beforeStartDate = new Date(beforeEndDate);
        beforeStartDate.setDate(beforeStartDate.getDate() - beforeDays);

        console.log(`\n🔍 Before Period: ${beforeStartDate.toISOString()} to ${beforeEndDate.toISOString()}`);
        const beforeLogs = await queryExecutionLogs(userId, beforeStartDate, beforeEndDate);
        console.log(`   Found ${beforeLogs.length} execution logs`);

        // Query logs for "after" period
        const afterEndDate = new Date();
        const afterStartDate = new Date();
        afterStartDate.setDate(afterStartDate.getDate() - afterDays);

        console.log(`\n🔍 After Period:  ${afterStartDate.toISOString()} to ${afterEndDate.toISOString()}`);
        const afterLogs = await queryExecutionLogs(userId, afterStartDate, afterEndDate);
        console.log(`   Found ${afterLogs.length} execution logs\n`);

        if (beforeLogs.length === 0 && afterLogs.length === 0) {
            console.log('\n⚠️  No execution logs found for either period.');
            return;
        }

        // Generate comparison
        const comparison = generateCostComparison(
            beforeLogs,
            afterLogs,
            `Last ${afterDays} days vs Previous ${beforeDays} days`
        );

        // Print overall comparison
        console.log('📈 OVERALL COMPARISON');
        console.log('='.repeat(80));
        console.log('\nBEFORE (Previous Period):');
        console.log(`  Total Cost:              ${formatCost(comparison.before.totalCost)}`);
        console.log(`  Total Invocations:       ${comparison.before.totalInvocations.toLocaleString()}`);
        console.log(`  Avg Cost/Invocation:     ${formatCost(comparison.before.averageCostPerInvocation)}`);

        console.log('\nAFTER (Recent Period):');
        console.log(`  Total Cost:              ${formatCost(comparison.after.totalCost)}`);
        console.log(`  Total Invocations:       ${comparison.after.totalInvocations.toLocaleString()}`);
        console.log(`  Avg Cost/Invocation:     ${formatCost(comparison.after.averageCostPerInvocation)}`);

        console.log('\n💰 SAVINGS:');
        const savingsSymbol = comparison.savings.absoluteSavings >= 0 ? '✅' : '❌';
        console.log(`  ${savingsSymbol} Absolute Savings:       ${formatCost(comparison.savings.absoluteSavings)}`);
        console.log(`  ${savingsSymbol} Percentage Savings:     ${comparison.savings.percentageSavings.toFixed(2)}%`);

        // Print savings by feature
        console.log('\n\n💼 SAVINGS BY FEATURE');
        console.log('='.repeat(80));
        console.log('Feature'.padEnd(40) + 'Before'.padStart(15) + 'After'.padStart(15) + 'Savings'.padStart(15) + '%'.padStart(10));
        console.log('-'.repeat(80));

        const sortedFeatures = Object.entries(comparison.savings.savingsByFeature)
            .sort(([, a], [, b]) => b.absoluteSavings - a.absoluteSavings);

        for (const [flowName, savings] of sortedFeatures) {
            const beforeCost = comparison.before.byFeature[flowName]?.totalCost || 0;
            const afterCost = comparison.after.byFeature[flowName]?.totalCost || 0;

            if (beforeCost === 0 && afterCost === 0) continue;

            const savingsSymbol = savings.absoluteSavings >= 0 ? '✅' : '❌';
            console.log(
                flowName.padEnd(40) +
                formatCost(beforeCost).padStart(15) +
                formatCost(afterCost).padStart(15) +
                formatCost(savings.absoluteSavings).padStart(15) +
                `${savingsSymbol} ${savings.percentageSavings.toFixed(1)}%`.padStart(10)
            );
        }

        // Print detailed feature comparison for top changes
        console.log('\n\n🔍 TOP FEATURE CHANGES (by absolute savings)');
        console.log('='.repeat(80));

        const topChanges = sortedFeatures.slice(0, 10);
        for (const [flowName, savings] of topChanges) {
            const beforeFeature = comparison.before.byFeature[flowName];
            const afterFeature = comparison.after.byFeature[flowName];

            if (!beforeFeature && !afterFeature) continue;

            console.log(`\n${flowName}`);

            if (beforeFeature) {
                console.log(`  BEFORE:`);
                console.log(`    Invocations:     ${beforeFeature.invocationCount.toLocaleString()}`);
                console.log(`    Total Cost:      ${formatCost(beforeFeature.totalCost)}`);
                console.log(`    Avg Cost/Call:   ${formatCost(beforeFeature.averageCostPerInvocation)}`);
            } else {
                console.log(`  BEFORE: No data`);
            }

            if (afterFeature) {
                console.log(`  AFTER:`);
                console.log(`    Invocations:     ${afterFeature.invocationCount.toLocaleString()}`);
                console.log(`    Total Cost:      ${formatCost(afterFeature.totalCost)}`);
                console.log(`    Avg Cost/Call:   ${formatCost(afterFeature.averageCostPerInvocation)}`);
            } else {
                console.log(`  AFTER: No data`);
            }

            const savingsSymbol = savings.absoluteSavings >= 0 ? '✅' : '❌';
            console.log(`  ${savingsSymbol} SAVINGS:         ${formatCost(savings.absoluteSavings)} (${savings.percentageSavings.toFixed(1)}%)`);
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        if (comparison.savings.absoluteSavings > 0) {
            console.log(`\n✅ Optimization successful! Saved ${formatCost(comparison.savings.absoluteSavings)} (${comparison.savings.percentageSavings.toFixed(2)}%)`);

            // Calculate monthly projection
            const monthlyBefore = (comparison.before.totalCost / beforeDays) * 30;
            const monthlyAfter = (comparison.after.totalCost / afterDays) * 30;
            const monthlySavings = monthlyBefore - monthlyAfter;

            console.log(`\n📅 Monthly Projection:`);
            console.log(`   Before: ${formatCost(monthlyBefore)}/month`);
            console.log(`   After:  ${formatCost(monthlyAfter)}/month`);
            console.log(`   Savings: ${formatCost(monthlySavings)}/month`);
        } else if (comparison.savings.absoluteSavings < 0) {
            console.log(`\n⚠️  Costs increased by ${formatCost(Math.abs(comparison.savings.absoluteSavings))} (${Math.abs(comparison.savings.percentageSavings).toFixed(2)}%)`);
        } else {
            console.log(`\n➡️  No change in costs`);
        }

        console.log('\n✅ Comparison report generated successfully!\n');

    } catch (error) {
        console.error('\n❌ Error generating comparison report:', error);
        process.exit(1);
    }
}

// Parse command line arguments
const userId = process.argv[2];
const beforeDays = parseInt(process.argv[3] || '60', 10);
const afterDays = parseInt(process.argv[4] || '30', 10);

if (!userId) {
    console.error('Usage: tsx scripts/generate-cost-comparison.ts <userId> [beforeDays] [afterDays]');
    console.error('Example: tsx scripts/generate-cost-comparison.ts user123 60 30');
    console.error('  This compares the last 30 days vs the previous 60 days');
    process.exit(1);
}

// Run the comparison
generateComparisonReport(userId, beforeDays, afterDays).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

