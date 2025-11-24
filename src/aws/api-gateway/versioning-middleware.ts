/**
 * API Versioning Middleware for Lambda Functions
 * 
 * This module provides middleware utilities for handling API versioning
 * in Lambda functions, including version extraction, validation, and
 * response formatting.
 */

import {
    ApiGatewayRequest,
    ApiGatewayResponse,
    createApiGatewayResponse,
    getApiVersion,
    validateApiVersion,
    addVersionHeaders,
} from './config';

/**
 * Version handler function type
 */
export type VersionHandler = (
    event: ApiGatewayRequest,
    version: string
) => Promise<ApiGatewayResponse>;

/**
 * Version-specific handlers map
 */
export interface VersionHandlers {
    [version: string]: VersionHandler;
}

/**
 * Middleware options
 */
export interface VersionMiddlewareOptions {
    /**
     * Default version to use if none specified
     */
    defaultVersion?: string;

    /**
     * Whether to allow deprecated versions
     */
    allowDeprecated?: boolean;

    /**
     * Custom error handler for unsupported versions
     */
    onUnsupportedVersion?: (version: string) => ApiGatewayResponse;

    /**
     * Custom warning handler for deprecated versions
     */
    onDeprecatedVersion?: (version: string, message: string) => void;
}

/**
 * Create a versioned Lambda handler
 * 
 * This function wraps version-specific handlers and automatically handles
 * version extraction, validation, and routing.
 * 
 * @example
 * ```typescript
 * export const handler = createVersionedHandler({
 *   v1: async (event, version) => {
 *     // Handle v1 requests
 *     return createApiGatewayResponse(200, { message: 'v1 response' }, {}, version);
 *   },
 *   v2: async (event, version) => {
 *     // Handle v2 requests
 *     return createApiGatewayResponse(200, { message: 'v2 response' }, {}, version);
 *   }
 * });
 * ```
 */
export function createVersionedHandler(
    handlers: VersionHandlers,
    options: VersionMiddlewareOptions = {}
): (event: ApiGatewayRequest) => Promise<ApiGatewayResponse> {
    const {
        defaultVersion = 'v1',
        allowDeprecated = true,
        onUnsupportedVersion,
        onDeprecatedVersion,
    } = options;

    return async (event: ApiGatewayRequest): Promise<ApiGatewayResponse> => {
        try {
            // Extract version from request
            const version = getApiVersion(event) || defaultVersion;

            // Validate version
            const validation = validateApiVersion(version);

            if (!validation.valid) {
                if (onUnsupportedVersion) {
                    return onUnsupportedVersion(version);
                }

                return createApiGatewayResponse(
                    400,
                    {
                        message: validation.message,
                        supportedVersions: Object.keys(handlers),
                    },
                    {},
                    version
                );
            }

            // Check if version is deprecated
            if (validation.deprecated) {
                if (!allowDeprecated) {
                    return createApiGatewayResponse(
                        410,
                        {
                            message: validation.message,
                            latestVersion: Object.keys(handlers).pop(),
                        },
                        {},
                        version
                    );
                }

                // Log deprecation warning
                if (onDeprecatedVersion && validation.message) {
                    onDeprecatedVersion(version, validation.message);
                } else {
                    console.warn(`[API Versioning] ${validation.message}`);
                }
            }

            // Get handler for version
            const handler = handlers[version];

            if (!handler) {
                return createApiGatewayResponse(
                    400,
                    {
                        message: `No handler found for version ${version}`,
                        supportedVersions: Object.keys(handlers),
                    },
                    {},
                    version
                );
            }

            // Execute version-specific handler
            const response = await handler(event, version);

            // Ensure version headers are included
            if (response.headers) {
                response.headers = addVersionHeaders(response.headers, version);
            }

            return response;
        } catch (error: any) {
            console.error('[API Versioning] Error:', error);

            return createApiGatewayResponse(
                500,
                {
                    message: 'Internal server error',
                    details: error.message,
                },
                {},
                defaultVersion
            );
        }
    };
}

/**
 * Version compatibility checker
 * 
 * Checks if a request version is compatible with a minimum required version
 */
export function isVersionCompatible(
    requestVersion: string,
    minimumVersion: string
): boolean {
    const requestNum = parseInt(requestVersion.replace('v', ''), 10);
    const minimumNum = parseInt(minimumVersion.replace('v', ''), 10);

    return requestNum >= minimumNum;
}

/**
 * Version migration helper
 * 
 * Helps migrate data between API versions
 */
export interface VersionMigration<TFrom = any, TTo = any> {
    fromVersion: string;
    toVersion: string;
    migrate: (data: TFrom) => TTo;
}

/**
 * Apply version migrations to data
 */
export function applyMigrations<T = any>(
    data: any,
    fromVersion: string,
    toVersion: string,
    migrations: VersionMigration[]
): T {
    let result = data;

    // Find applicable migrations
    const applicableMigrations = migrations.filter(
        (m) => m.fromVersion === fromVersion && m.toVersion === toVersion
    );

    // Apply migrations in order
    for (const migration of applicableMigrations) {
        result = migration.migrate(result);
    }

    return result as T;
}

/**
 * Version-aware response wrapper
 * 
 * Wraps response data with version-specific formatting
 */
export function createVersionedResponse<T = any>(
    statusCode: number,
    data: T,
    version: string,
    headers: Record<string, string> = {}
): ApiGatewayResponse {
    // Add version-specific formatting here if needed
    // For now, just use the standard response format

    return createApiGatewayResponse(statusCode, data, headers, version);
}

/**
 * Extract version from path
 * 
 * Utility to extract version from API Gateway path parameters
 */
export function extractVersionFromPath(path: string): string | null {
    const match = path.match(/^\/v(\d+)\//);
    return match ? `v${match[1]}` : null;
}

/**
 * Version negotiation
 * 
 * Negotiate the best version based on client preferences and server support
 */
export function negotiateVersion(
    requestedVersions: string[],
    supportedVersions: string[]
): string | null {
    // Try to find exact match first
    for (const requested of requestedVersions) {
        if (supportedVersions.includes(requested)) {
            return requested;
        }
    }

    // Try to find compatible version (highest supported version that's <= requested)
    const requestedNums = requestedVersions.map((v) =>
        parseInt(v.replace('v', ''), 10)
    );
    const supportedNums = supportedVersions.map((v) =>
        parseInt(v.replace('v', ''), 10)
    );

    const maxRequested = Math.max(...requestedNums);
    const compatibleVersions = supportedNums.filter((v) => v <= maxRequested);

    if (compatibleVersions.length > 0) {
        const bestVersion = Math.max(...compatibleVersions);
        return `v${bestVersion}`;
    }

    return null;
}

/**
 * Version deprecation warning middleware
 * 
 * Adds deprecation warnings to responses for deprecated versions
 */
export function addDeprecationWarning(
    response: ApiGatewayResponse,
    version: string
): ApiGatewayResponse {
    const validation = validateApiVersion(version);

    if (validation.deprecated && validation.apiVersion) {
        const headers = response.headers || {};

        headers['Warning'] = `299 - "API version ${version} is deprecated. Support ends on ${validation.apiVersion.supportedUntil}"`;

        return {
            ...response,
            headers,
        };
    }

    return response;
}

/**
 * Version-specific feature flag
 * 
 * Check if a feature is available in a specific version
 */
export interface VersionFeature {
    name: string;
    introducedIn: string;
    deprecatedIn?: string;
    removedIn?: string;
}

export function isFeatureAvailable(
    feature: VersionFeature,
    version: string
): boolean {
    const versionNum = parseInt(version.replace('v', ''), 10);
    const introducedNum = parseInt(feature.introducedIn.replace('v', ''), 10);

    // Feature not yet introduced
    if (versionNum < introducedNum) {
        return false;
    }

    // Feature removed
    if (feature.removedIn) {
        const removedNum = parseInt(feature.removedIn.replace('v', ''), 10);
        if (versionNum >= removedNum) {
            return false;
        }
    }

    return true;
}

/**
 * Version-aware error handler
 * 
 * Format errors according to version-specific requirements
 */
export function createVersionedError(
    statusCode: number,
    error: Error | string,
    version: string,
    additionalDetails?: Record<string, any>
): ApiGatewayResponse {
    const message = typeof error === 'string' ? error : error.message;
    const details = typeof error === 'object' ? { ...error, ...additionalDetails } : additionalDetails;

    return createApiGatewayResponse(
        statusCode,
        {
            message,
            details,
        },
        {},
        version
    );
}
