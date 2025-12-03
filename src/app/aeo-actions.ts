'use server';

/**
 * Server Actions for AEO (Answer Engine Optimization)
 */

import { revalidatePath } from 'next/cache';
import { analyzeAEO } from '@/aws/bedrock/flows/aeo-analysis';
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
    AEOScore,
    AEORecommendation,
    AEOMention,
    AEOHistoryEntry,
    AEOAnalysisRequest,
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
        const analysisRequest: AEOAnalysisRequest = {
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
            ].filter(Boolean),
            reviewCount: profile.reviewCount,
            averageRating: profile.averageRating,
            hasSchemaMarkup: profile.hasSchemaMarkup,
            napConsistency: profile.napConsistency,
        };

        console.log('Running AEO analysis for:', analysisRequest.agentName);

        // Run analysis
        const result = await analyzeAEO(analysisRequest);

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
