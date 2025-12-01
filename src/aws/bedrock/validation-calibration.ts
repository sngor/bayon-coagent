/**
 * Validation Calibration System
 * 
 * Improves validation accuracy by learning from real content performance.
 * Compares predicted scores with actual engagement, SEO rankings, etc.
 */

import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Content performance data from real-world usage
 */
export interface ContentPerformance {
    contentId: string;
    contentType: 'blog' | 'social' | 'listing';

    // Predicted scores (from validation)
    predictedScores: {
        goalAlignment: number;
        socialMedia: number;
        seo: number;
    };

    // Actual performance metrics
    actualMetrics: {
        // Social media
        likes?: number;
        shares?: number;
        comments?: number;
        reach?: number;

        // SEO
        organicTraffic?: number;
        averagePosition?: number;
        clickThroughRate?: number;

        // Engagement
        timeOnPage?: number;
        bounceRate?: number;
        conversions?: number;
    };

    // Calculated actual scores (0-100)
    actualScores?: {
        socialMedia: number;
        seo: number;
        engagement: number;
    };

    timestamp: string;
}

/**
 * Calibration metrics showing prediction accuracy
 */
export interface CalibrationMetrics {
    contentType: 'blog' | 'social' | 'listing';
    sampleSize: number;

    // Accuracy metrics
    socialMediaAccuracy: {
        meanAbsoluteError: number; // Average difference between predicted and actual
        correlation: number; // -1 to 1, how well predictions correlate
        overestimationBias: number; // Positive = overestimate, negative = underestimate
    };

    seoAccuracy: {
        meanAbsoluteError: number;
        correlation: number;
        overestimationBias: number;
    };

    // Confidence intervals
    confidenceLevel: number; // e.g., 0.95 for 95% confidence

    lastUpdated: string;
}

/**
 * Saves content performance data for calibration
 */
export async function recordContentPerformance(
    userId: string,
    performance: ContentPerformance
): Promise<void> {
    const repository = getRepository();

    await repository.create({
        PK: `USER#${userId}`,
        SK: `PERFORMANCE#${performance.contentId}`,
        Type: 'ContentPerformance',
        Data: performance,
        CreatedAt: new Date().toISOString(),
    });
}

/**
 * Calculates actual scores from real metrics
 */
export function calculateActualScores(metrics: ContentPerformance['actualMetrics']): {
    socialMedia: number;
    seo: number;
    engagement: number;
} {
    // Social media score (0-100)
    let socialMedia = 0;
    if (metrics.likes !== undefined || metrics.shares !== undefined) {
        const engagementRate = (
            (metrics.likes || 0) +
            (metrics.shares || 0) * 2 +
            (metrics.comments || 0) * 3
        ) / Math.max(metrics.reach || 1, 1);

        // Normalize to 0-100 (assuming 5% engagement is excellent)
        socialMedia = Math.min(100, (engagementRate / 0.05) * 100);
    }

    // SEO score (0-100)
    let seo = 0;
    if (metrics.averagePosition !== undefined) {
        // Position 1 = 100, Position 10 = 50, Position 20+ = 0
        const positionScore = Math.max(0, 100 - (metrics.averagePosition - 1) * 5);

        // CTR bonus (good CTR = higher score)
        const ctrScore = (metrics.clickThroughRate || 0) * 1000; // 10% CTR = 100 points

        seo = Math.min(100, (positionScore * 0.7 + ctrScore * 0.3));
    }

    // Engagement score (0-100)
    let engagement = 0;
    if (metrics.timeOnPage !== undefined) {
        // 3+ minutes = excellent
        const timeScore = Math.min(100, (metrics.timeOnPage / 180) * 100);

        // Low bounce rate = good
        const bounceScore = metrics.bounceRate !== undefined
            ? 100 - metrics.bounceRate
            : 50;

        engagement = (timeScore * 0.6 + bounceScore * 0.4);
    }

    return { socialMedia, seo, engagement };
}

/**
 * Calculates calibration metrics from performance data
 */
export async function calculateCalibrationMetrics(
    userId: string,
    contentType: 'blog' | 'social' | 'listing',
    minSamples: number = 10
): Promise<CalibrationMetrics | null> {
    const repository = getRepository();

    // Fetch all performance data for this content type
    const items = await repository.query({
        PK: `USER#${userId}`,
        SK: { beginsWith: 'PERFORMANCE#' },
    });

    const performances = items
        .filter((item: any) => item.Data?.contentType === contentType)
        .map((item: any) => item.Data as ContentPerformance);

    if (performances.length < minSamples) {
        return null; // Not enough data for calibration
    }

    // Calculate actual scores for all performances
    const dataPoints = performances
        .map(p => {
            const actual = calculateActualScores(p.actualMetrics);
            return {
                predicted: p.predictedScores,
                actual,
            };
        })
        .filter(d => d.actual.socialMedia > 0 || d.actual.seo > 0);

    if (dataPoints.length < minSamples) {
        return null;
    }

    // Calculate social media accuracy
    const socialMediaErrors = dataPoints
        .filter(d => d.actual.socialMedia > 0)
        .map(d => d.predicted.socialMedia - d.actual.socialMedia);

    const socialMediaMAE = socialMediaErrors.length > 0
        ? socialMediaErrors.reduce((sum, err) => sum + Math.abs(err), 0) / socialMediaErrors.length
        : 0;

    const socialMediaBias = socialMediaErrors.length > 0
        ? socialMediaErrors.reduce((sum, err) => sum + err, 0) / socialMediaErrors.length
        : 0;

    const socialMediaCorrelation = calculateCorrelation(
        dataPoints.map(d => d.predicted.socialMedia),
        dataPoints.map(d => d.actual.socialMedia)
    );

    // Calculate SEO accuracy
    const seoErrors = dataPoints
        .filter(d => d.actual.seo > 0)
        .map(d => d.predicted.seo - d.actual.seo);

    const seoMAE = seoErrors.length > 0
        ? seoErrors.reduce((sum, err) => sum + Math.abs(err), 0) / seoErrors.length
        : 0;

    const seoBias = seoErrors.length > 0
        ? seoErrors.reduce((sum, err) => sum + err, 0) / seoErrors.length
        : 0;

    const seoCorrelation = calculateCorrelation(
        dataPoints.map(d => d.predicted.seo),
        dataPoints.map(d => d.actual.seo)
    );

    return {
        contentType,
        sampleSize: dataPoints.length,
        socialMediaAccuracy: {
            meanAbsoluteError: socialMediaMAE,
            correlation: socialMediaCorrelation,
            overestimationBias: socialMediaBias,
        },
        seoAccuracy: {
            meanAbsoluteError: seoMAE,
            correlation: seoCorrelation,
            overestimationBias: seoBias,
        },
        confidenceLevel: 0.95,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Calculates Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
}

/**
 * Adjusts predicted scores based on calibration data
 */
export function adjustScoresWithCalibration(
    predictedScores: { socialMedia: number; seo: number },
    calibration: CalibrationMetrics | null
): { socialMedia: number; seo: number } {
    if (!calibration) {
        return predictedScores; // No calibration data, return as-is
    }

    // Adjust for bias
    const adjustedSocialMedia = Math.max(0, Math.min(100,
        predictedScores.socialMedia - calibration.socialMediaAccuracy.overestimationBias
    ));

    const adjustedSeo = Math.max(0, Math.min(100,
        predictedScores.seo - calibration.seoAccuracy.overestimationBias
    ));

    return {
        socialMedia: Math.round(adjustedSocialMedia),
        seo: Math.round(adjustedSeo),
    };
}

/**
 * Gets calibration confidence message
 */
export function getCalibrationConfidence(
    calibration: CalibrationMetrics | null
): string {
    if (!calibration) {
        return 'Scores are AI predictions. Track real performance to improve accuracy.';
    }

    const avgCorrelation = (
        calibration.socialMediaAccuracy.correlation +
        calibration.seoAccuracy.correlation
    ) / 2;

    if (avgCorrelation > 0.8) {
        return `High confidence (${calibration.sampleSize} samples). Scores are ${Math.round(avgCorrelation * 100)}% accurate.`;
    } else if (avgCorrelation > 0.6) {
        return `Moderate confidence (${calibration.sampleSize} samples). Scores are ${Math.round(avgCorrelation * 100)}% accurate.`;
    } else if (avgCorrelation > 0.4) {
        return `Low confidence (${calibration.sampleSize} samples). Scores are ${Math.round(avgCorrelation * 100)}% accurate.`;
    } else {
        return `Very low confidence (${calibration.sampleSize} samples). More data needed for accurate predictions.`;
    }
}

/**
 * Example: Record blog post performance after 30 days
 */
export async function recordBlogPostPerformance(
    userId: string,
    contentId: string,
    predictedScores: { goalAlignment: number; socialMedia: number; seo: number },
    analytics: {
        pageViews: number;
        averageTimeOnPage: number;
        bounceRate: number;
        organicTraffic: number;
        averagePosition: number;
        socialShares: number;
        socialLikes: number;
    }
): Promise<void> {
    const performance: ContentPerformance = {
        contentId,
        contentType: 'blog',
        predictedScores,
        actualMetrics: {
            organicTraffic: analytics.organicTraffic,
            averagePosition: analytics.averagePosition,
            timeOnPage: analytics.averageTimeOnPage,
            bounceRate: analytics.bounceRate,
            shares: analytics.socialShares,
            likes: analytics.socialLikes,
        },
        timestamp: new Date().toISOString(),
    };

    await recordContentPerformance(userId, performance);
}
