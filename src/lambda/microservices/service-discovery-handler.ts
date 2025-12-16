/**
 * Service Discovery Lambda Handler
 * 
 * Provides REST API endpoints for service discovery operations
 * including service registration, lookup, heartbeat updates, and health monitoring.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { ServiceDiscoveryClient, ServiceRegistration, ServiceQuery } from './service-discovery';
import { createLogger, createMetricsPublisher, createPerformanceMonitor } from './monitoring-setup';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'service-discovery',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'Service discovery and registry for microservices',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

/**
 * Service Discovery Handler Implementation
 */
class ServiceDiscoveryHandler extends BaseLambdaHandler {
    private discoveryClient: ServiceDiscoveryClient;
    private logger: any;
    private metricsPublisher: any;
    private performanceMonitor: any;

    constructor() {
        super(SERVICE_CONFIG);
        this.discoveryClient = ServiceDiscoveryClient.getInstance();
        this.logger = createLogger(SERVICE_CONFIG.serviceName, SERVICE_CONFIG.version);
        this.metricsPublisher = createMetricsPublisher(SERVICE_CONFIG.serviceName);
        this.performanceMonitor = createPerformanceMonitor(SERVICE_CONFIG.serviceName);
    }

    /**
     * Handle incoming API requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const startTime = this.performanceMonitor.startRequest();
        const { httpMethod, path, body, queryStringParameters } = event;
        const routeKey = `${httpMethod} ${path}`;

        this.logger.info('Processing service discovery request', {
            method: httpMethod,
            path,
            routeKey,
        });

        try {
            let response: ApiResponse;

            switch (routeKey) {
                case 'POST /services':
                    response = await this.registerService(body);
                    break;

                case 'GET /services':
                    response = await this.discoverServices(queryStringParameters || {});
                    break;

                case 'GET /services/stats':
                    response = await this.getRegistryStats();
                    break;

                case 'PUT /services/heartbeat':
                    response = await this.updateHeartbeat(body);
                    break;

                case 'DELETE /services':
                    response = await this.unregisterService(queryStringParameters || {});
                    break;

                case 'GET /health':
                    response = await this.healthCheck();
                    break;

                default:
                    response = this.createErrorResponseData('ROUTE_NOT_FOUND', 'Endpoint not found', 404);
            }

            this.performanceMonitor.endRequest(startTime, true);
            return response;

        } catch (error) {
            this.logger.error('Service discovery request failed', error);
            this.performanceMonitor.endRequest(startTime, false);

            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                error instanceof Error ? error.message : 'Internal server error',
                500
            );
        }
    }

    /**
     * Register a new service
     */
    private async registerService(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const registration = JSON.parse(body) as Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>;

            // Validate required fields
            if (!registration.serviceId || !registration.serviceName || !registration.version) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'serviceId, serviceName, and version are required',
                    400
                );
            }

            await this.executeWithCircuitBreaker('register-service', async () => {
                await this.discoveryClient.registerService(registration);
            });

            this.logger.info('Service registered successfully', {
                serviceId: registration.serviceId,
                serviceName: registration.serviceName,
                version: registration.version,
            });

            // Publish metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'ServiceRegistrations',
                value: 1,
                unit: 'Count',
                dimensions: {
                    ServiceName: registration.serviceName,
                },
            });

            return this.createSuccessResponse({
                message: 'Service registered successfully',
                serviceId: registration.serviceId,
            }, 201);

        } catch (error) {
            this.logger.error('Service registration failed', error);
            return this.createErrorResponseData(
                'REGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Registration failed',
                500
            );
        }
    }

    /**
     * Discover services based on query parameters
     */
    private async discoverServices(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const query: ServiceQuery = {
                serviceName: queryParams.serviceName,
                version: queryParams.version,
                status: queryParams.status as 'healthy' | 'unhealthy' | 'unknown',
                tags: queryParams.tags ? queryParams.tags.split(',') : undefined,
            };

            // Parse metadata if provided
            if (queryParams.metadata) {
                try {
                    query.metadata = JSON.parse(queryParams.metadata);
                } catch (error) {
                    return this.createErrorResponseData('INVALID_METADATA', 'Invalid metadata JSON', 400);
                }
            }

            const services = await this.executeWithCircuitBreaker('discover-services', async () => {
                return await this.discoveryClient.discoverServices(query);
            });

            this.logger.info('Services discovered', {
                query,
                resultCount: services.length,
            });

            // Publish metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'ServiceDiscoveryRequests',
                value: 1,
                unit: 'Count',
            });

            return this.createSuccessResponse({
                services,
                count: services.length,
                query,
            });

        } catch (error) {
            this.logger.error('Service discovery failed', error);
            return this.createErrorResponseData(
                'DISCOVERY_FAILED',
                error instanceof Error ? error.message : 'Discovery failed',
                500
            );
        }
    }

    /**
     * Get service registry statistics
     */
    private async getRegistryStats(): Promise<ApiResponse> {
        try {
            const stats = await this.executeWithCircuitBreaker('get-stats', async () => {
                return await this.discoveryClient.getRegistryStats();
            });

            this.logger.info('Registry stats retrieved', stats);

            return this.createSuccessResponse({
                stats,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            this.logger.error('Failed to get registry stats', error);
            return this.createErrorResponseData(
                'STATS_FAILED',
                error instanceof Error ? error.message : 'Stats retrieval failed',
                500
            );
        }
    }

    /**
     * Update service heartbeat
     */
    private async updateHeartbeat(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const params = JSON.parse(body);
            const { serviceName, version, serviceId, status } = params;

            if (!serviceName || !version || !serviceId) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'serviceName, version, and serviceId are required',
                    400
                );
            }

            await this.executeWithCircuitBreaker('update-heartbeat', async () => {
                await this.discoveryClient.updateHeartbeat(serviceName, version, serviceId, status);
            });

            this.logger.info('Heartbeat updated', {
                serviceName,
                version,
                serviceId,
                status,
            });

            // Publish metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'ServiceHeartbeats',
                value: 1,
                unit: 'Count',
                dimensions: {
                    ServiceName: serviceName,
                    Status: status || 'healthy',
                },
            });

            return this.createSuccessResponse({
                message: 'Heartbeat updated successfully',
                serviceName,
                serviceId,
                status: status || 'healthy',
            });

        } catch (error) {
            this.logger.error('Heartbeat update failed', error);
            return this.createErrorResponseData(
                'HEARTBEAT_FAILED',
                error instanceof Error ? error.message : 'Heartbeat update failed',
                500
            );
        }
    }

    /**
     * Unregister a service
     */
    private async unregisterService(queryParams: Record<string, string>): Promise<ApiResponse> {
        const { serviceName, version, serviceId } = queryParams;

        if (!serviceName || !version || !serviceId) {
            return this.createErrorResponseData(
                'VALIDATION_ERROR',
                'serviceName, version, and serviceId are required',
                400
            );
        }

        try {
            await this.executeWithCircuitBreaker('unregister-service', async () => {
                await this.discoveryClient.unregisterService(serviceName, version, serviceId);
            });

            this.logger.info('Service unregistered', {
                serviceName,
                version,
                serviceId,
            });

            // Publish metrics
            await this.metricsPublisher.publishMetric({
                metricName: 'ServiceUnregistrations',
                value: 1,
                unit: 'Count',
                dimensions: {
                    ServiceName: serviceName,
                },
            });

            return this.createSuccessResponse({
                message: 'Service unregistered successfully',
                serviceName,
                serviceId,
            });

        } catch (error) {
            this.logger.error('Service unregistration failed', error);
            return this.createErrorResponseData(
                'UNREGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Unregistration failed',
                500
            );
        }
    }

    /**
     * Health check endpoint
     */
    private async healthCheck(): Promise<ApiResponse> {
        try {
            // Check DynamoDB connectivity
            const stats = await this.discoveryClient.getRegistryStats();

            const healthData = {
                status: 'healthy',
                service: SERVICE_CONFIG.serviceName,
                version: SERVICE_CONFIG.version,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                registryStats: {
                    totalServices: stats.totalServices,
                    healthyServices: stats.healthyServices,
                },
            };

            this.logger.info('Health check passed', healthData);

            return this.createSuccessResponse(healthData);

        } catch (error) {
            this.logger.error('Health check failed', error);

            const healthData = {
                status: 'unhealthy',
                service: SERVICE_CONFIG.serviceName,
                version: SERVICE_CONFIG.version,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Health check failed',
            };

            return this.createSuccessResponse(healthData, 503);
        }
    }
}

// Create handler instance
const handlerInstance = new ServiceDiscoveryHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    return handlerInstance.lambdaHandler(event, context);
};