/**
 * API Gateway Configuration for Microservices Architecture
 * 
 * This module provides configuration and utilities for interacting with
 * the API Gateway endpoints for different service boundaries.
 */

export interface ApiGatewayConfig {
    mainApiUrl: string;
    aiServiceApiUrl: string;
    integrationServiceApiUrl: string;
    backgroundServiceApiUrl: string;
    adminServiceApiUrl: string;
    region: string;
    stage: string;
}

export interface ServiceEndpoints {
    main: string;
    ai: string;
    integration: string;
    background: string;
    admin: string;
}

/**
 * Get API Gateway configuration based on environment
 */
export function getApiGatewayConfig(): ApiGatewayConfig {
    const environment = process.env.NODE_ENV || 'development';
    const region = process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1';

    // In development, use local endpoints or fallback to deployed APIs
    if (environment === 'development' && process.env.USE_LOCAL_AWS === 'true') {
        return {
            mainApiUrl: 'http://localhost:3000/api',
            aiServiceApiUrl: 'http://localhost:3000/api/ai',
            integrationServiceApiUrl: 'http://localhost:3000/api/integration',
            backgroundServiceApiUrl: 'http://localhost:3000/api/background',
            adminServiceApiUrl: 'http://localhost:3000/api/admin',
            region,
            stage: environment,
        };
    }

    // Use environment variables for deployed API Gateway endpoints
    return {
        mainApiUrl: process.env.MAIN_API_URL || `https://${process.env.MAIN_REST_API_ID}.execute-api.${region}.amazonaws.com/${environment}`,
        aiServiceApiUrl: process.env.AI_SERVICE_API_URL || `https://${process.env.AI_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        integrationServiceApiUrl: process.env.INTEGRATION_SERVICE_API_URL || `https://${process.env.INTEGRATION_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        backgroundServiceApiUrl: process.env.BACKGROUND_SERVICE_API_URL || `https://${process.env.BACKGROUND_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        adminServiceApiUrl: process.env.ADMIN_SERVICE_API_URL || `https://${process.env.ADMIN_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        region,
        stage: environment === 'production' ? 'production' : 'development',
    };
}

/**
 * Get service endpoints for different microservices
 */
export function getServiceEndpoints(): ServiceEndpoints {
    const config = getApiGatewayConfig();

    return {
        main: config.mainApiUrl,
        ai: config.aiServiceApiUrl,
        integration: config.integrationServiceApiUrl,
        background: config.backgroundServiceApiUrl,
        admin: config.adminServiceApiUrl,
    };
}

/**
 * API Gateway request/response transformation utilities
 */
export interface ApiGatewayRequest {
    httpMethod: string;
    path: string;
    pathParameters?: Record<string, string>;
    queryStringParameters?: Record<string, string>;
    headers?: Record<string, string>;
    body?: string;
    requestContext: {
        requestId: string;
        identity: {
            sourceIp: string;
            userAgent?: string;
        };
        authorizer?: {
            claims?: Record<string, any>;
        };
    };
}

export interface ApiGatewayResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
    isBase64Encoded?: boolean;
}

/**
 * Create a standardized API Gateway response
 */
export function createApiGatewayResponse(
    statusCode: number,
    data: any,
    headers: Record<string, string> = {}
): ApiGatewayResponse {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
            ? 'https://yourdomain.com'
            : 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Trace-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        ...headers,
    };

    let body: string;

    if (statusCode >= 400) {
        // Error response format
        body = JSON.stringify({
            error: {
                code: getErrorCode(statusCode),
                message: typeof data === 'string' ? data : data.message || 'An error occurred',
                details: typeof data === 'object' && data !== null ? data : undefined,
                traceId: headers['X-Trace-Id'] || generateTraceId(),
            },
        });
    } else {
        // Success response format
        body = JSON.stringify({
            success: true,
            data: data,
            traceId: headers['X-Trace-Id'] || generateTraceId(),
        });
    }

    return {
        statusCode,
        headers: defaultHeaders,
        body,
    };
}

/**
 * Parse API Gateway request body
 */
export function parseRequestBody<T = any>(event: ApiGatewayRequest): T | null {
    if (!event.body) {
        return null;
    }

    try {
        return JSON.parse(event.body) as T;
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}

/**
 * Extract user information from API Gateway request context
 */
export function extractUserFromRequest(event: ApiGatewayRequest): {
    userId?: string;
    email?: string;
    roles?: string[];
} {
    const claims = event.requestContext.authorizer?.claims;

    if (!claims) {
        return {};
    }

    return {
        userId: claims.sub,
        email: claims.email,
        roles: claims['custom:roles'] ? JSON.parse(claims['custom:roles']) : [],
    };
}

/**
 * Validate API Gateway request parameters
 */
export function validateRequestParameters(
    event: ApiGatewayRequest,
    requiredParams: string[] = [],
    requiredQueryParams: string[] = []
): void {
    // Validate path parameters
    for (const param of requiredParams) {
        if (!event.pathParameters?.[param]) {
            throw new Error(`Missing required path parameter: ${param}`);
        }
    }

    // Validate query parameters
    for (const param of requiredQueryParams) {
        if (!event.queryStringParameters?.[param]) {
            throw new Error(`Missing required query parameter: ${param}`);
        }
    }
}

/**
 * Get error code from HTTP status code
 */
function getErrorCode(statusCode: number): string {
    switch (statusCode) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 422:
            return 'VALIDATION_ERROR';
        case 429:
            return 'RATE_LIMITED';
        case 500:
            return 'INTERNAL_ERROR';
        case 502:
            return 'BAD_GATEWAY';
        case 503:
            return 'SERVICE_UNAVAILABLE';
        case 504:
            return 'GATEWAY_TIMEOUT';
        default:
            return 'UNKNOWN_ERROR';
    }
}

/**
 * Generate a trace ID for request tracking
 */
function generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * API versioning utilities
 */
export interface ApiVersion {
    version: string;
    deprecated?: boolean;
    deprecationDate?: string;
    supportedUntil?: string;
}

export const API_VERSIONS: Record<string, ApiVersion> = {
    'v1': {
        version: '1.0.0',
        deprecated: false,
    },
    'v2': {
        version: '2.0.0',
        deprecated: false,
    },
};

/**
 * Get API version from request
 */
export function getApiVersion(event: ApiGatewayRequest): string {
    // Check path for version (e.g., /v1/users)
    const pathVersion = event.path.match(/^\/v(\d+)\//)?.[1];
    if (pathVersion) {
        return `v${pathVersion}`;
    }

    // Check headers for version
    const headerVersion = event.headers?.['API-Version'] || event.headers?.['api-version'];
    if (headerVersion) {
        return headerVersion;
    }

    // Default to v1
    return 'v1';
}

/**
 * Validate API version
 */
export function validateApiVersion(version: string): void {
    const apiVersion = API_VERSIONS[version];

    if (!apiVersion) {
        throw new Error(`Unsupported API version: ${version}`);
    }

    if (apiVersion.deprecated) {
        console.warn(`API version ${version} is deprecated. Support ends on ${apiVersion.supportedUntil}`);
    }
}

/**
 * Service health check utilities
 */
export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    dependencies?: Record<string, 'healthy' | 'unhealthy'>;
    metrics?: Record<string, number>;
}

/**
 * Create a health check response
 */
export function createHealthCheckResponse(
    service: string,
    status: 'healthy' | 'unhealthy' | 'degraded',
    dependencies: Record<string, 'healthy' | 'unhealthy'> = {},
    metrics: Record<string, number> = {}
): HealthCheckResult {
    return {
        service,
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies,
        metrics,
    };
}