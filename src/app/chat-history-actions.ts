'use server';

/**
 * Chat History Server Actions
 * 
 * Manages chat conversation history with server-side persistence in DynamoDB
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';

// Types
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    lastMessage: string;
}

// Validation schemas
const SaveChatSchema = z.object({
    chatId: z.string().min(1),
    title: z.string().min(1),
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
    })),
});

const UpdateChatTitleSchema = z.object({
    chatId: z.string().min(1),
    title: z.string().min(1).max(200),
});

/**
 * Save or update a chat session
 */
export async function saveChatHistory(
    chatId: string,
    title: string,
    messages: ChatMessage[]
) {
    try {
        // Validate input
        const validated = SaveChatSchema.parse({ chatId, title, messages });

        // Get current user
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        // Prepare chat session data
        const chatSession: ChatSession = {
            id: validated.chatId,
            userId,
            title: validated.title,
            messages: validated.messages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: validated.messages.length,
            lastMessage: validated.messages[validated.messages.length - 1]?.content || '',
        };

        // Save to DynamoDB
        await repository.create(
            `USER#${userId}`,
            `CHAT#${validated.chatId}`,
            'ChatSession',
            chatSession
        );

        return {
            success: true,
            data: chatSession,
        };
    } catch (error) {
        console.error('Failed to save chat history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save chat history',
        };
    }
}

/**
 * Load a specific chat session
 */
export async function loadChatHistory(chatId: string) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        const result = await repository.get<ChatSession>(
            `USER#${userId}`,
            `CHAT#${chatId}`
        );

        if (!result) {
            return {
                success: false,
                error: 'Chat session not found',
            };
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('Failed to load chat history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load chat history',
        };
    }
}

/**
 * List all chat sessions for the current user
 */
export async function listChatSessions() {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
                data: [],
            };
        }
        const userId = user.id;

        const repository = getRepository();

        const results = await repository.query<ChatSession>(
            `USER#${userId}`,
            'CHAT#'
        );

        // Sort by updatedAt descending (most recent first)
        const sessions = results.items.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return {
            success: true,
            data: sessions,
        };
    } catch (error) {
        console.error('Failed to list chat sessions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list chat sessions',
            data: [],
        };
    }
}

/**
 * Update chat session title
 */
export async function updateChatTitle(chatId: string, title: string) {
    try {
        const validated = UpdateChatTitleSchema.parse({ chatId, title });

        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        // Get existing chat
        const existing = await repository.get<ChatSession>(
            `USER#${userId}`,
            `CHAT#${validated.chatId}`
        );

        if (!existing) {
            return {
                success: false,
                error: 'Chat session not found',
            };
        }

        // Update title and updatedAt
        await repository.update<ChatSession>(
            `USER#${userId}`,
            `CHAT#${validated.chatId}`,
            {
                title: validated.title,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            success: true,
            message: 'Chat title updated',
        };
    } catch (error) {
        console.error('Failed to update chat title:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update chat title',
        };
    }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(chatId: string) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        await repository.delete(
            `USER#${userId}`,
            `CHAT#${chatId}`
        );

        return {
            success: true,
            message: 'Chat session deleted',
        };
    } catch (error) {
        console.error('Failed to delete chat session:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete chat session',
        };
    }
}

/**
 * Delete all chat sessions for the current user
 */
export async function deleteAllChatSessions() {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        // Get all chat sessions
        const results = await repository.query<ChatSession>(
            `USER#${userId}`,
            'CHAT#'
        );

        // Delete each session
        await Promise.all(
            results.items.map(session =>
                repository.delete(
                    `USER#${userId}`,
                    `CHAT#${session.id}`
                )
            )
        );

        return {
            success: true,
            message: `Deleted ${results.count} chat sessions`,
            count: results.count,
        };
    } catch (error) {
        console.error('Failed to delete all chat sessions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete all chat sessions',
        };
    }
}

/**
 * Add a message to an existing chat session
 */
export async function addMessageToChat(
    chatId: string,
    message: ChatMessage
) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }
        const userId = user.id;

        const repository = getRepository();

        // Get existing chat
        const existing = await repository.get<ChatSession>(
            `USER#${userId}`,
            `CHAT#${chatId}`
        );

        if (!existing) {
            return {
                success: false,
                error: 'Chat session not found',
            };
        }

        // Add new message
        const updatedMessages = [...existing.messages, message];

        // Update chat session
        await repository.update<ChatSession>(
            `USER#${userId}`,
            `CHAT#${chatId}`,
            {
                messages: updatedMessages,
                messageCount: updatedMessages.length,
                lastMessage: message.content,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            success: true,
            message: 'Message added to chat',
        };
    } catch (error) {
        console.error('Failed to add message to chat:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add message to chat',
        };
    }
}
