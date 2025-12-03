/**
 * Website Analysis Recommendation Generation
 * 
 * Functions for generating actionable recommendations from website analysis findings,
 * including prioritization, code snippets, and impact estimation.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type {
    Recommendation,
    SchemaMarkup,
    MetaTags,
    NAPConsistency,
    ScoreBreakdown,
} from '@/ai/schemas/website-analysis-schemas';
import { validateSchemaMarkup, type SchemaValidationResult } from './website-analysis-validation';

// ==================== Types ====================

/**
 * Analysis findings used to generate recommendations
 */
export interface AnalysisFindings {
    schemaMarkup: SchemaMarkup;
    metaTags: MetaTags;
    napConsistency: NAPConsistency;
    scoreBreakdown: ScoreBreakdown;
    websiteUrl: string;
    profileData: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

/**
 * Recommendation priority levels with impact thresholds
 */
export const PRIORITY_THRESHOLDS = {
    HIGH: 10, // Impact >= 10 points
    MEDIUM: 5, // Impact >= 5 points
    LOW: 0, // Impact < 5 points
} as const;

// ==================== Main Functions ====================

/**
 * Generate all recommendations from analysis findings
 * 
 * Analyzes findings and generates prioritized, actionable recommendations
 * for improving website optimization.
 * 
 * @param findings - Analysis findings
 * @returns Array of recommendations sorted by priority and impact
 * 
 * @example
 * const recommendations = generateRecommendations(findings);
 * // Returns: [{ id: '1', priority: 'high', ... }, ...]
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function generateRecommendations(findings: AnalysisFindings): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Generate schema markup recommendations
    recommendations.push(...generateSchemaRecommendations(findings));

    // Generate meta tag recommendations
    recommendations.push(...generateMetaTagRecommendations(findings));

    // Generate NAP consistency recommendations
    recommendations.push(...generateNAPRecommendations(findings));

    // Generate structured data recommendations
    recommendations.push(...generateStructuredDataRecommendations(findings));

    // Sort by priority (high -> medium -> low) and then by impact (highest first)
    return sortRecommendationsByPriority(recommendations);
}

// ==================== Schema Markup Recommendations ====================

/**
 * Generate schema markup recommendations
 * 
 * @param findings - Analysis findings
 * @returns Array of schema-related recommendations
 * 
 * Requirements: 5.1, 5.2, 5.4
 */
function generateSchemaRecommendations(findings: AnalysisFindings): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { schemaMarkup, profileData, websiteUrl } = findings;

    // No schema markup found
    if (!schemaMarkup.found) {
        recommendations.push({
            id: generateRecommendationId('schema', 'missing'),
            priority: 'high',
            category: 'schema_markup',
            title: 'Add Schema.org Markup',
            description: 'Your website is missing schema.org structured data markup. Adding schema markup helps AI search engines understand your business information and improves your visibility in AI-powered search results.',
            actionItems: [
                'Add Person or RealEstateAgent schema to your homepage',
                'Include LocalBusiness schema with your business details',
                'Add structured data for your contact information',
                'Validate your schema using Google\'s Rich Results Test',
            ],
            codeSnippet: generatePersonSchemaSnippet(profileData),
            estimatedImpact: 25,
            effort: 'moderate',
        });
        return recommendations;
    }

    // Missing recommended schema types
    const hasPersonOrAgent = schemaMarkup.types.includes('Person') || schemaMarkup.types.includes('RealEstateAgent');
    const hasLocalBusiness = schemaMarkup.types.includes('LocalBusiness');

    if (!hasPersonOrAgent) {
        recommendations.push({
            id: generateRecommendationId('schema', 'person'),
            priority: 'high',
            category: 'schema_markup',
            title: 'Add Person/RealEstateAgent Schema',
            description: 'Adding Person or RealEstateAgent schema helps AI systems understand that you are a real estate professional. This is critical for appearing in AI-powered search results for real estate queries.',
            actionItems: [
                'Add Person or RealEstateAgent schema to your homepage',
                'Include your name, photo, job title, and contact information',
                'Link to your social media profiles',
                'Add your professional credentials and specializations',
            ],
            codeSnippet: generatePersonSchemaSnippet(profileData),
            estimatedImpact: 15,
            effort: 'moderate',
        });
    }

    if (!hasLocalBusiness) {
        recommendations.push({
            id: generateRecommendationId('schema', 'business'),
            priority: 'high',
            category: 'schema_markup',
            title: 'Add LocalBusiness Schema',
            description: 'LocalBusiness schema helps AI systems understand your business location and service area. This is essential for local search visibility.',
            actionItems: [
                'Add LocalBusiness schema with your business address',
                'Include business hours and service areas',
                'Add your business phone number and email',
                'Include a link to your website',
            ],
            codeSnippet: generateLocalBusinessSchemaSnippet(profileData, websiteUrl),
            estimatedImpact: 12,
            effort: 'moderate',
        });
    }

    // Schema validation issues
    if (schemaMarkup.issues.length > 0) {
        const validationResults = schemaMarkup.types.map(type =>
            validateSchemaMarkup({ '@type': type, ...schemaMarkup.properties })
        );

        const hasErrors = validationResults.some(r => r.errors.length > 0);
        const missingProperties = validationResults.flatMap(r => r.missingRecommended);

        if (hasErrors || missingProperties.length > 0) {
            recommendations.push({
                id: generateRecommendationId('schema', 'validation'),
                priority: 'medium',
                category: 'schema_markup',
                title: 'Fix Schema Validation Issues',
                description: 'Your schema markup has validation errors or is missing recommended properties. Fixing these issues will improve how AI systems interpret your data.',
                actionItems: [
                    'Review and fix schema validation errors',
                    'Add missing recommended properties',
                    'Ensure all required fields are populated',
                    'Test your schema with Google\'s Rich Results Test',
                ],
                codeSnippet: generateSchemaFixSnippet(schemaMarkup, missingProperties),
                estimatedImpact: 8,
                effort: 'easy',
            });
        }
    }

    return recommendations;
}

// ==================== Meta Tag Recommendations ====================

/**
 * Generate meta tag recommendations
 * 
 * @param findings - Analysis findings
 * @returns Array of meta tag recommendations
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
function generateMetaTagRecommendations(findings: AnalysisFindings): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { metaTags, profileData } = findings;

    // Title tag issues
    if (!metaTags.title.isOptimal) {
        const impact = metaTags.title.length === 0 ? 12 : 6;
        const priority = impact >= PRIORITY_THRESHOLDS.HIGH ? 'high' : 'medium';

        recommendations.push({
            id: generateRecommendationId('meta', 'title'),
            priority,
            category: 'meta_tags',
            title: metaTags.title.length === 0 ? 'Add Title Tag' : 'Optimize Title Tag',
            description: metaTags.title.issues.join(' ') + ' The title tag is one of the most important elements for AI search engines to understand your page content.',
            actionItems: [
                'Create a descriptive title between 30-60 characters',
                'Include your name and primary keywords',
                'Make it compelling and click-worthy',
                'Ensure it accurately describes your page content',
            ],
            codeSnippet: generateTitleTagSnippet(profileData.name),
            estimatedImpact: impact,
            effort: 'easy',
        });
    }

    // Meta description issues
    if (!metaTags.description.isOptimal) {
        const impact = metaTags.description.length === 0 ? 10 : 5;
        const priority = impact >= PRIORITY_THRESHOLDS.HIGH ? 'high' : 'medium';

        recommendations.push({
            id: generateRecommendationId('meta', 'description'),
            priority,
            category: 'meta_tags',
            title: metaTags.description.length === 0 ? 'Add Meta Description' : 'Optimize Meta Description',
            description: metaTags.description.issues.join(' ') + ' A well-crafted meta description helps AI systems understand your page and can improve click-through rates.',
            actionItems: [
                'Write a compelling description between 120-160 characters',
                'Include your unique value proposition',
                'Add a call-to-action',
                'Use natural language that appeals to your target audience',
            ],
            codeSnippet: generateMetaDescriptionSnippet(profileData.name),
            estimatedImpact: impact,
            effort: 'easy',
        });
    }

    // Open Graph tags missing
    if (!metaTags.openGraph.found) {
        recommendations.push({
            id: generateRecommendationId('meta', 'opengraph'),
            priority: 'medium',
            category: 'meta_tags',
            title: 'Add Open Graph Tags',
            description: 'Open Graph tags control how your website appears when shared on social media and are increasingly used by AI systems to understand content context.',
            actionItems: [
                'Add og:title, og:description, and og:image tags',
                'Include og:type as "website" or "profile"',
                'Add og:url with your canonical URL',
                'Use high-quality images (1200x630px recommended)',
            ],
            codeSnippet: generateOpenGraphSnippet(profileData.name, findings.websiteUrl),
            estimatedImpact: 6,
            effort: 'easy',
        });
    }

    // Twitter Card tags missing
    if (!metaTags.twitterCard.found) {
        recommendations.push({
            id: generateRecommendationId('meta', 'twitter'),
            priority: 'low',
            category: 'meta_tags',
            title: 'Add Twitter Card Tags',
            description: 'Twitter Card tags enhance how your content appears on Twitter/X and provide additional context for AI systems.',
            actionItems: [
                'Add twitter:card, twitter:title, and twitter:description',
                'Include twitter:image for visual appeal',
                'Add twitter:site with your Twitter handle if applicable',
                'Use "summary_large_image" card type for best results',
            ],
            codeSnippet: generateTwitterCardSnippet(profileData.name),
            estimatedImpact: 4,
            effort: 'easy',
        });
    }

    return recommendations;
}

// ==================== NAP Consistency Recommendations ====================

/**
 * Generate NAP consistency recommendations
 * 
 * @param findings - Analysis findings
 * @returns Array of NAP-related recommendations
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
function generateNAPRecommendations(findings: AnalysisFindings): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { napConsistency } = findings;

    // Name inconsistency
    if (!napConsistency.name.matches && napConsistency.name.found) {
        recommendations.push({
            id: generateRecommendationId('nap', 'name'),
            priority: 'high',
            category: 'nap_consistency',
            title: 'Fix Business Name Inconsistency',
            description: `Your website shows "${napConsistency.name.found}" but your profile has a different name. Consistent business names across all platforms are critical for AI search engines to correctly identify and recommend your business.`,
            actionItems: [
                'Update your website to match your profile name exactly',
                'Ensure the name appears consistently on all pages',
                'Update schema markup with the correct name',
                'Verify the name matches your business listings',
            ],
            estimatedImpact: 10,
            effort: 'easy',
        });
    }

    // Address inconsistency
    if (!napConsistency.address.matches && napConsistency.address.found) {
        recommendations.push({
            id: generateRecommendationId('nap', 'address'),
            priority: 'high',
            category: 'nap_consistency',
            title: 'Fix Address Inconsistency',
            description: `Your website shows "${napConsistency.address.found}" but your profile has a different address. Consistent addresses are essential for local search visibility and AI recommendations.`,
            actionItems: [
                'Update your website to match your profile address exactly',
                'Use the same address format everywhere',
                'Update schema markup with the correct address',
                'Verify the address matches Google Business Profile',
            ],
            estimatedImpact: 10,
            effort: 'easy',
        });
    }

    // Phone inconsistency
    if (!napConsistency.phone.matches && napConsistency.phone.found) {
        recommendations.push({
            id: generateRecommendationId('nap', 'phone'),
            priority: 'medium',
            category: 'nap_consistency',
            title: 'Fix Phone Number Inconsistency',
            description: `Your website shows "${napConsistency.phone.found}" but your profile has a different phone number. Consistent contact information helps AI systems connect your online presence.`,
            actionItems: [
                'Update your website to match your profile phone number',
                'Use the same phone format everywhere (e.g., (555) 123-4567)',
                'Update schema markup with the correct phone',
                'Ensure the number is clickable (tel: link)',
            ],
            estimatedImpact: 6,
            effort: 'easy',
        });
    }

    // Low overall NAP consistency
    if (napConsistency.overallConsistency < 70) {
        recommendations.push({
            id: generateRecommendationId('nap', 'overall'),
            priority: 'high',
            category: 'nap_consistency',
            title: 'Improve NAP Consistency',
            description: 'Your business information (Name, Address, Phone) has inconsistencies across your website. This confuses AI search engines and can hurt your local search visibility.',
            actionItems: [
                'Audit all pages for NAP information',
                'Standardize the format of your business information',
                'Update footer, contact page, and about page',
                'Add consistent NAP to schema markup',
            ],
            estimatedImpact: 12,
            effort: 'moderate',
        });
    }

    return recommendations;
}

// ==================== Structured Data Recommendations ====================

/**
 * Generate structured data recommendations
 * 
 * @param findings - Analysis findings
 * @returns Array of structured data recommendations
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
function generateStructuredDataRecommendations(findings: AnalysisFindings): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { schemaMarkup, profileData } = findings;

    // Missing contact information in schema
    const hasEmail = schemaMarkup.properties.email || schemaMarkup.properties.contactPoint;
    const hasTelephone = schemaMarkup.properties.telephone || schemaMarkup.properties.phone;
    const hasImage = schemaMarkup.properties.image || schemaMarkup.properties.logo;

    if (!hasEmail && profileData.email) {
        recommendations.push({
            id: generateRecommendationId('structured', 'email'),
            priority: 'medium',
            category: 'structured_data',
            title: 'Add Email to Schema Markup',
            description: 'Including your email address in schema markup makes it easier for AI systems to provide contact information to potential clients.',
            actionItems: [
                'Add email property to your Person/RealEstateAgent schema',
                'Ensure the email matches your profile',
                'Consider adding a ContactPoint schema for additional contact methods',
            ],
            codeSnippet: generateContactSchemaSnippet(profileData),
            estimatedImpact: 4,
            effort: 'easy',
        });
    }

    if (!hasTelephone && profileData.phone) {
        recommendations.push({
            id: generateRecommendationId('structured', 'phone'),
            priority: 'medium',
            category: 'structured_data',
            title: 'Add Phone to Schema Markup',
            description: 'Including your phone number in schema markup helps AI systems provide accurate contact information.',
            actionItems: [
                'Add telephone property to your schema',
                'Use E.164 format (e.g., +1-555-123-4567)',
                'Ensure the phone matches your profile',
            ],
            codeSnippet: generateContactSchemaSnippet(profileData),
            estimatedImpact: 4,
            effort: 'easy',
        });
    }

    if (!hasImage) {
        recommendations.push({
            id: generateRecommendationId('structured', 'image'),
            priority: 'low',
            category: 'structured_data',
            title: 'Add Professional Photo to Schema',
            description: 'Including a professional photo in your schema markup helps AI systems create richer, more engaging results.',
            actionItems: [
                'Add image property with a URL to your professional headshot',
                'Use a high-quality image (at least 400x400px)',
                'Ensure the image is publicly accessible',
                'Consider adding multiple images for different contexts',
            ],
            codeSnippet: generateImageSchemaSnippet(),
            estimatedImpact: 3,
            effort: 'easy',
        });
    }

    return recommendations;
}

// ==================== Prioritization ====================

/**
 * Sort recommendations by priority and impact
 * 
 * High priority recommendations come first, followed by medium and low.
 * Within each priority level, recommendations are sorted by estimated impact (highest first).
 * 
 * @param recommendations - Array of recommendations to sort
 * @returns Sorted array of recommendations
 * 
 * Requirements: 5.1, 5.2
 */
export function sortRecommendationsByPriority(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return [...recommendations].sort((a, b) => {
        // First sort by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then sort by impact (highest first)
        return b.estimatedImpact - a.estimatedImpact;
    });
}

/**
 * Determine recommendation priority based on estimated impact
 * 
 * @param estimatedImpact - Estimated score improvement (0-30)
 * @returns Priority level
 * 
 * Requirements: 5.1, 5.2
 */
export function determinePriority(estimatedImpact: number): 'high' | 'medium' | 'low' {
    if (estimatedImpact >= PRIORITY_THRESHOLDS.HIGH) return 'high';
    if (estimatedImpact >= PRIORITY_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
}

// ==================== Code Snippet Generation ====================

/**
 * Generate Person/RealEstateAgent schema code snippet
 * 
 * @param profileData - User profile data
 * @returns JSON-LD code snippet
 * 
 * Requirements: 5.4
 */
function generatePersonSchemaSnippet(profileData: { name: string; email?: string; phone?: string; address?: string }): string {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: profileData.name,
        ...(profileData.email && { email: profileData.email }),
        ...(profileData.phone && { telephone: profileData.phone }),
        ...(profileData.address && {
            address: {
                '@type': 'PostalAddress',
                streetAddress: profileData.address,
            },
        }),
        jobTitle: 'Real Estate Agent',
        // Add placeholders for additional properties
        image: 'https://example.com/your-photo.jpg',
        url: 'https://example.com',
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Generate LocalBusiness schema code snippet
 * 
 * @param profileData - User profile data
 * @param websiteUrl - Website URL
 * @returns JSON-LD code snippet
 * 
 * Requirements: 5.4
 */
function generateLocalBusinessSchemaSnippet(
    profileData: { name: string; address?: string; phone?: string; email?: string },
    websiteUrl: string
): string {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `${profileData.name} Real Estate`,
        ...(profileData.address && {
            address: {
                '@type': 'PostalAddress',
                streetAddress: profileData.address,
            },
        }),
        ...(profileData.phone && { telephone: profileData.phone }),
        ...(profileData.email && { email: profileData.email }),
        url: websiteUrl,
        // Add placeholders for additional properties
        priceRange: '$$',
        openingHours: 'Mo-Fr 09:00-17:00',
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Generate schema fix snippet showing missing properties
 * 
 * @param schemaMarkup - Current schema markup
 * @param missingProperties - Array of missing property names
 * @returns JSON-LD code snippet
 * 
 * Requirements: 5.4
 */
function generateSchemaFixSnippet(schemaMarkup: SchemaMarkup, missingProperties: string[]): string {
    const schema = {
        '@context': 'https://schema.org',
        '@type': schemaMarkup.types[0] || 'Person',
        ...schemaMarkup.properties,
        // Add missing properties as placeholders
        ...Object.fromEntries(
            missingProperties.map(prop => [prop, `[Add your ${prop}]`])
        ),
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Generate title tag code snippet
 * 
 * @param name - Agent name
 * @returns HTML title tag
 * 
 * Requirements: 5.4
 */
function generateTitleTagSnippet(name: string): string {
    return `<title>${name} - Real Estate Agent | [Your City]</title>`;
}

/**
 * Generate meta description code snippet
 * 
 * @param name - Agent name
 * @returns HTML meta description tag
 * 
 * Requirements: 5.4
 */
function generateMetaDescriptionSnippet(name: string): string {
    const description = `${name} is a trusted real estate agent specializing in [your specialty]. Contact me today to buy, sell, or invest in [your area].`;
    return `<meta name="description" content="${description}" />`;
}

/**
 * Generate Open Graph tags code snippet
 * 
 * @param name - Agent name
 * @param websiteUrl - Website URL
 * @returns HTML Open Graph meta tags
 * 
 * Requirements: 5.4
 */
function generateOpenGraphSnippet(name: string, websiteUrl: string): string {
    return `<meta property="og:title" content="${name} - Real Estate Agent" />
<meta property="og:description" content="Trusted real estate services in [your area]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${websiteUrl}" />
<meta property="og:image" content="${websiteUrl}/og-image.jpg" />`;
}

/**
 * Generate Twitter Card tags code snippet
 * 
 * @param name - Agent name
 * @returns HTML Twitter Card meta tags
 * 
 * Requirements: 5.4
 */
function generateTwitterCardSnippet(name: string): string {
    return `<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${name} - Real Estate Agent" />
<meta name="twitter:description" content="Trusted real estate services in [your area]" />
<meta name="twitter:image" content="https://example.com/twitter-image.jpg" />`;
}

/**
 * Generate contact information schema snippet
 * 
 * @param profileData - User profile data
 * @returns JSON-LD code snippet
 * 
 * Requirements: 5.4
 */
function generateContactSchemaSnippet(profileData: { email?: string; phone?: string }): string {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        contactPoint: {
            '@type': 'ContactPoint',
            ...(profileData.email && { email: profileData.email }),
            ...(profileData.phone && { telephone: profileData.phone }),
            contactType: 'customer service',
        },
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Generate image schema snippet
 * 
 * @returns JSON-LD code snippet
 * 
 * Requirements: 5.4
 */
function generateImageSchemaSnippet(): string {
    return `"image": "https://example.com/your-professional-photo.jpg"`;
}

// ==================== Impact Estimation ====================

/**
 * Estimate score impact for a recommendation
 * 
 * Calculates how many points the overall score could improve
 * if the recommendation is implemented.
 * 
 * @param category - Recommendation category
 * @param currentScore - Current component score
 * @param maxScore - Maximum possible component score
 * @returns Estimated score improvement (0-30)
 * 
 * Requirements: 5.5
 */
export function estimateScoreImpact(
    category: Recommendation['category'],
    currentScore: number,
    maxScore: number
): number {
    // Calculate potential improvement in component score
    const potentialImprovement = maxScore - currentScore;

    // Weight by category importance
    const categoryWeights = {
        schema_markup: 0.30,
        meta_tags: 0.25,
        structured_data: 0.25,
        nap_consistency: 0.20,
        technical_seo: 0.15,
    };

    const weight = categoryWeights[category] || 0.15;

    // Estimate impact on overall score
    const estimatedImpact = Math.round(potentialImprovement * weight);

    // Cap at 30 (maximum possible impact)
    return Math.min(30, Math.max(0, estimatedImpact));
}

/**
 * Calculate total potential score improvement
 * 
 * Sums up the estimated impact of all recommendations.
 * Note: This is an optimistic estimate as some improvements may overlap.
 * 
 * @param recommendations - Array of recommendations
 * @returns Total potential score improvement
 * 
 * Requirements: 5.5
 */
export function calculateTotalPotentialImprovement(recommendations: Recommendation[]): number {
    const total = recommendations.reduce((sum, rec) => sum + rec.estimatedImpact, 0);
    // Cap at 100 since that's the maximum score
    return Math.min(100, total);
}

// ==================== Helper Functions ====================

/**
 * Generate unique recommendation ID
 * 
 * @param category - Category prefix
 * @param type - Type suffix
 * @returns Unique ID string
 */
function generateRecommendationId(category: string, type: string): string {
    return `${category}-${type}-${Date.now()}`;
}

/**
 * Get recommendation count by priority
 * 
 * @param recommendations - Array of recommendations
 * @returns Object with counts for each priority level
 * 
 * @example
 * const counts = getRecommendationCountsByPriority(recommendations);
 * // Returns: { high: 3, medium: 5, low: 2 }
 */
export function getRecommendationCountsByPriority(recommendations: Recommendation[]): {
    high: number;
    medium: number;
    low: number;
} {
    return {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length,
    };
}

/**
 * Get recommendations by category
 * 
 * @param recommendations - Array of recommendations
 * @param category - Category to filter by
 * @returns Filtered recommendations
 */
export function getRecommendationsByCategory(
    recommendations: Recommendation[],
    category: Recommendation['category']
): Recommendation[] {
    return recommendations.filter(r => r.category === category);
}

/**
 * Format effort level for display
 * 
 * @param effort - Effort level
 * @returns Formatted effort string
 */
export function formatEffort(effort: Recommendation['effort']): string {
    const effortMap = {
        easy: 'Easy (< 1 hour)',
        moderate: 'Moderate (1-3 hours)',
        difficult: 'Difficult (> 3 hours)',
    };
    return effortMap[effort];
}

/**
 * Get priority badge color
 * 
 * @param priority - Priority level
 * @returns Tailwind color class
 */
export function getPriorityColor(priority: Recommendation['priority']): string {
    const colorMap = {
        high: 'red',
        medium: 'yellow',
        low: 'blue',
    };
    return colorMap[priority];
}
