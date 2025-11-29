/**
 * Calendly Webhook Route
 * Handles webhook notifications from Calendly
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CalendlyWebhookPayload } from '@/integrations/crm/calendly';
import { CalendlyWebhookPayloadSchema } from '@/integrations/crm/calendly';
import { createCalendlyClient } from '@/integrations/crm/calendly';
import crypto from 'crypto';

const CALENDLY_WEBHOOK_SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

/**
 * Verify Calendly webhook signature
 */
function verifyCalendlySignature(payload: string, signature: string, signingKey: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', signingKey)
        .update(payload)
        .digest('hex');

    return signature === expectedSignature;
}

/**
 * POST handler for webhook notifications
 */
export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('calendly-webhook-signature');
        if (!signature || !CALENDLY_WEBHOOK_SIGNING_KEY) {
            return NextResponse.json({ error: 'No signature or signing key' }, { status: 401 });
        }

        const body = await request.text();

        // Verify signature
        const isValid = verifyCalendlySignature(body, signature, CALENDLY_WEBHOOK_SIGNING_KEY);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload: CalendlyWebhookPayload = JSON.parse(body);

        // Validate payload
        const validated = CalendlyWebhookPayloadSchema.parse(payload);

        // Handle different webhook events
        switch (validated.event) {
            case 'invitee.created':
                await handleInviteeCreated(validated);
                break;

            case 'invitee.canceled':
                await handleInviteeCanceled(validated);
                break;

            case 'routing_form_submission.created':
                // Handle routing form submission
                console.log('Routing form submission received');
                break;

            default:
                console.log('Unknown event type:', validated.event);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error('Calendly webhook processing error:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

/**
 * Handle invitee.created event
 */
async function handleInviteeCreated(payload: CalendlyWebhookPayload) {
    if (!payload.payload.invitee || !payload.payload.event) {
        return;
    }

    console.log('New Calendly appointment scheduled:', {
        inviteeUri: payload.payload.invitee,
        eventUri: payload.payload.event,
        time: payload.time,
    });

    // TODO: Implement logic to:
    // 1. Fetch full invitee and event details using Calendly client
    // 2. Create activity/appointment in your system
    // 3. Link to existing client if email matches
    // 4. Send notifications

    // Example:
    // const accessToken = await getAccessTokenForUser(userId);
    // const client = createCalendlyClient(accessToken);
    // const invitee = await client.getInvitee(payload.payload.invitee);
    // const event = await client.getEvent(payload.payload.event);
}

/**
 * Handle invitee.canceled event
 */
async function handleInviteeCanceled(payload: CalendlyWebhookPayload) {
    if (!payload.payload.invitee) {
        return;
    }

    console.log('Calendly appointment canceled:', {
        inviteeUri: payload.payload.invitee,
        cancelerType: payload.payload.cancellation?.canceler_type,
        time: payload.time,
    });

    // TODO: Implement logic to:
    // 1. Update appointment status in your system
    // 2. Send cancellation notifications
    // 3. Update client activity timeline
}
