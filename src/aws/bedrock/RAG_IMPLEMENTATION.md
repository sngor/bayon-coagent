# RAG Implementation with AgentCore

This document explains how the RAG (Retrieval-Augmented Generation) system works using AgentCore's multi-agent architecture.

## Architecture Overview

```
User Query
    ↓
Knowledge Retriever Agent (AgentCore Strand)
    ↓
1. Generate query embedding (Bedrock Titan)
2. Search documents in DynamoDB
3. Calculate similarity scores
4. Return top K relevant chunks
    ↓
Context Sharing (AgentCore)
    ↓
Research Agent (AgentCore Strand)
    ↓
Generate response with context (Claude 3.5 Sonnet)
    ↓
Response with citations
```

## Components

### 1. Knowledge Retriever Agent (`knowledge-retriever.ts`)

**Purpose:** Retrieves relevant documents from the user's knowledge base using semantic search.

**Key Functions:**

- `generateEmbedding(text)` - Uses Bedrock Titan Embeddings v2
- `retrieveRelevantDocuments(query, userId, options)` - Semantic search
- `executeKnowledgeRetrievalTask(task)` - Worker task handler
- `formatDocumentsAsContext(results)` - Format for LLM prompts

**Features:**

- Cosine similarity for relevance scoring
- Text chunking with overlap
- Configurable top-K and minimum score
- Support for personal and team documents

### 2. AgentCore Integration (`agent-core.ts`)

**New Strand Type:** `knowledge-retriever`

**Capabilities:**

- Document search
- Semantic retrieval
- Context extraction
- RAG retrieval

**Metrics:**

- Quality Score: 0.95
- Speed Score: 0.85
- Reliability: 0.98
- Max Concurrent Tasks: 5

### 3. Research Agent with RAG (`research-agent-with-rag.ts`)

**Purpose:** Orchestrates knowledge retrieval and research generation.

**Workflow:**

1. Allocate task to knowledge-retriever strand
2. Execute document retrieval
3. Share context between strands
4. Generate research response with context
5. Return results with citations

**Functions:**

- `executeResearchAgentWithRAG(input, agentProfile)` - Full workflow
- `quickResearch(query, userId, options)` - Fast summary
- `comprehensiveResearch(query, userId, options)` - Detailed report

### 4. Document Processor (`document-processor.ts`)

**Purpose:** Extract text and prepare documents for retrieval.

**Supported Formats:**

- ✅ TXT, MD, JSON, HTML (implemented)
- 🚧 PDF (requires Lambda with pdf-parse)
- 🚧 DOCX (requires Lambda with mammoth)

**Process:**

1. Extract text from S3 document
2. Chunk text into segments
3. Generate embeddings (optional)
4. Update DynamoDB with extracted text
5. Set status to 'indexed'

### 5. Server Actions (`research-rag-actions.ts`)

**Available Actions:**

- `researchWithKnowledgeBaseAction(query, options)` - Full control
- `quickResearchAction(query, useKnowledgeBase)` - Fast queries
- `comprehensiveResearchAction(query, options)` - Detailed research

## Usage Examples

### Basic Research Query

```typescript
import { researchWithKnowledgeBaseAction } from "@/app/research-rag-actions";

const result = await researchWithKnowledgeBaseAction(
  "What are the best neighborhoods in Seattle?",
  {
    researchDepth: "standard",
    outputFormat: "report",
    useKnowledgeBase: true,
    topK: 5,
  }
);

if (result.success) {
  console.log(result.data.answer);
  console.log(`Used ${result.data.documentsRetrieved} documents`);
  console.log("Sources:", result.data.sources);
}
```

### Quick Research

```typescript
import { quickResearchAction } from "@/app/research-rag-actions";

const result = await quickResearchAction(
  "What's the average home price in my market?",
  true // use knowledge base
);
```

### Comprehensive Research

```typescript
import { comprehensiveResearchAction } from "@/app/research-rag-actions";

const result = await comprehensiveResearchAction(
  "Analyze market trends for luxury properties",
  {
    useKnowledgeBase: true,
    topK: 10, // retrieve more documents
  }
);
```

### Direct AgentCore Usage

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { createWorkerTask } from "@/aws/bedrock/worker-protocol";
import { executeKnowledgeRetrievalTask } from "@/aws/bedrock/knowledge-retriever";

const agentCore = getAgentCore();

// Create retrieval task
const task = createWorkerTask(
  "knowledge-retriever",
  "Find documents about Seattle real estate",
  {
    query: "Seattle real estate market trends",
    userId: "user-123",
    topK: 5,
    minScore: 0.6,
  }
);

// Allocate to knowledge retriever strand
const strand = await agentCore.allocateTask(task);

// Execute retrieval
const result = await executeKnowledgeRetrievalTask(task);

// Update metrics
agentCore.updateStrandMetrics(strand.id, result);

// Share context with another agent
const researchStrand = agentCore.getStrandsByType("data-analyst")[0];
agentCore.shareContext(strand.id, researchStrand.id, {
  documents: result.output.documents,
});
```

## Document Upload Flow

### 1. Upload Document

```typescript
import { uploadDocumentAction } from "@/features/intelligence/actions/knowledge-actions";

const file = new File(["content"], "market-report.txt", { type: "text/plain" });

const result = await uploadDocumentAction(userId, file, {
  scope: "personal",
});

// Document is uploaded to S3 and processing starts automatically
```

### 2. Processing Happens Automatically

- Text extraction
- Chunking
- Status update to 'indexed'
- Ready for retrieval

### 3. Query Documents

```typescript
import { getDocumentsAction } from "@/features/intelligence/actions/knowledge-actions";

const { documents } = await getDocumentsAction(userId, {
  status: "indexed",
});
```

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Knowledge Base
KNOWLEDGE_BASE_BUCKET=bayon-knowledge-base
KNOWLEDGE_BASE_TABLE=KnowledgeBaseDocuments
```

### Retrieval Parameters

```typescript
{
  topK: 5,              // Number of documents to retrieve
  minScore: 0.5,        // Minimum similarity score (0-1)
  scope: 'personal',    // 'personal' or 'team'
  teamId: undefined,    // Required if scope is 'team'
}
```

### Research Parameters

```typescript
{
  researchDepth: 'standard',  // 'quick' | 'standard' | 'comprehensive'
  outputFormat: 'report',     // 'report' | 'summary' | 'bullet-points'
  useKnowledgeBase: true,     // Enable/disable RAG
}
```

## Performance Considerations

### Embedding Generation

- **Model:** Amazon Titan Embeddings v2
- **Dimensions:** 1024
- **Cost:** ~$0.0001 per 1K tokens
- **Latency:** ~100-200ms per embedding

### Optimization Strategies

1. **Pre-compute embeddings** during document upload (Lambda)
2. **Store embeddings** in vector database (Pinecone, OpenSearch)
3. **Cache frequent queries** to reduce embedding calls
4. **Batch processing** for multiple documents
5. **Async processing** for large documents

### Current Limitations

1. **No vector database** - Uses in-memory similarity search
2. **On-demand embeddings** - Generated during retrieval (slow)
3. **Limited file types** - PDF/DOCX need Lambda processing
4. **No caching** - Every query generates new embeddings

## Future Enhancements

### Phase 1: Production Ready

- [ ] Lambda function for document processing
- [ ] PDF and DOCX text extraction
- [ ] Pre-computed embeddings storage
- [ ] Vector database integration (Pinecone)

### Phase 2: Advanced Features

- [ ] Hybrid search (semantic + keyword)
- [ ] Query expansion and rewriting
- [ ] Multi-hop reasoning
- [ ] Citation verification

### Phase 3: Enterprise Features

- [ ] Team knowledge bases
- [ ] Access control and permissions
- [ ] Document versioning
- [ ] Analytics and usage tracking

## Monitoring

### AgentCore Metrics

```typescript
const agentCore = getAgentCore();
const retrieverStrand = agentCore.getStrandsByType("knowledge-retriever")[0];

console.log("Metrics:", {
  tasksCompleted: retrieverStrand.metrics.tasksCompleted,
  successRate: retrieverStrand.metrics.successRate,
  avgExecutionTime: retrieverStrand.metrics.avgExecutionTime,
  currentLoad: retrieverStrand.metrics.currentLoad,
});
```

### Document Statistics

```typescript
const { documents } = await getDocumentsAction(userId);

const stats = {
  total: documents.length,
  indexed: documents.filter((d) => d.status === "indexed").length,
  processing: documents.filter((d) => d.status === "processing").length,
  failed: documents.filter((d) => d.status === "failed").length,
};
```

## Troubleshooting

### Documents Not Being Retrieved

1. Check document status is 'indexed'
2. Verify extractedText is populated
3. Lower minScore threshold
4. Increase topK value

### Slow Retrieval

1. Reduce topK value
2. Pre-compute embeddings
3. Use vector database
4. Implement caching

### Processing Failures

1. Check file type is supported
2. Verify S3 permissions
3. Check DynamoDB write permissions
4. Review error messages in document.errorMessage

## Testing

```typescript
// Test embedding generation
import { generateEmbedding } from "@/aws/bedrock/knowledge-retriever";

const embedding = await generateEmbedding("test query");
console.log("Embedding dimensions:", embedding.length); // Should be 1024

// Test document retrieval
import { retrieveRelevantDocuments } from "@/aws/bedrock/knowledge-retriever";

const results = await retrieveRelevantDocuments(
  "Seattle real estate",
  "user-123",
  { topK: 3, minScore: 0.5 }
);

console.log("Retrieved documents:", results.length);
results.forEach((r) => {
  console.log(`- ${r.chunk.metadata.fileName} (${r.score.toFixed(2)})`);
});
```

## Support

For issues or questions:

1. Check document status in DynamoDB
2. Review CloudWatch logs for errors
3. Test with simple text files first
4. Verify AWS credentials and permissions
