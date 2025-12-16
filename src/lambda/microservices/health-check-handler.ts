/**
 * Health Check Lambda Handler
 * 
 * Monitors the health of all microservices and publishes health metrics
 * to CloudWatch for monitoring and alerting.
 */

import { ScheduledEvent, Context } from 'aws-lambda';
import { ServiceDiscoveryClient } from './service-discovery';
import { createLogger, createMetricsPublisher, createHealthChecker } from './monitoring-setup';
import { publishEvent, EventSource } from '../utils/eventbridge-client';

// Service configuration
const SERVICE_NAME = 'health-check-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

/**
 * Health Check Service Implementation
 */
class HealthCheckService {
    private discoveryClient: ServiceDiscoveryClient;
    private logger: any;
    private metricsPublisher: any;
    private healthChecker: any;

    constructor() {
        this.discoveryClient = ServiceDiscoveryClient.getInstance();
        this.logger = createLogger(SERVICE_NAME, SERVICE_VERSION);
        this.metricsPublisher = createMetricsPublisher(SERVICE_NAME);
        this.healthChecker = createHealthChecker(SERVICE_NAME);

        // Register health checks
        this.registerHealthChecks();
    }

    /**
     * Register health check functions
     */
    private registerHealthChecks(): void {
        // DynamoDB connectivity check
        this.healthChecker.registerCheck('dynamodb', async () => {
            try {
                await this.discoveryClient.getRegistryStats();
                return true;
            } catch (error) {
                this.logger.error('DynamoDB health check failed', error);
                return false;
            }
        });

        // Service registry check
        this.healthChecker.registerCheck('service-registry', async () => {
            try {
                const stats = await this.discoveryClient.getRegistryStats();
                return stats.totalServices >= 0; // Basic sanity check
            } catch (error) {
                this.logger.error('Service registry health check failed', error);
                return false;
            }
        });

        // Memory usage check
        this.healthChecker.registerCheck('memory', async () => {
            const memoryUsage = process.memoryUsage();
            const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            return memoryUsagePercent < 90; // Alert if memory usage > 90%
        });
    }

    /**
     * Run comprehensive health checks
     */
    public async runHealthChecks(): Promise<void> {
        this.logger.info('Starting health check cycle');

        try {
            // Run internal health checks
            const healthResult = await this.healthChecker.runHealthChecks();

            // Get service registry statistics
            const registryStats = await this.discoveryClient.getRegistryStats();

            // Check individual service health
            const serviceHealthResults = await this.checkAllServices();

            // Publish health metrics
            await this.publishHealthMetrics(healthResult, registryStats, serviceHealthResults);

            // Publish health events
            await this.publishHealthEvents(healthResult, serviceHealthResults);

            this.logger.info('Health check cycle completed', {
                overallHealth: healthResult.healthy,
                totalServices: registryStats.totalServices,
                healthyServices: registryStats.healthyServices,
                unhealthyServices: registryStats.unhealthyServices,
            });

        } catch (error) {
            this.logger.error('Health check cycle failed', error);

            // Publish error metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'HealthCheckErrors',
                value: 1,
                unit: 'Count',
            });
        }
    }

    /**
     * Check health of all registered services
     */
    private async checkAllServices(): Promise<Array<{ serviceName: string; serviceId: string; healthy: boolean }>> {
        const results: Array<{ serviceName: string; serviceId: string; healthy: boolean }> = [];

        try {
            // Get all registered services
            const allServices = await this.discoveryClient.discoverServices();

            // Check each service
            for (const service of allServices) {
                try {
                    const isHealthy = await this.discoveryClient.checkServiceHealth(
                        service.serviceName,
                        service.version,
                        service.serviceId
                    );

                    results.push({
                        serviceName: service.serviceName,
                        serviceId: service.serviceId,
                        healthy: isHealthy,
                    });

                    this.logger.debug('Service health checked', {
                        serviceName: service.serviceName,
                        serviceId: service.serviceId,
                        healthy: isHealthy,
                    });

                } catch (error) {
                    this.logger.warn('Failed to check service health', {
                        serviceName: service.serviceName,
                        serviceId: service.serviceId,
                        error: error instanceof Error ? error.message : String(error),
                    });

                    results.push({
                        serviceName: service.serviceName,
                        serviceId: service.serviceId,
                        healthy: false,
                    });
                }
            }

        } catch (error) {
            this.logger.error('Failed to get services for health check', error);
        }

        return results;
    }

    /**
     * Publish health metrics to CloudWatch
     */
    private async publishHealthMetrics(
        healthResult: { healthy: boolean; checks: Record<string, boolean> },
        registryStats: any,
        serviceHealthResults: Array<{ serviceName: string; serviceId: string; healthy: boolean }>
    ): Promise<void> {
        try {
            const metrics = [
                // Overall system health
                {
                    metricName: 'SystemHealth',
                    value: healthResult.healthy ? 1 : 0,
                    unit: 'Count' as const,
                },

                // Service registry metrics
                {
                    metricName: 'TotalServices',
                    value: registryStats.totalServices,
                    unit: 'Count' as const,
                },
                {
                    metricName: 'HealthyServices',
                    value: registryStats.healthyServices,
                    unit: 'Count' as const,
                },
                {
                    metricName: 'UnhealthyServices',
                    value: registryStats.unhealthyServices,
                    unit: 'Count' as const,
                },

                // Service availability percentage
                {
                    metricName: 'ServiceAvailability',
                    value: registryStats.totalServices > 0
                        ? (registryStats.healthyServices / registryStats.totalServices) * 100
                        : 100,
                    unit: 'Percent' as const,
                },
            ];

            // Individual health check metrics
            for (const [checkName, result] of Object.entries(healthResult.checks)) {
                metrics.push({
                    metricName: 'HealthCheck',
                    value: result ? 1 : 0,
                    unit: 'Count' as const,
                    dimensions: {
                        CheckName: checkName,
                    },
                });
            }

            // Per-service health metrics
            const serviceHealthCounts: Record<string, { healthy: number; total: number }> = {};

            for (const result of serviceHealthResults) {
                if (!serviceHealthCounts[result.serviceName]) {
                    serviceHealthCounts[result.serviceName] = { healthy: 0, total: 0 };
                }

                serviceHealthCounts[result.serviceName].total++;
                if (result.healthy) {
                    serviceHealthCounts[result.serviceName].healthy++;
                }
            }

            for (const [serviceName, counts] of Object.entries(serviceHealthCounts)) {
                metrics.push({
                    metricName: 'ServiceInstanceHealth',
                    value: counts.total > 0 ? (counts.healthy / counts.total) * 100 : 100,
                    unit: 'Percent' as const,
                    dimensions: {
                        ServiceName: serviceName,
                    },
                });
            }

            await this.metricsPublisher.publishMetrics(metrics);

        } catch (error) {
            this.logger.error('Failed to publish health metrics', error);
        }
    }

    /**
     * Publish health events to EventBridge
     */
    private async publishHealthEvents(
        healthResult: { healthy: boolean; checks: Record<string, boolean> },
        serviceHealthResults: Array<{ serviceName: string; serviceId: string; healthy: boolean }>
    ): Promise<void> {
        try {
            // Publish overall system health event
            await publishEvent(
                EventSource.HEALTH as any,
                'Service Health Check' as any,
                {
                    service: SERVICE_NAME,
                    version: SERVICE_VERSION,
                    overallHealth: healthResult.healthy,
                    checks: healthResult.checks,
                    timestamp: new Date().toISOString(),
                }
            );

            // Publish events for services that changed status
            for (const result of serviceHealthResults) {
                // In a real implementation, you would compare with previous status
                // For now, we'll publish status for all services
                await publishEvent(
                    EventSource.HEALTH as any,
                    'Service Status Changed' as any,
                    {
                        serviceName: result.serviceName,
                        serviceId: result.serviceId,
                        status: result.healthy ? 'healthy' : 'unhealthy',
                        timestamp: new Date().toISOString(),
                    }
                );
            }

        } catch (error) {
            this.logger.warn('Failed to publish health events', error);
        }
    }

    /**
     * Clean up stale service registrations
     */
    public async cleanupStaleServices(): Promise<void> {
        try {
            this.logger.info('Starting stale service cleanup');

            const cleanedCount = await this.discoveryClient.cleanupStaleServices(30); // 30 minutes

            this.logger.info('Stale service cleanup completed', { cleanedCount });

            // Publish cleanup metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'StaleServicesCleanedUp',
                value: cleanedCount,
                unit: 'Count',
            });

        } catch (error) {
            this.logger.error('Stale service cleanup failed', error);
        }
    }
}

// Create service instance
const healthCheckService = new HealthCheckService();

/**
 * Lambda handler for scheduled health checks
 */
export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
    const logger = createLogger(SERVICE_NAME, SERVICE_VERSION);

    logger.info('Health check Lambda invoked', {
        source: event.source,
        time: event.time,
        resources: event.resources,
    });

    try {
        // Run health checks
        await healthCheckService.runHealthChecks();

        // Clean up stale services (run less frequently)
        const currentMinute = new Date().getMinutes();
        if (currentMinute % 15 === 0) { // Every 15 minutes
            await healthCheckService.cleanupStaleServices();
        }

        logger.info('Health check completed successfully');

    } catch (error) {
        logger.error('Health check failed', error);
        throw error; // Let Lambda handle the error
    }
};