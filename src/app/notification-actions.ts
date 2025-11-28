'use server';

/**
 * Notification Server Actions
 * 
 * Server actions for notification operations, user preferences, and admin monitoring.
 * Validates Requirements: 7.1, 7.3, 6.3, 6.4
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getNotificationService } from '@/lib/notifications/service';
import { getNotificationRepository } from '@/lib/notifications/repository';
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationPreferences,
    CreateNotificationRequest,
    TimeRange,
    RetryOptions,
    NotificationMetrics,
    RetryResult,
    Notification,
    NotificationHistory,
    HistoryOptions,
} from '@/lib/notifications/types';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const createNotificationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    content: z.string().min(1, 'Content is required').max(1000, 'Content must be less than 1000 characters'),
    metadata: z.record(z.any()).optional(),
    actionUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    actionText: z.string().max(50, 'Action text must be less than 50 characters').optional(),
    channels: z.array(z.nativeEnum(NotificationChannel)).optional(),
    expiresAt: z.string().datetime().optional(),
});

const markAsReadSchema = z.object({
    notificationId: z.string().min(1, 'Notification ID is required'),
});

const dismissNotificationSchema = z.object({
    notificationId: z.string().min(1, 'Notification ID is required'),
});

const updatePreferencesSchema = z.object({
    channels: z.object({
        inApp: z.object({
            enabled: z.boolean(),
            types: z.array(z.nativeEnum(NotificationType)),
        }).optional(),
        email: z.object({
            enabled: z.boolean(),
            address: z.string().email().optional(),
            types: z.array(z.nativeEnum(NotificationType)),
            frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']),
            digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
            quietHours: z.object({
                enabled: z.boolean(),
                startTime: z.string().regex(/^\d{2}:\d{2}$/),
                endTime: z.string().regex(/^\d{2}:\d{2}$/),
                timezone: z.string(),
            }).optional(),
        }).optional(),
        push: z.object({
            enabled: z.boolean(),
            types: z.array(z.nativeEnum(NotificationType)),
            subscription: z.object({
                endpoint: z.string(),
                keys: z.object({
                    p256dh: z.string(),
                    auth: z.string(),
                }),
            }).optional(),
        }).optional(),
    }).optional(),
    globalSettings: z.object({
        doNotDisturb: z.boolean(),
        maxDailyNotifications: z.number().int().positive().optional(),
    }).optional(),
});

const sendTestNotificationSchema = z.object({
    channel: z.nativeEnum(NotificationChannel).optional(),
});

const bulkCreateSchema = z.object({
    notifications: z.array(createNotificationSchema).min(1, 'At least one notification is required'),
});

const getMetricsSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

const retryFailedSchema = z.object({
    notificationIds: z.array(z.string()).optional(),
    channels: z.array(z.nativeEnum(NotificationChannel)).optional(),
    maxAge: z.number().int().positive().optional(),
    maxAttempts: z.number().int().positive().optional(),
});

const getHistorySchema = z.object({
    limit: z.number().int().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    types: z.array(z.nativeEnum(NotificationType)).optional(),
    status: z.array(z.string()).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user
 * @returns User object or null if not authenticated
 */
async function getCurrentUser() {
    try {
        const user = await getCurrentUserServer();
        return user;
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}

/**
 * Checks if the current user is an admin
 * @returns True if user is admin, false otherwise
 */
async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Check if user has admin role
    // This would typically check against a user's roles or permissions
    // For now, we'll implement a basic check
    try {
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();
        const profile = await repository.get(`USER#${user.id}`, 'PROFILE');
        const profileData = profile as any;
        return profileData?.Data?.role === 'admin' || profileData?.Data?.role === 'super_admin';
    } catch (error) {
        return false;
    }
}

/**
 * Standard error response format
 */
function errorResponse(message: string, errors: any = {}) {
    return {
        message,
        data: null,
        errors,
    };
}

/**
 * Standard success response format
 */
function successResponse(data: any, message: string = 'success') {
    return {
        message,
        data,
        errors: {},
    };
}

// ============================================================================
// Core Notification Actions
// ============================================================================

/**
 * Creates a new notification
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing notification details
 * @returns Action result with created notification
 */
export async function createNotificationAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: Notification | null; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const rawData = {
            userId: formData.get('userId') || user.id,
            type: formData.get('type'),
            priority: formData.get('priority'),
            title: formData.get('title'),
            content: formData.get('content'),
            metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined,
            actionUrl: formData.get('actionUrl') || undefined,
            actionText: formData.get('actionText') || undefined,
            channels: formData.get('channels') ? JSON.parse(formData.get('channels') as string) : undefined,
            expiresAt: formData.get('expiresAt') || undefined,
        };

        const validation = createNotificationSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Create notification
        const service = getNotificationService();
        const notification = await service.createNotification(validation.data as CreateNotificationRequest);

        // Send notification
        await service.sendNotification(notification.id);

        return successResponse(notification, 'Notification created successfully');
    } catch (error) {
        console.error('Create notification error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to create notification'
        );
    }
}

/**
 * Marks a notification as read
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing notification ID
 * @returns Action result
 */
export async function markAsReadAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const rawData = {
            notificationId: formData.get('notificationId'),
        };

        const validation = markAsReadSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Mark as read
        const repository = getNotificationRepository();
        await repository.markAsRead(validation.data.notificationId);

        return successResponse({ notificationId: validation.data.notificationId }, 'Notification marked as read');
    } catch (error) {
        console.error('Mark as read error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to mark notification as read'
        );
    }
}

/**
 * Dismisses a notification
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing notification ID
 * @returns Action result
 */
export async function dismissNotificationAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const rawData = {
            notificationId: formData.get('notificationId'),
        };

        const validation = dismissNotificationSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Dismiss notification
        const repository = getNotificationRepository();
        await repository.dismissNotification(validation.data.notificationId);

        return successResponse({ notificationId: validation.data.notificationId }, 'Notification dismissed');
    } catch (error) {
        console.error('Dismiss notification error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to dismiss notification'
        );
    }
}

// ============================================================================
// User Preference Actions
// ============================================================================

/**
 * Updates user notification preferences
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing preferences
 * @returns Action result with updated preferences
 */
export async function updateNotificationPreferencesAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const preferencesData = formData.get('preferences');
        if (!preferencesData) {
            return errorResponse('Preferences data is required');
        }

        const rawData = JSON.parse(preferencesData as string);
        const validation = updatePreferencesSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Update preferences
        const service = getNotificationService();
        const changeLog = await service.updateUserPreferences(user.id, validation.data as any);

        return successResponse(
            { changeLog },
            'Notification preferences updated successfully'
        );
    } catch (error) {
        console.error('Update preferences error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to update preferences'
        );
    }
}

/**
 * Gets user notification preferences
 * Validates Requirements: 7.1
 * 
 * @returns Action result with user preferences
 */
export async function getUserPreferencesAction(): Promise<{
    message: string;
    data: NotificationPreferences | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Get preferences
        const service = getNotificationService();
        const preferences = await service.getUserPreferences(user.id);

        return successResponse(preferences);
    } catch (error) {
        console.error('Get preferences error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get preferences'
        );
    }
}

/**
 * Sends a test notification to the current user
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing optional channel
 * @returns Action result
 */
export async function sendTestNotificationAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const rawData = {
            channel: formData.get('channel') || undefined,
        };

        const validation = sendTestNotificationSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Create test notification
        const service = getNotificationService();
        const notification = await service.createNotification({
            userId: user.id,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.LOW,
            title: 'Test Notification',
            content: 'This is a test notification to verify your notification settings are working correctly.',
            channels: validation.data.channel ? [validation.data.channel] : undefined,
        });

        // Send notification
        await service.sendNotification(notification.id);

        return successResponse(
            { notificationId: notification.id },
            'Test notification sent successfully'
        );
    } catch (error) {
        console.error('Send test notification error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to send test notification'
        );
    }
}

// ============================================================================
// Bulk Operations (Admin)
// ============================================================================

/**
 * Creates multiple notifications in bulk
 * Validates Requirements: 7.3
 * 
 * @param formData Form data containing array of notifications
 * @returns Action result with batch result
 */
export async function bulkCreateNotificationsAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Check admin access
        const admin = await isAdmin();
        if (!admin) {
            return errorResponse('Admin access required', { auth: ['You must be an admin'] });
        }

        // Parse and validate input
        const notificationsData = formData.get('notifications');
        if (!notificationsData) {
            return errorResponse('Notifications data is required');
        }

        const rawData = JSON.parse(notificationsData as string);
        const validation = bulkCreateSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Create notifications
        const service = getNotificationService();
        const notifications: Notification[] = [];

        for (const notificationData of validation.data.notifications) {
            const notification = await service.createNotification(notificationData as CreateNotificationRequest);
            notifications.push(notification);
        }

        // Send notifications in batch
        const batchResult = await service.batchNotifications(notifications);

        return successResponse(
            batchResult,
            `Bulk operation completed: ${batchResult.successful} successful, ${batchResult.failed} failed`
        );
    } catch (error) {
        console.error('Bulk create notifications error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to create notifications in bulk'
        );
    }
}

// ============================================================================
// Notification History
// ============================================================================

/**
 * Gets notification history for the current user
 * Validates Requirements: 7.1
 * 
 * @param formData Form data containing history options
 * @returns Action result with notification history
 */
export async function getNotificationHistoryAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: NotificationHistory | null; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const optionsData = formData.get('options');
        const rawData = optionsData ? JSON.parse(optionsData as string) : {};

        const validation = getHistorySchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Get history
        const service = getNotificationService();
        const history = await service.getNotificationHistory(user.id, validation.data as HistoryOptions);

        return successResponse(history);
    } catch (error) {
        console.error('Get notification history error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get notification history'
        );
    }
}

// ============================================================================
// Admin Monitoring Actions
// ============================================================================

/**
 * Gets notification system metrics
 * Validates Requirements: 6.3
 * 
 * @param formData Form data containing time range
 * @returns Action result with metrics
 */
export async function getNotificationMetricsAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: NotificationMetrics | null; errors: any }> {
    try {
        // Check admin access
        const admin = await isAdmin();
        if (!admin) {
            return errorResponse('Admin access required', { auth: ['You must be an admin'] });
        }

        // Parse and validate input
        const rawData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
        };

        const validation = getMetricsSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Get metrics
        const service = getNotificationService();
        const metrics = await service.getMetrics(validation.data as TimeRange);

        return successResponse(metrics);
    } catch (error) {
        console.error('Get notification metrics error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get notification metrics'
        );
    }
}

/**
 * Retries failed notification deliveries
 * Validates Requirements: 6.4
 * 
 * @param formData Form data containing retry options
 * @returns Action result with retry result
 */
export async function retryFailedNotificationsAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: RetryResult | null; errors: any }> {
    try {
        // Check admin access
        const admin = await isAdmin();
        if (!admin) {
            return errorResponse('Admin access required', { auth: ['You must be an admin'] });
        }

        // Parse and validate input
        const optionsData = formData.get('options');
        const rawData = optionsData ? JSON.parse(optionsData as string) : {};

        const validation = retryFailedSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Retry failed deliveries
        const service = getNotificationService();
        const result = await service.retryFailedDeliveries(validation.data as RetryOptions);

        return successResponse(
            result,
            `Retry completed: ${result.successful} successful, ${result.failed} failed out of ${result.attempted} attempted`
        );
    } catch (error) {
        console.error('Retry failed notifications error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to retry notifications'
        );
    }
}

/**
 * Gets rate limit status for the current user
 * Validates Requirements: 6.5
 * 
 * @returns Action result with rate limit status
 */
export async function getRateLimitStatusAction(): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Get rate limit status
        const service = getNotificationService();
        const status = service.getRateLimitStatus(user.id);

        return successResponse(status);
    } catch (error) {
        console.error('Get rate limit status error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get rate limit status'
        );
    }
}

/**
 * Gets notification audit trail (admin operation)
 * Validates Requirements: 6.3, 6.4
 * 
 * @param formData Form data containing audit trail query options
 * @returns Action result with audit trail
 */
export async function getNotificationAuditTrailAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Check admin access
        const admin = await isAdmin();
        if (!admin) {
            return errorResponse('Admin access required', { auth: ['You must be an admin'] });
        }

        // Parse options
        const optionsData = formData.get('options');
        const options = optionsData ? JSON.parse(optionsData as string) : {};

        // Validate options
        const auditTrailSchema = z.object({
            userId: z.string().optional(),
            notificationId: z.string().optional(),
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
            limit: z.number().int().positive().optional(),
        });

        const validation = auditTrailSchema.safeParse(options);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Get audit trail
        const service = getNotificationService();
        const auditTrail = await service.getAuditTrail(validation.data);

        return successResponse(auditTrail);
    } catch (error) {
        console.error('Get audit trail error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get audit trail'
        );
    }
}
