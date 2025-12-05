/**
 * WebSocket Service for Admin Platform
 * 
 * Provides real-time updates for:
 * - Job progress tracking
 * - System health alerts
 * - Live analytics updates
 * 
 * Uses Server-Sent Events (SSE) as a simpler alternative to WebSockets
 * for one-way server-to-client communication.
 */

export interface SSEMessage {
    type: 'job_progress' | 'job_complete' | 'job_failed' | 'system_alert' | 'analytics_update';
    data: any;
    timestamp: number;
}

export interface SSEConnection {
    userId: string;
    connectionId: string;
    connectedAt: number;
    lastActivity: number;
}

/**
 * SSE Connection Manager
 * Manages active SSE connections for real-time updates
 */
export class SSEConnectionManager {
    private connections: Map<string, Set<(message: SSEMessage) => void>>;
    private connectionMetadata: Map<string, SSEConnection>;

    constructor() {
        this.connections = new Map();
        this.connectionMetadata = new Map();
    }

    /**
     * Registers a new SSE connection
     */
    connect(
        userId: string,
        connectionId: string,
        callback: (message: SSEMessage) => void
    ): void {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }

        this.connections.get(userId)!.add(callback);

        this.connectionMetadata.set(connectionId, {
            userId,
            connectionId,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
        });

        console.log(`SSE connection established: ${connectionId} for user ${userId}`);
    }

    /**
     * Removes an SSE connection
     */
    disconnect(userId: string, callback: (message: SSEMessage) => void): void {
        const userConnections = this.connections.get(userId);
        if (userConnections) {
            userConnections.delete(callback);

            if (userConnections.size === 0) {
                this.connections.delete(userId);
            }
        }

        // Clean up metadata
        for (const [connectionId, metadata] of this.connectionMetadata.entries()) {
            if (metadata.userId === userId) {
                this.connectionMetadata.delete(connectionId);
            }
        }

        console.log(`SSE connection closed for user ${userId}`);
    }

    /**
     * Sends a message to a specific user
     */
    sendToUser(userId: string, message: SSEMessage): void {
        const userConnections = this.connections.get(userId);
        if (!userConnections) {
            return;
        }

        for (const callback of userConnections) {
            try {
                callback(message);
            } catch (error) {
                console.error('Failed to send SSE message:', error);
            }
        }

        // Update last activity
        for (const [connectionId, metadata] of this.connectionMetadata.entries()) {
            if (metadata.userId === userId) {
                metadata.lastActivity = Date.now();
            }
        }
    }

    /**
     * Broadcasts a message to all connected users
     */
    broadcast(message: SSEMessage): void {
        for (const userId of this.connections.keys()) {
            this.sendToUser(userId, message);
        }
    }

    /**
     * Gets active connection count
     */
    getConnectionCount(): number {
        return this.connectionMetadata.size;
    }

    /**
     * Gets active connections for a user
     */
    getUserConnectionCount(userId: string): number {
        return this.connections.get(userId)?.size || 0;
    }

    /**
     * Cleans up stale connections (no activity for 5 minutes)
     */
    cleanupStaleConnections(): void {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const staleConnections: string[] = [];

        for (const [connectionId, metadata] of this.connectionMetadata.entries()) {
            if (metadata.lastActivity < fiveMinutesAgo) {
                staleConnections.push(connectionId);
            }
        }

        for (const connectionId of staleConnections) {
            const metadata = this.connectionMetadata.get(connectionId);
            if (metadata) {
                const userConnections = this.connections.get(metadata.userId);
                if (userConnections) {
                    // We can't directly remove the callback, so we'll just remove the metadata
                    // The actual connection will be cleaned up when it times out
                    this.connectionMetadata.delete(connectionId);
                }
            }
        }

        if (staleConnections.length > 0) {
            console.log(`Cleaned up ${staleConnections.length} stale SSE connections`);
        }
    }
}

// Singleton instance
let sseManager: SSEConnectionManager | null = null;

/**
 * Gets the singleton SSE connection manager
 */
export function getSSEManager(): SSEConnectionManager {
    if (!sseManager) {
        sseManager = new SSEConnectionManager();

        // Set up periodic cleanup
        setInterval(() => {
            sseManager?.cleanupStaleConnections();
        }, 60000); // Every minute
    }

    return sseManager;
}

/**
 * Helper functions for sending specific message types
 */
export const SSEHelpers = {
    /**
     * Sends job progress update
     */
    sendJobProgress(
        userId: string,
        jobId: string,
        progress: number,
        status: string,
        processedItems?: number,
        totalItems?: number
    ): void {
        const manager = getSSEManager();
        manager.sendToUser(userId, {
            type: 'job_progress',
            data: {
                jobId,
                progress,
                status,
                processedItems,
                totalItems,
            },
            timestamp: Date.now(),
        });
    },

    /**
     * Sends job completion notification
     */
    sendJobComplete(
        userId: string,
        jobId: string,
        result: any
    ): void {
        const manager = getSSEManager();
        manager.sendToUser(userId, {
            type: 'job_complete',
            data: {
                jobId,
                result,
            },
            timestamp: Date.now(),
        });
    },

    /**
     * Sends job failure notification
     */
    sendJobFailed(
        userId: string,
        jobId: string,
        error: string
    ): void {
        const manager = getSSEManager();
        manager.sendToUser(userId, {
            type: 'job_failed',
            data: {
                jobId,
                error,
            },
            timestamp: Date.now(),
        });
    },

    /**
     * Sends system alert to all admins
     */
    sendSystemAlert(
        severity: 'info' | 'warning' | 'critical',
        message: string,
        metadata?: Record<string, any>
    ): void {
        const manager = getSSEManager();
        manager.broadcast({
            type: 'system_alert',
            data: {
                severity,
                message,
                metadata,
            },
            timestamp: Date.now(),
        });
    },

    /**
     * Sends analytics update
     */
    sendAnalyticsUpdate(
        userId: string,
        metrics: any
    ): void {
        const manager = getSSEManager();
        manager.sendToUser(userId, {
            type: 'analytics_update',
            data: metrics,
            timestamp: Date.now(),
        });
    },
};

/**
 * Creates an SSE response for Next.js API routes
 */
export function createSSEResponse(
    userId: string,
    onConnect?: () => void
): ReadableStream {
    const encoder = new TextEncoder();
    const manager = getSSEManager();
    const connectionId = `${userId}-${Date.now()}`;

    return new ReadableStream({
        start(controller) {
            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({
                type: 'connected',
                connectionId,
                timestamp: Date.now(),
            })}\n\n`;
            controller.enqueue(encoder.encode(initialMessage));

            // Register connection
            const callback = (message: SSEMessage) => {
                const data = `data: ${JSON.stringify(message)}\n\n`;
                try {
                    controller.enqueue(encoder.encode(data));
                } catch (error) {
                    console.error('Failed to send SSE message:', error);
                }
            };

            manager.connect(userId, connectionId, callback);

            if (onConnect) {
                onConnect();
            }

            // Send keep-alive every 30 seconds
            const keepAliveInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': keep-alive\n\n'));
                } catch (error) {
                    clearInterval(keepAliveInterval);
                }
            }, 30000);

            // Cleanup on close
            return () => {
                clearInterval(keepAliveInterval);
                manager.disconnect(userId, callback);
            };
        },
    });
}
