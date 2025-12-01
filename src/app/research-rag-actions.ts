'use server';

/**
 * Server Actions for Research Agent with RAG
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getAgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import {
    executeResearchAgentWithRAG,
    quickResearch,
    comprehensiveResearch,
    type ResearchAgentWithRAGInput,
    type ResearchAgentWithRAGOutput,
} from '@/aws/bedrock/flows/research-agent-with-rag';

/**
 * Execute research query with RAG
 */
export async function researchWithKnowledgeBaseAction(
    query: string,
    options?: {
        researchDepth?: 'quick' | 'standard' | 'comprehensive';
        outputFormat?: 'report' | 'summary' | 'bullet-points';
        useKnowledgeBase?: boolean;
        topK?: number;
        scope?: 'personal' | 'team';
        teamId?: string;
    }
): Promise<{
    success: boolean;
    data?: ResearchAgentWithRAGOutput;
    error?: string;
}> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get agent profile
        const agentProfile = await getAgentProfile(user.id);

        // Execute research with RAG
        const result = await executeResearchAgentWithRAG(
            {
                query,
                userId: user.id,
                useKnowledgeBase: options?.useKnowledgeBase ?? true,
                knowledgeBaseOptions: {
                    topK: options?.topK || 5,
                    minScore: 0.5,
                    scope: options?.scope || 'personal',
                    teamId: options?.teamId,
                },
                researchDepth: options?.researchDepth || 'standard',
                outputFormat: options?.outputFormat || 'report',
                context: {
                    agentProfile: agentProfile || undefined,
                },
            },
            agentProfile || undefined
        );

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('Research with knowledge base action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Research failed',
        };
    }
}

/**
 * Quick research action (fast, summary format)
 */
export async function quickResearchAction(
    query: string,
    useKnowledgeBase: boolean = true
): Promise<{
    success: boolean;
    data?: ResearchAgentWithRAGOutput;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const agentProfile = await getAgentProfile(user.id);

        const result = await quickResearch(query, user.id, {
            useKnowledgeBase,
            agentProfile: agentProfile || undefined,
        });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('Quick research action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Research failed',
        };
    }
}

/**
 * Comprehensive research action (detailed, report format)
 */
export async function comprehensiveResearchAction(
    query: string,
    options?: {
        useKnowledgeBase?: boolean;
        topK?: number;
    }
): Promise<{
    success: boolean;
    data?: ResearchAgentWithRAGOutput;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const agentProfile = await getAgentProfile(user.id);

        const result = await comprehensiveResearch(query, user.id, {
            useKnowledgeBase: options?.useKnowledgeBase ?? true,
            topK: options?.topK || 10,
            agentProfile: agentProfile || undefined,
        });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('Comprehensive research action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Research failed',
        };
    }
}
