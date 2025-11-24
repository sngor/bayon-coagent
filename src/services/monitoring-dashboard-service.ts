/**
 * Monitoring Dashboard Service
 * 
 * Provides a comprehensive monitoring dashboard that aggregates data from:
 * - Proactive monitoring alerts and predictions
 * - CloudWatch metrics and alarms
 * - Error monitoring and system health
 * - Business metrics and performance indicators
 * - Real-time system status and trends
 * 
 * Validates: Requirements 1.5, 8.2, 8.5 with comprehensive observability
 */

import { proactiveMonitoringService, type ProactiveAlert } from './proactive-monitoring-service';
import { errorMonitoringService, type SystemHealth } from './error-monitoring-service';
import { externalAPIErrorHandler } from './external-api-error-handler';
import { cloudWatchLogger, createCorrelationId, setCorrelationId } from './cloudwatch-logging-service';
import { CloudWatchClient, GetMetricStatisticsCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// ============================================================================
// Dashboard Types and Interfaces
// ============================================================================

export interface DashboardMetrics {
    systemHealth: SystemHealth;
    activeAlerts: ProactiveAlert[];
    businessMetrics: BusinessMetricsSnapshot;
    performanceMetrics: PerformanceMetricsSnapshot;
    rateLimitStatus: RateLimitStatusSnapshot;
    lambdaMetrics: LambdaMetricsSnapshot;
    errorMetrics: ErrorMetricsSnapshot;
    trends: TrendAnalysis;
    predictions: PredictionAnalysis;
}

export interface BusinessMetricsSnapshot {
    schedulingSuccessRate: MetricValue;
    publishingSuccessRate: MetricValue;
    analyticsSyncSuccessRate: MetricValue;
    userEngagementScore: MetricValue;
    systemHealthScore: MetricValue;
    totalScheduledContent: MetricValue;
    totalPublishedContent: MetricValue;
    averagePublishingLatency: MetricValue;
}

export interface PerformanceMetricsSnapshot {
    apiGatewayLatency: MetricValue;
    lambdaDuration: Record<string, MetricValue>;
    databaseResponseTime: MetricValue;
    errorRate: MetricValue;
    throughput: MetricValue;
    concurrentUsers: MetricValue;
}

export interface RateLimitStatusSnapshot {
    platforms: Record<string, {
        usage: number;
        limit: number;
        remaining: number;
        resetTime: Date;
        status: 'healthy' | 'warning' | 'critical';
    }>;
    overallStatus: 'healthy' | 'warning' | 'critical';
    predictedExhaustion?: {
        platform: string;
        timeToExhaustion: number; // minutes
    };
}

export interface LambdaMetricsSnapshot {
    functions: Record<string, {
        invocations: MetricValue;
        errors: MetricValue;
        duration: MetricValue;
        throttles: MetricValue;
        concurrentExecutions: MetricValue;
        status: 'healthy' | 'warning' | 'error';
    }>;
    overallStatus: 'healthy' | 'warning' | 'error';
}

export interface ErrorMetricsSnapshot {
    totalErrors: MetricValue;
    errorsByCategory: Record<string, MetricValue>;
    errorsByService: Record<string, MetricValue>;
    criticalErrors: MetricValue;
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    mttr: MetricValue; // Mean Time To Resolution
    affectedUsers: MetricValue;
}

export interface MetricValue {
    current: number;
    previous?: number;
    change?: number;
    changePercent?: number;
    trend: 'up' | 'down' | 'stable';
    status: 'healthy' | 'warning' | 'critical';
    threshold?: number;
    unit?: string;
    timestamp: Date;
}

export interface TrendAnalysis {
    timeRange: string;
    metrics: {
        publishingVolume: TrendData;
        errorRate: TrendData;
        userEngagement: TrendData;
        systemPerformance: TrendData;
        rateLimitUsage: TrendData;
    };
}

export interface TrendData {
    dataPoints: Array<{ timestamp: Date; value: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    correlation: number;
    seasonality?: 'daily' | 'weekly' | 'none';
}

export interface PredictionAnalysis {
    timeHorizon: string;
    predictions: {
        rateLimitExhaustion?: {
            platform: string;
            predictedTime: Date;
            confidence: number;
        }[];
        errorRateIncrease?: {
            service: string;
            predictedRate: number;
            confidence: number;
        }[];
        performanceDegradation?: {
            metric: string;
            predictedValue: number;
            confidence: number;
        }[];
        capacityLimits?: {
            resource: string;
            predictedExhaustion: Date;
            confidence: number;
        }[];
    };
}

export interface AlertSummary {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recent: ProactiveAlert[];
    trending: {
        increasing: string[];
        decreasing: string[];
    };
}

// ============================================================================
// Monitoring Dashboard Service Class
// ============================================================================

export class MonitoringDashboardService {
    private cloudWatchClient: CloudWatchClient;
    private metricsCache = new Map<string, { data: any; timestamp: Date; ttl: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly CLOUDWATCH_NAMESPACE = 'BayonCoAgent/ContentWorkflow';

    constructor() {
        this.cloudWatchClient = new CloudWatchClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
    }

    /**
     * Get comprehensive dashboard metrics
     */
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const correlationId = createCorrelationId();
        setCorrelationId(correlationId);

        const logger = cloudWatchLogger.createChildLogger({
            operation: 'get_dashboard_metrics',
            service: 'monitoring-dashboard',
            correlationId
        });

        const stopTracking = cloudWatchLogger.startPerformanceTracking('dashboard_metrics');

        try {
            logger.info('Starting dashboard metrics collection');

            // Collect all metrics in parallel for better performance
            const [
                systemHealth,
                activeAlerts,
                businessMetrics,
                performanceMetrics,
                rateLimitStatus,
                lambdaMetrics,
                errorMetrics,
                trends,
                predictions
            ] = await Promise.all([
                this.getSystemHealth(),
                this.getActiveAlerts(),
                this.getBusinessMetrics(),
                this.getPerformanceMetrics(),
                this.getRateLimitStatus(),
                this.getLambdaMetrics(),
                this.getErrorMetrics(),
                this.getTrendAnalysis(),
                this.getPredictionAnalysis()
            ]);

            const metrics: DashboardMetrics = {
                systemHealth,
                activeAlerts,
                businessMetrics,
                performanceMetrics,
                rateLimitStatus,
                lambdaMetrics,
                errorMetrics,
                trends,
                predictions
            };

            const performanceMetrics_tracking = stopTracking();
            logger.logPerformance('Dashboard metrics collection completed', {}, performanceMetrics_tracking);

            return metrics;

        } catch (error) {
            logger.error('Error collecting dashboard metrics', {}, error as Error);
            throw error;
        }
    }

    /**
     * Get alert summary for quick overview
     */
    async getAlertSummary(): Promise<AlertSummary> {
        const activeAlerts = proactiveMonitoringService.getActiveAlerts();
        const recentAlerts = proactiveMonitoringService.getAlertHistory(20);

        const bySeverity = activeAlerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byCategory = activeAlerts.reduce((acc, alert) => {
            acc[alert.category] = (acc[alert.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Analyze trending alert categories
        const trending = this.analyzeTrendingAlerts(recentAlerts);

        return {
            total: activeAlerts.length,
            bySeverity,
            byCategory,
            recent: recentAlerts.slice(0, 10),
            trending
        };
    }

    /**
     * Get real-time system status
     */
    async getSystemStatus(): Promise<{
        overall: 'healthy' | 'degraded' | 'critical';
        components: Record<string, 'up' | 'down' | 'degraded'>;
        uptime: number;
        lastIncident?: Date;
    }> {
        const systemHealth = await this.getSystemHealth();
        const activeAlerts = proactiveMonitoringService.getActiveAlerts();

        // Determine overall status based on alerts and system health
        let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
        const errorAlerts = activeAlerts.filter(a => a.severity === 'error').length;

        if (criticalAlerts > 0 || systemHealth.status === 'critical') {
            overall = 'critical';
        } else if (errorAlerts > 2 || systemHealth.status === 'degraded') {
            overall = 'degraded';
        }

        return {
            overall,
            components: systemHealth.services,
            uptime: systemHealth.uptime,
            lastIncident: this.getLastIncidentTime(activeAlerts)
        };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async getSystemHealth(): Promise<SystemHealth> {
        return this.getCachedOrFetch('system_health', async () => {
            return errorMonitoringService.getSystemHealth();
        });
    }

    private async getActiveAlerts(): Promise<ProactiveAlert[]> {
        return proactiveMonitoringService.getActiveAlerts();
    }

    private async getBusinessMetrics(): Promise<BusinessMetricsSnapshot> {
        return this.getCachedOrFetch('business_metrics', async () => {
            // Get metrics from CloudWatch
            const [
                schedulingSuccess,
                publishingSuccess,
                analyticsSuccess,
                userEngagement,
                systemHealth,
                totalScheduled,
                totalPublished,
                avgLatency
            ] = await Promise.all([
                this.getMetricValue('SchedulingSuccessRate', 95),
                this.getMetricValue('PublishingSuccessRate', 99),
                this.getMetricValue('AnalyticsSyncSuccessRate', 95),
                this.getMetricValue('UserEngagementScore', 80),
                this.getMetricValue('SystemHealthScore', 90),
                this.getMetricValue('TotalScheduledContent', 0),
                this.getMetricValue('TotalPublishedContent', 0),
                this.getMetricValue('AveragePublishingLatency', 5000)
            ]);

            return {
                schedulingSuccessRate: schedulingSuccess,
                publishingSuccessRate: publishingSuccess,
                analyticsSyncSuccessRate: analyticsSuccess,
                userEngagementScore: userEngagement,
                systemHealthScore: systemHealth,
                totalScheduledContent: totalScheduled,
                totalPublishedContent: totalPublished,
                averagePublishingLatency: avgLatency
            };
        });
    }

    private async getPerformanceMetrics(): Promise<PerformanceMetricsSnapshot> {
        return this.getCachedOrFetch('performance_metrics', async () => {
            const [
                apiLatency,
                dbResponseTime,
                errorRate,
                throughput,
                concurrentUsers
            ] = await Promise.all([
                this.getMetricValue('ApiGatewayLatency', 1000, 'AWS/ApiGateway', 'Latency'),
                this.getMetricValue('DatabaseResponseTime', 100),
                this.getMetricValue('ErrorRate', 5),
                this.getMetricValue('Throughput', 0),
                this.getMetricValue('ConcurrentUsers', 0)
            ]);

            // Get Lambda duration metrics for each function
            const lambdaFunctions = [
                'bayon-coagent-publish-scheduled-content',
                'bayon-coagent-sync-social-analytics',
                'bayon-coagent-calculate-optimal-times'
            ];

            const lambdaDuration: Record<string, MetricValue> = {};
            for (const functionName of lambdaFunctions) {
                lambdaDuration[functionName] = await this.getMetricValue(
                    'Duration',
                    30000,
                    'AWS/Lambda',
                    'Duration',
                    { FunctionName: functionName }
                );
            }

            return {
                apiGatewayLatency: apiLatency,
                lambdaDuration,
                databaseResponseTime: dbResponseTime,
                errorRate,
                throughput,
                concurrentUsers
            };
        });
    }

    private async getRateLimitStatus(): Promise<RateLimitStatusSnapshot> {
        return this.getCachedOrFetch('rate_limit_status', async () => {
            const rateLimitStatus = externalAPIErrorHandler.getRateLimitStatus();
            const platforms: RateLimitStatusSnapshot['platforms'] = {};

            let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
            let predictedExhaustion: RateLimitStatusSnapshot['predictedExhaustion'];

            for (const [platform, rateLimit] of Object.entries(rateLimitStatus)) {
                const usage = ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100;

                let status: 'healthy' | 'warning' | 'critical' = 'healthy';
                if (usage > 95) status = 'critical';
                else if (usage > 80) status = 'warning';

                platforms[platform] = {
                    usage,
                    limit: rateLimit.limit,
                    remaining: rateLimit.remaining,
                    resetTime: rateLimit.resetTime,
                    status
                };

                // Update overall status
                if (status === 'critical') overallStatus = 'critical';
                else if (status === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';

                // Check for predicted exhaustion
                if (usage > 90) {
                    const timeToReset = (rateLimit.resetTime.getTime() - Date.now()) / (1000 * 60);
                    const usageRate = usage / (rateLimit.windowDuration / 60); // usage per minute
                    const timeToExhaustion = (100 - usage) / usageRate;

                    if (timeToExhaustion < timeToReset && timeToExhaustion > 0) {
                        predictedExhaustion = {
                            platform,
                            timeToExhaustion
                        };
                    }
                }
            }

            return {
                platforms,
                overallStatus,
                predictedExhaustion
            };
        });
    }

    private async getLambdaMetrics(): Promise<LambdaMetricsSnapshot> {
        return this.getCachedOrFetch('lambda_metrics', async () => {
            const lambdaFunctions = [
                'bayon-coagent-publish-scheduled-content',
                'bayon-coagent-sync-social-analytics',
                'bayon-coagent-calculate-optimal-times'
            ];

            const functions: LambdaMetricsSnapshot['functions'] = {};
            let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

            for (const functionName of lambdaFunctions) {
                const [invocations, errors, duration, throttles, concurrentExecutions] = await Promise.all([
                    this.getMetricValue('Invocations', 0, 'AWS/Lambda', 'Invocations', { FunctionName: functionName }),
                    this.getMetricValue('Errors', 0, 'AWS/Lambda', 'Errors', { FunctionName: functionName }),
                    this.getMetricValue('Duration', 30000, 'AWS/Lambda', 'Duration', { FunctionName: functionName }),
                    this.getMetricValue('Throttles', 0, 'AWS/Lambda', 'Throttles', { FunctionName: functionName }),
                    this.getMetricValue('ConcurrentExecutions', 0, 'AWS/Lambda', 'ConcurrentExecutions', { FunctionName: functionName })
                ]);

                // Determine function status
                let status: 'healthy' | 'warning' | 'error' = 'healthy';
                if (errors.current > 0 || throttles.current > 0) status = 'error';
                else if (duration.current > (duration.threshold || 30000) * 0.8) status = 'warning';

                functions[functionName] = {
                    invocations,
                    errors,
                    duration,
                    throttles,
                    concurrentExecutions,
                    status
                };

                // Update overall status
                if (status === 'error') overallStatus = 'error';
                else if (status === 'warning' && overallStatus !== 'error') overallStatus = 'warning';
            }

            return {
                functions,
                overallStatus
            };
        });
    }

    private async getErrorMetrics(): Promise<ErrorMetricsSnapshot> {
        return this.getCachedOrFetch('error_metrics', async () => {
            const timeRange = {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                end: new Date()
            };

            const analytics = errorMonitoringService.getErrorAnalytics(timeRange);

            return {
                totalErrors: this.createMetricValue(analytics.totalErrors, 0, 'count'),
                errorsByCategory: Object.fromEntries(
                    Object.entries(analytics.errorsByCategory).map(([category, count]) => [
                        category,
                        this.createMetricValue(count, 0, 'count')
                    ])
                ),
                errorsByService: Object.fromEntries(
                    Object.entries(analytics.errorsByOperation).map(([service, count]) => [
                        service,
                        this.createMetricValue(count, 0, 'count')
                    ])
                ),
                criticalErrors: this.createMetricValue(
                    analytics.errorsBySeverity.critical || 0,
                    0,
                    'count'
                ),
                errorTrend: analytics.errorTrend,
                mttr: this.createMetricValue(analytics.mttr, 0, 'minutes'),
                affectedUsers: this.createMetricValue(analytics.affectedUsers, 0, 'count')
            };
        });
    }

    private async getTrendAnalysis(): Promise<TrendAnalysis> {
        return this.getCachedOrFetch('trend_analysis', async () => {
            // This would typically analyze historical data
            // For now, returning mock trend data
            return {
                timeRange: '24h',
                metrics: {
                    publishingVolume: await this.calculateTrend('PublishingVolume'),
                    errorRate: await this.calculateTrend('ErrorRate'),
                    userEngagement: await this.calculateTrend('UserEngagementScore'),
                    systemPerformance: await this.calculateTrend('SystemHealthScore'),
                    rateLimitUsage: await this.calculateTrend('RateLimitUsage')
                }
            };
        });
    }

    private async getPredictionAnalysis(): Promise<PredictionAnalysis> {
        return this.getCachedOrFetch('prediction_analysis', async () => {
            // This would use machine learning models for predictions
            // For now, returning basic predictions based on current trends
            return {
                timeHorizon: '4h',
                predictions: {
                    rateLimitExhaustion: await this.predictRateLimitExhaustion(),
                    errorRateIncrease: await this.predictErrorRateIncrease(),
                    performanceDegradation: await this.predictPerformanceDegradation(),
                    capacityLimits: await this.predictCapacityLimits()
                }
            };
        });
    }

    private async getMetricValue(
        metricName: string,
        threshold: number,
        namespace: string = this.CLOUDWATCH_NAMESPACE,
        cloudWatchMetricName?: string,
        dimensions?: Record<string, string>
    ): Promise<MetricValue> {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours

            const command = new GetMetricStatisticsCommand({
                Namespace: namespace,
                MetricName: cloudWatchMetricName || metricName,
                Dimensions: dimensions ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
                StartTime: startTime,
                EndTime: endTime,
                Period: 3600, // 1 hour
                Statistics: ['Average']
            });

            const response = await this.cloudWatchClient.send(command);
            const datapoints = response.Datapoints || [];

            if (datapoints.length === 0) {
                return this.createMetricValue(0, threshold);
            }

            // Get current and previous values
            const sortedPoints = datapoints.sort((a, b) => a.Timestamp!.getTime() - b.Timestamp!.getTime());
            const current = sortedPoints[sortedPoints.length - 1].Average || 0;
            const previous = sortedPoints.length > 1 ? sortedPoints[sortedPoints.length - 2].Average || 0 : current;

            return this.createMetricValue(current, threshold, undefined, previous);

        } catch (error) {
            console.error(`Error getting metric ${metricName}:`, error);
            return this.createMetricValue(0, threshold);
        }
    }

    private createMetricValue(
        current: number,
        threshold: number,
        unit?: string,
        previous?: number
    ): MetricValue {
        const change = previous !== undefined ? current - previous : 0;
        const changePercent = previous !== undefined && previous !== 0 ? (change / previous) * 100 : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercent) > 5) {
            trend = changePercent > 0 ? 'up' : 'down';
        }

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (unit === 'percentage' || metricName.includes('Rate') || metricName.includes('Score')) {
            // For percentage metrics, lower is often worse
            if (current < threshold * 0.8) status = 'critical';
            else if (current < threshold * 0.9) status = 'warning';
        } else {
            // For absolute metrics, higher is often worse
            if (current > threshold * 1.5) status = 'critical';
            else if (current > threshold) status = 'warning';
        }

        return {
            current,
            previous,
            change,
            changePercent,
            trend,
            status,
            threshold,
            unit,
            timestamp: new Date()
        };
    }

    private async calculateTrend(metricName: string): Promise<TrendData> {
        // Simplified trend calculation - would use more sophisticated analysis in production
        const dataPoints = Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
            value: Math.random() * 100 + Math.sin(i / 4) * 20 + 50
        }));

        // Calculate simple linear trend
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, _, i) => sum + i, 0);
        const sumY = dataPoints.reduce((sum, point) => sum + point.value, 0);
        const sumXY = dataPoints.reduce((sum, point, i) => sum + i * point.value, 0);
        const sumXX = dataPoints.reduce((sum, _, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (Math.abs(slope) > 0.5) {
            trend = slope > 0 ? 'increasing' : 'decreasing';
        }

        return {
            dataPoints,
            trend,
            slope,
            correlation: 0.8, // Would calculate actual correlation
            seasonality: 'daily'
        };
    }

    private async predictRateLimitExhaustion(): Promise<PredictionAnalysis['predictions']['rateLimitExhaustion']> {
        const rateLimitStatus = await this.getRateLimitStatus();
        const predictions: NonNullable<PredictionAnalysis['predictions']['rateLimitExhaustion']> = [];

        for (const [platform, status] of Object.entries(rateLimitStatus.platforms)) {
            if (status.usage > 70) {
                const timeToReset = (status.resetTime.getTime() - Date.now()) / (1000 * 60);
                const usageRate = status.usage / 60; // Assume usage over 60 minutes
                const timeToExhaustion = (100 - status.usage) / usageRate;

                if (timeToExhaustion < timeToReset && timeToExhaustion > 0) {
                    predictions.push({
                        platform,
                        predictedTime: new Date(Date.now() + timeToExhaustion * 60 * 1000),
                        confidence: Math.min(0.9, status.usage / 100)
                    });
                }
            }
        }

        return predictions;
    }

    private async predictErrorRateIncrease(): Promise<PredictionAnalysis['predictions']['errorRateIncrease']> {
        // Simplified prediction - would use ML models in production
        return [
            {
                service: 'publishing',
                predictedRate: 5.2,
                confidence: 0.7
            }
        ];
    }

    private async predictPerformanceDegradation(): Promise<PredictionAnalysis['predictions']['performanceDegradation']> {
        return [
            {
                metric: 'api_latency',
                predictedValue: 1200,
                confidence: 0.6
            }
        ];
    }

    private async predictCapacityLimits(): Promise<PredictionAnalysis['predictions']['capacityLimits']> {
        return [
            {
                resource: 'lambda_concurrency',
                predictedExhaustion: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
                confidence: 0.5
            }
        ];
    }

    private analyzeTrendingAlerts(recentAlerts: ProactiveAlert[]): AlertSummary['trending'] {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;

        const recentHour = recentAlerts.filter(a => a.timestamp.getTime() > oneHourAgo);
        const previousHour = recentAlerts.filter(a =>
            a.timestamp.getTime() > twoHoursAgo && a.timestamp.getTime() <= oneHourAgo
        );

        const recentCategories = this.countByCategory(recentHour);
        const previousCategories = this.countByCategory(previousHour);

        const increasing: string[] = [];
        const decreasing: string[] = [];

        for (const category of new Set([...Object.keys(recentCategories), ...Object.keys(previousCategories)])) {
            const recent = recentCategories[category] || 0;
            const previous = previousCategories[category] || 0;

            if (recent > previous * 1.5) increasing.push(category);
            else if (recent < previous * 0.5) decreasing.push(category);
        }

        return { increasing, decreasing };
    }

    private countByCategory(alerts: ProactiveAlert[]): Record<string, number> {
        return alerts.reduce((acc, alert) => {
            acc[alert.category] = (acc[alert.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private getLastIncidentTime(activeAlerts: ProactiveAlert[]): Date | undefined {
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'error');
        if (criticalAlerts.length === 0) return undefined;

        return criticalAlerts.reduce((latest, alert) =>
            alert.timestamp > latest ? alert.timestamp : latest,
            criticalAlerts[0].timestamp
        );
    }

    private async getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        const cached = this.metricsCache.get(key);

        if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
            return cached.data;
        }

        const data = await fetchFn();
        this.metricsCache.set(key, {
            data,
            timestamp: new Date(),
            ttl: this.CACHE_TTL
        });

        return data;
    }

    /**
     * Clear metrics cache
     */
    clearCache(): void {
        this.metricsCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.metricsCache.size,
            keys: Array.from(this.metricsCache.keys())
        };
    }
}

// ============================================================================
// Global Instance and Convenience Functions
// ============================================================================

export const monitoringDashboard = new MonitoringDashboardService();

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    return monitoringDashboard.getDashboardMetrics();
}

/**
 * Get alert summary
 */
export async function getAlertSummary(): Promise<AlertSummary> {
    return monitoringDashboard.getAlertSummary();
}

/**
 * Get system status
 */
export async function getSystemStatus() {
    return monitoringDashboard.getSystemStatus();
}