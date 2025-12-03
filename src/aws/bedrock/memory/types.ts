/**
 * Memory System Types
 * 
 * Type definitions for the long-term memory system including memory entries,
 * filters, and search results.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

/**
 * Memory entry stored in long-term storage
 */
export interface MemoryEntry {
    /** Unique memory ID */
    id: string;

    /** Strand that owns this memory */
    strandId: string;

    /** Memory content */
    content: string;

    /** Vector embedding for semantic search */
    embedding?: number[];

    /** Memory metadata */
    metadata: MemoryMetadata;

    /** Creation timestamp */
    createdAt: string;

    /** Expiration timestamp (optional) */
    expiresAt?: string;
}

/**
 * Memory metadata
 */
export interface MemoryMetadata {
    /** Type of memory */
    type: 'task' | 'pattern' | 'knowledge' | 'feedback' | 'context';

    /** Importance score (0-1) */
    importance: number;

    /** Number of times accessed */
    accessCount: number;

    /** Last access timestamp */
    lastAccessed: string;

    /** Tags for categorization */
    tags: string[];

    /** Related task IDs */
    relatedTasks?: string[];

    /** Source of the memory */
    source?: string;
}

/**
 * Filters for memory retrieval
 */
export interface MemoryFilters {
    /** Filter by memory type */
    type?: MemoryMetadata['type'];

    /** Filter by minimum importance */
    minImportance?: number;

    /** Filter by tags */
    tags?: string[];

    /** Filter by date range */
    dateRange?: {
        start: string;
        end: string;
    };

    /** Maximum number of results */
    limit?: number;

    /** Include expired memories */
    includeExpired?: boolean;
}

/**
 * Semantic search result
 */
export interface SimilarityResult {
    /** Memory entry */
    memory: MemoryEntry;

    /** Similarity score (0-1) */
    similarity: number;

    /** Relevance score combining similarity and importance */
    relevance: number;
}

/**
 * Embedding record for indexing
 */
export interface EmbeddingRecord {
    /** Content ID */
    id: string;

    /** Vector embedding */
    embedding: number[];

    /** Associated metadata */
    metadata: any;
}

/**
 * Consolidated memory summary
 */
export interface ConsolidatedMemory {
    /** Original memory IDs that were consolidated */
    originalIds: string[];

    /** Consolidated content summary */
    summary: string;

    /** Combined importance score */
    importance: number;

    /** Time period covered */
    period: {
        start: string;
        end: string;
    };

    /** Number of memories consolidated */
    count: number;
}

/**
 * Context window configuration
 */
export interface ContextWindowConfig {
    /** Maximum number of memories in window */
    maxSize: number;

    /** Time window in milliseconds */
    timeWindow?: number;

    /** Minimum relevance score */
    minRelevance?: number;

    /** Include types */
    includeTypes?: MemoryMetadata['type'][];
}

/**
 * Memory prioritization result
 */
export interface PrioritizedMemory {
    /** Memory entry */
    memory: MemoryEntry;

    /** Priority score (higher = more important) */
    priority: number;

    /** Recency score (0-1) */
    recencyScore: number;

    /** Relevance score (0-1) */
    relevanceScore: number;
}
