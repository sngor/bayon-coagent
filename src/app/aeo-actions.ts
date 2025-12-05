'use server';

/**
 * Server Actions for AEO (Answer Engine Optimization)
 */

import { revalidatePath } from 'next/cache';
import { analyzeAEO as analyzeAEOProfile } from '@/aws/bedrock/flows/aeo-analysis';
import {
    analyzeAEO,
    optimizeForAEO,
    quickAEOCheck,
    generateAEOFAQ,
} from '@/aws/bedrock/aeo-optimizer';
import type {
    AEOAnalysis,
    AEOOptimizationResult,
} from '@/aws/bedrock/aeo-optimizer';
import type {
    AEOAnalysisInput,
    AEOScore,
    AEORecommendation,
} from '@/ai/schemas/aeo-schemas';
import {
    saveAEOAnalysis,
    getLatestAEOScore,
    getAEOScoreHistory,
    getAEORecommendations,
    getAEOMentions,
    updateAEORecommendationStatus,
    getAEOStatistics,
} from '@/aws/dynamodb/aeo-repository';
import { getRepository } from '@/aws/dynamodb/repository';
import { getUserProfileKeys } from '@/aws/dynamodb/keys';
import type {
    AEOMention,
    AEOHistoryEntry,
} from '@/lib/types/aeo-types';

interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Run AEO analysis for a user
 */
export async function runAEOAnalysis(userId: string): Promise<ActionResponse<{
    score: AEOScore;
    recommendationsCount: number;
    insightsCount: number;
}>> {
    try {
        // Get user profile for agent information
        const repository = getRepository();
        const profileKeys = getUserProfileKeys(userId);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile) {
            return {
                success: false,
                error: 'User profile not found. Please complete your profile first.',
            };
        }

        // Build analysis request
        const analysisRequest: AEOAnalysisInput = {
            userId,
            agentName: profile.name || profile.agentName || 'Unknown Agent',
            businessName: profile.businessName,
            website: profile.website,
            location: profile.location || profile.city,
            googleBusinessProfileUrl: profile.googleBusinessProfileUrl,
            socialMediaUrls: [
                profile.facebookUrl,
                profile.instagramUrl,
                profile.linkedinUrl,
                profile.twitterUrl,
            ].filter(Boolean) as string[],
            averageRating: profile.averageRating,
            hasSchemaMarkup: profile.hasSchemaMarkup,
            napConsistency: profile.napConsistency,
        };

        console.log('Running AEO analysis for:', analysisRequest.agentName);

        // Run analysis
        const result = await analyzeAEOProfile(analysisRequest);

        // Save results
        const analysisId = `analysis_${Date.now()}`;
        await saveAEOAnalysis(userId, analysisId, result);

        // Revalidate the audit page
        revalidatePath('/brand/audit/ai-visibility');

        return {
            success: true,
            data: {
                score: result.score,
                recommendationsCount: result.recommendations.length,
                insightsCount: result.insights.length,
            },
            message: 'AEO analysis completed successfully',
        };
    } catch (error: any) {
        console.error('AEO analysis failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to run AEO analysis',
        };
    }
}

/**
 * Get latest AEO score for a user
 */
export async function getAEOScore(userId: string): Promise<ActionResponse<AEOScore>> {
    try {
        const score = await getLatestAEOScore(userId);

        if (!score) {
            return {
                success: false,
                message: 'No AEO score found. Run an analysis first.',
            };
        }

        return {
            success: true,
            data: score,
        };
    } catch (error: any) {
        console.error('Failed to get AEO score:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AEO score',
        };
    }
}

/**
 * Get AEO score history for a user
 */
export async function getAEOHistory(
    userId: string,
    limit: number = 10
): Promise<ActionResponse<AEOHistoryEntry[]>> {
    try {
        const history = await getAEOScoreHistory(userId, limit);

        return {
            success: true,
            data: history,
        };
    } catch (error: any) {
        console.error('Failed to get AEO history:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AEO history',
        };
    }
}

/**
 * Get AEO recommendations for a user
 */
export async function getAEORecommendationsAction(
    userId: string
): Promise<ActionResponse<AEORecommendation[]>> {
    try {
        const recommendations = await getAEORecommendations(userId);

        return {
            success: true,
            data: recommendations,
        };
    } catch (error: any) {
        console.error('Failed to get AEO recommendations:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AEO recommendations',
        };
    }
}

/**
 * Get AEO mentions for a user
 */
export async function getAEOMentionsAction(
    userId: string,
    limit: number = 20
): Promise<ActionResponse<AEOMention[]>> {
    try {
        const mentions = await getAEOMentions(userId, limit);

        return {
            success: true,
            data: mentions,
        };
    } catch (error: any) {
        console.error('Failed to get AEO mentions:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AEO mentions',
        };
    }
}

/**
 * Update AEO recommendation status
 */
export async function updateRecommendationStatus(
    userId: string,
    recommendationId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
): Promise<ActionResponse> {
    try {
        await updateAEORecommendationStatus(userId, recommendationId, status);

        // Revalidate the audit page
        revalidatePath('/brand/audit/ai-visibility');

        return {
            success: true,
            message: 'Recommendation status updated',
        };
    } catch (error: any) {
        console.error('Failed to update recommendation status:', error);
        return {
            success: false,
            error: error.message || 'Failed to update recommendation status',
        };
    }
}

/**
 * Get AEO statistics for a user
 */
export async function getAEOStats(userId: string): Promise<ActionResponse<{
    currentScore: number | null;
    trend: 'up' | 'down' | 'stable';
    totalMentions: number;
    pendingRecommendations: number;
    completedRecommendations: number;
}>> {
    try {
        const stats = await getAEOStatistics(userId);

        return {
            success: true,
            data: stats,
        };
    } catch (error: any) {
        console.error('Failed to get AEO statistics:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AEO statistics',
        };
    }
}

/**
 * Analyze content for AEO optimization (for content optimization panel)
 */
export async function analyzeAEOAction(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog'
): Promise<{ message: string; data?: AEOAnalysis }> {
    try {
        const analysis = await analyzeAEO(content, contentType);
        return {
            message: 'success',
            data: analysis,
        };
    } catch (error: any) {
        console.error('AEO content analysis failed:', error);
        return {
            message: error.message || 'Failed to analyze content for AEO',
        };
    }
}

/**
 * Optimize content for AEO (for content optimization panel)
 */
export async function optimizeForAEOAction(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog',
    targetKeywords?: string[]
): Promise<{ message: string; data?: AEOOptimizationResult }> {
    try {
        const result = await optimizeForAEO(content, contentType, targetKeywords);
        return {
            message: 'success',
            data: result,
        };
    } catch (error: any) {
        console.error('AEO content optimization failed:', error);
        return {
            message: error.message || 'Failed to optimize content for AEO',
        };
    }
}

/**
 * Quick AEO check for content
 */
export async function quickAEOCheckAction(
    content: string
): Promise<{ message: string; data?: { score: number; issues: string[]; quickFixes: string[] } }> {
    try {
        const result = await quickAEOCheck(content);
        return {
            message: 'success',
            data: result,
        };
    } catch (error: any) {
        console.error('Quick AEO check failed:', error);
        return {
            message: error.message || 'Failed to perform quick AEO check',
        };
    }
}

/**
 * Generate AEO-optimized FAQ section
 */
export async function generateAEOFAQAction(
    content: string,
    numQuestions: number = 5
): Promise<{ message: string; data?: { question: string; answer: string }[] }> {
    try {
        const faqs = await generateAEOFAQ(content, numQuestions);
        return {
            message: 'success',
            data: faqs,
        };
    } catch (error: any) {
        console.error('AEO FAQ generation failed:', error);
        return {
            message: error.message || 'Failed to generate AEO FAQ',
        };
    }
}
