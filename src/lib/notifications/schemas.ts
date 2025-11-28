/**
 * Notification System Validation Schemas
 * 
 * Zod schemas for runtime validation and type safety.
 * Validates Requirements: 7.2
 */

import { z } from "zod";
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
    DeliveryStatus,
    EmailFrequency,
} from "./types";

// ============================================================================
// Enum Schemas
// ============================================================================

export const notificationTypeSchema = z.nativeEnum(NotificationType);
export const notificationPrioritySchema = z.nativeEnum(NotificationPriority);
export const notificationChannelSchema = z.nativeEnum(NotificationChannel);
export const notificationStatusSchema = z.nativeEnum(NotificationStatus);
export const deliveryStatusSchema = z.nativeEnum(DeliveryStatus);
export const emailFrequencySchema = z.nativeEnum(EmailFrequency);

// ============================================================================
// Core Schemas
// ============================================================================

/**
 * Push subscription schema (Web Push API format)
 */
export const pushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

/**
 * Quiet hours configuration schema
 */
export const quietHoursSchema = z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    timezone: z.string(),
});

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
    userId: z.string().min(1),
    channels: z.object({
        inApp: z.object({
            enabled: z.boolean(),
            types: z.array(notificationTypeSchema),
        }),
        email: z.object({
            enabled: z.boolean(),
            address: z.string().email().optional(),
            types: z.array(notificationTypeSchema),
            frequency: emailFrequencySchema,
            digestTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            quietHours: quietHoursSchema.optional(),
        }),
        push: z.object({
            enabled: z.boolean(),
            types: z.array(notificationTypeSchema),
            subscription: pushSubscriptionSchema.optional(),
        }),
    }),
    globalSettings: z.object({
        doNotDisturb: z.boolean(),
        maxDailyNotifications: z.number().int().positive().optional(),
    }),
    updatedAt: z.string().datetime(),
});

/**
 * Notification schema
 */
export const notificationSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    type: notificationTypeSchema,
    priority: notificationPrioritySchema,
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(2000),
    metadata: z.record(z.any()).optional(),
    actionUrl: z.string().url().optional(),
    actionText: z.string().max(50).optional(),
    channels: z.array(notificationChannelSchema).min(1),
    status: notificationStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    readAt: z.string().datetime().optional(),
    dismissedAt: z.string().datetime().optional(),
});

/**
 * Delivery record schema
 */
export const deliveryRecordSchema = z.object({
    id: z.string().min(1),
    notificationId: z.string().min(1),
    userId: z.string().min(1),
    channel: notificationChannelSchema,
    status: deliveryStatusSchema,
    attempts: z.number().int().nonnegative(),
    lastAttemptAt: z.string().datetime(),
    deliveredAt: z.string().datetime().optional(),
    failureReason: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Create notification request schema
 */
export const createNotificationRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    type: notificationTypeSchema,
    priority: notificationPrioritySchema,
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    content: z.string().min(1, "Content is required").max(2000, "Content must be 2000 characters or less"),
    metadata: z.record(z.any()).optional(),
    actionUrl: z.string().url("Invalid URL format").optional(),
    actionText: z.string().max(50, "Action text must be 50 characters or less").optional(),
    channels: z.array(notificationChannelSchema).min(1).optional(),
    expiresAt: z.string().datetime().optional(),
});

/**
 * Update preferences request schema
 */
export const updatePreferencesRequestSchema = notificationPreferencesSchema.partial().omit({
    userId: true,
    updatedAt: true,
});

/**
 * History options schema
 */
export const historyOptionsSchema = z.object({
    limit: z.number().int().positive().max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    types: z.array(notificationTypeSchema).optional(),
    status: z.array(notificationStatusSchema).optional(),
});

/**
 * Time range schema
 */
export const timeRangeSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

/**
 * Retry options schema
 */
export const retryOptionsSchema = z.object({
    notificationIds: z.array(z.string()).optional(),
    channels: z.array(notificationChannelSchema).optional(),
    maxAge: z.number().int().positive().optional(),
    maxAttempts: z.number().int().positive().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates and parses notification data
 */
export function validateNotification(data: unknown) {
    return notificationSchema.parse(data);
}

/**
 * Validates and parses notification preferences
 */
export function validateNotificationPreferences(data: unknown) {
    return notificationPreferencesSchema.parse(data);
}

/**
 * Validates and parses create notification request
 */
export function validateCreateNotificationRequest(data: unknown) {
    return createNotificationRequestSchema.parse(data);
}

/**
 * Validates and parses delivery record
 */
export function validateDeliveryRecord(data: unknown) {
    return deliveryRecordSchema.parse(data);
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
