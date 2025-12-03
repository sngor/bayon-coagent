/**
 * Benchmark Tracker Example Usage
 * 
 * Demonstrates how to use the BenchmarkTracker to compare agent performance
 * against market benchmarks and identify improvement areas.
 */

import { createBenchmarkTracker } from './benchmark-tracker';
import { createCompetitorMonitor } from './competitor-monitor';

/**
 * Example: Compare agent to market benchmarks
 */
async function exampleCompareToMarket() {
    const tracker = createBenchmarkTracker();
    const monitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Get competitor analyses
    const competitorIds = ['comp_1', 'comp_2', 'comp_3'];
    const competitorAnalyses = await monitor.analyzeMultipleCompetitors(
        userId,
        competitorIds
    );

    // Agent's current metrics
    const agentMetrics = {
        content_volume: 45,
        posting_frequency: 3.5,
        average_engagement: 25,
        channel_diversity: 3,
        content_type_diversity: 4,
        topic_coverage: 12,
    };

    // Compare to market
    const comparison = await tracker.compareToMarket(
        userId,
        agentMetrics,
        competitorAnalyses,
        'san-francisco'
    );

    console.log('Benchmark Comparison Results:');
    console.log('==============================\n');

    console.log(`Overall Percentile: ${comparison.summary.overallPercentile.toFixed(1)}%`);
    console.log(`Overall Status: ${comparison.summary.overallStatus}\n`);

    console.log('Strength Areas:');
    comparison.summary.strengthAreas.forEach(area => {
        console.log(`  - ${area}`);
    });

    console.log('\nImprovement Areas:');
    comparison.summary.improvementAreas.forEach(area => {
        console.log(`  - ${area}`);
    });

    console.log('\nTop Priorities:');
    comparison.summary.topPriorities.forEach(priority => {
        console.log(`  - ${priority}`);
    });

    console.log('\nDetailed Benchmarks:');
    comparison.benchmarks.forEach(benchmark => {
        console.log(`\n${benchmark.metric}:`);
        console.log(`  Your Value: ${benchmark.agentValue.toFixed(1)}`);
        console.log(`  Market Average: ${benchmark.marketAverage.toFixed(1)}`);
        console.log(`  Top Performer: ${benchmark.topPerformer.toFixed(1)}`);
        console.log(`  Percentile Rank: ${benchmark.percentileRank.toFixed(1)}%`);
        console.log(`  Status: ${benchmark.status}`);
        console.log(`  Gap to Average: ${benchmark.gapToAverage.toFixed(1)}`);
        console.log(`  Gap to Top: ${benchmark.gapToTop.toFixed(1)}`);
        console.log('  Recommendations:');
        benchmark.recommendations.forEach(rec => {
            console.log(`    - ${rec}`);
        });
    });

    console.log('\nTrends:');
    comparison.trends.forEach(trend => {
        console.log(`  ${trend.metric}: ${trend.direction} (${trend.changeRate.toFixed(2)}/month)`);
    });

    return comparison;
}

/**
 * Example: Identify improvement areas
 */
async function exampleIdentifyImprovementAreas() {
    const tracker = createBenchmarkTracker();
    const userId = 'user_123';

    // Get latest benchmarks
    const benchmarks = await tracker.getLatestBenchmarks(userId);

    // Identify improvement areas
    const improvementAreas = await tracker.identifyImprovementAreas(
        userId,
        benchmarks
    );

    console.log('Improvement Areas:');
    console.log('==================\n');

    improvementAreas.forEach((area, index) => {
        console.log(`${index + 1}. ${area.metric} (${area.priority} priority)`);
        console.log(`   Category: ${area.category}`);
        console.log(`   Current: ${area.currentValue.toFixed(1)}`);
        console.log(`   Target: ${area.targetValue.toFixed(1)}`);
        console.log(`   Gap: ${area.gap.toFixed(1)}`);
        console.log(`   Potential Impact: ${(area.potentialImpact * 100).toFixed(0)}%`);
        console.log(`   Estimated Timeframe: ${area.estimatedTimeframe}`);
        console.log('   Recommendations:');
        area.recommendations.forEach(rec => {
            console.log(`     - ${rec}`);
        });
        console.log('');
    });

    return improvementAreas;
}

/**
 * Example: Track performance over time
 */
async function exampleTrackPerformanceOverTime() {
    const tracker = createBenchmarkTracker();
    const userId = 'user_123';

    // Get historical data for specific metric
    const metric = 'posting_frequency';
    const history = await tracker.getHistoricalBenchmarks(userId, metric, 10);

    console.log(`Performance History: ${metric}`);
    console.log('====================================\n');

    history.forEach(benchmark => {
        const date = new Date(benchmark.timestamp).toLocaleDateString();
        console.log(`${date}:`);
        console.log(`  Value: ${benchmark.agentValue.toFixed(1)}`);
        console.log(`  Percentile: ${benchmark.percentileRank.toFixed(1)}%`);
        console.log(`  Status: ${benchmark.status}`);
        console.log('');
    });

    return history;
}

/**
 * Example: Get comprehensive performance analysis
 */
async function exampleComprehensiveAnalysis() {
    const tracker = createBenchmarkTracker();
    const monitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Step 1: Get competitor data
    console.log('Step 1: Analyzing competitors...');
    const competitors = await monitor.getCompetitors(userId);
    const competitorAnalyses = await monitor.analyzeMultipleCompetitors(
        userId,
        competitors.map(c => c.id)
    );

    // Step 2: Define agent metrics
    const agentMetrics = {
        content_volume: 45,
        posting_frequency: 3.5,
        average_engagement: 25,
        channel_diversity: 3,
        content_type_diversity: 4,
        topic_coverage: 12,
    };

    // Step 3: Compare to market
    console.log('Step 2: Comparing to market benchmarks...');
    const comparison = await tracker.compareToMarket(
        userId,
        agentMetrics,
        competitorAnalyses
    );

    // Step 4: Identify improvement areas
    console.log('Step 3: Identifying improvement areas...');
    const improvementAreas = await tracker.identifyImprovementAreas(
        userId,
        comparison.benchmarks
    );

    // Step 5: Generate action plan
    console.log('\n=== COMPREHENSIVE PERFORMANCE ANALYSIS ===\n');

    console.log('OVERALL PERFORMANCE:');
    console.log(`  Percentile Rank: ${comparison.summary.overallPercentile.toFixed(1)}%`);
    console.log(`  Status: ${comparison.summary.overallStatus}`);
    console.log('');

    console.log('YOUR STRENGTHS:');
    comparison.summary.strengthAreas.forEach((area, i) => {
        const benchmark = comparison.benchmarks.find(b => b.metric === area);
        if (benchmark) {
            console.log(`  ${i + 1}. ${area}`);
            console.log(`     - Percentile: ${benchmark.percentileRank.toFixed(1)}%`);
            console.log(`     - ${benchmark.agentValue.toFixed(1)} vs market avg ${benchmark.marketAverage.toFixed(1)}`);
        }
    });
    console.log('');

    console.log('PRIORITY IMPROVEMENTS:');
    improvementAreas.slice(0, 3).forEach((area, i) => {
        console.log(`  ${i + 1}. ${area.metric} (${area.priority} priority)`);
        console.log(`     - Current: ${area.currentValue.toFixed(1)}`);
        console.log(`     - Target: ${area.targetValue.toFixed(1)}`);
        console.log(`     - Timeframe: ${area.estimatedTimeframe}`);
        console.log(`     - Impact: ${(area.potentialImpact * 100).toFixed(0)}%`);
        console.log(`     - Action: ${area.recommendations[0]}`);
    });
    console.log('');

    console.log('PERFORMANCE TRENDS:');
    comparison.trends.forEach(trend => {
        const icon = trend.direction === 'improving' ? '↑' : trend.direction === 'declining' ? '↓' : '→';
        console.log(`  ${icon} ${trend.metric}: ${trend.direction}`);
    });
    console.log('');

    console.log('RECOMMENDED NEXT STEPS:');
    const topPriority = improvementAreas[0];
    if (topPriority) {
        console.log(`  1. Focus on: ${topPriority.metric}`);
        topPriority.recommendations.slice(0, 3).forEach((rec, i) => {
            console.log(`     ${String.fromCharCode(97 + i)}. ${rec}`);
        });
    }

    return {
        comparison,
        improvementAreas,
    };
}

/**
 * Example: Monitor progress on specific metric
 */
async function exampleMonitorProgress() {
    const tracker = createBenchmarkTracker();
    const userId = 'user_123';
    const metric = 'posting_frequency';

    // Get historical data
    const history = await tracker.getHistoricalBenchmarks(userId, metric, 30);

    if (history.length < 2) {
        console.log('Not enough historical data to track progress.');
        return;
    }

    // Calculate progress
    const latest = history[0];
    const oldest = history[history.length - 1];
    const change = latest.agentValue - oldest.agentValue;
    const percentChange = (change / oldest.agentValue) * 100;
    const rankChange = latest.percentileRank - oldest.percentileRank;

    console.log(`Progress Report: ${metric}`);
    console.log('=================================\n');

    console.log('STARTING POINT:');
    console.log(`  Date: ${new Date(oldest.timestamp).toLocaleDateString()}`);
    console.log(`  Value: ${oldest.agentValue.toFixed(1)}`);
    console.log(`  Percentile: ${oldest.percentileRank.toFixed(1)}%`);
    console.log(`  Status: ${oldest.status}\n`);

    console.log('CURRENT STATUS:');
    console.log(`  Date: ${new Date(latest.timestamp).toLocaleDateString()}`);
    console.log(`  Value: ${latest.agentValue.toFixed(1)}`);
    console.log(`  Percentile: ${latest.percentileRank.toFixed(1)}%`);
    console.log(`  Status: ${latest.status}\n`);

    console.log('PROGRESS:');
    console.log(`  Change: ${change > 0 ? '+' : ''}${change.toFixed(1)} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
    console.log(`  Rank Change: ${rankChange > 0 ? '+' : ''}${rankChange.toFixed(1)} percentile points`);
    console.log(`  Trend: ${change > 0 ? 'Improving ↑' : change < 0 ? 'Declining ↓' : 'Stable →'}\n`);

    if (latest.status !== 'top-performer') {
        console.log('NEXT MILESTONE:');
        console.log(`  Target: ${latest.topPerformer.toFixed(1)} (top performer level)`);
        console.log(`  Gap: ${(latest.topPerformer - latest.agentValue).toFixed(1)}`);
        console.log(`  At current rate: ${change > 0 ? Math.ceil((latest.topPerformer - latest.agentValue) / (change / history.length)) : 'N/A'} periods`);
    }

    return {
        latest,
        oldest,
        change,
        percentChange,
        rankChange,
    };
}

// Export examples
export {
    exampleCompareToMarket,
    exampleIdentifyImprovementAreas,
    exampleTrackPerformanceOverTime,
    exampleComprehensiveAnalysis,
    exampleMonitorProgress,
};

// Run example if executed directly
if (require.main === module) {
    exampleComprehensiveAnalysis()
        .then(() => console.log('\nExample completed successfully!'))
        .catch(error => console.error('Example failed:', error));
}
