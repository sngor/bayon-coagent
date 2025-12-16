'use client';

/**
 * Real-time Context Provider
 * Centralized real-time state management following the established context pattern
 */

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useOptimizedLiveUpdates } from '@/hooks/use-optimized-live-updates';
import { useChat } from '@/hooks/use-chat';
import { LiveUpdateData, ChatMessageData, ConnectionState } from '@/types/realtime';

interface RealtimeContextValue {
    // Connection state
    connectionState: ConnectionState;
    isConnected: boolean;
    connectionError: string | null;

    // Live updates
    onLiveUpdate: (callback: (update: LiveUpdateData) => void) => () => void;
    updateContentStatus: (contentId: string, status: string, progress?: number, metadata?: any) => void;
    getContentStatus: (contentId: string) => any;

    // Chat functionality
    currentRoom: string | null;
    joinRoom: (roomId: string, roomType?: string) => void;
    leaveRoom: () => void;
    sendMessage: (message: string, messageType?: string, metadata?: any) => void;
    messages: ChatMessageData[];

    // User presence
    onlineUsers: Set<string>;
    typingUsers: Set<string>;

    // Performance metrics
    metrics: {
        totalUpdates: number;
        updatesPerSecond: number;
        averageProcessingTime: number;
    };
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps {
    children: React.ReactNode;
    enableChat?: boolean;
    enableLiveUpdates?: boolean;
}

export function RealtimeProvider({
    children,
    enableChat = true,
    enableLiveUpdates = true
}: RealtimeProviderProps) {
    // Initialize hooks conditionally
    const liveUpdates = enableLiveUpdates ? useOptimizedLiveUpdates() : null;
    const chat = enableChat ? useChat() : null;

    // Derive connection state from available services
    const connectionState: ConnectionState =
        liveUpdates?.isConnecting || chat?.isConnecting ? 'connecting' :
            liveUpdates?.isConnected || chat?.isConnected ? 'connected' :
                'disconnected';

    const isConnected = connectionState === 'connected';
    const connectionError = liveUpdates?.connectionError || chat?.connectionError || null;

    const contextValue: RealtimeContextValue = {
        connectionState,
        isConnected,
        connectionError,

        // Live updates
        onLiveUpdate: liveUpdates?.onLiveUpdate || (() => () => { }),
        updateContentStatus: liveUpdates?.updateContentStatus || (() => { }),
        getContentStatus: liveUpdates?.getContentStatus || (() => null),

        // Chat
        currentRoom: chat?.currentRoom || null,
        joinRoom: chat?.joinRoom || (() => { }),
        leaveRoom: chat?.leaveRoom || (() => { }),
        sendMessage: chat?.sendMessage || (() => { }),
        messages: chat?.messages || [],

        // Presence
        onlineUsers: chat?.onlineUsers || new Set(),
        typingUsers: chat?.typingUsers || new Set(),

        // Metrics
        metrics: liveUpdates?.metrics || {
            totalUpdates: 0,
            updatesPerSecond: 0,
            averageProcessingTime: 0
        }
    };

    return (
        <RealtimeContext.Provider value={contextValue}>
            {children}
        </RealtimeContext.Provider>
    );
}

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
}

// Specialized hooks for specific use cases
export function useContentUpdates() {
    const { onLiveUpdate, updateContentStatus, getContentStatus } = useRealtime();

    const subscribeToContent = useCallback((contentId: string, callback: (status: any) => void) => {
        return onLiveUpdate((update) => {
            if (update.resourceType === 'content' && update.resourceId === contentId) {
                const status = getContentStatus(contentId);
                callback(status);
            }
        });
    }, [onLiveUpdate, getContentStatus]);

    return {
        subscribeToContent,
        updateContentStatus,
        getContentStatus
    };
}

export function useChatRoom(roomId?: string) {
    const { joinRoom, leaveRoom, sendMessage, messages, currentRoom, onlineUsers, typingUsers } = useRealtime();

    useEffect(() => {
        if (roomId && roomId !== currentRoom) {
            joinRoom(roomId);
        }

        return () => {
            if (roomId && roomId === currentRoom) {
                leaveRoom();
            }
        };
    }, [roomId, currentRoom, joinRoom, leaveRoom]);

    const roomMessages = messages.filter(msg => msg.roomId === roomId);

    return {
        messages: roomMessages,
        sendMessage,
        onlineUsers,
        typingUsers,
        isInRoom: currentRoom === roomId
    };
}