'use client';

/**
 * WebSocket Hook for Real-time Communication
 * Provides WebSocket connection management and message handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, useSession } from '@/aws/auth/use-user';
import {
    WebSocketMessage,
    TypedWebSocketMessage,
    ConnectionState,
    WebSocketMessageType
} from '@/types/realtime';

export interface WebSocketConfig {
    autoReconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
}

export interface UseWebSocketReturn {
    connectionState: ConnectionState;
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;
    sendMessage: (message: any) => boolean; // Return success status
    joinRoom: (roomId: string, roomType?: string) => boolean;
    leaveRoom: (roomId: string) => boolean;
    updateStatus: (resourceType: string, resourceId: string, status: string, metadata?: any) => boolean;
    lastMessage: TypedWebSocketMessage | null;
    connectionId: string | null;
    reconnectAttempts: number;
    forceReconnect: () => void;
}

const DEFAULT_CONFIG: WebSocketConfig = {
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
};

export function useWebSocket(
    onMessage?: (message: WebSocketMessage) => void,
    config: WebSocketConfig = {}
): UseWebSocketReturn {
    const { user } = useUser();
    const session = useSession();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [connectionId, setConnectionId] = useState<string | null>(null);

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    const connect = useCallback(() => {
        if (!user || !session?.accessToken || wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const wsUrl = process.env.NODE_ENV === 'production'
                ? `wss://your-websocket-api.execute-api.us-east-1.amazonaws.com/production`
                : `wss://your-websocket-api.execute-api.us-east-1.amazonaws.com/development`;

            const url = `${wsUrl}?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(session.accessToken)}`;

            wsRef.current = new WebSocket(url);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setIsConnecting(false);
                setConnectionError(null);
                reconnectAttemptsRef.current = 0;

                // Start heartbeat
                startHeartbeat();
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(message);

                    // Handle system messages
                    if (message.type === 'connectionConfirmed') {
                        setConnectionId(message.data?.connectionId || null);
                    }

                    // Call user-provided message handler
                    onMessage?.(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                setConnectionId(null);

                // Stop heartbeat
                if (heartbeatTimeoutRef.current) {
                    clearTimeout(heartbeatTimeoutRef.current);
                }

                // Auto-reconnect if enabled and not a normal closure
                if (finalConfig.autoReconnect && event.code !== 1000 && reconnectAttemptsRef.current < finalConfig.maxReconnectAttempts!) {
                    reconnectAttemptsRef.current++;
                    setConnectionError(`Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${finalConfig.maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, finalConfig.reconnectInterval);
                } else if (reconnectAttemptsRef.current >= finalConfig.maxReconnectAttempts!) {
                    setConnectionError('Failed to reconnect after maximum attempts');
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionError('WebSocket connection error');
                setIsConnecting(false);
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setConnectionError('Failed to create WebSocket connection');
            setIsConnecting(false);
        }
    }, [user, token, onMessage, finalConfig]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        setConnectionId(null);
    }, []);

    const startHeartbeat = useCallback(() => {
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
        }

        heartbeatTimeoutRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'ping' }));
                startHeartbeat(); // Schedule next heartbeat
            }
        }, finalConfig.heartbeatInterval);
    }, [finalConfig.heartbeatInterval]);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', message);
        }
    }, []);

    const joinRoom = useCallback((roomId: string, roomType: string = 'chat') => {
        sendMessage({
            action: 'joinRoom',
            roomId,
            roomType
        });
    }, [sendMessage]);

    const leaveRoom = useCallback((roomId: string) => {
        sendMessage({
            action: 'leaveRoom',
            roomId
        });
    }, [sendMessage]);

    const updateStatus = useCallback((
        resourceType: string,
        resourceId: string,
        status: string,
        metadata?: any
    ) => {
        sendMessage({
            action: 'updateStatus',
            resourceType,
            resourceId,
            status,
            metadata
        });
    }, [sendMessage]);

    // Connect when user is available
    useEffect(() => {
        if (user && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [user, session, connect, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isConnecting,
        connectionError,
        sendMessage,
        joinRoom,
        leaveRoom,
        updateStatus,
        lastMessage,
        connectionId
    };
}