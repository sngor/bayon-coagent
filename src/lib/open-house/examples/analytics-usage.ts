/**
 * Example Usage: Open House Analytics Utilities
 * 
 * This file demonstrates how to use the analytics calculation utilities
 * for the Open House Enhancement feature.
 */

import {
    calculateCompleteDashboardAnalytics,
    calculateSessionAnalytics,
    calculateRealTimeStats,
    calculatePerformanceComparison,
    checkMilestones,
    filterSessionsByDateRange,
    filterVisitorsByDateRange,
} from "@/lib/open-house-analytics";
import {
    OpenHouseSession,
    Visitor,
    SessionStatus,
    InterestLevel,
} from "@/lib/open-house/types";

// ============================================================================
// Example 1: Calculate Dashboard Analytics
// ============================================================================

export async function exampleDashboardAnalytics(
    sessions: OpenHouseSession[],
    visitors: Visitor[]
) {
    // Calculate complete dashboard analytics
    const analytics = calculateCompleteDashboardAnalytics(sessions, visitors);

    console.log("Dashboard Analytics:");
    console.log(`  Total Sessions: ${analytics.totalSessions}`);
    console.log(`  Total Visitors: ${analytics.totalVisitors}`);
    console.log(`  Average Visitors per Session: ${analytics.averageVisitorsPerSession.toFixed(1)}`);
    console.log(`  Average Interest Level: ${analytics.averageInterestLevel.toFixed(2)}`);

    // Display trends
    console.log("\nVisitor Count Trends:");
    analytics.trends.visitorCounts.forEach(point => {
        console.log(`  ${point.date}: ${point.value} visitors`);
    });

    // Display top performing properties
    console.log("\nTop Performing Properties:");
    analytics.topPerformingProperties.forEach((property, index) => {
        console.log(`  ${index + 1}. ${property.propertyAddress}`);
        console.log(`     Sessions: ${property.sessionCount}`);
        console.log(`     Total Visitors: ${property.totalVisitors}`);
        console.log(`     Avg Interest: ${property.averageInterestLevel.toFixed(2)}`);
    });

    return analytics;
}

// ============================================================================
// Example 2: Calculate Session-Level Analytics
// ============================================================================

export async function exampleSessionAnalytics(
    session: OpenHouseSession,
    visitors: Visitor[]
) {
    // Calculate analytics for a specific session
    const analytics = calculateSessionAnalytics(session, visitors);

    console.log(`Session Analytics for ${session.propertyAddress}:`);
    console.log(`  Total Visitors: ${analytics.totalVisitors}`);
    console.log(`  Duration: ${analytics.duration} minutes`);
    console.log(`  Peak Check-in Time: ${analytics.peakCheckInTime}`);
    console.log(`  Interest Distribution:`);
    console.log(`    High: ${analytics.interestLevelDistribution.high}`);
    console.log(`    Medium: ${analytics.interestLevelDistribution.medium}`);
    console.log(`    Low: ${analytics.interestLevelDistribution.low}`);
    console.log(`  Follow-ups Sent: ${analytics.followUpsSent}`);

    // Display check-in timeline
    console.log("\nCheck-in Timeline:");
    analytics.checkInTimeline.forEach(point => {
        const time = new Date(point.timestamp).toLocaleTimeString();
        console.log(`  ${time}: Visitor #${point.cumulativeCount} (${point.interestLevel})`);
    });

    return analytics;
}

// ============================================================================
// Example 3: Filter Analytics by Date Range
// ============================================================================

export async function exampleDateRangeFiltering(
    allSessions: OpenHouseSession[],
    allVisitors: Visitor[],
    startDate: string,
    endDate: string
) {
    // Filter sessions and visitors by date range
    const filteredSessions = filterSessionsByDateRange(allSessions, startDate, endDate);
    const filteredVisitors = filterVisitorsByDateRange(allVisitors, startDate, endDate);

    console.log(`Analytics for ${startDate} to ${endDate}:`);
    console.log(`  Sessions in range: ${filteredSessions.length}`);
    console.log(`  Visitors in range: ${filteredVisitors.length}`);

    // Calculate analytics for filtered data
    const analytics = calculateCompleteDashboardAnalytics(
        filteredSessions,
        filteredVisitors
    );

    console.log(`  Average Visitors per Session: ${analytics.averageVisitorsPerSession.toFixed(1)}`);
    console.log(`  Average Interest Level: ${analytics.averageInterestLevel.toFixed(2)}`);

    return analytics;
}

// ============================================================================
// Example 4: Real-time Statistics for Active Session
// ============================================================================

export async function exampleRealTimeStats(
    activeSession: OpenHouseSession,
    currentVisitors: Visitor[]
) {
    // Calculate real-time stats
    const stats = calculateRealTimeStats(activeSession, currentVisitors);

    console.log("Real-time Session Statistics:");
    console.log(`  Current Visitors: ${stats.currentVisitorCount}`);
    console.log(`  Elapsed Time: ${stats.elapsedTime} minutes`);
    console.log(`  Interest Distribution:`);
    console.log(`    High: ${stats.interestLevelDistribution.high}`);
    console.log(`    Medium: ${stats.interestLevelDistribution.medium}`);
    console.log(`    Low: ${stats.interestLevelDistribution.low}`);

    // Check for milestones
    const milestones = checkMilestones(activeSession, currentVisitors);
    const reachedMilestones = milestones.filter(m => m.reached);

    if (reachedMilestones.length > 0) {
        console.log("\n🎉 Milestones Reached:");
        reachedMilestones.forEach(m => {
            console.log(`  ✓ ${m.milestone}`);
        });
    }

    return stats;
}

// ============================================================================
// Example 5: Performance Comparison
// ============================================================================

export async function examplePerformanceComparison(
    currentSession: OpenHouseSession,
    currentVisitors: Visitor[],
    historicalSessions: OpenHouseSession[],
    historicalVisitors: Visitor[]
) {
    // Compare current session to historical average
    const comparison = calculatePerformanceComparison(
        currentSession,
        currentVisitors,
        historicalSessions,
        historicalVisitors
    );

    console.log("Performance Comparison:");
    console.log(`  Visitor Count: ${comparison.visitorCountComparison}`);
    console.log(`    Difference: ${comparison.visitorCountDifference > 0 ? '+' : ''}${comparison.visitorCountDifference.toFixed(1)}`);
    console.log(`  Interest Level: ${comparison.interestLevelComparison}`);
    console.log(`    Difference: ${comparison.interestLevelDifference > 0 ? '+' : ''}${comparison.interestLevelDifference.toFixed(2)}`);

    // Provide feedback
    if (comparison.visitorCountComparison === "above") {
        console.log("\n✨ Great turnout! This session has more visitors than average.");
    } else if (comparison.visitorCountComparison === "below") {
        console.log("\n💡 Lower turnout than average. Consider adjusting timing or marketing.");
    }

    if (comparison.interestLevelComparison === "above") {
        console.log("🎯 Visitors are showing higher interest than usual!");
    }

    return comparison;
}

// ============================================================================
// Example 6: Complete Analytics Workflow
// ============================================================================

export async function exampleCompleteWorkflow(
    userId: string,
    dateRange?: { startDate: string; endDate: string }
) {
    // In a real implementation, these would be fetched from DynamoDB
    const allSessions: OpenHouseSession[] = []; // Fetch from repository
    const allVisitors: Visitor[] = []; // Fetch from repository

    // Apply date range filter if provided
    const sessions = dateRange
        ? filterSessionsByDateRange(allSessions, dateRange.startDate, dateRange.endDate)
        : allSessions;

    const visitors = dateRange
        ? filterVisitorsByDateRange(allVisitors, dateRange.startDate, dateRange.endDate)
        : allVisitors;

    // Calculate dashboard analytics
    const dashboardAnalytics = calculateCompleteDashboardAnalytics(sessions, visitors);

    // Find active sessions
    const activeSessions = sessions.filter(s => s.status === SessionStatus.ACTIVE);

    // Calculate real-time stats for each active session
    const activeSessionStats = activeSessions.map(session => {
        const sessionVisitors = visitors.filter(v => v.sessionId === session.sessionId);
        return {
            session,
            stats: calculateRealTimeStats(session, sessionVisitors),
            milestones: checkMilestones(session, sessionVisitors),
        };
    });

    // Calculate analytics for completed sessions
    const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED);
    const sessionAnalytics = completedSessions.map(session => {
        const sessionVisitors = visitors.filter(v => v.sessionId === session.sessionId);
        return calculateSessionAnalytics(session, sessionVisitors);
    });

    return {
        dashboard: dashboardAnalytics,
        activeSessions: activeSessionStats,
        completedSessions: sessionAnalytics,
    };
}

// ============================================================================
// Example 7: Milestone Notifications
// ============================================================================

export async function exampleMilestoneNotifications(
    session: OpenHouseSession,
    visitors: Visitor[]
) {
    const milestones = checkMilestones(session, visitors);

    // Filter to only newly reached milestones
    // In a real implementation, you'd track which milestones have already been notified
    const newMilestones = milestones.filter(m => m.reached);

    // Send notifications for new milestones
    for (const milestone of newMilestones) {
        console.log(`🔔 Milestone Notification: ${milestone.milestone}`);

        // In a real implementation, you might:
        // - Show a toast notification in the UI
        // - Send a push notification
        // - Log to analytics
        // - Trigger a celebration animation
    }

    return newMilestones;
}

// ============================================================================
// Example 8: Trend Analysis
// ============================================================================

export async function exampleTrendAnalysis(
    sessions: OpenHouseSession[],
    visitors: Visitor[]
) {
    // Create visitor map by session
    const visitorsBySession = new Map<string, Visitor[]>();
    visitors.forEach(visitor => {
        if (!visitorsBySession.has(visitor.sessionId)) {
            visitorsBySession.set(visitor.sessionId, []);
        }
        visitorsBySession.get(visitor.sessionId)!.push(visitor);
    });

    // Calculate analytics
    const analytics = calculateCompleteDashboardAnalytics(sessions, visitors);

    // Analyze visitor count trend
    const visitorTrend = analytics.trends.visitorCounts;
    if (visitorTrend.length >= 2) {
        const recent = visitorTrend[visitorTrend.length - 1].value;
        const previous = visitorTrend[visitorTrend.length - 2].value;
        const change = ((recent - previous) / previous) * 100;

        console.log("Visitor Count Trend:");
        console.log(`  Recent: ${recent} visitors`);
        console.log(`  Previous: ${previous} visitors`);
        console.log(`  Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
    }

    // Analyze interest level trend
    const interestTrend = analytics.trends.interestLevels;
    if (interestTrend.length >= 2) {
        const recent = interestTrend[interestTrend.length - 1].value;
        const previous = interestTrend[interestTrend.length - 2].value;
        const change = recent - previous;

        console.log("\nInterest Level Trend:");
        console.log(`  Recent: ${recent.toFixed(2)}`);
        console.log(`  Previous: ${previous.toFixed(2)}`);
        console.log(`  Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}`);
    }

    // Analyze conversion trend
    const conversionTrend = analytics.trends.conversionMetrics;
    if (conversionTrend.length >= 2) {
        const recent = conversionTrend[conversionTrend.length - 1].value;
        const previous = conversionTrend[conversionTrend.length - 2].value;
        const change = recent - previous;

        console.log("\nConversion Rate Trend:");
        console.log(`  Recent: ${recent.toFixed(1)}%`);
        console.log(`  Previous: ${previous.toFixed(1)}%`);
        console.log(`  Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
    }

    return analytics.trends;
}
