/**
 * Follow Up Boss OAuth Callback Route
 * Handles OAuth callback for Follow Up Boss integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
        // Note: Follow Up Boss uses API key authentication, not OAuth
        // This route is a placeholder if they implement OAuth in the future
        // For now, API keys are configured directly in settings

        return NextResponse.redirect(
            new URL('/settings/integrations?success=followupboss_connected', request.url)
        );
    } catch (error) {
        console.error('Follow Up Boss OAuth error:', error);
        return NextResponse.redirect(
            new URL('/settings/integrations?error=oauth_failed', request.url)
        );
    }
}
