/**
 * Preference Manager Tests
 * 
 * Tests for preference validation, merging, change tracking, and channel filtering.
 * Validates Requirements: 3.2, 3.3
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    PreferenceManager,
    PreferenceChangeLog,
    ChannelFilterResult,
} from '../preference-manager';
import {
    NotificationPreferences,
    NotificationType,
    NotificationChannel,
    EmailFrequency,
    NotificationPriority,
    Notification,
    NotificationStatus,
} from '../types';

describe('PreferenceManager', () => {
    let preferenceManager: PreferenceManager;

    beforeEach(() => {
        preferenceManager = new PreferenceManager();
    });

    // ============================================================================
    // Default Preferences Tests
    // ============================================================================

    describe('getDefaultPreferences', () => {
        it('should return valid default preferences for a user', () => {
            const userId = 'user123';
            const defaults = preferenceManager.getDefaultPreferences(userId);

            expect(defaults.userId).toBe(userId);
            expect(defaults.channels.inApp.enabled).toBe(true);
            expect(defaults.channels.email.enabled).toBe(true);
            expect(defaults.channels.push.enabled).toBe(false);
            expect(defaults.globalSettings.doNotDisturb).toBe(false);
            expect(defaults.updatedAt).toBeDefined();
        });

        it('should include all notification types for in-app by default', () => {
            const defaults = preferenceManager.getDefaultPreferences('user123');
            const allTypes = Object.values(NotificationType);

            expect(defaults.channels.inApp.types).toEqual(allTypes);
        });

        it('should include specific types for email by default', () => {
            const defaults = preferenceManager.getDefaultPreferences('user123');

            expect(defaults.channels.email.types).toContain(NotificationType.ALERT);
            expect(defaults.channels.email.types).toContain(NotificationType.ANNOUNCEMENT);
            expect(defaults.channels.email.types).toContain(NotificationType.FEATURE_UPDATE);
        });
    });

    // ============================================================================
    // Preference Validation Tests
    // ============================================================================

    describe('validatePreferences', () => {
        it('should validate correct preferences', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            const validated = preferenceManager.validatePreferences(preferences);

            expect(validated).toEqual(preferences);
        });

        it('should throw error for invalid preferences', () => {
            const invalid = {
                userId: 'user123',
                channels: {
                    inApp: { enabled: 'not-a-boolean' }, // Invalid type
                },
            };

            expect(() => preferenceManager.validatePreferences(invalid)).toThrow();
        });

        it('should throw error for invalid time format', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.digestTime = '25:00'; // Invalid hour

            expect(() => preferenceManager.validatePreferences(preferences)).toThrow();
        });
    });

    describe('validatePartialPreferences', () => {
        it('should validate partial preference updates', () => {
            const updates: Partial<NotificationPreferences> = {
                channels: {
                    inApp: {
                        enabled: false,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.DAILY,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
            };

            const validated = preferenceManager.validatePartialPreferences(updates);
            expect(validated.channels?.inApp?.enabled).toBe(false);
        });

        it('should remove userId and updatedAt from updates', () => {
            const updates: any = {
                userId: 'should-be-removed',
                updatedAt: 'should-be-removed',
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
            };

            const validated = preferenceManager.validatePartialPreferences(updates);
            expect(validated).not.toHaveProperty('userId');
            expect(validated).not.toHaveProperty('updatedAt');
        });

        it('should throw error for invalid time format in updates', () => {
            const updates: Partial<NotificationPreferences> = {
                channels: {
                    inApp: { enabled: true, types: [] },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                        digestTime: 'invalid-time',
                    },
                    push: { enabled: false, types: [] },
                },
            };

            expect(() => preferenceManager.validatePartialPreferences(updates)).toThrow();
        });
    });

    // ============================================================================
    // Preference Merging Tests
    // ============================================================================

    describe('mergePreferences', () => {
        it('should merge partial updates with current preferences', () => {
            const current = preferenceManager.getDefaultPreferences('user123');
            const updates: Partial<NotificationPreferences> = {
                channels: {
                    inApp: {
                        enabled: false,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
            };

            const merged = preferenceManager.mergePreferences(current, updates);

            expect(merged.userId).toBe('user123');
            expect(merged.channels.inApp.enabled).toBe(false);
            expect(merged.channels.inApp.types).toEqual([NotificationType.ALERT]);
            expect(merged.channels.email.frequency).toBe(EmailFrequency.DAILY);
        });

        it('should preserve unchanged fields', () => {
            const current = preferenceManager.getDefaultPreferences('user123');
            const updates: Partial<NotificationPreferences> = {
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
            };

            const merged = preferenceManager.mergePreferences(current, updates);

            expect(merged.globalSettings.doNotDisturb).toBe(current.globalSettings.doNotDisturb);
        });

        it('should update timestamp', async () => {
            const current = preferenceManager.getDefaultPreferences('user123');
            const oldTimestamp = current.updatedAt;

            // Wait a bit to ensure timestamp changes
            await new Promise(resolve => setTimeout(resolve, 10));

            const updates: Partial<NotificationPreferences> = {
                globalSettings: {
                    doNotDisturb: true,
                },
            };

            const merged = preferenceManager.mergePreferences(current, updates);

            expect(merged.updatedAt).not.toBe(oldTimestamp);
        });

        it('should handle quiet hours updates', () => {
            const current = preferenceManager.getDefaultPreferences('user123');
            const updates: Partial<NotificationPreferences> = {
                channels: {
                    inApp: { enabled: true, types: [] },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                        quietHours: {
                            enabled: true,
                            startTime: '22:00',
                            endTime: '08:00',
                            timezone: 'America/New_York',
                        },
                    },
                    push: { enabled: false, types: [] },
                },
            };

            const merged = preferenceManager.mergePreferences(current, updates);

            expect(merged.channels.email.quietHours).toBeDefined();
            expect(merged.channels.email.quietHours?.enabled).toBe(true);
            expect(merged.channels.email.quietHours?.startTime).toBe('22:00');
        });
    });

    // ============================================================================
    // Change Tracking Tests
    // ============================================================================

    describe('trackPreferenceChanges', () => {
        it('should track changes between old and new preferences', () => {
            const oldPrefs = preferenceManager.getDefaultPreferences('user123');
            const newPrefs = JSON.parse(JSON.stringify(oldPrefs)); // Deep copy
            newPrefs.channels.inApp.enabled = false;
            newPrefs.globalSettings.doNotDisturb = true;

            const changeLog = preferenceManager.trackPreferenceChanges('user123', oldPrefs, newPrefs);

            expect(changeLog.userId).toBe('user123');
            expect(changeLog.changes.length).toBeGreaterThan(0);
            expect(changeLog.timestamp).toBeDefined();
        });

        it('should track in-app channel changes', () => {
            const oldPrefs = preferenceManager.getDefaultPreferences('user123');
            const newPrefs = JSON.parse(JSON.stringify(oldPrefs)); // Deep copy
            newPrefs.channels.inApp.enabled = false;

            const changeLog = preferenceManager.trackPreferenceChanges('user123', oldPrefs, newPrefs);

            const inAppChange = changeLog.changes.find(c => c.field === 'channels.inApp.enabled');
            expect(inAppChange).toBeDefined();
            expect(inAppChange?.oldValue).toBe(true);
            expect(inAppChange?.newValue).toBe(false);
        });

        it('should track email channel changes', () => {
            const oldPrefs = preferenceManager.getDefaultPreferences('user123');
            const newPrefs = JSON.parse(JSON.stringify(oldPrefs)); // Deep copy
            newPrefs.channels.email.frequency = EmailFrequency.WEEKLY;

            const changeLog = preferenceManager.trackPreferenceChanges('user123', oldPrefs, newPrefs);

            const frequencyChange = changeLog.changes.find(c => c.field === 'channels.email.frequency');
            expect(frequencyChange).toBeDefined();
            expect(frequencyChange?.oldValue).toBe(EmailFrequency.IMMEDIATE);
            expect(frequencyChange?.newValue).toBe(EmailFrequency.WEEKLY);
        });

        it('should track global settings changes', () => {
            const oldPrefs = preferenceManager.getDefaultPreferences('user123');
            const newPrefs = JSON.parse(JSON.stringify(oldPrefs)); // Deep copy
            newPrefs.globalSettings.doNotDisturb = true;
            newPrefs.globalSettings.maxDailyNotifications = 10;

            const changeLog = preferenceManager.trackPreferenceChanges('user123', oldPrefs, newPrefs);

            const dndChange = changeLog.changes.find(c => c.field === 'globalSettings.doNotDisturb');
            expect(dndChange).toBeDefined();
            expect(dndChange?.newValue).toBe(true);

            const maxChange = changeLog.changes.find(c => c.field === 'globalSettings.maxDailyNotifications');
            expect(maxChange).toBeDefined();
            expect(maxChange?.newValue).toBe(10);
        });

        it('should return empty changes when preferences are identical', () => {
            const prefs = preferenceManager.getDefaultPreferences('user123');
            const changeLog = preferenceManager.trackPreferenceChanges('user123', prefs, prefs);

            expect(changeLog.changes.length).toBe(0);
        });
    });

    // ============================================================================
    // Channel Filtering Tests
    // ============================================================================

    describe('isChannelAllowed', () => {
        it('should allow in-app channel when enabled and type is included', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');

            const allowed = preferenceManager.isChannelAllowed(
                NotificationChannel.IN_APP,
                NotificationType.ALERT,
                preferences
            );

            expect(allowed).toBe(true);
        });

        it('should block in-app channel when disabled', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.inApp.enabled = false;

            const allowed = preferenceManager.isChannelAllowed(
                NotificationChannel.IN_APP,
                NotificationType.ALERT,
                preferences
            );

            expect(allowed).toBe(false);
        });

        it('should block in-app channel when type is not included', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.inApp.types = [NotificationType.ALERT];

            const allowed = preferenceManager.isChannelAllowed(
                NotificationChannel.IN_APP,
                NotificationType.REMINDER,
                preferences
            );

            expect(allowed).toBe(false);
        });

        it('should block push channel when subscription is missing', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.push.enabled = true;
            preferences.channels.push.types = [NotificationType.ALERT];
            // No subscription set

            const allowed = preferenceManager.isChannelAllowed(
                NotificationChannel.PUSH,
                NotificationType.ALERT,
                preferences
            );

            expect(allowed).toBe(false);
        });

        it('should allow push channel when enabled, type included, and subscription exists', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.push.enabled = true;
            preferences.channels.push.types = [NotificationType.ALERT];
            preferences.channels.push.subscription = {
                endpoint: 'https://push.example.com',
                keys: { p256dh: 'key1', auth: 'key2' },
            };

            const allowed = preferenceManager.isChannelAllowed(
                NotificationChannel.PUSH,
                NotificationType.ALERT,
                preferences
            );

            expect(allowed).toBe(true);
        });
    });

    describe('getAllowedChannels', () => {
        it('should return all enabled channels for allowed type', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.push.enabled = true;
            preferences.channels.push.types = [NotificationType.ALERT];
            preferences.channels.push.subscription = {
                endpoint: 'https://push.example.com',
                keys: { p256dh: 'key1', auth: 'key2' },
            };

            const channels = preferenceManager.getAllowedChannels(
                NotificationType.ALERT,
                NotificationPriority.HIGH,
                preferences
            );

            expect(channels).toContain(NotificationChannel.IN_APP);
            expect(channels).toContain(NotificationChannel.EMAIL);
            expect(channels).toContain(NotificationChannel.PUSH);
        });

        it('should return empty array when do not disturb is enabled for non-critical', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.globalSettings.doNotDisturb = true;

            const channels = preferenceManager.getAllowedChannels(
                NotificationType.ALERT,
                NotificationPriority.HIGH,
                preferences
            );

            expect(channels).toEqual([]);
        });

        it('should return channels for critical notifications even with do not disturb', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.globalSettings.doNotDisturb = true;

            const channels = preferenceManager.getAllowedChannels(
                NotificationType.ALERT,
                NotificationPriority.CRITICAL,
                preferences
            );

            expect(channels.length).toBeGreaterThan(0);
        });

        it('should default to in-app when no channels are enabled', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.enabled = false;
            preferences.channels.push.enabled = false;

            const channels = preferenceManager.getAllowedChannels(
                NotificationType.REMINDER,
                NotificationPriority.LOW,
                preferences
            );

            expect(channels).toContain(NotificationChannel.IN_APP);
        });
    });

    describe('filterChannelsByPreferences', () => {
        const createTestNotification = (
            channels: NotificationChannel[],
            type: NotificationType,
            priority: NotificationPriority
        ): Notification => ({
            id: 'notif123',
            userId: 'user123',
            type,
            priority,
            title: 'Test',
            content: 'Test content',
            channels,
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        it('should allow all channels when preferences permit', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            const notification = createTestNotification(
                [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                NotificationType.ALERT,
                NotificationPriority.HIGH
            );

            const result = preferenceManager.filterChannelsByPreferences(notification, preferences);

            expect(result.allowedChannels).toContain(NotificationChannel.IN_APP);
            expect(result.allowedChannels).toContain(NotificationChannel.EMAIL);
            expect(result.blockedChannels).toEqual([]);
        });

        it('should block all channels when do not disturb is enabled for non-critical', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.globalSettings.doNotDisturb = true;

            const notification = createTestNotification(
                [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                NotificationType.ALERT,
                NotificationPriority.HIGH
            );

            const result = preferenceManager.filterChannelsByPreferences(notification, preferences);

            expect(result.allowedChannels).toEqual([]);
            expect(result.blockedChannels.length).toBe(2);
            expect(result.reason).toContain('Do Not Disturb');
        });

        it('should allow critical notifications even with do not disturb', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.globalSettings.doNotDisturb = true;

            const notification = createTestNotification(
                [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                NotificationType.ALERT,
                NotificationPriority.CRITICAL
            );

            const result = preferenceManager.filterChannelsByPreferences(notification, preferences);

            expect(result.allowedChannels.length).toBeGreaterThan(0);
        });

        it('should block channels not enabled for notification type', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.types = [NotificationType.ALERT];

            const notification = createTestNotification(
                [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                NotificationType.REMINDER,
                NotificationPriority.MEDIUM
            );

            const result = preferenceManager.filterChannelsByPreferences(notification, preferences);

            expect(result.allowedChannels).toContain(NotificationChannel.IN_APP);
            expect(result.blockedChannels).toContain(NotificationChannel.EMAIL);
        });
    });

    // ============================================================================
    // Quiet Hours Tests
    // ============================================================================

    describe('isWithinQuietHours', () => {
        it('should return false when quiet hours are not enabled', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');

            const isQuiet = preferenceManager.isWithinQuietHours(preferences);

            expect(isQuiet).toBe(false);
        });

        it('should return true when current time is within quiet hours', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 23:00 (11 PM)
            const testTime = new Date();
            testTime.setHours(23, 0, 0, 0);

            const isQuiet = preferenceManager.isWithinQuietHours(preferences, testTime);

            expect(isQuiet).toBe(true);
        });

        it('should return false when current time is outside quiet hours', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 12:00 (noon)
            const testTime = new Date();
            testTime.setHours(12, 0, 0, 0);

            const isQuiet = preferenceManager.isWithinQuietHours(preferences, testTime);

            expect(isQuiet).toBe(false);
        });

        it('should handle quiet hours that span midnight', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 02:00 (2 AM - after midnight)
            const testTime = new Date();
            testTime.setHours(2, 0, 0, 0);

            const isQuiet = preferenceManager.isWithinQuietHours(preferences, testTime);

            expect(isQuiet).toBe(true);
        });
    });

    describe('shouldSendEmailNow', () => {
        it('should return true for critical notifications regardless of quiet hours', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 23:00 (within quiet hours)
            const testTime = new Date();
            testTime.setHours(23, 0, 0, 0);

            const shouldSend = preferenceManager.shouldSendEmailNow(
                preferences,
                NotificationPriority.CRITICAL,
                testTime
            );

            expect(shouldSend).toBe(true);
        });

        it('should return false for non-critical notifications during quiet hours', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 23:00 (within quiet hours)
            const testTime = new Date();
            testTime.setHours(23, 0, 0, 0);

            const shouldSend = preferenceManager.shouldSendEmailNow(
                preferences,
                NotificationPriority.HIGH,
                testTime
            );

            expect(shouldSend).toBe(false);
        });

        it('should return true outside quiet hours', () => {
            const preferences = preferenceManager.getDefaultPreferences('user123');
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            };

            // Test at 12:00 (outside quiet hours)
            const testTime = new Date();
            testTime.setHours(12, 0, 0, 0);

            const shouldSend = preferenceManager.shouldSendEmailNow(
                preferences,
                NotificationPriority.MEDIUM,
                testTime
            );

            expect(shouldSend).toBe(true);
        });
    });
});
