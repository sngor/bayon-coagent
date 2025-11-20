/**
 * Performance Metrics Utilities
 * 
 * Helper functions for working with performance metrics data.
 */

import {
    PerformanceMetrics,
    AggregatedMetrics,
    TimePeriod,
    Platform,
    PlatformMetrics,
} from './performance-metrics-types';

/**
 * Formats a date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Gets the current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
    return formatDate(new Date());
}

/**
 * Parses a date string in YYYY-MM-DD format
 */
export function parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z');
}

/**
 * Gets the start date for a time period
 */
export function getStartDate(period: TimePeriod, endDate: Date = new Date()): Date {
    const start = new Date(endDate);

    switch (period) {
        case 'daily':
            // Same day
            return start;
        case 'weekly':
            // 7 days ago
            start.setDate(start.getDate() - 6);
            return start;
        case 'monthly':
            // 30 days ago
            start.setDate(start.getDate() - 29);
            return start;
    }
}

/**
 * Gets all dates in a range (inclusive)
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

/**
 * Aggregates metrics across multiple days
 */
export function aggregateMetrics(
    metrics: PerformanceMetrics[],
    period: TimePeriod,
    startDate: string,
    endDate: string
): AggregatedMetrics {
    const aggregated: AggregatedMetrics = {
        period,
        startDate,
        endDate,
        totalViews: 0,
        totalShares: 0,
        totalInquiries: 0,
        byPlatform: {},
        dailyBreakdown: metrics,
    };

    // Aggregate totals
    for (const metric of metrics) {
        aggregated.totalViews += metric.views;
        aggregated.totalShares += metric.shares;
        aggregated.totalInquiries += metric.inquiries;

        // Aggregate by platform
        for (const [platform, platformMetrics] of Object.entries(metric.platforms)) {
            if (!aggregated.byPlatform[platform as Platform]) {
                aggregated.byPlatform[platform as Platform] = {
                    views: 0,
                    shares: 0,
                    inquiries: 0,
                    lastUpdated: 0,
                };
            }

            const aggPlatform = aggregated.byPlatform[platform as Platform]!;
            aggPlatform.views += platformMetrics.views;
            aggPlatform.shares += platformMetrics.shares;
            aggPlatform.inquiries += platformMetrics.inquiries;
            aggPlatform.lastUpdated = Math.max(
                aggPlatform.lastUpdated,
                platformMetrics.lastUpdated
            );
        }
    }

    return aggregated;
}

/**
 * Creates an empty metrics object for a date
 */
export function createEmptyMetrics(listingId: string, date: string): PerformanceMetrics {
    return {
        listingId,
        date,
        views: 0,
        shares: 0,
        inquiries: 0,
        platforms: {},
        updatedAt: Date.now(),
    };
}

/**
 * Creates an empty platform metrics object
 */
export function createEmptyPlatformMetrics(): PlatformMetrics {
    return {
        views: 0,
        shares: 0,
        inquiries: 0,
        lastUpdated: Date.now(),
    };
}

/**
 * Increments a metric value
 */
export function incrementMetric(
    metrics: PerformanceMetrics,
    eventType: 'view' | 'share' | 'inquiry',
    platform?: Platform
): PerformanceMetrics {
    const updated = { ...metrics };
    const now = Date.now();

    // Increment total based on event type
    if (eventType === 'view') {
        updated.views += 1;
    } else if (eventType === 'share') {
        updated.shares += 1;
    } else if (eventType === 'inquiry') {
        updated.inquiries += 1;
    }
    updated.updatedAt = now;

    // Increment platform-specific if provided
    if (platform) {
        if (!updated.platforms[platform]) {
            updated.platforms[platform] = createEmptyPlatformMetrics();
        }
        const platformMetrics = updated.platforms[platform]!;

        if (eventType === 'view') {
            platformMetrics.views += 1;
        } else if (eventType === 'share') {
            platformMetrics.shares += 1;
        } else if (eventType === 'inquiry') {
            platformMetrics.inquiries += 1;
        }
        platformMetrics.lastUpdated = now;
    }

    return updated;
}
