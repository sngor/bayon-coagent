/**
 * Chat History Migration Utility
 * 
 * Migrates chat history from localStorage to DynamoDB
 */

import { saveChatHistory } from '@/app/chat-history-actions';

export interface LocalStorageChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
    messages: Array<{
        role: 'user' | 'ai';
        content: string;
        timestamp: string;
    }>;
}

/**
 * Migrate chat history from localStorage to DynamoDB
 */
export async function migrateChatHistoryToServer(userId: string): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let migrated = 0;

    try {
        // Get chat history from localStorage
        const localStorageKey = `chat-history-${userId}`;
        const savedHistory = localStorage.getItem(localStorageKey);

        if (!savedHistory) {
            return {
                success: true,
                migrated: 0,
                errors: ['No chat history found in localStorage'],
            };
        }

        const chatHistory: LocalStorageChatSession[] = JSON.parse(savedHistory);

        // Migrate each chat session
        for (const session of chatHistory) {
            try {
                // Convert 'ai' role to 'assistant' for consistency
                const messages = session.messages.map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' as const : msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp,
                }));

                // Save to DynamoDB
                const result = await saveChatHistory(
                    session.id,
                    session.title,
                    messages
                );

                if (result.success) {
                    migrated++;
                } else {
                    errors.push(`Failed to migrate chat ${session.id}: ${result.error}`);
                }
            } catch (error) {
                errors.push(
                    `Error migrating chat ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'
                    }`
                );
            }
        }

        // If all migrations successful, clear localStorage
        if (errors.length === 0) {
            localStorage.removeItem(localStorageKey);
            console.log(`✅ Migrated ${migrated} chat sessions to server`);
        }

        return {
            success: errors.length === 0,
            migrated,
            errors,
        };
    } catch (error) {
        return {
            success: false,
            migrated,
            errors: [
                `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'
                }`,
            ],
        };
    }
}

/**
 * Check if user has localStorage chat history that needs migration
 */
export function hasLocalChatHistory(userId: string): boolean {
    if (typeof window === 'undefined') return false;

    const localStorageKey = `chat-history-${userId}`;
    const savedHistory = localStorage.getItem(localStorageKey);

    return !!savedHistory;
}

/**
 * Get count of chat sessions in localStorage
 */
export function getLocalChatHistoryCount(userId: string): number {
    if (typeof window === 'undefined') return 0;

    const localStorageKey = `chat-history-${userId}`;
    const savedHistory = localStorage.getItem(localStorageKey);

    if (!savedHistory) return 0;

    try {
        const chatHistory: LocalStorageChatSession[] = JSON.parse(savedHistory);
        return chatHistory.length;
    } catch {
        return 0;
    }
}
