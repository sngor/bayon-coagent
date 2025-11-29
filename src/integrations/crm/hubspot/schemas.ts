/**
 * HubSpot Integration Schemas
 * Zod validation schemas for HubSpot data structures
 */

import { z } from 'zod';

/**
 * HubSpot contact schema
 */
export const HubSpotContactSchema = z.object({
    id: z.string(),
    properties: z.record(z.any()),
    createdAt: z.string(),
    updatedAt: z.string(),
    archived: z.boolean(),
});

/**
 * HubSpot company schema
 */
export const HubSpotCompanySchema = z.object({
    id: z.string(),
    properties: z.record(z.any()),
    createdAt: z.string(),
    updatedAt: z.string(),
    archived: z.boolean(),
});

/**
 * HubSpot deal schema
 */
export const HubSpotDealSchema = z.object({
    id: z.string(),
    properties: z.record(z.any()),
    createdAt: z.string(),
    updatedAt: z.string(),
    archived: z.boolean(),
});

/**
 * HubSpot timeline event schema
 */
export const HubSpotTimelineEventSchema = z.object({
    id: z.string(),
    eventTemplateId: z.string(),
    email: z.string().email().optional(),
    objectId: z.string().optional(),
    tokens: z.record(z.string()),
    timestamp: z.number(),
    extraData: z.record(z.any()).optional(),
});

/**
 * HubSpot connection schema
 */
export const HubSpotConnectionSchema = z.object({
    userId: z.string(),
    portalId: z.string(),
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.number(),
    scopes: z.array(z.string()),
    connected: z.boolean(),
    lastSync: z.number().optional(),
});

/**
 * HubSpot sync config schema
 */
export const HubSpotSyncConfigSchema = z.object({
    userId: z.string(),
    syncContacts: z.boolean(),
    syncCompanies: z.boolean(),
    syncDeals: z.boolean(),
    direction: z.enum(['import', 'export', 'bidirectional']),
    contactAssociation: z.string().optional(),
    propertyMapping: z.record(z.string()).optional(),
});

/**
 * HubSpot property schema
 */
export const HubSpotPropertySchema = z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'date', 'datetime', 'enumeration']),
    fieldType: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'number', 'date']),
    description: z.string().optional(),
    groupName: z.string().optional(),
    options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        hidden: z.boolean(),
        displayOrder: z.number(),
    })).optional(),
});

/**
 * HubSpot search request schema
 */
export const HubSpotSearchRequestSchema = z.object({
    filters: z.array(z.object({
        propertyName: z.string(),
        operator: z.enum(['EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE', 'CONTAINS']),
        value: z.string(),
    })).optional(),
    sorts: z.array(z.object({
        propertyName: z.string(),
        direction: z.enum(['ASCENDING', 'DESCENDING']),
    })).optional(),
    properties: z.array(z.string()).optional(),
    limit: z.number().optional(),
    after: z.string().optional(),
});
