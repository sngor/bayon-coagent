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
    ComparativeMetrics,
    MetricEventType
} from '@/lib/types/performance-metrics-types';
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

        // Calculate previous period dates
        const previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        const previousStartDate = getStartDate(period, previousEndDate);

        // Get all dates in previous range
        const previousDates = getDateRange(previousStartDate, previousEndDate);

        // Fetch metrics for previous dates
        const previousMetricsPromises = previousDates.map((date) =>
            repository.getPerformanceMetrics<PerformanceMetrics>(userId, listingId, date)
        );

        const previousMetricsResults = await Promise.all(previousMetricsPromises);

        // Filter out nulls
        const previousMetrics: PerformanceMetrics[] = previousDates.map((date, index) => {
            return previousMetricsResults[index] || createEmptyMetrics(listingId, date);
        });

        // Aggregate previous metrics
        const previousAggregated = aggregateMetrics(
            previousMetrics,
            period,
            formatDate(previousStartDate),
            formatDate(previousEndDate)
        );

        // Aggregate current metrics
        const aggregated = aggregateMetrics(
            metrics,
            period,
            formatDate(startDate),
            formatDate(endDate)
        );

        // Calculate trends
        const calculatePercentageChange = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        aggregated.trends = {
            viewsChange: calculatePercentageChange(aggregated.totalViews, previousAggregated.totalViews),
            sharesChange: calculatePercentageChange(aggregated.totalShares, previousAggregated.totalShares),
            inquiriesChange: calculatePercentageChange(aggregated.totalInquiries, previousAggregated.totalInquiries),
        };

        // Calculate conversion rate
        if (aggregated.totalViews > 0) {
            aggregated.conversionRate = (aggregated.totalInquiries / aggregated.totalViews) * 100;
        } else {
            aggregated.conversionRate = 0;
        }

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

/**
 * Compares metrics for two listings
 */
export async function compareListingsMetrics(
    userId: string,
    listingId1: string,
    listingId2: string,
    period: TimePeriod = 'weekly'
): Promise<{ metrics: ComparativeMetrics | null; error?: string }> {
    try {
        const [result1, result2] = await Promise.all([
            getAggregatedMetrics(userId, listingId1, period),
            getAggregatedMetrics(userId, listingId2, period),
        ]);

        if (result1.error || !result1.metrics) {
            throw new Error(result1.error || `Failed to get metrics for listing ${listingId1}`);
        }

        if (result2.error || !result2.metrics) {
            throw new Error(result2.error || `Failed to get metrics for listing ${listingId2}`);
        }

        return {
            metrics: {
                period,
                listing1: {
                    listingId: listingId1,
                    metrics: result1.metrics,
                },
                listing2: {
                    listingId: listingId2,
                    metrics: result2.metrics,
                },
            },
        };
    } catch (error: any) {
        console.error('Error comparing listings metrics:', error);
        return {
            metrics: null,
            error: error.message || 'Failed to compare listings metrics',
        };
    }
}

import { analyzePerformanceMetrics } from '@/aws/bedrock/flows/analyze-performance-metrics';
import { AnalyzePerformanceMetricsOutput } from '@/ai/schemas/performance-metrics-schemas';

/**
 * Analyzes performance metrics using AI
 */
export async function analyzeMetrics(
    metrics: AggregatedMetrics,
    listingDetails?: { address?: string; price?: number }
): Promise<{ analysis: AnalyzePerformanceMetricsOutput | null; error?: string }> {
    try {
        const result = await analyzePerformanceMetrics({
            metrics: {
                period: metrics.period,
                totalViews: metrics.totalViews,
                totalShares: metrics.totalShares,
                totalInquiries: metrics.totalInquiries,
                conversionRate: metrics.conversionRate,
                byPlatform: metrics.byPlatform,
            },
            listingDetails,
        });

        return { analysis: result };
    } catch (error: any) {
        console.error('Error analyzing metrics:', error);
        return {
            analysis: null,
            error: error.message || 'Failed to analyze metrics',
        };
    }
}
/**
 * Gets basic listing details for comparison selection
 */
export async function getListingsForComparison(
    userId: string
): Promise<{ listings: { listingId: string; address: string; price: number; image?: string }[]; error?: string }> {
    try {
        const repository = getRepository();
        const result = await repository.queryListings<any>(userId);

        const listings = result.items.map((item) => ({
            listingId: item.listingId,
            address: item.address || 'Unknown Address',
            price: item.price || 0,
            image: item.images?.[0] || null,
        }));

        return { listings };
    } catch (error: any) {
        console.error('Error getting listings for comparison:', error);
        return {
            listings: [],
            error: error.message || 'Failed to get listings',
        };
    }
}
