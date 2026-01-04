/**
 * Enhanced Analytics Tracking for AI Visibility
 * 
 * Extends the existing analytics system with AI visibility specific events
 * and integrates with the unified brand performance tracking.
 */

import { analytics, trackUserInteraction } from '@/lib/analytics';
import type { AIVisibilityScore, AIMention, OptimizationRecommendation } from '@/lib/ai-visibility/types';

// AI Visibility specific event tracking
export const trackAIVisibility = {
    analysisStarted: (userId: string, analysisType: 'full' | 'quick' | 'competitive') => {
        analytics.track('ai_visibility_analysis_started', {
            analysisType,
            timestamp: Date.now()
        }, userId);
    },

    analysisCompleted: (userId: string, score: AIVisibilityScore, duration: number) => {
        analytics.track('ai_visibility_analysis_completed', {
            overallScore: score.overall,
            schemaScore: score.breakdown.schemaMarkup,
            contentScore: score.breakdown.contentOptimization,
            aiPresenceScore: score.breakdown.aiSearchPresence,
            knowledgeGraphScore: score.breakdown.knowledgeGraphIntegration,
            socialScore: score.breakdown.socialSignals,
            seoScore: score.breakdown.technicalSEO,
            trend: score.trend,
            duration,
            timestamp: Date.now()
        }, userId);

        // Also track as a general feature usage
        trackUserInteraction.featureUsed('ai-visibility-analysis', 'completed', userId);
    },

    analysisFailed: (userId: string, error: string, duration: number) => {
        analytics.track('ai_visibility_analysis_failed', {
            error,
            duration,
            timestamp: Date.now()
        }, userId);
    },

    mentionDetected: (userId: string, mention: AIMention) => {
        analytics.track('ai_mention_detected', {
            platform: mention.platform,
            position: mention.position,
            sentiment: mention.sentiment,
            confidence: mention.confidence,
            competitorCount: mention.competitorsAlsoMentioned.length,
            queryType: mention.query.length > 50 ? 'complex' : 'simple',
            timestamp: mention.timestamp.getTime()
        }, userId);
    },

    schemaGenerated: (userId: string, schemaType: string, fieldsIncluded: number) => {
        analytics.track('ai_visibility_schema_generated', {
            schemaType,
            fieldsIncluded,
            timestamp: Date.now()
        }, userId);
    },

    schemaValidated: (userId: string, schemaType: string, isValid: boolean, errors?: string[]) => {
        analytics.track('ai_visibility_schema_validated', {
            schemaType,
            isValid,
            errorCount: errors?.length || 0,
            timestamp: Date.now()
        }, userId);
    },

    recommendationGenerated: (userId: string, recommendation: OptimizationRecommendation) => {
        analytics.track('ai_visibility_recommendation_generated', {
            category: recommendation.category,
            priority: recommendation.priority,
            estimatedImpact: recommendation.estimatedImpact,
            difficulty: recommendation.implementationDifficulty,
            timestamp: Date.now()
        }, userId);
    },

    recommendationViewed: (userId: string, recommendationId: string, category: string) => {
        analytics.track('ai_visibility_recommendation_viewed', {
            recommendationId,
            category,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('ai-visibility-recommendations', 'viewed', userId);
    },

    recommendationImplemented: (userId: string, recommendationId: string, category: string, timeToImplement: number) => {
        analytics.track('ai_visibility_recommendation_implemented', {
            recommendationId,
            category,
            timeToImplement,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('ai-visibility-recommendations', 'implemented', userId);
    },

    recommendationDismissed: (userId: string, recommendationId: string, category: string, reason?: string) => {
        analytics.track('ai_visibility_recommendation_dismissed', {
            recommendationId,
            category,
            reason,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('ai-visibility-recommendations', 'dismissed', userId);
    },

    exportGenerated: (userId: string, format: string, schemaCount: number) => {
        analytics.track('ai_visibility_export_generated', {
            format,
            schemaCount,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('ai-visibility-export', format, userId);
    },

    competitiveAnalysisRun: (userId: string, competitorCount: number, marketArea: string) => {
        analytics.track('ai_visibility_competitive_analysis', {
            competitorCount,
            marketArea,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('ai-visibility-competitive', 'analysis', userId);
    },

    knowledgeGraphUpdated: (userId: string, entityCount: number, relationshipCount: number) => {
        analytics.track('ai_visibility_knowledge_graph_updated', {
            entityCount,
            relationshipCount,
            timestamp: Date.now()
        }, userId);
    }
};

// Brand integration specific tracking
export const trackBrandIntegration = {
    profileSyncTriggered: (userId: string, changedFields: string[], schemaCount: number) => {
        analytics.track('brand_profile_ai_sync_triggered', {
            changedFieldCount: changedFields.length,
            changedFields: changedFields.slice(0, 5), // Limit to first 5 fields for privacy
            schemaCount,
            timestamp: Date.now()
        }, userId);
    },

    profileSyncCompleted: (userId: string, updatedSchemas: number, updatedEntities: number, duration: number) => {
        analytics.track('brand_profile_ai_sync_completed', {
            updatedSchemas,
            updatedEntities,
            duration,
            timestamp: Date.now()
        }, userId);
    },

    profileSyncFailed: (userId: string, error: string, duration: number) => {
        analytics.track('brand_profile_ai_sync_failed', {
            error,
            duration,
            timestamp: Date.now()
        }, userId);
    },

    testimonialSyncTriggered: (userId: string, testimonialCount: number) => {
        analytics.track('brand_testimonial_ai_sync_triggered', {
            testimonialCount,
            timestamp: Date.now()
        }, userId);
    },

    testimonialSyncCompleted: (userId: string, reviewSchemaCount: number, duration: number) => {
        analytics.track('brand_testimonial_ai_sync_completed', {
            reviewSchemaCount,
            duration,
            timestamp: Date.now()
        }, userId);
    },

    napAuditIntegration: (userId: string, napScore: number, aiVisibilityScore: number) => {
        analytics.track('brand_nap_ai_integration', {
            napScore,
            aiVisibilityScore,
            correlation: Math.abs(napScore - aiVisibilityScore),
            timestamp: Date.now()
        }, userId);
    },

    unifiedDashboardViewed: (userId: string, brandScore: number, aiScore: number, profileHealth: number) => {
        analytics.track('brand_unified_dashboard_viewed', {
            brandScore,
            aiScore,
            profileHealth,
            timestamp: Date.now()
        }, userId);

        trackUserInteraction.featureUsed('brand-unified-dashboard', 'viewed', userId);
    }
};

// Performance correlation tracking
export const trackPerformanceCorrelation = {
    correlationCalculated: (userId: string, correlations: Array<{ metric: string; correlation: number }>) => {
        analytics.track('ai_visibility_performance_correlation', {
            correlationCount: correlations.length,
            strongCorrelations: correlations.filter(c => Math.abs(c.correlation) > 0.7).length,
            averageCorrelation: correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length,
            timestamp: Date.now()
        }, userId);
    },

    businessImpactMeasured: (userId: string, aiScoreChange: number, businessMetricChange: number, metric: string) => {
        analytics.track('ai_visibility_business_impact', {
            aiScoreChange,
            businessMetricChange,
            metric,
            impactRatio: businessMetricChange / (aiScoreChange || 1),
            timestamp: Date.now()
        }, userId);
    }
};

// Aggregated analytics for reporting
export class AIVisibilityAnalyticsAggregator {
    /**
     * Get AI visibility usage metrics for a user
     */
    static getAIVisibilityMetrics(userId: string) {
        const events = analytics.getEvents().filter(e => 
            e.userId === userId && e.event.startsWith('ai_visibility_')
        );

        const analysisEvents = events.filter(e => e.event === 'ai_visibility_analysis_completed');
        const mentionEvents = events.filter(e => e.event === 'ai_mention_detected');
        const recommendationEvents = events.filter(e => e.event.includes('recommendation'));

        return {
            totalAnalyses: analysisEvents.length,
            averageScore: analysisEvents.length > 0 
                ? analysisEvents.reduce((sum, e) => sum + e.properties.overallScore, 0) / analysisEvents.length 
                : 0,
            totalMentions: mentionEvents.length,
            positiveMentions: mentionEvents.filter(e => e.properties.sentiment === 'positive').length,
            totalRecommendations: recommendationEvents.filter(e => e.event === 'ai_visibility_recommendation_generated').length,
            implementedRecommendations: recommendationEvents.filter(e => e.event === 'ai_visibility_recommendation_implemented').length,
            lastAnalysis: analysisEvents.length > 0 
                ? new Date(Math.max(...analysisEvents.map(e => e.timestamp)))
                : null
        };
    }

    /**
     * Get brand integration metrics for a user
     */
    static getBrandIntegrationMetrics(userId: string) {
        const events = analytics.getEvents().filter(e => 
            e.userId === userId && e.event.startsWith('brand_')
        );

        const syncEvents = events.filter(e => e.event.includes('sync_completed'));
        const dashboardEvents = events.filter(e => e.event === 'brand_unified_dashboard_viewed');

        return {
            totalSyncs: syncEvents.length,
            successfulSyncs: syncEvents.filter(e => !e.event.includes('failed')).length,
            dashboardViews: dashboardEvents.length,
            lastSync: syncEvents.length > 0 
                ? new Date(Math.max(...syncEvents.map(e => e.timestamp)))
                : null,
            averageSyncDuration: syncEvents.length > 0
                ? syncEvents.reduce((sum, e) => sum + (e.properties.duration || 0), 0) / syncEvents.length
                : 0
        };
    }

    /**
     * Get feature adoption metrics
     */
    static getFeatureAdoptionMetrics(userId: string) {
        const events = analytics.getEvents().filter(e => e.userId === userId);
        
        const featureUsage = events.reduce((acc, event) => {
            if (event.event === 'feature_used' && event.properties.feature?.includes('ai-visibility')) {
                const feature = event.properties.feature;
                acc[feature] = (acc[feature] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return {
            featuresUsed: Object.keys(featureUsage).length,
            mostUsedFeature: Object.entries(featureUsage).sort(([,a], [,b]) => b - a)[0]?.[0],
            totalFeatureUsage: Object.values(featureUsage).reduce((sum, count) => sum + count, 0),
            featureBreakdown: featureUsage
        };
    }
}

// Export enhanced tracking functions
export {
    trackAIVisibility,
    trackBrandIntegration,
    trackPerformanceCorrelation,
    AIVisibilityAnalyticsAggregator
};