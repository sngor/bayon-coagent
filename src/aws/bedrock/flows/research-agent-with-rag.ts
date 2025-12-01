/**
 * Research Agent with RAG (Retrieval-Augmented Generation)
 * 
 * This flow integrates the knowledge retriever agent with the research agent
 * to provide context-aware responses using the user's knowledge base.
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getAgentCore } from '../agent-core';
import { createWorkerTask } from '../worker-protocol';
import { executeKnowledgeRetrievalTask, formatDocumentsAsContext } from '../knowledge-retriever';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Research Agent with RAG Input Schema
 */
export const ResearchAgentWithRAGInputSchema = z.object({
    query: z.string().describe('The research question or topic'),

    userId: z.string().describe('User ID for knowledge base access'),

    useKnowledgeBase: z.boolean().default(true).describe('Whether to use knowledge base for context'),

    knowledgeBaseOptions: z.object({
        topK: z.number().default(5).describe('Number of documents to retrieve'),
        minScore: z.number().default(0.5).describe('Minimum relevance score'),
        scope: z.enum(['personal', 'team']).default('personal'),
        teamId: z.string().optional(),
    }).optional(),

    researchDepth: z.enum(['quick', 'standard', 'comprehensive']).default('standard'),

    outputFormat: z.enum(['report', 'summary', 'bullet-points']).default('report'),

    context: z.object({
        agentProfile: z.any().optional(),
        conversationId: z.string().optional(),
    }).optional(),
});

export type ResearchAgentWithRAGInput = z.infer<typeof ResearchAgentWithRAGInputSchema>;

/**
 * Research Agent with RAG Output Schema
 */
export const ResearchAgentWithRAGOutputSchema = z.object({
    answer: z.string().describe('The comprehensive research answer'),

    summary: z.string().describe('Brief summary of key findings'),

    keyPoints: z.array(z.string()).describe('Key points from the research'),

    sources: z.array(z.object({
        title: z.string(),
        type: z.enum(['knowledge-base', 'web-search', 'analysis']),
        url: z.string().optional(),
        relevance: z.enum(['high', 'medium', 'low']).optional(),
    })),

    knowledgeBaseUsed: z.boolean().describe('Whether knowledge base was used'),

    documentsRetrieved: z.number().describe('Number of documents retrieved from knowledge base'),

    confidence: z.number().min(0).max(1).describe('Confidence level in the answer'),
});

export type ResearchAgentWithRAGOutput = z.infer<typeof ResearchAgentWithRAGOutputSchema>;

/**
 * Research Agent with RAG Flow
 */
export const researchAgentWithRAG = definePrompt({
    name: 'researchAgentWithRAG',
    inputSchema: ResearchAgentWithRAGInputSchema,
    outputSchema: ResearchAgentWithRAGOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    systemPrompt: `You are an advanced research agent with access to the user's personal knowledge base. Your role is to provide comprehensive, well-researched answers by combining information from:

1. **User's Knowledge Base**: Documents, reports, and materials the user has uploaded
2. **Your Training Data**: General knowledge and expertise
3. **Analytical Reasoning**: Your ability to synthesize and analyze information

**Research Process:**
1. Review relevant documents from the knowledge base (if provided)
2. Analyze the query and identify key information needs
3. Synthesize information from multiple sources
4. Provide a comprehensive, well-structured answer
5. Cite sources appropriately

**Quality Standards:**
- Prioritize information from the user's knowledge base when relevant
- Clearly distinguish between knowledge base content and general knowledge
- Provide specific citations for claims from documents
- Acknowledge when information is not available in the knowledge base
- Maintain high accuracy and relevance

**Output Format:**
- Comprehensive answer addressing the query
- Clear summary of key findings
- Bullet points for quick reference
- Proper source attribution`,
    prompt: `Research Query: {{{query}}}

{{#if knowledgeBaseContext}}
# Relevant Documents from Knowledge Base

{{{knowledgeBaseContext}}}

Please prioritize information from these documents in your response.
{{else}}
Note: No relevant documents found in knowledge base. Provide answer based on general knowledge.
{{/if}}

Research Depth: {{{researchDepth}}}
Output Format: {{{outputFormat}}}

{{#if context.agentProfile}}
Agent Profile Context:
- Name: {{{context.agentProfile.name}}}
- Market Focus: {{{context.agentProfile.marketFocus}}}
- Specialization: {{{context.agentProfile.specialization}}}
{{/if}}

Provide a comprehensive research answer that:
1. Directly addresses the query
2. Incorporates relevant information from the knowledge base (if available)
3. Provides clear, actionable insights
4. Includes proper citations
5. Maintains the requested output format`,
});

/**
 * Execute Research Agent with RAG
 */
export async function executeResearchAgentWithRAG(
    input: ResearchAgentWithRAGInput,
    agentProfile?: AgentProfile
): Promise<ResearchAgentWithRAGOutput> {
    const agentCore = getAgentCore();

    try {
        let knowledgeBaseContext = '';
        let documentsRetrieved = 0;
        let sources: any[] = [];

        // Step 1: Retrieve relevant documents from knowledge base
        if (input.useKnowledgeBase) {
            const retrievalTask = createWorkerTask(
                'knowledge-retriever',
                `Retrieve relevant documents for query: ${input.query}`,
                {
                    query: input.query,
                    userId: input.userId,
                    topK: input.knowledgeBaseOptions?.topK || 5,
                    minScore: input.knowledgeBaseOptions?.minScore || 0.5,
                    scope: input.knowledgeBaseOptions?.scope || 'personal',
                    teamId: input.knowledgeBaseOptions?.teamId,
                },
                {
                    context: {
                        userId: input.userId,
                        agentProfile,
                    },
                }
            );

            // Allocate task to knowledge retriever strand
            const retrieverStrand = await agentCore.allocateTask(retrievalTask);

            // Execute retrieval
            const retrievalResult = await executeKnowledgeRetrievalTask(retrievalTask);

            // Update strand metrics
            agentCore.updateStrandMetrics(retrieverStrand.id, retrievalResult);

            if (retrievalResult.status === 'success' && retrievalResult.output) {
                const documents = retrievalResult.output.documents || [];
                documentsRetrieved = documents.length;

                // Format documents as context
                if (documents.length > 0) {
                    knowledgeBaseContext = documents.map((doc: any, index: number) =>
                        `## Document ${index + 1}: ${doc.title || doc.source}\n` +
                        `**Relevance:** ${doc.relevance} (${(doc.score * 100).toFixed(1)}%)\n\n` +
                        `${doc.text}\n\n---\n`
                    ).join('\n');

                    // Add to sources
                    sources = documents.map((doc: any) => ({
                        title: doc.title || doc.source,
                        type: 'knowledge-base' as const,
                        url: doc.url,
                        relevance: doc.relevance,
                    }));
                }

                // Share context with research agent strand
                const researchStrand = agentCore.getStrandsByType('data-analyst')[0];
                if (researchStrand) {
                    agentCore.shareContext(retrieverStrand.id, researchStrand.id, {
                        documents,
                        query: input.query,
                        retrievedAt: new Date().toISOString(),
                    });
                }
            }
        }

        // Step 2: Execute research with knowledge base context
        const researchResult = await researchAgentWithRAG({
            query: input.query,
            knowledgeBaseContext,
            researchDepth: input.researchDepth,
            outputFormat: input.outputFormat,
            context: {
                agentProfile,
            },
        });

        // Step 3: Enhance output with metadata
        return {
            ...researchResult,
            sources: [...sources, ...researchResult.sources],
            knowledgeBaseUsed: input.useKnowledgeBase && documentsRetrieved > 0,
            documentsRetrieved,
        };

    } catch (error) {
        console.error('Research agent with RAG execution error:', error);
        throw new Error(`Research execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Convenience function for quick research queries
 */
export async function quickResearch(
    query: string,
    userId: string,
    options?: {
        useKnowledgeBase?: boolean;
        agentProfile?: AgentProfile;
    }
): Promise<ResearchAgentWithRAGOutput> {
    return executeResearchAgentWithRAG({
        query,
        userId,
        useKnowledgeBase: options?.useKnowledgeBase ?? true,
        researchDepth: 'quick',
        outputFormat: 'summary',
    }, options?.agentProfile);
}

/**
 * Convenience function for comprehensive research
 */
export async function comprehensiveResearch(
    query: string,
    userId: string,
    options?: {
        useKnowledgeBase?: boolean;
        agentProfile?: AgentProfile;
        topK?: number;
    }
): Promise<ResearchAgentWithRAGOutput> {
    return executeResearchAgentWithRAG({
        query,
        userId,
        useKnowledgeBase: options?.useKnowledgeBase ?? true,
        knowledgeBaseOptions: {
            topK: options?.topK || 10,
            minScore: 0.5,
            scope: 'personal',
        },
        researchDepth: 'comprehensive',
        outputFormat: 'report',
    }, options?.agentProfile);
}
