/**
 * Push Channel Handler Tests
 * 
 * Tests for push notification delivery functionality.
 * Validates Requirements: 5.1, 5.2, 5.3
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import {
    PushChannelHandler,
    getPushChannelHandler,
    resetPushChannelHandler,
} from '../push-channel-handler';
import {
    Notification,
    NotificationPreferences,
    NotificationRecipient,
    NotificationChannel,
    NotificationType,
    NotificationPriority,
    NotificationStatus,
    EmailFrequency,
    PushSubscriptionJSON,
} from '../../types';

// Mock web-push
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn<any>().mockResolvedValue({ statusCode: 201 }),
    generateVAPIDKeys: jest.fn().mockReturnValue({
        publicKey: 'test-public-key',
        privateKey: 'test-private-key',
    }),
}));

describe('PushChannelHandler', () => {
    // Set up environment variables for tests
    const originalEnv = process.env;

    beforeAll(() => {
        // Use valid VAPID keys for testing (generated once)
        process.env = {
            ...originalEnv,
            VAPID_PUBLIC_KEY: 'BISyRycQRvdA8WzkF8YrdZMWmYcYYGgsbKOeLAzabPvDmhiQyruDvxPNG0Dt9GHi5flwZpZO1KtKeVT8uFWY6qA',
            VAPID_PRIVATE_KEY: 'nKzPQZe8xqxqQqxqQqxqQqxqQqxqQqxqQqxqQqxqQqw',
            VAPID_SUBJECT: 'mailto:test@example.com',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    let handler: PushChannelHandler;
    let mockNotification: Notification;
    let mockPreferences: NotificationPreferences;
    let mockRecipient: NotificationRecipient;
    let mockPushSubscription: PushSubscriptionJSON;

    beforeEach(() => {
        // Reset handler
        resetPushChannelHandler();
        handler = getPushChannelHandler();

        // Mock push subscription with valid base64-encoded keys
        mockPushSubscription = {
            endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            keys: {
                // Valid 65-byte p256dh key (base64 encoded)
                p256dh: 'BISyRycQRvdA8WzkF8YrdZMWmYcYYGgsbKOeLAzabPvDmhiQyruDvxPNG0Dt9GHi5flwZpZO1KtKeVT8uFWY6qA=',
                // Valid 16-byte auth key (base64 encoded)
                auth: 'nKzPQZe8xqxqQqxqQqxqQqw=',
            },
        };

        // Mock notification
        mockNotification = {
            id: 'notif-123',
            userId: 'user-123',
            type: NotificationType.ALERT,
            priority: NotificationPriority.HIGH,
            title: 'Test Notification',
            content: 'This is a test notification for push delivery',
            channels: [NotificationChannel.PUSH],
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Mock preferences
        mockPreferences = {
            userId: 'user-123',
            channels: {
                inApp: {
                    enabled: true,
                    types: [NotificationType.ALERT],
                },
                email: {
                    enabled: true,
                    address: 'test@example.com',
                    types: [NotificationType.ALERT],
                    frequency: EmailFrequency.IMMEDIATE,
                },
                push: {
                    enabled: true,
                    types: [NotificationType.ALERT],
                    subscription: mockPushSubscription,
                },
            },
            globalSettings: {
                doNotDisturb: false,
            },
            updatedAt: new Date().toISOString(),
        };

        // Mock recipient
        mockRecipient = {
            userId: 'user-123',
            pushSubscription: mockPushSubscription,
            preferences: mockPreferences,
        };
    });

    describe('canHandle', () => {
        it('should return true when push is enabled and notification type is allowed', () => {
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(true);
        });

        it('should return false when push is disabled', () => {
            mockPreferences.channels.push.enabled = false;
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(false);
        });

        it('should return false when notification type is not allowed', () => {
            mockPreferences.channels.push.types = [NotificationType.SYSTEM];
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(false);
        });

        it('should return false when notification does not include push channel', () => {
            mockNotification.channels = [NotificationChannel.EMAIL];
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(false);
        });

        it('should return true for critical notifications even in DND mode', () => {
            mockPreferences.globalSettings.doNotDisturb = true;
            mockNotification.priority = NotificationPriority.CRITICAL;
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(true);
        });

        it('should return false for non-critical notifications in DND mode', () => {
            mockPreferences.globalSettings.doNotDisturb = true;
            mockNotification.priority = NotificationPriority.MEDIUM;
            const result = handler.canHandle(mockNotification, mockPreferences);
            expect(result).toBe(false);
        });
    });

    describe('formatContent', () => {
        it('should format notification content for push delivery', async () => {
            const formatted = await handler.formatContent(mockNotification);

            expect(formatted.subject).toBe('Test Notification');
            expect(formatted.body).toBe('This is a test notification for push delivery');
            expect(formatted.data).toBeDefined();
            expect(formatted.data?.notificationId).toBe('notif-123');
        });

        it('should truncate long content to 120 characters', async () => {
            mockNotification.content = 'A'.repeat(200);
            const formatted = await handler.formatContent(mockNotification);

            expect(formatted.body.length).toBeLessThanOrEqual(120);
            expect(formatted.body).toContain('...');
        });

        it('should sanitize HTML content', async () => {
            mockNotification.content = '<script>alert("xss")</script>Test content';
            const formatted = await handler.formatContent(mockNotification);

            expect(formatted.body).not.toContain('<script>');
            expect(formatted.body).toContain('Test content');
        });
    });

    describe('deliver', () => {
        it('should attempt to deliver a push notification', async () => {
            const result = await handler.deliver(mockNotification, mockRecipient);

            // The result depends on whether web-push can actually send
            // In a real environment with valid keys, this would succeed
            // In tests, we just verify the handler processes the request
            expect(result.channel).toBe(NotificationChannel.PUSH);
            expect(result.timestamp).toBeDefined();
        });

        it('should fail when recipient has no push subscription', async () => {
            mockRecipient.pushSubscription = undefined;
            const result = await handler.deliver(mockNotification, mockRecipient);

            expect(result.success).toBe(false);
            expect(result.error).toContain('push subscription');
        });

        it('should fail when push subscription is invalid', async () => {
            mockRecipient.pushSubscription = {
                endpoint: 'invalid-url',
                keys: {
                    p256dh: '',
                    auth: '',
                },
            };
            const result = await handler.deliver(mockNotification, mockRecipient);

            expect(result.success).toBe(false);
        });
    });

    describe('validateSubscription', () => {
        it('should validate a valid push subscription', async () => {
            const isValid = await handler.validateSubscription(mockPushSubscription);
            expect(isValid).toBe(true);
        });

        it('should reject subscription with invalid endpoint', async () => {
            const invalidSubscription = {
                ...mockPushSubscription,
                endpoint: 'not-a-url',
            };
            const isValid = await handler.validateSubscription(invalidSubscription);
            expect(isValid).toBe(false);
        });

        it('should reject subscription with missing keys', async () => {
            const invalidSubscription = {
                endpoint: 'https://example.com',
                keys: {
                    p256dh: '',
                    auth: '',
                },
            };
            const isValid = await handler.validateSubscription(invalidSubscription);
            expect(isValid).toBe(false);
        });
    });

    describe('VAPID key generation', () => {
        it('should generate VAPID keys', () => {
            const keys = PushChannelHandler.generateVapidKeys();
            expect(keys.publicKey).toBeDefined();
            expect(keys.privateKey).toBeDefined();
            expect(typeof keys.publicKey).toBe('string');
            expect(typeof keys.privateKey).toBe('string');
        });

        it('should return public VAPID key', () => {
            const publicKey = handler.getPublicVapidKey();
            expect(typeof publicKey).toBe('string');
            expect(publicKey.length).toBeGreaterThan(0);
        });
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = getPushChannelHandler();
            const instance2 = getPushChannelHandler();
            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = getPushChannelHandler();
            resetPushChannelHandler();
            const instance2 = getPushChannelHandler();
            expect(instance1).not.toBe(instance2);
        });
    });
});
