/**
 * Google OAuth Integration Lambda
 * 
 * Handles Google OAuth flow for Business Profile integration.
 * 
 * Requirements: 1.1, 6.4 - OAuth integration with secure credential management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getGoogleOAuthCredentials } from '../aws/secrets-manager/client';
import { getRepository } from '../aws/dynamodb/repository';
import { withCircuitBreaker } from '../lib/circuit-breaker';
import {
    executeWithFallback,
    integrationFailureManager,
    skipFailedIntegration
} from '../lib/fallback-mechanisms';

interface OAuthCallbackParams {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
}

/**
 * Lambda handler for Google OAuth flow
 * 
 * Supports two operations:
 * 1. GET /oauth/google/authorize - Initiate OAuth flow
 * 2. GET /oauth/google/callback - Handle OAuth callback
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Google OAuth event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    try {
        // Route based on path
        if (path.endsWith('/authorize') && httpMethod === 'GET') {
            return await handleAuthorize(event);
        } else if (path.endsWith('/callback') && httpMethod === 'GET') {
            return await handleCallback(event);
        } else {
            const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

            const errorResponse = formatErrorResponse('Endpoint not found', {
                service: 'integration-google-oauth',
                code: ErrorCode.NOT_FOUND,
                path: path,
                method: httpMethod,
            });

            return toAPIGatewayResponse(errorResponse, 404);
        }
    } catch (error) {
        console.error('Google OAuth error:', error);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(error as Error, {
            service: 'integration-google-oauth',
            code: ErrorCode.INTEGRATION_ERROR,
            path: event.path,
            method: event.httpMethod,
        });

        return toAPIGatewayResponse(errorResponse);
    }
}

/**
 * Handle OAuth authorization initiation
 * Generates authorization URL and redirects user
 */
async function handleAuthorize(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse('userId is required', {
            service: 'integration-google-oauth',
            code: ErrorCode.BAD_REQUEST,
            path: event.path,
            method: event.httpMethod,
        });

        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Get OAuth credentials from Secrets Manager
    const credentials = await getGoogleOAuthCredentials();

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
        JSON.stringify({
            userId,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7),
        })
    ).toString('base64');

    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', credentials.clientId);
    authUrl.searchParams.set('redirect_uri', credentials.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');

    const successResponse = formatSuccessResponse(
        {
            authUrl: authUrl.toString(),
            state,
        },
        'Authorization URL generated successfully'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}

/**
 * Handle OAuth callback
 * Exchanges authorization code for access token
 */
async function handleCallback(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const params: OAuthCallbackParams = event.queryStringParameters || {};

    // Check for OAuth errors
    if (params.error) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(params.error_description || params.error, {
            service: 'integration-google-oauth',
            code: ErrorCode.OAUTH_ERROR,
            path: event.path,
            method: event.httpMethod,
        });

        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Validate required parameters
    if (!params.code || !params.state) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse('code and state are required', {
            service: 'integration-google-oauth',
            code: ErrorCode.BAD_REQUEST,
            path: event.path,
            method: event.httpMethod,
        });

        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number; nonce: string };
    try {
        stateData = JSON.parse(Buffer.from(params.state, 'base64').toString());
    } catch (error) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse('Invalid state parameter', {
            service: 'integration-google-oauth',
            code: ErrorCode.INVALID_STATE,
            path: event.path,
            method: event.httpMethod,
        });

        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Check state timestamp (must be within 10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse('State parameter has expired', {
            service: 'integration-google-oauth',
            code: ErrorCode.EXPIRED_STATE,
            path: event.path,
            method: event.httpMethod,
            retryable: true,
        });

        return toAPIGatewayResponse(errorResponse, 400);
    }

    // Get OAuth credentials from Secrets Manager
    const credentials = await getGoogleOAuthCredentials();

    // Import retry utility
    const { retry } = await import('../lib/retry-utility');

    // Exchange authorization code for access token with circuit breaker and retry logic
    const tokenResponse = await retry(
        async () => {
            return await withCircuitBreaker(
                'google-oauth-token-exchange',
                async () => {
                    return fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            code: params.code!,
                            client_id: credentials.clientId,
                            client_secret: credentials.clientSecret,
                            redirect_uri: credentials.redirectUri,
                            grant_type: 'authorization_code',
                        }).toString(),
                    });
                },
                {
                    failureThreshold: 3,
                    recoveryTimeout: 30000, // 30 seconds
                    requestTimeout: 10000, // 10 seconds
                }
            );
        },
        {
            maxRetries: 3,
            baseDelay: 1000,
            backoffMultiplier: 2,
            operationName: 'google-oauth-token-exchange',
            onRetry: (error, attempt, delay) => {
                console.log(`Retrying Google OAuth token exchange (attempt ${attempt}, delay ${delay}ms):`, error.message);
            },
        }
    );

    if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange failed:', errorData);

        const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import('../lib/error-response');

        const errorResponse = formatErrorResponse(
            errorData.error_description || 'Failed to exchange authorization code',
            {
                service: 'integration-google-oauth',
                code: ErrorCode.TOKEN_EXCHANGE_FAILED,
                userId: stateData.userId,
                path: event.path,
                method: event.httpMethod,
                retryable: true,
                additionalDetails: {
                    oauthError: errorData.error,
                },
            }
        );

        return toAPIGatewayResponse(errorResponse, 400);
    }

    const tokenData = await tokenResponse.json();

    // Store OAuth tokens in DynamoDB
    const repository = getRepository();
    await repository.create(
        `USER#${stateData.userId}`,
        'OAUTH#GOOGLE_BUSINESS',
        'OAuthToken',
        {
            provider: 'GOOGLE_BUSINESS',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + tokenData.expires_in * 1000,
            scope: tokenData.scope,
            tokenType: tokenData.token_type,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    );

    const { formatSuccessResponse, toAPIGatewaySuccessResponse } = await import('../lib/error-response');

    const successResponse = formatSuccessResponse(
        {
            provider: 'GOOGLE_BUSINESS',
            expiresAt: Date.now() + tokenData.expires_in * 1000,
        },
        'Google OAuth connection established'
    );

    return toAPIGatewaySuccessResponse(successResponse);
}
