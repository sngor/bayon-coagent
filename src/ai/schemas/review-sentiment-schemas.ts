import { z } from 'zod';

/**
 * Schema for analyzing review sentiment
 */
export const AnalyzeReviewSentimentInputSchema = z.object({
  comment: z.string().describe('The review comment to analyze'),
});

export const AnalyzeReviewSentimentOutputSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral']).describe('The sentiment of the review'),
  summary: z.string().describe('A concise summary of the review'),
});

export type AnalyzeReviewSentimentInput = z.infer<typeof AnalyzeReviewSentimentInputSchema>;
export type AnalyzeReviewSentimentOutput = z.infer<typeof AnalyzeReviewSentimentOutputSchema>;
