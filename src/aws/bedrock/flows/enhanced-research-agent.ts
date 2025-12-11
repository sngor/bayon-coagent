'use server';

/**
 * @fileOverview Enhanced Bedrock flow for research agent with MLS Grid integration.
 * 
 * This flow enhances the existing research agent with real MLS market data,
 * providing more accurate and comprehensive research reports for real estate topics.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { executeEnhancedResearch } from '@/services/mls/enhanced-research-service';
import {
    RunResearchAgentInputSchema,
    RunResearchAgentOutputSchema,
    type RunResearchAgentInput,
    type RunResearchAgentOutput,
} from '@/ai/schemas/research-agent-schemas';

// Enhanced input schema with MLS-specific options
export const EnhancedResearchInputSchema = RunResearchAgentInputSchema.extend({
    includeMarketData: z.boolean().default(true).describe('Include real MLS market data when relevant'),
    location: z.string().optional().describe('Specific location for market data (City, State format)'),
    propertyType: z.string().optional().describe('Property type filter for market data'),
    priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }).optional().describe('Price range filter for market data'),
});

// Enhanced output schema with market data context
export const EnhancedResearchOutputSchema = RunResearchAgentOutputSchema.extend({
    marketDataIncluded: z.boolean().describe('Whether real MLS market data was included'),
    dataQuality: z.enum(['high', 'medium', 'low']).describe('Quality of data sources used'),
    enhancementApplied: z.boolean().describe('Whether MLS enhancement was successfully applied'),
    marketSummary: z.string().optional().describe('Brief summary of market conditions if applicable'),
});

export type EnhancedResearchInput = z.infer<typeof EnhancedResearchInputSchema>;
export type EnhancedResearchOutput = z.infer<typeof EnhancedResearchOutputSchema>;

const enhancedResearchPrompt = definePrompt({
    name: 'enhancedResearchPrompt',
    inputSchema: RunResearchAgentInputSchema.extend({
        searchContext: z.string().describe('Combined web search and MLS market data context'),
        marketDataAvailable: z.boolean().describe('Whether real MLS market data is available'),
        dataQuality: z.enum(['high', 'medium', 'low']).describe('Quality of available data'),
    }),
    outputSchema: EnhancedResearchOutputSchema.omit({
        marketDataIncluded: true,
        dataQuality: true,
        enhancementApplied: true
    }).extend({
        marketSummary: z.string().optional().describe('Brief summary of market conditions if applicable'),
    }),
    options: MODEL_CONFIGS.LONG_FORM,
    prompt: `You are an expert real estate research analyst with access to both web search results and real MLS (Multiple Listing Service) market data. Your goal is to produce a comprehensive, well-structured, and factual research report.

Topic: {{{topic}}}

Data Quality: {{{dataQuality}}} (high = real MLS data available, medium = web search with market context, low = limited data)
MLS Market Data Available: {{{marketDataAvailable}}}

Combined Research Context:
{{{searchContext}}}

Follow these instructions precisely:

1. **Structure the Report:** Format the report in well-structured Markdown with:
   - Executive Summary (key findings and market overview if applicable)
   - Market Analysis (if real estate related and data available)
   - Detailed Analysis (main research findings organized by topic)
   - Key Insights (bullet points of important takeaways)
   - Conclusion (summary and implications)

2. **Prioritize MLS Data:** When real MLS market data is available (indicated by "REAL ESTATE MARKET DATA (MLS Grid)" in the context), prioritize this information as it represents actual market conditions from the professional real estate database.

3. **Market Summary:** If this is real estate market research and market data is available, provide a brief market summary highlighting:
   - Current market conditions (seller's/buyer's/balanced market)
   - Key price and inventory metrics
   - Market trends and implications

4. **Cite Your Sources:** Use ONLY the sources provided in the search results. For MLS data, cite it as "MLS Grid (Multiple Listing Service)" and for web sources, use the specific URLs provided.

5. **Content Quality:** Synthesize information from multiple sources, provide deep analysis, and maintain a professional tone throughout.

6. **Data Transparency:** Acknowledge the quality and source of your data. If using real MLS data, emphasize its accuracy and currency.

Return a JSON response with:
- "report": Complete Markdown research report
- "citations": Array of source URLs and "MLS Grid" for MLS data
- "marketSummary": Brief market conditions summary (if applicable, otherwise null)`,
});

const enhancedResearchAgentFlow = defineFlow(
    {
        name: 'enhancedResearchAgentFlow',
        inputSchema: EnhancedResearchInputSchema,
        outputSchema: EnhancedResearchOutputSchema,
    },
    async (input) => {
        try {
            console.log(`🔍 Starting enhanced research for: ${input.topic}`);

            // Execute enhanced research with MLS integration
            const enhancedResult = await executeEnhancedResearch({
                topic: input.topic,
                includeMarketData: input.includeMarketData,
                location: input.location,
                propertyType: input.propertyType,
                priceRange: input.priceRange,
            });

            // If enhancement failed, return the fallback result
            if (!enhancedResult.enhancementApplied) {
                console.log('⚠️ Enhancement not applied, using standard research result');
                return {
                    ...enhancedResult,
                    marketDataIncluded: false,
                    dataQuality: enhancedResult.dataQuality,
                    enhancementApplied: false,
                };
            }

            // Prepare context for enhanced AI prompt
            const marketDataAvailable = enhancedResult.marketData?.dataSource === 'MLS Grid';

            // Create enhanced search context
            let searchContext = '';
            if (enhancedResult.marketData && enhancedResult.marketData.dataSource !== 'None') {
                // Format market data for AI
                if (enhancedResult.marketData.dataSource === 'MLS Grid') {
                    searchContext = this.formatMLSDataForPrompt(enhancedResult.marketData);
                } else {
                    searchContext = enhancedResult.marketData.marketTrends || '';
                }
            }

            // Add web search results (we'll need to get these separately since the enhanced service doesn't return them)
            // For now, we'll use the existing report as context
            if (!searchContext) {
                searchContext = 'Web search results integrated into research analysis.';
            }

            // Generate enhanced report using the AI prompt
            const aiResult = await enhancedResearchPrompt({
                topic: input.topic,
                searchContext,
                marketDataAvailable,
                dataQuality: enhancedResult.dataQuality,
            });

            // Combine results
            return {
                report: aiResult.report || enhancedResult.report,
                citations: aiResult.citations || enhancedResult.citations || [],
                marketDataIncluded: marketDataAvailable,
                dataQuality: enhancedResult.dataQuality,
                enhancementApplied: enhancedResult.enhancementApplied,
                marketSummary: aiResult.marketSummary || this.generateMarketSummary(enhancedResult.marketData),
            };

        } catch (error) {
            console.error('Enhanced research flow error:', error);

            // Fallback to standard research agent
            const { runResearchAgent } = await import('./run-research-agent');
            const fallbackResult = await runResearchAgent({ topic: input.topic });

            return {
                ...fallbackResult,
                marketDataIncluded: false,
                dataQuality: 'low' as const,
                enhancementApplied: false,
            };
        }
    }
);

/**
 * Format MLS data for AI prompt consumption
 */
function formatMLSDataForPrompt(marketData: any): string {
    if (!marketData || marketData.dataSource !== 'MLS Grid') {
        return '';
    }

    let formatted = 'REAL ESTATE MARKET DATA (MLS Grid - Multiple Listing Service):\n\n';

    if (marketData.marketAnalysis) {
        const analysis = marketData.marketAnalysis;
        formatted += `CURRENT MARKET CONDITIONS:
- Market Status: ${analysis.marketCondition}
- Active Listings: ${analysis.totalListings}
- Median Price: ${analysis.medianPrice?.toLocaleString() || 'N/A'}
- Average Price: ${analysis.averagePrice?.toLocaleString() || 'N/A'}
- Average Days on Market: ${analysis.averageDaysOnMarket || 'N/A'} days
- Inventory Level: ${analysis.inventoryLevel || 'N/A'}

`;
    }

    if (marketData.comparableSales && marketData.comparableSales.length > 0) {
        formatted += `RECENT COMPARABLE SALES:
${marketData.comparableSales.slice(0, 3).map((sale: any, index: number) =>
            `${index + 1}. ${sale.address} - ${sale.price?.toLocaleString() || 'N/A'}`
        ).join('\n')}

`;
    }

    if (marketData.marketTrends) {
        formatted += `MARKET INSIGHTS: ${marketData.marketTrends}\n\n`;
    }

    formatted += 'Data Source: MLS Grid (Professional Real Estate Database)\n';

    return formatted;
}

/**
 * Generate market summary from market data
 */
function generateMarketSummary(marketData: any): string | undefined {
    if (!marketData || marketData.dataSource === 'None') {
        return undefined;
    }

    if (marketData.dataSource === 'MLS Grid' && marketData.marketAnalysis) {
        const analysis = marketData.marketAnalysis;
        return `${analysis.marketCondition} with ${analysis.totalListings} active listings. Median price: ${analysis.medianPrice?.toLocaleString() || 'N/A'}. Average days on market: ${analysis.averageDaysOnMarket || 'N/A'} days.`;
    }

    if (marketData.marketTrends) {
        return marketData.marketTrends.substring(0, 200) + '...';
    }

    return undefined;
}

export async function runEnhancedResearchAgent(
    input: EnhancedResearchInput
): Promise<EnhancedResearchOutput> {
    return enhancedResearchAgentFlow.execute(input);
}

// Export the standard interface for backward compatibility
export async function runResearchAgentWithMLSData(
    input: RunResearchAgentInput & { location?: string }
): Promise<RunResearchAgentOutput> {
    const result = await runEnhancedResearchAgent({
        ...input,
        includeMarketData: true,
    });

    // Return in standard format
    return {
        report: result.report,
        citations: result.citations,
    };
}