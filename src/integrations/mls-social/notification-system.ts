/**
 * Error Notification System
 * 
 * Provides user notifications for critical failures and important events.
 * Integrates with the application's toast notification system.
 * 
 * Requirements Coverage:
 * - 1.3: Display clear error messages for authentication failures
 * - 2.4: Notify users of import failures
 * - 6.3: Display OAuth failure messages
 * - 7.5: Notify users of failed posts
 * - 10.5: Notify users of image optimization failures
 */

import { createLogger } from '@/aws/logging';
import { MLSSocialError, ErrorSeverity, ErrorCategory } from './error-handler';

/**
 * Notification types
 */
export enum NotificationType {
    SUCCESS = 'SUCCESS',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

/**
 * Notification message
 */
export interface Notification {
    type: NotificationType;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number; // Duration in milliseconds (0 = persistent)
}

/**
 * Notification handler interface
 * This will be implemented by the UI layer
 */
export interface NotificationHandler {
    show(notification: Notification): void;
    dismiss(notificationId: string): void;
}

/**
 * Notification system class
 */
export class NotificationSystem {
    private logger = createLogger({ service: 'notification-system' });
    private handler: NotificationHandler | null = null;

    /**
     * Set the notification handler (called by UI layer)
     */
    setHandler(handler: NotificationHandler): void {
        this.handler = handler;
    }

    /**
     * Show a notification for an error
     * Automatically determines notification type and message based on error
     */
    notifyError(error: MLSSocialError, context?: Record<string, any>): void {
        const notification = this.createErrorNotification(error, context);
        this.show(notification);
    }

    /**
     * Show a success notification
     */
    notifySuccess(title: string, message: string, duration: number = 5000): void {
        this.show({
            type: NotificationType.SUCCESS,
            title,
            message,
            duration,
        });
    }

    /**
     * Show an info notification
     */
    notifyInfo(title: string, message: string, duration: number = 5000): void {
        this.show({
            type: NotificationType.INFO,
            title,
            message,
            duration,
        });
    }

    /**
     * Show a warning notification
     */
    notifyWarning(title: string, message: string, duration: number = 7000): void {
        this.show({
            type: NotificationType.WARNING,
            title,
            message,
            duration,
        });
    }

    /**
     * Show a notification
     */
    private show(notification: Notification): void {
        if (!this.handler) {
            // Fallback to console if no handler is set
            this.logger.warn('No notification handler set, logging to console', {
                notification,
            });
            console.log(`[${notification.type}] ${notification.title}: ${notification.message}`);
            return;
        }

        this.handler.show(notification);
    }

    /**
     * Create an error notification from an MLSSocialError
     */
    private createErrorNotification(
        error: MLSSocialError,
        context?: Record<string, any>
    ): Notification {
        const notification: Notification = {
            type: this.mapSeverityToType(error.severity),
            title: this.getErrorTitle(error.category),
            message: error.userMessage,
            duration: this.getNotificationDuration(error.severity),
        };

        // Add retry action for retryable errors
        if (error.retryable && context?.retryAction) {
            notification.action = {
                label: 'Retry',
                onClick: context.retryAction,
            };
        }

        // Add reconnect action for authentication errors
        if (
            error.category === ErrorCategory.AUTHENTICATION &&
            context?.reconnectAction
        ) {
            notification.action = {
                label: 'Reconnect',
                onClick: context.reconnectAction,
            };
        }

        return notification;
    }

    /**
     * Map error severity to notification type
     */
    private mapSeverityToType(severity: ErrorSeverity): NotificationType {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                return NotificationType.ERROR;
            case ErrorSeverity.MEDIUM:
                return NotificationType.WARNING;
            case ErrorSeverity.LOW:
                return NotificationType.INFO;
        }
    }

    /**
     * Get notification duration based on severity
     */
    private getNotificationDuration(severity: ErrorSeverity): number {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                return 0; // Persistent
            case ErrorSeverity.HIGH:
                return 10000; // 10 seconds
            case ErrorSeverity.MEDIUM:
                return 7000; // 7 seconds
            case ErrorSeverity.LOW:
                return 5000; // 5 seconds
        }
    }

    /**
     * Get user-friendly error title based on category
     */
    private getErrorTitle(category: ErrorCategory): string {
        switch (category) {
            case ErrorCategory.AUTHENTICATION:
                return 'Authentication Failed';
            case ErrorCategory.NETWORK:
                return 'Connection Error';
            case ErrorCategory.VALIDATION:
                return 'Invalid Input';
            case ErrorCategory.RATE_LIMIT:
                return 'Rate Limit Reached';
            case ErrorCategory.PERMISSION:
                return 'Permission Denied';
            case ErrorCategory.NOT_FOUND:
                return 'Not Found';
            case ErrorCategory.TIMEOUT:
                return 'Request Timeout';
            case ErrorCategory.EXTERNAL_API:
                return 'Service Error';
            case ErrorCategory.INTERNAL:
                return 'System Error';
        }
    }

    /**
     * Notify about MLS connection success
     * Requirement 1.1: Successful connection notification
     */
    notifyMLSConnectionSuccess(provider: string): void {
        this.notifySuccess(
            'MLS Connected',
            `Successfully connected to ${provider}. Your listings will be imported shortly.`
        );
    }

    /**
     * Notify about MLS import completion
     * Requirement 2.1: Import completion notification
     */
    notifyMLSImportComplete(
        successCount: number,
        failedCount: number,
        totalCount: number
    ): void {
        if (failedCount === 0) {
            this.notifySuccess(
                'Import Complete',
                `Successfully imported ${successCount} listing${successCount !== 1 ? 's' : ''}.`
            );
        } else if (successCount > 0) {
            this.notifyWarning(
                'Import Partially Complete',
                `Imported ${successCount} of ${totalCount} listings. ${failedCount} failed.`
            );
        } else {
            this.show({
                type: NotificationType.ERROR,
                title: 'Import Failed',
                message: `Failed to import ${failedCount} listing${failedCount !== 1 ? 's' : ''}. Please try again.`,
                duration: 10000,
            });
        }
    }

    /**
     * Notify about OAuth connection success
     * Requirement 6.1: Successful OAuth connection notification
     */
    notifyOAuthConnectionSuccess(platform: string): void {
        this.notifySuccess(
            'Account Connected',
            `Successfully connected your ${platform} account. You can now publish listings.`
        );
    }

    /**
     * Notify about social media publishing success
     * Requirement 7.3: Successful publishing notification
     */
    notifyPublishingSuccess(
        platforms: string[],
        listingAddress: string
    ): void {
        const platformList = platforms.join(', ');
        this.notifySuccess(
            'Published Successfully',
            `Your listing at ${listingAddress} has been published to ${platformList}.`
        );
    }

    /**
     * Notify about social media publishing partial success
     * Requirement 7.5: Partial publishing notification
     */
    notifyPublishingPartialSuccess(
        successPlatforms: string[],
        failedPlatforms: string[],
        listingAddress: string
    ): void {
        this.notifyWarning(
            'Partially Published',
            `Published to ${successPlatforms.join(', ')} but failed on ${failedPlatforms.join(', ')} for ${listingAddress}.`
        );
    }

    /**
     * Notify about image optimization failure
     * Requirement 10.5: Image optimization failure notification
     */
    notifyImageOptimizationFailure(
        failedCount: number,
        totalCount: number
    ): void {
        this.notifyWarning(
            'Image Optimization Issue',
            `${failedCount} of ${totalCount} images could not be optimized. Proceeding with remaining images.`
        );
    }

    /**
     * Notify about status sync completion
     * Requirement 5.1: Status sync notification
     */
    notifyStatusSyncComplete(updatedCount: number): void {
        if (updatedCount > 0) {
            this.notifyInfo(
                'Listings Updated',
                `${updatedCount} listing${updatedCount !== 1 ? 's' : ''} updated from MLS.`
            );
        }
    }

    /**
     * Notify about listing sold and posts unpublished
     * Requirement 5.3: Sold status notification
     */
    notifyListingSoldAndUnpublished(listingAddress: string): void {
        this.notifyInfo(
            'Listing Sold',
            `${listingAddress} has been marked as sold and removed from social media.`,
            7000
        );
    }
}

/**
 * Singleton notification system instance
 */
let notificationSystemInstance: NotificationSystem | null = null;

/**
 * Get the notification system instance
 */
export function getNotificationSystem(): NotificationSystem {
    if (!notificationSystemInstance) {
        notificationSystemInstance = new NotificationSystem();
    }
    return notificationSystemInstance;
}

/**
 * Convenience functions for common notifications
 */

export function notifyError(error: MLSSocialError, context?: Record<string, any>): void {
    getNotificationSystem().notifyError(error, context);
}

export function notifySuccess(title: string, message: string): void {
    getNotificationSystem().notifySuccess(title, message);
}

export function notifyWarning(title: string, message: string): void {
    getNotificationSystem().notifyWarning(title, message);
}

export function notifyInfo(title: string, message: string): void {
    getNotificationSystem().notifyInfo(title, message);
}
