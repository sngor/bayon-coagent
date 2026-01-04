/**
 * AI Visibility Analytics Integration Service
 * 
 * Connects AI visibility data with existing analytics infrastructure,
 * adds AI visibility metrics to existing reporting dashboards, and
 * creates unified performance tracking across all Brand features.
 */

import type { AIVisibilityScore, AIMention, OptimizationRecommendation } from '@/lib/ai-visibility/types';
import { analytics, trackUserInteraction } from '@/lib/analytics';

export interface AIVisibilityMetrics {
    overallScore: number;
    platformScores: {
        seo: number;
        aeo: number;
        aio: number;
        geo: number;
    };
    mentionCount: number;
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    competitorComparison: {
        rank: number;
        totalCompetitors: number;
        scoreAdvantage: number;
    };
    improvementTrend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
}

export interface BrandAnalyticsData {
    profileCompleteness: number;
    napConsistency: number;
    reviewCount: number;
    averageRating: number;
    gbpConnected: boolean;
    websiteOptimizationScore?: number;
    aiVisibility: AIVisibilityMetrics;
}

export interface UnifiedBrandMetrics {
    brandScore: number;
    aiVisibilityScore: number;
    profileHealth: number;
    onlinePresence: number;
    competitivePosition: number;
    trendDirection: 'up' | 'down' | 'stable';
    keyInsights: string[];
    actionableRecommendations: OptimizationRecommendation[];
}

export class AIVisibilityAnalyticsIntegration {
    /**
     * Track AI visibility analysis events
     */
    trackAIVisibilityAnalysis(userId: string, metrics: AIVisibilityMetrics): void {
        analytics.track('ai_visibility_analysis_completed', {
            userId,
            overallScore: metrics.overallScore,
            seoScore: metrics.platformScores.seo,
            aeoScore: metrics.platformScores.aeo,
            aioScore: metrics.platformScores.aio,
            geoScore: metrics.platformScores.geo,
            mentionCount: metrics.mentionCount,
            sentimentPositive: metrics.sentimentDistribution.positive,
            sentimentNeutral: metrics.sentimentDistribution.neutral,
            sentimentNegative: metrics.sentimentDistribution.negative,
            competitorRank: metrics.competitorComparison.rank,
            improvementTrend: metrics.improvementTrend,
            timestamp: Date.now()
        }, userId);
    }

    /**
     * Track AI mention events
     */
    trackAIMention(userId: string, mention: AIMention): void {
        analytics.track('ai_mention_detected', {
            userId,
            platform: mention.platform,
            position: mention.position,
            sentiment: mention.sentiment,
            confidence: mention.confidence,
            competitorCount: mention.competitorsAlsoMentioned.length,
            timestamp: mention.timestamp.getTime()
        }, userId);
    }

    /**
     * Track optimization recommendation interactions
     */
    trackRecommendationInteraction(
        userId: string, 
        recommendation: OptimizationRecommendation, 
        action: 'viewed' | 'implemented' | 'dismissed'
    ): void {
        analytics.track('ai_visibility_recommendation_interaction', {
            userId,
            recommendationId: recommendation.id,
            category: recommendation.category,
            priority: recommendation.priority,
            action,
            estimatedImpact: recommendation.estimatedImpact,
            implementationDifficulty: recommendation.implementationDifficulty,
            timestamp: Date.now()
        }, userId);

        // Also track using existing user interaction tracking
        trackUserInteraction.featureUsed('ai-visibility-recommendations', action, userId);
    }

    /**
     * Get AI visibility data for analytics dashboard
     */
    async getAIVisibilityAnalyticsData(userId: string): Promise<AIVisibilityMetrics | null> {
        try {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const repo = getRepository();

            // Get latest AI visibility analysis
            const analysisResult = await repo.query({
                PK: `USER#${userId}`,
                SK: { beginsWith: 'AI_ANALYSIS#' },
                limit: 1,
                scanIndexForward: false // Get most recent
            });

            if (analysisResult.items.length === 0) {
                return null;
            }

            const latestAnalysis = analysisResult.items[0].data;

            // Get recent mentions for sentiment analysis
            const mentionsResult = await repo.query({
                PK: `USER#${userId}`,
                SK: { beginsWith: 'AI_MENTION#' },
                limit: 50,
                scanIndexForward: false
            });

            const mentions = mentionsResult.items.map(item => item.data as AIMention);
            
            // Calculate sentiment distribution
            const sentimentCounts = mentions.reduce((acc, mention) => {
                acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const totalMentions = mentions.length;
            const sentimentDistribution = {
                positive: totalMentions > 0 ? (sentimentCounts.positive || 0) / totalMentions : 0,
                neutral: totalMentions > 0 ? (sentimentCounts.neutral || 0) / totalMentions : 0,
                negative: totalMentions > 0 ? (sentimentCounts.negative || 0) / totalMentions : 0
            };

            // Calculate improvement trend (simplified)
            const improvementTrend = this.calculateImprovementTrend(mentions);

            return {
                overallScore: latestAnalysis.overallScore || 0,
                platformScores: latestAnalysis.platformScores || { seo: 0, aeo: 0, aio: 0, geo: 0 },
                mentionCount: totalMentions,
                sentimentDistribution,
                competitorComparison: latestAnalysis.competitorComparison || { rank: 0, totalCompetitors: 0, scoreAdvantage: 0 },
                improvementTrend,
                lastUpdated: new Date(latestAnalysis.analyzedAt || Date.now())
            };

        } catch (error) {
            console.error('Failed to get AI visibility analytics data:', error);
            return null;
        }
    }

    /**
     * Integrate AI visibility data with existing brand analytics
     */
    async getUnifiedBrandMetrics(userId: string): Promise<UnifiedBrandMetrics | null> {
        try {
            // Get AI visibility metrics
            const aiVisibilityData = await this.getAIVisibilityAnalyticsData(userId);
            
            // Get existing brand data
            const brandData = await this.getExistingBrandData(userId);

            if (!aiVisibilityData || !brandData) {
                return null;
            }

            // Calculate unified metrics
            const brandScore = this.calculateUnifiedBrandScore(brandData, aiVisibilityData);
            const profileHealth = this.calculateProfileHealth(brandData);
            const onlinePresence = this.calculateOnlinePresence(brandData, aiVisibilityData);
            const competitivePosition = this.calculateCompetitivePosition(aiVisibilityData);

            // Generate insights and recommendations
            const keyInsights = this.generateKeyInsights(brandData, aiVisibilityData);
            const actionableRecommendations = await this.getTopRecommendations(userId, 5);

            // Determine overall trend
            const trendDirection = this.calculateOverallTrend(brandData, aiVisibilityData);

            return {
                brandScore,
                aiVisibilityScore: aiVisibilityData.overallScore,
                profileHealth,
                onlinePresence,
                competitivePosition,
                trendDirection,
                keyInsights,
                actionableRecommendations
            };

        } catch (error) {
            console.error('Failed to get unified brand metrics:', error);
            return null;
        }
    }

    /**
     * Add AI visibility metrics to existing reporting dashboards
     */
    async enhanceExistingDashboard(userId: string, existingMetrics: any): Promise<any> {
        const aiVisibilityData = await this.getAIVisibilityAnalyticsData(userId);
        
        if (!aiVisibilityData) {
            return existingMetrics;
        }

        // Enhance existing metrics with AI visibility data
        return {
            ...existingMetrics,
            aiVisibility: {
                score: aiVisibilityData.overallScore,
                platformBreakdown: aiVisibilityData.platformScores,
                mentionTrend: aiVisibilityData.improvementTrend,
                sentimentScore: this.calculateSentimentScore(aiVisibilityData.sentimentDistribution),
                competitiveRank: aiVisibilityData.competitorComparison.rank
            },
            enhancedInsights: [
                ...existingMetrics.insights || [],
                ...this.generateAIVisibilityInsights(aiVisibilityData)
            ]
        };
    }

    /**
     * Create performance correlation analysis
     */
    async analyzePerformanceCorrelation(userId: string, timeRange: { start: Date; end: Date }): Promise<{
        correlations: Array<{ metric: string; correlation: number; significance: string }>;
        insights: string[];
    }> {
        try {
            // Get AI visibility data over time
            const aiVisibilityHistory = await this.getAIVisibilityHistory(userId, timeRange);
            
            // Get business metrics over the same period
            const businessMetrics = await this.getBusinessMetrics(userId, timeRange);

            // Calculate correlations
            const correlations = this.calculateCorrelations(aiVisibilityHistory, businessMetrics);

            // Generate insights based on correlations
            const insights = this.generateCorrelationInsights(correlations);

            return { correlations, insights };

        } catch (error) {
            console.error('Failed to analyze performance correlation:', error);
            return { correlations: [], insights: [] };
        }
    }

    /**
     * Private helper methods
     */

    private calculateImprovementTrend(mentions: AIMention[]): 'improving' | 'declining' | 'stable' {
        if (mentions.length < 2) return 'stable';

        // Simple trend calculation based on recent vs older mentions
        const recentMentions = mentions.slice(0, Math.floor(mentions.length / 2));
        const olderMentions = mentions.slice(Math.floor(mentions.length / 2));

        const recentPositive = recentMentions.filter(m => m.sentiment === 'positive').length / recentMentions.length;
        const olderPositive = olderMentions.filter(m => m.sentiment === 'positive').length / olderMentions.length;

        if (recentPositive > olderPositive + 0.1) return 'improving';
        if (recentPositive < olderPositive - 0.1) return 'declining';
        return 'stable';
    }

    private async getExistingBrandData(userId: string): Promise<BrandAnalyticsData | null> {
        try {
            // Get profile data
            const { getProfileAction } = await import('@/app/actions');
            const profileResult = await getProfileAction(userId);
            
            if (profileResult.message !== 'success' || !profileResult.data) {
                return null;
            }

            const profile = profileResult.data;

            // Calculate profile completeness
            const requiredFields = ['name', 'agencyName', 'phone', 'address', 'bio'];
            const completedFields = requiredFields.filter(field => profile[field as keyof typeof profile]);
            const profileCompleteness = (completedFields.length / requiredFields.length) * 100;

            // Get NAP consistency data
            const { getAuditDataAction } = await import('@/app/actions');
            const auditResult = await getAuditDataAction(userId);
            const napConsistency = auditResult.data ? this.calculateNAPConsistency(auditResult.data.results) : 0;

            // Get review data
            const { getReviewsAction } = await import('@/app/actions');
            const reviewsResult = await getReviewsAction(userId);
            const reviews = reviewsResult.data || [];
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
                : 0;

            // Get OAuth data for GBP connection
            const { getOAuthTokensAction } = await import('@/features/integrations/actions/oauth-actions');
            const gbpData = await getOAuthTokensAction(userId, 'GOOGLE_BUSINESS');
            const gbpConnected = !!gbpData?.accessToken;

            // Get AI visibility data
            const aiVisibility = await this.getAIVisibilityAnalyticsData(userId);

            return {
                profileCompleteness,
                napConsistency,
                reviewCount: reviews.length,
                averageRating,
                gbpConnected,
                websiteOptimizationScore: profile.websiteOptimizationScore,
                aiVisibility: aiVisibility || {
                    overallScore: 0,
                    platformScores: { seo: 0, aeo: 0, aio: 0, geo: 0 },
                    mentionCount: 0,
                    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
                    competitorComparison: { rank: 0, totalCompetitors: 0, scoreAdvantage: 0 },
                    improvementTrend: 'stable',
                    lastUpdated: new Date()
                }
            };

        } catch (error) {
            console.error('Failed to get existing brand data:', error);
            return null;
        }
    }

    private calculateNAPConsistency(auditResults: any[]): number {
        if (!auditResults || auditResults.length === 0) return 0;
        
        const consistentResults = auditResults.filter(result => result.status === 'Consistent');
        return (consistentResults.length / auditResults.length) * 100;
    }

    private calculateUnifiedBrandScore(brandData: BrandAnalyticsData, aiData: AIVisibilityMetrics): number {
        // Weighted calculation: Profile 30%, NAP 20%, Reviews 15%, GBP 15%, AI Visibility 20%
        const profileScore = brandData.profileCompleteness * 0.30;
        const napScore = brandData.napConsistency * 0.20;
        const reviewScore = Math.min(100, (brandData.reviewCount * 10 + brandData.averageRating * 15)) * 0.15;
        const gbpScore = (brandData.gbpConnected ? 100 : 0) * 0.15;
        const aiScore = aiData.overallScore * 0.20;

        return Math.round(profileScore + napScore + reviewScore + gbpScore + aiScore);
    }

    private calculateProfileHealth(brandData: BrandAnalyticsData): number {
        // Combine profile completeness with review quality
        const profileWeight = 0.7;
        const reviewWeight = 0.3;
        
        const profileScore = brandData.profileCompleteness;
        const reviewScore = brandData.reviewCount > 0 
            ? Math.min(100, brandData.averageRating * 20) 
            : 0;

        return Math.round(profileScore * profileWeight + reviewScore * reviewWeight);
    }

    private calculateOnlinePresence(brandData: BrandAnalyticsData, aiData: AIVisibilityMetrics): number {
        // Combine NAP consistency, GBP connection, and AI visibility
        const napWeight = 0.4;
        const gbpWeight = 0.3;
        const aiWeight = 0.3;

        const napScore = brandData.napConsistency;
        const gbpScore = brandData.gbpConnected ? 100 : 0;
        const aiScore = aiData.overallScore;

        return Math.round(napScore * napWeight + gbpScore * gbpWeight + aiScore * aiWeight);
    }

    private calculateCompetitivePosition(aiData: AIVisibilityMetrics): number {
        // Convert rank to score (lower rank = higher score)
        if (aiData.competitorComparison.totalCompetitors === 0) return 50;
        
        const rankPercentile = (aiData.competitorComparison.totalCompetitors - aiData.competitorComparison.rank + 1) 
            / aiData.competitorComparison.totalCompetitors;
        
        return Math.round(rankPercentile * 100);
    }

    private generateKeyInsights(brandData: BrandAnalyticsData, aiData: AIVisibilityMetrics): string[] {
        const insights: string[] = [];

        // Profile insights
        if (brandData.profileCompleteness < 80) {
            insights.push(`Complete your profile to improve discoverability (${Math.round(brandData.profileCompleteness)}% complete)`);
        }

        // NAP insights
        if (brandData.napConsistency < 90) {
            insights.push(`Fix NAP inconsistencies across platforms (${Math.round(brandData.napConsistency)}% consistent)`);
        }

        // AI visibility insights
        if (aiData.overallScore < 70) {
            insights.push(`Optimize for AI search engines (current score: ${aiData.overallScore}/100)`);
        }

        // Sentiment insights
        if (aiData.sentimentDistribution.negative > 0.2) {
            insights.push(`Address negative sentiment in AI mentions (${Math.round(aiData.sentimentDistribution.negative * 100)}% negative)`);
        }

        // Competitive insights
        if (aiData.competitorComparison.rank > aiData.competitorComparison.totalCompetitors * 0.5) {
            insights.push(`Improve competitive position (currently ranked #${aiData.competitorComparison.rank} of ${aiData.competitorComparison.totalCompetitors})`);
        }

        return insights;
    }

    private async getTopRecommendations(userId: string, limit: number): Promise<OptimizationRecommendation[]> {
        try {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const repo = getRepository();

            const result = await repo.query({
                PK: `USER#${userId}`,
                SK: { beginsWith: 'AI_RECOMMENDATION#' },
                limit,
                scanIndexForward: false
            });

            return result.items
                .map(item => item.data as OptimizationRecommendation)
                .filter(rec => rec.status === 'pending')
                .sort((a, b) => {
                    // Sort by priority (high > medium > low) then by estimated impact
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    const aPriority = priorityOrder[a.priority];
                    const bPriority = priorityOrder[b.priority];
                    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority;
                    }
                    
                    return b.estimatedImpact - a.estimatedImpact;
                });

        } catch (error) {
            console.error('Failed to get top recommendations:', error);
            return [];
        }
    }

    private calculateOverallTrend(brandData: BrandAnalyticsData, aiData: AIVisibilityMetrics): 'up' | 'down' | 'stable' {
        // Simplified trend calculation based on AI visibility trend
        switch (aiData.improvementTrend) {
            case 'improving': return 'up';
            case 'declining': return 'down';
            default: return 'stable';
        }
    }

    private calculateSentimentScore(distribution: { positive: number; neutral: number; negative: number }): number {
        // Convert sentiment distribution to a 0-100 score
        return Math.round((distribution.positive * 100) + (distribution.neutral * 50));
    }

    private generateAIVisibilityInsights(aiData: AIVisibilityMetrics): string[] {
        const insights: string[] = [];

        if (aiData.overallScore > 80) {
            insights.push('Excellent AI visibility - you\'re easily discoverable by AI search engines');
        } else if (aiData.overallScore > 60) {
            insights.push('Good AI visibility with room for improvement in structured data');
        } else {
            insights.push('AI visibility needs attention - optimize schema markup and content structure');
        }

        if (aiData.mentionCount > 10) {
            insights.push(`Strong AI presence with ${aiData.mentionCount} recent mentions`);
        } else if (aiData.mentionCount > 0) {
            insights.push('Building AI presence - continue optimizing for better visibility');
        }

        return insights;
    }

    private async getAIVisibilityHistory(userId: string, timeRange: { start: Date; end: Date }): Promise<any[]> {
        // Implementation would fetch historical AI visibility data
        // For now, return empty array
        return [];
    }

    private async getBusinessMetrics(userId: string, timeRange: { start: Date; end: Date }): Promise<any[]> {
        // Implementation would fetch business metrics (leads, conversions, etc.)
        // For now, return empty array
        return [];
    }

    private calculateCorrelations(aiHistory: any[], businessMetrics: any[]): Array<{ metric: string; correlation: number; significance: string }> {
        // Implementation would calculate statistical correlations
        // For now, return empty array
        return [];
    }

    private generateCorrelationInsights(correlations: Array<{ metric: string; correlation: number; significance: string }>): string[] {
        // Implementation would generate insights based on correlations
        // For now, return empty array
        return [];
    }
}

// Export singleton instance
export const aiVisibilityAnalytics = new AIVisibilityAnalyticsIntegration();