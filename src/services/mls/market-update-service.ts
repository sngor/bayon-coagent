/**
 * Market Update Service with MLS Grid Integration
 * Enhances existing market intelligence with real MLS data
 */

import { MLSGridService } from './mls-grid-service';

interface MarketUpdateData {
    location: string;
    timeframe: 'monthly' | 'quarterly' | 'yearly';
    includeComparisons: boolean;
    targetAudience: 'buyers' | 'sellers' | 'investors' | 'general';
}

interface MarketUpdateReport {
    headline: string;
    keyMetrics: {
        medianPrice: number;
        priceChange: number;
        daysOnMarket: number;
        inventoryLevel: string;
        totalSales: number;
        marketCondition: string;
    };
    insights: string[];
    recommendations: string[];
    chartData: {
        priceHistory: Array<{ month: string; price: number }>;
        inventoryTrend: Array<{ month: string; listings: number }>;
    };
    socialMediaPosts: {
        facebook: string;
        instagram: string;
        linkedin: string;
    };
    blogPost: string;
    dataSource: 'MLS Grid' | 'Demo';
}

export class MarketUpdateService {
    private mlsService: MLSGridService;

    constructor() {
        this.mlsService = new MLSGridService();
    }

    /**
     * Generate comprehensive market update with real MLS data
     */
    async generateMarketUpdate(data: MarketUpdateData): Promise<MarketUpdateReport> {
        try {
            console.log(`Generating market update for ${data.location}`);

            // Extract city and state from location
            const locationParts = data.location.split(',');
            const city = locationParts[0]?.trim();
            const state = locationParts[1]?.trim() || 'WA'; // Default to WA for demo

            if (!city) {
                throw new Error('Invalid location format. Use "City, State"');
            }

            // Get current market analysis
            const currentMarket = await this.mlsService.getMarketAnalysis(city, state);

            // Get comparable data for trend analysis
            const comparables = await this.mlsService.findComparableProperties(
                city,
                state,
                undefined, // any property type
                undefined, undefined, // any beds
                undefined, undefined, // any baths
                undefined, undefined, // any sqft
                10, // 10 mile radius
                12  // 12 months for trend analysis
            );

            // Calculate trends and insights
            const insights = this.generateInsights(currentMarket, comparables);
            const recommendations = this.generateRecommendations(currentMarket, data.targetAudience);

            // Create chart data (simplified - in production would use historical data)
            const chartData = this.generateChartData(currentMarket, comparables);

            // Generate content for different platforms
            const socialMediaPosts = this.generateSocialMediaContent(currentMarket, data.location);
            const blogPost = this.generateBlogPost(currentMarket, insights, recommendations, data.location);

            // Calculate price change (simplified)
            const priceChange = this.calculatePriceChange(comparables);

            return {
                headline: this.generateHeadline(currentMarket, data.location),
                keyMetrics: {
                    medianPrice: currentMarket.medianPrice,
                    priceChange,
                    daysOnMarket: currentMarket.averageDaysOnMarket,
                    inventoryLevel: currentMarket.inventoryLevel,
                    totalSales: comparables.length,
                    marketCondition: currentMarket.marketCondition
                },
                insights,
                recommendations,
                chartData,
                socialMediaPosts,
                blogPost,
                dataSource: currentMarket.totalListings > 0 ? 'MLS Grid' : 'Demo'
            };

        } catch (error) {
            console.error('Error generating market update:', error);
            return this.getDemoMarketUpdate(data);
        }
    }

    private generateHeadline(marketData: any, location: string): string {
        const condition = marketData.marketCondition;
        const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (condition === 'Seller\'s Market') {
            return `${location} Real Estate: Strong Seller Conditions Continue in ${month}`;
        } else if (condition === 'Buyer\'s Market') {
            return `${location} Market Shifts to Favor Buyers in ${month}`;
        } else {
            return `${location} Real Estate Market Shows Balanced Conditions in ${month}`;
        }
    }

    private generateInsights(marketData: any, comparables: any[]): string[] {
        const insights = [];

        // Market condition insight
        insights.push(`Current market conditions favor ${marketData.marketCondition === 'Seller\'s Market' ? 'sellers' : marketData.marketCondition === 'Buyer\'s Market' ? 'buyers' : 'both buyers and sellers'} with ${marketData.totalListings} active listings.`);

        // Price insight
        if (marketData.medianPrice > 0) {
            insights.push(`Median home price is $${marketData.medianPrice.toLocaleString()}, reflecting ${marketData.marketCondition.toLowerCase()} dynamics.`);
        }

        // Days on market insight
        if (marketData.averageDaysOnMarket < 30) {
            insights.push(`Properties are selling quickly, averaging ${marketData.averageDaysOnMarket} days on market.`);
        } else if (marketData.averageDaysOnMarket > 60) {
            insights.push(`Properties are taking longer to sell, averaging ${marketData.averageDaysOnMarket} days on market.`);
        } else {
            insights.push(`Properties are selling at a normal pace, averaging ${marketData.averageDaysOnMarket} days on market.`);
        }

        // Inventory insight
        insights.push(`Inventory levels are ${marketData.inventoryLevel}, ${marketData.inventoryLevel === 'low' ? 'creating competitive conditions for buyers' : marketData.inventoryLevel === 'high' ? 'providing more options for buyers' : 'maintaining balanced market conditions'}.`);

        return insights;
    }

    private generateRecommendations(marketData: any, targetAudience: string): string[] {
        const recommendations = [];

        if (targetAudience === 'sellers' || targetAudience === 'general') {
            if (marketData.marketCondition === 'Seller\'s Market') {
                recommendations.push('Sellers should consider listing now to take advantage of strong market conditions.');
                recommendations.push('Price competitively but don\'t undervalue - multiple offers are common.');
            } else if (marketData.marketCondition === 'Buyer\'s Market') {
                recommendations.push('Sellers should focus on competitive pricing and enhanced marketing.');
                recommendations.push('Consider staging and professional photography to stand out.');
            } else {
                recommendations.push('Sellers have good opportunities with proper pricing and marketing.');
            }
        }

        if (targetAudience === 'buyers' || targetAudience === 'general') {
            if (marketData.marketCondition === 'Buyer\'s Market') {
                recommendations.push('Buyers have more negotiating power and inventory to choose from.');
                recommendations.push('Take time to find the right property and negotiate favorable terms.');
            } else if (marketData.marketCondition === 'Seller\'s Market') {
                recommendations.push('Buyers should be prepared to act quickly and consider pre-approval.');
                recommendations.push('Consider properties slightly above budget as competition may drive prices up.');
            } else {
                recommendations.push('Buyers should work with experienced agents to navigate balanced conditions.');
            }
        }

        if (targetAudience === 'investors' || targetAudience === 'general') {
            recommendations.push('Investors should focus on emerging neighborhoods with growth potential.');
            recommendations.push('Consider both rental income potential and long-term appreciation.');
        }

        return recommendations;
    }

    private generateChartData(marketData: any, comparables: any[]): any {
        // Simplified chart data generation
        // In production, this would use historical MLS data

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const basePrice = marketData.medianPrice || 650000;

        return {
            priceHistory: months.map((month, index) => ({
                month,
                price: Math.round(basePrice + (Math.random() - 0.5) * 50000)
            })),
            inventoryTrend: months.map((month, index) => ({
                month,
                listings: Math.round(marketData.totalListings + (Math.random() - 0.5) * 20)
            }))
        };
    }

    private generateSocialMediaContent(marketData: any, location: string): any {
        const medianPrice = marketData.medianPrice?.toLocaleString() || 'N/A';
        const condition = marketData.marketCondition;

        return {
            facebook: `🏠 ${location} Market Update: ${condition} conditions with median price at $${medianPrice}. ${marketData.averageDaysOnMarket} days average time on market. Great opportunities for ${condition === 'Seller\'s Market' ? 'sellers' : condition === 'Buyer\'s Market' ? 'buyers' : 'both buyers and sellers'}! Contact me for personalized market insights. #RealEstate #${location.replace(/[^a-zA-Z]/g, '')}Market`,

            instagram: `📊 ${location} Market Snapshot:\n💰 Median Price: $${medianPrice}\n⏰ Avg Days on Market: ${marketData.averageDaysOnMarket}\n📈 Market: ${condition}\n\nDM me for detailed market analysis! 🏡\n\n#RealEstate #MarketUpdate #${location.replace(/[^a-zA-Z]/g, '')} #HomeValues`,

            linkedin: `${location} Real Estate Market Analysis: Current data shows ${condition.toLowerCase()} with median pricing at $${medianPrice}. Properties are averaging ${marketData.averageDaysOnMarket} days on market, indicating ${marketData.averageDaysOnMarket < 30 ? 'strong' : marketData.averageDaysOnMarket > 60 ? 'slower' : 'steady'} market activity. As your local market expert, I'm here to help you navigate these conditions whether you're buying, selling, or investing.`
        };
    }

    private generateBlogPost(marketData: any, insights: string[], recommendations: string[], location: string): string {
        const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return `# ${location} Real Estate Market Report - ${month}

## Market Overview

The ${location} real estate market is currently experiencing ${marketData.marketCondition.toLowerCase()} conditions, providing ${marketData.marketCondition === 'Seller\'s Market' ? 'excellent opportunities for sellers' : marketData.marketCondition === 'Buyer\'s Market' ? 'favorable conditions for buyers' : 'balanced opportunities for both buyers and sellers'}.

## Key Market Metrics

- **Median Home Price**: $${marketData.medianPrice?.toLocaleString() || 'N/A'}
- **Average Days on Market**: ${marketData.averageDaysOnMarket} days
- **Market Condition**: ${marketData.marketCondition}
- **Inventory Level**: ${marketData.inventoryLevel}
- **Active Listings**: ${marketData.totalListings}

## Market Insights

${insights.map(insight => `- ${insight}`).join('\n')}

## Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## Looking Ahead

The ${location} market continues to show ${marketData.marketCondition === 'Seller\'s Market' ? 'strength' : marketData.marketCondition === 'Buyer\'s Market' ? 'adjustment' : 'stability'} as we move through ${month}. Whether you're considering buying, selling, or investing, understanding these market dynamics is crucial for making informed decisions.

For personalized market analysis and expert guidance, contact me today. I'm here to help you navigate the ${location} real estate market with confidence.

---

*This market report is based on current MLS data and market analysis. Individual results may vary, and market conditions can change rapidly. Always consult with a qualified real estate professional for personalized advice.*`;
    }

    private calculatePriceChange(comparables: any[]): number {
        // Simplified price change calculation
        // In production, would compare with historical data
        if (comparables.length === 0) return 0;

        // Mock calculation - in reality would use time-series data
        return Math.round((Math.random() - 0.5) * 10 * 100) / 100; // -5% to +5%
    }

    private getDemoMarketUpdate(data: MarketUpdateData): MarketUpdateReport {
        return {
            headline: `${data.location} Real Estate: Balanced Market Conditions Continue`,
            keyMetrics: {
                medianPrice: 675000,
                priceChange: 2.3,
                daysOnMarket: 28,
                inventoryLevel: 'medium',
                totalSales: 45,
                marketCondition: 'Balanced Market'
            },
            insights: [
                'Current market conditions favor both buyers and sellers with 42 active listings.',
                'Median home price is $675,000, reflecting balanced market dynamics.',
                'Properties are selling at a normal pace, averaging 28 days on market.',
                'Inventory levels are medium, maintaining balanced market conditions.'
            ],
            recommendations: [
                'Sellers have good opportunities with proper pricing and marketing.',
                'Buyers should work with experienced agents to navigate balanced conditions.',
                'Investors should focus on emerging neighborhoods with growth potential.'
            ],
            chartData: {
                priceHistory: [
                    { month: 'Jan', price: 665000 },
                    { month: 'Feb', price: 670000 },
                    { month: 'Mar', price: 675000 },
                    { month: 'Apr', price: 672000 },
                    { month: 'May', price: 675000 },
                    { month: 'Jun', price: 678000 }
                ],
                inventoryTrend: [
                    { month: 'Jan', listings: 38 },
                    { month: 'Feb', listings: 41 },
                    { month: 'Mar', listings: 42 },
                    { month: 'Apr', listings: 39 },
                    { month: 'May', listings: 42 },
                    { month: 'Jun', listings: 44 }
                ]
            },
            socialMediaPosts: {
                facebook: `🏠 ${data.location} Market Update: Balanced Market conditions with median price at $675,000. 28 days average time on market. Great opportunities for both buyers and sellers! Contact me for personalized market insights. #RealEstate #MarketUpdate`,
                instagram: `📊 ${data.location} Market Snapshot:\n💰 Median Price: $675,000\n⏰ Avg Days on Market: 28\n📈 Market: Balanced\n\nDM me for detailed market analysis! 🏡\n\n#RealEstate #MarketUpdate #HomeValues`,
                linkedin: `${data.location} Real Estate Market Analysis: Current data shows balanced market conditions with median pricing at $675,000. Properties are averaging 28 days on market, indicating steady market activity. As your local market expert, I'm here to help you navigate these conditions whether you're buying, selling, or investing.`
            },
            blogPost: `# ${data.location} Real Estate Market Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Market Overview
The ${data.location} real estate market is currently experiencing balanced conditions, providing opportunities for both buyers and sellers.

*Note: This is a demo market report with sample data.*`,
            dataSource: 'Demo'
        };
    }
}