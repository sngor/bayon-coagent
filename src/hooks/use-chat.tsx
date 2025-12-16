'use client';

/**
 * Chat Hook for Real-time Messaging
 * Provides chat functionality with message history and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './use-websocket';
import { useUser } from '@/aws/auth/use-user';

export interface ChatMessage {
    messageId: string;
    roomId: string;
    senderId: string;
    senderName?: string;
    message: string;
    messageType: 'text' | 'image' | 'file' | 'system';
    metadata?: {
        fileName?: string;
        fileSize?: number;
        imageUrl?: string;
        mentions?: string[];
    };
    timestamp: number;
    status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

export interface ChatRoom {
    roomId: string;
    roomType: 'chat' | 'collaboration' | 'content-review' | 'team';
    name: string;
    members: string[];
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface UseChatReturn {
    // Connection status
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Current room
    currentRoom: string | null;
    joinRoom: (roomId: string, roomType?: string) => void;
    leaveRoom: () => void;

    // Messages
    messages: ChatMessage[];
    sendMessage: (message: string, messageType?: string, metadata?: any) => void;

    // Rooms
    rooms: ChatRoom[];
    createRoom: (name: string, roomType: string, members: string[]) => void;

    // Status
    onlineUsers: Set<string>;
    typingUsers: Set<string>;
    startTyping: () => void;
    stopTyping: () => void;
}

export function useChat(): UseChatReturn {
    const { user } = useUser();
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesRef = useRef<ChatMessage[]>([]);

    // Update ref when messages change
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
        switch (wsMessage.type) {
            case 'chatMessage':
                const newMessage: ChatMessage = {
                    messageId: wsMessage.data.messageId,
                    roomId: wsMessage.data.roomId,
                    senderId: wsMessage.data.senderId,
                    message: wsMessage.data.message,
                    messageType: wsMessage.data.messageType || 'text',
                    metadata: wsMessage.data.metadata || {},
                    timestamp: wsMessage.data.timestamp,
                    status: 'delivered'
                };

                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(msg => msg.messageId === newMessage.messageId)) {
                        return prev;
                    }
                    return [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp);
                });
                break;

            case 'messageConfirmation':
                setMessages(prev => prev.map(msg =>
                    msg.messageId === wsMessage.data.messageId
                        ? { ...msg, status: 'sent' }
                        : msg
                ));
                break;

            case 'userJoined':
                if (wsMessage.data.roomId === currentRoom) {
                    setOnlineUsers(prev => new Set([...prev, wsMessage.data.userId]));
                }
                break;

            case 'userLeft':
                if (wsMessage.data.roomId === currentRoom) {
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(wsMessage.data.userId);
                        return newSet;
                    });
                }
                break;

            case 'userOnline':
                setOnlineUsers(prev => new Set([...prev, wsMessage.data.userId]));
                break;

            case 'userOffline':
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(wsMessage.data.userId);
                    return newSet;
                });
                break;

            case 'userTyping':
                if (wsMessage.data.roomId === currentRoom && wsMessage.data.userId !== user?.id) {
                    setTypingUsers(prev => new Set([...prev, wsMessage.data.userId]));

                    // Remove typing indicator after timeout
                    setTimeout(() => {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(wsMessage.data.userId);
                            return newSet;
                        });
                    }, 3000);
                }
                break;

            case 'roomJoined':
                setCurrentRoom(wsMessage.data.roomId);
                // Load message history for the room
                loadMessageHistory(wsMessage.data.roomId);
                break;

            case 'roomLeft':
                if (wsMessage.data.roomId === currentRoom) {
                    setCurrentRoom(null);
                    setMessages([]);
                    setOnlineUsers(new Set());
                    setTypingUsers(new Set());
                }
                break;

            case 'error':
                console.error('Chat error:', wsMessage.message || 'Unknown error');
                break;
        }
    }, [currentRoom, user?.userId]);

    const {
        isConnected,
        isConnecting,
        connectionError,
        sendMessage: sendWebSocketMessage,
        joinRoom: joinWebSocketRoom,
        leaveRoom: leaveWebSocketRoom
    } = useWebSocket(handleWebSocketMessage);

    const joinRoom = useCallback((roomId: string, roomType: string = 'chat') => {
        if (currentRoom) {
            leaveWebSocketRoom(currentRoom);
        }

        joinWebSocketRoom(roomId, roomType);
        setCurrentRoom(roomId);
    }, [currentRoom, joinWebSocketRoom, leaveWebSocketRoom]);

    const leaveRoom = useCallback(() => {
        if (currentRoom) {
            leaveWebSocketRoom(currentRoom);
            setCurrentRoom(null);
            setMessages([]);
            setOnlineUsers(new Set());
            setTypingUsers(new Set());
        }
    }, [currentRoom, leaveWebSocketRoom]);

    const sendMessage = useCallback((
        message: string,
        messageType: string = 'text',
        metadata: any = {}
    ) => {
        if (!currentRoom || !user) return;

        const tempMessageId = `temp-${Date.now()}`;
        const timestamp = Date.now();

        // Add optimistic message
        const optimisticMessage: ChatMessage = {
            messageId: tempMessageId,
            roomId: currentRoom,
            senderId: user.id,
            message,
            messageType: messageType as any,
            metadata,
            timestamp,
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMessage]);

        // Send via WebSocket
        sendWebSocketMessage({
            action: 'sendMessage',
            roomId: currentRoom,
            message,
            messageType,
            metadata
        });
    }, [currentRoom, user, sendWebSocketMessage]);

    const createRoom = useCallback((name: string, roomType: string, members: string[]) => {
        // TODO: Implement room creation API call
        console.log('Creating room:', { name, roomType, members });
    }, []);

    const startTyping = useCallback(() => {
        if (!currentRoom) return;

        sendWebSocketMessage({
            action: 'typing',
            roomId: currentRoom,
            typing: true
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [currentRoom, sendWebSocketMessage]);

    const stopTyping = useCallback(() => {
        if (!currentRoom) return;

        sendWebSocketMessage({
            action: 'typing',
            roomId: currentRoom,
            typing: false
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [currentRoom, sendWebSocketMessage]);

    const loadMessageHistory = useCallback(async (roomId: string) => {
        try {
            // TODO: Implement API call to load message history
            console.log('Loading message history for room:', roomId);

            // For now, just clear messages
            setMessages([]);
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }, []);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        connectionError,
        currentRoom,
        joinRoom,
        leaveRoom,
        messages,
        sendMessage,
        rooms,
        createRoom,
        onlineUsers,
        typingUsers,
        startTyping,
        stopTyping
    };
}