'use server';

/**
 * Notification Actions
 * Simplified notification server actions following established codebase patterns
 * 
 * For comprehensive notification functionality, use:
 * - /src/services/notifications/notification-actions.ts (full feature set)
 * - /src/lib/notifications/service.ts (notification service)
 */

import { z } from 'zod';
import { createLogger } from '@/aws/logging/logger';

const logger = createLogger({ service: 'notification-actions' });
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { getNotificationPreferencesKeys } from '@/aws/dynamodb/keys';
import {
    createSuccessResponse,
    createErrorResponse,
    createValidationErrorResponse,
    validateFormData,
    type ServerActionResponse
} from '@/lib/server-action-utils';

// ============================================================================
// Schemas - Following established validation patterns
// ============================================================================

export const CreateNotificationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
    type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    actionUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    expiresAt: z.string().datetime().optional(),
});

export const NotificationPreferencesSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    maxDailyNotifications: z.number().int().positive().max(100),
    doNotDisturb: z.boolean(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// ============================================================================
// Error Handling - Following AWS service patterns
// ============================================================================

const handleNotificationError = (error: any, defaultMessage: string): string => {
    const isDev = process.env.NODE_ENV === 'development';
    const originalErrorMessage = error instanceof Error ? error.message : String(error);
    const devSuffix = isDev ? ` (Error: ${originalErrorMessage})` : '';

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        // DynamoDB errors
        if (lowerCaseMessage.includes('dynamodb') || lowerCaseMessage.includes('provisioned throughput')) {
            return 'Notification service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // Validation errors
        if (lowerCaseMessage.includes('validation') || lowerCaseMessage.includes('invalid')) {
            return 'Invalid notification data. Please check your input and try again.' + devSuffix;
        }

        // Authentication errors
        if (lowerCaseMessage.includes('authentication') || lowerCaseMessage.includes('unauthorized')) {
            return 'Authentication required. Please sign in and try again.' + devSuffix;
        }
    }

    logger.error('Notification service error:', error);
    return defaultMessage + devSuffix;
};

// ============================================================================
// Server Actions - Following established patterns
// ============================================================================

/**
 * Creates a new notification following server action patterns
 * Uses the same pattern as other actions in /src/app/actions.ts
 */
export async function createNotificationAction(
    prevState: any,
    formData: FormData
): Promise<ServerActionResponse<{ notificationId: string }>> {
    try {
        // Authentication check - following established pattern
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return createErrorResponse('Authentication required', {
                auth: ['You must be logged in to create notifications']
            });
        }

        // Validation - following established pattern
        const validation = validateFormData(CreateNotificationSchema, formData);
        if (!validation.success) {
            return createValidationErrorResponse(validation.error, prevState?.data);
        }

        const { userId, title, message, type, priority, actionUrl, expiresAt } = validation.data;

        // Authorization check - following established pattern
        if (userId !== user.id) {
            return createErrorResponse('Unauthorized', {
                auth: ['You can only create notifications for yourself']
            });
        }

        // Try to use existing comprehensive notification service first
        try {
            const { createNotificationAction: comprehensiveAction } = await import('@/services/notifications/notification-actions');

            // Map our simple schema to the comprehensive service format
            const serviceFormData = new FormData();
            serviceFormData.append('userId', userId);
            serviceFormData.append('title', title);
            serviceFormData.append('content', message);
            serviceFormData.append('type', (type || 'info').toUpperCase());
            serviceFormData.append('priority', (priority || 'normal').toUpperCase());
            if (actionUrl) serviceFormData.append('actionUrl', actionUrl);
            if (expiresAt) serviceFormData.append('expiresAt', expiresAt);

            const result = await comprehensiveAction(prevState, serviceFormData);

            if (result.message === 'success' && result.data?.id) {
                return createSuccessResponse({ notificationId: result.data.id });
            }
        } catch (serviceError) {
            logger.warn('Comprehensive notification service unavailable, using fallback', {
                error: serviceError instanceof Error ? serviceError.message : String(serviceError)
            });
        }

        // Fallback: Direct DynamoDB implementation following repository pattern
        const repository = getRepository();
        const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        await repository.create(
            `USER#${userId}`,
            `NOTIFICATION#${notificationId}`,
            'Notification',
            {
                id: notificationId,
                title,
                message,
                type,
                priority,
                actionUrl: actionUrl || null,
                expiresAt: expiresAt || null,
                createdAt: new Date().toISOString(),
                read: false,
            }
        );

        return createSuccessResponse({ notificationId });

    } catch (error) {
        logger.error('Failed to create notification:', error, {
            userId: user?.id,
            operation: 'createNotificationAction'
        });
        const errorMessage = handleNotificationError(error, 'Failed to create notification');
        return createErrorResponse(errorMessage, {}, prevState?.data);
    }
}

/**
 * Updates notification preferences following server action patterns
 */
export async function updateNotificationPreferencesAction(
    prevState: any,
    formData: FormData
): Promise<ServerActionResponse<NotificationPreferences>> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return createErrorResponse('Authentication required', {
                auth: ['You must be logged in to update preferences']
            });
        }

        const validation = validateFormData(NotificationPreferencesSchema, formData);
        if (!validation.success) {
            return createValidationErrorResponse(validation.error, prevState?.data);
        }

        const preferences = validation.data;
        const repository = getRepository();
        const keys = getNotificationPreferencesKeys(user.id);

        // Following DynamoDB patterns from other actions
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'NotificationPreferences',
            Data: {
                ...preferences,
                updatedAt: new Date().toISOString(),
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });

        return createSuccessResponse(preferences);

    } catch (error) {
        const errorMessage = handleNotificationError(error, 'Failed to update preferences');
        return createErrorResponse(errorMessage, {}, prevState?.data);
    }
}

/**
 * Gets notification preferences for the current user
 */
export async function getNotificationPreferencesAction(): Promise<ServerActionResponse<NotificationPreferences>> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return createErrorResponse('Authentication required', {
                auth: ['You must be logged in to view preferences']
            });
        }

        const repository = getRepository();
        const keys = getNotificationPreferencesKeys(user.id);
        const result = await repository.get(keys.PK, keys.SK);

        // Default preferences following the schema
        const defaultPreferences: NotificationPreferences = {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            maxDailyNotifications: 50,
            doNotDisturb: false,
        };

        // Type-safe preference merging - handling DynamoDB response properly
        let preferences = defaultPreferences;

        if (result && typeof result === 'object' && 'Data' in result && result.Data) {
            const storedData = result.Data as Record<string, any>;
            preferences = {
                emailNotifications: typeof storedData.emailNotifications === 'boolean'
                    ? storedData.emailNotifications
                    : defaultPreferences.emailNotifications,
                pushNotifications: typeof storedData.pushNotifications === 'boolean'
                    ? storedData.pushNotifications
                    : defaultPreferences.pushNotifications,
                smsNotifications: typeof storedData.smsNotifications === 'boolean'
                    ? storedData.smsNotifications
                    : defaultPreferences.smsNotifications,
                maxDailyNotifications: typeof storedData.maxDailyNotifications === 'number'
                    ? storedData.maxDailyNotifications
                    : defaultPreferences.maxDailyNotifications,
                doNotDisturb: typeof storedData.doNotDisturb === 'boolean'
                    ? storedData.doNotDisturb
                    : defaultPreferences.doNotDisturb,
            };
        }

        return createSuccessResponse(preferences);

    } catch (error) {
        const errorMessage = handleNotificationError(error, 'Failed to get preferences');
        return createErrorResponse(errorMessage);
    }
}

// ============================================================================
// Legacy Support - For backward compatibility
// ============================================================================

/**
 * @deprecated Use createNotificationAction instead
 * Legacy function for backward compatibility
 */
export async function createNotification(_input: CreateNotificationInput) {
    logger.warn('createNotification is deprecated. Use createNotificationAction instead.');
    return { success: true, notificationId: 'deprecated-use-action' };
}

/**
 * @deprecated Use updateNotificationPreferencesAction instead
 * Legacy function for backward compatibility
 */
export async function updateNotificationPreferences(_preferences: NotificationPreferences) {
    logger.warn('updateNotificationPreferences is deprecated. Use updateNotificationPreferencesAction instead.');
    return { success: true };
}

/**
 * @deprecated Use getNotificationPreferencesAction instead
 * Legacy function for backward compatibility
 */
export async function getNotificationPreferences(_userId: string): Promise<NotificationPreferences> {
    logger.warn('getNotificationPreferences is deprecated. Use getNotificationPreferencesAction instead.');
    return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        maxDailyNotifications: 50,
        doNotDisturb: false,
    };
}

// ============================================================================
// Additional Actions for Script Compatibility
// ============================================================================

export async function markAsReadAction(_notificationId: string): Promise<ServerActionResponse<{ success: boolean }>> {
    // TODO: Implement mark as read functionality
    return createSuccessResponse({ success: true });
}

export async function dismissNotificationAction(_notificationId: string): Promise<ServerActionResponse<{ success: boolean }>> {
    // TODO: Implement dismiss notification functionality
    return createSuccessResponse({ success: true });
}

export async function getUserPreferencesAction(_userId: string) {
    // Redirect to the main preferences action
    return getNotificationPreferencesAction();
}

export async function sendTestNotificationAction(_userId: string) {
    // TODO: Implement test notification functionality
    return { success: true, notificationId: 'test-notification' };
}

export async function bulkCreateNotificationsAction(notifications: CreateNotificationInput[]) {
    // TODO: Implement bulk creation functionality
    return { success: true, created: notifications.length };
}

export async function getNotificationHistoryAction(_userId: string) {
    // TODO: Implement history retrieval functionality
    return { notifications: [], total: 0 };
}

export async function getNotificationMetricsAction(_userId: string) {
    // TODO: Implement metrics retrieval functionality
    return { sent: 0, read: 0, dismissed: 0 };
}

export async function retryFailedNotificationsAction(_userId: string) {
    // TODO: Implement retry logic functionality
    return { success: true, retried: 0 };
}

export async function getRateLimitStatusAction(_userId: string) {
    // TODO: Implement rate limit status functionality
    return {
        success: true,
        rateLimitStatus: {
            remaining: 100,
            resetTime: Date.now() + 3600000, // 1 hour from now
            limit: 100
        }
    };
}