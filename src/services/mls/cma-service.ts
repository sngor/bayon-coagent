/**
 * CMA (Comparative Market Analysis) Service
 * Uses MLS Grid data to generate comprehensive market analysis reports
 */

import { MLSGridService } from './mls-grid-service';

interface SubjectProperty {
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt?: number;
    city: string;
    state: string;
    propertyType?: string;
}

interface ComparableProperty {
    address: string;
    soldPrice: number;
    soldDate: string;
    beds: number;
    baths: number;
    sqft: number;
    distance: number;
    pricePerSqft: number;
    daysOnMarket?: number;
}

interface MarketTrends {
    medianPrice: number;
    daysOnMarket: number;
    inventoryLevel: 'low' | 'medium' | 'high';
    marketCondition: string;
    totalActiveListings: number;
    averagePrice: number;
    priceRange: {
        min: number;
        max: number;
    };
}

interface PriceRecommendation {
    low: number;
    mid: number;
    high: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
}

interface CMAReport {
    subjectProperty: SubjectProperty;
    comparables: ComparableProperty[];
    marketTrends: MarketTrends;
    priceRecommendation: PriceRecommendation;
    agentNotes: string;
    generatedDate: string;
    dataSource: 'MLS Grid' | 'Demo';
}

export class CMAService {
    private mlsService: MLSGridService;

    constructor() {
        this.mlsService = new MLSGridService();
    }

    /**
     * Generate a comprehensive CMA report for a subject property
     */
    async generateCMAReport(subjectProperty: SubjectProperty): Promise<CMAReport> {
        try {
            console.log('Generating CMA report for:', subjectProperty.address);

            // Get comparable sales
            const comparables = await this.findComparableSales(subjectProperty);

            // Get market analysis
            const marketTrends = await this.getMarketTrends(subjectProperty);

            // Generate price recommendation
            const priceRecommendation = this.calculatePriceRecommendation(
                subjectProperty,
                comparables,
                marketTrends
            );

            // Generate agent notes
            const agentNotes = this.generateAgentNotes(
                subjectProperty,
                comparables,
                marketTrends,
                priceRecommendation
            );

            return {
                subjectProperty,
                comparables,
                marketTrends,
                priceRecommendation,
                agentNotes,
                generatedDate: new Date().toISOString(),
                dataSource: comparables.length > 0 ? 'MLS Grid' : 'Demo'
            };

        } catch (error) {
            console.error('Error generating CMA report:', error);

            // Return demo CMA report as fallback
            return this.getDemoCMAReport(subjectProperty);
        }
    }

    /**
     * Find comparable sales using MLS Grid data
     */
    private async findComparableSales(subjectProperty: SubjectProperty): Promise<ComparableProperty[]> {
        try {
            // Define search criteria for comparables
            const minBeds = Math.max(1, subjectProperty.beds - 1);
            const maxBeds = subjectProperty.beds + 1;
            const minBaths = Math.max(1, subjectProperty.baths - 1);
            const maxBaths = subjectProperty.baths + 1;
            const minSqft = Math.max(500, subjectProperty.sqft - 500);
            const maxSqft = subjectProperty.sqft + 500;

            const comparableSales = await this.mlsService.findComparableProperties(
                subjectProperty.city,
                subjectProperty.state,
                subjectProperty.propertyType,
                minBeds,
                maxBeds,
                minBaths,
                maxBaths,
                minSqft,
                maxSqft,
                5, // 5 mile radius
                6  // 6 months back
            );

            // Transform to CMA format and calculate distances (simplified)
            return comparableSales.map((comp, index) => ({
                address: comp.address,
                soldPrice: comp.price,
                soldDate: comp.saleDate || new Date().toISOString(),
                beds: comp.beds || 0,
                baths: comp.baths || 0,
                sqft: comp.sqft || 0,
                distance: (index + 1) * 0.3, // Simplified distance calculation
                pricePerSqft: comp.pricePerSqft || 0,
                daysOnMarket: comp.daysOnMarket
            })).slice(0, 6); // Limit to 6 best comparables

        } catch (error) {
            console.error('Error finding comparable sales:', error);
            return [];
        }
    }

    /**
     * Get market trends analysis
     */
    private async getMarketTrends(subjectProperty: SubjectProperty): Promise<MarketTrends> {
        try {
            const marketAnalysis = await this.mlsService.getMarketAnalysis(
                subjectProperty.city,
                subjectProperty.state,
                subjectProperty.propertyType,
                6 // 6 months of data
            );

            // Determine inventory level based on total listings
            let inventoryLevel: 'low' | 'medium' | 'high';
            if (marketAnalysis.totalListings < 20) {
                inventoryLevel = 'low';
            } else if (marketAnalysis.totalListings < 50) {
                inventoryLevel = 'medium';
            } else {
                inventoryLevel = 'high';
            }

            return {
                medianPrice: marketAnalysis.medianPrice,
                daysOnMarket: marketAnalysis.averageDaysOnMarket,
                inventoryLevel,
                marketCondition: marketAnalysis.marketCondition,
                totalActiveListings: marketAnalysis.totalListings,
                averagePrice: marketAnalysis.averagePrice,
                priceRange: marketAnalysis.priceRange
            };

        } catch (error) {
            console.error('Error getting market trends:', error);

            // Return default market trends
            return {
                medianPrice: 650000,
                daysOnMarket: 25,
                inventoryLevel: 'medium',
                marketCondition: 'Balanced Market',
                totalActiveListings: 35,
                averagePrice: 675000,
                priceRange: { min: 400000, max: 1200000 }
            };
        }
    }

    /**
     * Calculate price recommendation based on comparables and market data
     */
    private calculatePriceRecommendation(
        subjectProperty: SubjectProperty,
        comparables: ComparableProperty[],
        marketTrends: MarketTrends
    ): PriceRecommendation {
        if (comparables.length === 0) {
            // Use market median as baseline
            const baseline = marketTrends.medianPrice;
            return {
                low: Math.round(baseline * 0.95),
                mid: baseline,
                high: Math.round(baseline * 1.05),
                confidence: 'low',
                reasoning: [
                    'Limited comparable sales data available',
                    'Estimate based on market median price',
                    'Recommend professional appraisal for accuracy'
                ]
            };
        }

        // Calculate price per square foot from comparables
        const pricePerSqftValues = comparables
            .filter(comp => comp.sqft > 0)
            .map(comp => comp.soldPrice / comp.sqft);

        if (pricePerSqftValues.length === 0) {
            const baseline = marketTrends.medianPrice;
            return {
                low: Math.round(baseline * 0.95),
                mid: baseline,
                high: Math.round(baseline * 1.05),
                confidence: 'low',
                reasoning: ['Insufficient square footage data in comparables']
            };
        }

        // Calculate average price per square foot
        const avgPricePerSqft = pricePerSqftValues.reduce((sum, val) => sum + val, 0) / pricePerSqftValues.length;

        // Base estimate
        const baseEstimate = Math.round(avgPricePerSqft * subjectProperty.sqft);

        // Apply market condition adjustments
        let marketAdjustment = 1.0;
        if (marketTrends.marketCondition === 'Seller\'s Market') {
            marketAdjustment = 1.03; // 3% premium
        } else if (marketTrends.marketCondition === 'Buyer\'s Market') {
            marketAdjustment = 0.97; // 3% discount
        }

        const adjustedEstimate = Math.round(baseEstimate * marketAdjustment);

        // Calculate confidence level
        let confidence: 'high' | 'medium' | 'low';
        if (comparables.length >= 4 && pricePerSqftValues.length >= 4) {
            confidence = 'high';
        } else if (comparables.length >= 2) {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        // Generate reasoning
        const reasoning = [
            `Based on ${comparables.length} comparable sales`,
            `Average price per sq ft: $${Math.round(avgPricePerSqft)}`,
            `Market condition: ${marketTrends.marketCondition}`,
            `Days on market: ${marketTrends.daysOnMarket} days average`
        ];

        return {
            low: Math.round(adjustedEstimate * 0.95),
            mid: adjustedEstimate,
            high: Math.round(adjustedEstimate * 1.05),
            confidence,
            reasoning
        };
    }

    /**
     * Generate agent notes for the CMA report
     */
    private generateAgentNotes(
        subjectProperty: SubjectProperty,
        comparables: ComparableProperty[],
        marketTrends: MarketTrends,
        priceRecommendation: PriceRecommendation
    ): string {
        const notes = [];

        // Market overview
        notes.push(`Market Analysis for ${subjectProperty.city}, ${subjectProperty.state}:`);
        notes.push(`Current market condition is "${marketTrends.marketCondition}" with ${marketTrends.totalActiveListings} active listings.`);
        notes.push(`Properties are averaging ${marketTrends.daysOnMarket} days on market.`);
        notes.push('');

        // Comparable analysis
        if (comparables.length > 0) {
            notes.push(`Comparable Sales Analysis:`);
            notes.push(`Found ${comparables.length} comparable sales within the last 6 months.`);

            const avgSoldPrice = Math.round(comparables.reduce((sum, comp) => sum + comp.soldPrice, 0) / comparables.length);
            notes.push(`Average sold price: $${avgSoldPrice.toLocaleString()}`);

            const avgPricePerSqft = Math.round(comparables.reduce((sum, comp) => sum + comp.pricePerSqft, 0) / comparables.length);
            notes.push(`Average price per sq ft: $${avgPricePerSqft}`);
            notes.push('');
        }

        // Price recommendation
        notes.push(`Price Recommendation:`);
        notes.push(`Suggested listing range: $${priceRecommendation.low.toLocaleString()} - $${priceRecommendation.high.toLocaleString()}`);
        notes.push(`Optimal listing price: $${priceRecommendation.mid.toLocaleString()}`);
        notes.push(`Confidence level: ${priceRecommendation.confidence.toUpperCase()}`);
        notes.push('');

        // Market strategy
        if (marketTrends.marketCondition === 'Seller\'s Market') {
            notes.push('Market Strategy: Consider pricing at the higher end of the range due to strong seller conditions.');
        } else if (marketTrends.marketCondition === 'Buyer\'s Market') {
            notes.push('Market Strategy: Consider competitive pricing and enhanced marketing due to buyer market conditions.');
        } else {
            notes.push('Market Strategy: Balanced market allows for strategic pricing within the recommended range.');
        }

        return notes.join('\n');
    }

    /**
     * Generate demo CMA report when real data is not available
     */
    private getDemoCMAReport(subjectProperty: SubjectProperty): CMAReport {
        const demoComparables: ComparableProperty[] = [
            {
                address: '123 Similar Street',
                soldPrice: 725000,
                soldDate: '2024-10-15',
                beds: subjectProperty.beds,
                baths: subjectProperty.baths,
                sqft: subjectProperty.sqft + 100,
                distance: 0.3,
                pricePerSqft: Math.round(725000 / (subjectProperty.sqft + 100)),
                daysOnMarket: 18
            },
            {
                address: '456 Nearby Avenue',
                soldPrice: 695000,
                soldDate: '2024-09-28',
                beds: subjectProperty.beds - 1,
                baths: subjectProperty.baths,
                sqft: subjectProperty.sqft - 200,
                distance: 0.5,
                pricePerSqft: Math.round(695000 / (subjectProperty.sqft - 200)),
                daysOnMarket: 25
            },
            {
                address: '789 Close Lane',
                soldPrice: 750000,
                soldDate: '2024-11-02',
                beds: subjectProperty.beds,
                baths: subjectProperty.baths + 1,
                sqft: subjectProperty.sqft + 300,
                distance: 0.7,
                pricePerSqft: Math.round(750000 / (subjectProperty.sqft + 300)),
                daysOnMarket: 12
            }
        ];

        const demoMarketTrends: MarketTrends = {
            medianPrice: 720000,
            daysOnMarket: 22,
            inventoryLevel: 'medium',
            marketCondition: 'Balanced Market',
            totalActiveListings: 42,
            averagePrice: 735000,
            priceRange: { min: 550000, max: 950000 }
        };

        const demoPriceRecommendation = this.calculatePriceRecommendation(
            subjectProperty,
            demoComparables,
            demoMarketTrends
        );

        const demoAgentNotes = this.generateAgentNotes(
            subjectProperty,
            demoComparables,
            demoMarketTrends,
            demoPriceRecommendation
        );

        return {
            subjectProperty,
            comparables: demoComparables,
            marketTrends: demoMarketTrends,
            priceRecommendation: demoPriceRecommendation,
            agentNotes: demoAgentNotes + '\n\nNote: This is a demo CMA report with sample data.',
            generatedDate: new Date().toISOString(),
            dataSource: 'Demo'
        };
    }
}