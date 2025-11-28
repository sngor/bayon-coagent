/**
 * Base Channel Handler
 * 
 * Abstract base class and interface for notification channel handlers.
 * Provides common functionality for all delivery channels.
 * Validates Requirements: 1.2, 1.3
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

/**
 * Channel Handler Interface
 * Defines the contract that all channel handlers must implement
 */
export interface ChannelHandler {
    /**
     * Gets the channel type this handler manages
     */
    readonly channel: NotificationChannel;

    /**
     * Checks if this handler can deliver the notification
     * based on user preferences and notification requirements
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if handler can deliver this notification
     */
    canHandle(notification: Notification, preferences: NotificationPreferences): boolean;

    /**
     * Delivers a notification to the recipient
     * 
     * @param notification Notification to deliver
     * @param recipient Recipient information
     * @returns Delivery result with success status and details
     */
    deliver(notification: Notification, recipient: NotificationRecipient): Promise<DeliveryResult>;

    /**
     * Validates that a delivery was successful
     * 
     * @param deliveryId Delivery ID to validate
     * @returns Current delivery status
     */
    validateDelivery(deliveryId: string): Promise<DeliveryStatus>;

    /**
     * Formats notification content for this channel
     * 
     * @param notification Notification to format
     * @param template Optional template to use
     * @returns Formatted content ready for delivery
     */
    formatContent(
        notification: Notification,
        template?: NotificationTemplate
    ): Promise<FormattedContent>;
}

/**
 * Base Channel Handler
 * Abstract base class providing common functionality for all channel handlers
 */
export abstract class BaseChannelHandler implements ChannelHandler {
    abstract readonly channel: NotificationChannel;

    /**
     * Checks if this handler can deliver the notification
     * Default implementation checks if channel is enabled and notification type is allowed
     */
    canHandle(notification: Notification, preferences: NotificationPreferences): boolean {
        // Check if notification includes this channel
        if (!notification.channels.includes(this.channel)) {
            return false;
        }

        // Check if channel is enabled in preferences
        if (!this.isChannelEnabled(preferences)) {
            return false;
        }

        // Check if notification type is allowed for this channel
        if (!this.isNotificationTypeAllowed(notification, preferences)) {
            return false;
        }

        // Check do not disturb mode
        if (preferences.globalSettings.doNotDisturb) {
            // Critical notifications bypass DND
            if (notification.priority !== "critical") {
                return false;
            }
        }

        return true;
    }

    /**
     * Abstract method for delivering notifications
     * Must be implemented by concrete channel handlers
     */
    abstract deliver(
        notification: Notification,
        recipient: NotificationRecipient
    ): Promise<DeliveryResult>;

    /**
     * Abstract method for validating delivery
     * Must be implemented by concrete channel handlers
     */
    abstract validateDelivery(deliveryId: string): Promise<DeliveryStatus>;

    /**
     * Abstract method for formatting content
     * Must be implemented by concrete channel handlers
     */
    abstract formatContent(
        notification: Notification,
        template?: NotificationTemplate
    ): Promise<FormattedContent>;

    // ============================================================================
    // Protected Helper Methods
    // ============================================================================

    /**
     * Checks if the channel is enabled in user preferences
     * 
     * @param preferences User preferences
     * @returns True if channel is enabled
     */
    protected abstract isChannelEnabled(preferences: NotificationPreferences): boolean;

    /**
     * Checks if the notification type is allowed for this channel
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if notification type is allowed
     */
    protected abstract isNotificationTypeAllowed(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean;

    /**
     * Creates a successful delivery result
     * 
     * @param deliveryId Optional delivery ID
     * @param metadata Optional metadata
     * @returns Delivery result
     */
    protected createSuccessResult(
        deliveryId?: string,
        metadata?: Record<string, any>
    ): DeliveryResult {
        return {
            success: true,
            channel: this.channel,
            deliveryId,
            timestamp: new Date().toISOString(),
            ...metadata,
        };
    }

    /**
     * Creates a failed delivery result
     * 
     * @param error Error message
     * @param metadata Optional metadata
     * @returns Delivery result
     */
    protected createFailureResult(
        error: string,
        metadata?: Record<string, any>
    ): DeliveryResult {
        return {
            success: false,
            channel: this.channel,
            error,
            timestamp: new Date().toISOString(),
            ...metadata,
        };
    }

    /**
     * Sanitizes content to prevent XSS and injection attacks
     * 
     * @param content Content to sanitize
     * @returns Sanitized content
     */
    protected sanitizeContent(content: string): string {
        // Remove HTML tags
        let sanitized = content.replace(/<[^>]*>/g, '');

        // Remove script tags and their content
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    /**
     * Truncates content to a maximum length
     * 
     * @param content Content to truncate
     * @param maxLength Maximum length
     * @param suffix Suffix to add if truncated (default: '...')
     * @returns Truncated content
     */
    protected truncateContent(
        content: string,
        maxLength: number,
        suffix: string = '...'
    ): string {
        if (content.length <= maxLength) {
            return content;
        }

        return content.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Validates that required recipient information is present
     * 
     * @param recipient Recipient to validate
     * @param requiredFields Fields that must be present
     * @throws Error if validation fails
     */
    protected validateRecipient(
        recipient: NotificationRecipient,
        requiredFields: string[]
    ): void {
        for (const field of requiredFields) {
            const value = (recipient as any)[field];
            if (value === undefined || value === null || value === '') {
                throw new Error(`Missing required recipient field: ${field}`);
            }
        }
    }

    /**
     * Logs delivery attempt for debugging and monitoring
     * 
     * @param notification Notification being delivered
     * @param recipient Recipient information
     * @param result Delivery result
     */
    protected logDeliveryAttempt(
        notification: Notification,
        recipient: NotificationRecipient,
        result: DeliveryResult
    ): void {
        const logData = {
            channel: this.channel,
            notificationId: notification.id,
            userId: recipient.userId,
            success: result.success,
            error: result.error,
            timestamp: result.timestamp,
        };

        if (result.success) {
            console.log('[Channel Handler] Delivery successful:', logData);
        } else {
            console.error('[Channel Handler] Delivery failed:', logData);
        }
    }
}
