'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import {
    WebhookConfiguration,
    WebhookDeliveryLog,
    WebhookEvent,
} from '@/lib/open-house/types';
import {
    createWebhookConfigurationInputSchema,
    updateWebhookConfigurationInputSchema,
    formatZodErrors,
} from '@/lib/open-house/schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Creates a new webhook configuration
 * Validates Requirements: 10.4
 */
export async function createWebhookConfiguration(
    input: z.infer<typeof createWebhookConfigurationInputSchema>
): Promise<{
    success: boolean;
    webhookId?: string;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input (Requirement 10.4 - URL validation)
        const validation = createWebhookConfigurationInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Test webhook URL connectivity (Requirement 10.4)
        const testResult = await testWebhookUrl(validatedInput.url);
        if (!testResult.success) {
            return {
                success: false,
                error: `Webhook URL test failed: ${testResult.error}`,
            };
        }

        // Generate unique webhook ID
        const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Generate webhook secret for signature verification
        const secret = generateWebhookSecret();

        // Create webhook configuration data
        const now = new Date().toISOString();
        const webhookData: WebhookConfiguration = {
            webhookId,
            userId: user.id,
            url: validatedInput.url,
            events: validatedInput.events,
            active: true, // New webhooks are active by default
            secret,
            createdAt: now,
            updatedAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        await repository.createWebhookConfig(
            user.id,
            webhookId,
            webhookData
        );

        revalidatePath('/open-house/settings');

        return {
            success: true,
            webhookId,
        };
    } catch (error) {
        console.error('Error creating webhook configuration:', error);
        return {
            success: false,
            error: 'Failed to create webhook configuration. Please try again.',
        };
    }
}

/**
 * Updates an existing webhook configuration
 * Validates Requirements: 10.4
 */
export async function updateWebhookConfiguration(
    webhookId: string,
    input: z.infer<typeof updateWebhookConfigurationInputSchema>
): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const validation = updateWebhookConfigurationInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Get existing webhook to verify ownership
        const repository = getRepository();
        const existingWebhook = await repository.getWebhookConfig<WebhookConfiguration>(
            user.id,
            webhookId
        );

        if (!existingWebhook) {
            return { success: false, error: 'Webhook configuration not found' };
        }

        // If URL is being changed, test the new URL (Requirement 10.4)
        if (validatedInput.url && validatedInput.url !== existingWebhook.url) {
            const testResult = await testWebhookUrl(validatedInput.url);
            if (!testResult.success) {
                return {
                    success: false,
                    error: `Webhook URL test failed: ${testResult.error}`,
                };
            }
        }

        // Prepare updates
        const updates: Partial<WebhookConfiguration> = {
            ...validatedInput,
            updatedAt: new Date().toISOString(),
        };

        // Update in DynamoDB
        await repository.updateWebhookConfig(
            user.id,
            webhookId,
            updates
        );

        revalidatePath('/open-house/settings');

        return { success: true };
    } catch (error) {
        console.error('Error updating webhook configuration:', error);
        return {
            success: false,
            error: 'Failed to update webhook configuration. Please try again.',
        };
    }
}

/**
 * Deletes a webhook configuration
 */
export async function deleteWebhookConfiguration(
    webhookId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Verify webhook exists and belongs to user
        const webhook = await repository.getWebhookConfig<WebhookConfiguration>(
            user.id,
            webhookId
        );

        if (!webhook) {
            return { success: false, error: 'Webhook configuration not found' };
        }

        // Delete the webhook
        await repository.deleteWebhookConfig(user.id, webhookId);

        revalidatePath('/open-house/settings');
        return { success: true };
    } catch (error) {
        console.error('Error deleting webhook configuration:', error);
        return {
            success: false,
            error: 'Failed to delete webhook configuration. Please try again.',
        };
    }
}

/**
 * Gets all webhook configurations for the current user
 */
export async function getWebhookConfigurations(): Promise<{
    webhooks: WebhookConfiguration[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { webhooks: [], error: 'Not authenticated' };
        }

        const repository = getRepository();
        const result = await repository.queryWebhookConfigs<WebhookConfiguration>(
            user.id,
            {
                scanIndexForward: false, // Most recent first
            }
        );

        return { webhooks: result.items };
    } catch (error) {
        console.error('Error fetching webhook configurations:', error);
        return {
            webhooks: [],
            error: 'Failed to fetch webhook configurations. Please try again.',
        };
    }
}

/**
 * Gets a single webhook configuration by ID
 */
export async function getWebhookConfiguration(
    webhookId: string
): Promise<{ webhook: WebhookConfiguration | null; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { webhook: null, error: 'Not authenticated' };
        }

        const repository = getRepository();
        const webhook = await repository.getWebhookConfig<WebhookConfiguration>(
            user.id,
            webhookId
        );

        return { webhook };
    } catch (error) {
        console.error('Error fetching webhook configuration:', error);
        return {
            webhook: null,
            error: 'Failed to fetch webhook configuration. Please try again.',
        };
    }
}

/**
 * Tests a webhook URL for connectivity
 * Validates Requirements: 10.4
 */
export async function testWebhookUrl(
    url: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Send a test ping to the webhook URL
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bayon-Coagent-Webhook/1.0',
                'X-Webhook-Test': 'true',
            },
            body: JSON.stringify({
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: {
                    message: 'This is a test webhook delivery',
                },
            }),
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        // Accept any 2xx or 3xx response as success
        if (response.ok || (response.status >= 200 && response.status < 400)) {
            return { success: true };
        }

        return {
            success: false,
            error: `Webhook returned status ${response.status}`,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Webhook URL timed out after 5 seconds',
                };
            }
            return {
                success: false,
                error: error.message,
            };
        }
        return {
            success: false,
            error: 'Failed to connect to webhook URL',
        };
    }
}

/**
 * Manually retries a failed webhook delivery
 */
export async function retryWebhookDelivery(
    deliveryId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the delivery log
        const deliveryLog = await repository.getWebhookDeliveryLog<WebhookDeliveryLog>(
            user.id,
            deliveryId
        );

        if (!deliveryLog) {
            return { success: false, error: 'Delivery log not found' };
        }

        // Get the webhook configuration
        const webhook = await repository.getWebhookConfig<WebhookConfiguration>(
            user.id,
            deliveryLog.webhookId
        );

        if (!webhook) {
            return { success: false, error: 'Webhook configuration not found' };
        }

        if (!webhook.active) {
            return { success: false, error: 'Webhook is not active' };
        }

        // Attempt delivery
        const deliveryResult = await deliverWebhook(
            webhook,
            deliveryLog.event,
            deliveryLog.payload
        );

        // Update delivery log
        await repository.updateWebhookDeliveryLog(
            user.id,
            deliveryId,
            {
                status: deliveryResult.success ? 'success' : 'failed',
                attempts: deliveryLog.attempts + 1,
                lastAttemptAt: new Date().toISOString(),
                error: deliveryResult.error,
            }
        );

        revalidatePath('/open-house/settings');

        return deliveryResult;
    } catch (error) {
        console.error('Error retrying webhook delivery:', error);
        return {
            success: false,
            error: 'Failed to retry webhook delivery. Please try again.',
        };
    }
}

/**
 * Gets webhook delivery logs for a webhook configuration
 */
export async function getWebhookDeliveryLogs(
    webhookId: string,
    limit: number = 50
): Promise<{
    logs: WebhookDeliveryLog[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { logs: [], error: 'Not authenticated' };
        }

        const repository = getRepository();
        const result = await repository.queryWebhookDeliveryLogs<WebhookDeliveryLog>(
            user.id,
            webhookId,
            {
                scanIndexForward: false, // Most recent first
                limit,
            }
        );

        return { logs: result.items };
    } catch (error) {
        console.error('Error fetching webhook delivery logs:', error);
        return {
            logs: [],
            error: 'Failed to fetch delivery logs. Please try again.',
        };
    }
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Generates a secure webhook secret for signature verification
 */
function generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}

/**
 * Delivers a webhook event to a configured endpoint
 * Validates Requirements: 10.3, 10.5
 */
async function deliverWebhook(
    webhook: WebhookConfiguration,
    event: WebhookEvent,
    payload: any
): Promise<{ success: boolean; error?: string }> {
    try {
        // Create webhook payload
        const webhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data: payload,
        };

        // Generate signature using webhook secret
        const signature = await generateWebhookSignature(
            JSON.stringify(webhookPayload),
            webhook.secret || ''
        );

        // Send webhook request
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bayon-Coagent-Webhook/1.0',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': event,
            },
            body: JSON.stringify(webhookPayload),
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.ok) {
            return { success: true };
        }

        return {
            success: false,
            error: `Webhook returned status ${response.status}`,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Webhook delivery timed out',
                };
            }
            return {
                success: false,
                error: error.message,
            };
        }
        return {
            success: false,
            error: 'Failed to deliver webhook',
        };
    }
}

/**
 * Generates HMAC-SHA256 signature for webhook payload
 */
async function generateWebhookSignature(
    payload: string,
    secret: string
): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

/**
 * Triggers webhook delivery for an event with retry logic
 * Validates Requirements: 10.3, 10.5
 * 
 * This function is called internally when webhook events occur
 */
export async function triggerWebhookEvent(
    userId: string,
    event: WebhookEvent,
    payload: any
): Promise<void> {
    try {
        const repository = getRepository();

        // Get all active webhooks for this user that are subscribed to this event
        const webhooksResult = await repository.queryWebhookConfigs<WebhookConfiguration>(
            userId
        );

        const activeWebhooks = webhooksResult.items.filter(
            (webhook) => webhook.active && webhook.events.includes(event)
        );

        // Deliver to each webhook with retry logic (Requirement 10.5)
        for (const webhook of activeWebhooks) {
            await deliverWebhookWithRetry(webhook, event, payload, userId);
        }
    } catch (error) {
        console.error('Error triggering webhook event:', error);
        // Don't throw - webhook failures shouldn't block the main operation
    }
}

/**
 * Delivers webhook with exponential backoff retry logic
 * Validates Requirements: 10.5
 */
async function deliverWebhookWithRetry(
    webhook: WebhookConfiguration,
    event: WebhookEvent,
    payload: any,
    userId: string,
    maxRetries: number = 3
): Promise<void> {
    const repository = getRepository();
    const deliveryId = `delivery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let attempts = 0;
    let lastError: string | undefined;
    let success = false;

    // Retry with exponential backoff: 1s, 2s, 4s (Requirement 10.5)
    while (attempts < maxRetries && !success) {
        attempts++;

        // Attempt delivery
        const result = await deliverWebhook(webhook, event, payload);
        success = result.success;
        lastError = result.error;

        if (!success && attempts < maxRetries) {
            // Wait before retry with exponential backoff
            const delayMs = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    // Log the delivery attempt
    const now = new Date().toISOString();
    const deliveryLog: WebhookDeliveryLog = {
        deliveryId,
        webhookId: webhook.webhookId,
        event,
        payload,
        status: success ? 'success' : 'failed',
        attempts,
        lastAttemptAt: now,
        error: lastError,
        createdAt: now,
    };

    try {
        await repository.createWebhookDeliveryLog(
            userId,
            webhook.webhookId,
            deliveryId,
            deliveryLog
        );
    } catch (error) {
        console.error('Error logging webhook delivery:', error);
        // Don't throw - logging failures shouldn't block the operation
    }
}
