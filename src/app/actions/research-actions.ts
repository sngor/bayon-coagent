'use server';

/**
 * Research-specific Server Actions
 * Extracted from main actions.ts for better organization
 */

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { handleError } from '@/lib/error-handling';
import { runResearchAgent } from '@/aws/bedrock/flows/run-research-agent';
import type { RunResearchAgentOutput } from '@/ai/schemas/research-agent-schemas';

const researchAgentSchema = z.object({
    topic: z.string().min(10, 'Please provide a more specific topic for better research results.'),
});

export async function runResearchAgentAction(prevState: any, formData: FormData): Promise<{
    message: string;
    data: (RunResearchAgentOutput & { reportId?: string; source?: string }) | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to use the research agent' },
            data: null,
        };
    }

    const validatedFields = researchAgentSchema.safeParse({
        topic: formData.get('topic'),
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || "Validation failed.",
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🔍 Starting enhanced research with Strands-inspired capabilities...');

        // Try enhanced research service first
        try {
            const { runEnhancedResearch } = await import('@/services/strands/enhanced-research-service');

            const enhancedResult = await runEnhancedResearch(
                validatedFields.data.topic,
                user.id,
                {
                    searchDepth: 'advanced',
                    includeMarketAnalysis: true,
                    includeRecommendations: true,
                    targetAudience: 'agents',
                }
            );

            if (enhancedResult.success && enhancedResult.report) {
                console.log('✅ Enhanced research completed successfully');

                return {
                    message: 'success',
                    data: {
                        report: enhancedResult.report,
                        citations: enhancedResult.citations || [],
                        source: enhancedResult.source || 'enhanced-research-agent',
                    },
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced research failed, using standard Bedrock:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock research agent');
        const result = await runResearchAgent({ topic: validatedFields.data.topic });

        return {
            message: 'success',
            data: {
                ...result,
                source: 'bedrock-agent',
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleError(error, { 
            context: { operation: 'research' },
            fallbackMessage: 'An unexpected error occurred during research.'
        });
        return {
            message: `Research failed: ${errorMessage}`,
            errors: {},
            data: null,
        };
    }
}