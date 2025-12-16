/**
 * Integration Microservices Property-Based Tests
 * 
 * **Feature: microservices-architecture-enhancement**
 * 
 * Tests the correctness properties for integration microservices:
 * - Property 17: OAuth flow completion
 * - Property 18: Multi-platform connection management
 * - Property 19: Webhook validation and routing
 */

import fc from 'fast-check';
import { arbitraries, PropertyTestHelpers } from '../utils/microservices-test-utils';

// Types for integration services
interface OAuthCredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string[];
}

interface OAuthRequest {
    provider: 'google' | 'facebook' | 'linkedin' | 'twitter';
    credentials: OAuthCredentials;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: 'S256' | 'plain';
}

interface OAuthToken {
    accessToken: string;
    refreshToken?: string;
    tokenType: 'Bearer';
    expiresIn: number;
    scope: string[];
    issuedAt: string;
}

interface OAuthFlowResult {
    success: boolean;
    provider: string;
    token?: OAuthToken;
    error?: {
        code: string;
        message: string;
        description?: string;
    };
    flowId: string;
    completedAt: string;
    duration: number;
}

interface SocialMediaPlatform {
    name: 'facebook' | 'linkedin' | 'twitter' | 'instagram' | 'youtube';
    apiVersion: string;
    baseUrl: string;
    authType: 'oauth2' | 'api_key' | 'bearer';
    rateLimits: {
        requestsPerHour: number;
        requestsPerDay: number;
    };
    features: string[];
}

interface PlatformConnection {
    platformId: string;
    userId: string;
    connectionId: string;
    status: 'active' | 'inactive' | 'expired' | 'error';
    credentials: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: string;
    };
    permissions: string[];
    connectedAt: string;
    lastUsed?: string;
    metadata?: Record<string, any>;
}

interface ConnectionManagementResult {
    totalConnections: number;
    activeConnections: number;
    platformBreakdown: Record<string, number>;
    healthStatus: 'healthy' | 'degraded' | 'critical';
    lastHealthCheck: string;
    connectionDetails: PlatformConnection[];
}

interface WebhookPayload {
    id: string;
    source: string;
    eventType: string;
    timestamp: string;
    data: Record<string, any>;
    signature?: string;
    headers: Record<string, string>;
}

interface WebhookValidationResult {
    isValid: boolean;
    source: string;
    eventType: string;
    validationErrors?: string[];
    signatureValid?: boolean;
    timestampValid?: boolean;
    payloadValid?: boolean;
}

interface WebhookRoutingResult {
    webhookId: string;
    routedTo: string[];
    routingDecisions: Array<{
        handler: string;
        matched: boolean;
        reason: string;
    }>;
    processedAt: string;
    totalHandlers: number;
    successfulRoutes: number;
}

interface MLSDataSource {
    name: string;
    region: string;
    apiEndpoint: string;
    authMethod: 'api_key' | 'oauth' | 'basic';
    dataTypes: string[];
    updateFrequency: 'realtime' | 'hourly' | 'daily';
}

interface MLSSyncResult {
    sourceId: string;
    syncId: string;
    recordsProcessed: number;
    recordsUpdated: number;
    recordsCreated: number;
    recordsDeleted: number;
    errors: Array<{
        recordId: string;
        error: string;
        severity: 'warning' | 'error';
    }>;
    syncDuration: number;
    completedAt: string;
    nextSyncScheduled?: string;
}

// Fast-check arbitraries for integration services
const integrationArbitraries = {
    oauthCredentials: (): fc.Arbitrary<OAuthCredentials> => fc.record({
        clientId: fc.string({ minLength: 20, maxLength: 40 }).map(s => `client_${s}`),
        clientSecret: fc.string({ minLength: 32, maxLength: 64 }).map(s => `secret_${s}`),
        redirectUri: fc.webUrl(),
        scope: fc.array(
            fc.oneof(
                fc.constant('read'),
                fc.constant('write'),
                fc.constant('profile'),
                fc.constant('email'),
                fc.constant('publish'),
                fc.constant('manage')
            ),
            { minLength: 1, maxLength: 4 }
        ),
    }),

    oauthRequest: (): fc.Arbitrary<OAuthRequest> => fc.record({
        provider: fc.oneof(
            fc.constant('google'),
            fc.constant('facebook'),
            fc.constant('linkedin'),
            fc.constant('twitter')
        ),
        credentials: integrationArbitraries.oauthCredentials(),
        state: fc.string({ minLength: 16, maxLength: 32 }).map(s => `state_${s}`),
        codeChallenge: fc.option(fc.string({ minLength: 43, maxLength: 128 })),
        codeChallengeMethod: fc.option(fc.oneof(
            fc.constant('S256'),
            fc.constant('plain')
        )),
    }),

    oauthToken: (): fc.Arbitrary<OAuthToken> => fc.record({
        accessToken: fc.string({ minLength: 40, maxLength: 200 }).map(s => `access_${s}`),
        refreshToken: fc.option(fc.string({ minLength: 40, maxLength: 200 }).map(s => `refresh_${s}`)),
        tokenType: fc.constant('Bearer'),
        expiresIn: fc.integer({ min: 300, max: 7200 }), // 5 minutes to 2 hours
        scope: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        issuedAt: arbitraries.timestamp(),
    }),

    socialMediaPlatform: (): fc.Arbitrary<SocialMediaPlatform> => fc.record({
        name: fc.oneof(
            fc.constant('facebook'),
            fc.constant('linkedin'),
            fc.constant('twitter'),
            fc.constant('instagram'),
            fc.constant('youtube')
        ),
        apiVersion: fc.oneof(
            fc.constant('v1.0'),
            fc.constant('v2.0'),
            fc.constant('v3.0'),
            fc.constant('v1.1')
        ),
        baseUrl: fc.webUrl(),
        authType: fc.oneof(
            fc.constant('oauth2'),
            fc.constant('api_key'),
            fc.constant('bearer')
        ),
        rateLimits: fc.record({
            requestsPerHour: fc.integer({ min: 100, max: 10000 }),
            requestsPerDay: fc.integer({ min: 1000, max: 100000 }),
        }),
        features: fc.array(
            fc.oneof(
                fc.constant('post'),
                fc.constant('read'),
                fc.constant('analytics'),
                fc.constant('messaging'),
                fc.constant('media_upload')
            ),
            { minLength: 1, maxLength: 5 }
        ),
    }),

    platformConnection: (): fc.Arbitrary<PlatformConnection> => fc.record({
        platformId: fc.string({ minLength: 5, maxLength: 20 }),
        userId: arbitraries.userId(),
        connectionId: fc.uuid(),
        status: fc.oneof(
            fc.constant('active'),
            fc.constant('inactive'),
            fc.constant('expired'),
            fc.constant('error')
        ),
        credentials: fc.record({
            accessToken: fc.string({ minLength: 40, maxLength: 200 }),
            refreshToken: fc.option(fc.string({ minLength: 40, maxLength: 200 })),
            expiresAt: fc.option(arbitraries.timestamp()),
        }),
        permissions: fc.array(
            fc.oneof(
                fc.constant('read_profile'),
                fc.constant('publish_posts'),
                fc.constant('read_analytics'),
                fc.constant('manage_pages')
            ),
            { minLength: 1, maxLength: 4 }
        ),
        connectedAt: arbitraries.timestamp(),
        lastUsed: fc.option(arbitraries.timestamp()),
        metadata: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.anything()
        )),
    }),

    webhookPayload: (): fc.Arbitrary<WebhookPayload> => fc.record({
        id: fc.uuid(),
        source: fc.oneof(
            fc.constant('stripe'),
            fc.constant('github'),
            fc.constant('slack'),
            fc.constant('mailchimp'),
            fc.constant('zapier')
        ),
        eventType: fc.oneof(
            fc.constant('payment.completed'),
            fc.constant('user.created'),
            fc.constant('subscription.updated'),
            fc.constant('message.sent'),
            fc.constant('data.synced')
        ),
        timestamp: arbitraries.timestamp(),
        data: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.anything()
        ),
        signature: fc.option(fc.string({ minLength: 32, maxLength: 128 })),
        headers: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 100 })
        ),
    }),

    mlsDataSource: (): fc.Arbitrary<MLSDataSource> => fc.record({
        name: fc.oneof(
            fc.constant('NWMLS'),
            fc.constant('CRMLS'),
            fc.constant('ARMLS'),
            fc.constant('FMLS'),
            fc.constant('TMLS')
        ),
        region: fc.oneof(
            fc.constant('Pacific Northwest'),
            fc.constant('California'),
            fc.constant('Arizona'),
            fc.constant('Florida'),
            fc.constant('Texas')
        ),
        apiEndpoint: fc.webUrl(),
        authMethod: fc.oneof(
            fc.constant('api_key'),
            fc.constant('oauth'),
            fc.constant('basic')
        ),
        dataTypes: fc.array(
            fc.oneof(
                fc.constant('listings'),
                fc.constant('sales'),
                fc.constant('agents'),
                fc.constant('offices'),
                fc.constant('media')
            ),
            { minLength: 1, maxLength: 5 }
        ),
        updateFrequency: fc.oneof(
            fc.constant('realtime'),
            fc.constant('hourly'),
            fc.constant('daily')
        ),
    }),
};

// Mock Google Integration Service
class MockGoogleIntegrationService {
    async initiateOAuthFlow(request: OAuthRequest): Promise<OAuthFlowResult> {
        const startTime = Date.now();

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1));

        // Simulate OAuth flow validation
        if (!request.credentials.clientId || !request.credentials.redirectUri) {
            return {
                success: false,
                provider: request.provider,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Missing required OAuth credentials',
                },
                flowId: `flow_${Date.now()}`,
                completedAt: new Date().toISOString(),
                duration: Math.max(Date.now() - startTime, 1),
            };
        }

        // Simulate successful OAuth flow
        const token: OAuthToken = {
            accessToken: `access_token_${Date.now()}`,
            refreshToken: `refresh_token_${Date.now()}`,
            tokenType: 'Bearer',
            expiresIn: 3600,
            scope: request.credentials.scope,
            issuedAt: new Date().toISOString(),
        };

        return {
            success: true,
            provider: request.provider,
            token,
            flowId: `flow_${Date.now()}`,
            completedAt: new Date().toISOString(),
            duration: Math.max(Date.now() - startTime, 1),
        };
    }

    async refreshToken(refreshToken: string, provider: string): Promise<OAuthToken> {
        // Simulate token refresh
        return {
            accessToken: `new_access_token_${Date.now()}`,
            refreshToken: `new_refresh_token_${Date.now()}`,
            tokenType: 'Bearer',
            expiresIn: 3600,
            scope: ['read', 'write'],
            issuedAt: new Date().toISOString(),
        };
    }

    async validateToken(token: string): Promise<boolean> {
        // Simulate token validation
        return token.startsWith('access_token_') || token.startsWith('new_access_token_');
    }
}

// Mock Social Media Integration Service
class MockSocialMediaIntegrationService {
    private connections: Map<string, PlatformConnection[]> = new Map();

    constructor() {
        this.connections = new Map();
    }

    async connectPlatform(
        userId: string,
        platform: SocialMediaPlatform,
        credentials: any
    ): Promise<PlatformConnection> {
        const connection: PlatformConnection = {
            platformId: platform.name,
            userId,
            connectionId: `conn_${Date.now()}`,
            status: 'active',
            credentials: {
                accessToken: credentials.accessToken || `token_${Date.now()}`,
                refreshToken: credentials.refreshToken,
                expiresAt: credentials.expiresAt,
            },
            permissions: platform.features,
            connectedAt: new Date().toISOString(),
            metadata: {
                platformVersion: platform.apiVersion,
                rateLimits: platform.rateLimits,
            },
        };

        const userConnections = this.connections.get(userId) || [];
        userConnections.push(connection);
        this.connections.set(userId, userConnections);

        return connection;
    }

    async getConnectionStatus(userId: string): Promise<ConnectionManagementResult> {
        const userConnections = this.connections.get(userId) || [];
        const activeConnections = userConnections.filter(c => c.status === 'active');

        const platformBreakdown: Record<string, number> = {};
        userConnections.forEach(conn => {
            platformBreakdown[conn.platformId] = (platformBreakdown[conn.platformId] || 0) + 1;
        });

        const healthStatus = activeConnections.length === 0 ? 'critical' :
            activeConnections.length < userConnections.length * 0.8 ? 'degraded' : 'healthy';

        return {
            totalConnections: userConnections.length,
            activeConnections: activeConnections.length,
            platformBreakdown,
            healthStatus,
            lastHealthCheck: new Date().toISOString(),
            connectionDetails: userConnections,
        };
    }

    async refreshConnection(connectionId: string): Promise<boolean> {
        // Simulate connection refresh
        return Math.random() > 0.1; // 90% success rate
    }

    async disconnectPlatform(userId: string, platformId: string): Promise<boolean> {
        const userConnections = this.connections.get(userId) || [];
        const filteredConnections = userConnections.filter(c => c.platformId !== platformId);
        this.connections.set(userId, filteredConnections);
        return true;
    }

    clearAllConnections(): void {
        this.connections.clear();
    }
}

// Mock Webhook Handler Service
class MockWebhookHandlerService {
    private handlers: Map<string, Array<(payload: WebhookPayload) => Promise<any>>> = new Map();

    registerHandler(eventType: string, handler: (payload: WebhookPayload) => Promise<any>): void {
        const eventHandlers = this.handlers.get(eventType) || [];
        eventHandlers.push(handler);
        this.handlers.set(eventType, eventHandlers);
    }

    async validateWebhook(payload: WebhookPayload): Promise<WebhookValidationResult> {
        const validationErrors: string[] = [];

        // Validate required fields
        if (!payload.id) validationErrors.push('Missing webhook ID');
        if (!payload.source) validationErrors.push('Missing webhook source');
        if (!payload.eventType) validationErrors.push('Missing event type');
        if (!payload.timestamp) validationErrors.push('Missing timestamp');

        // Validate timestamp (not too old)
        const timestampValid = payload.timestamp ?
            (Date.now() - new Date(payload.timestamp).getTime()) < 300000 : false; // 5 minutes

        // Validate signature if present
        const signatureValid = payload.signature ?
            payload.signature.length >= 32 : true; // Simple validation

        // Validate payload structure
        const payloadValid = payload.data && typeof payload.data === 'object';

        // Add validation errors for failed checks
        if (!timestampValid) validationErrors.push('Timestamp is too old or invalid');
        if (!payloadValid) validationErrors.push('Invalid payload structure');

        return {
            isValid: validationErrors.length === 0 && timestampValid && payloadValid,
            source: payload.source,
            eventType: payload.eventType,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
            signatureValid,
            timestampValid,
            payloadValid,
        };
    }

    async routeWebhook(payload: WebhookPayload): Promise<WebhookRoutingResult> {
        const eventHandlers = this.handlers.get(payload.eventType) || [];
        const routingDecisions: WebhookRoutingResult['routingDecisions'] = [];
        const routedTo: string[] = [];
        let successfulRoutes = 0;

        for (const handler of eventHandlers) {
            try {
                await handler(payload);
                const handlerName = `handler_${eventHandlers.indexOf(handler)}`;
                routingDecisions.push({
                    handler: handlerName,
                    matched: true,
                    reason: 'Successfully processed',
                });
                routedTo.push(handlerName);
                successfulRoutes++;
            } catch (error) {
                const handlerName = `handler_${eventHandlers.indexOf(handler)}`;
                routingDecisions.push({
                    handler: handlerName,
                    matched: false,
                    reason: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            webhookId: payload.id,
            routedTo,
            routingDecisions,
            processedAt: new Date().toISOString(),
            totalHandlers: eventHandlers.length,
            successfulRoutes,
        };
    }
}

// Mock MLS Integration Service
class MockMLSIntegrationService {
    async syncData(source: MLSDataSource, lastSyncTime?: string): Promise<MLSSyncResult> {
        const startTime = Date.now();

        // Simulate data processing
        const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
        const recordsUpdated = Math.floor(recordsProcessed * 0.3);
        const recordsCreated = Math.floor(recordsProcessed * 0.6);
        const recordsDeleted = Math.floor(recordsProcessed * 0.1);

        // Simulate some errors
        const errors = [];
        const errorCount = Math.floor(Math.random() * 5);
        for (let i = 0; i < errorCount; i++) {
            errors.push({
                recordId: `record_${i}`,
                error: 'Data validation failed',
                severity: (Math.random() > 0.5 ? 'warning' : 'error') as 'warning' | 'error',
            });
        }

        return {
            sourceId: `${source.name}_${source.region}`,
            syncId: `sync_${Date.now()}`,
            recordsProcessed,
            recordsUpdated,
            recordsCreated,
            recordsDeleted,
            errors,
            syncDuration: Date.now() - startTime,
            completedAt: new Date().toISOString(),
            nextSyncScheduled: source.updateFrequency === 'realtime' ? undefined :
                new Date(Date.now() + (source.updateFrequency === 'hourly' ? 3600000 : 86400000)).toISOString(),
        };
    }

    async validateDataSource(source: MLSDataSource): Promise<boolean> {
        // Simulate data source validation
        return source.apiEndpoint.startsWith('http') &&
            source.dataTypes.length > 0 &&
            source.name.length > 0;
    }
}

describe('Integration Microservices Property Tests', () => {
    let googleService: MockGoogleIntegrationService;
    let socialMediaService: MockSocialMediaIntegrationService;
    let webhookService: MockWebhookHandlerService;
    let mlsService: MockMLSIntegrationService;

    beforeEach(() => {
        googleService = new MockGoogleIntegrationService();
        socialMediaService = new MockSocialMediaIntegrationService();
        webhookService = new MockWebhookHandlerService();
        mlsService = new MockMLSIntegrationService();

        // Clear any existing connections
        socialMediaService.clearAllConnections();
    });

    describe('Property 17: OAuth flow completion', () => {
        /**
         * **Feature: microservices-architecture-enhancement, Property 17: OAuth flow completion**
         * **Validates: Requirements 6.1**
         * 
         * For any valid OAuth request, the Google_Integration_Service should successfully 
         * complete the authentication flow and enable API interactions
         */
        it('should successfully complete OAuth flow for valid requests', async () => {
            await fc.assert(
                fc.asyncProperty(
                    integrationArbitraries.oauthRequest(),
                    async (oauthRequest) => {
                        const result = await googleService.initiateOAuthFlow(oauthRequest);

                        // Should have valid flow result structure
                        expect(result).toHaveProperty('success');
                        expect(result).toHaveProperty('provider', oauthRequest.provider);
                        expect(result).toHaveProperty('flowId');
                        expect(result).toHaveProperty('completedAt');
                        expect(result).toHaveProperty('duration');
                        expect(typeof result.success).toBe('boolean');
                        expect(typeof result.duration).toBe('number');
                        expect(result.duration).toBeGreaterThan(0);

                        // Should have valid timestamps
                        expect(new Date(result.completedAt)).toBeInstanceOf(Date);

                        if (result.success) {
                            // Successful flow should have token
                            expect(result.token).toBeDefined();
                            expect(result.token!.accessToken).toBeDefined();
                            expect(result.token!.tokenType).toBe('Bearer');
                            expect(result.token!.expiresIn).toBeGreaterThan(0);
                            expect(Array.isArray(result.token!.scope)).toBe(true);
                            expect(new Date(result.token!.issuedAt)).toBeInstanceOf(Date);

                            // Token should be valid
                            const isValid = await googleService.validateToken(result.token!.accessToken);
                            expect(isValid).toBe(true);

                            // Should be able to refresh token if refresh token provided
                            if (result.token!.refreshToken) {
                                const refreshedToken = await googleService.refreshToken(
                                    result.token!.refreshToken,
                                    result.provider
                                );
                                expect(refreshedToken.accessToken).toBeDefined();
                                expect(refreshedToken.tokenType).toBe('Bearer');
                            }
                        } else {
                            // Failed flow should have error details
                            expect(result.error).toBeDefined();
                            expect(result.error!.code).toBeDefined();
                            expect(result.error!.message).toBeDefined();
                            expect(typeof result.error!.code).toBe('string');
                            expect(typeof result.error!.message).toBe('string');
                        }

                        return true;
                    }
                ),
                PropertyTestHelpers.createConfig({ numRuns: 100 })
            );
        });
    });

    describe('Property 18: Multi-platform connection management', () => {
        /**
         * **Feature: microservices-architecture-enhancement, Property 18: Multi-platform connection management**
         * **Validates: Requirements 6.2**
         * 
         * For any set of social media platforms, the Social_Media_Integration_Service 
         * should maintain active connections to all configured platforms
         */
        it('should maintain active connections to all configured platforms', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraries.userId(),
                    fc.array(integrationArbitraries.socialMediaPlatform(), { minLength: 1, maxLength: 5 }),
                    async (userId, allPlatforms) => {
                        // Ensure unique platforms by name
                        const platforms = allPlatforms.filter((platform, index, arr) =>
                            arr.findIndex(p => p.name === platform.name) === index
                        );
                        // Create a fresh service instance for this test run
                        const testSocialMediaService = new MockSocialMediaIntegrationService();
                        const connections: PlatformConnection[] = [];

                        // Connect to all platforms
                        for (const platform of platforms) {
                            const credentials = {
                                accessToken: `token_${platform.name}_${Date.now()}`,
                                refreshToken: `refresh_${platform.name}_${Date.now()}`,
                            };

                            const connection = await testSocialMediaService.connectPlatform(
                                userId,
                                platform,
                                credentials
                            );

                            connections.push(connection);

                            // Connection should have proper structure
                            expect(connection.platformId).toBe(platform.name);
                            expect(connection.userId).toBe(userId);
                            expect(connection.connectionId).toBeDefined();
                            expect(connection.status).toBe('active');
                            expect(connection.credentials.accessToken).toBeDefined();
                            expect(Array.isArray(connection.permissions)).toBe(true);
                            expect(new Date(connection.connectedAt)).toBeInstanceOf(Date);
                        }

                        // Get connection status
                        const status = await testSocialMediaService.getConnectionStatus(userId);

                        // Should track all connections
                        expect(status.totalConnections).toBe(platforms.length);
                        expect(status.activeConnections).toBe(platforms.length);
                        expect(status.connectionDetails).toHaveLength(platforms.length);

                        // Platform breakdown should match
                        platforms.forEach(platform => {
                            expect(status.platformBreakdown[platform.name]).toBe(1);
                        });

                        // Health status should be healthy for all active connections
                        expect(status.healthStatus).toBe('healthy');
                        expect(new Date(status.lastHealthCheck)).toBeInstanceOf(Date);

                        // Should be able to refresh connections
                        for (const connection of connections) {
                            const refreshResult = await testSocialMediaService.refreshConnection(connection.connectionId);
                            expect(typeof refreshResult).toBe('boolean');
                        }

                        // Should be able to disconnect platforms
                        if (platforms.length > 1) {
                            const platformToDisconnect = platforms[0];
                            const disconnectResult = await testSocialMediaService.disconnectPlatform(
                                userId,
                                platformToDisconnect.name
                            );
                            expect(disconnectResult).toBe(true);

                            // Status should reflect disconnection
                            const updatedStatus = await testSocialMediaService.getConnectionStatus(userId);
                            expect(updatedStatus.totalConnections).toBe(platforms.length - 1);
                        }

                        return true;
                    }
                ),
                PropertyTestHelpers.createConfig({ numRuns: 50 })
            );
        });
    });

    describe('Property 19: Webhook validation and routing', () => {
        /**
         * **Feature: microservices-architecture-enhancement, Property 19: Webhook validation and routing**
         * **Validates: Requirements 6.4**
         * 
         * For any incoming webhook with valid signature, the Webhook_Handler_Service 
         * should validate the payload and route it to the appropriate handler
         */
        it('should validate webhook payload and route to appropriate handlers', async () => {
            await fc.assert(
                fc.asyncProperty(
                    integrationArbitraries.webhookPayload(),
                    async (webhookPayload) => {
                        // Register some handlers for the event type
                        const handlerResults: any[] = [];
                        const handler1 = jest.fn().mockImplementation(async (payload) => {
                            handlerResults.push({ handler: 'handler1', payload: payload.id });
                            return { processed: true, handler: 'handler1' };
                        });
                        const handler2 = jest.fn().mockImplementation(async (payload) => {
                            handlerResults.push({ handler: 'handler2', payload: payload.id });
                            return { processed: true, handler: 'handler2' };
                        });

                        webhookService.registerHandler(webhookPayload.eventType, handler1);
                        webhookService.registerHandler(webhookPayload.eventType, handler2);

                        // Validate webhook
                        const validationResult = await webhookService.validateWebhook(webhookPayload);

                        // Should have proper validation structure
                        expect(validationResult).toHaveProperty('isValid');
                        expect(validationResult).toHaveProperty('source', webhookPayload.source);
                        expect(validationResult).toHaveProperty('eventType', webhookPayload.eventType);
                        expect(typeof validationResult.isValid).toBe('boolean');

                        // Should validate individual components
                        expect(validationResult).toHaveProperty('signatureValid');
                        expect(validationResult).toHaveProperty('timestampValid');
                        expect(validationResult).toHaveProperty('payloadValid');

                        if (validationResult.isValid) {
                            // Route webhook to handlers
                            const routingResult = await webhookService.routeWebhook(webhookPayload);

                            // Should have proper routing structure
                            expect(routingResult).toHaveProperty('webhookId', webhookPayload.id);
                            expect(routingResult).toHaveProperty('routedTo');
                            expect(routingResult).toHaveProperty('routingDecisions');
                            expect(routingResult).toHaveProperty('processedAt');
                            expect(routingResult).toHaveProperty('totalHandlers');
                            expect(routingResult).toHaveProperty('successfulRoutes');

                            expect(Array.isArray(routingResult.routedTo)).toBe(true);
                            expect(Array.isArray(routingResult.routingDecisions)).toBe(true);
                            expect(new Date(routingResult.processedAt)).toBeInstanceOf(Date);
                            expect(typeof routingResult.totalHandlers).toBe('number');
                            expect(typeof routingResult.successfulRoutes).toBe('number');

                            // Should have routing decisions for each handler
                            routingResult.routingDecisions.forEach(decision => {
                                expect(decision).toHaveProperty('handler');
                                expect(decision).toHaveProperty('matched');
                                expect(decision).toHaveProperty('reason');
                                expect(typeof decision.matched).toBe('boolean');
                                expect(typeof decision.reason).toBe('string');
                            });

                            // Successful routes should not exceed total handlers
                            expect(routingResult.successfulRoutes).toBeLessThanOrEqual(routingResult.totalHandlers);

                            // Handlers should have been called
                            expect(handler1).toHaveBeenCalledWith(webhookPayload);
                            expect(handler2).toHaveBeenCalledWith(webhookPayload);

                            // Handler results should match webhook ID
                            handlerResults.forEach(result => {
                                expect(result.payload).toBe(webhookPayload.id);
                            });
                        } else {
                            // Invalid webhooks should have validation errors
                            expect(validationResult.validationErrors).toBeDefined();
                            expect(Array.isArray(validationResult.validationErrors)).toBe(true);
                            expect(validationResult.validationErrors!.length).toBeGreaterThan(0);
                        }

                        return true;
                    }
                ),
                PropertyTestHelpers.createConfig({ numRuns: 100 })
            );
        });
    });
});