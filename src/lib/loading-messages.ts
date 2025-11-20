/**
 * Contextual loading messages for AI generation
 * Provides engaging, personality-driven feedback during content creation
 */

export const LOADING_MESSAGES = {
    // Blog Post Generation
    blogPost: [
        'Researching your topic...',
        'Crafting an engaging headline...',
        'Writing compelling content...',
        'Adding SEO optimization...',
        'Polishing the final draft...',
    ],

    // Social Media Content
    socialMedia: [
        'Analyzing trending topics...',
        'Crafting scroll-stopping content...',
        'Optimizing for engagement...',
        'Adding the perfect hook...',
        'Almost ready to post...',
    ],

    // Listing Descriptions
    listingDescription: [
        'Analyzing property features...',
        'Highlighting unique selling points...',
        'Crafting compelling descriptions...',
        'Adding emotional appeal...',
        'Perfecting the final touches...',
    ],

    // Market Updates
    marketUpdate: [
        'Analyzing market data...',
        'Identifying key trends...',
        'Crafting insights...',
        'Adding local context...',
        'Finalizing your update...',
    ],

    // Video Scripts
    videoScript: [
        'Structuring your narrative...',
        'Writing engaging dialogue...',
        'Adding visual cues...',
        'Optimizing pacing...',
        'Polishing the script...',
    ],

    // Neighborhood Guides
    neighborhoodGuide: [
        'Researching local amenities...',
        'Highlighting community features...',
        'Crafting neighborhood stories...',
        'Adding lifestyle insights...',
        'Finalizing your guide...',
    ],

    // Research Reports
    research: [
        'Gathering market intelligence...',
        'Analyzing data sources...',
        'Synthesizing insights...',
        'Building your report...',
        'Adding final recommendations...',
    ],

    // Marketing Strategy
    strategy: [
        'Analyzing your brand position...',
        'Identifying opportunities...',
        'Crafting strategic recommendations...',
        'Building your action plan...',
        'Finalizing your strategy...',
    ],

    // Competitor Analysis
    competitors: [
        'Discovering competitors...',
        'Analyzing market positioning...',
        'Identifying differentiators...',
        'Building competitive insights...',
        'Finalizing your analysis...',
    ],

    // Image Processing
    imageProcessing: [
        'Analyzing your image...',
        'Applying AI enhancements...',
        'Optimizing quality...',
        'Rendering final result...',
        'Almost done...',
    ],

    // Generic/Default
    default: [
        'Analyzing your request...',
        'Crafting compelling content...',
        'Optimizing for quality...',
        'Polishing the details...',
        'Almost there...',
    ],
} as const;

export type LoadingMessageType = keyof typeof LOADING_MESSAGES;

/**
 * Get contextual loading messages for a specific content type
 */
export function getLoadingMessages(type: LoadingMessageType = 'default'): readonly string[] {
    return LOADING_MESSAGES[type] || LOADING_MESSAGES.default;
}

/**
 * Get a random loading message from a specific type
 */
export function getRandomLoadingMessage(type: LoadingMessageType = 'default'): string {
    const messages = getLoadingMessages(type);
    return messages[Math.floor(Math.random() * messages.length)];
}
