/**
 * HubSpot Integration Types
 * TypeScript interfaces for HubSpot CRM data structures
 */

/**
 * HubSpot contact
 */
export interface HubSpotContact {
    id: string;
    properties: {
        email?: string;
        firstname?: string;
        lastname?: string;
        phone?: string;
        company?: string;
        website?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        lifecyclestage?: string;
        hs_lead_status?: string;
        createdate?: string;
        lastmodifieddate?: string;
        [key: string]: any; // Custom properties
    };
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}

/**
 * HubSpot company
 */
export interface HubSpotCompany {
    id: string;
    properties: {
        name?: string;
        domain?: string;
        city?: string;
        state?: string;
        industry?: string;
        phone?: string;
        createdate?: string;
        [key: string]: any;
    };
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}

/**
 * HubSpot deal
 */
export interface HubSpotDeal {
    id: string;
    properties: {
        dealname?: string;
        amount?: string;
        closedate?: string;
        dealstage?: string;
        pipeline?: string;
        createdate?: string;
        [key: string]: any;
    };
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}

/**
 * HubSpot timeline event
 */
export interface HubSpotTimelineEvent {
    id: string;
    eventTemplateId: string;
    email?: string;
    objectId?: string;
    tokens: Record<string, string>;
    timestamp: number;
    extraData?: Record<string, any>;
}

/**
 * HubSpot connection configuration
 */
export interface HubSpotConnection {
    userId: string;
    portalId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scopes: string[];
    connected: boolean;
    lastSync?: number;
}

/**
 * HubSpot sync configuration
 */
export interface HubSpotSyncConfig {
    userId: string;
    syncContacts: boolean;
    syncCompanies: boolean;
    syncDeals: boolean;
    direction: 'import' | 'export' | 'bidirectional';
    contactAssociation?: string; // Owner ID
    propertyMapping?: Record<string, string>;
}

/**
 * HubSpot property definition
 */
export interface HubSpotProperty {
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'datetime' | 'enumeration';
    fieldType: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date';
    description?: string;
    groupName?: string;
    options?: Array<{
        label: string;
        value: string;
        hidden: boolean;
        displayOrder: number;
    }>;
}

/**
 * HubSpot batch operation
 */
export interface HubSpotBatchInput {
    id?: string;
    properties: Record<string, any>;
}

/**
 * HubSpot search request
 */
export interface HubSpotSearchRequest {
    filters?: Array<{
        propertyName: string;
        operator: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'CONTAINS';
        value: string;
    }>;
    sorts?: Array<{
        propertyName: string;
        direction: 'ASCENDING' | 'DESCENDING';
    }>;
    properties?: string[];
    limit?: number;
    after?: string;
}

/**
 * HubSpot search result
 */
export interface HubSpotSearchResult<T> {
    results: T[];
    total: number;
    paging?: {
        next?: {
            after: string;
        };
    };
}
