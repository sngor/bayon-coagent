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

/**
 * Find comparable properties within specified radius and time frame
 * Requirements: 5.2 - Valuations use nearby recent comparables (1 mile radius, 6 months)
 */
async function findComparableProperties(
    propertyDescription: string,
    radiusMiles: number = 1,
    monthsBack: number = 6
): Promise<string> {
    const searchClient = getSearchClient();

    try {
        // Calculate date range for comparable sales
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - monthsBack);
        const dateStr = sixMonthsAgo.toISOString().split('T')[0];

        // Search for comparable properties sold within radius and time frame
        const comparableQuery = `${propertyDescription} comparable properties sold within ${radiusMiles} mile radius since ${dateStr} recent sales`;

        const result = await searchClient.search(comparableQuery, {
            maxResults: 10,
            searchDepth: 'advanced',
            includeAnswer: true,
            includeImages: false,
        });

        return searchClient.formatResultsForAI(result.results, true);
    } catch (error) {
        console.warn('Comparable property search failed:', error);
        return `Unable to find comparable properties within ${radiusMiles} mile radius from the last ${monthsBack} months. Please use general market data.`;
    }
}

/**
 * Enhance market trends analysis with detailed market conditions
 * Requirements: 5.2, 5.3 - Enhanced market trends analysis
 */
async function enhanceMarketTrendsAnalysis(propertyDescription: string): Promise<string> {
    const searchClient = getSearchClient();

    try {
        // Extract location from property description
        const location = propertyDescription.includes(',')
            ? propertyDescription.split(',').slice(-2).join(',').trim()
            : propertyDescription;

        // Search for comprehensive market trends
        const trendQueries = [
            `${location} real estate market trends 2024 median price days on market`,
            `${location} housing inventory levels supply demand 2024`,
            `${location} property appreciation rates year over year`,
        ];

        const searchPromises = trendQueries.map(query =>
            searchClient.search(query, {
                maxResults: 5,
                searchDepth: 'advanced',
                includeAnswer: true,
                includeImages: false,
            })
        );

        const searchResults = await Promise.all(searchPromises);
        const allResults = searchResults.flatMap(result => result.results);

        return searchClient.formatResultsForAI(allResults, true);
    } catch (error) {
        console.warn('Market trends analysis failed:', error);
        return 'Unable to retrieve detailed market trends. Please use general market conditions.';
    }
}

/**
 * Calculate confidence level based on data availability
 * Requirements: 5.3 - Add confidence level calculation
 */
function calculateConfidenceLevel(
    comparableData: string,
    marketTrendsData: string
): 'high' | 'medium' | 'low' {
    // Check if we have substantial comparable data
    const hasComparables = comparableData.length > 200 &&
        !comparableData.includes('Unable to find comparable');

    // Check if we have substantial market trends data
    const hasMarketTrends = marketTrendsData.length > 200 &&
        !marketTrendsData.includes('Unable to retrieve');

    // Determine confidence level
    if (hasComparables && hasMarketTrends) {
        return 'high';
    } else if (hasComparables || hasMarketTrends) {
        return 'medium';
    } else {
        return 'low';
    }
}

const propertyValuationFlow = defineFlow(
    {
        name: 'propertyValuationFlow',
        inputSchema: PropertyValuationInputSchema,
        outputSchema: PropertyValuationOutputSchema,
    },
    async (input) => {
        try {
            // Step 1: Find comparable properties (1 mile radius, 6 months)
            // Requirements: 5.2
            const comparableData = await findComparableProperties(input.propertyDescription, 1, 6);

            // Step 2: Enhance market trends analysis
            // Requirements: 5.2, 5.3
            const marketTrendsData = await enhanceMarketTrendsAnalysis(input.propertyDescription);

            // Step 3: Calculate confidence level based on data availability
            // Requirements: 5.3
            const suggestedConfidence = calculateConfidenceLevel(comparableData, marketTrendsData);

            // Combine all search context
            const searchContext = `
COMPARABLE PROPERTIES (within 1 mile, last 6 months):
${comparableData}

MARKET TRENDS ANALYSIS:
${marketTrendsData}

SUGGESTED CONFIDENCE LEVEL: ${suggestedConfidence}
Note: Set confidenceLevel to "${suggestedConfidence}" based on available data quality.
`;

            // Generate property valuation with enhanced search context
            const output = await propertyValuationPrompt({
                propertyDescription: input.propertyDescription,
                searchContext,
            });

            if (!output?.marketValuation?.estimatedValue) {
                throw new Error("Unable to generate property valuation. Please provide more specific property details.");
            }

            // Ensure confidence level is set appropriately
            if (!output.marketValuation.confidenceLevel) {
                output.marketValuation.confidenceLevel = suggestedConfidence;
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