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
    // All services now use /v1 prefix for API versioning
    return {
        mainApiUrl: process.env.MAIN_API_URL || `https://${process.env.MAIN_REST_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        aiServiceApiUrl: process.env.AI_SERVICE_API_URL || `https://${process.env.AI_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        integrationServiceApiUrl: process.env.INTEGRATION_SERVICE_API_URL || `https://${process.env.INTEGRATION_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        backgroundServiceApiUrl: process.env.BACKGROUND_SERVICE_API_URL || `https://${process.env.BACKGROUND_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        adminServiceApiUrl: process.env.ADMIN_SERVICE_API_URL || `https://${process.env.ADMIN_SERVICE_API_ID}.execute-api.${region}.amazonaws.com/v1`,
        region,
        stage: 'v1', // All services use v1 stage for versioning
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
 * Create a standardized API Gateway response with version headers
 */
export function createApiGatewayResponse(
    statusCode: number,
    data: any,
    headers: Record<string, string> = {},
    version: string = 'v1'
): ApiGatewayResponse {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
            ? 'https://yourdomain.com'
            : 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Trace-Id,API-Version,X-API-Version',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'API-Version,X-API-Version,X-API-Version-Number,X-API-Deprecated,X-API-Sunset',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        ...headers,
    };

    // Add version headers
    const headersWithVersion = addVersionHeaders(defaultHeaders, version);

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
        headers: headersWithVersion,
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
    releaseDate: string;
    breaking?: boolean;
    features?: string[];
}

export const API_VERSIONS: Record<string, ApiVersion> = {
    'v1': {
        version: '1.0.0',
        deprecated: false,
        releaseDate: '2024-01-01',
        breaking: false,
        features: [
            'Initial microservices architecture',
            'AI processing service',
            'Integration service',
            'Background processing service',
            'Admin service',
        ],
    },
    // Future versions can be added here
    // 'v2': {
    //     version: '2.0.0',
    //     deprecated: false,
    //     releaseDate: '2025-01-01',
    //     breaking: true,
    //     features: ['New feature set'],
    // },
};

/**
 * Get API version from request
 * Supports both path-based (/v1/resource) and header-based (API-Version: v1) versioning
 */
export function getApiVersion(event: ApiGatewayRequest): string {
    // Priority 1: Check path for version (e.g., /v1/users)
    const pathVersion = event.path.match(/^\/v(\d+)\//)?.[1];
    if (pathVersion) {
        return `v${pathVersion}`;
    }

    // Priority 2: Check headers for version (case-insensitive)
    const headers = event.headers || {};
    const headerVersion =
        headers['API-Version'] ||
        headers['api-version'] ||
        headers['X-API-Version'] ||
        headers['x-api-version'];

    if (headerVersion) {
        // Normalize version format (ensure it starts with 'v')
        return headerVersion.startsWith('v') ? headerVersion : `v${headerVersion}`;
    }

    // Priority 3: Check query parameter for version
    const queryVersion = event.queryStringParameters?.version || event.queryStringParameters?.api_version;
    if (queryVersion) {
        return queryVersion.startsWith('v') ? queryVersion : `v${queryVersion}`;
    }

    // Default to v1
    return 'v1';
}

/**
 * Validate API version and return validation result
 */
export function validateApiVersion(version: string): {
    valid: boolean;
    deprecated: boolean;
    message?: string;
    apiVersion?: ApiVersion;
} {
    const apiVersion = API_VERSIONS[version];

    if (!apiVersion) {
        return {
            valid: false,
            deprecated: false,
            message: `Unsupported API version: ${version}. Supported versions: ${Object.keys(API_VERSIONS).join(', ')}`,
        };
    }

    if (apiVersion.deprecated) {
        return {
            valid: true,
            deprecated: true,
            message: `API version ${version} is deprecated. Support ends on ${apiVersion.supportedUntil}. Please migrate to a newer version.`,
            apiVersion,
        };
    }

    return {
        valid: true,
        deprecated: false,
        apiVersion,
    };
}

/**
 * Add version headers to API Gateway response
 */
export function addVersionHeaders(
    headers: Record<string, string>,
    version: string
): Record<string, string> {
    const apiVersion = API_VERSIONS[version];

    const versionHeaders: Record<string, string> = {
        'API-Version': version,
        'X-API-Version': version,
        ...headers,
    };

    if (apiVersion) {
        versionHeaders['X-API-Version-Number'] = apiVersion.version;
        versionHeaders['X-API-Release-Date'] = apiVersion.releaseDate;

        if (apiVersion.deprecated) {
            versionHeaders['X-API-Deprecated'] = 'true';
            if (apiVersion.supportedUntil) {
                versionHeaders['X-API-Sunset'] = apiVersion.supportedUntil;
            }
            if (apiVersion.deprecationDate) {
                versionHeaders['X-API-Deprecation-Date'] = apiVersion.deprecationDate;
            }
        }
    }

    return versionHeaders;
}

/**
 * Get all supported API versions
 */
export function getSupportedVersions(): string[] {
    return Object.keys(API_VERSIONS);
}

/**
 * Get latest API version
 */
export function getLatestVersion(): string {
    const versions = Object.keys(API_VERSIONS);
    return versions[versions.length - 1];
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