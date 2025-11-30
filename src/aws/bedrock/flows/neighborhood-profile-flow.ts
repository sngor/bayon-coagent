'use server';

/**
 * @fileOverview Bedrock flow for AI-powered neighborhood profile synthesis.
 * 
 * This flow takes raw neighborhood data from multiple sources and synthesizes
 * it into a comprehensive, narrative-driven neighborhood profile with insights,
 * market commentary, and recommendations.
 * 
 * Requirements: 5.1
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    NeighborhoodProfileInputSchema,
    NeighborhoodProfileOutputSchema,
    type NeighborhoodProfileInput,
    type NeighborhoodProfileOutput,
} from '@/ai/schemas/neighborhood-profile-schemas';



const neighborhoodProfilePrompt = definePrompt({
    name: 'neighborhoodProfilePrompt',
    inputSchema: NeighborhoodProfileInputSchema,
    outputSchema: NeighborhoodProfileOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    systemPrompt: `You are an expert real estate market analyst and neighborhood specialist with deep knowledge of residential markets, demographics, and community dynamics. Your expertise includes market valuation, demographic analysis, lifestyle assessment, and investment potential evaluation.

Your role is to synthesize raw neighborhood data into compelling, professional narratives that help real estate agents position themselves as local market experts and provide valuable insights to their clients.`,
    prompt: `Analyze the following neighborhood data and create a comprehensive profile for {{{location}}}:

**MARKET DATA:**
- Median Sale Price: $\{{{marketData.medianSalePrice}}}
- Average Days on Market: \{{{marketData.avgDaysOnMarket}}} days
- Sales Volume: \{{{marketData.salesVolume}}} properties
- Inventory Level: \{{{marketData.inventoryLevel}}} properties
- Price History (12 months): \{{{json marketData.priceHistory}}}

**DEMOGRAPHICS:**
- Population: \{{{demographics.population}}}
- Median Household Income: $\{{{demographics.medianHouseholdIncome}}}
- Age Distribution: \{{{json demographics.ageDistribution}}}
- Household Composition: \{{{json demographics.householdComposition}}}

**SCHOOLS:**
\{{{json schools}}}

**AMENITIES:**
- Restaurants: \{{{json amenities.restaurants}}}
- Shopping: \{{{json amenities.shopping}}}
- Parks: \{{{json amenities.parks}}}
- Healthcare: \{{{json amenities.healthcare}}}
- Entertainment: \{{{json amenities.entertainment}}}

**WALKABILITY:**
- Score: \{{{walkabilityScore}}}/100 (\{{{walkabilityDescription}}})
- Factors: \{{{json walkabilityFactors}}}

**ANALYSIS REQUIREMENTS:**

1. **AI Insights (Main Narrative)**: Create a comprehensive 300-400 word narrative that weaves together all the data points into a cohesive story about this neighborhood. Focus on what makes it unique, who lives there, and why people choose this area. Make it engaging and informative.

2. **Market Commentary**: Provide a detailed analysis of the market conditions, pricing trends, and what the data suggests about market dynamics. Include insights about price history, inventory levels, and market velocity.

3. **Demographic Insights**: Analyze what the demographic data reveals about the community character, lifestyle preferences, and social dynamics. Connect age distribution and household composition to neighborhood appeal.

4. **Lifestyle Factors**: Describe the quality of life aspects, including walkability, amenities, and overall lifestyle appeal. Paint a picture of daily life in this neighborhood.

5. **School Analysis**: Evaluate the educational landscape and what it means for families. Consider both public and private options and their impact on property values.

6. **Investment Potential**: Assess the area's investment prospects based on market data, demographics, and growth indicators. Consider both short-term and long-term potential.

7. **Key Highlights**: Identify 3-5 distinctive features that set this neighborhood apart from others.

8. **Target Buyers**: Identify the types of buyers who would be most attracted to this area based on the data.

9. **Market Trends**: Highlight current and emerging trends that are shaping this neighborhood.

10. **Recommendations**: Provide specific, actionable advice for different stakeholder groups.

**WRITING GUIDELINES:**
- Use professional, engaging language appropriate for real estate marketing
- Be specific and data-driven while remaining accessible
- Avoid jargon and overly technical terms
- Focus on benefits and lifestyle appeal
- Maintain objectivity while highlighting positive aspects
- Include specific numbers and percentages where relevant
- Create content that positions the agent as a local expert

**IMPORTANT NOTES:**
- If any data appears to be missing or zero, acknowledge it gracefully without dwelling on limitations
- Focus on available data to create the most compelling narrative possible
- Ensure all insights are supported by the provided data
- Make the content valuable for both buyers and sellers
- Consider seasonal factors and market timing where relevant

Return a JSON response with all required fields as specified in the schema.`,
});

const neighborhoodProfileFlow = defineFlow(
    {
        name: 'neighborhoodProfileFlow',
        inputSchema: NeighborhoodProfileInputSchema,
        outputSchema: NeighborhoodProfileOutputSchema,
    },
    async (input) => {
        try {
            // Generate neighborhood profile synthesis
            const output = await neighborhoodProfilePrompt(input);

            if (!output?.aiInsights || !output?.marketCommentary) {
                throw new Error("Unable to generate neighborhood profile synthesis. Please check the input data.");
            }

            return output;
        } catch (error) {
            console.error('Neighborhood profile synthesis error:', error);

            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    throw new Error("Neighborhood profile service is not configured. Please contact support.");
                }
                if (error.message.includes('bedrock') || error.message.includes('claude')) {
                    throw new Error("AI service is temporarily unavailable. Please try again later.");
                }
                // Return the original error message for debugging
                throw new Error(`Neighborhood profile synthesis failed: ${error.message}`);
            }
            throw new Error("An unexpected error occurred during neighborhood profile synthesis.");
        }
    }
);

export async function runNeighborhoodProfileSynthesis(
    input: NeighborhoodProfileInput
): Promise<NeighborhoodProfileOutput> {
    return neighborhoodProfileFlow.execute(input);
}