/**
 * Facebook Lead Ads Integration Schemas
 * Zod validation schemas for Facebook Lead Ads data structures
 */

import { z } from 'zod';

/**
 * Lead Ad form field schema
 */
export const LeadAdFormFieldSchema = z.object({
    key: z.string(),
    label: z.string().optional(),
    type: z.enum(['text', 'email', 'phone', 'date', 'zip', 'custom']),
    values: z.array(z.string()),
});

/**
 * Facebook lead schema
 */
export const FacebookLeadSchema = z.object({
    id: z.string(),
    created_time: z.string(),
    ad_id: z.string(),
    ad_name: z.string().optional(),
    adset_id: z.string().optional(),
    adset_name: z.string().optional(),
    campaign_id: z.string().optional(),
    campaign_name: z.string().optional(),
    form_id: z.string(),
    form_name: z.string().optional(),
    platform: z.enum(['facebook', 'instagram']).optional(),
    field_data: z.array(LeadAdFormFieldSchema),
    email: z.string().email().optional(),
    phone_number: z.string().optional(),
    full_name: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
});

/**
 * Lead Ad form schema
 */
export const LeadAdFormSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']),
    locale: z.string(),
    questions: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.string(),
    })),
    privacy_policy: z.object({
        url: z.string().url(),
        link_text: z.string(),
    }).optional(),
    created_time: z.string(),
    updated_time: z.string().optional(),
});

/**
 * Lead Ad webhook notification schema
 */
export const LeadAdWebhookNotificationSchema = z.object({
    object: z.literal('page'),
    entry: z.array(z.object({
        id: z.string(),
        time: z.number(),
        changes: z.array(z.object({
            field: z.literal('leadgen'),
            value: z.object({
                ad_id: z.string(),
                form_id: z.string(),
                leadgen_id: z.string(),
                created_time: z.number(),
                page_id: z.string(),
                adgroup_id: z.string().optional(),
            }),
        })),
    })),
});

/**
 * Lead Ad subscription schema
 */
export const LeadAdSubscriptionSchema = z.object({
    pageId: z.string(),
    formId: z.string(),
    userId: z.string(),
    webhookUrl: z.string().url(),
    active: z.boolean(),
    createdAt: z.number(),
    lastReceivedAt: z.number().optional(),
});

/**
 * Lead Ad sync config schema
 */
export const LeadAdSyncConfigSchema = z.object({
    userId: z.string(),
    pageId: z.string(),
    formIds: z.array(z.string()).optional(),
    autoCreateClients: z.boolean(),
    assignToAgent: z.string().optional(),
    defaultTags: z.array(z.string()).optional(),
    fieldMapping: z.record(z.string()).optional(),
});

/**
 * Processed lead schema
 */
export const ProcessedLeadSchema = z.object({
    facebookLeadId: z.string(),
    name: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.literal('facebook_lead_ads'),
    formId: z.string(),
    formName: z.string().optional(),
    campaignInfo: z.object({
        adId: z.string(),
        adName: z.string().optional(),
        adsetId: z.string().optional(),
        campaignId: z.string().optional(),
    }).optional(),
    rawFieldData: z.array(LeadAdFormFieldSchema),
    customFields: z.record(z.any()).optional(),
    createdAt: z.string(),
});
