/**
 * GA4 Integration Types
 */

import { z } from 'zod';

/**
 * GA4 Event Names
 */
export type GA4EventName =
    | 'page_view'
    | 'user_engagement'
    | 'login'
    | 'sign_up'
    | 'generate_lead'
    | 'view_item'
    | 'select_content'
    | 'share'
    | 'search'
    // Custom events
    | 'client_created'
    | 'property_listed'
    | 'lead_captured'
    | 'content_generated'
    | 'social_post_published'
    | 'integration_connected'
    | 'zap_triggered'
    | 'design_exported'
    | 'deal_closed'
    | 'feedback_submitted'
    | 'openhouse_scheduled';

/**
 * GA4 Event Parameters
 */
export interface GA4EventParams {
    // Common parameters
    engagement_time_msec?: number;
    session_id?: string;
    page_location?: string;
    page_title?: string;

    // User properties
    user_id?: string;
    user_type?: 'agent' | 'admin' | 'client';

    // Content parameters
    content_type?: string;
    content_id?: string;
    item_id?: string;

    // Business-specific parameters
    property_type?: string;
    lead_source?: string;
    integration_name?: string;

    // Custom dimensions
    [key: string]: any;
}

/**
 * GA4 Measurement Protocol Event
 */
export interface GA4Event {
    name: GA4EventName;
    params: GA4EventParams;
}

/**
 * GA4 Measurement Protocol Payload
 */
export interface MeasurementPayload {
    client_id: string;
    user_id?: string;
    timestamp_micros?: number;
    user_properties?: Record<string, { value: any }>;
    events: GA4Event[];
    non_personalized_ads?: boolean;
}

/**
 * GA4 Configuration
 */
export interface GA4Config {
    measurementId: string;
    apiSecret: string;
    propertyId?: string;
    streamId?: string;
}

/**
 * GA4 Connection Metadata
 */
export interface GA4ConnectionMetadata {
    measurementId: string;
    propertyId?: string;
    streamId?: string;
    serviceAccountPath?: string;
    lastSyncedAt?: number;
}

/**
 * GA4 Report Request
 */
export interface GA4ReportRequest {
    dateRanges: Array<{
        startDate: string;
        endDate: string;
    }>;
    dimensions: Array<{
        name: string;
    }>;
    metrics: Array<{
        name: string;
    }>;
    dimensionFilter?: any;
    metricFilter?: any;
    limit?: number;
    offset?: number;
}

/**
 * GA4 Report Response
 */
export interface GA4ReportResponse {
    dimensionHeaders: Array<{ name: string }>;
    metricHeaders: Array<{ name: string; type: string }>;
    rows: Array<{
        dimensionValues: Array<{ value: string }>;
        metricValues: Array<{ value: string }>;
    }>;
    rowCount: number;
    metadata?: any;
}

// Zod Schemas

export const GA4EventNameSchema = z.enum([
    'page_view',
    'user_engagement',
    'login',
    'sign_up',
    'generate_lead',
    'view_item',
    'select_content',
    'share',
    'search',
    'client_created',
    'property_listed',
    'lead_captured',
    'content_generated',
    'social_post_published',
    'integration_connected',
    'zap_triggered',
    'design_exported',
    'deal_closed',
    'feedback_submitted',
    'openhouse_scheduled'
]);

export const GA4EventSchema = z.object({
    name: GA4EventNameSchema,
    params: z.record(z.any())
});

export const MeasurementPayloadSchema = z.object({
    client_id: z.string(),
    user_id: z.string().optional(),
    timestamp_micros: z.number().optional(),
    user_properties: z.record(z.object({ value: z.any() })).optional(),
    events: z.array(GA4EventSchema),
    non_personalized_ads: z.boolean().optional()
});

export const GA4ConfigSchema = z.object({
    measurementId: z.string(),
    apiSecret: z.string(),
    propertyId: z.string().optional(),
    streamId: z.string().optional()
});
