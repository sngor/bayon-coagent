import { z } from 'zod';

export const AnalyzePerformanceMetricsInputSchema = z.object({
    metrics: z.object({
        period: z.string(),
        totalViews: z.number(),
        totalShares: z.number(),
        totalInquiries: z.number(),
        conversionRate: z.number().optional(),
        byPlatform: z.record(z.any()),
    }),
    listingDetails: z.object({
        address: z.string().optional(),
        price: z.number().optional(),
    }).optional(),
});

export const AnalyzePerformanceMetricsOutputSchema = z.object({
    analysis: z.string(),
    recommendations: z.array(z.string()),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
});

export type AnalyzePerformanceMetricsInput = z.infer<typeof AnalyzePerformanceMetricsInputSchema>;
export type AnalyzePerformanceMetricsOutput = z.infer<typeof AnalyzePerformanceMetricsOutputSchema>;
