'use server';

/**
 * Permission Management Server Actions
 * 
 * Server actions for push notification permission management.
 * Validates Requirements: 5.1, 5.5
 */

import { getPermissionManager, PushSubscription } from '@/lib/notifications/permission-manager';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const pushSubscriptionSchema = z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
        p256dh: z.string().min(1, 'p256dh key is required'),
        auth: z.string().min(1, 'auth key is required'),
    }),
    expirationTime: z.number().optional(),
});

const grantPermissionSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    subscription: pushSubscriptionSchema,
    userAgent: z.string().optional(),
});

const revokePermissionSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    reason: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    subscription: pushSubscriptionSchema,
});

const getPermissionSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user
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
function successResponse(data: any, message: string = 'Success') {
    return {
        message,
        data,
        errors: {},
    };
}

// ============================================================================
// Permission Management Actions
// ============================================================================

/**
 * Grants push notification permission for a device
 * Validates Requirements: 5.1
 * 
 * @param formData Form data containing device ID and subscription
 * @returns Action result
 */
export async function grantPushPermissionAction(
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
            deviceId: formData.get('deviceId'),
            subscription: formData.get('subscription')
                ? JSON.parse(formData.get('subscription') as string)
                : undefined,
            userAgent: formData.get('userAgent') || undefined,
        };

        const validation = grantPermissionSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Grant permission
        const manager = getPermissionManager();
        const result = await manager.grantPermission(
            user.id,
            validation.data.deviceId,
            validation.data.subscription as PushSubscription,
            {
                userAgent: validation.data.userAgent,
            }
        );

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { granted: true, deviceId: validation.data.deviceId },
            result.message
        );
    } catch (error) {
        console.error('Grant push permission error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to grant push permission'
        );
    }
}

/**
 * Revokes push notification permission for a device
 * Validates Requirements: 5.5
 * 
 * @param formData Form data containing device ID and optional reason
 * @returns Action result
 */
export async function revokePushPermissionAction(
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
            deviceId: formData.get('deviceId'),
            reason: formData.get('reason') || undefined,
        };

        const validation = revokePermissionSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Revoke permission
        const manager = getPermissionManager();
        const result = await manager.revokePermission(
            user.id,
            validation.data.deviceId,
            validation.data.reason
        );

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { revoked: true, deviceId: validation.data.deviceId },
            result.message
        );
    } catch (error) {
        console.error('Revoke push permission error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to revoke push permission'
        );
    }
}

/**
 * Updates push subscription for a device
 * Validates Requirements: 5.1
 * 
 * @param formData Form data containing device ID and updated subscription
 * @returns Action result
 */
export async function updatePushSubscriptionAction(
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
            deviceId: formData.get('deviceId'),
            subscription: formData.get('subscription')
                ? JSON.parse(formData.get('subscription') as string)
                : undefined,
        };

        const validation = updateSubscriptionSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Update subscription
        const manager = getPermissionManager();
        const result = await manager.updateSubscription(
            user.id,
            validation.data.deviceId,
            validation.data.subscription as PushSubscription
        );

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { updated: true, deviceId: validation.data.deviceId },
            result.message
        );
    } catch (error) {
        console.error('Update push subscription error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to update push subscription'
        );
    }
}

/**
 * Gets push permission for a specific device
 * Validates Requirements: 5.1
 * 
 * @param formData Form data containing device ID
 * @returns Action result with permission details
 */
export async function getPushPermissionAction(
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
            deviceId: formData.get('deviceId'),
        };

        const validation = getPermissionSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Get permission
        const manager = getPermissionManager();
        const permission = await manager.getPermission(user.id, validation.data.deviceId);

        if (!permission) {
            return errorResponse('Permission not found');
        }

        return successResponse(permission);
    } catch (error) {
        console.error('Get push permission error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get push permission'
        );
    }
}

/**
 * Gets all push permissions for the current user
 * Validates Requirements: 5.1
 * 
 * @returns Action result with all permissions
 */
export async function getUserPushPermissionsAction(): Promise<{
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

        // Get all permissions
        const manager = getPermissionManager();
        const permissions = await manager.getUserPermissions(user.id);

        return successResponse({ permissions });
    } catch (error) {
        console.error('Get user push permissions error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get push permissions'
        );
    }
}

/**
 * Gets all active push subscriptions for the current user
 * Validates Requirements: 5.1
 * 
 * @returns Action result with active subscriptions
 */
export async function getActiveSubscriptionsAction(): Promise<{
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

        // Get active subscriptions
        const manager = getPermissionManager();
        const subscriptions = await manager.getActiveSubscriptions(user.id);

        return successResponse({ subscriptions });
    } catch (error) {
        console.error('Get active subscriptions error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get active subscriptions'
        );
    }
}

/**
 * Revokes all push permissions for the current user
 * Validates Requirements: 5.5
 * 
 * @param formData Form data containing optional reason
 * @returns Action result with revocation count
 */
export async function revokeAllPushPermissionsAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Get optional reason
        const reason = formData.get('reason') as string | undefined;

        // Revoke all permissions
        const manager = getPermissionManager();
        const result = await manager.revokeAllPermissions(user.id, reason);

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { revokedCount: result.revokedCount },
            result.message
        );
    } catch (error) {
        console.error('Revoke all push permissions error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to revoke all push permissions'
        );
    }
}

/**
 * Checks if the current user has active push permission
 * Validates Requirements: 5.1
 * 
 * @returns Action result with permission status
 */
export async function hasActivePushPermissionAction(): Promise<{
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

        // Check active permission
        const manager = getPermissionManager();
        const hasPermission = await manager.hasActivePermission(user.id);

        return successResponse({ hasPermission });
    } catch (error) {
        console.error('Check active push permission error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to check push permission'
        );
    }
}

/**
 * Gets permission history for the current user
 * Validates Requirements: 5.1, 5.5
 * 
 * @param formData Form data containing optional limit
 * @returns Action result with permission history
 */
export async function getPermissionHistoryAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse limit
        const limit = formData.get('limit')
            ? parseInt(formData.get('limit') as string)
            : 20;

        // Get history
        const manager = getPermissionManager();
        const history = await manager.getPermissionHistory(user.id, limit);

        return successResponse({ history });
    } catch (error) {
        console.error('Get permission history error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get permission history'
        );
    }
}

/**
 * Cleans up expired push subscriptions for the current user
 * Validates Requirements: 5.1
 * 
 * @returns Action result with cleanup count
 */
export async function cleanupExpiredSubscriptionsAction(): Promise<{
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

        // Cleanup expired subscriptions
        const manager = getPermissionManager();
        const cleanedCount = await manager.cleanupExpiredSubscriptions(user.id);

        return successResponse(
            { cleanedCount },
            `Cleaned up ${cleanedCount} expired subscription(s)`
        );
    } catch (error) {
        console.error('Cleanup expired subscriptions error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to cleanup expired subscriptions'
        );
    }
}
