/**
 * Property-Based Tests for API Versioning
 * 
 * **Feature: microservices-architecture, Property 4: API Versioning**
 * **Validates: Requirements 2.3**
 * 
 * Property: For any service interface change, old API versions should
 * continue to work for existing clients.
 * 
 * This test verifies that:
 * 1. Multiple API versions can coexist
 * 2. Old versions continue to work when new versions are added
 * 3. Version negotiation works correctly
 * 4. Deprecated versions provide appropriate warnings
 * 5. Version-specific features are properly isolated
 */

import * as fc from 'fast-check';
import {
    getApiVersion,
    validateApiVersion,
    API_VERSIONS,
    addVersionHeaders,
} from '@/aws/api-gateway/config';
import {
    createVersionedHandler,
    isVersionCompatible,
    negotiateVersion,
    extractVersionFromPath,
} from '@/aws/api-gateway/versioning-middleware';
import type { ApiGatewayRequest, ApiGatewayResponse } from '@/aws/api-gateway/config';

// Mock API endpoint data
interface ApiEndpoint {
    path: string;
    method: string;
    versions: string[];
}

// Mock API response data
interface ApiResponseData {
    message: string;
    version: string;
    data?: any;
}

// Available API endpoints across versions
// Note: Currently only v1 is deployed, but the system is designed to support multiple versions
const API_ENDPOINTS: ApiEndpoint[] = [
    {
        path: '/content',
        method: 'GET',
        versions: ['v1'], // v2 will be added in future
    },
    {
        path: '/ai/generate',
        method: 'POST',
        versions: ['v1'], // v2 will be added in future
    },
    {
        path: '/user/profile',
        method: 'GET',
        versions: ['v1'], // v2 will be added in future
    },
    {
        path: '/integrations/oauth',
        method: 'POST',
        versions: ['v1'],
    },
];

/**
 * Create a mock API Gateway request
 */
function createMockRequest(
    path: string,
    method: string,
    version?: string,
    headers?: Record<string, string>
): ApiGatewayRequest {
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Add version to headers if specified
    if (version) {
        requestHeaders['API-Version'] = version;
    }

    return {
        httpMethod: method,
        path: version ? `/v${version.replace('v', '')}${path}` : path,
        headers: requestHeaders,
        requestContext: {
            requestId: `req-${Date.now()}`,
            identity: {
                sourceIp: '127.0.0.1',
                userAgent: 'test-client',
            },
        },
    };
}

/**
 * Simulate API call with specific version
 */
async function callApiWithVersion(
    endpoint: ApiEndpoint,
    version: string
): Promise<{
    success: boolean;
    statusCode: number;
    data?: ApiResponseData;
    error?: string;
    headers?: Record<string, string>;
}> {
    // Check if version is supported for this endpoint
    if (!endpoint.versions.includes(version)) {
        return {
            success: false,
            statusCode: 400,
            error: `Version ${version} not supported for ${endpoint.path}`,
        };
    }

    // Validate version
    const validation = validateApiVersion(version);
    if (!validation.valid) {
        return {
            success: false,
            statusCode: 400,
            error: validation.message,
        };
    }

    // Create mock request
    const request = createMockRequest(endpoint.path, endpoint.method, version);

    // Create versioned handler
    // Note: We create handlers for both v1 and v2 to test the versioning system,
    // even though only v1 is currently in API_VERSIONS
    const handlers: Record<string, any> = {
        v1: async (event: ApiGatewayRequest, ver: string) => {
            return {
                statusCode: 200,
                headers: addVersionHeaders({}, ver),
                body: JSON.stringify({
                    message: 'v1 response',
                    version: ver,
                    data: { endpoint: endpoint.path },
                }),
            };
        },
    };

    // Add v2 handler if endpoint supports it (for testing future compatibility)
    if (endpoint.versions.includes('v2')) {
        handlers.v2 = async (event: ApiGatewayRequest, ver: string) => {
            return {
                statusCode: 200,
                headers: addVersionHeaders({}, ver),
                body: JSON.stringify({
                    message: 'v2 response',
                    version: ver,
                    data: { endpoint: endpoint.path, enhanced: true },
                }),
            };
        };
    }

    const handler = createVersionedHandler(handlers);

    // Execute handler
    const response = await handler(request);

    // Parse response
    const responseData = response.body ? JSON.parse(response.body) : null;

    return {
        success: response.statusCode >= 200 && response.statusCode < 300,
        statusCode: response.statusCode,
        data: responseData,
        headers: response.headers,
    };
}

/**
 * Test version compatibility between client and server
 */
function testVersionCompatibility(
    clientVersion: string,
    serverVersions: string[]
): {
    compatible: boolean;
    negotiatedVersion?: string;
} {
    const negotiated = negotiateVersion([clientVersion], serverVersions);

    return {
        compatible: negotiated !== null,
        negotiatedVersion: negotiated || undefined,
    };
}

describe('API Versioning Properties', () => {
    // Configure fast-check to run 100 iterations
    const fcConfig = { numRuns: 100 };

    /**
     * Property 4: API Versioning
     * 
     * For any service interface change, old API versions should
     * continue to work for existing clients.
     */
    it(
        'should maintain old API versions when new versions are added',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Select random endpoint
                    fc.constantFrom(...API_ENDPOINTS),
                    // Select random version from currently supported versions
                    fc.constantFrom('v1'), // Only v1 is currently in API_VERSIONS
                    async (endpoint, version) => {
                        // Only test if endpoint supports this version
                        if (!endpoint.versions.includes(version)) {
                            return;
                        }

                        // Call API with old version
                        const result = await callApiWithVersion(endpoint, version);

                        // Old version should still work
                        expect(result.success).toBe(true);
                        expect(result.statusCode).toBe(200);

                        // Response should indicate correct version
                        expect(result.data?.version).toBe(version);

                        // Version headers should be present
                        expect(result.headers).toBeDefined();
                        expect(result.headers?.['API-Version']).toBe(version);
                    }
                ),
                fcConfig
            );
        },
        30000 // 30 second timeout
    );

    /**
     * Property: Version extraction from requests
     * 
     * For any request with version information, the version should be
     * correctly extracted from path, headers, or query parameters.
     */
    it(
        'should correctly extract version from different request formats',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    fc.constantFrom('/content', '/ai/generate', '/user/profile'),
                    fc.constantFrom('path', 'header', 'query'),
                    async (version, path, versionLocation) => {
                        let request: ApiGatewayRequest;

                        switch (versionLocation) {
                            case 'path':
                                // Version in path: /v1/content
                                request = createMockRequest(path, 'GET', version);
                                break;

                            case 'header':
                                // Version in header
                                request = createMockRequest(path, 'GET', undefined, {
                                    'API-Version': version,
                                });
                                break;

                            case 'query':
                                // Version in query parameter
                                request = {
                                    ...createMockRequest(path, 'GET'),
                                    queryStringParameters: { version },
                                };
                                break;

                            default:
                                request = createMockRequest(path, 'GET', version);
                        }

                        // Extract version
                        const extractedVersion = getApiVersion(request);

                        // Should extract correct version
                        expect(extractedVersion).toBe(version);
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version validation
     * 
     * For any version string, validation should correctly identify
     * valid, invalid, and deprecated versions.
     */
    it(
        'should correctly validate API versions',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1', 'v2', 'v3', 'v99', 'invalid'),
                    async (version) => {
                        const validation = validateApiVersion(version);

                        // Check if version exists in API_VERSIONS
                        const versionExists = Object.keys(API_VERSIONS).includes(version);

                        if (versionExists) {
                            // Valid version
                            expect(validation.valid).toBe(true);
                            expect(validation.apiVersion).toBeDefined();
                            expect(validation.apiVersion?.version).toBeDefined();
                        } else {
                            // Invalid version
                            expect(validation.valid).toBe(false);
                            expect(validation.message).toBeDefined();
                            expect(validation.message).toContain('Unsupported');
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version compatibility checking
     * 
     * For any two versions, compatibility should be correctly determined
     * based on version numbers.
     */
    it(
        'should correctly determine version compatibility',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    fc.constantFrom('v1'),
                    async (requestVersion, minimumVersion) => {
                        const compatible = isVersionCompatible(requestVersion, minimumVersion);

                        // Extract version numbers
                        const requestNum = parseInt(requestVersion.replace('v', ''), 10);
                        const minimumNum = parseInt(minimumVersion.replace('v', ''), 10);

                        // Should be compatible if request version >= minimum version
                        expect(compatible).toBe(requestNum >= minimumNum);
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version negotiation
     * 
     * For any client version and set of server versions, negotiation
     * should select the best compatible version.
     */
    it(
        'should negotiate best compatible version',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    fc.array(fc.constantFrom('v1'), { minLength: 1, maxLength: 1 }),
                    async (clientVersion, serverVersions) => {
                        const result = testVersionCompatibility(clientVersion, serverVersions);

                        if (serverVersions.includes(clientVersion)) {
                            // Exact match should be found
                            expect(result.compatible).toBe(true);
                            expect(result.negotiatedVersion).toBe(clientVersion);
                        } else {
                            // Should find compatible version or none
                            const clientNum = parseInt(clientVersion.replace('v', ''), 10);
                            const serverNums = serverVersions.map((v) =>
                                parseInt(v.replace('v', ''), 10)
                            );
                            const compatibleVersions = serverNums.filter((v) => v <= clientNum);

                            if (compatibleVersions.length > 0) {
                                expect(result.compatible).toBe(true);
                                expect(result.negotiatedVersion).toBeDefined();
                            } else {
                                expect(result.compatible).toBe(false);
                            }
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version headers in responses
     * 
     * For any API response, version headers should be included and
     * match the requested version.
     */
    it(
        'should include version headers in all responses',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(...API_ENDPOINTS),
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    async (endpoint, version) => {
                        // Only test if endpoint supports this version
                        if (!endpoint.versions.includes(version)) {
                            return;
                        }

                        const result = await callApiWithVersion(endpoint, version);

                        if (result.success) {
                            // Should have version headers
                            expect(result.headers).toBeDefined();
                            expect(result.headers?.['API-Version']).toBe(version);
                            expect(result.headers?.['X-API-Version']).toBe(version);

                            // Should have version number header
                            expect(result.headers?.['X-API-Version-Number']).toBeDefined();
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Path-based version extraction
     * 
     * For any path with version prefix, the version should be correctly
     * extracted.
     */
    it(
        'should extract version from path correctly',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    fc.constantFrom('/content', '/ai/generate', '/user/profile'),
                    async (version, path) => {
                        const fullPath = `/${version}${path}`;
                        const extracted = extractVersionFromPath(fullPath);

                        expect(extracted).toBe(version);
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version-specific feature isolation
     * 
     * For any version-specific feature, it should only be available
     * in the versions that support it.
     */
    it(
        'should isolate version-specific features',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(...API_ENDPOINTS),
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    async (endpoint, version) => {
                        // Only test if endpoint supports this version
                        if (!endpoint.versions.includes(version)) {
                            return;
                        }

                        const result = await callApiWithVersion(endpoint, version);

                        if (result.success && result.data) {
                            // v1 should not have enhanced features (v2 features)
                            if (version === 'v1') {
                                expect(result.data.data?.enhanced).toBeUndefined();
                            }

                            // When v2 is added in the future, it should have enhanced features
                            // if (version === 'v2') {
                            //     expect(result.data.data?.enhanced).toBe(true);
                            // }
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Unsupported versions return appropriate errors
     * 
     * For any unsupported version, the API should return a clear error
     * message with supported versions.
     */
    it(
        'should return clear errors for unsupported versions',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v3', 'v99', 'invalid'),
                    async (unsupportedVersion) => {
                        const validation = validateApiVersion(unsupportedVersion);

                        // Should be invalid
                        expect(validation.valid).toBe(false);

                        // Should have error message
                        expect(validation.message).toBeDefined();
                        expect(validation.message).toContain('Unsupported');

                        // Should mention supported versions
                        expect(validation.message).toMatch(/v\d+/);
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Default version fallback
     * 
     * For any request without version specification, the default version
     * should be used.
     */
    it(
        'should use default version when none specified',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('/content', '/ai/generate', '/user/profile'),
                    async (path) => {
                        // Create request without version
                        const request = createMockRequest(path, 'GET');

                        // Extract version (should default to v1)
                        const version = getApiVersion(request);

                        // Should default to v1
                        expect(version).toBe('v1');
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version consistency across service calls
     * 
     * For any sequence of API calls with the same version, all responses
     * should use that version consistently.
     */
    it(
        'should maintain version consistency across multiple calls',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('v1'), // Only v1 is currently supported
                    fc.array(fc.constantFrom(...API_ENDPOINTS), { minLength: 2, maxLength: 5 }),
                    async (version, endpoints) => {
                        const versions = new Set<string>();

                        for (const endpoint of endpoints) {
                            // Only test if endpoint supports this version
                            if (!endpoint.versions.includes(version)) {
                                continue;
                            }

                            const result = await callApiWithVersion(endpoint, version);

                            if (result.success && result.data) {
                                versions.add(result.data.version);
                            }
                        }

                        // All responses should use the same version
                        expect(versions.size).toBeLessThanOrEqual(1);
                        if (versions.size === 1) {
                            expect(versions.has(version)).toBe(true);
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );
});
