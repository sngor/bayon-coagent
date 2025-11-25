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

Analyze the property and provide a comprehensive valuation report with the following structure:

1. **propertyAnalysis** (optional object):
   - address: The property address if identifiable
   - features: Object containing bedrooms, bathrooms, squareFootage, lotSize, yearBuilt, propertyType, specialFeatures array

2. **marketValuation** (required object):
   - estimatedValue: Estimated property value in USD (number)
   - valueRange: Object with low and high bounds (numbers)
   - confidenceLevel: Must be exactly "high", "medium", or "low" (string)
   - lastSaleInfo: Optional object with date and price

3. **comparableProperties** (required array):
   - Array of 3-5 comparable properties
   - Each with: address (string), price (number), sqft (optional number), beds (optional number), baths (optional number), saleDate (optional string)

4. **keyFactors** (required array):
   - Array of strings describing key factors influencing the valuation

5. **marketAnalysis** (required object):
   - marketCondition: String describing current market (e.g., "Seller's Market", "Buyer's Market", "Balanced")
   - medianPrice: Optional number for area median price
   - averageDaysOnMarket: Optional number
   - marketTrends: Array of strings describing market trends

6. **recommendations** (required array):
   - Array of actionable recommendations for property owners or buyers

7. **disclaimer** (required string):
   - Disclaimer about AI valuations not replacing professional appraisals

Important Guidelines:
- Use camelCase for all property names (e.g., "estimatedValue" not "estimated_value")
- confidenceLevel must be exactly "high", "medium", or "low" (lowercase)
- All numbers should be actual numbers, not strings
- If market data is limited, set confidenceLevel to "low" or "medium"
- Be realistic and conservative in valuations
- Return valid JSON matching the exact schema structure

Return a JSON response with all required fields as specified above.`,
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

            if (!output?.marketValuation?.estimatedValue) {
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