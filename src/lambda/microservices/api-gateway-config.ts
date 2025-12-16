/**
 * API Gateway Configuration for Microservices Routing
 * 
 * This module provides configuration and utilities for setting up API Gateway
 * to route requests to appropriate microservices with authentication, rate limiting,
 * and monitoring capabilities.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceDiscoveryClient } from './service-discovery';

// Route configuration interface
export interface RouteConfig {
    path: string;
    method: string;
    serviceName: string;
    serviceVersion?: string;
    authentication: AuthConfig;
    rateLimit?: RateLimitConfig;
    timeout?: number;
    retries?: number;
    caching?: CacheConfig;
}

// Authentication configuration
export interface AuthConfig {
    type: 'none' | 'cognito' | 'iam' | 'api-key' | 'custom';
    required: boolean;
    scopes?: string[];
    roles?: string[];
}

// Rate limiting configuration
export interface RateLimitConfig {
    requestsPerSecond: number;
    burstLimit: number;
    keyType: 'ip' | 'user' | 'api-key';
}

// Caching configuration
export interface CacheConfig {
    enabled: boolean;
    ttlSeconds: number;
    keyParameters?: string[];
    varyByHeaders?: string[];
}

// Service routing table
export const MICROSERVICE_ROUTES: RouteConfig[] = [
    // Content Generation Services
    {
        path: '/api/v1/content/blog',
        method: 'POST',
        serviceName: 'blog-generation-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 10, burstLimit: 20, keyType: 'user' },
        timeout: 30000,
        retries: 2,
    },
    {
        path: '/api/v1/content/social',
        method: 'POST',
        serviceName: 'social-media-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 15, burstLimit: 30, keyType: 'user' },
        timeout: 20000,
        retries: 2,
    },
    {
        path: '/api/v1/content/listing',
        method: 'POST',
        serviceName: 'listing-description-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 20, burstLimit: 40, keyType: 'user' },
        timeout: 15000,
        retries: 2,
    },

    // Research and Analysis Services
    {
        path: '/api/v1/research/agent',
        method: 'POST',
        serviceName: 'research-agent-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 5, burstLimit: 10, keyType: 'user' },
        timeout: 60000,
        retries: 1,
    },
    {
        path: '/api/v1/research/competitor',
        method: 'POST',
        serviceName: 'competitor-analysis-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 3, burstLimit: 6, keyType: 'user' },
        timeout: 45000,
        retries: 1,
    },
    {
        path: '/api/v1/research/market',
        method: 'POST',
        serviceName: 'market-intelligence-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 5, burstLimit: 10, keyType: 'user' },
        timeout: 30000,
        retries: 2,
    },

    // Brand Management Services
    {
        path: '/api/v1/brand/audit',
        method: 'POST',
        serviceName: 'brand-audit-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 2, burstLimit: 4, keyType: 'user' },
        timeout: 60000,
        retries: 1,
    },
    {
        path: '/api/v1/brand/monitoring',
        method: 'GET',
        serviceName: 'reputation-monitoring-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 10, burstLimit: 20, keyType: 'user' },
        caching: { enabled: true, ttlSeconds: 300, keyParameters: ['userId'] },
    },

    // Integration Services
    {
        path: '/api/v1/integration/google',
        method: 'POST',
        serviceName: 'google-integration-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 5, burstLimit: 10, keyType: 'user' },
        timeout: 30000,
        retries: 2,
    },
    {
        path: '/api/v1/integration/social',
        method: 'POST',
        serviceName: 'social-media-integration-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 8, burstLimit: 16, keyType: 'user' },
        timeout: 25000,
        retries: 2,
    },

    // Notification Services
    {
        path: '/api/v1/notifications/send',
        method: 'POST',
        serviceName: 'notification-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 20, burstLimit: 50, keyType: 'user' },
        timeout: 10000,
        retries: 3,
    },

    // File Storage Services
    {
        path: '/api/v1/files/upload',
        method: 'POST',
        serviceName: 'file-upload-service',
        authentication: { type: 'cognito', required: true },
        rateLimit: { requestsPerSecond: 5, burstLimit: 10, keyType: 'user' },
        timeout: 60000,
        retries: 1,
    },

    // Administrative Services
    {
        path: '/api/v1/admin/users',
        method: 'GET',
        serviceName: 'user-management-service',
        authentication: { type: 'cognito', required: true, roles: ['admin'] },
        rateLimit: { requestsPerSecond: 10, burstLimit: 20, keyType: 'user' },
    },
    {
        path: '/api/v1/admin/health',
        method: 'GET',
        serviceName: 'health-check-service',
        authentication: { type: 'iam', required: true },
        rateLimit: { requestsPerSecond: 50, burstLimit: 100, keyType: 'ip' },
        caching: { enabled: true, ttlSeconds: 60 },
    },

    // Service Discovery
    {
        path: '/api/v1/services',
        method: 'GET',
        serviceName: 'service-discovery',
        authentication: { type: 'iam', required: true },
        rateLimit: { requestsPerSecond: 20, burstLimit: 40, keyType: 'ip' },
    },
];

/**
 * API Gateway Router
 * Routes incoming requests to appropriate microservices
 */
export class ApiGatewayRouter {
    private serviceDiscovery: ServiceDiscoveryClient;
    private routeCache: Map<string, RouteConfig> = new Map();

    constructor() {
        this.serviceDiscovery = ServiceDiscoveryClient.getInstance();
        this.buildRouteCache();
    }

    /**
     * Build route cache for fast lookup
     */
    private buildRouteCache(): void {
        for (const route of MICROSERVICE_ROUTES) {
            const key = `${route.method}:${route.path}`;
            this.routeCache.set(key, route);
        }
    }

    /**
     * Route incoming API Gateway request
     */
    public async routeRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        const startTime = Date.now();
        const requestId = event.requestContext.requestId;
        const method = event.httpMethod;
        const path = event.path;
        const routeKey = `${method}:${path}`;

        console.log('Routing request', {
            requestId,
            method,
            path,
            routeKey,
        });

        try {
            // Find matching route
            const route = this.findMatchingRoute(method, path);
            if (!route) {
                return this.createErrorResponse(404, 'Route not found', requestId);
            }

            // Validate authentication
            const authResult = await this.validateAuthentication(event, route);
            if (!authResult.valid) {
                return this.createErrorResponse(401, authResult.error || 'Authentication failed', requestId);
            }

            // Check rate limits
            const rateLimitResult = await this.checkRateLimit(event, route);
            if (!rateLimitResult.allowed) {
                return this.createErrorResponse(429, 'Rate limit exceeded', requestId);
            }

            // Check cache
            if (route.caching?.enabled && method === 'GET') {
                const cachedResponse = await this.getCachedResponse(event, route);
                if (cachedResponse) {
                    return cachedResponse;
                }
            }

            // Get service endpoint
            const serviceEndpoint = await this.serviceDiscovery.getServiceEndpoint(route.serviceName);
            if (!serviceEndpoint) {
                return this.createErrorResponse(503, 'Service unavailable', requestId);
            }

            // Forward request to microservice
            const response = await this.forwardRequest(event, route, serviceEndpoint);

            // Cache response if applicable
            if (route.caching?.enabled && method === 'GET' && response.statusCode === 200) {
                await this.cacheResponse(event, route, response);
            }

            // Add routing metadata
            response.headers = {
                ...response.headers,
                'X-Route-Service': route.serviceName,
                'X-Route-Duration': String(Date.now() - startTime),
                'X-Request-ID': requestId,
            };

            return response;

        } catch (error) {
            console.error('Request routing failed', {
                requestId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });

            return this.createErrorResponse(500, 'Internal server error', requestId);
        }
    }

    /**
     * Find matching route configuration
     */
    private findMatchingRoute(method: string, path: string): RouteConfig | null {
        // First try exact match
        const exactKey = `${method}:${path}`;
        const exactMatch = this.routeCache.get(exactKey);
        if (exactMatch) {
            return exactMatch;
        }

        // Try pattern matching for parameterized routes
        for (const route of MICROSERVICE_ROUTES) {
            if (route.method === method && this.pathMatches(route.path, path)) {
                return route;
            }
        }

        return null;
    }

    /**
     * Check if path matches route pattern
     */
    private pathMatches(routePath: string, requestPath: string): boolean {
        // Convert route path to regex pattern
        const pattern = routePath
            .replace(/\{[^}]+\}/g, '[^/]+') // Replace {param} with regex
            .replace(/\*/g, '.*'); // Replace * with regex

        const regex = new RegExp(`^${pattern}$`);
        return regex.test(requestPath);
    }

    /**
     * Validate request authentication
     */
    private async validateAuthentication(event: APIGatewayProxyEvent, route: RouteConfig): Promise<{ valid: boolean; error?: string }> {
        if (!route.authentication.required) {
            return { valid: true };
        }

        switch (route.authentication.type) {
            case 'cognito':
                return this.validateCognitoAuth(event, route);
            case 'iam':
                return this.validateIamAuth(event, route);
            case 'api-key':
                return this.validateApiKeyAuth(event, route);
            case 'custom':
                return this.validateCustomAuth(event, route);
            default:
                return { valid: false, error: 'Unknown authentication type' };
        }
    }

    private validateCognitoAuth(event: APIGatewayProxyEvent, route: RouteConfig): { valid: boolean; error?: string } {
        const authContext = event.requestContext.authorizer;
        if (!authContext || !authContext.principalId) {
            return { valid: false, error: 'Missing Cognito authentication' };
        }

        // Check roles if specified
        if (route.authentication.roles && route.authentication.roles.length > 0) {
            const userRoles = authContext.claims?.['custom:role']?.split(',') || [];
            const hasRequiredRole = route.authentication.roles.some(role => userRoles.includes(role));
            if (!hasRequiredRole) {
                return { valid: false, error: 'Insufficient permissions' };
            }
        }

        return { valid: true };
    }

    private validateIamAuth(event: APIGatewayProxyEvent, route: RouteConfig): { valid: boolean; error?: string } {
        // IAM authentication is handled by API Gateway
        // If we reach here, the request has already been authenticated
        return { valid: true };
    }

    private validateApiKeyAuth(event: APIGatewayProxyEvent, route: RouteConfig): { valid: boolean; error?: string } {
        const apiKey = event.headers['X-API-Key'] || event.headers['x-api-key'];
        if (!apiKey) {
            return { valid: false, error: 'Missing API key' };
        }

        // In production, validate API key against database
        // For now, just check if it exists
        return { valid: true };
    }

    private validateCustomAuth(event: APIGatewayProxyEvent, route: RouteConfig): { valid: boolean; error?: string } {
        // Custom authentication logic would go here
        return { valid: true };
    }

    /**
     * Check rate limits
     */
    private async checkRateLimit(event: APIGatewayProxyEvent, route: RouteConfig): Promise<{ allowed: boolean; error?: string }> {
        if (!route.rateLimit) {
            return { allowed: true };
        }

        // In production, implement rate limiting using DynamoDB or Redis
        // For now, always allow
        return { allowed: true };
    }

    /**
     * Get cached response
     */
    private async getCachedResponse(event: APIGatewayProxyEvent, route: RouteConfig): Promise<APIGatewayProxyResult | null> {
        // In production, implement caching using ElastiCache or DynamoDB
        // For now, no caching
        return null;
    }

    /**
     * Cache response
     */
    private async cacheResponse(event: APIGatewayProxyEvent, route: RouteConfig, response: APIGatewayProxyResult): Promise<void> {
        // In production, implement response caching
        // For now, no-op
    }

    /**
     * Forward request to microservice
     */
    private async forwardRequest(event: APIGatewayProxyEvent, route: RouteConfig, serviceEndpoint: string): Promise<APIGatewayProxyResult> {
        // In production, make HTTP request to the microservice
        // For now, return a mock response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Request forwarded to ${route.serviceName}`,
                service: route.serviceName,
                endpoint: serviceEndpoint,
                timestamp: new Date().toISOString(),
            }),
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(statusCode: number, message: string, requestId: string): APIGatewayProxyResult {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
            },
            body: JSON.stringify({
                error: {
                    code: statusCode,
                    message,
                },
                requestId,
                timestamp: new Date().toISOString(),
            }),
        };
    }
}

/**
 * API Gateway Lambda handler
 */
export const apiGatewayHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const router = new ApiGatewayRouter();
    return router.routeRequest(event);
};