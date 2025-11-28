/**
 * Notification Developer Tools
 * 
 * Tools for testing, debugging, and previewing notifications in development.
 * Validates Requirements: 7.5
 */

import {
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    CreateNotificationRequest,
    NotificationPreferences,
    DeliveryResult,
} from "./types";
import { NotificationService } from "./service";
import { ChannelHandler } from "./channels/base-channel-handler";

// ============================================================================
// Mock Channel Handler
// ============================================================================

/**
 * Mock channel handler for testing
 * Simulates notification delivery without actually sending
 */
export class MockChannelHandler implements ChannelHandler {
    public deliveredNotifications: Array<{
        notification: Notification;
        recipient: any;
        timestamp: string;
    }> = [];
    public shouldFail: boolean = false;
    public failureReason?: string;
    public deliveryDelay: number = 0;

    constructor(
        private channel: NotificationChannel,
        options?: {
            shouldFail?: boolean;
            failureReason?: string;
            deliveryDelay?: number;
        }
    ) {
        this.shouldFail = options?.shouldFail || false;
        this.failureReason = options?.failureReason;
        this.deliveryDelay = options?.deliveryDelay || 0;
    }

    canHandle(notification: Notification, preferences: NotificationPreferences): boolean {
        return notification.channels.includes(this.channel);
    }

    async deliver(notification: Notification, recipient: any): Promise<DeliveryResult> {
        // Simulate delivery delay
        if (this.deliveryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.deliveryDelay));
        }

        // Simulate failure if configured
        if (this.shouldFail) {
            return {
                success: false,
                channel: this.channel,
                error: this.failureReason || "Mock delivery failure",
                timestamp: new Date().toISOString(),
            };
        }

        // Record successful delivery
        this.deliveredNotifications.push({
            notification,
            recipient,
            timestamp: new Date().toISOString(),
        });

        return {
            success: true,
            channel: this.channel,
            deliveryId: `mock-${this.channel}-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
    }

    async validateDelivery(deliveryId: string): Promise<any> {
        return {
            valid: true,
            deliveryId,
            status: "delivered",
        };
    }

    async formatContent(notification: Notification, template?: any): Promise<any> {
        return {
            subject: notification.title,
            body: notification.content,
        };
    }

    /**
     * Gets all delivered notifications
     */
    getDeliveredNotifications(): typeof this.deliveredNotifications {
        return this.deliveredNotifications;
    }

    /**
     * Clears delivery history
     */
    clearHistory(): void {
        this.deliveredNotifications = [];
    }

    /**
     * Sets whether deliveries should fail
     */
    setShouldFail(shouldFail: boolean, reason?: string): void {
        this.shouldFail = shouldFail;
        this.failureReason = reason;
    }

    /**
     * Sets delivery delay in milliseconds
     */
    setDeliveryDelay(delay: number): void {
        this.deliveryDelay = delay;
    }
}

// ============================================================================
// Notification Preview
// ============================================================================

/**
 * Preview data for a notification
 */
export interface NotificationPreview {
    notification: Notification;
    channels: {
        channel: NotificationChannel;
        preview: string;
        html?: string;
    }[];
}

/**
 * Generates a preview of how a notification will appear in different channels
 */
export class NotificationPreviewGenerator {
    /**
     * Generates preview for a notification
     */
    generatePreview(notification: Notification): NotificationPreview {
        const channels = notification.channels.map(channel => ({
            channel,
            preview: this.generateChannelPreview(notification, channel),
            html: this.generateChannelHTML(notification, channel),
        }));

        return {
            notification,
            channels,
        };
    }

    /**
     * Generates text preview for a specific channel
     */
    private generateChannelPreview(
        notification: Notification,
        channel: NotificationChannel
    ): string {
        switch (channel) {
            case NotificationChannel.IN_APP:
                return this.generateInAppPreview(notification);
            case NotificationChannel.EMAIL:
                return this.generateEmailPreview(notification);
            case NotificationChannel.PUSH:
                return this.generatePushPreview(notification);
            default:
                return notification.content;
        }
    }

    /**
     * Generates HTML preview for a specific channel
     */
    private generateChannelHTML(
        notification: Notification,
        channel: NotificationChannel
    ): string | undefined {
        if (channel === NotificationChannel.EMAIL) {
            return this.generateEmailHTML(notification);
        }
        return undefined;
    }

    private generateInAppPreview(notification: Notification): string {
        return `
[In-App Notification]
Title: ${notification.title}
Content: ${notification.content}
${notification.actionText ? `Action: ${notification.actionText}` : ""}
${notification.actionUrl ? `URL: ${notification.actionUrl}` : ""}
Priority: ${notification.priority}
Type: ${notification.type}
        `.trim();
    }

    private generateEmailPreview(notification: Notification): string {
        return `
[Email Notification]
Subject: ${notification.title}
Body:
${notification.content}

${notification.actionText && notification.actionUrl ? `[${notification.actionText}](${notification.actionUrl})` : ""}

---
Priority: ${notification.priority}
Type: ${notification.type}
        `.trim();
    }

    private generatePushPreview(notification: Notification): string {
        return `
[Push Notification]
${notification.title}
${notification.content}
${notification.actionText ? `• ${notification.actionText}` : ""}
        `.trim();
    }

    private generateEmailHTML(notification: Notification): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${notification.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; }
        .action { margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${notification.title}</h1>
        </div>
        <div class="content">
            <p>${notification.content}</p>
            ${notification.actionText && notification.actionUrl ? `
            <div class="action">
                <a href="${notification.actionUrl}" class="button">${notification.actionText}</a>
            </div>
            ` : ""}
        </div>
        <div class="footer">
            <p>Priority: ${notification.priority} | Type: ${notification.type}</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }
}

// ============================================================================
// Development Logger
// ============================================================================

/**
 * Development mode notification logger
 */
export class NotificationDevLogger {
    private logs: Array<{
        timestamp: string;
        level: "info" | "warn" | "error";
        message: string;
        data?: any;
    }> = [];
    private enabled: boolean;

    constructor(enabled: boolean = process.env.NODE_ENV === "development") {
        this.enabled = enabled;
    }

    /**
     * Logs notification creation
     */
    logCreation(notification: Notification): void {
        if (!this.enabled) return;

        const log = {
            timestamp: new Date().toISOString(),
            level: "info" as const,
            message: `Notification created: ${notification.id}`,
            data: {
                type: notification.type,
                priority: notification.priority,
                channels: notification.channels,
                title: notification.title,
            },
        };

        this.logs.push(log);
        console.log(`[Notification Dev] ${log.message}`, log.data);
    }

    /**
     * Logs notification delivery
     */
    logDelivery(notification: Notification, result: DeliveryResult): void {
        if (!this.enabled) return;

        const log = {
            timestamp: new Date().toISOString(),
            level: result.success ? ("info" as const) : ("error" as const),
            message: `Notification ${result.success ? "delivered" : "failed"}: ${notification.id}`,
            data: {
                channel: result.channel,
                success: result.success,
                error: result.error,
            },
        };

        this.logs.push(log);
        console.log(`[Notification Dev] ${log.message}`, log.data);
    }

    /**
     * Logs preference changes
     */
    logPreferenceChange(userId: string, changes: any): void {
        if (!this.enabled) return;

        const log = {
            timestamp: new Date().toISOString(),
            level: "info" as const,
            message: `Preferences updated for user: ${userId}`,
            data: changes,
        };

        this.logs.push(log);
        console.log(`[Notification Dev] ${log.message}`, log.data);
    }

    /**
     * Logs errors
     */
    logError(error: Error, context?: any): void {
        if (!this.enabled) return;

        const log = {
            timestamp: new Date().toISOString(),
            level: "error" as const,
            message: `Error: ${error.message}`,
            data: {
                error: error.stack,
                context,
            },
        };

        this.logs.push(log);
        console.error(`[Notification Dev] ${log.message}`, log.data);
    }

    /**
     * Gets all logs
     */
    getLogs(): typeof this.logs {
        return this.logs;
    }

    /**
     * Clears all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Enables or disables logging
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Exports logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

// ============================================================================
// Test Notification Generator
// ============================================================================

/**
 * Generates test notifications for development and testing
 */
export class TestNotificationGenerator {
    /**
     * Generates a random test notification
     */
    generateTestNotification(userId: string, overrides?: Partial<CreateNotificationRequest>): CreateNotificationRequest {
        const types = Object.values(NotificationType);
        const priorities = Object.values(NotificationPriority);
        const channels = Object.values(NotificationChannel);

        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomChannels = this.getRandomChannels(channels);

        return {
            userId,
            type: randomType,
            priority: randomPriority,
            title: this.generateTitle(randomType),
            content: this.generateContent(randomType),
            channels: randomChannels,
            actionUrl: "/dashboard",
            actionText: "View Details",
            ...overrides,
        };
    }

    /**
     * Generates multiple test notifications
     */
    generateTestNotifications(userId: string, count: number): CreateNotificationRequest[] {
        return Array.from({ length: count }, () => this.generateTestNotification(userId));
    }

    /**
     * Generates a test notification for each type
     */
    generateAllTypes(userId: string): CreateNotificationRequest[] {
        return Object.values(NotificationType).map(type => ({
            userId,
            type,
            priority: NotificationPriority.MEDIUM,
            title: this.generateTitle(type),
            content: this.generateContent(type),
            channels: [NotificationChannel.IN_APP],
        }));
    }

    private getRandomChannels(channels: NotificationChannel[]): NotificationChannel[] {
        const count = Math.floor(Math.random() * channels.length) + 1;
        const shuffled = [...channels].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    private generateTitle(type: NotificationType): string {
        const titles: Record<NotificationType, string> = {
            [NotificationType.SYSTEM]: "System Update Available",
            [NotificationType.ALERT]: "Important Alert",
            [NotificationType.REMINDER]: "Reminder: Upcoming Task",
            [NotificationType.ACHIEVEMENT]: "Achievement Unlocked!",
            [NotificationType.ANNOUNCEMENT]: "New Feature Announcement",
            [NotificationType.TASK_COMPLETION]: "Task Completed Successfully",
            [NotificationType.FEATURE_UPDATE]: "Feature Update Released",
        };
        return titles[type];
    }

    private generateContent(type: NotificationType): string {
        const contents: Record<NotificationType, string> = {
            [NotificationType.SYSTEM]: "A new system update is available. Please review the changes.",
            [NotificationType.ALERT]: "This is an important alert that requires your attention.",
            [NotificationType.REMINDER]: "You have an upcoming task scheduled for today.",
            [NotificationType.ACHIEVEMENT]: "Congratulations! You've reached a new milestone.",
            [NotificationType.ANNOUNCEMENT]: "We're excited to announce a new feature for you to try.",
            [NotificationType.TASK_COMPLETION]: "Your task has been completed successfully.",
            [NotificationType.FEATURE_UPDATE]: "A new feature update has been released with improvements.",
        };
        return contents[type];
    }
}

// ============================================================================
// Singleton Instances
// ============================================================================

let previewGeneratorInstance: NotificationPreviewGenerator | null = null;
let devLoggerInstance: NotificationDevLogger | null = null;
let testGeneratorInstance: TestNotificationGenerator | null = null;

export function getNotificationPreviewGenerator(): NotificationPreviewGenerator {
    if (!previewGeneratorInstance) {
        previewGeneratorInstance = new NotificationPreviewGenerator();
    }
    return previewGeneratorInstance;
}

export function getNotificationDevLogger(): NotificationDevLogger {
    if (!devLoggerInstance) {
        devLoggerInstance = new NotificationDevLogger();
    }
    return devLoggerInstance;
}

export function getTestNotificationGenerator(): TestNotificationGenerator {
    if (!testGeneratorInstance) {
        testGeneratorInstance = new TestNotificationGenerator();
    }
    return testGeneratorInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Creates a mock notification service for testing
 */
export function createMockNotificationService(): NotificationService {
    // This would return a service configured with mock handlers
    // Implementation depends on your testing needs
    throw new Error("Not implemented - use MockChannelHandler directly");
}

/**
 * Sends a test notification in development mode
 */
export async function sendTestNotification(
    service: NotificationService,
    userId: string,
    overrides?: Partial<CreateNotificationRequest>
): Promise<Notification> {
    const generator = getTestNotificationGenerator();
    const request = generator.generateTestNotification(userId, overrides);
    return service.createNotification(request);
}
