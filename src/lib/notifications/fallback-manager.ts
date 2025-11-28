/**
 * Fallback Manager
 * 
 * Manages channel fallback logic and graceful degradation.
 * Validates Requirements: 5.4, 6.5
 */

import {
    Notification,
    NotificationChannel,
    NotificationPriority,
    NotificationRecipient,
    DeliveryResult,
} from "./types";
import { ChannelRegistry } from "./channels/channel-registry";
import { NotificationError, ErrorCategory } from "./errors";

/**
 * Fallback strategy configuration
 */
export interface FallbackStrategy {
    primaryChannel: NotificationChannel;
    fallbackChannels: NotificationChannel[];
    maxFallbackAttempts: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    maxNotificationsPerMinute: number;
    maxNotificationsPerHour: number;
    maxNotificationsPerDay: number;
    criticalBypass: boolean; // Allow critical notifications to bypass rate limits
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxNotificationsPerMinute: 10,
    maxNotificationsPerHour: 100,
    maxNotificationsPerDay: 500,
    criticalBypass: true,
};

/**
 * Rate limit tracking
 */
interface RateLimitTracker {
    userId: string;
    minute: { count: number; timestamp: number };
    hour: { count: number; timestamp: number };
    day: { count: number; timestamp: number };
}

/**
 * Fallback Manager
 * Handles channel fallback logic and rate limiting
 */
export class FallbackManager {
    private channelRegistry: ChannelRegistry;
    private rateLimitConfig: RateLimitConfig;
    private rateLimitTrackers: Map<string, RateLimitTracker>;
    private fallbackStrategies: Map<NotificationChannel, FallbackStrategy>;

    constructor(
        channelRegistry: ChannelRegistry,
        rateLimitConfig?: Partial<RateLimitConfig>
    ) {
        this.channelRegistry = channelRegistry;
        this.rateLimitConfig = {
            ...DEFAULT_RATE_LIMIT_CONFIG,
            ...rateLimitConfig,
        };
        this.rateLimitTrackers = new Map();
        this.fallbackStrategies = this.initializeFallbackStrategies();
    }

    /**
     * Initializes default fallback strategies
     * 
     * @returns Map of fallback strategies
     */
    private initializeFallbackStrategies(): Map<NotificationChannel, FallbackStrategy> {
        const strategies = new Map<NotificationChannel, FallbackStrategy>();

        // Email fallback strategy: email -> in-app
        strategies.set(NotificationChannel.EMAIL, {
            primaryChannel: NotificationChannel.EMAIL,
            fallbackChannels: [NotificationChannel.IN_APP],
            maxFallbackAttempts: 1,
        });

        // Push fallback strategy: push -> email -> in-app
        strategies.set(NotificationChannel.PUSH, {
            primaryChannel: NotificationChannel.PUSH,
            fallbackChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
            maxFallbackAttempts: 2,
        });

        // In-app has no fallback (it's the most reliable)
        strategies.set(NotificationChannel.IN_APP, {
            primaryChannel: NotificationChannel.IN_APP,
            fallbackChannels: [],
            maxFallbackAttempts: 0,
        });

        return strategies;
    }

    /**
     * Attempts to deliver notification with fallback support
     * Validates Requirements: 5.4
     * 
     * @param notification Notification to deliver
     * @param recipient Recipient information
     * @param error Optional error from previous attempt
     * @returns Delivery result
     */
    async deliverWithFallback(
        notification: Notification,
        recipient: NotificationRecipient,
        error?: NotificationError
    ): Promise<DeliveryResult> {
        // Get primary channel
        const primaryChannel = notification.channels[0];

        // Try primary channel first if no error
        if (!error) {
            const handler = this.channelRegistry.getHandler(primaryChannel);
            if (handler && handler.canHandle(notification, recipient.preferences)) {
                const result = await handler.deliver(notification, recipient);
                if (result.success) {
                    return result;
                }
                // If failed, continue to fallback logic
            }
        }

        // Get fallback strategy
        const strategy = this.fallbackStrategies.get(primaryChannel);
        if (!strategy || strategy.fallbackChannels.length === 0) {
            return {
                success: false,
                channel: primaryChannel,
                error: "No fallback channels available",
                timestamp: new Date().toISOString(),
            };
        }

        // Try fallback channels
        for (const fallbackChannel of strategy.fallbackChannels) {
            const handler = this.channelRegistry.getHandler(fallbackChannel);
            if (!handler) {
                continue;
            }

            // Check if handler can handle this notification
            if (!handler.canHandle(notification, recipient.preferences)) {
                continue;
            }

            // Try delivery
            try {
                const result = await handler.deliver(notification, recipient);
                if (result.success) {
                    console.log(
                        `[Fallback Manager] Successfully delivered via fallback channel: ${fallbackChannel}`,
                        { notificationId: notification.id, primaryChannel, fallbackChannel }
                    );
                    return result;
                }
            } catch (fallbackError) {
                console.warn(
                    `[Fallback Manager] Fallback channel ${fallbackChannel} also failed`,
                    { notificationId: notification.id, error: fallbackError }
                );
                continue;
            }
        }

        // All fallback attempts failed
        return {
            success: false,
            channel: primaryChannel,
            error: "All delivery channels failed including fallbacks",
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Checks if notification should be rate limited
     * Validates Requirements: 6.5
     * 
     * @param notification Notification to check
     * @param userId User ID
     * @returns True if rate limited
     */
    isRateLimited(notification: Notification, userId: string): boolean {
        // Critical notifications bypass rate limiting if configured
        if (
            this.rateLimitConfig.criticalBypass &&
            notification.priority === NotificationPriority.CRITICAL
        ) {
            return false;
        }

        // Get or create tracker
        const tracker = this.getOrCreateTracker(userId);
        const now = Date.now();

        // Check minute limit
        if (this.isWithinTimeWindow(tracker.minute.timestamp, now, 60000)) {
            if (tracker.minute.count >= this.rateLimitConfig.maxNotificationsPerMinute) {
                return true;
            }
        }

        // Check hour limit
        if (this.isWithinTimeWindow(tracker.hour.timestamp, now, 3600000)) {
            if (tracker.hour.count >= this.rateLimitConfig.maxNotificationsPerHour) {
                return true;
            }
        }

        // Check day limit
        if (this.isWithinTimeWindow(tracker.day.timestamp, now, 86400000)) {
            if (tracker.day.count >= this.rateLimitConfig.maxNotificationsPerDay) {
                return true;
            }
        }

        return false;
    }

    /**
     * Records a notification for rate limiting
     * 
     * @param userId User ID
     */
    recordNotification(userId: string): void {
        const tracker = this.getOrCreateTracker(userId);
        const now = Date.now();

        // Update minute counter
        if (this.isWithinTimeWindow(tracker.minute.timestamp, now, 60000)) {
            tracker.minute.count++;
        } else {
            tracker.minute = { count: 1, timestamp: now };
        }

        // Update hour counter
        if (this.isWithinTimeWindow(tracker.hour.timestamp, now, 3600000)) {
            tracker.hour.count++;
        } else {
            tracker.hour = { count: 1, timestamp: now };
        }

        // Update day counter
        if (this.isWithinTimeWindow(tracker.day.timestamp, now, 86400000)) {
            tracker.day.count++;
        } else {
            tracker.day = { count: 1, timestamp: now };
        }

        this.rateLimitTrackers.set(userId, tracker);
    }

    /**
     * Gets or creates a rate limit tracker for a user
     * 
     * @param userId User ID
     * @returns Rate limit tracker
     */
    private getOrCreateTracker(userId: string): RateLimitTracker {
        let tracker = this.rateLimitTrackers.get(userId);

        if (!tracker) {
            const now = Date.now();
            tracker = {
                userId,
                minute: { count: 0, timestamp: now },
                hour: { count: 0, timestamp: now },
                day: { count: 0, timestamp: now },
            };
            this.rateLimitTrackers.set(userId, tracker);
        }

        return tracker;
    }

    /**
     * Checks if a timestamp is within a time window
     * 
     * @param timestamp Timestamp to check
     * @param now Current timestamp
     * @param windowMs Window size in milliseconds
     * @returns True if within window
     */
    private isWithinTimeWindow(timestamp: number, now: number, windowMs: number): boolean {
        return now - timestamp < windowMs;
    }

    /**
     * Gets rate limit status for a user
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
        const tracker = this.rateLimitTrackers.get(userId);
        const now = Date.now();

        if (!tracker) {
            return {
                limited: false,
                minuteCount: 0,
                hourCount: 0,
                dayCount: 0,
                minuteLimit: this.rateLimitConfig.maxNotificationsPerMinute,
                hourLimit: this.rateLimitConfig.maxNotificationsPerHour,
                dayLimit: this.rateLimitConfig.maxNotificationsPerDay,
            };
        }

        return {
            limited: false, // Will be calculated by caller
            minuteCount: this.isWithinTimeWindow(tracker.minute.timestamp, now, 60000)
                ? tracker.minute.count
                : 0,
            hourCount: this.isWithinTimeWindow(tracker.hour.timestamp, now, 3600000)
                ? tracker.hour.count
                : 0,
            dayCount: this.isWithinTimeWindow(tracker.day.timestamp, now, 86400000)
                ? tracker.day.count
                : 0,
            minuteLimit: this.rateLimitConfig.maxNotificationsPerMinute,
            hourLimit: this.rateLimitConfig.maxNotificationsPerHour,
            dayLimit: this.rateLimitConfig.maxNotificationsPerDay,
        };
    }

    /**
     * Resets rate limit tracker for a user
     * Useful for testing or admin operations
     * 
     * @param userId User ID
     */
    resetRateLimitTracker(userId: string): void {
        this.rateLimitTrackers.delete(userId);
    }

    /**
     * Clears all rate limit trackers
     * Useful for testing
     */
    clearAllRateLimitTrackers(): void {
        this.rateLimitTrackers.clear();
    }

    /**
     * Sets a custom fallback strategy for a channel
     * 
     * @param channel Channel to set strategy for
     * @param strategy Fallback strategy
     */
    setFallbackStrategy(channel: NotificationChannel, strategy: FallbackStrategy): void {
        this.fallbackStrategies.set(channel, strategy);
    }

    /**
     * Gets fallback strategy for a channel
     * 
     * @param channel Channel to get strategy for
     * @returns Fallback strategy or undefined
     */
    getFallbackStrategy(channel: NotificationChannel): FallbackStrategy | undefined {
        return this.fallbackStrategies.get(channel);
    }

    /**
     * Handles system overload scenario
     * Implements graceful degradation
     * 
     * @param notification Notification to handle
     * @returns True if notification should be queued
     */
    handleSystemOverload(notification: Notification): boolean {
        // Critical notifications are always processed
        if (notification.priority === NotificationPriority.CRITICAL) {
            return false;
        }

        // Check system load (placeholder - would integrate with actual metrics)
        const systemLoad = this.getSystemLoad();

        // If system is overloaded, queue non-critical notifications
        if (systemLoad > 0.8) {
            console.warn(
                '[Fallback Manager] System overload detected, queuing notification',
                { notificationId: notification.id, priority: notification.priority, systemLoad }
            );
            return true;
        }

        return false;
    }

    /**
     * Gets current system load
     * Placeholder - would integrate with actual monitoring
     * 
     * @returns System load (0-1)
     */
    private getSystemLoad(): number {
        // In production, this would check:
        // - CPU usage
        // - Memory usage
        // - Queue depth
        // - Error rates
        // - Response times

        // For now, return a low value
        return 0.2;
    }
}

/**
 * Singleton instance of the fallback manager
 */
let fallbackManager: FallbackManager | null = null;

/**
 * Gets the fallback manager instance
 * @param channelRegistry Channel registry
 * @returns FallbackManager instance
 */
export function getFallbackManager(channelRegistry?: ChannelRegistry): FallbackManager {
    if (!fallbackManager && channelRegistry) {
        fallbackManager = new FallbackManager(channelRegistry);
    }
    if (!fallbackManager) {
        throw new Error('FallbackManager not initialized. Provide channelRegistry on first call.');
    }
    return fallbackManager;
}

/**
 * Resets the fallback manager instance
 * Useful for testing
 */
export function resetFallbackManager(): void {
    fallbackManager = null;
}
