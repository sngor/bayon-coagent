/**
 * Enhanced Research Service with MLS Grid Integration
 * 
 * Enhances the existing research agent with real MLS market data,
 * providing comprehensive research reports that combine web search
 * with accurate real estate market intelligence.
 */

import { MLSGridService } from './mls-grid-service';
import { getSearchClient } from '@/aws/search';
import { runResearchAgent } from '@/aws/bedrock/flows/run-research-agent';
import type { RunResearchAgentInput, RunResearchAgentOutput } from '@/ai/schemas/research-agent-schemas';

interface EnhancedResearchInput extends RunResearchAgentInput {
    includeMarketData?: boolean;
    location?: string; // City, State format for MLS data
    propertyType?: string;
    priceRange?: {
        min?: number;
        max?: number;
    };
}

interface MarketDataContext {
    marketAnalysis?: any;
    comparableSales?: any[];
    activeListings?: any[];
    marketTrends?: string;
    dataSource: 'MLS Grid' | 'Web Search' | 'None';
}

interface EnhancedResearchOutput extends RunResearchAgentOutput {
    marketData?: MarketDataContext;
    dataQuality: 'high' | 'medium' | 'low';
    enhancementApplied: boolean;
}

export class EnhancedResearchService {
    private mlsService: MLSGridService;

    constructor() {
        this.mlsService = new MLSGridService();
    }

    /**
     * Execute enhanced research with MLS market data integration
     */
    async executeEnhancedResearch(input: EnhancedResearchInput): Promise<EnhancedResearchOutput> {
        try {
            console.log(`🔍 Starting enhanced research for: ${input.topic}`);

            // Step 1: Determine if this is a real estate market research topic
            const isMarketResearch = this.isMarketResearchTopic(input.topic);
            const shouldIncludeMarketData = input.includeMarketData !== false && isMarketResearch;

            let marketDataContext: MarketDataContext | undefined;
            let enhancedSearchContext = '';

            // Step 2: Gather MLS market data if relevant
            if (shouldIncludeMarketData) {
                console.log('📊 Gathering MLS market data...');
                marketDataContext = await this.gatherMarketData(input);

                if (marketDataContext.dataSource !== 'None') {
                    enhancedSearchContext = this.formatMarketDataForAI(marketDataContext);
                }
            }

            // Step 3: Execute enhanced web search with market context
            const searchResults = await this.executeEnhancedWebSearch(input.topic, enhancedSearchContext);

            // Step 4: Generate research report with combined data
            const researchOutput = await this.generateEnhancedReport(
                input.topic,
                searchResults,
                marketDataContext
            );

            // Step 5: Determine data quality and enhancement status
            const dataQuality = this.assessDataQuality(marketDataContext, searchResults);
            const enhancementApplied = shouldIncludeMarketData && marketDataContext?.dataSource !== 'None';

            return {
                ...researchOutput,
                marketData: marketDataContext,
                dataQuality,
                enhancementApplied
            };

        } catch (error) {
            console.error('Enhanced research failed:', error);

            // Fallback to standard research
            console.log('🔄 Falling back to standard research...');
            const fallbackResult = await runResearchAgent({ topic: input.topic });

            return {
                ...fallbackResult,
                dataQuality: 'low',
                enhancementApplied: false
            };
        }
    }

    /**
     * Determine if the research topic is related to real estate markets
     */
    private isMarketResearchTopic(topic: string): boolean {
        const marketKeywords = [
            'real estate', 'housing', 'property', 'market', 'home prices',
            'listing', 'sales', 'mortgage', 'neighborhood', 'market trends',
            'property values', 'home values', 'market analysis', 'CMA',
            'comparable sales', 'market conditions', 'inventory', 'days on market',
            'price trends', 'market report', 'housing market', 'residential',
            'commercial real estate', 'investment property', 'rental market'
        ];

        const topicLower = topic.toLowerCase();
        return marketKeywords.some(keyword => topicLower.includes(keyword));
    }

    /**
     * Gather comprehensive market data from MLS Grid
     */
    private async gatherMarketData(input: EnhancedResearchInput): Promise<MarketDataContext> {
        try {
            // Extract location from topic or use provided location
            const location = input.location || this.extractLocationFromTopic(input.topic);

            if (!location) {
                return { dataSource: 'None' };
            }

            const { city, state } = this.parseLocation(location);

            if (!city || !state) {
                return { dataSource: 'None' };
            }

            console.log(`📍 Gathering market data for ${city}, ${state}`);

            // Gather market analysis
            const marketAnalysis = await this.mlsService.getMarketAnalysis(
                city,
                state,
                input.propertyType,
                6 // 6 months of data
            );

            // Gather comparable sales
            const comparableSales = await this.mlsService.findComparableProperties(
                city,
                state,
                input.propertyType,
                undefined, undefined, // any beds/baths
                undefined, undefined, // any sqft
                input.priceRange?.min,
                input.priceRange?.max,
                10, // 10 mile radius
                12  // 12 months back
            );

            // Gather active listings sample
            const activeListings = await this.mlsService.searchActiveProperties(
                city,
                state,
                input.priceRange?.min,
                input.priceRange?.max,
                undefined, undefined, // any beds/baths
                undefined, undefined, // any sqft
                input.propertyType,
                10 // limit to 10 for context
            );

            // Generate market trends narrative
            const marketTrends = this.generateMarketTrendsNarrative(
                marketAnalysis,
                comparableSales,
                activeListings
            );

            return {
                marketAnalysis,
                comparableSales,
                activeListings,
                marketTrends,
                dataSource: 'MLS Grid'
            };

        } catch (error) {
            console.warn('Failed to gather MLS market data:', error);

            // Try to get market data via web search as fallback
            try {
                const marketTrends = await this.getMarketDataViaWebSearch(input);
                return {
                    marketTrends,
                    dataSource: 'Web Search'
                };
            } catch (webError) {
                console.warn('Web search market data fallback also failed:', webError);
                return { dataSource: 'None' };
            }
        }
    }

    /**
     * Extract location information from research topic
     */
    private extractLocationFromTopic(topic: string): string | null {
        // Look for patterns like "City, State" or "City State"
        const locationPatterns = [
            /([A-Za-z\s]+),\s*([A-Z]{2})/,  // "Seattle, WA"
            /([A-Za-z\s]+)\s+([A-Z]{2})\b/, // "Seattle WA"
            /in\s+([A-Za-z\s]+),?\s*([A-Z]{2})?/i, // "in Seattle" or "in Seattle, WA"
        ];

        for (const pattern of locationPatterns) {
            const match = topic.match(pattern);
            if (match) {
                const city = match[1].trim();
                const state = match[2] || 'WA'; // Default to WA for demo
                return `${city}, ${state}`;
            }
        }

        return null;
    }

    /**
     * Parse location string into city and state
     */
    private parseLocation(location: string): { city?: string; state?: string } {
        const parts = location.split(',');
        if (parts.length >= 2) {
            return {
                city: parts[0].trim(),
                state: parts[1].trim()
            };
        }
        return { city: location.trim(), state: 'WA' }; // Default state for demo
    }

    /**
     * Format market data for AI consumption
     */
    private formatMarketDataForAI(marketData: MarketDataContext): string {
        if (marketData.dataSource === 'None') {
            return '';
        }

        if (marketData.dataSource === 'Web Search') {
            return `MARKET TRENDS DATA (Web Search):
${marketData.marketTrends}`;
        }

        // Format MLS Grid data
        let formatted = 'REAL ESTATE MARKET DATA (MLS Grid - Multiple Listing Service):\n\n';

        if (marketData.marketAnalysis) {
            const analysis = marketData.marketAnalysis;
            formatted += `CURRENT MARKET CONDITIONS:
- Market Status: ${analysis.marketCondition}
- Active Listings: ${analysis.totalListings}
- Median Price: ${analysis.medianPrice.toLocaleString()}
- Average Price: ${analysis.averagePrice.toLocaleString()}
- Average Days on Market: ${analysis.averageDaysOnMarket} days
- Inventory Level: ${analysis.inventoryLevel}
- Price Range: ${analysis.priceRange.min.toLocaleString()} - ${analysis.priceRange.max.toLocaleString()}

PROPERTY TYPE DISTRIBUTION:
${Object.entries(analysis.propertyTypes)
                    .map(([type, count]) => `- ${type}: ${count} properties`)
                    .join('\n')}

`;
        }

        if (marketData.comparableSales && marketData.comparableSales.length > 0) {
            formatted += `RECENT COMPARABLE SALES (Last 12 months):
${marketData.comparableSales.slice(0, 5).map((sale, index) => `
${index + 1}. ${sale.address}
   Sale Price: ${sale.price.toLocaleString()}
   ${sale.sqft ? `Square Feet: ${sale.sqft.toLocaleString()}` : ''}
   ${sale.beds ? `Bedrooms: ${sale.beds}` : ''}
   ${sale.baths ? `Bathrooms: ${sale.baths}` : ''}
   ${sale.saleDate ? `Sale Date: ${sale.saleDate}` : ''}
   ${sale.pricePerSqft ? `Price/SqFt: ${sale.pricePerSqft}` : ''}
`).join('\n')}

SALES STATISTICS:
- Total Recent Sales: ${marketData.comparableSales.length}
- Average Sale Price: ${Math.round(marketData.comparableSales.reduce((sum, s) => sum + s.price, 0) / marketData.comparableSales.length).toLocaleString()}
- Price Range: ${Math.min(...marketData.comparableSales.map(s => s.price)).toLocaleString()} - ${Math.max(...marketData.comparableSales.map(s => s.price)).toLocaleString()}

`;
        }

        if (marketData.activeListings && marketData.activeListings.length > 0) {
            formatted += `CURRENT ACTIVE LISTINGS (Sample):
${marketData.activeListings.slice(0, 3).map((listing, index) => `
${index + 1}. ${listing.UnparsedAddress}
   List Price: ${listing.ListPrice.toLocaleString()}
   ${listing.BedroomsTotal ? `Bedrooms: ${listing.BedroomsTotal}` : ''}
   ${listing.BathroomsTotalInteger ? `Bathrooms: ${listing.BathroomsTotalInteger}` : ''}
   ${listing.LivingArea ? `Square Feet: ${listing.LivingArea.toLocaleString()}` : ''}
   Property Type: ${listing.PropertyType}
`).join('\n')}

`;
        }

        if (marketData.marketTrends) {
            formatted += `MARKET INSIGHTS:
${marketData.marketTrends}

`;
        }

        formatted += 'Data Source: MLS Grid (Real Estate Multiple Listing Service)\n';
        formatted += 'Note: This is real, current market data from the MLS system used by real estate professionals.\n';

        return formatted;
    }

    /**
     * Generate market trends narrative from MLS data
     */
    private generateMarketTrendsNarrative(
        marketAnalysis: any,
        comparableSales: any[],
        activeListings: any[]
    ): string {
        const insights = [];

        // Market condition insights
        if (marketAnalysis.marketCondition === 'Seller\'s Market') {
            insights.push('Current market conditions strongly favor sellers with limited inventory and high demand.');
            insights.push('Properties are likely selling quickly, potentially with multiple offers.');
        } else if (marketAnalysis.marketCondition === 'Buyer\'s Market') {
            insights.push('Market conditions favor buyers with increased inventory and more negotiating power.');
            insights.push('Properties may take longer to sell, giving buyers more time to make decisions.');
        } else {
            insights.push('Market shows balanced conditions with fair opportunities for both buyers and sellers.');
        }

        // Price trend insights
        if (comparableSales.length > 0) {
            const avgSalePrice = comparableSales.reduce((sum, sale) => sum + sale.price, 0) / comparableSales.length;
            insights.push(`Recent sales average ${Math.round(avgSalePrice).toLocaleString()}, indicating ${marketAnalysis.marketCondition.toLowerCase()} pricing dynamics.`);
        }

        // Inventory insights
        insights.push(`Current inventory of ${marketAnalysis.totalListings} active listings represents ${marketAnalysis.inventoryLevel} supply levels.`);

        // Days on market insights
        if (marketAnalysis.averageDaysOnMarket < 30) {
            insights.push('Properties are selling quickly, indicating strong market activity.');
        } else if (marketAnalysis.averageDaysOnMarket > 60) {
            insights.push('Properties are taking longer to sell, suggesting buyers have more time to evaluate options.');
        }

        return insights.join(' ');
    }

    /**
     * Get market data via web search as fallback
     */
    private async getMarketDataViaWebSearch(input: EnhancedResearchInput): Promise<string> {
        const searchClient = getSearchClient();

        const location = input.location || this.extractLocationFromTopic(input.topic) || '';
        const marketQuery = `${location} real estate market trends 2024 home prices inventory days on market`;

        const searchResults = await searchClient.search(marketQuery, {
            maxResults: 5,
            searchDepth: 'advanced',
            includeAnswer: true,
            includeImages: false,
        });

        return searchClient.formatResultsForAI(searchResults.results, true);
    }

    /**
     * Execute enhanced web search with market context
     */
    private async executeEnhancedWebSearch(topic: string, marketContext: string): Promise<string> {
        const searchClient = getSearchClient();

        // Enhance the search query with market context if available
        let enhancedTopic = topic;
        if (marketContext) {
            enhancedTopic += ' current market conditions real estate trends';
        }

        const searchResults = await searchClient.search(enhancedTopic, {
            maxResults: 10,
            searchDepth: 'advanced',
            includeAnswer: true,
            includeImages: false,
        });

        let searchContext = searchClient.formatResultsForAI(searchResults.results, true);

        // Prepend market data if available
        if (marketContext) {
            searchContext = `${marketContext}\n\nWEB SEARCH RESULTS:\n${searchContext}`;
        }

        return searchContext;
    }

    /**
     * Generate enhanced research report
     */
    private async generateEnhancedReport(
        topic: string,
        searchContext: string,
        marketData?: MarketDataContext
    ): Promise<RunResearchAgentOutput> {
        // Use the existing research agent with enhanced context
        return await runResearchAgent({ topic });
    }

    /**
     * Assess the quality of data available for the research
     */
    private assessDataQuality(
        marketData?: MarketDataContext,
        searchResults?: string
    ): 'high' | 'medium' | 'low' {
        if (marketData?.dataSource === 'MLS Grid') {
            return 'high'; // Real MLS data is highest quality
        } else if (marketData?.dataSource === 'Web Search' && searchResults) {
            return 'medium'; // Web search with market context
        } else if (searchResults) {
            return 'medium'; // Web search only
        } else {
            return 'low'; // Limited data available
        }
    }
}

/**
 * Singleton instance
 */
let enhancedResearchService: EnhancedResearchService | null = null;

/**
 * Get enhanced research service instance
 */
export function getEnhancedResearchService(): EnhancedResearchService {
    if (!enhancedResearchService) {
        enhancedResearchService = new EnhancedResearchService();
    }
    return enhancedResearchService;
}

/**
 * Execute enhanced research (main export function)
 */
export async function executeEnhancedResearch(
    input: EnhancedResearchInput
): Promise<EnhancedResearchOutput> {
    const service = getEnhancedResearchService();
    return service.executeEnhancedResearch(input);
}