/**
 * SEO Analysis Repository
 * 
 * Provides CRUD operations for SEO analysis entities.
 * Tracks SEO scores and history for content optimization.
 */

import { DynamoDBRepository } from './repository';
import { getSEOAnalysisKeys } from './index';
import type { SEORecommendation } from '@/lib/seo/recommendations';

export interface SEOAnalysis {
    id: string;
    userId: string;
    contentId: string;
    contentType: 'blog-post' | 'market-update' | 'neighborhood-guide';
    score: number; // 0-100
    recommendations: SEORecommendation[];
    analyzedAt: string; // ISO 8601 timestamp
    previousScore?: number;
    createdAt: number;
    updatedAt: number;
}

export class SEORepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates a new SEO analysis
     * @param userId User ID
     * @param analysisData SEO analysis data
     * @returns Created SEO analysis
     */
    async createSEOAnalysis(
        userId: string,
        analysisData: Omit<SEOAnalysis, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<SEOAnalysis> {
        const analysisId = `${analysisData.contentId}_${Date.now()}`;
        const keys = getSEOAnalysisKeys(userId, analysisId);

        const analysis: SEOAnalysis = {
            id: analysisId,
            userId,
            ...analysisData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await this.repository.create(
            keys.PK,
            keys.SK,
            'SEOAnalysis',
            analysis
        );

        return analysis;
    }

    /**
     * Gets an SEO analysis by ID
     * @param userId User ID
     * @param analysisId Analysis ID
     * @returns SEO analysis or null if not found
     */
    async getSEOAnalysis(
        userId: string,
        analysisId: string
    ): Promise<SEOAnalysis | null> {
        const keys = getSEOAnalysisKeys(userId, analysisId);
        return this.repository.get<SEOAnalysis>(keys.PK, keys.SK);
    }

    /**
     * Gets the latest SEO analysis for a specific content item
     * @param userId User ID
     * @param contentId Content ID
     * @returns Latest SEO analysis or null if not found
     */
    async getLatestAnalysisForContent(
        userId: string,
        contentId: string
    ): Promise<SEOAnalysis | null> {
        const analyses = await this.queryAnalysesByContent(userId, contentId);

        if (analyses.length === 0) {
            return null;
        }

        // Sort by analyzedAt descending and return the most recent
        analyses.sort((a, b) =>
            new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        );

        return analyses[0];
    }

    /**
     * Queries all SEO analyses for a user
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of SEO analyses
     */
    async queryAllAnalyses(
        userId: string,
        limit?: number
    ): Promise<SEOAnalysis[]> {
        const pk = `USER#${userId}`;
        const skPrefix = 'SEO#';

        const result = await this.repository.query<SEOAnalysis>(
            pk,
            skPrefix,
            {
                limit,
                scanIndexForward: false, // Most recent first
            }
        );

        return result.items;
    }

    /**
     * Queries SEO analyses for a specific content item
     * @param userId User ID
     * @param contentId Content ID
     * @returns Array of SEO analyses for the content
     */
    async queryAnalysesByContent(
        userId: string,
        contentId: string
    ): Promise<SEOAnalysis[]> {
        const allAnalyses = await this.queryAllAnalyses(userId);

        // Filter by contentId
        return allAnalyses.filter(analysis => analysis.contentId === contentId);
    }

    /**
     * Gets score history for a specific content item
     * @param userId User ID
     * @param contentId Content ID
     * @returns Array of score history entries
     */
    async getScoreHistory(
        userId: string,
        contentId: string
    ): Promise<Array<{ analyzedAt: string; score: number }>> {
        const analyses = await this.queryAnalysesByContent(userId, contentId);

        // Sort by analyzedAt ascending (oldest first)
        analyses.sort((a, b) =>
            new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime()
        );

        return analyses.map(analysis => ({
            analyzedAt: analysis.analyzedAt,
            score: analysis.score,
        }));
    }

    /**
     * Updates an SEO analysis
     * @param userId User ID
     * @param analysisId Analysis ID
     * @param updates Partial analysis data to update
     */
    async updateSEOAnalysis(
        userId: string,
        analysisId: string,
        updates: Partial<Omit<SEOAnalysis, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const keys = getSEOAnalysisKeys(userId, analysisId);
        await this.repository.update(keys.PK, keys.SK, updates);
    }

    /**
     * Deletes an SEO analysis
     * @param userId User ID
     * @param analysisId Analysis ID
     */
    async deleteSEOAnalysis(
        userId: string,
        analysisId: string
    ): Promise<void> {
        const keys = getSEOAnalysisKeys(userId, analysisId);
        await this.repository.delete(keys.PK, keys.SK);
    }

    /**
     * Gets average SEO score across all content for a user
     * @param userId User ID
     * @returns Average SEO score
     */
    async getAverageSEOScore(userId: string): Promise<number> {
        const analyses = await this.queryAllAnalyses(userId);

        if (analyses.length === 0) {
            return 0;
        }

        // Get the latest analysis for each unique contentId
        const latestAnalysesByContent = new Map<string, SEOAnalysis>();

        for (const analysis of analyses) {
            const existing = latestAnalysesByContent.get(analysis.contentId);

            if (!existing ||
                new Date(analysis.analyzedAt).getTime() > new Date(existing.analyzedAt).getTime()) {
                latestAnalysesByContent.set(analysis.contentId, analysis);
            }
        }

        const latestAnalyses = Array.from(latestAnalysesByContent.values());
        const totalScore = latestAnalyses.reduce((sum, analysis) => sum + analysis.score, 0);

        return Math.round(totalScore / latestAnalyses.length);
    }

    /**
     * Gets top-performing content (score >= 80)
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of top-performing content analyses
     */
    async getTopPerformingContent(
        userId: string,
        limit: number = 10
    ): Promise<SEOAnalysis[]> {
        const analyses = await this.queryAllAnalyses(userId);

        // Get the latest analysis for each unique contentId
        const latestAnalysesByContent = new Map<string, SEOAnalysis>();

        for (const analysis of analyses) {
            const existing = latestAnalysesByContent.get(analysis.contentId);

            if (!existing ||
                new Date(analysis.analyzedAt).getTime() > new Date(existing.analyzedAt).getTime()) {
                latestAnalysesByContent.set(analysis.contentId, analysis);
            }
        }

        const latestAnalyses = Array.from(latestAnalysesByContent.values());

        // Filter for high scores and sort descending
        return latestAnalyses
            .filter(analysis => analysis.score >= 80)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Gets underperforming content (score < 60)
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of underperforming content analyses
     */
    async getUnderperformingContent(
        userId: string,
        limit: number = 10
    ): Promise<SEOAnalysis[]> {
        const analyses = await this.queryAllAnalyses(userId);

        // Get the latest analysis for each unique contentId
        const latestAnalysesByContent = new Map<string, SEOAnalysis>();

        for (const analysis of analyses) {
            const existing = latestAnalysesByContent.get(analysis.contentId);

            if (!existing ||
                new Date(analysis.analyzedAt).getTime() > new Date(existing.analyzedAt).getTime()) {
                latestAnalysesByContent.set(analysis.contentId, analysis);
            }
        }

        const latestAnalyses = Array.from(latestAnalysesByContent.values());

        // Filter for low scores and sort ascending
        return latestAnalyses
            .filter(analysis => analysis.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, limit);
    }

    /**
     * Tracks score change for content
     * @param userId User ID
     * @param contentId Content ID
     * @param newScore New SEO score
     * @param recommendations New recommendations
     * @param reason Reason for the score change
     * @returns Created SEO analysis with previous score tracked
     */
    async trackScoreChange(
        userId: string,
        contentId: string,
        contentType: SEOAnalysis['contentType'],
        newScore: number,
        recommendations: SEORecommendation[],
        reason?: string
    ): Promise<SEOAnalysis> {
        // Get the latest analysis to track previous score
        const latestAnalysis = await this.getLatestAnalysisForContent(userId, contentId);

        const analysisData: Omit<SEOAnalysis, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
            contentId,
            contentType,
            score: newScore,
            recommendations,
            analyzedAt: new Date().toISOString(),
            previousScore: latestAnalysis?.score,
        };

        return this.createSEOAnalysis(userId, analysisData);
    }
}

// Export singleton instance
export const seoRepository = new SEORepository();
