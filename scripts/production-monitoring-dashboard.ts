#!/usr/bin/env tsx
/**
 * Production Monitoring Dashboard Script
 * 
 * Real-time monitoring dashboard for AI Model Optimization in production.
 * Displays key metrics, alerts, and trends.
 * 
 * Usage: tsx scripts/production-monitoring-dashboard.ts [userId] [refreshInterval]
 */

import { queryExecutionLogs } from '../src/aws/bedrock/cost-storage';
import {
    generateDashboardMetrics,
    formatCost,
    formatTokenCount,
} from '../src/aws/bedrock/cost-tracker';
import type { FlowExecutionLog } from '../src/aws/bedrock/execution-logger';

interface DashboardSnapshot {
    timestamp: string;
    metrics: {
        performance: {
            avgLatency: number;
            p50: number;
            p95: number;
            p99: number;
            totalInvocations: number;
        };
        cost: {
            hourly: number;
            daily: number;
            monthlyProjection: number;
            topCostlyFeatures: Array<{ name: string; cost: number }>;
        };
        reliability: {
            errorRate: number;
            successRate: number;
            retryRate: number;
            recentErrors: Array<{ flowName: string; error: string; timestamp: string }>;
        };
        usage: {
            totalTokens: number;
            byModel: Record<string, number>;
            byCategory: Record<string, number>;
        };
    };
    alerts: Array<{
        severity: 'critical' | 'warning' | 'info';
        message: string;
        metric: string;
        value: string;
    }>;
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(logs: FlowExecutionLog[]): {
    avgLatency: number;
    p50: number;
    p95: number;
    p99: number;
    totalInvocations: number;
} {
    const successfulLogs = logs.filter(log => log.success);

    if (successfulLogs.length === 0) {
        return { avgLatency: 0, p50: 0, p95: 0, p99: 0, totalInvocations: 0 };
    }

    const latencies = successfulLogs.map(log => log.executionTimeMs).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;

    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    return {
        avgLatency,
        p50: latencies[p50Index] || 0,
        p95: latencies[p95Index] || 0,
        p99: latencies[p99Index] || 0,
        totalInvocations: logs.length,
    };
}

/**
 * Calculate reliability metrics
 */
function calculateReliabilityMetrics(logs: FlowExecutionLog[]): {
    errorRate: number;
    successRate: number;
    retryRate: number;
    recentErrors: Array<{ flowName: string; error: string; timestamp: string }>;
} {
    if (logs.length === 0) {
        return { errorRate: 0, successRate: 0, retryRate: 0, recentErrors: [] };
    }

    const errors = logs.filter(log => !log.success);
    const successes = logs.filter(log => log.success);
    const errorRate = (errors.length / logs.length) * 100;
    const successRate = (successes.length / logs.length) * 100;

    let totalRetries = 0;
    for (const log of logs) {
        if (log.error?.retryCount) {
            totalRetries += log.error.retryCount;
        }
    }
    const retryRate = (totalRetries / logs.length) * 100;

    const recentErrors = errors
        .slice(-10)
        .map(log => ({
            flowName: log.flowName,
            error: log.error?.message || 'Unknown error',
            timestamp: log.timestamp,
        }));

    return {
        errorRate,
        successRate,
        retryRate,
        recentErrors,
    };
}

/**
 * Generate alerts based on metrics
 */
function generateAlerts(snapshot: DashboardSnapshot): Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    metric: string;
    value: string;
}> {
    const alerts: Array<{
        severity: 'critical' | 'warning' | 'info';
        message: string;
        metric: string;
        value: string;
    }> = [];

    // Performance alerts
    if (snapshot.metrics.performance.p99 > 10000) {
        alerts.push({
            severity: 'critical',
            message: 'P99 latency exceeds 10 seconds',
            metric: 'P99 Latency',
            value: `${snapshot.metrics.performance.p99.toFixed(0)}ms`,
        });
    } else if (snapshot.metrics.performance.p99 > 5000) {
        alerts.push({
            severity: 'warning',
            message: 'P99 latency exceeds 5 seconds',
            metric: 'P99 Latency',
            value: `${snapshot.metrics.performance.p99.toFixed(0)}ms`,
        });
    }

    if (snapshot.metrics.performance.avgLatency > 5000) {
        alerts.push({
            severity: 'warning',
            message: 'Average latency exceeds 5 seconds',
            metric: 'Average Latency',
            value: `${snapshot.metrics.performance.avgLatency.toFixed(0)}ms`,
        });
    }

    // Reliability alerts
    if (snapshot.metrics.reliability.errorRate > 10) {
        alerts.push({
            severity: 'critical',
            message: 'Error rate exceeds 10%',
            metric: 'Error Rate',
            value: `${snapshot.metrics.reliability.errorRate.toFixed(2)}%`,
        });
    } else if (snapshot.metrics.reliability.errorRate > 5) {
        alerts.push({
            severity: 'warning',
            message: 'Error rate exceeds 5%',
            metric: 'Error Rate',
            value: `${snapshot.metrics.reliability.errorRate.toFixed(2)}%`,
        });
    }

    if (snapshot.metrics.reliability.retryRate > 20) {
        alerts.push({
            severity: 'warning',
            message: 'Retry rate exceeds 20%',
            metric: 'Retry Rate',
            value: `${snapshot.metrics.reliability.retryRate.toFixed(2)}%`,
        });
    }

    // Cost alerts
    if (snapshot.metrics.cost.hourly > 1.0) {
        alerts.push({
            severity: 'warning',
            message: 'Hourly cost exceeds $1.00',
            metric: 'Hourly Cost',
            value: formatCost(snapshot.metrics.cost.hourly),
        });
    }

    if (snapshot.metrics.cost.monthlyProjection > 500) {
        alerts.push({
            severity: 'info',
            message: 'Monthly projection exceeds $500',
            metric: 'Monthly Projection',
            value: formatCost(snapshot.metrics.cost.monthlyProjection),
        });
    }

    return alerts;
}

/**
 * Generate dashboard snapshot
 */
async function generateDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    // Query logs for last 24 hours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);

    const logs = await queryExecutionLogs(userId, startDate, endDate);

    // Calculate performance metrics
    const performance = calculatePerformanceMetrics(logs);

    // Calculate reliability metrics
    const reliability = calculateReliabilityMetrics(logs);

    // Calculate cost metrics
    const costMetrics = generateDashboardMetrics(logs, 1);

    // Calculate hourly cost (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const lastHourLogs = logs.filter(log => new Date(log.timestamp) >= oneHourAgo);
    const lastHourCost = lastHourLogs
        .filter(log => log.success && log.tokenUsage)
        .reduce((sum, log) => {
            const { calculateExecutionCost } = require('../src/aws/bedrock/cost-tracker');
            const cost = calculateExecutionCost(log.tokenUsage!, log.modelId);
            return sum + cost.totalCost;
        }, 0);

    // Calculate usage metrics
    const totalTokens = logs
        .filter(log => log.success && log.tokenUsage)
        .reduce((sum, log) => sum + log.tokenUsage!.input + log.tokenUsage!.output, 0);

    const byModel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const log of logs) {
        if (log.success && log.tokenUsage) {
            const tokens = log.tokenUsage.input + log.tokenUsage.output;
            byModel[log.modelId] = (byModel[log.modelId] || 0) + tokens;
            byCategory[log.metadata.featureCategory] = (byCategory[log.metadata.featureCategory] || 0) + tokens;
        }
    }

    const snapshot: DashboardSnapshot = {
        timestamp: new Date().toISOString(),
        metrics: {
            performance,
            cost: {
                hourly: lastHourCost,
                daily: costMetrics.projections.dailyAverage,
                monthlyProjection: costMetrics.projections.monthlyProjection,
                topCostlyFeatures: costMetrics.currentPeriod.topCostlyFeatures.slice(0, 5).map(f => ({
                    name: f.flowName,
                    cost: f.totalCost,
                })),
            },
            reliability,
            usage: {
                totalTokens,
                byModel,
                byCategory,
            },
        },
        alerts: [],
    };

    // Generate alerts
    snapshot.alerts = generateAlerts(snapshot);

    return snapshot;
}

/**
 * Print dashboard
 */
function printDashboard(snapshot: DashboardSnapshot): void {
    // Clear console
    console.clear();

    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    AI MODEL OPTIMIZATION - PRODUCTION DASHBOARD                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log(`\n📅 Last Updated: ${new Date(snapshot.timestamp).toLocaleString()}\n`);

    // Alerts section
    if (snapshot.alerts.length > 0) {
        console.log('🚨 ALERTS');
        console.log('─'.repeat(80));

        for (const alert of snapshot.alerts) {
            const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
            console.log(`${icon} ${alert.severity.toUpperCase()}: ${alert.message}`);
            console.log(`   ${alert.metric}: ${alert.value}`);
        }
        console.log();
    }

    // Performance section
    console.log('⚡ PERFORMANCE (Last 24 Hours)');
    console.log('─'.repeat(80));
    console.log(`Total Invocations:    ${snapshot.metrics.performance.totalInvocations.toLocaleString()}`);
    console.log(`Average Latency:      ${snapshot.metrics.performance.avgLatency.toFixed(0)}ms`);
    console.log(`P50 Latency:          ${snapshot.metrics.performance.p50.toFixed(0)}ms`);
    console.log(`P95 Latency:          ${snapshot.metrics.performance.p95.toFixed(0)}ms`);
    console.log(`P99 Latency:          ${snapshot.metrics.performance.p99.toFixed(0)}ms`);
    console.log();

    // Cost section
    console.log('💰 COST');
    console.log('─'.repeat(80));
    console.log(`Hourly Cost:          ${formatCost(snapshot.metrics.cost.hourly)}`);
    console.log(`Daily Average:        ${formatCost(snapshot.metrics.cost.daily)}`);
    console.log(`Monthly Projection:   ${formatCost(snapshot.metrics.cost.monthlyProjection)}`);
    console.log('\nTop Costly Features:');
    for (const feature of snapshot.metrics.cost.topCostlyFeatures) {
        console.log(`  ${feature.name.padEnd(40)} ${formatCost(feature.cost)}`);
    }
    console.log();

    // Reliability section
    console.log('🛡️  RELIABILITY');
    console.log('─'.repeat(80));
    console.log(`Success Rate:         ${snapshot.metrics.reliability.successRate.toFixed(2)}%`);
    console.log(`Error Rate:           ${snapshot.metrics.reliability.errorRate.toFixed(2)}%`);
    console.log(`Retry Rate:           ${snapshot.metrics.reliability.retryRate.toFixed(2)}%`);

    if (snapshot.metrics.reliability.recentErrors.length > 0) {
        console.log('\nRecent Errors:');
        for (const error of snapshot.metrics.reliability.recentErrors.slice(0, 5)) {
            const time = new Date(error.timestamp).toLocaleTimeString();
            console.log(`  [${time}] ${error.flowName}: ${error.error.substring(0, 60)}...`);
        }
    }
    console.log();

    // Usage section
    console.log('📊 USAGE');
    console.log('─'.repeat(80));
    console.log(`Total Tokens:         ${formatTokenCount(snapshot.metrics.usage.totalTokens)}`);
    console.log('\nBy Model:');
    for (const [modelId, tokens] of Object.entries(snapshot.metrics.usage.byModel)) {
        const modelName = modelId.split('.').pop() || modelId;
        const percentage = (tokens / snapshot.metrics.usage.totalTokens) * 100;
        console.log(`  ${modelName.padEnd(40)} ${formatTokenCount(tokens).padStart(10)} (${percentage.toFixed(1)}%)`);
    }
    console.log('\nBy Category:');
    for (const [category, tokens] of Object.entries(snapshot.metrics.usage.byCategory)) {
        const percentage = (tokens / snapshot.metrics.usage.totalTokens) * 100;
        console.log(`  ${category.padEnd(40)} ${formatTokenCount(tokens).padStart(10)} (${percentage.toFixed(1)}%)`);
    }
    console.log();

    console.log('─'.repeat(80));
    console.log('Press Ctrl+C to exit');
}

/**
 * Main execution
 */
async function main() {
    const userId = process.argv[2];
    const refreshInterval = parseInt(process.argv[3] || '60', 10); // Default 60 seconds

    if (!userId) {
        console.error('Usage: tsx scripts/production-monitoring-dashboard.ts <userId> [refreshInterval]');
        console.error('Example: tsx scripts/production-monitoring-dashboard.ts user123 60');
        console.error('  refreshInterval is in seconds (default: 60)');
        process.exit(1);
    }

    console.log(`Starting production monitoring dashboard for user: ${userId}`);
    console.log(`Refresh interval: ${refreshInterval} seconds\n`);

    // Initial snapshot
    try {
        const snapshot = await generateDashboardSnapshot(userId);
        printDashboard(snapshot);
    } catch (error) {
        console.error('Error generating dashboard:', error);
    }

    // Refresh periodically
    setInterval(async () => {
        try {
            const snapshot = await generateDashboardSnapshot(userId);
            printDashboard(snapshot);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }, refreshInterval * 1000);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { generateDashboardSnapshot, printDashboard };
