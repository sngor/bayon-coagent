/**
 * Calendly API Client
 * Handles API communication with Calendly
 */

import type {
    CalendlyUser,
    CalendlyEventType,
    CalendlyEvent,
    CalendlyInvitee,
    CalendlyWebhookSubscription,
    ProcessedCalendlyEvent,
} from './types';
import {
    CalendlyUserSchema,
    CalendlyEventTypeSchema,
    CalendlyEventSchema,
    CalendlyInviteeSchema,
    CalendlyWebhookSubscriptionSchema,
} from './schemas';

const API_BASE_URL = 'https://api.calendly.com';

/**
 * Calendly API Client Class
 */
export class CalendlyClient {
    private accessToken: string;
    private baseUrl: string;

    constructor(accessToken: string, baseUrl: string = API_BASE_URL) {
        this.accessToken = accessToken;
        this.baseUrl = baseUrl;
    }

    /**
     * Make authenticated request to Calendly API
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
                    `Calendly API error: ${response.status} - ${error.message || response.statusText
                    }`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Calendly API request failed:', error);
            throw error;
        }
    }

    /**
     * Get current user information
     */
    async getCurrentUser(): Promise<CalendlyUser> {
        const response = await this.request<{ resource: CalendlyUser }>('/users/me');
        return CalendlyUserSchema.parse(response.resource);
    }

    /**
     * Get user by URI
     */
    async getUser(userUri: string): Promise<CalendlyUser> {
        const response = await this.request<{ resource: CalendlyUser }>(
            userUri.replace(API_BASE_URL, '')
        );
        return CalendlyUserSchema.parse(response.resource);
    }

    /**
     * List event types for a user
     */
    async listEventTypes(userUri: string, options?: {
        active?: boolean;
        count?: number;
    }): Promise<CalendlyEventType[]> {
        const params = new URLSearchParams({ user: userUri });
        if (options?.active !== undefined) params.append('active', String(options.active));
        if (options?.count) params.append('count', String(options.count));

        const response = await this.request<{ collection: CalendlyEventType[] }>(
            `/event_types?${params.toString()}`
        );

        return response.collection.map(et => CalendlyEventTypeSchema.parse(et));
    }

    /**
     * Get a specific event type
     */
    async getEventType(eventTypeUri: string): Promise<CalendlyEventType> {
        const response = await this.request<{ resource: CalendlyEventType }>(
            eventTypeUri.replace(API_BASE_URL, '')
        );
        return CalendlyEventTypeSchema.parse(response.resource);
    }

    /**
     * List scheduled events
     */
    async listEvents(options: {
        user?: string;
        organization?: string;
        min_start_time?: string;
        max_start_time?: string;
        status?: 'active' | 'canceled';
        count?: number;
    }): Promise<CalendlyEvent[]> {
        const params = new URLSearchParams();
        if (options.user) params.append('user', options.user);
        if (options.organization) params.append('organization', options.organization);
        if (options.min_start_time) params.append('min_start_time', options.min_start_time);
        if (options.max_start_time) params.append('max_start_time', options.max_start_time);
        if (options.status) params.append('status', options.status);
        if (options.count) params.append('count', String(options.count));

        const response = await this.request<{ collection: CalendlyEvent[] }>(
            `/scheduled_events?${params.toString()}`
        );

        return response.collection.map(event => CalendlyEventSchema.parse(event));
    }

    /**
     * Get a specific event
     */
    async getEvent(eventUri: string): Promise<CalendlyEvent> {
        const response = await this.request<{ resource: CalendlyEvent }>(
            eventUri.replace(API_BASE_URL, '')
        );
        return CalendlyEventSchema.parse(response.resource);
    }

    /**
     * Get event invitees
     */
    async getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
        const response = await this.request<{ collection: CalendlyInvitee[] }>(
            `/scheduled_events/${eventUri.split('/').pop()}/invitees`
        );

        return response.collection.map(invitee => CalendlyInviteeSchema.parse(invitee));
    }

    /**
     * Get a specific invitee
     */
    async getInvitee(inviteeUri: string): Promise<CalendlyInvitee> {
        const response = await this.request<{ resource: CalendlyInvitee }>(
            inviteeUri.replace(API_BASE_URL, '')
        );
        return CalendlyInviteeSchema.parse(response.resource);
    }

    /**
     * Cancel an event
     */
    async cancelEvent(eventUri: string, reason?: string): Promise<void> {
        await this.request(
            `/scheduled_events/${eventUri.split('/').pop()}/cancellation`,
            {
                method: 'POST',
                body: JSON.stringify({ reason }),
            }
        );
    }

    /**
     * Create a webhook subscription
     */
    async createWebhook(options: {
        url: string;
        events: Array<'invitee.created' | 'invitee.canceled' | 'routing_form_submission.created'>;
        organization: string;
        user?: string;
        scope: 'user' | 'organization';
    }): Promise<CalendlyWebhookSubscription> {
        const response = await this.request<{ resource: CalendlyWebhookSubscription }>(
            '/webhook_subscriptions',
            {
                method: 'POST',
                body: JSON.stringify({
                    url: options.url,
                    events: options.events,
                    organization: options.organization,
                    user: options.user,
                    scope: options.scope,
                }),
            }
        );

        return CalendlyWebhookSubscriptionSchema.parse(response.resource);
    }

    /**
     * List webhook subscriptions
     */
    async listWebhooks(options: {
        organization: string;
        scope?: 'user' | 'organization';
    }): Promise<CalendlyWebhookSubscription[]> {
        const params = new URLSearchParams({ organization: options.organization });
        if (options.scope) params.append('scope', options.scope);

        const response = await this.request<{ collection: CalendlyWebhookSubscription[] }>(
            `/webhook_subscriptions?${params.toString()}`
        );

        return response.collection.map(sub => CalendlyWebhookSubscriptionSchema.parse(sub));
    }

    /**
     * Delete a webhook subscription
     */
    async deleteWebhook(webhookUri: string): Promise<void> {
        await this.request(webhookUri.replace(API_BASE_URL, ''), {
            method: 'DELETE',
        });
    }

    /**
     * Process event and invitee into internal structure
     */
    async processEvent(
        event: CalendlyEvent,
        invitee: CalendlyInvitee
    ): Promise<ProcessedCalendlyEvent> {
        const processed: ProcessedCalendlyEvent = {
            calendlyUri: event.uri,
            eventName: event.name,
            inviteeName: invitee.name,
            inviteeEmail: invitee.email,
            inviteePhone: invitee.text_reminder_number,
            startTime: event.start_time,
            endTime: event.end_time,
            status: event.status,
            location: {
                type: event.location.type,
                details: event.location.location || event.location.join_url,
            },
            eventTypeUri: event.event_type,
            createdAt: event.created_at,
            canceledAt: event.cancellation ? event.updated_at : undefined,
            cancellationReason: event.cancellation?.reason,
        };

        return processed;
    }
}

/**
 * Create a Calendly client instance
 */
export function createCalendlyClient(accessToken: string): CalendlyClient {
    return new CalendlyClient(accessToken);
}
