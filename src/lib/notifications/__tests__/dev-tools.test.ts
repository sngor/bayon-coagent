/**
 * Developer Tools Tests
 * 
 * Tests for notification developer tools and testing utilities.
 */

import {
    MockChannelHandler,
    NotificationPreviewGenerator,
    NotificationDevLogger,
    TestNotificationGenerator,
    getNotificationPreviewGenerator,
    getNotificationDevLogger,
    getTestNotificationGenerator,
} from "../dev-tools";
import {
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
} from "../types";

describe("MockChannelHandler", () => {
    let mockHandler: MockChannelHandler;
    let testNotification: Notification;

    beforeEach(() => {
        mockHandler = new MockChannelHandler(NotificationChannel.IN_APP);
        testNotification = {
            id: "test-notification",
            userId: "test-user",
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            title: "Test Notification",
            content: "Test content",
            channels: [NotificationChannel.IN_APP],
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    it("should deliver notifications successfully", async () => {
        const result = await mockHandler.deliver(testNotification, { userId: "test-user" });

        expect(result.success).toBe(true);
        expect(result.channel).toBe(NotificationChannel.IN_APP);
        expect(mockHandler.getDeliveredNotifications()).toHaveLength(1);
    });

    it("should simulate delivery failures", async () => {
        mockHandler.setShouldFail(true, "Test failure");

        const result = await mockHandler.deliver(testNotification, { userId: "test-user" });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Test failure");
        expect(mockHandler.getDeliveredNotifications()).toHaveLength(0);
    });

    it("should simulate delivery delays", async () => {
        mockHandler.setDeliveryDelay(100);

        const startTime = Date.now();
        await mockHandler.deliver(testNotification, { userId: "test-user" });
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("should clear delivery history", async () => {
        await mockHandler.deliver(testNotification, { userId: "test-user" });
        expect(mockHandler.getDeliveredNotifications()).toHaveLength(1);

        mockHandler.clearHistory();
        expect(mockHandler.getDeliveredNotifications()).toHaveLength(0);
    });

    it("should check if it can handle notification", () => {
        const preferences = {
            userId: "test-user",
            channels: {
                inApp: { enabled: true, types: [] },
                email: { enabled: true, address: "test@example.com", types: [], frequency: "immediate" as const },
                push: { enabled: false, types: [] },
            },
            globalSettings: { doNotDisturb: false },
            updatedAt: new Date().toISOString(),
        };

        const canHandle = mockHandler.canHandle(testNotification, preferences);
        expect(canHandle).toBe(true);
    });
});

describe("NotificationPreviewGenerator", () => {
    let generator: NotificationPreviewGenerator;
    let testNotification: Notification;

    beforeEach(() => {
        generator = new NotificationPreviewGenerator();
        testNotification = {
            id: "test-notification",
            userId: "test-user",
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            title: "Test Notification",
            content: "Test content",
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            actionUrl: "/dashboard",
            actionText: "View Details",
        };
    });

    it("should generate preview for all channels", () => {
        const preview = generator.generatePreview(testNotification);

        expect(preview.notification).toEqual(testNotification);
        expect(preview.channels).toHaveLength(2);
        expect(preview.channels[0].channel).toBe(NotificationChannel.IN_APP);
        expect(preview.channels[1].channel).toBe(NotificationChannel.EMAIL);
    });

    it("should generate in-app preview", () => {
        const preview = generator.generatePreview(testNotification);
        const inAppPreview = preview.channels.find(c => c.channel === NotificationChannel.IN_APP);

        expect(inAppPreview).toBeDefined();
        expect(inAppPreview!.preview).toContain("Test Notification");
        expect(inAppPreview!.preview).toContain("Test content");
        expect(inAppPreview!.preview).toContain("View Details");
    });

    it("should generate email preview with HTML", () => {
        const preview = generator.generatePreview(testNotification);
        const emailPreview = preview.channels.find(c => c.channel === NotificationChannel.EMAIL);

        expect(emailPreview).toBeDefined();
        expect(emailPreview!.preview).toContain("Test Notification");
        expect(emailPreview!.html).toBeDefined();
        expect(emailPreview!.html).toContain("<!DOCTYPE html>");
        expect(emailPreview!.html).toContain("Test Notification");
    });

    it("should generate push preview", () => {
        const pushNotification = {
            ...testNotification,
            channels: [NotificationChannel.PUSH],
        };

        const preview = generator.generatePreview(pushNotification);
        const pushPreview = preview.channels[0];

        expect(pushPreview.channel).toBe(NotificationChannel.PUSH);
        expect(pushPreview.preview).toContain("Test Notification");
        expect(pushPreview.preview).toContain("Test content");
    });

    it("should use singleton instance", () => {
        const instance1 = getNotificationPreviewGenerator();
        const instance2 = getNotificationPreviewGenerator();

        expect(instance1).toBe(instance2);
    });
});

describe("NotificationDevLogger", () => {
    let logger: NotificationDevLogger;
    let testNotification: Notification;

    beforeEach(() => {
        logger = new NotificationDevLogger(true);
        testNotification = {
            id: "test-notification",
            userId: "test-user",
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            title: "Test Notification",
            content: "Test content",
            channels: [NotificationChannel.IN_APP],
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    it("should log notification creation", () => {
        logger.logCreation(testNotification);

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("info");
        expect(logs[0].message).toContain("created");
    });

    it("should log successful delivery", () => {
        const result = {
            success: true,
            channel: NotificationChannel.IN_APP,
            timestamp: new Date().toISOString(),
        };

        logger.logDelivery(testNotification, result);

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("info");
        expect(logs[0].message).toContain("delivered");
    });

    it("should log failed delivery", () => {
        const result = {
            success: false,
            channel: NotificationChannel.IN_APP,
            error: "Delivery failed",
            timestamp: new Date().toISOString(),
        };

        logger.logDelivery(testNotification, result);

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("error");
        expect(logs[0].message).toContain("failed");
    });

    it("should log preference changes", () => {
        logger.logPreferenceChange("test-user", { email: { enabled: false } });

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("info");
        expect(logs[0].message).toContain("Preferences updated");
    });

    it("should log errors", () => {
        const error = new Error("Test error");
        logger.logError(error, { context: "test" });

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe("error");
        expect(logs[0].message).toContain("Test error");
    });

    it("should clear logs", () => {
        logger.logCreation(testNotification);
        expect(logger.getLogs()).toHaveLength(1);

        logger.clearLogs();
        expect(logger.getLogs()).toHaveLength(0);
    });

    it("should export logs as JSON", () => {
        logger.logCreation(testNotification);

        const exported = logger.exportLogs();
        expect(exported).toBeTruthy();
        expect(() => JSON.parse(exported)).not.toThrow();
    });

    it("should respect enabled flag", () => {
        logger.setEnabled(false);
        logger.logCreation(testNotification);

        expect(logger.getLogs()).toHaveLength(0);
    });

    it("should use singleton instance", () => {
        const instance1 = getNotificationDevLogger();
        const instance2 = getNotificationDevLogger();

        expect(instance1).toBe(instance2);
    });
});

describe("TestNotificationGenerator", () => {
    let generator: TestNotificationGenerator;

    beforeEach(() => {
        generator = new TestNotificationGenerator();
    });

    it("should generate a test notification", () => {
        const notification = generator.generateTestNotification("test-user");

        expect(notification.userId).toBe("test-user");
        expect(notification.type).toBeDefined();
        expect(notification.priority).toBeDefined();
        expect(notification.title).toBeTruthy();
        expect(notification.content).toBeTruthy();
        expect(notification.channels.length).toBeGreaterThan(0);
    });

    it("should apply overrides", () => {
        const notification = generator.generateTestNotification("test-user", {
            type: NotificationType.ALERT,
            priority: NotificationPriority.CRITICAL,
            title: "Custom Title",
        });

        expect(notification.type).toBe(NotificationType.ALERT);
        expect(notification.priority).toBe(NotificationPriority.CRITICAL);
        expect(notification.title).toBe("Custom Title");
    });

    it("should generate multiple test notifications", () => {
        const notifications = generator.generateTestNotifications("test-user", 5);

        expect(notifications).toHaveLength(5);
        notifications.forEach(n => {
            expect(n.userId).toBe("test-user");
        });
    });

    it("should generate notifications for all types", () => {
        const notifications = generator.generateAllTypes("test-user");

        expect(notifications.length).toBe(Object.values(NotificationType).length);

        const types = notifications.map(n => n.type);
        Object.values(NotificationType).forEach(type => {
            expect(types).toContain(type);
        });
    });

    it("should use singleton instance", () => {
        const instance1 = getTestNotificationGenerator();
        const instance2 = getTestNotificationGenerator();

        expect(instance1).toBe(instance2);
    });
});
