/**
 * Intelligent Empty States Utility
 * 
 * Provides helper functions to generate contextual empty states with:
 * - Smart recommendations based on user state
 * - Profile completion guidance
 * - Prerequisite checking
 * - Contextual tips
 * 
 * Requirements: 27.2, 27.4, 27.7
 */

import type { Profile } from '@/lib/types';
import type { 
    SmartRecommendation, 
    ProfileCompletionStatus 
} from '@/components/ui/empty-states';

// ============================================================================
// Profile Completion Helpers
// ============================================================================

interface ProfileField {
    key: keyof Profile;
    label: string;
    benefit: string;
    required: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
    { key: 'name', label: 'Full Name', benefit: 'Personalizes your marketing content', required: true },
    { key: 'agencyName', label: 'Agency Name', benefit: 'Builds your brand identity', required: true },
    { key: 'phone', label: 'Phone Number', benefit: 'Enables NAP consistency checks', required: true },
    { key: 'address', label: 'Business Address', benefit: 'Powers local SEO features', required: true },
    { key: 'bio', label: 'Professional Bio', benefit: 'Enhances your E-E-A-T profile', required: true },
    { key: 'yearsOfExperience', label: 'Years of Experience', benefit: 'Demonstrates expertise', required: false },
    { key: 'licenseNumber', label: 'License Number', benefit: 'Builds trust and credibility', required: false },
    { key: 'website', label: 'Website URL', benefit: 'Improves online presence', required: false },
    { key: 'photoURL', label: 'Profile Photo', benefit: 'Makes your content more personal', required: false },
];

/**
 * Calculate profile completion status
 * Requirement 27.4: Guide users to complete their profile
 */
export function calculateProfileCompletion(
    profile: Partial<Profile> | null | undefined
): ProfileCompletionStatus {
    if (!profile) {
        return {
            percentage: 0,
            isComplete: false,
            hasRequiredFields: false,
            missingFields: PROFILE_FIELDS,
            nextField: PROFILE_FIELDS[0],
        };
    }

    const completed = PROFILE_FIELDS.filter((field) => {
        const value = profile[field.key];
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
    });

    const requiredFields = PROFILE_FIELDS.filter((f) => f.required);
    const completedRequired = completed.filter((f) => f.required);
    const missingFields = PROFILE_FIELDS.filter((field) => {
        const value = profile[field.key];
        if (Array.isArray(value)) {
            return value.length === 0;
        }
        return value === undefined || value === null || value === '';
    });

    const percentage = Math.round((completed.length / PROFILE_FIELDS.length) * 100);
    const isComplete = percentage === 100;
    const hasRequiredFields = completedRequired.length === requiredFields.length;

    return {
        percentage,
        isComplete,
        hasRequiredFields,
        missingFields,
        nextField: missingFields[0],
    };
}

// ============================================================================
// Smart Recommendations Generator
// ============================================================================

export interface UserContext {
    profile: Partial<Profile> | null;
    hasMarketingPlan: boolean;
    hasBrandAudit: boolean;
    hasCompetitors: boolean;
    hasContent: boolean;
    currentPage: string;
}

/**
 * Generate smart recommendations based on user context
 * Requirement 27.2: Highlight actionable insights and opportunities
 */
export function generateSmartRecommendations(
    context: UserContext
): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const profileCompletion = calculateProfileCompletion(context.profile);

    // Priority 1: Complete profile if required fields are missing
    if (!profileCompletion.hasRequiredFields) {
        recommendations.push({
            id: 'complete-profile',
            title: 'Complete Your Profile',
            description: 'Fill in required fields to unlock AI-powered features',
            href: '/profile',
            priority: 'high',
            estimatedTime: '5 min',
            prerequisitesMet: true,
        });
        return recommendations; // Return early - this is blocking
    }

    // Priority 2: Generate marketing plan if none exists
    if (!context.hasMarketingPlan) {
        recommendations.push({
            id: 'generate-marketing-plan',
            title: 'Generate Marketing Plan',
            description: 'Create a personalized 3-step marketing strategy',
            href: '/marketing-plan',
            priority: 'high',
            estimatedTime: '2 min',
            prerequisitesMet: true,
        });
    }

    // Priority 3: Run brand audit if none exists
    if (!context.hasBrandAudit) {
        recommendations.push({
            id: 'run-brand-audit',
            title: 'Run Brand Audit',
            description: 'Check your NAP consistency across the web',
            href: '/brand-audit',
            priority: 'high',
            estimatedTime: '3 min',
            prerequisitesMet: true,
        });
    }

    // Priority 4: Find competitors if none exist
    if (!context.hasCompetitors) {
        recommendations.push({
            id: 'analyze-competitors',
            title: 'Analyze Competitors',
            description: 'Discover and analyze your local competition',
            href: '/competitive-analysis',
            priority: 'medium',
            estimatedTime: '5 min',
            prerequisitesMet: true,
        });
    }

    // Priority 5: Create content if none exists
    if (!context.hasContent) {
        recommendations.push({
            id: 'create-content',
            title: 'Create Your First Content',
            description: 'Generate blog posts, social media content, and more',
            href: '/content-engine',
            priority: 'medium',
            estimatedTime: '3 min',
            prerequisitesMet: true,
        });
    }

    // Priority 6: Enhance profile if not complete
    if (!profileCompletion.isComplete) {
        recommendations.push({
            id: 'enhance-profile',
            title: 'Enhance Your Profile',
            description: 'Add optional fields to maximize your marketing potential',
            href: '/profile',
            priority: 'low',
            estimatedTime: '10 min',
            prerequisitesMet: true,
        });
    }

    return recommendations;
}

// ============================================================================
// Contextual Tips Generator
// ============================================================================

/**
 * Generate contextual tips based on page and user state
 * Requirement 27.7: Use progressive disclosure to reduce cognitive load
 */
export function generateContextualTips(context: UserContext): string[] {
    const page = context.currentPage;
    const profileCompletion = calculateProfileCompletion(context.profile);

    const tipsByPage: Record<string, string[]> = {
        '/dashboard': [
            'Check your profile completion status to unlock all features',
            'Review suggested next steps to maximize your marketing impact',
            'Monitor your brand score and review sentiment',
        ],
        '/marketing-plan': [
            'Your marketing plan will be tailored to your market and experience',
            'Each step includes actionable tasks and tool recommendations',
            'Plans are generated in under 2 minutes',
        ],
        '/brand-audit': [
            'Ensure your NAP information is accurate in your profile',
            'Fix any inconsistencies to improve local SEO',
            'Import reviews to analyze sentiment and identify themes',
        ],
        '/competitive-analysis': [
            'AI will find competitors based on your location',
            'Compare metrics like reviews, ratings, and domain authority',
            'Track keyword rankings to monitor your position',
        ],
        '/content-engine': [
            'Generate blog posts, social media content, and more',
            'All content is saved to your library automatically',
            'Provide specific details for more personalized content',
        ],
        '/research-agent': [
            'Be specific with your research topic for better results',
            'The AI will search the web and synthesize findings',
            'Save reports to your knowledge base for future reference',
        ],
        '/profile': [
            'Required fields are marked with an asterisk (*)',
            'A complete profile enables all AI features',
            'Your information is used to personalize generated content',
        ],
    };

    const tips = tipsByPage[page] || [];

    // Add profile-specific tips if incomplete
    if (!profileCompletion.hasRequiredFields) {
        tips.unshift('Complete your profile to unlock all AI-powered features');
    }

    return tips;
}

// ============================================================================
// Page-Specific Empty State Configurations
// ============================================================================

/**
 * Get empty state configuration for a specific page
 * Combines recommendations, tips, and profile status
 */
export function getEmptyStateConfig(context: UserContext) {
    const recommendations = generateSmartRecommendations(context);
    const tips = generateContextualTips(context);
    const profileCompletion = calculateProfileCompletion(context.profile);

    return {
        recommendations,
        tips,
        profileCompletion: !profileCompletion.hasRequiredFields ? profileCompletion : undefined,
    };
}

/**
 * Check if a feature is accessible based on prerequisites
 */
export function checkFeatureAccess(
    featureId: string,
    context: UserContext
): { canAccess: boolean; reason?: string; prerequisites?: Array<{ description: string; met: boolean }> } {
    const profileCompletion = calculateProfileCompletion(context.profile);

    const featureRequirements: Record<string, {
        requiresProfile: boolean;
        requiresOther?: Array<{ id: string; description: string; check: (ctx: UserContext) => boolean }>;
    }> = {
        'marketing-plan': { requiresProfile: true },
        'brand-audit': { requiresProfile: true },
        'competitive-analysis': { requiresProfile: true },
        'track-rankings': {
            requiresProfile: false,
            requiresOther: [
                {
                    id: 'has-competitors',
                    description: 'You must have analyzed competitors first',
                    check: (ctx) => ctx.hasCompetitors,
                },
            ],
        },
        'schedule-content': {
            requiresProfile: false,
            requiresOther: [
                {
                    id: 'has-content',
                    description: 'You must have created content first',
                    check: (ctx) => ctx.hasContent,
                },
            ],
        },
    };

    const requirements = featureRequirements[featureId];
    if (!requirements) {
        return { canAccess: true };
    }

    // Check profile requirement
    if (requirements.requiresProfile && !profileCompletion.hasRequiredFields) {
        return {
            canAccess: false,
            reason: 'Please complete your profile to access this feature',
            prerequisites: profileCompletion.missingFields
                .filter(f => f.required)
                .map(f => ({ description: f.label, met: false })),
        };
    }

    // Check other requirements
    if (requirements.requiresOther) {
        const unmetPrereqs = requirements.requiresOther.filter(req => !req.check(context));
        if (unmetPrereqs.length > 0) {
            return {
                canAccess: false,
                reason: 'Some prerequisites are not met',
                prerequisites: unmetPrereqs.map(req => ({ description: req.description, met: false })),
            };
        }
    }

    return { canAccess: true };
}
