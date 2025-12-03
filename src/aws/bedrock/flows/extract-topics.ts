'use server';

/**
 * @fileOverview Bedrock flow for extracting and aggregating topics from AI mentions.
 * 
 * This flow analyzes multiple AI mentions to identify the most common topics
 * associated with a real estate agent. It aggregates topics across mentions,
 * counts their frequency, and provides example quotes for each topic.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    ExtractTopicsInputSchema,
    ExtractTopicsOutputSchema,
    type ExtractTopicsInput,
    type ExtractTopicsOutput,
} from '@/ai/schemas/ai-monitoring-schemas';

const prompt = definePrompt({
    name: 'extractTopicsPrompt',
    inputSchema: ExtractTopicsInputSchema,
    outputSchema: ExtractTopicsOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert analyst specializing in topic extraction and aggregation for real estate professionals.

Your task is to analyze multiple AI mentions of a real estate agent and identify the most common topics and themes.

Mentions Data:
{{{json mentions}}}

Analyze these mentions and provide:

1. **Topic Aggregation**: Identify the most common topics across all mentions
   - Consolidate similar topics (e.g., "luxury homes" and "high-end properties" should be one topic)
   - Focus on substantive topics related to expertise, services, or market areas
   - Exclude generic terms like "real estate" or "agent"

2. **Topic Counts**: Count how many mentions contain each topic

3. **Example Quotes**: For each topic, provide 1-3 brief example quotes from the context snippets
   - Keep quotes concise (1-2 sentences max)
   - Choose quotes that best illustrate the topic

Return the top 5-10 most frequent topics, ordered by count (highest first).

Return your analysis as a JSON object with this structure:
{
  "topics": [
    {
      "topic": "luxury real estate",
      "count": 5,
      "examples": ["Known for high-end property sales...", "Specializes in luxury homes..."]
    }
  ]
}`,
});

const extractTopicsFlow = defineFlow(
    {
        name: 'extractTopicsFlow',
        inputSchema: ExtractTopicsInputSchema,
        outputSchema: ExtractTopicsOutputSchema,
    },
    async (input) => {
        // Handle edge case: no mentions provided
        if (!input.mentions || input.mentions.length === 0) {
            return {
                topics: [],
            };
        }

        // Handle edge case: mentions with no topics
        const mentionsWithTopics = input.mentions.filter(
            m => m.topics && m.topics.length > 0
        );

        if (mentionsWithTopics.length === 0) {
            return {
                topics: [],
            };
        }

        const output = await prompt(input);

        // Validate that the output has the expected structure
        if (!output?.topics) {
            throw new Error("The AI returned an incomplete response. Please try again.");
        }

        // Ensure topics are sorted by count (descending)
        const sortedTopics = output.topics.sort((a, b) => b.count - a.count);

        // Limit to top 10 topics
        const topTopics = sortedTopics.slice(0, 10);

        return {
            topics: topTopics,
        };
    }
);

/**
 * Extracts and aggregates topics from multiple AI mentions
 * 
 * @param input - Array of mentions with topics and context snippets
 * @returns Aggregated topics with counts and example quotes
 */
export async function extractTopics(
    input: ExtractTopicsInput
): Promise<ExtractTopicsOutput> {
    return extractTopicsFlow.execute(input);
}
