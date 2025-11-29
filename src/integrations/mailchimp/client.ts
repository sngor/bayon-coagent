/**
 * Mailchimp API Client
 * 
 * Client for interacting with the Mailchimp Marketing API.
 * Supports audience management, contact operations, and campaign management.
 */

import { IntegrationConnection } from '../types';
import {
    MailchimpMetadata,
    MailchimpAudience,
    MailchimpContact,
    MailchimpCampaign,
    MailchimpCampaignContent,
    MailchimpAPIResponse
} from './types';

/**
 * Mailchimp API Client
 */
export class MailchimpClient {
    private connection: IntegrationConnection;
    private apiEndpoint: string;
    private accessToken: string;

    constructor(connection: IntegrationConnection) {
        this.connection = connection;

        const metadata = connection.credentials.metadata as MailchimpMetadata;
        if (!metadata?.apiEndpoint) {
            throw new Error('Missing Mailchimp API endpoint in connection metadata');
        }

        this.apiEndpoint = metadata.apiEndpoint;
        this.accessToken = connection.credentials.accessToken!;
    }

    /**
     * Make API request to Mailchimp
     */
    private async makeRequest<T>(
        endpoint: string,
        method: string = 'GET',
        body?: any
    ): Promise<T> {
        const url = `${this.apiEndpoint}/3.0${endpoint}`;

        const options: RequestInit = {
            method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Mailchimp API error (${response.status}): ${error}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    }

    // ==================== Audience Management ====================

    /**
     * List all audiences (lists)
     */
    async listAudiences(options?: {
        count?: number;
        offset?: number;
    }): Promise<MailchimpAPIResponse<MailchimpAudience[]>> {
        const params = new URLSearchParams();
        if (options?.count) params.append('count', options.count.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await this.makeRequest<any>(`/lists${query}`);

        return {
            data: response.lists || [],
            total_items: response.total_items,
            _links: response._links
        };
    }

    /**
     * Get a specific audience
     */
    async getAudience(listId: string): Promise<MailchimpAudience> {
        return await this.makeRequest<MailchimpAudience>(`/lists/${listId}`);
    }

    /**
     * Create a new audience
     */
    async createAudience(audience: Partial<MailchimpAudience>): Promise<MailchimpAudience> {
        return await this.makeRequest<MailchimpAudience>(
            '/lists',
            'POST',
            audience
        );
    }

    /**
     * Update an audience
     */
    async updateAudience(
        listId: string,
        updates: Partial<MailchimpAudience>
    ): Promise<MailchimpAudience> {
        return await this.makeRequest<MailchimpAudience>(
            `/lists/${listId}`,
            'PATCH',
            updates
        );
    }

    /**
     * Delete an audience
     */
    async deleteAudience(listId: string): Promise<void> {
        await this.makeRequest<void>(`/lists/${listId}`, 'DELETE');
    }

    // ==================== Contact Management ====================

    /**
     * List audience members (contacts)
     */
    async listContacts(listId: string, options?: {
        count?: number;
        offset?: number;
        status?: MailchimpContact['status'];
    }): Promise<MailchimpAPIResponse<MailchimpContact[]>> {
        const params = new URLSearchParams();
        if (options?.count) params.append('count', options.count.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.status) params.append('status', options.status);

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await this.makeRequest<any>(`/lists/${listId}/members${query}`);

        return {
            data: response.members || [],
            total_items: response.total_items,
            _links: response._links
        };
    }

    /**
     * Get a specific contact
     */
    async getContact(listId: string, subscriberHash: string): Promise<MailchimpContact> {
        return await this.makeRequest<MailchimpContact>(
            `/lists/${listId}/members/${subscriberHash}`
        );
    }

    /**
     * Add or update a contact
     */
    async addOrUpdateContact(
        listId: string,
        contact: MailchimpContact
    ): Promise<MailchimpContact> {
        // Generate subscriber hash from email
        const crypto = await import('crypto');
        const subscriberHash = crypto
            .createHash('md5')
            .update(contact.email_address.toLowerCase())
            .digest('hex');

        return await this.makeRequest<MailchimpContact>(
            `/lists/${listId}/members/${subscriberHash}`,
            'PUT',
            contact
        );
    }

    /**
     * Add a new contact
     */
    async addContact(listId: string, contact: MailchimpContact): Promise<MailchimpContact> {
        return await this.makeRequest<MailchimpContact>(
            `/lists/${listId}/members`,
            'POST',
            contact
        );
    }

    /**
     * Update a contact
     */
    async updateContact(
        listId: string,
        subscriberHash: string,
        updates: Partial<MailchimpContact>
    ): Promise<MailchimpContact> {
        return await this.makeRequest<MailchimpContact>(
            `/lists/${listId}/members/${subscriberHash}`,
            'PATCH',
            updates
        );
    }

    /**
     * Delete a contact permanently
     */
    async deleteContact(listId: string, subscriberHash: string): Promise<void> {
        await this.makeRequest<void>(
            `/lists/${listId}/members/${subscriberHash}/actions/delete-permanent`,
            'POST'
        );
    }

    /**
     * Unsubscribe a contact
     */
    async unsubscribeContact(listId: string, subscriberHash: string): Promise<MailchimpContact> {
        return await this.updateContact(listId, subscriberHash, {
            status: 'unsubscribed'
        });
    }

    /**
     * Add tags to a contact
     */
    async addTagsToContact(
        listId: string,
        subscriberHash: string,
        tags: string[]
    ): Promise<void> {
        await this.makeRequest<void>(
            `/lists/${listId}/members/${subscriberHash}/tags`,
            'POST',
            {
                tags: tags.map(name => ({ name, status: 'active' }))
            }
        );
    }

    // ==================== Campaign Management ====================

    /**
     * List campaigns
     */
    async listCampaigns(options?: {
        count?: number;
        offset?: number;
        status?: MailchimpCampaign['status'];
    }): Promise<MailchimpAPIResponse<MailchimpCampaign[]>> {
        const params = new URLSearchParams();
        if (options?.count) params.append('count', options.count.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.status) params.append('status', options.status);

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await this.makeRequest<any>(`/campaigns${query}`);

        return {
            data: response.campaigns || [],
            total_items: response.total_items,
            _links: response._links
        };
    }

    /**
     * Get a specific campaign
     */
    async getCampaign(campaignId: string): Promise<MailchimpCampaign> {
        return await this.makeRequest<MailchimpCampaign>(`/campaigns/${campaignId}`);
    }

    /**
     * Create a campaign
     */
    async createCampaign(campaign: Partial<MailchimpCampaign>): Promise<MailchimpCampaign> {
        return await this.makeRequest<MailchimpCampaign>(
            '/campaigns',
            'POST',
            campaign
        );
    }

    /**
     * Update a campaign
     */
    async updateCampaign(
        campaignId: string,
        updates: Partial<MailchimpCampaign>
    ): Promise<MailchimpCampaign> {
        return await this.makeRequest<MailchimpCampaign>(
            `/campaigns/${campaignId}`,
            'PATCH',
            updates
        );
    }

    /**
     * Set campaign content
     */
    async setCampaignContent(
        campaignId: string,
        content: MailchimpCampaignContent
    ): Promise<any> {
        return await this.makeRequest<any>(
            `/campaigns/${campaignId}/content`,
            'PUT',
            content
        );
    }

    /**
     * Send a campaign
     */
    async sendCampaign(campaignId: string): Promise<void> {
        await this.makeRequest<void>(
            `/campaigns/${campaignId}/actions/send`,
            'POST'
        );
    }

    /**
     * Schedule a campaign
     */
    async scheduleCampaign(campaignId: string, scheduleTime: string): Promise<void> {
        await this.makeRequest<void>(
            `/campaigns/${campaignId}/actions/schedule`,
            'POST',
            { schedule_time: scheduleTime }
        );
    }

    /**
     * Delete a campaign
     */
    async deleteCampaign(campaignId: string): Promise<void> {
        await this.makeRequest<void>(`/campaigns/${campaignId}`, 'DELETE');
    }

    // ==================== Account Info ====================

    /**
     * Get account information
     */
    async getAccountInfo(): Promise<any> {
        return await this.makeRequest<any>('/');
    }
}

/**
 * Create Mailchimp client from connection
 */
export function createMailchimpClient(connection: IntegrationConnection): MailchimpClient {
    return new MailchimpClient(connection);
}
