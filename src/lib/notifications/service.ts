/**
 * Notification Service
 * 
 * Core service for managing notification lifecycle, delivery, and user preferences.
 * Validates Requirements: 1.1, 1.2, 1.5, 7.2
 */

import {
    Notification,
    NotificationPreferences,
    CreateNotificationRequest,
    DeliveryResult,
    DeliveryRecord,
    BatchResult,
    NotificationHistory,
    HistoryOptions,
    NotificationMetrics,
    TimeRange,
    RetryOptions,
    RetryResult,
    DeliveryStatus,
    NotificationStatus,
    NotificationPriority,
    NotificationChannel,
    NotificationRecipient,
} from "./types";
import {
    validateCreateNotificationRequest,
    safeValidate,
    createNotificationRequestSchema,
    notificationPreferencesSchema,
} from "./schemas";
import { getNotificationRepository, NotificationRepository } from "./repository";
import { getPreferenceManager, PreferenceManager, PreferenceChangeLog } from "./preference-manager";
import { getChannelRegistry, ChannelRegistry } from "./channels/channel-registry";
import { getInAppChannelHandler } from "./channels/in-app-channel-handler";
import { getEmailChannelHandler } from "./channels/email-channel-handler";
import { getPushChannelHandler } from "./channels/push-channel-handler";
import {
    NotificationError,
    NotificationErrorClass,
    NotificationErrorHandler,
    getNotificationErrorHandler,
    createNotificationError,
    ErrorCodes,
    withErrorHandling,
} from "./errors";
import {
    FallbackManager,
    getFallbackManager,
} from "./fallback-manager";

/**
 * NotificationService
 * 
 * Main service class for notification operations.
 * Handles creation, delivery, preference management, and tracking.
 */
export class NotificationService {
    private repository: NotificationRepository;
    private preferenceManager: PreferenceManager;
    private channelRegistry: ChannelRegistry;
    private errorHandler: NotificationErrorHandler;
    private fallbackManager: FallbackManager;

    constructor(
        repository?: NotificationRepository,
        preferenceManager?: PreferenceManager,
        channelRegistry?: ChannelRegistry,
        errorHandler?: NotificationErrorHandler,
        fallbackManager?: FallbackManager
    ) {
        this.repository = repository || getNotificationRepository();
        this.preferenceManager = preferenceManager || getPreferenceManager();
        this.channelRegistry = channelRegistry || getChannelRegistry();
        this.errorHandler = errorHandler || getNotificationErrorHandler();

        // Register channel handlers if not already registered
        this.initializeChannelHandlers();

        // Initialize fallback manager after channel registry is ready
        this.fallbackManager = fallbackManager || getFallbackManager(this.channelRegistry);
    }

    /**
     * Initializes and registers channel handlers
     */
    private initializeChannelHandlers(): void {
        if (this.channelRegistry.getHandlerCount() === 0) {
            this.channelRegistry.register(getInAppChannelHandler());
            this.channelRegistry.register(getEmailChannelHandler());
            this.channelRegistry.register(getPushChannelHandler());
        }
    }

    // ============================================================================
    // Core Notification Operations
    // ============================================================================

    /**
     * Creates a new notification
     * Validates Requirements: 1.1, 7.2
     * 
     * @param request Notification creation request
     * @returns The created notification
     * @throws NotificationError if validation fails
     */
    async createNotification(request: CreateNotificationRequest): Promise<Notification> {
        // Validate request
        const validation = safeValidate(createNotificationRequestSchema, request);
        if (!validation.success) {
            throw createNotificationError(
                ErrorCodes.INVALID_REQUEST,
                `Invalid notification request: ${validation.error.message}`,
                { request, validationError: validation.error }
            );
        }

        try {
            // Sanitize content
            const sanitizedRequest = this.sanitizeNotificationContent(validation.data);

            // Create notification via repository
            const notification = await this.repository.createNotification(sanitizedRequest);

            return notification;
        } catch (error) {
            // Wrap repository errors
            throw createNotificationError(
                ErrorCodes.INTERNAL_ERROR,
                error instanceof Error ? error.message : "Failed to create notification",
                { operation: "createNotification" },
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Sends a notification through appropriate channels
     * Validates Requirements: 1.2, 1.3
     * 
     * @param notificationId Notification ID
     * @returns Delivery result
     */
    async sendNotification(notificationId: string): Promise<DeliveryResult> {
        return withErrorHandling(async () => {
            // Get notification
            const notification = await this.repository.getNotification(notificationId);
            if (!notification) {
                throw createNotificationError(
                    ErrorCodes.INVALID_REQUEST,
                    `Notification ${notificationId} not found`,
                    { notificationId }
                );
            }

            // Get user preferences
            const preferences = await this.repository.getUserPreferences(notification.userId);

            // Check if notification should be sent based on preferences
            if (!this.shouldSendNotification(notification, preferences)) {
                return {
                    success: false,
                    channel: notification.channels[0],
                    error: "Notification blocked by user preferences",
                    timestamp: new Date().toISOString(),
                };
            }

            // Get user profile for recipient information
            const userProfile = await this.getUserProfile(notification.userId);

            // Create recipient object
            const recipient: NotificationRecipient = {
                userId: notification.userId,
                email: userProfile.email || preferences.channels.email.address,
                pushSubscription: preferences.channels.push.subscription,
                preferences,
            };

            // Route notification through channel handlers with error handling
            const deliveryResults = await this.routeNotificationWithRetry(
                notification,
                recipient
            );

            // Update notification status based on delivery results
            const anySuccess = deliveryResults.some(r => r.success);
            if (anySuccess) {
                await this.repository.updateNotification(notificationId, {
                    status: NotificationStatus.SENT,
                });
            }

            // Create delivery records for each channel
            for (const result of deliveryResults) {
                await this.repository.createDeliveryRecord({
                    notificationId: notification.id,
                    userId: notification.userId,
                    channel: result.channel,
                    status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
                    attempts: 1,
                    lastAttemptAt: new Date().toISOString(),
                    deliveredAt: result.success ? new Date().toISOString() : undefined,
                    failureReason: result.error,
                    metadata: result,
                });
            }

            // Return the first result (or aggregate if needed)
            return deliveryResults[0] || {
                success: false,
                channel: notification.channels[0],
                error: "No delivery results",
                timestamp: new Date().toISOString(),
            };
        }, ErrorCodes.INTERNAL_ERROR, { operation: "sendNotification", notificationId });
    }

    /**
     * Routes notification with error handling, retry logic, and fallback support
     * Validates Requirements: 5.4, 6.5
     * 
     * @param notification Notification to route
     * @param recipient Recipient information
     * @returns Array of delivery results
     */
    private async routeNotificationWithRetry(
        notification: Notification,
        recipient: NotificationRecipient
    ): Promise<DeliveryResult[]> {
        // Check rate limiting
        if (this.fallbackManager.isRateLimited(notification, recipient.userId)) {
            console.warn(
                '[Notification Service] Notification rate limited',
                { notificationId: notification.id, userId: recipient.userId }
            );
            return [{
                success: false,
                channel: notification.channels[0],
                error: "Rate limit exceeded",
                timestamp: new Date().toISOString(),
            }];
        }

        // Check for system overload
        if (this.fallbackManager.handleSystemOverload(notification)) {
            console.warn(
                '[Notification Service] System overload, queuing notification',
                { notificationId: notification.id }
            );
            return [{
                success: false,
                channel: notification.channels[0],
                error: "System overload - notification queued",
                timestamp: new Date().toISOString(),
            }];
        }

        try {
            // Try primary delivery
            const results = await this.channelRegistry.routeNotification(notification, recipient);

            // Record successful notification for rate limiting
            if (results.some(r => r.success)) {
                this.fallbackManager.recordNotification(recipient.userId);
            }

            return results;
        } catch (error) {
            // Convert to NotificationError if not already
            const notificationError = error instanceof NotificationErrorClass
                ? error
                : createNotificationError(
                    ErrorCodes.INTERNAL_ERROR,
                    error instanceof Error ? error.message : "Unknown error during routing",
                    { notificationId: notification.id },
                    error instanceof Error ? error : undefined
                );

            // Handle the error
            const resolution = await this.errorHandler.handleError(
                notificationError,
                notification.id,
                0 // First attempt
            );

            // Log resolution
            console.log('[Notification Service] Error resolution:', resolution);

            // Try fallback if suggested
            if (resolution.action === "fallback" && resolution.fallbackChannel) {
                console.log(
                    '[Notification Service] Attempting fallback delivery',
                    { notificationId: notification.id, fallbackChannel: resolution.fallbackChannel }
                );

                const fallbackResult = await this.fallbackManager.deliverWithFallback(
                    notification,
                    recipient,
                    notificationError
                );

                if (fallbackResult.success) {
                    this.fallbackManager.recordNotification(recipient.userId);
                }

                return [fallbackResult];
            }

            // Return failed result
            return [{
                success: false,
                channel: notification.channels[0],
                error: notificationError.message,
                timestamp: new Date().toISOString(),
            }];
        }
    }

    /**
     * Gets user profile information
     * 
     * @param userId User ID
     * @returns User profile with email
     */
    private async getUserProfile(userId: string): Promise<{ email?: string }> {
        try {
            // Access the underlying DynamoDB repository
            const dbRepo = new (require('@/aws/dynamodb/repository').DynamoDBRepository)();
            const profile = await dbRepo.get(`USER#${userId}`, 'PROFILE');
            return {
                email: profile?.Data?.email,
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Sends multiple notifications in batch
     * Validates Requirements: 7.3
     * 
     * @param notifications Array of notifications to send
     * @returns Batch result with success/failure counts
     */
    async batchNotifications(notifications: Notification[]): Promise<BatchResult> {
        const results: DeliveryResult[] = [];
        let successful = 0;
        let failed = 0;

        // Sort by priority before processing
        const sortedNotifications = this.sortByPriority(notifications);

        // Process each notification
        for (const notification of sortedNotifications) {
            try {
                const result = await this.sendNotification(notification.id);
                results.push(result);
                if (result.success) {
                    successful++;
                } else {
                    failed++;
                }
            } catch (error) {
                results.push({
                    success: false,
                    channel: notification.channels[0],
                    error: error instanceof Error ? error.message : "Unknown error",
                    timestamp: new Date().toISOString(),
                });
                failed++;
            }
        }

        return {
            total: notifications.length,
            successful,
            failed,
            results,
        };
    }

    // ============================================================================
    // User Preference Management
    // ============================================================================

    /**
     * Gets user notification preferences
     * Validates Requirements: 3.1
     * 
     * @param userId User ID
     * @returns User notification preferences
     */
    async getUserPreferences(userId: string): Promise<NotificationPreferences> {
        return this.repository.getUserPreferences(userId);
    }

    /**
     * Updates user notification preferences
     * Validates Requirements: 3.2, 3.3
     * 
     * @param userId User ID
     * @param preferences Partial preferences to update
     * @returns Change log for tracking
     */
    async updateUserPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<PreferenceChangeLog> {
        // Get current preferences
        const currentPreferences = await this.repository.getUserPreferences(userId);

        // Merge and validate preferences
        const mergedPreferences = this.preferenceManager.mergePreferences(
            currentPreferences,
            preferences
        );

        // Track changes
        const changeLog = this.preferenceManager.trackPreferenceChanges(
            userId,
            currentPreferences,
            mergedPreferences
        );

        // Update preferences in repository
        await this.repository.updateUserPreferences(userId, mergedPreferences);

        return changeLog;
    }

    // ============================================================================
    // Delivery Tracking
    // ============================================================================

    /**
     * Gets delivery status for a notification
     * Validates Requirements: 1.4, 6.1
     * 
     * @param notificationId Notification ID
     * @returns Delivery status information
     */
    async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
        const records = await this.repository.getDeliveryRecords(notificationId);

        if (records.length === 0) {
            return DeliveryStatus.PENDING;
        }

        // Return the most advanced status
        const statusPriority = [
            DeliveryStatus.DELIVERED,
            DeliveryStatus.SENT,
            DeliveryStatus.PROCESSING,
            DeliveryStatus.FAILED,
            DeliveryStatus.BOUNCED,
            DeliveryStatus.COMPLAINED,
            DeliveryStatus.PENDING,
        ];

        for (const status of statusPriority) {
            if (records.some(r => r.status === status)) {
                return status;
            }
        }

        return DeliveryStatus.PENDING;
    }

    /**
     * Gets notification history for a user
     * Validates Requirements: 2.1, 2.4
     * 
     * @param userId User ID
     * @param options History query options
     * @returns Notification history
     */
    async getNotificationHistory(
        userId: string,
        options?: HistoryOptions
    ): Promise<NotificationHistory> {
        return this.repository.getUserNotifications(userId, options);
    }

    // ============================================================================
    // Admin Operations
    // ============================================================================

    /**
     * Gets notification metrics for a time range
     * Validates Requirements: 6.3
     * 
     * @param timeRange Time range for metrics
     * @returns Notification metrics
     */
    async getMetrics(timeRange: TimeRange): Promise<NotificationMetrics> {
        try {
            // Access the underlying DynamoDB repository for scanning
            const dbRepo = new (require('@/aws/dynamodb/repository').DynamoDBRepository)();

            // Calculate time range boundaries
            const startTime = new Date(timeRange.startDate).getTime();
            const endTime = new Date(timeRange.endDate).getTime();

            // Initialize metrics structure
            const metrics: NotificationMetrics = {
                timeRange,
                totalNotifications: 0,
                deliveryRates: {
                    [NotificationChannel.IN_APP]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                    [NotificationChannel.EMAIL]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                    [NotificationChannel.PUSH]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                },
                averageDeliveryTime: {
                    [NotificationChannel.IN_APP]: 0,
                    [NotificationChannel.EMAIL]: 0,
                    [NotificationChannel.PUSH]: 0,
                },
                failureReasons: [],
            };

            // Scan for delivery records in the time range
            // Note: In production, this should use a GSI for better performance
            const deliveryResult = await dbRepo.scan({
                filterExpression: '#entityType = :entityType AND #data.#lastAttempt BETWEEN :start AND :end',
                expressionAttributeNames: {
                    '#entityType': 'EntityType',
                    '#data': 'Data',
                    '#lastAttempt': 'lastAttemptAt',
                },
                expressionAttributeValues: {
                    ':entityType': 'DeliveryRecord',
                    ':start': new Date(startTime).toISOString(),
                    ':end': new Date(endTime).toISOString(),
                },
            });

            const deliveryRecords = deliveryResult.items as any[];

            // Track delivery times for averaging
            const deliveryTimes: Record<string, number[]> = {
                [NotificationChannel.IN_APP]: [],
                [NotificationChannel.EMAIL]: [],
                [NotificationChannel.PUSH]: [],
            };

            // Track failure reasons
            const failureReasonMap = new Map<string, number>();

            // Process delivery records
            for (const record of deliveryRecords) {
                const channel = record.channel as NotificationChannel;

                // Skip if channel is not valid
                if (!metrics.deliveryRates[channel]) {
                    continue;
                }

                // Count by status
                if (record.status === DeliveryStatus.SENT || record.status === DeliveryStatus.DELIVERED) {
                    metrics.deliveryRates[channel].sent++;
                    if (record.status === DeliveryStatus.DELIVERED) {
                        metrics.deliveryRates[channel].delivered++;
                    }

                    // Calculate delivery time if available
                    if (record.deliveredAt) {
                        const createdTime = new Date(record.lastAttemptAt).getTime();
                        const deliveredTime = new Date(record.deliveredAt).getTime();
                        const deliveryTime = deliveredTime - createdTime;
                        if (!deliveryTimes[channel]) {
                            deliveryTimes[channel] = [];
                        }
                        deliveryTimes[channel].push(deliveryTime);
                    }
                } else if (record.status === DeliveryStatus.FAILED ||
                    record.status === DeliveryStatus.BOUNCED ||
                    record.status === DeliveryStatus.COMPLAINED) {
                    metrics.deliveryRates[channel].failed++;

                    // Track failure reason
                    if (record.failureReason) {
                        const count = failureReasonMap.get(record.failureReason) || 0;
                        failureReasonMap.set(record.failureReason, count + 1);
                    }
                }
            }

            // Calculate delivery rates
            for (const channel of Object.values(NotificationChannel)) {
                const channelMetrics = metrics.deliveryRates[channel];
                const total = channelMetrics.sent + channelMetrics.failed;
                if (total > 0) {
                    channelMetrics.rate = (channelMetrics.delivered / total) * 100;
                }
            }

            // Calculate average delivery times
            for (const channel of Object.values(NotificationChannel)) {
                const times = deliveryTimes[channel];
                if (times.length > 0) {
                    const sum = times.reduce((a, b) => a + b, 0);
                    metrics.averageDeliveryTime[channel] = Math.round(sum / times.length);
                }
            }

            // Convert failure reasons to array
            metrics.failureReasons = Array.from(failureReasonMap.entries())
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Top 10 failure reasons

            // Count total notifications in the time range
            const notificationResult = await dbRepo.scan({
                filterExpression: '#entityType = :entityType AND #data.#createdAt BETWEEN :start AND :end',
                expressionAttributeNames: {
                    '#entityType': 'EntityType',
                    '#data': 'Data',
                    '#createdAt': 'createdAt',
                },
                expressionAttributeValues: {
                    ':entityType': 'Notification',
                    ':start': new Date(startTime).toISOString(),
                    ':end': new Date(endTime).toISOString(),
                },
            });

            metrics.totalNotifications = notificationResult.count;

            return metrics;
        } catch (error) {
            console.error('Failed to get notification metrics:', error);
            // Return empty metrics on error
            return {
                timeRange,
                totalNotifications: 0,
                deliveryRates: {
                    [NotificationChannel.IN_APP]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                    [NotificationChannel.EMAIL]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                    [NotificationChannel.PUSH]: {
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        rate: 0,
                    },
                },
                averageDeliveryTime: {
                    [NotificationChannel.IN_APP]: 0,
                    [NotificationChannel.EMAIL]: 0,
                    [NotificationChannel.PUSH]: 0,
                },
                failureReasons: [],
            };
        }
    }

    /**
     * Gets rate limit status for a user
     * Validates Requirements: 6.5
     * 
     * @param userId User ID
     * @returns Rate limit status
     */
    getRateLimitStatus(userId: string): {
        limited: boolean;
        minuteCount: number;
        hourCount: number;
        dayCount: number;
        minuteLimit: number;
        hourLimit: number;
        dayLimit: number;
    } {
        return this.fallbackManager.getRateLimitStatus(userId);
    }

    /**
     * Gets audit trail for notifications (admin operation)
     * Validates Requirements: 6.3, 6.4
     * 
     * @param options Audit trail query options
     * @returns Audit trail with notifications and delivery records
     */
    async getAuditTrail(options: {
        userId?: string;
        notificationId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<{
        notifications: Notification[];
        deliveryRecords: DeliveryRecord[];
        total: number;
    }> {
        try {
            const dbRepo = new (require('@/aws/dynamodb/repository').DynamoDBRepository)();

            // Build filter expressions
            const filterExpressions: string[] = [];
            const expressionAttributeNames: Record<string, string> = {};
            const expressionAttributeValues: Record<string, any> = {};

            // If specific notification ID is provided, get that notification and its delivery records
            if (options.notificationId) {
                const notification = await this.repository.getNotification(options.notificationId);
                const deliveryRecords = await this.repository.getDeliveryRecords(options.notificationId);

                return {
                    notifications: notification ? [notification] : [],
                    deliveryRecords,
                    total: (notification ? 1 : 0) + deliveryRecords.length,
                };
            }

            // If user ID is provided, get notifications for that user
            if (options.userId) {
                const historyOptions: HistoryOptions = {
                    limit: options.limit || 100,
                    startDate: options.startDate,
                    endDate: options.endDate,
                };

                const history = await this.repository.getUserNotifications(options.userId, historyOptions);

                // Get delivery records for each notification
                const deliveryRecords: DeliveryRecord[] = [];
                for (const notification of history.notifications) {
                    const records = await this.repository.getDeliveryRecords(notification.id);
                    deliveryRecords.push(...records);
                }

                return {
                    notifications: history.notifications,
                    deliveryRecords,
                    total: history.notifications.length + deliveryRecords.length,
                };
            }

            // Otherwise, scan for all notifications in the time range
            filterExpressions.push('#entityType = :notificationType');
            expressionAttributeNames['#entityType'] = 'EntityType';
            expressionAttributeValues[':notificationType'] = 'Notification';

            if (options.startDate || options.endDate) {
                expressionAttributeNames['#data'] = 'Data';
                expressionAttributeNames['#createdAt'] = 'createdAt';

                if (options.startDate && options.endDate) {
                    filterExpressions.push('#data.#createdAt BETWEEN :start AND :end');
                    expressionAttributeValues[':start'] = options.startDate;
                    expressionAttributeValues[':end'] = options.endDate;
                } else if (options.startDate) {
                    filterExpressions.push('#data.#createdAt >= :start');
                    expressionAttributeValues[':start'] = options.startDate;
                } else if (options.endDate) {
                    filterExpressions.push('#data.#createdAt <= :end');
                    expressionAttributeValues[':end'] = options.endDate;
                }
            }

            const notificationResult = await dbRepo.scan({
                filterExpression: filterExpressions.join(' AND '),
                expressionAttributeNames,
                expressionAttributeValues,
                limit: options.limit || 100,
            });

            // Get delivery records for each notification
            const deliveryRecords: DeliveryRecord[] = [];
            for (const notification of notificationResult.items) {
                const records = await this.repository.getDeliveryRecords(notification.id);
                deliveryRecords.push(...records);
            }

            return {
                notifications: notificationResult.items,
                deliveryRecords,
                total: notificationResult.items.length + deliveryRecords.length,
            };
        } catch (error) {
            console.error('Failed to get audit trail:', error);
            throw createNotificationError(
                ErrorCodes.INTERNAL_ERROR,
                error instanceof Error ? error.message : 'Failed to get audit trail',
                { operation: 'getAuditTrail', options },
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Retries failed notification deliveries
     * Validates Requirements: 4.3, 5.4, 6.4
     * 
     * @param criteria Retry criteria
     * @returns Retry result
     */
    async retryFailedDeliveries(criteria: RetryOptions): Promise<RetryResult> {
        try {
            // Get failed deliveries from repository
            const failedDeliveries = await this.repository.getFailedDeliveries(
                criteria.maxAge || 24,
                criteria.maxAttempts || 6
            );

            let attempted = 0;
            let successful = 0;
            let failed = 0;
            const errors: string[] = [];

            for (const delivery of failedDeliveries) {
                // Filter by criteria
                if (criteria.notificationIds && !criteria.notificationIds.includes(delivery.notificationId)) {
                    continue;
                }
                if (criteria.channels && !criteria.channels.includes(delivery.channel)) {
                    continue;
                }

                attempted++;

                try {
                    // Get the original notification
                    const notification = await this.repository.getNotification(delivery.notificationId);
                    if (!notification) {
                        errors.push(`Notification ${delivery.notificationId} not found`);
                        failed++;
                        continue;
                    }

                    // Get user preferences
                    const preferences = await this.repository.getUserPreferences(delivery.userId);

                    // Get user profile for recipient information
                    const userProfile = await this.getUserProfile(delivery.userId);

                    // Create recipient object
                    const recipient: NotificationRecipient = {
                        userId: delivery.userId,
                        email: userProfile.email || preferences.channels.email.address,
                        pushSubscription: preferences.channels.push.subscription,
                        preferences,
                    };

                    // Update delivery record to mark as retrying
                    await this.repository.updateDeliveryRecord(
                        delivery.userId,
                        delivery.notificationId,
                        delivery.channel,
                        {
                            status: DeliveryStatus.PROCESSING,
                            attempts: delivery.attempts + 1,
                        }
                    );

                    // Get the specific channel handler
                    const handler = this.channelRegistry.getHandler(delivery.channel);
                    if (!handler) {
                        errors.push(`No handler found for channel ${delivery.channel}`);
                        failed++;
                        continue;
                    }

                    // Check if handler can handle this notification
                    if (!handler.canHandle(notification, preferences)) {
                        errors.push(`Handler cannot process notification ${delivery.notificationId} for channel ${delivery.channel}`);
                        failed++;
                        continue;
                    }

                    // Attempt delivery
                    const result = await handler.deliver(notification, recipient);

                    if (result.success) {
                        // Update delivery record to mark as successful
                        await this.repository.updateDeliveryRecord(
                            delivery.userId,
                            delivery.notificationId,
                            delivery.channel,
                            {
                                status: DeliveryStatus.DELIVERED,
                                deliveredAt: new Date().toISOString(),
                                attempts: delivery.attempts + 1,
                            }
                        );
                        successful++;
                    } else {
                        // Update delivery record to mark as failed again
                        await this.repository.updateDeliveryRecord(
                            delivery.userId,
                            delivery.notificationId,
                            delivery.channel,
                            {
                                status: DeliveryStatus.FAILED,
                                failureReason: result.error || 'Retry failed',
                                attempts: delivery.attempts + 1,
                            }
                        );
                        errors.push(`Retry failed for ${delivery.notificationId}: ${result.error}`);
                        failed++;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Error retrying ${delivery.notificationId}: ${errorMessage}`);

                    // Update delivery record to mark as failed
                    try {
                        await this.repository.updateDeliveryRecord(
                            delivery.userId,
                            delivery.notificationId,
                            delivery.channel,
                            {
                                status: DeliveryStatus.FAILED,
                                failureReason: errorMessage,
                                attempts: delivery.attempts + 1,
                            }
                        );
                    } catch (updateError) {
                        console.error('Failed to update delivery record:', updateError);
                    }

                    failed++;
                }
            }

            return {
                attempted,
                successful,
                failed,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            console.error('Failed to retry deliveries:', error);
            throw createNotificationError(
                ErrorCodes.INTERNAL_ERROR,
                error instanceof Error ? error.message : 'Failed to retry deliveries',
                { operation: 'retryFailedDeliveries', criteria },
                error instanceof Error ? error : undefined
            );
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Sanitizes notification content to prevent XSS and injection attacks
     * Validates Requirements: 7.2
     * 
     * @param request Notification request
     * @returns Sanitized request
     */
    private sanitizeNotificationContent(
        request: CreateNotificationRequest
    ): CreateNotificationRequest {
        return {
            ...request,
            title: this.sanitizeString(request.title),
            content: this.sanitizeString(request.content),
            actionText: request.actionText ? this.sanitizeString(request.actionText) : undefined,
        };
    }

    /**
     * Sanitizes a string by removing potentially dangerous characters
     * 
     * @param str String to sanitize
     * @returns Sanitized string
     */
    private sanitizeString(str: string): string {
        // Remove HTML tags
        let sanitized = str.replace(/<[^>]*>/g, '');

        // Remove script tags and their content
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    /**
     * Checks if a notification should be sent based on user preferences
     * Validates Requirements: 1.3, 3.3
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if notification should be sent
     */
    private shouldSendNotification(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
        // Check do not disturb
        if (preferences.globalSettings.doNotDisturb) {
            // Critical notifications bypass DND
            if (notification.priority !== NotificationPriority.CRITICAL) {
                return false;
            }
        }

        // Check if any channel is enabled for this notification type
        const hasEnabledChannel = notification.channels.some(channel => {
            switch (channel) {
                case NotificationChannel.IN_APP:
                    return preferences.channels.inApp.enabled &&
                        preferences.channels.inApp.types.includes(notification.type);
                case NotificationChannel.EMAIL:
                    return preferences.channels.email.enabled &&
                        preferences.channels.email.types.includes(notification.type);
                case NotificationChannel.PUSH:
                    return preferences.channels.push.enabled &&
                        preferences.channels.push.types.includes(notification.type);
                default:
                    return false;
            }
        });

        return hasEnabledChannel;
    }

    /**
     * Sorts notifications by priority
     * Validates Requirements: 1.5
     * 
     * @param notifications Array of notifications
     * @returns Sorted array (critical > high > medium > low)
     */
    private sortByPriority(notifications: Notification[]): Notification[] {
        const priorityOrder = {
            [NotificationPriority.CRITICAL]: 0,
            [NotificationPriority.HIGH]: 1,
            [NotificationPriority.MEDIUM]: 2,
            [NotificationPriority.LOW]: 3,
        };

        return [...notifications].sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            // Same priority: sort by creation time (oldest first)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }
}

/**
 * Singleton instance of the notification service
 */
let notificationService: NotificationService | null = null;

/**
 * Gets the notification service instance
 * @returns NotificationService instance
 */
export function getNotificationService(): NotificationService {
    if (!notificationService) {
        notificationService = new NotificationService();
    }
    return notificationService;
}
