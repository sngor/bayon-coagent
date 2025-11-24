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
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Endpoint not found',
                    },
                }),
            };
        }
    } catch (error) {
        console.error('Google OAuth error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Internal server error',
                },
            }),
        };
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
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'MISSING_PARAMETER',
                    message: 'userId is required',
                },
            }),
        };
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

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            success: true,
            data: {
                authUrl: authUrl.toString(),
                state,
            },
        }),
    };
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
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'OAUTH_ERROR',
                    message: params.error_description || params.error,
                },
            }),
        };
    }

    // Validate required parameters
    if (!params.code || !params.state) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'MISSING_PARAMETER',
                    message: 'code and state are required',
                },
            }),
        };
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number; nonce: string };
    try {
        stateData = JSON.parse(Buffer.from(params.state, 'base64').toString());
    } catch (error) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'INVALID_STATE',
                    message: 'Invalid state parameter',
                },
            }),
        };
    }

    // Check state timestamp (must be within 10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'EXPIRED_STATE',
                    message: 'State parameter has expired',
                },
            }),
        };
    }

    // Get OAuth credentials from Secrets Manager
    const credentials = await getGoogleOAuthCredentials();

    // Exchange authorization code for access token with circuit breaker
    const tokenResponse = await withCircuitBreaker(
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

    if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange failed:', errorData);

        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'TOKEN_EXCHANGE_FAILED',
                    message: errorData.error_description || 'Failed to exchange authorization code',
                },
            }),
        };
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

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            success: true,
            message: 'Google OAuth connection established',
            data: {
                provider: 'GOOGLE_BUSINESS',
                expiresAt: Date.now() + tokenData.expires_in * 1000,
            },
        }),
    };
}
