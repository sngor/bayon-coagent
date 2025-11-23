/**
 * Push Notification Manager for Mobile Enhancements
 * 
 * This module provides the main interface for managing push notifications,
 * including permission requests, subscription management, and notification preferences.
 */

import { createPlatformEndpoint, deletePlatformEndpoint } from '../aws/sns/client';
import { DynamoDBRepository } from '../aws/dynamodb/repository';
import { getNotificationPreferencesKeys, getPushTokenKeys } from '../aws/dynamodb/keys';

export interface NotificationPreferences {
    enabled: boolean;
    priceChanges: boolean;
    newListings: boolean;
    trendShifts: boolean;
    quietHours: { start: string; end: string } | null;
}

export interface PushTokenData {
    token: string;
    endpointArn: string;
    deviceId: string;
    platform: 'ios' | 'android' | 'web';
    createdAt: string;
    lastUsed: string;
}

export interface MarketAlert {
    type: 'price-change' | 'new-listing' | 'trend-shift';
    location: string;
    data: any;
    timestamp: number;
}

/**
 * Main push notification manager class
 */
export class PushNotificationManager {
    private repository: DynamoDBRepository;
    private userId: string;

    constructor(userId: string) {
        this.repository = new DynamoDBRepository();
        this.userId = userId;
    }

    /**
     * Request push notification permission from the browser
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe(pushToken: string, deviceId: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
        try {
            // Check if permission is granted
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                throw new Error('Push notification permission not granted');
            }

            // Create SNS platform endpoint
            const endpointArn = await createPlatformEndpoint(pushToken, this.userId);

            // Store push token data in DynamoDB
            const tokenData: PushTokenData = {
                token: pushToken,
                endpointArn,
                deviceId,
                platform,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
            };

            const keys = getPushTokenKeys(this.userId, deviceId);
            await this.repository.create(
                keys.PK,
                keys.SK,
                'PushToken',
                tokenData
            );

            console.log('Push notification subscription successful');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(deviceId: string): Promise<void> {
        try {
            // Get the push token data
            const keys = getPushTokenKeys(this.userId, deviceId);
            const tokenData = await this.repository.get<PushTokenData>(keys.PK, keys.SK);

            if (tokenData) {
                // Delete SNS endpoint
                await deletePlatformEndpoint(tokenData.endpointArn);

                // Remove from DynamoDB
                await this.repository.delete(keys.PK, keys.SK);
            }

            console.log('Push notification unsubscription successful');
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
            throw error;
        }
    }

    /**
     * Update push token (for token refresh)
     */
    async updateToken(deviceId: string, newToken: string): Promise<void> {
        try {
            const keys = getPushTokenKeys(this.userId, deviceId);
            const tokenData = await this.repository.get<PushTokenData>(keys.PK, keys.SK);

            if (!tokenData) {
                throw new Error('Push token not found');
            }

            // Delete old endpoint
            await deletePlatformEndpoint(tokenData.endpointArn);

            // Create new endpoint with new token
            const newEndpointArn = await createPlatformEndpoint(newToken, this.userId);

            // Update token data
            const updatedTokenData: Partial<PushTokenData> = {
                token: newToken,
                endpointArn: newEndpointArn,
                lastUsed: new Date().toISOString(),
            };

            await this.repository.update(keys.PK, keys.SK, updatedTokenData);

            console.log('Push token updated successfully');
        } catch (error) {
            console.error('Failed to update push token:', error);
            throw error;
        }
    }

    /**
     * Get notification preferences for the user
     */
    async getPreferences(): Promise<NotificationPreferences> {
        try {
            const keys = getNotificationPreferencesKeys(this.userId);
            const preferences = await this.repository.get<NotificationPreferences>(keys.PK, keys.SK);

            // Return default preferences if none exist
            if (!preferences) {
                return {
                    enabled: true,
                    priceChanges: true,
                    newListings: true,
                    trendShifts: true,
                    quietHours: null,
                };
            }

            return preferences;
        } catch (error) {
            console.error('Failed to get notification preferences:', error);
            throw error;
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences: NotificationPreferences): Promise<void> {
        try {
            const keys = getNotificationPreferencesKeys(this.userId);

            // Check if preferences exist
            const existingPrefs = await this.repository.get<NotificationPreferences>(keys.PK, keys.SK);

            if (existingPrefs) {
                // Update existing preferences
                await this.repository.update(keys.PK, keys.SK, preferences);
            } else {
                // Create new preferences
                await this.repository.create(
                    keys.PK,
                    keys.SK,
                    'NotificationPreferences',
                    preferences
                );
            }

            console.log('Notification preferences updated successfully');
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            throw error;
        }
    }

    /**
     * Check if notifications should be sent based on preferences and quiet hours
     */
    async shouldSendNotification(alertType: keyof Omit<NotificationPreferences, 'enabled' | 'quietHours'>): Promise<boolean> {
        try {
            const preferences = await this.getPreferences();

            // Check if notifications are globally disabled
            if (!preferences.enabled) {
                return false;
            }

            // Check if this specific alert type is disabled
            if (!preferences[alertType]) {
                return false;
            }

            // Check quiet hours
            if (preferences.quietHours) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();

                const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
                const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);

                const startTime = startHour * 60 + startMinute;
                const endTime = endHour * 60 + endMinute;

                // Handle quiet hours that span midnight
                if (startTime > endTime) {
                    // Quiet hours span midnight (e.g., 22:00 to 06:00)
                    if (currentTime >= startTime || currentTime <= endTime) {
                        return false;
                    }
                } else {
                    // Normal quiet hours (e.g., 22:00 to 23:00)
                    if (currentTime >= startTime && currentTime <= endTime) {
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking notification preferences:', error);
            return false;
        }
    }

    /**
     * Get all push tokens for the user
     */
    async getPushTokens(): Promise<PushTokenData[]> {
        try {
            const pk = `USER#${this.userId}`;
            const skPrefix = 'PUSH_TOKEN#';

            const result = await this.repository.query<PushTokenData>(pk, skPrefix);
            return result.items;
        } catch (error) {
            console.error('Failed to get push tokens:', error);
            return [];
        }
    }

    /**
     * Clean up expired or invalid push tokens
     */
    async cleanupExpiredTokens(): Promise<void> {
        try {
            const tokens = await this.getPushTokens();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            for (const token of tokens) {
                const lastUsed = new Date(token.lastUsed);

                // Remove tokens that haven't been used in 30 days
                if (lastUsed < thirtyDaysAgo) {
                    console.log(`Cleaning up expired token for device: ${token.deviceId}`);
                    await this.unsubscribe(token.deviceId);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup expired tokens:', error);
        }
    }

    /**
     * Update last used timestamp for a token
     */
    async updateTokenLastUsed(deviceId: string): Promise<void> {
        try {
            const keys = getPushTokenKeys(this.userId, deviceId);
            await this.repository.update(keys.PK, keys.SK, {
                lastUsed: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to update token last used:', error);
        }
    }

    /**
     * Check if user has any active push subscriptions
     */
    async hasActiveSubscriptions(): Promise<boolean> {
        try {
            const tokens = await this.getPushTokens();
            return tokens.length > 0;
        } catch (error) {
            console.error('Failed to check active subscriptions:', error);
            return false;
        }
    }

    /**
     * Get device-specific push token
     */
    async getDeviceToken(deviceId: string): Promise<PushTokenData | null> {
        try {
            const keys = getPushTokenKeys(this.userId, deviceId);
            return await this.repository.get<PushTokenData>(keys.PK, keys.SK);
        } catch (error) {
            console.error('Failed to get device token:', error);
            return null;
        }
    }
}

/**
 * Create a push notification manager instance for a user
 */
export function createPushNotificationManager(userId: string): PushNotificationManager {
    return new PushNotificationManager(userId);
}

/**
 * Utility function to generate a device ID
 */
export function generateDeviceId(): string {
    // Generate a unique device ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
    ].join('|');

    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `device_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
    return (
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window
    );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}