/**
 * useNotificationStream Hook
 * 
 * React hook for connecting to the real-time notification stream.
 * Uses Server-Sent Events (SSE) to receive notifications in real-time.
 * Validates Requirements: 2.1, 2.2
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Notification } from "../types";

/**
 * SSE Event Types
 */
type SSEEventType = "notification" | "ping" | "connected";

/**
 * SSE Event Data
 */
interface SSEEvent {
    type: SSEEventType;
    data: Notification | { message: string };
    timestamp: string;
}

/**
 * Hook Options
 */
interface UseNotificationStreamOptions {
    /**
     * Callback when a new notification is received
     */
    onNotification?: (notification: Notification) => void;

    /**
     * Callback when connection is established
     */
    onConnected?: () => void;

    /**
     * Callback when connection is lost
     */
    onDisconnected?: () => void;

    /**
     * Callback when an error occurs
     */
    onError?: (error: Error) => void;

    /**
     * Whether to automatically reconnect on disconnect
     * @default true
     */
    autoReconnect?: boolean;

    /**
     * Reconnection delay in milliseconds
     * @default 3000
     */
    reconnectDelay?: number;

    /**
     * Maximum number of reconnection attempts
     * @default 5
     */
    maxReconnectAttempts?: number;
}

/**
 * Hook Return Value
 */
interface UseNotificationStreamReturn {
    /**
     * Whether the stream is currently connected
     */
    isConnected: boolean;

    /**
     * Whether the stream is currently connecting
     */
    isConnecting: boolean;

    /**
     * Current error, if any
     */
    error: Error | null;

    /**
     * Number of reconnection attempts made
     */
    reconnectAttempts: number;

    /**
     * Manually reconnect to the stream
     */
    reconnect: () => void;

    /**
     * Manually disconnect from the stream
     */
    disconnect: () => void;
}

/**
 * useNotificationStream
 * 
 * Connects to the real-time notification stream and handles incoming notifications.
 * Automatically manages connection lifecycle, reconnection, and error handling.
 * 
 * @param options Hook options
 * @returns Stream state and control functions
 * 
 * @example
 * ```tsx
 * const { isConnected, error } = useNotificationStream({
 *   onNotification: (notification) => {
 *     console.log('New notification:', notification);
 *     // Update UI, show toast, etc.
 *   },
 *   onConnected: () => {
 *     console.log('Connected to notification stream');
 *   },
 * });
 * ```
 */
export function useNotificationStream(
    options: UseNotificationStreamOptions = {}
): UseNotificationStreamReturn {
    const {
        onNotification,
        onConnected,
        onDisconnected,
        onError,
        autoReconnect = true,
        reconnectDelay = 3000,
        maxReconnectAttempts = 5,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);

    /**
     * Connects to the SSE stream
     */
    const connect = useCallback(() => {
        // Don't connect if already connected or connecting
        if (eventSourceRef.current || isConnecting) {
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Create EventSource connection
            const eventSource = new EventSource("/api/notifications/stream");
            eventSourceRef.current = eventSource;

            // Handle connection open
            eventSource.addEventListener("open", () => {
                console.log("[SSE] Connection opened");
                setIsConnected(true);
                setIsConnecting(false);
                setReconnectAttempts(0);
            });

            // Handle connected event
            eventSource.addEventListener("connected", (event) => {
                console.log("[SSE] Connected event received");
                onConnected?.();
            });

            // Handle notification events
            eventSource.addEventListener("notification", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const notification = data as Notification;
                    console.log("[SSE] Notification received:", notification.id);
                    onNotification?.(notification);
                } catch (err) {
                    console.error("[SSE] Failed to parse notification:", err);
                }
            });

            // Handle ping events (keep-alive)
            eventSource.addEventListener("ping", () => {
                // Just acknowledge the ping, no action needed
            });

            // Handle errors
            eventSource.addEventListener("error", (event) => {
                console.error("[SSE] Connection error:", event);

                const err = new Error("SSE connection error");
                setError(err);
                setIsConnected(false);
                setIsConnecting(false);
                onError?.(err);

                // Close the connection
                eventSource.close();
                eventSourceRef.current = null;

                // Attempt reconnection if enabled
                if (shouldReconnectRef.current && autoReconnect) {
                    if (reconnectAttempts < maxReconnectAttempts) {
                        console.log(
                            `[SSE] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
                        );

                        reconnectTimeoutRef.current = setTimeout(() => {
                            setReconnectAttempts((prev) => prev + 1);
                            connect();
                        }, reconnectDelay);
                    } else {
                        console.error("[SSE] Max reconnection attempts reached");
                        const maxAttemptsError = new Error(
                            "Max reconnection attempts reached"
                        );
                        setError(maxAttemptsError);
                        onError?.(maxAttemptsError);
                    }
                }
            });
        } catch (err) {
            console.error("[SSE] Failed to create connection:", err);
            const connectionError =
                err instanceof Error ? err : new Error("Failed to create SSE connection");
            setError(connectionError);
            setIsConnecting(false);
            onError?.(connectionError);
        }
    }, [
        isConnecting,
        onNotification,
        onConnected,
        onError,
        autoReconnect,
        reconnectDelay,
        maxReconnectAttempts,
        reconnectAttempts,
    ]);

    /**
     * Disconnects from the SSE stream
     */
    const disconnect = useCallback(() => {
        console.log("[SSE] Disconnecting");

        // Prevent reconnection
        shouldReconnectRef.current = false;

        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close EventSource
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        onDisconnected?.();
    }, [onDisconnected]);

    /**
     * Manually reconnects to the stream
     */
    const reconnect = useCallback(() => {
        console.log("[SSE] Manual reconnect requested");
        disconnect();
        shouldReconnectRef.current = true;
        setReconnectAttempts(0);
        setTimeout(() => connect(), 100);
    }, [connect, disconnect]);

    // Connect on mount
    useEffect(() => {
        connect();

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        isConnecting,
        error,
        reconnectAttempts,
        reconnect,
        disconnect,
    };
}
