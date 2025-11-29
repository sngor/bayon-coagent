/**
 * Follow Up Boss Integration Types
 * TypeScript interfaces for Follow Up Boss CRM data structures
 */

/**
 * Follow Up Boss lead data structure
 */
export interface FollowUpBossLead {
    id?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phones?: Array<{
        number: string;
        type?: 'mobile' | 'home' | 'work' | 'other';
        primary?: boolean;
    }>;
    source?: string;
    status?: 'new' | 'active' | 'nurture' | 'archived';
    assigned?: string; // User ID of assigned agent
    tags?: string[];
    customFields?: Record<string, any>;
    address?: {
        street?: string;
        unit?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    dueDate?: string; // ISO 8601 date string
    created?: number; // Unix timestamp
    updated?: number; // Unix timestamp
}

/**
 * Follow Up Boss contact data structure
 */
export interface FollowUpBossContact {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phones?: Array<{
        number: string;
        type?: 'mobile' | 'home' | 'work' | 'other';
        primary?: boolean;
    }>;
    source?: string;
    status?: string;
    assigned?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    created?: number;
    updated?: number;
}

/**
 * Follow Up Boss activity/note data structure
 */
export interface FollowUpBossActivity {
    id?: string;
    personId: string;
    type: 'note' | 'call' | 'email' | 'meeting' | 'text' | 'task';
    subject?: string;
    body?: string;
    created?: number;
    createdBy?: string;
    dueDate?: string;
    completed?: boolean;
}

/**
 * Follow Up Boss API response wrapper
 */
export interface FollowUpBossAPIResponse<T> {
    data: T;
    _metadata?: {
        total?: number;
        count?: number;
        offset?: number;
        limit?: number;
    };
}

/**
 * Follow Up Boss connection metadata
 */
export interface FollowUpBossConnection {
    userId: string;
    apiKey: string;
    teamId?: string;
    connected: boolean;
    lastSync?: number;
    metadata?: Record<string, any>;
}

/**
 * Follow Up Boss webhook event types
 */
export type FollowUpBossWebhookEvent =
    | 'person.created'
    | 'person.updated'
    | 'person.deleted'
    | 'action.created'
    | 'action.completed'
    | 'email.received'
    | 'call.received';

/**
 * Follow Up Boss webhook payload
 */
export interface FollowUpBossWebhookPayload {
    event: FollowUpBossWebhookEvent;
    data: FollowUpBossLead | FollowUpBossContact | FollowUpBossActivity;
    timestamp: number;
    teamId?: string;
}

/**
 * Follow Up Boss sync options
 */
export interface FollowUpBossSyncOptions {
    direction?: 'import' | 'export' | 'bidirectional';
    syncLeads?: boolean;
    syncContacts?: boolean;
    syncActivities?: boolean;
    filters?: {
        status?: string[];
        tags?: string[];
        dateRange?: {
            start: string;
            end: string;
        };
    };
}

/**
 * Follow Up Boss create/update lead request
 */
export interface CreateFollowUpBossLeadRequest {
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phones?: Array<{
        number: string;
        type?: string;
    }>;
    source?: string;
    assigned?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}
