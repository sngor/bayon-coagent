# Long-Term Memory System

The long-term memory system provides persistent storage and intelligent retrieval of agent strand memories. It enables agents to learn from past experiences and maintain context across sessions.

## Features

- **Persistent Storage**: Memories are stored in DynamoDB and survive beyond session limits
- **Semantic Search**: Find contextually similar memories using Bedrock embeddings (Requirement 7.2)
- **Memory Consolidation**: Old memories are automatically consolidated to reduce storage and improve performance
- **Context Windows**: Sliding windows that include relevant historical information for tasks
- **Memory Prioritization**: Intelligent prioritization by recency, relevance, and importance
- **Embedding Generation**: Automatic vectorization of content for semantic search

## Components

### LongTermMemoryStore

Manages persistent memory storage in DynamoDB with semantic search capabilities.

```typescript
import { getLongTermMemoryStore } from "@/aws/bedrock/memory";

const memoryStore = getLongTermMemoryStore();

// Persist strand memory (automatically generates embeddings)
await memoryStore.persistMemory(strandId, agentMemory);

// Retrieve strand memory
const memory = await memoryStore.retrieveMemory(strandId, {
  type: "knowledge",
  minImportance: 0.7,
  limit: 50,
});

// Semantic search for relevant memories
const results = await memoryStore.semanticSearch(
  "market trends in downtown Seattle",
  strandId,
  10
);

// Consolidate old memories
const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await memoryStore.consolidateMemories(strandId, oneMonthAgo);
```

### ContextWindowManager

Creates sliding context windows with relevant memories for task execution.

```typescript
import { getContextWindowManager } from "@/aws/bedrock/memory";

const contextManager = getContextWindowManager();

// Create context window for a task
const contextWindow = await contextManager.createContextWindow(
  strandId,
  "market analysis for downtown Seattle",
  {
    maxSize: 20,
    timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
    minRelevance: 0.5,
    includeTypes: ["knowledge", "pattern", "task"],
  }
);

// Update context window with new memory
const updatedWindow = contextManager.updateContextWindow(
  contextWindow,
  newMemory,
  config
);
```

### MemoryPrioritizer

Prioritizes memories by recency and relevance for retrieval.

```typescript
import { getMemoryPrioritizer } from "@/aws/bedrock/memory";

const prioritizer = getMemoryPrioritizer();

// Prioritize memories
const prioritized = prioritizer.prioritizeMemories(
  memories,
  "real estate market trends"
);

// Get top memories
const topMemories = prioritizer.getTopMemories(prioritized, 10);

// Filter by priority threshold
const highPriority = prioritizer.filterByPriority(prioritized, 0.7);

// Get statistics
const stats = prioritizer.getStatistics(prioritized);
console.log(`Mean priority: ${stats.mean}, Median: ${stats.median}`);
```

### SemanticSearchEngine

Provides semantic search using Bedrock embeddings for content vectorization.

```typescript
import { getSemanticSearchEngine } from "@/aws/bedrock/memory";

const searchEngine = getSemanticSearchEngine();

// Generate embedding for content
const embedding = await searchEngine.generateEmbedding(
  "Downtown Seattle real estate market analysis"
);

// Search memories semantically
const results = await searchEngine.searchMemories(
  "market trends in Seattle",
  memories,
  10
);

// Index content for fast retrieval
const embeddingRecord = await searchEngine.indexContent(
  contentId,
  content,
  metadata
);

// Batch generate embeddings
const embeddings = await searchEngine.batchGenerateEmbeddings([
  "content 1",
  "content 2",
  "content 3",
]);

// Get cache statistics
const stats = searchEngine.getCacheStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
```

## Integration with AgentCore

The memory system integrates seamlessly with AgentCore:

```typescript
import { getAgentCore } from "@/aws/bedrock";
import { getLongTermMemoryStore } from "@/aws/bedrock/memory";

const agentCore = getAgentCore();
const memoryStore = getLongTermMemoryStore();

// Get a strand
const strand = agentCore.getStrand(strandId);

// Persist its memory when session ends
await memoryStore.persistMemory(strand.id, strand.memory);

// Restore memory when session starts
const restoredMemory = await memoryStore.retrieveMemory(strand.id);
strand.memory = restoredMemory;
```

## Memory Types

The system supports different memory types with different characteristics:

- **task**: Task execution history (decay: 14 days)
- **context**: Working memory context (decay: 21 days)
- **knowledge**: Long-term knowledge (decay: 60 days)
- **pattern**: Learned patterns (decay: 90 days)
- **feedback**: User feedback (decay: 30 days)

## Memory Lifecycle

1. **Creation**: Memories are created during task execution
2. **Storage**: Memories are persisted to DynamoDB
3. **Retrieval**: Memories are retrieved based on filters and relevance
4. **Prioritization**: Memories are prioritized for context windows
5. **Consolidation**: Old memories are consolidated to summaries
6. **Expiration**: Very old memories can be set to expire

## Performance Considerations

- **Batch Operations**: Use batch writes for multiple memories
- **Indexing**: Memories are indexed by strand ID and timestamp
- **Caching**: Frequently accessed memories are cached
- **Consolidation**: Run consolidation periodically (e.g., weekly)

## Requirements Validation

This implementation satisfies the following requirements:

- **7.1**: Memory persistence to DynamoDB with proper indexing
- **7.2**: Semantic search using Bedrock embeddings for similarity matching
- **7.3**: Memory consolidation algorithm that preserves key insights
- **7.4**: Context window management with sliding windows
- **7.5**: Memory prioritization by recency and relevance

## Semantic Search Details

The semantic search engine uses Amazon Bedrock Titan Embeddings v2 to generate 1024-dimensional vector embeddings for content. Key features:

- **Automatic Embedding Generation**: Embeddings are generated when memories are persisted
- **Cosine Similarity**: Uses cosine similarity to find semantically similar content
- **Relevance Scoring**: Combines similarity (70%) and importance (30%) for final relevance score
- **Caching**: Embeddings are cached to reduce API calls (max 1000 entries)
- **Batch Processing**: Supports batch embedding generation with concurrency control
- **On-Demand Generation**: Generates embeddings on-the-fly for memories without them

## Future Enhancements

- AI-powered memory summarization
- Cross-strand memory sharing
- Memory importance learning from usage patterns
- Vector database integration for faster similarity search at scale
