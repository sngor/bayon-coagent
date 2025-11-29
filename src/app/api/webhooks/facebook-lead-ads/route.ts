/**
 * Facebook Lead Ads Webhook Route
 * Handles webhook notifications from Facebook Lead Ads
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    verifyWebhookSignature,
    handleLeadAdWebhook,
    verifyWebhookCallback,
} from '@/integrations/crm/facebook-lead-ads';
import type { LeadAdWebhookNotification, ProcessedLead } from '@/integrations/crm/facebook-lead-ads';

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const WEBHOOK_VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'bayon_lead_ads_webhook';

/**
 * GET handler for webhook verification
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const verifiedChallenge = verifyWebhookCallback(mode, token, challenge, WEBHOOK_VERIFY_TOKEN);

    if (verifiedChallenge) {
        return new NextResponse(verifiedChallenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST handler for webhook notifications
 */
export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-hub-signature-256');
        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 401 });
        }

        const body = await request.text();

        // Verify signature
        const isValid = verifyWebhookSignature(body, signature, FACEBOOK_APP_SECRET);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const notification: LeadAdWebhookNotification = JSON.parse(body);

        // Process the webhook
        // Note: You'll need to implement getAccessTokenForPage to retrieve the page's access token
        const accessToken = await getAccessTokenForPage(notification.entry[0]?.id);

        if (!accessToken) {
            console.error('No access token found for page');
            return NextResponse.json({ status: 'no_token' }, { status: 200 });
        }

        // Handle the lead
        await handleLeadAdWebhook(
            notification,
            accessToken,
            {
                userId: 'system', // You'll need to determine the user from the page ID
                pageId: notification.entry[0]?.id || '',
                autoCreateClients: true,
            },
            async (lead: ProcessedLead) => {
                // Auto-create client from lead
                console.log('New lead received:', {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    formId: lead.formId,
                });

                // TODO: Implement client creation
                // await createClientFromLead(lead);
            }
        );

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

/**
 * Helper function to get access token for a page
 * TODO: Implement this based on your OAuth token storage
 */
async function getAccessTokenForPage(pageId: string): Promise<string | null> {
    // This should query your DynamoDB oauth-tokens table
    // to find the access token for the Facebook page
    return null;
}
