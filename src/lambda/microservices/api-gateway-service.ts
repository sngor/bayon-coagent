/**
 * API Gateway Service
 * 
 * Provides centralized routing, authentication, and rate limiting
 * for microservices architecture.
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { ServiceDiscoveryClient } from './service-discovery';
import { CircuitBreakerRegistry } from '../utils/circuit-breaker';
import { retry } from '../utils/retry';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'api-gateway-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'API Gateway service for routing, authentication, and rate limiting',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Initialize DynamoDB client
function createDynamoClient(): DynamoDBDocumentClient {
    let dynamoClient: DynamoDBClient;
    try {
        dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        }));
    } catch (error) {
        dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    return DynamoDBDocumentClient.from(dynamoClient);
}

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent-development';

// Route configuration interface
interface RouteConfig {
    routeId: string;
    path: string;
    method: string;
    serviceName: string;
    targetPath?: string;
    authentication: AuthenticationConfig;
    rateLimit?: RateLimitConfig;
    timeout?: number;
    retries?: number;
    circuitBreaker?: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

// Authentication configuration
interface AuthenticationConfig {
    type: 'none' | 'api-key' | 'jwt' | 'iam' | 'cognito';
    required: boolean;
    config?: {
        headerName?: string;
        userPoolId?: string;
        clientId?: string;
        issuer?: string;
        audience?: string;
    };
}

// Rate limit configuration
interface RateLimitConfig {
    requestsPerSecond: number;
    burstLimit: number;
    windowSizeSeconds?: number;
}

// Rate limit state
interface RateLimitState {
    key: string;
    requestCount: number;
    windowStart: number;
    lastRequest: number;
}

// Request routing context
interface RoutingContext {
    route: RouteConfig;
    userId?: string;
    apiKey?: string;
    correlationId: string;
    startTime: number;
}

/**
 * API Gateway Service Handler
 */
class ApiGatewayServiceHandler extends BaseLambdaHandler {
    private docClient: DynamoDBDocumentClient;
    private serviceDiscovery: ServiceDiscoveryClient;
    private circuitBreakerRegistry: CircuitBreakerRegistry;
    private rateLimitCache: Map<string, RateLimitState> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
        this.docClient = createDynamoClient();
        this.serviceDiscovery = ServiceDiscoveryClient.getInstance();
        this.circuitBreakerRegistry = new CircuitBreakerRegistry();
    }

    /**
     * Handle incoming API requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path, body, headers } = event;
        const correlationId = this.getCorrelationId(event);

        this.logger.info('Processing API Gateway request', {
            method: httpMethod,
            path,
            correlationId,
        });

        try {
            // Check if this is a management request for the API Gateway itself
            if (path.startsWith('/api-gateway/')) {
                return this.handleManagementRequest(event, context);
            }

            // Find matching route
            const route = await this.findMatchingRoute(httpMethod, path);
            if (!route) {
                return this.createErrorResponseData('ROUTE_NOT_FOUND', 'No matching route found', 404);
            }

            // Create routing context
            const routingContext: RoutingContext = {
                route,
                correlationId,
                startTime: Date.now(),
            };

            // Authenticate request
            const authResult = await this.authenticateRequest(event, route.authentication);
            if (!authResult.success) {
                return this.createErrorResponseData('AUTHENTICATION_FAILED', authResult.error || 'Authentication failed', 401);
            }
            routingContext.userId = authResult.userId;
            routingContext.apiKey = authResult.apiKey;

            // Check rate limits
            const rateLimitResult = await this.checkRateLimit(routingContext);
            if (!rateLimitResult.allowed) {
                return this.createErrorResponseData('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, {
                    retryAfter: rateLimitResult.retryAfter,
                });
            }

            // Route request to target service
            const response = await this.routeRequest(event, routingContext);

            this.logger.info('Request routed successfully', {
                correlationId,
                serviceName: route.serviceName,
                duration: Date.now() - routingContext.startTime,
            });

            return response;

        } catch (error) {
            this.logger.error('API Gateway request failed', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                error instanceof Error ? error.message : 'Internal server error',
                500
            );
        }
    }

    /**
     * Handle management requests for the API Gateway service itself
     */
    private async handleManagementRequest(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path, body } = event;
        const managementPath = path.replace('/api-gateway', '');
        const routeKey = `${httpMethod} ${managementPath}`;

        switch (routeKey) {
            case 'POST /routes':
                return this.createRoute(body);

            case 'GET /routes':
                return this.listRoutes(event.queryStringParameters || {});

            case 'GET /routes/{id}':
                return this.getRoute(event.pathParameters?.id);

            case 'PUT /routes/{id}':
                return this.updateRoute(event.pathParameters?.id, body);

            case 'DELETE /routes/{id}':
                return this.deleteRoute(event.pathParameters?.id);

            case 'GET /stats':
                return this.getGatewayStats();

            case 'GET /health':
                return this.createHealthCheckResponse();

            default:
                return this.createErrorResponseData('ROUTE_NOT_FOUND', 'Management endpoint not found', 404);
        }
    }

    /**
     * Create a new route
     */
    private async createRoute(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const routeData = JSON.parse(body);

            if (!routeData.path || !routeData.method || !routeData.serviceName) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'path, method, and serviceName are required',
                    400
                );
            }

            const routeId = `${routeData.method}-${routeData.path.replace(/\//g, '-')}`;
            const now = new Date().toISOString();

            const route: RouteConfig = {
                routeId,
                path: routeData.path,
                method: routeData.method.toUpperCase(),
                serviceName: routeData.serviceName,
                targetPath: routeData.targetPath || routeData.path,
                authentication: routeData.authentication || { type: 'none', required: false },
                rateLimit: routeData.rateLimit,
                timeout: routeData.timeout || 30000,
                retries: routeData.retries || 3,
                circuitBreaker: routeData.circuitBreaker !== false,
                metadata: routeData.metadata || {},
                createdAt: now,
                updatedAt: now,
            };

            // Store in DynamoDB
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `API_ROUTE#${routeId}`,
                    SK: 'CONFIG',
                    EntityType: 'API_ROUTE_CONFIG',
                    GSI1PK: `SERVICE#${route.serviceName}`,
                    GSI1SK: `ROUTE#${routeId}`,
                    ...route,
                    TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
                },
            }));

            this.logger.info('Route created', {
                routeId,
                path: route.path,
                method: route.method,
                serviceName: route.serviceName,
            });

            return this.createSuccessResponse({
                routeId,
                message: 'Route created successfully',
            }, 201);

        } catch (error) {
            this.logger.error('Failed to create route', error);
            return this.createErrorResponseData(
                'CREATION_FAILED',
                error instanceof Error ? error.message : 'Route creation failed',
                500
            );
        }
    }

    /**
     * List routes
     */
    private async listRoutes(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const serviceName = queryParams.serviceName;
            let params: any;

            if (serviceName) {
                // Query by service name using GSI1
                params = {
                    TableName: TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `SERVICE#${serviceName}`,
                    },
                };
            } else {
                // Scan all routes
                params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'EntityType = :entityType',
                    ExpressionAttributeValues: {
                        ':entityType': 'API_ROUTE_CONFIG',
                    },
                };
            }

            const command = new QueryCommand(params);
            const result = await this.docClient.send(command);

            const routes = (result.Items || []) as RouteConfig[];

            this.logger.info('Routes listed', {
                count: routes.length,
                serviceName,
            });

            return this.createSuccessResponse({
                routes,
                count: routes.length,
            });

        } catch (error) {
            this.logger.error('Failed to list routes', error);
            return this.createErrorResponseData(
                'LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list routes',
                500
            );
        }
    }

    /**
     * Get a specific route
     */
    private async getRoute(routeId: string | undefined): Promise<ApiResponse> {
        if (!routeId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Route ID is required', 400);
        }

        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `API_ROUTE#${routeId}`,
                    SK: 'CONFIG',
                },
            }));

            if (!result.Item) {
                return this.createErrorResponseData('NOT_FOUND', 'Route not found', 404);
            }

            const route = result.Item as RouteConfig;

            this.logger.info('Route retrieved', {
                routeId,
                path: route.path,
                method: route.method,
            });

            return this.createSuccessResponse(route);

        } catch (error) {
            this.logger.error('Failed to get route', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get route',
                500
            );
        }
    }

    /**
     * Update a route
     */
    private async updateRoute(routeId: string | undefined, body: string | null): Promise<ApiResponse> {
        if (!routeId || !body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Route ID and request body are required', 400);
        }

        try {
            const updateData = JSON.parse(body);
            const now = new Date().toISOString();

            // Build update expression
            const updateExpressions: string[] = [];
            const expressionAttributeValues: Record<string, any> = {};
            const expressionAttributeNames: Record<string, string> = {};

            if (updateData.serviceName) {
                updateExpressions.push('serviceName = :serviceName');
                expressionAttributeValues[':serviceName'] = updateData.serviceName;
            }

            if (updateData.targetPath) {
                updateExpressions.push('targetPath = :targetPath');
                expressionAttributeValues[':targetPath'] = updateData.targetPath;
            }

            if (updateData.authentication) {
                updateExpressions.push('authentication = :authentication');
                expressionAttributeValues[':authentication'] = updateData.authentication;
            }

            if (updateData.rateLimit) {
                updateExpressions.push('rateLimit = :rateLimit');
                expressionAttributeValues[':rateLimit'] = updateData.rateLimit;
            }

            if (updateData.timeout) {
                updateExpressions.push('#timeout = :timeout');
                expressionAttributeNames['#timeout'] = 'timeout';
                expressionAttributeValues[':timeout'] = updateData.timeout;
            }

            updateExpressions.push('updatedAt = :updatedAt');
            expressionAttributeValues[':updatedAt'] = now;

            await this.docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `API_ROUTE#${routeId}`,
                    SK: 'CONFIG',
                },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeValues: expressionAttributeValues,
                ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
            }));

            this.logger.info('Route updated', {
                routeId,
                updateFields: Object.keys(updateData),
            });

            return this.createSuccessResponse({
                routeId,
                message: 'Route updated successfully',
            });

        } catch (error) {
            this.logger.error('Failed to update route', error);
            return this.createErrorResponseData(
                'UPDATE_FAILED',
                error instanceof Error ? error.message : 'Failed to update route',
                500
            );
        }
    }

    /**
     * Delete a route
     */
    private async deleteRoute(routeId: string | undefined): Promise<ApiResponse> {
        if (!routeId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Route ID is required', 400);
        }

        try {
            await this.docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `API_ROUTE#${routeId}`,
                    SK: 'CONFIG',
                },
                UpdateExpression: 'SET TTL = :ttl',
                ExpressionAttributeValues: {
                    ':ttl': Math.floor(Date.now() / 1000) + 60, // Delete in 1 minute
                },
            }));

            this.logger.info('Route deleted', { routeId });

            return this.createSuccessResponse({
                routeId,
                message: 'Route deleted successfully',
            });

        } catch (error) {
            this.logger.error('Failed to delete route', error);
            return this.createErrorResponseData(
                'DELETE_FAILED',
                error instanceof Error ? error.message : 'Failed to delete route',
                500
            );
        }
    }

    /**
     * Get gateway statistics
     */
    private async getGatewayStats(): Promise<ApiResponse> {
        try {
            // Get all routes
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'API_ROUTE_CONFIG',
                },
            }));

            const routes = (result.Items || []) as RouteConfig[];

            const stats = {
                totalRoutes: routes.length,
                routesByService: {} as Record<string, number>,
                routesByMethod: {} as Record<string, number>,
                authenticationTypes: {} as Record<string, number>,
                rateLimitedRoutes: routes.filter(r => r.rateLimit).length,
                circuitBreakerEnabledRoutes: routes.filter(r => r.circuitBreaker).length,
            };

            // Count by service and method
            for (const route of routes) {
                stats.routesByService[route.serviceName] = (stats.routesByService[route.serviceName] || 0) + 1;
                stats.routesByMethod[route.method] = (stats.routesByMethod[route.method] || 0) + 1;
                stats.authenticationTypes[route.authentication.type] = (stats.authenticationTypes[route.authentication.type] || 0) + 1;
            }

            this.logger.info('Gateway stats retrieved', {
                totalRoutes: stats.totalRoutes,
            });

            return this.createSuccessResponse(stats);

        } catch (error) {
            this.logger.error('Failed to get gateway stats', error);
            return this.createErrorResponseData(
                'STATS_FAILED',
                error instanceof Error ? error.message : 'Failed to get gateway stats',
                500
            );
        }
    }

    /**
     * Find matching route for request
     */
    private async findMatchingRoute(method: string, path: string): Promise<RouteConfig | null> {
        try {
            // For simplicity, we'll scan all routes and find the best match
            // In production, you'd want more efficient routing with path parameters
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType AND #method = :method',
                ExpressionAttributeNames: {
                    '#method': 'method',
                },
                ExpressionAttributeValues: {
                    ':entityType': 'API_ROUTE_CONFIG',
                    ':method': method.toUpperCase(),
                },
            }));

            const routes = (result.Items || []) as RouteConfig[];

            // Find exact match first
            let matchedRoute = routes.find(route => route.path === path);

            // If no exact match, try pattern matching (simplified)
            if (!matchedRoute) {
                matchedRoute = routes.find(route => {
                    // Simple wildcard matching - replace with proper path matching in production
                    const pattern = route.path.replace(/\{[^}]+\}/g, '[^/]+');
                    const regex = new RegExp(`^${pattern}$`);
                    return regex.test(path);
                });
            }

            return matchedRoute || null;

        } catch (error) {
            this.logger.error('Failed to find matching route', error);
            return null;
        }
    }

    /**
     * Authenticate request
     */
    private async authenticateRequest(event: APIGatewayProxyEvent, authConfig: AuthenticationConfig): Promise<{
        success: boolean;
        userId?: string;
        apiKey?: string;
        error?: string;
    }> {
        if (!authConfig.required || authConfig.type === 'none') {
            return { success: true };
        }

        try {
            switch (authConfig.type) {
                case 'api-key':
                    return this.authenticateApiKey(event, authConfig);

                case 'jwt':
                    return this.authenticateJWT(event, authConfig);

                case 'cognito':
                    return this.authenticateCognito(event, authConfig);

                case 'iam':
                    return this.authenticateIAM(event, authConfig);

                default:
                    return { success: false, error: 'Unsupported authentication type' };
            }

        } catch (error) {
            this.logger.error('Authentication failed', error);
            return { success: false, error: 'Authentication error' };
        }
    }

    /**
     * Authenticate using API key
     */
    private async authenticateApiKey(event: APIGatewayProxyEvent, authConfig: AuthenticationConfig): Promise<{
        success: boolean;
        userId?: string;
        apiKey?: string;
        error?: string;
    }> {
        const headerName = authConfig.config?.headerName || 'X-API-Key';
        const apiKey = event.headers[headerName] || event.headers[headerName.toLowerCase()];

        if (!apiKey) {
            return { success: false, error: 'API key required' };
        }

        // In production, validate API key against database
        // For now, just check if it's present and not empty
        if (apiKey.length < 10) {
            return { success: false, error: 'Invalid API key' };
        }

        return { success: true, apiKey, userId: 'api-key-user' };
    }

    /**
     * Authenticate using JWT
     */
    private async authenticateJWT(event: APIGatewayProxyEvent, authConfig: AuthenticationConfig): Promise<{
        success: boolean;
        userId?: string;
        error?: string;
    }> {
        const authHeader = event.headers.Authorization || event.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, error: 'Bearer token required' };
        }

        const token = authHeader.substring(7);

        // In production, validate JWT token
        // For now, just check if it's present and looks like a JWT
        if (token.split('.').length !== 3) {
            return { success: false, error: 'Invalid JWT token' };
        }

        return { success: true, userId: 'jwt-user' };
    }

    /**
     * Authenticate using Cognito
     */
    private async authenticateCognito(event: APIGatewayProxyEvent, authConfig: AuthenticationConfig): Promise<{
        success: boolean;
        userId?: string;
        error?: string;
    }> {
        // Check if Cognito authorizer context is available
        const authContext = event.requestContext.authorizer;

        if (!authContext || !('principalId' in authContext)) {
            return { success: false, error: 'Cognito authentication required' };
        }

        return { success: true, userId: authContext.principalId as string };
    }

    /**
     * Authenticate using IAM
     */
    private async authenticateIAM(event: APIGatewayProxyEvent, authConfig: AuthenticationConfig): Promise<{
        success: boolean;
        userId?: string;
        error?: string;
    }> {
        // Check for AWS signature headers
        const authHeader = event.headers.Authorization || event.headers.authorization;

        if (!authHeader || !authHeader.includes('AWS4-HMAC-SHA256')) {
            return { success: false, error: 'AWS IAM signature required' };
        }

        return { success: true, userId: 'iam-user' };
    }

    /**
     * Check rate limits
     */
    private async checkRateLimit(context: RoutingContext): Promise<{
        allowed: boolean;
        retryAfter?: number;
    }> {
        if (!context.route.rateLimit) {
            return { allowed: true };
        }

        const { requestsPerSecond, burstLimit, windowSizeSeconds = 60 } = context.route.rateLimit;
        const rateLimitKey = `${context.route.routeId}:${context.userId || context.apiKey || 'anonymous'}`;

        const now = Date.now();
        const windowStart = Math.floor(now / (windowSizeSeconds * 1000)) * (windowSizeSeconds * 1000);

        let rateLimitState = this.rateLimitCache.get(rateLimitKey);

        if (!rateLimitState || rateLimitState.windowStart !== windowStart) {
            // New window
            rateLimitState = {
                key: rateLimitKey,
                requestCount: 0,
                windowStart,
                lastRequest: now,
            };
        }

        rateLimitState.requestCount++;
        rateLimitState.lastRequest = now;

        // Check limits
        const maxRequests = Math.min(requestsPerSecond * windowSizeSeconds, burstLimit);

        if (rateLimitState.requestCount > maxRequests) {
            const retryAfter = Math.ceil((windowStart + (windowSizeSeconds * 1000) - now) / 1000);
            return { allowed: false, retryAfter };
        }

        // Update cache
        this.rateLimitCache.set(rateLimitKey, rateLimitState);

        // Clean up old entries periodically
        if (this.rateLimitCache.size > 10000) {
            this.cleanupRateLimitCache();
        }

        return { allowed: true };
    }

    /**
     * Clean up old rate limit cache entries
     */
    private cleanupRateLimitCache(): void {
        const now = Date.now();
        const cutoff = now - (5 * 60 * 1000); // 5 minutes ago

        for (const [key, state] of this.rateLimitCache.entries()) {
            if (state.lastRequest < cutoff) {
                this.rateLimitCache.delete(key);
            }
        }
    }

    /**
     * Route request to target service
     */
    private async routeRequest(event: APIGatewayProxyEvent, context: RoutingContext): Promise<ApiResponse> {
        const { route } = context;

        try {
            // Get service endpoint
            const serviceEndpoint = await this.serviceDiscovery.getServiceEndpoint(route.serviceName);

            if (!serviceEndpoint) {
                return this.createErrorResponseData(
                    'SERVICE_UNAVAILABLE',
                    `Service ${route.serviceName} is not available`,
                    503
                );
            }

            // Execute with circuit breaker if enabled
            if (route.circuitBreaker) {
                return await this.executeWithCircuitBreaker(
                    `${route.serviceName}-${route.method}-${route.path}`,
                    () => this.forwardRequest(event, context, serviceEndpoint)
                );
            } else {
                return await this.forwardRequest(event, context, serviceEndpoint);
            }

        } catch (error) {
            this.logger.error('Request routing failed', error);
            return this.createErrorResponseData(
                'ROUTING_FAILED',
                error instanceof Error ? error.message : 'Request routing failed',
                500
            );
        }
    }

    /**
     * Forward request to target service
     */
    private async forwardRequest(
        event: APIGatewayProxyEvent,
        context: RoutingContext,
        serviceEndpoint: string
    ): Promise<ApiResponse> {
        const { route } = context;

        // In a real implementation, you would make an HTTP request to the service endpoint
        // For this example, we'll simulate the request forwarding

        const targetUrl = `${serviceEndpoint}${route.targetPath || route.path}`;

        this.logger.info('Forwarding request', {
            targetUrl,
            method: route.method,
            correlationId: context.correlationId,
        });

        // Simulate service call with retry
        const response = await retry(
            async () => {
                // Simulate HTTP request to target service
                // In production, use a proper HTTP client like axios or fetch

                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

                // Simulate occasional failures for testing
                if (Math.random() < 0.1) {
                    throw new Error('Simulated service error');
                }

                return {
                    statusCode: 200,
                    data: {
                        message: 'Request forwarded successfully',
                        service: route.serviceName,
                        path: route.targetPath || route.path,
                        method: route.method,
                        correlationId: context.correlationId,
                        timestamp: new Date().toISOString(),
                    },
                };
            },
            {
                maxAttempts: route.retries || 3,
                initialDelayMs: 100,
                onRetry: (error, attempt, delayMs) => {
                    this.logger.warn('Retrying service request', {
                        service: route.serviceName,
                        attempt,
                        error: error.message,
                        delayMs,
                    });
                },
            }
        );

        return this.createSuccessResponse(response.data, response.statusCode);
    }
}

// Create handler instance
const handlerInstance = new ApiGatewayServiceHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    return handlerInstance.lambdaHandler(event, context);
};