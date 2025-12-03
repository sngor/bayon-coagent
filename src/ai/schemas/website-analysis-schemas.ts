/**
 * Website Analysis Zod Schemas
 * 
 * Input/output validation schemas for website analysis AI flows
 * Used for AI Engine Optimization (AEO) website auditing
 */

import { z } from 'zod';

// ==================== Input Schemas ====================

/**
 * Website Analysis Input Schema
 */
export const websiteAnalysisInputSchema = z.object({
    userId: z.string(),
    websiteUrl: z.string().url(),
    profileData: z.object({
        name: z.string(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
    }),
});

export type WebsiteAnalysisInput = z.infer<typeof websiteAnalysisInputSchema>;

// ==================== Output Schemas ====================

/**
 * Score Breakdown Schema
 */
export const scoreBreakdownSchema = z.object({
    schemaMarkup: z.number().min(0).max(30),
    metaTags: z.number().min(0).max(25),
    structuredData: z.number().min(0).max(25),
    napConsistency: z.number().min(0).max(20),
});

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

/**
 * Schema Markup Findings Schema
 */
export const schemaMarkupSchema = z.object({
    found: z.boolean(),
    types: z.array(z.string()), // e.g., ["Person", "LocalBusiness"]
    properties: z.record(z.any()), // Extracted schema properties
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
});

export type SchemaMarkup = z.infer<typeof schemaMarkupSchema>;

/**
 * Title Tag Schema
 */
export const titleTagSchema = z.object({
    content: z.string().optional(),
    length: z.number(),
    isOptimal: z.boolean(),
    issues: z.array(z.string()),
});

export type TitleTag = z.infer<typeof titleTagSchema>;

/**
 * Meta Description Schema
 */
export const metaDescriptionSchema = z.object({
    content: z.string().optional(),
    length: z.number(),
    isOptimal: z.boolean(),
    issues: z.array(z.string()),
});

export type MetaDescription = z.infer<typeof metaDescriptionSchema>;

/**
 * Open Graph Tags Schema
 */
export const openGraphSchema = z.object({
    found: z.boolean(),
    properties: z.record(z.string()),
    issues: z.array(z.string()),
});

export type OpenGraph = z.infer<typeof openGraphSchema>;

/**
 * Twitter Card Tags Schema
 */
export const twitterCardSchema = z.object({
    found: z.boolean(),
    properties: z.record(z.string()),
    issues: z.array(z.string()),
});

export type TwitterCard = z.infer<typeof twitterCardSchema>;

/**
 * Meta Tags Analysis Schema
 */
export const metaTagsSchema = z.object({
    title: titleTagSchema,
    description: metaDescriptionSchema,
    openGraph: openGraphSchema,
    twitterCard: twitterCardSchema,
});

export type MetaTags = z.infer<typeof metaTagsSchema>;

/**
 * NAP Component Schema
 */
export const napComponentSchema = z.object({
    found: z.string().optional(),
    matches: z.boolean(),
    confidence: z.number().min(0).max(1),
});

export type NAPComponent = z.infer<typeof napComponentSchema>;

/**
 * NAP Consistency Schema
 */
export const napConsistencySchema = z.object({
    name: napComponentSchema,
    address: napComponentSchema,
    phone: napComponentSchema,
    overallConsistency: z.number().min(0).max(100),
});

export type NAPConsistency = z.infer<typeof napConsistencySchema>;

/**
 * Recommendation Schema
 */
export const recommendationSchema = z.object({
    id: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.enum([
        'schema_markup',
        'meta_tags',
        'structured_data',
        'nap_consistency',
        'technical_seo',
    ]),
    title: z.string(),
    description: z.string(),
    actionItems: z.array(z.string()),
    codeSnippet: z.string().optional(),
    estimatedImpact: z.number().min(0).max(30), // Score improvement
    effort: z.enum(['easy', 'moderate', 'difficult']),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * Website Analysis Result Schema
 */
export const websiteAnalysisResultSchema = z.object({
    id: z.string(),
    userId: z.string(),
    websiteUrl: z.string(),
    analyzedAt: z.string(), // ISO timestamp

    // Overall score
    overallScore: z.number().min(0).max(100),

    // Score breakdown
    scoreBreakdown: scoreBreakdownSchema,

    // Schema markup findings
    schemaMarkup: schemaMarkupSchema,

    // Meta tags analysis
    metaTags: metaTagsSchema,

    // NAP consistency
    napConsistency: napConsistencySchema,

    // Recommendations
    recommendations: z.array(recommendationSchema),

    // Summary
    summary: z.string(),
});

export type WebsiteAnalysisResult = z.infer<typeof websiteAnalysisResultSchema>;

// ==================== Internal Data Schemas ====================

/**
 * Crawled Data Schema
 * Internal schema for data extracted during website crawling
 */
export const crawledDataSchema = z.object({
    homepage: z.string(),
    additionalPages: z.array(z.string()),
    crawledUrls: z.array(z.string()),
});

export type CrawledData = z.infer<typeof crawledDataSchema>;

/**
 * Schema Data Schema
 * Internal schema for extracted schema markup
 */
export const schemaDataSchema = z.object({
    found: z.boolean(),
    types: z.array(z.string()),
    schemas: z.array(z.any()),
});

export type SchemaData = z.infer<typeof schemaDataSchema>;

/**
 * Meta Tag Data Schema
 * Internal schema for extracted meta tags
 */
export const metaTagDataSchema = z.object({
    title: z.object({
        content: z.string(),
        length: z.number(),
    }),
    description: z.object({
        content: z.string().optional(),
        length: z.number(),
    }),
    openGraph: z.record(z.string()),
    twitterCard: z.record(z.string()),
});

export type MetaTagData = z.infer<typeof metaTagDataSchema>;

/**
 * NAP Data Schema
 * Internal schema for extracted NAP data
 */
export const napDataSchema = z.object({
    phones: z.array(z.string()),
    emails: z.array(z.string()),
    addresses: z.array(z.string()),
    names: z.array(z.string()).optional(),
});

export type NAPData = z.infer<typeof napDataSchema>;

// ==================== DynamoDB Schemas ====================

/**
 * Website Analysis DynamoDB Item Schema
 */
export const websiteAnalysisDynamoDBItemSchema = z.object({
    PK: z.string(), // USER#<userId>
    SK: z.string(), // WEBSITE_ANALYSIS#latest or WEBSITE_ANALYSIS#<timestamp>
    EntityType: z.literal('WebsiteAnalysis'),
    Data: websiteAnalysisResultSchema,
    CreatedAt: z.number(),
    UpdatedAt: z.number(),
});

export type WebsiteAnalysisDynamoDBItem = z.infer<typeof websiteAnalysisDynamoDBItemSchema>;

// ==================== Helper Schemas ====================

/**
 * Score Color Schema
 */
export const scoreColorSchema = z.enum(['red', 'yellow', 'green']);

export type ScoreColor = z.infer<typeof scoreColorSchema>;

/**
 * Trend Schema
 */
export const trendSchema = z.enum(['improving', 'declining', 'stable']);

export type Trend = z.infer<typeof trendSchema>;

/**
 * Analysis History Item Schema
 */
export const analysisHistoryItemSchema = z.object({
    id: z.string(),
    analyzedAt: z.string(),
    overallScore: z.number().min(0).max(100),
    scoreBreakdown: scoreBreakdownSchema,
});

export type AnalysisHistoryItem = z.infer<typeof analysisHistoryItemSchema>;
