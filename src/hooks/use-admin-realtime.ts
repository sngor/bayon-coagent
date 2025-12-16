import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RealtimeEvent<T = any> {
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: T;
    timestamp: string;
}

interface UseAdminRealtimeOptions {
    enabled?: boolean;
    entities?: string[];
    onEvent?: (event: RealtimeEvent) => void;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}) {
    const { enabled = true, entities = [], onEvent } = options;
    const { toast } = useToast();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttempts = useRef(0);

    const connect = useCallback(() => {
        if (!enabled || typeof window === 'undefined') return;

        try {
            // TODO: Replace with actual WebSocket endpoint
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/admin';
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('Admin realtime connection established');
                reconnectAttempts.current = 0;

                // Subscribe to specific entities
                if (entities.length > 0) {
                    wsRef.current?.send(JSON.stringify({
                        type: 'subscribe',
                        entities
                    }));
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
                    onEvent?.(realtimeEvent);

                    // Show toast for important updates
                    if (realtimeEvent.type === 'create') {
                        toast({
                            title: "New Item Created",
                            description: `A new ${realtimeEvent.entity} was created`,
                        });
                    }
                } catch (error) {
                    console.error('Failed to parse realtime event:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('Admin realtime connection closed');

                // Attempt to reconnect with exponential backoff
                if (enabled && reconnectAttempts.current < 5) {
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('Admin realtime connection error:', error);
            };

        } catch (error) {
            console.error('Failed to establish realtime connection:', error);
        }
    }, [enabled, entities, onEvent, toast]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
        reconnectAttempts: reconnectAttempts.current,
        disconnect
    };
}