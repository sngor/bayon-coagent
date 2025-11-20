/**
 * Performance Metrics Example Usage
 * 
 * Demonstrates how to use the performance metrics tracking system.
 */

import {
    recordViewEvent,
    recordShareEvent,
    recordInquiryEvent,
    getAggregatedMetrics,
    getAllListingsMetrics,
    getMetricsForDateRange,
} from './performance-metrics-actions';

/**
 * Example: Recording a view event
 */
async function exampleRecordView() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    // Record a view from Facebook
    const result = await recordViewEvent(userId, listingId, 'facebook', 'social-media');

    if (result.success) {
        console.log('View recorded successfully');
    } else {
        console.error('Failed to record view:', result.error);
    }
}

/**
 * Example: Recording a share event
 */
async function exampleRecordShare() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    // Record a share on Instagram
    const result = await recordShareEvent(userId, listingId, 'instagram');

    if (result.success) {
        console.log('Share recorded successfully');
    } else {
        console.error('Failed to record share:', result.error);
    }
}

/**
 * Example: Recording an inquiry event
 */
async function exampleRecordInquiry() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    // Record an inquiry from LinkedIn
    const result = await recordInquiryEvent(userId, listingId, 'linkedin', {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Interested in viewing this property',
    });

    if (result.success) {
        console.log('Inquiry recorded successfully');
    } else {
        console.error('Failed to record inquiry:', result.error);
    }
}

/**
 * Example: Getting weekly metrics for a listing
 */
async function exampleGetWeeklyMetrics() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    const result = await getAggregatedMetrics(userId, listingId, 'weekly');

    if (result.metrics) {
        console.log('Weekly Metrics:');
        console.log(`Total Views: ${result.metrics.totalViews}`);
        console.log(`Total Shares: ${result.metrics.totalShares}`);
        console.log(`Total Inquiries: ${result.metrics.totalInquiries}`);

        // Platform breakdown
        if (result.metrics.byPlatform.facebook) {
            console.log('Facebook:', result.metrics.byPlatform.facebook);
        }
        if (result.metrics.byPlatform.instagram) {
            console.log('Instagram:', result.metrics.byPlatform.instagram);
        }
        if (result.metrics.byPlatform.linkedin) {
            console.log('LinkedIn:', result.metrics.byPlatform.linkedin);
        }
    } else {
        console.error('Failed to get metrics:', result.error);
    }
}

/**
 * Example: Getting monthly metrics for a listing
 */
async function exampleGetMonthlyMetrics() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    const result = await getAggregatedMetrics(userId, listingId, 'monthly');

    if (result.metrics) {
        console.log('Monthly Metrics:');
        console.log(`Period: ${result.metrics.startDate} to ${result.metrics.endDate}`);
        console.log(`Total Views: ${result.metrics.totalViews}`);
        console.log(`Total Shares: ${result.metrics.totalShares}`);
        console.log(`Total Inquiries: ${result.metrics.totalInquiries}`);

        // Daily breakdown
        if (result.metrics.dailyBreakdown) {
            console.log('\nDaily Breakdown:');
            result.metrics.dailyBreakdown.forEach((day) => {
                if (day.views > 0 || day.shares > 0 || day.inquiries > 0) {
                    console.log(
                        `${day.date}: ${day.views} views, ${day.shares} shares, ${day.inquiries} inquiries`
                    );
                }
            });
        }
    } else {
        console.error('Failed to get metrics:', result.error);
    }
}

/**
 * Example: Getting metrics for all listings
 */
async function exampleGetAllListingsMetrics() {
    const userId = 'user-123';

    const result = await getAllListingsMetrics(userId, 'weekly');

    if (result.metricsByListing) {
        console.log('Metrics for all listings:');
        Object.entries(result.metricsByListing).forEach(([listingId, metrics]) => {
            console.log(`\nListing ${listingId}:`);
            console.log(`  Views: ${metrics.totalViews}`);
            console.log(`  Shares: ${metrics.totalShares}`);
            console.log(`  Inquiries: ${metrics.totalInquiries}`);
        });
    } else {
        console.error('Failed to get all listings metrics:', result.error);
    }
}

/**
 * Example: Getting metrics for a custom date range
 */
async function exampleGetCustomDateRange() {
    const userId = 'user-123';
    const listingId = 'listing-456';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const result = await getMetricsForDateRange(userId, listingId, startDate, endDate);

    if (result.metrics) {
        console.log(`Metrics from ${startDate} to ${endDate}:`);
        result.metrics.forEach((day) => {
            console.log(
                `${day.date}: ${day.views} views, ${day.shares} shares, ${day.inquiries} inquiries`
            );
        });
    } else {
        console.error('Failed to get metrics:', result.error);
    }
}

/**
 * Example: Tracking a complete user journey
 */
async function exampleCompleteJourney() {
    const userId = 'user-123';
    const listingId = 'listing-456';

    // User views the listing on Facebook
    await recordViewEvent(userId, listingId, 'facebook', 'social-media');

    // User shares the listing on Facebook
    await recordShareEvent(userId, listingId, 'facebook');

    // User views the listing again (from the share)
    await recordViewEvent(userId, listingId, 'facebook', 'share');

    // User submits an inquiry
    await recordInquiryEvent(userId, listingId, 'facebook', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0123',
        message: 'I would like to schedule a viewing',
    });

    // Get the metrics to see the journey
    const result = await getAggregatedMetrics(userId, listingId, 'daily');

    if (result.metrics) {
        console.log('Today\'s metrics:');
        console.log(`Views: ${result.metrics.totalViews}`);
        console.log(`Shares: ${result.metrics.totalShares}`);
        console.log(`Inquiries: ${result.metrics.totalInquiries}`);
    }
}

// Export examples for documentation
export {
    exampleRecordView,
    exampleRecordShare,
    exampleRecordInquiry,
    exampleGetWeeklyMetrics,
    exampleGetMonthlyMetrics,
    exampleGetAllListingsMetrics,
    exampleGetCustomDateRange,
    exampleCompleteJourney,
};
