/**
 * Notification System Type Definitions
 * 
 * Core types, interfaces, and enums for the notification system.
 * Validates Requirements: 1.1, 7.2
 */

// ============================================================================
// Enums
// ============================================================================

export enum NotificationType {
    SYSTEM = "system",
    ALERT = "alert",
    REMINDER = "reminder",
    ACHIEVEMENT = "achievement",
    ANNOUNCEMENT = "announcement",
    TASK_COMPLETION = "task_completion",
    FEATURE_UPDATE = "feature_update",
}

export enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

export enum NotificationChannel {
    IN_APP = "in_app",
    EMAIL = "email",
    PUSH = "push",
}

export enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    DISMISSED = "dismissed",
    EXPIRED = "expired",
}

export enum DeliveryStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed",
    BOUNCED = "bounced",
    COMPLAINED = "complained",
}

export enum EmailFrequency {
    IMMEDIATE = "immediate",
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Core notification interface
 * Represents a single notification in the system
 */
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    content: string;
    metadata?: Record<string, any>;
    actionUrl?: string;
    actionText?: string;
    channels: NotificationChannel[];
    status: NotificationStatus;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
    readAt?: string;
    dismissedAt?: string;
}

/**
 * User notification preferences
 * Controls how and when users receive notifications
 */
export interface NotificationPreferences {
    userId: string;
    channels: {
        inApp: {
            enabled: boolean;
            types: NotificationType[];
        };
        email: {
            enabled: boolean;
            address?: string;
            types: NotificationType[];
            frequency: EmailFrequency;
            digestTime?: string; // HH:MM format
            quietHours?: {
                enabled: boolean;
                startTime: string; // HH:MM format
                endTime: string; // HH:MM format
                timezone: string;
            };
        };
        push: {
            enabled: boolean;
            types: NotificationType[];
            subscription?: PushSubscriptionJSON;
        };
    };
    globalSettings: {
        doNotDisturb: boolean;
        maxDailyNotifications?: number;
    };
    updatedAt: string;
}

/**
 * Delivery tracking record
 * Tracks delivery attempts and status for each channel
 */
export interface DeliveryRecord {
    id: string;
    notificationId: string;
    userId: string;
    channel: NotificationChannel;
    status: DeliveryStatus;
    attempts: number;
    lastAttemptAt: string;
    deliveredAt?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
}

/**
 * Push subscription data (Web Push API format)
 */
export interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to create a new notification
 */
export interface CreateNotificationRequest {
    userId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    content: string;
    metadata?: Record<string, any>;
    actionUrl?: string;
    actionText?: string;
    channels?: NotificationChannel[]; // Optional, will be determined by preferences if not provided
    expiresAt?: string;
}

/**
 * Result of a delivery attempt
 */
export interface DeliveryResult {
    success: boolean;
    channel: NotificationChannel;
    deliveryId?: string;
    error?: string;
    timestamp: string;
}

/**
 * Result of batch notification processing
 */
export interface BatchResult {
    total: number;
    successful: number;
    failed: number;
    results: DeliveryResult[];
}

/**
 * Options for querying notification history
 */
export interface HistoryOptions {
    limit?: number;
    startDate?: string;
    endDate?: string;
    types?: NotificationType[];
    status?: NotificationStatus[];
}

/**
 * Notification history response
 */
export interface NotificationHistory {
    notifications: Notification[];
    total: number;
    hasMore: boolean;
}

/**
 * Time range for metrics queries
 */
export interface TimeRange {
    startDate: string;
    endDate: string;
}

/**
 * Notification system metrics
 */
export interface NotificationMetrics {
    timeRange: TimeRange;
    totalNotifications: number;
    deliveryRates: {
        [key in NotificationChannel]: {
            sent: number;
            delivered: number;
            failed: number;
            rate: number; // percentage
        };
    };
    averageDeliveryTime: {
        [key in NotificationChannel]: number; // milliseconds
    };
    failureReasons: {
        reason: string;
        count: number;
    }[];
}

/**
 * Options for retrying failed deliveries
 */
export interface RetryOptions {
    notificationIds?: string[];
    channels?: NotificationChannel[];
    maxAge?: number; // hours
    maxAttempts?: number;
}

/**
 * Result of retry operation
 */
export interface RetryResult {
    attempted: number;
    successful: number;
    failed: number;
    errors?: string[];
}

/**
 * Notification recipient information
 */
export interface NotificationRecipient {
    userId: string;
    email?: string;
    pushSubscription?: PushSubscriptionJSON;
    preferences: NotificationPreferences;
}

/**
 * Formatted notification content for a specific channel
 */
export interface FormattedContent {
    subject?: string; // For email
    body: string;
    html?: string; // For email
    data?: Record<string, any>; // For push notifications
}

/**
 * Notification template
 */
export interface NotificationTemplate {
    id: string;
    type: NotificationType;
    channel: NotificationChannel;
    subject?: string;
    bodyTemplate: string;
    htmlTemplate?: string;
}
