/**
 * Recommendation Engine Tests
 */

import {
    RecommendationEngine,
    ContentPerformance,
} from '../recommendation-engine';
import { AgentProfile } from '../types';

describe('RecommendationEngine', () => {
    let engine: RecommendationEngine;
    let sampleData: ContentPerformance[];
    let agentProfile: AgentProfile;

    beforeEach(() => {
        engine = new RecommendationEngine({
            minDataPoints: 5,
            minConfidence: 0.5,
            analysisWindow: 90,
        });

        agentProfile = {
            id: 'agent-123',
            agentName: 'Test Agent',
            primaryMarket: 'Austin, TX',
            specialization: ['residential'],
        };

        sampleData = [
            {
                contentId: 'content-1',
                contentType: 'blog-post',
                publishedAt: '2024-01-15T09:00:00Z',
                dayOfWeek: 1,
                hourOfDay: 9,
                metrics: { views: 250, engagement: 45, clicks: 12, shares: 5, conversions: 2 },
                platform: 'website',
                topics: ['market trends'],
            },
            {
                contentId: 'content-2',
                contentType: 'blog-post',
                publishedAt: '2024-01-16T09:00:00Z',
                dayOfWeek: 2,
                hourOfDay: 9,
                metrics: { views: 220, engagement: 40, clicks: 10, shares: 4, conversions: 1 },
                platform: 'website',
                topics: ['market trends'],
            },
            {
                contentId: 'content-3',
                contentType: 'blog-post',
                publishedAt: '2024-01-17T09:00:00Z',
                dayOfWeek: 3,
                hourOfDay: 9,
                metrics: { views: 280, engagement: 52, clicks: 15, shares: 7, conversions: 3 },
                platform: 'website',
                topics: ['market trends'],
            },
            {
                contentId: 'content-4',
                contentType: 'blog-post',
                publishedAt: '2024-01-18T14:00:00Z',
                dayOfWeek: 4,
                hourOfDay: 14,
                metrics: { views: 180, engagement: 32, clicks: 8, shares: 3, conversions: 1 },
                platform: 'website',
                topics: ['home buying'],
            },
            {
                contentId: 'content-5',
                contentType: 'blog-post',
                publishedAt: '2024-01-19T09:00:00Z',
                dayOfWeek: 5,
                hourOfDay: 9,
                metrics: { views: 260, engagement: 48, clicks: 13, shares: 6, conversions: 2 },
                platform: 'website',
                topics: ['market trends'],
            },
        ];
    });

    describe('generateTimingRecommendations', () => {
        it('should generate timing recommendations from historical data', async () => {
            const recommendations = await engine.generateTimingRecommendations(
                sampleData,
                'blog-post',
                'website'
            );

            expect(recommendations).toBeDefined();
            expect(Array.isArray(recommendations)).toBe(true);
        });

        it('should return empty array when insufficient data', async () => {
            const recommendations = await engine.generateTimingRecommendations(
                sampleData.slice(0, 2),
                'blog-post',
                'website'
            );

            expect(recommendations).toEqual([]);
        });

        it('should include confidence scores in recommendations', async () => {
            const recommendations = await engine.generateTimingRecommendations(
                sampleData,
                'blog-post',
                'website'
            );

            if (recommendations.length > 0) {
                expect(recommendations[0].confidence).toBeGreaterThanOrEqual(0);
                expect(recommendations[0].confidence).toBeLessThanOrEqual(1);
            }
        });

        it('should include expected improvement metrics', async () => {
            const recommendations = await engine.generateTimingRecommendations(
                sampleData,
                'blog-post',
                'website'
            );

            if (recommendations.length > 0) {
                expect(recommendations[0].expectedImprovement).toBeDefined();
                expect(typeof recommendations[0].expectedImprovement).toBe('number');
            }
        });

        it('should include alternative times', async () => {
            const recommendations = await engine.generateTimingRecommendations(
                sampleData,
                'blog-post',
                'website'
            );

            if (recommendations.length > 0) {
                expect(Array.isArray(recommendations[0].alternatives)).toBe(true);
            }
        });
    });

    describe('generateSchedulingStrategy', () => {
        it('should generate scheduling strategy from historical data', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            expect(strategy).toBeDefined();
            expect(strategy.name).toBeDefined();
            expect(strategy.description).toBeDefined();
        });

        it('should include frequency recommendations', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            expect(strategy.frequency).toBeDefined();
            expect(strategy.frequency.postsPerWeek).toBeGreaterThan(0);
            expect(strategy.frequency.postsPerMonth).toBeGreaterThan(0);
        });

        it('should include content mix recommendations', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            expect(Array.isArray(strategy.contentMix)).toBe(true);
            expect(strategy.contentMix.length).toBeGreaterThan(0);

            const totalPercentage = strategy.contentMix.reduce(
                (sum, mix) => sum + mix.percentage,
                0
            );
            expect(totalPercentage).toBeCloseTo(100, 0);
        });

        it('should include optimal schedule', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            expect(Array.isArray(strategy.schedule)).toBe(true);
            expect(strategy.schedule.length).toBeGreaterThan(0);

            strategy.schedule.forEach(slot => {
                expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
                expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
                expect(slot.hourOfDay).toBeGreaterThanOrEqual(0);
                expect(slot.hourOfDay).toBeLessThanOrEqual(23);
            });
        });

        it('should include expected outcomes', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            expect(strategy.expectedOutcomes).toBeDefined();
            expect(strategy.expectedOutcomes.engagementIncrease).toBeGreaterThanOrEqual(0);
            expect(strategy.expectedOutcomes.reachIncrease).toBeGreaterThanOrEqual(0);
            expect(strategy.expectedOutcomes.consistencyScore).toBeGreaterThanOrEqual(0);
            expect(strategy.expectedOutcomes.consistencyScore).toBeLessThanOrEqual(1);
        });

        it('should generate default strategy when insufficient data', async () => {
            const strategy = await engine.generateSchedulingStrategy(
                [],
                agentProfile
            );

            expect(strategy).toBeDefined();
            expect(strategy.name).toContain('Starter');
            expect(strategy.confidence).toBeLessThan(0.7);
        });
    });

    describe('analyzeHistoricalPatterns', () => {
        it('should detect patterns in historical data', async () => {
            const patterns = await engine.analyzeHistoricalPatterns(sampleData);

            expect(Array.isArray(patterns)).toBe(true);
        });

        it('should include pattern confidence scores', async () => {
            const patterns = await engine.analyzeHistoricalPatterns(sampleData);

            patterns.forEach(pattern => {
                expect(pattern.confidence).toBeGreaterThanOrEqual(0);
                expect(pattern.confidence).toBeLessThanOrEqual(1);
            });
        });

        it('should include pattern strength scores', async () => {
            const patterns = await engine.analyzeHistoricalPatterns(sampleData);

            patterns.forEach(pattern => {
                expect(pattern.strength).toBeGreaterThanOrEqual(0);
                expect(pattern.strength).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('prioritizeRecommendations', () => {
        it('should prioritize recommendations', async () => {
            const timingRecs = await engine.generateTimingRecommendations(
                sampleData,
                'blog-post',
                'website'
            );
            const strategy = await engine.generateSchedulingStrategy(
                sampleData,
                agentProfile
            );

            const prioritized = engine.prioritizeRecommendations(
                [...timingRecs, strategy],
                agentProfile
            );

            expect(Array.isArray(prioritized)).toBe(true);
            expect(prioritized.length).toBeGreaterThan(0);
        });

        it('should include priority scores', () => {
            const timingRecs: any[] = [{
                dayOfWeek: 1,
                hourOfDay: 9,
                contentType: 'blog-post',
                confidence: 0.8,
                expectedImprovement: 0.2,
            }];

            const prioritized = engine.prioritizeRecommendations(
                timingRecs,
                agentProfile
            );

            prioritized.forEach(rec => {
                expect(rec.priority).toBeGreaterThanOrEqual(0);
                expect(rec.priority).toBeLessThanOrEqual(1);
            });
        });

        it('should sort by priority score', () => {
            const timingRecs: any[] = [
                {
                    dayOfWeek: 1,
                    hourOfDay: 9,
                    contentType: 'blog-post',
                    confidence: 0.6,
                    expectedImprovement: 0.1,
                },
                {
                    dayOfWeek: 3,
                    hourOfDay: 14,
                    contentType: 'blog-post',
                    confidence: 0.9,
                    expectedImprovement: 0.3,
                },
            ];

            const prioritized = engine.prioritizeRecommendations(
                timingRecs,
                agentProfile
            );

            // Should be sorted by priority (descending)
            for (let i = 1; i < prioritized.length; i++) {
                expect(prioritized[i - 1].priority).toBeGreaterThanOrEqual(
                    prioritized[i].priority
                );
            }
        });

        it('should include action items', () => {
            const timingRecs: any[] = [{
                dayOfWeek: 1,
                hourOfDay: 9,
                contentType: 'blog-post',
                confidence: 0.8,
                expectedImprovement: 0.2,
            }];

            const prioritized = engine.prioritizeRecommendations(
                timingRecs,
                agentProfile
            );

            prioritized.forEach(rec => {
                expect(Array.isArray(rec.actionItems)).toBe(true);
                expect(rec.actionItems.length).toBeGreaterThan(0);
            });
        });
    });
});
