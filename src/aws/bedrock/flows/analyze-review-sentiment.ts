'use server';

/**
 * @fileOverview Bedrock flow for analyzing the sentiment of a client review.
 */

import { defineFlow, definePrompt } from '../flow-base';
import {
  AnalyzeReviewSentimentInputSchema,
  AnalyzeReviewSentimentOutputSchema,
  type AnalyzeReviewSentimentInput,
  type AnalyzeReviewSentimentOutput,
} from '@/ai/schemas/review-sentiment-schemas';

export { type AnalyzeReviewSentimentInput, type AnalyzeReviewSentimentOutput };

const prompt = definePrompt({
  name: 'analyzeReviewSentimentPrompt',
  inputSchema: AnalyzeReviewSentimentInputSchema,
  outputSchema: AnalyzeReviewSentimentOutputSchema,
  prompt: `You are an expert sentiment analyst specializing in the real estate industry.

Your task is to analyze the following client review. Determine if the overall sentiment is Positive, Negative, or Neutral.
Then, provide a concise, one-sentence summary that captures the main points of the review.

Review Comment:
"{{{comment}}}"

Return a JSON response with two fields:
- "sentiment": One of "Positive", "Negative", or "Neutral"
- "summary": A one-sentence summary of the review`,
});

const analyzeReviewSentimentFlow = defineFlow(
  {
    name: 'analyzeReviewSentimentFlow',
    inputSchema: AnalyzeReviewSentimentInputSchema,
    outputSchema: AnalyzeReviewSentimentOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.sentiment || !output?.summary) {
      throw new Error("The AI returned an unexpected response format. Please try again.");
    }
    return output;
  }
);

export async function analyzeReviewSentiment(
  input: AnalyzeReviewSentimentInput
): Promise<AnalyzeReviewSentimentOutput> {
  return analyzeReviewSentimentFlow.execute(input);
}
