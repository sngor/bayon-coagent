/**
 * Channel Integration Tests
 * 
 * Tests the integration of channel handlers with the notification system.
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
import { ChannelRegistry } from "../channel-registry";
import { InAppChannelHandler } from "../in-app-channel-handler";
import { EmailChannelHandler } from "../email-channel-handler";
import { PushChannelHandler } from "../push-channel-handler";

describe('Channel Integration', () => {
    let registry: ChannelRegistry;
    let inAppHandler: InAppChannelHandler;
    let emailHandler: EmailChannelHandler;
    let pushHandler: PushChannelHandler;

    beforeEach(() => {
        registry = new ChannelRegistry();
        inAppHandler = new InAppChannelHandler();
        emailHandler = new EmailChannelHandler();
        pushHandler = new PushChannelHandler();
    });

    describe('Channel Registry', () => {
        it('should register channel handlers', () => {
            registry.register(inAppHandler);
            registry.register(emailHandler);
            registry.register(pushHandler);

            expect(registry.getHandlerCount()).toBe(3);
            expect(registry.hasHandler(NotificationChannel.IN_APP)).toBe(true);
            expect(registry.hasHandler(NotificationChannel.EMAIL)).toBe(true);
            expect(registry.hasHandler(NotificationChannel.PUSH)).toBe(true);
        });

        it('should get handler by channel', () => {
            registry.register(inAppHandler);

            const handler = registry.getHandler(NotificationChannel.IN_APP);
            expect(handler).toBe(inAppHandler);
        });

        it('should get capable handlers for notification', () => {
            registry.register(inAppHandler);
            registry.register(emailHandler);

            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            const capableHandlers = registry.getCapableHandlers(notification, preferences);
            expect(capableHandlers).toHaveLength(2);
            expect(capableHandlers.map(h => h.channel)).toContain(NotificationChannel.IN_APP);
            expect(capableHandlers.map(h => h.channel)).toContain(NotificationChannel.EMAIL);
        });
    });

    describe('In-App Channel Handler', () => {
        it('should handle in-app notifications', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(inAppHandler.canHandle(notification, preferences)).toBe(true);
        });

        it('should format content for in-app display', async () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'This is a test notification with some content that might be long',
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const formatted = await inAppHandler.formatContent(notification);

            expect(formatted.subject).toBe('Test Notification');
            expect(formatted.body).toBeTruthy();
            expect(formatted.data).toHaveProperty('id', 'test-1');
            expect(formatted.data).toHaveProperty('type', NotificationType.ALERT);
        });
    });

    describe('Email Channel Handler', () => {
        it('should handle email notifications', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(emailHandler.canHandle(notification, preferences)).toBe(true);
        });

        it('should format content for email', async () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const formatted = await emailHandler.formatContent(notification);

            expect(formatted.subject).toContain('Test Notification');
            expect(formatted.body).toBeTruthy();
            expect(formatted.html).toBeTruthy();
            expect(formatted.html).toContain('Test Notification');
            expect(formatted.html).toContain('Test content');
        });

        it('should respect quiet hours', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.IMMEDIATE,
                        quietHours: {
                            enabled: true,
                            startTime: '00:00',
                            endTime: '23:59',
                            timezone: 'UTC',
                        },
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            // Should still be able to handle, but delivery will be queued
            expect(emailHandler.canHandle(notification, preferences)).toBe(true);
        });
    });

    describe('Push Channel Handler', () => {
        it('should handle push notifications', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.PUSH],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        subscription: {
                            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                            keys: {
                                p256dh: 'test-key',
                                auth: 'test-auth',
                            },
                        },
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(pushHandler.canHandle(notification, preferences)).toBe(true);
        });

        it('should not handle push without subscription', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.PUSH],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: false,
                        types: [],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        // No subscription
                    },
                },
                globalSettings: {
                    doNotDisturb: false,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(pushHandler.canHandle(notification, preferences)).toBe(false);
        });

        it('should format content for push', async () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'Test content for push notification',
                channels: [NotificationChannel.PUSH],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const formatted = await pushHandler.formatContent(notification);

            expect(formatted.subject).toBe('Test Notification');
            expect(formatted.body).toBe('Test content for push notification');
            expect(formatted.data).toHaveProperty('notificationId', 'test-1');
        });
    });

    describe('Do Not Disturb Mode', () => {
        it('should block non-critical notifications in DND mode', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: 'Test Notification',
                content: 'Test content',
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: true,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(inAppHandler.canHandle(notification, preferences)).toBe(false);
        });

        it('should allow critical notifications in DND mode', () => {
            const notification: Notification = {
                id: 'test-1',
                userId: 'user-1',
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: 'Critical Alert',
                content: 'This is critical',
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const preferences: NotificationPreferences = {
                userId: 'user-1',
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: true,
                },
                updatedAt: new Date().toISOString(),
            };

            expect(inAppHandler.canHandle(notification, preferences)).toBe(true);
        });
    });
});
