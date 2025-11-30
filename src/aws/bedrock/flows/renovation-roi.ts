'use server';

/**
 * @fileOverview Bedrock flow for AI-powered renovation ROI analysis.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
    RenovationROIInputSchema,
    RenovationROIOutputSchema,
    type RenovationROIInput,
    type RenovationROIOutput,
} from '@/ai/schemas/renovation-roi-schemas';



const renovationROIPrompt = definePrompt({
    name: 'renovationROIPrompt',
    inputSchema: RenovationROIInputSchema.extend({
        searchContext: z.string().describe('Web search results context for renovation ROI data and market trends'),
    }),
    outputSchema: RenovationROIOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate analyst and renovation specialist. Your goal is to provide an AI-powered renovation ROI analysis based on the property details, renovation plans, and current market data.

Property Details:
- Current Value: $\{{{currentValue}}}
- Renovation Type: \{{{renovationType}}}
- Renovation Cost: $\{{{renovationCost}}}
- Location: \{{{location}}}
- Property Type: \{{{propertyType}}}
- Market Condition: \{{{marketCondition}}}
- Additional Details: \{{{additionalDetails}}}

Market Data and Renovation ROI Research:
\{{{searchContext}}}

Analyze the renovation and provide a comprehensive ROI report with the following structure:

1. **roiAnalysis** (required object):
   - currentValue: Current property value (number)
   - renovationCost: Renovation cost (number)
   - estimatedValueIncrease: Expected value increase (number)
   - newPropertyValue: Estimated value after renovation (number)
   - roiPercentage: ROI as percentage (number, calculated as: estimatedValueIncrease / renovationCost * 100)
   - roiCategory: Must be exactly "excellent", "good", "fair", or "poor" (string)
     - excellent: 80%+, good: 60-79%, fair: 40-59%, poor: <40%
   - confidenceLevel: Must be exactly "high", "medium", or "low" (string)

2. **marketAnalysis** (required object):
   - locationImpact: String describing how location affects ROI
   - marketCondition: String describing current market condition
   - demandLevel: String describing demand level for this renovation type
   - regionalFactors: Optional object with any regional market factors

3. **comparableRenovations** (required array):
   - Array of 3-5 comparable renovations
   - Each with: type (string), cost (number), roi (number), location (optional string)

4. **keySuccessFactors** (required array):
   - Array of strings describing key factors influencing ROI success

5. **recommendations** (required):
   - Can be either an array of strings OR an object with:
     - timing: Optional string
     - scopeGuidance: Optional string
     - materialSelections: Optional string
     - budgetAllocation: Optional object with percentage breakdowns

6. **riskFactors** (required array):
   - Array of strings describing potential risks

7. **timeline** (required object):
   - estimatedDuration: String describing renovation duration
   - optimalStartSeason: Optional string for best timing
   - keyTimelineFactors: Optional array of timeline considerations

Important Guidelines:
- Use camelCase for all property names (e.g., "roiPercentage" not "roi_percentage")
- All numbers should be actual numbers, not strings
- roiCategory must be exactly "excellent", "good", "fair", or "poor" (lowercase)
- confidenceLevel must be exactly "high", "medium", or "low" (lowercase)
- Base estimates on actual market data from search results
- Be realistic about ROI expectations
- Return valid JSON matching the exact schema structure

Return a JSON response with all required fields as specified above.`,
});

const renovationROIFlow = defineFlow(
    {
        name: 'renovationROIFlow',
        inputSchema: RenovationROIInputSchema,
        outputSchema: RenovationROIOutputSchema,
    },
    async (input) => {
        // Perform web search for renovation ROI data
        const searchClient = getSearchClient();

        try {
            // Create search queries for renovation ROI analysis
            const locationQuery = input.location ? ` ${input.location}` : '';
            const searchQueries = [
                `${input.renovationType} ROI return on investment${locationQuery} 2024`,
                `${input.renovationType} cost vs value report${locationQuery} home renovation`,
                `${input.propertyType} ${input.renovationType} renovation value added${locationQuery}`,
                `real estate market trends renovation ROI${locationQuery} ${input.marketCondition} market`,
                `${input.renovationType} renovation costs and returns comparable properties${locationQuery}`,
            ];

            // Perform multiple searches to gather comprehensive ROI data
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
            const searchContext = searchClient.formatResultsForAI(allResults, true);

            // Generate renovation ROI analysis with search context
            const output = await renovationROIPrompt({
                currentValue: input.currentValue,
                renovationCost: input.renovationCost,
                renovationType: input.renovationType,
                location: input.location || 'Not specified',
                propertyType: input.propertyType,
                marketCondition: input.marketCondition,
                additionalDetails: input.additionalDetails || 'None provided',
                searchContext,
            });

            if (!output?.roiAnalysis?.newPropertyValue || !output?.roiAnalysis?.roiPercentage) {
                throw new Error("Unable to generate renovation ROI analysis. Please provide more specific renovation details.");
            }

            return output;
        } catch (error) {
            if (error instanceof Error && error.message.includes('API key')) {
                throw new Error("Renovation ROI analysis service is not configured. Please contact support.");
            }
            throw error;
        }
    }
);

export async function runRenovationROIAnalysis(
    input: RenovationROIInput
): Promise<RenovationROIOutput> {
    return renovationROIFlow.execute(input);
}