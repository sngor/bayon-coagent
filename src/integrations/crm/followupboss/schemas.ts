/**
 * Follow Up Boss Integration Schemas
 * Zod validation schemas for Follow Up Boss data structures
 */

import { z } from 'zod';

/**
 * Phone number schema
 */
export const PhoneSchema = z.object({
    number: z.string(),
    type: z.enum(['mobile', 'home', 'work', 'other']).optional(),
    primary: z.boolean().optional(),
});

/**
 * Address schema
 */
export const AddressSchema = z.object({
    street: z.string().optional(),
    unit: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
});

/**
 * Follow Up Boss lead schema
 */
export const FollowUpBossLeadSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phones: z.array(PhoneSchema).optional(),
    source: z.string().optional(),
    status: z.enum(['new', 'active', 'nurture', 'archived']).optional(),
    assigned: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    address: AddressSchema.optional(),
    dueDate: z.string().optional(),
    created: z.number().optional(),
    updated: z.number().optional(),
});

/**
 * Follow Up Boss contact schema
 */
export const FollowUpBossContactSchema = z.object({
    id: z.string(),
    name: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phones: z.array(PhoneSchema).optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    assigned: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    created: z.number().optional(),
    updated: z.number().optional(),
});

/**
 * Follow Up Boss activity schema
 */
export const FollowUpBossActivitySchema = z.object({
    id: z.string().optional(),
    personId: z.string(),
    type: z.enum(['note', 'call', 'email', 'meeting', 'text', 'task']),
    subject: z.string().optional(),
    body: z.string().optional(),
    created: z.number().optional(),
    createdBy: z.string().optional(),
    dueDate: z.string().optional(),
    completed: z.boolean().optional(),
});

/**
 * Follow Up Boss API response schema
 */
export const FollowUpBossAPIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema,
        _metadata: z.object({
            total: z.number().optional(),
            count: z.number().optional(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }).optional(),
    });

/**
 * Follow Up Boss connection schema
 */
export const FollowUpBossConnectionSchema = z.object({
    userId: z.string(),
    apiKey: z.string(),
    teamId: z.string().optional(),
    connected: z.boolean(),
    lastSync: z.number().optional(),
    metadata: z.record(z.any()).optional(),
});

/**
 * Follow Up Boss webhook payload schema
 */
export const FollowUpBossWebhookPayloadSchema = z.object({
    event: z.enum([
        'person.created',
        'person.updated',
        'person.deleted',
        'action.created',
        'action.completed',
        'email.received',
        'call.received',
    ]),
    data: z.union([
        FollowUpBossLeadSchema,
        FollowUpBossContactSchema,
        FollowUpBossActivitySchema,
    ]),
    timestamp: z.number(),
    teamId: z.string().optional(),
});

/**
 * Follow Up Boss sync options schema
 */
export const FollowUpBossSyncOptionsSchema = z.object({
    direction: z.enum(['import', 'export', 'bidirectional']).optional(),
    syncLeads: z.boolean().optional(),
    syncContacts: z.boolean().optional(),
    syncActivities: z.boolean().optional(),
    filters: z.object({
        status: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        dateRange: z.object({
            start: z.string(),
            end: z.string(),
        }).optional(),
    }).optional(),
});

/**
 * Create lead request schema
 */
export const CreateFollowUpBossLeadRequestSchema = z.object({
    name: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phones: z.array(z.object({
        number: z.string(),
        type: z.string().optional(),
    })).optional(),
    source: z.string().optional(),
    assigned: z.string().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
});
