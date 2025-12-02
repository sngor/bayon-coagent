/**
 * Open House Enhancement Validation Schemas
 * 
 * Zod schemas for runtime validation and type safety.
 * Validates Requirements: 1.1, 2.1, 3.1, 14.1, 15.1
 */

import { z } from "zod";
import {
    SessionStatus,
    InterestLevel,
    CheckInSource,
    FollowUpType,
    DeliveryStatus,
    SyncOperationType,
    SyncOperationEntity,
    SyncOperationStatus,
    FlyerTemplate,
    WebhookEvent,
} from "./types";

// ============================================================================
// Enum Schemas
// ============================================================================

export const sessionStatusSchema = z.nativeEnum(SessionStatus);
export const interestLevelSchema = z.nativeEnum(InterestLevel);
export const checkInSourceSchema = z.nativeEnum(CheckInSource);
export const followUpTypeSchema = z.nativeEnum(FollowUpType);
export const deliveryStatusSchema = z.nativeEnum(DeliveryStatus);
export const syncOperationTypeSchema = z.nativeEnum(SyncOperationType);
export const syncOperationEntitySchema = z.nativeEnum(SyncOperationEntity);
export const syncOperationStatusSchema = z.nativeEnum(SyncOperationStatus);
export const flyerTemplateSchema = z.nativeEnum(FlyerTemplate);
export const webhookEventSchema = z.nativeEnum(WebhookEvent);

// ============================================================================
// Helper Schemas
// ============================================================================

/**
 * ISO 8601 datetime string schema
 */
export const isoDateTimeSchema = z.string().datetime();

/**
 * ISO 8601 date string schema (YYYY-MM-DD)
 */
export const isoDateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Invalid date format. Expected YYYY-MM-DD"
);

/**
 * Email validation schema
 */
export const emailSchema = z.string().email("Invalid email address");

/**
 * Phone validation schema (flexible format)
 */
export const phoneSchema = z.string().min(10, "Phone number must be at least 10 digits");

/**
 * Interest Level Distribution schema
 */
export const interestLevelDistributionSchema = z.object({
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
});

/**
 * Session Photo schema
 */
export const sessionPhotoSchema = z.object({
    photoId: z.string().min(1),
    s3Key: z.string().min(1),
    url: z.string().url(),
    aiDescription: z.string().optional(),
    capturedAt: isoDateTimeSchema,
});

/**
 * Brand Colors schema
 */
export const brandColorsSchema = z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
});

// ============================================================================
// Core Entity Schemas
// ============================================================================

/**
 * Open House Session schema
 */
export const openHouseSessionSchema = z.object({
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    propertyId: z.string().optional(),
    propertyAddress: z.string().min(1, "Property address is required"),
    scheduledDate: isoDateSchema,
    scheduledStartTime: isoDateTimeSchema,
    scheduledEndTime: isoDateTimeSchema.optional(),
    actualStartTime: isoDateTimeSchema.optional(),
    actualEndTime: isoDateTimeSchema.optional(),
    status: sessionStatusSchema,
    qrCodeUrl: z.string().url(),
    visitorCount: z.number().int().nonnegative(),
    interestLevelDistribution: interestLevelDistributionSchema,
    photos: z.array(sessionPhotoSchema),
    notes: z.string().max(2000).optional(),
    templateId: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

/**
 * Visitor schema
 */
export const visitorSchema = z.object({
    visitorId: z.string().min(1),
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1, "Name is required").max(100),
    email: emailSchema,
    phone: phoneSchema,
    interestLevel: interestLevelSchema,
    notes: z.string().max(1000).optional(),
    checkInTime: isoDateTimeSchema,
    followUpGenerated: z.boolean(),
    followUpSent: z.boolean(),
    followUpSentAt: isoDateTimeSchema.optional(),
    source: checkInSourceSchema,
    sequenceEnrollmentId: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

/**
 * Follow-up Content schema
 */
export const followUpContentSchema = z.object({
    contentId: z.string().min(1),
    sessionId: z.string().min(1),
    visitorId: z.string().min(1),
    userId: z.string().min(1),
    emailSubject: z.string().min(1).max(200),
    emailBody: z.string().min(1).max(5000),
    smsMessage: z.string().min(1).max(160),
    nextSteps: z.array(z.string()),
    generatedAt: isoDateTimeSchema,
    sentAt: isoDateTimeSchema.optional(),
    deliveryStatus: deliveryStatusSchema.optional(),
    openedAt: isoDateTimeSchema.optional(),
    clickedAt: isoDateTimeSchema.optional(),
});

/**
 * Follow-up Touchpoint schema
 */
export const followUpTouchpointSchema = z.object({
    touchpointId: z.string().min(1),
    order: z.number().int().positive(),
    delayMinutes: z.number().int().nonnegative(),
    type: followUpTypeSchema,
    templatePrompt: z.string().min(1).max(2000),
});

/**
 * Follow-up Sequence schema
 */
export const followUpSequenceSchema = z.object({
    sequenceId: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1, "Sequence name is required").max(100),
    description: z.string().max(500).optional(),
    interestLevel: z.union([interestLevelSchema, z.literal("all")]),
    touchpoints: z.array(followUpTouchpointSchema).min(1, "At least one touchpoint is required"),
    active: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

/**
 * Sequence Enrollment schema
 */
export const sequenceEnrollmentSchema = z.object({
    enrollmentId: z.string().min(1),
    sequenceId: z.string().min(1),
    visitorId: z.string().min(1),
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    currentTouchpointIndex: z.number().int().nonnegative(),
    nextTouchpointAt: isoDateTimeSchema.optional(),
    paused: z.boolean(),
    completedAt: isoDateTimeSchema.optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

/**
 * Session Template schema
 */
export const sessionTemplateSchema = z.object({
    templateId: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1, "Template name is required").max(100),
    description: z.string().max(500).optional(),
    propertyType: z.string().max(50).optional(),
    typicalDuration: z.number().int().positive(),
    customFields: z.record(z.any()),
    usageCount: z.number().int().nonnegative(),
    averageVisitors: z.number().nonnegative().optional(),
    averageInterestLevel: z.number().min(0).max(3).optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

/**
 * Sync Operation schema
 */
export const syncOperationSchema = z.object({
    operationId: z.string().min(1),
    userId: z.string().min(1),
    type: syncOperationTypeSchema,
    entity: syncOperationEntitySchema,
    data: z.any(),
    timestamp: isoDateTimeSchema,
    status: syncOperationStatusSchema,
    retryCount: z.number().int().nonnegative(),
    error: z.string().optional(),
});

/**
 * Webhook Configuration schema
 */
export const webhookConfigurationSchema = z.object({
    webhookId: z.string().min(1),
    userId: z.string().min(1),
    url: z.string().url("Invalid webhook URL"),
    events: z.array(webhookEventSchema).min(1, "At least one event is required"),
    active: z.boolean(),
    secret: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
});

// ============================================================================
// Input Schemas (for validation)
// ============================================================================

/**
 * Create Open House Session Input schema
 */
export const createOpenHouseSessionInputSchema = z.object({
    propertyId: z.string().optional(),
    propertyAddress: z.string().min(1, "Property address is required").max(200),
    scheduledDate: isoDateSchema,
    scheduledStartTime: isoDateTimeSchema,
    scheduledEndTime: isoDateTimeSchema.optional(),
    notes: z.string().max(2000).optional(),
    templateId: z.string().optional(),
}).refine(
    (data) => {
        // If scheduledEndTime is provided, it must be after scheduledStartTime
        if (data.scheduledEndTime) {
            return new Date(data.scheduledEndTime) > new Date(data.scheduledStartTime);
        }
        return true;
    },
    {
        message: "Scheduled end time must be after start time",
        path: ["scheduledEndTime"],
    }
);

/**
 * Update Open House Session Input schema
 */
export const updateOpenHouseSessionInputSchema = z.object({
    propertyAddress: z.string().min(1).max(200).optional(),
    scheduledDate: isoDateSchema.optional(),
    scheduledStartTime: isoDateTimeSchema.optional(),
    scheduledEndTime: isoDateTimeSchema.optional(),
    notes: z.string().max(2000).optional(),
}).refine(
    (data) => {
        // If both times are provided, end must be after start
        if (data.scheduledStartTime && data.scheduledEndTime) {
            return new Date(data.scheduledEndTime) > new Date(data.scheduledStartTime);
        }
        return true;
    },
    {
        message: "Scheduled end time must be after start time",
        path: ["scheduledEndTime"],
    }
);

/**
 * Check-in Visitor Input schema
 */
export const checkInVisitorInputSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: emailSchema,
    phone: phoneSchema,
    interestLevel: interestLevelSchema,
    notes: z.string().max(1000).optional(),
    source: checkInSourceSchema,
});

/**
 * Update Visitor Input schema
 */
export const updateVisitorInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    interestLevel: interestLevelSchema.optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Create Follow-up Touchpoint Input schema
 */
export const createFollowUpTouchpointInputSchema = z.object({
    order: z.number().int().positive(),
    delayMinutes: z.number().int().nonnegative(),
    type: followUpTypeSchema,
    templatePrompt: z.string().min(1, "Template prompt is required").max(2000),
});

/**
 * Create Follow-up Sequence Input schema
 */
export const createFollowUpSequenceInputSchema = z.object({
    name: z.string().min(1, "Sequence name is required").max(100),
    description: z.string().max(500).optional(),
    interestLevel: z.union([interestLevelSchema, z.literal("all")]),
    touchpoints: z.array(createFollowUpTouchpointInputSchema).min(1, "At least one touchpoint is required"),
}).refine(
    (data) => {
        // Verify touchpoint orders are sequential starting from 1
        const orders = data.touchpoints.map(t => t.order).sort((a, b) => a - b);
        return orders.every((order, index) => order === index + 1);
    },
    {
        message: "Touchpoint orders must be sequential starting from 1",
        path: ["touchpoints"],
    }
);

/**
 * Update Follow-up Sequence Input schema
 */
export const updateFollowUpSequenceInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    interestLevel: z.union([interestLevelSchema, z.literal("all")]).optional(),
    touchpoints: z.array(createFollowUpTouchpointInputSchema).min(1).optional(),
    active: z.boolean().optional(),
}).refine(
    (data) => {
        // If touchpoints are provided, verify orders are sequential
        if (data.touchpoints) {
            const orders = data.touchpoints.map(t => t.order).sort((a, b) => a - b);
            return orders.every((order, index) => order === index + 1);
        }
        return true;
    },
    {
        message: "Touchpoint orders must be sequential starting from 1",
        path: ["touchpoints"],
    }
);

/**
 * Create Session Template Input schema
 */
export const createSessionTemplateInputSchema = z.object({
    name: z.string().min(1, "Template name is required").max(100),
    description: z.string().max(500).optional(),
    propertyType: z.string().max(50).optional(),
    typicalDuration: z.number().int().positive("Duration must be positive"),
    customFields: z.record(z.any()).optional(),
});

/**
 * Update Session Template Input schema
 */
export const updateSessionTemplateInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    propertyType: z.string().max(50).optional(),
    typicalDuration: z.number().int().positive().optional(),
    customFields: z.record(z.any()).optional(),
});

/**
 * Analytics Filters schema
 */
export const analyticsFiltersSchema = z.object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    propertyId: z.string().optional(),
    status: sessionStatusSchema.optional(),
}).refine(
    (data) => {
        // If both dates are provided, end must be after start
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) >= new Date(data.startDate);
        }
        return true;
    },
    {
        message: "End date must be on or after start date",
        path: ["endDate"],
    }
);

/**
 * Generate Follow-up Input schema
 */
export const generateFollowUpInputSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    visitorId: z.string().min(1, "Visitor ID is required"),
});

/**
 * Send Follow-up Input schema
 */
export const sendFollowUpInputSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    visitorId: z.string().min(1, "Visitor ID is required"),
    contentId: z.string().min(1, "Content ID is required"),
});

/**
 * Upload Session Photo Input schema
 */
export const uploadSessionPhotoInputSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    capturedAt: isoDateTimeSchema.optional(),
});

/**
 * Flyer Options schema
 */
export const flyerOptionsSchema = z.object({
    includeQRCode: z.boolean(),
    includePropertyImages: z.boolean(),
    template: flyerTemplateSchema,
    brandColors: brandColorsSchema.optional(),
});

/**
 * Email Invite Options schema
 */
export const emailInviteOptionsSchema = z.object({
    includeCalendarAttachment: z.boolean(),
    includeRSVPLink: z.boolean(),
    personalMessage: z.string().max(500).optional(),
});

/**
 * Create Webhook Configuration Input schema
 */
export const createWebhookConfigurationInputSchema = z.object({
    url: z.string().url("Invalid webhook URL"),
    events: z.array(webhookEventSchema).min(1, "At least one event is required"),
    secret: z.string().optional(),
});

/**
 * Update Webhook Configuration Input schema
 */
export const updateWebhookConfigurationInputSchema = z.object({
    url: z.string().url().optional(),
    events: z.array(webhookEventSchema).min(1).optional(),
    active: z.boolean().optional(),
    secret: z.string().optional(),
});

// ============================================================================
// Analytics Schemas
// ============================================================================

/**
 * Check-in Timeline Point schema
 */
export const checkInTimelinePointSchema = z.object({
    timestamp: isoDateTimeSchema,
    cumulativeCount: z.number().int().nonnegative(),
    interestLevel: interestLevelSchema,
});

/**
 * Session Analytics schema
 */
export const sessionAnalyticsSchema = z.object({
    sessionId: z.string().min(1),
    totalVisitors: z.number().int().nonnegative(),
    interestLevelDistribution: interestLevelDistributionSchema,
    averageInterestLevel: z.number().min(0).max(3),
    checkInTimeline: z.array(checkInTimelinePointSchema),
    peakCheckInTime: isoDateTimeSchema.optional(),
    duration: z.number().int().nonnegative(),
    followUpsSent: z.number().int().nonnegative(),
    followUpResponseRate: z.number().min(0).max(1),
});

/**
 * Trend Data Point schema
 */
export const trendDataPointSchema = z.object({
    date: isoDateSchema,
    value: z.number(),
});

/**
 * Property Performance schema
 */
export const propertyPerformanceSchema = z.object({
    propertyAddress: z.string().min(1),
    sessionCount: z.number().int().nonnegative(),
    totalVisitors: z.number().int().nonnegative(),
    averageInterestLevel: z.number().min(0).max(3),
});

/**
 * Dashboard Analytics schema
 */
export const dashboardAnalyticsSchema = z.object({
    totalSessions: z.number().int().nonnegative(),
    totalVisitors: z.number().int().nonnegative(),
    averageVisitorsPerSession: z.number().nonnegative(),
    averageInterestLevel: z.number().min(0).max(3),
    trends: z.object({
        visitorCounts: z.array(trendDataPointSchema),
        interestLevels: z.array(trendDataPointSchema),
        conversionMetrics: z.array(trendDataPointSchema),
    }),
    topPerformingProperties: z.array(propertyPerformanceSchema),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Session Summary schema
 */
export const sessionSummarySchema = z.object({
    sessionId: z.string().min(1),
    totalVisitors: z.number().int().nonnegative(),
    interestLevelDistribution: interestLevelDistributionSchema,
    duration: z.number().int().nonnegative(),
    averageInterestLevel: z.number().min(0).max(3),
    followUpsGenerated: z.number().int().nonnegative(),
    followUpsSent: z.number().int().nonnegative(),
});

/**
 * Follow-up Result schema
 */
export const followUpResultSchema = z.object({
    visitorId: z.string().min(1),
    success: z.boolean(),
    contentId: z.string().optional(),
    error: z.string().optional(),
});

/**
 * Sync Result schema
 */
export const syncResultSchema = z.object({
    operationId: z.string().min(1),
    success: z.boolean(),
    timestamp: isoDateTimeSchema,
    error: z.string().optional(),
});

/**
 * Export Result schema
 */
export const exportResultSchema = z.object({
    url: z.string().url(),
    expiresAt: isoDateTimeSchema,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates and parses open house session data
 */
export function validateOpenHouseSession(data: unknown) {
    return openHouseSessionSchema.parse(data);
}

/**
 * Validates and parses visitor data
 */
export function validateVisitor(data: unknown) {
    return visitorSchema.parse(data);
}

/**
 * Validates and parses check-in visitor input
 */
export function validateCheckInVisitorInput(data: unknown) {
    return checkInVisitorInputSchema.parse(data);
}

/**
 * Validates and parses create session input
 */
export function validateCreateOpenHouseSessionInput(data: unknown) {
    return createOpenHouseSessionInputSchema.parse(data);
}

/**
 * Validates and parses follow-up sequence data
 */
export function validateFollowUpSequence(data: unknown) {
    return followUpSequenceSchema.parse(data);
}

/**
 * Validates and parses session template data
 */
export function validateSessionTemplate(data: unknown) {
    return sessionTemplateSchema.parse(data);
}

/**
 * Safely validates data and returns result with error handling
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Formats Zod errors into a user-friendly format
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join(".");
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(issue.message);
    }

    return formatted;
}
