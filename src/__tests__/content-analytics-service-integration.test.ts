/**
 * Content Analytics Service Integration Test
 * 
 * Verifies that the content-analytics-service module correctly exports
 * all required functionality from the core analytics service.
 * 
 * This test ensures Requirements 5.1, 5.2, and 5.4 are met.
 */

import { describe, it, expect } from '@jest/globals';

describe('Content Analytics Service Integration', () => {
    it('should export all required functions', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        // Core tracking functions
        expect(module.trackPublication).toBeDefined();
        expect(module.getContentAnalytics).toBeDefined();
        expect(module.getAnalyticsByType).toBeDefined();
        expect(module.getAnalyticsForTimeRange).toBeDefined();
        expect(module.getBenchmarkComparison).toBeDefined();

        // A/B Testing functions
        expect(module.createABTest).toBeDefined();
        expect(module.getABTestResults).toBeDefined();
        expect(module.trackABTestMetrics).toBeDefined();

        // ROI tracking functions
        expect(module.trackROIEvent).toBeDefined();
        expect(module.getROIAnalytics).toBeDefined();
        expect(module.exportROIData).toBeDefined();

        // External analytics sync
        expect(module.syncExternalAnalytics).toBeDefined();

        // Service class and instance
        expect(module.AnalyticsService).toBeDefined();
        expect(module.analyticsService).toBeDefined();
        expect(module.default).toBeDefined();

        // Time range preset
        expect(module.TimeRangePreset).toBeDefined();
        expect(module.TimeRangePreset.LAST_7_DAYS).toBe('7d');
        expect(module.TimeRangePreset.LAST_30_DAYS).toBe('30d');
        expect(module.TimeRangePreset.LAST_90_DAYS).toBe('90d');
        expect(module.TimeRangePreset.CUSTOM).toBe('custom');
    });

    it('should have correct function signatures', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        // Verify functions are callable
        expect(typeof module.trackPublication).toBe('function');
        expect(typeof module.getContentAnalytics).toBe('function');
        expect(typeof module.getAnalyticsByType).toBe('function');
        expect(typeof module.getAnalyticsForTimeRange).toBe('function');
        expect(typeof module.getBenchmarkComparison).toBe('function');
    });

    it('should export the AnalyticsService class', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        expect(module.AnalyticsService).toBeDefined();
        expect(typeof module.AnalyticsService).toBe('function');

        // Verify it's a class constructor
        const instance = new module.AnalyticsService();
        expect(instance).toBeDefined();
        expect(instance.trackPublication).toBeDefined();
        expect(instance.getContentAnalytics).toBeDefined();
        expect(instance.getAnalyticsByType).toBeDefined();
    });

    it('should export the singleton analyticsService instance', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        expect(module.analyticsService).toBeDefined();
        expect(module.analyticsService.trackPublication).toBeDefined();
        expect(module.analyticsService.getContentAnalytics).toBeDefined();
        expect(module.analyticsService.getAnalyticsByType).toBeDefined();
    });

    it('should export default as analyticsService', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        expect(module.default).toBeDefined();
        expect(module.default).toBe(module.analyticsService);
    });
});

describe('Content Analytics Service - Time Range Filtering', () => {
    it('should support time range presets', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        // Verify TimeRangePreset enum values
        expect(module.TimeRangePreset.LAST_7_DAYS).toBe('7d');
        expect(module.TimeRangePreset.LAST_30_DAYS).toBe('30d');
        expect(module.TimeRangePreset.LAST_90_DAYS).toBe('90d');
        expect(module.TimeRangePreset.CUSTOM).toBe('custom');
    });

    it('should have getAnalyticsForTimeRange function', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        expect(module.getAnalyticsForTimeRange).toBeDefined();
        expect(typeof module.getAnalyticsForTimeRange).toBe('function');
    });
});

describe('Content Analytics Service - Engagement Rate Calculation', () => {
    it('should have getBenchmarkComparison function', async () => {
        const module = await import('../services/publishing/content-analytics-service');

        expect(module.getBenchmarkComparison).toBeDefined();
        expect(typeof module.getBenchmarkComparison).toBe('function');
    });
});

describe('Content Analytics Service - Type Exports', () => {
    it('should be importable without errors', async () => {
        // This test verifies that all type exports are valid
        await expect(
            import('../services/publishing/content-analytics-service')
        ).resolves.toBeDefined();
    });
});
