/**
 * Facebook Lead Ads Integration Types
 * TypeScript interfaces for Facebook Lead Ads data structures
 */

/**
 * Facebook Lead Ads form field
 */
export interface LeadAdFormField {
    key: string;
    label?: string;
    type: 'text' | 'email' | 'phone' | 'date' | 'zip' | 'custom';
    values: string[];
}

/**
 * Facebook Lead Ads lead data
 */
export interface FacebookLead {
    id: string;
    created_time: string;
    ad_id: string;
    ad_name?: string;
    adset_id?: string;
    adset_name?: string;
    campaign_id?: string;
    campaign_name?: string;
    form_id: string;
    form_name?: string;
    platform?: 'facebook' | 'instagram';
    field_data: LeadAdFormField[];
    // Extracted common fields
    email?: string;
    phone_number?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
}

/**
 * Facebook Lead Ads form
 */
export interface LeadAdForm {
    id: string;
    name: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    locale: string;
    questions: Array<{
        key: string;
        label: string;
        type: string;
    }>;
    privacy_policy?: {
        url: string;
        link_text: string;
    };
    created_time: string;
    updated_time?: string;
}

/**
 * Facebook Lead Ads webhook notification
 */
export interface LeadAdWebhookNotification {
    object: 'page';
    entry: Array<{
        id: string;
        time: number;
        changes: Array<{
            field: 'leadgen';
            value: {
                ad_id: string;
                form_id: string;
                leadgen_id: string;
                created_time: number;
                page_id: string;
                adgroup_id?: string;
            };
        }>;
    }>;
}

/**
 * Facebook Lead Ads subscription
 */
export interface LeadAdSubscription {
    pageId: string;
    formId: string;
    userId: string;
    webhookUrl: string;
    active: boolean;
    createdAt: number;
    lastReceivedAt?: number;
}

/**
 * Facebook Lead Ads sync configuration
 */
export interface LeadAdSyncConfig {
    userId: string;
    pageId: string;
    formIds?: string[]; // If empty, sync all forms
    autoCreateClients: boolean;
    assignToAgent?: string;
    defaultTags?: string[];
    fieldMapping?: Record<string, string>; // Map FB field to client field
}

/**
 * Processed lead data (after mapping to internal client structure)
 */
export interface ProcessedLead {
    facebookLeadId: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    source: 'facebook_lead_ads';
    formId: string;
    formName?: string;
    campaignInfo?: {
        adId: string;
        adName?: string;
        adsetId?: string;
        campaignId?: string;
    };
    rawFieldData: LeadAdFormField[];
    customFields?: Record<string, any>;
    createdAt: string;
}
