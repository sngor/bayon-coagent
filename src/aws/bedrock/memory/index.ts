/**
 * Memory System - Long-term memory management for agent strands
 * 
 * This module provides persistent memory storage, retrieval, consolidation,
 * context window management, and memory prioritization for agent strands.
 * 
 * Features:
 * - Long-term memory persistence in DynamoDB
 * - Memory consolidation to reduce storage
 * - Sliding context windows with relevance scoring
 * - Memory prioritization by recency and importance
 * 
 * Requirements: 7.1, 7.3, 7.4, 7.5
 */

// Types
export type {
    MemoryEntry,
    MemoryMetadata,
    MemoryFilters,
    SimilarityResult,
    EmbeddingRecord,
    ConsolidatedMemory,
    ContextWindowConfig,
    PrioritizedMemory,
} from './types';

// Long-term memory store
export {
    LongTermMemoryStore,
    getLongTermMemoryStore,
    resetLongTermMemoryStore,
} from './long-term-memory-store';

// Context window manager
export {
    ContextWindowManager,
    getContextWindowManager,
    resetContextWindowManager,
} from './context-window-manager';

// Memory prioritizer
export {
    MemoryPrioritizer,
    getMemoryPrioritizer,
    resetMemoryPrioritizer,
} from './memory-prioritizer';

// Semantic search engine
export {
    SemanticSearchEngine,
    getSemanticSearchEngine,
    resetSemanticSearchEngine,
} from './semantic-search-engine';
