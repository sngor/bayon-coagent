/**
 * Twilio Webhook Status Callback API Route
 * 
 * Handles Twilio webhooks for SMS delivery status updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    validateTwilioSignature,
    parseTwilioWebhook,
    handleStatusCallback
} from '@/integrations/twilio';

export async function POST(request: NextRequest) {
    try {
        // Get Twilio signature from headers
        const twilioSignature = request.headers.get('x-twilio-signature');

        if (!twilioSignature) {
            return NextResponse.json(
                { error: 'Missing Twilio signature' },
                { status: 401 }
            );
        }

        // Parse request body
        const formData = await request.formData();
        const body: Record<string, any> = {};

        formData.forEach((value, key) => {
            body[key] = value.toString();
        });

        // Validate signature
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!authToken) {
            console.error('TWILIO_AUTH_TOKEN not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const url = request.url;
        const isValid = validateTwilioSignature(authToken, twilioSignature, url, body);

        if (!isValid) {
            console.error('Invalid Twilio signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook event
        const event = parseTwilioWebhook(body);

        // Handle status callback
        await handleStatusCallback(event);

        // Return 200 OK to Twilio
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Twilio webhook error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
