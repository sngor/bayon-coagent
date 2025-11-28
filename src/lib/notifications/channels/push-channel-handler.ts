/**
 * Push Channel Handler
 * 
 * Handles delivery of browser push notifications using Web Push API.
 * Supports subscription management, validation, and delivery.
 * Validates Requirements: 5.1, 5.2, 5.3
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
    PushSubscriptionJSON,
} from "../types";
import { BaseChannelHandler } from "./base-channel-handler";
import webpush from "web-push";
import {
    createNotificationError,
    ErrorCodes,
    withErrorHandling,
} from "../errors";
import { getPermissionManager } from "../permission-manager";

/**
 * Push notification payload
 */
interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
    }>;
    tag?: string;
    requireInteraction?: boolean;
}

/**
 * Push Channel Handler
 * Delivers notifications via browser push notifications
 */
export class PushChannelHandler extends BaseChannelHandler {
    readonly channel = NotificationChannel.PUSH;

    private readonly vapidPublicKey: string;
    private readonly vapidPrivateKey: string;
    private readonly vapidSubject: string;
    private readonly appUrl: string;
    private readonly iconUrl: string;
    private readonly badgeUrl: string;

    constructor() {
        super();

        // VAPID keys for Web Push authentication
        this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
        this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
        this.vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@bayoncoagent.com';
        this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        this.iconUrl = `${this.appUrl}/icon-192x192.svg`;
        this.badgeUrl = `${this.appUrl}/favicon.svg`;

        // Configure web-push with VAPID details
        if (this.vapidPublicKey && this.vapidPrivateKey) {
            webpush.setVapidDetails(
                this.vapidSubject,
                this.vapidPublicKey,
                this.vapidPrivateKey
            );
        } else {
            console.warn('[Push Handler] VAPID keys not configured. Push notifications will not work.');
        }
    }

    /**
     * Delivers a push notification
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
            // Validate recipient has push subscription
            this.validateRecipient(recipient, ['userId']);

            if (!recipient.pushSubscription) {
                throw createNotificationError(
                    ErrorCodes.MISSING_REQUIRED_FIELD,
                    'Recipient push subscription is required',
                    { userId: recipient.userId, notificationId: notification.id }
                );
            }

            // Check permission compliance - Validates Requirements: 5.1, 5.5
            const permissionManager = getPermissionManager();
            const canSendPush = await permissionManager.canSendPushNotification(recipient.userId);

            if (!canSendPush) {
                return this.createSuccessResult(undefined, {
                    skipped: true,
                    reason: 'User has revoked push notification permission',
                });
            }

            // Validate VAPID keys are configured
            if (!this.vapidPublicKey || !this.vapidPrivateKey) {
                throw createNotificationError(
                    ErrorCodes.MISSING_CONFIGURATION,
                    'VAPID keys not configured',
                    { notificationId: notification.id }
                );
            }

            // Validate push subscription
            if (!this.isValidPushSubscription(recipient.pushSubscription)) {
                throw createNotificationError(
                    ErrorCodes.PUSH_SUBSCRIPTION_INVALID,
                    'Invalid push subscription format',
                    {
                        userId: recipient.userId,
                        notificationId: notification.id,
                        endpoint: recipient.pushSubscription.endpoint,
                    }
                );
            }

            // Format content for push notification
            const formattedContent = await this.formatContent(notification);

            // Create push payload
            const payload = this.createPushPayload(notification, formattedContent);

            // Convert PushSubscriptionJSON to web-push format
            const subscription = {
                endpoint: recipient.pushSubscription.endpoint,
                keys: {
                    p256dh: recipient.pushSubscription.keys.p256dh,
                    auth: recipient.pushSubscription.keys.auth,
                },
            };

            // Send push notification with error handling
            const response = await withErrorHandling(
                async () => webpush.sendNotification(
                    subscription,
                    JSON.stringify(payload),
                    {
                        TTL: 86400, // 24 hours
                        urgency: this.getUrgency(notification.priority),
                    }
                ),
                ErrorCodes.PUSH_DELIVERY_FAILED,
                {
                    notificationId: notification.id,
                    userId: recipient.userId,
                    endpoint: recipient.pushSubscription.endpoint,
                }
            );

            // Log delivery attempt
            const result = this.createSuccessResult(notification.id, {
                statusCode: response.statusCode,
                endpoint: recipient.pushSubscription.endpoint,
            });
            this.logDeliveryAttempt(notification, recipient, result);

            return result;
        } catch (error: any) {
            // Handle specific push errors
            let errorCode: string = ErrorCodes.PUSH_DELIVERY_FAILED;
            let errorMessage = error instanceof Error ? error.message : "Failed to deliver push notification";
            let shouldRetry = true;

            // Check for subscription expiration or invalid subscription
            if (error.statusCode === 410 || error.statusCode === 404) {
                errorCode = ErrorCodes.PUSH_SUBSCRIPTION_EXPIRED;
                errorMessage = 'Push subscription expired or invalid';
                shouldRetry = false;
            } else if (error.statusCode === 429) {
                errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
                errorMessage = 'Push service rate limit exceeded';
            } else if (error.statusCode === 413) {
                errorCode = ErrorCodes.CONTENT_TOO_LARGE;
                errorMessage = 'Push payload too large';
                shouldRetry = false;
            }

            const result = this.createFailureResult(errorMessage, {
                statusCode: error.statusCode,
                shouldRetry,
                errorCode,
            });
            this.logDeliveryAttempt(notification, recipient, result);
            return result;
        }
    }

    /**
     * Validates delivery of a push notification
     * For push notifications, we rely on the initial send response
     * 
     * @param deliveryId Notification ID
     * @returns Delivery status
     */
    async validateDelivery(deliveryId: string): Promise<DeliveryStatus> {
        // Push notifications don't have a way to validate delivery after sending
        // We rely on the initial send response and error codes
        // If we got a successful response, we consider it delivered
        return DeliveryStatus.SENT;
    }

    /**
     * Formats notification content for push delivery
     * 
     * @param notification Notification to format
     * @param template Optional template (not used for push)
     * @returns Formatted content
     */
    async formatContent(
        notification: Notification,
        template?: NotificationTemplate
    ): Promise<FormattedContent> {
        // For push notifications, we need concise content
        const sanitizedTitle = this.sanitizeContent(notification.title);
        const sanitizedContent = this.sanitizeContent(notification.content);

        // Truncate content for push notification (max 120 chars for body)
        const truncatedContent = this.truncateContent(sanitizedContent, 120);

        return {
            subject: sanitizedTitle,
            body: truncatedContent,
            data: {
                notificationId: notification.id,
                actionUrl: notification.actionUrl,
                type: notification.type,
                priority: notification.priority,
                timestamp: notification.createdAt,
            } as Record<string, any>,
        };
    }

    /**
     * Checks if push channel is enabled in preferences
     * 
     * @param preferences User preferences
     * @returns True if enabled
     */
    protected isChannelEnabled(preferences: NotificationPreferences): boolean {
        return preferences.channels.push.enabled;
    }

    /**
     * Checks if notification type is allowed for push channel
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if allowed
     */
    protected isNotificationTypeAllowed(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
        return preferences.channels.push.types.includes(notification.type);
    }

    // ============================================================================
    // Push Notification Helper Methods
    // ============================================================================

    /**
     * Creates a push notification payload
     * 
     * @param notification Notification
     * @param formattedContent Formatted content
     * @returns Push payload
     */
    private createPushPayload(
        notification: Notification,
        formattedContent: FormattedContent
    ): PushPayload {
        const payload: PushPayload = {
            title: formattedContent.subject || notification.title,
            body: formattedContent.body,
            icon: this.iconUrl,
            badge: this.badgeUrl,
            data: formattedContent.data,
            tag: notification.id,
        };

        // Add action button if notification has an action
        if (notification.actionUrl && notification.actionText) {
            payload.actions = [
                {
                    action: 'open',
                    title: notification.actionText,
                },
            ];
        }

        // Critical notifications require interaction
        if (notification.priority === 'critical') {
            payload.requireInteraction = true;
        }

        return payload;
    }

    /**
     * Gets urgency level for push notification
     * Maps notification priority to Web Push urgency
     * 
     * @param priority Notification priority
     * @returns Web Push urgency level
     */
    private getUrgency(priority: string): 'very-low' | 'low' | 'normal' | 'high' {
        switch (priority) {
            case 'critical':
                return 'high';
            case 'high':
                return 'high';
            case 'medium':
                return 'normal';
            case 'low':
                return 'low';
            default:
                return 'normal';
        }
    }

    /**
     * Validates push subscription format
     * 
     * @param subscription Push subscription to validate
     * @returns True if valid
     */
    private isValidPushSubscription(subscription: PushSubscriptionJSON): boolean {
        if (!subscription || typeof subscription !== 'object') {
            return false;
        }

        // Check required fields
        if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
            return false;
        }

        if (!subscription.keys || typeof subscription.keys !== 'object') {
            return false;
        }

        if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== 'string') {
            return false;
        }

        if (!subscription.keys.auth || typeof subscription.keys.auth !== 'string') {
            return false;
        }

        // Validate endpoint is a valid URL
        try {
            new URL(subscription.endpoint);
        } catch {
            return false;
        }

        return true;
    }

    // ============================================================================
    // Subscription Management Methods
    // ============================================================================

    /**
     * Validates a push subscription by sending a test notification
     * 
     * @param subscription Push subscription to validate
     * @returns True if subscription is valid and active
     */
    async validateSubscription(subscription: PushSubscriptionJSON): Promise<boolean> {
        try {
            if (!this.isValidPushSubscription(subscription)) {
                return false;
            }

            // Send a test notification with empty payload
            const webPushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            };

            await webpush.sendNotification(
                webPushSubscription,
                JSON.stringify({
                    title: 'Test',
                    body: 'Subscription validation',
                    silent: true,
                }),
                {
                    TTL: 60,
                }
            );

            return true;
        } catch (error: any) {
            // 410 = subscription expired
            // 404 = subscription not found
            if (error.statusCode === 410 || error.statusCode === 404) {
                return false;
            }

            // Other errors might be temporary, so we consider subscription valid
            console.warn('[Push Handler] Subscription validation error:', error);
            return true;
        }
    }

    /**
     * Checks if a push subscription has expired
     * 
     * @param subscription Push subscription to check
     * @returns True if subscription has expired
     */
    async isSubscriptionExpired(subscription: PushSubscriptionJSON): Promise<boolean> {
        const isValid = await this.validateSubscription(subscription);
        return !isValid;
    }

    // ============================================================================
    // VAPID Key Generation (Utility)
    // ============================================================================

    /**
     * Generates VAPID keys for Web Push
     * This should be run once during setup and keys stored in environment variables
     * 
     * @returns VAPID key pair
     */
    static generateVapidKeys(): { publicKey: string; privateKey: string } {
        const vapidKeys = webpush.generateVAPIDKeys();
        return {
            publicKey: vapidKeys.publicKey,
            privateKey: vapidKeys.privateKey,
        };
    }

    /**
     * Gets the public VAPID key for client-side subscription
     * 
     * @returns Public VAPID key
     */
    getPublicVapidKey(): string {
        return this.vapidPublicKey;
    }
}

/**
 * Singleton instance of the push channel handler
 */
let pushChannelHandler: PushChannelHandler | null = null;

/**
 * Gets the push channel handler instance
 * @returns PushChannelHandler instance
 */
export function getPushChannelHandler(): PushChannelHandler {
    if (!pushChannelHandler) {
        pushChannelHandler = new PushChannelHandler();
    }
    return pushChannelHandler;
}

/**
 * Resets the push channel handler instance
 * Useful for testing
 */
export function resetPushChannelHandler(): void {
    pushChannelHandler = null;
}
