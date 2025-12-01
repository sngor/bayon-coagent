/**
 * SEO Recommendation Generator
 * 
 * Generates actionable SEO recommendations based on content analysis.
 * Assigns priority levels and provides current/suggested values.
 */

import {
    calculateSEOScore,
    evaluateTitleLength,
    evaluateHeadingStructure,
    evaluateKeywordDensity,
    evaluateReadability,
    evaluateContentLength,
    countWords,
    countHeadings,
    calculateKeywordDensity,
    calculateFleschReadingEase,
    type SEOScoreResult,
} from './scoring';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationCategory =
    | 'title'
    | 'headings'
    | 'keywords'
    | 'readability'
    | 'meta'
    | 'length';

export interface SEORecommendation {
    priority: RecommendationPriority;
    category: RecommendationCategory;
    message: string;
    currentValue?: string;
    suggestedValue?: string;
}

export interface SEOAnalysisResult {
    score: number;
    recommendations: SEORecommendation[];
    strengths: string[];
    scoreBreakdown: SEOScoreResult;
}

/**
 * Generates comprehensive SEO recommendations for content
 * @param content The content to analyze
 * @param title The title/headline
 * @param metaDescription Optional meta description
 * @param targetKeywords Optional array of target keywords
 * @returns SEO analysis with recommendations
 */
export function generateSEORecommendations(
    content: string,
    title: string,
    metaDescription?: string,
    targetKeywords: string[] = []
): SEOAnalysisResult {
    const scoreResult = calculateSEOScore(content, title, targetKeywords);
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];

    // Title recommendations
    const titleRecs = generateTitleRecommendations(title, scoreResult.factors.titleScore);
    recommendations.push(...titleRecs.recommendations);
    strengths.push(...titleRecs.strengths);

    // Heading recommendations
    const headingRecs = generateHeadingRecommendations(
        scoreResult.details.headingCounts,
        scoreResult.factors.headingScore
    );
    recommendations.push(...headingRecs.recommendations);
    strengths.push(...headingRecs.strengths);

    // Keyword recommendations
    const keywordRecs = generateKeywordRecommendations(
        scoreResult.details.keywordDensity,
        targetKeywords,
        scoreResult.factors.keywordScore
    );
    recommendations.push(...keywordRecs.recommendations);
    strengths.push(...keywordRecs.strengths);

    // Readability recommendations
    const readabilityRecs = generateReadabilityRecommendations(
        scoreResult.details.readabilityScore,
        scoreResult.factors.readabilityScore
    );
    recommendations.push(...readabilityRecs.recommendations);
    strengths.push(...readabilityRecs.strengths);

    // Content length recommendations
    const lengthRecs = generateContentLengthRecommendations(
        scoreResult.details.wordCount,
        scoreResult.factors.contentLengthScore
    );
    recommendations.push(...lengthRecs.recommendations);
    strengths.push(...lengthRecs.strengths);

    // Meta description recommendations
    if (metaDescription !== undefined) {
        const metaRecs = generateMetaDescriptionRecommendations(metaDescription);
        recommendations.push(...metaRecs.recommendations);
        strengths.push(...metaRecs.strengths);
    }

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
        score: scoreResult.score,
        recommendations,
        strengths,
        scoreBreakdown: scoreResult,
    };
}

/**
 * Generates title-specific recommendations
 */
function generateTitleRecommendations(
    title: string,
    score: number
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];
    const length = title.length;

    if (score === 100) {
        strengths.push('Title length is optimal (50-60 characters)');
    } else if (length < 30) {
        recommendations.push({
            priority: 'high',
            category: 'title',
            message: 'Title is too short. Aim for 50-60 characters for better SEO.',
            currentValue: `${length} characters`,
            suggestedValue: '50-60 characters',
        });
    } else if (length < 50) {
        recommendations.push({
            priority: 'medium',
            category: 'title',
            message: 'Title could be longer. Aim for 50-60 characters for optimal SEO.',
            currentValue: `${length} characters`,
            suggestedValue: '50-60 characters',
        });
    } else if (length > 80) {
        recommendations.push({
            priority: 'high',
            category: 'title',
            message: 'Title is too long and may be truncated in search results. Keep it under 60 characters.',
            currentValue: `${length} characters`,
            suggestedValue: '50-60 characters',
        });
    } else if (length > 60) {
        recommendations.push({
            priority: 'medium',
            category: 'title',
            message: 'Title is slightly long. Consider shortening to 50-60 characters.',
            currentValue: `${length} characters`,
            suggestedValue: '50-60 characters',
        });
    }

    return { recommendations, strengths };
}

/**
 * Generates heading structure recommendations
 */
function generateHeadingRecommendations(
    counts: { h1: number; h2: number; h3: number },
    score: number
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];

    // H1 recommendations
    if (counts.h1 === 0) {
        recommendations.push({
            priority: 'high',
            category: 'headings',
            message: 'Missing H1 heading. Every page should have exactly one H1 tag.',
            currentValue: '0 H1 tags',
            suggestedValue: '1 H1 tag',
        });
    } else if (counts.h1 > 1) {
        recommendations.push({
            priority: 'medium',
            category: 'headings',
            message: 'Multiple H1 tags found. Use only one H1 per page for better SEO.',
            currentValue: `${counts.h1} H1 tags`,
            suggestedValue: '1 H1 tag',
        });
    } else {
        strengths.push('Proper H1 structure (exactly one H1 tag)');
    }

    // H2 recommendations
    if (counts.h2 === 0) {
        recommendations.push({
            priority: 'high',
            category: 'headings',
            message: 'No H2 headings found. Add 2-6 H2 tags to structure your content.',
            currentValue: '0 H2 tags',
            suggestedValue: '2-6 H2 tags',
        });
    } else if (counts.h2 === 1) {
        recommendations.push({
            priority: 'medium',
            category: 'headings',
            message: 'Only one H2 heading. Add more H2 tags to better structure your content.',
            currentValue: '1 H2 tag',
            suggestedValue: '2-6 H2 tags',
        });
    } else if (counts.h2 >= 2 && counts.h2 <= 6) {
        strengths.push(`Good H2 structure (${counts.h2} H2 tags)`);
    } else if (counts.h2 > 6) {
        recommendations.push({
            priority: 'low',
            category: 'headings',
            message: 'Many H2 headings. Consider if all are necessary or if some should be H3.',
            currentValue: `${counts.h2} H2 tags`,
            suggestedValue: '2-6 H2 tags',
        });
    }

    // H3 recommendations
    if (counts.h3 >= 1 && counts.h3 <= 10) {
        strengths.push(`Good use of H3 subheadings (${counts.h3} H3 tags)`);
    } else if (counts.h3 > 10) {
        recommendations.push({
            priority: 'low',
            category: 'headings',
            message: 'Many H3 headings. Ensure your content hierarchy is clear.',
            currentValue: `${counts.h3} H3 tags`,
            suggestedValue: 'Fewer, more focused H3 tags',
        });
    }

    return { recommendations, strengths };
}

/**
 * Generates keyword density recommendations
 */
function generateKeywordRecommendations(
    density: number,
    targetKeywords: string[],
    score: number
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];

    if (targetKeywords.length === 0) {
        recommendations.push({
            priority: 'medium',
            category: 'keywords',
            message: 'No target keywords specified. Add keywords to optimize your content.',
            currentValue: 'No keywords',
            suggestedValue: 'Add 2-3 target keywords',
        });
        return { recommendations, strengths };
    }

    const densityStr = density.toFixed(2) + '%';

    if (density >= 1 && density <= 2) {
        strengths.push(`Optimal keyword density (${densityStr})`);
    } else if (density < 0.2) {
        recommendations.push({
            priority: 'high',
            category: 'keywords',
            message: 'Keyword density is very low. Include your target keywords more naturally throughout the content.',
            currentValue: densityStr,
            suggestedValue: '1-2%',
        });
    } else if (density < 1) {
        recommendations.push({
            priority: 'medium',
            category: 'keywords',
            message: 'Keyword density is low. Consider using your target keywords more frequently.',
            currentValue: densityStr,
            suggestedValue: '1-2%',
        });
    } else if (density > 5) {
        recommendations.push({
            priority: 'high',
            category: 'keywords',
            message: 'Keyword density is too high (keyword stuffing). Reduce keyword usage for more natural content.',
            currentValue: densityStr,
            suggestedValue: '1-2%',
        });
    } else if (density > 2) {
        recommendations.push({
            priority: 'medium',
            category: 'keywords',
            message: 'Keyword density is slightly high. Consider reducing keyword usage slightly.',
            currentValue: densityStr,
            suggestedValue: '1-2%',
        });
    }

    return { recommendations, strengths };
}

/**
 * Generates readability recommendations
 */
function generateReadabilityRecommendations(
    fleschScore: number,
    score: number
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];

    const fleschStr = fleschScore.toFixed(1);

    if (fleschScore >= 60 && fleschScore <= 80) {
        strengths.push(`Good readability (Flesch score: ${fleschStr})`);
    } else if (fleschScore < 30) {
        recommendations.push({
            priority: 'high',
            category: 'readability',
            message: 'Content is very difficult to read. Use shorter sentences and simpler words.',
            currentValue: `Flesch score: ${fleschStr}`,
            suggestedValue: 'Flesch score: 60-80',
        });
    } else if (fleschScore < 60) {
        recommendations.push({
            priority: 'medium',
            category: 'readability',
            message: 'Content is somewhat difficult to read. Consider using shorter sentences and simpler language.',
            currentValue: `Flesch score: ${fleschStr}`,
            suggestedValue: 'Flesch score: 60-80',
        });
    } else if (fleschScore > 90) {
        recommendations.push({
            priority: 'low',
            category: 'readability',
            message: 'Content may be too simple. Consider adding more depth and detail.',
            currentValue: `Flesch score: ${fleschStr}`,
            suggestedValue: 'Flesch score: 60-80',
        });
    }

    return { recommendations, strengths };
}

/**
 * Generates content length recommendations
 */
function generateContentLengthRecommendations(
    wordCount: number,
    score: number
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];

    if (wordCount >= 1500) {
        strengths.push(`Excellent content length (${wordCount} words)`);
    } else if (wordCount < 300) {
        recommendations.push({
            priority: 'high',
            category: 'length',
            message: 'Content is too short. Aim for at least 1500 words for comprehensive coverage.',
            currentValue: `${wordCount} words`,
            suggestedValue: '1500+ words',
        });
    } else if (wordCount < 750) {
        recommendations.push({
            priority: 'high',
            category: 'length',
            message: 'Content is short. Expand to at least 1500 words for better SEO.',
            currentValue: `${wordCount} words`,
            suggestedValue: '1500+ words',
        });
    } else if (wordCount < 1500) {
        recommendations.push({
            priority: 'medium',
            category: 'length',
            message: 'Content length is good but could be expanded. Aim for 1500+ words for optimal SEO.',
            currentValue: `${wordCount} words`,
            suggestedValue: '1500+ words',
        });
    }

    return { recommendations, strengths };
}

/**
 * Generates meta description recommendations
 */
function generateMetaDescriptionRecommendations(
    metaDescription: string
): { recommendations: SEORecommendation[]; strengths: string[] } {
    const recommendations: SEORecommendation[] = [];
    const strengths: string[] = [];
    const length = metaDescription.length;

    if (length >= 150 && length <= 160) {
        strengths.push('Meta description length is optimal (150-160 characters)');
    } else if (length === 0) {
        recommendations.push({
            priority: 'high',
            category: 'meta',
            message: 'Missing meta description. Add a 150-160 character description for search results.',
            currentValue: 'No meta description',
            suggestedValue: '150-160 characters',
        });
    } else if (length < 120) {
        recommendations.push({
            priority: 'medium',
            category: 'meta',
            message: 'Meta description is too short. Expand to 150-160 characters.',
            currentValue: `${length} characters`,
            suggestedValue: '150-160 characters',
        });
    } else if (length > 160) {
        recommendations.push({
            priority: 'medium',
            category: 'meta',
            message: 'Meta description is too long and may be truncated. Keep it to 150-160 characters.',
            currentValue: `${length} characters`,
            suggestedValue: '150-160 characters',
        });
    }

    return { recommendations, strengths };
}

/**
 * Applies a recommendation to content (where possible)
 * Note: Some recommendations require manual editing
 * @param content Original content
 * @param recommendation The recommendation to apply
 * @returns Updated content or null if manual editing required
 */
export function applyRecommendation(
    content: string,
    recommendation: SEORecommendation
): string | null {
    // Most recommendations require manual editing
    // This function can be extended to handle automatic fixes where appropriate

    // For now, return null to indicate manual editing is required
    // Future enhancements could include:
    // - Automatic heading insertion
    // - Keyword suggestion insertion points
    // - Sentence simplification for readability

    return null;
}
