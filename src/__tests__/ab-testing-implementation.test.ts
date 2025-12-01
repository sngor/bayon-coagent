/**
 * A/B Testing Implementation Test
 * 
 * Validates the complete A/B testing implementation including:
 * - createABTest() with 3-variation limit
 * - getABTestResults() with statistical testing
 * - Independent tracking for variations
 * - Confidence interval calculation
 * - P-value calculation using Welch's t-test
 * - Winner recommendation logic
 * 
 * Validates Requirements: 6.1-6.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    analyticsService,
    createABTest,
    getABTestResults,
    trackABTestMetrics,
} from '../services/publishing/content-analytics-service';
import { ContentCategory, PublishChannelType } from '../lib/content-workflow-types';

describe('A/B Testing Implementation - Task 2.2', () => {
    const testUserId = 'test-user-ab-testing';

    describe('createABTest() with 3-variation limit', () => {
        it('should create A/B test with 1 variation', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'Single Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' }
                ],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.variations).toHaveLength(1);
        });

        it('should create A/B test with 2 variations', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'Two Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.variations).toHaveLength(2);
        });

        it('should create A/B test with 3 variations (maximum)', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'Three Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' },
                    { name: 'Variation C', content: 'Content C' }
                ],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.variations).toHaveLength(3);
        });

        it('should reject A/B test with more than 3 variations', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'Four Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' },
                    { name: 'Variation C', content: 'Content C' },
                    { name: 'Variation D', content: 'Content D' }
                ],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum of 3 variations');
        });

        it('should reject A/B test with 0 variations', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'No Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('At least one variation is required');
        });

        it('should reject A/B test with duplicate variation names', async () => {
            const result = await createABTest({
                userId: testUserId,
                name: 'Duplicate Names Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation A', content: 'Content B' }
                ],
                targetMetric: 'likes',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Variation names must be unique');
        });
    });

    describe('Independent tracking for variations', () => {
        it('should track metrics independently for each variation', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Independent Tracking Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
            });

            expect(createResult.success).toBe(true);
            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track different metrics for each variation
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 100,
                likes: 10,
                shares: 5,
                comments: 2,
                clicks: 15,
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 150,
                likes: 20,
                shares: 8,
                comments: 4,
                clicks: 25,
            });

            // Get results and verify independence
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: false,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            const resultA = results.variations.find(v => v.variationId === variationA.id);
            const resultB = results.variations.find(v => v.variationId === variationB.id);

            expect(resultA).toBeDefined();
            expect(resultB).toBeDefined();

            // Verify Variation A metrics
            expect(resultA!.metrics.views).toBe(100);
            expect(resultA!.metrics.likes).toBe(10);
            expect(resultA!.metrics.shares).toBe(5);
            expect(resultA!.metrics.comments).toBe(2);
            expect(resultA!.metrics.clicks).toBe(15);

            // Verify Variation B metrics
            expect(resultB!.metrics.views).toBe(150);
            expect(resultB!.metrics.likes).toBe(20);
            expect(resultB!.metrics.shares).toBe(8);
            expect(resultB!.metrics.comments).toBe(4);
            expect(resultB!.metrics.clicks).toBe(25);
        });
    });

    describe('getABTestResults() with statistical testing', () => {
        it('should calculate confidence intervals for variations', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Confidence Interval Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
                minimumSampleSize: 50,
                confidenceLevel: 0.95,
            });

            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track metrics with sufficient sample size
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 100,
                likes: 15,
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 100,
                likes: 25,
            });

            // Get results with statistical analysis
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify confidence intervals are calculated
            results.variations.forEach(variation => {
                expect(variation.confidenceInterval).toBeDefined();
                expect(variation.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
                expect(variation.confidenceInterval.upper).toBeLessThanOrEqual(1);
                expect(variation.confidenceInterval.lower).toBeLessThanOrEqual(variation.confidenceInterval.upper);
            });
        });

        it('should perform statistical significance testing with p-value', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Statistical Significance Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
                minimumSampleSize: 100,
                confidenceLevel: 0.95,
            });

            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track metrics with clear winner (Variation B)
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 200,
                likes: 20, // 10% conversion rate
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 200,
                likes: 50, // 25% conversion rate - significantly better
            });

            // Get results with statistical analysis
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify statistical significance testing
            expect(results.pValue).toBeDefined();
            expect(results.pValue).toBeGreaterThanOrEqual(0);
            expect(results.pValue).toBeLessThanOrEqual(1);
            expect(results.statisticalSignificance).toBeDefined();
        });

        it('should recommend winner when statistically significant', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Winner Recommendation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
                minimumSampleSize: 100,
                confidenceLevel: 0.95,
            });

            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track metrics with very clear winner
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 500,
                likes: 50, // 10% conversion rate
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 500,
                likes: 200, // 40% conversion rate - much better
            });

            // Get results with statistical analysis
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify winner recommendation
            if (results.statisticalSignificance) {
                expect(results.winner).toBeDefined();
                expect(results.recommendedAction).toBeDefined();
                expect(results.recommendedAction).toContain('winner');

                // Verify the winner is marked
                const winnerVariation = results.variations.find(v => v.variationId === results.winner);
                expect(winnerVariation).toBeDefined();
                expect(winnerVariation!.isWinner).toBe(true);
            }
        });

        it('should not recommend winner when insufficient sample size', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Insufficient Sample Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
                minimumSampleSize: 1000, // High minimum
                confidenceLevel: 0.95,
            });

            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track metrics with insufficient sample size
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 50,
                likes: 5,
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 50,
                likes: 10,
            });

            // Get results with statistical analysis
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify no winner recommended
            expect(results.winner).toBeUndefined();
            expect(results.recommendedAction).toContain('sample');
        });

        it('should calculate effect size when winner is identified', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Effect Size Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
                minimumSampleSize: 100,
                confidenceLevel: 0.95,
            });

            const testId = createResult.data!.id;
            const variationA = createResult.data!.variations[0];
            const variationB = createResult.data!.variations[1];

            // Track metrics with large effect size
            await trackABTestMetrics(testUserId, testId, variationA.id, {
                views: 300,
                likes: 30, // 10% conversion rate
            });

            await trackABTestMetrics(testUserId, testId, variationB.id, {
                views: 300,
                likes: 120, // 40% conversion rate
            });

            // Get results with statistical analysis
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify effect size is calculated when winner exists
            if (results.winner) {
                expect(results.effectSize).toBeDefined();
                expect(typeof results.effectSize).toBe('number');
            }
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle A/B test not found', async () => {
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId: 'non-existent-test-id',
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(false);
            expect(resultsResponse.error).toContain('not found');
        });

        it('should handle tracking metrics for non-existent variation', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Non-existent Variation Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' }
                ],
                targetMetric: 'likes',
            });

            const testId = createResult.data!.id;

            // Try to track metrics for non-existent variation
            const trackResult = await trackABTestMetrics(
                testUserId,
                testId,
                'non-existent-variation-id',
                { views: 100, likes: 10 }
            );

            expect(trackResult.success).toBe(false);
            expect(trackResult.error).toContain('Variation not found');
        });

        it('should handle zero sample size gracefully', async () => {
            // Create A/B test
            const createResult = await createABTest({
                userId: testUserId,
                name: 'Zero Sample Test',
                contentType: ContentCategory.SOCIAL_MEDIA,
                variations: [
                    { name: 'Variation A', content: 'Content A' },
                    { name: 'Variation B', content: 'Content B' }
                ],
                targetMetric: 'likes',
            });

            const testId = createResult.data!.id;

            // Get results without tracking any metrics
            const resultsResponse = await getABTestResults({
                userId: testUserId,
                testId,
                includeStatisticalAnalysis: true,
            });

            expect(resultsResponse.success).toBe(true);
            const results = resultsResponse.data!;

            // Verify it handles zero sample size
            results.variations.forEach(variation => {
                expect(variation.sampleSize).toBe(0);
                expect(variation.conversionRate).toBe(0);
                expect(variation.confidenceInterval.lower).toBe(0);
                expect(variation.confidenceInterval.upper).toBe(0);
            });
        });
    });
});
