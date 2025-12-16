/**
 * Base Lambda Function Template for Microservices
 * 
 * This template provides common utilities and patterns for all microservice Lambda functions
 * including error handling, logging, tracing, and service discovery integration.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as AWSXRay from 'aws-xray-sdk-core';
import { publishEvent, EventSource } from '../utils/eventbridge-client';
import { circuitBreakerRegistry } from '../utils/circuit-breaker';
import { retry } from '../utils/retry';

// Service metadata interface
export interface ServiceMetadata {
    serviceName: string;
    version: string;
    description: string;
    healthCheckPath: string;
}

// Standard API response interface
export interface ApiResponse<T = any> {
    statusCode: number;
    body: {
        success: boolean;
        data?: T;
        error?: {
            code: string;
            message: string;
            details?: any;
        };
        metadata: {
            requestId: string;
            timestamp: string;
            service: string;
            version: string;
            traceId?: string;
        };
    };
}

// Service configuration interface
export interface ServiceConfig {
    serviceName: string;
    version: string;
    description: string;
    enableTracing?: boolean;
    enableCircuitBreaker?: boolean;
    enableRetry?: boolean;
    healthCheckEnabled?: boolean;
}

/**
 * Base Lambda handler class for microservices
 */
export abstract class BaseLambdaHandler {
    protected readonly config: ServiceConfig;
    protected readonly logger: Console;

    constructor(config: ServiceConfig) {
        this.config = config;
        this.logger = console;

        // Initialize X-Ray tracing if enabled
        if (config.enableTracing !== false) {
            this.initializeTracing();
        }
    }

    /**
     * Initialize X-Ray tracing
     */
    private initializeTracing(): void {
        try {
            if (process.env.XRAY_TRACING_ENABLED === 'true') {
                AWSXRay.captureAWS(require('aws-sdk'));
                AWSXRay.captureHTTPsGlobal(require('http'));
                AWSXRay.captureHTTPsGlobal(require('https'));
            }
        } catch (error) {
            this.logger.warn('Failed to initialize X-Ray tracing:', error);
        }
    }

    /**
     * Main handler method - to be implemented by subclasses
     */
    abstract handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse>;

    /**
     * Lambda entry point with common error handling and logging
     */
    public async lambdaHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const startTime = Date.now();
        const requestId = context.awsRequestId;
        const traceId = process.env._X_AMZN_TRACE_ID;

        // Log request start
        this.logger.info('Request started', {
            requestId,
            traceId,
            service: this.config.serviceName,
            method: event.httpMethod,
            path: event.path,
            userAgent: event.headers['User-Agent'],
        });

        try {
            // Handle the request
            const response = await this.handle(event, context);

            // Add standard metadata
            response.body.metadata = {
                requestId,
                timestamp: new Date().toISOString(),
                service: this.config.serviceName,
                version: this.config.version,
                traceId,
            };

            // Log successful response
            const duration = Date.now() - startTime;
            this.logger.info('Request completed successfully', {
                requestId,
                traceId,
                statusCode: response.statusCode,
                duration,
            });

            return {
                statusCode: response.statusCode,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    'X-Service-Name': this.config.serviceName,
                    'X-Service-Version': this.config.version,
                    ...(traceId && { 'X-Trace-ID': traceId }),
                },
                body: JSON.stringify(response.body),
            };

        } catch (error) {
            // Log error
            const duration = Date.now() - startTime;
            this.logger.error('Request failed', {
                requestId,
                traceId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                duration,
            });

            // Return error response
            return this.createErrorResponse(error, requestId, traceId);
        }
    }

    /**
     * Create standardized error response
     */
    private createErrorResponse(error: unknown, requestId: string, traceId?: string): APIGatewayProxyResult {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = this.getErrorStatusCode(error);

        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Service-Name': this.config.serviceName,
                'X-Service-Version': this.config.version,
                ...(traceId && { 'X-Trace-ID': traceId }),
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: this.getErrorCode(error),
                    message: errorMessage,
                },
                metadata: {
                    requestId,
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                    version: this.config.version,
                    traceId,
                },
            }),
        };
    }

    /**
     * Get HTTP status code from error
     */
    private getErrorStatusCode(error: unknown): number {
        if (error instanceof Error) {
            // Check for specific error types
            if ('statusCode' in error && typeof error.statusCode === 'number') {
                return error.statusCode;
            }

            // Map common error types to status codes
            if (error.message.includes('not found')) return 404;
            if (error.message.includes('unauthorized')) return 401;
            if (error.message.includes('forbidden')) return 403;
            if (error.message.includes('validation')) return 400;
            if (error.message.includes('timeout')) return 408;
        }

        return 500; // Internal server error
    }

    /**
     * Get error code from error
     */
    private getErrorCode(error: unknown): string {
        if (error instanceof Error) {
            if ('code' in error && typeof error.code === 'string') {
                return error.code;
            }

            // Generate code from error type
            return error.constructor.name.toUpperCase();
        }

        return 'UNKNOWN_ERROR';
    }

    /**
     * Create success response
     */
    protected createSuccessResponse<T>(data: T, statusCode: number = 200): ApiResponse<T> {
        return {
            statusCode,
            body: {
                success: true,
                data,
                metadata: {
                    requestId: '', // Will be set by lambdaHandler
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                    version: this.config.version,
                },
            },
        };
    }

    /**
     * Create error response
     */
    protected createErrorResponseData(code: string, message: string, statusCode: number = 500, details?: any): ApiResponse {
        return {
            statusCode,
            body: {
                success: false,
                error: {
                    code,
                    message,
                    details,
                },
                metadata: {
                    requestId: '', // Will be set by lambdaHandler
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                    version: this.config.version,
                },
            },
        };
    }

    /**
     * Execute with circuit breaker protection
     */
    protected async executeWithCircuitBreaker<T>(
        operationName: string,
        operation: () => Promise<T>
    ): Promise<T> {
        if (!this.config.enableCircuitBreaker) {
            return operation();
        }

        const circuitBreaker = circuitBreakerRegistry.getOrCreate(
            `${this.config.serviceName}-${operationName}`,
            {
                failureThreshold: 5,
                recoveryTimeoutMs: 60000,
                onOpen: (error) => {
                    this.logger.warn(`Circuit breaker opened for ${operationName}`, { error: error.message });
                },
                onClose: () => {
                    this.logger.info(`Circuit breaker closed for ${operationName}`);
                },
            }
        );

        return circuitBreaker.execute(operation);
    }

    /**
     * Execute with retry logic
     */
    protected async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxAttempts: number = 3
    ): Promise<T> {
        if (!this.config.enableRetry) {
            return operation();
        }

        return retry(operation, {
            maxAttempts,
            initialDelayMs: 100,
            onRetry: (error, attempt, delayMs) => {
                this.logger.warn(`Retrying operation (attempt ${attempt})`, {
                    error: error.message,
                    delayMs,
                });
            },
        });
    }

    /**
     * Publish service event
     */
    protected async publishServiceEvent(
        eventSource: EventSource,
        detailType: string,
        detail: any
    ): Promise<void> {
        try {
            const traceId = process.env._X_AMZN_TRACE_ID;
            await publishEvent(eventSource, detailType as any, {
                ...detail,
                service: this.config.serviceName,
                version: this.config.version,
                traceId,
            });
        } catch (error) {
            this.logger.warn('Failed to publish service event', {
                eventSource,
                detailType,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Health check handler
     */
    protected createHealthCheckResponse(): ApiResponse {
        return this.createSuccessResponse({
            status: 'healthy',
            service: this.config.serviceName,
            version: this.config.version,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        });
    }

    /**
     * Validate request body against schema
     */
    protected validateRequestBody<T>(event: APIGatewayProxyEvent, validator: (data: any) => T): T {
        if (!event.body) {
            throw new Error('Request body is required');
        }

        let parsedBody: any;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (error) {
            throw new Error('Invalid JSON in request body');
        }

        try {
            return validator(parsedBody);
        } catch (error) {
            throw new Error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extract user ID from event (assuming JWT token in Authorization header)
     */
    protected extractUserId(event: APIGatewayProxyEvent): string {
        // This would typically extract from JWT token or Cognito authorizer context
        // For now, return a placeholder - implement based on your auth strategy
        const authContext = event.requestContext.authorizer;
        if (authContext && 'principalId' in authContext) {
            return authContext.principalId as string;
        }

        throw new Error('User not authenticated');
    }

    /**
     * Get request correlation ID for distributed tracing
     */
    protected getCorrelationId(event: APIGatewayProxyEvent): string {
        return event.headers['X-Correlation-ID'] ||
            event.headers['x-correlation-id'] ||
            event.requestContext.requestId;
    }
}

/**
 * Create a Lambda handler function from a handler class
 */
export function createLambdaHandler(handlerClass: new () => BaseLambdaHandler) {
    const handler = new handlerClass();
    return handler.lambdaHandler.bind(handler);
}

/**
 * Service registry client for service discovery
 */
export class ServiceRegistryClient {
    private static instance: ServiceRegistryClient;
    private services: Map<string, ServiceMetadata> = new Map();

    private constructor() { }

    public static getInstance(): ServiceRegistryClient {
        if (!ServiceRegistryClient.instance) {
            ServiceRegistryClient.instance = new ServiceRegistryClient();
        }
        return ServiceRegistryClient.instance;
    }

    /**
     * Register a service
     */
    public registerService(metadata: ServiceMetadata): void {
        this.services.set(metadata.serviceName, metadata);
        console.log(`Service registered: ${metadata.serviceName} v${metadata.version}`);
    }

    /**
     * Get service metadata
     */
    public getService(serviceName: string): ServiceMetadata | undefined {
        return this.services.get(serviceName);
    }

    /**
     * Get all registered services
     */
    public getAllServices(): ServiceMetadata[] {
        return Array.from(this.services.values());
    }

    /**
     * Check if service is registered
     */
    public isServiceRegistered(serviceName: string): boolean {
        return this.services.has(serviceName);
    }
}