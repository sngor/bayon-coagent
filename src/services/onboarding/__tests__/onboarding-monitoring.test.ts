/**
 * Onboarding Monitoring Service Tests
 * 
 * Tests for CloudWatch monitoring, metrics, and dashboard functionality.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock AWS SDK
const mockSend = jest.fn();
jest.unstable_mockModule('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn(() => ({
        send: mockSend,
    })),
    PutMetricDataCommand: jest.fn((params) => params),
    PutDashboardCommand: jest.fn((params) => params),
    PutMetricAlarmCommand: jest.fn((params) => params),
    DescribeAlarmsCommand: jest.fn((params) => params),
    GetMetricStatisticsCommand: jest.fn((params) => params),
}));

// Mock CloudWatch logger
jest.unstable_mockModule('@/services/monitoring/cloudwatch-logging-service', () => ({
    cloudWatchLogger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('OnboardingMonitoringService', () => {
    let onboardingMonitoring: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockSend.mockResolvedValue({});

        const module = await import('../onboarding-monitoring-service');
        onboardingMonitoring = module.onboardingMonitoring;
    });

    describe('publishMetric', () => {
        it('should publish a metric to CloudWatch', async () => {
            await onboardingMonitoring.publishMetric('TestMetric', 100, 'Count', {
                FlowType: 'user',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    Namespace: 'BayonCoAgent/Onboarding',
                    MetricData: expect.arrayContaining([
                        expect.objectContaining({
                            MetricName: 'TestMetric',
                            Value: 100,
                            Unit: 'Count',
                        }),
                    ]),
                })
            );
        });

        it('should handle errors gracefully', async () => {
            mockSend.mockRejectedValueOnce(new Error('CloudWatch error'));

            // Should not throw
            await expect(
                onboardingMonitoring.publishMetric('TestMetric', 100)
            ).resolves.not.toThrow();
        });
    });

    describe('trackOnboardingStart', () => {
        it('should publish start metric with flow type', async () => {
            await onboardingMonitoring.trackOnboardingStart('user123', 'user');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    MetricData: expect.arrayContaining([
                        expect.objectContaining({
                            MetricName: 'OnboardingStarted',
                            Value: 1,
                            Dimensions: expect.arrayContaining([
                                expect.objectContaining({
                                    Name: 'FlowType',
                                    Value: 'user',
                                }),
                            ]),
                        }),
                    ]),
                })
            );
        });
    });

    describe('trackStepCompletion', () => {
        it('should publish step completion metric', async () => {
            await onboardingMonitoring.trackStepCompletion(
                'user123',
                'user',
                'profile',
                5000
            );

            // Should publish both completion and duration metrics
            expect(mockSend).toHaveBeenCalledTimes(2);
        });

        it('should publish completion metric without duration', async () => {
            await onboardingMonitoring.trackStepCompletion(
                'user123',
                'user',
                'profile'
            );

            // Should only publish completion metric
            expect(mockSend).toHaveBeenCalledTimes(1);
        });
    });

    describe('trackStepSkip', () => {
        it('should publish skip metric', async () => {
            await onboardingMonitoring.trackStepSkip('user123', 'user', 'tour');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    MetricData: expect.arrayContaining([
                        expect.objectContaining({
                            MetricName: 'StepSkipped',
                            Dimensions: expect.arrayContaining([
                                expect.objectContaining({
                                    Name: 'StepId',
                                    Value: 'tour',
                                }),
                            ]),
                        }),
                    ]),
                })
            );
        });
    });

    describe('trackOnboardingCompletion', () => {
        it('should publish completion metric with total time', async () => {
            await onboardingMonitoring.trackOnboardingCompletion(
                'user123',
                'user',
                300000
            );

            // Should publish both completion and duration metrics
            expect(mockSend).toHaveBeenCalledTimes(2);
        });
    });

    describe('getOnboardingMetrics', () => {
        it('should fetch and aggregate metrics', async () => {
            mockSend.mockResolvedValue({
                Datapoints: [
                    {
                        Timestamp: new Date(),
                        Sum: 100,
                    },
                ],
            });

            const metrics = await onboardingMonitoring.getOnboardingMetrics('user');

            expect(metrics).toHaveProperty('startRate');
            expect(metrics).toHaveProperty('completionRate');
            expect(metrics).toHaveProperty('abandonmentRate');
            expect(metrics).toHaveProperty('averageTimeToComplete');
        });

        it('should calculate completion rate correctly', async () => {
            mockSend
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 100 }] }) // starts
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 70 }] }) // completions
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 20 }] }) // abandonments
                .mockResolvedValueOnce({ Datapoints: [{ Average: 180000 }] }) // avg time
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 5 }] }); // errors

            const metrics = await onboardingMonitoring.getOnboardingMetrics('user');

            expect(metrics.completionRate.value).toBe(70); // 70/100 * 100
            expect(metrics.abandonmentRate.value).toBe(20); // 20/100 * 100
        });
    });

    describe('createDashboard', () => {
        it('should create CloudWatch dashboard', async () => {
            await onboardingMonitoring.createDashboard();

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    DashboardName: 'OnboardingMetrics',
                    DashboardBody: expect.any(String),
                })
            );
        });
    });

    describe('createAlarms', () => {
        it('should create all three alarms', async () => {
            await onboardingMonitoring.createAlarms();

            // Should create 3 alarms
            expect(mockSend).toHaveBeenCalledTimes(3);

            // Verify alarm names
            const calls = mockSend.mock.calls;
            const alarmNames = calls.map((call: any) => call[0].AlarmName);

            expect(alarmNames).toContain('OnboardingLowCompletionRate');
            expect(alarmNames).toContain('OnboardingHighErrorRate');
            expect(alarmNames).toContain('OnboardingHighAbandonmentRate');
        });
    });

    describe('getAlarmStatuses', () => {
        it('should fetch alarm statuses', async () => {
            mockSend.mockResolvedValue({
                MetricAlarms: [
                    {
                        AlarmName: 'OnboardingLowCompletionRate',
                        StateValue: 'OK',
                        StateReason: 'Threshold not breached',
                        StateUpdatedTimestamp: new Date(),
                        Threshold: 70,
                    },
                ],
            });

            const statuses = await onboardingMonitoring.getAlarmStatuses();

            expect(statuses).toHaveLength(1);
            expect(statuses[0]).toMatchObject({
                alarmName: 'OnboardingLowCompletionRate',
                state: 'OK',
                threshold: 70,
            });
        });
    });

    describe('getFunnelData', () => {
        it('should generate funnel visualization data', async () => {
            mockSend.mockResolvedValue({
                Datapoints: [{ Sum: 50 }],
            });

            const funnel = await onboardingMonitoring.getFunnelData('user');

            expect(funnel).toHaveProperty('flowType', 'user');
            expect(funnel).toHaveProperty('steps');
            expect(funnel).toHaveProperty('overallConversion');
            expect(funnel).toHaveProperty('dropoffPoints');
            expect(Array.isArray(funnel.steps)).toBe(true);
        });

        it('should identify dropoff points', async () => {
            mockSend
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 100 }] }) // step 1 completed
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 10 }] })  // step 1 skipped
                .mockResolvedValueOnce({ Datapoints: [{ Average: 5000 }] }) // step 1 time
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 50 }] })  // step 2 completed
                .mockResolvedValueOnce({ Datapoints: [{ Sum: 5 }] })   // step 2 skipped
                .mockResolvedValueOnce({ Datapoints: [{ Average: 3000 }] }); // step 2 time

            const funnel = await onboardingMonitoring.getFunnelData('user');

            expect(funnel.dropoffPoints.length).toBeGreaterThan(0);
            expect(funnel.dropoffPoints[0]).toHaveProperty('stepId');
            expect(funnel.dropoffPoints[0]).toHaveProperty('dropoffRate');
        });
    });
});
