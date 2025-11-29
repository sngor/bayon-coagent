/**
 * Facebook Lead Ads Webhook Handler
 * Processes webhooks from Facebook Lead Ads
 */

import type {
    LeadAdWebhookNotification,
    FacebookLead,
    ProcessedLead,
    LeadAdSyncConfig,
} from './types';
import { LeadAdWebhookNotificationSchema } from './schemas';
import { createFacebookLeadAdsClient } from './client';
import crypto from 'crypto';

/**
 * Verify Facebook webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

    return `sha256=${expectedSignature}` === signature;
}

/**
 * Handle Facebook Lead Ads webhook notification
 */
export async function handleLeadAdWebhook(
    notification: LeadAdWebhookNotification,
    accessToken: string,
    config: LeadAdSyncConfig,
    onLeadReceived?: (lead: ProcessedLead) => Promise<void>
): Promise<void> {
    // Validate notification
    const validated = LeadAdWebhookNotificationSchema.parse(notification);

    const client = createFacebookLeadAdsClient(accessToken);

    // Process each entry
    for (const entry of validated.entry) {
        for (const change of entry.changes) {
            if (change.field === 'leadgen') {
                const leadgenId = change.value.leadgen_id;
                const formId = change.value.form_id;

                // Check if we should process this form
                if (config.formIds && config.formIds.length > 0) {
                    if (!config.formIds.includes(formId)) {
                        console.log(`Skipping lead from form ${formId} - not in sync config`);
                        continue;
                    }
                }

                try {
                    // Fetch the full lead data
                    const lead = await client.getLead(leadgenId);

                    // Process the lead
                    const processedLead = await client.processLead(
                        lead,
                        undefined,
                        config.fieldMapping
                    );

                    // Optional callback to handle the processed lead
                    if (onLeadReceived) {
                        await onLeadReceived(processedLead);
                    }

                    console.log(`Successfully processed lead: ${leadgenId}`);
                } catch (error) {
                    console.error(`Failed to process lead ${leadgenId}:`, error);
                    // Continue processing other leads even if one fails
                }
            }
        }
    }
}

/**
 * Verify webhook callback (for initial setup)
 */
export function verifyWebhookCallback(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
        return challenge;
    }
    return null;
}
