/**
 * Memory Prioritizer
 * 
 * Prioritizes memories by recency and relevance for retrieval operations.
 * Ensures that the most important and recent memories are surfaced first.
 * 
 * Requirements: 7.5
 */

import type {
    MemoryEntry,
    PrioritizedMemory,
} from './types';

/**
 * MemoryPrioritizer - Prioritizes memories for retrieval
 */
export class MemoryPrioritizer {
    /**
     * Prioritizes memories by recency and relevance
     * 
     * Calculates priority scores combining multiple factors:
     * - Recency: How recently the memory was created or accessed
     * - Relevance: Importance score and access frequency
     * - Type: Different memory types have different base priorities
     * 
     * @param memories - Memories to prioritize
     * @param query - Optional query for relevance scoring
     * @returns Prioritized memories sorted by priority score
     */
    prioritizeMemories(
        memories: MemoryEntry[],
        query?: string
    ): PrioritizedMemory[] {
        const prioritized = memories.map(memory => {
            const recencyScore = this.calculateRecencyScore(memory);
            const relevanceScore = this.calculateRelevanceScore(memory, query);
            const priority = this.calculatePriority(memory, recencyScore, relevanceScore);

            return {
                memory,
                priority,
                recencyScore,
                relevanceScore,
            };
        });

        // Sort by priority (highest first)
        prioritized.sort((a, b) => b.priority - a.priority);

        return prioritized;
    }

    /**
     * Filters memories by minimum priority threshold
     */
    filterByPriority(
        prioritized: PrioritizedMemory[],
        minPriority: number
    ): PrioritizedMemory[] {
        return prioritized.filter(m => m.priority >= minPriority);
    }

    /**
     * Gets top N memories by priority
     */
    getTopMemories(
        prioritized: PrioritizedMemory[],
        count: number
    ): PrioritizedMemory[] {
        return prioritized.slice(0, count);
    }

    /**
     * Calculates recency score based on creation and access times
     * 
     * Uses exponential decay to favor recent memories while still
     * considering older but frequently accessed memories.
     */
    private calculateRecencyScore(memory: MemoryEntry): number {
        const now = Date.now();
        const created = new Date(memory.createdAt).getTime();
        const lastAccessed = new Date(memory.metadata.lastAccessed).getTime();

        // Calculate age in days
        const createdAgeDays = (now - created) / (1000 * 60 * 60 * 24);
        const accessAgeDays = (now - lastAccessed) / (1000 * 60 * 60 * 24);

        // Exponential decay for creation age
        // Half-life varies by memory type
        const createdHalfLife = this.getCreatedHalfLife(memory.metadata.type);
        const createdScore = Math.exp(-createdAgeDays / createdHalfLife);

        // Exponential decay for access age (shorter half-life)
        const accessHalfLife = 7; // 7 days
        const accessScore = Math.exp(-accessAgeDays / accessHalfLife);

        // Combine scores - access recency is more important
        return (createdScore * 0.3) + (accessScore * 0.7);
    }

    /**
     * Calculates relevance score based on importance and access patterns
     */
    private calculateRelevanceScore(memory: MemoryEntry, query?: string): number {
        let score = 0;

        // Base importance score (40%)
        score += memory.metadata.importance * 0.4;

        // Access frequency score (30%)
        const accessScore = Math.min(memory.metadata.accessCount / 20, 1.0);
        score += accessScore * 0.3;

        // Type-based priority (20%)
        const typePriority = this.getTypePriority(memory.metadata.type);
        score += typePriority * 0.2;

        // Query relevance (10%)
        if (query) {
            const queryRelevance = this.calculateQueryRelevance(memory, query);
            score += queryRelevance * 0.1;
        } else {
            // If no query, give slight boost to high-importance memories
            score += memory.metadata.importance * 0.1;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Calculates overall priority score
     */
    private calculatePriority(
        memory: MemoryEntry,
        recencyScore: number,
        relevanceScore: number
    ): number {
        // Weighted combination of recency and relevance
        // Recency is slightly more important for recent memories
        // Relevance is more important for older but important memories

        const recencyWeight = 0.45;
        const relevanceWeight = 0.45;

        // Add small boost for frequently accessed memories
        const accessBonus = Math.min(memory.metadata.accessCount / 50, 0.1);

        const priority =
            (recencyScore * recencyWeight) +
            (relevanceScore * relevanceWeight) +
            accessBonus;

        return Math.min(priority, 1.0);
    }

    /**
     * Gets creation half-life for memory type
     * 
     * Different memory types decay at different rates:
     * - Tasks: 14 days (decay faster)
     * - Context: 21 days
     * - Knowledge: 60 days (decay slower)
     * - Patterns: 90 days (decay slowest)
     * - Feedback: 30 days
     */
    private getCreatedHalfLife(type: MemoryEntry['metadata']['type']): number {
        switch (type) {
            case 'task':
                return 14;
            case 'context':
                return 21;
            case 'knowledge':
                return 60;
            case 'pattern':
                return 90;
            case 'feedback':
                return 30;
            default:
                return 30;
        }
    }

    /**
     * Gets base priority for memory type
     */
    private getTypePriority(type: MemoryEntry['metadata']['type']): number {
        switch (type) {
            case 'pattern':
                return 1.0; // Highest priority
            case 'knowledge':
                return 0.9;
            case 'feedback':
                return 0.8;
            case 'context':
                return 0.7;
            case 'task':
                return 0.6; // Lowest priority
            default:
                return 0.5;
        }
    }

    /**
     * Calculates query relevance using simple keyword matching
     * 
     * In production, this would use semantic similarity with embeddings
     */
    private calculateQueryRelevance(memory: MemoryEntry, query: string): number {
        const queryLower = query.toLowerCase();
        const contentLower = memory.content.toLowerCase();

        // Check tags first
        const tagMatch = memory.metadata.tags.some(tag =>
            queryLower.includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(queryLower)
        );

        if (tagMatch) {
            return 1.0;
        }

        // Simple keyword matching
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
        if (queryWords.length === 0) {
            return 0.5;
        }

        const matchCount = queryWords.filter(word =>
            contentLower.includes(word)
        ).length;

        return matchCount / queryWords.length;
    }

    /**
     * Groups prioritized memories by type
     */
    groupByType(
        prioritized: PrioritizedMemory[]
    ): Map<MemoryEntry['metadata']['type'], PrioritizedMemory[]> {
        const groups = new Map<MemoryEntry['metadata']['type'], PrioritizedMemory[]>();

        prioritized.forEach(pm => {
            const type = pm.memory.metadata.type;
            if (!groups.has(type)) {
                groups.set(type, []);
            }
            groups.get(type)!.push(pm);
        });

        return groups;
    }

    /**
     * Gets memories above a percentile threshold
     */
    getTopPercentile(
        prioritized: PrioritizedMemory[],
        percentile: number
    ): PrioritizedMemory[] {
        if (prioritized.length === 0) {
            return [];
        }

        const index = Math.floor(prioritized.length * (1 - percentile));
        return prioritized.slice(0, Math.max(index, 1));
    }

    /**
     * Calculates priority distribution statistics
     */
    getStatistics(prioritized: PrioritizedMemory[]): {
        mean: number;
        median: number;
        min: number;
        max: number;
        stdDev: number;
    } {
        if (prioritized.length === 0) {
            return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
        }

        const priorities = prioritized.map(m => m.priority);

        const mean = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
        const sorted = [...priorities].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        const variance = priorities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priorities.length;
        const stdDev = Math.sqrt(variance);

        return { mean, median, min, max, stdDev };
    }
}

/**
 * Singleton instance
 */
let memoryPrioritizerInstance: MemoryPrioritizer | null = null;

/**
 * Get the singleton MemoryPrioritizer instance
 */
export function getMemoryPrioritizer(): MemoryPrioritizer {
    if (!memoryPrioritizerInstance) {
        memoryPrioritizerInstance = new MemoryPrioritizer();
    }
    return memoryPrioritizerInstance;
}

/**
 * Reset the MemoryPrioritizer singleton (useful for testing)
 */
export function resetMemoryPrioritizer(): void {
    memoryPrioritizerInstance = null;
}
