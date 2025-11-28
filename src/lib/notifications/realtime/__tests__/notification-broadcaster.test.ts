/**
 * Notification Broadcaster Tests
 * 
 * Tests for the real-time notification broadcasting system.
 */

import { jest } from '@jest/globals';
import {
    getNotificationBroadcaster,
    resetNotificationBroadcaster,
    NotificationBroadcaster,
} from "../notification-broadcaster";
import { Notification, NotificationType, NotificationPriority, NotificationChannel, NotificationStatus } from "../../types";

describe("NotificationBroadcaster", () => {
    let broadcaster: NotificationBroadcaster;

    beforeEach(() => {
        resetNotificationBroadcaster();
        broadcaster = getNotificationBroadcaster();
    });

    afterEach(() => {
        broadcaster.shutdown();
        resetNotificationBroadcaster();
    });

    describe("Client Registration", () => {
        it("should register a client connection", () => {
            const mockController = createMockController();
            const cleanup = broadcaster.registerClient("user123", mockController);

            expect(broadcaster.getUserClientCount("user123")).toBe(1);
            expect(broadcaster.getTotalClientCount()).toBe(1);

            cleanup();
        });

        it("should support multiple clients for the same user", () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            const cleanup1 = broadcaster.registerClient("user123", controller1);
            const cleanup2 = broadcaster.registerClient("user123", controller2);

            expect(broadcaster.getUserClientCount("user123")).toBe(2);
            expect(broadcaster.getTotalClientCount()).toBe(2);

            cleanup1();
            cleanup2();
        });

        it("should support multiple users", () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            const cleanup1 = broadcaster.registerClient("user123", controller1);
            const cleanup2 = broadcaster.registerClient("user456", controller2);

            expect(broadcaster.getUserClientCount("user123")).toBe(1);
            expect(broadcaster.getUserClientCount("user456")).toBe(1);
            expect(broadcaster.getTotalClientCount()).toBe(2);

            cleanup1();
            cleanup2();
        });

        it("should cleanup client on disconnect", () => {
            const mockController = createMockController();
            const cleanup = broadcaster.registerClient("user123", mockController);

            expect(broadcaster.getUserClientCount("user123")).toBe(1);

            cleanup();

            expect(broadcaster.getUserClientCount("user123")).toBe(0);
            expect(broadcaster.getTotalClientCount()).toBe(0);
        });
    });

    describe("Broadcasting", () => {
        it("should not fail when broadcasting to disconnected user", async () => {
            const notification = createMockNotification("user123");

            // Should not throw
            await expect(
                broadcaster.broadcastToUser("user123", notification)
            ).resolves.not.toThrow();
        });

        it("should emit broadcast event when broadcasting to connected user", async () => {
            const mockController = createMockController();
            const cleanup = broadcaster.registerClient("user123", mockController);

            const eventListener = jest.fn<any>();
            broadcaster.on("notification-broadcast", eventListener);

            const notification = createMockNotification("user123");
            await broadcaster.broadcastToUser("user123", notification);

            expect(eventListener).toHaveBeenCalledWith({
                userId: "user123",
                notification,
            });

            cleanup();
        });

        it("should broadcast to multiple users", async () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            const cleanup1 = broadcaster.registerClient("user123", controller1);
            const cleanup2 = broadcaster.registerClient("user456", controller2);

            const eventListener = jest.fn<any>();
            broadcaster.on("notification-broadcast", eventListener);

            const notification = createMockNotification("user123");
            await broadcaster.broadcastToUsers(["user123", "user456"], notification);

            // Should emit event for each user
            expect(eventListener).toHaveBeenCalledTimes(2);

            cleanup1();
            cleanup2();
        });
    });

    describe("Connection Management", () => {
        it("should track connected user IDs", () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            const cleanup1 = broadcaster.registerClient("user123", controller1);
            const cleanup2 = broadcaster.registerClient("user456", controller2);

            const connectedUsers = broadcaster.getConnectedUserIds();
            expect(connectedUsers).toContain("user123");
            expect(connectedUsers).toContain("user456");
            expect(connectedUsers).toHaveLength(2);

            cleanup1();
            cleanup2();
        });

        it("should remove user from connected list when all clients disconnect", () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            const cleanup1 = broadcaster.registerClient("user123", controller1);
            const cleanup2 = broadcaster.registerClient("user123", controller2);

            expect(broadcaster.getConnectedUserIds()).toContain("user123");

            cleanup1();
            expect(broadcaster.getConnectedUserIds()).toContain("user123");

            cleanup2();
            expect(broadcaster.getConnectedUserIds()).not.toContain("user123");
        });
    });

    describe("Shutdown", () => {
        it("should close all connections on shutdown", () => {
            const controller1 = createMockController();
            const controller2 = createMockController();

            broadcaster.registerClient("user123", controller1);
            broadcaster.registerClient("user456", controller2);

            expect(broadcaster.getTotalClientCount()).toBe(2);

            broadcaster.shutdown();

            expect(broadcaster.getTotalClientCount()).toBe(0);
            expect(controller1.close).toHaveBeenCalled();
            expect(controller2.close).toHaveBeenCalled();
        });
    });

    describe("Message Formatting", () => {
        it("should format notification data correctly", () => {
            const notification = createMockNotification("user123");

            // Test that notification has required fields
            expect(notification.id).toBeDefined();
            expect(notification.title).toBeDefined();
            expect(notification.content).toBeDefined();
            expect(notification.userId).toBe("user123");
            expect(notification.type).toBe(NotificationType.ALERT);
            expect(notification.priority).toBe(NotificationPriority.HIGH);
        });
    });
});

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock ReadableStreamDefaultController
 */
function createMockController() {
    const enqueueFn = jest.fn<any>();
    const closeFn = jest.fn<any>();
    const errorFn = jest.fn<any>();

    return {
        enqueue: enqueueFn,
        close: closeFn,
        error: errorFn,
        desiredSize: null,
    } as ReadableStreamDefaultController;
}

/**
 * Creates a mock notification for testing
 */
function createMockNotification(userId: string): Notification {
    return {
        id: `notif_${Date.now()}`,
        userId,
        type: NotificationType.ALERT,
        priority: NotificationPriority.HIGH,
        title: "Test Notification",
        content: "This is a test notification",
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
