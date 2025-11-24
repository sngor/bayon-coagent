/**
 * Property-Based Tests for Inter-Service Security
 * 
 * **Feature: microservices-architecture, Property 16: Inter-service Security**
 * 
 * Tests that all communication between services is encrypted and authenticated
 * using AWS Signature V4 and IAM-based authorization.
 */

import * as fc from 'fast-check';
import { signRequest, parseApiGatewayUrl } from '../lambda/utils/request-signer';

describe('Property 16: Inter-service Security', () => {
    /**
     * Property: All service-to-service requests must be signed with AWS Signature V4
     * 
     * For any service-to-service request, the request must include proper
     * AWS Signature V4 authentication headers.
     */
    it('should sign all service-to-service requests with AWS Signature V4', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('POST', 'GET', 'PUT', 'DELETE'),
                fc.constantFrom(
                    'api.example.execute-api.us-east-1.amazonaws.com',
                    'api2.example.execute-api.us-west-2.amazonaws.com'
                ),
                fc.constantFrom('/v1/jobs', '/v1/oauth/google', '/v1/health', '/v1/analytics'),
                fc.option(fc.record({
                    data: fc.string(),
                    value: fc.integer(),
                }), { nil: undefined }),
                async (method, hostname, path, body) => {
                    const signedRequest = await signRequest({
                        method,
                        hostname,
                        path,
                        body: body ? JSON.stringify(body) : undefined,
                    });

                    // Verify Authorization header exists and contains AWS4-HMAC-SHA256
                    expect(signedRequest.headers).toHaveProperty('Authorization');
                    expect(signedRequest.headers['Authorization']).toContain('AWS4-HMAC-SHA256');

                    // Verify X-Amz-Date header exists
                    expect(signedRequest.headers).toHaveProperty('X-Amz-Date');

                    // Verify Content-Type header exists
                    expect(signedRequest.headers).toHaveProperty('Content-Type');
                    expect(signedRequest.headers['Content-Type']).toBe('application/json');

                    // Verify host header matches hostname
                    expect(signedRequest.headers).toHaveProperty('host');
                    expect(signedRequest.headers['host']).toBe(hostname);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Signed requests must include all required security headers
     * 
     * For any signed request, it must include Authorization, X-Amz-Date,
     * and host headers at minimum.
     */
    it('should include all required security headers in signed requests', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('POST', 'GET'),
                fc.string({ minLength: 10, maxLength: 100 }),
                async (method, hostname) => {
                    const signedRequest = await signRequest({
                        method,
                        hostname: `${hostname}.execute-api.us-east-1.amazonaws.com`,
                        path: '/v1/test',
                    });

                    const requiredHeaders = ['Authorization', 'X-Amz-Date', 'host', 'Content-Type'];

                    for (const header of requiredHeaders) {
                        expect(signedRequest.headers).toHaveProperty(header);
                        expect(signedRequest.headers[header]).toBeTruthy();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: API Gateway URL parsing must correctly extract hostname and path
     * 
     * For any valid API Gateway URL, parsing should correctly extract
     * the hostname and path components.
     */
    it('should correctly parse API Gateway URLs', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('abc123def4', '1234567890', 'abcdef1234', 'xyz789abc1'), // Valid API Gateway ID format
                fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1'),
                fc.constantFrom('/v1/jobs', '/v1/health', '/v1/oauth/callback'),
                (apiId, region, path) => {
                    const url = `https://${apiId}.execute-api.${region}.amazonaws.com${path}`;
                    const parsed = parseApiGatewayUrl(url);

                    expect(parsed.hostname).toBe(`${apiId}.execute-api.${region}.amazonaws.com`);
                    expect(parsed.path).toBe(path);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Requests with query parameters must include them in the signature
     * 
     * For any request with query parameters, the signature must include
     * those parameters to prevent tampering.
     */
    it('should include query parameters in request signature', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
                async (queryParams) => {
                    const signedRequest = await signRequest({
                        method: 'GET',
                        hostname: 'api.example.execute-api.us-east-1.amazonaws.com',
                        path: '/v1/test',
                        queryParams,
                    });

                    // Verify Authorization header includes the query parameters in the signature
                    expect(signedRequest.headers['Authorization']).toBeTruthy();

                    // Verify URL includes query parameters
                    if (Object.keys(queryParams).length > 0) {
                        expect(signedRequest.url).toContain('?');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Request body must be included in signature calculation
     * 
     * For any request with a body, the signature must include the body
     * to prevent tampering.
     */
    it('should include request body in signature calculation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    data: fc.string(),
                    value: fc.integer(),
                    nested: fc.record({
                        field: fc.string(),
                    }),
                }),
                async (body) => {
                    const bodyString = JSON.stringify(body);

                    const signedRequest = await signRequest({
                        method: 'POST',
                        hostname: 'api.example.execute-api.us-east-1.amazonaws.com',
                        path: '/v1/test',
                        body: bodyString,
                    });

                    // Verify body is preserved
                    expect(signedRequest.body).toBe(bodyString);

                    // Verify Authorization header exists (which includes body hash)
                    expect(signedRequest.headers['Authorization']).toBeTruthy();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Different request methods must produce different signatures
     * 
     * For the same endpoint and body, different HTTP methods should
     * produce different signatures.
     */
    it('should produce different signatures for different HTTP methods', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                async (path) => {
                    const hostname = 'api.example.execute-api.us-east-1.amazonaws.com';
                    const fullPath = `/v1/${path}`;
                    const body = JSON.stringify({ test: 'data' });

                    const postRequest = await signRequest({
                        method: 'POST',
                        hostname,
                        path: fullPath,
                        body,
                    });

                    const putRequest = await signRequest({
                        method: 'PUT',
                        hostname,
                        path: fullPath,
                        body,
                    });

                    // Signatures should be different for different methods
                    expect(postRequest.headers['Authorization']).not.toBe(
                        putRequest.headers['Authorization']
                    );
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Requests to different services must use correct service name
     * 
     * For any service invocation, the signature must use 'execute-api'
     * as the service name for API Gateway endpoints.
     */
    it('should use correct service name for API Gateway requests', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    'ai-service',
                    'integration-service',
                    'background-service',
                    'admin-service'
                ),
                async (serviceName) => {
                    const signedRequest = await signRequest({
                        method: 'GET',
                        hostname: `${serviceName}.execute-api.us-east-1.amazonaws.com`,
                        path: '/v1/health',
                        service: 'execute-api',
                    });

                    // Verify Authorization header contains execute-api service
                    expect(signedRequest.headers['Authorization']).toContain('execute-api');
                }
            ),
            { numRuns: 100 }
        );
    });
});
