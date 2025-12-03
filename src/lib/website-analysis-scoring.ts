/**
 * Website Analysis Scoring Logic
 * 
 * Functions for calculating optimization scores, mapping colors,
 * and generating score explanations for website analysis results.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { ScoreBreakdown, ScoreColor } from '@/ai/schemas/website-analysis-schemas';

/**
 * Calculate overall optimization score from component scores
 * 
 * Uses weighted calculation:
 * - Schema Markup: 30%
 * - Meta Tags: 25%
 * - Structured Data: 25%
 * - NAP Consistency: 20%
 * 
 * @param breakdown - Component scores
 * @returns Overall score (0-100)
 * 
 * @example
 * const score = calculateOverallScore({
 *   schemaMarkup: 20,
 *   metaTags: 18,
 *   structuredData: 15,
 *   napConsistency: 16
 * });
 * // Returns: 69
 */
export function calculateOverallScore(breakdown: ScoreBreakdown): number {
    // Apply weights: schema 30%, meta 25%, structured 25%, NAP 20%
    const score =
        breakdown.schemaMarkup * 0.3 +
        breakdown.metaTags * 0.25 +
        breakdown.structuredData * 0.25 +
        breakdown.napConsistency * 0.2;

    // Ensure score is within bounds [0, 100] and round to integer
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Map optimization score to color indicator
 * 
 * Color mapping:
 * - Red: 0-40 (Needs Improvement)
 * - Yellow: 41-70 (Good)
 * - Green: 71-100 (Excellent)
 * 
 * @param score - Overall optimization score (0-100)
 * @returns Color indicator
 * 
 * @example
 * getScoreColor(35); // Returns: 'red'
 * getScoreColor(55); // Returns: 'yellow'
 * getScoreColor(85); // Returns: 'green'
 */
export function getScoreColor(score: number): ScoreColor {
    if (score <= 40) return 'red';
    if (score <= 70) return 'yellow';
    return 'green';
}

/**
 * Get human-readable label for score
 * 
 * @param score - Overall optimization score (0-100)
 * @returns Score label
 * 
 * @example
 * getScoreLabel(35); // Returns: 'Needs Improvement'
 * getScoreLabel(55); // Returns: 'Good'
 * getScoreLabel(85); // Returns: 'Excellent'
 */
export function getScoreLabel(score: number): string {
    if (score <= 40) return 'Needs Improvement';
    if (score <= 70) return 'Good';
    return 'Excellent';
}

/**
 * Generate detailed explanation of the optimization score
 * 
 * Provides context about what the score means and what areas
 * need improvement based on the component breakdown.
 * 
 * @param score - Overall optimization score (0-100)
 * @param breakdown - Component scores
 * @returns Detailed score explanation
 * 
 * @example
 * const explanation = generateScoreExplanation(65, {
 *   schemaMarkup: 15,
 *   metaTags: 20,
 *   structuredData: 18,
 *   napConsistency: 16
 * });
 */
export function generateScoreExplanation(
    score: number,
    breakdown: ScoreBreakdown
): string {
    const label = getScoreLabel(score);
    const color = getScoreColor(score);

    // Base explanation
    let explanation = `Your website has an optimization score of ${score}/100, which is ${label}. `;

    // Add context based on score range
    if (color === 'red') {
        explanation += 'Your website needs significant improvements to be easily discovered by AI search engines. ';
    } else if (color === 'yellow') {
        explanation += 'Your website has a solid foundation but there are opportunities to improve AI discoverability. ';
    } else {
        explanation += 'Your website is well-optimized for AI search engines! ';
    }

    // Identify weak areas (below 50% of max score)
    const weakAreas: string[] = [];
    if (breakdown.schemaMarkup < 15) weakAreas.push('schema markup');
    if (breakdown.metaTags < 12.5) weakAreas.push('meta tags');
    if (breakdown.structuredData < 12.5) weakAreas.push('structured data');
    if (breakdown.napConsistency < 10) weakAreas.push('NAP consistency');

    // Identify strong areas (above 80% of max score)
    const strongAreas: string[] = [];
    if (breakdown.schemaMarkup >= 24) strongAreas.push('schema markup');
    if (breakdown.metaTags >= 20) strongAreas.push('meta tags');
    if (breakdown.structuredData >= 20) strongAreas.push('structured data');
    if (breakdown.napConsistency >= 16) strongAreas.push('NAP consistency');

    // Add specific feedback
    if (weakAreas.length > 0) {
        explanation += `Focus on improving: ${weakAreas.join(', ')}. `;
    }

    if (strongAreas.length > 0) {
        explanation += `Your ${strongAreas.join(' and ')} ${strongAreas.length === 1 ? 'is' : 'are'} excellent. `;
    }

    // Add actionable next step
    if (color === 'red') {
        explanation += 'Start by implementing the high-priority recommendations to see the biggest improvements.';
    } else if (color === 'yellow') {
        explanation += 'Implement the recommended improvements to reach excellent optimization.';
    } else {
        explanation += 'Keep monitoring and maintaining your optimization to stay ahead.';
    }

    return explanation;
}

/**
 * Get component score percentage
 * 
 * Calculates what percentage of the maximum possible score
 * was achieved for a component.
 * 
 * @param componentScore - Actual component score
 * @param maxScore - Maximum possible score for component
 * @returns Percentage (0-100)
 * 
 * @example
 * getComponentPercentage(15, 30); // Returns: 50
 * getComponentPercentage(20, 25); // Returns: 80
 */
export function getComponentPercentage(
    componentScore: number,
    maxScore: number
): number {
    if (maxScore === 0) return 0;
    return Math.round((componentScore / maxScore) * 100);
}

/**
 * Get breakdown percentages for all components
 * 
 * @param breakdown - Component scores
 * @returns Object with percentage for each component
 * 
 * @example
 * const percentages = getBreakdownPercentages({
 *   schemaMarkup: 15,
 *   metaTags: 20,
 *   structuredData: 18,
 *   napConsistency: 16
 * });
 * // Returns: { schemaMarkup: 50, metaTags: 80, structuredData: 72, napConsistency: 80 }
 */
export function getBreakdownPercentages(breakdown: ScoreBreakdown): {
    schemaMarkup: number;
    metaTags: number;
    structuredData: number;
    napConsistency: number;
} {
    return {
        schemaMarkup: getComponentPercentage(breakdown.schemaMarkup, 30),
        metaTags: getComponentPercentage(breakdown.metaTags, 25),
        structuredData: getComponentPercentage(breakdown.structuredData, 25),
        napConsistency: getComponentPercentage(breakdown.napConsistency, 20),
    };
}

/**
 * Validate score breakdown
 * 
 * Ensures all component scores are within their valid ranges.
 * 
 * @param breakdown - Component scores to validate
 * @returns True if valid, false otherwise
 * 
 * @example
 * validateScoreBreakdown({ schemaMarkup: 15, metaTags: 20, structuredData: 18, napConsistency: 16 }); // true
 * validateScoreBreakdown({ schemaMarkup: 35, metaTags: 20, structuredData: 18, napConsistency: 16 }); // false
 */
export function validateScoreBreakdown(breakdown: ScoreBreakdown): boolean {
    return (
        breakdown.schemaMarkup >= 0 &&
        breakdown.schemaMarkup <= 30 &&
        breakdown.metaTags >= 0 &&
        breakdown.metaTags <= 25 &&
        breakdown.structuredData >= 0 &&
        breakdown.structuredData <= 25 &&
        breakdown.napConsistency >= 0 &&
        breakdown.napConsistency <= 20
    );
}

/**
 * Get score improvement needed to reach next level
 * 
 * Calculates how many points are needed to move from current
 * score level to the next level (red -> yellow -> green).
 * 
 * @param currentScore - Current optimization score (0-100)
 * @returns Points needed to reach next level, or 0 if already at highest level
 * 
 * @example
 * getPointsToNextLevel(35); // Returns: 6 (to reach 41, yellow threshold)
 * getPointsToNextLevel(65); // Returns: 6 (to reach 71, green threshold)
 * getPointsToNextLevel(85); // Returns: 0 (already at highest level)
 */
export function getPointsToNextLevel(currentScore: number): number {
    if (currentScore <= 40) {
        return 41 - currentScore; // Points to reach yellow
    } else if (currentScore <= 70) {
        return 71 - currentScore; // Points to reach green
    }
    return 0; // Already at highest level
}

/**
 * Format score for display
 * 
 * @param score - Score to format
 * @returns Formatted score string
 * 
 * @example
 * formatScore(85.7); // Returns: '86'
 * formatScore(42); // Returns: '42'
 */
export function formatScore(score: number): string {
    return Math.round(score).toString();
}
