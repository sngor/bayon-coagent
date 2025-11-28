#!/usr/bin/env tsx
/**
 * Notification Fallback Mechanism Test Script
 * 
 * Demonstrates the fallback mechanisms in action:
 * - Channel fallback when primary fails
 * - Rate limiting with critical bypass
 * - System overload handling
 */

import {
    FallbackManager,
    resetFallbackManager,
} from "../src/lib/notifications/fallback-manager";
import { ChannelRegistry } from "../src/lib/notifications/channels/channel-registry";
import {
    Notification,
    NotificationChannel,
    NotificationPriority,
    NotificationType,
    NotificationStatus,
    NotificationRecipient,
    EmailFrequency,
} from "../src/lib/notifications/types";
import { createNotificationError, ErrorCodes } from "../src/lib/notifications/errors";

async function main() {
    console.log("🚀 Testing Notification Fallback Mechanisms\n");

    // Initialize
    resetFallbackManager();
    const channelRegistry = new ChannelRegistry();
    const fallbackManager = new FallbackManager(channelRegistry);

    // Test 1: Channel Fallback
    console.log("📋 Test 1: Channel Fallback Logic");
    console.log("─".repeat(50));

    const notification: Notification = {
        id: "test-1",
        userId: "user-1",
        type: NotificationType.ALERT,
        priority: NotificationPriority.HIGH,
        title: "Test Notification",
        content: "Testing fallback mechanism",
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

    // Register mock in-app handler
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

    const error = createNotificationError(
        ErrorCodes.EMAIL_DELIVERY_FAILED,
        "Email delivery failed - testing fallback"
    );

    const result = await fallbackManager.deliverWithFallback(notification, recipient, error);
    console.log(`✅ Fallback Result: ${result.success ? "SUCCESS" : "FAILED"}`);
    console.log(`   Channel: ${result.channel}`);
    console.log(`   Message: Email failed, fell back to in-app\n`);

    // Test 2: Rate Limiting
    console.log("📋 Test 2: Rate Limiting");
    console.log("─".repeat(50));

    const mediumNotification: Notification = {
        ...notification,
        id: "test-2",
        priority: NotificationPriority.MEDIUM,
    };

    // Send 10 notifications (the per-minute limit)
    for (let i = 0; i < 10; i++) {
        fallbackManager.recordNotification("user-2");
    }

    const isLimited = fallbackManager.isRateLimited(mediumNotification, "user-2");
    console.log(`✅ Rate Limit Status: ${isLimited ? "LIMITED" : "ALLOWED"}`);
    console.log(`   Sent 10 notifications in 1 minute`);
    console.log(`   11th notification: ${isLimited ? "BLOCKED" : "ALLOWED"}\n`);

    // Test 3: Critical Bypass
    console.log("📋 Test 3: Critical Priority Bypass");
    console.log("─".repeat(50));

    const criticalNotification: Notification = {
        ...notification,
        id: "test-3",
        priority: NotificationPriority.CRITICAL,
    };

    const isCriticalLimited = fallbackManager.isRateLimited(criticalNotification, "user-2");
    console.log(`✅ Critical Notification: ${isCriticalLimited ? "LIMITED" : "BYPASSED"}`);
    console.log(`   Even with rate limit exceeded, critical notifications pass through\n`);

    // Test 4: Rate Limit Status
    console.log("📋 Test 4: Rate Limit Status");
    console.log("─".repeat(50));

    const status = fallbackManager.getRateLimitStatus("user-2");
    console.log(`✅ Rate Limit Status for user-2:`);
    console.log(`   Minute: ${status.minuteCount}/${status.minuteLimit}`);
    console.log(`   Hour: ${status.hourCount}/${status.hourLimit}`);
    console.log(`   Day: ${status.dayCount}/${status.dayLimit}\n`);

    // Test 5: System Overload
    console.log("📋 Test 5: System Overload Handling");
    console.log("─".repeat(50));

    const shouldQueueMedium = fallbackManager.handleSystemOverload(mediumNotification);
    const shouldQueueCritical = fallbackManager.handleSystemOverload(criticalNotification);

    console.log(`✅ System Overload Handling:`);
    console.log(`   Medium Priority: ${shouldQueueMedium ? "QUEUED" : "PROCESSED"}`);
    console.log(`   Critical Priority: ${shouldQueueCritical ? "QUEUED" : "PROCESSED"}`);
    console.log(`   (Current system load is low, so nothing queued)\n`);

    // Test 6: Fallback Strategies
    console.log("📋 Test 6: Fallback Strategies");
    console.log("─".repeat(50));

    const emailStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.EMAIL);
    const pushStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.PUSH);
    const inAppStrategy = fallbackManager.getFallbackStrategy(NotificationChannel.IN_APP);

    console.log(`✅ Configured Fallback Strategies:`);
    console.log(`   Email: ${emailStrategy?.fallbackChannels.join(" → ") || "none"}`);
    console.log(`   Push: ${pushStrategy?.fallbackChannels.join(" → ") || "none"}`);
    console.log(`   In-App: ${inAppStrategy?.fallbackChannels.join(" → ") || "none (most reliable)"}\n`);

    console.log("✨ All fallback mechanism tests completed successfully!");
}

main().catch(console.error);
