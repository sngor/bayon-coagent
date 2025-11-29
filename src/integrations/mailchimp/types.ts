/**
 * Mailchimp Integration Types
 * 
 * Type definitions for Mailchimp API integration.
 */

import { z } from 'zod';

/**
 * Mailchimp Connection Metadata
 */
export interface MailchimpMetadata {
    dc: string;                    // Data center (e.g., 'us1', 'us2')
    apiEndpoint: string;           // Full API endpoint URL
    accountId: string;             // Mailchimp account ID
    accountName: string;           // Account name
    role: string;                  // User role
    loginUrl: string;              // Account login URL
}

/**
 * Mailchimp Audience (List)
 */
export interface MailchimpAudience {
    id: string;
    web_id: number;
    name: string;
    contact: {
        company: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone?: string;
    };
    permission_reminder: string;
    use_archive_bar: boolean;
    campaign_defaults: {
        from_name: string;
        from_email: string;
        subject: string;
        language: string;
    };
    notify_on_subscribe?: string;
    notify_on_unsubscribe?: string;
    date_created: string;
    list_rating: number;
    email_type_option: boolean;
    subscribe_url_short: string;
    subscribe_url_long: string;
    beamer_address: string;
    visibility: 'pub' | 'prv';
    double_optin: boolean;
    has_welcome: boolean;
    marketing_permissions: boolean;
    stats: {
        member_count: number;
        unsubscribe_count: number;
        cleaned_count: number;
        member_count_since_send: number;
        unsubscribe_count_since_send: number;
        cleaned_count_since_send: number;
        campaign_count: number;
        campaign_last_sent?: string;
        merge_field_count: number;
        avg_sub_rate: number;
        avg_unsub_rate: number;
        target_sub_rate: number;
        open_rate: number;
        click_rate: number;
        last_sub_date?: string;
        last_unsub_date?: string;
    };
}

/**
 * Mailchimp Contact/Member
 */
export interface MailchimpContact {
    id?: string;
    email_address: string;
    unique_email_id?: string;
    email_type?: 'html' | 'text';
    status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional';
    merge_fields?: Record<string, any>;
    interests?: Record<string, boolean>;
    language?: string;
    vip?: boolean;
    location?: {
        latitude?: number;
        longitude?: number;
        gmtoff?: number;
        dstoff?: number;
        country_code?: string;
        timezone?: string;
    };
    marketing_permissions?: Array<{
        marketing_permission_id: string;
        enabled: boolean;
    }>;
    ip_signup?: string;
    timestamp_signup?: string;
    ip_opt?: string;
    timestamp_opt?: string;
    tags?: string[];
}

/**
 * Mailchimp Campaign
 */
export interface MailchimpCampaign {
    id?: string;
    web_id?: number;
    parent_campaign_id?: string;
    type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variate';
    create_time?: string;
    archive_url?: string;
    long_archive_url?: string;
    status?: 'save' | 'paused' | 'schedule' | 'sending' | 'sent';
    emails_sent?: number;
    send_time?: string;
    content_type: 'template' | 'html' | 'text';
    needs_block_refresh?: boolean;
    resendable?: boolean;
    recipients: {
        list_id: string;
        list_is_active?: boolean;
        list_name?: string;
        segment_text?: string;
        recipient_count?: number;
        segment_opts?: {
            saved_segment_id?: number;
            prebuilt_segment_id?: string;
            match?: 'any' | 'all';
            conditions?: any[];
        };
    };
    settings: {
        subject_line: string;
        preview_text?: string;
        title: string;
        from_name: string;
        reply_to: string;
        use_conversation?: boolean;
        to_name?: string;
        folder_id?: string;
        authenticate?: boolean;
        auto_footer?: boolean;
        inline_css?: boolean;
        auto_tweet?: boolean;
        fb_comments?: boolean;
        timewarp?: boolean;
        template_id?: number;
        drag_and_drop?: boolean;
    };
    tracking?: {
        opens?: boolean;
        html_clicks?: boolean;
        text_clicks?: boolean;
        goal_tracking?: boolean;
        ecomm360?: boolean;
        google_analytics?: string;
        clicktale?: string;
    };
}

/**
 * Mailchimp Campaign Content
 */
export interface MailchimpCampaignContent {
    html?: string;
    plain_text?: string;
    template?: {
        id: number;
        sections?: Record<string, any>;
    };
}

/**
 * Mailchimp API Response (generic)
 */
export interface MailchimpAPIResponse<T> {
    data?: T;
    total_items?: number;
    _links?: Array<{
        rel: string;
        href: string;
        method: string;
        targetSchema?: string;
        schema?: string;
    }>;
}

// Zod Schemas

export const MailchimpMetadataSchema = z.object({
    dc: z.string(),
    apiEndpoint: z.string(),
    accountId: z.string(),
    accountName: z.string(),
    role: z.string(),
    loginUrl: z.string()
});

export const MailchimpContactSchema = z.object({
    id: z.string().optional(),
    email_address: z.string().email(),
    status: z.enum(['subscribed', 'unsubscribed', 'cleaned', 'pending', 'transactional']),
    merge_fields: z.record(z.any()).optional(),
    interests: z.record(z.boolean()).optional(),
    language: z.string().optional(),
    vip: z.boolean().optional(),
    tags: z.array(z.string()).optional()
});
