/**
 * Admin Validation Schemas
 * 
 * Zod schemas for admin operations validation
 */

import { z } from 'zod';

// Billing search schemas
export const billingSearchSchema = z.object({
    type: z.enum(['customers', 'subscriptions', 'payments']),
    criteria: z.object({
        email: z.string().email().optional(),
        domain: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        status: z.string().optional(),
        customerId: z.string().optional(),
        priceId: z.string().optional(),
        amountGreaterThan: z.number().positive().optional(),
        amountLessThan: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
    })
});

// Announcement schemas
export const announcementCreateSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
    richContent: z.string().optional(),
    targetAudience: z.enum(['all', 'role', 'custom']),
    targetValue: z.array(z.string()).optional(),
    deliveryMethod: z.enum(['email', 'in_app', 'both']),
    isScheduled: z.boolean().default(false),
    scheduledFor: z.string().datetime().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial().extend({
    announcementId: z.string().min(1, 'Announcement ID is required')
});

// Promotion schemas
export const promotionCreateSchema = z.object({
    action: z.literal('create-seasonal'),
    seasonType: z.enum(['spring_buying', 'summer_peak', 'fall_market', 'winter_planning']),
    customDiscount: z.number().min(1).max(100).optional()
});

export const promotionDeactivateSchema = z.object({
    action: z.literal('deactivate'),
    campaignId: z.string().min(1, 'Campaign ID is required')
});

// Billing analytics schema
export const billingAnalyticsSchema = z.object({
    timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d')
});

// Payment retry schema
export const paymentRetrySchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required')
});

// Subscription cancellation schema
export const subscriptionCancelSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
    adminId: z.string().min(1, 'Admin ID is required'),
    reason: z.string().optional()
});

// Real estate specific validation
export const realEstateAgentTierSchema = z.enum([
    'solo_agent',
    'professional_agent',
    'top_producer',
    'team_leader',
    'brokerage'
]);

export const seasonalCampaignSchema = z.object({
    season: z.enum(['spring_buying', 'summer_peak', 'fall_market', 'winter_planning']),
    targetTiers: z.array(realEstateAgentTierSchema),
    discountPercentage: z.number().min(1).max(50),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    marketingMessage: z.string().min(10).max(500)
});

// Export type inference helpers
export type BillingSearchInput = z.infer<typeof billingSearchSchema>;
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;
export type PromotionCreateInput = z.infer<typeof promotionCreateSchema>;
export type SeasonalCampaignInput = z.infer<typeof seasonalCampaignSchema>;