'use server';

/**
 * @fileOverview Bedrock flow for calculating AI visibility scores.
 * 
 * This flow calculates a comprehensive visibility score (0-100) based on:
 * - Mention frequency (how often the agent appears)
 * - Sentiment distribution (positive vs negative mentions)
 * - Prominence (how prominently featured in responses)
 * - Platform diversity (presence across multiple AI platforms)
 * 
 * It also determines trend direction by comparing to previous period.
 * 
 * Requirements: 1.2, 1.3, 5.2
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    CalculateVisibilityScoreInputSchema,
    CalculateVisibilityScoreOutputSchema,
    type CalculateVisibilityScoreInput,
    type CalculateVisibilityScoreOutput,
} from '@/ai/schemas/ai-monitoring-schemas';

const prompt = definePrompt({
    name: 'calculateVisibilityScorePrompt',
    inputSchema: CalculateVisibilityScoreInputSchema,
    outputSchema: CalculateVisibilityScoreOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert data analyst specializing in AI search visibility metrics for real estate professionals.

Your task is to calculate a comprehensive visibility score (0-100) based on AI search mentions.

Time Range: {{{timeRange}}} days
Previous Score: {{{previousScore}}}

Mentions Data:
{{{json mentions}}}

Calculate the visibility score using these components:

1. **Mention Frequency Score** (0-25 points)
   - Based on the number of mentions in the time period
   - More mentions = higher score
   - Consider the time range when evaluating frequency
   - Scale: 0 mentions = 0, 1-2 = 5-10, 3-5 = 11-17, 6-10 = 18-22, 11+ = 23-25

2. **Sentiment Score** (0-35 points)
   - Based on the distribution of positive, neutral, and negative mentions
   - Positive mentions add points, negative mentions subtract
   - Formula: (positive * 1.0 + neutral * 0.5 - negative * 0.5) / total * 35
   - All positive = 35, mixed = 15-25, mostly negative = 0-10

3. **Prominence Score** (0-25 points)
   - Based on how prominently the agent is featured
   - High prominence = 3 points, Medium = 2 points, Low = 1 point per mention
   - Average prominence across all mentions, scaled to 25 points
   - Formula: (sum of prominence points / (total mentions * 3)) * 25

4. **Platform Diversity Score** (0-15 points)
   - Based on presence across multiple AI platforms
   - 1 platform = 5, 2 platforms = 10, 3 platforms = 13, 4 platforms = 15
   - Rewards agents who appear across multiple AI systems

**Total Score**: Sum of all four components (0-100)

**Trend Calculation**:
- Compare current score to previous score (if provided)
- "up": Current score is 5+ points higher than previous
- "down": Current score is 5+ points lower than previous
- "stable": Within 5 points of previous score
- If no previous score, trend is "stable"

**Trend Percentage**: ((current - previous) / previous) * 100

Return your calculation as a JSON object with these exact fields:
- score (number 0-100)
- breakdown (object with mentionFrequency, sentimentScore, prominenceScore, platformDiversity)
- trend ("up", "down", or "stable")
- trendPercentage (number, can be negative)

Be precise in your calculations and show your work in the component scores.`,
});

const calculateVisibilityScoreFlow = defineFlow(
    {
        name: 'calculateVisibilityScoreFlow',
        inputSchema: CalculateVisibilityScoreInputSchema,
        outputSchema: CalculateVisibilityScoreOutputSchema,
    },
    async (input) => {
        try {
            const output = await prompt(input);

            // Validate that all required fields are present
            if (output?.score === undefined || !output?.breakdown || !output?.trend || output?.trendPercentage === undefined) {
                throw new Error("The AI returned an incomplete response. Please try again.");
            }

            // Validate and clamp score to valid range
            if (output.score < 0) {
                console.warn(`[calculateVisibilityScore] Score below 0 (${output.score}), clamping to 0`);
                output.score = 0;
            } else if (output.score > 100) {
                console.warn(`[calculateVisibilityScore] Score above 100 (${output.score}), clamping to 100`);
                output.score = 100;
            }

            // Validate breakdown components exist and are within valid ranges
            if (output.breakdown.mentionFrequency === undefined ||
                output.breakdown.sentimentScore === undefined ||
                output.breakdown.prominenceScore === undefined ||
                output.breakdown.platformDiversity === undefined) {
                throw new Error("Incomplete breakdown components in the response.");
            }

            // Clamp breakdown components to valid ranges
            output.breakdown.mentionFrequency = Math.max(0, Math.min(25, output.breakdown.mentionFrequency));
            output.breakdown.sentimentScore = Math.max(0, Math.min(35, output.breakdown.sentimentScore));
            output.breakdown.prominenceScore = Math.max(0, Math.min(25, output.breakdown.prominenceScore));
            output.breakdown.platformDiversity = Math.max(0, Math.min(15, output.breakdown.platformDiversity));

            // Validate trend is one of the allowed values
            if (!['up', 'down', 'stable'].includes(output.trend)) {
                console.warn(`[calculateVisibilityScore] Invalid trend: ${output.trend}, defaulting to stable`);
                output.trend = 'stable' as 'up' | 'down' | 'stable';
            }

            return output;
        } catch (error) {
            console.error('[calculateVisibilityScore] Error calculating score:', error);

            // Provide fallback response with zero score
            return {
                score: 0,
                breakdown: {
                    mentionFrequency: 0,
                    sentimentScore: 0,
                    prominenceScore: 0,
                    platformDiversity: 0,
                },
                trend: 'stable' as 'up' | 'down' | 'stable',
                trendPercentage: 0,
            };
        }
    }
);

/**
 * Calculates an AI visibility score based on mentions
 * 
 * @param input - Mentions data, time range, and optional previous score
 * @returns Visibility score with breakdown, trend, and trend percentage
 */
export async function calculateVisibilityScore(
    input: CalculateVisibilityScoreInput
): Promise<CalculateVisibilityScoreOutput> {
    return calculateVisibilityScoreFlow.execute(input);
}
