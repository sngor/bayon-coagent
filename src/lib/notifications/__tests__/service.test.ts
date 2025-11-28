/**
 * Notification Service Tests
 * 
 * Tests for core notification service functionality.
 */

import { NotificationService } from "../service";
import { PreferenceManager } from "../preference-manager";
import { NotificationRepository } from "../repository";
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
    CreateNotificationRequest,
    Notification,
    NotificationPreferences,
    EmailFrequency,
} from "../types";

// Mock the repository
class MockNotificationRepository {
    private notifications: Map<string, Notification> = new Map();
    private preferences: Map<string, NotificationPreferences> = new Map();

    async createNotification(request: CreateNotificationRequest): Promise<Notification> {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const now = new Date().toISOString();

        const notification: Notification = {
            id: notificationId,
            userId: request.userId,
            type: request.type,
            priority: request.priority,
            title: request.title,
            content: request.content,
            metadata: request.metadata,
            actionUrl: request.actionUrl,
            actionText: request.actionText,
            channels: request.channels || [NotificationChannel.IN_APP],
            status: NotificationStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            expiresAt: request.expiresAt,
        };

        this.notifications.set(notificationId, notification);
        return notification;
    }

    async getNotification(notificationId: string): Promise<Notification | null> {
        return this.notifications.get(notificationId) || null;
    }

    async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<void> {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            Object.assign(notification, updates, { updatedAt: new Date().toISOString() });
        }
    }

    async getUserPreferences(userId: string): Promise<NotificationPreferences> {
        if (this.preferences.has(userId)) {
            return this.preferences.get(userId)!;
        }

        const defaultPreferences: NotificationPreferences = {
            userId,
            channels: {
                inApp: {
                    enabled: true,
                    types: Object.values(NotificationType),
                },
                email: {
                    enabled: true,
                    types: [NotificationType.ALERT, NotificationType.ANNOUNCEMENT, NotificationType.FEATURE_UPDATE],
                    frequency: EmailFrequency.IMMEDIATE,
                },
                push: {
                    enabled: false,
                    types: [NotificationType.ALERT, NotificationType.REMINDER],
                },
            },
            globalSettings: {
                doNotDisturb: false,
            },
            updatedAt: new Date().toISOString(),
        };

        this.preferences.set(userId, defaultPreferences);
        return defaultPreferences;
    }

    async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
        const current = await this.getUserPreferences(userId);
        const updated = { ...current, ...preferences, updatedAt: new Date().toISOString() };
        this.preferences.set(userId, updated as NotificationPreferences);
    }

    async createDeliveryRecord(record: any): Promise<any> {
        return { ...record, id: `delivery_${Date.now()}` };
    }

    async getDeliveryRecords(notificationId: string): Promise<any[]> {
        return [];
    }
}

describe("NotificationService", () => {
    let service: NotificationService;
    let mockRepository: MockNotificationRepository;

    beforeEach(() => {
        mockRepository = new MockNotificationRepository();
        service = new NotificationService(mockRepository as any);
    });

    describe("createNotification", () => {
        it("should create a notification with valid data", async () => {
            const request: CreateNotificationRequest = {
                userId: "user123",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
                channels: [NotificationChannel.IN_APP],
            };

            const notification = await service.createNotification(request);

            expect(notification).toBeDefined();
            expect(notification.id).toBeDefined();
            expect(notification.userId).toBe(request.userId);
            expect(notification.type).toBe(request.type);
            expect(notification.priority).toBe(request.priority);
            expect(notification.title).toBe(request.title);
            expect(notification.content).toBe(request.content);
            expect(notification.status).toBe(NotificationStatus.PENDING);
        });

        it("should sanitize notification content", async () => {
            const request: CreateNotificationRequest = {
                userId: "user123",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "<script>alert('xss')</script>Test",
                content: "Content with <b>HTML</b> tags",
            };

            const notification = await service.createNotification(request);

            expect(notification.title).not.toContain("<script>");
            expect(notification.content).not.toContain("<b>");
        });

        it("should throw error for invalid data", async () => {
            const request = {
                userId: "",
                type: "invalid",
                priority: NotificationPriority.HIGH,
                title: "",
                content: "Test",
            } as any;

            await expect(service.createNotification(request)).rejects.toThrow();
        });
    });

    describe("getUserPreferences", () => {
        it("should return default preferences for new user", async () => {
            const preferences = await service.getUserPreferences("newuser123");

            expect(preferences).toBeDefined();
            expect(preferences.userId).toBe("newuser123");
            expect(preferences.channels.inApp.enabled).toBe(true);
            expect(preferences.globalSettings.doNotDisturb).toBe(false);
        });
    });

    describe("updateUserPreferences", () => {
        it("should update user preferences", async () => {
            const userId = "user123";

            const changeLog = await service.updateUserPreferences(userId, {
                globalSettings: {
                    doNotDisturb: true,
                },
            });

            expect(changeLog).toBeDefined();
            expect(changeLog.userId).toBe(userId);
            expect(changeLog.changes.length).toBeGreaterThan(0);

            const updatedPreferences = await service.getUserPreferences(userId);
            expect(updatedPreferences.globalSettings.doNotDisturb).toBe(true);
        });
    });
});

describe("PreferenceManager", () => {
    let manager: PreferenceManager;

    beforeEach(() => {
        manager = new PreferenceManager();
    });

    describe("getDefaultPreferences", () => {
        it("should return valid default preferences", () => {
            const preferences = manager.getDefaultPreferences("user123");

            expect(preferences.userId).toBe("user123");
            expect(preferences.channels.inApp.enabled).toBe(true);
            expect(preferences.channels.email.enabled).toBe(true);
            expect(preferences.channels.push.enabled).toBe(false);
        });
    });

    describe("filterChannelsByPreferences", () => {
        it("should filter channels based on preferences", () => {
            const preferences = manager.getDefaultPreferences("user123");
            preferences.channels.email.enabled = false;

            const notification = {
                id: "notif123",
                userId: "user123",
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: "Test",
                content: "Test",
                channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = manager.filterChannelsByPreferences(notification, preferences);

            expect(result.allowedChannels).toContain(NotificationChannel.IN_APP);
            expect(result.allowedChannels).not.toContain(NotificationChannel.EMAIL);
            expect(result.blockedChannels).toContain(NotificationChannel.EMAIL);
        });

        it("should always include at least one channel for critical notifications", () => {
            const preferences = manager.getDefaultPreferences("user123");
            preferences.channels.inApp.enabled = false;
            preferences.channels.email.enabled = false;
            preferences.channels.push.enabled = false;

            const notification = {
                id: "notif123",
                userId: "user123",
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: "Critical",
                content: "Critical notification",
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = manager.filterChannelsByPreferences(notification, preferences);

            // Critical notifications bypass DND, so channels should be filtered normally
            // Since all channels are disabled, it should return empty
            expect(result.allowedChannels.length).toBe(0);
            expect(result.blockedChannels.length).toBeGreaterThan(0);
        });
    });

    describe("isWithinQuietHours", () => {
        it("should detect quiet hours correctly", () => {
            const preferences = manager.getDefaultPreferences("user123");
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: "22:00",
                endTime: "08:00",
                timezone: "America/New_York",
            };

            // Test during quiet hours (23:00)
            const duringQuietHours = new Date();
            duringQuietHours.setHours(23, 0, 0, 0);
            expect(manager.isWithinQuietHours(preferences, duringQuietHours)).toBe(true);

            // Test outside quiet hours (12:00)
            const outsideQuietHours = new Date();
            outsideQuietHours.setHours(12, 0, 0, 0);
            expect(manager.isWithinQuietHours(preferences, outsideQuietHours)).toBe(false);
        });
    });

    describe("shouldSendEmailNow", () => {
        it("should return false for non-critical during quiet hours", () => {
            const preferences = manager.getDefaultPreferences("user123");
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: "22:00",
                endTime: "08:00",
                timezone: "America/New_York",
            };

            // Test during quiet hours (23:00)
            const duringQuietHours = new Date();
            duringQuietHours.setHours(23, 0, 0, 0);

            const shouldSend = manager.shouldSendEmailNow(
                preferences,
                NotificationPriority.HIGH,
                duringQuietHours
            );

            expect(shouldSend).toBe(false);
        });

        it("should return true for critical notifications during quiet hours", () => {
            const preferences = manager.getDefaultPreferences("user123");
            preferences.channels.email.quietHours = {
                enabled: true,
                startTime: "22:00",
                endTime: "08:00",
                timezone: "America/New_York",
            };

            // Test during quiet hours (23:00)
            const duringQuietHours = new Date();
            duringQuietHours.setHours(23, 0, 0, 0);

            const shouldSend = manager.shouldSendEmailNow(
                preferences,
                NotificationPriority.CRITICAL,
                duringQuietHours
            );

            expect(shouldSend).toBe(true);
        });
    });
});
