/**
 * LinkedIn OAuth Callback Route
 * Handles OAuth 2.0 callback from LinkedIn
 * 
 * Requirements: 6.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
        console.error('LinkedIn OAuth error:', error, errorDescription);
        return NextResponse.redirect(
            new URL(`/settings?error=linkedin_oauth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    // Validate required parameters
    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/settings?error=linkedin_oauth_failed&message=Missing+required+parameters', request.url)
        );
    }

    try {
        const manager = getOAuthConnectionManager();
        const connection = await manager.handleCallback('linkedin', code, state);

        // Redirect to settings with success message
        const successUrl = new URL('/settings', request.url);
        successUrl.searchParams.set('success', 'linkedin_connected');
        successUrl.searchParams.set('platform', 'linkedin');
        successUrl.searchParams.set('username', connection.platformUsername);

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error('LinkedIn OAuth callback error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.redirect(
            new URL(`/settings?error=linkedin_oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
        );
    }
}
