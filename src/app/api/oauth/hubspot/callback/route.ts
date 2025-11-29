/**
 * HubSpot OAuth Callback Route
 * Handles OAuth callback for HubSpot integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/hubspot/callback`;

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
        const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: HUBSPOT_CLIENT_ID!,
                client_secret: HUBSPOT_CLIENT_SECRET!,
                redirect_uri: HUBSPOT_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokens = await tokenResponse.json();

        // Get account info
        const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        });

        if (!accountResponse.ok) {
            throw new Error('Failed to fetch account info');
        }

        const accountData = await accountResponse.json();

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
                    provider: 'hubspot',
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + tokens.expires_in * 1000,
                    scope: tokens.scope,
                    platformUserId: accountData.portalId.toString(),
                    platformUsername: accountData.name || accountData.domain,
                    metadata: {
                        portalId: accountData.portalId,
                        domain: accountData.domain,
                        accountType: accountData.accountType,
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            })
        );

        return NextResponse.redirect(
            new URL('/settings/integrations?success=hubspot_connected', request.url)
        );
    } catch (error) {
        console.error('HubSpot OAuth error:', error);
        return NextResponse.redirect(
            new URL('/settings/integrations?error=oauth_failed', request.url)
        );
    }
}
