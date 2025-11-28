/**
 * Email Channel Handler Tests
 * 
 * Tests email notification delivery, template management, and digest generation.
 * Validates Requirements: 4.1, 4.2, 4.4
 */

import {
    Notification,
    NotificationPreferences,
    NotificationRecipient,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
    EmailFrequency,
} from "../../types";
import { EmailChannelHandler } from "../email-channel-handler";

describe('EmailChannelHandler', () => {
    let handler: EmailChannelHandler;

    beforeEach(() => {
        handler = new EmailChannelHandler();
    });

    describe('Basic Email Delivery', () => {
        it('should handle email notifications', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Alert',
                content: 'This is a test alert',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: { enabled: false, types: [] },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: false },
                updatedAt: new Date().toISOString(),
            };

            expect(handler.canHandle(notification, preferences)).toBe(true);
        });

        it('should format email content with HTML and text', async () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ANNOUNCEMENT,
                priority: NotificationPriority.MEDIUM,
                title: 'New Feature',
                content: 'We have launched a new feature!',
                actionUrl: 'https://app.example.com/features',
                actionText: 'Learn More',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const formatted = await handler.formatContent(notification);

            expect(formatted.subject).toContain('New Feature');
            expect(formatted.body).toContain('We have launched a new feature!');
            expect(formatted.html).toContain('New Feature');
            expect(formatted.html).toContain('We have launched a new feature!');
            expect(formatted.html).toContain('Learn More');
            expect(formatted.html).toContain('https://app.example.com/features');
        });

        it('should add URGENT prefix for critical notifications', async () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: 'System Down',
                content: 'Critical system failure',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const formatted = await handler.formatContent(notification);

            expect(formatted.subject).toContain('[URGENT]');
            expect(formatted.subject).toContain('System Down');
        });
    });

    describe('Digest Email Generation', () => {
        it('should handle empty notification list in digest', async () => {
            const recipient: NotificationRecipient = {
                userId: 'user-1',
                email: 'test@example.com',
                preferences: {
                    userId: 'user-1',
                    channels: {
                        inApp: { enabled: false, types: [] },
                        email: {
                            enabled: true,
                            types: [],
                            frequency: EmailFrequency.DAILY,
                        },
                        push: { enabled: false, types: [] },
                    },
                    globalSettings: { doNotDisturb: false },
                    updatedAt: new Date().toISOString(),
                },
            };

            const result = await handler.sendDigestEmail(
                [],
                recipient,
                EmailFrequency.DAILY
            );

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
            expect(result.reason).toContain('No notifications');
        });
    });







    describe('Channel Handling', () => {
        it('should not handle when email channel is disabled', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Alert',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: { enabled: false, types: [] },
                    email: {
                        enabled: false, // Disabled
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: false },
                updatedAt: new Date().toISOString(),
            };

            expect(handler.canHandle(notification, preferences)).toBe(false);
        });

        it('should not handle when notification type is not allowed', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ANNOUNCEMENT,
                priority: NotificationPriority.MEDIUM,
                title: 'Test Announcement',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: { enabled: false, types: [] },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT], // Only alerts allowed
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: false },
                updatedAt: new Date().toISOString(),
            };

            expect(handler.canHandle(notification, preferences)).toBe(false);
        });

        it('should allow critical notifications in DND mode', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: 'Critical Alert',
                content: 'This is critical',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: { enabled: false, types: [] },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: true }, // DND enabled
                updatedAt: new Date().toISOString(),
            };

            expect(handler.canHandle(notification, preferences)).toBe(true);
        });

        it('should block non-critical notifications in DND mode', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: 'Test Alert',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: { enabled: false, types: [] },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: true }, // DND enabled
                updatedAt: new Date().toISOString(),
            };

            expect(handler.canHandle(notification, preferences)).toBe(false);
        });
    });
});
