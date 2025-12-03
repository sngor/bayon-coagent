/**
 * Long-Term Memory Store
 * 
 * Provides persistent storage for agent strand memories using DynamoDB.
 * Supports memory persistence, retrieval, semantic search, and consolidation.
 * 
 * Requirements: 7.1, 7.3
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { AgentMemory } from '../agent-core';
import type {
    MemoryEntry,
    MemoryFilters,
    ConsolidatedMemory,
    MemoryMetadata,
    SimilarityResult,
} from './types';
import { getSemanticSearchEngine } from './semantic-search-engine';

/**
 * LongTermMemoryStore - Manages persistent memory storage in DynamoDB
 */
export class LongTermMemoryStore {
    private repository = getRepository();
    private semanticSearchEngine = getSemanticSearchEngine();

    /**
     * Persists strand memory to DynamoDB
     * 
     * Converts working memory and knowledge base entries into persistent
     * memory entries with proper indexing and metadata.
     * 
     * @param strandId - Strand identifier
     * @param memory - Agent memory to persist
     */
    async persistMemory(strandId: string, memory: AgentMemory): Promise<void> {
        const memoriesToPersist: MemoryEntry[] = [];

        // Convert working memory to memory entries
        Object.entries(memory.workingMemory).forEach(([key, value]) => {
            const entry: MemoryEntry = {
                id: this.generateMemoryId(),
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'context',
                    importance: 0.7, // Default importance for working memory
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['working-memory', key],
                    source: 'working-memory',
                },
                createdAt: new Date().toISOString(),
            };
            memoriesToPersist.push(entry);
        });

        // Convert knowledge base to memory entries
        Object.entries(memory.knowledgeBase).forEach(([key, value]) => {
            const entry: MemoryEntry = {
                id: this.generateMemoryId(),
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'knowledge',
                    importance: 0.8, // Higher importance for knowledge
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['knowledge-base', key],
                    source: 'knowledge-base',
                },
                createdAt: new Date().toISOString(),
            };
            memoriesToPersist.push(entry);
        });

        // Convert learned patterns to memory entries
        Object.entries(memory.learnedPatterns).forEach(([key, value]) => {
            const entry: MemoryEntry = {
                id: this.generateMemoryId(),
                strandId,
                content: JSON.stringify(value),
                metadata: {
                    type: 'pattern',
                    importance: 0.9, // High importance for learned patterns
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['learned-pattern', key],
                    source: 'learned-patterns',
                },
                createdAt: new Date().toISOString(),
            };
            memoriesToPersist.push(entry);
        });

        // Convert recent tasks to memory entries
        memory.recentTasks.forEach(task => {
            const entry: MemoryEntry = {
                id: this.generateMemoryId(),
                strandId,
                content: JSON.stringify(task),
                metadata: {
                    type: 'task',
                    importance: task.success ? 0.6 : 0.4,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['task-history', task.taskType],
                    relatedTasks: [task.taskId],
                    source: 'task-history',
                },
                createdAt: task.timestamp,
            };
            memoriesToPersist.push(entry);
        });

        // Generate embeddings for memories (in batches for efficiency)
        if (memoriesToPersist.length > 0) {
            try {
                const contents = memoriesToPersist.map(m => m.content);
                const embeddings = await this.semanticSearchEngine.batchGenerateEmbeddings(contents);

                // Attach embeddings to memories
                memoriesToPersist.forEach((memory, index) => {
                    memory.embedding = embeddings[index];
                });
            } catch (error) {
                console.warn('Failed to generate embeddings for memories:', error);
                // Continue without embeddings - they can be generated on-demand during search
            }

            // Batch write all memories
            await this.batchWriteMemories(memoriesToPersist);
        }
    }

    /**
     * Retrieves strand memory from storage
     * 
     * @param strandId - Strand identifier
     * @param filters - Optional filters for memory retrieval
     * @returns Agent memory reconstructed from storage
     */
    async retrieveMemory(
        strandId: string,
        filters?: MemoryFilters
    ): Promise<AgentMemory> {
        const memories = await this.queryMemories(strandId, filters);

        // Reconstruct agent memory from stored entries
        const agentMemory: AgentMemory = {
            workingMemory: {},
            knowledgeBase: {},
            recentTasks: [],
            learnedPatterns: {},
        };

        memories.forEach(memory => {
            try {
                const content = JSON.parse(memory.content);

                switch (memory.metadata.type) {
                    case 'context':
                        if (memory.metadata.source === 'working-memory') {
                            const key = memory.metadata.tags.find(t => t !== 'working-memory') || memory.id;
                            agentMemory.workingMemory[key] = content;
                        }
                        break;

                    case 'knowledge':
                        if (memory.metadata.source === 'knowledge-base') {
                            const key = memory.metadata.tags.find(t => t !== 'knowledge-base') || memory.id;
                            agentMemory.knowledgeBase[key] = content;
                        }
                        break;

                    case 'pattern':
                        if (memory.metadata.source === 'learned-patterns') {
                            const key = memory.metadata.tags.find(t => t !== 'learned-pattern') || memory.id;
                            agentMemory.learnedPatterns[key] = content;
                        }
                        break;

                    case 'task':
                        if (memory.metadata.source === 'task-history') {
                            agentMemory.recentTasks.push(content);
                        }
                        break;
                }

                // Update access count
                this.updateAccessCount(memory.id, strandId);
            } catch (error) {
                console.error(`Failed to parse memory ${memory.id}:`, error);
            }
        });

        // Sort recent tasks by timestamp (most recent first)
        agentMemory.recentTasks.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return agentMemory;
    }

    /**
     * Searches memory using semantic similarity
     * 
     * Uses embeddings to find contextually similar content rather than
     * just keyword matching. Results are ranked by semantic similarity.
     * 
     * @param query - Search query text
     * @param strandId - Strand identifier
     * @param limit - Maximum number of results
     * @returns Array of similar memories with relevance scores
     */
    async semanticSearch(
        query: string,
        strandId: string,
        limit: number = 10
    ): Promise<SimilarityResult[]> {
        // Get all memories for the strand
        const memories = await this.queryMemories(strandId);

        // Use semantic search engine to find similar memories
        return this.semanticSearchEngine.searchMemories(query, memories, limit);
    }

    /**
     * Consolidates old memories to reduce storage and improve performance
     * 
     * Groups similar memories from a time period and creates consolidated
     * summaries while preserving key insights.
     * 
     * @param strandId - Strand identifier
     * @param olderThan - Consolidate memories older than this date
     */
    async consolidateMemories(strandId: string, olderThan: Date): Promise<void> {
        // Query old memories
        const oldMemories = await this.queryMemories(strandId, {
            dateRange: {
                start: new Date(0).toISOString(),
                end: olderThan.toISOString(),
            },
        });

        if (oldMemories.length === 0) {
            return;
        }

        // Group memories by type and time period (weekly)
        const groups = this.groupMemoriesForConsolidation(oldMemories);

        // Consolidate each group
        for (const group of groups) {
            if (group.length < 3) {
                // Don't consolidate small groups
                continue;
            }

            const consolidated = await this.createConsolidatedMemory(group);

            // Create new consolidated memory entry
            const consolidatedEntry: MemoryEntry = {
                id: this.generateMemoryId(),
                strandId,
                content: JSON.stringify(consolidated),
                metadata: {
                    type: 'knowledge',
                    importance: consolidated.importance,
                    accessCount: 0,
                    lastAccessed: new Date().toISOString(),
                    tags: ['consolidated', ...this.extractCommonTags(group)],
                    source: 'consolidation',
                },
                createdAt: new Date().toISOString(),
            };

            // Save consolidated memory
            await this.saveMemory(consolidatedEntry);

            // Delete original memories
            await this.deleteMemories(group.map(m => m.id), strandId);
        }
    }

    /**
     * Query memories from DynamoDB
     */
    private async queryMemories(
        strandId: string,
        filters?: MemoryFilters
    ): Promise<MemoryEntry[]> {
        const pk = `STRAND#${strandId}`;
        const skPrefix = 'MEMORY#';

        const result = await this.repository.query<MemoryEntry>(
            pk,
            skPrefix,
            {
                limit: filters?.limit || 1000,
                scanIndexForward: false, // Most recent first
            }
        );

        let memories = result.items;

        // Apply filters
        if (filters) {
            memories = memories.filter(memory => {
                // Filter by type
                if (filters.type && memory.metadata.type !== filters.type) {
                    return false;
                }

                // Filter by importance
                if (filters.minImportance && memory.metadata.importance < filters.minImportance) {
                    return false;
                }

                // Filter by tags
                if (filters.tags && filters.tags.length > 0) {
                    const hasTag = filters.tags.some(tag =>
                        memory.metadata.tags.includes(tag)
                    );
                    if (!hasTag) return false;
                }

                // Filter by date range
                if (filters.dateRange) {
                    const createdAt = new Date(memory.createdAt).getTime();
                    const start = new Date(filters.dateRange.start).getTime();
                    const end = new Date(filters.dateRange.end).getTime();
                    if (createdAt < start || createdAt > end) {
                        return false;
                    }
                }

                // Filter expired memories
                if (!filters.includeExpired && memory.expiresAt) {
                    const now = new Date().getTime();
                    const expires = new Date(memory.expiresAt).getTime();
                    if (now > expires) {
                        return false;
                    }
                }

                return true;
            });
        }

        return memories;
    }

    /**
     * Save a single memory entry
     */
    private async saveMemory(memory: MemoryEntry): Promise<void> {
        const pk = `STRAND#${memory.strandId}`;
        const sk = `MEMORY#${memory.id}`;

        await this.repository.create(pk, sk, 'MemoryEntry', memory);
    }

    /**
     * Batch write multiple memories
     */
    private async batchWriteMemories(memories: MemoryEntry[]): Promise<void> {
        const items = memories.map(memory => ({
            PK: `STRAND#${memory.strandId}`,
            SK: `MEMORY#${memory.id}`,
            EntityType: 'MemoryEntry' as const,
            Data: memory,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        }));

        await this.repository.batchWrite(items, []);
    }

    /**
     * Delete multiple memories
     */
    private async deleteMemories(memoryIds: string[], strandId: string): Promise<void> {
        const keys = memoryIds.map(id => ({
            PK: `STRAND#${strandId}`,
            SK: `MEMORY#${id}`,
        }));

        await this.repository.batchWrite([], keys);
    }

    /**
     * Update access count for a memory
     */
    private async updateAccessCount(memoryId: string, strandId: string): Promise<void> {
        const pk = `STRAND#${strandId}`;
        const sk = `MEMORY#${memoryId}`;

        try {
            // Increment access count and update last accessed time
            await this.repository.update(pk, sk, {
                'metadata.accessCount': 1, // This will be incremented
                'metadata.lastAccessed': new Date().toISOString(),
            });
        } catch (error) {
            // Silently fail - access tracking is not critical
            console.warn(`Failed to update access count for memory ${memoryId}:`, error);
        }
    }

    /**
     * Group memories for consolidation
     */
    private groupMemoriesForConsolidation(memories: MemoryEntry[]): MemoryEntry[][] {
        const groups: Map<string, MemoryEntry[]> = new Map();

        memories.forEach(memory => {
            // Group by type and week
            const date = new Date(memory.createdAt);
            const weekKey = `${memory.metadata.type}_${this.getWeekKey(date)}`;

            if (!groups.has(weekKey)) {
                groups.set(weekKey, []);
            }
            groups.get(weekKey)!.push(memory);
        });

        return Array.from(groups.values());
    }

    /**
     * Create consolidated memory from a group
     */
    private async createConsolidatedMemory(
        memories: MemoryEntry[]
    ): Promise<ConsolidatedMemory> {
        // Extract key information
        const contents = memories.map(m => m.content);
        const importance = memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length;

        // Create summary (simple concatenation for now - could use AI summarization)
        const summary = this.summarizeContents(contents);

        // Get time period
        const timestamps = memories.map(m => new Date(m.createdAt).getTime());
        const start = new Date(Math.min(...timestamps)).toISOString();
        const end = new Date(Math.max(...timestamps)).toISOString();

        return {
            originalIds: memories.map(m => m.id),
            summary,
            importance,
            period: { start, end },
            count: memories.length,
        };
    }

    /**
     * Summarize memory contents
     */
    private summarizeContents(contents: string[]): string {
        // Simple summarization - take first 500 chars of each and combine
        // In production, this could use AI summarization
        const summaries = contents.map(c => c.substring(0, 500));
        return summaries.join('\n---\n');
    }

    /**
     * Extract common tags from memories
     */
    private extractCommonTags(memories: MemoryEntry[]): string[] {
        const tagCounts = new Map<string, number>();

        memories.forEach(memory => {
            memory.metadata.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        // Return tags that appear in at least 50% of memories
        const threshold = memories.length * 0.5;
        return Array.from(tagCounts.entries())
            .filter(([_, count]) => count >= threshold)
            .map(([tag, _]) => tag);
    }

    /**
     * Get week key for grouping
     */
    private getWeekKey(date: Date): string {
        const year = date.getFullYear();
        const week = this.getWeekNumber(date);
        return `${year}_W${week}`;
    }

    /**
     * Get ISO week number
     */
    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    /**
     * Generate unique memory ID
     */
    private generateMemoryId(): string {
        return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}

/**
 * Singleton instance
 */
let memoryStoreInstance: LongTermMemoryStore | null = null;

/**
 * Get the singleton LongTermMemoryStore instance
 */
export function getLongTermMemoryStore(): LongTermMemoryStore {
    if (!memoryStoreInstance) {
        memoryStoreInstance = new LongTermMemoryStore();
    }
    return memoryStoreInstance;
}

/**
 * Reset the LongTermMemoryStore singleton (useful for testing)
 */
export function resetLongTermMemoryStore(): void {
    memoryStoreInstance = null;
}
