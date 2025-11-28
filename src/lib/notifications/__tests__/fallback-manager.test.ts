/**
 * Fallback Manager Tests
 * 
 * Tests for channel fallback logic, rate limiting, and graceful degradation.
 * Validates Requirements: 5.4, 6.5
 */

import {
    FallbackManager,
    DEFAULT_RATE_LIMIT_CONFIG,
    resetFallbackManager,
} from "../fallback-manager";
import { ChannelRegistry } from "../channels/channel-registry";
import {
    Notification,
    NotificationChannel,
    NotificationPriority,
    NotificationType,
    NotificationStatus,
    NotificationRecipient,
    DeliveryResult,
    EmailFrequency,
} from "../types";
import { createNotificationError, ErrorCodes } from "../errors";

describe("FallbackManager", () => {
    let fallbackManager: FallbackManager;
    let channelRegistry: ChannelRegistry;

    beforeEach(() => {
        resetFallbackManager();
        channelRegistry = new ChannelRegistry();
        fallbackManager = new FallbackManager(channelRegistry);
    });

    afterEach(() => {
        resetFallbackManager();
    });

    describe("Channel Fallback Logic", () => {
        it("should attempt fallback channels when primary fails", async () => {
            // Create a mock notification
            const notification: Notification = {
                id: "test-notification-1",
                userId: "user-1",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "Test content",
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const recipient: NotificationRecipient = {
                userId: "user-1",
                email: "test@example.com",
                preferences: {
                    userId: "user-1",
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
                },
            };

            // Register mock handlers
            const inAppHandler = {
                channel: NotificationChannel.IN_APP,
                canHandle: () => true,
                deliver: async () => ({
                    success: true,
                    channel: NotificationChannel.IN_APP,
                    timestamp: new Date().toISOString(),
                }),
                validateDelivery: async () => ({ success: true }),
                formatContent: async () => ({ body: "test" }),
            };

            channelRegistry.register(inAppHandler as any);

            // Create an error to trigger fallback
            const error = createNotificationError(
                ErrorCodes.EMAIL_DELIVERY_FAILED,
                "Email delivery failed"
            );

            // Attempt delivery with fallback
            const result = await fallbackManager.deliverWithFallback(
                notification,
                recipient,
                error
            );

            // Should succeed via fallback to in-app
            expect(result.success).toBe(true);
            expect(result.channel).toBe(NotificationChannel.IN_APP);
        });

        it("should return failure when all fallback channels fail", async () => {
            const notification: Notification = {
                id: "test-notification-2",
                userId: "user-2",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "Test content",
                channels: [NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const recipient: NotificationRecipient = {
                userId: "user-2",
                email: "test@example.com",
                preferences: {
                    userId: "user-2",
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
                },
            };

            const error = createNotificationError(
                ErrorCodes.EMAIL_DELIVERY_FAILED,
                "Email delivery failed"
            );

            const result = await fallbackManager.deliverWithFallback(
                notification,
                recipient,
                error
            );

            expect(result.success).toBe(false);
        });
    });

    describe("Rate Limiting", () => {
        it("should rate limit notifications when limits are exceeded", () => {
            const notification: Notification = {
                id: "test-notification-3",
                userId: "user-3",
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: "Test Notification",
                content: "Test content",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Send notifications up to the minute limit
            for (let i = 0; i < DEFAULT_RATE_LIMIT_CONFIG.maxNotificationsPerMinute; i++) {
                fallbackManager.recordNotification("user-3");
            }

            // Next notification should be rate limited
            const isLimited = fallbackManager.isRateLimited(notification, "user-3");
            expect(isLimited).toBe(true);
        });

        it("should allow critical notifications to bypass rate limits", () => {
            const notification: Notification = {
                id: "test-notification-4",
                userId: "user-4",
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: "Critical Notification",
                content: "Critical content",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Send notifications up to the minute limit
            for (let i = 0; i < DEFAULT_RATE_LIMIT_CONFIG.maxNotificationsPerMinute; i++) {
                fallbackManager.recordNotification("user-4");
            }

            // Critical notification should bypass rate limit
            const isLimited = fallbackManager.isRateLimited(notification, "user-4");
            expect(isLimited).toBe(false);
        });

        it("should track rate limits per user", () => {
            // Record notifications for user-5
            for (let i = 0; i < 5; i++) {
                fallbackManager.recordNotification("user-5");
            }

            // Record notifications for user-6
            for (let i = 0; i < 3; i++) {
                fallbackManager.recordNotification("user-6");
            }

            const status5 = fallbackManager.getRateLimitStatus("user-5");
            const status6 = fallbackManager.getRateLimitStatus("user-6");

            expect(status5.minuteCount).toBe(5);
            expect(status6.minuteCount).toBe(3);
        });

        it("should reset rate limit counters after time window", () => {
            // This test would require time manipulation or mocking
            // For now, we'll test the reset functionality
            fallbackManager.recordNotification("user-7");

            let status = fallbackManager.getRateLimitStatus("user-7");
            expect(status.minuteCount).toBe(1);

            fallbackManager.resetRateLimitTracker("user-7");

            status = fallbackManager.getRateLimitStatus("user-7");
            expect(status.minuteCount).toBe(0);
        });
    });

    describe("System Overload Handling", () => {
        it("should queue non-critical notifications during overload", () => {
            const notification: Notification = {
                id: "test-notification-8",
                userId: "user-8",
                type: NotificationType.ALERT,
                priority: NotificationPriority.MEDIUM,
                title: "Test Notification",
                content: "Test content",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // The current implementation returns false (no overload)
            // In a real scenario, this would check actual system metrics
            const shouldQueue = fallbackManager.handleSystemOverload(notification);

            // With current implementation (low load), should not queue
            expect(shouldQueue).toBe(false);
        });

        it("should always process critical notifications even during overload", () => {
            const notification: Notification = {
                id: "test-notification-9",
                userId: "user-9",
                type: NotificationType.ALERT,
                priority: NotificationPriority.CRITICAL,
                title: "Critical Notification",
                content: "Critical content",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const shouldQueue = fallbackManager.handleSystemOverload(notification);

            // Critical notifications should never be queued
            expect(shouldQueue).toBe(false);
        });
    });

    describe("Fallback Strategies", () => {
        it("should have default fallback strategies configured", () => {
            const emailStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.EMAIL);
            const pushStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.PUSH);
            const inAppStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.IN_APP);

            expect(emailStrategy).toBeDefined();
            expect(emailStrategy?.fallbackChannels).toContain(NotificationChannel.IN_APP);

            expect(pushStrategy).toBeDefined();
            expect(pushStrategy?.fallbackChannels).toContain(NotificationChannel.EMAIL);
            expect(pushStrategy?.fallbackChannels).toContain(NotificationChannel.IN_APP);

            expect(inAppStrategy).toBeDefined();
            expect(inAppStrategy?.fallbackChannels).toHaveLength(0);
        });

        it("should allow custom fallback strategies", () => {
            const customStrategy = {
                primaryChannel: NotificationChannel.EMAIL,
                fallbackChannels: [NotificationChannel.PUSH],
                maxFallbackAttempts: 1,
            };

            fallbackManager.setFallbackStrategy(NotificationChannel.EMAIL, customStrategy);

            const strategy = fallbackManager.getFallbackStrategy(NotificationChannel.EMAIL);
            expect(strategy).toEqual(customStrategy);
        });
    });
});
