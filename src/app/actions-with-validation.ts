'use server';

/**
 * Server Actions with Enhanced Validation
 * 
 * Example of how to integrate the enhanced validation agent with content generation.
 * Shows validation scores for goal alignment, social media, and SEO.
 */

import { generateBlogPost } from '@/aws/bedrock/flows/generate-blog-post';
import { generateSocialMediaPost } from '@/aws/bedrock/flows/generate-social-media-post';
import { getValidationAgent, type ValidationConfig, type ValidationResult } from '@/aws/bedrock/validation-agent-enhanced';
import type { GenerateBlogPostInput } from '@/ai/schemas/blog-post-schemas';

/**
 * Response with validation scores
 */
export interface ContentWithValidation<T> {
    content: T;
    validation: ValidationResult;
}

/**
 * Generates a blog post with comprehensive validation scoring
 */
export async function generateBlogPostWithScores(
    input: GenerateBlogPostInput
): Promise<ContentWithValidation<{ blogPost: string; headerImage: string | null; sources?: any[] }>> {
    // 1. Generate the blog post
    const result = await generateBlogPost(input);

    // 2. Validate with enhanced scoring
    const validator = getValidationAgent();

    const validationConfig: ValidationConfig = {
        validateGoalAlignment: true,
        userGoal: `Generate an engaging, SEO-optimized blog post about: ${input.topic}`,
        minQualityScore: 75,
        checkCompleteness: true,
        checkCoherence: true,
        checkProfessionalism: true,
        enforceGuardrails: true,
        checkDomainCompliance: true,
        checkEthicalCompliance: true,
        expectedFormat: 'markdown',
        minLength: 500,
        requiredElements: ['introduction', 'conclusion'],
        checkFactualConsistency: true,
        checkToneAndStyle: true,
        targetAudience: 'real estate agents and their clients',
        validateSocialMedia: true, // Enable social media scoring
        validateSEO: true, // Enable SEO scoring
        contentType: 'blog',
        targetKeywords: [input.topic, 'real estate'], // Extract keywords from topic
        strictMode: false,
    };

    const validation = await validator.validate(result.blogPost, validationConfig);

    // 3. Log detailed scores
    console.log('Blog Post Validation Scores:', {
        overall: validation.score,
        goalAlignment: validation.scoreBreakdown.goalAlignment,
        socialMedia: validation.scoreBreakdown.socialMedia,
        seo: validation.scoreBreakdown.seo,
        quality: validation.scoreBreakdown.quality,
        compliance: validation.scoreBreakdown.compliance,
    });

    if (validation.socialMediaScore) {
        console.log('Social Media Details:', {
            engagement: validation.socialMediaScore.engagement,
            shareability: validation.socialMediaScore.shareability,
            platformFit: validation.socialMediaScore.platformFit,
        });
    }

    if (validation.seoScore) {
        console.log('SEO Details:', {
            keywordOptimization: validation.seoScore.keywordOptimization,
            readability: validation.seoScore.readability,
            structure: validation.seoScore.structure,
            metaOptimization: validation.seoScore.metaOptimization,
        });
    }

    return {
        content: result,
        validation,
    };
}

/**
 * Generates social media post with platform-specific scoring
 */
export async function generateSocialMediaPostWithScores(
    input: {
        topic: string;
        platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
        tone?: string;
    }
): Promise<ContentWithValidation<{ post: string; hashtags: string[] }>> {
    // 1. Generate the social media post
    const result = await generateSocialMediaPost({
        topic: input.topic,
        platform: input.platform,
        tone: input.tone,
    });

    // 2. Validate with social media focus
    const validator = getValidationAgent();

    const validationConfig: ValidationConfig = {
        validateGoalAlignment: true,
        userGoal: `Create an engaging ${input.platform} post about: ${input.topic}`,
        minQualityScore: 70,
        checkCompleteness: true,
        checkCoherence: true,
        checkProfessionalism: true,
        enforceGuardrails: true,
        checkDomainCompliance: true,
        checkEthicalCompliance: true,
        expectedFormat: 'plain',
        minLength: 50,
        maxLength: input.platform === 'twitter' ? 280 : 2000,
        checkToneAndStyle: true,
        targetAudience: `${input.platform} users interested in real estate`,
        validateSocialMedia: true, // Critical for social posts
        validateSEO: false, // Less important for social
        contentType: 'social',
        strictMode: false,
    };

    const validation = await validator.validate(result.post, validationConfig);

    // 3. Log platform-specific scores
    if (validation.socialMediaScore) {
        console.log(`${input.platform} Post Scores:`, {
            overall: validation.score,
            engagement: validation.socialMediaScore.engagement,
            shareability: validation.socialMediaScore.shareability,
            platformFit: validation.socialMediaScore.platformFit[input.platform],
        });
    }

    return {
        content: result,
        validation,
    };
}

/**
 * Generates listing description with SEO focus
 */
export async function generateListingDescriptionWithScores(
    input: {
        propertyDetails: string;
        highlights: string[];
        neighborhood: string;
    }
): Promise<ContentWithValidation<{ description: string }>> {
    // For this example, we'll use a simple generation
    // In production, you'd call your listing description flow
    const description = `Beautiful property in ${input.neighborhood}. ${input.propertyDetails}`;

    // Validate with SEO focus
    const validator = getValidationAgent();

    const validationConfig: ValidationConfig = {
        validateGoalAlignment: true,
        userGoal: 'Create a compelling, SEO-optimized listing description',
        minQualityScore: 75,
        checkCompleteness: true,
        checkCoherence: true,
        checkProfessionalism: true,
        enforceGuardrails: true,
        checkDomainCompliance: true,
        checkEthicalCompliance: true,
        expectedFormat: 'plain',
        minLength: 200,
        checkToneAndStyle: true,
        targetAudience: 'home buyers and real estate search engines',
        validateSocialMedia: false, // Not critical for listings
        validateSEO: true, // Critical for listings
        contentType: 'listing',
        targetKeywords: [input.neighborhood, 'real estate', 'property', ...input.highlights],
        strictMode: false,
    };

    const validation = await validator.validate(description, validationConfig);

    // Log SEO-specific scores
    if (validation.seoScore) {
        console.log('Listing Description SEO Scores:', {
            overall: validation.score,
            keywordOptimization: validation.seoScore.keywordOptimization,
            readability: validation.seoScore.readability,
            structure: validation.seoScore.structure,
            suggestedKeywords: validation.seoScore.suggestedKeywords,
        });
    }

    return {
        content: { description },
        validation,
    };
}

/**
 * Batch validation for multiple content pieces
 * Useful for comparing different versions or A/B testing
 */
export async function validateMultipleVersions(
    contents: string[],
    config: ValidationConfig
): Promise<ValidationResult[]> {
    const validator = getValidationAgent();

    const results = await Promise.all(
        contents.map(content => validator.validate(content, config))
    );

    // Log comparison
    console.log('Content Comparison:', results.map((r, idx) => ({
        version: idx + 1,
        overall: r.score,
        goalAlignment: r.scoreBreakdown.goalAlignment,
        socialMedia: r.scoreBreakdown.socialMedia,
        seo: r.scoreBreakdown.seo,
    })));

    return results;
}

/**
 * Get validation config presets for different content types
 */
export function getValidationPreset(contentType: 'blog' | 'social' | 'listing' | 'email'): ValidationConfig {
    const baseConfig: ValidationConfig = {
        validateGoalAlignment: true,
        checkCompleteness: true,
        checkCoherence: true,
        checkProfessionalism: true,
        enforceGuardrails: true,
        checkDomainCompliance: true,
        checkEthicalCompliance: true,
        checkToneAndStyle: true,
        strictMode: false,
    };

    switch (contentType) {
        case 'blog':
            return {
                ...baseConfig,
                minQualityScore: 75,
                expectedFormat: 'markdown',
                minLength: 500,
                requiredElements: ['introduction', 'conclusion'],
                validateSocialMedia: true,
                validateSEO: true,
                contentType: 'blog',
                targetAudience: 'real estate agents and their clients',
            };

        case 'social':
            return {
                ...baseConfig,
                minQualityScore: 70,
                expectedFormat: 'plain',
                minLength: 50,
                maxLength: 2000,
                validateSocialMedia: true,
                validateSEO: false,
                contentType: 'social',
                targetAudience: 'social media users',
            };

        case 'listing':
            return {
                ...baseConfig,
                minQualityScore: 75,
                expectedFormat: 'plain',
                minLength: 200,
                validateSocialMedia: false,
                validateSEO: true,
                contentType: 'listing',
                targetAudience: 'home buyers and search engines',
            };

        case 'email':
            return {
                ...baseConfig,
                minQualityScore: 70,
                expectedFormat: 'html',
                minLength: 100,
                validateSocialMedia: false,
                validateSEO: false,
                contentType: 'email',
                targetAudience: 'email subscribers',
            };

        default:
            return baseConfig;
    }
}
