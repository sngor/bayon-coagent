/**
 * Specialization Factory
 * 
 * Helper functions for creating different types of specialized strands.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import type {
    SpecializationConfig,
    MarketSpecialization,
    AgentSpecificSpecialization,
    ContentTypeSpecialization,
    GeographicSpecialization,
} from './types';

/**
 * Create a market-specific specialization configuration
 * Requirement 3.1
 */
export function createMarketSpecialization(
    marketData: MarketSpecialization
): SpecializationConfig {
    const expertise: string[] = [
        `${marketData.marketType}-market`,
        ...marketData.propertyTypes.map(type => `${type}-properties`),
        ...marketData.expertise,
    ];

    return {
        type: 'market',
        domain: marketData.marketType,
        expertise,
        trainingData: [marketData],
        metadata: {
            priceRange: marketData.priceRange,
            propertyTypes: marketData.propertyTypes,
            marketKnowledge: marketData.marketKnowledge,
        },
    };
}

/**
 * Create an agent-specific specialization configuration
 * Requirement 3.2
 */
export function createAgentSpecificSpecialization(
    agentData: AgentSpecificSpecialization
): SpecializationConfig {
    const expertise: string[] = [
        'agent-style-matching',
        'personalized-content',
        `${agentData.stylePreferences.tone}-tone`,
    ];

    return {
        type: 'agent',
        domain: agentData.agentId,
        expertise,
        trainingData: [agentData],
        metadata: {
            stylePreferences: agentData.stylePreferences,
            contentPatterns: agentData.contentPatterns,
            performanceHistory: agentData.performanceHistory,
        },
    };
}

/**
 * Create a content-type specialization configuration
 * Requirement 3.3
 */
export function createContentTypeSpecialization(
    contentData: ContentTypeSpecialization
): SpecializationConfig {
    const expertise: string[] = [
        `${contentData.contentType}-creation`,
        `${contentData.format}-formatting`,
        ...contentData.bestPractices.map(practice => practice.toLowerCase().replace(/\s+/g, '-')),
    ];

    return {
        type: 'content-type',
        domain: contentData.contentType,
        expertise,
        trainingData: [contentData],
        metadata: {
            format: contentData.format,
            bestPractices: contentData.bestPractices,
            templates: contentData.templates,
            optimizationRules: contentData.optimizationRules,
        },
    };
}

/**
 * Create a geographic specialization configuration
 * Requirement 3.4
 */
export function createGeographicSpecialization(
    geoData: GeographicSpecialization
): SpecializationConfig {
    const expertise: string[] = [
        `${geoData.region}-market`,
        'local-market-knowledge',
        ...geoData.localKnowledge.neighborhoods.map(n => `${n}-neighborhood`),
    ];

    return {
        type: 'geographic',
        domain: geoData.region,
        expertise,
        trainingData: [geoData],
        metadata: {
            localKnowledge: geoData.localKnowledge,
            regionalPreferences: geoData.regionalPreferences,
        },
    };
}

/**
 * Predefined market specializations for common real estate markets
 */
export const PREDEFINED_MARKET_SPECIALIZATIONS: Record<string, MarketSpecialization> = {
    luxury: {
        marketType: 'luxury',
        priceRange: { min: 1000000, max: 50000000 },
        propertyTypes: ['single-family', 'estate', 'penthouse', 'waterfront'],
        expertise: [
            'high-end-marketing',
            'luxury-amenities',
            'exclusive-listings',
            'affluent-buyer-psychology',
        ],
        marketKnowledge: {
            targetAudience: 'high-net-worth individuals',
            keyFeatures: ['privacy', 'exclusivity', 'premium-finishes', 'smart-home'],
            marketingChannels: ['private-networks', 'luxury-publications', 'exclusive-events'],
        },
    },
    'first-time-buyers': {
        marketType: 'first-time-buyers',
        priceRange: { min: 150000, max: 400000 },
        propertyTypes: ['condo', 'townhouse', 'starter-home'],
        expertise: [
            'first-time-buyer-education',
            'financing-guidance',
            'move-in-ready-properties',
            'budget-conscious-marketing',
        ],
        marketKnowledge: {
            targetAudience: 'millennials and young families',
            keyFeatures: ['affordability', 'low-maintenance', 'good-schools', 'commute-friendly'],
            marketingChannels: ['social-media', 'online-listings', 'first-time-buyer-seminars'],
        },
    },
    investment: {
        marketType: 'investment',
        priceRange: { min: 100000, max: 5000000 },
        propertyTypes: ['multi-family', 'commercial', 'rental-property', 'fix-and-flip'],
        expertise: [
            'roi-analysis',
            'cash-flow-projections',
            'market-appreciation',
            'property-management',
        ],
        marketKnowledge: {
            targetAudience: 'real estate investors',
            keyFeatures: ['cap-rate', 'rental-income', 'appreciation-potential', 'tax-benefits'],
            marketingChannels: ['investor-networks', 'real-estate-forums', 'investment-clubs'],
        },
    },
    commercial: {
        marketType: 'commercial',
        priceRange: { min: 500000, max: 100000000 },
        propertyTypes: ['office', 'retail', 'industrial', 'mixed-use'],
        expertise: [
            'commercial-leasing',
            'tenant-analysis',
            'zoning-regulations',
            'commercial-financing',
        ],
        marketKnowledge: {
            targetAudience: 'business owners and commercial investors',
            keyFeatures: ['location', 'foot-traffic', 'parking', 'accessibility'],
            marketingChannels: ['commercial-brokers', 'business-networks', 'industry-publications'],
        },
    },
};

/**
 * Predefined content-type specializations
 */
export const PREDEFINED_CONTENT_SPECIALIZATIONS: Record<string, ContentTypeSpecialization> = {
    'blog-post': {
        contentType: 'blog-post',
        format: 'long-form',
        bestPractices: [
            'SEO optimization',
            'engaging headlines',
            'clear structure with subheadings',
            'actionable takeaways',
            'internal linking',
        ],
        templates: ['how-to', 'listicle', 'market-update', 'neighborhood-guide'],
        optimizationRules: {
            minWords: 800,
            maxWords: 2000,
            headingLevels: ['h1', 'h2', 'h3'],
            includeImages: true,
            includeCTA: true,
        },
    },
    'social-media': {
        contentType: 'social-media',
        format: 'short-form',
        bestPractices: [
            'attention-grabbing hooks',
            'platform-specific formatting',
            'hashtag optimization',
            'visual content',
            'engagement prompts',
        ],
        templates: ['property-showcase', 'market-tip', 'testimonial', 'behind-the-scenes'],
        optimizationRules: {
            maxCharacters: { twitter: 280, facebook: 500, instagram: 2200, linkedin: 3000 },
            hashtagCount: { min: 3, max: 10 },
            includeEmoji: true,
            includeCTA: true,
        },
    },
    'listing-description': {
        contentType: 'listing-description',
        format: 'structured',
        bestPractices: [
            'highlight key features',
            'emotional appeal',
            'accurate details',
            'neighborhood context',
            'call-to-action',
        ],
        templates: ['luxury-listing', 'family-home', 'investment-property', 'condo-listing'],
        optimizationRules: {
            minWords: 150,
            maxWords: 500,
            sections: ['overview', 'features', 'location', 'call-to-action'],
            includeSpecs: true,
        },
    },
    email: {
        contentType: 'email',
        format: 'structured',
        bestPractices: [
            'compelling subject line',
            'personalization',
            'clear value proposition',
            'single call-to-action',
            'mobile-friendly',
        ],
        templates: ['newsletter', 'listing-alert', 'market-update', 'follow-up'],
        optimizationRules: {
            subjectLineMaxChars: 50,
            preheaderMaxChars: 100,
            bodyMaxWords: 300,
            singleCTA: true,
        },
    },
};

/**
 * Helper to get or create a market specialization
 */
export function getMarketSpecialization(marketType: string): SpecializationConfig {
    const predefined = PREDEFINED_MARKET_SPECIALIZATIONS[marketType];
    if (predefined) {
        return createMarketSpecialization(predefined);
    }

    // Create a basic specialization for unknown market types
    return createMarketSpecialization({
        marketType,
        propertyTypes: ['residential'],
        expertise: [`${marketType}-market`],
        marketKnowledge: {},
    });
}

/**
 * Helper to get or create a content-type specialization
 */
export function getContentTypeSpecialization(contentType: string): SpecializationConfig {
    const predefined = PREDEFINED_CONTENT_SPECIALIZATIONS[contentType];
    if (predefined) {
        return createContentTypeSpecialization(predefined);
    }

    // Create a basic specialization for unknown content types
    return createContentTypeSpecialization({
        contentType,
        format: 'standard',
        bestPractices: ['clear communication', 'audience-appropriate'],
        templates: [],
        optimizationRules: {},
    });
}
