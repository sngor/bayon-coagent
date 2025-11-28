/**
 * Notification Repository
 * 
 * DynamoDB repository for notification system operations.
 * Handles storage and retrieval of notifications, preferences, and delivery records.
 * Validates Requirements: 1.1, 1.4
 */

import { DynamoDBRepository } from "@/aws/dynamodb/repository";
import type { QueryOptions } from "@/aws/dynamodb/types";
import {
    Notification,
    NotificationPreferences,
    DeliveryRecord,
    CreateNotificationRequest,
    NotificationHistory,
    HistoryOptions,
    NotificationChannel,
    NotificationStatus,
    DeliveryStatus,
    NotificationType,
    NotificationPriority,
    EmailFrequency,
} from "./types";
import {
    validateNotification,
    validateNotificationPreferences,
    validateCreateNotificationRequest,
    validateDeliveryRecord,
} from "./schemas";

/**
 * DynamoDB key patterns for notifications:
 * 
 * Notification records:
 * PK: USER#{userId}          SK: NOTIFICATION#{timestamp}#{notificationId}
 * PK: NOTIFICATION#{id}      SK: METADATA
 * 
 * User preferences:
 * PK: USER#{userId}          SK: NOTIFICATION_PREFERENCES
 * 
 * Delivery records:
 * PK: USER#{userId}          SK: DELIVERY#{notificationId}#{channel}
 * PK: NOTIFICATION#{id}      SK: DELIVERY#{channel}
 * 
 * Metrics and analytics:
 * PK: METRICS#{date}         SK: NOTIFICATION_STATS
 * PK: USER#{userId}          SK: METRICS#{date}
 */

/**
 * Generates keys for notification records
 */
function getNotificationKeys(userId: string, notificationId: string, timestamp?: string) {
    const ts = timestamp || Date.now().toString();
    return {
        PK: `USER#${userId}`,
        SK: `NOTIFICATION#${ts}#${notificationId}`,
    };
}

/**
 * Generates keys for notification metadata (by notification ID)
 */
function getNotificationMetadataKeys(notificationId: string) {
    return {
        PK: `NOTIFICATION#${notificationId}`,
        SK: 'METADATA',
    };
}

/**
 * Generates keys for user notification preferences
 */
function getNotificationPreferencesKeys(userId: string) {
    return {
        PK: `USER#${userId}`,
        SK: 'NOTIFICATION_PREFERENCES',
    };
}

/**
 * Generates keys for delivery records
 */
function getDeliveryRecordKeys(
    userId: string,
    notificationId: string,
    channel: NotificationChannel
) {
    return {
        PK: `USER#${userId}`,
        SK: `DELIVERY#${notificationId}#${channel}`,
    };
}

/**
 * Generates keys for delivery records by notification
 */
function getDeliveryRecordByNotificationKeys(
    notificationId: string,
    channel: NotificationChannel
) {
    return {
        PK: `NOTIFICATION#${notificationId}`,
        SK: `DELIVERY#${channel}`,
    };
}

/**
 * Notification Repository
 * Provides CRUD operations for notifications, preferences, and delivery tracking
 */
export class NotificationRepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    // ============================================================================
    // Notification Operations
    // ============================================================================

    /**
     * Creates a new notification
     * @param request Notification creation request
     * @returns The created notification
     */
    async createNotification(request: CreateNotificationRequest): Promise<Notification> {
        // Validate request
        const validatedRequest = validateCreateNotificationRequest(request);

        // Generate notification ID and timestamp
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const now = new Date().toISOString();

        // Determine channels if not provided
        let channels = validatedRequest.channels;
        if (!channels || channels.length === 0) {
            // Get user preferences to determine channels
            const preferences = await this.getUserPreferences(validatedRequest.userId);
            channels = this.determineChannelsFromPreferences(
                validatedRequest.type,
                validatedRequest.priority,
                preferences
            );
        }

        // Create notification object
        const notification: Notification = {
            id: notificationId,
            userId: validatedRequest.userId,
            type: validatedRequest.type,
            priority: validatedRequest.priority,
            title: validatedRequest.title,
            content: validatedRequest.content,
            metadata: validatedRequest.metadata,
            actionUrl: validatedRequest.actionUrl,
            actionText: validatedRequest.actionText,
            channels,
            status: NotificationStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            expiresAt: validatedRequest.expiresAt,
        };

        // Validate the complete notification
        const validatedNotification = validateNotification(notification);

        // Store in DynamoDB with two records for efficient querying
        const keys = getNotificationKeys(validatedNotification.userId, validatedNotification.id);
        await this.repository.create(
            keys.PK,
            keys.SK,
            'Notification',
            validatedNotification
        );

        // Also store by notification ID for direct lookup
        const metadataKeys = getNotificationMetadataKeys(validatedNotification.id);
        await this.repository.create(
            metadataKeys.PK,
            metadataKeys.SK,
            'Notification',
            validatedNotification
        );

        return validatedNotification;
    }

    /**
     * Gets a notification by ID
     * @param notificationId Notification ID
     * @returns The notification or null if not found
     */
    async getNotification(notificationId: string): Promise<Notification | null> {
        const keys = getNotificationMetadataKeys(notificationId);
        return this.repository.get<Notification>(keys.PK, keys.SK);
    }

    /**
     * Gets notifications for a user
     * @param userId User ID
     * @param options Query options
     * @returns Query result with notifications
     */
    async getUserNotifications(
        userId: string,
        options: HistoryOptions = {}
    ): Promise<NotificationHistory> {
        const queryOptions: QueryOptions = {
            limit: options.limit || 50,
            scanIndexForward: false, // Most recent first
        };

        // Add filter expressions for status and types if provided
        const filterExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};
        const expressionAttributeNames: Record<string, string> = {};

        if (options.status && options.status.length > 0) {
            filterExpressions.push('#data.#status IN (:statuses)');
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#status'] = 'status';
            expressionAttributeValues[':statuses'] = options.status;
        }

        if (options.types && options.types.length > 0) {
            filterExpressions.push('#data.#type IN (:types)');
            expressionAttributeNames['#data'] = 'Data';
            expressionAttributeNames['#type'] = 'type';
            expressionAttributeValues[':types'] = options.types;
        }

        if (filterExpressions.length > 0) {
            queryOptions.filterExpression = filterExpressions.join(' AND ');
            queryOptions.expressionAttributeValues = expressionAttributeValues;
            queryOptions.expressionAttributeNames = expressionAttributeNames;
        }

        const result = await this.repository.query<Notification>(
            `USER#${userId}`,
            'NOTIFICATION#',
            queryOptions
        );

        return {
            notifications: result.items,
            total: result.count,
            hasMore: !!result.lastEvaluatedKey,
        };
    }

    /**
     * Updates a notification
     * @param notificationId Notification ID
     * @param updates Partial notification data to update
     */
    async updateNotification(
        notificationId: string,
        updates: Partial<Notification>
    ): Promise<void> {
        // Get the notification to find its user ID
        const notification = await this.getNotification(notificationId);
        if (!notification) {
            throw new Error(`Notification ${notificationId} not found`);
        }

        // Update both records
        const keys = getNotificationKeys(notification.userId, notificationId);
        await this.repository.update(keys.PK, keys.SK, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const metadataKeys = getNotificationMetadataKeys(notificationId);
        await this.repository.update(metadataKeys.PK, metadataKeys.SK, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Marks a notification as read
     * @param notificationId Notification ID
     */
    async markAsRead(notificationId: string): Promise<void> {
        await this.updateNotification(notificationId, {
            status: NotificationStatus.READ,
            readAt: new Date().toISOString(),
        });
    }

    /**
     * Marks a notification as dismissed
     * @param notificationId Notification ID
     */
    async dismissNotification(notificationId: string): Promise<void> {
        await this.updateNotification(notificationId, {
            status: NotificationStatus.DISMISSED,
            dismissedAt: new Date().toISOString(),
        });
    }

    /**
     * Deletes a notification
     * @param notificationId Notification ID
     */
    async deleteNotification(notificationId: string): Promise<void> {
        const notification = await this.getNotification(notificationId);
        if (!notification) {
            return;
        }

        // Delete both records
        const keys = getNotificationKeys(notification.userId, notificationId);
        await this.repository.delete(keys.PK, keys.SK);

        const metadataKeys = getNotificationMetadataKeys(notificationId);
        await this.repository.delete(metadataKeys.PK, metadataKeys.SK);
    }

    // ============================================================================
    // User Preferences Operations
    // ============================================================================

    /**
     * Gets user notification preferences
     * @param userId User ID
     * @returns User preferences or default preferences if not found
     */
    async getUserPreferences(userId: string): Promise<NotificationPreferences> {
        const keys = getNotificationPreferencesKeys(userId);
        const preferences = await this.repository.get<NotificationPreferences>(keys.PK, keys.SK);

        if (preferences) {
            return preferences;
        }

        // Return default preferences
        return this.getDefaultPreferences(userId);
    }

    /**
     * Updates user notification preferences
     * @param userId User ID
     * @param preferences Notification preferences
     */
    async updateUserPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<void> {
        const currentPreferences = await this.getUserPreferences(userId);

        // Merge with current preferences
        const updatedPreferences: NotificationPreferences = {
            ...currentPreferences,
            ...preferences,
            userId,
            updatedAt: new Date().toISOString(),
        };

        // Validate preferences
        const validatedPreferences = validateNotificationPreferences(updatedPreferences);

        // Store preferences
        const keys = getNotificationPreferencesKeys(userId);
        await this.repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'NotificationPreferences',
            Data: validatedPreferences,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }

    /**
     * Gets default notification preferences for a user
     * @param userId User ID
     * @returns Default preferences
     */
    private getDefaultPreferences(userId: string): NotificationPreferences {
        return {
            userId,
            channels: {
                inApp: {
                    enabled: true,
                    types: Object.values(NotificationType),
                },
                email: {
                    enabled: true,
                    types: [
                        NotificationType.ALERT,
                        NotificationType.ANNOUNCEMENT,
                        NotificationType.FEATURE_UPDATE,
                    ],
                    frequency: EmailFrequency.IMMEDIATE,
                },
                push: {
                    enabled: false,
                    types: [
                        NotificationType.ALERT,
                        NotificationType.REMINDER,
                    ],
                },
            },
            globalSettings: {
                doNotDisturb: false,
            },
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Determines which channels to use based on preferences
     * @param type Notification type
     * @param priority Notification priority
     * @param preferences User preferences
     * @returns Array of channels to use
     */
    private determineChannelsFromPreferences(
        type: NotificationType,
        priority: NotificationPriority,
        preferences: NotificationPreferences
    ): NotificationChannel[] {
        const channels: NotificationChannel[] = [];

        // Check in-app
        if (
            preferences.channels.inApp.enabled &&
            preferences.channels.inApp.types.includes(type)
        ) {
            channels.push(NotificationChannel.IN_APP);
        }

        // Check email
        if (
            preferences.channels.email.enabled &&
            preferences.channels.email.types.includes(type)
        ) {
            channels.push(NotificationChannel.EMAIL);
        }

        // Check push
        if (
            preferences.channels.push.enabled &&
            preferences.channels.push.types.includes(type) &&
            preferences.channels.push.subscription
        ) {
            channels.push(NotificationChannel.PUSH);
        }

        // Critical notifications always use all available channels
        if (priority === NotificationPriority.CRITICAL && channels.length === 0) {
            if (preferences.channels.inApp.enabled) {
                channels.push(NotificationChannel.IN_APP);
            }
            if (preferences.channels.email.enabled) {
                channels.push(NotificationChannel.EMAIL);
            }
            if (preferences.channels.push.enabled && preferences.channels.push.subscription) {
                channels.push(NotificationChannel.PUSH);
            }
        }

        // Default to in-app if no channels selected
        if (channels.length === 0) {
            channels.push(NotificationChannel.IN_APP);
        }

        return channels;
    }

    // ============================================================================
    // Delivery Tracking Operations
    // ============================================================================

    /**
     * Creates a delivery record
     * @param record Delivery record data
     */
    async createDeliveryRecord(record: Omit<DeliveryRecord, 'id'>): Promise<DeliveryRecord> {
        const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const now = new Date().toISOString();

        const deliveryRecord: DeliveryRecord = {
            ...record,
            id: deliveryId,
            lastAttemptAt: now,
        };

        // Validate delivery record
        const validatedRecord = validateDeliveryRecord(deliveryRecord);

        // Store by user and notification
        const keys = getDeliveryRecordKeys(
            validatedRecord.userId,
            validatedRecord.notificationId,
            validatedRecord.channel
        );
        await this.repository.create(
            keys.PK,
            keys.SK,
            'DeliveryRecord',
            validatedRecord
        );

        // Also store by notification for efficient lookup
        const notificationKeys = getDeliveryRecordByNotificationKeys(
            validatedRecord.notificationId,
            validatedRecord.channel
        );
        await this.repository.create(
            notificationKeys.PK,
            notificationKeys.SK,
            'DeliveryRecord',
            validatedRecord
        );

        return validatedRecord;
    }

    /**
     * Gets delivery records for a notification
     * @param notificationId Notification ID
     * @returns Array of delivery records
     */
    async getDeliveryRecords(notificationId: string): Promise<DeliveryRecord[]> {
        const result = await this.repository.query<DeliveryRecord>(
            `NOTIFICATION#${notificationId}`,
            'DELIVERY#'
        );

        return result.items;
    }

    /**
     * Updates a delivery record
     * @param deliveryId Delivery ID
     * @param notificationId Notification ID
     * @param channel Notification channel
     * @param updates Partial delivery record data to update
     */
    async updateDeliveryRecord(
        userId: string,
        notificationId: string,
        channel: NotificationChannel,
        updates: Partial<DeliveryRecord>
    ): Promise<void> {
        // Update both records
        const keys = getDeliveryRecordKeys(userId, notificationId, channel);
        await this.repository.update(keys.PK, keys.SK, {
            ...updates,
            lastAttemptAt: new Date().toISOString(),
        });

        const notificationKeys = getDeliveryRecordByNotificationKeys(notificationId, channel);
        await this.repository.update(notificationKeys.PK, notificationKeys.SK, {
            ...updates,
            lastAttemptAt: new Date().toISOString(),
        });
    }

    /**
     * Gets failed delivery records for retry
     * @param maxAge Maximum age in hours
     * @param maxAttempts Maximum number of attempts
     * @returns Array of failed delivery records
     */
    async getFailedDeliveries(
        maxAge: number = 24,
        maxAttempts: number = 6
    ): Promise<DeliveryRecord[]> {
        // This would require a GSI or scan operation
        // For now, we'll implement a basic scan with filters
        const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000).toISOString();

        const result = await this.repository.scan<DeliveryRecord>({
            filterExpression: '#data.#status = :failed AND #data.#attempts < :maxAttempts AND #data.#lastAttempt > :cutoff',
            expressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status',
                '#attempts': 'attempts',
                '#lastAttempt': 'lastAttemptAt',
            },
            expressionAttributeValues: {
                ':failed': DeliveryStatus.FAILED,
                ':maxAttempts': maxAttempts,
                ':cutoff': cutoffTime,
            },
        });

        return result.items;
    }
}

/**
 * Singleton instance of the notification repository
 */
let notificationRepository: NotificationRepository | null = null;

/**
 * Gets the notification repository instance
 * @returns NotificationRepository instance
 */
export function getNotificationRepository(): NotificationRepository {
    if (!notificationRepository) {
        notificationRepository = new NotificationRepository();
    }
    return notificationRepository;
}
