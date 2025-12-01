/**
 * Knowledge Retriever Agent
 * 
 * Implements RAG (Retrieval-Augmented Generation) using AgentCore's knowledge base.
 * This agent retrieves relevant documents from the user's knowledge base and provides
 * context to other agents through AgentCore's context sharing mechanism.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getDocumentsAction } from '@/features/intelligence/actions/knowledge-actions';
import type { WorkerTask, WorkerResult } from './worker-protocol';
import { createSuccessResult, createErrorResult } from './worker-protocol';

const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

/**
 * Document chunk with embedding
 */
export interface DocumentChunk {
    documentId: string;
    chunkId: string;
    text: string;
    embedding?: number[];
    metadata: {
        fileName: string;
        fileType: string;
        title?: string;
        tags?: string[];
        uploadDate: string;
    };
}

/**
 * Retrieval result with relevance score
 */
export interface RetrievalResult {
    chunk: DocumentChunk;
    score: number;
    relevance: 'high' | 'medium' | 'low';
}

/**
 * Generate embeddings using AWS Bedrock Titan Embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const command = new InvokeModelCommand({
            modelId: 'amazon.titan-embed-text-v2:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                inputText: text,
                dimensions: 1024, // Titan v2 supports 256, 512, or 1024
                normalize: true,
            }),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        return responseBody.embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into smaller segments for better retrieval
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = '';
    let currentSize = 0;

    for (const sentence of sentences) {
        const sentenceLength = sentence.length;

        if (currentSize + sentenceLength > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());

            // Add overlap from the end of the previous chunk
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(overlap / 5)); // Approximate word count
            currentChunk = overlapWords.join(' ') + ' ' + sentence;
            currentSize = currentChunk.length;
        } else {
            currentChunk += sentence;
            currentSize += sentenceLength;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Retrieve relevant documents from knowledge base
 */
export async function retrieveRelevantDocuments(
    query: string,
    userId: string,
    options: {
        topK?: number;
        minScore?: number;
        scope?: 'personal' | 'team';
        teamId?: string;
    } = {}
): Promise<RetrievalResult[]> {
    const { topK = 5, minScore = 0.5, scope = 'personal', teamId } = options;

    try {
        // 1. Generate query embedding
        const queryEmbedding = await generateEmbedding(query);

        // 2. Get all documents from knowledge base
        const { documents, error } = await getDocumentsAction(userId, {
            status: 'indexed',
            scope,
            teamId,
        });

        if (error || !documents || documents.length === 0) {
            return [];
        }

        // 3. Calculate similarity scores for each document
        const results: RetrievalResult[] = [];

        for (const doc of documents) {
            // Skip documents without extracted text
            if (!doc.extractedText) continue;

            // Chunk the document text
            const chunks = chunkText(doc.extractedText);

            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];

                // Generate embedding for chunk (in production, these should be pre-computed)
                const chunkEmbedding = await generateEmbedding(chunkText);

                // Calculate similarity
                const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

                if (score >= minScore) {
                    results.push({
                        chunk: {
                            documentId: doc.documentId,
                            chunkId: `${doc.documentId}_chunk_${i}`,
                            text: chunkText,
                            embedding: chunkEmbedding,
                            metadata: {
                                fileName: doc.fileName,
                                fileType: doc.fileType,
                                title: doc.title,
                                tags: doc.tags,
                                uploadDate: doc.uploadDate,
                            },
                        },
                        score,
                        relevance: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
                    });
                }
            }
        }

        // 4. Sort by score and return top K
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

    } catch (error) {
        console.error('Error retrieving documents:', error);
        throw error;
    }
}

/**
 * Execute knowledge retrieval task
 */
export async function executeKnowledgeRetrievalTask(task: WorkerTask): Promise<WorkerResult> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    try {
        const { query, userId, topK, minScore, scope, teamId } = task.input;

        if (!query || !userId) {
            return createErrorResult(
                task.id,
                'knowledge-retriever' as any,
                {
                    type: 'VALIDATION_ERROR',
                    message: 'Missing required parameters: query and userId',
                },
                {
                    executionTime: Date.now() - startTime,
                    startedAt,
                }
            );
        }

        // Retrieve relevant documents
        const results = await retrieveRelevantDocuments(query, userId, {
            topK,
            minScore,
            scope,
            teamId,
        });

        // Format results for context injection
        const contextDocuments = results.map(result => ({
            text: result.chunk.text,
            source: result.chunk.metadata.fileName,
            title: result.chunk.metadata.title,
            relevance: result.relevance,
            score: result.score,
            documentId: result.chunk.documentId,
        }));

        // Generate citations
        const citations = results.map(result => ({
            url: result.chunk.metadata.url || `#document-${result.chunk.documentId}`,
            title: result.chunk.metadata.title || result.chunk.metadata.fileName,
            sourceType: result.chunk.metadata.fileType,
        }));

        return createSuccessResult(
            task.id,
            'knowledge-retriever' as any,
            {
                documents: contextDocuments,
                totalResults: results.length,
                query,
                retrievalStrategy: 'semantic-search',
            },
            {
                executionTime: Date.now() - startTime,
                startedAt,
                modelId: 'amazon.titan-embed-text-v2:0',
            },
            citations
        );

    } catch (error) {
        console.error('Knowledge retrieval task error:', error);
        return createErrorResult(
            task.id,
            'knowledge-retriever' as any,
            {
                type: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error during retrieval',
                details: { error: String(error) },
            },
            {
                executionTime: Date.now() - startTime,
                startedAt,
            }
        );
    }
}

/**
 * Format retrieved documents as context for LLM prompts
 */
export function formatDocumentsAsContext(results: RetrievalResult[]): string {
    if (results.length === 0) {
        return 'No relevant documents found in knowledge base.';
    }

    let context = '# Relevant Documents from Knowledge Base\n\n';

    results.forEach((result, index) => {
        context += `## Document ${index + 1}: ${result.chunk.metadata.title || result.chunk.metadata.fileName}\n`;
        context += `**Relevance:** ${result.relevance} (${(result.score * 100).toFixed(1)}%)\n`;
        context += `**Source:** ${result.chunk.metadata.fileName}\n\n`;
        context += `${result.chunk.text}\n\n`;
        context += '---\n\n';
    });

    return context;
}
