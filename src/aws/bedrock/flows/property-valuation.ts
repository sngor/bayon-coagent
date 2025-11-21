'use server';

/**
 * @fileOverview Bedrock flow for AI-powered property valuation.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
    PropertyValuationInputSchema,
    PropertyValuationOutputSchema,
    type PropertyValuationInput,
    type PropertyValuationOutput,
} from '@/ai/schemas/property-valuation-schemas';

export { type PropertyValuationInput, type PropertyValuationOutput };

const propertyValuationPrompt = definePrompt({
    name: 'propertyValuationPrompt',
    inputSchema: PropertyValuationInputSchema.extend({
        searchContext: z.string().describe('Web search results context for property and market data'),
    }),
    outputSchema: PropertyValuationOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate appraiser and market analyst. Your goal is to provide an AI-powered property valuation based on the property description and current market data.

Property Description: {{{propertyDescription}}}

Market Data and Comparable Sales:
{{{searchContext}}}

Follow these instructions precisely:

1. **Property Analysis**: Analyze the property description to extract key features (bedrooms, bathrooms, square footage, lot size, age, condition, location, special features).

2. **Market Valuation**: Based on the available market data (if any) and your knowledge of real estate markets:
   - Provide an estimated value in USD
   - Give a realistic value range (typically ±10-15% of estimate)
   - Assess confidence level based on data availability and market conditions

3. **Comparable Properties**: If available from search results, extract 3-5 comparable properties. If no search data is available, provide typical comparable properties for the area and property type.

4. **Key Factors**: Identify the most important factors affecting the property's value (location, size, condition, market trends, etc.).

5. **Market Analysis**: Provide insights about the local market conditions, trends, and factors affecting property values in the area.

6. **Recommendations**: Offer actionable advice for property owners or potential buyers.

7. **Disclaimer**: Include an appropriate disclaimer about AI valuations not replacing professional appraisals.

Important Guidelines:
- If market data is available, base estimates on actual search results
- If no market data is available, use general market knowledge and be conservative
- Be realistic and conservative in valuations
- Consider typical market conditions for the area
- Account for property condition and unique features
- Provide confidence levels based on available data quality
- If using general knowledge instead of specific market data, set confidence to "low" or "medium"

Return a JSON response with all required fields as specified in the schema.`,
});

const propertyValuationFlow = defineFlow(
    {
        name: 'propertyValuationFlow',
        inputSchema: PropertyValuationInputSchema,
        outputSchema: PropertyValuationOutputSchema,
    },
    async (input) => {
        // Perform web search for property and market data
        const searchClient = getSearchClient();

        try {
            // For now, use a fallback approach without web search to test Bedrock functionality
            let searchContext = "No recent market data available. Please provide a general valuation based on the property description and typical market conditions.";

            try {
                // Create search queries for property valuation
                const searchQueries = [
                    `${input.propertyDescription} property value estimate recent sales`,
                    `${input.propertyDescription} comparable properties sold 2024`,
                    `real estate market trends ${input.propertyDescription.includes(',') ? input.propertyDescription.split(',').slice(-2).join(',') : input.propertyDescription}`,
                ];

                // Perform multiple searches to gather comprehensive data
                const searchPromises = searchQueries.map(query =>
                    searchClient.search(query, {
                        maxResults: 5,
                        searchDepth: 'advanced',
                        includeAnswer: true,
                        includeImages: false,
                    })
                );

                const searchResults = await Promise.all(searchPromises);

                // Combine and format all search results
                const allResults = searchResults.flatMap(result => result.results);
                searchContext = searchClient.formatResultsForAI(allResults, true);
            } catch (searchError) {
                console.warn('Search failed, using fallback approach:', searchError);
                // Continue with fallback searchContext
            }

            // Generate property valuation with search context
            const output = await propertyValuationPrompt({
                propertyDescription: input.propertyDescription,
                searchContext,
            });

            if (!output?.estimatedValue) {
                throw new Error("Unable to generate property valuation. Please provide more specific property details.");
            }

            return output;
        } catch (error) {
            console.error('Property valuation error:', error);

            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    throw new Error("Property valuation service is not configured. Please contact support.");
                }
                if (error.message.includes('search')) {
                    throw new Error("Unable to search for market data. Please try again later.");
                }
                if (error.message.includes('bedrock') || error.message.includes('claude')) {
                    throw new Error("AI service is temporarily unavailable. Please try again later.");
                }
                // Return the original error message for debugging
                throw new Error(`Property valuation failed: ${error.message}`);
            }
            throw new Error("An unexpected error occurred during property valuation.");
        }
    }
);

export async function runPropertyValuation(
    input: PropertyValuationInput
): Promise<PropertyValuationOutput> {
    return propertyValuationFlow.execute(input);
}