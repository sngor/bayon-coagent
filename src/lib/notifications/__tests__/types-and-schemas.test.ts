/**
 * Notification System - Type Definitions and Schema Validation Tests
 * 
 * Tests for core notification types, enums, and Zod validation schemas.
 * Validates Requirements: 1.1, 7.2
 */

import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    NotificationStatus,
    DeliveryStatus,
    EmailFrequency,
    type Notification,
    type NotificationPreferences,
    type DeliveryRecord,
    type CreateNotificationRequest,
} from "../types";

import {
    validateNotification,
    validateNotificationPreferences,
    validateCreateNotificationRequest,
    validateDeliveryRecord,
    safeValidate,
    notificationSchema,
    createNotificationRequestSchema,
} from "../schemas";

describe("Notification Type Definitions", () => {
    describe("Enums", () => {
        test("NotificationType enum has all required values", () => {
            expect(NotificationType.SYSTEM).toBe("system");
            expect(NotificationType.ALERT).toBe("alert");
            expect(NotificationType.REMINDER).toBe("reminder");
            expect(NotificationType.ACHIEVEMENT).toBe("achievement");
            expect(NotificationType.ANNOUNCEMENT).toBe("announcement");
            expect(NotificationType.TASK_COMPLETION).toBe("task_completion");
            expect(NotificationType.FEATURE_UPDATE).toBe("feature_update");
        });

        test("NotificationPriority enum has all required values", () => {
            expect(NotificationPriority.LOW).toBe("low");
            expect(NotificationPriority.MEDIUM).toBe("medium");
            expect(NotificationPriority.HIGH).toBe("high");
            expect(NotificationPriority.CRITICAL).toBe("critical");
        });

        test("NotificationChannel enum has all required values", () => {
            expect(NotificationChannel.IN_APP).toBe("in_app");
            expect(NotificationChannel.EMAIL).toBe("email");
            expect(NotificationChannel.PUSH).toBe("push");
        });

        test("NotificationStatus enum has all required values", () => {
            expect(NotificationStatus.PENDING).toBe("pending");
            expect(NotificationStatus.SENT).toBe("sent");
            expect(NotificationStatus.DELIVERED).toBe("delivered");
            expect(NotificationStatus.READ).toBe("read");
            expect(NotificationStatus.DISMISSED).toBe("dismissed");
            expect(NotificationStatus.EXPIRED).toBe("expired");
        });

        test("DeliveryStatus enum has all required values", () => {
            expect(DeliveryStatus.PENDING).toBe("pending");
            expect(DeliveryStatus.PROCESSING).toBe("processing");
            expect(DeliveryStatus.SENT).toBe("sent");
            expect(DeliveryStatus.DELIVERED).toBe("delivered");
            expect(DeliveryStatus.FAILED).toBe("failed");
            expect(DeliveryStatus.BOUNCED).toBe("bounced");
            expect(DeliveryStatus.COMPLAINED).toBe("complained");
        });

        test("EmailFrequency enum has all required values", () => {
            expect(EmailFrequency.IMMEDIATE).toBe("immediate");
            expect(EmailFrequency.HOURLY).toBe("hourly");
            expect(EmailFrequency.DAILY).toBe("daily");
            expect(EmailFrequency.WEEKLY).toBe("weekly");
        });
    });
});

describe("Notification Schema Validation", () => {
    describe("validateNotification", () => {
        test("validates a valid notification", () => {
            const validNotification: Notification = {
                id: "notif_123",
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            expect(() => validateNotification(validNotification)).not.toThrow();
            const result = validateNotification(validNotification);
            expect(result).toEqual(validNotification);
        });

        test("rejects notification with missing required fields", () => {
            const invalidNotification = {
                id: "notif_123",
                userId: "user_456",
                // Missing type, priority, title, content, channels, status, timestamps
            };

            expect(() => validateNotification(invalidNotification)).toThrow();
        });

        test("rejects notification with invalid title length", () => {
            const invalidNotification: Notification = {
                id: "notif_123",
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "a".repeat(201), // Exceeds 200 character limit
                content: "This is a test notification",
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            expect(() => validateNotification(invalidNotification)).toThrow();
        });

        test("rejects notification with invalid content length", () => {
            const invalidNotification: Notification = {
                id: "notif_123",
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "a".repeat(2001), // Exceeds 2000 character limit
                channels: [NotificationChannel.IN_APP],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            expect(() => validateNotification(invalidNotification)).toThrow();
        });

        test("accepts notification with optional fields", () => {
            const validNotification: Notification = {
                id: "notif_123",
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
                metadata: { key: "value" },
                actionUrl: "https://example.com",
                actionText: "Click here",
                channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                status: NotificationStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
            };

            expect(() => validateNotification(validNotification)).not.toThrow();
        });
    });

    describe("validateCreateNotificationRequest", () => {
        test("validates a valid create request", () => {
            const validRequest: CreateNotificationRequest = {
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
            };

            expect(() => validateCreateNotificationRequest(validRequest)).not.toThrow();
        });

        test("rejects request with empty title", () => {
            const invalidRequest = {
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "",
                content: "This is a test notification",
            };

            expect(() => validateCreateNotificationRequest(invalidRequest)).toThrow();
        });

        test("rejects request with invalid URL", () => {
            const invalidRequest: CreateNotificationRequest = {
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
                actionUrl: "not-a-valid-url",
            };

            expect(() => validateCreateNotificationRequest(invalidRequest)).toThrow();
        });
    });

    describe("validateNotificationPreferences", () => {
        test("validates valid preferences", () => {
            const validPreferences: NotificationPreferences = {
                userId: "user_456",
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT, NotificationType.SYSTEM],
                    },
                    email: {
                        enabled: true,
                        address: "user@example.com",
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.DAILY,
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

            expect(() => validateNotificationPreferences(validPreferences)).not.toThrow();
        });

        test("rejects preferences with invalid email", () => {
            const invalidPreferences: NotificationPreferences = {
                userId: "user_456",
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: true,
                        address: "not-an-email",
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.DAILY,
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

            expect(() => validateNotificationPreferences(invalidPreferences)).toThrow();
        });

        test("validates preferences with quiet hours", () => {
            const validPreferences: NotificationPreferences = {
                userId: "user_456",
                channels: {
                    inApp: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                    },
                    email: {
                        enabled: true,
                        types: [NotificationType.ALERT],
                        frequency: EmailFrequency.DAILY,
                        quietHours: {
                            enabled: true,
                            startTime: "22:00",
                            endTime: "08:00",
                            timezone: "America/New_York",
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

            expect(() => validateNotificationPreferences(validPreferences)).not.toThrow();
        });
    });

    describe("validateDeliveryRecord", () => {
        test("validates a valid delivery record", () => {
            const validRecord: DeliveryRecord = {
                id: "delivery_123",
                notificationId: "notif_456",
                userId: "user_789",
                channel: NotificationChannel.EMAIL,
                status: DeliveryStatus.DELIVERED,
                attempts: 1,
                lastAttemptAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
            };

            expect(() => validateDeliveryRecord(validRecord)).not.toThrow();
        });

        test("rejects delivery record with negative attempts", () => {
            const invalidRecord: DeliveryRecord = {
                id: "delivery_123",
                notificationId: "notif_456",
                userId: "user_789",
                channel: NotificationChannel.EMAIL,
                status: DeliveryStatus.FAILED,
                attempts: -1,
                lastAttemptAt: new Date().toISOString(),
            };

            expect(() => validateDeliveryRecord(invalidRecord)).toThrow();
        });
    });

    describe("safeValidate", () => {
        test("returns success for valid data", () => {
            const validRequest: CreateNotificationRequest = {
                userId: "user_456",
                type: NotificationType.ALERT,
                priority: NotificationPriority.HIGH,
                title: "Test Notification",
                content: "This is a test notification",
            };

            const result = safeValidate(createNotificationRequestSchema, validRequest);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validRequest);
            }
        });

        test("returns error for invalid data", () => {
            const invalidRequest = {
                userId: "user_456",
                // Missing required fields
            };

            const result = safeValidate(createNotificationRequestSchema, invalidRequest);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
            }
        });
    });
});
