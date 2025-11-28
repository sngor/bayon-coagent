/**
 * Notification Broadcaster
 * 
 * Manages real-time notification broadcasting using Server-Sent Events (SSE).
 * Provides pub/sub functionality for in-app notifications.
 * Validates Requirements: 2.1, 2.2
 */

import { Notification } from "../types";
import { EventEmitter } from "events";

/**
 * SSE Client Connection
 * Represents an active SSE connection for a user
 */
interface SSEClient {
    userId: string;
    controller: ReadableStreamDefaultController;
    lastEventId: number;
}

/**
 * Notification Event
 * Event data sent to SSE clients
 */
interface NotificationEvent {
    id: number;
    type: "notification" | "ping" | "connected";
    data: Notification | { message: string };
    timestamp: string;
}

/**
 * NotificationBroadcaster
 * 
 * Singleton service for broadcasting notifications to connected clients.
 * Uses Server-Sent Events (SSE) for real-time updates.
 */
export class NotificationBroadcaster extends EventEmitter {
    private clients: Map<string, SSEClient[]> = new Map();
    private eventIdCounter: number = 0;
    private pingInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startPingInterval();
    }

    /**
     * Registers a new SSE client connection
     * 
     * @param userId User ID
     * @param controller ReadableStream controller for SSE
     * @returns Cleanup function to call on disconnect
     */
    registerClient(
        userId: string,
        controller: ReadableStreamDefaultController
    ): () => void {
        const client: SSEClient = {
            userId,
            controller,
            lastEventId: this.eventIdCounter,
        };

        // Add client to the map
        if (!this.clients.has(userId)) {
            this.clients.set(userId, []);
        }
        this.clients.get(userId)!.push(client);

        console.log(`[Broadcaster] Client connected for user ${userId}. Total clients: ${this.getTotalClientCount()}`);

        // Send initial connection event
        this.sendToClient(client, {
            id: this.getNextEventId(),
            type: "connected",
            data: { message: "Connected to notification stream" },
            timestamp: new Date().toISOString(),
        });

        // Return cleanup function
        return () => this.unregisterClient(userId, client);
    }

    /**
     * Unregisters an SSE client connection
     * 
     * @param userId User ID
     * @param client Client to remove
     */
    private unregisterClient(userId: string, client: SSEClient): void {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const index = userClients.indexOf(client);
            if (index > -1) {
                userClients.splice(index, 1);
            }

            // Remove user entry if no more clients
            if (userClients.length === 0) {
                this.clients.delete(userId);
            }
        }

        console.log(`[Broadcaster] Client disconnected for user ${userId}. Total clients: ${this.getTotalClientCount()}`);
    }

    /**
     * Broadcasts a notification to a specific user
     * 
     * @param userId User ID to broadcast to
     * @param notification Notification to broadcast
     */
    async broadcastToUser(userId: string, notification: Notification): Promise<void> {
        const userClients = this.clients.get(userId);

        if (!userClients || userClients.length === 0) {
            console.log(`[Broadcaster] No connected clients for user ${userId}`);
            return;
        }

        const event: NotificationEvent = {
            id: this.getNextEventId(),
            type: "notification",
            data: notification,
            timestamp: new Date().toISOString(),
        };

        console.log(`[Broadcaster] Broadcasting notification ${notification.id} to ${userClients.length} client(s) for user ${userId}`);

        // Send to all connected clients for this user
        for (const client of userClients) {
            this.sendToClient(client, event);
        }

        // Emit event for monitoring/logging
        this.emit("notification-broadcast", { userId, notification });
    }

    /**
     * Broadcasts a notification to multiple users
     * 
     * @param userIds Array of user IDs
     * @param notification Notification to broadcast
     */
    async broadcastToUsers(userIds: string[], notification: Notification): Promise<void> {
        await Promise.all(
            userIds.map(userId => this.broadcastToUser(userId, notification))
        );
    }

    /**
     * Sends an event to a specific client
     * 
     * @param client SSE client
     * @param event Event to send
     */
    private sendToClient(client: SSEClient, event: NotificationEvent): void {
        try {
            const sseData = this.formatSSEMessage(event);
            client.controller.enqueue(new TextEncoder().encode(sseData));
            client.lastEventId = event.id;
        } catch (error) {
            console.error(`[Broadcaster] Failed to send to client:`, error);
            // Client connection may be closed, will be cleaned up on next ping
        }
    }

    /**
     * Formats an event as SSE message
     * 
     * @param event Event to format
     * @returns SSE formatted string
     */
    private formatSSEMessage(event: NotificationEvent): string {
        const lines: string[] = [];

        // Event ID
        lines.push(`id: ${event.id}`);

        // Event type
        lines.push(`event: ${event.type}`);

        // Event data (JSON)
        const dataJson = JSON.stringify({
            ...event.data,
            timestamp: event.timestamp,
        });
        lines.push(`data: ${dataJson}`);

        // Empty line to signal end of event
        lines.push("");
        lines.push("");

        return lines.join("\n");
    }

    /**
     * Sends ping to all connected clients to keep connections alive
     */
    private sendPingToAll(): void {
        const allClients = Array.from(this.clients.values()).flat();

        for (const client of allClients) {
            try {
                const pingEvent: NotificationEvent = {
                    id: this.getNextEventId(),
                    type: "ping",
                    data: { message: "ping" },
                    timestamp: new Date().toISOString(),
                };
                this.sendToClient(client, pingEvent);
            } catch (error) {
                // Client connection is dead, will be cleaned up
                console.error(`[Broadcaster] Failed to ping client:`, error);
            }
        }
    }

    /**
     * Starts the ping interval to keep connections alive
     */
    private startPingInterval(): void {
        // Send ping every 30 seconds to keep connections alive
        this.pingInterval = setInterval(() => {
            if (this.getTotalClientCount() > 0) {
                this.sendPingToAll();
            }
        }, 30000);
    }

    /**
     * Stops the ping interval
     */
    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Gets the next event ID
     * 
     * @returns Next event ID
     */
    private getNextEventId(): number {
        return ++this.eventIdCounter;
    }

    /**
     * Gets the total number of connected clients
     * 
     * @returns Total client count
     */
    getTotalClientCount(): number {
        return Array.from(this.clients.values()).reduce(
            (sum, clients) => sum + clients.length,
            0
        );
    }

    /**
     * Gets the number of connected clients for a user
     * 
     * @param userId User ID
     * @returns Client count for user
     */
    getUserClientCount(userId: string): number {
        return this.clients.get(userId)?.length || 0;
    }

    /**
     * Gets all connected user IDs
     * 
     * @returns Array of user IDs with active connections
     */
    getConnectedUserIds(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Closes all connections and cleans up
     */
    shutdown(): void {
        console.log(`[Broadcaster] Shutting down. Closing ${this.getTotalClientCount()} connections.`);

        // Stop ping interval
        this.stopPingInterval();

        // Close all client connections
        for (const userClients of this.clients.values()) {
            for (const client of userClients) {
                try {
                    client.controller.close();
                } catch (error) {
                    // Ignore errors on close
                }
            }
        }

        // Clear all clients
        this.clients.clear();

        // Remove all event listeners
        this.removeAllListeners();
    }
}

/**
 * Singleton instance of the notification broadcaster
 */
let notificationBroadcaster: NotificationBroadcaster | null = null;

/**
 * Gets the notification broadcaster instance
 * @returns NotificationBroadcaster instance
 */
export function getNotificationBroadcaster(): NotificationBroadcaster {
    if (!notificationBroadcaster) {
        notificationBroadcaster = new NotificationBroadcaster();
    }
    return notificationBroadcaster;
}

/**
 * Resets the notification broadcaster instance
 * Useful for testing
 */
export function resetNotificationBroadcaster(): void {
    if (notificationBroadcaster) {
        notificationBroadcaster.shutdown();
    }
    notificationBroadcaster = null;
}
