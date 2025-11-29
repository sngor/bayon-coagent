/**
 * Follow Up Boss API Client
 * Handles API communication with Follow Up Boss CRM
 */

import type {
    FollowUpBossLead,
    FollowUpBossContact,
    FollowUpBossActivity,
    FollowUpBossAPIResponse,
    CreateFollowUpBossLeadRequest,
} from './types';
import {
    FollowUpBossLeadSchema,
    FollowUpBossContactSchema,
    FollowUpBossActivitySchema,
    FollowUpBossAPIResponseSchema,
} from './schemas';

const API_BASE_URL = 'https://api.followupboss.com/v1';

/**
 * Follow Up Boss API Client Class
 */
export class FollowUpBossClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /**
     * Make authenticated request to Follow Up Boss API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(
                    `Follow Up Boss API error: ${response.status} - ${error.message || response.statusText
                    }`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Follow Up Boss API request failed:', error);
            throw error;
        }
    }

    /**
     * Create a new lead in Follow Up Boss
     */
    async createLead(data: CreateFollowUpBossLeadRequest): Promise<FollowUpBossLead> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead>>(
            '/people',
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        );

        // Validate response
        const validated = FollowUpBossLeadSchema.parse(response.data);
        return validated;
    }

    /**
     * Update an existing lead
     */
    async updateLead(
        leadId: string,
        data: Partial<CreateFollowUpBossLeadRequest>
    ): Promise<FollowUpBossLead> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead>>(
            `/people/${leadId}`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );

        const validated = FollowUpBossLeadSchema.parse(response.data);
        return validated;
    }

    /**
     * Get a lead by ID
     */
    async getLead(leadId: string): Promise<FollowUpBossLead> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead>>(
            `/people/${leadId}`
        );

        const validated = FollowUpBossLeadSchema.parse(response.data);
        return validated;
    }

    /**
     * Get a contact by email
     */
    async getContactByEmail(email: string): Promise<FollowUpBossContact | null> {
        try {
            const response = await this.request<FollowUpBossAPIResponse<FollowUpBossContact[]>>(
                `/people?email=${encodeURIComponent(email)}`
            );

            if (response.data && response.data.length > 0) {
                const validated = FollowUpBossContactSchema.parse(response.data[0]);
                return validated;
            }

            return null;
        } catch (error) {
            console.error('Error fetching contact by email:', error);
            return null;
        }
    }

    /**
     * List leads with optional filters
     */
    async listLeads(options?: {
        limit?: number;
        offset?: number;
        status?: string;
        tags?: string[];
    }): Promise<{ leads: FollowUpBossLead[]; total?: number }> {
        const queryParams = new URLSearchParams();

        if (options?.limit) queryParams.append('limit', options.limit.toString());
        if (options?.offset) queryParams.append('offset', options.offset.toString());
        if (options?.status) queryParams.append('status', options.status);
        if (options?.tags) {
            options.tags.forEach(tag => queryParams.append('tag', tag));
        }

        const queryString = queryParams.toString();
        const endpoint = `/people${queryString ? `?${queryString}` : ''}`;

        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead[]>>(
            endpoint
        );

        return {
            leads: response.data,
            total: response._metadata?.total,
        };
    }

    /**
     * Create an activity/note for a lead
     */
    async createActivity(activity: {
        personId: string;
        type: 'note' | 'call' | 'email' | 'meeting' | 'text' | 'task';
        subject?: string;
        body?: string;
        dueDate?: string;
    }): Promise<FollowUpBossActivity> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossActivity>>(
            `/people/${activity.personId}/actions`,
            {
                method: 'POST',
                body: JSON.stringify({
                    type: activity.type,
                    subject: activity.subject,
                    body: activity.body,
                    dueDate: activity.dueDate,
                }),
            }
        );

        const validated = FollowUpBossActivitySchema.parse(response.data);
        return validated;
    }

    /**
     * Get activities for a lead
     */
    async getActivities(personId: string): Promise<FollowUpBossActivity[]> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossActivity[]>>(
            `/people/${personId}/actions`
        );

        return response.data;
    }

    /**
     * Delete a lead
     */
    async deleteLead(leadId: string): Promise<void> {
        await this.request(`/people/${leadId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Add tags to a lead
     */
    async addTags(leadId: string, tags: string[]): Promise<FollowUpBossLead> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead>>(
            `/people/${leadId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ tags }),
            }
        );

        const validated = FollowUpBossLeadSchema.parse(response.data);
        return validated;
    }

    /**
     * Assign a lead to an agent
     */
    async assignLead(leadId: string, userId: string): Promise<FollowUpBossLead> {
        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossLead>>(
            `/people/${leadId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ assigned: userId }),
            }
        );

        const validated = FollowUpBossLeadSchema.parse(response.data);
        return validated;
    }

    /**
     * Search for leads/contacts
     */
    async search(query: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<FollowUpBossContact[]> {
        const queryParams = new URLSearchParams();
        queryParams.append('query', query);

        if (options?.limit) queryParams.append('limit', options.limit.toString());
        if (options?.offset) queryParams.append('offset', options.offset.toString());

        const response = await this.request<FollowUpBossAPIResponse<FollowUpBossContact[]>>(
            `/people/search?${queryParams.toString()}`
        );

        return response.data;
    }
}

/**
 * Create a Follow Up Boss client instance
 */
export function createFollowUpBossClient(apiKey: string): FollowUpBossClient {
    return new FollowUpBossClient(apiKey);
}
