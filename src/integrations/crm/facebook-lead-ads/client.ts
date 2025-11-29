/**
 * Facebook Lead Ads API Client
 * Handles API communication with Facebook Lead Ads
 */

import type {
    LeadAdForm,
    FacebookLead,
    LeadAdFormField,
    ProcessedLead,
} from './types';
import {
    LeadAdFormSchema,
    FacebookLeadSchema,
    ProcessedLeadSchema,
} from './schemas';

const API_BASE_URL = 'https://graph.facebook.com/v18.0';

/**
 * Facebook Lead Ads Client Class
 */
export class FacebookLeadAdsClient {
    private accessToken: string;
    private baseUrl: string;

    constructor(accessToken: string, baseUrl: string = API_BASE_URL) {
        this.accessToken = accessToken;
        this.baseUrl = baseUrl;
    }

    /**
     * Make authenticated request to Facebook Graph API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const separator = endpoint.includes('?') ? '&' : '?';
        const urlWithToken = `${url}${separator}access_token=${this.accessToken}`;

        try {
            const response = await fetch(urlWithToken, options);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(
                    `Facebook API error: ${response.status} - ${error.error?.message || response.statusText
                    }`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Facebook Lead Ads API request failed:', error);
            throw error;
        }
    }

    /**
     * Get lead forms for a Facebook page
     */
    async getLeadForms(pageId: string): Promise<LeadAdForm[]> {
        const response = await this.request<{ data: LeadAdForm[] }>(
            `/${pageId}/leadgen_forms?fields=id,name,status,locale,questions,privacy_policy,created_time`
        );

        // Validate response
        return response.data.map(form => LeadAdFormSchema.parse(form));
    }

    /**
     * Get a specific lead form by ID
     */
    async getLeadForm(formId: string): Promise<LeadAdForm> {
        const response = await this.request<LeadAdForm>(
            `/${formId}?fields=id,name,status,locale,questions,privacy_policy,created_time`
        );

        return LeadAdFormSchema.parse(response);
    }

    /**
     * Get leads from a specific form
     */
    async getLeads(formId: string, options?: {
        limit?: number;
        after?: string;
    }): Promise<{ leads: FacebookLead[]; paging?: any }> {
        let endpoint = `/${formId}/leads?fields=id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform,field_data`;

        if (options?.limit) {
            endpoint += `&limit=${options.limit}`;
        }
        if (options?.after) {
            endpoint += `&after=${options.after}`;
        }

        const response = await this.request<{
            data: FacebookLead[];
            paging?: any;
        }>(endpoint);

        // Parse and extract common fields
        const leads = response.data.map(lead => {
            const extracted = this.extractCommonFields(lead.field_data);
            return FacebookLeadSchema.parse({
                ...lead,
                ...extracted,
            });
        });

        return {
            leads,
            paging: response.paging,
        };
    }

    /**
     * Get a specific lead by ID
     */
    async getLead(leadId: string): Promise<FacebookLead> {
        const response = await this.request<FacebookLead>(
            `/${leadId}?fields=id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform,field_data`
        );

        const extracted = this.extractCommonFields(response.field_data);
        return FacebookLeadSchema.parse({
            ...response,
            ...extracted,
        });
    }

    /**
     * Extract common fields from field_data array
     */
    private extractCommonFields(fieldData: LeadAdFormField[]): {
        email?: string;
        phone_number?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
    } {
        const extracted: any = {};

        fieldData.forEach(field => {
            const value = field.values[0]; // Get first value
            switch (field.key.toLowerCase()) {
                case 'email':
                    extracted.email = value;
                    break;
                case 'phone_number':
                case 'phone':
                    extracted.phone_number = value;
                    break;
                case 'full_name':
                    extracted.full_name = value;
                    break;
                case 'first_name':
                    extracted.first_name = value;
                    break;
                case 'last_name':
                    extracted.last_name = value;
                    break;
            }
        });

        return extracted;
    }

    /**
     * Process lead data and map to internal client structure
     */
    async processLead(
        lead: FacebookLead,
        formName?: string,
        fieldMapping?: Record<string, string>
    ): Promise<ProcessedLead> {
        const firstName = lead.first_name || lead.full_name?.split(' ')[0];
        const lastName = lead.last_name || lead.full_name?.split(' ').slice(1).join(' ');
        const name = lead.full_name || `${firstName || ''} ${lastName || ''}`.trim();

        const processed: ProcessedLead = {
            facebookLeadId: lead.id,
            name: name || 'Unknown',
            firstName,
            lastName,
            email: lead.email,
            phone: lead.phone_number,
            source: 'facebook_lead_ads',
            formId: lead.form_id,
            formName: formName || lead.form_name,
            campaignInfo: {
                adId: lead.ad_id,
                adName: lead.ad_name,
                adsetId: lead.adset_id,
                campaignId: lead.campaign_id,
            },
            rawFieldData: lead.field_data,
            createdAt: lead.created_time,
        };

        // Apply custom field mapping if provided
        if (fieldMapping) {
            const customFields: Record<string, any> = {};
            lead.field_data.forEach(field => {
                const mappedKey = fieldMapping[field.key];
                if (mappedKey) {
                    customFields[mappedKey] = field.values[0];
                }
            });
            processed.customFields = customFields;
        }

        return ProcessedLeadSchema.parse(processed);
    }

    /**
     * Subscribe to lead gen webhook for a page
     * Note: This requires page access token with manage_pages permission
     */
    async subscribeToLeadgen(pageId: string): Promise<{ success: boolean }> {
        const response = await this.request<{ success: boolean }>(
            `/${pageId}/subscribed_apps`,
            {
                method: 'POST',
                body: JSON.stringify({
                    subscribed_fields: ['leadgen'],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response;
    }
}

/**
 * Create a Facebook Lead Ads client instance
 */
export function createFacebookLeadAdsClient(accessToken: string): FacebookLeadAdsClient {
    return new FacebookLeadAdsClient(accessToken);
}
