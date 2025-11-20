/**
 * Facebook OAuth Callback Route
 * Handles OAuth 2.0 callback from Facebook
 * 
 * Requirements: 6.1, 6.4
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
        console.error('Facebook OAuth error:', error, errorDescription);
        return NextResponse.redirect(
            new URL(`/settings?error=facebook_oauth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    // Validate required parameters
    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/settings?error=facebook_oauth_failed&message=Missing+required+parameters', request.url)
        );
    }

    try {
        const manager = getOAuthConnectionManager();
        const connection = await manager.handleCallback('facebook', code, state);

        // Check if Facebook pages are available in metadata
        const pages = connection.metadata?.pages || [];
        const hasPages = pages.length > 0;

        // Redirect to settings with success message
        // If pages are available, include page selection info
        const successUrl = new URL('/settings', request.url);
        successUrl.searchParams.set('success', 'facebook_connected');
        successUrl.searchParams.set('platform', 'facebook');

        if (hasPages) {
            successUrl.searchParams.set('pages', pages.length.toString());
        }

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error('Facebook OAuth callback error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.redirect(
            new URL(`/settings?error=facebook_oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
        );
    }
}
