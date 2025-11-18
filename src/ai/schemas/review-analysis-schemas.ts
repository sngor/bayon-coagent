import { z } from 'zod';

/**
 * Schema for analyzing multiple reviews
 */
export const AnalyzeMultipleReviewsInputSchema = z.object({
  comments: z.array(z.string()).describe('Array of review comments to analyze'),
});

export const AnalyzeMultipleReviewsOutputSchema = z.object({
  overallSentiment: z.enum(['Positive', 'Negative', 'Mixed']).describe('The overall sentiment across all reviews'),
  summary: z.string().describe('A concise summary of all reviews'),
  keywords: z.array(z.string()).describe('List of 5-7 salient keywords from the reviews'),
  commonThemes: z.array(z.string()).describe('List of 3-4 common themes across reviews'),
});

export type AnalyzeMultipleReviewsInput = z.infer<typeof AnalyzeMultipleReviewsInputSchema>;
export type AnalyzeMultipleReviewsOutput = z.infer<typeof AnalyzeMultipleReviewsOutputSchema>;
