/**
 * Performance Metrics Utilities Tests
 * 
 * Tests for performance metrics helper functions.
 */

import { describe, it, expect } from '@jest/globals';
import {
    formatDate,
    getCurrentDate,
    parseDate,
    getStartDate,
    getDateRange,
    aggregateMetrics,
    createEmptyMetrics,
    createEmptyPlatformMetrics,
    incrementMetric,
} from '../performance-metrics';
import { PerformanceMetrics, TimePeriod, Platform, PlatformMetrics } from '../types/performance-metrics-types';

describe('Performance Metrics Utilities', () => {
    describe('formatDate', () => {
        it('should format date to YYYY-MM-DD', () => {
            const date = new Date('2024-01-15T12:30:00Z');
            expect(formatDate(date)).toBe('2024-01-15');
        });

        it('should handle different dates', () => {
            expect(formatDate(new Date('2024-12-31T23:59:59Z'))).toBe('2024-12-31');
            expect(formatDate(new Date('2024-01-01T00:00:00Z'))).toBe('2024-01-01');
        });
    });

    describe('getCurrentDate', () => {
        it('should return current date in YYYY-MM-DD format', () => {
            const result = getCurrentDate();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('parseDate', () => {
        it('should parse YYYY-MM-DD string to Date', () => {
            const date = parseDate('2024-01-15');
            expect(date.getUTCFullYear()).toBe(2024);
            expect(date.getUTCMonth()).toBe(0); // January is 0
            expect(date.getUTCDate()).toBe(15);
        });
    });

    describe('getStartDate', () => {
        it('should return same date for daily period', () => {
            const endDate = new Date('2024-01-15T12:00:00Z');
            const startDate = getStartDate('daily', endDate);
            expect(formatDate(startDate)).toBe('2024-01-15');
        });

        it('should return 7 days ago for weekly period', () => {
            const endDate = new Date('2024-01-15T12:00:00Z');
            const startDate = getStartDate('weekly', endDate);
            expect(formatDate(startDate)).toBe('2024-01-09');
        });

        it('should return 30 days ago for monthly period', () => {
            const endDate = new Date('2024-01-31T12:00:00Z');
            const startDate = getStartDate('monthly', endDate);
            expect(formatDate(startDate)).toBe('2024-01-02');
        });
    });

    describe('getDateRange', () => {
        it('should return all dates in range inclusive', () => {
            const start = new Date('2024-01-15T00:00:00Z');
            const end = new Date('2024-01-17T00:00:00Z');
            const dates = getDateRange(start, end);

            expect(dates).toEqual(['2024-01-15', '2024-01-16', '2024-01-17']);
        });

        it('should return single date when start equals end', () => {
            const date = new Date('2024-01-15T00:00:00Z');
            const dates = getDateRange(date, date);

            expect(dates).toEqual(['2024-01-15']);
        });

        it('should handle month boundaries', () => {
            const start = new Date('2024-01-30T00:00:00Z');
            const end = new Date('2024-02-02T00:00:00Z');
            const dates = getDateRange(start, end);

            expect(dates).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
        });
    });

    describe('createEmptyMetrics', () => {
        it('should create empty metrics object', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');

            expect(metrics.listingId).toBe('listing-1');
            expect(metrics.date).toBe('2024-01-15');
            expect(metrics.views).toBe(0);
            expect(metrics.shares).toBe(0);
            expect(metrics.inquiries).toBe(0);
            expect(metrics.platforms).toEqual({});
            expect(metrics.updatedAt).toBeGreaterThan(0);
        });
    });

    describe('createEmptyPlatformMetrics', () => {
        it('should create empty platform metrics', () => {
            const metrics = createEmptyPlatformMetrics();

            expect(metrics.views).toBe(0);
            expect(metrics.shares).toBe(0);
            expect(metrics.inquiries).toBe(0);
            expect(metrics.lastUpdated).toBeGreaterThan(0);
        });
    });

    describe('incrementMetric', () => {
        it('should increment view count', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');
            const updated = incrementMetric(metrics, 'view');

            expect(updated.views).toBe(1);
            expect(updated.shares).toBe(0);
            expect(updated.inquiries).toBe(0);
        });

        it('should increment share count', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');
            const updated = incrementMetric(metrics, 'share');

            expect(updated.views).toBe(0);
            expect(updated.shares).toBe(1);
            expect(updated.inquiries).toBe(0);
        });

        it('should increment inquiry count', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');
            const updated = incrementMetric(metrics, 'inquiry');

            expect(updated.views).toBe(0);
            expect(updated.shares).toBe(0);
            expect(updated.inquiries).toBe(1);
        });

        it('should increment platform-specific metrics', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');
            const updated = incrementMetric(metrics, 'view', 'facebook');

            expect(updated.views).toBe(1);
            expect(updated.platforms.facebook?.views).toBe(1);
            expect(updated.platforms.facebook?.shares).toBe(0);
        });

        it('should handle multiple increments', () => {
            let metrics = createEmptyMetrics('listing-1', '2024-01-15');
            metrics = incrementMetric(metrics, 'view');
            metrics = incrementMetric(metrics, 'view');
            metrics = incrementMetric(metrics, 'share');

            expect(metrics.views).toBe(2);
            expect(metrics.shares).toBe(1);
        });

        it('should update timestamp', () => {
            const metrics = createEmptyMetrics('listing-1', '2024-01-15');
            const originalTime = metrics.updatedAt;

            // Wait a bit to ensure timestamp changes
            const updated = incrementMetric(metrics, 'view');

            expect(updated.updatedAt).toBeGreaterThanOrEqual(originalTime);
        });
    });

    describe('aggregateMetrics', () => {
        it('should aggregate metrics across multiple days', () => {
            const metrics: PerformanceMetrics[] = [
                {
                    listingId: 'listing-1',
                    date: '2024-01-15',
                    views: 10,
                    shares: 2,
                    inquiries: 1,
                    platforms: {
                        facebook: { views: 5, shares: 1, inquiries: 0, lastUpdated: Date.now() },
                        instagram: { views: 5, shares: 1, inquiries: 1, lastUpdated: Date.now() },
                    },
                    updatedAt: Date.now(),
                },
                {
                    listingId: 'listing-1',
                    date: '2024-01-16',
                    views: 15,
                    shares: 3,
                    inquiries: 2,
                    platforms: {
                        facebook: { views: 10, shares: 2, inquiries: 1, lastUpdated: Date.now() },
                        linkedin: { views: 5, shares: 1, inquiries: 1, lastUpdated: Date.now() },
                    },
                    updatedAt: Date.now(),
                },
            ];

            const aggregated = aggregateMetrics(metrics, 'weekly', '2024-01-15', '2024-01-16');

            expect(aggregated.totalViews).toBe(25);
            expect(aggregated.totalShares).toBe(5);
            expect(aggregated.totalInquiries).toBe(3);
            expect(aggregated.byPlatform.facebook?.views).toBe(15);
            expect(aggregated.byPlatform.instagram?.views).toBe(5);
            expect(aggregated.byPlatform.linkedin?.views).toBe(5);
        });

        it('should handle empty metrics array', () => {
            const aggregated = aggregateMetrics([], 'daily', '2024-01-15', '2024-01-15');

            expect(aggregated.totalViews).toBe(0);
            expect(aggregated.totalShares).toBe(0);
            expect(aggregated.totalInquiries).toBe(0);
            expect(Object.keys(aggregated.byPlatform)).toHaveLength(0);
        });

        it('should include daily breakdown', () => {
            const metrics: PerformanceMetrics[] = [
                createEmptyMetrics('listing-1', '2024-01-15'),
                createEmptyMetrics('listing-1', '2024-01-16'),
            ];

            const aggregated = aggregateMetrics(metrics, 'weekly', '2024-01-15', '2024-01-16');

            expect(aggregated.dailyBreakdown).toEqual(metrics);
        });

        it('should set correct period and date range', () => {
            const metrics: PerformanceMetrics[] = [
                createEmptyMetrics('listing-1', '2024-01-15'),
            ];

            const aggregated = aggregateMetrics(metrics, 'monthly', '2024-01-01', '2024-01-31');

            expect(aggregated.period).toBe('monthly');
            expect(aggregated.startDate).toBe('2024-01-01');
            expect(aggregated.endDate).toBe('2024-01-31');
        });
    });
});
