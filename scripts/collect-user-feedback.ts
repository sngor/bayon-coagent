#!/usr/bin/env tsx
/**
 * User Feedback Collection Script
 * 
 * Collects and analyzes user feedback on AI feature quality and performance.
 * Tracks regeneration rates, user satisfaction, and quality metrics.
 * 
 * Usage: tsx scripts/collect-user-feedback.ts [userId] [days]
 */

import { getRepository } from '../src/aws/dynamodb/repository';
import { queryExecutionLogs } from '../src/aws/bedrock/cost-storage';
import type { FlowExecutionLog } from '../src/aws/bedrock/execution-logger';

interface UserFeedbackMetrics {
    userId: string;
    period: string;
    totalGenerations: number;
    regenerationRate: number;
    averageResponseTime: number;
    featureUsage: Record<string, {
        count: number;
        regenerations: number;
        avgResponseTime: number;
    }>;
    qualityIndicators: {
        schemaValidationFailures: number;
        parseErrors: number;
        retryRate: number;
    };
    userSatisfactionScore?: number;
}

/**
 * Analyze regeneration patterns from execution logs
 */
function analyzeRegenerationPatterns(logs: FlowExecutionLog[]): {
    totalGenerations: number;
    regenerations: number;
    regenerationRate: number;
    byFeature: Record<string, { count: number; regenerations: number }>;
} {
    // Group logs by user session and feature
    const sessionMap = new Map<string, FlowExecutionLog[]>();

    for (const log of logs) {
        const sessionKey = `${log.metadata.userId || 'unknown'}-${log.flowName}`;
        const existing = sessionMap.get(sessionKey) || [];
        existing.push(log);
        sessionMap.set(sessionKey, existing);
    }

    let totalGenerations = 0;
    let regenerations = 0;
    const byFeature: Record<string, { count: number; regenerations: number }> = {};

    // Analyze each session
    for (const [sessionKey, sessionLogs] of sessionMap.entries()) {
        const flowName = sessionLogs[0].flowName;

        if (!byFeature[flowName]) {
            byFeature[flowName] = { count: 0, regenerations: 0 };
        }

        // Sort by timestamp
        sessionLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Count generations and regenerations
        // A regeneration is defined as multiple calls to the same feature within 5 minutes
        for (let i = 0; i < sessionLogs.length; i++) {
            totalGenerations++;
            byFeature[flowName].count++;

            if (i > 0) {
                const timeDiff = new Date(sessionLogs[i].timestamp).getTime() -
                    new Date(sessionLogs[i - 1].timestamp).getTime();

                // If within 5 minutes, consider it a regeneration
                if (timeDiff < 5 * 60 * 1000) {
                    regenerations++;
                    byFeature[flowName].regenerations++;
                }
            }
        }
    }

    const regenerationRate = totalGenerations > 0 ? (regenerations / totalGenerations) * 100 : 0;

    return {
        totalGenerations,
        regenerations,
        regenerationRate,
        byFeature,
    };
}

/**
 * Calculate quality indicators from logs
 */
function calculateQualityIndicators(logs: FlowExecutionLog[]): {
    schemaValidationFailures: number;
    parseErrors: number;
    retryRate: number;
} {
    let schemaValidationFailures = 0;
    let parseErrors = 0;
    let totalRetries = 0;

    for (const log of logs) {
        if (!log.success && log.error) {
            if (log.error.type === 'ValidationError' || log.error.message.includes('schema')) {
                schemaValidationFailures++;
            }
            if (log.error.type === 'ParseError' || log.error.message.includes('parse')) {
                parseErrors++;
            }
            if (log.error.retryCount && log.error.retryCount > 0) {
                totalRetries += log.error.retryCount;
            }
        }
    }

    const retryRate = logs.length > 0 ? (totalRetries / logs.length) * 100 : 0;

    return {
        schemaValidationFailures,
        parseErrors,
        retryRate,
    };
}

/**
 * Generate user feedback metrics
 */
async function generateUserFeedbackMetrics(
    userId: string,
    days: number = 30
): Promise<UserFeedbackMetrics> {
    console.log(`\n📊 User Feedback Analysis for: ${userId}`);
    console.log(`📅 Period: Last ${days} days\n`);
    console.log('='.repeat(80));

    // Query execution logs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`\n🔍 Querying logs from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
    const logs = await queryExecutionLogs(userId, startDate, endDate);
    console.log(`✅ Found ${logs.length} execution logs\n`);

    if (logs.length === 0) {
        throw new Error('No execution logs found for this period');
    }

    // Analyze regeneration patterns
    const regenerationAnalysis = analyzeRegenerationPatterns(logs);

    // Calculate average response time
    const successfulLogs = logs.filter(log => log.success);
    const averageResponseTime = successfulLogs.length > 0
        ? successfulLogs.reduce((sum, log) => sum + log.executionTimeMs, 0) / successfulLogs.length
        : 0;

    // Calculate feature usage
    const featureUsage: Record<string, {
        count: number;
        regenerations: number;
        avgResponseTime: number;
    }> = {};

    for (const [flowName, stats] of Object.entries(regenerationAnalysis.byFeature)) {
        const featureLogs = logs.filter(log => log.flowName === flowName && log.success);
        const avgTime = featureLogs.length > 0
            ? featureLogs.reduce((sum, log) => sum + log.executionTimeMs, 0) / featureLogs.length
            : 0;

        featureUsage[flowName] = {
            count: stats.count,
            regenerations: stats.regenerations,
            avgResponseTime: avgTime,
        };
    }

    // Calculate quality indicators
    const qualityIndicators = calculateQualityIndicators(logs);

    return {
        userId,
        period: `Last ${days} days`,
        totalGenerations: regenerationAnalysis.totalGenerations,
        regenerationRate: regenerationAnalysis.regenerationRate,
        averageResponseTime,
        featureUsage,
        qualityIndicators,
    };
}

/**
 * Print user feedback report
 */
function printUserFeedbackReport(metrics: UserFeedbackMetrics): void {
    console.log('\n📋 USER FEEDBACK METRICS');
    console.log('='.repeat(80));

    // Overall metrics
    console.log('\n📊 OVERALL METRICS');
    console.log('-'.repeat(80));
    console.log(`Total Generations:       ${metrics.totalGenerations.toLocaleString()}`);
    console.log(`Regeneration Rate:       ${metrics.regenerationRate.toFixed(2)}%`);
    console.log(`Average Response Time:   ${metrics.averageResponseTime.toFixed(0)}ms`);

    // Quality indicators
    console.log('\n\n✨ QUALITY INDICATORS');
    console.log('-'.repeat(80));
    console.log(`Schema Validation Failures: ${metrics.qualityIndicators.schemaValidationFailures}`);
    console.log(`Parse Errors:               ${metrics.qualityIndicators.parseErrors}`);
    console.log(`Retry Rate:                 ${metrics.qualityIndicators.retryRate.toFixed(2)}%`);

    // Feature usage and regeneration rates
    console.log('\n\n🎯 FEATURE USAGE & REGENERATION RATES');
    console.log('-'.repeat(80));
    console.log('Feature'.padEnd(40) + 'Count'.padStart(10) + 'Regen %'.padStart(12) + 'Avg Time'.padStart(12));
    console.log('-'.repeat(80));

    const sortedFeatures = Object.entries(metrics.featureUsage)
        .sort(([, a], [, b]) => b.count - a.count);

    for (const [flowName, stats] of sortedFeatures) {
        const regenRate = stats.count > 0 ? (stats.regenerations / stats.count) * 100 : 0;
        const regenIndicator = regenRate > 30 ? '🔴' : regenRate > 15 ? '🟡' : '🟢';

        console.log(
            flowName.padEnd(40) +
            stats.count.toString().padStart(10) +
            `${regenIndicator} ${regenRate.toFixed(1)}%`.padStart(12) +
            `${stats.avgResponseTime.toFixed(0)}ms`.padStart(12)
        );
    }

    // Satisfaction assessment
    console.log('\n\n😊 SATISFACTION ASSESSMENT');
    console.log('-'.repeat(80));

    const highRegenFeatures = sortedFeatures.filter(([, stats]) => {
        const regenRate = stats.count > 0 ? (stats.regenerations / stats.count) * 100 : 0;
        return regenRate > 30;
    });

    if (highRegenFeatures.length === 0) {
        console.log('✅ All features have acceptable regeneration rates (<30%)');
        console.log('✅ Users appear satisfied with output quality');
    } else {
        console.log('⚠️  Some features have high regeneration rates (>30%):');
        for (const [flowName, stats] of highRegenFeatures) {
            const regenRate = (stats.regenerations / stats.count) * 100;
            console.log(`   - ${flowName}: ${regenRate.toFixed(1)}% regeneration rate`);
        }
        console.log('\n💡 Recommendations:');
        console.log('   - Review output quality for high-regeneration features');
        console.log('   - Consider adjusting temperature or model selection');
        console.log('   - Gather direct user feedback on these features');
    }

    // Response time assessment
    console.log('\n\n⚡ RESPONSE TIME ASSESSMENT');
    console.log('-'.repeat(80));

    const slowFeatures = sortedFeatures.filter(([, stats]) => stats.avgResponseTime > 5000);

    if (slowFeatures.length === 0) {
        console.log('✅ All features respond within acceptable time (<5s)');
    } else {
        console.log('⚠️  Some features have slow response times (>5s):');
        for (const [flowName, stats] of slowFeatures) {
            console.log(`   - ${flowName}: ${stats.avgResponseTime.toFixed(0)}ms average`);
        }
        console.log('\n💡 Recommendations:');
        console.log('   - Review model selection for slow features');
        console.log('   - Check for network or API latency issues');
        console.log('   - Consider optimizing prompts or reducing token limits');
    }

    // Overall satisfaction score
    console.log('\n\n🎯 OVERALL SATISFACTION SCORE');
    console.log('-'.repeat(80));

    // Calculate a simple satisfaction score based on metrics
    let score = 100;

    // Deduct for high regeneration rate
    if (metrics.regenerationRate > 30) {
        score -= 30;
    } else if (metrics.regenerationRate > 15) {
        score -= 15;
    }

    // Deduct for quality issues
    const qualityIssueRate = (metrics.qualityIndicators.schemaValidationFailures +
        metrics.qualityIndicators.parseErrors) / metrics.totalGenerations * 100;
    if (qualityIssueRate > 5) {
        score -= 20;
    } else if (qualityIssueRate > 2) {
        score -= 10;
    }

    // Deduct for slow response times
    if (metrics.averageResponseTime > 5000) {
        score -= 20;
    } else if (metrics.averageResponseTime > 3000) {
        score -= 10;
    }

    score = Math.max(0, score);

    const scoreEmoji = score >= 90 ? '🎉' : score >= 75 ? '😊' : score >= 60 ? '😐' : '😞';

    console.log(`${scoreEmoji} Estimated Satisfaction Score: ${score}/100`);

    if (score >= 90) {
        console.log('✅ Excellent! Users appear very satisfied with AI features.');
    } else if (score >= 75) {
        console.log('✅ Good! Users are generally satisfied, with room for improvement.');
    } else if (score >= 60) {
        console.log('⚠️  Fair. Some issues affecting user satisfaction.');
    } else {
        console.log('❌ Poor. Significant issues affecting user satisfaction.');
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ User feedback report generated successfully!\n`);
}

/**
 * Main execution
 */
async function main() {
    const userId = process.argv[2];
    const days = parseInt(process.argv[3] || '30', 10);

    if (!userId) {
        console.error('Usage: tsx scripts/collect-user-feedback.ts <userId> [days]');
        console.error('Example: tsx scripts/collect-user-feedback.ts user123 30');
        process.exit(1);
    }

    try {
        const metrics = await generateUserFeedbackMetrics(userId, days);
        printUserFeedbackReport(metrics);
    } catch (error) {
        console.error('\n❌ Error collecting user feedback:', error);
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

export { generateUserFeedbackMetrics, printUserFeedbackReport };
