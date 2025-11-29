/**
 * HubSpot API Client
 * Handles API communication with HubSpot CRM
 */

import type {
    HubSpotContact,
    HubSpotCompany,
    HubSpotDeal,
    HubSpotTimelineEvent,
    HubSpotProperty,
    HubSpotBatchInput,
    HubSpotSearchRequest,
    HubSpotSearchResult,
} from './types';
import {
    HubSpotContactSchema,
    HubSpotCompanySchema,
    HubSpotDealSchema,
} from './schemas';

const API_BASE_URL = 'https://api.hubapi.com';

/**
 * HubSpot API Client Class
 */
export class HubSpotClient {
    private accessToken: string;
    private baseUrl: string;

    constructor(accessToken: string, baseUrl: string = API_BASE_URL) {
        this.accessToken = accessToken;
        this.baseUrl = baseUrl;
    }

    /**
     * Make authenticated request to HubSpot API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
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
                    `HubSpot API error: ${response.status} - ${error.message || response.statusText
                    }`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('HubSpot API request failed:', error);
            throw error;
        }
    }

    // === Contacts ===

    /**
     * Create a new contact
     */
    async createContact(properties: Record<string, any>): Promise<HubSpotContact> {
        const response = await this.request<HubSpotContact>(
            '/crm/v3/objects/contacts',
            {
                method: 'POST',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotContactSchema.parse(response);
    }

    /**
     * Get a contact by ID
     */
    async getContact(contactId: string, properties?: string[]): Promise<HubSpotContact> {
        const params = properties ? `?properties=${properties.join(',')}` : '';
        const response = await this.request<HubSpotContact>(
            `/crm/v3/objects/contacts/${contactId}${params}`
        );
        return HubSpotContactSchema.parse(response);
    }

    /**
     * Update a contact
     */
    async updateContact(contactId: string, properties: Record<string, any>): Promise<HubSpotContact> {
        const response = await this.request<HubSpotContact>(
            `/crm/v3/objects/contacts/${contactId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotContactSchema.parse(response);
    }

    /**
     * Search contacts
     */
    async searchContacts(request: HubSpotSearchRequest): Promise<HubSpotSearchResult<HubSpotContact>> {
        return await this.request<HubSpotSearchResult<HubSpotContact>>(
            '/crm/v3/objects/contacts/search',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
    }

    // === Companies ===

    /**
     * Create a new company
     */
    async createCompany(properties: Record<string, any>): Promise<HubSpotCompany> {
        const response = await this.request<HubSpotCompany>(
            '/crm/v3/objects/companies',
            {
                method: 'POST',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotCompanySchema.parse(response);
    }

    /**
     * Get a company by ID
     */
    async getCompany(companyId: string, properties?: string[]): Promise<HubSpotCompany> {
        const params = properties ? `?properties=${properties.join(',')}` : '';
        const response = await this.request<HubSpotCompany>(
            `/crm/v3/objects/companies/${companyId}${params}`
        );
        return HubSpotCompanySchema.parse(response);
    }

    /**
     * Update a company
     */
    async updateCompany(companyId: string, properties: Record<string, any>): Promise<HubSpotCompany> {
        const response = await this.request<HubSpotCompany>(
            `/crm/v3/objects/companies/${companyId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotCompanySchema.parse(response);
    }

    // === Deals ===

    /**
     * Create a new deal
     */
    async createDeal(properties: Record<string, any>): Promise<HubSpotDeal> {
        const response = await this.request<HubSpotDeal>(
            '/crm/v3/objects/deals',
            {
                method: 'POST',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotDealSchema.parse(response);
    }

    /**
     * Get a deal by ID
     */
    async getDeal(dealId: string, properties?: string[]): Promise<HubSpotDeal> {
        const params = properties ? `?properties=${properties.join(',')}` : '';
        const response = await this.request<HubSpotDeal>(
            `/crm/v3/objects/deals/${dealId}${params}`
        );
        return HubSpotDealSchema.parse(response);
    }

    /**
     * Update a deal
     */
    async updateDeal(dealId: string, properties: Record<string, any>): Promise<HubSpotDeal> {
        const response = await this.request<HubSpotDeal>(
            `/crm/v3/objects/deals/${dealId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ properties }),
            }
        );
        return HubSpotDealSchema.parse(response);
    }

    /**
     * Search deals
     */
    async searchDeals(request: HubSpotSearchRequest): Promise<HubSpotSearchResult<HubSpotDeal>> {
        return await this.request<HubSpotSearchResult<HubSpotDeal>>(
            '/crm/v3/objects/deals/search',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
    }

    // === Associations ===

    /**
     * Associate a contact with a company
     */
    async associateContactWithCompany(contactId: string, companyId: string): Promise<void> {
        await this.request(
            `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`,
            {
                method: 'PUT',
            }
        );
    }

    /**
     * Associate a deal with a contact
     */
    async associateDealWithContact(dealId: string, contactId: string): Promise<void> {
        await this.request(
            `/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
            {
                method: 'PUT',
            }
        );
    }

    // === Properties ===

    /**
     * Get contact properties
     */
    async getContactProperties(): Promise<HubSpotProperty[]> {
        const response = await this.request<{ results: HubSpotProperty[] }>(
            '/crm/v3/properties/contacts'
        );
        return response.results;
    }

    /**
     * Create a custom property
     */
    async createProperty(
        objectType: 'contacts' | 'companies' | 'deals',
        property: Partial<HubSpotProperty>
    ): Promise<HubSpotProperty> {
        return await this.request<HubSpotProperty>(
            `/crm/v3/properties/${objectType}`,
            {
                method: 'POST',
                body: JSON.stringify(property),
            }
        );
    }

    // === Batch Operations ===

    /**
     * Batch create contacts
     */
    async batchCreateContacts(contacts: HubSpotBatchInput[]): Promise<HubSpotContact[]> {
        const response = await this.request<{ results: HubSpotContact[] }>(
            '/crm/v3/objects/contacts/batch/create',
            {
                method: 'POST',
                body: JSON.stringify({ inputs: contacts }),
            }
        );
        return response.results;
    }
}

/**
 * Create a HubSpot client instance
 */
export function createHubSpotClient(accessToken: string): HubSpotClient {
    return new HubSpotClient(accessToken);
}
