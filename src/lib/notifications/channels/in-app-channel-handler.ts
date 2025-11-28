/**
 * In-App Channel Handler
 * 
 * Handles delivery of in-app notifications.
 * Stores notifications in database and broadcasts real-time updates.
 * Validates Requirements: 2.1, 2.2
 */

import {
    Notification,
    NotificationPreferences,
    NotificationRecipient,
    DeliveryResult,
    DeliveryStatus,
    FormattedContent,
    NotificationTemplate,
    NotificationChannel,
} from "../types";
import { BaseChannelHandler } from "./base-channel-handler";
import { getNotificationRepository } from "../repository";
import { getNotificationBroadcaster } from "../realtime/notification-broadcaster";

/**
 * In-App Channel Handler
 * Delivers notifications within the application interface
 */
export class InAppChannelHandler extends BaseChannelHandler {
    readonly channel = NotificationChannel.IN_APP;

    private repository = getNotificationRepository();

    /**
     * Delivers an in-app notification
     * Stores the notification in the database and broadcasts it for real-time display
     * 
     * @param notification Notification to deliver
     * @param recipient Recipient information
     * @returns Delivery result
     */
    async deliver(
        notification: Notification,
        recipient: NotificationRecipient
    ): Promise<DeliveryResult> {
        try {
            // Validate recipient
            this.validateRecipient(recipient, ['userId']);

            // Format content for in-app display
            const formattedContent = await this.formatContent(notification);

            // The notification is already stored in the database by the service
            // We just need to mark it as delivered for the in-app channel

            // Broadcast notification for real-time updates
            await this.broadcastNotification(notification, recipient.userId);

            // Log delivery attempt
            const result = this.createSuccessResult(notification.id, {
                formattedContent,
            });
            this.logDeliveryAttempt(notification, recipient, result);

            return result;
        } catch (error) {
            const result = this.createFailureResult(
                error instanceof Error ? error.message : "Failed to deliver in-app notification"
            );
            this.logDeliveryAttempt(notification, recipient, result);
            return result;
        }
    }

    /**
     * Validates delivery of an in-app notification
     * Checks if the notification exists in the database
     * 
     * @param deliveryId Notification ID (same as delivery ID for in-app)
     * @returns Delivery status
     */
    async validateDelivery(deliveryId: string): Promise<DeliveryStatus> {
        try {
            const notification = await this.repository.getNotification(deliveryId);

            if (!notification) {
                return DeliveryStatus.FAILED;
            }

            // Map notification status to delivery status
            switch (notification.status) {
                case "pending":
                    return DeliveryStatus.PENDING;
                case "sent":
                case "delivered":
                    return DeliveryStatus.DELIVERED;
                case "read":
                    return DeliveryStatus.DELIVERED;
                case "dismissed":
                    return DeliveryStatus.DELIVERED;
                case "expired":
                    return DeliveryStatus.FAILED;
                default:
                    return DeliveryStatus.PENDING;
            }
        } catch (error) {
            console.error('[In-App Handler] Failed to validate delivery:', error);
            return DeliveryStatus.FAILED;
        }
    }

    /**
     * Formats notification content for in-app display
     * 
     * @param notification Notification to format
     * @param template Optional template (not used for in-app)
     * @returns Formatted content
     */
    async formatContent(
        notification: Notification,
        template?: NotificationTemplate
    ): Promise<FormattedContent> {
        // For in-app notifications, we use the notification content directly
        // but sanitize it to prevent XSS
        const sanitizedTitle = this.sanitizeContent(notification.title);
        const sanitizedContent = this.sanitizeContent(notification.content);

        // Truncate if too long for in-app display
        const truncatedContent = this.truncateContent(sanitizedContent, 200);

        return {
            subject: sanitizedTitle,
            body: truncatedContent,
            data: {
                id: notification.id,
                type: notification.type,
                priority: notification.priority,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                metadata: notification.metadata,
                createdAt: notification.createdAt,
            },
        };
    }

    /**
     * Checks if in-app channel is enabled in preferences
     * 
     * @param preferences User preferences
     * @returns True if enabled
     */
    protected isChannelEnabled(preferences: NotificationPreferences): boolean {
        return preferences.channels.inApp.enabled;
    }

    /**
     * Checks if notification type is allowed for in-app channel
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if allowed
     */
    protected isNotificationTypeAllowed(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
        return preferences.channels.inApp.types.includes(notification.type);
    }

    /**
     * Broadcasts notification for real-time updates
     * Uses Server-Sent Events (SSE) to push notifications to connected clients
     * 
     * @param notification Notification to broadcast
     * @param userId User ID to broadcast to
     */
    private async broadcastNotification(
        notification: Notification,
        userId: string
    ): Promise<void> {
        try {
            const broadcaster = getNotificationBroadcaster();
            await broadcaster.broadcastToUser(userId, notification);

            console.log(
                `[In-App Handler] Broadcasted notification ${notification.id} to user ${userId}`
            );
        } catch (error) {
            // Log error but don't fail delivery - notification is still stored in DB
            console.error(
                `[In-App Handler] Failed to broadcast notification ${notification.id}:`,
                error
            );
        }
    }
}

/**
 * Singleton instance of the in-app channel handler
 */
let inAppChannelHandler: InAppChannelHandler | null = null;

/**
 * Gets the in-app channel handler instance
 * @returns InAppChannelHandler instance
 */
export function getInAppChannelHandler(): InAppChannelHandler {
    if (!inAppChannelHandler) {
        inAppChannelHandler = new InAppChannelHandler();
    }
    return inAppChannelHandler;
}

/**
 * Resets the in-app channel handler instance
 * Useful for testing
 */
export function resetInAppChannelHandler(): void {
    inAppChannelHandler = null;
}
