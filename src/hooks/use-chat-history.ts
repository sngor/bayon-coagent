/**
 * Chat History Hook
 * 
 * React hook for managing chat history with server-side persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast';
import { withTimeout } from '@/lib/utils/timeout';

const LOADING_TIMEOUT = 10000; // 10 seconds timeout

interface ChatHistoryState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

interface ChatHistoryActions {
    loadSessions: () => Promise<void>;
    loadSession: (chatId: string) => Promise<ChatSession | null>;
    saveSession: (chatId: string, title: string, messages: ChatMessage[]) => Promise<boolean>;
    updateTitle: (chatId: string, title: string) => Promise<boolean>;
    deleteSession: (chatId: string) => Promise<boolean>;
    deleteAllSessions: () => Promise<boolean>;
    addMessage: (message: ChatMessage) => Promise<boolean>;
    setCurrentSession: (session: ChatSession | null) => void;
}

export function useChatHistory(): ChatHistoryState & ChatHistoryActions {
    const { user, isUserLoading } = useUser();
    const [state, setState] = useState<ChatHistoryState>({
        sessions: [],
        currentSession: null,
        isLoading: true,
        isSaving: false,
        error: null,
    });
    
    // Track active operations to prevent race conditions
    const activeOperationsRef = useRef(new Set<string>());

    // Helper to update state safely
    const updateState = useCallback((updates: Partial<ChatHistoryState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper to handle errors consistently
    const handleError = useCallback((error: unknown, operation: string, showToast = true) => {
        const errorMessage = error instanceof Error 
            ? error.message 
            : `Failed to ${operation}`;
        
        console.error(`Chat history error (${operation}):`, error);
        updateState({ error: errorMessage });
        
        if (showToast && !errorMessage.includes('not authenticated')) {
            showErrorToast(`Failed to ${operation}`, errorMessage);
        }
    }, [updateState]);

    // Load all chat sessions with improved error handling
    const loadSessions = useCallback(async () => {
        const operationId = 'loadSessions';
        
        // Prevent duplicate operations
        if (activeOperationsRef.current.has(operationId)) {
            return;
        }
        
        // Don't load if user is still loading
        if (isUserLoading) {
            return;
        }

        // Clear sessions if user is not authenticated
        if (!user) {
            updateState({ sessions: [], isLoading: false, error: null });
            return;
        }

        try {
            activeOperationsRef.current.add(operationId);
            updateState({ isLoading: true, error: null });

            const result = await withTimeout(
                listChatSessions(),
                LOADING_TIMEOUT,
                'Loading took too long. Please check your connection and try again.'
            );

            if (result.success) {
                updateState({ sessions: result.data, error: null });
            } else {
                const isAuthError = result.error === 'User not authenticated';
                if (isAuthError) {
                    updateState({ sessions: [], error: null });
                } else {
                    handleError(new Error(result.error || 'Failed to load chat history'), 'load chat history');
                }
            }
        } catch (error) {
            handleError(error, 'load chat sessions');
        } finally {
            activeOperationsRef.current.delete(operationId);
            updateState({ isLoading: false });
        }
    }, [user, isUserLoading, updateState, handleError]);

    // Load sessions on mount and user changes
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Cleanup active operations on unmount
    useEffect(() => {
        return () => {
            activeOperationsRef.current.clear();
        };
    }, []);

    // Load a specific chat session
    const loadSession = useCallback(async (chatId: string) => {
        try {
            const result = await loadChatHistory(chatId);

            if (result.success && result.data) {
                updateState({ currentSession: result.data });
                return result.data;
            } else {
                handleError(new Error(result.error || 'Failed to load chat'), 'load chat');
                return null;
            }
        } catch (error) {
            handleError(error, 'load chat session');
            return null;
        }
    }, [updateState, handleError]);

    // Save chat session with optimistic updates
    const saveSession = useCallback(async (
        chatId: string,
        title: string,
        messages: ChatMessage[]
    ) => {
        if (!user?.id) return false;

        try {
            updateState({ isSaving: true });
            
            // Optimistic update - add/update session in local state
            const newSession: ChatSession = {
                id: chatId,
                userId: user.id,
                title,
                messages,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: messages.length,
                lastMessage: messages[messages.length - 1]?.content || '',
            };

            // Update local state optimistically
            setState(prev => {
                const existingIndex = prev.sessions.findIndex(s => s.id === chatId);
                const updatedSessions = existingIndex >= 0
                    ? prev.sessions.map((s, i) => i === existingIndex ? newSession : s)
                    : [newSession, ...prev.sessions];
                
                return {
                    ...prev,
                    sessions: updatedSessions.sort((a, b) => 
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    )
                };
            });

            const result = await saveChatHistory(chatId, title, messages);

            if (result.success) {
                return true;
            } else {
                // Revert optimistic update on failure
                await loadSessions();
                handleError(new Error(result.error || 'Failed to save chat'), 'save chat');
                return false;
            }
        } catch (error) {
            // Revert optimistic update on error
            await loadSessions();
            handleError(error, 'save chat session');
            return false;
        } finally {
            updateState({ isSaving: false });
        }
    }, [user?.id, updateState, loadSessions, handleError]);

    // Update chat title with optimistic updates and rollback
    const updateTitle = useCallback(async (chatId: string, title: string) => {
        // Store original state for rollback
        const originalState = state;

        try {
            // Optimistic update
            setState(prev => ({
                ...prev,
                sessions: prev.sessions.map(s => (s.id === chatId ? { ...s, title } : s)),
                currentSession: prev.currentSession?.id === chatId 
                    ? { ...prev.currentSession, title } 
                    : prev.currentSession
            }));

            const result = await updateChatTitle(chatId, title);

            if (result.success) {
                showSuccessToast('Chat renamed', 'Chat title updated successfully');
                return true;
            } else {
                // Rollback on failure
                setState(originalState);
                handleError(new Error(result.error || 'Failed to rename chat'), 'rename chat');
                return false;
            }
        } catch (error) {
            // Rollback on error
            setState(originalState);
            handleError(error, 'rename chat');
            return false;
        }
    }, [state, handleError]);

    // Delete chat session
    const deleteSession = useCallback(async (chatId: string) => {
        try {
            const result = await deleteChatSession(chatId);

            if (result.success) {
                // Update local state
                setState(prev => ({
                    ...prev,
                    sessions: prev.sessions.filter(s => s.id !== chatId),
                    currentSession: prev.currentSession?.id === chatId ? null : prev.currentSession
                }));

                showSuccessToast('Chat deleted', 'Chat session deleted successfully');
                return true;
            } else {
                handleError(new Error(result.error || 'Failed to delete chat'), 'delete chat');
                return false;
            }
        } catch (error) {
            handleError(error, 'delete chat session');
            return false;
        }
    }, [handleError]);

    // Delete all chat sessions
    const deleteAllSessions = useCallback(async () => {
        try {
            const result = await deleteAllChatSessions();

            if (result.success) {
                updateState({ sessions: [], currentSession: null });
                showSuccessToast('All chats deleted', `Deleted ${result.count} chat sessions`);
                return true;
            } else {
                handleError(new Error(result.error || 'Failed to delete chats'), 'delete all chats');
                return false;
            }
        } catch (error) {
            handleError(error, 'delete all chat sessions');
            return false;
        }
    }, [updateState, handleError]);

    // Add message to current session
    const addMessage = useCallback(async (message: ChatMessage) => {
        if (!state.currentSession) return false;

        try {
            const result = await addMessageToChat(state.currentSession.id, message);

            if (result.success) {
                // Update local state
                setState(prev => {
                    if (!prev.currentSession) return prev;
                    
                    const updatedSession = {
                        ...prev.currentSession,
                        messages: [...prev.currentSession.messages, message],
                        messageCount: prev.currentSession.messageCount + 1,
                        lastMessage: message.content,
                        updatedAt: new Date().toISOString(),
                    };

                    return {
                        ...prev,
                        currentSession: updatedSession,
                        sessions: prev.sessions.map(s =>
                            s.id === prev.currentSession!.id
                                ? {
                                    ...s,
                                    messageCount: s.messageCount + 1,
                                    lastMessage: message.content,
                                    updatedAt: new Date().toISOString(),
                                }
                                : s
                        )
                    };
                });

                return true;
            } else {
                handleError(new Error(result.error || 'Failed to save message'), 'save message');
                return false;
            }
        } catch (error) {
            handleError(error, 'add message');
            return false;
        }
    }, [state.currentSession, handleError]);

    const setCurrentSession = useCallback((session: ChatSession | null) => {
        updateState({ currentSession: session });
    }, [updateState]);

    return {
        ...state,
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
