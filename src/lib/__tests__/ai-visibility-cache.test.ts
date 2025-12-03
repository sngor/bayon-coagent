/**
 * Tests for AI Visibility Cache Service
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AIVisibilityCacheService, getAIVisibilityCacheService, invalidateAIVisibilityCache } from '../ai-visibility-cache';
import { getRepository } from '@/aws/dynamodb/repository';
import type { AIMention, AIVisibilityScore, AIMonitoringConfig } from '../types/common/common';

// Mock the repository
jest.mock('@/aws/dynamodb/repository');

describe('AIVisibilityCacheService', () => {
    let cache: AIVisibilityCacheService;
    const mockRepository = {
        query: jest.fn(),
        getAIMonitoringConfig: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        cache = new AIVisibilityCacheService(mockRepository as any);
    });

    afterEach(() => {
        cache.destroy();
    });

    describe('getVisibilityScore', () => {
        const mockScore: AIVisibilityScore = {
            id: 'score-1',
            userId: 'user-123',
            score: 75,
            breakdown: {
                mentionFrequency: 20,
                sentimentScore: 25,
                prominenceScore: 15,
                platformDiversity: 15,
            },
            mentionCount: 10,
            sentimentDistribution: {
                positive: 7,
                neutral: 2,
                negative: 1,
            },
            platformBreakdown: {
                chatgpt: 3,
                perplexity: 3,
                claude: 2,
                gemini: 2,
            },
            trend: 'up',
            trendPercentage: 10,
            previousScore: 68,
            calculatedAt: new Date().toISOString(),
            periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        it('should fetch from database on cache miss', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: mockScore }],
            });

            const result = await cache.getVisibilityScore('user-123');

            expect(result).toEqual(mockScore);
            expect(mockRepository.query).toHaveBeenCalledWith(
                'USER#user-123',
                'AI_VISIBILITY_SCORE#',
                {
                    limit: 1,
                    scanIndexForward: false,
                }
            );
        });

        it('should return cached data on cache hit', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: mockScore }],
            });

            // First call - cache miss
            await cache.getVisibilityScore('user-123');

            // Second call - cache hit
            const result = await cache.getVisibilityScore('user-123');

            expect(result).toEqual(mockScore);
            // Should only call repository once
            expect(mockRepository.query).toHaveBeenCalledTimes(1);
        });

        it('should force refresh when requested', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: mockScore }],
            });

            // First call
            await cache.getVisibilityScore('user-123');

            // Second call with force refresh
            await cache.getVisibilityScore('user-123', true);

            // Should call repository twice
            expect(mockRepository.query).toHaveBeenCalledTimes(2);
        });

        it('should return null when no score found', async () => {
            mockRepository.query.mockResolvedValue({
                items: [],
            });

            const result = await cache.getVisibilityScore('user-123');

            expect(result).toBeNull();
        });
    });

    describe('getMentions', () => {
        const mockMentions: AIMention[] = [
            {
                id: 'mention-1',
                userId: 'user-123',
                platform: 'chatgpt',
                query: 'best real estate agents',
                queryCategory: 'general',
                response: 'Full response text',
                snippet: 'Snippet text',
                sentiment: 'positive',
                sentimentReason: 'Positive tone',
                topics: ['expertise', 'service'],
                expertiseAreas: ['luxury', 'residential'],
                prominence: 'high',
                position: 100,
                timestamp: new Date().toISOString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        it('should fetch mentions from database on cache miss', async () => {
            mockRepository.query.mockResolvedValue({
                items: mockMentions.map(m => ({ Data: m })),
            });

            const result = await cache.getMentions('user-123', { limit: 20 });

            expect(result).toEqual(mockMentions);
            expect(mockRepository.query).toHaveBeenCalled();
        });

        it('should cache mentions with different filter options separately', async () => {
            mockRepository.query.mockResolvedValue({
                items: mockMentions.map(m => ({ Data: m })),
            });

            // Call with different options
            await cache.getMentions('user-123', { limit: 10 });
            await cache.getMentions('user-123', { limit: 20 });
            await cache.getMentions('user-123', { platform: 'chatgpt' });

            // Should call repository 3 times (different cache keys)
            expect(mockRepository.query).toHaveBeenCalledTimes(3);
        });

        it('should filter mentions by date range', async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

            const mentionsWithDates: AIMention[] = [
                { ...mockMentions[0], timestamp: now.toISOString() },
                { ...mockMentions[0], id: 'mention-2', timestamp: yesterday.toISOString() },
                { ...mockMentions[0], id: 'mention-3', timestamp: twoDaysAgo.toISOString() },
            ];

            mockRepository.query.mockResolvedValue({
                items: mentionsWithDates.map(m => ({ Data: m })),
            });

            const result = await cache.getMentions('user-123', {
                startDate: yesterday.toISOString(),
                endDate: now.toISOString(),
            });

            // Should only include mentions within date range
            expect(result.length).toBe(2);
            expect(result.every(m => new Date(m.timestamp) >= yesterday)).toBe(true);
        });
    });

    describe('getMonitoringConfig', () => {
        const mockConfig: AIMonitoringConfig = {
            id: 'config-1',
            userId: 'user-123',
            enabled: true,
            frequency: 'weekly',
            platforms: ['chatgpt', 'perplexity'],
            queryTemplates: ['template-1', 'template-2'],
            alertThreshold: 20,
            lastExecuted: new Date().toISOString(),
            nextScheduled: new Date().toISOString(),
            queriesThisPeriod: 10,
            queryLimit: 100,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        it('should fetch config from database on cache miss', async () => {
            mockRepository.getAIMonitoringConfig.mockResolvedValue(mockConfig);

            const result = await cache.getMonitoringConfig('user-123');

            expect(result).toEqual(mockConfig);
            expect(mockRepository.getAIMonitoringConfig).toHaveBeenCalledWith('user-123');
        });

        it('should return cached config on cache hit', async () => {
            mockRepository.getAIMonitoringConfig.mockResolvedValue(mockConfig);

            // First call
            await cache.getMonitoringConfig('user-123');

            // Second call
            const result = await cache.getMonitoringConfig('user-123');

            expect(result).toEqual(mockConfig);
            // Should only call repository once
            expect(mockRepository.getAIMonitoringConfig).toHaveBeenCalledTimes(1);
        });
    });

    describe('invalidate', () => {
        it('should invalidate all cache for a user', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: {} }],
            });
            mockRepository.getAIMonitoringConfig.mockResolvedValue({});

            // Populate cache
            await cache.getVisibilityScore('user-123');
            await cache.getMentions('user-123');
            await cache.getMonitoringConfig('user-123');

            // Invalidate
            cache.invalidate('user-123');

            // Next calls should hit database
            await cache.getVisibilityScore('user-123');
            await cache.getMentions('user-123');
            await cache.getMonitoringConfig('user-123');

            // Should call repository 6 times total (3 initial + 3 after invalidation)
            expect(mockRepository.query).toHaveBeenCalledTimes(4); // 2 for score, 2 for mentions
            expect(mockRepository.getAIMonitoringConfig).toHaveBeenCalledTimes(2);
        });

        it('should invalidate specific cache type', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: {} }],
            });
            mockRepository.getAIMonitoringConfig.mockResolvedValue({});

            // Populate cache
            await cache.getVisibilityScore('user-123');
            await cache.getMentions('user-123');

            // Invalidate only visibility score
            cache.invalidate('user-123', 'visibility-score');

            // Next calls
            await cache.getVisibilityScore('user-123'); // Should hit database
            await cache.getMentions('user-123'); // Should use cache

            // Score should be called twice, mentions only once
            expect(mockRepository.query).toHaveBeenCalledTimes(3); // 1 score + 1 mention + 1 score after invalidation
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: {} }],
            });

            // Populate cache
            await cache.getVisibilityScore('user-123');
            await cache.getMentions('user-123');

            const stats = cache.getStats();

            expect(stats.size).toBeGreaterThan(0);
            expect(stats.entries.length).toBeGreaterThan(0);
            expect(stats.entries[0]).toHaveProperty('key');
            expect(stats.entries[0]).toHaveProperty('age');
            expect(stats.entries[0]).toHaveProperty('ttl');
        });
    });

    describe('clear', () => {
        it('should clear all cache', async () => {
            mockRepository.query.mockResolvedValue({
                items: [{ Data: {} }],
            });

            // Populate cache
            await cache.getVisibilityScore('user-123');
            await cache.getMentions('user-123');

            // Clear cache
            cache.clear();

            const stats = cache.getStats();
            expect(stats.size).toBe(0);
        });
    });
});

describe('getAIVisibilityCacheService', () => {
    it('should return singleton instance', () => {
        const instance1 = getAIVisibilityCacheService();
        const instance2 = getAIVisibilityCacheService();

        expect(instance1).toBe(instance2);
    });
});

describe('invalidateAIVisibilityCache', () => {
    it('should invalidate cache for user', () => {
        const cache = getAIVisibilityCacheService();
        const invalidateSpy = jest.spyOn(cache, 'invalidate');

        invalidateAIVisibilityCache('user-123');

        expect(invalidateSpy).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should invalidate specific cache type', () => {
        const cache = getAIVisibilityCacheService();
        const invalidateSpy = jest.spyOn(cache, 'invalidate');

        invalidateAIVisibilityCache('user-123', 'visibility-score');

        expect(invalidateSpy).toHaveBeenCalledWith('user-123', 'visibility-score');
    });
});
