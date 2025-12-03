/**
 * Performance Tracker
 * 
 * Tracks strand performance metrics, detects anomalies, and generates reports.
 * Implements Requirements 9.1 and 9.3 from the AgentStrands enhancement spec.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAWSConfig } from '@/aws/config';
import {
    PerformanceMetrics,
    AnalyticsFilters,
    PerformanceAnalytics,
    Anomaly,
    ReportType,
    PerformanceReport,
    PerformanceSnapshot,
    PerformanceMetricsEntity,
    AnomalyEntity,
    TimeSeriesData,
} from './types';

/**
 * Configuration for performance tracking
 */
export interface PerformanceTrackerConfig {
    /** DynamoDB table name */
    tableName: string;
    /** Enable anomaly detection */
    enableAnomalyDetection?: boolean;
    /** Anomaly detection thresholds */
    anomalyThresholds?: {
        latencyMultiplier: number; // e.g., 2.0 = 2x normal latency
        errorRateThreshold: number; // e.g., 0.1 = 10% error rate
        costMultiplier: number; // e.g., 1.5 = 1.5x normal cost
        qualityDropThreshold: number; // e.g., 20 = 20 point drop
    };
    /** Data retention in days */
    retentionDays?: number;
}

/**
 * Performance Tracker
 * 
 * Tracks performance metrics for strand executions, aggregates analytics,
 * detects anomalies, and generates performance reports.
 */
export class PerformanceTracker {
    private docClient: DynamoDBDocumentClient;
    private config: Required<PerformanceTrackerConfig>;
    private metricsCache: Map<string, PerformanceMetrics[]>;
    private baselineCache: Map<string, PerformanceMetrics>;

    constructor(config: PerformanceTrackerConfig) {
        const awsConfig = getAWSConfig();
        const client = new DynamoDBClient(awsConfig);
        this.docClient = DynamoDBDocumentClient.from(client);

        this.config = {
            tableName: config.tableName,
            enableAnomalyDetection: config.enableAnomalyDetection ?? true,
            anomalyThresholds: config.anomalyThresholds ?? {
                latencyMultiplier: 2.0,
                errorRateThreshold: 0.1,
                costMultiplier: 1.5,
                qualityDropThreshold: 20,
            },
            retentionDays: config.retentionDays ?? 90,
        };

        this.metricsCache = new Map();
        this.baselineCache = new Map();
    }

    /**
     * Track performance metrics for a strand execution
     */
    async trackPerformance(
        strandId: string,
        userId: string,
        taskId: string,
        taskType: string,
        metrics: PerformanceMetrics
    ): Promise<void> {
        const timestamp = new Date().toISOString();

        // Create entity
        const entity: PerformanceMetricsEntity = {
            PK: `STRAND#${strandId}`,
            SK: `PERF#${timestamp}`,
            entityType: 'PerformanceMetrics',
            strandId,
            userId,
            taskId,
            taskType,
            metrics: {
                ...metrics,
                timestamp,
            },
            createdAt: timestamp,
            ttl: this.calculateTTL(this.config.retentionDays),
        };

        // Store in DynamoDB
        await this.docClient.send(
            new PutCommand({
                TableName: this.config.tableName,
                Item: entity,
            })
        );

        // Update cache
        this.updateCache(strandId, metrics);

        // Check for anomalies if enabled
        if (this.config.enableAnomalyDetection) {
            await this.checkForAnomalies(strandId, metrics);
        }
    }

    /**
     * Get analytics for specified filters
     */
    async getAnalytics(filters: AnalyticsFilters): Promise<PerformanceAnalytics> {
        const metricsData = await this.queryMetrics(filters);

        if (metricsData.length === 0) {
            return this.createEmptyAnalytics();
        }

        return this.aggregateMetrics(metricsData, filters);
    }

    /**
     * Detect anomalies in strand performance
     */
    async detectAnomalies(strandId: string, timeframe: string): Promise<Anomaly[]> {
        const endDate = new Date();
        const startDate = this.calculateStartDate(endDate, timeframe);

        const filters: AnalyticsFilters = {
            strandId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        const metricsData = await this.queryMetrics(filters);

        if (metricsData.length < 10) {
            // Not enough data for anomaly detection
            return [];
        }

        const baseline = this.calculateBaseline(metricsData.slice(0, -5));
        const recent = metricsData.slice(-5);

        const anomalies: Anomaly[] = [];

        for (const metrics of recent) {
            const detectedAnomalies = this.detectMetricAnomalies(
                strandId,
                metrics,
                baseline
            );
            anomalies.push(...detectedAnomalies);
        }

        // Store anomalies
        await this.storeAnomalies(strandId, anomalies);

        return anomalies;
    }

    /**
     * Generate performance report
     */
    async generateReport(
        reportType: ReportType,
        filters: AnalyticsFilters
    ): Promise<PerformanceReport> {
        const analytics = await this.getAnalytics(filters);
        const anomalies = filters.strandId
            ? await this.detectAnomalies(filters.strandId, '7d')
            : [];

        const insights = this.generateInsights(analytics, reportType);
        const recommendations = this.generateRecommendations(analytics, anomalies);

        const report: PerformanceReport = {
            id: `report-${Date.now()}`,
            type: reportType,
            title: this.getReportTitle(reportType),
            description: this.getReportDescription(reportType),
            generatedAt: new Date().toISOString(),
            period: {
                start: filters.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: filters.endDate || new Date().toISOString(),
            },
            data: analytics,
            insights,
            recommendations,
            anomalies,
        };

        return report;
    }

    /**
     * Get performance snapshot for a strand
     */
    async getSnapshot(strandId: string): Promise<PerformanceSnapshot | null> {
        const result = await this.docClient.send(
            new QueryCommand({
                TableName: this.config.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `STRAND#${strandId}`,
                    ':sk': 'PERF#',
                },
                ScanIndexForward: false,
                Limit: 1,
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        const entity = result.Items[0] as PerformanceMetricsEntity;

        return {
            id: entity.SK,
            strandId: entity.strandId,
            metrics: entity.metrics,
            timestamp: entity.createdAt,
            metadata: {
                taskId: entity.taskId,
                taskType: entity.taskType,
                userId: entity.userId,
            },
        };
    }

    /**
     * Query metrics from DynamoDB
     */
    private async queryMetrics(filters: AnalyticsFilters): Promise<PerformanceMetricsEntity[]> {
        const items: PerformanceMetricsEntity[] = [];

        if (filters.strandId) {
            // Query by strand
            const result = await this.docClient.send(
                new QueryCommand({
                    TableName: this.config.tableName,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': `STRAND#${filters.strandId}`,
                        ':sk': 'PERF#',
                    },
                })
            );

            if (result.Items) {
                items.push(...(result.Items as PerformanceMetricsEntity[]));
            }
        } else if (filters.userId) {
            // Query by user (requires GSI)
            // For now, we'll scan - in production, add a GSI
            // This is a simplified implementation
            const result = await this.docClient.send(
                new QueryCommand({
                    TableName: this.config.tableName,
                    KeyConditionExpression: 'PK = :pk',
                    ExpressionAttributeValues: {
                        ':pk': `USER#${filters.userId}`,
                    },
                })
            );

            if (result.Items) {
                items.push(...(result.Items as PerformanceMetricsEntity[]));
            }
        }

        // Apply additional filters
        return this.applyFilters(items, filters);
    }

    /**
     * Apply filters to metrics data
     */
    private applyFilters(
        items: PerformanceMetricsEntity[],
        filters: AnalyticsFilters
    ): PerformanceMetricsEntity[] {
        let filtered = items;

        if (filters.taskType) {
            filtered = filtered.filter(item => item.taskType === filters.taskType);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(item => new Date(item.createdAt) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filtered = filtered.filter(item => new Date(item.createdAt) <= endDate);
        }

        if (filters.minQualityScore !== undefined) {
            filtered = filtered.filter(
                item => item.metrics.qualityScore >= filters.minQualityScore!
            );
        }

        if (filters.maxCost !== undefined) {
            filtered = filtered.filter(item => item.metrics.cost <= filters.maxCost!);
        }

        return filtered;
    }

    /**
     * Aggregate metrics into analytics
     */
    private aggregateMetrics(
        items: PerformanceMetricsEntity[],
        filters: AnalyticsFilters
    ): PerformanceAnalytics {
        const totalTasks = items.length;

        // Calculate averages
        const totalExecutionTime = items.reduce((sum, item) => sum + item.metrics.executionTime, 0);
        const totalTokens = items.reduce((sum, item) => sum + item.metrics.tokenUsage, 0);
        const totalCost = items.reduce((sum, item) => sum + item.metrics.cost, 0);
        const totalSuccessRate = items.reduce((sum, item) => sum + item.metrics.successRate, 0);
        const totalSatisfaction = items.reduce((sum, item) => sum + item.metrics.userSatisfaction, 0);
        const totalQualityScore = items.reduce((sum, item) => sum + item.metrics.qualityScore, 0);

        // Group by strand
        const byStrand: Record<string, PerformanceMetrics> = {};
        const strandGroups = this.groupBy(items, item => item.strandId);

        for (const [strandId, strandItems] of Object.entries(strandGroups)) {
            byStrand[strandId] = this.calculateAverageMetrics(strandItems);
        }

        // Group by task type
        const byTaskType: Record<string, PerformanceMetrics> = {};
        const taskGroups = this.groupBy(items, item => item.taskType);

        for (const [taskType, taskItems] of Object.entries(taskGroups)) {
            byTaskType[taskType] = this.calculateAverageMetrics(taskItems);
        }

        // Create time series
        const timeSeries = this.createTimeSeries(items);

        return {
            totalTasks,
            avgExecutionTime: totalExecutionTime / totalTasks,
            totalTokens,
            totalCost,
            successRate: totalSuccessRate / totalTasks,
            avgSatisfaction: totalSatisfaction / totalTasks,
            avgQualityScore: totalQualityScore / totalTasks,
            byStrand,
            byTaskType,
            timeSeries,
        };
    }

    /**
     * Calculate average metrics for a group
     */
    private calculateAverageMetrics(items: PerformanceMetricsEntity[]): PerformanceMetrics {
        const count = items.length;

        return {
            executionTime: items.reduce((sum, item) => sum + item.metrics.executionTime, 0) / count,
            tokenUsage: items.reduce((sum, item) => sum + item.metrics.tokenUsage, 0) / count,
            cost: items.reduce((sum, item) => sum + item.metrics.cost, 0) / count,
            successRate: items.reduce((sum, item) => sum + item.metrics.successRate, 0) / count,
            userSatisfaction: items.reduce((sum, item) => sum + item.metrics.userSatisfaction, 0) / count,
            qualityScore: items.reduce((sum, item) => sum + item.metrics.qualityScore, 0) / count,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Create time series data
     */
    private createTimeSeries(items: PerformanceMetricsEntity[]): TimeSeriesData[] {
        const timeSeries: TimeSeriesData[] = [];

        // Group by hour
        const hourlyGroups = this.groupBy(items, item => {
            const date = new Date(item.createdAt);
            date.setMinutes(0, 0, 0);
            return date.toISOString();
        });

        for (const [timestamp, hourItems] of Object.entries(hourlyGroups)) {
            const avgMetrics = this.calculateAverageMetrics(hourItems);

            timeSeries.push(
                { timestamp, value: avgMetrics.executionTime, metric: 'executionTime' },
                { timestamp, value: avgMetrics.cost, metric: 'cost' },
                { timestamp, value: avgMetrics.qualityScore, metric: 'qualityScore' }
            );
        }

        return timeSeries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /**
     * Check for anomalies in current metrics
     */
    private async checkForAnomalies(
        strandId: string,
        metrics: PerformanceMetrics
    ): Promise<void> {
        const baseline = await this.getBaseline(strandId);

        if (!baseline) {
            // Not enough data yet
            return;
        }

        const anomalies = this.detectMetricAnomalies(strandId, metrics, baseline);

        if (anomalies.length > 0) {
            await this.storeAnomalies(strandId, anomalies);
        }
    }

    /**
     * Detect anomalies by comparing metrics to baseline
     */
    private detectMetricAnomalies(
        strandId: string,
        metrics: PerformanceMetrics,
        baseline: PerformanceMetrics
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const thresholds = this.config.anomalyThresholds;

        // Check latency
        if (metrics.executionTime > baseline.executionTime * thresholds.latencyMultiplier) {
            anomalies.push({
                id: `anomaly-${Date.now()}-latency`,
                type: 'latency',
                severity: this.calculateSeverity(
                    metrics.executionTime,
                    baseline.executionTime,
                    thresholds.latencyMultiplier
                ),
                description: `Execution time is ${(metrics.executionTime / baseline.executionTime).toFixed(1)}x higher than baseline`,
                affectedComponent: strandId,
                detectedAt: new Date().toISOString(),
                currentValue: metrics.executionTime,
                expectedValue: baseline.executionTime,
                deviation: ((metrics.executionTime - baseline.executionTime) / baseline.executionTime) * 100,
                suggestedActions: [
                    'Check for resource contention',
                    'Review recent code changes',
                    'Verify external service availability',
                ],
            });
        }

        // Check error rate
        if (metrics.successRate < (1 - thresholds.errorRateThreshold)) {
            anomalies.push({
                id: `anomaly-${Date.now()}-error`,
                type: 'error-rate',
                severity: 'high',
                description: `Success rate dropped to ${(metrics.successRate * 100).toFixed(1)}%`,
                affectedComponent: strandId,
                detectedAt: new Date().toISOString(),
                currentValue: metrics.successRate,
                expectedValue: baseline.successRate,
                deviation: ((baseline.successRate - metrics.successRate) / baseline.successRate) * 100,
                suggestedActions: [
                    'Review error logs',
                    'Check input validation',
                    'Verify model availability',
                ],
            });
        }

        // Check cost
        if (metrics.cost > baseline.cost * thresholds.costMultiplier) {
            anomalies.push({
                id: `anomaly-${Date.now()}-cost`,
                type: 'cost',
                severity: this.calculateSeverity(
                    metrics.cost,
                    baseline.cost,
                    thresholds.costMultiplier
                ),
                description: `Cost is ${(metrics.cost / baseline.cost).toFixed(1)}x higher than baseline`,
                affectedComponent: strandId,
                detectedAt: new Date().toISOString(),
                currentValue: metrics.cost,
                expectedValue: baseline.cost,
                deviation: ((metrics.cost - baseline.cost) / baseline.cost) * 100,
                suggestedActions: [
                    'Review token usage',
                    'Check for inefficient prompts',
                    'Consider model optimization',
                ],
            });
        }

        // Check quality
        if (metrics.qualityScore < baseline.qualityScore - thresholds.qualityDropThreshold) {
            anomalies.push({
                id: `anomaly-${Date.now()}-quality`,
                type: 'quality',
                severity: 'high',
                description: `Quality score dropped by ${(baseline.qualityScore - metrics.qualityScore).toFixed(0)} points`,
                affectedComponent: strandId,
                detectedAt: new Date().toISOString(),
                currentValue: metrics.qualityScore,
                expectedValue: baseline.qualityScore,
                deviation: ((baseline.qualityScore - metrics.qualityScore) / baseline.qualityScore) * 100,
                suggestedActions: [
                    'Review recent prompt changes',
                    'Check training data quality',
                    'Verify model configuration',
                ],
            });
        }

        return anomalies;
    }

    /**
     * Calculate severity based on deviation
     */
    private calculateSeverity(
        current: number,
        baseline: number,
        threshold: number
    ): 'low' | 'medium' | 'high' | 'critical' {
        const ratio = current / baseline;

        if (ratio > threshold * 2) return 'critical';
        if (ratio > threshold * 1.5) return 'high';
        if (ratio > threshold * 1.2) return 'medium';
        return 'low';
    }

    /**
     * Store anomalies in DynamoDB
     */
    private async storeAnomalies(strandId: string, anomalies: Anomaly[]): Promise<void> {
        if (anomalies.length === 0) return;

        const putRequests = anomalies.map(anomaly => ({
            PutRequest: {
                Item: {
                    PK: `STRAND#${strandId}`,
                    SK: `ANOMALY#${anomaly.detectedAt}`,
                    entityType: 'Anomaly',
                    strandId,
                    anomaly,
                    resolved: false,
                    createdAt: anomaly.detectedAt,
                } as AnomalyEntity,
            },
        }));

        // Batch write (max 25 items per batch)
        for (let i = 0; i < putRequests.length; i += 25) {
            const batch = putRequests.slice(i, i + 25);
            await this.docClient.send(
                new BatchWriteCommand({
                    RequestItems: {
                        [this.config.tableName]: batch,
                    },
                })
            );
        }
    }

    /**
     * Get baseline metrics for a strand
     */
    private async getBaseline(strandId: string): Promise<PerformanceMetrics | null> {
        // Check cache first
        if (this.baselineCache.has(strandId)) {
            return this.baselineCache.get(strandId)!;
        }

        // Query recent metrics
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

        const filters: AnalyticsFilters = {
            strandId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        const items = await this.queryMetrics(filters);

        if (items.length < 10) {
            return null; // Not enough data
        }

        const baseline = this.calculateBaseline(items);
        this.baselineCache.set(strandId, baseline);

        return baseline;
    }

    /**
     * Calculate baseline from historical metrics
     */
    private calculateBaseline(items: PerformanceMetricsEntity[]): PerformanceMetrics {
        return this.calculateAverageMetrics(items);
    }

    /**
     * Update metrics cache
     */
    private updateCache(strandId: string, metrics: PerformanceMetrics): void {
        if (!this.metricsCache.has(strandId)) {
            this.metricsCache.set(strandId, []);
        }

        const cache = this.metricsCache.get(strandId)!;
        cache.push(metrics);

        // Keep only last 100 metrics in cache
        if (cache.length > 100) {
            cache.shift();
        }
    }

    /**
     * Generate insights from analytics
     */
    private generateInsights(
        analytics: PerformanceAnalytics,
        reportType: ReportType
    ): string[] {
        const insights: string[] = [];

        // Success rate insights
        if (analytics.successRate < 0.9) {
            insights.push(
                `Success rate is ${(analytics.successRate * 100).toFixed(1)}%, below the 90% target`
            );
        } else {
            insights.push(
                `Success rate is healthy at ${(analytics.successRate * 100).toFixed(1)}%`
            );
        }

        // Quality insights
        if (analytics.avgQualityScore < 70) {
            insights.push(
                `Average quality score of ${analytics.avgQualityScore.toFixed(0)} indicates room for improvement`
            );
        }

        // Cost insights
        if (analytics.totalCost > 100) {
            insights.push(
                `Total cost of $${analytics.totalCost.toFixed(2)} may benefit from optimization`
            );
        }

        // Performance insights
        if (analytics.avgExecutionTime > 5000) {
            insights.push(
                `Average execution time of ${(analytics.avgExecutionTime / 1000).toFixed(1)}s is above target`
            );
        }

        return insights;
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(
        analytics: PerformanceAnalytics,
        anomalies: Anomaly[]
    ): string[] {
        const recommendations: string[] = [];

        // Anomaly-based recommendations
        if (anomalies.length > 0) {
            recommendations.push(
                `Address ${anomalies.length} detected anomalies to improve system health`
            );
        }

        // Performance recommendations
        if (analytics.avgExecutionTime > 5000) {
            recommendations.push(
                'Consider implementing caching or optimizing prompts to reduce latency'
            );
        }

        // Cost recommendations
        if (analytics.totalCost > 100) {
            recommendations.push(
                'Review token usage and consider using smaller models for simpler tasks'
            );
        }

        // Quality recommendations
        if (analytics.avgQualityScore < 70) {
            recommendations.push(
                'Implement additional quality checks or refine prompts to improve output quality'
            );
        }

        return recommendations;
    }

    /**
     * Helper: Group items by key
     */
    private groupBy<T>(
        items: T[],
        keyFn: (item: T) => string
    ): Record<string, T[]> {
        const groups: Record<string, T[]> = {};

        for (const item of items) {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        }

        return groups;
    }

    /**
     * Calculate TTL timestamp
     */
    private calculateTTL(days: number): number {
        return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
    }

    /**
     * Calculate start date from timeframe
     */
    private calculateStartDate(endDate: Date, timeframe: string): Date {
        const match = timeframe.match(/^(\d+)([hdwmy])$/);
        if (!match) {
            throw new Error(`Invalid timeframe format: ${timeframe}`);
        }

        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        const startDate = new Date(endDate);

        switch (unit) {
            case 'h':
                startDate.setHours(startDate.getHours() - value);
                break;
            case 'd':
                startDate.setDate(startDate.getDate() - value);
                break;
            case 'w':
                startDate.setDate(startDate.getDate() - value * 7);
                break;
            case 'm':
                startDate.setMonth(startDate.getMonth() - value);
                break;
            case 'y':
                startDate.setFullYear(startDate.getFullYear() - value);
                break;
        }

        return startDate;
    }

    /**
     * Create empty analytics object
     */
    private createEmptyAnalytics(): PerformanceAnalytics {
        return {
            totalTasks: 0,
            avgExecutionTime: 0,
            totalTokens: 0,
            totalCost: 0,
            successRate: 0,
            avgSatisfaction: 0,
            avgQualityScore: 0,
            byStrand: {},
            byTaskType: {},
            timeSeries: [],
        };
    }

    /**
     * Get report title
     */
    private getReportTitle(reportType: ReportType): string {
        const titles: Record<ReportType, string> = {
            'daily-summary': 'Daily Performance Summary',
            'weekly-summary': 'Weekly Performance Summary',
            'monthly-summary': 'Monthly Performance Summary',
            'strand-performance': 'Strand Performance Analysis',
            'cost-analysis': 'Cost Analysis Report',
            'quality-trends': 'Quality Trends Report',
            'user-satisfaction': 'User Satisfaction Report',
            'bottleneck-analysis': 'Bottleneck Analysis Report',
        };

        return titles[reportType];
    }

    /**
     * Get report description
     */
    private getReportDescription(reportType: ReportType): string {
        const descriptions: Record<ReportType, string> = {
            'daily-summary': 'Summary of performance metrics for the past 24 hours',
            'weekly-summary': 'Summary of performance metrics for the past 7 days',
            'monthly-summary': 'Summary of performance metrics for the past 30 days',
            'strand-performance': 'Detailed analysis of individual strand performance',
            'cost-analysis': 'Analysis of costs by strand, user, and task type',
            'quality-trends': 'Trends in output quality over time',
            'user-satisfaction': 'Analysis of user satisfaction scores',
            'bottleneck-analysis': 'Identification of performance bottlenecks',
        };

        return descriptions[reportType];
    }
}

/**
 * Create a performance tracker instance
 */
export function createPerformanceTracker(
    config?: Partial<PerformanceTrackerConfig>
): PerformanceTracker {
    const defaultConfig: PerformanceTrackerConfig = {
        tableName: process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev',
        enableAnomalyDetection: true,
        retentionDays: 90,
    };

    return new PerformanceTracker({ ...defaultConfig, ...config });
}
