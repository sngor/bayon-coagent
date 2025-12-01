/**
 * Content Analytics Service - Content Workflow Features
 * 
 * This module provides analytics tracking and aggregation for content workflow features.
 * It re-exports the core analytics service with content-workflow-specific functionality.
 * 
 * Core Functionality:
 * - Track publication with comprehensive metadata capture
 * - Get content analytics with real-time metric aggregation
 * - Get analytics by type with advanced filtering
 * - Time range filtering (7d, 30d, 90d, custom)
 * - Calculate engagement rates with industry benchmarking
 * 
 * Validates Requirements: 5.1, 5.2, 5.4
 * 
 * @module content-analytics-service
 */

// Re-export the core analytics service
export {
    AnalyticsService,
    analyticsService,
    // Core tracking functions
    trackPublication,
    getContentAnalytics,
    getAnalyticsByType,
    getAnalyticsForTimeRange,
    getBenchmarkComparison,
    // A/B Testing functions
    createABTest,
    getABTestResults,
    trackABTestMetrics,
    // ROI tracking functions
    trackROIEvent,
    getROIAnalytics,
    exportROIData,
    // External analytics sync
    syncExternalAnalytics,
    // Types
    type TrackPublicationParams,
    type GetContentAnalyticsParams,
    type GetAnalyticsByTypeParams,
    type CreateABTestParams,
    type GetABTestResultsParams,
    type TrackROIEventParams,
    type GetROIAnalyticsParams,
    type ExportROIDataParams,
    TimeRangePreset,
} from '../analytics/analytics-service';

// Re-export content workflow types
export type {
    Analytics,
    EngagementMetrics,
    TypeAnalytics,
    ContentSummary,
    TrendDataPoint,
    ABTest,
    ABTestResults,
    VariationResults,
    ROI,
    ROIAnalytics,
    ROIMetrics,
    ContentROI,
    FunnelStep,
    SyncResult,
    ExternalAnalyticsData,
} from '@/lib/content-workflow-types';

/**
 * Default export for convenience
 */
export { analyticsService as default } from '../analytics/analytics-service';
