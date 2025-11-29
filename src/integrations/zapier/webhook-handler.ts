/**
 * Zapier Webhook Handler
 * 
 * Receives and processes webhook triggers from the application
 * to send to Zapier Zaps.
 */

import { createHmac } from 'crypto';
import { integrationRepository } from '../integration-repository';
import {
    ZapierTriggerType,
    ZapierWebhookPayload,
    WebhookVerification,
    ZapConfig
} from './types';
import { WEBHOOK_CONFIG } from './constants';

/**
 * Zapier Webhook Handler
 */
export class ZapierWebhookHandler {
    /**
     * Verify webhook signature
     */
    private verifySignature(payload: string, signature: string): WebhookVerification {
        try {
            const secret = process.env.ZAPIER_WEBHOOK_SECRET;

            if (!secret) {
                return {
                    isValid: false,
                    error: 'Webhook secret not configured'
                };
            }

            const expectedSignature = createHmac('sha256', secret)
                .update(payload)
                .digest('hex');

            if (signature !== expectedSignature) {
                return {
                    isValid: false,
                    error: 'Invalid signature'
                };
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Signature verification failed'
            };
        }
    }

    /**
     * Trigger a webhook for all subscribed Zaps
     */
    async triggerWebhook(
        userId: string,
        triggerType: ZapierTriggerType,
        data: Record<string, any>
    ): Promise<{ success: boolean; triggeredCount: number; errors: string[] }> {
        const errors: string[] = [];
        let triggeredCount = 0;

        try {
            // Get user's Zapier connection
            const connection = await integrationRepository.getByProvider(userId, 'zapier');

            if (!connection) {
                return {
                    success: false,
                    triggeredCount: 0,
                    errors: ['Zapier not connected']
                };
            }

            // Get subscribed Zaps for this trigger type
            const subscribedZaps = ((connection.metadata.subscribedZaps as ZapConfig[]) || [])
                .filter(zap => zap.triggerType === triggerType && zap.isActive);

            if (subscribedZaps.length === 0) {
                return {
                    success: true,
                    triggeredCount: 0,
                    errors: []
                };
            }

            // Create webhook payload
            const payload: ZapierWebhookPayload = {
                triggerType,
                timestamp: Date.now(),
                data,
                metadata: {
                    userId,
                    source: 'bayon-coagent'
                }
            };

            // Send to each subscribed Zap's webhook URL
            const webhookPromises = subscribedZaps.map(async (zap) => {
                if (!zap.webhookUrl) {
                    errors.push(`Zap ${zap.id} has no webhook URL`);
                    return;
                }

                try {
                    const response = await fetch(zap.webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Zapier-Trigger-Type': triggerType
                        },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(WEBHOOK_CONFIG.timeout)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        errors.push(`Zap ${zap.id} webhook failed: ${errorText}`);
                    } else {
                        triggeredCount++;
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Zap ${zap.id} request failed: ${errorMsg}`);
                }
            });

            await Promise.all(webhookPromises);

            return {
                success: errors.length === 0,
                triggeredCount,
                errors
            };
        } catch (error) {
            console.error('Failed to trigger Zapier webhooks:', error);
            return {
                success: false,
                triggeredCount,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Handle incoming webhook from Zapier (for actions)
     */
    async handleIncomingWebhook(
        payload: ZapierWebhookPayload,
        signature?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Verify signature if provided
            if (signature) {
                const verification = this.verifySignature(
                    JSON.stringify(payload),
                    signature
                );

                if (!verification.isValid) {
                    return {
                        success: false,
                        error: verification.error
                    };
                }
            }

            // Process the webhook based on trigger type
            // This would integrate with your application's event system
            console.log('Received Zapier webhook:', payload);

            return { success: true };
        } catch (error) {
            console.error('Failed to handle incoming webhook:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Webhook processing failed'
            };
        }
    }

    /**
     * Test webhook endpoint
     */
    async testWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
        try {
            const testPayload: ZapierWebhookPayload = {
                triggerType: 'client.created',
                timestamp: Date.now(),
                data: {
                    test: true,
                    message: 'Test webhook from Bayon CoAgent'
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(WEBHOOK_CONFIG.timeout)
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Webhook test failed: ${response.statusText}`
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Webhook test failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Test failed'
            };
        }
    }
}

// Export singleton instance
export const webhookHandler = new ZapierWebhookHandler();
