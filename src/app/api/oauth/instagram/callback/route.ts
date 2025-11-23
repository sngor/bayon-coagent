/**
 * Instagram OAuth Callback Route
 * Handles OAuth 2.0 callback from Instagram with enhanced analytics scopes
 * for content workflow features
 * 
 * Requirements: 6.1, 6.5, 8.1
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
        const hasBusinessAccounts = businessAccounts.length > 0;

        // Validate analytics access for content workflow features
        const analyticsValidation = await manager.validateAnalyticsAccess(
            connection.userId,
            'instagram'
        );

        // Redirect to settings with success message
        const successUrl = new URL('/settings', request.url);
        successUrl.searchParams.set('success', 'instagram_connected');
        successUrl.searchParams.set('platform', 'instagram');
        successUrl.searchParams.set('username', connection.platformUsername);

        if (hasBusinessAccounts) {
            successUrl.searchParams.set('business_accounts', businessAccounts.length.toString());
        }

        // Include analytics capability information
        if (analyticsValidation.hasAccess) {
            successUrl.searchParams.set('analytics', 'enabled');
            if (analyticsValidation.availableMetrics) {
                successUrl.searchParams.set('metrics', analyticsValidation.availableMetrics.length.toString());
            }
        } else {
            successUrl.searchParams.set('analytics', 'limited');
            if (analyticsValidation.error) {
                successUrl.searchParams.set('analytics_error', encodeURIComponent(analyticsValidation.error));
            }
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