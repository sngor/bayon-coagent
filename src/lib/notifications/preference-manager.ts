/**
 * Preference Manager
 * 
 * Manages notification preference validation, default values, updates, and channel filtering.
 * Validates Requirements: 3.2, 3.3
 */

import {
    NotificationPreferences,
    NotificationType,
    NotificationChannel,
    EmailFrequency,
    Notification,
    NotificationPriority,
} from "./types";
import {
    validateNotificationPreferences,
    safeValidate,
    notificationPreferencesSchema,
} from "./schemas";
import { getNotificationRepository } from "./repository";

/**
 * Preference change log entry
 * Tracks what changed in user preferences
 */
export interface PreferenceChange {
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: string;
}

/**
 * Preference change log
 * Complete log of preference changes for a user
 */
export interface PreferenceChangeLog {
    userId: string;
    changes: PreferenceChange[];
    timestamp: string;
}

/**
 * Channel filter result
 * Result of filtering channels based on preferences
 */
export interface ChannelFilterResult {
    allowedChannels: NotificationChannel[];
    blockedChannels: NotificationChannel[];
    reason?: string;
}

/**
 * PreferenceManager
 * 
 * Handles preference validation, merging, change tracking, and channel filtering.
 */
export class PreferenceManager {
    private repository = getNotificationRepository();
    // ============================================================================
    // Preference Storage
    // ============================================================================

    /**
     * Gets user notification preferences
     * Validates Requirements: 3.2
     * 
     * @param userId User ID
     * @returns User preferences or default preferences if not found
     */
    async getPreferences(userId: string): Promise<NotificationPreferences> {
        return await this.repository.getUserPreferences(userId);
    }

    /**
     * Updates user notification preferences
     * Validates Requirements: 3.2
     * 
     * @param userId User ID
     * @param preferences Partial preference updates
     * @returns Updated preferences
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<NotificationPreferences> {
        // Get current preferences
        const currentPreferences = await this.getPreferences(userId);

        // Merge and validate preferences
        const mergedPreferences = this.mergePreferences(currentPreferences, preferences);

        // Update in repository
        await this.repository.updateUserPreferences(userId, mergedPreferences);

        // Return updated preferences
        return await this.getPreferences(userId);
    }

    // ============================================================================
    // Default Preferences
    // ============================================================================

    /**
     * Gets default notification preferences for a new user
     * Validates Requirements: 3.2
     * 
     * @param userId User ID
     * @returns Default preferences
     */
    getDefaultPreferences(userId: string): NotificationPreferences {
        return {
            userId,
            channels: {
                inApp: {
                    enabled: true,
                    types: Object.values(NotificationType),
                },
                email: {
                    enabled: true,
                    types: [
                        NotificationType.ALERT,
                        NotificationType.ANNOUNCEMENT,
                        NotificationType.FEATURE_UPDATE,
                    ],
                    frequency: EmailFrequency.IMMEDIATE,
                },
                push: {
                    enabled: false,
                    types: [
                        NotificationType.ALERT,
                        NotificationType.REMINDER,
                    ],
                },
            },
            globalSettings: {
                doNotDisturb: false,
            },
            updatedAt: new Date().toISOString(),
        };
    }

    // ============================================================================
    // Preference Validation
    // ============================================================================

    /**
     * Validates notification preferences
     * Validates Requirements: 3.2
     * 
     * @param preferences Preferences to validate
     * @returns Validated preferences
     * @throws Error if validation fails
     */
    validatePreferences(preferences: unknown): NotificationPreferences {
        const validation = safeValidate(notificationPreferencesSchema, preferences);
        if (!validation.success) {
            throw new Error(`Invalid notification preferences: ${validation.error.message}`);
        }
        return validation.data;
    }

    /**
     * Validates and sanitizes partial preference updates
     * Validates Requirements: 3.2
     * 
     * @param updates Partial preference updates
     * @returns Sanitized updates
     */
    validatePartialPreferences(
        updates: Partial<NotificationPreferences>
    ): Partial<NotificationPreferences> {
        // Remove userId and updatedAt from updates (these are managed internally)
        const { userId, updatedAt, ...sanitizedUpdates } = updates as any;

        // Validate time formats if present
        if (updates.channels?.email?.digestTime) {
            this.validateTimeFormat(updates.channels.email.digestTime);
        }

        if (updates.channels?.email?.quietHours) {
            const { startTime, endTime } = updates.channels.email.quietHours;
            if (startTime) this.validateTimeFormat(startTime);
            if (endTime) this.validateTimeFormat(endTime);
        }

        // Validate notification types if present
        if (updates.channels?.inApp?.types) {
            this.validateNotificationTypes(updates.channels.inApp.types);
        }
        if (updates.channels?.email?.types) {
            this.validateNotificationTypes(updates.channels.email.types);
        }
        if (updates.channels?.push?.types) {
            this.validateNotificationTypes(updates.channels.push.types);
        }

        return sanitizedUpdates;
    }

    /**
     * Validates time format (HH:MM)
     * 
     * @param time Time string to validate
     * @throws Error if format is invalid
     */
    private validateTimeFormat(time: string): void {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            throw new Error(`Invalid time format: ${time}. Expected HH:MM format.`);
        }
    }

    /**
     * Validates notification types array
     * 
     * @param types Array of notification types
     * @throws Error if any type is invalid
     */
    private validateNotificationTypes(types: NotificationType[]): void {
        const validTypes = Object.values(NotificationType);
        for (const type of types) {
            if (!validTypes.includes(type)) {
                throw new Error(`Invalid notification type: ${type}`);
            }
        }
    }

    // ============================================================================
    // Preference Merging
    // ============================================================================

    /**
     * Merges partial preference updates with current preferences
     * Validates Requirements: 3.2
     * 
     * @param current Current preferences
     * @param updates Partial updates
     * @returns Merged preferences
     */
    mergePreferences(
        current: NotificationPreferences,
        updates: Partial<NotificationPreferences>
    ): NotificationPreferences {
        // Sanitize updates
        const sanitizedUpdates = this.validatePartialPreferences(updates);

        // Deep merge preferences
        const merged: NotificationPreferences = {
            userId: current.userId,
            channels: {
                inApp: {
                    enabled: sanitizedUpdates.channels?.inApp?.enabled ?? current.channels.inApp.enabled,
                    types: sanitizedUpdates.channels?.inApp?.types ?? current.channels.inApp.types,
                },
                email: {
                    enabled: sanitizedUpdates.channels?.email?.enabled ?? current.channels.email.enabled,
                    address: sanitizedUpdates.channels?.email?.address ?? current.channels.email.address,
                    types: sanitizedUpdates.channels?.email?.types ?? current.channels.email.types,
                    frequency: sanitizedUpdates.channels?.email?.frequency ?? current.channels.email.frequency,
                    digestTime: sanitizedUpdates.channels?.email?.digestTime ?? current.channels.email.digestTime,
                    quietHours: sanitizedUpdates.channels?.email?.quietHours
                        ? {
                            enabled: sanitizedUpdates.channels.email.quietHours.enabled ?? current.channels.email.quietHours?.enabled ?? false,
                            startTime: sanitizedUpdates.channels.email.quietHours.startTime ?? current.channels.email.quietHours?.startTime ?? "22:00",
                            endTime: sanitizedUpdates.channels.email.quietHours.endTime ?? current.channels.email.quietHours?.endTime ?? "08:00",
                            timezone: sanitizedUpdates.channels.email.quietHours.timezone ?? current.channels.email.quietHours?.timezone ?? "UTC",
                        }
                        : current.channels.email.quietHours,
                },
                push: {
                    enabled: sanitizedUpdates.channels?.push?.enabled ?? current.channels.push.enabled,
                    types: sanitizedUpdates.channels?.push?.types ?? current.channels.push.types,
                    subscription: sanitizedUpdates.channels?.push?.subscription ?? current.channels.push.subscription,
                },
            },
            globalSettings: {
                doNotDisturb: sanitizedUpdates.globalSettings?.doNotDisturb ?? current.globalSettings.doNotDisturb,
                maxDailyNotifications: sanitizedUpdates.globalSettings?.maxDailyNotifications ?? current.globalSettings.maxDailyNotifications,
            },
            updatedAt: new Date().toISOString(),
        };

        // Validate merged preferences
        return this.validatePreferences(merged);
    }

    // ============================================================================
    // Change Tracking
    // ============================================================================

    /**
     * Tracks changes between old and new preferences
     * Validates Requirements: 3.2
     * 
     * @param userId User ID
     * @param oldPreferences Old preferences
     * @param newPreferences New preferences
     * @returns Change log
     */
    trackPreferenceChanges(
        userId: string,
        oldPreferences: NotificationPreferences,
        newPreferences: NotificationPreferences
    ): PreferenceChangeLog {
        const changes: PreferenceChange[] = [];
        const timestamp = new Date().toISOString();

        // Track channel changes
        this.trackChannelChanges(oldPreferences, newPreferences, changes, timestamp);

        // Track global settings changes
        this.trackGlobalSettingsChanges(oldPreferences, newPreferences, changes, timestamp);

        return {
            userId,
            changes,
            timestamp,
        };
    }

    /**
     * Tracks changes in channel preferences
     * 
     * @param oldPrefs Old preferences
     * @param newPrefs New preferences
     * @param changes Array to add changes to
     * @param timestamp Change timestamp
     */
    private trackChannelChanges(
        oldPrefs: NotificationPreferences,
        newPrefs: NotificationPreferences,
        changes: PreferenceChange[],
        timestamp: string
    ): void {
        // In-app channel changes
        if (oldPrefs.channels.inApp.enabled !== newPrefs.channels.inApp.enabled) {
            changes.push({
                field: "channels.inApp.enabled",
                oldValue: oldPrefs.channels.inApp.enabled,
                newValue: newPrefs.channels.inApp.enabled,
                timestamp,
            });
        }
        if (JSON.stringify(oldPrefs.channels.inApp.types) !== JSON.stringify(newPrefs.channels.inApp.types)) {
            changes.push({
                field: "channels.inApp.types",
                oldValue: oldPrefs.channels.inApp.types,
                newValue: newPrefs.channels.inApp.types,
                timestamp,
            });
        }

        // Email channel changes
        if (oldPrefs.channels.email.enabled !== newPrefs.channels.email.enabled) {
            changes.push({
                field: "channels.email.enabled",
                oldValue: oldPrefs.channels.email.enabled,
                newValue: newPrefs.channels.email.enabled,
                timestamp,
            });
        }
        if (oldPrefs.channels.email.address !== newPrefs.channels.email.address) {
            changes.push({
                field: "channels.email.address",
                oldValue: oldPrefs.channels.email.address,
                newValue: newPrefs.channels.email.address,
                timestamp,
            });
        }
        if (JSON.stringify(oldPrefs.channels.email.types) !== JSON.stringify(newPrefs.channels.email.types)) {
            changes.push({
                field: "channels.email.types",
                oldValue: oldPrefs.channels.email.types,
                newValue: newPrefs.channels.email.types,
                timestamp,
            });
        }
        if (oldPrefs.channels.email.frequency !== newPrefs.channels.email.frequency) {
            changes.push({
                field: "channels.email.frequency",
                oldValue: oldPrefs.channels.email.frequency,
                newValue: newPrefs.channels.email.frequency,
                timestamp,
            });
        }
        if (oldPrefs.channels.email.digestTime !== newPrefs.channels.email.digestTime) {
            changes.push({
                field: "channels.email.digestTime",
                oldValue: oldPrefs.channels.email.digestTime,
                newValue: newPrefs.channels.email.digestTime,
                timestamp,
            });
        }

        // Push channel changes
        if (oldPrefs.channels.push.enabled !== newPrefs.channels.push.enabled) {
            changes.push({
                field: "channels.push.enabled",
                oldValue: oldPrefs.channels.push.enabled,
                newValue: newPrefs.channels.push.enabled,
                timestamp,
            });
        }
        if (JSON.stringify(oldPrefs.channels.push.types) !== JSON.stringify(newPrefs.channels.push.types)) {
            changes.push({
                field: "channels.push.types",
                oldValue: oldPrefs.channels.push.types,
                newValue: newPrefs.channels.push.types,
                timestamp,
            });
        }
    }

    /**
     * Tracks changes in global settings
     * 
     * @param oldPrefs Old preferences
     * @param newPrefs New preferences
     * @param changes Array to add changes to
     * @param timestamp Change timestamp
     */
    private trackGlobalSettingsChanges(
        oldPrefs: NotificationPreferences,
        newPrefs: NotificationPreferences,
        changes: PreferenceChange[],
        timestamp: string
    ): void {
        if (oldPrefs.globalSettings.doNotDisturb !== newPrefs.globalSettings.doNotDisturb) {
            changes.push({
                field: "globalSettings.doNotDisturb",
                oldValue: oldPrefs.globalSettings.doNotDisturb,
                newValue: newPrefs.globalSettings.doNotDisturb,
                timestamp,
            });
        }
        if (oldPrefs.globalSettings.maxDailyNotifications !== newPrefs.globalSettings.maxDailyNotifications) {
            changes.push({
                field: "globalSettings.maxDailyNotifications",
                oldValue: oldPrefs.globalSettings.maxDailyNotifications,
                newValue: newPrefs.globalSettings.maxDailyNotifications,
                timestamp,
            });
        }
    }

    // ============================================================================
    // Channel Filtering
    // ============================================================================

    /**
     * Filters notification channels based on user preferences
     * Validates Requirements: 3.3
     * 
     * @param notification Notification to filter
     * @param preferences User preferences
     * @returns Filter result with allowed and blocked channels
     */
    filterChannelsByPreferences(
        notification: Notification,
        preferences: NotificationPreferences
    ): ChannelFilterResult {
        const allowedChannels: NotificationChannel[] = [];
        const blockedChannels: NotificationChannel[] = [];
        let reason: string | undefined;

        // Check do not disturb mode
        if (preferences.globalSettings.doNotDisturb) {
            // Critical notifications bypass DND
            if (notification.priority !== NotificationPriority.CRITICAL) {
                return {
                    allowedChannels: [],
                    blockedChannels: notification.channels,
                    reason: "Do Not Disturb mode is enabled",
                };
            }
        }

        // Filter each channel
        for (const channel of notification.channels) {
            if (this.isChannelAllowed(channel, notification.type, preferences)) {
                allowedChannels.push(channel);
            } else {
                blockedChannels.push(channel);
            }
        }

        // Set reason if all channels are blocked
        if (allowedChannels.length === 0 && blockedChannels.length > 0) {
            reason = "All channels are disabled or notification type is not allowed";
        }

        return {
            allowedChannels,
            blockedChannels,
            reason,
        };
    }

    /**
     * Checks if a specific channel is allowed for a notification type
     * Validates Requirements: 3.3
     * 
     * @param channel Notification channel
     * @param type Notification type
     * @param preferences User preferences
     * @returns True if channel is allowed
     */
    isChannelAllowed(
        channel: NotificationChannel,
        type: NotificationType,
        preferences: NotificationPreferences
    ): boolean {
        switch (channel) {
            case NotificationChannel.IN_APP:
                return (
                    preferences.channels.inApp.enabled &&
                    preferences.channels.inApp.types.includes(type)
                );

            case NotificationChannel.EMAIL:
                return (
                    preferences.channels.email.enabled &&
                    preferences.channels.email.types.includes(type)
                );

            case NotificationChannel.PUSH:
                return (
                    preferences.channels.push.enabled &&
                    preferences.channels.push.types.includes(type) &&
                    !!preferences.channels.push.subscription
                );

            default:
                return false;
        }
    }

    /**
     * Gets allowed channels for a notification based on preferences
     * Validates Requirements: 3.3
     * 
     * @param type Notification type
     * @param priority Notification priority
     * @param preferences User preferences
     * @returns Array of allowed channels
     */
    getAllowedChannels(
        type: NotificationType,
        priority: NotificationPriority,
        preferences: NotificationPreferences
    ): NotificationChannel[] {
        const channels: NotificationChannel[] = [];

        // Check do not disturb mode
        if (preferences.globalSettings.doNotDisturb && priority !== NotificationPriority.CRITICAL) {
            return channels;
        }

        // Check each channel
        if (this.isChannelAllowed(NotificationChannel.IN_APP, type, preferences)) {
            channels.push(NotificationChannel.IN_APP);
        }
        if (this.isChannelAllowed(NotificationChannel.EMAIL, type, preferences)) {
            channels.push(NotificationChannel.EMAIL);
        }
        if (this.isChannelAllowed(NotificationChannel.PUSH, type, preferences)) {
            channels.push(NotificationChannel.PUSH);
        }

        // Critical notifications always use at least in-app if no channels are enabled
        if (channels.length === 0 && priority === NotificationPriority.CRITICAL) {
            if (preferences.channels.inApp.enabled) {
                channels.push(NotificationChannel.IN_APP);
            }
        }

        // Default to in-app if no channels are enabled
        if (channels.length === 0 && preferences.channels.inApp.enabled) {
            channels.push(NotificationChannel.IN_APP);
        }

        return channels;
    }

    // ============================================================================
    // Quiet Hours
    // ============================================================================

    /**
     * Checks if current time is within quiet hours
     * Validates Requirements: 3.3
     * 
     * @param preferences User preferences
     * @param currentTime Optional current time (for testing)
     * @returns True if within quiet hours
     */
    isWithinQuietHours(
        preferences: NotificationPreferences,
        currentTime?: Date
    ): boolean {
        const quietHours = preferences.channels.email.quietHours;
        if (!quietHours || !quietHours.enabled) {
            return false;
        }

        const now = currentTime || new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;

        const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);
        const endTimeMinutes = endHour * 60 + endMinute;

        // Handle quiet hours that span midnight
        if (startTimeMinutes > endTimeMinutes) {
            return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
        }

        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    }

    /**
     * Checks if email should be sent based on quiet hours
     * Validates Requirements: 3.3
     * 
     * @param preferences User preferences
     * @param priority Notification priority
     * @param currentTime Optional current time (for testing)
     * @returns True if email should be sent
     */
    shouldSendEmailNow(
        preferences: NotificationPreferences,
        priority: NotificationPriority,
        currentTime?: Date
    ): boolean {
        // Critical notifications bypass quiet hours
        if (priority === NotificationPriority.CRITICAL) {
            return true;
        }

        // Check if within quiet hours
        return !this.isWithinQuietHours(preferences, currentTime);
    }
}

/**
 * Singleton instance of the preference manager
 */
let preferenceManager: PreferenceManager | null = null;

/**
 * Gets the preference manager instance
 * @returns PreferenceManager instance
 */
export function getPreferenceManager(): PreferenceManager {
    if (!preferenceManager) {
        preferenceManager = new PreferenceManager();
    }
    return preferenceManager;
}
