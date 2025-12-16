/**
 * Google Integration Service
 * 
 * Handles OAuth flows and API interactions with Google services including
 * Google Business Profile, Google Analytics, and other Google APIs.
 * 
 * **Validates: Requirements 6.1**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'google-integration-service',
    version: '1.0.0',
    description: 'Google OAuth and API integration service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const OAuthCredentialsSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    clientSecret: z.string().min(1, 'Client secret is required'),
    redirectUri: z.string().url('Valid redirect URI is required'),
    scope: z.array(z.string()).min(1, 'At least one scope is required'),
});

const OAuthRequestSchema = z.object({
    provider: z.enum(['google']),
    credentials: OAuthCredentialsSchema,
    state: z.string().min(1, 'State parameter is required'),
    codeChallenge: z.string().optional(),
    codeChallengeMethod: z.enum(['S256', 'plain']).optional(),
});

const TokenRefreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
    provider: z.string().min(1, 'Provider is required'),
});

const TokenValidationSchema = z.object({
    accessToken: z.string().min(1, 'Access token is required'),
});

// Response types
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

interface GoogleAPIResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * Google Integration Service Handler
 */
class GoogleIntegrationServiceHandler extends BaseLambdaHandler {
    constructor() {
        super(SERVICE_CONFIG);
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/oauth/initiate')) {
                return await this.initiateOAuthFlow(event);
            }

            if (httpMethod === 'POST' && path.includes('/oauth/refresh')) {
                return await this.refreshToken(event);
            }

            if (httpMethod === 'POST' && path.includes('/oauth/validate')) {
                return await this.validateToken(event);
            }

            if (httpMethod === 'GET' && path.includes('/oauth/callback')) {
                return await this.handleOAuthCallback(event);
            }

            if (httpMethod === 'POST' && path.includes('/api/business-profile')) {
                return await this.getBusinessProfile(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Initiate OAuth flow for Google services
     */
    private async initiateOAuthFlow(event: APIGatewayProxyEvent): Promise<ApiResponse<OAuthFlowResult>> {
        const startTime = Date.now();

        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                OAuthRequestSchema.parse(data)
            );

            // Generate OAuth authorization URL
            const authUrl = await this.executeWithCircuitBreaker(
                'generate-auth-url',
                async () => this.generateAuthorizationUrl(requestBody)
            );

            // Simulate OAuth flow initiation
            const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Store OAuth state for validation (in real implementation, use DynamoDB)
            await this.storeOAuthState(flowId, requestBody.state, requestBody.credentials);

            const result: OAuthFlowResult = {
                success: true,
                provider: requestBody.provider,
                flowId,
                completedAt: new Date().toISOString(),
                duration: Date.now() - startTime,
            };

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'OAuth Flow Initiated',
                {
                    flowId,
                    provider: requestBody.provider,
                    scope: requestBody.credentials.scope,
                }
            );

            return this.createSuccessResponse(result);

        } catch (error) {
            const result: OAuthFlowResult = {
                success: false,
                provider: 'google',
                error: {
                    code: 'OAUTH_INITIATION_FAILED',
                    message: error instanceof Error ? error.message : 'OAuth initiation failed',
                },
                flowId: `failed_${Date.now()}`,
                completedAt: new Date().toISOString(),
                duration: Date.now() - startTime,
            };

            return this.createSuccessResponse(result, 400);
        }
    }

    /**
     * Handle OAuth callback from Google
     */
    private async handleOAuthCallback(event: APIGatewayProxyEvent): Promise<ApiResponse<OAuthFlowResult>> {
        const startTime = Date.now();

        try {
            const { code, state, error } = event.queryStringParameters || {};

            if (error) {
                const result: OAuthFlowResult = {
                    success: false,
                    provider: 'google',
                    error: {
                        code: 'OAUTH_ERROR',
                        message: `OAuth error: ${error}`,
                    },
                    flowId: `error_${Date.now()}`,
                    completedAt: new Date().toISOString(),
                    duration: Date.now() - startTime,
                };

                return this.createSuccessResponse(result, 400);
            }

            if (!code || !state) {
                throw new Error('Missing authorization code or state parameter');
            }

            // Validate state parameter (retrieve from storage)
            const storedState = await this.validateOAuthState(state);
            if (!storedState) {
                throw new Error('Invalid or expired OAuth state');
            }

            // Exchange authorization code for tokens
            const tokens = await this.executeWithCircuitBreaker(
                'exchange-code-for-tokens',
                async () => this.exchangeCodeForTokens(code, storedState.credentials)
            );

            const result: OAuthFlowResult = {
                success: true,
                provider: 'google',
                token: tokens,
                flowId: `success_${Date.now()}`,
                completedAt: new Date().toISOString(),
                duration: Date.now() - startTime,
            };

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'OAuth Flow Completed',
                {
                    flowId: result.flowId,
                    provider: 'google',
                    scope: tokens.scope,
                }
            );

            return this.createSuccessResponse(result);

        } catch (error) {
            const result: OAuthFlowResult = {
                success: false,
                provider: 'google',
                error: {
                    code: 'OAUTH_CALLBACK_FAILED',
                    message: error instanceof Error ? error.message : 'OAuth callback failed',
                },
                flowId: `callback_failed_${Date.now()}`,
                completedAt: new Date().toISOString(),
                duration: Date.now() - startTime,
            };

            return this.createSuccessResponse(result, 400);
        }
    }

    /**
     * Refresh OAuth token
     */
    private async refreshToken(event: APIGatewayProxyEvent): Promise<ApiResponse<OAuthToken>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                TokenRefreshSchema.parse(data)
            );

            const newTokens = await this.executeWithCircuitBreaker(
                'refresh-token',
                async () => this.performTokenRefresh(requestBody.refreshToken)
            );

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Token Refreshed',
                {
                    provider: requestBody.provider,
                    expiresIn: newTokens.expiresIn,
                }
            );

            return this.createSuccessResponse(newTokens);

        } catch (error) {
            return this.createErrorResponseData(
                'TOKEN_REFRESH_FAILED',
                error instanceof Error ? error.message : 'Token refresh failed',
                400
            );
        }
    }

    /**
     * Validate OAuth token
     */
    private async validateToken(event: APIGatewayProxyEvent): Promise<ApiResponse<{ valid: boolean; expiresAt?: string }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                TokenValidationSchema.parse(data)
            );

            const isValid = await this.executeWithCircuitBreaker(
                'validate-token',
                async () => this.performTokenValidation(requestBody.accessToken)
            );

            return this.createSuccessResponse({
                valid: isValid,
                expiresAt: isValid ? new Date(Date.now() + 3600000).toISOString() : undefined,
            });

        } catch (error) {
            return this.createErrorResponseData(
                'TOKEN_VALIDATION_FAILED',
                error instanceof Error ? error.message : 'Token validation failed',
                400
            );
        }
    }

    /**
     * Get Google Business Profile data
     */
    private async getBusinessProfile(event: APIGatewayProxyEvent): Promise<ApiResponse<GoogleAPIResponse>> {
        try {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Missing or invalid authorization header');
            }

            const accessToken = authHeader.substring(7);

            // Validate token first
            const isValidToken = await this.performTokenValidation(accessToken);
            if (!isValidToken) {
                throw new Error('Invalid or expired access token');
            }

            // Fetch business profile data
            const profileData = await this.executeWithCircuitBreaker(
                'fetch-business-profile',
                async () => this.fetchBusinessProfileData(accessToken)
            );

            const response: GoogleAPIResponse = {
                success: true,
                data: profileData,
            };

            return this.createSuccessResponse(response);

        } catch (error) {
            const response: GoogleAPIResponse = {
                success: false,
                error: {
                    code: 'BUSINESS_PROFILE_FETCH_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to fetch business profile',
                },
            };

            return this.createSuccessResponse(response, 400);
        }
    }

    // Helper methods for OAuth operations
    private async generateAuthorizationUrl(request: any): Promise<string> {
        // In real implementation, construct Google OAuth URL
        const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const params = new URLSearchParams({
            client_id: request.credentials.clientId,
            redirect_uri: request.credentials.redirectUri,
            scope: request.credentials.scope.join(' '),
            response_type: 'code',
            state: request.state,
            access_type: 'offline',
            prompt: 'consent',
        });

        if (request.codeChallenge) {
            params.append('code_challenge', request.codeChallenge);
            params.append('code_challenge_method', request.codeChallengeMethod || 'S256');
        }

        return `${baseUrl}?${params.toString()}`;
    }

    private async storeOAuthState(flowId: string, state: string, credentials: any): Promise<void> {
        // In real implementation, store in DynamoDB with TTL
        // For now, simulate storage
        this.logger.info('Storing OAuth state', { flowId, state });
    }

    private async validateOAuthState(state: string): Promise<{ credentials: any } | null> {
        // In real implementation, retrieve from DynamoDB
        // For now, simulate validation
        return {
            credentials: {
                clientId: 'mock_client_id',
                clientSecret: 'mock_client_secret',
                redirectUri: 'https://example.com/callback',
            },
        };
    }

    private async exchangeCodeForTokens(code: string, credentials: any): Promise<OAuthToken> {
        // In real implementation, make HTTP request to Google token endpoint
        // For now, simulate token exchange
        return {
            accessToken: `access_token_${Date.now()}`,
            refreshToken: `refresh_token_${Date.now()}`,
            tokenType: 'Bearer',
            expiresIn: 3600,
            scope: ['profile', 'email', 'business'],
            issuedAt: new Date().toISOString(),
        };
    }

    private async performTokenRefresh(refreshToken: string): Promise<OAuthToken> {
        // In real implementation, make HTTP request to Google token endpoint
        // For now, simulate token refresh
        return {
            accessToken: `new_access_token_${Date.now()}`,
            refreshToken: `new_refresh_token_${Date.now()}`,
            tokenType: 'Bearer',
            expiresIn: 3600,
            scope: ['profile', 'email', 'business'],
            issuedAt: new Date().toISOString(),
        };
    }

    private async performTokenValidation(accessToken: string): Promise<boolean> {
        // In real implementation, make HTTP request to Google token info endpoint
        // For now, simulate validation
        return accessToken.startsWith('access_token_') || accessToken.startsWith('new_access_token_');
    }

    private async fetchBusinessProfileData(accessToken: string): Promise<any> {
        // In real implementation, make HTTP request to Google Business Profile API
        // For now, simulate data fetch
        return {
            name: 'Example Business',
            address: '123 Main St, City, State 12345',
            phone: '+1-555-123-4567',
            website: 'https://example.com',
            categories: ['Real Estate Agency'],
            rating: 4.5,
            reviewCount: 127,
        };
    }
}

// Export the Lambda handler
export const handler = new GoogleIntegrationServiceHandler().lambdaHandler.bind(
    new GoogleIntegrationServiceHandler()
);