/**
 * Notification Error Handling System
 * 
 * Defines error types, categorization, and error handling logic.
 * Validates Requirements: 6.2, 6.4
 */

import { NotificationChannel } from "./types";

/**
 * Error categories for notification system
 */
export enum ErrorCategory {
    VALIDATION = "validation",
    DELIVERY = "delivery",
    SYSTEM = "system",
    RATE_LIMIT = "rate_limit",
    PERMISSION = "permission",
    NETWORK = "network",
    CONFIGURATION = "configuration",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

/**
 * Notification error interface
 */
export interface NotificationError {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
    context?: Record<string, any>;
    timestamp: string;
    originalError?: Error;
}

/**
 * Notification Error Class
 * Extends Error to be throwable
 */
export class NotificationErrorClass extends Error implements NotificationError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
    context?: Record<string, any>;
    timestamp: string;
    originalError?: Error;

    constructor(error: NotificationError) {
        super(error.message);
        this.name = "NotificationError";
        this.code = error.code;
        this.category = error.category;
        this.severity = error.severity;
        this.retryable = error.retryable;
        this.context = error.context;
        this.timestamp = error.timestamp;
        this.originalError = error.originalError;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotificationErrorClass);
        }
    }
}

/**
 * Error resolution result
 */
export interface ErrorResolution {
    resolved: boolean;
    action: "retry" | "escalate" | "ignore" | "fallback";
    retryDelay?: number;
    fallbackChannel?: NotificationChannel;
    message: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number;
}

/**
 * Default retry configuration
 * Exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 6,
    baseDelay: 60000, // 1 minute
    maxDelay: 1920000, // 32 minutes
    backoffMultiplier: 2,
};

/**
 * Error code definitions
 */
export const ErrorCodes = {
    // Validation errors (1xxx)
    INVALID_REQUEST: "1001",
    MISSING_REQUIRED_FIELD: "1002",
    INVALID_FORMAT: "1003",
    CONTENT_TOO_LARGE: "1004",

    // Delivery errors (2xxx)
    EMAIL_DELIVERY_FAILED: "2001",
    EMAIL_BOUNCE: "2002",
    EMAIL_COMPLAINT: "2003",
    PUSH_DELIVERY_FAILED: "2004",
    PUSH_SUBSCRIPTION_EXPIRED: "2005",
    PUSH_SUBSCRIPTION_INVALID: "2006",
    IN_APP_DELIVERY_FAILED: "2007",

    // System errors (3xxx)
    DATABASE_ERROR: "3001",
    SERVICE_UNAVAILABLE: "3002",
    TIMEOUT: "3003",
    INTERNAL_ERROR: "3004",

    // Rate limiting errors (4xxx)
    RATE_LIMIT_EXCEEDED: "4001",
    QUOTA_EXCEEDED: "4002",

    // Permission errors (5xxx)
    INSUFFICIENT_PERMISSIONS: "5001",
    CHANNEL_DISABLED: "5002",
    USER_UNSUBSCRIBED: "5003",

    // Network errors (6xxx)
    NETWORK_ERROR: "6001",
    CONNECTION_TIMEOUT: "6002",
    DNS_ERROR: "6003",

    // Configuration errors (7xxx)
    MISSING_CONFIGURATION: "7001",
    INVALID_CONFIGURATION: "7002",
} as const;

/**
 * Creates a NotificationError from an error code
 * 
 * @param code Error code
 * @param message Custom error message
 * @param context Additional context
 * @param originalError Original error if available
 * @returns NotificationErrorClass (throwable Error)
 */
export function createNotificationError(
    code: string,
    message: string,
    context?: Record<string, any>,
    originalError?: Error
): NotificationErrorClass {
    const category = getErrorCategory(code);
    const severity = getErrorSeverity(code);
    const retryable = isErrorRetryable(code);

    return new NotificationErrorClass({
        code,
        message,
        category,
        severity,
        retryable,
        context,
        timestamp: new Date().toISOString(),
        originalError,
    });
}

/**
 * Gets error category from error code
 * 
 * @param code Error code
 * @returns Error category
 */
function getErrorCategory(code: string): ErrorCategory {
    const prefix = code.substring(0, 1);

    switch (prefix) {
        case "1":
            return ErrorCategory.VALIDATION;
        case "2":
            return ErrorCategory.DELIVERY;
        case "3":
            return ErrorCategory.SYSTEM;
        case "4":
            return ErrorCategory.RATE_LIMIT;
        case "5":
            return ErrorCategory.PERMISSION;
        case "6":
            return ErrorCategory.NETWORK;
        case "7":
            return ErrorCategory.CONFIGURATION;
        default:
            return ErrorCategory.SYSTEM;
    }
}

/**
 * Gets error severity from error code
 * 
 * @param code Error code
 * @returns Error severity
 */
function getErrorSeverity(code: string): ErrorSeverity {
    // Critical errors
    const criticalCodes = [
        ErrorCodes.SERVICE_UNAVAILABLE,
        ErrorCodes.DATABASE_ERROR,
        ErrorCodes.INTERNAL_ERROR,
    ];

    // High severity errors
    const highSeverityCodes = [
        ErrorCodes.EMAIL_BOUNCE,
        ErrorCodes.EMAIL_COMPLAINT,
        ErrorCodes.PUSH_SUBSCRIPTION_EXPIRED,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
    ];

    // Medium severity errors
    const mediumSeverityCodes = [
        ErrorCodes.EMAIL_DELIVERY_FAILED,
        ErrorCodes.PUSH_DELIVERY_FAILED,
        ErrorCodes.TIMEOUT,
        ErrorCodes.NETWORK_ERROR,
    ];

    if (criticalCodes.includes(code)) {
        return ErrorSeverity.CRITICAL;
    } else if (highSeverityCodes.includes(code)) {
        return ErrorSeverity.HIGH;
    } else if (mediumSeverityCodes.includes(code)) {
        return ErrorSeverity.MEDIUM;
    } else {
        return ErrorSeverity.LOW;
    }
}

/**
 * Checks if an error is retryable
 * 
 * @param code Error code
 * @returns True if error is retryable
 */
function isErrorRetryable(code: string): boolean {
    // Non-retryable errors
    const nonRetryableCodes = [
        ErrorCodes.INVALID_REQUEST,
        ErrorCodes.MISSING_REQUIRED_FIELD,
        ErrorCodes.INVALID_FORMAT,
        ErrorCodes.CONTENT_TOO_LARGE,
        ErrorCodes.EMAIL_BOUNCE,
        ErrorCodes.EMAIL_COMPLAINT,
        ErrorCodes.PUSH_SUBSCRIPTION_EXPIRED,
        ErrorCodes.PUSH_SUBSCRIPTION_INVALID,
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
        ErrorCodes.CHANNEL_DISABLED,
        ErrorCodes.USER_UNSUBSCRIBED,
        ErrorCodes.INVALID_CONFIGURATION,
    ];

    return !nonRetryableCodes.includes(code);
}

/**
 * Notification Error Handler
 * Handles error resolution, retry logic, and admin alerting
 */
export class NotificationErrorHandler {
    private retryConfig: RetryConfig;
    private adminAlertThreshold: number;
    private errorCounts: Map<string, number>;

    constructor(retryConfig?: Partial<RetryConfig>, adminAlertThreshold: number = 10) {
        this.retryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            ...retryConfig,
        };
        this.adminAlertThreshold = adminAlertThreshold;
        this.errorCounts = new Map();
    }

    /**
     * Handles an error and determines the appropriate resolution
     * 
     * @param error Notification error
     * @param notificationId Notification ID
     * @param attemptCount Current attempt count
     * @returns Error resolution
     */
    async handleError(
        error: NotificationError,
        notificationId: string,
        attemptCount: number
    ): Promise<ErrorResolution> {
        // Log the error
        this.logError(error, notificationId, attemptCount);

        // Track error count for admin alerting
        this.trackError(error);

        // Check if we should alert admin
        if (this.shouldAlertAdmin(error)) {
            await this.escalateToAdmin(error, notificationId);
        }

        // Determine resolution based on error type and attempt count
        if (!error.retryable) {
            return {
                resolved: false,
                action: "ignore",
                message: `Non-retryable error: ${error.message}`,
            };
        }

        if (!this.shouldRetry(error, attemptCount)) {
            return {
                resolved: false,
                action: "escalate",
                message: `Max retry attempts (${this.retryConfig.maxAttempts}) exceeded`,
            };
        }

        // Calculate retry delay
        const retryDelay = this.getRetryDelay(attemptCount);

        // Check if we should try a fallback channel
        const fallbackChannel = this.getFallbackChannel(error);
        if (fallbackChannel) {
            return {
                resolved: false,
                action: "fallback",
                fallbackChannel,
                retryDelay,
                message: `Attempting fallback to ${fallbackChannel} channel`,
            };
        }

        return {
            resolved: false,
            action: "retry",
            retryDelay,
            message: `Retrying in ${Math.round(retryDelay / 1000)} seconds (attempt ${attemptCount + 1}/${this.retryConfig.maxAttempts})`,
        };
    }

    /**
     * Checks if an error should be retried
     * 
     * @param error Notification error
     * @param attemptCount Current attempt count
     * @returns True if should retry
     */
    shouldRetry(error: NotificationError, attemptCount: number): boolean {
        // Check if error is retryable
        if (!error.retryable) {
            return false;
        }

        // Check if we've exceeded max attempts
        if (attemptCount >= this.retryConfig.maxAttempts) {
            return false;
        }

        // Rate limit errors should not be retried immediately
        if (error.category === ErrorCategory.RATE_LIMIT) {
            // Only retry rate limit errors after a longer delay
            return attemptCount < 3;
        }

        return true;
    }

    /**
     * Calculates retry delay using exponential backoff
     * 
     * @param attemptCount Current attempt count
     * @returns Delay in milliseconds
     */
    getRetryDelay(attemptCount: number): number {
        const delay = this.retryConfig.baseDelay *
            Math.pow(this.retryConfig.backoffMultiplier, attemptCount);

        // Cap at max delay
        return Math.min(delay, this.retryConfig.maxDelay);
    }

    /**
     * Gets fallback channel for an error
     * 
     * @param error Notification error
     * @returns Fallback channel or undefined
     */
    private getFallbackChannel(error: NotificationError): NotificationChannel | undefined {
        // If email fails, try in-app
        if (error.code === ErrorCodes.EMAIL_DELIVERY_FAILED) {
            return NotificationChannel.IN_APP;
        }

        // If push fails, try email
        if (error.code === ErrorCodes.PUSH_DELIVERY_FAILED) {
            return NotificationChannel.EMAIL;
        }

        return undefined;
    }

    /**
     * Logs an error for debugging and monitoring
     * 
     * @param error Notification error
     * @param notificationId Notification ID
     * @param attemptCount Attempt count
     */
    private logError(
        error: NotificationError,
        notificationId: string,
        attemptCount: number
    ): void {
        const logData = {
            notificationId,
            attemptCount,
            code: error.code,
            category: error.category,
            severity: error.severity,
            message: error.message,
            retryable: error.retryable,
            context: error.context,
            timestamp: error.timestamp,
        };

        if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
            console.error('[Notification Error Handler] Error:', logData);
        } else {
            console.warn('[Notification Error Handler] Error:', logData);
        }
    }

    /**
     * Tracks error count for admin alerting
     * 
     * @param error Notification error
     */
    private trackError(error: NotificationError): void {
        const key = `${error.code}:${error.category}`;
        const count = (this.errorCounts.get(key) || 0) + 1;
        this.errorCounts.set(key, count);
    }

    /**
     * Checks if admin should be alerted
     * 
     * @param error Notification error
     * @returns True if should alert admin
     */
    private shouldAlertAdmin(error: NotificationError): boolean {
        // Always alert for critical errors
        if (error.severity === ErrorSeverity.CRITICAL) {
            return true;
        }

        // Alert if error count exceeds threshold
        const key = `${error.code}:${error.category}`;
        const count = this.errorCounts.get(key) || 0;

        return count >= this.adminAlertThreshold;
    }

    /**
     * Escalates error to admin
     * Validates Requirements: 6.4
     * 
     * @param error Notification error
     * @param notificationId Notification ID
     */
    async escalateToAdmin(
        error: NotificationError,
        notificationId: string
    ): Promise<void> {
        // In production, this would send an alert through appropriate channels
        // (email, Slack, PagerDuty, etc.)

        const alertData = {
            type: "notification_system_error",
            severity: error.severity,
            notificationId,
            error: {
                code: error.code,
                category: error.category,
                message: error.message,
                context: error.context,
            },
            timestamp: new Date().toISOString(),
        };

        console.error('[Admin Alert] Notification system error:', alertData);

        // TODO: Implement actual admin alerting
        // - Send email to admin
        // - Post to Slack channel
        // - Create incident in monitoring system
        // - Log to CloudWatch with high priority
    }

    /**
     * Resets error counts
     * Useful for testing and periodic cleanup
     */
    resetErrorCounts(): void {
        this.errorCounts.clear();
    }

    /**
     * Gets error statistics
     * 
     * @returns Error statistics
     */
    getErrorStatistics(): Record<string, number> {
        const stats: Record<string, number> = {};

        for (const [key, count] of this.errorCounts.entries()) {
            stats[key] = count;
        }

        return stats;
    }
}

/**
 * Singleton instance of the error handler
 */
let errorHandler: NotificationErrorHandler | null = null;

/**
 * Gets the notification error handler instance
 * @returns NotificationErrorHandler instance
 */
export function getNotificationErrorHandler(): NotificationErrorHandler {
    if (!errorHandler) {
        errorHandler = new NotificationErrorHandler();
    }
    return errorHandler;
}

/**
 * Resets the error handler instance
 * Useful for testing
 */
export function resetNotificationErrorHandler(): void {
    errorHandler = null;
}

/**
 * Helper function to wrap async operations with error handling
 * 
 * @param operation Async operation to execute
 * @param errorCode Error code to use if operation fails
 * @param context Additional context
 * @returns Result or throws NotificationError
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorCode: string,
    context?: Record<string, any>
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        throw createNotificationError(
            errorCode,
            error instanceof Error ? error.message : "Unknown error",
            context,
            error instanceof Error ? error : undefined
        );
    }
}
