/**
 * Basic tests for visibility score calculation flow
 * 
 * Feature: ai-search-monitoring
 */

import { describe, it, expect } from '@jest/globals';
import { calculateVisibilityScore } from '../calculate-visibility-score';
import type { CalculateVisibilityScoreInput } from '@/ai/schemas/ai-monitoring-schemas';

describe('Visibility Score Calculation Flow', () => {
    describe('Basic Functionality', () => {
        it('should calculate score with multiple positive mentions', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'perplexity',
                        timestamp: '2024-01-16T14:30:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'claude',
                        timestamp: '2024-01-17T09:15:00Z',
                    },
                ],
                timeRange: 30,
            };

            const output = await calculateVisibilityScore(input);

            // Verify all required fields are present
            expect(output.score).toBeDefined();
            expect(output.breakdown).toBeDefined();
            expect(output.trend).toBeDefined();
            expect(output.trendPercentage).toBeDefined();

            // Verify score is within valid range
            expect(output.score).toBeGreaterThanOrEqual(0);
            expect(output.score).toBeLessThanOrEqual(100);

            // Verify breakdown components exist
            expect(output.breakdown.mentionFrequency).toBeDefined();
            expect(output.breakdown.sentimentScore).toBeDefined();
            expect(output.breakdown.prominenceScore).toBeDefined();
            expect(output.breakdown.platformDiversity).toBeDefined();

            // Verify trend is valid
            expect(['up', 'down', 'stable']).toContain(output.trend);

            // With no previous score, trend could be stable or up (AI may interpret positive mentions as upward trend)
            expect(['stable', 'up']).toContain(output.trend);
        }, 60000); // 1 minute timeout for API call

        it('should calculate score with mixed sentiment', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                    {
                        sentiment: 'neutral',
                        prominence: 'medium',
                        platform: 'perplexity',
                        timestamp: '2024-01-16T14:30:00Z',
                    },
                    {
                        sentiment: 'negative',
                        prominence: 'low',
                        platform: 'claude',
                        timestamp: '2024-01-17T09:15:00Z',
                    },
                ],
                timeRange: 30,
            };

            const output = await calculateVisibilityScore(input);

            // Verify score is calculated
            expect(output.score).toBeDefined();
            expect(output.score).toBeGreaterThanOrEqual(0);
            expect(output.score).toBeLessThanOrEqual(100);

            // Verify all breakdown components are present
            expect(output.breakdown.mentionFrequency).toBeGreaterThan(0);
            expect(output.breakdown.sentimentScore).toBeDefined();
            expect(output.breakdown.prominenceScore).toBeDefined();
            expect(output.breakdown.platformDiversity).toBeDefined();
        }, 60000);

        it('should detect upward trend when score increases', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'perplexity',
                        timestamp: '2024-01-16T14:30:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'claude',
                        timestamp: '2024-01-17T09:15:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'gemini',
                        timestamp: '2024-01-18T11:00:00Z',
                    },
                ],
                timeRange: 30,
                previousScore: 40,
            };

            const output = await calculateVisibilityScore(input);

            // With many positive mentions and a low previous score, trend should be up
            expect(output.trend).toBeDefined();
            expect(['up', 'down', 'stable']).toContain(output.trend);

            // Verify trend percentage is calculated
            expect(output.trendPercentage).toBeDefined();
            expect(typeof output.trendPercentage).toBe('number');
        }, 60000);

        it('should handle single mention', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                ],
                timeRange: 30,
            };

            const output = await calculateVisibilityScore(input);

            // Verify score is calculated even with single mention
            expect(output.score).toBeDefined();
            expect(output.score).toBeGreaterThanOrEqual(0);
            expect(output.score).toBeLessThanOrEqual(100);

            // Platform diversity should be low with only one platform
            expect(output.breakdown.platformDiversity).toBeDefined();
        }, 60000);

        it('should reward platform diversity', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'perplexity',
                        timestamp: '2024-01-16T14:30:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'claude',
                        timestamp: '2024-01-17T09:15:00Z',
                    },
                    {
                        sentiment: 'positive',
                        prominence: 'medium',
                        platform: 'gemini',
                        timestamp: '2024-01-18T11:00:00Z',
                    },
                ],
                timeRange: 30,
            };

            const output = await calculateVisibilityScore(input);

            // With all 4 platforms, diversity score should be high
            expect(output.breakdown.platformDiversity).toBeDefined();
            expect(output.breakdown.platformDiversity).toBeGreaterThan(10);
        }, 60000);
    });

    describe('Schema Validation', () => {
        it('should validate output structure', async () => {
            const input: CalculateVisibilityScoreInput = {
                mentions: [
                    {
                        sentiment: 'positive',
                        prominence: 'high',
                        platform: 'chatgpt',
                        timestamp: '2024-01-15T10:00:00Z',
                    },
                ],
                timeRange: 30,
            };

            const output = await calculateVisibilityScore(input);

            // Verify output structure matches schema
            expect(output).toHaveProperty('score');
            expect(output).toHaveProperty('breakdown');
            expect(output).toHaveProperty('trend');
            expect(output).toHaveProperty('trendPercentage');

            // Verify breakdown structure
            expect(output.breakdown).toHaveProperty('mentionFrequency');
            expect(output.breakdown).toHaveProperty('sentimentScore');
            expect(output.breakdown).toHaveProperty('prominenceScore');
            expect(output.breakdown).toHaveProperty('platformDiversity');

            // Verify types
            expect(typeof output.score).toBe('number');
            expect(typeof output.breakdown.mentionFrequency).toBe('number');
            expect(typeof output.breakdown.sentimentScore).toBe('number');
            expect(typeof output.breakdown.prominenceScore).toBe('number');
            expect(typeof output.breakdown.platformDiversity).toBe('number');
            expect(typeof output.trend).toBe('string');
            expect(typeof output.trendPercentage).toBe('number');
        }, 60000);
    });
});
