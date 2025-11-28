/**
 * Permission Manager for Push Notifications
 * 
 * Handles push notification permission tracking, validation, and revocation.
 * Validates Requirements: 5.1, 5.5
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { NotificationType } from './types';

export interface PushPermission {
    userId: string;
    deviceId: string;
    granted: boolean;
    grantedAt?: string;
    revokedAt?: string;
    subscription?: PushSubscription;
    userAgent?: string;
    ipAddress?: string;
    updatedAt: string;
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    expirationTime?: number;
}

export interface PermissionHistory {
    userId: string;
    deviceId: string;
    action: 'granted' | 'revoked' | 'updated';
    timestamp: string;
    reason?: string;
    metadata?: Record<string, any>;
}

export class PermissionManager {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Registers a push notification permission grant
     * @param userId User ID
     * @param deviceId Device identifier
     * @param subscription Push subscription details
     * @param metadata Optional metadata (user agent, IP, etc.)
     * @returns Success status
     */
    async grantPermission(
        userId: string,
        deviceId: string,
        subscription: PushSubscription,
        metadata?: {
            userAgent?: string;
            ipAddress?: string;
        }
    ): Promise<{ success: boolean; message: string }> {
        try {
            const permission: PushPermission = {
                userId,
                deviceId,
                granted: true,
                grantedAt: new Date().toISOString(),
                subscription,
                userAgent: metadata?.userAgent,
                ipAddress: metadata?.ipAddress,
                updatedAt: new Date().toISOString(),
            };

            // Save permission
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `PUSH_PERMISSION#${deviceId}`,
                EntityType: 'PushPermission' as any,
                Data: permission,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Log permission history
            await this.logPermissionHistory(userId, deviceId, 'granted', {
                subscription: subscription.endpoint,
            });

            return {
                success: true,
                message: 'Push notification permission granted successfully',
            };
        } catch (error) {
            console.error('Failed to grant push permission:', error);
            return {
                success: false,
                message: 'Failed to grant push notification permission',
            };
        }
    }

    /**
     * Revokes push notification permission for a device
     * @param userId User ID
     * @param deviceId Device identifier
     * @param reason Optional reason for revocation
     * @returns Success status
     */
    async revokePermission(
        userId: string,
        deviceId: string,
        reason?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Get current permission
            const permission = await this.getPermission(userId, deviceId);

            if (!permission) {
                return {
                    success: false,
                    message: 'Permission not found',
                };
            }

            // Update permission to revoked
            permission.granted = false;
            permission.revokedAt = new Date().toISOString();
            permission.updatedAt = new Date().toISOString();

            // Save updated permission
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `PUSH_PERMISSION#${deviceId}`,
                EntityType: 'PushPermission' as any,
                Data: permission,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Log permission history
            await this.logPermissionHistory(userId, deviceId, 'revoked', {
                reason,
            });

            return {
                success: true,
                message: 'Push notification permission revoked successfully',
            };
        } catch (error) {
            console.error('Failed to revoke push permission:', error);
            return {
                success: false,
                message: 'Failed to revoke push notification permission',
            };
        }
    }

    /**
     * Updates push subscription details for a device
     * @param userId User ID
     * @param deviceId Device identifier
     * @param subscription Updated subscription details
     * @returns Success status
     */
    async updateSubscription(
        userId: string,
        deviceId: string,
        subscription: PushSubscription
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Get current permission
            const permission = await this.getPermission(userId, deviceId);

            if (!permission) {
                return {
                    success: false,
                    message: 'Permission not found',
                };
            }

            // Update subscription
            permission.subscription = subscription;
            permission.updatedAt = new Date().toISOString();

            // Save updated permission
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `PUSH_PERMISSION#${deviceId}`,
                EntityType: 'PushPermission' as any,
                Data: permission,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Log permission history
            await this.logPermissionHistory(userId, deviceId, 'updated', {
                subscription: subscription.endpoint,
            });

            return {
                success: true,
                message: 'Push subscription updated successfully',
            };
        } catch (error) {
            console.error('Failed to update push subscription:', error);
            return {
                success: false,
                message: 'Failed to update push subscription',
            };
        }
    }

    /**
     * Gets push permission for a specific device
     * @param userId User ID
     * @param deviceId Device identifier
     * @returns Permission or null if not found
     */
    async getPermission(userId: string, deviceId: string): Promise<PushPermission | null> {
        try {
            const result = await this.repository.get<PushPermission>(
                `USER#${userId}`,
                `PUSH_PERMISSION#${deviceId}`
            );

            return result || null;
        } catch (error) {
            console.error('Failed to get push permission:', error);
            return null;
        }
    }

    /**
     * Gets all push permissions for a user
     * @param userId User ID
     * @returns Array of permissions
     */
    async getUserPermissions(userId: string): Promise<PushPermission[]> {
        try {
            const result = await this.repository.query<PushPermission>(
                `USER#${userId}`,
                'PUSH_PERMISSION#'
            );

            return result.items;
        } catch (error) {
            console.error('Failed to get user permissions:', error);
            return [];
        }
    }

    /**
     * Checks if a user has granted push permission for any device
     * @param userId User ID
     * @returns True if user has at least one active permission
     */
    async hasActivePermission(userId: string): Promise<boolean> {
        try {
            const permissions = await this.getUserPermissions(userId);
            return permissions.some(p => p.granted);
        } catch (error) {
            console.error('Failed to check active permission:', error);
            return false;
        }
    }

    /**
     * Validates if push notifications can be sent to a user
     * Validates Requirements: 5.1, 5.5
     * 
     * @param userId User ID
     * @param deviceId Optional device ID to check specific device
     * @returns True if push notifications can be sent
     */
    async canSendPushNotification(userId: string, deviceId?: string): Promise<boolean> {
        try {
            if (deviceId) {
                // Check specific device
                const permission = await this.getPermission(userId, deviceId);
                return permission?.granted || false;
            } else {
                // Check if user has any active permissions
                return await this.hasActivePermission(userId);
            }
        } catch (error) {
            console.error('Failed to check push notification permission:', error);
            // Default to not allowing on error (fail closed for privacy)
            return false;
        }
    }

    /**
     * Gets all active push subscriptions for a user
     * @param userId User ID
     * @returns Array of active subscriptions
     */
    async getActiveSubscriptions(userId: string): Promise<Array<{
        deviceId: string;
        subscription: PushSubscription;
    }>> {
        try {
            const permissions = await this.getUserPermissions(userId);

            return permissions
                .filter(p => p.granted && p.subscription)
                .map(p => ({
                    deviceId: p.deviceId,
                    subscription: p.subscription!,
                }));
        } catch (error) {
            console.error('Failed to get active subscriptions:', error);
            return [];
        }
    }

    /**
     * Revokes all push permissions for a user
     * @param userId User ID
     * @param reason Optional reason for revocation
     * @returns Success status with count of revoked permissions
     */
    async revokeAllPermissions(
        userId: string,
        reason?: string
    ): Promise<{ success: boolean; message: string; revokedCount: number }> {
        try {
            const permissions = await this.getUserPermissions(userId);
            const activePermissions = permissions.filter(p => p.granted);

            let revokedCount = 0;

            for (const permission of activePermissions) {
                const result = await this.revokePermission(userId, permission.deviceId, reason);
                if (result.success) {
                    revokedCount++;
                }
            }

            return {
                success: true,
                message: `Revoked ${revokedCount} push notification permission(s)`,
                revokedCount,
            };
        } catch (error) {
            console.error('Failed to revoke all permissions:', error);
            return {
                success: false,
                message: 'Failed to revoke push notification permissions',
                revokedCount: 0,
            };
        }
    }

    /**
     * Cleans up expired push subscriptions
     * @param userId User ID
     * @returns Number of cleaned up subscriptions
     */
    async cleanupExpiredSubscriptions(userId: string): Promise<number> {
        try {
            const permissions = await this.getUserPermissions(userId);
            const now = Date.now();
            let cleanedCount = 0;

            for (const permission of permissions) {
                if (permission.subscription?.expirationTime) {
                    if (permission.subscription.expirationTime < now) {
                        // Subscription has expired, revoke it
                        await this.revokePermission(
                            userId,
                            permission.deviceId,
                            'Subscription expired'
                        );
                        cleanedCount++;
                    }
                }
            }

            return cleanedCount;
        } catch (error) {
            console.error('Failed to cleanup expired subscriptions:', error);
            return 0;
        }
    }

    /**
     * Gets permission history for a user
     * @param userId User ID
     * @param limit Maximum number of records to return
     * @returns Array of permission history records
     */
    async getPermissionHistory(userId: string, limit: number = 20): Promise<PermissionHistory[]> {
        try {
            const result = await this.repository.query<PermissionHistory>(
                `USER#${userId}`,
                'PERMISSION_HISTORY#',
                {
                    scanIndexForward: false, // Most recent first
                    limit: limit,
                }
            );

            return result.items;
        } catch (error) {
            console.error('Failed to get permission history:', error);
            return [];
        }
    }

    /**
     * Logs a permission history event
     * @param userId User ID
     * @param deviceId Device identifier
     * @param action Action performed
     * @param metadata Optional metadata
     */
    private async logPermissionHistory(
        userId: string,
        deviceId: string,
        action: 'granted' | 'revoked' | 'updated',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const history: PermissionHistory = {
                userId,
                deviceId,
                action,
                timestamp: new Date().toISOString(),
                metadata,
            };

            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `PERMISSION_HISTORY#${Date.now()}#${deviceId}`,
                EntityType: 'PermissionHistory' as any,
                Data: history,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to log permission history:', error);
            // Don't throw - logging failure shouldn't break the main operation
        }
    }

    /**
     * Validates a push subscription object
     * @param subscription Subscription to validate
     * @returns True if valid
     */
    validateSubscription(subscription: any): subscription is PushSubscription {
        return (
            subscription &&
            typeof subscription.endpoint === 'string' &&
            subscription.endpoint.length > 0 &&
            subscription.keys &&
            typeof subscription.keys.p256dh === 'string' &&
            typeof subscription.keys.auth === 'string'
        );
    }
}

// Export singleton instance
export const permissionManager = new PermissionManager();

// Export factory function
export const getPermissionManager = () => permissionManager;
