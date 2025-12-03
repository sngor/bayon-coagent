/**
 * Benchmark Tracker
 * 
 * Tracks and compares agent performance against market benchmarks,
 * identifies improvement areas, and provides actionable insights.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import {
    CompetitiveBenchmark,
    CompetitorAnalysisResult,
    Competitor,
} from './types';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Benchmark category
 */
export type BenchmarkCategory = 'content' | 'engagement' | 'reach' | 'frequency' | 'quality';

/**
 * Performance status
 */
export type PerformanceStatus = 'below-average' | 'average' | 'above-average' | 'top-performer';

/**
 * Benchmark data point
 */
export interface BenchmarkDataPoint {
    metric: string;
    category: BenchmarkCategory;
    value: number;
    timestamp: string;
}

/**
 * Market benchmark statistics
 */
export interface MarketBenchmarkStats {
    metric: string;
    category: BenchmarkCategory;
    min: number;
    max: number;
    average: number;
    median: number;
    percentile25: number;
    percentile75: number;
    percentile90: number;
    sampleSize: number;
    timestamp: string;
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparisonResult {
    benchmarks: CompetitiveBenchmark[];
    summary: {
        overallPercentile: number;
        overallStatus: PerformanceStatus;
        strengthAreas: string[];
        improvementAreas: string[];
        topPriorities: string[];
    };
    trends: {
        metric: string;
        direction: 'improving' | 'stable' | 'declining';
        changeRate: number;
    }[];
    timestamp: string;
}

/**
 * Improvement area
 */
export interface ImprovementArea {
    id: string;
    metric: string;
    category: BenchmarkCategory;
    currentValue: number;
    targetValue: number;
    gap: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    estimatedTimeframe: string;
    potentialImpact: number;
    identifiedAt: string;
}

/**
 * Benchmark storage record
 */
export interface BenchmarkRecord {
    /** Primary key: USER#userId */
    PK: string;
    /** Sort key: BENCHMARK#timestamp */
    SK: string;
    /** Entity type */
    entityType: 'BenchmarkRecord';
    /** Benchmark data */
    benchmark: CompetitiveBenchmark;
    /** Created timestamp */
    createdAt: string;
    /** TTL for automatic cleanup (365 days) */
    ttl: number;
}

/**
 * Market stats storage record
 */
export interface MarketStatsRecord {
    /** Primary key: MARKET#region */
    PK: string;
    /** Sort key: STATS#metric#timestamp */
    SK: string;
    /** Entity type */
    entityType: 'MarketStatsRecord';
    /** Market statistics */
    stats: MarketBenchmarkStats;
    /** Created timestamp */
    createdAt: string;
    /** TTL for automatic cleanup (180 days) */
    ttl: number;
}

/**
 * BenchmarkTracker - Tracks and analyzes performance benchmarks
 */
export class BenchmarkTracker {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;

    constructor() {
        this.client = getBedrockClient();
        this.repository = getRepository();
    }

    /**
     * Compare agent performance to market benchmarks
     */
    async compareToMarket(
        userId: string,
        agentMetrics: Record<string, number>,
        competitorAnalyses: CompetitorAnalysisResult[],
        region?: string
    ): Promise<BenchmarkComparisonResult> {
        const benchmarks: CompetitiveBenchmark[] = [];

        // Calculate market statistics from competitor data
        const marketStats = this.calculateMarketStats(competitorAnalyses);

        // Compare each metric
        for (const [metric, agentValue] of Object.entries(agentMetrics)) {
            const category = this.categorizeMetric(metric);
            const stats = marketStats.get(metric);

            if (stats) {
                const benchmark = this.createBenchmark(
                    metric,
                    category,
                    agentValue,
                    stats
                );

                benchmarks.push(benchmark);

                // Store benchmark
                await this.storeBenchmark(userId, benchmark);
            }
        }

        // Calculate summary
        const summary = this.calculateSummary(benchmarks);

        // Analyze trends
        const trends = await this.analyzeTrends(userId, benchmarks);

        const result: BenchmarkComparisonResult = {
            benchmarks,
            summary,
            trends,
            timestamp: new Date().toISOString(),
        };

        return result;
    }

    /**
     * Calculate market statistics from competitor analyses
     */
    private calculateMarketStats(
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Map<string, MarketBenchmarkStats> {
        const statsMap = new Map<string, MarketBenchmarkStats>();

        if (competitorAnalyses.length === 0) {
            return statsMap;
        }

        // Extract metrics from competitor analyses
        const metricsData = new Map<string, number[]>();

        for (const analysis of competitorAnalyses) {
            // Content volume
            this.addMetricValue(metricsData, 'content_volume', analysis.summary.totalContent);

            // Posting frequency
            this.addMetricValue(metricsData, 'posting_frequency', analysis.summary.postingFrequency);

            // Average engagement
            this.addMetricValue(metricsData, 'average_engagement', analysis.summary.averageEngagement);

            // Channel diversity
            this.addMetricValue(metricsData, 'channel_diversity', analysis.summary.mostActiveChannels.length);

            // Content type diversity
            this.addMetricValue(metricsData, 'content_type_diversity', Object.keys(analysis.summary.contentTypes).length);

            // Topic coverage
            this.addMetricValue(metricsData, 'topic_coverage', analysis.summary.topTopics.length);
        }

        // Calculate statistics for each metric
        for (const [metric, values] of metricsData.entries()) {
            const sorted = values.sort((a, b) => a - b);
            const stats: MarketBenchmarkStats = {
                metric,
                category: this.categorizeMetric(metric),
                min: sorted[0],
                max: sorted[sorted.length - 1],
                average: values.reduce((sum, v) => sum + v, 0) / values.length,
                median: this.calculatePercentile(sorted, 50),
                percentile25: this.calculatePercentile(sorted, 25),
                percentile75: this.calculatePercentile(sorted, 75),
                percentile90: this.calculatePercentile(sorted, 90),
                sampleSize: values.length,
                timestamp: new Date().toISOString(),
            };

            statsMap.set(metric, stats);
        }

        return statsMap;
    }

    /**
     * Add metric value to collection
     */
    private addMetricValue(
        metricsData: Map<string, number[]>,
        metric: string,
        value: number
    ): void {
        const existing = metricsData.get(metric) || [];
        existing.push(value);
        metricsData.set(metric, existing);
    }

    /**
     * Calculate percentile value
     */
    private calculatePercentile(sortedValues: number[], percentile: number): number {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;

        if (lower === upper) {
            return sortedValues[lower];
        }

        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    /**
     * Create benchmark from agent value and market stats
     */
    private createBenchmark(
        metric: string,
        category: BenchmarkCategory,
        agentValue: number,
        stats: MarketBenchmarkStats
    ): CompetitiveBenchmark {
        const benchmarkId = `benchmark_${metric}_${Date.now()}`;

        // Calculate percentile rank
        const percentileRank = this.calculatePercentileRank(agentValue, stats);

        // Determine status
        const status = this.determineStatus(percentileRank);

        // Calculate gaps
        const gapToAverage = agentValue - stats.average;
        const gapToTop = agentValue - stats.percentile90;

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            metric,
            agentValue,
            stats,
            status
        );

        return {
            id: benchmarkId,
            metric,
            category,
            agentValue,
            marketAverage: stats.average,
            topPerformer: stats.percentile90,
            percentileRank,
            status,
            gapToAverage,
            gapToTop,
            recommendations,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Calculate percentile rank for agent value
     */
    private calculatePercentileRank(
        agentValue: number,
        stats: MarketBenchmarkStats
    ): number {
        // Estimate percentile based on position relative to known percentiles
        if (agentValue <= stats.min) return 0;
        if (agentValue >= stats.max) return 100;

        if (agentValue <= stats.percentile25) {
            return (agentValue - stats.min) / (stats.percentile25 - stats.min) * 25;
        } else if (agentValue <= stats.median) {
            return 25 + (agentValue - stats.percentile25) / (stats.median - stats.percentile25) * 25;
        } else if (agentValue <= stats.percentile75) {
            return 50 + (agentValue - stats.median) / (stats.percentile75 - stats.median) * 25;
        } else if (agentValue <= stats.percentile90) {
            return 75 + (agentValue - stats.percentile75) / (stats.percentile90 - stats.percentile75) * 15;
        } else {
            return 90 + (agentValue - stats.percentile90) / (stats.max - stats.percentile90) * 10;
        }
    }

    /**
     * Determine performance status from percentile rank
     */
    private determineStatus(percentileRank: number): PerformanceStatus {
        if (percentileRank >= 90) return 'top-performer';
        if (percentileRank >= 60) return 'above-average';
        if (percentileRank >= 40) return 'average';
        return 'below-average';
    }

    /**
     * Generate recommendations based on benchmark
     */
    private generateRecommendations(
        metric: string,
        agentValue: number,
        stats: MarketBenchmarkStats,
        status: PerformanceStatus
    ): string[] {
        const recommendations: string[] = [];

        if (status === 'top-performer') {
            recommendations.push(`Excellent performance on ${metric}. Maintain current strategy.`);
            recommendations.push(`Consider sharing best practices with team.`);
            return recommendations;
        }

        const gapToAverage = stats.average - agentValue;
        const gapToTop = stats.percentile90 - agentValue;

        if (status === 'below-average') {
            recommendations.push(`${metric} is below market average. Priority improvement area.`);
            recommendations.push(`Target: Increase by ${gapToAverage.toFixed(1)} to reach market average.`);
        } else if (status === 'average') {
            recommendations.push(`${metric} is at market average. Opportunity to differentiate.`);
            recommendations.push(`Target: Increase by ${gapToTop.toFixed(1)} to reach top performer level.`);
        } else {
            recommendations.push(`${metric} is above average. Continue momentum.`);
            recommendations.push(`Target: Increase by ${gapToTop.toFixed(1)} to reach top performer level.`);
        }

        // Metric-specific recommendations
        const specificRecs = this.getMetricSpecificRecommendations(metric, agentValue, stats);
        recommendations.push(...specificRecs);

        return recommendations;
    }

    /**
     * Get metric-specific recommendations
     */
    private getMetricSpecificRecommendations(
        metric: string,
        agentValue: number,
        stats: MarketBenchmarkStats
    ): string[] {
        const recommendations: string[] = [];

        switch (metric) {
            case 'posting_frequency':
                if (agentValue < stats.average) {
                    recommendations.push('Increase posting frequency gradually to avoid burnout.');
                    recommendations.push('Focus on quality over quantity when ramping up.');
                }
                break;

            case 'average_engagement':
                if (agentValue < stats.average) {
                    recommendations.push('Analyze top-performing posts to identify engagement drivers.');
                    recommendations.push('Experiment with different content formats and posting times.');
                }
                break;

            case 'channel_diversity':
                if (agentValue < stats.average) {
                    recommendations.push('Expand to additional platforms where your audience is active.');
                    recommendations.push('Start with one new platform and establish presence before adding more.');
                }
                break;

            case 'content_type_diversity':
                if (agentValue < stats.average) {
                    recommendations.push('Diversify content types to appeal to different audience preferences.');
                    recommendations.push('Test video, infographics, and interactive content.');
                }
                break;

            case 'topic_coverage':
                if (agentValue < stats.average) {
                    recommendations.push('Expand topic coverage to address more audience needs.');
                    recommendations.push('Research trending topics in your market.');
                }
                break;

            case 'content_volume':
                if (agentValue < stats.average) {
                    recommendations.push('Build content library systematically over time.');
                    recommendations.push('Repurpose existing content into different formats.');
                }
                break;
        }

        return recommendations;
    }

    /**
     * Categorize metric into benchmark category
     */
    private categorizeMetric(metric: string): BenchmarkCategory {
        const contentMetrics = ['content_volume', 'content_type_diversity', 'topic_coverage'];
        const engagementMetrics = ['average_engagement', 'engagement_rate', 'interaction_rate'];
        const reachMetrics = ['channel_diversity', 'audience_size', 'reach'];
        const frequencyMetrics = ['posting_frequency', 'consistency_score'];
        const qualityMetrics = ['content_quality', 'brand_consistency'];

        if (contentMetrics.includes(metric)) return 'content';
        if (engagementMetrics.includes(metric)) return 'engagement';
        if (reachMetrics.includes(metric)) return 'reach';
        if (frequencyMetrics.includes(metric)) return 'frequency';
        if (qualityMetrics.includes(metric)) return 'quality';

        return 'content'; // Default
    }

    /**
     * Calculate summary from benchmarks
     */
    private calculateSummary(benchmarks: CompetitiveBenchmark[]): {
        overallPercentile: number;
        overallStatus: PerformanceStatus;
        strengthAreas: string[];
        improvementAreas: string[];
        topPriorities: string[];
    } {
        if (benchmarks.length === 0) {
            return {
                overallPercentile: 0,
                overallStatus: 'below-average',
                strengthAreas: [],
                improvementAreas: [],
                topPriorities: [],
            };
        }

        // Calculate overall percentile (average)
        const overallPercentile = benchmarks.reduce((sum, b) => sum + b.percentileRank, 0) / benchmarks.length;
        const overallStatus = this.determineStatus(overallPercentile);

        // Identify strength areas (top 25%)
        const strengthAreas = benchmarks
            .filter(b => b.status === 'top-performer' || b.status === 'above-average')
            .map(b => b.metric)
            .slice(0, 3);

        // Identify improvement areas (bottom 25%)
        const improvementAreas = benchmarks
            .filter(b => b.status === 'below-average' || b.status === 'average')
            .sort((a, b) => a.percentileRank - b.percentileRank)
            .map(b => b.metric)
            .slice(0, 3);

        // Top priorities (largest gaps with high impact)
        const topPriorities = benchmarks
            .filter(b => b.status === 'below-average')
            .sort((a, b) => Math.abs(b.gapToAverage) - Math.abs(a.gapToAverage))
            .map(b => b.metric)
            .slice(0, 3);

        return {
            overallPercentile,
            overallStatus,
            strengthAreas,
            improvementAreas,
            topPriorities,
        };
    }

    /**
     * Analyze trends over time
     */
    private async analyzeTrends(
        userId: string,
        currentBenchmarks: CompetitiveBenchmark[]
    ): Promise<{
        metric: string;
        direction: 'improving' | 'stable' | 'declining';
        changeRate: number;
    }[]> {
        const trends: {
            metric: string;
            direction: 'improving' | 'stable' | 'declining';
            changeRate: number;
        }[] = [];

        // Get historical benchmarks (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historicalRecords = await this.repository.query<BenchmarkRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'BENCHMARK#' },
        });

        const historicalBenchmarks = historicalRecords
            .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
            .map(r => r.benchmark);

        // Analyze each metric
        for (const current of currentBenchmarks) {
            const historical = historicalBenchmarks
                .filter(b => b.metric === current.metric)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (historical.length >= 2) {
                const oldest = historical[0];
                const change = current.agentValue - oldest.agentValue;
                const timeSpan = (new Date(current.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60 * 60 * 24);
                const changeRate = timeSpan > 0 ? (change / timeSpan) * 30 : 0; // Monthly rate

                let direction: 'improving' | 'stable' | 'declining';
                if (Math.abs(changeRate) < 0.05) {
                    direction = 'stable';
                } else if (changeRate > 0) {
                    direction = 'improving';
                } else {
                    direction = 'declining';
                }

                trends.push({
                    metric: current.metric,
                    direction,
                    changeRate,
                });
            } else {
                // Not enough historical data
                trends.push({
                    metric: current.metric,
                    direction: 'stable',
                    changeRate: 0,
                });
            }
        }

        return trends;
    }

    /**
     * Identify improvement areas
     */
    async identifyImprovementAreas(
        userId: string,
        benchmarks: CompetitiveBenchmark[]
    ): Promise<ImprovementArea[]> {
        const improvementAreas: ImprovementArea[] = [];

        // Focus on below-average and average metrics
        const needsImprovement = benchmarks.filter(
            b => b.status === 'below-average' || b.status === 'average'
        );

        for (const benchmark of needsImprovement) {
            const areaId = `improvement_${benchmark.metric}_${Date.now()}`;

            // Determine target value (aim for 75th percentile)
            const targetValue = benchmark.marketAverage + (benchmark.topPerformer - benchmark.marketAverage) * 0.5;
            const gap = targetValue - benchmark.agentValue;

            // Determine priority
            let priority: 'low' | 'medium' | 'high' | 'critical';
            if (benchmark.status === 'below-average' && Math.abs(benchmark.gapToAverage) > benchmark.marketAverage * 0.3) {
                priority = 'critical';
            } else if (benchmark.status === 'below-average') {
                priority = 'high';
            } else if (Math.abs(benchmark.gapToAverage) > benchmark.marketAverage * 0.2) {
                priority = 'medium';
            } else {
                priority = 'low';
            }

            // Estimate timeframe
            const estimatedTimeframe = this.estimateTimeframe(gap, benchmark.metric);

            // Calculate potential impact
            const potentialImpact = this.calculatePotentialImpact(benchmark);

            improvementAreas.push({
                id: areaId,
                metric: benchmark.metric,
                category: benchmark.category,
                currentValue: benchmark.agentValue,
                targetValue,
                gap,
                priority,
                recommendations: benchmark.recommendations,
                estimatedTimeframe,
                potentialImpact,
                identifiedAt: new Date().toISOString(),
            });
        }

        // Sort by priority and potential impact
        improvementAreas.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.potentialImpact - a.potentialImpact;
        });

        return improvementAreas;
    }

    /**
     * Estimate timeframe to close gap
     */
    private estimateTimeframe(gap: number, metric: string): string {
        // Rough estimates based on metric type
        const quickMetrics = ['posting_frequency', 'channel_diversity'];
        const mediumMetrics = ['content_type_diversity', 'topic_coverage'];
        const slowMetrics = ['average_engagement', 'content_volume'];

        if (quickMetrics.includes(metric)) {
            return gap > 5 ? '2-4 weeks' : '1-2 weeks';
        } else if (mediumMetrics.includes(metric)) {
            return gap > 5 ? '1-2 months' : '2-4 weeks';
        } else {
            return gap > 10 ? '3-6 months' : '1-3 months';
        }
    }

    /**
     * Calculate potential impact of improvement
     */
    private calculatePotentialImpact(benchmark: CompetitiveBenchmark): number {
        // Impact based on gap size and metric importance
        const gapRatio = Math.abs(benchmark.gapToAverage) / benchmark.marketAverage;

        // Weight by category importance
        const categoryWeights: Record<BenchmarkCategory, number> = {
            engagement: 1.0,
            quality: 0.9,
            content: 0.8,
            frequency: 0.7,
            reach: 0.7,
        };

        const weight = categoryWeights[benchmark.category] || 0.5;

        return Math.min(gapRatio * weight, 1.0);
    }

    /**
     * Store benchmark in database
     */
    private async storeBenchmark(
        userId: string,
        benchmark: CompetitiveBenchmark
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        const ttl = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 365 days

        const record: BenchmarkRecord = {
            PK: `USER#${userId}`,
            SK: `BENCHMARK#${timestamp}#${benchmark.metric}`,
            entityType: 'BenchmarkRecord',
            benchmark,
            createdAt: timestamp,
            ttl,
        };

        await this.repository.put(record);
    }

    /**
     * Get historical benchmarks for a user
     */
    async getHistoricalBenchmarks(
        userId: string,
        metric?: string,
        limit?: number
    ): Promise<CompetitiveBenchmark[]> {
        const records = await this.repository.query<BenchmarkRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'BENCHMARK#' },
        });

        let benchmarks = records.map(r => r.benchmark);

        if (metric) {
            benchmarks = benchmarks.filter(b => b.metric === metric);
        }

        // Sort by timestamp descending
        benchmarks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (limit && limit > 0) {
            benchmarks = benchmarks.slice(0, limit);
        }

        return benchmarks;
    }

    /**
     * Get latest benchmarks for all metrics
     */
    async getLatestBenchmarks(userId: string): Promise<CompetitiveBenchmark[]> {
        const records = await this.repository.query<BenchmarkRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'BENCHMARK#' },
        });

        const benchmarks = records.map(r => r.benchmark);

        // Group by metric and get latest for each
        const latestByMetric = new Map<string, CompetitiveBenchmark>();

        for (const benchmark of benchmarks) {
            const existing = latestByMetric.get(benchmark.metric);
            if (!existing || new Date(benchmark.timestamp) > new Date(existing.timestamp)) {
                latestByMetric.set(benchmark.metric, benchmark);
            }
        }

        return Array.from(latestByMetric.values());
    }

    /**
     * Store market statistics
     */
    async storeMarketStats(
        region: string,
        stats: MarketBenchmarkStats
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        const ttl = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60); // 180 days

        const record: MarketStatsRecord = {
            PK: `MARKET#${region}`,
            SK: `STATS#${stats.metric}#${timestamp}`,
            entityType: 'MarketStatsRecord',
            stats,
            createdAt: timestamp,
            ttl,
        };

        await this.repository.put(record);
    }

    /**
     * Get market statistics
     */
    async getMarketStats(
        region: string,
        metric?: string
    ): Promise<MarketBenchmarkStats[]> {
        const skPrefix = metric ? `STATS#${metric}#` : 'STATS#';

        const records = await this.repository.query<MarketStatsRecord>({
            PK: `MARKET#${region}`,
            SK: { beginsWith: skPrefix },
        });

        return records.map(r => r.stats);
    }
}

/**
 * Create a new BenchmarkTracker instance
 */
export function createBenchmarkTracker(): BenchmarkTracker {
    return new BenchmarkTracker();
}
