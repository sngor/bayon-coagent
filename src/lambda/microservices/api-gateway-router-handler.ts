/**
 * API Gateway Router Lambda Handler
 * 
 * Routes incoming API Gateway requests to appropriate microservices
 * with authentication, rate limiting, and monitoring capabilities.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { ApiGatewayRouter } from './api-gateway-config';
import { createLogger, createMetricsPublisher, createPerformanceMonitor } from './monitoring-setup';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'api-gateway-router',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'Routes API Gateway requests to appropriate microservices',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

/**
 * API Gateway Router Handler Implementation
 */
class ApiGatewayRouterHandler extends BaseLambdaHandler {
    private router: ApiGatewayRouter;
    private logger: any;
    private metricsPublisher: any;
    private performanceMonitor: any;

    constructor() {
        super(SERVICE_CONFIG);
        this.router = new ApiGatewayRouter();
        this.logger = createLogger(SERVICE_CONFIG.serviceName, SERVICE_CONFIG.version);
        this.metricsPublisher = createMetricsPublisher(SERVICE_CONFIG.serviceName);
        this.performanceMonitor = createPerformanceMonitor(SERVICE_CONFIG.serviceName);
    }

    /**
     * Handle incoming API Gateway requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const startTime = this.performanceMonitor.startRequest();
        const { httpMethod, path } = event;

        this.logger.info('Processing API Gateway request', {
            method: httpMethod,
            path,
            userAgent: event.headers['User-Agent'],
            sourceIp: event.requestContext.identity.sourceIp,
        });

        try {
            // Route the request through the API Gateway router
            const result = await this.executeWithCircuitBreaker('route-request', async () => {
                return await this.router.routeRequest(event);
            });

            // Convert APIGatewayProxyResult to ApiResponse format
            const response: ApiResponse = {
                statusCode: result.statusCode,
                body: JSON.parse(result.body || '{}'),
            };

            this.performanceMonitor.endRequest(startTime, result.statusCode < 400);

            // Publish routing metrics
            await this.publishRoutingMetrics(httpMethod, path, result.statusCode);

            this.logger.info('Request routed successfully', {
                method: httpMethod,
                path,
                statusCode: result.statusCode,
                targetService: result.headers?.['X-Route-Service'],
                duration: result.headers?.['X-Route-Duration'],
            });

            return response;

        } catch (error) {
            this.performanceMonitor.endRequest(startTime, false);
            this.logger.error('Request routing failed', error);

            // Publish error metrics
            await this.publishRoutingMetrics(httpMethod, path, 500, true);

            return this.createErrorResponseData(
                'ROUTING_FAILED',
                error instanceof Error ? error.message : 'Request routing failed',
                500
            );
        }
    }

    /**
     * Publish routing metrics to CloudWatch
     */
    private async publishRoutingMetrics(
        method: string,
        path: string,
        statusCode: number,
        isError: boolean = false
    ): Promise<void> {
        try {
            const metrics = [
                {
                    metricName: 'RequestCount',
                    value: 1,
                    unit: 'Count' as const,
                    dimensions: {
                        Method: method,
                        Path: this.normalizePath(path),
                    },
                },
                {
                    metricName: 'ResponseCode',
                    value: 1,
                    unit: 'Count' as const,
                    dimensions: {
                        StatusCode: statusCode.toString(),
                        Method: method,
                    },
                },
            ];

            if (isError) {
                metrics.push({
                    metricName: 'ErrorCount',
                    value: 1,
                    unit: 'Count' as const,
                    dimensions: {
                        Method: method,
                        Path: this.normalizePath(path),
                    },
                });
            }

            await this.metricsPublisher.publishMetrics(metrics);
        } catch (error) {
            this.logger.warn('Failed to publish routing metrics', { error });
        }
    }

    /**
     * Normalize path for metrics (remove dynamic segments)
     */
    private normalizePath(path: string): string {
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{id}') // UUIDs
            .replace(/\/\d+/g, '/{id}') // Numeric IDs
            .replace(/\/[^\/]+@[^\/]+/g, '/{email}') // Email addresses
            .substring(0, 100); // Limit length for CloudWatch
    }
}

// Create handler instance
const handlerInstance = new ApiGatewayRouterHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    return handlerInstance.lambdaHandler(event, context);
};