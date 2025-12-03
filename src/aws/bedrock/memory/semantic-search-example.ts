/**
 * Semantic Search Example
 * 
 * This example demonstrates how to use the semantic search engine
 * to find contextually similar memories.
 */

import { getLongTermMemoryStore, getSemanticSearchEngine } from './index';
import type { MemoryEntry } from './types';

/**
 * Example: Basic semantic search
 */
export async function basicSemanticSearchExample(strandId: string) {
    const memoryStore = getLongTermMemoryStore();

    // Search for memories related to market trends
    const results = await memoryStore.semanticSearch(
        'What are the current real estate market trends in Seattle?',
        strandId,
        10
    );

    console.log('Semantic Search Results:');
    results.forEach((result, index) => {
        console.log(`\n${index + 1}. Similarity: ${result.similarity.toFixed(3)}, Relevance: ${result.relevance.toFixed(3)}`);
        console.log(`   Content: ${result.memory.content.substring(0, 100)}...`);
        console.log(`   Type: ${result.memory.metadata.type}`);
        console.log(`   Importance: ${result.memory.metadata.importance}`);
    });

    return results;
}

/**
 * Example: Generate and compare embeddings
 */
export async function embeddingComparisonExample() {
    const searchEngine = getSemanticSearchEngine();

    // Generate embeddings for similar concepts
    const embedding1 = await searchEngine.generateEmbedding(
        'Downtown Seattle real estate market analysis'
    );
    const embedding2 = await searchEngine.generateEmbedding(
        'Seattle city center property market trends'
    );
    const embedding3 = await searchEngine.generateEmbedding(
        'New York City restaurant reviews'
    );

    console.log('Embedding Dimensions:', embedding1.length);
    console.log('\nSimilarity Scores:');
    console.log('Seattle downtown vs Seattle center:', cosineSimilarity(embedding1, embedding2));
    console.log('Seattle downtown vs NYC restaurants:', cosineSimilarity(embedding1, embedding3));
}

/**
 * Example: Batch embedding generation
 */
export async function batchEmbeddingExample() {
    const searchEngine = getSemanticSearchEngine();

    const contents = [
        'Luxury condos in downtown Seattle',
        'Affordable housing in suburban areas',
        'Commercial real estate investment opportunities',
        'First-time homebuyer programs',
        'Property valuation methods',
    ];

    console.log('Generating embeddings for', contents.length, 'items...');
    const startTime = Date.now();

    const embeddings = await searchEngine.batchGenerateEmbeddings(contents);

    const duration = Date.now() - startTime;
    console.log(`Generated ${embeddings.length} embeddings in ${duration}ms`);
    console.log(`Average: ${(duration / embeddings.length).toFixed(2)}ms per embedding`);

    return embeddings;
}

/**
 * Example: Index and search custom content
 */
export async function customContentSearchExample() {
    const searchEngine = getSemanticSearchEngine();

    // Create some sample memories
    const sampleMemories: MemoryEntry[] = [
        {
            id: 'mem_1',
            strandId: 'strand_1',
            content: 'The Seattle housing market saw a 15% increase in median home prices in Q1 2024',
            metadata: {
                type: 'knowledge',
                importance: 0.9,
                accessCount: 5,
                lastAccessed: new Date().toISOString(),
                tags: ['market-data', 'seattle', 'pricing'],
            },
            createdAt: new Date().toISOString(),
        },
        {
            id: 'mem_2',
            strandId: 'strand_1',
            content: 'Best practices for staging luxury properties include professional photography and virtual tours',
            metadata: {
                type: 'knowledge',
                importance: 0.7,
                accessCount: 3,
                lastAccessed: new Date().toISOString(),
                tags: ['staging', 'luxury', 'best-practices'],
            },
            createdAt: new Date().toISOString(),
        },
        {
            id: 'mem_3',
            strandId: 'strand_1',
            content: 'First-time homebuyers in Washington state can access down payment assistance programs',
            metadata: {
                type: 'knowledge',
                importance: 0.8,
                accessCount: 7,
                lastAccessed: new Date().toISOString(),
                tags: ['first-time-buyer', 'programs', 'washington'],
            },
            createdAt: new Date().toISOString(),
        },
    ];

    // Search for relevant memories
    const query = 'How can I help first-time buyers purchase a home?';
    console.log('Query:', query);

    const results = await searchEngine.searchMemories(query, sampleMemories, 3);

    console.log('\nTop Results:');
    results.forEach((result, index) => {
        console.log(`\n${index + 1}. Relevance: ${result.relevance.toFixed(3)}`);
        console.log(`   ${result.memory.content}`);
        console.log(`   Tags: ${result.memory.metadata.tags.join(', ')}`);
    });

    return results;
}

/**
 * Example: Cache statistics
 */
export async function cacheStatsExample() {
    const searchEngine = getSemanticSearchEngine();

    // Generate some embeddings to populate cache
    await searchEngine.generateEmbedding('test content 1');
    await searchEngine.generateEmbedding('test content 2');
    await searchEngine.generateEmbedding('test content 1'); // Cache hit

    const stats = searchEngine.getCacheStats();
    console.log('Cache Statistics:');
    console.log(`  Size: ${stats.size}/${stats.maxSize}`);
    console.log(`  Usage: ${((stats.size / stats.maxSize) * 100).toFixed(1)}%`);
}

/**
 * Helper: Calculate cosine similarity
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
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
 * Run all examples
 */
export async function runAllExamples(strandId: string) {
    console.log('=== Semantic Search Examples ===\n');

    try {
        console.log('1. Basic Semantic Search');
        console.log('------------------------');
        await basicSemanticSearchExample(strandId);

        console.log('\n\n2. Embedding Comparison');
        console.log('------------------------');
        await embeddingComparisonExample();

        console.log('\n\n3. Batch Embedding Generation');
        console.log('------------------------');
        await batchEmbeddingExample();

        console.log('\n\n4. Custom Content Search');
        console.log('------------------------');
        await customContentSearchExample();

        console.log('\n\n5. Cache Statistics');
        console.log('------------------------');
        await cacheStatsExample();

        console.log('\n\n=== All Examples Completed ===');
    } catch (error) {
        console.error('Error running examples:', error);
        throw error;
    }
}
