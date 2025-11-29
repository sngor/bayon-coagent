/**
 * Notification Repository Tests
 * 
 * Tests for the NotificationRepository implementation
 * Validates Requirements: 1.1, 1.4
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { NotificationRepository } from '../repository';
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
    DeliveryStatus,
    EmailFrequency,
} from '../types';

// Mock window to simulate server-side environment
Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
});

// Mock data store
const mockData = new Map<string, any>();

// Mock the DynamoDB repository
jest.mock('@/aws/dynamodb/repository', () => {
    return {
        DynamoDBRepository: jest.fn().mockImplementation(() => ({
            create: jest.fn(async (pk: string, sk: string, entityType: string, data: any) => {
                const key = `${pk}#${sk}`;
                mockData.set(key, { PK: pk, SK: sk, EntityType: entityType, Data: data });
                return { PK: pk, SK: sk, EntityType: entityType, Data: data };
            }),
            get: jest.fn(async (pk: string, sk: string) => {
                const key = `${pk}#${sk}`;
                const item = mockData.get(key);
                return item ? item.Data : null;
            }),
            query: jest.fn(async (pk: string, skPrefix: string, options: any) => {
                const items: any[] = [];
                mockData.forEach((value, key) => {
                    if (key.startsWith(`${pk}#${skPrefix}`)) {
                        items.push(value.Data);
                    }
                });
                return { items, count: items.length };
            }),
            update: jest.fn(async (pk: string, sk: string, updates: any) => {
                const key = `${pk}#${sk}`;
                const item = mockData.get(key);
                if (item) {
                    item.Data = { ...item.Data, ...updates };
                    mockData.set(key, item);
                }
            }),
            delete: jest.fn(async (pk: string, sk: string) => {
                const key = `${pk}#${sk}`;
                mockData.delete(key);
            }),
            put: jest.fn(async (item: any) => {
                const key = `${item.PK}#${item.SK}`;
                mockData.set(key, item);
            }),
            scan: jest.fn(async (options: any) => {
                const items: any[] = [];
                mockData.forEach((value) => {
                    items.push(value.Data);
                });
                return { items, count: items.length };
            }),
        })),
    };
});

describe('NotificationRepository', () => {
    let repository: NotificationRepository;

    beforeEach(() => {
        mockData.clear();
        repository = new NotificationRepository();
    });

    describe('Notification Operations', () => {
        test('should create a notification with all required fields', async () => {
            const notification = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Test Notification',
                content: 'This is a test notification',
                channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            });

            expect(notification).toBeDefined();
            expect(notification.id).toBeDefined();
            expect(notification.userId).toBe('user123');
            expect(notification.type).toBe(NotificationType.ALERT);
            expect(notification.priority).toBe(NotificationPriority.HIGH);
            expect(notification.title).toBe('Test Notification');
            expect(notification.content).toBe('This is a test notification');
            expect(notification.channels).toEqual([NotificationChannel.IN_APP, NotificationChannel.EMAIL]);
            expect(notification.status).toBe(NotificationStatus.PENDING);
            expect(notification.createdAt).toBeDefined();
            expect(notification.updatedAt).toBeDefined();
        });

        test('should retrieve a notification by ID', async () => {
            const created = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.REMINDER,
                priority: NotificationPriority.MEDIUM,
                title: 'Reminder',
                content: 'Test reminder',
            });

            const retrieved = await repository.getNotification(created.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.title).toBe('Reminder');
        });

        test('should mark notification as read', async () => {
            const notification = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.SYSTEM,
                priority: NotificationPriority.LOW,
                title: 'System Update',
                content: 'System maintenance scheduled',
            });

            await repository.markAsRead(notification.id);

            const updated = await repository.getNotification(notification.id);
            expect(updated?.status).toBe(NotificationStatus.READ);
            expect(updated?.readAt).toBeDefined();
        });

        test('should dismiss notification', async () => {
            const notification = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.ANNOUNCEMENT,
                priority: NotificationPriority.LOW,
                title: 'Announcement',
                content: 'New feature available',
            });

            await repository.dismissNotification(notification.id);

            const updated = await repository.getNotification(notification.id);
            expect(updated?.status).toBe(NotificationStatus.DISMISSED);
            expect(updated?.dismissedAt).toBeDefined();
        });
    });

    describe('User Preferences Operations', () => {
        test('should return default preferences for new user', async () => {
            const preferences = await repository.getUserPreferences('newuser123');

            expect(preferences).toBeDefined();
            expect(preferences.userId).toBe('newuser123');
            expect(preferences.channels.inApp.enabled).toBe(true);
            expect(preferences.channels.email.enabled).toBe(true);
            expect(preferences.channels.push.enabled).toBe(false);
            expect(preferences.globalSettings.doNotDisturb).toBe(false);
        });

        test('should update user preferences', async () => {
            await repository.updateUserPreferences('user123', {
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: false,
                        types: [],
                        frequency: EmailFrequency.DAILY,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
                globalSettings: {
                    doNotDisturb: true,
                },
            });

            const preferences = await repository.getUserPreferences('user123');
            expect(preferences.channels.inApp.types).toEqual([NotificationType.ALERT]);
            expect(preferences.channels.email.enabled).toBe(false);
            expect(preferences.globalSettings.doNotDisturb).toBe(true);
        });
    });

    describe('Delivery Tracking Operations', () => {
        test('should create a delivery record', async () => {
            const record = await repository.createDeliveryRecord({
                notificationId: 'notif123',
                userId: 'user123',
                channel: NotificationChannel.EMAIL,
                status: DeliveryStatus.PENDING,
                attempts: 0,
                lastAttemptAt: new Date().toISOString(),
            });

            expect(record).toBeDefined();
            expect(record.id).toBeDefined();
            expect(record.notificationId).toBe('notif123');
            expect(record.userId).toBe('user123');
            expect(record.channel).toBe(NotificationChannel.EMAIL);
            expect(record.status).toBe(DeliveryStatus.PENDING);
            expect(record.attempts).toBe(0);
            expect(record.lastAttemptAt).toBeDefined();
        });

        test('should get delivery records for a notification', async () => {
            await repository.createDeliveryRecord({
                notificationId: 'notif456',
                userId: 'user123',
                channel: NotificationChannel.EMAIL,
                status: DeliveryStatus.SENT,
                attempts: 1,
                lastAttemptAt: new Date().toISOString(),
            });

            await repository.createDeliveryRecord({
                notificationId: 'notif456',
                userId: 'user123',
                channel: NotificationChannel.PUSH,
                status: DeliveryStatus.DELIVERED,
                attempts: 1,
                lastAttemptAt: new Date().toISOString(),
            });

            const records = await repository.getDeliveryRecords('notif456');
            expect(records).toHaveLength(2);
            expect(records.some(r => r.channel === NotificationChannel.EMAIL)).toBe(true);
            expect(records.some(r => r.channel === NotificationChannel.PUSH)).toBe(true);
        });

        test('should update delivery record', async () => {
            const record = await repository.createDeliveryRecord({
                notificationId: 'notif789',
                userId: 'user123',
                channel: NotificationChannel.EMAIL,
                status: DeliveryStatus.PENDING,
                attempts: 0,
                lastAttemptAt: new Date().toISOString(),
            });

            await repository.updateDeliveryRecord(
                'user123',
                'notif789',
                NotificationChannel.EMAIL,
                {
                    status: DeliveryStatus.DELIVERED,
                    attempts: 1,
                    deliveredAt: new Date().toISOString(),
                }
            );

            const records = await repository.getDeliveryRecords('notif789');
            const emailRecord = records.find(r => r.channel === NotificationChannel.EMAIL);
            expect(emailRecord?.status).toBe(DeliveryStatus.DELIVERED);
            expect(emailRecord?.attempts).toBe(1);
            expect(emailRecord?.deliveredAt).toBeDefined();
        });
    });

    describe('Channel Determination', () => {
        test('should determine channels from preferences', async () => {
            // Set up preferences
            await repository.updateUserPreferences('user123', {
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT, NotificationType.REMINDER],
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
            });

            // Create notification without specifying channels
            const notification = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: 'Alert',
                content: 'Important alert',
            });

            // Should have both in-app and email based on preferences
            expect(notification.channels).toContain(NotificationChannel.IN_APP);
            expect(notification.channels).toContain(NotificationChannel.EMAIL);
            expect(notification.channels).not.toContain(NotificationChannel.PUSH);
        });

        test('should use all channels for critical notifications', async () => {
            // Set up preferences with some channels disabled
            await repository.updateUserPreferences('user123', {
                channels: {
                    inApp: {
                        enabled: true,
                        types: [],
                    },
                    email: {
                        enabled: true,
                        types: [],
                        frequency: EmailFrequency.IMMEDIATE,
                    },
                    push: {
                        enabled: false,
                        types: [],
                    },
                },
            });

            // Create critical notification
            const notification = await repository.createNotification({
                userId: 'user123',
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: 'Critical Alert',
                content: 'System critical issue',
            });

            // Critical notifications should use all available channels
            expect(notification.channels).toContain(NotificationChannel.IN_APP);
            expect(notification.channels).toContain(NotificationChannel.EMAIL);
        });
    });
});
