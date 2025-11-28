/**
 * Notification Actions Tests
 * 
 * Tests for notification server actions
 * Validates Requirements: 7.1, 7.3, 6.3, 6.4
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the auth module
const mockGetCurrentUserServer = jest.fn();
jest.mock('@/aws/auth/server-auth', () => ({
    getCurrentUserServer: mockGetCurrentUserServer,
}));

// Mock the notification service
const mockGetNotificationService = jest.fn();
jest.mock('@/lib/notifications/service', () => ({
    getNotificationService: mockGetNotificationService,
}));

// Mock the notification repository
const mockGetNotificationRepository = jest.fn();
jest.mock('@/lib/notifications/repository', () => ({
    getNotificationRepository: mockGetNotificationRepository,
}));

// Mock the DynamoDB repository
const mockGetRepository = jest.fn();
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: mockGetRepository,
}));

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getNotificationService } from '@/lib/notifications/service';
import { getNotificationRepository } from '@/lib/notifications/repository';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    createNotificationAction,
    markAsReadAction,
    dismissNotificationAction,
    updateNotificationPreferencesAction,
    getUserPreferencesAction,
    sendTestNotificationAction,
    bulkCreateNotificationsAction,
    getNotificationHistoryAction,
    getNotificationMetricsAction,
    retryFailedNotificationsAction,
    getRateLimitStatusAction,
} from '@/app/notification-actions';
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
} from '@/lib/notifications/types';

describe('Notification Actions', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockNotification = {
        id: 'notif-123',
        userId: 'user-123',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        title: 'Test Notification',
        content: 'Test content',
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotificationAction', () => {
        it('should create a notification successfully', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock service
            const mockService = {
                createNotification: jest.fn().mockResolvedValue(mockNotification),
                sendNotification: jest.fn().mockResolvedValue({ success: true }),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Create form data
            const formData = new FormData();
            formData.append('type', NotificationType.SYSTEM);
            formData.append('priority', NotificationPriority.MEDIUM);
            formData.append('title', 'Test Notification');
            formData.append('content', 'Test content');

            // Call action
            const result = await createNotificationAction({}, formData);

            // Verify
            expect(result.message).toBe('Notification created successfully');
            expect(result.data).toEqual(mockNotification);
            expect(mockService.createNotification).toHaveBeenCalled();
            expect(mockService.sendNotification).toHaveBeenCalledWith(mockNotification.id);
        });

        it('should return error when not authenticated', async () => {
            // Mock auth failure
            (getCurrentUserServer as jest.Mock).mockResolvedValue(null);

            // Create form data
            const formData = new FormData();
            formData.append('type', NotificationType.SYSTEM);
            formData.append('priority', NotificationPriority.MEDIUM);
            formData.append('title', 'Test Notification');
            formData.append('content', 'Test content');

            // Call action
            const result = await createNotificationAction({}, formData);

            // Verify
            expect(result.message).toBe('Authentication required');
            expect(result.data).toBeNull();
        });

        it('should validate required fields', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Create form data with missing fields
            const formData = new FormData();
            formData.append('type', NotificationType.SYSTEM);
            // Missing priority, title, content

            // Call action
            const result = await createNotificationAction({}, formData);

            // Verify
            expect(result.message).toBe('Validation failed');
            expect(result.data).toBeNull();
            expect(result.errors).toBeDefined();
        });
    });

    describe('markAsReadAction', () => {
        it('should mark notification as read', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock repository
            const mockRepository = {
                markAsRead: jest.fn().mockResolvedValue(undefined),
            };
            (getNotificationRepository as jest.Mock).mockReturnValue(mockRepository);

            // Create form data
            const formData = new FormData();
            formData.append('notificationId', 'notif-123');

            // Call action
            const result = await markAsReadAction({}, formData);

            // Verify
            expect(result.message).toBe('Notification marked as read');
            expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-123');
        });
    });

    describe('dismissNotificationAction', () => {
        it('should dismiss notification', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock repository
            const mockRepository = {
                dismissNotification: jest.fn().mockResolvedValue(undefined),
            };
            (getNotificationRepository as jest.Mock).mockReturnValue(mockRepository);

            // Create form data
            const formData = new FormData();
            formData.append('notificationId', 'notif-123');

            // Call action
            const result = await dismissNotificationAction({}, formData);

            // Verify
            expect(result.message).toBe('Notification dismissed');
            expect(mockRepository.dismissNotification).toHaveBeenCalledWith('notif-123');
        });
    });

    describe('getUserPreferencesAction', () => {
        it('should get user preferences', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock service
            const mockPreferences = {
                userId: 'user-123',
                channels: {
                    inApp: { enabled: true, types: [] },
                    email: { enabled: true, types: [], frequency: 'immediate' as const },
                    push: { enabled: false, types: [] },
                },
                globalSettings: { doNotDisturb: false },
                updatedAt: new Date().toISOString(),
            };
            const mockService = {
                getUserPreferences: jest.fn().mockResolvedValue(mockPreferences),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Call action
            const result = await getUserPreferencesAction();

            // Verify
            expect(result.message).toBe('success');
            expect(result.data).toEqual(mockPreferences);
        });
    });

    describe('sendTestNotificationAction', () => {
        it('should send test notification', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock service
            const mockService = {
                createNotification: jest.fn().mockResolvedValue(mockNotification),
                sendNotification: jest.fn().mockResolvedValue({ success: true }),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Create form data
            const formData = new FormData();

            // Call action
            const result = await sendTestNotificationAction({}, formData);

            // Verify
            expect(result.message).toBe('Test notification sent successfully');
            expect(mockService.createNotification).toHaveBeenCalled();
            expect(mockService.sendNotification).toHaveBeenCalled();
        });
    });

    describe('bulkCreateNotificationsAction', () => {
        it('should create notifications in bulk for admin', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock admin check
            const mockDbRepository = {
                get: jest.fn().mockResolvedValue({
                    Data: { role: 'admin' },
                }),
            };
            (getRepository as jest.Mock).mockReturnValue(mockDbRepository);

            // Mock service
            const mockService = {
                createNotification: jest.fn().mockResolvedValue(mockNotification),
                batchNotifications: jest.fn().mockResolvedValue({
                    total: 2,
                    successful: 2,
                    failed: 0,
                    results: [],
                }),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Create form data
            const formData = new FormData();
            formData.append('notifications', JSON.stringify({
                notifications: [
                    {
                        userId: 'user-123',
                        type: NotificationType.SYSTEM,
                        priority: NotificationPriority.MEDIUM,
                        title: 'Test 1',
                        content: 'Content 1',
                    },
                    {
                        userId: 'user-456',
                        type: NotificationType.ALERT,
                        priority: NotificationPriority.HIGH,
                        title: 'Test 2',
                        content: 'Content 2',
                    },
                ],
            }));

            // Call action
            const result = await bulkCreateNotificationsAction({}, formData);

            // Verify
            expect(result.message).toContain('2 successful');
            expect(mockService.createNotification).toHaveBeenCalledTimes(2);
        });

        it('should reject non-admin users', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock non-admin check
            const mockDbRepository = {
                get: jest.fn().mockResolvedValue({
                    Data: { role: 'user' },
                }),
            };
            (getRepository as jest.Mock).mockReturnValue(mockDbRepository);

            // Create form data
            const formData = new FormData();
            formData.append('notifications', JSON.stringify({
                notifications: [
                    {
                        userId: 'user-123',
                        type: NotificationType.SYSTEM,
                        priority: NotificationPriority.MEDIUM,
                        title: 'Test',
                        content: 'Content',
                    },
                ],
            }));

            // Call action
            const result = await bulkCreateNotificationsAction({}, formData);

            // Verify
            expect(result.message).toBe('Admin access required');
            expect(result.data).toBeNull();
        });
    });

    describe('getNotificationMetricsAction', () => {
        it('should get metrics for admin', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock admin check
            const mockDbRepository = {
                get: jest.fn().mockResolvedValue({
                    Data: { role: 'admin' },
                }),
            };
            (getRepository as jest.Mock).mockReturnValue(mockDbRepository);

            // Mock service
            const mockMetrics = {
                timeRange: {
                    startDate: '2024-01-01T00:00:00Z',
                    endDate: '2024-01-31T23:59:59Z',
                },
                totalNotifications: 100,
                deliveryRates: {},
                averageDeliveryTime: {},
                failureReasons: [],
            };
            const mockService = {
                getMetrics: jest.fn().mockResolvedValue(mockMetrics),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Create form data
            const formData = new FormData();
            formData.append('startDate', '2024-01-01T00:00:00Z');
            formData.append('endDate', '2024-01-31T23:59:59Z');

            // Call action
            const result = await getNotificationMetricsAction({}, formData);

            // Verify
            expect(result.message).toBe('success');
            expect(result.data).toEqual(mockMetrics);
        });
    });

    describe('retryFailedNotificationsAction', () => {
        it('should retry failed notifications for admin', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock admin check
            const mockDbRepository = {
                get: jest.fn().mockResolvedValue({
                    Data: { role: 'admin' },
                }),
            };
            (getRepository as jest.Mock).mockReturnValue(mockDbRepository);

            // Mock service
            const mockRetryResult = {
                attempted: 5,
                successful: 4,
                failed: 1,
            };
            const mockService = {
                retryFailedDeliveries: jest.fn().mockResolvedValue(mockRetryResult),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Create form data
            const formData = new FormData();
            formData.append('options', JSON.stringify({
                maxAge: 24,
                maxAttempts: 6,
            }));

            // Call action
            const result = await retryFailedNotificationsAction({}, formData);

            // Verify
            expect(result.message).toContain('4 successful');
            expect(result.data).toEqual(mockRetryResult);
        });
    });

    describe('getRateLimitStatusAction', () => {
        it('should get rate limit status', async () => {
            // Mock auth
            (getCurrentUserServer as jest.Mock).mockResolvedValue(mockUser);

            // Mock service
            const mockStatus = {
                limited: false,
                minuteCount: 5,
                hourCount: 50,
                dayCount: 200,
                minuteLimit: 10,
                hourLimit: 100,
                dayLimit: 500,
            };
            const mockService = {
                getRateLimitStatus: jest.fn().mockReturnValue(mockStatus),
            };
            (getNotificationService as jest.Mock).mockReturnValue(mockService);

            // Call action
            const result = await getRateLimitStatusAction();

            // Verify
            expect(result.message).toBe('success');
            expect(result.data).toEqual(mockStatus);
        });
    });
});
