/**
 * Performance Metrics Server Actions
 * 
 * Server actions for recording and retrieving listing performance metrics.
 */

'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import {
    PerformanceMetrics,
    MetricEvent,
    TimePeriod,
    Platform,
    AggregatedMetrics,
} from '@/lib/performance-metrics-types';
import {
    getCurrentDate,
    getStartDate,
    formatDate,
    getDateRange,
    aggregateMetrics,
    createEmptyMetrics,
    incrementMetric,
} from '@/lib/performance-metrics';

/**
 * Records a view event for a listing
 */
export async function recordViewEvent(
    userId: string,
    listingId: string,
    platform?: Platform,
    source?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const date = getCurrentDate();
        const repository = getRepository();

        // Get or create metrics for today
        let metrics = await repository.getPerformanceMetrics<PerformanceMetrics>(
            userId,
            listingId,
            date
        );

        if (!metrics) {
            metrics = createEmptyMetrics(listingId, date);
        }

        // Increment view count
        const updated = incrementMetric(metrics, 'view', platform);

        // Save back to database
        await repository.savePerformanceMetrics(userId, listingId, date, updated);

        return { success: true };
    } catch (error: any) {
        console.error('Error recording view event:', error);
        return {
            success: false,
            error: error.message || 'Failed to record view event',
        };
    }
}

/**
 * Records a share event for a listing
 */
export async function recordShareEvent(
    userId: string,
    listingId: string,
    platform?: Platform
): Promise<{ success: boolean; error?: string }> {
    try {
        const date = getCurrentDate();
        const repository = getRepository();

        // Get or create metrics for today
        let metrics = await repository.getPerformanceMetrics<PerformanceMetrics>(
            userId,
            listingId,
            date
        );

        if (!metrics) {
            metrics = createEmptyMetrics(listingId, date);
        }

        // Increment share count
        const updated = incrementMetric(metrics, 'share', platform);

        // Save back to database
        await repository.savePerformanceMetrics(userId, listingId, date, updated);

        return { success: true };
    } catch (error: any) {
        console.error('Error recording share event:', error);
        return {
            success: false,
            error: error.message || 'Failed to record share event',
        };
    }
}

/**
 * Records an inquiry event for a listing
 */
export async function recordInquiryEvent(
    userId: string,
    listingId: string,
    platform?: Platform,
    inquiryData?: any
): Promise<{ success: boolean; error?: string }> {
    try {
        const date = getCurrentDate();
        const repository = getRepository();

        // Get or create metrics for today
        let metrics = await repository.getPerformanceMetrics<PerformanceMetrics>(
            userId,
            listingId,
            date
        );

        if (!metrics) {
            metrics = createEmptyMetrics(listingId, date);
        }

        // Increment inquiry count
        const updated = incrementMetric(metrics, 'inquiry', platform);

        // Save back to database
        await repository.savePerformanceMetrics(userId, listingId, date, updated);

        return { success: true };
    } catch (error: any) {
        console.error('Error recording inquiry event:', error);
        return {
            success: false,
            error: error.message || 'Failed to record inquiry event',
        };
    }
}

/**
 * Records a batch of metric events
 */
export async function recordMetricEvents(
    userId: string,
    events: MetricEvent[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const metricsByDate = new Map<string, PerformanceMetrics>();

        // Group events by date
        for (const event of events) {
            const date = formatDate(new Date(event.timestamp));
            const key = `${event.listingId}#${date}`;

            if (!metricsByDate.has(key)) {
                // Try to get existing metrics
                const existing = await repository.getPerformanceMetrics<PerformanceMetrics>(
                    userId,
                    event.listingId,
                    date
                );
                metricsByDate.set(
                    key,
                    existing || createEmptyMetrics(event.listingId, date)
                );
            }

            const metrics = metricsByDate.get(key)!;
            const updated = incrementMetric(metrics, event.eventType, event.platform);
            metricsByDate.set(key, updated);
        }

        // Save all updated metrics
        for (const [key, metrics] of metricsByDate) {
            const [listingId, date] = key.split('#');
            await repository.savePerformanceMetrics(userId, listingId, date, metrics);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error recording metric events:', error);
        return {
            success: false,
            error: error.message || 'Failed to record metric events',
        };
    }
}

/**
 * Gets metrics for a specific listing and date
 */
export async function getMetricsForDate(
    userId: string,
    listingId: string,
    date: string
): Promise<{ metrics: PerformanceMetrics | null; error?: string }> {
    try {
        const repository = getRepository();
        const metrics = await repository.getPerformanceMetrics<PerformanceMetrics>(
            userId,
            listingId,
            date
        );

        return { metrics };
    } catch (error: any) {
        console.error('Error getting metrics:', error);
        return {
            metrics: null,
            error: error.message || 'Failed to get metrics',
        };
    }
}

/**
 * Gets aggregated metrics for a listing over a time period
 */
export async function getAggregatedMetrics(
    userId: string,
    listingId: string,
    period: TimePeriod = 'weekly'
): Promise<{ metrics: AggregatedMetrics | null; error?: string }> {
    try {
        const repository = getRepository();
        const endDate = new Date();
        const startDate = getStartDate(period, endDate);

        // Get all dates in range
        const dates = getDateRange(startDate, endDate);

        // Fetch metrics for all dates
        const metricsPromises = dates.map((date) =>
            repository.getPerformanceMetrics<PerformanceMetrics>(userId, listingId, date)
        );

        const metricsResults = await Promise.all(metricsPromises);

        // Filter out nulls and create empty metrics for missing dates
        const metrics: PerformanceMetrics[] = dates.map((date, index) => {
            return metricsResults[index] || createEmptyMetrics(listingId, date);
        });

        // Aggregate the metrics
        const aggregated = aggregateMetrics(
            metrics,
            period,
            formatDate(startDate),
            formatDate(endDate)
        );

        return { metrics: aggregated };
    } catch (error: any) {
        console.error('Error getting aggregated metrics:', error);
        return {
            metrics: null,
            error: error.message || 'Failed to get aggregated metrics',
        };
    }
}

/**
 * Gets metrics for all listings for a user
 */
export async function getAllListingsMetrics(
    userId: string,
    period: TimePeriod = 'weekly'
): Promise<{
    metricsByListing: Record<string, AggregatedMetrics>;
    error?: string;
}> {
    try {
        const repository = getRepository();

        // Get all listings for the user
        const listingsResult = await repository.queryListings(userId);

        if (!listingsResult.items || listingsResult.items.length === 0) {
            return { metricsByListing: {} };
        }

        // Get metrics for each listing
        const metricsPromises = listingsResult.items.map(async (listing: any) => {
            const result = await getAggregatedMetrics(userId, listing.listingId, period);
            return {
                listingId: listing.listingId,
                metrics: result.metrics,
            };
        });

        const results = await Promise.all(metricsPromises);

        // Build map of listing ID to metrics
        const metricsByListing: Record<string, AggregatedMetrics> = {};
        for (const result of results) {
            if (result.metrics) {
                metricsByListing[result.listingId] = result.metrics;
            }
        }

        return { metricsByListing };
    } catch (error: any) {
        console.error('Error getting all listings metrics:', error);
        return {
            metricsByListing: {},
            error: error.message || 'Failed to get all listings metrics',
        };
    }
}

/**
 * Gets metrics for a date range
 */
export async function getMetricsForDateRange(
    userId: string,
    listingId: string,
    startDate: string,
    endDate: string
): Promise<{ metrics: PerformanceMetrics[]; error?: string }> {
    try {
        const repository = getRepository();
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get all dates in range
        const dates = getDateRange(start, end);

        // Fetch metrics for all dates
        const metricsPromises = dates.map((date) =>
            repository.getPerformanceMetrics<PerformanceMetrics>(userId, listingId, date)
        );

        const metricsResults = await Promise.all(metricsPromises);

        // Filter out nulls and create empty metrics for missing dates
        const metrics: PerformanceMetrics[] = dates.map((date, index) => {
            return metricsResults[index] || createEmptyMetrics(listingId, date);
        });

        return { metrics };
    } catch (error: any) {
        console.error('Error getting metrics for date range:', error);
        return {
            metrics: [],
            error: error.message || 'Failed to get metrics for date range',
        };
    }
}
