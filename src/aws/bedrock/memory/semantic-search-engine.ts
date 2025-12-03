/**
 * Semantic Search Engine
 * 
 * Provides semantic search capabilities using Bedrock embeddings for content vectorization
 * and similarity matching. Enables finding contextually similar content rather than just
 * keyword matching.
 * 
 * Requirements: 7.2
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type {
    MemoryEntry,
    SimilarityResult,
    EmbeddingRecord,
} from './types';

/**
 * Bedrock Titan Embeddings model ID
 */
const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

/**
 * Create Bedrock Runtime client
 */
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

/**
 * SemanticSearchEngine - Provides semantic search using embeddings
 */
export class SemanticSearchEngine {
    private embeddingCache = new Map<string, number[]>();

    /**
     * Generates embeddings for content using Bedrock Titan Embeddings
     * 
     * @param content - Text content to generate embedding for
     * @returns Vector embedding (1536 dimensions for Titan)
     */
    async generateEmbedding(content: string): Promise<number[]> {
        // Check cache first
        const cacheKey = this.getCacheKey(content);
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey)!;
        }

        try {
            const command = new InvokeModelCommand({
                modelId: EMBEDDING_MODEL_ID,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    inputText: content,
                    dimensions: 1024, // Titan v2 supports 256, 512, or 1024
                    normalize: true,
                }),
            });

            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            const embedding = responseBody.embedding as number[];

            // Cache the embedding
            this.embeddingCache.set(cacheKey, embedding);

            // Limit cache size to prevent memory issues
            if (this.embeddingCache.size > 1000) {
                const firstKey = this.embeddingCache.keys().next().value;
                if (firstKey !== undefined) {
                    this.embeddingCache.delete(firstKey);
                }
            }

            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Finds similar content using embeddings
     * 
     * Calculates cosine similarity between query embedding and candidate embeddings,
     * returning the most similar results.
     * 
     * @param queryEmbedding - Query vector embedding
     * @param candidateEmbeddings - Array of candidate embeddings to search
     * @param limit - Maximum number of results to return
     * @returns Array of similarity results sorted by similarity score
     */
    async findSimilar(
        queryEmbedding: number[],
        candidateEmbeddings: EmbeddingRecord[],
        limit: number
    ): Promise<SimilarityResult[]> {
        // Calculate similarity scores for all candidates
        const results: Array<{ record: EmbeddingRecord; similarity: number }> = [];

        for (const candidate of candidateEmbeddings) {
            const similarity = this.cosineSimilarity(queryEmbedding, candidate.embedding);
            results.push({ record: candidate, similarity });
        }

        // Sort by similarity (highest first)
        results.sort((a, b) => b.similarity - a.similarity);

        // Take top N results
        const topResults = results.slice(0, limit);

        // Convert to SimilarityResult format
        return topResults.map(result => {
            const memory = result.record.metadata as MemoryEntry;
            const similarity = result.similarity;

            // Calculate relevance score combining similarity and importance
            const importance = memory.metadata?.importance || 0.5;
            const relevance = (similarity * 0.7) + (importance * 0.3);

            return {
                memory,
                similarity,
                relevance,
            };
        });
    }

    /**
     * Indexes content for semantic search
     * 
     * Generates and stores embeddings for content to enable fast retrieval.
     * 
     * @param contentId - Unique identifier for the content
     * @param content - Text content to index
     * @param metadata - Associated metadata
     * @returns Embedding record
     */
    async indexContent(
        contentId: string,
        content: string,
        metadata: any
    ): Promise<EmbeddingRecord> {
        const embedding = await this.generateEmbedding(content);

        return {
            id: contentId,
            embedding,
            metadata,
        };
    }

    /**
     * Searches memories using semantic similarity
     * 
     * Generates embedding for query and finds semantically similar memories.
     * 
     * @param query - Search query text
     * @param memories - Array of memory entries to search
     * @param limit - Maximum number of results
     * @returns Array of similar memories with relevance scores
     */
    async searchMemories(
        query: string,
        memories: MemoryEntry[],
        limit: number = 10
    ): Promise<SimilarityResult[]> {
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Filter memories that have embeddings
        const memoriesWithEmbeddings = memories.filter(m => m.embedding && m.embedding.length > 0);

        // If no memories have embeddings, generate them
        const embeddingRecords: EmbeddingRecord[] = [];

        for (const memory of memoriesWithEmbeddings) {
            embeddingRecords.push({
                id: memory.id,
                embedding: memory.embedding!,
                metadata: memory,
            });
        }

        // For memories without embeddings, generate them on-the-fly
        const memoriesWithoutEmbeddings = memories.filter(m => !m.embedding || m.embedding.length === 0);

        for (const memory of memoriesWithoutEmbeddings) {
            try {
                const embedding = await this.generateEmbedding(memory.content);
                embeddingRecords.push({
                    id: memory.id,
                    embedding,
                    metadata: memory,
                });
            } catch (error) {
                console.warn(`Failed to generate embedding for memory ${memory.id}:`, error);
                // Continue with other memories
            }
        }

        // Find similar memories
        return this.findSimilar(queryEmbedding, embeddingRecords, limit);
    }

    /**
     * Batch generates embeddings for multiple content items
     * 
     * @param contents - Array of content strings
     * @returns Array of embeddings in the same order
     */
    async batchGenerateEmbeddings(contents: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        // Process in parallel with concurrency limit
        const concurrency = 5;
        for (let i = 0; i < contents.length; i += concurrency) {
            const batch = contents.slice(i, i + concurrency);
            const batchEmbeddings = await Promise.all(
                batch.map(content => this.generateEmbedding(content))
            );
            embeddings.push(...batchEmbeddings);
        }

        return embeddings;
    }

    /**
     * Calculates cosine similarity between two vectors
     * 
     * @param vecA - First vector
     * @param vecB - Second vector
     * @returns Similarity score between 0 and 1
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Generates cache key for content
     */
    private getCacheKey(content: string): string {
        // Use first 100 chars as cache key (simple approach)
        // In production, might want to use a hash function
        return content.substring(0, 100);
    }

    /**
     * Clears the embedding cache
     */
    clearCache(): void {
        this.embeddingCache.clear();
    }

    /**
     * Gets cache statistics
     */
    getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.embeddingCache.size,
            maxSize: 1000,
        };
    }
}

/**
 * Singleton instance
 */
let semanticSearchEngineInstance: SemanticSearchEngine | null = null;

/**
 * Get the singleton SemanticSearchEngine instance
 */
export function getSemanticSearchEngine(): SemanticSearchEngine {
    if (!semanticSearchEngineInstance) {
        semanticSearchEngineInstance = new SemanticSearchEngine();
    }
    return semanticSearchEngineInstance;
}

/**
 * Reset the SemanticSearchEngine singleton (useful for testing)
 */
export function resetSemanticSearchEngine(): void {
    if (semanticSearchEngineInstance) {
        semanticSearchEngineInstance.clearCache();
    }
    semanticSearchEngineInstance = null;
}
