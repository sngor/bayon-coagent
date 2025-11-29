/**
 * Calendly Integration Types
 * TypeScript interfaces for Calendly scheduling data structures
 */

/**
 * Calendly user information
 */
export interface CalendlyUser {
    uri: string;
    name: string;
    slug: string;
    email: string;
    scheduling_url: string;
    timezone: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Calendly event type
 */
export interface CalendlyEventType {
    uri: string;
    name: string;
    active: boolean;
    slug: string;
    scheduling_url: string;
    duration: number; // in minutes
    kind: 'solo' | 'group' | 'collective' | 'round_robin';
    pooling_type?: 'round_robin' | 'collective';
    type: 'StandardEventType' | 'CustomEventType';
    color: string;
    created_at: string;
    updated_at: string;
    internal_note?: string;
    description_plain?: string;
    description_html?: string;
}

/**
 * Calendly invitee (attendee)
 */
export interface CalendlyInvitee {
    uri: string;
    email: string;
    name: string;
    first_name?: string;
    last_name?: string;
    timezone: string;
    created_at: string;
    updated_at: string;
    event: string; // URI to the event
    questions_and_answers?: Array<{
        question: string;
        answer: string;
        position: number;
    }>;
    tracking?: {
        utm_campaign?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_content?: string;
        utm_term?: string;
        salesforce_uuid?: string;
    };
    text_reminder_number?: string;
    rescheduled: boolean;
    old_invitee?: string; // URI if rescheduled
    new_invitee?: string; // URI if rescheduled
    cancel_url: string;
    reschedule_url: string;
}

/**
 * Calendly scheduled event
 */
export interface CalendlyEvent {
    uri: string;
    name: string;
    status: 'active' | 'canceled';
    start_time: string;
    end_time: string;
    event_type: string; // URI
    location: {
        type: 'physical' | 'outbound_call' | 'inbound_call' | 'zoom' | 'google_meet' | 'microsoft_teams' | 'custom';
        location?: string;
        join_url?: string;
    };
    invitees_counter: {
        total: number;
        active: number;
        limit: number;
    };
    created_at: string;
    updated_at: string;
    event_memberships: Array<{
        user: string; // URI
    }>;
    event_guests?: Array<{
        email: string;
        created_at: string;
    }>;
    cancellation?: {
        canceled_by: string;
        reason?: string;
        canceler_type: 'host' | 'invitee';
    };
}

/**
 * Calendly webhook subscription
 */
export interface CalendlyWebhookSubscription {
    uri: string;
    callback_url: string;
    created_at: string;
    updated_at: string;
    retry_started_at?: string;
    state: 'active' | 'disabled';
    events: CalendlyWebhookEvent[];
    scope: 'user' | 'organization';
    organization: string; // URI
    user?: string; // URI if user scope
    creator: string; // URI
}

/**
 * Calendly webhook event types
 */
export type CalendlyWebhookEvent =
    | 'invitee.created'
    | 'invitee.canceled'
    | 'routing_form_submission.created';

/**
 * Calendly webhook payload
 */
export interface CalendlyWebhookPayload {
    event: CalendlyWebhookEvent;
    time: string;
    payload: {
        event?: string; // Event URI
        invitee?: string; // Invitee URI
        questions_and_answers?: Array<{
            question: string;
            answer: string;
        }>;
        // For cancel events
        cancellation?: {
            canceler_type: 'host' | 'invitee';
            canceled_by: string;
        };
    };
}

/**
 * Calendly sync configuration
 */
export interface CalendlySyncConfig {
    userId: string;
    calendlyUserId: string;
    syncEvents: boolean;
    autoCreateActivities: boolean;
    defaultEventTypes?: string[]; // Event type URIs to sync
    webhookUrl?: string;
}

/**
 * Processed Calendly event (mapped to internal structure)
 */
export interface ProcessedCalendlyEvent {
    calendlyUri: string;
    eventName: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    startTime: string;
    endTime: string;
    status: 'active' | 'canceled';
    location: {
        type: string;
        details?: string;
    };
    eventTypeUri: string;
    createdAt: string;
    canceledAt?: string;
    cancellationReason?: string;
}
