/**
 * Integration Service - OAuth Lambda Handler
 * Handles OAuth flows for Google Business Profile and other integrations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCurrentUserFromEvent } from '@/aws/auth/lambda-auth';
import { wrapLambdaHandler } from '@/aws/lambda/wrapper';
import { getRepository } from '@/aws/dynamodb/repository';
import { getOAuthTokenKeys } from '@/aws/dynamodb/keys';

// Import OAuth flows
import { exchangeGoogleToken } from '@/aws/bedrock/flows/exchange-google-token';
import { getValidOAuthTokens } from '@/aws/auth/oauth-tokens';

// Import schemas
import { ExchangeGoogleTokenInputSchema } from '@/ai/schemas/google-token-schemas';

interface OAuthRequest {
    action: 'connect' | 'exchange-token' | 'get-status' | 'disconnect';
    provider: 'google-business' | 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    data?: any;
}

export const handler = wrapLambdaHandler(async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const user = await getCurrentUserFromEvent(event);
    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    const { action, provider } = event.queryStringParameters || {};

    if (!action || !provider) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Action and provider are required' }),
        };
    }

    try {
        const repository = getRepository();

        switch (action) {
            case 'connect':
                // Generate OAuth URL for connection
                if (provider === 'google-business') {
                    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
                    const clientId = process.env.GOOGLE_CLIENT_ID;
                    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

                    const params = new URLSearchParams({
                        client_id: clientId!,
                        redirect_uri: redirectUri!,
                        response_type: 'code',
                        scope: 'https://www.googleapis.com/auth/business.manage',
                        access_type: 'offline',
                        prompt: 'consent',
                        state: user.userId,
                    });

                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        },
                        body: JSON.stringify({
                            success: true,
                            authUrl: `${oauth2Endpoint}?${params.toString()}`,
                        }),
                    };
                }
                break;

            case 'exchange-token':
                if (!event.body) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Request body is required for token exchange' }),
                    };
                }

                const tokenRequest = JSON.parse(event.body);

                if (provider === 'google-business') {
                    const input = ExchangeGoogleTokenInputSchema.parse({
                        code: tokenRequest.code,
                        userId: user.userId,
                    });

                    const result = await exchangeGoogleToken(input);

                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        },
                        body: JSON.stringify({
                            success: true,
                            data: result,
                        }),
                    };
                }
                break;

            case 'get-status':
                try {
                    const tokens = await getValidOAuthTokens(user.userId, provider.toUpperCase().replace('-', '_'));

                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        },
                        body: JSON.stringify({
                            success: true,
                            connected: !!tokens,
                            provider,
                        }),
                    };
                } catch (error) {
                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        },
                        body: JSON.stringify({
                            success: true,
                            connected: false,
                            provider,
                        }),
                    };
                }

            case 'disconnect':
                const tokenKeys = getOAuthTokenKeys(user.userId, provider.toUpperCase().replace('-', '_'));
                await repository.delete(tokenKeys.PK, tokenKeys.SK);

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                        success: true,
                        message: 'OAuth connection removed',
                    }),
                };

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action' }),
                };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Unsupported provider or action' }),
        };
    } catch (error: any) {
        console.error('OAuth error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'OAuth operation failed',
                message: error.message,
            }),
        };
    }
});