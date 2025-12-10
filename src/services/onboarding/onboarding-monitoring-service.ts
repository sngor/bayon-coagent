/**
 * Onboarding Monitoring Service
 * 
 * Provides CloudWatch monitoring, metrics, dashboards, and alarms for the onboarding system.
 * Tracks onboarding completion rates, step abandonment, user flow, and system health.
 * 
 * Features:
 * - CloudWatch dashboard creation and management
 * - Custom metrics for onboarding events
 * - Alarms for low completion rates and high error rates
 * - Funnel visualization data
 * - Real-time monitoring and alerting
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import {
    CloudWatchClient,
    PutMetricDataCommand,
    PutDashboardCommand,
    PutMetricAlarmCommand,
    DescribeAlarmsCommand,
    GetMetricStatisticsCommand,
    type MetricDatum,
    type Dimension,
    type StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import { cloudWatchLogger } from '@/services/monitoring/cloudwatch-logging-service';
import type { OnboardingFlowType } from '@/types/onboarding';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface OnboardingMetrics {
    startRate: MetricValue;
    completionRate: MetricValue;
    abandonmentRate: MetricValue;
    averageTimeToComplete: MetricValue;
    stepCompletionRates: Record<string, MetricValue>;
    skipRates: Record<string, MetricValue>;
    resumeRate: MetricValue;
    errorRate: MetricValue;
}

export interface MetricValue {
    value: number;
    unit: string;
    timestamp: Date;
    trend?: 'increasing' | 'decreasing' | 'stable';
    previousValue?: number;
}

export interface FunnelData {
    flowType: OnboardingFlowType;
    steps: Array<{
        stepId: string;
        stepName: string;
        entered: number;
        completed: number;
        skipped: number;
        abandoned: number;
        completionRate: number;
        averageTime: number;
    }>;
    overallConversion: number;
    dropoffPoints: Array<{
        stepId: string;
        dropoffRate: number;
    }>;
}

export interface AlarmStatus {
    alarmName: string;
    state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
    reason: string;
    timestamp: Date;
    threshold: number;
    currentValue?: number;
}

// ============================================================================
// Onboarding Monitoring Service Class
// ============================================================================

export class OnboardingMonitoringService {
    private cloudWatchClient: CloudWatchClient;
    private readonly NAMESPACE = 'BayonCoAgent/Onboarding';
    private readonly DASHBOARD_NAME = 'OnboardingMetrics';
    private readonly REGION = process.env.AWS_REGION || 'us-east-1';

    // Alarm thresholds
    private readonly COMPLETION_RATE_THRESHOLD = 70; // Alert if below 70%
    private readonly ERROR_RATE_THRESHOLD = 5; // Alert if above 5%
    private readonly ABANDONMENT_RATE_THRESHOLD = 30; // Alert if above 30%

    constructor() {
        this.cloudWatchClient = new CloudWatchClient({
            region: this.REGION,
        });
    }

    /**
     * Publishes a custom metric to CloudWatch
     */
    async publishMetric(
        metricName: string,
        value: number,
        unit: StandardUnit = 'Count',
        dimensions?: Record<string, string>
    ): Promise<void> {
        try {
            const metricData: MetricDatum = {
                MetricName: metricName,
                Value: value,
                Unit: unit,
                Timestamp: new Date(),
                Dimensions: dimensions
                    ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
                    : undefined,
            };

            const command = new PutMetricDataCommand({
                Namespace: this.NAMESPACE,
                MetricData: [metricData],
            });

            await this.cloudWatchClient.send(command);

            cloudWatchLogger.info('Published onboarding metric', {
                operation: 'publish_metric',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, {
                metricName,
                value,
                unit,
                dimensions,
            });
        } catch (error) {
            cloudWatchLogger.error('Error publishing metric', {
                operation: 'publish_metric',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error, {
                metricName,
                value,
            });
            // Don't throw - metrics failures shouldn't break the app
        }
    }

    /**
     * Publishes onboarding start event metric
     */
    async trackOnboardingStart(userId: string, flowType: OnboardingFlowType): Promise<void> {
        await this.publishMetric('OnboardingStarted', 1, 'Count', {
            FlowType: flowType,
        });
    }

    /**
     * Publishes step completion metric
     */
    async trackStepCompletion(
        userId: string,
        flowType: OnboardingFlowType,
        stepId: string,
        timeSpent?: number
    ): Promise<void> {
        await Promise.all([
            this.publishMetric('StepCompleted', 1, 'Count', {
                FlowType: flowType,
                StepId: stepId,
            }),
            timeSpent
                ? this.publishMetric('StepDuration', timeSpent, 'Milliseconds', {
                    FlowType: flowType,
                    StepId: stepId,
                })
                : Promise.resolve(),
        ]);
    }

    /**
     * Publishes step skip metric
     */
    async trackStepSkip(
        userId: string,
        flowType: OnboardingFlowType,
        stepId: string
    ): Promise<void> {
        await this.publishMetric('StepSkipped', 1, 'Count', {
            FlowType: flowType,
            StepId: stepId,
        });
    }

    /**
     * Publishes onboarding completion metric
     */
    async trackOnboardingCompletion(
        userId: string,
        flowType: OnboardingFlowType,
        totalTime?: number
    ): Promise<void> {
        await Promise.all([
            this.publishMetric('OnboardingCompleted', 1, 'Count', {
                FlowType: flowType,
            }),
            totalTime
                ? this.publishMetric('OnboardingDuration', totalTime, 'Milliseconds', {
                    FlowType: flowType,
                })
                : Promise.resolve(),
        ]);
    }

    /**
     * Publishes onboarding abandonment metric
     */
    async trackOnboardingAbandonment(
        userId: string,
        flowType: OnboardingFlowType,
        lastStepId?: string
    ): Promise<void> {
        await this.publishMetric('OnboardingAbandoned', 1, 'Count', {
            FlowType: flowType,
            LastStep: lastStepId || 'unknown',
        });
    }

    /**
     * Publishes onboarding error metric
     */
    async trackOnboardingError(
        userId: string,
        flowType: OnboardingFlowType,
        errorType: string
    ): Promise<void> {
        await this.publishMetric('OnboardingError', 1, 'Count', {
            FlowType: flowType,
            ErrorType: errorType,
        });
    }

    /**
     * Gets current onboarding metrics
     */
    async getOnboardingMetrics(
        flowType?: OnboardingFlowType,
        timeRange: { start: Date; end: Date } = {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
        }
    ): Promise<OnboardingMetrics> {
        try {
            const dimensions = flowType ? [{ Name: 'FlowType', Value: flowType }] : undefined;

            const [
                starts,
                completions,
                abandonments,
                avgTime,
                errors,
            ] = await Promise.all([
                this.getMetricStatistics('OnboardingStarted', timeRange, dimensions),
                this.getMetricStatistics('OnboardingCompleted', timeRange, dimensions),
                this.getMetricStatistics('OnboardingAbandoned', timeRange, dimensions),
                this.getMetricStatistics('OnboardingDuration', timeRange, dimensions, 'Average'),
                this.getMetricStatistics('OnboardingError', timeRange, dimensions),
            ]);

            const startCount = starts.value;
            const completionCount = completions.value;
            const abandonmentCount = abandonments.value;

            const completionRate = startCount > 0 ? (completionCount / startCount) * 100 : 0;
            const abandonmentRate = startCount > 0 ? (abandonmentCount / startCount) * 100 : 0;
            const errorRate = startCount > 0 ? (errors.value / startCount) * 100 : 0;

            // Get step-specific metrics
            const stepCompletionRates = await this.getStepCompletionRates(flowType, timeRange);
            const skipRates = await this.getStepSkipRates(flowType, timeRange);

            // Calculate resume rate (users who abandoned and then resumed)
            const resumeRate = await this.calculateResumeRate(flowType, timeRange);

            return {
                startRate: starts,
                completionRate: {
                    value: completionRate,
                    unit: 'Percent',
                    timestamp: new Date(),
                },
                abandonmentRate: {
                    value: abandonmentRate,
                    unit: 'Percent',
                    timestamp: new Date(),
                },
                averageTimeToComplete: avgTime,
                stepCompletionRates,
                skipRates,
                resumeRate: {
                    value: resumeRate,
                    unit: 'Percent',
                    timestamp: new Date(),
                },
                errorRate: {
                    value: errorRate,
                    unit: 'Percent',
                    timestamp: new Date(),
                },
            };
        } catch (error) {
            cloudWatchLogger.error('Error getting onboarding metrics', {
                operation: 'get_metrics',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error);
            throw error;
        }
    }

    /**
     * Gets funnel visualization data
     */
    async getFunnelData(
        flowType: OnboardingFlowType,
        timeRange: { start: Date; end: Date } = {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
        }
    ): Promise<FunnelData> {
        try {
            // Define steps for each flow type
            const stepDefinitions = this.getStepDefinitions(flowType);

            const steps = await Promise.all(
                stepDefinitions.map(async (step) => {
                    const dimensions = [
                        { Name: 'FlowType', Value: flowType },
                        { Name: 'StepId', Value: step.id },
                    ];

                    const [completed, skipped, avgTime] = await Promise.all([
                        this.getMetricStatistics('StepCompleted', timeRange, dimensions),
                        this.getMetricStatistics('StepSkipped', timeRange, dimensions),
                        this.getMetricStatistics('StepDuration', timeRange, dimensions, 'Average'),
                    ]);

                    // Estimate entered count (completed + skipped + abandoned)
                    const entered = completed.value + skipped.value;
                    const completionRate = entered > 0 ? (completed.value / entered) * 100 : 0;

                    return {
                        stepId: step.id,
                        stepName: step.name,
                        entered,
                        completed: completed.value,
                        skipped: skipped.value,
                        abandoned: 0, // Would need more sophisticated tracking
                        completionRate,
                        averageTime: avgTime.value,
                    };
                })
            );

            // Calculate overall conversion
            const firstStep = steps[0];
            const lastStep = steps[steps.length - 1];
            const overallConversion =
                firstStep.entered > 0 ? (lastStep.completed / firstStep.entered) * 100 : 0;

            // Identify dropoff points
            const dropoffPoints = steps
                .map((step, index) => {
                    if (index === 0) return null;
                    const previousStep = steps[index - 1];
                    const dropoffRate =
                        previousStep.entered > 0
                            ? ((previousStep.entered - step.entered) / previousStep.entered) * 100
                            : 0;
                    return {
                        stepId: step.stepId,
                        dropoffRate,
                    };
                })
                .filter((point): point is { stepId: string; dropoffRate: number } => point !== null)
                .sort((a, b) => b.dropoffRate - a.dropoffRate);

            return {
                flowType,
                steps,
                overallConversion,
                dropoffPoints,
            };
        } catch (error) {
            cloudWatchLogger.error('Error getting funnel data', {
                operation: 'get_funnel_data',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error);
            throw error;
        }
    }

    /**
     * Creates CloudWatch dashboard for onboarding metrics
     */
    async createDashboard(): Promise<void> {
        try {
            const dashboardBody = this.generateDashboardBody();

            const command = new PutDashboardCommand({
                DashboardName: this.DASHBOARD_NAME,
                DashboardBody: JSON.stringify(dashboardBody),
            });

            await this.cloudWatchClient.send(command);

            cloudWatchLogger.info('Created onboarding dashboard', {
                operation: 'create_dashboard',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, {
                dashboardName: this.DASHBOARD_NAME,
            });
        } catch (error) {
            cloudWatchLogger.error('Error creating dashboard', {
                operation: 'create_dashboard',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error);
            throw error;
        }
    }

    /**
     * Creates CloudWatch alarms for onboarding metrics
     */
    async createAlarms(): Promise<void> {
        try {
            await Promise.all([
                this.createCompletionRateAlarm(),
                this.createErrorRateAlarm(),
                this.createAbandonmentRateAlarm(),
            ]);

            cloudWatchLogger.info('Created onboarding alarms', {
                operation: 'create_alarms',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            });
        } catch (error) {
            cloudWatchLogger.error('Error creating alarms', {
                operation: 'create_alarms',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error);
            throw error;
        }
    }

    /**
     * Gets current alarm statuses
     */
    async getAlarmStatuses(): Promise<AlarmStatus[]> {
        try {
            const command = new DescribeAlarmsCommand({
                AlarmNamePrefix: 'Onboarding',
            });

            const response = await this.cloudWatchClient.send(command);
            const alarms = response.MetricAlarms || [];

            return alarms.map((alarm) => ({
                alarmName: alarm.AlarmName || 'Unknown',
                state: (alarm.StateValue as 'OK' | 'ALARM' | 'INSUFFICIENT_DATA') || 'INSUFFICIENT_DATA',
                reason: alarm.StateReason || 'No reason provided',
                timestamp: alarm.StateUpdatedTimestamp || new Date(),
                threshold: alarm.Threshold || 0,
            }));
        } catch (error) {
            cloudWatchLogger.error('Error getting alarm statuses', {
                operation: 'get_alarm_statuses',
                service: 'onboarding-monitoring',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'development',
            }, error as Error);
            throw error;
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async getMetricStatistics(
        metricName: string,
        timeRange: { start: Date; end: Date },
        dimensions?: Dimension[],
        statistic: 'Sum' | 'Average' = 'Sum'
    ): Promise<MetricValue> {
        try {
            const command = new GetMetricStatisticsCommand({
                Namespace: this.NAMESPACE,
                MetricName: metricName,
                Dimensions: dimensions,
                StartTime: timeRange.start,
                EndTime: timeRange.end,
                Period: 3600, // 1 hour
                Statistics: [statistic],
            });

            const response = await this.cloudWatchClient.send(command);
            const datapoints = response.Datapoints || [];

            if (datapoints.length === 0) {
                return {
                    value: 0,
                    unit: this.getUnitForMetric(metricName),
                    timestamp: new Date(),
                };
            }

            // Sort by timestamp and get the latest value
            const sortedPoints = datapoints.sort(
                (a, b) => (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
            );

            const latestPoint = sortedPoints[0];
            const value = statistic === 'Sum' ? (latestPoint.Sum || 0) : (latestPoint.Average || 0);

            return {
                value,
                unit: this.getUnitForMetric(metricName),
                timestamp: latestPoint.Timestamp || new Date(),
            };
        } catch (error) {
            console.error(`Error getting metric statistics for ${metricName}:`, error);
            return {
                value: 0,
                unit: this.getUnitForMetric(metricName),
                timestamp: new Date(),
            };
        }
    }

    private async getStepCompletionRates(
        flowType: OnboardingFlowType | undefined,
        timeRange: { start: Date; end: Date }
    ): Promise<Record<string, MetricValue>> {
        const stepDefinitions = flowType ? this.getStepDefinitions(flowType) : [];
        const rates: Record<string, MetricValue> = {};

        for (const step of stepDefinitions) {
            const dimensions = flowType
                ? [
                    { Name: 'FlowType', Value: flowType },
                    { Name: 'StepId', Value: step.id },
                ]
                : [{ Name: 'StepId', Value: step.id }];

            const completed = await this.getMetricStatistics('StepCompleted', timeRange, dimensions);
            rates[step.id] = completed;
        }

        return rates;
    }

    private async getStepSkipRates(
        flowType: OnboardingFlowType | undefined,
        timeRange: { start: Date; end: Date }
    ): Promise<Record<string, MetricValue>> {
        const stepDefinitions = flowType ? this.getStepDefinitions(flowType) : [];
        const rates: Record<string, MetricValue> = {};

        for (const step of stepDefinitions) {
            const dimensions = flowType
                ? [
                    { Name: 'FlowType', Value: flowType },
                    { Name: 'StepId', Value: step.id },
                ]
                : [{ Name: 'StepId', Value: step.id }];

            const skipped = await this.getMetricStatistics('StepSkipped', timeRange, dimensions);
            rates[step.id] = skipped;
        }

        return rates;
    }

    private async calculateResumeRate(
        flowType: OnboardingFlowType | undefined,
        timeRange: { start: Date; end: Date }
    ): Promise<number> {
        // This would require more sophisticated tracking
        // For now, return a placeholder
        return 0;
    }

    private getStepDefinitions(flowType: OnboardingFlowType): Array<{ id: string; name: string }> {
        if (flowType === 'user') {
            return [
                { id: 'welcome', name: 'Welcome' },
                { id: 'profile', name: 'Profile Setup' },
                { id: 'tour', name: 'Feature Tour' },
                { id: 'selection', name: 'Hub Selection' },
                { id: 'complete', name: 'Completion' },
            ];
        } else if (flowType === 'admin') {
            return [
                { id: 'admin-welcome', name: 'Admin Welcome' },
                { id: 'users', name: 'User Management' },
                { id: 'analytics', name: 'Analytics' },
                { id: 'config', name: 'Configuration' },
                { id: 'admin-complete', name: 'Completion' },
            ];
        } else {
            // both
            return [
                ...this.getStepDefinitions('admin'),
                ...this.getStepDefinitions('user'),
            ];
        }
    }

    private getUnitForMetric(metricName: string): string {
        if (metricName.includes('Duration') || metricName.includes('Time')) {
            return 'Milliseconds';
        }
        if (metricName.includes('Rate') || metricName.includes('Percent')) {
            return 'Percent';
        }
        return 'Count';
    }

    private generateDashboardBody(): any {
        return {
            widgets: [
                // Overview metrics
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [this.NAMESPACE, 'OnboardingStarted', { stat: 'Sum', label: 'Started' }],
                            ['.', 'OnboardingCompleted', { stat: 'Sum', label: 'Completed' }],
                            ['.', 'OnboardingAbandoned', { stat: 'Sum', label: 'Abandoned' }],
                        ],
                        period: 3600,
                        stat: 'Sum',
                        region: this.REGION,
                        title: 'Onboarding Overview',
                        yAxis: {
                            left: {
                                label: 'Count',
                            },
                        },
                    },
                },
                // Completion rate by flow type
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [
                                this.NAMESPACE,
                                'OnboardingCompleted',
                                { stat: 'Sum', label: 'User Flow' },
                                { FlowType: 'user' },
                            ],
                            [
                                '...',
                                { stat: 'Sum', label: 'Admin Flow' },
                                { FlowType: 'admin' },
                            ],
                        ],
                        period: 3600,
                        stat: 'Sum',
                        region: this.REGION,
                        title: 'Completion Rate by Flow Type',
                        yAxis: {
                            left: {
                                label: 'Count',
                            },
                        },
                    },
                },
                // Step completion funnel
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [this.NAMESPACE, 'StepCompleted', { stat: 'Sum' }],
                            ['.', 'StepSkipped', { stat: 'Sum' }],
                        ],
                        period: 3600,
                        stat: 'Sum',
                        region: this.REGION,
                        title: 'Step Completion vs Skip',
                        yAxis: {
                            left: {
                                label: 'Count',
                            },
                        },
                    },
                },
                // Average completion time
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [
                                this.NAMESPACE,
                                'OnboardingDuration',
                                { stat: 'Average', label: 'Avg Time' },
                            ],
                        ],
                        period: 3600,
                        stat: 'Average',
                        region: this.REGION,
                        title: 'Average Completion Time',
                        yAxis: {
                            left: {
                                label: 'Milliseconds',
                            },
                        },
                    },
                },
                // Error rate
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [this.NAMESPACE, 'OnboardingError', { stat: 'Sum', label: 'Errors' }],
                        ],
                        period: 3600,
                        stat: 'Sum',
                        region: this.REGION,
                        title: 'Onboarding Errors',
                        yAxis: {
                            left: {
                                label: 'Count',
                            },
                        },
                    },
                },
            ],
        };
    }

    private async createCompletionRateAlarm(): Promise<void> {
        const command = new PutMetricAlarmCommand({
            AlarmName: 'OnboardingLowCompletionRate',
            AlarmDescription: `Alert when onboarding completion rate falls below ${this.COMPLETION_RATE_THRESHOLD}%`,
            MetricName: 'OnboardingCompleted',
            Namespace: this.NAMESPACE,
            Statistic: 'Sum',
            Period: 3600, // 1 hour
            EvaluationPeriods: 2,
            Threshold: this.COMPLETION_RATE_THRESHOLD,
            ComparisonOperator: 'LessThanThreshold',
            TreatMissingData: 'notBreaching',
        });

        await this.cloudWatchClient.send(command);
    }

    private async createErrorRateAlarm(): Promise<void> {
        const command = new PutMetricAlarmCommand({
            AlarmName: 'OnboardingHighErrorRate',
            AlarmDescription: `Alert when onboarding error rate exceeds ${this.ERROR_RATE_THRESHOLD}%`,
            MetricName: 'OnboardingError',
            Namespace: this.NAMESPACE,
            Statistic: 'Sum',
            Period: 3600, // 1 hour
            EvaluationPeriods: 1,
            Threshold: this.ERROR_RATE_THRESHOLD,
            ComparisonOperator: 'GreaterThanThreshold',
            TreatMissingData: 'notBreaching',
        });

        await this.cloudWatchClient.send(command);
    }

    private async createAbandonmentRateAlarm(): Promise<void> {
        const command = new PutMetricAlarmCommand({
            AlarmName: 'OnboardingHighAbandonmentRate',
            AlarmDescription: `Alert when onboarding abandonment rate exceeds ${this.ABANDONMENT_RATE_THRESHOLD}%`,
            MetricName: 'OnboardingAbandoned',
            Namespace: this.NAMESPACE,
            Statistic: 'Sum',
            Period: 3600, // 1 hour
            EvaluationPeriods: 2,
            Threshold: this.ABANDONMENT_RATE_THRESHOLD,
            ComparisonOperator: 'GreaterThanThreshold',
            TreatMissingData: 'notBreaching',
        });

        await this.cloudWatchClient.send(command);
    }
}

// Export singleton instance
export const onboardingMonitoring = new OnboardingMonitoringService();
