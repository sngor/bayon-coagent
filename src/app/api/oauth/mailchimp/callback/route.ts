/**
 * Mailchimp OAuth Callback API Route
 * 
 * Handles the OAuth callback from Mailchimp after user authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mailchimpOAuthManager } from '@/integrations/mailchimp';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/settings/integrations?error=mailchimp_oauth_failed', request.url)
        );
    }

    try {
        const result = await mailchimpOAuthManager.handleCallback(code, state);

        if (!result.success) {
            console.error('Mailchimp OAuth callback error:', result.error);
            return NextResponse.redirect(
                new URL(
                    `/settings/integrations?error=mailchimp_oauth_failed&message=${encodeURIComponent(result.error || 'Unknown error')}`,
                    request.url
                )
            );
        }

        return NextResponse.redirect(
            new URL('/settings/integrations?success=mailchimp_connected', request.url)
        );
    } catch (error) {
        console.error('Mailchimp OAuth callback exception:', error);
        return NextResponse.redirect(
            new URL(
                `/settings/integrations?error=mailchimp_oauth_failed&message=${encodeURIComponent(
                    error instanceof Error ? error.message : 'Unknown error'
                )}`,
                request.url
            )
        );
    }
}
