/**
 * Calendly OAuth Callback Route
 * Handles OAuth callback for Calendly integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const CALENDLY_CLIENT_ID = process.env.CALENDLY_CLIENT_ID;
const CALENDLY_CLIENT_SECRET = process.env.CALENDLY_CLIENT_SECRET;
const CALENDLY_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/calendly/callback`;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/settings/integrations?error=oauth_failed', request.url)
        );
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: CALENDLY_CLIENT_ID!,
                client_secret: CALENDLY_CLIENT_SECRET!,
                redirect_uri: CALENDLY_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch('https://api.calendly.com/users/me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userData = await userResponse.json();
        const calendlyUserId = userData.resource.uri.split('/').pop();

        // Extract userId from state (format: "userId:randomString")
        const userId = state.split(':')[0];

        // Store connection in DynamoDB
        const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        const docClient = DynamoDBDocumentClient.from(dynamoClient);

        await docClient.send(
            new PutCommand({
                TableName: process.env.OAUTH_TOKENS_TABLE || 'oauth-tokens',
                Item: {
                    userId,
                    provider: 'calendly',
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + tokens.expires_in * 1000,
                    scope: tokens.scope,
                    platformUserId: calendlyUserId,
                    platformUsername: userData.resource.name,
                    metadata: {
                        email: userData.resource.email,
                        schedulingUrl: userData.resource.scheduling_url,
                        timezone: userData.resource.timezone,
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            })
        );

        return NextResponse.redirect(
            new URL('/settings/integrations?success=calendly_connected', request.url)
        );
    } catch (error) {
        console.error('Calendly OAuth error:', error);
        return NextResponse.redirect(
            new URL('/settings/integrations?error=oauth_failed', request.url)
        );
    }
}
