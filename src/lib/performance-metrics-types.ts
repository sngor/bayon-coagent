/**
 * Performance Metrics Types
 * 
 * Type definitions for listing performance tracking across social media platforms.
 */

/**
 * Platform-specific metrics
 */
export interface PlatformMetrics {
    views: number;
    shares: number;
    inquiries: number;
    lastUpdated: number;
}

/**
 * Performance metrics for a listing on a specific date
 */
export interface PerformanceMetrics {
    listingId: string;
    date: string; // YYYY-MM-DD format
    views: number;
    shares: number;
    inquiries: number;
    platforms: {
        facebook?: PlatformMetrics;
        instagram?: PlatformMetrics;
        linkedin?: PlatformMetrics;
    };
    updatedAt: number;
}

/**
 * Metric event types
 */
export type MetricEventType = 'view' | 'share' | 'inquiry';

/**
 * Platform types
 */
export type Platform = 'facebook' | 'instagram' | 'linkedin';

/**
 * Metric event data
 */
export interface MetricEvent {
    listingId: string;
    eventType: MetricEventType;
    platform?: Platform;
    source?: string;
    timestamp: number;
}

/**
 * Time period for aggregation
 */
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Aggregated metrics result
 */
export interface AggregatedMetrics {
    period: TimePeriod;
    startDate: string;
    endDate: string;
    totalViews: number;
    totalShares: number;
    totalInquiries: number;
    byPlatform: {
        facebook?: PlatformMetrics;
        instagram?: PlatformMetrics;
        linkedin?: PlatformMetrics;
    };
    dailyBreakdown?: PerformanceMetrics[];
}
