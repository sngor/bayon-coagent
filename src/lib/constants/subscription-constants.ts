/**
 * Subscription Management Constants
 */

export const SUBSCRIPTION_CONSTANTS = {
    LOADING_TIMEOUT: 10000, // 10 seconds
    USAGE_THRESHOLDS: {
        NEAR_LIMIT: 80, // 80% of limit
        AT_LIMIT: 100,  // 100% of limit
    },
    TRIAL_USAGE_LIMITS: {
        AI_CONTENT_GENERATION: { used: 12, limit: 100 },
        IMAGE_ENHANCEMENTS: { used: 5, limit: 50 },
        RESEARCH_REPORTS: { used: 3, limit: 20 },
        MARKETING_PLANS: { used: 2, limit: 10 },
        AI_ROLE_PLAY_SESSIONS: { used: 6, limit: 25 },
        AI_LEARNING_PLANS: { used: 1, limit: 5 },
    },
    FREE_TIER_USAGE_LIMITS: {
        AI_CONTENT_GENERATION: { used: 8, limit: 10 },
        IMAGE_ENHANCEMENTS: { used: 2, limit: 5 },
        RESEARCH_REPORTS: { used: 1, limit: 3 },
        MARKETING_PLANS: { used: 0, limit: 1 },
        AI_ROLE_PLAY_SESSIONS: { used: 2, limit: 3 },
        AI_LEARNING_PLANS: { used: 1, limit: 1 },
    },
} as const;

export const FEATURE_NAMES = {
    AI_CONTENT_GENERATION: 'AI Content Generation',
    IMAGE_ENHANCEMENTS: 'Image Enhancements',
    RESEARCH_REPORTS: 'Research Reports',
    MARKETING_PLANS: 'Marketing Plans',
    AI_ROLE_PLAY_SESSIONS: 'AI Role-Play Sessions',
    AI_LEARNING_PLANS: 'AI Learning Plans',
} as const;

export const SUBSCRIPTION_MESSAGES = {
    TRIAL_UPGRADE_TITLE: 'Enjoying your trial?',
    TRIAL_UPGRADE_DESCRIPTION: 'Continue with a paid plan to keep these professional features and Learning hub access after your trial ends.',
    FREE_TIER_UPGRADE_TITLE: 'Upgrade to unlock unlimited usage',
    FREE_TIER_UPGRADE_DESCRIPTION: 'Premium plans include unlimited AI content generation, image enhancements, research reports, and full Learning hub access with AI role-play sessions.',
    SUBSCRIPTION_ACTIVATED: 'Your subscription has been successfully activated.',
    SUBSCRIPTION_CANCELED: 'Your subscription will remain active until the end of your billing period.',
} as const;