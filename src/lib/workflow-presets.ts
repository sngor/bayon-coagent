/**
 * Workflow Preset Definitions
 * 
 * This file contains the static configuration for all workflow presets.
 * Each preset defines a multi-step guided workflow that helps users
 * accomplish complex tasks across multiple hubs.
 */

import { WorkflowPreset, WorkflowCategory } from '@/types/workflows';

/**
 * Launch Your Brand Workflow
 * 
 * Helps new agents build their online presence from the ground up.
 * Takes users through profile setup, brand audit, competitor analysis,
 * and strategy generation.
 */
export const LAUNCH_YOUR_BRAND: WorkflowPreset = {
    id: 'launch-your-brand',
    title: 'Launch Your Brand',
    description: 'Build your online presence from the ground up',
    category: WorkflowCategory.BRAND_BUILDING,
    tags: ['onboarding', 'brand', 'profile', 'strategy'],
    estimatedMinutes: 45,
    isRecommended: true,
    icon: 'Rocket',
    outcomes: [
        'Complete professional profile',
        'NAP consistency audit',
        'Competitor analysis',
        'Personalized marketing strategy'
    ],
    steps: [
        {
            id: 'profile-setup',
            title: 'Set Up Your Profile',
            description: 'Create your professional profile with business details',
            hubRoute: '/brand/profile',
            estimatedMinutes: 15,
            isOptional: false,
            helpText: 'Your profile is the foundation of your online presence',
            tips: [
                'Use a professional headshot',
                'Include all contact information',
                'Highlight your unique value proposition'
            ],
            completionCriteria: 'Profile saved with required fields',
            contextOutputs: ['profileData']
        },
        {
            id: 'brand-audit',
            title: 'Audit Your Presence',
            description: 'Check NAP consistency and import reviews',
            hubRoute: '/brand/audit',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Ensure your business information is consistent everywhere',
            tips: [
                'Fix any inconsistencies immediately',
                'Connect your Google Business Profile'
            ],
            completionCriteria: 'Audit completed',
            contextInputs: ['profileData'],
            contextOutputs: ['auditResults']
        },
        {
            id: 'competitor-analysis',
            title: 'Analyze Competitors',
            description: 'Discover and track your main competitors',
            hubRoute: '/brand/competitors',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Know who you\'re competing against',
            tips: [
                'Add 3-5 main competitors',
                'Set up keyword tracking'
            ],
            completionCriteria: 'At least one competitor added',
            contextInputs: ['profileData'],
            contextOutputs: ['competitors']
        },
        {
            id: 'strategy-generation',
            title: 'Generate Your Strategy',
            description: 'Get a personalized 3-step marketing plan',
            hubRoute: '/brand/strategy',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Your AI-powered roadmap to success',
            tips: [
                'Review all three steps carefully',
                'Save the strategy for reference'
            ],
            completionCriteria: 'Strategy generated and saved',
            contextInputs: ['profileData', 'auditResults', 'competitors'],
            contextOutputs: ['strategy']
        }
    ]
};

/**
 * Market Update Post Workflow
 * 
 * Guides users through creating content based on current market trends.
 * Includes market analysis, research, blog post creation, and social media variants.
 */
export const MARKET_UPDATE_POST: WorkflowPreset = {
    id: 'market-update-post',
    title: 'Market Update Post',
    description: 'Create content based on current market trends',
    category: WorkflowCategory.CONTENT_CREATION,
    tags: ['content', 'market', 'blog', 'social'],
    estimatedMinutes: 30,
    isRecommended: false,
    icon: 'TrendingUp',
    outcomes: [
        'Market trend analysis',
        'Research-backed insights',
        'Blog post draft',
        'Social media variants'
    ],
    steps: [
        {
            id: 'market-insights',
            title: 'Analyze Market Trends',
            description: 'Review current market data and trends',
            hubRoute: '/market/insights?tab=trends',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Identify the most relevant trends for your audience',
            tips: [
                'Look for surprising or counterintuitive data',
                'Focus on local market trends'
            ],
            completionCriteria: 'Trend data selected',
            contextOutputs: ['trendData']
        },
        {
            id: 'research-query',
            title: 'Deep Dive Research',
            description: 'Get AI-powered research on the trend',
            hubRoute: '/research/agent',
            estimatedMinutes: 5,
            isOptional: true,
            helpText: 'Add depth and credibility to your content',
            tips: [
                'Ask specific questions about the trend',
                'Request statistics and data points'
            ],
            completionCriteria: 'Research report generated',
            contextInputs: ['trendData'],
            contextOutputs: ['researchReport']
        },
        {
            id: 'blog-post',
            title: 'Write Blog Post',
            description: 'Generate a blog post about the market trend',
            hubRoute: '/studio/write?type=blog',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Turn data into engaging content',
            tips: [
                'Include specific data points',
                'Add a clear call-to-action'
            ],
            completionCriteria: 'Blog post generated and saved',
            contextInputs: ['trendData', 'researchReport'],
            contextOutputs: ['blogPost']
        },
        {
            id: 'social-variants',
            title: 'Create Social Posts',
            description: 'Generate social media versions of your content',
            hubRoute: '/studio/write?type=social',
            estimatedMinutes: 5,
            isOptional: true,
            helpText: 'Maximize reach across platforms',
            tips: [
                'Customize for each platform',
                'Include relevant hashtags'
            ],
            completionCriteria: 'Social posts generated',
            contextInputs: ['blogPost', 'trendData'],
            contextOutputs: ['socialPosts']
        }
    ]
};

/**
 * New Listing Campaign Workflow
 * 
 * Comprehensive marketing workflow for new property listings.
 * Covers property details, listing description, image enhancement,
 * and social media campaign creation.
 */
export const NEW_LISTING_CAMPAIGN: WorkflowPreset = {
    id: 'new-listing-campaign',
    title: 'New Listing Campaign',
    description: 'Create comprehensive marketing for a new property',
    category: WorkflowCategory.CONTENT_CREATION,
    tags: ['listing', 'content', 'images', 'social'],
    estimatedMinutes: 40,
    isRecommended: false,
    icon: 'Home',
    outcomes: [
        'Professional listing description',
        'Enhanced property photos',
        'Social media campaign',
        'All content saved to Library'
    ],
    steps: [
        {
            id: 'property-details',
            title: 'Enter Property Details',
            description: 'Provide key information about the listing',
            hubRoute: '/studio/describe',
            estimatedMinutes: 5,
            isOptional: false,
            helpText: 'Accurate details lead to better descriptions',
            tips: [
                'Include unique features',
                'Note recent upgrades',
                'Mention neighborhood highlights'
            ],
            completionCriteria: 'Property details entered',
            contextOutputs: ['propertyDetails']
        },
        {
            id: 'listing-description',
            title: 'Generate Description',
            description: 'Create a compelling listing description',
            hubRoute: '/studio/describe',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Great descriptions sell homes faster',
            tips: [
                'Choose the right persona',
                'Review and edit the output',
                'Highlight lifestyle benefits'
            ],
            completionCriteria: 'Description generated and saved',
            contextInputs: ['propertyDetails'],
            contextOutputs: ['listingDescription']
        },
        {
            id: 'enhance-images',
            title: 'Enhance Photos',
            description: 'Improve property photos with AI',
            hubRoute: '/studio/reimagine',
            estimatedMinutes: 15,
            isOptional: false,
            helpText: 'Professional photos get more views',
            tips: [
                'Try virtual staging for empty rooms',
                'Use day-to-dusk for exterior shots',
                'Enhance lighting and colors'
            ],
            completionCriteria: 'At least one image enhanced',
            contextInputs: ['propertyDetails'],
            contextOutputs: ['enhancedImages']
        },
        {
            id: 'social-campaign',
            title: 'Create Social Campaign',
            description: 'Generate social media posts for the listing',
            hubRoute: '/studio/write?type=social',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Promote your listing across all channels',
            tips: [
                'Create platform-specific variants',
                'Include property highlights',
                'Add a strong call-to-action'
            ],
            completionCriteria: 'Social posts generated',
            contextInputs: ['propertyDetails', 'listingDescription', 'enhancedImages'],
            contextOutputs: ['socialCampaign']
        }
    ]
};

/**
 * Competitive Positioning Workflow
 * 
 * Helps agents understand their market position and differentiate.
 * Includes competitor discovery, keyword tracking, gap analysis,
 * and content strategy development.
 */
export const COMPETITIVE_POSITIONING: WorkflowPreset = {
    id: 'competitive-positioning',
    title: 'Competitive Positioning',
    description: 'Understand your market position and differentiate',
    category: WorkflowCategory.MARKET_ANALYSIS,
    tags: ['competitors', 'keywords', 'strategy', 'seo'],
    estimatedMinutes: 35,
    isRecommended: false,
    icon: 'Target',
    outcomes: [
        'Competitor profiles',
        'Keyword tracking setup',
        'Gap analysis',
        'Differentiation strategy'
    ],
    steps: [
        {
            id: 'discover-competitors',
            title: 'Discover Competitors',
            description: 'Find and add your main competitors',
            hubRoute: '/brand/competitors',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Know who you\'re up against',
            tips: [
                'Add 3-5 direct competitors',
                'Include both established and emerging agents',
                'Look at different market segments'
            ],
            completionCriteria: 'At least 3 competitors added',
            contextOutputs: ['competitors']
        },
        {
            id: 'keyword-tracking',
            title: 'Set Up Keyword Tracking',
            description: 'Track your Google rankings vs competitors',
            hubRoute: '/brand/competitors?tab=keywords',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Monitor your search visibility',
            tips: [
                'Include location-based keywords',
                'Track both broad and specific terms',
                'Monitor branded keywords'
            ],
            completionCriteria: 'Keywords configured',
            contextInputs: ['competitors'],
            contextOutputs: ['keywords', 'rankings']
        },
        {
            id: 'gap-analysis',
            title: 'Analyze Gaps',
            description: 'Identify opportunities where competitors are weak',
            hubRoute: '/brand/competitors?tab=analysis',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Find your competitive advantage',
            tips: [
                'Look for underserved niches',
                'Identify content gaps',
                'Note service differentiators'
            ],
            completionCriteria: 'Gap analysis completed',
            contextInputs: ['competitors', 'keywords', 'rankings'],
            contextOutputs: ['gaps']
        },
        {
            id: 'content-strategy',
            title: 'Build Content Strategy',
            description: 'Create a plan to fill the gaps',
            hubRoute: '/brand/strategy',
            estimatedMinutes: 5,
            isOptional: false,
            helpText: 'Turn insights into action',
            tips: [
                'Prioritize high-impact opportunities',
                'Focus on your strengths',
                'Create a content calendar'
            ],
            completionCriteria: 'Strategy generated',
            contextInputs: ['competitors', 'gaps', 'keywords'],
            contextOutputs: ['contentStrategy']
        }
    ]
};

/**
 * All workflow presets in a single array for easy access
 */
export const ALL_WORKFLOW_PRESETS: WorkflowPreset[] = [
    LAUNCH_YOUR_BRAND,
    MARKET_UPDATE_POST,
    NEW_LISTING_CAMPAIGN,
    COMPETITIVE_POSITIONING,
];

/**
 * Map of workflow preset IDs to preset objects for quick lookup
 */
export const WORKFLOW_PRESETS_BY_ID: Record<string, WorkflowPreset> = {
    [LAUNCH_YOUR_BRAND.id]: LAUNCH_YOUR_BRAND,
    [MARKET_UPDATE_POST.id]: MARKET_UPDATE_POST,
    [NEW_LISTING_CAMPAIGN.id]: NEW_LISTING_CAMPAIGN,
    [COMPETITIVE_POSITIONING.id]: COMPETITIVE_POSITIONING,
};

/**
 * Get workflow presets by category
 */
export function getPresetsByCategory(category: WorkflowCategory): WorkflowPreset[] {
    return ALL_WORKFLOW_PRESETS.filter(preset => preset.category === category);
}

/**
 * Get recommended workflow presets
 */
export function getRecommendedPresets(): WorkflowPreset[] {
    return ALL_WORKFLOW_PRESETS.filter(preset => preset.isRecommended);
}

/**
 * Search workflow presets by query (matches title, description, or tags)
 */
export function searchPresets(query: string): WorkflowPreset[] {
    const lowerQuery = query.toLowerCase();
    return ALL_WORKFLOW_PRESETS.filter(preset =>
        preset.title.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery) ||
        preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}
