'use server';

/**
 * @fileOverview Bedrock flow for analyzing AI mentions of real estate agents.
 * 
 * This flow analyzes how an agent is mentioned in AI search results, including:
 * - Sentiment analysis (positive, neutral, negative)
 * - Topic extraction (what the agent is known for)
 * - Expertise area identification
 * - Prominence assessment (how prominently featured)
 * 
 * Requirements: 3.1, 3.2, 3.5, 4.1, 4.2
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    AnalyzeAIMentionInputSchema,
    AnalyzeAIMentionOutputSchema,
    type AnalyzeAIMentionInput,
    type AnalyzeAIMentionOutput,
} from '@/ai/schemas/ai-monitoring-schemas';

const prompt = definePrompt({
    name: 'analyzeAIMentionPrompt',
    inputSchema: AnalyzeAIMentionInputSchema,
    outputSchema: AnalyzeAIMentionOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert analyst specializing in AI search visibility and reputation management for real estate professionals.

Your task is to analyze how a real estate agent is mentioned in an AI search result.

Agent Name: {{{agentName}}}
AI Platform: {{{platform}}}
Search Query: {{{query}}}

AI Response:
{{{aiResponse}}}

Analyze this mention and provide:

1. **Sentiment**: Classify as "positive", "neutral", or "negative"
   - Positive: Agent is recommended, praised, or highlighted favorably
   - Neutral: Agent is mentioned factually without strong opinion
   - Negative: Agent is criticized, not recommended, or mentioned unfavorably

2. **Sentiment Reason**: A brief (1-2 sentence) explanation of why you classified it this way

3. **Topics**: Extract 2-5 key topics or themes associated with this mention
   - Examples: "luxury homes", "first-time buyers", "negotiation skills", "local market expertise"

4. **Expertise Areas**: Identify 1-3 specific areas of expertise mentioned
   - Examples: "buyer representation", "seller agent", "investment properties", "luxury real estate"

5. **Context Snippet**: Extract a brief excerpt (1-2 sentences) that contains the agent's mention

6. **Prominence**: Assess how prominently the agent is featured
   - "high": Agent is mentioned in the first paragraph or as a top recommendation
   - "medium": Agent is mentioned in the middle of the response
   - "low": Agent is mentioned briefly or near the end

Return your analysis as a JSON object with these exact fields:
- sentiment
- sentimentReason
- topics (array of strings)
- expertiseAreas (array of strings)
- contextSnippet
- prominence`,
});

const analyzeAIMentionFlow = defineFlow(
    {
        name: 'analyzeAIMentionFlow',
        inputSchema: AnalyzeAIMentionInputSchema,
        outputSchema: AnalyzeAIMentionOutputSchema,
    },
    async (input) => {
        try {
            const output = await prompt(input);

            // Validate that all required fields are present
            if (!output?.sentiment || !output?.sentimentReason || !output?.topics ||
                !output?.expertiseAreas || !output?.contextSnippet || !output?.prominence) {
                throw new Error("The AI returned an incomplete response. Please try again.");
            }

            // Ensure arrays are not empty - provide defaults if needed
            if (output.topics.length === 0) {
                console.warn('[analyzeAIMention] No topics extracted, using default');
                output.topics = ['general real estate'];
            }

            if (output.expertiseAreas.length === 0) {
                console.warn('[analyzeAIMention] No expertise areas identified, using default');
                output.expertiseAreas = ['real estate services'];
            }

            // Validate sentiment is one of the allowed values
            if (!['positive', 'neutral', 'negative'].includes(output.sentiment)) {
                console.warn(`[analyzeAIMention] Invalid sentiment: ${output.sentiment}, defaulting to neutral`);
                output.sentiment = 'neutral' as 'positive' | 'neutral' | 'negative';
            }

            // Validate prominence is one of the allowed values
            if (!['high', 'medium', 'low'].includes(output.prominence)) {
                console.warn(`[analyzeAIMention] Invalid prominence: ${output.prominence}, defaulting to medium`);
                output.prominence = 'medium' as 'high' | 'medium' | 'low';
            }

            return output;
        } catch (error) {
            console.error('[analyzeAIMention] Error analyzing mention:', error);

            // Provide fallback response if analysis fails
            return {
                sentiment: 'neutral' as 'positive' | 'neutral' | 'negative',
                sentimentReason: 'Unable to analyze sentiment due to processing error',
                topics: ['general real estate'],
                expertiseAreas: ['real estate services'],
                contextSnippet: input.aiResponse.substring(0, 200) + '...',
                prominence: 'medium' as 'high' | 'medium' | 'low',
            };
        }
    }
);

/**
 * Analyzes an AI mention of a real estate agent
 * 
 * @param input - The mention details including agent name, AI response, query, and platform
 * @returns Analysis including sentiment, topics, expertise areas, and prominence
 */
export async function analyzeAIMention(
    input: AnalyzeAIMentionInput
): Promise<AnalyzeAIMentionOutput> {
    return analyzeAIMentionFlow.execute(input);
}
