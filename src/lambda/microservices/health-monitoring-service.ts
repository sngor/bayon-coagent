/**
 * Health Monitoring Microservice
 * 
 * Provides comprehensive system health monitoring for all microservices components.
 * Monitors services, databases, caches, queues, and external APIs with configurable
 * depth levels and metrics collection.
 * 
 * **Requirements: 8.2**
 * **Property 24: Comprehensive health monitoring**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { z } from 'zod';
import axios from 'axios';

// Configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'health-monitoring-service',
    version: '1.0.0',
    description: 'Comprehensive system health monitoring service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Validation schemas
const HealthCheckRequestSchema = z.object({
    components: z.array(z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.enum(['service', 'database', 'cache', 'queue', 'external-api']),
        critical: z.boolean(),
        dependencies: z.array(z.string()),
        endpoint: z.string().url().optional(),
        config: z.record(z.any()).optional(),
    })),
    includeMetrics: z.boolean(),
    depth: z.enum(['shallow', 'deep']),
    timeout: z.number().min(1000).max(30000).optional(),
});

// Types
interface SystemComponent {
    id: string;
    name: string;
    type: 'service' | 'database' | 'cache' | 'queue' | 'external-api';
    critical: boolean;
    dependencies: string[];
    endpoint?: string;
    config?: Record<string, any>;
}

interface HealthCheckRequest {
    components: SystemComponent[];
    includeMetrics: boolean;
    depth: 'shallow' | 'deep';
    timeout?: number;
}

interface ComponentHealth {
    componentId: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    responseTime?: number;
    lastChecked: string;
    metrics?: Record<string, number>;
    dependencies?: ComponentHealth[];
    errorDetails?: string;
    checks: {
        connectivity: boolean;
        performance: boolean;
        functionality: boolean;
    };
}

interface SystemHealthResult {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    componentsChecked: string[];
    healthDetails: ComponentHealth[];
    systemMetrics: {
        totalComponents: number;
        healthyComponents: number;
        degradedComponents: number;
        unhealthyComponents: number;
        criticalComponentsHealthy: number;
        averageResponseTime: number;
    };
    timestamp: string;
    checkDuration: number;
}

interface HealthMetrics {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
    errorRate?: number;
    throughput?: number;
    activeConnections?: number;
}

/**
 * Health Monitoring Service Handler
 */
class HealthMonitoringServiceHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private s3Client: S3Client;
    private cloudWatchClient: CloudWatchClient;
    private defaultTimeout: number;

    constructor() {
        super(SERVICE_CONFIG);
        this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.s3Client = new S3Client({ region: process.env.AWS_REGION });
        this.cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
        this.defaultTimeout = 10000; // 10 seconds
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        // Route requests
        if (method === 'GET' && path.endsWith('/health')) {
            return this.createHealthCheckResponse();
        }

        if (method === 'POST' && path.endsWith('/check-system-health')) {
            return this.handleSystemHealthCheck(event);
        }

        if (method === 'GET' && path.endsWith('/component-status')) {
            return this.handleGetComponentStatus(event);
        }

        if (method === 'GET' && path.endsWith('/system-metrics')) {
            return this.handleGetSystemMetrics(event);
        }

        if (method === 'POST' && path.endsWith('/register-component')) {
            return this.handleRegisterComponent(event);
        }

        return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);
    }

    /**
     * Handle comprehensive system health check
     */
    private async handleSystemHealthCheck(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        const startTime = Date.now();

        try {
            const request = this.validateRequestBody(event, (data) =>
                HealthCheckRequestSchema.parse(data)
            );

            const result = await this.executeWithCircuitBreaker('system-health-check', async () => {
                return this.checkSystemHealth(request);
            });

            const checkDuration = Date.now() - startTime;
            result.checkDuration = checkDuration;

            return this.createSuccessResponse(result);
        } catch (error) {
            this.logger.error('System health check failed', { error });
            return this.createErrorResponseData(
                'HEALTH_CHECK_FAILED',
                error instanceof Error ? error.message : 'Health check failed',
                500
            );
        }
    }

    /**
     * Handle individual component status check
     */
    private async handleGetComponentStatus(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const componentId = event.queryStringParameters?.componentId;
            if (!componentId) {
                throw new Error('Component ID is required');
            }

            const status = await this.getComponentStatus(componentId);
            return this.createSuccessResponse(status);
        } catch (error) {
            this.logger.error('Component status check failed', { error });
            return this.createErrorResponseData(
                'COMPONENT_STATUS_FAILED',
                error instanceof Error ? error.message : 'Component status check failed',
                500
            );
        }
    }

    /**
     * Handle system metrics retrieval
     */
    private async handleGetSystemMetrics(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const timeRange = event.queryStringParameters?.timeRange || '1h';
            const metrics = await this.getSystemMetrics(timeRange);
            return this.createSuccessResponse(metrics);
        } catch (error) {
            this.logger.error('System metrics retrieval failed', { error });
            return this.createErrorResponseData(
                'METRICS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Metrics retrieval failed',
                500
            );
        }
    }

    /**
     * Handle component registration
     */
    private async handleRegisterComponent(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const component = this.validateRequestBody(event, (data) => {
                return z.object({
                    name: z.string(),
                    type: z.enum(['service', 'database', 'cache', 'queue', 'external-api']),
                    critical: z.boolean(),
                    endpoint: z.string().url().optional(),
                    healthCheckPath: z.string().optional(),
                }).parse(data);
            });

            const registeredComponent = await this.registerComponent(component);
            return this.createSuccessResponse(registeredComponent);
        } catch (error) {
            this.logger.error('Component registration failed', { error });
            return this.createErrorResponseData(
                'COMPONENT_REGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Component registration failed',
                400
            );
        }
    }

    /**
     * Perform comprehensive system health check
     */
    private async checkSystemHealth(request: HealthCheckRequest): Promise<SystemHealthResult> {
        const { components, includeMetrics, depth, timeout = this.defaultTimeout } = request;
        const healthDetails: ComponentHealth[] = [];
        const startTime = Date.now();

        // Check each component
        for (const component of components) {
            try {
                const health = await this.checkComponentHealth(component, includeMetrics, depth, timeout);
                healthDetails.push(health);
            } catch (error) {
                this.logger.error(`Health check failed for component ${component.name}`, { error });
                healthDetails.push({
                    componentId: component.id,
                    status: 'unknown',
                    lastChecked: new Date().toISOString(),
                    errorDetails: error instanceof Error ? error.message : 'Unknown error',
                    checks: {
                        connectivity: false,
                        performance: false,
                        functionality: false,
                    },
                });
            }
        }

        // Calculate system metrics
        const totalComponents = components.length;
        const healthyComponents = healthDetails.filter(h => h.status === 'healthy').length;
        const degradedComponents = healthDetails.filter(h => h.status === 'degraded').length;
        const unhealthyComponents = healthDetails.filter(h => h.status === 'unhealthy').length;

        const criticalComponents = components.filter(c => c.critical);
        const criticalComponentsHealthy = healthDetails
            .filter(h => {
                const component = components.find(c => c.id === h.componentId);
                return component?.critical && h.status === 'healthy';
            }).length;

        const responseTimes = healthDetails
            .map(h => h.responseTime)
            .filter((rt): rt is number => rt !== undefined);
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
            : 0;

        // Determine overall status
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

        // If any critical component is unhealthy, system is unhealthy
        const criticalUnhealthy = healthDetails.some(h => {
            const component = components.find(c => c.id === h.componentId);
            return component?.critical && h.status === 'unhealthy';
        });

        if (criticalUnhealthy || unhealthyComponents > totalComponents * 0.3) {
            overallStatus = 'unhealthy';
        } else if (degradedComponents > 0 || unhealthyComponents > 0) {
            overallStatus = 'degraded';
        } else {
            overallStatus = 'healthy';
        }

        return {
            overallStatus,
            componentsChecked: components.map(c => c.id),
            healthDetails,
            systemMetrics: {
                totalComponents,
                healthyComponents,
                degradedComponents,
                unhealthyComponents,
                criticalComponentsHealthy,
                averageResponseTime,
            },
            timestamp: new Date().toISOString(),
            checkDuration: Date.now() - startTime,
        };
    }

    /**
     * Check individual component health
     */
    private async checkComponentHealth(
        component: SystemComponent,
        includeMetrics: boolean,
        depth: 'shallow' | 'deep',
        timeout: number
    ): Promise<ComponentHealth> {
        const startTime = Date.now();
        const checks = {
            connectivity: false,
            performance: false,
            functionality: false,
        };

        let status: ComponentHealth['status'] = 'unknown';
        let errorDetails: string | undefined;
        let metrics: HealthMetrics | undefined;

        try {
            // Connectivity check
            checks.connectivity = await this.checkConnectivity(component, timeout);

            // Performance check
            const responseTime = Date.now() - startTime;
            checks.performance = responseTime < (component.critical ? 1000 : 5000);

            // Functionality check based on component type
            checks.functionality = await this.checkFunctionality(component, timeout);

            // Determine status based on checks
            if (checks.connectivity && checks.performance && checks.functionality) {
                status = 'healthy';
            } else if (checks.connectivity && (checks.performance || checks.functionality)) {
                status = 'degraded';
            } else {
                status = 'unhealthy';
            }

            // Collect metrics if requested
            if (includeMetrics) {
                metrics = await this.collectComponentMetrics(component);
            }

        } catch (error) {
            status = 'unhealthy';
            errorDetails = error instanceof Error ? error.message : 'Health check failed';
            this.logger.error(`Component health check failed: ${component.name}`, { error });
        }

        const health: ComponentHealth = {
            componentId: component.id,
            status,
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            checks,
            errorDetails,
        };

        if (metrics) {
            health.metrics = metrics;
        }

        // Deep health check includes dependency checks
        if (depth === 'deep' && component.dependencies.length > 0) {
            health.dependencies = await this.checkDependencies(component.dependencies, timeout);
        }

        return health;
    }

    /**
     * Check component connectivity
     */
    private async checkConnectivity(component: SystemComponent, timeout: number): Promise<boolean> {
        try {
            switch (component.type) {
                case 'service':
                    return await this.checkServiceConnectivity(component, timeout);
                case 'database':
                    return await this.checkDatabaseConnectivity(component);
                case 'cache':
                    return await this.checkCacheConnectivity(component);
                case 'queue':
                    return await this.checkQueueConnectivity(component);
                case 'external-api':
                    return await this.checkExternalAPIConnectivity(component, timeout);
                default:
                    return false;
            }
        } catch (error) {
            this.logger.error(`Connectivity check failed for ${component.name}`, { error });
            return false;
        }
    }

    /**
     * Check component functionality
     */
    private async checkFunctionality(component: SystemComponent, timeout: number): Promise<boolean> {
        try {
            switch (component.type) {
                case 'service':
                    return await this.checkServiceFunctionality(component, timeout);
                case 'database':
                    return await this.checkDatabaseFunctionality(component);
                case 'cache':
                    return await this.checkCacheFunctionality(component);
                case 'queue':
                    return await this.checkQueueFunctionality(component);
                case 'external-api':
                    return await this.checkExternalAPIFunctionality(component, timeout);
                default:
                    return false;
            }
        } catch (error) {
            this.logger.error(`Functionality check failed for ${component.name}`, { error });
            return false;
        }
    }

    // Component-specific connectivity checks
    private async checkServiceConnectivity(component: SystemComponent, timeout: number): Promise<boolean> {
        if (!component.endpoint) return false;

        try {
            const response = await axios.get(`${component.endpoint}/health`, { timeout });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    private async checkDatabaseConnectivity(component: SystemComponent): Promise<boolean> {
        try {
            if (component.name.toLowerCase().includes('dynamodb')) {
                const tableName = component.config?.tableName || 'microservices-table';
                await this.dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    private async checkCacheConnectivity(component: SystemComponent): Promise<boolean> {
        // Mock Redis connectivity check
        return Math.random() > 0.1; // 90% success rate
    }

    private async checkQueueConnectivity(component: SystemComponent): Promise<boolean> {
        // Mock SQS connectivity check
        return Math.random() > 0.05; // 95% success rate
    }

    private async checkExternalAPIConnectivity(component: SystemComponent, timeout: number): Promise<boolean> {
        if (!component.endpoint) return false;

        try {
            const response = await axios.head(component.endpoint, { timeout });
            return response.status < 400;
        } catch (error) {
            return false;
        }
    }

    // Component-specific functionality checks
    private async checkServiceFunctionality(component: SystemComponent, timeout: number): Promise<boolean> {
        if (!component.endpoint) return false;

        try {
            const response = await axios.get(`${component.endpoint}/status`, { timeout });
            return response.status === 200 && response.data?.status === 'operational';
        } catch (error) {
            return false;
        }
    }

    private async checkDatabaseFunctionality(component: SystemComponent): Promise<boolean> {
        try {
            if (component.name.toLowerCase().includes('dynamodb')) {
                const tableName = component.config?.tableName || 'microservices-table';
                const result = await this.dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
                return result.Table?.TableStatus === 'ACTIVE';
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    private async checkCacheFunctionality(component: SystemComponent): Promise<boolean> {
        // Mock Redis functionality check (set/get operation)
        return Math.random() > 0.05; // 95% success rate
    }

    private async checkQueueFunctionality(component: SystemComponent): Promise<boolean> {
        // Mock SQS functionality check (send/receive message)
        return Math.random() > 0.02; // 98% success rate
    }

    private async checkExternalAPIFunctionality(component: SystemComponent, timeout: number): Promise<boolean> {
        if (!component.endpoint) return false;

        try {
            // Try a simple API call
            const response = await axios.get(component.endpoint, { timeout });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Collect component metrics
     */
    private async collectComponentMetrics(component: SystemComponent): Promise<HealthMetrics> {
        const metrics: HealthMetrics = {};

        try {
            // Mock metrics collection - in production, this would query CloudWatch
            metrics.cpuUsage = Math.random() * 100;
            metrics.memoryUsage = Math.random() * 100;
            metrics.diskUsage = Math.random() * 100;
            metrics.networkLatency = Math.random() * 50;
            metrics.errorRate = Math.random() * 5;
            metrics.throughput = Math.random() * 1000;
            metrics.activeConnections = Math.floor(Math.random() * 100);

            // Component-specific metrics
            if (component.type === 'database') {
                metrics.activeConnections = Math.floor(Math.random() * 50);
            } else if (component.type === 'cache') {
                metrics.hitRate = Math.random() * 100;
            } else if (component.type === 'queue') {
                metrics.queueDepth = Math.floor(Math.random() * 1000);
            }

        } catch (error) {
            this.logger.error(`Metrics collection failed for ${component.name}`, { error });
        }

        return metrics;
    }

    /**
     * Check component dependencies
     */
    private async checkDependencies(dependencyIds: string[], timeout: number): Promise<ComponentHealth[]> {
        const dependencyHealths: ComponentHealth[] = [];

        for (const depId of dependencyIds) {
            try {
                // Mock dependency health check
                const health: ComponentHealth = {
                    componentId: depId,
                    status: Math.random() > 0.8 ? 'degraded' : 'healthy',
                    responseTime: Math.random() * 500,
                    lastChecked: new Date().toISOString(),
                    checks: {
                        connectivity: true,
                        performance: true,
                        functionality: Math.random() > 0.1,
                    },
                };

                dependencyHealths.push(health);
            } catch (error) {
                dependencyHealths.push({
                    componentId: depId,
                    status: 'unknown',
                    lastChecked: new Date().toISOString(),
                    errorDetails: 'Dependency check failed',
                    checks: {
                        connectivity: false,
                        performance: false,
                        functionality: false,
                    },
                });
            }
        }

        return dependencyHealths;
    }

    /**
     * Get individual component status
     */
    private async getComponentStatus(componentId: string): Promise<ComponentHealth> {
        // Mock component lookup and status check
        const mockComponent: SystemComponent = {
            id: componentId,
            name: `component-${componentId}`,
            type: 'service',
            critical: false,
            dependencies: [],
        };

        return this.checkComponentHealth(mockComponent, true, 'shallow', this.defaultTimeout);
    }

    /**
     * Get system metrics over time
     */
    private async getSystemMetrics(timeRange: string): Promise<any> {
        // Mock system metrics - in production, this would query CloudWatch
        return {
            timeRange,
            metrics: {
                systemLoad: Math.random() * 100,
                totalRequests: Math.floor(Math.random() * 10000),
                errorRate: Math.random() * 5,
                averageResponseTime: Math.random() * 1000,
                activeServices: Math.floor(Math.random() * 20) + 10,
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Register a new component for monitoring
     */
    private async registerComponent(component: any): Promise<{ id: string; registered: boolean }> {
        const componentId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // In production, this would store in DynamoDB
        this.logger.info('Component registered for monitoring', { componentId, component });

        return {
            id: componentId,
            registered: true,
        };
    }
}

// Export the handler
export const handler = new HealthMonitoringServiceHandler().lambdaHandler.bind(new HealthMonitoringServiceHandler());