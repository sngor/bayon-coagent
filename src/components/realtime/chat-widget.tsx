'use client';

/**
 * Chat Widget Component
 * Provides a floating chat interface for real-time communication
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageCircle,
    Send,
    X,
    Minimize2,
    Users,
    Circle,
    Image,
    Paperclip
} from 'lucide-react';
import { useChat, ChatMessage } from '@/hooks/use-chat';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
    defaultRoom?: string;
    className?: string;
}

export function ChatWidget({ defaultRoom, className }: ChatWidgetProps) {
    const { user } = useUser();
    const {
        isConnected,
        isConnecting,
        connectionError,
        currentRoom,
        joinRoom,
        leaveRoom,
        messages,
        sendMessage,
        onlineUsers,
        typingUsers,
        startTyping,
        stopTyping
    } = useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Join default room on mount
    useEffect(() => {
        if (defaultRoom && isConnected && !currentRoom) {
            joinRoom(defaultRoom, 'team');
        }
    }, [defaultRoom, isConnected, currentRoom, joinRoom]);

    // Update unread count when widget is closed
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== user?.userId) {
                setUnreadCount(prev => prev + 1);
            }
        } else if (isOpen) {
            setUnreadCount(0);
        }
    }, [messages, isOpen, user?.userId]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !currentRoom) return;

        sendMessage(messageInput.trim());
        setMessageInput('');
        stopTyping();
    };

    const handleInputChange = (value: string) => {
        setMessageInput(value);

        // Handle typing indicators
        if (value.trim()) {
            startTyping();

            // Reset typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                stopTyping();
            }, 1000);
        } else {
            stopTyping();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMessageStatusIcon = (status?: string) => {
        switch (status) {
            case 'sending':
                return <Circle className="w-3 h-3 text-gray-400 animate-pulse" />;
            case 'sent':
                return <Circle className="w-3 h-3 text-blue-500" />;
            case 'delivered':
                return <Circle className="w-3 h-3 text-green-500" />;
            case 'failed':
                return <Circle className="w-3 h-3 text-red-500" />;
            default:
                return null;
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
                    className
                )}
                size="icon"
            >
                <MessageCircle className="h-6 w-6" />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Button>
        );
    }

    return (
        <Card className={cn(
            "fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50 flex flex-col",
            isMinimized && "h-12",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Team Chat
                    {isConnected && (
                        <Badge variant="secondary" className="text-xs">
                            <Circle className="w-2 h-2 fill-green-500 text-green-500 mr-1" />
                            Online
                        </Badge>
                    )}
                </CardTitle>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <Minimize2 className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <CardContent className="flex-1 flex flex-col p-0">
                    {/* Connection Status */}
                    {!isConnected && (
                        <div className="px-4 py-2 bg-yellow-50 border-b text-sm text-yellow-700">
                            {isConnecting ? 'Connecting...' : connectionError || 'Disconnected'}
                        </div>
                    )}

                    {/* Online Users */}
                    {onlineUsers.size > 0 && (
                        <div className="px-4 py-2 border-b bg-gray-50">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Users className="h-3 w-3" />
                                {onlineUsers.size} online
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-3 py-4">
                            {messages.map((message) => (
                                <MessageBubble
                                    key={message.messageId}
                                    message={message}
                                    isOwn={message.senderId === user?.userId}
                                    formatTime={formatTime}
                                    getStatusIcon={getMessageStatusIcon}
                                />
                            ))}

                            {/* Typing Indicators */}
                            {typingUsers.size > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                    {Array.from(typingUsers).join(', ')} typing...
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="border-t p-4">
                        <div className="flex items-center gap-2">
                            <Input
                                ref={inputRef}
                                value={messageInput}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1"
                                disabled={!isConnected || !currentRoom}
                            />

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={!isConnected}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={!isConnected}
                            >
                                <Image className="h-4 w-4" />
                            </Button>

                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim() || !isConnected || !currentRoom}
                                className="h-8 w-8"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    formatTime: (timestamp: number) => string;
    getStatusIcon: (status?: string) => React.ReactNode;
}

function MessageBubble({ message, isOwn, formatTime, getStatusIcon }: MessageBubbleProps) {
    return (
        <div className={cn(
            "flex gap-2",
            isOwn ? "justify-end" : "justify-start"
        )}>
            {!isOwn && (
                <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                        {message.senderName?.charAt(0) || message.senderId.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn(
                "max-w-[70%] space-y-1",
                isOwn && "items-end"
            )}>
                {!isOwn && (
                    <div className="text-xs text-gray-500 font-medium">
                        {message.senderName || message.senderId}
                    </div>
                )}

                <div className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                )}>
                    {message.messageType === 'text' && message.message}
                    {message.messageType === 'image' && (
                        <div className="space-y-2">
                            {message.metadata?.imageUrl && (
                                <img
                                    src={message.metadata.imageUrl}
                                    alt="Shared image"
                                    className="rounded max-w-full h-auto"
                                />
                            )}
                            {message.message && <div>{message.message}</div>}
                        </div>
                    )}
                    {message.messageType === 'file' && (
                        <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span>{message.metadata?.fileName || 'File'}</span>
                            {message.metadata?.fileSize && (
                                <span className="text-xs opacity-70">
                                    ({(message.metadata.fileSize / 1024).toFixed(1)}KB)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className={cn(
                    "flex items-center gap-1 text-xs text-gray-500",
                    isOwn ? "justify-end" : "justify-start"
                )}>
                    <span>{formatTime(message.timestamp)}</span>
                    {isOwn && getStatusIcon(message.status)}
                </div>
            </div>
        </div>
    );
}