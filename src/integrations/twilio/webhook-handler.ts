/**
 * Twilio Webhook Handler
 * 
 * Handles Twilio webhooks for SMS status updates and delivery notifications.
 */

import crypto from 'crypto';
import { TwilioWebhookEvent, SMSStatus } from './types';

/**
 * Validate Twilio webhook signature
 * This ensures the webhook is actually from Twilio
 */
export function validateTwilioSignature(
    authToken: string,
    twilioSignature: string,
    url: string,
    params: Record<string, any>
): boolean {
    try {
        // Sort parameters alphabetically and concatenate with URL
        const data = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                return acc + key + params[key];
            }, url);

        // Create HMAC SHA1 signature
        const hmac = crypto.createHmac('sha1', authToken);
        hmac.update(data);
        const signature = hmac.digest('base64');

        // Compare signatures
        return signature === twilioSignature;
    } catch (error) {
        console.error('Signature validation error:', error);
        return false;
    }
}

/**
 * Parse Twilio webhook event
 */
export function parseTwilioWebhook(
    body: Record<string, any>
): TwilioWebhookEvent {
    return {
        MessageSid: body.MessageSid || body.SmsSid,
        SmsSid: body.SmsSid || body.MessageSid,
        AccountSid: body.AccountSid,
        MessagingServiceSid: body.MessagingServiceSid,
        From: body.From,
        To: body.To,
        Body: body.Body || '',
        NumMedia: body.NumMedia || '0',
        NumSegments: body.NumSegments || '1',
        MessageStatus: body.MessageStatus as SMSStatus,
        ErrorCode: body.ErrorCode,
        ErrorMessage: body.ErrorMessage,
        ApiVersion: body.ApiVersion
    };
}

/**
 * Handle status callback webhook
 * This function should be called from your API route
 */
export async function handleStatusCallback(
    event: TwilioWebhookEvent
): Promise<void> {
    try {
        console.log(`SMS ${event.MessageSid} status: ${event.MessageStatus}`);

        // Handle different statuses
        switch (event.MessageStatus) {
            case 'delivered':
                console.log(`SMS delivered to ${event.To}`);
                // Update your database with delivery status
                break;

            case 'undelivered':
            case 'failed':
                console.error(`SMS failed to ${event.To}`, {
                    errorCode: event.ErrorCode,
                    errorMessage: event.ErrorMessage
                });
                // Log error and update database
                break;

            case 'sent':
                console.log(`SMS sent to ${event.To}`);
                break;

            default:
                console.log(`SMS status update: ${event.MessageStatus}`);
        }

        // You can add custom logic here to:
        // - Update message status in your database
        // - Send notifications to users
        // - Trigger retry logic for failed messages
        // - Update analytics/metrics
    } catch (error) {
        console.error('Error handling status callback:', error);
        throw error;
    }
}

/**
 * TwiML response for incoming SMS
 * Use this if you want to handle incoming SMS messages
 */
export function createTwiMLResponse(message?: string): string {
    if (!message) {
        return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(message)}</Message>
</Response>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
