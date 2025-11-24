/**
 * Social Media OAuth Integration Lambda
 * 
 * Handles OAuth flows for Facebook, Instagram, LinkedIn, and Twitter.
 * 
 * Requirements: 1.1, 6.4 - OAuth integration with secure credential management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getFacebookOAuthCredentials,
    getInstagramOAuthCredentials,
    getLinkedInOAuthCredentials,
    getTwitterOAuthCredentials,
} from '../aws/secrets-manager/client';
import { getRepository } from '../aws/dynamodb/repository';
import { withCircuitBreaker } from '../lib/circuit-breaker';

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

interface OAuthConfig {
    authUrl: string;
    tokenUrl: string;
    scope: string;
    getCredentials: () => Promise<{
        clientId?: string;
        clientSecret?: string;
        appId?: string;
        appSecret?: string;
        apiKey?: string;
        apiSecret?: string;
        redirectUri: string;
    }>;
}

const OAUTH_CONFIGS: Record<Platform, OAuthConfig> = {
    facebook: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish',
        getCredentials: getFacebookOAuthCredentials,
    },
    instagram: {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        scope: 'user_profile,user_media',
        getCredentials: getInstagramOAuthCredentials,
    },
    linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scope: 'w_member_social,r_basicprofile',
        getCredentials: getLinkedInOAuthCredentials,
    },
    twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scope: 'tweet.read tweet.write users.read offline.access',
        getCredentials: getTwitterOAuthCredentials,
    },
};

/**
 * Lambda handler for social media OAuth flows
 * 
 * Supports operations for each platform:
 * - GET /oauth/{platform}/authorize - Initiate OAuth flow
 * - GET /oauth/{platform}/callback - Handle OAuth callback
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('Social OAuth event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    try {
        // Extract platform from path
        const platformMatch = path.match(/\/oauth\/([^\/]+)\//);
        if (!platformMatch) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: {
                        code: 'INVALID_PATH',
                        message: 'Platform not specified in path',
                    },
                }),
            };
        }

        const platform = platformMatch[1] as Platform;

        if (!OAUTH_CONFIGS[platform]) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: {
                        code: 'INVALID_PLATFORM',
                        message: `Unsupported platform: ${platform}`,
                    },
                }),
            };
        }

        // Route based on path
        if (path.endsWith('/authorize') && httpMethod === 'GET') {
            return await handleAuthorize(event, platform);
        } else if (path.endsWith('/callback') && httpMethod === 'GET') {
            return await handleCallback(event, platform);
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
        console.error('Social OAuth error:', error);

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
 */
async function handleAuthorize(
    event: APIGatewayProxyEvent,
    platform: Platform
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

    const config = OAUTH_CONFIGS[platform];
    const credentials = await config.getCredentials();

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
        JSON.stringify({
            userId,
            platform,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7),
        })
    ).toString('base64');

    // Build authorization URL
    const authUrl = new URL(config.authUrl);

    // Different platforms use different parameter names
    if (platform === 'facebook' || platform === 'instagram') {
        authUrl.searchParams.set('client_id', credentials.appId!);
    } else if (platform === 'twitter') {
        authUrl.searchParams.set('client_id', credentials.apiKey!);
    } else {
        authUrl.searchParams.set('client_id', credentials.clientId!);
    }

    authUrl.searchParams.set('redirect_uri', credentials.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);

    // Twitter-specific parameters
    if (platform === 'twitter') {
        authUrl.searchParams.set('code_challenge', 'challenge');
        authUrl.searchParams.set('code_challenge_method', 'plain');
    }

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
 */
async function handleCallback(
    event: APIGatewayProxyEvent,
    platform: Platform
): Promise<APIGatewayProxyResult> {
    const params = event.queryStringParameters || {};

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
    let stateData: { userId: string; platform: string; timestamp: number; nonce: string };
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

    // Verify platform matches
    if (stateData.platform !== platform) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'PLATFORM_MISMATCH',
                    message: 'Platform in state does not match request',
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

    const config = OAUTH_CONFIGS[platform];
    const credentials = await config.getCredentials();

    // Build token request body
    const tokenBody: Record<string, string> = {
        code: params.code,
        redirect_uri: credentials.redirectUri,
        grant_type: 'authorization_code',
    };

    // Different platforms use different parameter names
    if (platform === 'facebook' || platform === 'instagram') {
        tokenBody.client_id = credentials.appId!;
        tokenBody.client_secret = credentials.appSecret!;
    } else if (platform === 'twitter') {
        tokenBody.client_id = credentials.apiKey!;
        tokenBody.code_verifier = 'challenge';
    } else {
        tokenBody.client_id = credentials.clientId!;
        tokenBody.client_secret = credentials.clientSecret!;
    }

    // Exchange authorization code for access token with circuit breaker
    const tokenResponse = await withCircuitBreaker(
        `${platform}-oauth-token-exchange`,
        async () => {
            return fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(tokenBody),
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
    await repository.createSocialConnection(
        stateData.userId,
        platform,
        {
            provider: platform.toUpperCase(),
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
            scope: tokenData.scope || config.scope,
            tokenType: tokenData.token_type || 'Bearer',
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
            message: `${platform} OAuth connection established`,
            data: {
                provider: platform.toUpperCase(),
                expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
            },
        }),
    };
}
