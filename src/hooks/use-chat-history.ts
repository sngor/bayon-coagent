/**
 * Chat History Hook
 * 
 * React hook for managing chat history with server-side persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
    saveChatHistory,
    loadChatHistory,
    listChatSessions,
    updateChatTitle,
    deleteChatSession,
    deleteAllChatSessions,
    addMessageToChat,
    type ChatSession,
    type ChatMessage,
} from '@/app/chat-history-actions';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';

export function useChatHistory() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load all chat sessions
    const loadSessions = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const result = await listChatSessions();

            if (result.success) {
                setSessions(result.data);
            } else {
                console.error('Failed to load chat sessions:', result.error);
                toast({
                    variant: 'destructive',
                    title: 'Failed to load chat history',
                    description: result.error,
                });
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Load a specific chat session
    const loadSession = useCallback(async (chatId: string) => {
        try {
            const result = await loadChatHistory(chatId);

            if (result.success && result.data) {
                setCurrentSession(result.data);
                return result.data;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load chat',
                    description: result.error,
                });
                return null;
            }
        } catch (error) {
            console.error('Error loading chat session:', error);
            return null;
        }
    }, []);

    // Save chat session
    const saveSession = useCallback(async (
        chatId: string,
        title: string,
        messages: ChatMessage[]
    ) => {
        try {
            setIsSaving(true);
            const result = await saveChatHistory(chatId, title, messages);

            if (result.success) {
                // Reload sessions to get updated list
                await loadSessions();
                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to save chat',
                    description: result.error,
                });
                return false;
            }
        } catch (error) {
            console.error('Error saving chat session:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [loadSessions]);

    // Update chat title
    const updateTitle = useCallback(async (chatId: string, title: string) => {
        try {
            const result = await updateChatTitle(chatId, title);

            if (result.success) {
                // Update local state
                setSessions(prev =>
                    prev.map(s => (s.id === chatId ? { ...s, title } : s))
                );

                if (currentSession?.id === chatId) {
                    setCurrentSession(prev => prev ? { ...prev, title } : null);
                }

                toast({
                    title: 'Chat renamed',
                    description: 'Chat title updated successfully',
                });
                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to rename chat',
                    description: result.error,
                });
                return false;
            }
        } catch (error) {
            console.error('Error updating chat title:', error);
            return false;
        }
    }, [currentSession]);

    // Delete chat session
    const deleteSession = useCallback(async (chatId: string) => {
        try {
            const result = await deleteChatSession(chatId);

            if (result.success) {
                // Update local state
                setSessions(prev => prev.filter(s => s.id !== chatId));

                if (currentSession?.id === chatId) {
                    setCurrentSession(null);
                }

                toast({
                    title: 'Chat deleted',
                    description: 'Chat session deleted successfully',
                });
                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to delete chat',
                    description: result.error,
                });
                return false;
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            return false;
        }
    }, [currentSession]);

    // Delete all chat sessions
    const deleteAllSessions = useCallback(async () => {
        try {
            const result = await deleteAllChatSessions();

            if (result.success) {
                setSessions([]);
                setCurrentSession(null);

                toast({
                    title: 'All chats deleted',
                    description: `Deleted ${result.count} chat sessions`,
                });
                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to delete chats',
                    description: result.error,
                });
                return false;
            }
        } catch (error) {
            console.error('Error deleting all chat sessions:', error);
            return false;
        }
    }, []);

    // Add message to current session
    const addMessage = useCallback(async (message: ChatMessage) => {
        if (!currentSession) return false;

        try {
            const result = await addMessageToChat(currentSession.id, message);

            if (result.success) {
                // Update local state
                setCurrentSession(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: [...prev.messages, message],
                        messageCount: prev.messageCount + 1,
                        lastMessage: message.content,
                        updatedAt: new Date().toISOString(),
                    };
                });

                // Update sessions list
                setSessions(prev =>
                    prev.map(s =>
                        s.id === currentSession.id
                            ? {
                                ...s,
                                messageCount: s.messageCount + 1,
                                lastMessage: message.content,
                                updatedAt: new Date().toISOString(),
                            }
                            : s
                    )
                );

                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to save message',
                    description: result.error,
                });
                return false;
            }
        } catch (error) {
            console.error('Error adding message:', error);
            return false;
        }
    }, [currentSession]);

    return {
        sessions,
        currentSession,
        isLoading,
        isSaving,
        loadSessions,
        loadSession,
        saveSession,
        updateTitle,
        deleteSession,
        deleteAllSessions,
        addMessage,
        setCurrentSession,
    };
}
