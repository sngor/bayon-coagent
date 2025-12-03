/**
 * Performance Tracker Usage Examples
 * 
 * Demonstrates how to use the PerformanceTracker for monitoring
 * strand performance, detecting anomalies, and generating reports.
 */

import { createPerformanceTracker } from './performance-tracker';
import { PerformanceMetrics, AnalyticsFilters } from './types';

/**
 * Example 1: Track performance metrics for a strand execution
 */
export async function example1_trackPerformance() {
    const tracker = createPerformanceTracker();

    const metrics: PerformanceMetrics = {
        executionTime: 2500, // 2.5 seconds
        tokenUsage: 1500,
        cost: 0.045, // $0.045
        successRate: 1.0, // 100% success
        userSatisfaction: 4.5, // 4.5 out of 5
        qualityScore: 85, // 85 out of 100
        timestamp: new Date().toISOString(),
    };

    await tracker.trackPerformance(
        'strand-content-generator-123',
        'user-456',
        'task-789',
        'blog-post-generation',
        metrics
    );

    console.log('Performance metrics tracked successfully');
}

/**
 * Example 2: Get analytics for a specific strand
 */
export async function example2_getStrandAnalytics() {
    const tracker = createPerformanceTracker();

    const filters: AnalyticsFilters = {
        strandId: 'strand-content-generator-123',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        endDate: new Date().toISOString(),
    };

    const analytics = await tracker.getAnalytics(filters);

    console.log('Strand Analytics:');
    console.log(`Total Tasks: ${analytics.totalTasks}`);
    console.log(`Average Execution Time: ${analytics.avgExecutionTime.toFixed(0)}ms`);
    console.log(`Total Cost: $${analytics.totalCost.toFixed(2)}`);
    console.log(`Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
    console.log(`Average Quality Score: ${analytics.avgQualityScore.toFixed(0)}`);
    console.log(`Average User Satisfaction: ${analytics.avgSatisfaction.toFixed(1)}/5`);
}

/**
 * Example 3: Get analytics by task type
 */
export async function example3_getTaskTypeAnalytics() {
    const tracker = createPerformanceTracker();

    const filters: AnalyticsFilters = {
        taskType: 'blog-post-generation',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        endDate: new Date().toISOString(),
    };

    const analytics = await tracker.getAnalytics(filters);

    console.log('Task Type Analytics:');
    console.log(`Total Blog Posts Generated: ${analytics.totalTasks}`);
    console.log(`Average Time per Post: ${(analytics.avgExecutionTime / 1000).toFixed(1)}s`);
    console.log(`Total Tokens Used: ${analytics.totalTokens.toLocaleString()}`);
    console.log(`Total Cost: $${analytics.totalCost.toFixed(2)}`);

    // Show breakdown by strand
    console.log('\nPerformance by Strand:');
    for (const [strandId, metrics] of Object.entries(analytics.byStrand)) {
        console.log(`  ${strandId}:`);
        console.log(`    Avg Time: ${metrics.executionTime.toFixed(0)}ms`);
        console.log(`    Avg Quality: ${metrics.qualityScore.toFixed(0)}`);
        console.log(`    Avg Cost: $${metrics.cost.toFixed(4)}`);
    }
}

/**
 * Example 4: Detect anomalies in strand performance
 */
export async function example4_detectAnomalies() {
    const tracker = createPerformanceTracker();

    const anomalies = await tracker.detectAnomalies(
        'strand-content-generator-123',
        '7d' // Last 7 days
    );

    if (anomalies.length === 0) {
        console.log('No anomalies detected - system is healthy!');
        return;
    }

    console.log(`Detected ${anomalies.length} anomalies:`);

    for (const anomaly of anomalies) {
        console.log(`\n[${anomaly.severity.toUpperCase()}] ${anomaly.type}`);
        console.log(`  ${anomaly.description}`);
        console.log(`  Current: ${anomaly.currentValue.toFixed(2)}`);
        console.log(`  Expected: ${anomaly.expectedValue.toFixed(2)}`);
        console.log(`  Deviation: ${anomaly.deviation.toFixed(1)}%`);
        console.log('  Suggested Actions:');
        anomaly.suggestedActions.forEach(action => {
            console.log(`    - ${action}`);
        });
    }
}

/**
 * Example 5: Generate a daily performance report
 */
export async function example5_generateDailyReport() {
    const tracker = createPerformanceTracker();

    const filters: AnalyticsFilters = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        endDate: new Date().toISOString(),
    };

    const report = await tracker.generateReport('daily-summary', filters);

    console.log(`\n${report.title}`);
    console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    console.log(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`);

    console.log('\nKey Metrics:');
    console.log(`  Total Tasks: ${report.data.totalTasks}`);
    console.log(`  Success Rate: ${(report.data.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg Quality: ${report.data.avgQualityScore.toFixed(0)}`);
    console.log(`  Total Cost: $${report.data.totalCost.toFixed(2)}`);

    console.log('\nInsights:');
    report.insights.forEach(insight => {
        console.log(`  • ${insight}`);
    });

    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
    });

    if (report.anomalies.length > 0) {
        console.log(`\nAnomalies Detected: ${report.anomalies.length}`);
        report.anomalies.forEach(anomaly => {
            console.log(`  • [${anomaly.severity}] ${anomaly.description}`);
        });
    }
}

/**
 * Example 6: Generate a cost analysis report
 */
export async function example6_generateCostReport() {
    const tracker = createPerformanceTracker();

    const filters: AnalyticsFilters = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        endDate: new Date().toISOString(),
    };

    const report = await tracker.generateReport('cost-analysis', filters);

    console.log(`\n${report.title}`);
    console.log(`Total Cost: $${report.data.totalCost.toFixed(2)}`);
    console.log(`Total Tokens: ${report.data.totalTokens.toLocaleString()}`);
    console.log(`Average Cost per Task: $${(report.data.totalCost / report.data.totalTasks).toFixed(4)}`);

    console.log('\nCost by Strand:');
    const strandCosts = Object.entries(report.data.byStrand)
        .map(([id, metrics]) => ({ id, cost: metrics.cost }))
        .sort((a, b) => b.cost - a.cost);

    strandCosts.forEach(({ id, cost }) => {
        console.log(`  ${id}: $${cost.toFixed(4)} per task`);
    });

    console.log('\nCost by Task Type:');
    const taskCosts = Object.entries(report.data.byTaskType)
        .map(([type, metrics]) => ({ type, cost: metrics.cost }))
        .sort((a, b) => b.cost - a.cost);

    taskCosts.forEach(({ type, cost }) => {
        console.log(`  ${type}: $${cost.toFixed(4)} per task`);
    });
}

/**
 * Example 7: Get current performance snapshot
 */
export async function example7_getSnapshot() {
    const tracker = createPerformanceTracker();

    const snapshot = await tracker.getSnapshot('strand-content-generator-123');

    if (!snapshot) {
        console.log('No performance data available yet');
        return;
    }

    console.log('Current Performance Snapshot:');
    console.log(`  Strand: ${snapshot.strandId}`);
    console.log(`  Last Updated: ${new Date(snapshot.timestamp).toLocaleString()}`);
    console.log(`  Execution Time: ${snapshot.metrics.executionTime}ms`);
    console.log(`  Quality Score: ${snapshot.metrics.qualityScore}`);
    console.log(`  Success Rate: ${(snapshot.metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  User Satisfaction: ${snapshot.metrics.userSatisfaction}/5`);
}

/**
 * Example 8: Track performance with quality filters
 */
export async function example8_filterByQuality() {
    const tracker = createPerformanceTracker();

    // Get only high-quality tasks (score >= 80)
    const filters: AnalyticsFilters = {
        minQualityScore: 80,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
    };

    const analytics = await tracker.getAnalytics(filters);

    console.log('High-Quality Task Analytics:');
    console.log(`  Total High-Quality Tasks: ${analytics.totalTasks}`);
    console.log(`  Average Quality Score: ${analytics.avgQualityScore.toFixed(0)}`);
    console.log(`  Average User Satisfaction: ${analytics.avgSatisfaction.toFixed(1)}/5`);
    console.log(`  Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
}

/**
 * Example 9: Monitor strand performance over time
 */
export async function example9_monitorTimeSeries() {
    const tracker = createPerformanceTracker();

    const filters: AnalyticsFilters = {
        strandId: 'strand-content-generator-123',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
    };

    const analytics = await tracker.getAnalytics(filters);

    console.log('Performance Time Series:');

    // Group by metric
    const metricGroups = analytics.timeSeries.reduce((acc, point) => {
        if (!acc[point.metric]) {
            acc[point.metric] = [];
        }
        acc[point.metric].push(point);
        return acc;
    }, {} as Record<string, typeof analytics.timeSeries>);

    for (const [metric, points] of Object.entries(metricGroups)) {
        console.log(`\n${metric}:`);
        points.slice(-5).forEach(point => {
            const time = new Date(point.timestamp).toLocaleTimeString();
            console.log(`  ${time}: ${point.value.toFixed(2)}`);
        });
    }
}

/**
 * Example 10: Custom anomaly detection configuration
 */
export async function example10_customAnomalyDetection() {
    const tracker = createPerformanceTracker({
        enableAnomalyDetection: true,
        anomalyThresholds: {
            latencyMultiplier: 1.5, // More sensitive to latency
            errorRateThreshold: 0.05, // 5% error rate threshold
            costMultiplier: 2.0, // Less sensitive to cost
            qualityDropThreshold: 15, // 15 point quality drop
        },
    });

    const metrics: PerformanceMetrics = {
        executionTime: 4500, // Slightly elevated
        tokenUsage: 2000,
        cost: 0.06,
        successRate: 0.96, // 96% success
        userSatisfaction: 4.2,
        qualityScore: 78,
        timestamp: new Date().toISOString(),
    };

    await tracker.trackPerformance(
        'strand-content-generator-123',
        'user-456',
        'task-789',
        'blog-post-generation',
        metrics
    );

    console.log('Metrics tracked with custom anomaly detection');

    // Check for anomalies
    const anomalies = await tracker.detectAnomalies(
        'strand-content-generator-123',
        '1d'
    );

    if (anomalies.length > 0) {
        console.log(`\nDetected ${anomalies.length} anomalies with custom thresholds`);
    }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Performance Tracker Examples ===\n');

    try {
        console.log('Example 1: Track Performance');
        await example1_trackPerformance();

        console.log('\n\nExample 2: Get Strand Analytics');
        await example2_getStrandAnalytics();

        console.log('\n\nExample 3: Get Task Type Analytics');
        await example3_getTaskTypeAnalytics();

        console.log('\n\nExample 4: Detect Anomalies');
        await example4_detectAnomalies();

        console.log('\n\nExample 5: Generate Daily Report');
        await example5_generateDailyReport();

        console.log('\n\nExample 6: Generate Cost Report');
        await example6_generateCostReport();

        console.log('\n\nExample 7: Get Snapshot');
        await example7_getSnapshot();

        console.log('\n\nExample 8: Filter by Quality');
        await example8_filterByQuality();

        console.log('\n\nExample 9: Monitor Time Series');
        await example9_monitorTimeSeries();

        console.log('\n\nExample 10: Custom Anomaly Detection');
        await example10_customAnomalyDetection();

    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    runAllExamples();
}
