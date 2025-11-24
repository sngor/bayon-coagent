/**
 * Proactive Monitoring and Alerting Tests
 * 
 * Tests for the comprehensive proactive monitoring system including:
 * - Lambda error monitoring with severity-based escalation
 * - API rate limit monitoring with predictive alerting
 * - Publishing failure monitoring with automatic retry status
 * - Analytics sync failure monitoring with data freshness tracking
 * - Business metric monitoring and system health scoring
 * 
 * Validates: Requirements 1.5, 8.2, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
    ProactiveMonitoringService,
    proactiveMonitoringService,
    type ProactiveAlert
} from '../services/proactive-monitoring-service';
import {
    MonitoringDashboardService,
    monitoringDashboard,
    type DashboardMetrics
} from '../services/monitoring-dashboard-service';
import {
    CloudWatchLoggingService,
    cloudWatchLogger
} from '../services/cloudwatch-logging-service';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-cloudwatch-logs');

describe('Proactive Monitoring System', () => {
    let mockCloudWatchClient: any;
    let mockSNSClient: any;
    let mockCloudWatchLogsClient: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock CloudWatch responses
        mockCloudWatchClient = {
            send: jest.fn()
        };

        mockSNSClient = {
            send: jest.fn()
        };

        mockCloudWatchLogsClient = {
            send: jest.fn()
        };

        // Mock successful CloudWatch responses
        mockCloudWatchClient.send.mockResolvedValue({
            Datapoints: [
                { Timestamp: new Date(), Sum: 5, Average: 2.5, Maximum: 10 }
            ]
        });

        mockSNSClient.send.mockResolvedValue({ MessageId: 'test-message-id' });
        mockCloudWatchLogsClient.send.mockResolvedValue({});
    });

    afterEach(() => {
        // Stop monitoring to clean up intervals
        proactiveMonitoringService.stopProactiveMonitoring();
    });

    describe('Lambda Error Monitoring with Severity-Based Escalation', () => {
        it('should detect Lambda function errors and create appropriate alerts', async () => {
            // Mock CloudWatch metrics showing Lambda errors
            mockCloudWatchClient.send.mockResolvedValueOnce({
                Datapoints: [
                    { Timestamp: new Date(), Sum: 3 }, // 3 errors
                    { Timestamp: new Date(), Sum: 2 }, // 2 errors
                    { Timestamp: new Date(), Sum: 1 }  // 1 error
                ]
            });

            const monitoring = new ProactiveMonitoringService();

            // Trigger Lambda error monitoring
            await (monitoring as any).monitorLambdaErrors();

            // Should create an alert for the errors
            const alerts = monitoring.getActiveAlerts();
            expect(alerts.length).toBeGreaterThan(0);

            const lambdaAlert = alerts.find(alert =>
                alert.category === 'lambda_error' &&
                alert.context.function?.includes('publish-scheduled-content')
            );

            expect(lambdaAlert).toBeDefined();
            expect(lambdaAlert?.severity).toBe('error'); // 6 total errors should be 'error' severity
            expect(lambdaAlert?.actions.escalate).toBe(true);
            expect(lambdaAlert?.context.currentValue).toBe(6);
        });

        it('should escalate critical Lambda function errors immediately', async () => {
            // Mock CloudWatch metrics showing many errors for critical function
            mockCloudWatchClient.send.mockResolvedValueOnce({
                Datapoints: [
                    { Timestamp: new Date(), Sum: 5 }, // 5 errors - should be critical
                ]
            });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorLambdaErrors();

            const alerts = monitoring.getActiveAlerts();
            const criticalAlert = alerts.find(alert =>
                alert.severity === 'critical' &&
                alert.category === 'lambda_error'
            );

            expect(criticalAlert).toBeDefined();
            expect(criticalAlert?.actions.escalate).toBe(true);
            expect(criticalAlert?.actions.userNotification).toBe(true);
        });

        it('should monitor Lambda performance degradation', async () => {
            // Mock CloudWatch metrics showing high duration
            mockCloudWatchClient.send
                .mockResolvedValueOnce({ Datapoints: [] }) // No errors
                .mockResolvedValueOnce({
                    Datapoints: [
                        { Timestamp: new Date(), Average: 45000 }, // 45 seconds - above 30s threshold
                        { Timestamp: new Date(), Average: 40000 }
                    ]
                });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorLambdaErrors();

            const alerts = monitoring.getActiveAlerts();
            const performanceAlert = alerts.find(alert =>
                alert.title.includes('Performance Degradation')
            );

            expect(performanceAlert).toBeDefined();
            expect(performanceAlert?.severity).toBe('warning');
            expect(performanceAlert?.context.metric).toBe('Duration');
        });
    });

    describe('API Rate Limit Monitoring with Predictive Alerting', () => {
        it('should predict rate limit exhaustion before limits are reached', async () => {
            // Mock rate limit status showing high usage
            const mockRateLimitStatus = {
                facebook: {
                    limit: 200,
                    remaining: 20, // 90% usage
                    resetTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                    windowDuration: 3600
                }
            };

            // Mock the external API error handler
            jest.doMock('../services/external-api-error-handler', () => ({
                externalAPIErrorHandler: {
                    getRateLimitStatus: () => mockRateLimitStatus
                }
            }));

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorRateLimits();

            const alerts = monitoring.getActiveAlerts();
            const rateLimitAlert = alerts.find(alert =>
                alert.category === 'rate_limit' &&
                alert.context.platform === 'facebook'
            );

            expect(rateLimitAlert).toBeDefined();
            expect(rateLimitAlert?.severity).toBe('error'); // 90% usage should be error
            expect(rateLimitAlert?.context.currentValue).toBe(90);
            expect(rateLimitAlert?.actions.userNotification).toBe(true);
        });

        it('should alert on frequent rate limit encounters', async () => {
            // Mock CloudWatch metrics showing rate limit encounters
            mockCloudWatchClient.send.mockResolvedValueOnce({
                Datapoints: [
                    { Timestamp: new Date(), Sum: 8 } // 8 encounters in last hour
                ]
            });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorRateLimits();

            const alerts = monitoring.getActiveAlerts();
            const encounterAlert = alerts.find(alert =>
                alert.title.includes('Frequent Rate Limit Encounters')
            );

            expect(encounterAlert).toBeDefined();
            expect(encounterAlert?.severity).toBe('error');
            expect(encounterAlert?.context.currentValue).toBe(8);
        });
    });

    describe('Publishing Failure Monitoring with Automatic Retry Status', () => {
        it('should monitor publishing failure rates and alert appropriately', async () => {
            // Mock CloudWatch metrics showing publishing failures
            mockCloudWatchClient.send
                .mockResolvedValueOnce({
                    Datapoints: [
                        { Timestamp: new Date(), Sum: 8 }, // 8 failures
                        { Timestamp: new Date(), Sum: 4 }  // 4 failures
                    ]
                })
                .mockResolvedValueOnce({
                    Datapoints: [
                        { Timestamp: new Date(), Sum: 20 }, // 20 successes
                        { Timestamp: new Date(), Sum: 15 }  // 15 successes
                    ]
                });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorPublishingFailures();

            const alerts = monitoring.getActiveAlerts();
            const failureAlert = alerts.find(alert =>
                alert.category === 'publishing_failure' &&
                alert.title.includes('High Publishing Failure Rate')
            );

            expect(failureAlert).toBeDefined();

            // Calculate expected failure rate: 12 failures / (12 failures + 35 successes) = ~25.5%
            expect(failureAlert?.context.currentValue).toBeCloseTo(25.5, 1);
            expect(failureAlert?.severity).toBe('error'); // >25% failure rate
            expect(failureAlert?.actions.autoRetry).toBe(true);
        });

        it('should alert on dead letter queue messages requiring manual intervention', async () => {
            // Mock CloudWatch metrics showing DLQ messages
            mockCloudWatchClient.send
                .mockResolvedValueOnce({ Datapoints: [] }) // No failure rate data
                .mockResolvedValueOnce({ Datapoints: [] }) // No success rate data
                .mockResolvedValueOnce({
                    Datapoints: [
                        { Timestamp: new Date(), Sum: 3 } // 3 messages in DLQ
                    ]
                });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorPublishingFailures();

            const alerts = monitoring.getActiveAlerts();
            const dlqAlert = alerts.find(alert =>
                alert.title.includes('Dead Letter Queue Messages')
            );

            expect(dlqAlert).toBeDefined();
            expect(dlqAlert?.severity).toBe('error');
            expect(dlqAlert?.context.currentValue).toBe(3);
            expect(dlqAlert?.actions.userNotification).toBe(true);
        });
    });

    describe('Analytics Sync Failure Monitoring with Data Freshness', () => {
        it('should monitor analytics sync failures and alert on high failure rates', async () => {
            // Mock CloudWatch metrics showing sync failures
            mockCloudWatchClient.send.mockResolvedValueOnce({
                Datapoints: [
                    { Timestamp: new Date(), Sum: 15 }, // 15 failures in 2 hours
                    { Timestamp: new Date(), Sum: 8 }
                ]
            });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorAnalyticsSyncFailures();

            const alerts = monitoring.getActiveAlerts();
            const syncAlert = alerts.find(alert =>
                alert.category === 'analytics_sync' &&
                alert.title.includes('High Analytics Sync Failure Rate')
            );

            expect(syncAlert).toBeDefined();
            expect(syncAlert?.severity).toBe('warning');
            expect(syncAlert?.context.currentValue).toBe(23); // 15 + 8 failures
            expect(syncAlert?.actions.autoRetry).toBe(true);
        });

        it('should alert on stale analytics data exceeding freshness requirements', async () => {
            // Mock CloudWatch metrics showing old data
            mockCloudWatchClient.send
                .mockResolvedValueOnce({ Datapoints: [] }) // No sync failures
                .mockResolvedValueOnce({
                    Datapoints: [
                        { Timestamp: new Date(), Maximum: 1500 } // 25 hours old (1500 minutes)
                    ]
                });

            const monitoring = new ProactiveMonitoringService();

            await (monitoring as any).monitorAnalyticsSyncFailures();

            const alerts = monitoring.getActiveAlerts();
            const staleDataAlert = alerts.find(alert =>
                alert.title.includes('Stale Analytics Data')
            );

            expect(staleDataAlert).toBeDefined();
            expect(staleDataAlert?.severity).toBe('error');
            expect(staleDataAlert?.context.currentValue).toBe(25); // 25 hours
            expect(staleDataAlert?.actions.escalate).toBe(true);
        });
    });

    describe('Business Metric Monitoring', () => {
        it('should monitor scheduling success rate and alert on degradation', async () => {
            const monitoring = new ProactiveMonitoringService();

            // Mock business metrics calculation to return low success rate
            jest.spyOn(monitoring as any, 'calculateBusinessMetrics').mockResolvedValue({
                schedulingSuccessRate: 92, // Below 95% target
                publishingSuccessRate: 99.5,
                analyticsSyncSuccessRate: 97,
                averagePublishingLatency: 2.1,
                rateLimitEncounters: 2,
                userEngagementScore: 85,
                systemHealthScore: 88
            });

            await (monitoring as any).monitorBusinessMetrics();

            const alerts = monitoring.getActiveAlerts();
            const schedulingAlert = alerts.find(alert =>
                alert.category === 'business_metric' &&
                alert.context.metric === 'SchedulingSuccessRate'
            );

            expect(schedulingAlert).toBeDefined();
            expect(schedulingAlert?.severity).toBe('warning');
            expect(schedulingAlert?.context.currentValue).toBe(92);
            expect(schedulingAlert?.context.threshold).toBe(95);
        });

        it('should monitor system health score and escalate critical issues', async () => {
            const monitoring = new ProactiveMonitoringService();

            // Mock business metrics calculation to return low health score
            jest.spyOn(monitoring as any, 'calculateBusinessMetrics').mockResolvedValue({
                schedulingSuccessRate: 95,
                publishingSuccessRate: 94, // Below 95% - critical
                analyticsSyncSuccessRate: 97,
                averagePublishingLatency: 2.1,
                rateLimitEncounters: 2,
                userEngagementScore: 85,
                systemHealthScore: 75 // Below 80% - critical
            });

            await (monitoring as any).monitorBusinessMetrics();

            const alerts = monitoring.getActiveAlerts();

            const publishingAlert = alerts.find(alert =>
                alert.context.metric === 'PublishingSuccessRate'
            );
            const healthAlert = alerts.find(alert =>
                alert.context.metric === 'SystemHealthScore'
            );

            expect(publishingAlert).toBeDefined();
            expect(publishingAlert?.severity).toBe('critical');
            expect(publishingAlert?.actions.userNotification).toBe(true);

            expect(healthAlert).toBeDefined();
            expect(healthAlert?.severity).toBe('critical');
            expect(healthAlert?.actions.escalate).toBe(true);
        });
    });

    describe('Monitoring Dashboard Integration', () => {
        it('should aggregate comprehensive dashboard metrics', async () => {
            const dashboard = new MonitoringDashboardService();

            // Mock all the dashboard data sources
            jest.spyOn(dashboard as any, 'getSystemHealth').mockResolvedValue({
                status: 'healthy',
                services: { database: { status: 'up' } },
                errorRate: 2.1,
                criticalErrors: 0,
                affectedUsers: 0,
                uptime: 99.9
            });

            jest.spyOn(dashboard as any, 'getActiveAlerts').mockResolvedValue([]);
            jest.spyOn(dashboard as any, 'getBusinessMetrics').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getPerformanceMetrics').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getRateLimitStatus').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getLambdaMetrics').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getErrorMetrics').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getTrendAnalysis').mockResolvedValue({});
            jest.spyOn(dashboard as any, 'getPredictionAnalysis').mockResolvedValue({});

            const metrics = await dashboard.getDashboardMetrics();

            expect(metrics).toBeDefined();
            expect(metrics.systemHealth).toBeDefined();
            expect(metrics.systemHealth.status).toBe('healthy');
            expect(metrics.activeAlerts).toBeDefined();
            expect(metrics.businessMetrics).toBeDefined();
            expect(metrics.performanceMetrics).toBeDefined();
        });

        it('should provide alert summary with trending analysis', async () => {
            const dashboard = new MonitoringDashboardService();

            // Mock recent alerts for trending analysis
            const mockAlerts: ProactiveAlert[] = [
                {
                    id: 'alert1',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                    severity: 'error',
                    category: 'rate_limit',
                    title: 'Rate Limit Warning',
                    message: 'Test alert',
                    context: { platform: 'facebook' },
                    actions: { notify: true }
                },
                {
                    id: 'alert2',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                    severity: 'warning',
                    category: 'rate_limit',
                    title: 'Rate Limit Warning',
                    message: 'Test alert',
                    context: { platform: 'instagram' },
                    actions: { notify: true }
                }
            ];

            jest.spyOn(proactiveMonitoringService, 'getActiveAlerts').mockReturnValue(mockAlerts);
            jest.spyOn(proactiveMonitoringService, 'getAlertHistory').mockReturnValue(mockAlerts);

            const summary = await dashboard.getAlertSummary();

            expect(summary.total).toBe(2);
            expect(summary.byCategory.rate_limit).toBe(2);
            expect(summary.bySeverity.error).toBe(1);
            expect(summary.bySeverity.warning).toBe(1);
            expect(summary.recent).toHaveLength(2);
        });

        it('should determine system status based on alerts and health', async () => {
            const dashboard = new MonitoringDashboardService();

            // Mock system health and alerts
            jest.spyOn(dashboard as any, 'getSystemHealth').mockResolvedValue({
                status: 'degraded',
                services: { database: { status: 'degraded' } },
                uptime: 98.5
            });

            const mockCriticalAlert: ProactiveAlert = {
                id: 'critical1',
                timestamp: new Date(),
                severity: 'critical',
                category: 'lambda_error',
                title: 'Critical Lambda Error',
                message: 'Critical error occurred',
                context: { function: 'publish-scheduled-content' },
                actions: { escalate: true, notify: true }
            };

            jest.spyOn(proactiveMonitoringService, 'getActiveAlerts').mockReturnValue([mockCriticalAlert]);

            const status = await dashboard.getSystemStatus();

            expect(status.overall).toBe('critical'); // Critical alert overrides degraded health
            expect(status.components).toBeDefined();
            expect(status.lastIncident).toBeDefined();
        });
    });

    describe('CloudWatch Logging Integration', () => {
        it('should create structured logs with correlation IDs', () => {
            const logger = new CloudWatchLoggingService();

            const correlationId = logger.createCorrelationId();
            logger.setCorrelationId(correlationId);

            expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            expect(logger.getCorrelationId()).toBe(correlationId);
        });

        it('should log API calls with performance metrics', () => {
            const logger = new CloudWatchLoggingService();

            const apiCall = {
                method: 'POST',
                url: '/api/schedule',
                statusCode: 200,
                duration: 150
            };

            const performanceMetrics = {
                duration: 150,
                memoryUsed: 1024 * 1024,
                cpuUsage: 15.5
            };

            // Should not throw
            expect(() => {
                logger.logAPICall(
                    'API call completed successfully',
                    { operation: 'schedule_content', service: 'content-workflow' },
                    apiCall,
                    performanceMetrics
                );
            }).not.toThrow();
        });

        it('should track performance metrics for operations', () => {
            const logger = new CloudWatchLoggingService();

            const stopTracking = logger.startPerformanceTracking('test-operation');

            // Simulate some work
            const start = Date.now();
            while (Date.now() - start < 10) {
                // Wait 10ms
            }

            const metrics = stopTracking();

            expect(metrics.duration).toBeGreaterThanOrEqual(10);
            expect(metrics.memoryUsed).toBeDefined();
        });

        it('should create child loggers with inherited context', () => {
            const logger = new CloudWatchLoggingService();

            const childLogger = logger.createChildLogger({
                userId: 'user123',
                operation: 'content_scheduling'
            });

            // Should not throw and should inherit context
            expect(() => {
                childLogger.info('Child logger test', { service: 'content-workflow' });
            }).not.toThrow();
        });
    });

    describe('Error Handling and Resilience', () => {
        it('should handle CloudWatch API failures gracefully', async () => {
            // Mock CloudWatch failure
            mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch API Error'));

            const monitoring = new ProactiveMonitoringService();

            // Should not throw, but should log error
            await expect((monitoring as any).monitorLambdaErrors()).resolves.not.toThrow();
        });

        it('should handle SNS notification failures gracefully', async () => {
            // Mock SNS failure
            mockSNSClient.send.mockRejectedValue(new Error('SNS API Error'));

            const monitoring = new ProactiveMonitoringService();

            // Create an alert that would trigger notification
            const alert = await (monitoring as any).createAlert({
                severity: 'error',
                category: 'test',
                title: 'Test Alert',
                message: 'Test message',
                context: {},
                actions: { notify: true }
            });

            expect(alert).toBeDefined();
            expect(alert.id).toBeDefined();
        });

        it('should cache dashboard metrics to reduce API calls', async () => {
            const dashboard = new MonitoringDashboardService();

            // Mock expensive operations
            const mockGetSystemHealth = jest.spyOn(dashboard as any, 'getSystemHealth').mockResolvedValue({});

            // First call
            await (dashboard as any).getCachedOrFetch('test_key', mockGetSystemHealth);

            // Second call should use cache
            await (dashboard as any).getCachedOrFetch('test_key', mockGetSystemHealth);

            // Should only call the expensive operation once
            expect(mockGetSystemHealth).toHaveBeenCalledTimes(1);
        });
    });

    describe('Integration with Existing Services', () => {
        it('should integrate with error monitoring service', async () => {
            const monitoring = new ProactiveMonitoringService();

            // Should be able to get system health
            const health = await monitoring.getSystemHealth();
            expect(health).toBeDefined();
        });

        it('should integrate with external API error handler', async () => {
            const monitoring = new ProactiveMonitoringService();

            // Should be able to get rate limit status
            const status = await monitoring.getRateLimitStatus();
            expect(status).toBeDefined();
        });

        it('should send custom metrics to CloudWatch', async () => {
            const monitoring = new ProactiveMonitoringService();

            await monitoring.putCustomMetricPublic('TestMetric', 42.5, { TestDimension: 'TestValue' });

            expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        Namespace: 'BayonCoAgent/ContentWorkflow',
                        MetricData: expect.arrayContaining([
                            expect.objectContaining({
                                MetricName: 'TestMetric',
                                Value: 42.5
                            })
                        ])
                    })
                })
            );
        });
    });
});

describe('Proactive Monitoring Performance', () => {
    let mockCloudWatchClient: any;

    beforeEach(() => {
        mockCloudWatchClient = {
            send: jest.fn()
        };
        mockCloudWatchClient.send.mockResolvedValue({ Datapoints: [] });
    });

    it('should complete dashboard metrics collection within acceptable time', async () => {
        const dashboard = new MonitoringDashboardService();

        // Mock all dependencies to return quickly
        jest.spyOn(dashboard as any, 'getSystemHealth').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getActiveAlerts').mockResolvedValue([]);
        jest.spyOn(dashboard as any, 'getBusinessMetrics').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getPerformanceMetrics').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getRateLimitStatus').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getLambdaMetrics').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getErrorMetrics').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getTrendAnalysis').mockResolvedValue({});
        jest.spyOn(dashboard as any, 'getPredictionAnalysis').mockResolvedValue({});

        const start = Date.now();
        await dashboard.getDashboardMetrics();
        const duration = Date.now() - start;

        // Should complete within 2 seconds
        expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent monitoring operations efficiently', async () => {
        const monitoring = new ProactiveMonitoringService();

        // Mock CloudWatch to return quickly
        mockCloudWatchClient.send.mockResolvedValue({ Datapoints: [] });

        const operations = [
            (monitoring as any).monitorLambdaErrors(),
            (monitoring as any).monitorRateLimits(),
            (monitoring as any).monitorPublishingFailures(),
            (monitoring as any).monitorAnalyticsSyncFailures(),
            (monitoring as any).monitorBusinessMetrics()
        ];

        const start = Date.now();
        await Promise.all(operations);
        const duration = Date.now() - start;

        // All operations should complete within 1 second when mocked
        expect(duration).toBeLessThan(1000);
    });
});