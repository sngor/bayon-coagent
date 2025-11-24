/**
 * Example Versioned Lambda Handler
 * 
 * This is an example Lambda function that demonstrates how to implement
 * API versioning using the versioning middleware.
 * 
 * This file serves as a template for creating versioned API endpoints.
 */

import {
    ApiGatewayRequest,
    ApiGatewayResponse,
    createApiGatewayResponse,
    parseRequestBody,
    extractUserFromRequest,
} from '../aws/api-gateway/config';

import {
    createVersionedHandler,
    createVersionedResponse,
    isVersionCompatible,
} from '../aws/api-gateway/versioning-middleware';

/**
 * V1 Handler - Initial implementation
 */
async function handleV1Request(
    event: ApiGatewayRequest,
    version: string
): Promise<ApiGatewayResponse> {
    try {
        const user = extractUserFromRequest(event);
        const body = parseRequestBody(event);

        // V1 response format
        const data = {
            message: 'This is a v1 response',
            user: user.userId,
            requestData: body,
            features: ['basic-feature-1', 'basic-feature-2'],
        };

        return createVersionedResponse(200, data, version);
    } catch (error: any) {
        return createApiGatewayResponse(
            500,
            { message: error.message },
            {},
            version
        );
    }
}

/**
 * V2 Handler - Enhanced implementation (example for future)
 * 
 * This demonstrates how to add a new version with enhanced features
 * while maintaining backward compatibility.
 */
async function handleV2Request(
    event: ApiGatewayRequest,
    version: string
): Promise<ApiGatewayResponse> {
    try {
        const user = extractUserFromRequest(event);
        const body = parseRequestBody(event);

        // V2 response format with enhanced features
        const data = {
            message: 'This is a v2 response with enhanced features',
            user: {
                id: user.userId,
                email: user.email,
                roles: user.roles,
            },
            requestData: body,
            features: [
                'basic-feature-1',
                'basic-feature-2',
                'enhanced-feature-1',
                'enhanced-feature-2',
            ],
            metadata: {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
            },
        };

        return createVersionedResponse(200, data, version);
    } catch (error: any) {
        return createApiGatewayResponse(
            500,
            { message: error.message },
            {},
            version
        );
    }
}

/**
 * Main Lambda handler with versioning support
 * 
 * This handler automatically routes requests to the appropriate
 * version-specific handler based on the API version specified
 * in the request.
 */
export const handler = createVersionedHandler(
    {
        v1: handleV1Request,
        // v2: handleV2Request, // Uncomment when v2 is ready
    },
    {
        defaultVersion: 'v1',
        allowDeprecated: true,
        onDeprecatedVersion: (version, message) => {
            console.warn(`[Deprecation Warning] ${message}`);
            // Could also send metrics or notifications here
        },
        onUnsupportedVersion: (version) => {
            return createApiGatewayResponse(
                400,
                {
                    message: `API version ${version} is not supported`,
                    supportedVersions: ['v1'],
                    latestVersion: 'v1',
                    migrationGuide: 'https://docs.example.com/api/migration',
                },
                {},
                'v1'
            );
        },
    }
);

/**
 * Example: Version-specific business logic
 * 
 * This demonstrates how to handle version-specific logic within
 * a single handler if needed.
 */
export async function handleWithVersionLogic(
    event: ApiGatewayRequest
): Promise<ApiGatewayResponse> {
    const version = event.path.match(/^\/v(\d+)\//)?.[1] || '1';

    if (isVersionCompatible(`v${version}`, 'v2')) {
        // Use v2+ features
        return handleV2Request(event, `v${version}`);
    } else {
        // Use v1 features
        return handleV1Request(event, `v${version}`);
    }
}

/**
 * Example: Gradual migration pattern
 * 
 * This demonstrates how to gradually migrate from v1 to v2
 * by supporting both versions simultaneously.
 */
export async function handleGradualMigration(
    event: ApiGatewayRequest,
    version: string
): Promise<ApiGatewayResponse> {
    // Get data using v1 logic
    const v1Data = await getDataV1(event);

    // If v2, enhance the data
    if (version === 'v2') {
        const enhancedData = enhanceDataForV2(v1Data);
        return createVersionedResponse(200, enhancedData, version);
    }

    // Return v1 format
    return createVersionedResponse(200, v1Data, version);
}

// Helper functions for gradual migration example
async function getDataV1(event: ApiGatewayRequest): Promise<any> {
    // Fetch data using v1 logic
    return {
        id: '123',
        name: 'Example',
    };
}

function enhanceDataForV2(v1Data: any): any {
    // Add v2-specific enhancements
    return {
        ...v1Data,
        metadata: {
            version: '2.0.0',
            enhanced: true,
        },
        additionalFields: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    };
}
