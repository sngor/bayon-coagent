/**
 * Context Window Manager
 * 
 * Manages sliding context windows that include relevant historical information
 * for task execution. Ensures context windows contain the most relevant memories
 * based on recency, importance, and semantic relevance.
 * 
 * Requirements: 7.4
 */

import type {
    MemoryEntry,
    ContextWindowConfig,
    PrioritizedMemory,
} from './types';
import { getLongTermMemoryStore } from './long-term-memory-store';

/**
 * ContextWindowManager - Manages sliding context windows for task execution
 */
export class ContextWindowManager {
    private memoryStore = getLongTermMemoryStore();

    /**
     * Creates a context window for a specific topic/task
     * 
     * Retrieves and prioritizes memories to create an optimal context window
     * that includes all relevant historical information.
     * 
     * @param strandId - Strand identifier
     * @param topic - Topic or task description
     * @param config - Context window configuration
     * @returns Array of prioritized memories for the context window
     */
    async createContextWindow(
        strandId: string,
        topic: string,
        config: ContextWindowConfig
    ): Promise<PrioritizedMemory[]> {
        // Retrieve candidate memories
        const memories = await this.retrieveCandidateMemories(strandId, config);

        // Calculate relevance scores for each memory
        const scoredMemories = memories.map(memory => {
            const relevanceScore = this.calculateRelevanceScore(memory, topic);
            const recencyScore = this.calculateRecencyScore(memory);
            const priority = this.calculatePriority(memory, relevanceScore, recencyScore);

            return {
                memory,
                priority,
                recencyScore,
                relevanceScore,
            };
        });

        // Filter by minimum relevance if specified
        let filtered = scoredMemories;
        if (config.minRelevance !== undefined) {
            filtered = scoredMemories.filter(m => m.relevanceScore >= config.minRelevance!);
        }

        // Sort by priority (highest first)
        filtered.sort((a, b) => b.priority - a.priority);

        // Apply size limit
        const limited = filtered.slice(0, config.maxSize);

        return limited;
    }

    /**
     * Updates a context window with new information
     * 
     * @param currentWindow - Current context window
     * @param newMemory - New memory to potentially add
     * @param config - Context window configuration
     * @returns Updated context window
     */
    updateContextWindow(
        currentWindow: PrioritizedMemory[],
        newMemory: MemoryEntry,
        config: ContextWindowConfig
    ): PrioritizedMemory[] {
        // Calculate scores for new memory
        const relevanceScore = this.calculateRelevanceScore(newMemory, '');
        const recencyScore = this.calculateRecencyScore(newMemory);
        const priority = this.calculatePriority(newMemory, relevanceScore, recencyScore);

        const newEntry: PrioritizedMemory = {
            memory: newMemory,
            priority,
            recencyScore,
            relevanceScore,
        };

        // Add new memory to window
        const updated = [...currentWindow, newEntry];

        // Re-sort by priority
        updated.sort((a, b) => b.priority - a.priority);

        // Apply size limit
        return updated.slice(0, config.maxSize);
    }

    /**
     * Retrieves candidate memories for context window
     */
    private async retrieveCandidateMemories(
        strandId: string,
        config: ContextWindowConfig
    ): Promise<MemoryEntry[]> {
        const filters: any = {
            limit: config.maxSize * 3, // Get more candidates than needed
        };

        // Apply time window filter if specified
        if (config.timeWindow) {
            const now = new Date();
            const start = new Date(now.getTime() - config.timeWindow);
            filters.dateRange = {
                start: start.toISOString(),
                end: now.toISOString(),
            };
        }

        // Apply type filter if specified
        if (config.includeTypes && config.includeTypes.length > 0) {
            // Note: This will require multiple queries or post-filtering
            // For now, we'll retrieve all and filter
        }

        const memories = await this.memoryStore.retrieveMemory(strandId, filters);

        // Convert to array of memory entries
        const allMemories: MemoryEntry[] = [];

        // Extract memories from agent memory structure
        Object.entries(memories.workingMemory).forEach(([key, value]) => {
            allMemories.push({
                id: key,
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'context',
                    importance: 0.7,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['working-memory'],
                },
                createdAt: new Date().toISOString(),
            });
        });

        Object.entries(memories.knowledgeBase).forEach(([key, value]) => {
            allMemories.push({
                id: key,
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'knowledge',
                    importance: 0.8,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['knowledge-base'],
                },
                createdAt: new Date().toISOString(),
            });
        });

        memories.recentTasks.forEach(task => {
            allMemories.push({
                id: task.taskId,
                strandId,
                content: JSON.stringify(task),
                metadata: {
                    type: 'task',
                    importance: task.success ? 0.6 : 0.4,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['task-history'],
                    relatedTasks: [task.taskId],
                },
                createdAt: task.timestamp,
            });
        });

        Object.entries(memories.learnedPatterns).forEach(([key, value]) => {
            allMemories.push({
                id: key,
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'pattern',
                    importance: 0.9,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['learned-pattern'],
                },
                createdAt: new Date().toISOString(),
            });
        });

        // Filter by type if specified
        if (config.includeTypes && config.includeTypes.length > 0) {
            return allMemories.filter(m => config.includeTypes!.includes(m.metadata.type));
        }

        return allMemories;
    }

    /**
     * Calculates relevance score for a memory relative to a topic
     * 
     * Uses simple keyword matching for now. In production, this would use
     * semantic similarity with embeddings.
     */
    private calculateRelevanceScore(memory: MemoryEntry, topic: string): number {
        if (!topic) {
            // If no topic specified, use importance as relevance
            return memory.metadata.importance;
        }

        const topicLower = topic.toLowerCase();
        const contentLower = memory.content.toLowerCase();

        // Simple keyword matching
        const topicWords = topicLower.split(/\s+/);
        const matchCount = topicWords.filter(word =>
            word.length > 3 && contentLower.includes(word)
        ).length;

        const matchRatio = matchCount / Math.max(topicWords.length, 1);

        // Combine with importance
        return (matchRatio * 0.6) + (memory.metadata.importance * 0.4);
    }

    /**
     * Calculates recency score based on creation and access times
     */
    private calculateRecencyScore(memory: MemoryEntry): number {
        const now = Date.now();
        const created = new Date(memory.createdAt).getTime();
        const lastAccessed = new Date(memory.metadata.lastAccessed).getTime();

        // Calculate age in days
        const createdAge = (now - created) / (1000 * 60 * 60 * 24);
        const accessAge = (now - lastAccessed) / (1000 * 60 * 60 * 24);

        // Exponential decay for creation age (half-life of 30 days)
        const createdScore = Math.exp(-createdAge / 30);

        // Exponential decay for access age (half-life of 7 days)
        const accessScore = Math.exp(-accessAge / 7);

        // Combine scores (access is more important)
        return (createdScore * 0.3) + (accessScore * 0.7);
    }

    /**
     * Calculates overall priority score
     * 
     * Combines relevance, recency, importance, and access count
     */
    private calculatePriority(
        memory: MemoryEntry,
        relevanceScore: number,
        recencyScore: number
    ): number {
        const importance = memory.metadata.importance;
        const accessBonus = Math.min(memory.metadata.accessCount / 10, 0.2);

        // Weighted combination
        const priority =
            (relevanceScore * 0.4) +
            (recencyScore * 0.3) +
            (importance * 0.2) +
            (accessBonus * 0.1);

        return priority;
    }

    /**
     * Gets memories within a specific time window
     */
    async getMemoriesInTimeWindow(
        strandId: string,
        windowMs: number
    ): Promise<MemoryEntry[]> {
        const now = new Date();
        const start = new Date(now.getTime() - windowMs);

        const memories = await this.memoryStore.retrieveMemory(strandId, {
            dateRange: {
                start: start.toISOString(),
                end: now.toISOString(),
            },
        });

        // Convert agent memory to memory entries
        const entries: MemoryEntry[] = [];

        memories.recentTasks.forEach(task => {
            entries.push({
                id: task.taskId,
                strandId,
                content: JSON.stringify(task),
                metadata: {
                    type: 'task',
                    importance: task.success ? 0.6 : 0.4,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['task-history'],
                    relatedTasks: [task.taskId],
                },
                createdAt: task.timestamp,
            });
        });

        return entries;
    }

    /**
     * Clears old memories from context window based on time
     */
    pruneContextWindow(
        window: PrioritizedMemory[],
        maxAge: number
    ): PrioritizedMemory[] {
        const cutoff = Date.now() - maxAge;

        return window.filter(entry => {
            const created = new Date(entry.memory.createdAt).getTime();
            return created > cutoff;
        });
    }
}

/**
 * Singleton instance
 */
let contextWindowManagerInstance: ContextWindowManager | null = null;

/**
 * Get the singleton ContextWindowManager instance
 */
export function getContextWindowManager(): ContextWindowManager {
    if (!contextWindowManagerInstance) {
        contextWindowManagerInstance = new ContextWindowManager();
    }
    return contextWindowManagerInstance;
}

/**
 * Reset the ContextWindowManager singleton (useful for testing)
 */
export function resetContextWindowManager(): void {
    contextWindowManagerInstance = null;
}
