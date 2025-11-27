#!/usr/bin/env tsx
/**
 * Production Performance and Cost Validation Script
 * 
 * Validates that the AI Model Optimization feature is delivering expected improvements:
 * - Performance improvements (25-35% latency reduction)
 * - Cost savings (40-50% reduction)
 * - Error rates (<3%)
 * - Success rates (>97%)
 * 
 * Usage: tsx scripts/validate-production-performance.ts [userId] [days]
 */

import { queryExecutionLogs } from '../src/aws/bedrock/cost-storage';
import {
    generateDashboardMetrics,
    generateCostComparison,
    aggregateFeatureCosts,
    formatCost,
    formatTokenCount,
} from '../src/aws/bedrock/cost-tracker';
import type { FlowExecutionLog } from '../src/aws/bedrock/execution-logger';

// Expected improvements from EXPECTED_IMPROVEMENTS.md
const EXPECTED_IMPROVEMENTS = {
    performance: {
        overallLatencyReduction: { min: 25, max: 35 }, // percentage
        simpleFeatures: { min: 60, max: 75 }, // percentage
        shortFormContent: { min: 40, max: 50 }, // percentage
        longFormContent: { min: 20, max: 33 }, // percentage
    },
    cost: {
        overallReduction: { min: 40, max: 50 }, // percentage
        haikuFeatures: 91.7, // percentage
    },
    reliability: {
        maxErrorRate: 3, // percentage
        minSuccessRate: 97, // percentage
    },
    latency: {
        haiku: { max: 2000 }, // milliseconds
        sonnet: { max: 3000 }, // milliseconds
        p99: { max: 5000 }, // milliseconds
    },
};

// Feature categorization
const FEATURE_CATEGORIES = {
    simple: ['generateAgentBio', 'analyzeReviewSentiment'],
    shortForm: ['generateSocialMediaPost', 'listingDescriptionGenerator'],
    longForm: ['generateBlogPost', 'generateNeighborhoodGuides', 'runResearchAgent'],
    analytical: ['runNapAudit', 'findCompetitors', 'getKeywordRankings', 'analyzeMultipleReviews'],
};

interface ValidationResult {
    passed: boolean;
    metric: string;
    expected: string;
    actual: string;
    details?: string;
}

interface ValidationReport {
    timestamp: string;
    userId: string;
    period: string;
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
    results: ValidationResult[];
    summary: {
        totalTests: number;
        passed: number;
        failed: number;
        warnings: number;
    };
}

/**
 * Calculate average latency for a category of features
 */
function calculateCategoryLatency(
    logs: FlowExecutionLog[],
    category: string[]
): { average: number; p50: number; p95: number; p99: number } {
    const categoryLogs = logs.filter(log => category.includes(log.flowName) && log.success);

    if (categoryLogs.length === 0) {
        return { average: 0, p50: 0, p95: 0, p99: 0 };
    }

    const latencies = categoryLogs.map(log => log.executionTimeMs).sort((a, b) => a - b);
    const average = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;

    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    return {
        average,
        p50: latencies[p50Index] || 0,
        p95: latencies[p95Index] || 0,
        p99: latencies[p99Index] || 0,
    };
}

/**
 * Calculate error rate for logs
 */
function calculateErrorRate(logs: FlowExecutionLog[]): number {
    if (logs.length === 0) return 0;
    const errors = logs.filter(log => !log.success).length;
    return (errors / logs.length) * 100;
}

/**
 * Calculate success rate for logs
 */
function calculateSuccessRate(logs: FlowExecutionLog[]): number {
    if (logs.length === 0) return 0;
    const successes = logs.filter(log => log.success).length;
    return (successes / logs.length) * 100;
}

/**
 * Validate performance improvements
 */
function validatePerformance(
    beforeLogs: FlowExecutionLog[],
    afterLogs: FlowExecutionLog[]
): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Calculate latencies for each category
    for (const [categoryName, features] of Object.entries(FEATURE_CATEGORIES)) {
        const beforeLatency = calculateCategoryLatency(beforeLogs, features);
        const afterLatency = calculateCategoryLatency(afterLogs, features);

        if (beforeLatency.average === 0 || afterLatency.average === 0) {
            results.push({
                passed: false,
                metric: `${categoryName} Performance`,
                expected: 'Sufficient data',
                actual: 'Insufficient data for comparison',
                details: `Before: ${beforeLogs.filter(l => features.includes(l.flowName)).length} logs, After: ${afterLogs.filter(l => features.includes(l.flowName)).length} logs`,
            });
            continue;
        }

        const improvement = ((beforeLatency.average - afterLatency.average) / beforeLatency.average) * 100;

        let expectedRange: { min: number; max: number };
        if (categoryName === 'simple') {
            expectedRange = EXPECTED_IMPROVEMENTS.performance.simpleFeatures;
        } else if (categoryName === 'shortForm') {
            expectedRange = EXPECTED_IMPROVEMENTS.performance.shortFormContent;
        } else if (categoryName === 'longForm') {
            expectedRange = EXPECTED_IMPROVEMENTS.performance.longFormContent;
        } else {
            // Analytical features - expect similar or slight improvement
            expectedRange = { min: 0, max: 10 };
        }

        const passed = improvement >= expectedRange.min;

        results.push({
            passed,
            metric: `${categoryName} Latency Reduction`,
            expected: `${expectedRange.min}-${expectedRange.max}%`,
            actual: `${improvement.toFixed(1)}%`,
            details: `Before: ${beforeLatency.average.toFixed(0)}ms, After: ${afterLatency.average.toFixed(0)}ms`,
        });
    }

    // Validate P99 latency
    const afterP99 = calculateCategoryLatency(afterLogs, Object.values(FEATURE_CATEGORIES).flat());
    const p99Passed = afterP99.p99 <= EXPECTED_IMPROVEMENTS.latency.p99.max;

    results.push({
        passed: p99Passed,
        metric: 'P99 Latency',
        expected: `<${EXPECTED_IMPROVEMENTS.latency.p99.max}ms`,
        actual: `${afterP99.p99.toFixed(0)}ms`,
    });

    return results;
}

/**
 * Validate cost savings
 */
function validateCostSavings(
    beforeLogs: FlowExecutionLog[],
    afterLogs: FlowExecutionLog[]
): ValidationResult[] {
    const results: ValidationResult[] = [];

    const comparison = generateCostComparison(beforeLogs, afterLogs, 'validation');

    // Overall cost reduction
    const overallPassed = comparison.savings.percentageSavings >= EXPECTED_IMPROVEMENTS.cost.overallReduction.min;

    results.push({
        passed: overallPassed,
        metric: 'Overall Cost Reduction',
        expected: `${EXPECTED_IMPROVEMENTS.cost.overallReduction.min}-${EXPECTED_IMPROVEMENTS.cost.overallReduction.max}%`,
        actual: `${comparison.savings.percentageSavings.toFixed(1)}%`,
        details: `Savings: ${formatCost(comparison.savings.absoluteSavings)}`,
    });

    // Haiku feature cost reduction
    const haikuFeatures = ['generateAgentBio', 'analyzeReviewSentiment', 'generateSocialMediaPost', 'listingDescriptionGenerator'];
    let haikuSavings = 0;
    let haikuCount = 0;

    for (const feature of haikuFeatures) {
        if (comparison.savings.savingsByFeature[feature]) {
            haikuSavings += comparison.savings.savingsByFeature[feature].percentageSavings;
            haikuCount++;
        }
    }

    const avgHaikuSavings = haikuCount > 0 ? haikuSavings / haikuCount : 0;
    const haikuPassed = avgHaikuSavings >= 80; // Allow some variance from 91.7%

    results.push({
        passed: haikuPassed,
        metric: 'Haiku Features Cost Reduction',
        expected: `~${EXPECTED_IMPROVEMENTS.cost.haikuFeatures}%`,
        actual: `${avgHaikuSavings.toFixed(1)}%`,
        details: `${haikuCount} features analyzed`,
    });

    return results;
}

/**
 * Validate reliability metrics
 */
function validateReliability(logs: FlowExecutionLog[]): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Overall error rate
    const errorRate = calculateErrorRate(logs);
    const errorRatePassed = errorRate <= EXPECTED_IMPROVEMENTS.reliability.maxErrorRate;

    results.push({
        passed: errorRatePassed,
        metric: 'Error Rate',
        expected: `<${EXPECTED_IMPROVEMENTS.reliability.maxErrorRate}%`,
        actual: `${errorRate.toFixed(2)}%`,
        details: `${logs.filter(l => !l.success).length} errors out of ${logs.length} invocations`,
    });

    // Overall success rate
    const successRate = calculateSuccessRate(logs);
    const successRatePassed = successRate >= EXPECTED_IMPROVEMENTS.reliability.minSuccessRate;

    results.push({
        passed: successRatePassed,
        metric: 'Success Rate',
        expected: `>${EXPECTED_IMPROVEMENTS.reliability.minSuccessRate}%`,
        actual: `${successRate.toFixed(2)}%`,
        details: `${logs.filter(l => l.success).length} successes out of ${logs.length} invocations`,
    });

    // Error rate by feature
    const featureErrorRates = new Map<string, { errors: number; total: number }>();
    for (const log of logs) {
        const existing = featureErrorRates.get(log.flowName) || { errors: 0, total: 0 };
        featureErrorRates.set(log.flowName, {
            errors: existing.errors + (log.success ? 0 : 1),
            total: existing.total + 1,
        });
    }

    let highErrorFeatures = 0;
    for (const [flowName, stats] of featureErrorRates.entries()) {
        const featureErrorRate = (stats.errors / stats.total) * 100;
        if (featureErrorRate > 5) {
            highErrorFeatures++;
            results.push({
                passed: false,
                metric: `${flowName} Error Rate`,
                expected: '<5%',
                actual: `${featureErrorRate.toFixed(2)}%`,
                details: `${stats.errors} errors out of ${stats.total} invocations`,
            });
        }
    }

    if (highErrorFeatures === 0) {
        results.push({
            passed: true,
            metric: 'Feature Error Rates',
            expected: 'All features <5% error rate',
            actual: 'All features within acceptable range',
        });
    }

    return results;
}

/**
 * Generate validation report
 */
async function generateValidationReport(
    userId: string,
    beforeDays: number = 60,
    afterDays: number = 30
): Promise<ValidationReport> {
    console.log(`\n🔍 Production Validation Report`);
    console.log(`📅 User: ${userId}`);
    console.log(`📊 Comparing: Last ${afterDays} days vs Previous ${beforeDays} days\n`);
    console.log('='.repeat(80));

    // Query logs for both periods
    const beforeEndDate = new Date();
    beforeEndDate.setDate(beforeEndDate.getDate() - afterDays);
    const beforeStartDate = new Date(beforeEndDate);
    beforeStartDate.setDate(beforeStartDate.getDate() - beforeDays);

    console.log(`\n🔍 Before Period: ${beforeStartDate.toISOString()} to ${beforeEndDate.toISOString()}`);
    const beforeLogs = await queryExecutionLogs(userId, beforeStartDate, beforeEndDate);
    console.log(`   Found ${beforeLogs.length} execution logs`);

    const afterEndDate = new Date();
    const afterStartDate = new Date();
    afterStartDate.setDate(afterStartDate.getDate() - afterDays);

    console.log(`\n🔍 After Period:  ${afterStartDate.toISOString()} to ${afterEndDate.toISOString()}`);
    const afterLogs = await queryExecutionLogs(userId, afterStartDate, afterEndDate);
    console.log(`   Found ${afterLogs.length} execution logs\n`);

    if (beforeLogs.length === 0 || afterLogs.length === 0) {
        throw new Error('Insufficient data for validation. Need logs from both periods.');
    }

    // Run validations
    const performanceResults = validatePerformance(beforeLogs, afterLogs);
    const costResults = validateCostSavings(beforeLogs, afterLogs);
    const reliabilityResults = validateReliability(afterLogs);

    const allResults = [...performanceResults, ...costResults, ...reliabilityResults];

    // Calculate summary
    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.filter(r => !r.passed).length;
    const warnings = 0; // Could add warning logic later

    const overallStatus: 'PASS' | 'FAIL' | 'WARNING' =
        failed === 0 ? 'PASS' : failed <= 2 ? 'WARNING' : 'FAIL';

    return {
        timestamp: new Date().toISOString(),
        userId,
        period: `Last ${afterDays} days vs Previous ${beforeDays} days`,
        overallStatus,
        results: allResults,
        summary: {
            totalTests: allResults.length,
            passed,
            failed,
            warnings,
        },
    };
}

/**
 * Print validation report
 */
function printValidationReport(report: ValidationReport): void {
    console.log('\n📋 VALIDATION RESULTS');
    console.log('='.repeat(80));

    // Group results by category
    const categories = {
        'Performance': report.results.filter(r => r.metric.includes('Latency') || r.metric.includes('Performance')),
        'Cost': report.results.filter(r => r.metric.includes('Cost')),
        'Reliability': report.results.filter(r => r.metric.includes('Error') || r.metric.includes('Success')),
    };

    for (const [category, results] of Object.entries(categories)) {
        if (results.length === 0) continue;

        console.log(`\n${category.toUpperCase()}`);
        console.log('-'.repeat(80));

        for (const result of results) {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`\n${status} ${result.metric}`);
            console.log(`  Expected: ${result.expected}`);
            console.log(`  Actual:   ${result.actual}`);
            if (result.details) {
                console.log(`  Details:  ${result.details}`);
            }
        }
    }

    // Print summary
    console.log('\n\n📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests:     ${report.summary.totalTests}`);
    console.log(`Passed:          ${report.summary.passed} ✅`);
    console.log(`Failed:          ${report.summary.failed} ❌`);
    console.log(`Warnings:        ${report.summary.warnings} ⚠️`);

    console.log(`\nOverall Status:  ${report.overallStatus === 'PASS' ? '✅ PASS' : report.overallStatus === 'WARNING' ? '⚠️  WARNING' : '❌ FAIL'}`);

    // Print recommendations
    if (report.overallStatus !== 'PASS') {
        console.log('\n\n💡 RECOMMENDATIONS');
        console.log('='.repeat(80));

        const failedResults = report.results.filter(r => !r.passed);
        for (const result of failedResults) {
            console.log(`\n❌ ${result.metric}`);

            if (result.metric.includes('Latency')) {
                console.log('   → Review model selection for this feature category');
                console.log('   → Check for network or API issues');
                console.log('   → Verify temperature and token limit settings');
            } else if (result.metric.includes('Cost')) {
                console.log('   → Verify Haiku is being used for simple features');
                console.log('   → Check token usage patterns');
                console.log('   → Review model selection configuration');
            } else if (result.metric.includes('Error')) {
                console.log('   → Review error logs for common failure patterns');
                console.log('   → Check retry logic and error handling');
                console.log('   → Verify input validation is working correctly');
            }
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Validation report generated at ${report.timestamp}\n`);
}

/**
 * Main execution
 */
async function main() {
    const userId = process.argv[2];
    const beforeDays = parseInt(process.argv[3] || '60', 10);
    const afterDays = parseInt(process.argv[4] || '30', 10);

    if (!userId) {
        console.error('Usage: tsx scripts/validate-production-performance.ts <userId> [beforeDays] [afterDays]');
        console.error('Example: tsx scripts/validate-production-performance.ts user123 60 30');
        console.error('  This validates the last 30 days vs the previous 60 days');
        process.exit(1);
    }

    try {
        const report = await generateValidationReport(userId, beforeDays, afterDays);
        printValidationReport(report);

        // Exit with appropriate code
        process.exit(report.overallStatus === 'PASS' ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Validation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { generateValidationReport, printValidationReport };
