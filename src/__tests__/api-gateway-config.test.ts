/**
 * API Gateway Configuration Tests
 * 
 * Tests for the API Gateway configuration and client utilities
 * for the microservices architecture.
 */

import {
    getApiGatewayConfig,
    getServiceEndpoints,
    createApiGatewayResponse,
    parseRequestBody,
    validateRequestParameters,
    getApiVersion,
    validateApiVersion,
    createHealthCheckResponse,
    ApiGatewayRequest
} from '@/aws/api-gateway/config';

import {
    ApiGatewayClient,
    getApiClient
} from '@/aws/api-gateway/client';

describe('API Gateway Configuration', () => {
    beforeEach(() => {
        // Reset environment variables
        delete process.env.MAIN_API_URL;
        delete process.env.AI_SERVICE_API_URL;
        delete process.env.USE_LOCAL_AWS;
        delete process.env.NODE_ENV;
    });

    describe('getApiGatewayConfig', () => {
        it('should return local configuration when USE_LOCAL_AWS is true', () => {
            process.env.USE_LOCAL_AWS = 'true';
            process.env.NODE_ENV = 'development';

            const config = getApiGatewayConfig();

            expect(config.mainApiUrl).toBe('http://localhost:3000/api');
            expect(config.aiServiceApiUrl).toBe('http://localhost:3000/api/ai');
            expect(config.stage).toBe('development');
        });

        it('should return deployed configuration when USE_LOCAL_AWS is false', () => {
            process.env.USE_LOCAL_AWS = 'false';
            process.env.NODE_ENV = 'production';
            process.env.MAIN_API_URL = 'https://api.example.com/production';
            process.env.AI_SERVICE_API_URL = 'https://ai-api.example.com/v1';

            const config = getApiGatewayConfig();

            expect(config.mainApiUrl).toBe('https://api.example.com/production');
            expect(config.aiServiceApiUrl).toBe('https://ai-api.example.com/v1');
            expect(config.stage).toBe('production');
        });
    });

    describe('getServiceEndpoints', () => {
        it('should return service endpoints', () => {
            process.env.USE_LOCAL_AWS = 'true';
            process.env.NODE_ENV = 'development';

            const endpoints = getServiceEndpoints();

            expect(endpoints.main).toBe('http://localhost:3000/api');
            expect(endpoints.ai).toBe('http://localhost:3000/api/ai');
            expect(endpoints.integration).toBe('http://localhost:3000/api/integration');
            expect(endpoints.background).toBe('http://localhost:3000/api/background');
            expect(endpoints.admin).toBe('http://localhost:3000/api/admin');
        });
    });

    describe('createApiGatewayResponse', () => {
        it('should create success response', () => {
            const response = createApiGatewayResponse(200, { message: 'Success' });

            expect(response.statusCode).toBe(200);
            expect(response.headers?.['Content-Type']).toBe('application/json');

            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data.message).toBe('Success');
            expect(body.traceId).toBeDefined();
        });

        it('should create error response', () => {
            const response = createApiGatewayResponse(400, 'Bad Request');

            expect(response.statusCode).toBe(400);

            const body = JSON.parse(response.body);
            expect(body.error.code).toBe('BAD_REQUEST');
            expect(body.error.message).toBe('Bad Request');
            expect(body.error.traceId).toBeDefined();
        });

        it('should include CORS headers', () => {
            const response = createApiGatewayResponse(200, {});

            expect(response.headers?.['Access-Control-Allow-Origin']).toBeDefined();
            expect(response.headers?.['Access-Control-Allow-Methods']).toBeDefined();
            expect(response.headers?.['Access-Control-Allow-Headers']).toBeDefined();
        });
    });

    describe('parseRequestBody', () => {
        it('should parse valid JSON body', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'POST',
                path: '/test',
                body: JSON.stringify({ test: 'data' }),
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            const parsed = parseRequestBody(event);
            expect(parsed).toEqual({ test: 'data' });
        });

        it('should return null for empty body', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/test',
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            const parsed = parseRequestBody(event);
            expect(parsed).toBeNull();
        });

        it('should throw error for invalid JSON', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'POST',
                path: '/test',
                body: 'invalid json',
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            expect(() => parseRequestBody(event)).toThrow('Invalid JSON in request body');
        });
    });

    describe('validateRequestParameters', () => {
        it('should validate required path parameters', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/users/123',
                pathParameters: { id: '123' },
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            expect(() => validateRequestParameters(event, ['id'])).not.toThrow();
        });

        it('should throw error for missing path parameters', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/users',
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            expect(() => validateRequestParameters(event, ['id']))
                .toThrow('Missing required path parameter: id');
        });

        it('should validate required query parameters', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/search',
                queryStringParameters: { q: 'test' },
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            expect(() => validateRequestParameters(event, [], ['q'])).not.toThrow();
        });
    });

    describe('getApiVersion', () => {
        it('should extract version from path', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/v2/users',
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            const version = getApiVersion(event);
            expect(version).toBe('v2');
        });

        it('should extract version from headers', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/users',
                headers: { 'API-Version': 'v2' },
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            const version = getApiVersion(event);
            expect(version).toBe('v2');
        });

        it('should default to v1', () => {
            const event: ApiGatewayRequest = {
                httpMethod: 'GET',
                path: '/users',
                requestContext: {
                    requestId: 'test-id',
                    identity: { sourceIp: '127.0.0.1' }
                }
            };

            const version = getApiVersion(event);
            expect(version).toBe('v1');
        });
    });

    describe('validateApiVersion', () => {
        it('should validate supported version', () => {
            expect(() => validateApiVersion('v1')).not.toThrow();
        });

        it('should throw error for unsupported version', () => {
            expect(() => validateApiVersion('v99'))
                .toThrow('Unsupported API version: v99');
        });
    });

    describe('createHealthCheckResponse', () => {
        it('should create health check response', () => {
            const healthCheck = createHealthCheckResponse(
                'test-service',
                'healthy',
                { database: 'healthy' },
                { responseTime: 100 }
            );

            expect(healthCheck.service).toBe('test-service');
            expect(healthCheck.status).toBe('healthy');
            expect(healthCheck.dependencies?.database).toBe('healthy');
            expect(healthCheck.metrics?.responseTime).toBe(100);
            expect(healthCheck.timestamp).toBeDefined();
            expect(healthCheck.version).toBeDefined();
        });
    });
});

describe('API Gateway Client', () => {
    let client: ApiGatewayClient;

    beforeEach(() => {
        process.env.USE_LOCAL_AWS = 'true';
        process.env.NODE_ENV = 'development';
        client = new ApiGatewayClient();
    });

    describe('ApiGatewayClient', () => {
        it('should create client with default config', () => {
            expect(client).toBeInstanceOf(ApiGatewayClient);
        });

        it('should create client with custom config', () => {
            const customClient = new ApiGatewayClient({
                timeout: 5000,
                retries: 5,
            });
            expect(customClient).toBeInstanceOf(ApiGatewayClient);
        });
    });

    describe('getApiClient', () => {
        it('should return singleton client instance', () => {
            const client1 = getApiClient();
            const client2 = getApiClient();
            expect(client1).toBe(client2);
        });
    });

    // Note: Actual HTTP requests would require mocking or integration tests
    // These tests focus on the configuration and setup
});

describe('API Gateway Integration', () => {
    beforeEach(() => {
        process.env.USE_LOCAL_AWS = 'true';
        process.env.NODE_ENV = 'development';
    });

    it('should have consistent configuration between config and client', () => {
        const config = getApiGatewayConfig();
        const endpoints = getServiceEndpoints();

        expect(endpoints.main).toBe(config.mainApiUrl);
        expect(endpoints.ai).toBe(config.aiServiceApiUrl);
        expect(endpoints.integration).toBe(config.integrationServiceApiUrl);
        expect(endpoints.background).toBe(config.backgroundServiceApiUrl);
        expect(endpoints.admin).toBe(config.adminServiceApiUrl);
    });

    it('should handle environment switching', () => {
        // Test local environment
        process.env.USE_LOCAL_AWS = 'true';
        process.env.NODE_ENV = 'development';

        const localConfig = getApiGatewayConfig();
        expect(localConfig.mainApiUrl).toContain('localhost:3000');

        // Test deployed environment
        process.env.USE_LOCAL_AWS = 'false';
        process.env.MAIN_API_URL = 'https://api.example.com/production';

        const deployedConfig = getApiGatewayConfig();
        expect(deployedConfig.mainApiUrl).toBe('https://api.example.com/production');
    });
});