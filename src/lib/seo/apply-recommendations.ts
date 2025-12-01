/**
 * SEO Recommendation Application Logic
 * 
 * Applies suggested changes to content and recalculates SEO scores.
 * Provides utilities for implementing SEO recommendations.
 */

import { calculateSEOScore } from './scoring';
import { generateSEORecommendations, type SEORecommendation } from './recommendations';

export interface ContentUpdate {
    title?: string;
    content?: string;
    metaDescription?: string;
    targetKeywords?: string[];
}

export interface ApplyRecommendationResult {
    success: boolean;
    updatedContent?: ContentUpdate;
    newScore?: number;
    message: string;
    requiresManualEdit?: boolean;
}

/**
 * Applies a recommendation to content and recalculates the SEO score
 * @param content Original content
 * @param title Original title
 * @param metaDescription Original meta description
 * @param targetKeywords Target keywords
 * @param recommendation The recommendation to apply
 * @returns Result with updated content and new score
 */
export function applyRecommendation(
    content: string,
    title: string,
    metaDescription: string | undefined,
    targetKeywords: string[],
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    const updates: ContentUpdate = {};
    let requiresManualEdit = false;

    switch (recommendation.category) {
        case 'title':
            return applyTitleRecommendation(title, recommendation);

        case 'headings':
            return applyHeadingRecommendation(content, recommendation);

        case 'keywords':
            return applyKeywordRecommendation(content, targetKeywords, recommendation);

        case 'readability':
            return applyReadabilityRecommendation(content, recommendation);

        case 'meta':
            return applyMetaRecommendation(metaDescription, recommendation);

        case 'length':
            return applyLengthRecommendation(content, recommendation);

        default:
            return {
                success: false,
                message: 'Unknown recommendation category',
                requiresManualEdit: true,
            };
    }
}

/**
 * Applies title recommendations
 */
function applyTitleRecommendation(
    title: string,
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Title changes require manual editing as they need context and creativity
    return {
        success: false,
        message: 'Title optimization requires manual editing. Consider the suggested character range when revising.',
        requiresManualEdit: true,
    };
}

/**
 * Applies heading recommendations
 */
function applyHeadingRecommendation(
    content: string,
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Heading structure changes require manual editing
    // We can provide guidance but not automatically restructure content
    return {
        success: false,
        message: 'Heading structure optimization requires manual editing. Add or reorganize headings to improve content hierarchy.',
        requiresManualEdit: true,
    };
}

/**
 * Applies keyword recommendations
 */
function applyKeywordRecommendation(
    content: string,
    targetKeywords: string[],
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Keyword optimization requires manual editing to maintain natural flow
    return {
        success: false,
        message: 'Keyword optimization requires manual editing. Naturally incorporate your target keywords throughout the content.',
        requiresManualEdit: true,
    };
}

/**
 * Applies readability recommendations
 */
function applyReadabilityRecommendation(
    content: string,
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Readability improvements require manual editing
    return {
        success: false,
        message: 'Readability optimization requires manual editing. Use shorter sentences and simpler words where appropriate.',
        requiresManualEdit: true,
    };
}

/**
 * Applies meta description recommendations
 */
function applyMetaRecommendation(
    metaDescription: string | undefined,
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Meta description changes require manual editing for quality
    return {
        success: false,
        message: 'Meta description optimization requires manual editing. Aim for 150-160 characters with a clear call-to-action.',
        requiresManualEdit: true,
    };
}

/**
 * Applies content length recommendations
 */
function applyLengthRecommendation(
    content: string,
    recommendation: SEORecommendation
): ApplyRecommendationResult {
    // Content length changes require manual editing
    return {
        success: false,
        message: 'Content length optimization requires manual editing. Expand your content with more details, examples, and insights.',
        requiresManualEdit: true,
    };
}

/**
 * Recalculates SEO score after content changes
 * @param content Updated content
 * @param title Updated title
 * @param metaDescription Updated meta description
 * @param targetKeywords Target keywords
 * @returns New SEO analysis result
 */
export function recalculateSEOScore(
    content: string,
    title: string,
    metaDescription?: string,
    targetKeywords: string[] = []
) {
    return generateSEORecommendations(content, title, metaDescription, targetKeywords);
}

/**
 * Validates that content changes improved the SEO score
 * @param originalScore Original SEO score
 * @param newScore New SEO score after changes
 * @returns Validation result
 */
export function validateScoreImprovement(
    originalScore: number,
    newScore: number
): {
    improved: boolean;
    change: number;
    message: string;
} {
    const change = newScore - originalScore;

    if (change > 0) {
        return {
            improved: true,
            change,
            message: `SEO score improved by ${change} points (${originalScore} → ${newScore})`,
        };
    } else if (change === 0) {
        return {
            improved: false,
            change: 0,
            message: 'SEO score unchanged',
        };
    } else {
        return {
            improved: false,
            change,
            message: `SEO score decreased by ${Math.abs(change)} points (${originalScore} → ${newScore})`,
        };
    }
}

/**
 * Gets actionable guidance for a recommendation
 * @param recommendation The recommendation to get guidance for
 * @returns Detailed guidance text
 */
export function getRecommendationGuidance(
    recommendation: SEORecommendation
): string {
    const guidanceMap: Record<string, string> = {
        title: `
Title Optimization Tips:
- Keep it between 50-60 characters for optimal display in search results
- Include your primary keyword near the beginning
- Make it compelling and click-worthy
- Avoid keyword stuffing
- Use numbers or power words when appropriate
    `.trim(),

        headings: `
Heading Structure Tips:
- Use exactly one H1 tag (usually your title)
- Add 2-6 H2 tags to break up main sections
- Use H3 tags for subsections under H2s
- Make headings descriptive and keyword-rich
- Maintain a logical hierarchy (H1 → H2 → H3)
    `.trim(),

        keywords: `
Keyword Optimization Tips:
- Aim for 1-2% keyword density
- Use keywords naturally in context
- Include keywords in headings and first paragraph
- Use variations and related terms
- Avoid keyword stuffing (over 3% density)
- Focus on user intent, not just keywords
    `.trim(),

        readability: `
Readability Improvement Tips:
- Use shorter sentences (15-20 words average)
- Break up long paragraphs (3-4 sentences max)
- Use simple, common words when possible
- Add bullet points and lists
- Use active voice instead of passive
- Aim for Flesch Reading Ease score of 60-80
    `.trim(),

        meta: `
Meta Description Tips:
- Keep it between 150-160 characters
- Include your primary keyword
- Add a clear call-to-action
- Make it compelling and accurate
- Avoid duplicate meta descriptions
- Write for humans, not just search engines
    `.trim(),

        length: `
Content Length Tips:
- Aim for at least 1500 words for comprehensive coverage
- Add more details, examples, and insights
- Include relevant statistics and data
- Answer related questions readers might have
- Add case studies or real-world examples
- Ensure all content adds value (don't pad for length)
    `.trim(),
    };

    return guidanceMap[recommendation.category] || 'No specific guidance available.';
}

/**
 * Prioritizes recommendations for implementation
 * @param recommendations Array of recommendations
 * @returns Sorted recommendations with implementation order
 */
export function prioritizeRecommendations(
    recommendations: SEORecommendation[]
): Array<SEORecommendation & { implementationOrder: number }> {
    // Sort by priority (high → medium → low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...recommendations].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Add implementation order
    return sorted.map((rec, index) => ({
        ...rec,
        implementationOrder: index + 1,
    }));
}

/**
 * Estimates the potential score improvement from applying recommendations
 * @param currentScore Current SEO score
 * @param recommendations Array of recommendations
 * @returns Estimated new score range
 */
export function estimateScoreImprovement(
    currentScore: number,
    recommendations: SEORecommendation[]
): {
    minScore: number;
    maxScore: number;
    message: string;
} {
    // Estimate based on number and priority of recommendations
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
    const mediumPriorityCount = recommendations.filter(r => r.priority === 'medium').length;
    const lowPriorityCount = recommendations.filter(r => r.priority === 'low').length;

    // Rough estimation: high = 10-15 points, medium = 5-10 points, low = 2-5 points
    const minImprovement =
        highPriorityCount * 10 +
        mediumPriorityCount * 5 +
        lowPriorityCount * 2;

    const maxImprovement =
        highPriorityCount * 15 +
        mediumPriorityCount * 10 +
        lowPriorityCount * 5;

    const minScore = Math.min(100, currentScore + minImprovement);
    const maxScore = Math.min(100, currentScore + maxImprovement);

    return {
        minScore,
        maxScore,
        message: `Implementing these recommendations could improve your score to ${minScore}-${maxScore}`,
    };
}
