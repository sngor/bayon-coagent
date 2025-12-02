/**
 * Open House Analytics Calculation Utilities
 * 
 * Provides calculation functions for open house analytics including:
 * - Dashboard metrics (total sessions, visitors, averages)
 * - Session-level analytics
 * - Trend calculations
 * 
 * Validates Requirements: 5.1, 5.2, 5.4
 */

import {
    OpenHouseSession,
    Visitor,
    SessionAnalytics,
    DashboardAnalytics,
    CheckInTimelinePoint,
    TrendDataPoint,
    PropertyPerformance,
    InterestLevel,
    AnalyticsTrends,
    InterestLevelDistribution,
} from "./open-house/types";

// ============================================================================
// Dashboard Metrics Calculation
// ============================================================================

/**
 * Calculate dashboard analytics from sessions and visitors
 * 
 * Property 27: Dashboard analytics calculate correct aggregates
 * For any user with sessions, the analytics dashboard should correctly calculate
 * totalSessions, totalVisitors, averageVisitorsPerSession, and averageInterestLevel
 * 
 * Validates: Requirements 5.1
 */
export function calculateDashboardMetrics(
    sessions: OpenHouseSession[],
    allVisitors: Visitor[]
): Omit<DashboardAnalytics, "trends" | "topPerformingProperties"> {
    const totalSessions = sessions.length;
    const totalVisitors = allVisitors.length;

    // Calculate average visitors per session
    const averageVisitorsPerSession = totalSessions > 0
        ? totalVisitors / totalSessions
        : 0;

    // Calculate average interest level across all visitors
    const averageInterestLevel = calculateAverageInterestLevel(allVisitors);

    return {
        totalSessions,
        totalVisitors,
        averageVisitorsPerSession,
        averageInterestLevel,
    };
}

/**
 * Calculate average interest level from visitors
 * Interest levels are mapped to numeric values: low=1, medium=2, high=3
 */
export function calculateAverageInterestLevel(visitors: Visitor[]): number {
    if (visitors.length === 0) return 0;

    const interestLevelValues: Record<InterestLevel, number> = {
        [InterestLevel.LOW]: 1,
        [InterestLevel.MEDIUM]: 2,
        [InterestLevel.HIGH]: 3,
    };

    const sum = visitors.reduce((acc, visitor) => {
        return acc + interestLevelValues[visitor.interestLevel];
    }, 0);

    return sum / visitors.length;
}

/**
 * Calculate top performing properties
 * 
 * Validates: Requirements 5.5
 */
export function calculateTopPerformingProperties(
    sessions: OpenHouseSession[],
    visitorsBySession: Map<string, Visitor[]>,
    limit: number = 5
): PropertyPerformance[] {
    // Group sessions by property address
    const propertyMap = new Map<string, {
        sessions: OpenHouseSession[];
        visitors: Visitor[];
    }>();

    sessions.forEach(session => {
        const visitors = visitorsBySession.get(session.sessionId) || [];

        if (!propertyMap.has(session.propertyAddress)) {
            propertyMap.set(session.propertyAddress, {
                sessions: [],
                visitors: [],
            });
        }

        const property = propertyMap.get(session.propertyAddress)!;
        property.sessions.push(session);
        property.visitors.push(...visitors);
    });

    // Calculate performance metrics for each property
    const performances: PropertyPerformance[] = Array.from(propertyMap.entries()).map(
        ([propertyAddress, { sessions, visitors }]) => ({
            propertyAddress,
            sessionCount: sessions.length,
            totalVisitors: visitors.length,
            averageInterestLevel: calculateAverageInterestLevel(visitors),
        })
    );

    // Sort by total visitors (descending) and return top N
    return performances
        .sort((a, b) => b.totalVisitors - a.totalVisitors)
        .slice(0, limit);
}

// ============================================================================
// Session-Level Analytics Calculation
// ============================================================================

/**
 * Calculate analytics for a single session
 * 
 * Property 29: Session analytics calculate correct metrics
 * For any session, session-level analytics should correctly calculate visitor
 * distribution, peak check-in times, and session duration
 * 
 * Validates: Requirements 5.4
 */
export function calculateSessionAnalytics(
    session: OpenHouseSession,
    visitors: Visitor[]
): SessionAnalytics {
    const totalVisitors = visitors.length;
    const interestLevelDistribution = session.interestLevelDistribution;
    const averageInterestLevel = calculateAverageInterestLevel(visitors);

    // Calculate check-in timeline
    const checkInTimeline = calculateCheckInTimeline(visitors);

    // Find peak check-in time (time with most check-ins in a 15-minute window)
    const peakCheckInTime = findPeakCheckInTime(visitors);

    // Calculate session duration in minutes
    const duration = calculateSessionDuration(session);

    // Count follow-ups sent
    const followUpsSent = visitors.filter(v => v.followUpSent).length;

    // Calculate follow-up response rate (based on engagement tracking)
    const followUpResponseRate = calculateFollowUpResponseRate(visitors);

    return {
        sessionId: session.sessionId,
        totalVisitors,
        interestLevelDistribution,
        averageInterestLevel,
        checkInTimeline,
        peakCheckInTime,
        duration,
        followUpsSent,
        followUpResponseRate,
    };
}

/**
 * Calculate check-in timeline from visitors
 * Returns chronologically ordered timeline points
 * 
 * Property 31: Check-in timeline includes all check-ins
 * For any session with check-ins, the timeline should include all check-ins
 * in chronological order
 * 
 * Validates: Requirements 11.3
 */
export function calculateCheckInTimeline(visitors: Visitor[]): CheckInTimelinePoint[] {
    // Sort visitors by check-in time
    const sortedVisitors = [...visitors].sort((a, b) =>
        new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime()
    );

    // Create timeline points with cumulative count
    return sortedVisitors.map((visitor, index) => ({
        timestamp: visitor.checkInTime,
        cumulativeCount: index + 1,
        interestLevel: visitor.interestLevel,
    }));
}

/**
 * Find peak check-in time (15-minute window with most check-ins)
 */
export function findPeakCheckInTime(visitors: Visitor[]): string | undefined {
    if (visitors.length === 0) return undefined;

    // Sort visitors by check-in time
    const sortedVisitors = [...visitors].sort((a, b) =>
        new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime()
    );

    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
    let maxCount = 0;
    let peakTime = sortedVisitors[0].checkInTime;

    // Sliding window to find peak
    for (let i = 0; i < sortedVisitors.length; i++) {
        const windowStart = new Date(sortedVisitors[i].checkInTime).getTime();
        const windowEnd = windowStart + WINDOW_MS;

        // Count visitors in this window
        let count = 0;
        for (let j = i; j < sortedVisitors.length; j++) {
            const checkInTime = new Date(sortedVisitors[j].checkInTime).getTime();
            if (checkInTime <= windowEnd) {
                count++;
            } else {
                break;
            }
        }

        if (count > maxCount) {
            maxCount = count;
            peakTime = sortedVisitors[i].checkInTime;
        }
    }

    return peakTime;
}

/**
 * Calculate session duration in minutes
 */
export function calculateSessionDuration(session: OpenHouseSession): number {
    if (!session.actualStartTime || !session.actualEndTime) {
        return 0;
    }

    const startTime = new Date(session.actualStartTime).getTime();
    const endTime = new Date(session.actualEndTime).getTime();

    return Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
}

/**
 * Calculate follow-up response rate
 * Response rate = (visitors who opened or clicked) / (visitors who received follow-up)
 */
export function calculateFollowUpResponseRate(visitors: Visitor[]): number {
    const sentFollowUps = visitors.filter(v => v.followUpSent);

    if (sentFollowUps.length === 0) return 0;

    // Note: This would need to be enhanced with actual engagement data
    // For now, we return 0 as engagement tracking is implemented separately
    return 0;
}

// ============================================================================
// Trend Calculations
// ============================================================================

/**
 * Calculate visitor count trends over time
 * Groups sessions by date and calculates total visitors per day
 * 
 * Validates: Requirements 5.2
 */
export function calculateVisitorCountTrends(
    sessions: OpenHouseSession[],
    visitorsBySession: Map<string, Visitor[]>
): TrendDataPoint[] {
    // Group by date
    const dateMap = new Map<string, number>();

    sessions.forEach(session => {
        const date = session.scheduledDate; // Already in ISO format (YYYY-MM-DD)
        const visitors = visitorsBySession.get(session.sessionId) || [];

        dateMap.set(date, (dateMap.get(date) || 0) + visitors.length);
    });

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate interest level trends over time
 * Groups sessions by date and calculates average interest level per day
 * 
 * Validates: Requirements 5.2
 */
export function calculateInterestLevelTrends(
    sessions: OpenHouseSession[],
    visitorsBySession: Map<string, Visitor[]>
): TrendDataPoint[] {
    // Group by date
    const dateMap = new Map<string, Visitor[]>();

    sessions.forEach(session => {
        const date = session.scheduledDate;
        const visitors = visitorsBySession.get(session.sessionId) || [];

        if (!dateMap.has(date)) {
            dateMap.set(date, []);
        }

        dateMap.get(date)!.push(...visitors);
    });

    // Calculate average interest level per date
    return Array.from(dateMap.entries())
        .map(([date, visitors]) => ({
            date,
            value: calculateAverageInterestLevel(visitors),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate conversion metric trends over time
 * Conversion = percentage of high-interest visitors
 * 
 * Validates: Requirements 5.2
 */
export function calculateConversionTrends(
    sessions: OpenHouseSession[],
    visitorsBySession: Map<string, Visitor[]>
): TrendDataPoint[] {
    // Group by date
    const dateMap = new Map<string, Visitor[]>();

    sessions.forEach(session => {
        const date = session.scheduledDate;
        const visitors = visitorsBySession.get(session.sessionId) || [];

        if (!dateMap.has(date)) {
            dateMap.set(date, []);
        }

        dateMap.get(date)!.push(...visitors);
    });

    // Calculate conversion rate per date
    return Array.from(dateMap.entries())
        .map(([date, visitors]) => {
            if (visitors.length === 0) return { date, value: 0 };

            const highInterestCount = visitors.filter(
                v => v.interestLevel === InterestLevel.HIGH
            ).length;

            return {
                date,
                value: (highInterestCount / visitors.length) * 100, // Percentage
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate all trends
 * 
 * Validates: Requirements 5.2
 */
export function calculateTrends(
    sessions: OpenHouseSession[],
    visitorsBySession: Map<string, Visitor[]>
): AnalyticsTrends {
    return {
        visitorCounts: calculateVisitorCountTrends(sessions, visitorsBySession),
        interestLevels: calculateInterestLevelTrends(sessions, visitorsBySession),
        conversionMetrics: calculateConversionTrends(sessions, visitorsBySession),
    };
}

// ============================================================================
// Complete Dashboard Analytics
// ============================================================================

/**
 * Calculate complete dashboard analytics
 * Combines all metrics, trends, and top performers
 * 
 * Validates: Requirements 5.1, 5.2, 5.5
 */
export function calculateCompleteDashboardAnalytics(
    sessions: OpenHouseSession[],
    allVisitors: Visitor[]
): DashboardAnalytics {
    // Create visitor map by session
    const visitorsBySession = new Map<string, Visitor[]>();
    allVisitors.forEach(visitor => {
        if (!visitorsBySession.has(visitor.sessionId)) {
            visitorsBySession.set(visitor.sessionId, []);
        }
        visitorsBySession.get(visitor.sessionId)!.push(visitor);
    });

    // Calculate base metrics
    const baseMetrics = calculateDashboardMetrics(sessions, allVisitors);

    // Calculate trends
    const trends = calculateTrends(sessions, visitorsBySession);

    // Calculate top performing properties
    const topPerformingProperties = calculateTopPerformingProperties(
        sessions,
        visitorsBySession
    );

    return {
        ...baseMetrics,
        trends,
        topPerformingProperties,
    };
}

// ============================================================================
// Date Range Filtering
// ============================================================================

/**
 * Filter sessions by date range
 * 
 * Property 28: Date range filters apply correctly
 * For any date range filter, only sessions within that range should be
 * included in analytics calculations
 * 
 * Validates: Requirements 5.3
 */
export function filterSessionsByDateRange(
    sessions: OpenHouseSession[],
    startDate?: string,
    endDate?: string
): OpenHouseSession[] {
    return sessions.filter(session => {
        const sessionDate = session.scheduledDate;

        if (startDate && sessionDate < startDate) {
            return false;
        }

        if (endDate && sessionDate > endDate) {
            return false;
        }

        return true;
    });
}

/**
 * Filter visitors by date range (based on check-in time)
 */
export function filterVisitorsByDateRange(
    visitors: Visitor[],
    startDate?: string,
    endDate?: string
): Visitor[] {
    return visitors.filter(visitor => {
        const checkInDate = visitor.checkInTime.split('T')[0]; // Extract date part

        if (startDate && checkInDate < startDate) {
            return false;
        }

        if (endDate && checkInDate > endDate) {
            return false;
        }

        return true;
    });
}

// ============================================================================
// Real-time Statistics
// ============================================================================

/**
 * Calculate real-time statistics for an active session
 * 
 * Property 30: Real-time stats reflect current state
 * For any active session, real-time statistics should accurately reflect
 * the current visitor count and interest level distribution
 * 
 * Validates: Requirements 11.1
 */
export function calculateRealTimeStats(
    session: OpenHouseSession,
    visitors: Visitor[]
): {
    currentVisitorCount: number;
    interestLevelDistribution: InterestLevelDistribution;
    elapsedTime: number; // Minutes
} {
    const currentVisitorCount = visitors.length;

    // Recalculate interest level distribution from current visitors
    const interestLevelDistribution: InterestLevelDistribution = {
        high: visitors.filter(v => v.interestLevel === InterestLevel.HIGH).length,
        medium: visitors.filter(v => v.interestLevel === InterestLevel.MEDIUM).length,
        low: visitors.filter(v => v.interestLevel === InterestLevel.LOW).length,
    };

    // Calculate elapsed time
    let elapsedTime = 0;
    if (session.actualStartTime) {
        const startTime = new Date(session.actualStartTime).getTime();
        const currentTime = Date.now();
        elapsedTime = Math.round((currentTime - startTime) / (1000 * 60)); // Minutes
    }

    return {
        currentVisitorCount,
        interestLevelDistribution,
        elapsedTime,
    };
}

// ============================================================================
// Performance Comparison
// ============================================================================

/**
 * Calculate performance comparison indicators
 * Compares current session to average of all previous sessions
 * 
 * Property 32: Performance comparisons use correct baselines
 * For any session, performance indicators should correctly compare to
 * the average of all previous sessions
 * 
 * Validates: Requirements 11.4
 */
export function calculatePerformanceComparison(
    currentSession: OpenHouseSession,
    currentVisitors: Visitor[],
    allPreviousSessions: OpenHouseSession[],
    allPreviousVisitors: Visitor[]
): {
    visitorCountComparison: "above" | "below" | "average";
    interestLevelComparison: "above" | "below" | "average";
    visitorCountDifference: number;
    interestLevelDifference: number;
} {
    // Calculate averages from previous sessions
    const previousMetrics = calculateDashboardMetrics(
        allPreviousSessions,
        allPreviousVisitors
    );

    const currentVisitorCount = currentVisitors.length;
    const currentInterestLevel = calculateAverageInterestLevel(currentVisitors);

    // Calculate differences
    const visitorCountDifference = currentVisitorCount - previousMetrics.averageVisitorsPerSession;
    const interestLevelDifference = currentInterestLevel - previousMetrics.averageInterestLevel;

    // Determine comparison (with 10% tolerance for "average")
    const visitorTolerance = previousMetrics.averageVisitorsPerSession * 0.1;
    const interestTolerance = 0.2; // 0.2 on a 1-3 scale

    const visitorCountComparison =
        Math.abs(visitorCountDifference) <= visitorTolerance ? "average" :
            visitorCountDifference > 0 ? "above" : "below";

    const interestLevelComparison =
        Math.abs(interestLevelDifference) <= interestTolerance ? "average" :
            interestLevelDifference > 0 ? "above" : "below";

    return {
        visitorCountComparison,
        interestLevelComparison,
        visitorCountDifference,
        interestLevelDifference,
    };
}

// ============================================================================
// Milestone Detection
// ============================================================================

/**
 * Check if session has reached any milestones
 * 
 * Property 33: Milestones trigger at correct thresholds
 * For any session, milestone notifications should trigger when the session
 * reaches defined thresholds (10th visitor, 1 hour elapsed, etc.)
 * 
 * Validates: Requirements 11.5
 */
export function checkMilestones(
    session: OpenHouseSession,
    visitors: Visitor[]
): {
    milestone: string;
    reached: boolean;
}[] {
    const milestones = [
        {
            milestone: "First Visitor",
            reached: visitors.length >= 1,
        },
        {
            milestone: "5 Visitors",
            reached: visitors.length >= 5,
        },
        {
            milestone: "10 Visitors",
            reached: visitors.length >= 10,
        },
        {
            milestone: "25 Visitors",
            reached: visitors.length >= 25,
        },
        {
            milestone: "50 Visitors",
            reached: visitors.length >= 50,
        },
    ];

    // Add time-based milestones if session is active
    if (session.actualStartTime) {
        const elapsedMinutes = Math.round(
            (Date.now() - new Date(session.actualStartTime).getTime()) / (1000 * 60)
        );

        milestones.push(
            {
                milestone: "30 Minutes",
                reached: elapsedMinutes >= 30,
            },
            {
                milestone: "1 Hour",
                reached: elapsedMinutes >= 60,
            },
            {
                milestone: "2 Hours",
                reached: elapsedMinutes >= 120,
            }
        );
    }

    return milestones;
}
