/**
 * AEO (Answer Engine Optimization) Zod Schemas
 * 
 * Input/output validation schemas for AEO AI flows
 */

import { z } from 'zod';

// ==================== Input Schemas ====================

/**
 * AEO Analysis Input Schema
 */
export const aeoAnalysisInputSchema = z.object({
    userId: z.string(),
    agentName: z.string(),
    businessName: z.string().optional(),
    website: z.string().url().optional(),
    location: z.string().optional(),
    googleBusinessProfileUrl: z.string().url().optional(),
    socialMediaUrls: z.array(z.string().url()).optional(),
    reviewCount: z.number().optional(),
    averageRating: z.number().min(0).max(5).optional(),
    hasSchemaMarkup: z.boolean().optional(),
    napConsistency: z.number().min(0).max(100).optional(),
});

export type AEOAnalysisInput = z.infer<typeof aeoAnalysisInputSchema>;

/**
 * AI Search Monitoring Input Schema
 */
export const aiSearchMonitoringInputSchema = z.object({
    userId: z.string(),
    agentName: z.string(),
    location: z.string(),
    queries: z.array(z.string()).optional(),
});

export type AISearchMonitoringInput = z.infer<typeof aiSearchMonitoringInputSchema>;

/**
 * AEO Content Optimization Input Schema
 */
export const aeoContentOptimizationInputSchema = z.object({
    content: z.string(),
    contentType: z.enum(['blog_post', 'social_media', 'listing_description', 'bio', 'faq']),
    targetKeywords: z.array(z.string()).optional(),
    location: z.string().optional(),
    agentName: z.string().optional(),
});

export type AEOContentOptimizationInput = z.infer<typeof aeoContentOptimizationInputSchema>;

// ==================== Output Schemas ====================

/**
 * AEO Score Breakdown Schema
 */
export const aeoScoreBreakdownSchema = z.object({
    schemaMarkup: z.number().min(0).max(20),
    googleBusinessProfile: z.number().min(0).max(20),
    reviewsAndRatings: z.number().min(0).max(15),
    socialMediaPresence: z.number().min(0).max(10),
    contentFreshness: z.number().min(0).max(10),
    napConsistency: z.number().min(0).max(10),
    backlinkQuality: z.number().min(0).max(10),
    faqContent: z.number().min(0).max(5),
});

export type AEOScoreBreakdown = z.infer<typeof aeoScoreBreakdownSchema>;

/**
 * AEO Score Schema
 */
export const aeoScoreSchema = z.object({
    userId: z.string(),
    score: z.number().min(0).max(100),
    timestamp: z.string(),
    breakdown: aeoScoreBreakdownSchema,
    trend: z.enum(['up', 'down', 'stable']).optional(),
    previousScore: z.number().min(0).max(100).optional(),
});

export type AEOScore = z.infer<typeof aeoScoreSchema>;

/**
 * AEO Insight Schema
 */
export const aeoInsightSchema = z.object({
    type: z.enum(['strength', 'weakness', 'opportunity', 'threat']),
    category: z.string(),
    message: z.string(),
    details: z.string().optional(),
});

export type AEOInsight = z.infer<typeof aeoInsightSchema>;

/**
 * AEO Recommendation Schema
 */
export const aeoRecommendationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    category: z.enum([
        'technical_seo',
        'content',
        'reviews',
        'social_proof',
        'authority',
        'local_seo',
        'structured_data',
    ]),
    priority: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    impact: z.number().min(0).max(20),
    effort: z.enum(['easy', 'moderate', 'difficult']),
    actionItems: z.array(z.string()),
    status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
});

export type AEORecommendation = z.infer<typeof aeoRecommendationSchema>;

/**
 * AEO Analysis Result Schema
 */
export const aeoAnalysisResultSchema = z.object({
    score: aeoScoreSchema,
    recommendations: z.array(aeoRecommendationSchema),
    insights: z.array(aeoInsightSchema),
    competitivePosition: z.string().optional(),
});

export type AEOAnalysisResult = z.infer<typeof aeoAnalysisResultSchema>;

/**
 * AI Mention Schema
 */
export const aeoMentionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    source: z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'bing_copilot', 'other']),
    query: z.string(),
    context: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    position: z.number().optional(),
    competingAgents: z.array(z.string()).optional(),
    timestamp: z.string(),
    url: z.string().optional(),
});

export type AEOMention = z.infer<typeof aeoMentionSchema>;

/**
 * AI Search Summary Schema
 */
export const aiSearchSummarySchema = z.object({
    totalQueries: z.number(),
    mentionCount: z.number(),
    mentionRate: z.number().min(0).max(100),
    averagePosition: z.number().optional(),
    sentimentBreakdown: z.object({
        positive: z.number(),
        neutral: z.number(),
        negative: z.number(),
    }),
    topCompetitors: z.array(z.string()),
});

export type AISearchSummary = z.infer<typeof aiSearchSummarySchema>;

/**
 * AI Search Monitoring Result Schema
 */
export const aiSearchMonitoringResultSchema = z.object({
    mentions: z.array(aeoMentionSchema),
    summary: aiSearchSummarySchema,
    timestamp: z.string(),
});

export type AISearchMonitoringResult = z.infer<typeof aiSearchMonitoringResultSchema>;

/**
 * AEO Content Optimization Result Schema
 */
export const aeoContentOptimizationResultSchema = z.object({
    originalContent: z.string(),
    optimizedContent: z.string(),
    aeoScore: z.number().min(0).max(100),
    improvements: z.array(z.string()),
    suggestions: z.array(z.string()),
    keywordDensity: z.record(z.number()).optional(),
});

export type AEOContentOptimizationResult = z.infer<typeof aeoContentOptimizationResultSchema>;

/**
 * Competitor AEO Score Schema
 */
export const aeoCompetitorScoreSchema = z.object({
    competitorId: z.string(),
    competitorName: z.string(),
    score: z.number().min(0).max(100),
    breakdown: aeoScoreBreakdownSchema.optional(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
});

export type AEOCompetitorScore = z.infer<typeof aeoCompetitorScoreSchema>;

/**
 * AEO Competitor Comparison Schema
 */
export const aeoCompetitorComparisonSchema = z.object({
    userId: z.string(),
    userScore: z.number().min(0).max(100),
    competitors: z.array(aeoCompetitorScoreSchema),
    ranking: z.number(),
    insights: z.array(z.string()),
    timestamp: z.string(),
});

export type AEOCompetitorComparison = z.infer<typeof aeoCompetitorComparisonSchema>;

// ==================== Schema Markup Schemas ====================

/**
 * Local Business Schema
 */
export const localBusinessSchemaSchema = z.object({
    '@context': z.literal('https://schema.org'),
    '@type': z.enum(['RealEstateAgent', 'LocalBusiness']),
    name: z.string(),
    image: z.string().optional(),
    '@id': z.string().optional(),
    url: z.string().optional(),
    telephone: z.string().optional(),
    address: z.object({
        '@type': z.literal('PostalAddress'),
        streetAddress: z.string().optional(),
        addressLocality: z.string().optional(),
        addressRegion: z.string().optional(),
        postalCode: z.string().optional(),
        addressCountry: z.string().optional(),
    }).optional(),
    geo: z.object({
        '@type': z.literal('GeoCoordinates'),
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
    openingHoursSpecification: z.array(z.object({
        '@type': z.literal('OpeningHoursSpecification'),
        dayOfWeek: z.array(z.string()),
        opens: z.string(),
        closes: z.string(),
    })).optional(),
    priceRange: z.string().optional(),
    aggregateRating: z.object({
        '@type': z.literal('AggregateRating'),
        ratingValue: z.number(),
        reviewCount: z.number(),
    }).optional(),
});

export type LocalBusinessSchema = z.infer<typeof localBusinessSchemaSchema>;

/**
 * Person Schema
 */
export const personSchemaSchema = z.object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('Person'),
    name: z.string(),
    jobTitle: z.string().optional(),
    worksFor: z.object({
        '@type': z.literal('Organization'),
        name: z.string(),
    }).optional(),
    url: z.string().optional(),
    image: z.string().optional(),
    sameAs: z.array(z.string()).optional(),
    telephone: z.string().optional(),
    email: z.string().optional(),
    address: z.object({
        '@type': z.literal('PostalAddress'),
        addressLocality: z.string().optional(),
        addressRegion: z.string().optional(),
    }).optional(),
});

export type PersonSchema = z.infer<typeof personSchemaSchema>;

/**
 * FAQ Page Schema
 */
export const faqPageSchemaSchema = z.object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('FAQPage'),
    mainEntity: z.array(z.object({
        '@type': z.literal('Question'),
        name: z.string(),
        acceptedAnswer: z.object({
            '@type': z.literal('Answer'),
            text: z.string(),
        }),
    })),
});

export type FAQPageSchema = z.infer<typeof faqPageSchemaSchema>;
