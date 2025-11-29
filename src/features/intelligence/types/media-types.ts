import { z } from 'zod';

/**
 * Media mention types matching common sources
 */
export type MediaType = 'broadcast' | 'press' | 'online' | 'social';

/**
 * Sentiment classification
 */
export type SentimentType = 'positive' | 'neutral' | 'negative';

/**
 * Media mention record schema
 */
export const MediaMentionSchema = z.object({
    id: z.string(),
    userId: z.string(),

    // Content details
    title: z.string(),
    description: z.string().optional(),
    content: z.string().optional(),
    url: z.string().url(),

    // Source information
    source: z.string(),
    author: z.string().optional(),
    mediaType: z.enum(['broadcast', 'press', 'online', 'social']),

    // Metrics
    publishedAt: z.number(), // Unix timestamp
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    sentimentScore: z.number().min(-1).max(1), // -1 to 1
    reach: z.number().optional(), // Estimated audience reach

    // Metadata
    keywords: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),

    // Timestamps
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type MediaMention = z.infer<typeof MediaMentionSchema>;

/**
 * Analytics aggregation data
 */
export const MediaAnalyticsSchema = z.object({
    userId: z.string(),
    period: z.enum(['24h', '7d', '30d', '90d']),

    // Aggregate stats
    totalMentions: z.number(),
    totalReach: z.number(),
    activeSources: z.number(),

    // Sentiment breakdown
    sentimentBreakdown: z.object({
        positive: z.number(),
        neutral: z.number(),
        negative: z.number(),
    }),

    // Sentiment score (average)
    sentimentScore: z.number().min(0).max(100),

    // Type breakdown
    typeBreakdown: z.object({
        broadcast: z.number(),
        press: z.number(),
        online: z.number(),
        social: z.number(),
    }),

    // Timeline data (for charts)
    timeline: z.array(z.object({
        date: z.string(),
        broadcast: z.number(),
        press: z.number(),
        online: z.number(),
        social: z.number(),
    })),

    // Period comparison
    change: z.object({
        mentions: z.number(),
        reach: z.number(),
        sentiment: z.number(),
        sources: z.number(),
    }),

    // Generated timestamp
    generatedAt: z.number(),
});

export type MediaAnalytics = z.infer<typeof MediaAnalyticsSchema>;

/**
 * News article from NewsAPI
 */
export const NewsArticleSchema = z.object({
    source: z.object({
        id: z.string().nullable(),
        name: z.string(),
    }),
    author: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    urlToImage: z.string().nullable(),
    publishedAt: z.string(),
    content: z.string().nullable(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;
