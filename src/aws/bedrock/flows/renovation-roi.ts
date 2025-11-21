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

export { type RenovationROIInput, type RenovationROIOutput };

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

Follow these instructions precisely:

1. **ROI Calculation**: Based on the search results containing renovation ROI data, market trends, and comparable renovations:
   - Calculate the estimated new property value after renovation
   - Determine the expected value increase
   - Calculate ROI percentage (value increase / renovation cost * 100)
   - Assess ROI category (excellent: 80%+, good: 60-79%, fair: 40-59%, poor: <40%)

2. **Market Analysis**: Analyze how location, market conditions, and property type affect ROI:
   - Location impact on renovation values
   - Current market condition effects
   - Demand level for this renovation type

3. **Comparable Renovations**: Extract 3-5 comparable renovations from search results with their costs and ROI.

4. **Key Factors**: Identify the most important factors affecting ROI (renovation type, location, market timing, quality of work, etc.).

5. **Detailed Analysis**: Provide a comprehensive analysis explaining:
   - Why this ROI estimate is realistic
   - How market conditions influence the projection
   - What makes this renovation type valuable
   - Regional market considerations

6. **Recommendations**: Offer specific, actionable advice for:
   - Maximizing ROI potential
   - Timing considerations
   - Quality vs. cost decisions
   - Market-specific strategies

7. **Risk Assessment**: Identify potential risks or factors that could negatively impact ROI.

8. **Timeline Considerations**: Provide guidance on renovation duration and optimal timing.

Important Guidelines:
- Base ROI estimates on actual market data from search results
- Consider regional variations in renovation values
- Account for current market conditions (hot/balanced/cool)
- Be realistic about ROI expectations
- Consider property type differences (single-family vs. condo, etc.)
- Factor in renovation quality and execution
- Provide confidence levels based on data availability

Return a JSON response with all required fields as specified in the schema.`,
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

            if (!output?.estimatedNewValue || !output?.roi) {
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