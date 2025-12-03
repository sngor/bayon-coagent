/**
 * Mobile Agent Features - Main Export
 * 
 * Central export point for mobile-specific types and utilities.
 */

// Export all types
export * from './types';

// Re-export repository for convenience
export { repository } from '@/aws/dynamodb/repository';

// Export analytics
export {
    getMobileAnalytics,
    resetMobileAnalytics,
    trackFeatureUsage,
    trackMobileError,
    trackPerformance,
    trackEngagement,
    type MobileFeature,
    type CaptureType,
    type ShareMethod,
    type QuickActionType,
    type FeatureUsageEvent,
    type MobileErrorEvent,
    type PerformanceMetric,
    type OfflineQueueMetric,
    type EngagementMetric,
    type DeviceInfo,
} from './analytics';

export {
    useMobileAnalytics,
    useQuickCaptureAnalytics,
    useQuickActionsAnalytics,
    useShareAnalytics,
    useVoiceNotesAnalytics,
    useLocationAnalytics,
    usePerformanceTracking,
    useRenderTracking,
} from './use-mobile-analytics';
