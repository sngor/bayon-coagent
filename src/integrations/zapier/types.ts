/**
 * Zapier Integration Types
 */

import { z } from 'zod';

/**
 * Zapier Webhook Trigger Types
 */
export type ZapierTriggerType =
    | 'client.created'
    | 'client.updated'
    | 'property.listed'
    | 'lead.captured'
    | 'deal.closed'
    | 'review.received'
    | 'openhouse.scheduled'
    | 'document.uploaded'
    | 'analytics.milestone'
    | 'feedback.submitted';

/**
 * Zapier Action Types
 */
export type ZapierActionType =
    | 'send.notification'
    | 'create.task'
    | 'update.crm'
    | 'post.social'
    | 'send.email'
    | 'log.activity';

/**
 * Zap Configuration
 */
export interface ZapConfig {
    id: string;
    name: string;
    description: string;
    triggerType: ZapierTriggerType;
    isActive: boolean;
    webhookUrl?: string;
    filters?: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

/**
 * Zap Template Definition
 */
export interface ZapTemplate {
    id: string;
    name: string;
    description: string;
    category: 'crm' | 'marketing' | 'communication' | 'productivity' | 'analytics';
    triggerType: ZapierTriggerType;
    actions: {
        app: string;
        action: string;
        description: string;
    }[];
    iconUrl?: string;
    setupInstructions: string[];
}

/**
 * Webhook Payload
 */
export interface ZapierWebhookPayload {
    triggerType: ZapierTriggerType;
    timestamp: number;
    data: Record<string, any>;
    metadata?: {
        userId: string;
        source: string;
        [key: string]: any;
    };
}

/**
 * Webhook Verification
 */
export interface WebhookVerification {
    isValid: boolean;
    error?: string;
}

/**
 * Zapier Connection Config
 */
export interface ZapierConnection {
    userId: string;
    subscribedZaps: ZapConfig[];
    webhookEndpoint: string;
    apiKey?: string;
    createdAt: number;
    updatedAt: number;
}

// Zod Schemas

export const ZapierTriggerTypeSchema = z.enum([
    'client.created',
    'client.updated',
    'property.listed',
    'lead.captured',
    'deal.closed',
    'review.received',
    'openhouse.scheduled',
    'document.uploaded',
    'analytics.milestone',
    'feedback.submitted'
]);

export const ZapConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    triggerType: ZapierTriggerTypeSchema,
    isActive: z.boolean(),
    webhookUrl: z.string().url().optional(),
    filters: z.record(z.any()).optional(),
    createdAt: z.number(),
    updatedAt: z.number()
});

export const ZapierWebhookPayloadSchema = z.object({
    triggerType: ZapierTriggerTypeSchema,
    timestamp: z.number(),
    data: z.record(z.any()),
    metadata: z.object({
        userId: z.string(),
        source: z.string()
    }).passthrough().optional()
});
