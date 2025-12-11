/**
 * Listing Campaign Service with MLS Grid Integration
 * Enhances new listing campaigns with real market data and competitive analysis
 */

import { MLSGridService } from './mls-grid-service';

interface ListingProperty {
    address: string;
    city: string;
    state: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    propertyType: string;
    features: string[];
    description?: string;
}

interface ListingCampaignData {
    property: ListingProperty;
    campaignType: 'launch' | 'price_reduction' | 'open_house' | 'just_listed';
    targetAudience: 'local_buyers' | 'investors' | 'relocators' | 'first_time_buyers';
    marketingChannels: ('social_media' | 'email' | 'print' | 'digital_ads')[];
}

interface CompetitiveAnalysis {
    similarListings: Array<{
        address: string;
        price: number;
        beds: number;
        baths: number;
        sqft: number;
        daysOnMarket: number;
        pricePerSqft: number;
    }>;
    marketPosition: 'below_market' | 'at_market' | 'above_market';
    pricingRecommendation: string;
    competitiveAdvantages: string[];
}

interface ListingCampaignOutput {
    competitiveAnalysis: CompetitiveAnalysis;
    marketingCopy: {
        headline: string;
        description: string;
        keyFeatures: string[];
        callToAction: string;
    };
    socialMediaContent: {
        facebook: string;
        instagram: string;
        linkedin: string;
        twitter: string;
    };
    emailCampaign: {
        subject: string;
        body: string;
    };
    printAd: string;
    marketingStrategy: string[];
    dataSource: 'MLS Grid' | 'Demo';
}

export class ListingCampaignService {
    private mlsService: MLSGridService;

    constructor() {
        this.mlsService = new MLSGridService();
    }

    /**
     * Generate comprehensive listing campaign with competitive analysis
     */
    async generateListingCampaign(data: ListingCampaignData): Promise<ListingCampaignOutput> {
        try {
            console.log(`Generating listing campaign for ${data.property.address}`);

            // Get competitive analysis using MLS data
            const competitiveAnalysis = await this.getCompetitiveAnalysis(data.property);

            // Generate marketing copy based on competitive position
            const marketingCopy = this.generateMarketingCopy(data.property, competitiveAnalysis, data.campaignType);

            // Create social media content
            const socialMediaContent = this.generateSocialMediaContent(data.property, marketingCopy, data.campaignType);

            // Generate email campaign
            const emailCampaign = this.generateEmailCampaign(data.property, marketingCopy, competitiveAnalysis);

            // Create print ad copy
            const printAd = this.generatePrintAd(data.property, marketingCopy);

            // Develop marketing strategy
            const marketingStrategy = this.generateMarketingStrategy(data, competitiveAnalysis);

            return {
                competitiveAnalysis,
                marketingCopy,
                socialMediaContent,
                emailCampaign,
                printAd,
                marketingStrategy,
                dataSource: competitiveAnalysis.similarListings.length > 0 ? 'MLS Grid' : 'Demo'
            };

        } catch (error) {
            console.error('Error generating listing campaign:', error);
            return this.getDemoListingCampaign(data);
        }
    }

    /**
     * Get competitive analysis using MLS Grid data
     */
    private async getCompetitiveAnalysis(property: ListingProperty): Promise<CompetitiveAnalysis> {
        try {
            // Search for similar active listings
            const similarListings = await this.mlsService.searchActiveProperties(
                property.city,
                property.state,
                Math.round(property.price * 0.8), // 20% below
                Math.round(property.price * 1.2), // 20% above
                Math.max(1, property.beds - 1),
                property.beds + 1,
                Math.max(1, property.baths - 1),
                property.baths + 1,
                property.propertyType,
                10 // limit to 10 similar properties
            );

            // Transform to competitive analysis format
            const competitors = similarListings
                .filter(listing => listing.ListingId !== property.address) // Exclude the subject property
                .map(listing => ({
                    address: listing.UnparsedAddress,
                    price: listing.ListPrice,
                    beds: listing.BedroomsTotal || 0,
                    baths: listing.BathroomsTotalInteger || 0,
                    sqft: listing.LivingArea || 0,
                    daysOnMarket: 15, // Simplified - would need actual DOM data
                    pricePerSqft: listing.LivingArea ? Math.round(listing.ListPrice / listing.LivingArea) : 0
                }))
                .slice(0, 5); // Top 5 competitors

            // Determine market position
            let marketPosition: 'below_market' | 'at_market' | 'above_market' = 'at_market';
            if (competitors.length > 0) {
                const avgPrice = competitors.reduce((sum, comp) => sum + comp.price, 0) / competitors.length;
                const avgPricePerSqft = competitors
                    .filter(comp => comp.sqft > 0)
                    .reduce((sum, comp) => sum + comp.pricePerSqft, 0) / competitors.filter(comp => comp.sqft > 0).length;

                const propertyPricePerSqft = property.sqft > 0 ? property.price / property.sqft : 0;

                if (propertyPricePerSqft < avgPricePerSqft * 0.95) {
                    marketPosition = 'below_market';
                } else if (propertyPricePerSqft > avgPricePerSqft * 1.05) {
                    marketPosition = 'above_market';
                }
            }

            // Generate pricing recommendation
            const pricingRecommendation = this.generatePricingRecommendation(property, competitors, marketPosition);

            // Identify competitive advantages
            const competitiveAdvantages = this.identifyCompetitiveAdvantages(property, competitors);

            return {
                similarListings: competitors,
                marketPosition,
                pricingRecommendation,
                competitiveAdvantages
            };

        } catch (error) {
            console.error('Error getting competitive analysis:', error);

            // Return basic analysis
            return {
                similarListings: [],
                marketPosition: 'at_market',
                pricingRecommendation: 'Property is competitively priced for the current market.',
                competitiveAdvantages: ['Unique features and location', 'Professional marketing presentation']
            };
        }
    }

    private generatePricingRecommendation(property: ListingProperty, competitors: any[], position: string): string {
        if (competitors.length === 0) {
            return 'Property is competitively priced for the current market conditions.';
        }

        switch (position) {
            case 'below_market':
                return 'Property is priced below market average, which should generate strong buyer interest and potentially multiple offers.';
            case 'above_market':
                return 'Property is priced above market average. Consider highlighting unique features and premium amenities to justify the premium pricing.';
            default:
                return 'Property is priced competitively within market range, positioning it well for current market conditions.';
        }
    }

    private identifyCompetitiveAdvantages(property: ListingProperty, competitors: any[]): string[] {
        const advantages = [];

        // Price advantage
        if (competitors.length > 0) {
            const avgPrice = competitors.reduce((sum, comp) => sum + comp.price, 0) / competitors.length;
            if (property.price < avgPrice) {
                advantages.push(`Priced $${Math.round(avgPrice - property.price).toLocaleString()} below average for similar properties`);
            }
        }

        // Size advantage
        if (competitors.length > 0) {
            const avgSqft = competitors.reduce((sum, comp) => sum + comp.sqft, 0) / competitors.length;
            if (property.sqft > avgSqft) {
                advantages.push(`${Math.round(property.sqft - avgSqft)} more square feet than average`);
            }
        }

        // Feature advantages
        if (property.features.length > 0) {
            advantages.push(...property.features.slice(0, 3).map(feature => `${feature}`));
        }

        // Default advantages if none found
        if (advantages.length === 0) {
            advantages.push('Prime location in desirable neighborhood');
            advantages.push('Professional marketing and presentation');
        }

        return advantages.slice(0, 4); // Limit to top 4 advantages
    }

    private generateMarketingCopy(property: ListingProperty, analysis: CompetitiveAnalysis, campaignType: string): any {
        const priceStr = `$${property.price.toLocaleString()}`;
        const bedsStr = property.beds > 0 ? `${property.beds} bed` : '';
        const bathsStr = property.baths > 0 ? `${property.baths} bath` : '';
        const sqftStr = property.sqft > 0 ? `${property.sqft.toLocaleString()} sqft` : '';

        // Generate headline based on campaign type and competitive position
        let headline = '';
        switch (campaignType) {
            case 'just_listed':
                headline = `Just Listed: ${bedsStr}/${bathsStr} ${property.propertyType} in ${property.city}`;
                break;
            case 'price_reduction':
                headline = `Price Reduced: ${bedsStr}/${bathsStr} ${property.propertyType} Now ${priceStr}`;
                break;
            case 'open_house':
                headline = `Open House: Beautiful ${bedsStr}/${bathsStr} ${property.propertyType}`;
                break;
            default:
                headline = `${bedsStr}/${bathsStr} ${property.propertyType} in ${property.city} - ${priceStr}`;
        }

        // Generate description highlighting competitive advantages
        const description = `${property.description || `Beautiful ${property.propertyType.toLowerCase()} featuring ${property.beds} bedrooms and ${property.baths} bathrooms in ${sqftStr}.`} ${analysis.competitiveAdvantages.slice(0, 2).join('. ')}.`;

        // Key features from competitive advantages
        const keyFeatures = analysis.competitiveAdvantages.slice(0, 4);

        // Call to action based on market position
        let callToAction = '';
        if (analysis.marketPosition === 'below_market') {
            callToAction = 'Schedule your showing today - this won\'t last long at this price!';
        } else if (analysis.marketPosition === 'above_market') {
            callToAction = 'Experience the premium features that set this property apart.';
        } else {
            callToAction = 'Contact us today to schedule your private showing.';
        }

        return {
            headline,
            description,
            keyFeatures,
            callToAction
        };
    }

    private generateSocialMediaContent(property: ListingProperty, marketingCopy: any, campaignType: string): any {
        const priceStr = `$${property.price.toLocaleString()}`;
        const locationTag = property.city.replace(/[^a-zA-Z]/g, '');

        return {
            facebook: `🏠 ${marketingCopy.headline}\n\n${marketingCopy.description}\n\n✨ Key Features:\n${marketingCopy.keyFeatures.map((f: string) => `• ${f}`).join('\n')}\n\n${marketingCopy.callToAction}\n\n#JustListed #${locationTag}RealEstate #NewListing`,

            instagram: `🏡 ${campaignType === 'just_listed' ? 'JUST LISTED' : campaignType === 'price_reduction' ? 'PRICE REDUCED' : 'NEW LISTING'} 🏡\n\n📍 ${property.city}, ${property.state}\n💰 ${priceStr}\n🛏️ ${property.beds}bd | 🛁 ${property.baths}ba | 📐 ${property.sqft.toLocaleString()}sqft\n\n${marketingCopy.keyFeatures.slice(0, 3).map((f: string) => `✨ ${f}`).join('\n')}\n\nDM for details! 📲\n\n#JustListed #${locationTag}Homes #RealEstate #NewListing #DreamHome`,

            linkedin: `New Listing Alert: ${marketingCopy.headline}\n\nI'm excited to present this exceptional ${property.propertyType.toLowerCase()} in ${property.city}. ${marketingCopy.description}\n\nKey highlights include ${marketingCopy.keyFeatures.slice(0, 2).join(' and ')}.\n\n${marketingCopy.callToAction} Feel free to reach out with any questions.\n\n#RealEstate #${locationTag}Properties #NewListing`,

            twitter: `🏠 ${campaignType === 'just_listed' ? 'JUST LISTED' : 'NEW LISTING'}: ${property.beds}bd/${property.baths}ba in ${property.city} for ${priceStr}. ${marketingCopy.keyFeatures[0]}. ${marketingCopy.callToAction} #RealEstate #${locationTag}`
        };
    }

    private generateEmailCampaign(property: ListingProperty, marketingCopy: any, analysis: CompetitiveAnalysis): any {
        const subject = `New Listing: ${property.beds}bd/${property.baths}ba ${property.propertyType} in ${property.city}`;

        const body = `Dear Valued Client,

I'm excited to share a new listing that just hit the market in ${property.city}!

${marketingCopy.headline}

${marketingCopy.description}

Key Features:
${marketingCopy.keyFeatures.map((f: string) => `• ${f}`).join('\n')}

Market Position:
${analysis.pricingRecommendation}

${marketingCopy.callToAction}

I'd be happy to arrange a private showing or provide additional information about this property and the local market.

Best regards,
[Your Name]
[Your Contact Information]

P.S. Properties in this area are ${analysis.marketPosition === 'below_market' ? 'moving quickly' : analysis.marketPosition === 'above_market' ? 'offering premium value' : 'competitively positioned'} - let me know if you'd like to see it soon!`;

        return { subject, body };
    }

    private generatePrintAd(property: ListingProperty, marketingCopy: any): string {
        return `${marketingCopy.headline}

${marketingCopy.description}

${marketingCopy.keyFeatures.slice(0, 3).map((f: string) => `• ${f}`).join('\n')}

$${property.price.toLocaleString()}

${marketingCopy.callToAction}

[Your Name] | [Phone] | [Email]
[Brokerage Name]`;
    }

    private generateMarketingStrategy(data: ListingCampaignData, analysis: CompetitiveAnalysis): string[] {
        const strategy = [];

        // Pricing strategy
        if (analysis.marketPosition === 'below_market') {
            strategy.push('Leverage competitive pricing to generate multiple offers and create urgency');
            strategy.push('Schedule open houses and private showings within the first week');
        } else if (analysis.marketPosition === 'above_market') {
            strategy.push('Focus on premium features and unique selling points to justify pricing');
            strategy.push('Target qualified buyers who appreciate luxury and quality');
        } else {
            strategy.push('Maintain competitive positioning while highlighting unique features');
        }

        // Channel strategy based on target audience
        if (data.targetAudience === 'first_time_buyers') {
            strategy.push('Emphasize affordability, financing options, and move-in ready features');
            strategy.push('Use social media heavily to reach younger demographics');
        } else if (data.targetAudience === 'investors') {
            strategy.push('Highlight rental potential, ROI, and market appreciation trends');
            strategy.push('Focus on LinkedIn and professional networks');
        } else if (data.targetAudience === 'relocators') {
            strategy.push('Emphasize neighborhood amenities, schools, and community features');
            strategy.push('Partner with relocation services and corporate contacts');
        }

        // Marketing channel optimization
        if (data.marketingChannels.includes('social_media')) {
            strategy.push('Launch coordinated social media campaign across all platforms within 24 hours');
        }
        if (data.marketingChannels.includes('email')) {
            strategy.push('Send targeted email campaigns to segmented buyer lists');
        }

        // Competitive strategy
        if (analysis.similarListings.length > 3) {
            strategy.push('Monitor competitor pricing and adjust marketing message to highlight advantages');
        }

        return strategy;
    }

    private getDemoListingCampaign(data: ListingCampaignData): ListingCampaignOutput {
        const property = data.property;

        return {
            competitiveAnalysis: {
                similarListings: [
                    {
                        address: '456 Similar Street',
                        price: property.price + 25000,
                        beds: property.beds,
                        baths: property.baths,
                        sqft: property.sqft - 100,
                        daysOnMarket: 22,
                        pricePerSqft: Math.round((property.price + 25000) / (property.sqft - 100))
                    }
                ],
                marketPosition: 'below_market',
                pricingRecommendation: 'Property is priced competitively below market average, positioning it well for quick sale.',
                competitiveAdvantages: [
                    'Excellent value for the price point',
                    'Move-in ready condition',
                    'Desirable neighborhood location',
                    'Professional marketing presentation'
                ]
            },
            marketingCopy: {
                headline: `Just Listed: ${property.beds}bd/${property.baths}ba ${property.propertyType} in ${property.city}`,
                description: `Beautiful ${property.propertyType.toLowerCase()} featuring ${property.beds} bedrooms and ${property.baths} bathrooms in ${property.sqft.toLocaleString()} sqft. Excellent value for the price point.`,
                keyFeatures: [
                    'Excellent value for the price point',
                    'Move-in ready condition',
                    'Desirable neighborhood location',
                    'Professional marketing presentation'
                ],
                callToAction: 'Schedule your showing today - this won\'t last long at this price!'
            },
            socialMediaContent: {
                facebook: `🏠 Just Listed: ${property.beds}bd/${property.baths}ba ${property.propertyType} in ${property.city} - Demo Content`,
                instagram: `🏡 JUST LISTED 🏡\n📍 ${property.city}, ${property.state}\n💰 $${property.price.toLocaleString()} - Demo Content`,
                linkedin: `New Listing Alert: Beautiful ${property.propertyType} in ${property.city} - Demo Content`,
                twitter: `🏠 JUST LISTED: ${property.beds}bd/${property.baths}ba in ${property.city} - Demo Content`
            },
            emailCampaign: {
                subject: `New Listing: ${property.beds}bd/${property.baths}ba ${property.propertyType} in ${property.city}`,
                body: 'Demo email campaign content...'
            },
            printAd: `Demo print ad for ${property.address}...`,
            marketingStrategy: [
                'Leverage competitive pricing to generate interest',
                'Focus on social media marketing for broad reach',
                'Schedule open houses within first week',
                'Target local buyer database with email campaigns'
            ],
            dataSource: 'Demo'
        };
    }
}