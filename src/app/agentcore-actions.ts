/**
 * AgentCore Server Actions
 * 
 * Server actions for invoking AgentCore Runtime agents from Next.js
 */

'use server';

import { getAgentCoreRuntimeClient } from '@/aws/bedrock/agentcore-runtime-client';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getAgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import { z } from 'zod';

// ============================================================================
// Research Agent Actions
// ============================================================================

const ResearchInputSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    useKnowledgeBase: z.boolean().optional().default(true),
    topK: z.number().optional().default(5),
    minScore: z.number().optional().default(0.5),
    scope: z.enum(['personal', 'team']).optional().default('personal'),
    teamId: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export async function executeResearchAgent(input: unknown) {
    try {
        // Validate input
        const validated = ResearchInputSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Get agent ARN from environment
        const agentArn = process.env.RESEARCH_AGENT_ARN;
        if (!agentArn) {
            return {
                success: false,
                error: 'Research agent not configured',
            };
        }

        // Invoke agent
        const client = getAgentCoreRuntimeClient();
        const result = await client.invokeAgent({
            agentArn,
            payload: {
                query: validated.query,
                userId: user.id,
                useKnowledgeBase: validated.useKnowledgeBase,
                topK: validated.topK,
                minScore: validated.minScore,
                scope: validated.scope,
                teamId: validated.teamId,
            },
            userId: user.id,
        });

        return {
            success: true,
            data: result.output,
            metadata: {
                sessionId: result.sessionId,
                executionTime: result.executionTime,
                requestId: result.requestId,
            },
        };
    } catch (error) {
        console.error('Research agent error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ============================================================================
// Content Generator Actions
// ============================================================================

const ContentGeneratorInputSchema = z.object({
    contentType: z.enum([
        'blog-post',
        'social-media',
        'listing-description',
        'market-update',
        'video-script',
        'email',
        'neighborhood-guide',
        'open-house-flyer',
        'agent-bio',
        'meta-description',
        'keyword-suggestions',
    ]),
    input: z.record(z.any()),
});

export type ContentGeneratorInput = z.infer<typeof ContentGeneratorInputSchema>;

export async function generateContent(input: unknown) {
    try {
        // Validate input
        const validated = ContentGeneratorInputSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Get agent profile
        const agentProfile = await getAgentProfile(user.id);

        // Get agent ARN from environment
        const agentArn = process.env.CONTENT_GENERATOR_AGENT_ARN;
        if (!agentArn) {
            return {
                success: false,
                error: 'Content generator agent not configured',
            };
        }

        // Invoke agent
        const client = getAgentCoreRuntimeClient();
        const result = await client.invokeAgent({
            agentArn,
            payload: {
                contentType: validated.contentType,
                input: validated.input,
                agentProfile: agentProfile || {
                    name: user.email, // Use email as name since name is not available
                    email: user.email,
                },
            },
            userId: user.id,
        });

        return {
            success: true,
            data: result.output,
            metadata: {
                sessionId: result.sessionId,
                executionTime: result.executionTime,
                requestId: result.requestId,
            },
        };
    } catch (error) {
        console.error('Content generator error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick research without knowledge base
 */
export async function quickResearch(query: string) {
    return executeResearchAgent({
        query,
        useKnowledgeBase: false,
    });
}

/**
 * Research with knowledge base
 */
export async function researchWithKnowledgeBase(query: string, topK: number = 5) {
    return executeResearchAgent({
        query,
        useKnowledgeBase: true,
        topK,
    });
}

/**
 * Generate blog post
 */
export async function generateBlogPost(topic: string, wordCount: number = 800) {
    return generateContent({
        contentType: 'blog-post',
        input: {
            topic,
            wordCount,
            tone: 'professional',
        },
    });
}

/**
 * Generate social media posts
 */
export async function generateSocialMedia(
    topic: string,
    platforms: string[] = ['linkedin', 'twitter', 'facebook']
) {
    return generateContent({
        contentType: 'social-media',
        input: {
            topic,
            platforms,
            tone: 'professional',
        },
    });
}

/**
 * Generate listing description
 */
export async function generateListingDescription(listingData: Record<string, any>) {
    return generateContent({
        contentType: 'listing-description',
        input: listingData,
    });
}
