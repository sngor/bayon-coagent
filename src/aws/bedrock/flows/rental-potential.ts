'use server';

/**
 * @fileOverview Bedrock flow for AI-powered rental potential analysis.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
    RentalPotentialInputSchema,
    RentalPotentialOutputSchema,
    type RentalPotentialInput,
    type RentalPotentialOutput,
} from '@/ai/schemas/rental-potential-schemas';

export { type RentalPotentialInput, type RentalPotentialOutput };

const rentalPotentialPrompt = definePrompt({
    name: 'rentalPotentialPrompt',
    inputSchema: RentalPotentialInputSchema.extend({
        searchContext: z.string().describe('Web search results context for rental market data'),
    }),
    outputSchema: RentalPotentialOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate investment analyst specializing in rental properties. Your goal is to provide an AI-powered rental potential analysis for both long-term and short-term (Airbnb/VRBO) rentals based on the property description and current market data.

Property Description: {{{propertyDescription}}}

Market Data and Comparable Rentals:
{{{searchContext}}}

Analyze the property and provide a comprehensive rental potential report with the following structure:

1. **longTermRental** (required object):
   - estimatedMonthlyRent: Estimated monthly rent in USD (number)
   - rentRange: Object with low and high bounds (numbers)
   - confidenceLevel: "high", "medium", or "low"
   - demandLevel: "high", "medium", or "low"

2. **shortTermRental** (required object):
   - estimatedDailyRate: Estimated daily rate in USD (number)
   - estimatedOccupancyRate: Estimated occupancy rate as a percentage (0-100) (number)
   - estimatedMonthlyRevenue: Estimated average monthly revenue (number)
   - revenueRange: Object with low and high bounds (numbers)
   - seasonality: String describing seasonal trends (e.g., "High demand in summer, lower in winter")
   - confidenceLevel: "high", "medium", or "low"

3. **comparableRentals** (required array):
   - Array of 3-5 comparable rental properties
   - Each with: address (string), price (number), type ("long-term" or "short-term"), beds (optional number), baths (optional number), distance (optional string)

4. **marketAnalysis** (required object):
   - rentalMarketCondition: String describing current rental market
   - averageDaysOnMarket: Optional number
   - vacancyRate: Optional number (percentage)
   - trends: Array of strings describing rental market trends

5. **disclaimer** (required string):
   - Disclaimer about AI estimates not guaranteeing actual rental income

Important Guidelines:
- Use camelCase for all property names
- All numbers should be actual numbers, not strings
- Be realistic and conservative in estimates
- Return valid JSON matching the exact schema structure

Return a JSON response with all required fields as specified above.`,
});

/**
 * Find comparable rentals and market data
 */
async function findRentalMarketData(propertyDescription: string): Promise<string> {
    const searchClient = getSearchClient();

    try {
        // Extract location
        const location = propertyDescription.includes(',')
            ? propertyDescription.split(',').slice(-2).join(',').trim()
            : propertyDescription;

        const queries = [
            `${propertyDescription} long term rental rates comparable properties`,
            `${propertyDescription} airbnb vrbo short term rental rates occupancy`,
            `${location} rental market trends vacancy rates 2024`,
        ];

        const searchPromises = queries.map(query =>
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
        console.warn('Rental market search failed:', error);
        return 'Unable to retrieve detailed rental market data. Please use general market assumptions.';
    }
}

const rentalPotentialFlow = defineFlow(
    {
        name: 'rentalPotentialFlow',
        inputSchema: RentalPotentialInputSchema,
        outputSchema: RentalPotentialOutputSchema,
    },
    async (input) => {
        try {
            // Step 1: Find rental market data
            const searchContext = await findRentalMarketData(input.propertyDescription);

            // Step 2: Generate rental potential analysis
            const output = await rentalPotentialPrompt({
                propertyDescription: input.propertyDescription,
                searchContext,
            });

            return output;
        } catch (error) {
            console.error('Rental potential analysis error:', error);
            throw new Error("An unexpected error occurred during rental potential analysis.");
        }
    }
);

export async function runRentalPotentialAnalysis(
    input: RentalPotentialInput
): Promise<RentalPotentialOutput> {
    return rentalPotentialFlow.execute(input);
}
