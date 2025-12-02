/**
 * Analytics Actions Usage Examples
 * 
 * This file demonstrates how to use the analytics server actions
 * for retrieving session-level and dashboard-level analytics.
 * 
 * Validates Requirements: 5.1, 5.3, 5.4, 5.5
 */

import {
    getSessionAnalytics,
    getDashboardAnalytics,
    getPropertyPerformanceComparison,
    getTopPerformingProperties,
} from '@/app/(app)/open-house/actions';

// ============================================================================
// Example 1: Get Session-Level Analytics
// ============================================================================

/**
 * Retrieve analytics for a specific open house session
 * 
 * Use case: Display detailed metrics on a session detail page
 * Validates: Requirements 5.4
 */
export async function exampleGetSessionAnalytics() {
    const sessionId = 'session-123';

    const result = await getSessionAnalytics(sessionId);

    if (result.success && result.data) {
        const analytics = result.data;

        console.log('Session Analytics:');
        console.log('- Total Visitors:', analytics.totalVisitors);
        console.log('- Interest Distribution:', analytics.interestLevelDistribution);
        console.log('- Average Interest Level:', analytics.averageInterestLevel);
        console.log('- Peak Check-in Time:', analytics.peakCheckInTime);
        console.log('- Duration (minutes):', analytics.duration);
        console.log('- Follow-ups Sent:', analytics.followUpsSent);
        console.log('- Response Rate:', analytics.followUpResponseRate);

        // Check-in timeline
        console.log('\nCheck-in Timeline:');
        analytics.checkInTimeline.forEach(point => {
            console.log(`  ${point.timestamp}: ${point.cumulativeCount} visitors (${point.interestLevel})`);
        });
    } else {
        console.error('Failed to load session analytics:', result.error);
    }
}

// ============================================================================
// Example 2: Get Dashboard Analytics (All Sessions)
// ============================================================================

/**
 * Retrieve dashboard analytics for all sessions
 * 
 * Use case: Display overview metrics on the analytics dashboard
 * Validates: Requirements 5.1
 */
export async function exampleGetDashboardAnalytics() {
    const result = await getDashboardAnalytics();

    if (result.success && result.data) {
        const analytics = result.data;

        console.log('Dashboard Analytics:');
        console.log('- Total Sessions:', analytics.totalSessions);
        console.log('- Total Visitors:', analytics.totalVisitors);
        console.log('- Average Visitors per Session:', analytics.averageVisitorsPerSession.toFixed(2));
        console.log('- Average Interest Level:', analytics.averageInterestLevel.toFixed(2));

        // Trends
        console.log('\nVisitor Count Trends:');
        analytics.trends.visitorCounts.forEach(point => {
            console.log(`  ${point.date}: ${point.value} visitors`);
        });

        // Top performing properties
        console.log('\nTop Performing Properties:');
        analytics.topPerformingProperties.forEach((property, index) => {
            console.log(`  ${index + 1}. ${property.propertyAddress}`);
            console.log(`     Sessions: ${property.sessionCount}`);
            console.log(`     Total Visitors: ${property.totalVisitors}`);
            console.log(`     Avg Interest: ${property.averageInterestLevel.toFixed(2)}`);
        });
    } else {
        console.error('Failed to load dashboard analytics:', result.error);
    }
}

// ============================================================================
// Example 3: Get Dashboard Analytics with Date Range Filter
// ============================================================================

/**
 * Retrieve dashboard analytics for a specific date range
 * 
 * Use case: View analytics for last month, last quarter, etc.
 * Validates: Requirements 5.3
 */
export async function exampleGetDashboardAnalyticsWithDateRange() {
    // Get analytics for last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const result = await getDashboardAnalytics({
        startDate,
        endDate,
    });

    if (result.success && result.data) {
        console.log(`Analytics for ${startDate} to ${endDate}:`);
        console.log('- Total Sessions:', result.data.totalSessions);
        console.log('- Total Visitors:', result.data.totalVisitors);
        console.log('- Average Visitors per Session:', result.data.averageVisitorsPerSession.toFixed(2));
    } else {
        console.error('Failed to load analytics:', result.error);
    }
}

// ============================================================================
// Example 4: Get Dashboard Analytics with Status Filter
// ============================================================================

/**
 * Retrieve dashboard analytics filtered by session status
 * 
 * Use case: View analytics for only completed sessions
 * Validates: Requirements 5.1, 5.3
 */
export async function exampleGetDashboardAnalyticsByStatus() {
    const result = await getDashboardAnalytics({
        status: 'completed',
    });

    if (result.success && result.data) {
        console.log('Analytics for Completed Sessions:');
        console.log('- Total Sessions:', result.data.totalSessions);
        console.log('- Total Visitors:', result.data.totalVisitors);
        console.log('- Average Visitors per Session:', result.data.averageVisitorsPerSession.toFixed(2));
    } else {
        console.error('Failed to load analytics:', result.error);
    }
}

// ============================================================================
// Example 5: Get Dashboard Analytics with Property Filter
// ============================================================================

/**
 * Retrieve dashboard analytics for a specific property
 * 
 * Use case: View analytics for all sessions at a particular property
 * Validates: Requirements 5.1, 5.3
 */
export async function exampleGetDashboardAnalyticsByProperty() {
    const result = await getDashboardAnalytics({
        propertyId: 'property-456',
    });

    if (result.success && result.data) {
        console.log('Analytics for Property:');
        console.log('- Total Sessions:', result.data.totalSessions);
        console.log('- Total Visitors:', result.data.totalVisitors);
        console.log('- Average Visitors per Session:', result.data.averageVisitorsPerSession.toFixed(2));
    } else {
        console.error('Failed to load analytics:', result.error);
    }
}

// ============================================================================
// Example 6: Get Property Performance Comparison
// ============================================================================

/**
 * Compare performance across multiple properties
 * 
 * Use case: Compare which properties attract more visitors
 * Validates: Requirements 5.5
 */
export async function exampleGetPropertyPerformanceComparison() {
    const propertyAddresses = [
        '123 Main St, City, State',
        '456 Oak Ave, City, State',
        '789 Pine Rd, City, State',
    ];

    const result = await getPropertyPerformanceComparison(propertyAddresses);

    if (result.success && result.data) {
        console.log('Property Performance Comparison:');
        result.data.forEach(property => {
            console.log(`\n${property.propertyAddress}:`);
            console.log(`  Sessions: ${property.sessionCount}`);
            console.log(`  Total Visitors: ${property.totalVisitors}`);
            console.log(`  Average Interest Level: ${property.averageInterestLevel.toFixed(2)}`);
        });
    } else {
        console.error('Failed to load property comparison:', result.error);
    }
}

// ============================================================================
// Example 7: Get Property Performance with Date Range
// ============================================================================

/**
 * Compare property performance within a specific date range
 * 
 * Use case: Compare Q1 vs Q2 performance for properties
 * Validates: Requirements 5.5
 */
export async function exampleGetPropertyPerformanceWithDateRange() {
    const propertyAddresses = [
        '123 Main St, City, State',
        '456 Oak Ave, City, State',
    ];

    const result = await getPropertyPerformanceComparison(
        propertyAddresses,
        {
            startDate: '2024-01-01',
            endDate: '2024-03-31',
        }
    );

    if (result.success && result.data) {
        console.log('Q1 2024 Property Performance:');
        result.data.forEach(property => {
            console.log(`\n${property.propertyAddress}:`);
            console.log(`  Sessions: ${property.sessionCount}`);
            console.log(`  Total Visitors: ${property.totalVisitors}`);
            console.log(`  Average Interest Level: ${property.averageInterestLevel.toFixed(2)}`);
        });
    } else {
        console.error('Failed to load property comparison:', result.error);
    }
}

// ============================================================================
// Example 8: Get Top Performing Properties
// ============================================================================

/**
 * Get the top N performing properties by visitor count
 * 
 * Use case: Display "Top 5 Properties" widget on dashboard
 * Validates: Requirements 5.5
 */
export async function exampleGetTopPerformingProperties() {
    const result = await getTopPerformingProperties(5);

    if (result.success && result.data) {
        console.log('Top 5 Performing Properties:');
        result.data.forEach((property, index) => {
            console.log(`\n${index + 1}. ${property.propertyAddress}`);
            console.log(`   Sessions: ${property.sessionCount}`);
            console.log(`   Total Visitors: ${property.totalVisitors}`);
            console.log(`   Average Interest Level: ${property.averageInterestLevel.toFixed(2)}`);
        });
    } else {
        console.error('Failed to load top properties:', result.error);
    }
}

// ============================================================================
// Example 9: Get Top Performing Properties with Date Range
// ============================================================================

/**
 * Get top performing properties within a specific date range
 * 
 * Use case: "Top Properties This Month" widget
 * Validates: Requirements 5.5
 */
export async function exampleGetTopPerformingPropertiesThisMonth() {
    // Get first and last day of current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    const result = await getTopPerformingProperties(5, {
        startDate,
        endDate,
    });

    if (result.success && result.data) {
        console.log('Top 5 Properties This Month:');
        result.data.forEach((property, index) => {
            console.log(`\n${index + 1}. ${property.propertyAddress}`);
            console.log(`   Sessions: ${property.sessionCount}`);
            console.log(`   Total Visitors: ${property.totalVisitors}`);
            console.log(`   Average Interest Level: ${property.averageInterestLevel.toFixed(2)}`);
        });
    } else {
        console.error('Failed to load top properties:', result.error);
    }
}

// ============================================================================
// Example 10: Combined Analytics Dashboard
// ============================================================================

/**
 * Load all analytics data for a comprehensive dashboard
 * 
 * Use case: Main analytics dashboard page
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function exampleLoadCompleteDashboard() {
    // Load dashboard analytics
    const dashboardResult = await getDashboardAnalytics();

    // Load top performing properties
    const topPropertiesResult = await getTopPerformingProperties(5);

    if (dashboardResult.success && topPropertiesResult.success) {
        const dashboard = dashboardResult.data!;
        const topProperties = topPropertiesResult.data!;

        console.log('=== OPEN HOUSE ANALYTICS DASHBOARD ===\n');

        // Overview metrics
        console.log('OVERVIEW:');
        console.log(`  Total Sessions: ${dashboard.totalSessions}`);
        console.log(`  Total Visitors: ${dashboard.totalVisitors}`);
        console.log(`  Avg Visitors/Session: ${dashboard.averageVisitorsPerSession.toFixed(2)}`);
        console.log(`  Avg Interest Level: ${dashboard.averageInterestLevel.toFixed(2)}/3.0`);

        // Trends
        console.log('\nTRENDS:');
        console.log('  Recent Visitor Counts:');
        dashboard.trends.visitorCounts.slice(-7).forEach(point => {
            console.log(`    ${point.date}: ${point.value} visitors`);
        });

        // Top properties
        console.log('\nTOP PERFORMING PROPERTIES:');
        topProperties.forEach((property, index) => {
            console.log(`  ${index + 1}. ${property.propertyAddress}`);
            console.log(`     ${property.totalVisitors} visitors across ${property.sessionCount} sessions`);
        });
    } else {
        console.error('Failed to load dashboard data');
    }
}

// ============================================================================
// React Component Usage Examples
// ============================================================================

/**
 * Example React component using session analytics
 */
export function SessionAnalyticsComponent({ sessionId }: { sessionId: string }) {
    // In a real component, you would use React hooks and state management
    // This is a simplified example showing the action call

    const loadAnalytics = async () => {
        const result = await getSessionAnalytics(sessionId);

        if (result.success && result.data) {
            // Update component state with analytics data
            return result.data;
        } else {
            // Handle error
            console.error(result.error);
            return null;
        }
    };

    // Call loadAnalytics in useEffect or on button click
    return null; // Placeholder
}

/**
 * Example React component using dashboard analytics with filters
 */
export function DashboardAnalyticsComponent() {
    const loadAnalytics = async (filters: {
        startDate?: string;
        endDate?: string;
        status?: string;
    }) => {
        const result = await getDashboardAnalytics(filters);

        if (result.success && result.data) {
            // Update component state with analytics data
            return result.data;
        } else {
            // Handle error
            console.error(result.error);
            return null;
        }
    };

    // Call loadAnalytics with different filters based on user selection
    return null; // Placeholder
}
