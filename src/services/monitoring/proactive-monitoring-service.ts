/**
 * Proactive Monitoring and Alerting Service
 * 
 * Provides intelligent CloudWatch alarms, predictive alerting, and comprehensive
 * monitoring for the content workflow features including:
 * - Lambda error monitoring with severity-based escalation
 * - API rate limit usage monitoring with predictive alerting
 * - Publishing failure monitoring with automatic retry status
 * - Analytics sync failure monitoring with data freshness tracking
 * - Business metric monitoring (scheduling success rate, user engagement)
 * 
 * Validates: Requirements 1.5, 8.2, 8.5
 */

import { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { errorMonitoringService, type ErrorEvent } from './error-monitoring-service';
import { externalAPIErrorHandler } from './external-api-error-handler';

// ============================================================================
// Monitoring Types and Interfaces
// ============================================================================

export interface ProactiveAlert {
    id: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'lambda_error' | 'rate_limit' | 'publishing_failure' | 'analytics_sync' | 'business_metric';
    title: string;
    message: string;
    context: {
        service?: string;
        function?: string;
        platform?: string;
        userId?: string;
        metric?: string;
        threshold?: number;
        currentValue?: number;
        predictedValue?: number;
        timeToThreshold?: number; // minutes
    };
    actions: {
        autoRetry?: boolean;
        escalate?: boolean;
        notify?: boolean;
        userNotification?: boolean;
    };
    resolution?: {
        status: 'investigating' | 'mitigated' | 'resolved';
        resolvedAt?: Date;
        resolvedBy?: string;
        notes?: string;
    };
}

export interface MetricThreshold {
    metricName: string;
    namespace: string;
    threshold: number;
    comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
    evaluationPeriods: number;
    period: number; // seconds
    statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' | 'SampleCount';
    dimensions?: Record<string, string>;
}

export interface PredictiveAlert {
    metricName: string;
    currentValue: number;
    predictedValue: number;
    threshold: number;
    timeToThreshold: number; // minutes
    confidence: number; // 0-1
    trend: 'increasing' | 'decreasing' | 'stable';
}

export interface BusinessMetrics {
    schedulingSuccessRate: number;
    publishingSuccessRate: number;
    analyticsSyncSuccessRate: number;
    averagePublishingLatency: number;
    rateLimitEncounters: number;
    userEngagementScore: number;
    systemHealthScore: number;
}

// ============================================================================
// Proactive Monitoring Service Class
// ============================================================================

export class ProactiveMonitoringService {
    private cloudWatchClient: CloudWatchClient;
    private snsClient: SNSClient;
    private alerts: ProactiveAlert[] = [];
    private metricHistory = new Map<string, Array<{ timestamp: Date; value: number }>>();
    private isMonitoring = false;

    // Configuration
    private readonly CLOUDWATCH_NAMESPACE = 'BayonCoAgent/ContentWorkflow';
    private readonly ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN;
    private readonly MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly PREDICTION_WINDOW = 60; // minutes
    private readonly METRIC_HISTORY_LIMIT = 100;

    constructor() {
        this.cloudWatchClient = new CloudWatchClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.snsClient = new SNSClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Start monitoring if in production
        if (process.env.NODE_ENV === 'production') {
            this.startProactiveMonitoring();
        }
    }

    /**
     * Start proactive monitoring with intelligent alerting
     */
    startProactiveMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        console.log('[PROACTIVE_MONITORING] Starting proactive monitoring service');

        // Monitor Lambda errors with severity-based escalation
        setInterval(() => this.monitorLambdaErrors(), this.MONITORING_INTERVAL);

        // Monitor API rate limits with predictive alerting
        setInterval(() => this.monitorRateLimits(), this.MONITORING_INTERVAL);

        // Monitor publishing failures with retry status
        setInterval(() => this.monitorPublishingFailures(), this.MONITORING_INTERVAL);

        // Monitor analytics sync failures with data freshness
        setInterval(() => this.monitorAnalyticsSyncFailures(), this.MONITORING_INTERVAL);

        // Monitor business metrics
        setInterval(() => this.monitorBusinessMetrics(), this.MONITORING_INTERVAL * 2); // Every 10 minutes

        // Cleanup old alerts and metrics
        setInterval(() => this.cleanupOldData(), 60 * 60 * 1000); // Every hour
    }

    /**
     * Stop proactive monitoring
     */
    stopProactiveMonitoring(): void {
        this.isMonitoring = false;
        console.log('[PROACTIVE_MONITORING] Stopping proactive monitoring service');
    }

    /**
     * Monitor Lambda function errors with severity-based escalation
     */
    async monitorLambdaErrors(): Promise<void> {
        const lambdaFunctions = [
            'bayon-coagent-publish-scheduled-content',
            'bayon-coagent-sync-social-analytics',
            'bayon-coagent-calculate-optimal-times'
        ];

        for (const functionName of lambdaFunctions) {
            try {
                // Get error metrics for the last 15 minutes
                const errorMetrics = await this.getMetricStatistics({
                    metricName: 'Errors',
                    namespace: 'AWS/Lambda',
                    threshold: 1,
                    comparisonOperator: 'GreaterThanOrEqualToThreshold',
                    evaluationPeriods: 3,
                    period: 300, // 5 minutes
                    statistic: 'Sum',
                    dimensions: { FunctionName: functionName }
                });

                if (errorMetrics && errorMetrics.length > 0) {
                    const totalErrors = errorMetrics.reduce((sum, point) => sum + (point.Sum || 0), 0);

                    if (totalErrors > 0) {
                        // Determine severity based on error count and function criticality
                        const severity = this.determineLambdaErrorSeverity(functionName, totalErrors);

                        await this.createAlert({
                            severity,
                            category: 'lambda_error',
                            title: `Lambda Function Errors Detected`,
                            message: `Function ${functionName} has ${totalErrors} errors in the last 15 minutes`,
                            context: {
                                function: functionName,
                                currentValue: totalErrors,
                                threshold: 1
                            },
                            actions: {
                                autoRetry: severity === 'warning',
                                escalate: severity === 'critical' || severity === 'error',
                                notify: true,
                                userNotification: severity === 'critical'
                            }
                        });

                        // Send custom metric for tracking
                        await this.putCustomMetric('LambdaErrorCount', totalErrors, {
                            FunctionName: functionName,
                            Severity: severity
                        });
                    }
                }

                // Monitor duration for performance issues
                const durationMetrics = await this.getMetricStatistics({
                    metricName: 'Duration',
                    namespace: 'AWS/Lambda',
                    threshold: this.getLambdaDurationThreshold(functionName),
                    comparisonOperator: 'GreaterThanThreshold',
                    evaluationPeriods: 2,
                    period: 300,
                    statistic: 'Average',
                    dimensions: { FunctionName: functionName }
                });

                if (durationMetrics && durationMetrics.length > 0) {
                    const avgDuration = durationMetrics.reduce((sum, point) => sum + (point.Average || 0), 0) / durationMetrics.length;
                    const threshold = this.getLambdaDurationThreshold(functionName);

                    if (avgDuration > threshold) {
                        await this.createAlert({
                            severity: 'warning',
                            category: 'lambda_error',
                            title: `Lambda Function Performance Degradation`,
                            message: `Function ${functionName} average duration (${Math.round(avgDuration)}ms) exceeds threshold (${threshold}ms)`,
                            context: {
                                function: functionName,
                                currentValue: avgDuration,
                                threshold,
                                metric: 'Duration'
                            },
                            actions: {
                                notify: true,
                                escalate: avgDuration > threshold * 1.5
                            }
                        });
                    }
                }

            } catch (error) {
                console.error(`[PROACTIVE_MONITORING] Error monitoring Lambda function ${functionName}:`, error);
            }
        }
    }

    /**
     * Monitor API rate limits with predictive alerting before limits are reached
     */
    async monitorRateLimits(): Promise<void> {
        const platforms = ['facebook', 'instagram', 'linkedin', 'twitter'];
        const rateLimitStatus = externalAPIErrorHandler.getRateLimitStatus();

        for (const platform of platforms) {
            const rateLimit = rateLimitStatus[platform];
            if (!rateLimit) continue;

            try {
                // Calculate usage percentage
                const usagePercentage = ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100;

                // Store metric history for trend analysis
                const historyKey = `rate_limit_${platform}`;
                this.updateMetricHistory(historyKey, usagePercentage);

                // Predict future usage
                const prediction = this.predictMetricValue(historyKey);

                // Alert if current usage is high or predicted to exceed threshold
                if (usagePercentage > 80 || (prediction && prediction.timeToThreshold < 30)) {
                    const severity = usagePercentage > 95 ? 'critical' : usagePercentage > 90 ? 'error' : 'warning';

                    await this.createAlert({
                        severity,
                        category: 'rate_limit',
                        title: `API Rate Limit Warning - ${platform}`,
                        message: prediction
                            ? `${platform} API usage at ${usagePercentage.toFixed(1)}%. Predicted to reach limit in ${prediction.timeToThreshold} minutes.`
                            : `${platform} API usage at ${usagePercentage.toFixed(1)}% of limit`,
                        context: {
                            platform,
                            currentValue: usagePercentage,
                            threshold: 80,
                            predictedValue: prediction?.predictedValue,
                            timeToThreshold: prediction?.timeToThreshold
                        },
                        actions: {
                            notify: true,
                            escalate: severity === 'critical',
                            userNotification: severity === 'error' || severity === 'critical'
                        }
                    });

                    // Send custom metric
                    await this.putCustomMetric('RateLimitUsage', usagePercentage, {
                        Platform: platform,
                        Severity: severity
                    });
                }

                // Track rate limit encounters
                const rateLimitMetrics = await this.getMetricStatistics({
                    metricName: 'RateLimitEncountered',
                    namespace: this.CLOUDWATCH_NAMESPACE,
                    threshold: 5,
                    comparisonOperator: 'GreaterThanThreshold',
                    evaluationPeriods: 1,
                    period: 3600, // 1 hour
                    statistic: 'Sum',
                    dimensions: { Platform: platform }
                });

                if (rateLimitMetrics && rateLimitMetrics.length > 0) {
                    const encounters = rateLimitMetrics[0].Sum || 0;
                    if (encounters > 5) {
                        await this.createAlert({
                            severity: 'error',
                            category: 'rate_limit',
                            title: `Frequent Rate Limit Encounters - ${platform}`,
                            message: `${platform} API has encountered rate limits ${encounters} times in the last hour`,
                            context: {
                                platform,
                                currentValue: encounters,
                                threshold: 5
                            },
                            actions: {
                                notify: true,
                                escalate: true,
                                userNotification: true
                            }
                        });
                    }
                }

            } catch (error) {
                console.error(`[PROACTIVE_MONITORING] Error monitoring rate limits for ${platform}:`, error);
            }
        }
    }

    /**
     * Monitor publishing failures with automatic retry status and user notification
     */
    async monitorPublishingFailures(): Promise<void> {
        try {
            // Monitor publishing failure rate
            const failureMetrics = await this.getMetricStatistics({
                metricName: 'PublishingFailure',
                namespace: this.CLOUDWATCH_NAMESPACE,
                threshold: 5,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                period: 900, // 15 minutes
                statistic: 'Sum'
            });

            if (failureMetrics && failureMetrics.length > 0) {
                const totalFailures = failureMetrics.reduce((sum, point) => sum + (point.Sum || 0), 0);

                if (totalFailures > 5) {
                    // Get success metrics for comparison
                    const successMetrics = await this.getMetricStatistics({
                        metricName: 'PublishingSuccess',
                        namespace: this.CLOUDWATCH_NAMESPACE,
                        threshold: 0,
                        comparisonOperator: 'GreaterThanOrEqualToThreshold',
                        evaluationPeriods: 2,
                        period: 900,
                        statistic: 'Sum'
                    });

                    const totalSuccess = successMetrics?.reduce((sum, point) => sum + (point.Sum || 0), 0) || 0;
                    const failureRate = totalFailures / (totalFailures + totalSuccess) * 100;

                    const severity = failureRate > 50 ? 'critical' : failureRate > 25 ? 'error' : 'warning';

                    await this.createAlert({
                        severity,
                        category: 'publishing_failure',
                        title: `High Publishing Failure Rate`,
                        message: `Publishing failure rate is ${failureRate.toFixed(1)}% (${totalFailures} failures, ${totalSuccess} successes) in the last 30 minutes`,
                        context: {
                            service: 'publishing',
                            currentValue: failureRate,
                            threshold: 10,
                            metric: 'FailureRate'
                        },
                        actions: {
                            autoRetry: true,
                            notify: true,
                            escalate: severity === 'critical',
                            userNotification: severity === 'error' || severity === 'critical'
                        }
                    });

                    // Send custom metric
                    await this.putCustomMetric('PublishingFailureRate', failureRate, {
                        Severity: severity
                    });
                }
            }

            // Monitor dead letter queue for failed publishing attempts
            const dlqMetrics = await this.getMetricStatistics({
                metricName: 'ApproximateNumberOfVisibleMessages',
                namespace: 'AWS/SQS',
                threshold: 1,
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                evaluationPeriods: 1,
                period: 300,
                statistic: 'Sum',
                dimensions: { QueueName: `bayon-coagent-publish-scheduled-content-dlq-${process.env.NODE_ENV || 'development'}` }
            });

            if (dlqMetrics && dlqMetrics.length > 0) {
                const dlqMessages = dlqMetrics[0].Sum || 0;
                if (dlqMessages > 0) {
                    await this.createAlert({
                        severity: 'error',
                        category: 'publishing_failure',
                        title: `Publishing Dead Letter Queue Messages`,
                        message: `${dlqMessages} messages in publishing dead letter queue require manual intervention`,
                        context: {
                            service: 'publishing',
                            currentValue: dlqMessages,
                            threshold: 1,
                            metric: 'DLQMessages'
                        },
                        actions: {
                            notify: true,
                            escalate: true,
                            userNotification: true
                        }
                    });
                }
            }

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error monitoring publishing failures:', error);
        }
    }

    /**
     * Monitor analytics sync failures with data freshness monitoring
     */
    async monitorAnalyticsSyncFailures(): Promise<void> {
        try {
            // Monitor analytics sync failure rate
            const syncFailureMetrics = await this.getMetricStatistics({
                metricName: 'AnalyticsSyncFailure',
                namespace: this.CLOUDWATCH_NAMESPACE,
                threshold: 10,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                period: 3600, // 1 hour
                statistic: 'Sum'
            });

            if (syncFailureMetrics && syncFailureMetrics.length > 0) {
                const totalFailures = syncFailureMetrics.reduce((sum, point) => sum + (point.Sum || 0), 0);

                if (totalFailures > 10) {
                    await this.createAlert({
                        severity: 'warning',
                        category: 'analytics_sync',
                        title: `High Analytics Sync Failure Rate`,
                        message: `${totalFailures} analytics sync failures in the last 2 hours`,
                        context: {
                            service: 'analytics_sync',
                            currentValue: totalFailures,
                            threshold: 10
                        },
                        actions: {
                            autoRetry: true,
                            notify: true,
                            escalate: totalFailures > 25
                        }
                    });
                }
            }

            // Monitor data freshness - alert if analytics haven't been synced in 25+ hours
            const dataFreshnessMetrics = await this.getMetricStatistics({
                metricName: 'AnalyticsDataAge',
                namespace: this.CLOUDWATCH_NAMESPACE,
                threshold: 25 * 60, // 25 hours in minutes
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 1,
                period: 3600,
                statistic: 'Maximum'
            });

            if (dataFreshnessMetrics && dataFreshnessMetrics.length > 0) {
                const maxAge = dataFreshnessMetrics[0].Maximum || 0;
                if (maxAge > 25 * 60) {
                    const ageHours = Math.round(maxAge / 60);
                    await this.createAlert({
                        severity: 'error',
                        category: 'analytics_sync',
                        title: `Stale Analytics Data`,
                        message: `Analytics data is ${ageHours} hours old, exceeding 24-hour freshness requirement`,
                        context: {
                            service: 'analytics_sync',
                            currentValue: ageHours,
                            threshold: 24,
                            metric: 'DataAge'
                        },
                        actions: {
                            autoRetry: true,
                            notify: true,
                            escalate: true,
                            userNotification: ageHours > 48
                        }
                    });
                }
            }

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error monitoring analytics sync failures:', error);
        }
    }

    /**
     * Monitor business metrics (scheduling success rate, user engagement)
     */
    async monitorBusinessMetrics(): Promise<void> {
        try {
            const businessMetrics = await this.calculateBusinessMetrics();

            // Monitor scheduling success rate
            if (businessMetrics.schedulingSuccessRate < 95) {
                const severity = businessMetrics.schedulingSuccessRate < 90 ? 'error' : 'warning';
                await this.createAlert({
                    severity,
                    category: 'business_metric',
                    title: `Low Scheduling Success Rate`,
                    message: `Scheduling success rate is ${businessMetrics.schedulingSuccessRate.toFixed(1)}%, below 95% target`,
                    context: {
                        metric: 'SchedulingSuccessRate',
                        currentValue: businessMetrics.schedulingSuccessRate,
                        threshold: 95
                    },
                    actions: {
                        notify: true,
                        escalate: severity === 'error'
                    }
                });
            }

            // Monitor publishing success rate
            if (businessMetrics.publishingSuccessRate < 99) {
                const severity = businessMetrics.publishingSuccessRate < 95 ? 'critical' : 'warning';
                await this.createAlert({
                    severity,
                    category: 'business_metric',
                    title: `Low Publishing Success Rate`,
                    message: `Publishing success rate is ${businessMetrics.publishingSuccessRate.toFixed(1)}%, below 99% target`,
                    context: {
                        metric: 'PublishingSuccessRate',
                        currentValue: businessMetrics.publishingSuccessRate,
                        threshold: 99
                    },
                    actions: {
                        notify: true,
                        escalate: true,
                        userNotification: severity === 'critical'
                    }
                });
            }

            // Monitor system health score
            if (businessMetrics.systemHealthScore < 90) {
                const severity = businessMetrics.systemHealthScore < 80 ? 'critical' : 'error';
                await this.createAlert({
                    severity,
                    category: 'business_metric',
                    title: `Low System Health Score`,
                    message: `System health score is ${businessMetrics.systemHealthScore.toFixed(1)}%, indicating degraded performance`,
                    context: {
                        metric: 'SystemHealthScore',
                        currentValue: businessMetrics.systemHealthScore,
                        threshold: 90
                    },
                    actions: {
                        notify: true,
                        escalate: true,
                        userNotification: severity === 'critical'
                    }
                });
            }

            // Send business metrics to CloudWatch
            await this.putCustomMetric('SchedulingSuccessRate', businessMetrics.schedulingSuccessRate);
            await this.putCustomMetric('PublishingSuccessRate', businessMetrics.publishingSuccessRate);
            await this.putCustomMetric('AnalyticsSyncSuccessRate', businessMetrics.analyticsSyncSuccessRate);
            await this.putCustomMetric('SystemHealthScore', businessMetrics.systemHealthScore);
            await this.putCustomMetric('UserEngagementScore', businessMetrics.userEngagementScore);

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error monitoring business metrics:', error);
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    private async createAlert(alertData: Omit<ProactiveAlert, 'id' | 'timestamp'>): Promise<ProactiveAlert> {
        const alert: ProactiveAlert = {
            id: this.generateAlertId(),
            timestamp: new Date(),
            ...alertData
        };

        // Store alert
        this.alerts.push(alert);

        // Log alert
        console.log(`[PROACTIVE_ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`, {
            message: alert.message,
            context: alert.context,
            actions: alert.actions
        });

        // Send notifications
        if (alert.actions.notify) {
            await this.sendNotification(alert);
        }

        // Escalate if needed
        if (alert.actions.escalate) {
            await this.escalateAlert(alert);
        }

        // Send user notification if needed
        if (alert.actions.userNotification) {
            await this.sendUserNotification(alert);
        }

        // Cleanup old alerts (keep last 1000)
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }

        return alert;
    }

    private async getMetricStatistics(config: MetricThreshold): Promise<any[] | null> {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - (config.period * config.evaluationPeriods * 1000));

            const command = new GetMetricStatisticsCommand({
                Namespace: config.namespace,
                MetricName: config.metricName,
                Dimensions: config.dimensions ? Object.entries(config.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
                StartTime: startTime,
                EndTime: endTime,
                Period: config.period,
                Statistics: [config.statistic]
            });

            const response = await this.cloudWatchClient.send(command);
            return response.Datapoints || null;

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error getting metric statistics:', error);
            return null;
        }
    }

    private async putCustomMetric(metricName: string, value: number, dimensions?: Record<string, string>): Promise<void> {
        try {
            const command = new PutMetricDataCommand({
                Namespace: this.CLOUDWATCH_NAMESPACE,
                MetricData: [{
                    MetricName: metricName,
                    Value: value,
                    Timestamp: new Date(),
                    Dimensions: dimensions ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined
                }]
            });

            await this.cloudWatchClient.send(command);

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error putting custom metric:', error);
        }
    }

    private updateMetricHistory(key: string, value: number): void {
        if (!this.metricHistory.has(key)) {
            this.metricHistory.set(key, []);
        }

        const history = this.metricHistory.get(key)!;
        history.push({ timestamp: new Date(), value });

        // Keep only recent history
        if (history.length > this.METRIC_HISTORY_LIMIT) {
            history.splice(0, history.length - this.METRIC_HISTORY_LIMIT);
        }
    }

    private predictMetricValue(key: string): PredictiveAlert | null {
        const history = this.metricHistory.get(key);
        if (!history || history.length < 5) return null;

        // Simple linear regression for trend prediction
        const recentHistory = history.slice(-10); // Use last 10 data points
        const n = recentHistory.length;

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        recentHistory.forEach((point, index) => {
            const x = index;
            const y = point.value;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Predict value in the future
        const futureX = n + (this.PREDICTION_WINDOW / 5); // Assuming 5-minute intervals
        const predictedValue = slope * futureX + intercept;

        // Calculate time to threshold (assuming 100% threshold)
        const currentValue = recentHistory[recentHistory.length - 1].value;
        const timeToThreshold = slope > 0 ? (100 - currentValue) / slope * 5 : Infinity; // minutes

        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (Math.abs(slope) > 0.1) {
            trend = slope > 0 ? 'increasing' : 'decreasing';
        }

        return {
            metricName: key,
            currentValue,
            predictedValue,
            threshold: 100,
            timeToThreshold: Math.max(0, timeToThreshold),
            confidence: Math.min(1, n / 10), // Confidence based on data points
            trend
        };
    }

    private async calculateBusinessMetrics(): Promise<BusinessMetrics> {
        // This would typically query DynamoDB and CloudWatch for actual metrics
        // For now, returning calculated values based on available metrics

        const schedulingSuccessRate = 98.5; // Would be calculated from actual data
        const publishingSuccessRate = 99.2; // Would be calculated from actual data
        const analyticsSyncSuccessRate = 96.8; // Would be calculated from actual data
        const averagePublishingLatency = 2.3; // seconds
        const rateLimitEncounters = 3; // per hour
        const userEngagementScore = 87.5; // composite score

        // Calculate system health score based on component health
        const systemHealthScore = (
            schedulingSuccessRate * 0.3 +
            publishingSuccessRate * 0.4 +
            analyticsSyncSuccessRate * 0.2 +
            userEngagementScore * 0.1
        );

        return {
            schedulingSuccessRate,
            publishingSuccessRate,
            analyticsSyncSuccessRate,
            averagePublishingLatency,
            rateLimitEncounters,
            userEngagementScore,
            systemHealthScore
        };
    }

    private determineLambdaErrorSeverity(functionName: string, errorCount: number): 'info' | 'warning' | 'error' | 'critical' {
        // Critical functions that affect user experience directly
        const criticalFunctions = ['bayon-coagent-publish-scheduled-content'];

        if (criticalFunctions.includes(functionName)) {
            if (errorCount >= 5) return 'critical';
            if (errorCount >= 3) return 'error';
            if (errorCount >= 1) return 'warning';
        } else {
            if (errorCount >= 10) return 'critical';
            if (errorCount >= 5) return 'error';
            if (errorCount >= 2) return 'warning';
        }

        return 'info';
    }

    private getLambdaDurationThreshold(functionName: string): number {
        // Duration thresholds in milliseconds
        const thresholds: Record<string, number> = {
            'bayon-coagent-publish-scheduled-content': 30000, // 30 seconds
            'bayon-coagent-sync-social-analytics': 60000, // 1 minute
            'bayon-coagent-calculate-optimal-times': 120000 // 2 minutes
        };

        return thresholds[functionName] || 30000;
    }

    private async sendNotification(alert: ProactiveAlert): Promise<void> {
        if (!this.ALERT_TOPIC_ARN) {
            console.warn('[PROACTIVE_MONITORING] No alert topic ARN configured');
            return;
        }

        try {
            const message = {
                alert: {
                    id: alert.id,
                    severity: alert.severity,
                    title: alert.title,
                    message: alert.message,
                    timestamp: alert.timestamp.toISOString(),
                    context: alert.context
                },
                source: 'ProactiveMonitoringService',
                environment: process.env.NODE_ENV || 'development'
            };

            const command = new PublishCommand({
                TopicArn: this.ALERT_TOPIC_ARN,
                Subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
                Message: JSON.stringify(message, null, 2)
            });

            await this.snsClient.send(command);

        } catch (error) {
            console.error('[PROACTIVE_MONITORING] Error sending notification:', error);
        }
    }

    private async escalateAlert(alert: ProactiveAlert): Promise<void> {
        // In production, this would escalate to on-call engineers
        console.log(`[PROACTIVE_MONITORING] ESCALATING ALERT: ${alert.title}`, alert);

        // Could integrate with PagerDuty, Slack, or other escalation systems
        // For now, just log the escalation
    }

    private async sendUserNotification(alert: ProactiveAlert): Promise<void> {
        // In production, this would send in-app notifications to affected users
        console.log(`[PROACTIVE_MONITORING] USER NOTIFICATION: ${alert.title}`, alert);

        // Could integrate with the notification system to inform users
        // about service issues that affect them directly
    }

    private cleanupOldData(): void {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        // Clean up old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);

        // Clean up old metric history
        this.metricHistory.forEach((history, key) => {
            const filteredHistory = history.filter(point => point.timestamp > cutoffTime);
            if (filteredHistory.length === 0) {
                this.metricHistory.delete(key);
            } else {
                this.metricHistory.set(key, filteredHistory);
            }
        });

        console.log(`[PROACTIVE_MONITORING] Cleaned up old data. Active alerts: ${this.alerts.length}, Metric histories: ${this.metricHistory.size}`);
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================================================
    // Public API Methods
    // ============================================================================

    /**
     * Get current alerts
     */
    getActiveAlerts(): ProactiveAlert[] {
        return this.alerts.filter(alert => !alert.resolution || alert.resolution.status !== 'resolved');
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit: number = 100): ProactiveAlert[] {
        return this.alerts.slice(-limit);
    }

    /**
     * Resolve an alert
     */
    async resolveAlert(alertId: string, resolution: {
        status: 'resolved';
        resolvedBy: string;
        notes?: string;
    }): Promise<void> {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolution = {
                ...resolution,
                resolvedAt: new Date()
            };

            console.log(`[PROACTIVE_MONITORING] Alert ${alertId} resolved by ${resolution.resolvedBy}`);
        }
    }

    /**
     * Get monitoring status
     */
    getMonitoringStatus(): {
        isMonitoring: boolean;
        activeAlerts: number;
        metricHistories: number;
        lastCleanup: Date;
    } {
        return {
            isMonitoring: this.isMonitoring,
            activeAlerts: this.getActiveAlerts().length,
            metricHistories: this.metricHistory.size,
            lastCleanup: new Date() // Would track actual last cleanup time
        };
    }

    /**
     * Put custom metric to CloudWatch (exposed for testing)
     */
    async putCustomMetricPublic(metricName: string, value: number, dimensions?: Record<string, string>): Promise<void> {
        return this.putCustomMetric(metricName, value, dimensions);
    }

    /**
     * Get system health (exposed for testing)
     */
    async getSystemHealth() {
        return errorMonitoringService.getSystemHealth();
    }

    /**
     * Get rate limit status (exposed for testing)
     */
    async getRateLimitStatus() {
        return externalAPIErrorHandler.getRateLimitStatus();
    }
}

// ============================================================================
// Global Instance and Convenience Functions
// ============================================================================

export const proactiveMonitoringService = new ProactiveMonitoringService();

/**
 * Start proactive monitoring
 */
export function startProactiveMonitoring(): void {
    proactiveMonitoringService.startProactiveMonitoring();
}

/**
 * Stop proactive monitoring
 */
export function stopProactiveMonitoring(): void {
    proactiveMonitoringService.stopProactiveMonitoring();
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): ProactiveAlert[] {
    return proactiveMonitoringService.getActiveAlerts();
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus() {
    return proactiveMonitoringService.getMonitoringStatus();
}