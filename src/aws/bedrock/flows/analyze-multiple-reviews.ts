'use server';

/**
 * @fileOverview Bedrock flow for analyzing the sentiment of multiple client reviews in bulk.
 */

import { defineFlow, definePrompt } from '../flow-base';
import {
  AnalyzeMultipleReviewsInputSchema,
  AnalyzeMultipleReviewsOutputSchema,
  type AnalyzeMultipleReviewsInput,
  type AnalyzeMultipleReviewsOutput,
} from '@/ai/schemas/review-analysis-schemas';

export { type AnalyzeMultipleReviewsInput, type AnalyzeMultipleReviewsOutput };

const prompt = definePrompt({
  name: 'analyzeMultipleReviewsPrompt',
  inputSchema: AnalyzeMultipleReviewsInputSchema,
  outputSchema: AnalyzeMultipleReviewsOutputSchema,
  prompt: `You are a sentiment analysis expert for the real estate industry. Your task is to analyze a batch of client reviews and provide a high-level summary.

Analyze the following reviews:
{{{json comments}}}

Based on all reviews provided, perform the following actions:
1. Determine the overall sentiment. This can be 'Positive' if the majority are good, 'Negative' if the majority are bad, or 'Mixed' if there's a balance.
2. Write a concise one-paragraph summary that captures the main feedback points from all the reviews combined.
3. Identify and extract a list of 5-7 salient keywords (e.g., "market knowledge", "responsive", "negotiation").
4. Identify and extract a list of 3-4 common themes or topics that appear across multiple reviews (e.g., "Communication Style", "Closing Process").

Return a JSON response with fields: "overallSentiment", "summary", "keywords" (array), and "commonThemes" (array).`,
});

const analyzeMultipleReviewsFlow = defineFlow(
  {
    name: 'analyzeMultipleReviewsFlow',
    inputSchema: AnalyzeMultipleReviewsInputSchema,
    outputSchema: AnalyzeMultipleReviewsOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output) {
      throw new Error("The AI returned an unexpected response format. Please try again.");
    }
    return output;
  }
);

export async function analyzeMultipleReviews(
  input: AnalyzeMultipleReviewsInput
): Promise<AnalyzeMultipleReviewsOutput> {
  return analyzeMultipleReviewsFlow.execute(input);
}
