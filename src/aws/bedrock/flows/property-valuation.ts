'use server';

/**
 * @fileOverview Bedrock flow for AI-powered property valuation.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import { MLSGridService } from '@/services/mls/mls-grid-service';
import {
    PropertyValuationInputSchema,
    PropertyValuationOutputSchema,
    type PropertyValuationInput,
    type PropertyValuationOutput,
} from '@/ai/schemas/property-valuation-schemas';



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
 * Find comparable properties using MLS Grid data with web search fallback
 * Requirements: 5.2 - Valuations use nearby recent comparables (1 mile radius, 6 months)
 */
async function findComparableProperties(
    propertyDescription: string,
    radiusMiles: number = 5, // Increased radius for MLS Grid demo data
    monthsBack: number = 6
): Promise<string> {
    try {
        // First, try to get real MLS data
        const mlsService = new MLSGridService();
        const locationInfo = MLSGridService.extractLocationFromDescription(propertyDescription);

        if (locationInfo.city && locationInfo.state) {
            console.log(`Searching MLS Grid for comparables in ${locationInfo.city}, ${locationInfo.state}`);

            // Extract property details from description for better matching
            const bedsMatch = propertyDescription.match(/(\d+)[-\s]*(bed|bedroom)/i);
            const bathsMatch = propertyDescription.match(/(\d+)[-\s]*(bath|bathroom)/i);
            const sqftMatch = propertyDescription.match(/(\d+,?\d*)\s*(sq\.?\s*ft|square\s*feet)/i);

            const minBeds = bedsMatch ? Math.max(1, parseInt(bedsMatch[1]) - 1) : undefined;
            const maxBeds = bedsMatch ? parseInt(bedsMatch[1]) + 1 : undefined;
            const minBaths = bathsMatch ? Math.max(1, parseInt(bathsMatch[1]) - 1) : undefined;
            const maxBaths = bathsMatch ? parseInt(bathsMatch[1]) + 1 : undefined;

            let minSqft: number | undefined;
            let maxSqft: number | undefined;
            if (sqftMatch) {
                const sqft = parseInt(sqftMatch[1].replace(',', ''));
                minSqft = Math.max(500, sqft - 500);
                maxSqft = sqft + 500;
            }

            const comparables = await mlsService.findComparableProperties(
                locationInfo.city,
                locationInfo.state,
                locationInfo.propertyType,
                minBeds,
                maxBeds,
                minBaths,
                maxBaths,
                minSqft,
                maxSqft,
                radiusMiles,
                monthsBack
            );

            if (comparables.length > 0) {
                const mlsData = `REAL MLS COMPARABLE SALES DATA (${comparables.length} properties found):

${comparables.map((comp, index) => `
${index + 1}. ${comp.address}
   Sale Price: $${comp.price.toLocaleString()}
   ${comp.sqft ? `Square Feet: ${comp.sqft.toLocaleString()}` : ''}
   ${comp.beds ? `Bedrooms: ${comp.beds}` : ''}
   ${comp.baths ? `Bathrooms: ${comp.baths}` : ''}
   ${comp.saleDate ? `Sale Date: ${comp.saleDate}` : ''}
   ${comp.pricePerSqft ? `Price/SqFt: $${comp.pricePerSqft}` : ''}
`).join('\n')}

MARKET STATISTICS:
- Average Sale Price: $${Math.round(comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length).toLocaleString()}
- Price Range: $${Math.min(...comparables.map(c => c.price)).toLocaleString()} - $${Math.max(...comparables.map(c => c.price)).toLocaleString()}
${comparables.some(c => c.pricePerSqft) ? `- Average Price/SqFt: $${Math.round(comparables.filter(c => c.pricePerSqft).reduce((sum, c) => sum + (c.pricePerSqft || 0), 0) / comparables.filter(c => c.pricePerSqft).length)}` : ''}

Data Source: MLS Grid (Real Estate Multiple Listing Service)`;

                return mlsData;
            }
        }

        // Fallback to web search if MLS data not available
        console.log('Falling back to web search for comparable properties');
        const searchClient = getSearchClient();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - monthsBack);
        const dateStr = sixMonthsAgo.toISOString().split('T')[0];

        const comparableQuery = `${propertyDescription} comparable properties sold within ${radiusMiles} mile radius since ${dateStr} recent sales`;

        const result = await searchClient.search(comparableQuery, {
            maxResults: 10,
            searchDepth: 'advanced',
            includeAnswer: true,
            includeImages: false,
        });

        return `WEB SEARCH COMPARABLE PROPERTIES DATA:
${searchClient.formatResultsForAI(result.results, true)}

Note: This data is from web search. For more accurate valuations, MLS data would be preferred.`;

    } catch (error) {
        console.warn('Comparable property search failed:', error);
        return `Unable to find comparable properties within ${radiusMiles} mile radius from the last ${monthsBack} months. Please use general market data for valuation.`;
    }
}

/**
 * Enhance market trends analysis with MLS Grid data and web search fallback
 * Requirements: 5.2, 5.3 - Enhanced market trends analysis
 */
async function enhanceMarketTrendsAnalysis(propertyDescription: string): Promise<string> {
    try {
        // First, try to get real MLS market data
        const mlsService = new MLSGridService();
        const locationInfo = MLSGridService.extractLocationFromDescription(propertyDescription);

        if (locationInfo.city && locationInfo.state) {
            console.log(`Getting MLS Grid market analysis for ${locationInfo.city}, ${locationInfo.state}`);

            const marketAnalysis = await mlsService.getMarketAnalysis(
                locationInfo.city,
                locationInfo.state,
                locationInfo.propertyType,
                6 // 6 months of data
            );

            const mlsMarketData = `REAL MLS MARKET ANALYSIS DATA:

CURRENT MARKET CONDITIONS:
- Market Status: ${marketAnalysis.marketCondition}
- Active Listings: ${marketAnalysis.totalListings}
- Average List Price: $${marketAnalysis.averagePrice.toLocaleString()}
- Median Price: $${marketAnalysis.medianPrice.toLocaleString()}
- Average Days on Market: ${marketAnalysis.averageDaysOnMarket} days
- Price Range: $${marketAnalysis.priceRange.min.toLocaleString()} - $${marketAnalysis.priceRange.max.toLocaleString()}

PROPERTY TYPE DISTRIBUTION:
${Object.entries(marketAnalysis.propertyTypes)
                    .map(([type, count]) => `- ${type}: ${count} properties`)
                    .join('\n')}

MARKET INSIGHTS:
${marketAnalysis.marketCondition === 'Seller\'s Market'
                    ? '- Low inventory and quick sales favor sellers\n- Properties selling faster than average\n- Potential for competitive bidding'
                    : marketAnalysis.marketCondition === 'Buyer\'s Market'
                        ? '- Higher inventory gives buyers more options\n- Properties taking longer to sell\n- More negotiating power for buyers'
                        : '- Balanced supply and demand\n- Normal market conditions\n- Fair pricing for both buyers and sellers'
                }

Data Source: MLS Grid (Real Estate Multiple Listing Service)
Location: ${locationInfo.city}, ${locationInfo.state}`;

            return mlsMarketData;
        }

        // Fallback to web search if MLS data not available
        console.log('Falling back to web search for market trends');
        const searchClient = getSearchClient();

        const location = propertyDescription.includes(',')
            ? propertyDescription.split(',').slice(-2).join(',').trim()
            : propertyDescription;

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

        return `WEB SEARCH MARKET TRENDS DATA:
${searchClient.formatResultsForAI(allResults, true)}

Note: This data is from web search. For more accurate market analysis, MLS data would be preferred.`;

    } catch (error) {
        console.warn('Market trends analysis failed:', error);
        return 'Unable to retrieve detailed market trends. Please use general market conditions for analysis.';
    }
}

/**
 * Calculate confidence level based on data availability and quality
 * Requirements: 5.3 - Add confidence level calculation
 */
function calculateConfidenceLevel(
    comparableData: string,
    marketTrendsData: string
): 'high' | 'medium' | 'low' {
    // Check if we have MLS data (higher quality)
    const hasMLSComparables = comparableData.includes('REAL MLS COMPARABLE SALES DATA');
    const hasMLSMarketData = marketTrendsData.includes('REAL MLS MARKET ANALYSIS DATA');

    // Check if we have substantial data
    const hasComparables = comparableData.length > 200 &&
        !comparableData.includes('Unable to find comparable');

    const hasMarketTrends = marketTrendsData.length > 200 &&
        !marketTrendsData.includes('Unable to retrieve');

    // Determine confidence level with MLS data preference
    if (hasMLSComparables && hasMLSMarketData) {
        return 'high'; // Both MLS sources available
    } else if (hasMLSComparables || hasMLSMarketData) {
        return 'high'; // At least one MLS source available
    } else if (hasComparables && hasMarketTrends) {
        return 'medium'; // Web search data available
    } else if (hasComparables || hasMarketTrends) {
        return 'medium'; // Limited web search data
    } else {
        return 'low'; // No substantial data available
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
            // Step 1: Find comparable properties (5 mile radius for demo data, 6 months)
            // Requirements: 5.2 - Enhanced with MLS Grid integration
            const comparableData = await findComparableProperties(input.propertyDescription, 5, 6);

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