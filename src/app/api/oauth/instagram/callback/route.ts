/**
 * Instagram OAuth Callback Route
 * Handles OAuth 2.0 callback from Instagram (via Facebook)
 * 
 * Requirements: 6.1, 6.5
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
        console.error('Instagram OAuth error:', error, errorDescription);
        return NextResponse.redirect(
            new URL(`/settings?error=instagram_oauth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    // Validate required parameters
    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/settings?error=instagram_oauth_failed&message=Missing+required+parameters', request.url)
        );
    }

    try {
        const manager = getOAuthConnectionManager();
        const connection = await manager.handleCallback('instagram', code, state);

        // Check if Instagram business accounts are available in metadata
        const businessAccounts = connection.metadata?.businessAccounts || [];
        const hasBusinessAccount = businessAccounts.length > 0;

        // Redirect to settings with success message
        const successUrl = new URL('/settings', request.url);
        successUrl.searchParams.set('success', 'instagram_connected');
        successUrl.searchParams.set('platform', 'instagram');

        if (hasBusinessAccount) {
            successUrl.searchParams.set('business_account', 'true');
        } else {
            // Warn user if no business account found
            successUrl.searchParams.set('warning', 'no_business_account');
        }

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error('Instagram OAuth callback error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.redirect(
            new URL(`/settings?error=instagram_oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
        );
    }
}
