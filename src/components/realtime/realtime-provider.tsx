'use client';

/**
 * Real-Time Provider Component
 * Provides real-time communication context to the entire application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useChat } from '@/hooks/use-chat';
import { useLiveUpdates } from '@/hooks/use-live-updates';
import { useUser } from '@/aws/auth/use-user';
import { toast } from '@/hooks/use-toast';

interface RealtimeContextType {
    // WebSocket connection
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Chat functionality
    chat: ReturnType<typeof useChat>;

    // Live updates
    liveUpdates: ReturnType<typeof useLiveUpdates>;

    // Notification handlers
    showNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
}

interface RealtimeProviderProps {
    children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        timestamp: number;
    }>>([]);

    // Initialize real-time hooks
    const chat = useChat();
    const liveUpdates = useLiveUpdates();

    // Get connection status from WebSocket
    const { isConnected, isConnecting, connectionError } = chat;

    // Handle system notifications
    const showNotification = (
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ) => {
        const notification = {
            id: `notification-${Date.now()}`,
            title,
            message,
            type,
            timestamp: Date.now()
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

        // Show toast notification
        toast({
            title,
            description: message,
            variant: type === 'error' ? 'destructive' : 'default'
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };

    // Listen for live updates and show notifications
    useEffect(() => {
        const unsubscribe = liveUpdates.onLiveUpdate((update) => {
            // Show notifications for important status changes
            if (update.resourceType === 'content') {
                switch (update.status) {
                    case 'completed':
                    case 'published':
                        showNotification(
                            'Content Ready',
                            `Your ${update.resourceType} has been ${update.status}`,
                            'success'
                        );
                        break;
                    case 'failed':
                    case 'error':
                        showNotification(
                            'Content Error',
                            `There was an issue with your ${update.resourceType}: ${update.metadata?.error || 'Unknown error'}`,
                            'error'
                        );
                        break;
                    case 'generating':
                        if (update.progress === 0) {
                            showNotification(
                                'Content Generation Started',
                                `Your ${update.resourceType} is being generated`,
                                'info'
                            );
                        }
                        break;
                }
            }
        });

        return unsubscribe;
    }, [liveUpdates]);

    // Show connection status notifications
    useEffect(() => {
        if (user && isConnected) {
            showNotification(
                'Connected',
                'Real-time features are now active',
                'success'
            );
        } else if (user && connectionError) {
            showNotification(
                'Connection Error',
                'Real-time features are temporarily unavailable',
                'warning'
            );
        }
    }, [isConnected, connectionError, user]);

    const contextValue: RealtimeContextType = {
        isConnected,
        isConnecting,
        connectionError,
        chat,
        liveUpdates,
        showNotification
    };

    return (
        <RealtimeContext.Provider value={contextValue}>
            {children}
        </RealtimeContext.Provider>
    );
}