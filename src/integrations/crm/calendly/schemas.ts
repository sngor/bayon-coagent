/**
 * Calendly Integration Schemas
 * Zod validation schemas for Calendly data structures
 */

import { z } from 'zod';

/**
 * Calendly user schema
 */
export const CalendlyUserSchema = z.object({
    uri: z.string(),
    name: z.string(),
    slug: z.string(),
    email: z.string().email(),
    scheduling_url: z.string().url(),
    timezone: z.string(),
    avatar_url: z.string().url().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

/**
 * Calendly event type schema
 */
export const CalendlyEventTypeSchema = z.object({
    uri: z.string(),
    name: z.string(),
    active: z.boolean(),
    slug: z.string(),
    scheduling_url: z.string().url(),
    duration: z.number(),
    kind: z.enum(['solo', 'group', 'collective', 'round_robin']),
    pooling_type: z.enum(['round_robin', 'collective']).optional(),
    type: z.enum(['StandardEventType', 'CustomEventType']),
    color: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    internal_note: z.string().optional(),
    description_plain: z.string().optional(),
    description_html: z.string().optional(),
});

/**
 * Calendly invitee schema
 */
export const CalendlyInviteeSchema = z.object({
    uri: z.string(),
    email: z.string().email(),
    name: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    timezone: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    event: z.string(),
    questions_and_answers: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        position: z.number(),
    })).optional(),
    tracking: z.object({
        utm_campaign: z.string().optional(),
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_content: z.string().optional(),
        utm_term: z.string().optional(),
        salesforce_uuid: z.string().optional(),
    }).optional(),
    text_reminder_number: z.string().optional(),
    rescheduled: z.boolean(),
    old_invitee: z.string().optional(),
    new_invitee: z.string().optional(),
    cancel_url: z.string().url(),
    reschedule_url: z.string().url(),
});

/**
 * Calendly event schema
 */
export const CalendlyEventSchema = z.object({
    uri: z.string(),
    name: z.string(),
    status: z.enum(['active', 'canceled']),
    start_time: z.string(),
    end_time: z.string(),
    event_type: z.string(),
    location: z.object({
        type: z.enum(['physical', 'outbound_call', 'inbound_call', 'zoom', 'google_meet', 'microsoft_teams', 'custom']),
        location: z.string().optional(),
        join_url: z.string().url().optional(),
    }),
    invitees_counter: z.object({
        total: z.number(),
        active: z.number(),
        limit: z.number(),
    }),
    created_at: z.string(),
    updated_at: z.string(),
    event_memberships: z.array(z.object({
        user: z.string(),
    })),
    event_guests: z.array(z.object({
        email: z.string().email(),
        created_at: z.string(),
    })).optional(),
    cancellation: z.object({
        canceled_by: z.string(),
        reason: z.string().optional(),
        canceler_type: z.enum(['host', 'invitee']),
    }).optional(),
});

/**
 * Calendly webhook subscription schema
 */
export const CalendlyWebhookSubscriptionSchema = z.object({
    uri: z.string(),
    callback_url: z.string().url(),
    created_at: z.string(),
    updated_at: z.string(),
    retry_started_at: z.string().optional(),
    state: z.enum(['active', 'disabled']),
    events: z.array(z.enum([
        'invitee.created',
        'invitee.canceled',
        'routing_form_submission.created',
    ])),
    scope: z.enum(['user', 'organization']),
    organization: z.string(),
    user: z.string().optional(),
    creator: z.string(),
});

/**
 * Calendly webhook payload schema
 */
export const CalendlyWebhookPayloadSchema = z.object({
    event: z.enum([
        'invitee.created',
        'invitee.canceled',
        'routing_form_submission.created',
    ]),
    time: z.string(),
    payload: z.object({
        event: z.string().optional(),
        invitee: z.string().optional(),
        questions_and_answers: z.array(z.object({
            question: z.string(),
            answer: z.string(),
        })).optional(),
        cancellation: z.object({
            chanceler_type: z.enum(['host', 'invitee']),
            canceled_by: z.string(),
        }).optional(),
    }),
});

/**
 * Calendly sync config schema
 */
export const CalendlySyncConfigSchema = z.object({
    userId: z.string(),
    calendlyUserId: z.string(),
    syncEvents: z.boolean(),
    autoCreateActivities: z.boolean(),
    defaultEventTypes: z.array(z.string()).optional(),
    webhookUrl: z.string().url().optional(),
});

/**
 * Processed Calendly event schema
 */
export const ProcessedCalendlyEventSchema = z.object({
    calendlyUri: z.string(),
    eventName: z.string(),
    inviteeName: z.string(),
    inviteeEmail: z.string().email(),
    inviteePhone: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.enum(['active', 'canceled']),
    location: z.object({
        type: z.string(),
        details: z.string().optional(),
    }),
    eventTypeUri: z.string(),
    createdAt: z.string(),
    canceledAt: z.string().optional(),
    cancellationReason: z.string().optional(),
});
