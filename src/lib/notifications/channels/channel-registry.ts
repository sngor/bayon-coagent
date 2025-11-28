/**
 * Channel Registry
 * 
 * Manages registration and routing of notification channel handlers.
 * Validates Requirements: 1.2, 1.3
 */

import {
    Notification,
    NotificationPreferences,
    NotificationRecipient,
    DeliveryResult,
    NotificationChannel,
} from "../types";
import { ChannelHandler } from "./base-channel-handler";

/**
 * Channel Registry
 * Central registry for managing channel handlers
 */
export class ChannelRegistry {
    private handlers: Map<NotificationChannel, ChannelHandler>;

    constructor() {
        this.handlers = new Map();
    }

    /**
     * Registers a channel handler
     * 
     * @param handler Channel handler to register
     * @throws Error if handler for this channel is already registered
     */
    register(handler: ChannelHandler): void {
        if (this.handlers.has(handler.channel)) {
            throw new Error(`Handler for channel ${handler.channel} is already registered`);
        }

        this.handlers.set(handler.channel, handler);
        console.log(`[Channel Registry] Registered handler for channel: ${handler.channel}`);
    }

    /**
     * Unregisters a channel handler
     * 
     * @param channel Channel to unregister
     * @returns True if handler was unregistered, false if not found
     */
    unregister(channel: NotificationChannel): boolean {
        const result = this.handlers.delete(channel);
        if (result) {
            console.log(`[Channel Registry] Unregistered handler for channel: ${channel}`);
        }
        return result;
    }

    /**
     * Gets a handler for a specific channel
     * 
     * @param channel Channel to get handler for
     * @returns Channel handler or undefined if not found
     */
    getHandler(channel: NotificationChannel): ChannelHandler | undefined {
        return this.handlers.get(channel);
    }

    /**
     * Gets all registered handlers
     * 
     * @returns Array of all registered handlers
     */
    getAllHandlers(): ChannelHandler[] {
        return Array.from(this.handlers.values());
    }

    /**
     * Gets handlers that can deliver a notification
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns Array of handlers that can deliver the notification
     */
    getCapableHandlers(
        notification: Notification,
        preferences: NotificationPreferences
    ): ChannelHandler[] {
        const capableHandlers: ChannelHandler[] = [];

        for (const channel of notification.channels) {
            const handler = this.handlers.get(channel);
            if (handler && handler.canHandle(notification, preferences)) {
                capableHandlers.push(handler);
            }
        }

        return capableHandlers;
    }

    /**
     * Routes a notification to appropriate handlers and delivers it
     * 
     * @param notification Notification to deliver
     * @param recipient Recipient information
     * @returns Array of delivery results from all handlers
     */
    async routeNotification(
        notification: Notification,
        recipient: NotificationRecipient
    ): Promise<DeliveryResult[]> {
        const results: DeliveryResult[] = [];

        // Get handlers that can deliver this notification
        const capableHandlers = this.getCapableHandlers(notification, recipient.preferences);

        if (capableHandlers.length === 0) {
            console.warn(
                `[Channel Registry] No capable handlers found for notification ${notification.id}`
            );
            return [{
                success: false,
                channel: notification.channels[0] || NotificationChannel.IN_APP,
                error: "No capable handlers found for this notification",
                timestamp: new Date().toISOString(),
            }];
        }

        // Deliver through each capable handler
        for (const handler of capableHandlers) {
            try {
                const result = await handler.deliver(notification, recipient);
                results.push(result);
            } catch (error) {
                console.error(
                    `[Channel Registry] Handler ${handler.channel} failed:`,
                    error
                );
                results.push({
                    success: false,
                    channel: handler.channel,
                    error: error instanceof Error ? error.message : "Unknown error",
                    timestamp: new Date().toISOString(),
                });
            }
        }

        return results;
    }

    /**
     * Checks if a handler is registered for a channel
     * 
     * @param channel Channel to check
     * @returns True if handler is registered
     */
    hasHandler(channel: NotificationChannel): boolean {
        return this.handlers.has(channel);
    }

    /**
     * Gets the number of registered handlers
     * 
     * @returns Number of registered handlers
     */
    getHandlerCount(): number {
        return this.handlers.size;
    }

    /**
     * Clears all registered handlers
     * Useful for testing
     */
    clear(): void {
        this.handlers.clear();
        console.log('[Channel Registry] Cleared all handlers');
    }
}

/**
 * Singleton instance of the channel registry
 */
let channelRegistry: ChannelRegistry | null = null;

/**
 * Gets the channel registry instance
 * @returns ChannelRegistry instance
 */
export function getChannelRegistry(): ChannelRegistry {
    if (!channelRegistry) {
        channelRegistry = new ChannelRegistry();
    }
    return channelRegistry;
}

/**
 * Resets the channel registry instance
 * Useful for testing
 */
export function resetChannelRegistry(): void {
    channelRegistry = null;
}
