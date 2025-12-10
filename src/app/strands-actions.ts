'use server';

/**
 * Server Actions for Strands Agent Integration
 * 
 * Follows the established server action patterns in Bayon Coagent
 * Integrates with the Research Hub in the application architecture
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    executeStrandsResearch,
    executeResearchWithFallback,
    checkStrandsResearchHealth,
    StrandsResearchInputSchema
} from '@/services/strands/research-agent-service';

/**
 * Server action input schema for research requests
 */
const ResearchActionInputSchema = z.object({
    topic: z.string().min(1, 'Research topic is required').max(500, 'Topic too long'),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced'),
    includeMarketAnalysis: z.boolean().default(true),
    saveToLibrary: z.boolean().default(true),
});

type ResearchActionInput = z.infer<typeof ResearchActionInputSchema>;

/**
 * Standard server action response format
 */
interface ActionResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

/**
 * Execute research using Strands agent with fallback to Bedrock
 * 
 * This action integrates with the Research Hub workflow:
 * Research → Research Agent → Submit topic → View report → Access from Reports
 */
export async function executeResearchAction(
    input: ResearchActionInput
): Promise<ActionResponse<{ reportId?: string; report?: string; citations?: string[] }>> {
    try {
        // Get current user (required for all authenticated actions)
        const user = await getCurrentUser();
        if (!user?.userId) {
            return {
                success: false,
                message: 'Authentication required',
                errors: { auth: ['Please sign in to use the research agent'] },
            };
        }

        // Validate input
        const validatedInput = ResearchActionInputSchema.parse(input);

        // Prepare Strands input
        const strandsInput = StrandsResearchInputSchema.parse({
            ...validatedInput,
            userId: user.userId,
        });

        // Execute research with fallback
        const result = await executeResearchWithFallback(strandsInput);

        if (!result.success) {
            return {
                success: false,
                message: 'Research failed',
                errors: { research: [result.error || 'Unknown error occurred'] },
            };
        }

        // Save to library if requested (following the Library Hub pattern)
        let reportId: string | undefined;
        if (validatedInput.saveToLibrary && result.report) {
            try {
                const repository = getRepository();

                // Create report entry following the DynamoDB single-table design
                const reportData = {
                    userId: user.userId,
                    type: 'research-report' as const,
                    title: validatedInput.topic,
                    content: result.report,
                    citations: result.citations || [],
                    source: 'strands-agent',
                    searchDepth: validatedInput.searchDepth,
                    includeMarketAnalysis: validatedInput.includeMarketAnalysis,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const savedReport = await repository.createItem('REPORT', reportData);
                reportId = savedReport.id;

                // Revalidate the Reports page in the Library Hub
                revalidatePath('/library/reports');

            } catch (saveError) {
                console.error('Failed to save research report:', saveError);
                // Don't fail the entire action if saving fails
            }
        }

        return {
            success: true,
            message: reportId
                ? 'Research completed and saved to your library'
                : 'Research completed successfully',
            data: {
                reportId,
                report: result.report,
                citations: result.citations,
            },
        };

    } catch (error) {
        console.error('Research action failed:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Invalid input provided',
                errors: error.flatten().fieldErrors,
            };
        }

        return {
            success: false,
            message: 'An unexpected error occurred',
            errors: { system: ['Please try again later'] },
        };
    }
}

/**
 * Health check action for Strands integration
 * Used by admin dashboard and monitoring
 */
export async function checkStrandsHealthAction(): Promise<ActionResponse<{
    healthy: boolean;
    details: any;
}>> {
    try {
        const user = await getCurrentUser();
        if (!user?.userId) {
            return {
                success: false,
                message: 'Authentication required',
            };
        }

        const healthResult = await checkStrandsResearchHealth();

        return {
            success: true,
            message: healthResult.message,
            data: {
                healthy: healthResult.healthy,
                details: healthResult.details,
            },
        };

    } catch (error) {
        console.error('Health check failed:', error);
        return {
            success: false,
            message: 'Health check failed',
            data: {
                healthy: false,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
        };
    }
}

/**
 * Get research history for the current user
 * Integrates with the Library → Reports section
 */
export async function getResearchHistoryAction(
    limit: number = 10
): Promise<ActionResponse<Array<{
    id: string;
    title: string;
    createdAt: string;
    source: string;
}>>> {
    try {
        const user = await getCurrentUser();
        if (!user?.userId) {
            return {
                success: false,
                message: 'Authentication required',
            };
        }

        const repository = getRepository();

        // Query user's research reports
        const reports = await repository.queryItems(
            'USER',
            user.userId,
            {
                beginsWith: 'REPORT#',
                limit,
                sortOrder: 'desc', // Most recent first
            }
        );

        const formattedReports = reports
            .filter(report => report.type === 'research-report')
            .map(report => ({
                id: report.id,
                title: report.title || 'Untitled Research',
                createdAt: report.createdAt,
                source: report.source || 'unknown',
            }));

        return {
            success: true,
            message: `Found ${formattedReports.length} research reports`,
            data: formattedReports,
        };

    } catch (error) {
        console.error('Failed to get research history:', error);
        return {
            success: false,
            message: 'Failed to load research history',
            errors: { system: ['Please try again later'] },
        };
    }
}