/**
 * Unsubscribe Service for Notification System
 * 
 * Handles unsubscribe link generation, preference management, and compliance validation.
 * Validates Requirements: 4.5
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { NotificationPreferences, NotificationType } from './types';
import crypto from 'crypto';

export interface UnsubscribeToken {
    userId: string;
    email: string;
    token: string;
    createdAt: string;
    expiresAt: string;
}

export interface UnsubscribeRecord {
    userId: string;
    email: string;
    unsubscribedAt: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    alertTypes: NotificationType[]; // Empty array means unsubscribed from all
}

export interface UnsubscribePreference {
    userId: string;
    email: string;
    globalUnsubscribe: boolean; // Unsubscribed from all emails
    typeUnsubscribes: NotificationType[]; // Specific types unsubscribed from
    updatedAt: string;
}

export class UnsubscribeService {
    private repository: DynamoDBRepository;
    private tokenSecret: string;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.tokenSecret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'default-secret-change-in-production';
    }

    /**
     * Generates a secure unsubscribe token for a user
     * @param userId User ID
     * @param email User email address
     * @returns Unsubscribe token
     */
    generateUnsubscribeToken(userId: string, email: string): string {
        const timestamp = Date.now().toString();
        const data = `${userId}:${email}:${timestamp}`;
        const hmac = crypto.createHmac('sha256', this.tokenSecret);
        hmac.update(data);
        const signature = hmac.digest('hex');

        // Encode the data and signature
        const token = Buffer.from(`${data}:${signature}`).toString('base64url');
        return token;
    }

    /**
     * Validates and decodes an unsubscribe token
     * @param token Unsubscribe token
     * @returns Decoded token data or null if invalid
     */
    validateUnsubscribeToken(token: string): { userId: string; email: string; timestamp: number } | null {
        try {
            // Decode the token
            const decoded = Buffer.from(token, 'base64url').toString('utf-8');
            const parts = decoded.split(':');

            if (parts.length !== 4) {
                return null;
            }

            const [userId, email, timestamp, signature] = parts;

            // Verify signature
            const data = `${userId}:${email}:${timestamp}`;
            const hmac = crypto.createHmac('sha256', this.tokenSecret);
            hmac.update(data);
            const expectedSignature = hmac.digest('hex');

            if (signature !== expectedSignature) {
                return null;
            }

            // Check if token is expired (30 days)
            const tokenAge = Date.now() - parseInt(timestamp);
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

            if (tokenAge > maxAge) {
                return null;
            }

            return {
                userId,
                email,
                timestamp: parseInt(timestamp),
            };
        } catch (error) {
            console.error('Failed to validate unsubscribe token:', error);
            return null;
        }
    }

    /**
     * Generates an unsubscribe URL for a user
     * @param userId User ID
     * @param email User email address
     * @returns Unsubscribe URL
     */
    generateUnsubscribeUrl(userId: string, email: string): string {
        const token = this.generateUnsubscribeToken(userId, email);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        return `${baseUrl}/unsubscribe?token=${token}`;
    }

    /**
     * Processes an unsubscribe request
     * @param token Unsubscribe token
     * @param options Unsubscribe options
     * @returns Success status
     */
    async processUnsubscribe(
        token: string,
        options: {
            reason?: string;
            ipAddress?: string;
            userAgent?: string;
            alertTypes?: NotificationType[]; // If empty or undefined, unsubscribe from all
        } = {}
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validate token
            const tokenData = this.validateUnsubscribeToken(token);
            if (!tokenData) {
                return {
                    success: false,
                    message: 'Invalid or expired unsubscribe link',
                };
            }

            const { userId, email } = tokenData;

            // Get current preferences
            const preferences = await this.getUnsubscribePreferences(userId);

            // Determine what to unsubscribe from
            const alertTypes = options.alertTypes || [];
            const globalUnsubscribe = alertTypes.length === 0;

            // Update preferences
            if (globalUnsubscribe) {
                // Unsubscribe from all email notifications
                preferences.globalUnsubscribe = true;
                preferences.typeUnsubscribes = [];
            } else {
                // Unsubscribe from specific types
                const newTypes = [...new Set([...preferences.typeUnsubscribes, ...alertTypes])];
                preferences.typeUnsubscribes = newTypes;
            }

            preferences.updatedAt = new Date().toISOString();

            // Save unsubscribe preferences
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: 'UNSUBSCRIBE_PREFERENCES',
                EntityType: 'UnsubscribePreferences' as any,
                Data: preferences,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Create unsubscribe record for audit trail
            const record: UnsubscribeRecord = {
                userId,
                email,
                unsubscribedAt: new Date().toISOString(),
                reason: options.reason,
                ipAddress: options.ipAddress,
                userAgent: options.userAgent,
                alertTypes,
            };

            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `UNSUBSCRIBE_RECORD#${Date.now()}`,
                EntityType: 'UnsubscribeRecord' as any,
                Data: record,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Update notification preferences to disable email
            await this.updateNotificationPreferences(userId, globalUnsubscribe, alertTypes);

            return {
                success: true,
                message: globalUnsubscribe
                    ? 'You have been unsubscribed from all email notifications'
                    : `You have been unsubscribed from ${alertTypes.length} notification type(s)`,
            };
        } catch (error) {
            console.error('Failed to process unsubscribe:', error);
            return {
                success: false,
                message: 'Failed to process unsubscribe request',
            };
        }
    }

    /**
     * Gets unsubscribe preferences for a user
     * @param userId User ID
     * @returns Unsubscribe preferences
     */
    async getUnsubscribePreferences(userId: string): Promise<UnsubscribePreference> {
        try {
            const result = await this.repository.get<UnsubscribePreference>(
                `USER#${userId}`,
                'UNSUBSCRIBE_PREFERENCES'
            );

            if (result) {
                return result;
            }

            // Return default preferences if none exist
            return {
                userId,
                email: '',
                globalUnsubscribe: false,
                typeUnsubscribes: [],
                updatedAt: new Date().toISOString(),
            };
        } catch (error) {
            // Return default preferences on error
            return {
                userId,
                email: '',
                globalUnsubscribe: false,
                typeUnsubscribes: [],
                updatedAt: new Date().toISOString(),
            };
        }
    }

    /**
     * Updates notification preferences based on unsubscribe action
     * @param userId User ID
     * @param globalUnsubscribe Whether to unsubscribe from all
     * @param alertTypes Specific alert types to unsubscribe from
     */
    private async updateNotificationPreferences(
        userId: string,
        globalUnsubscribe: boolean,
        alertTypes: NotificationType[]
    ): Promise<void> {
        try {
            // Get current notification preferences
            const prefsResult = await this.repository.get<NotificationPreferences>(
                `USER#${userId}`,
                'SETTINGS#NOTIFICATIONS'
            );

            if (!prefsResult) {
                return; // No preferences to update
            }

            const preferences = prefsResult;

            if (globalUnsubscribe) {
                // Disable all email notifications
                if (preferences.channels?.email) {
                    preferences.channels.email.enabled = false;
                }
            } else {
                // Remove specific types from enabled list
                if (preferences.channels?.email) {
                    preferences.channels.email.types = preferences.channels.email.types.filter(
                        type => !alertTypes.includes(type)
                    );
                }
            }

            preferences.updatedAt = new Date().toISOString();

            // Save updated preferences
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: 'SETTINGS#NOTIFICATIONS',
                EntityType: 'NotificationPreferences',
                Data: preferences,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            // Don't throw - unsubscribe should still succeed even if preference update fails
        }
    }

    /**
     * Validates if a user can receive email notifications
     * @param userId User ID
     * @param notificationType Type of notification
     * @returns True if user can receive emails, false otherwise
     */
    async canSendEmail(userId: string, notificationType?: NotificationType): Promise<boolean> {
        try {
            const preferences = await this.getUnsubscribePreferences(userId);

            // Check global unsubscribe
            if (preferences.globalUnsubscribe) {
                return false;
            }

            // Check type-specific unsubscribe
            if (notificationType && preferences.typeUnsubscribes.includes(notificationType)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to check email permission:', error);
            // Default to allowing emails on error (fail open)
            return true;
        }
    }

    /**
     * Re-subscribes a user to email notifications
     * @param userId User ID
     * @param alertTypes Specific types to re-subscribe to (empty = all)
     * @returns Success status
     */
    async resubscribe(
        userId: string,
        alertTypes: NotificationType[] = []
    ): Promise<{ success: boolean; message: string }> {
        try {
            const preferences = await this.getUnsubscribePreferences(userId);

            if (alertTypes.length === 0) {
                // Re-subscribe to all
                preferences.globalUnsubscribe = false;
                preferences.typeUnsubscribes = [];
            } else {
                // Re-subscribe to specific types
                preferences.typeUnsubscribes = preferences.typeUnsubscribes.filter(
                    type => !alertTypes.includes(type)
                );
            }

            preferences.updatedAt = new Date().toISOString();

            // Save updated preferences
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: 'UNSUBSCRIBE_PREFERENCES',
                EntityType: 'UnsubscribePreferences' as any,
                Data: preferences,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });

            // Re-enable email notifications
            await this.reEnableEmailNotifications(userId, alertTypes);

            return {
                success: true,
                message: alertTypes.length === 0
                    ? 'You have been re-subscribed to all email notifications'
                    : `You have been re-subscribed to ${alertTypes.length} notification type(s)`,
            };
        } catch (error) {
            console.error('Failed to resubscribe:', error);
            return {
                success: false,
                message: 'Failed to process resubscribe request',
            };
        }
    }

    /**
     * Re-enables email notifications for a user
     * @param userId User ID
     * @param alertTypes Specific types to re-enable (empty = all)
     */
    private async reEnableEmailNotifications(
        userId: string,
        alertTypes: NotificationType[]
    ): Promise<void> {
        try {
            // Get current notification preferences
            const prefsResult = await this.repository.get<NotificationPreferences>(
                `USER#${userId}`,
                'SETTINGS#NOTIFICATIONS'
            );

            if (!prefsResult) {
                return; // No preferences to update
            }

            const preferences = prefsResult;

            if (alertTypes.length === 0) {
                // Re-enable all email notifications
                if (preferences.channels?.email) {
                    preferences.channels.email.enabled = true;
                }
            } else {
                // Add specific types back to enabled list
                if (preferences.channels?.email) {
                    const currentTypes = preferences.channels.email.types || [];
                    preferences.channels.email.types = [...new Set([...currentTypes, ...alertTypes])];
                }
            }

            preferences.updatedAt = new Date().toISOString();

            // Save updated preferences
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: 'SETTINGS#NOTIFICATIONS',
                EntityType: 'NotificationPreferences',
                Data: preferences,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to re-enable email notifications:', error);
        }
    }

    /**
     * Gets unsubscribe history for a user (audit trail)
     * @param userId User ID
     * @param limit Maximum number of records to return
     * @returns Array of unsubscribe records
     */
    async getUnsubscribeHistory(userId: string, limit: number = 10): Promise<UnsubscribeRecord[]> {
        try {
            const result = await this.repository.query({
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': 'UNSUBSCRIBE_RECORD#',
                },
                ScanIndexForward: false, // Most recent first
                Limit: limit,
            });

            return result.items.map((item: any) => item.Data as UnsubscribeRecord);
        } catch (error) {
            console.error('Failed to get unsubscribe history:', error);
            return [];
        }
    }
}

// Export singleton instance
export const unsubscribeService = new UnsubscribeService();

// Export factory function
export const getUnsubscribeService = () => unsubscribeService;
