/**
 * Tests for Open House Analytics Calculation Utilities
 * 
 * Validates Requirements: 5.1, 5.2, 5.4
 */

import {
    calculateDashboardMetrics,
    calculateSessionAnalytics,
    calculateCheckInTimeline,
    calculateVisitorCountTrends,
    calculateInterestLevelTrends,
    calculateConversionTrends,
    calculateRealTimeStats,
    calculatePerformanceComparison,
    checkMilestones,
    filterSessionsByDateRange,
    calculateAverageInterestLevel,
    findPeakCheckInTime,
    calculateSessionDuration,
    calculateTopPerformingProperties,
} from "@/lib/open-house-analytics";
import {
    OpenHouseSession,
    Visitor,
    SessionStatus,
    InterestLevel,
    CheckInSource,
} from "@/lib/open-house/types";

describe("Open House Analytics", () => {
    // Helper function to create test session
    const createTestSession = (overrides?: Partial<OpenHouseSession>): OpenHouseSession => ({
        sessionId: "session-1",
        userId: "user-1",
        propertyAddress: "123 Main St",
        scheduledDate: "2024-12-15",
        scheduledStartTime: "2024-12-15T14:00:00Z",
        scheduledEndTime: "2024-12-15T16:00:00Z",
        actualStartTime: "2024-12-15T14:00:00Z",
        actualEndTime: "2024-12-15T16:00:00Z",
        status: SessionStatus.COMPLETED,
        qrCodeUrl: "https://example.com/qr/session-1",
        visitorCount: 0,
        interestLevelDistribution: { high: 0, medium: 0, low: 0 },
        photos: [],
        createdAt: "2024-12-15T13:00:00Z",
        updatedAt: "2024-12-15T16:00:00Z",
        ...overrides,
    });

    // Helper function to create test visitor
    const createTestVisitor = (overrides?: Partial<Visitor>): Visitor => ({
        visitorId: "visitor-1",
        sessionId: "session-1",
        userId: "user-1",
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        interestLevel: InterestLevel.HIGH,
        checkInTime: "2024-12-15T14:30:00Z",
        followUpGenerated: false,
        followUpSent: false,
        source: CheckInSource.MANUAL,
        createdAt: "2024-12-15T14:30:00Z",
        updatedAt: "2024-12-15T14:30:00Z",
        ...overrides,
    });

    describe("calculateDashboardMetrics", () => {
        it("should calculate correct metrics for multiple sessions", () => {
            const sessions = [
                createTestSession({ sessionId: "session-1" }),
                createTestSession({ sessionId: "session-2" }),
                createTestSession({ sessionId: "session-3" }),
            ];

            const visitors = [
                createTestVisitor({ visitorId: "v1", sessionId: "session-1", interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ visitorId: "v2", sessionId: "session-1", interestLevel: InterestLevel.MEDIUM }),
                createTestVisitor({ visitorId: "v3", sessionId: "session-2", interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ visitorId: "v4", sessionId: "session-2", interestLevel: InterestLevel.LOW }),
                createTestVisitor({ visitorId: "v5", sessionId: "session-3", interestLevel: InterestLevel.MEDIUM }),
            ];

            const metrics = calculateDashboardMetrics(sessions, visitors);

            expect(metrics.totalSessions).toBe(3);
            expect(metrics.totalVisitors).toBe(5);
            expect(metrics.averageVisitorsPerSession).toBeCloseTo(5 / 3, 2);
            expect(metrics.averageInterestLevel).toBeCloseTo((3 + 2 + 3 + 1 + 2) / 5, 2);
        });

        it("should handle empty sessions", () => {
            const metrics = calculateDashboardMetrics([], []);

            expect(metrics.totalSessions).toBe(0);
            expect(metrics.totalVisitors).toBe(0);
            expect(metrics.averageVisitorsPerSession).toBe(0);
            expect(metrics.averageInterestLevel).toBe(0);
        });
    });

    describe("calculateAverageInterestLevel", () => {
        it("should calculate correct average for mixed interest levels", () => {
            const visitors = [
                createTestVisitor({ interestLevel: InterestLevel.HIGH }), // 3
                createTestVisitor({ interestLevel: InterestLevel.MEDIUM }), // 2
                createTestVisitor({ interestLevel: InterestLevel.LOW }), // 1
            ];

            const average = calculateAverageInterestLevel(visitors);
            expect(average).toBeCloseTo(2, 2); // (3 + 2 + 1) / 3 = 2
        });

        it("should return 0 for empty visitor list", () => {
            const average = calculateAverageInterestLevel([]);
            expect(average).toBe(0);
        });
    });

    describe("calculateSessionAnalytics", () => {
        it("should calculate complete session analytics", () => {
            const session = createTestSession({
                sessionId: "session-1",
                actualStartTime: "2024-12-15T14:00:00Z",
                actualEndTime: "2024-12-15T16:00:00Z",
                interestLevelDistribution: { high: 2, medium: 1, low: 1 },
            });

            const visitors = [
                createTestVisitor({
                    visitorId: "v1",
                    interestLevel: InterestLevel.HIGH,
                    checkInTime: "2024-12-15T14:10:00Z",
                }),
                createTestVisitor({
                    visitorId: "v2",
                    interestLevel: InterestLevel.HIGH,
                    checkInTime: "2024-12-15T14:20:00Z",
                }),
                createTestVisitor({
                    visitorId: "v3",
                    interestLevel: InterestLevel.MEDIUM,
                    checkInTime: "2024-12-15T14:30:00Z",
                }),
                createTestVisitor({
                    visitorId: "v4",
                    interestLevel: InterestLevel.LOW,
                    checkInTime: "2024-12-15T15:00:00Z",
                }),
            ];

            const analytics = calculateSessionAnalytics(session, visitors);

            expect(analytics.sessionId).toBe("session-1");
            expect(analytics.totalVisitors).toBe(4);
            expect(analytics.interestLevelDistribution).toEqual({ high: 2, medium: 1, low: 1 });
            expect(analytics.duration).toBe(120); // 2 hours
            expect(analytics.checkInTimeline).toHaveLength(4);
            expect(analytics.peakCheckInTime).toBeDefined();
        });
    });

    describe("calculateCheckInTimeline", () => {
        it("should create chronologically ordered timeline", () => {
            const visitors = [
                createTestVisitor({ checkInTime: "2024-12-15T14:30:00Z", interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ checkInTime: "2024-12-15T14:10:00Z", interestLevel: InterestLevel.MEDIUM }),
                createTestVisitor({ checkInTime: "2024-12-15T14:20:00Z", interestLevel: InterestLevel.LOW }),
            ];

            const timeline = calculateCheckInTimeline(visitors);

            expect(timeline).toHaveLength(3);
            expect(timeline[0].timestamp).toBe("2024-12-15T14:10:00Z");
            expect(timeline[0].cumulativeCount).toBe(1);
            expect(timeline[1].timestamp).toBe("2024-12-15T14:20:00Z");
            expect(timeline[1].cumulativeCount).toBe(2);
            expect(timeline[2].timestamp).toBe("2024-12-15T14:30:00Z");
            expect(timeline[2].cumulativeCount).toBe(3);
        });
    });

    describe("findPeakCheckInTime", () => {
        it("should find 15-minute window with most check-ins", () => {
            const visitors = [
                createTestVisitor({ checkInTime: "2024-12-15T14:00:00Z" }),
                createTestVisitor({ checkInTime: "2024-12-15T14:05:00Z" }),
                createTestVisitor({ checkInTime: "2024-12-15T14:10:00Z" }),
                createTestVisitor({ checkInTime: "2024-12-15T14:30:00Z" }),
            ];

            const peakTime = findPeakCheckInTime(visitors);
            expect(peakTime).toBe("2024-12-15T14:00:00Z"); // Window with 3 check-ins
        });

        it("should return undefined for empty visitor list", () => {
            const peakTime = findPeakCheckInTime([]);
            expect(peakTime).toBeUndefined();
        });
    });

    describe("calculateSessionDuration", () => {
        it("should calculate duration in minutes", () => {
            const session = createTestSession({
                actualStartTime: "2024-12-15T14:00:00Z",
                actualEndTime: "2024-12-15T16:30:00Z",
            });

            const duration = calculateSessionDuration(session);
            expect(duration).toBe(150); // 2.5 hours = 150 minutes
        });

        it("should return 0 if session not started or ended", () => {
            const session = createTestSession({
                actualStartTime: undefined,
                actualEndTime: undefined,
            });

            const duration = calculateSessionDuration(session);
            expect(duration).toBe(0);
        });
    });

    describe("calculateVisitorCountTrends", () => {
        it("should group visitors by date", () => {
            const sessions = [
                createTestSession({ sessionId: "s1", scheduledDate: "2024-12-15" }),
                createTestSession({ sessionId: "s2", scheduledDate: "2024-12-16" }),
                createTestSession({ sessionId: "s3", scheduledDate: "2024-12-15" }),
            ];

            const visitorsBySession = new Map([
                ["s1", [createTestVisitor(), createTestVisitor()]],
                ["s2", [createTestVisitor()]],
                ["s3", [createTestVisitor(), createTestVisitor(), createTestVisitor()]],
            ]);

            const trends = calculateVisitorCountTrends(sessions, visitorsBySession);

            expect(trends).toHaveLength(2);
            expect(trends[0]).toEqual({ date: "2024-12-15", value: 5 }); // 2 + 3
            expect(trends[1]).toEqual({ date: "2024-12-16", value: 1 });
        });
    });

    describe("calculateInterestLevelTrends", () => {
        it("should calculate average interest level by date", () => {
            const sessions = [
                createTestSession({ sessionId: "s1", scheduledDate: "2024-12-15" }),
            ];

            const visitorsBySession = new Map([
                ["s1", [
                    createTestVisitor({ interestLevel: InterestLevel.HIGH }), // 3
                    createTestVisitor({ interestLevel: InterestLevel.LOW }), // 1
                ]],
            ]);

            const trends = calculateInterestLevelTrends(sessions, visitorsBySession);

            expect(trends).toHaveLength(1);
            expect(trends[0].date).toBe("2024-12-15");
            expect(trends[0].value).toBeCloseTo(2, 2); // (3 + 1) / 2 = 2
        });
    });

    describe("calculateConversionTrends", () => {
        it("should calculate percentage of high-interest visitors", () => {
            const sessions = [
                createTestSession({ sessionId: "s1", scheduledDate: "2024-12-15" }),
            ];

            const visitorsBySession = new Map([
                ["s1", [
                    createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                    createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                    createTestVisitor({ interestLevel: InterestLevel.MEDIUM }),
                    createTestVisitor({ interestLevel: InterestLevel.LOW }),
                ]],
            ]);

            const trends = calculateConversionTrends(sessions, visitorsBySession);

            expect(trends).toHaveLength(1);
            expect(trends[0].date).toBe("2024-12-15");
            expect(trends[0].value).toBeCloseTo(50, 2); // 2/4 = 50%
        });
    });

    describe("filterSessionsByDateRange", () => {
        it("should filter sessions within date range", () => {
            const sessions = [
                createTestSession({ sessionId: "s1", scheduledDate: "2024-12-10" }),
                createTestSession({ sessionId: "s2", scheduledDate: "2024-12-15" }),
                createTestSession({ sessionId: "s3", scheduledDate: "2024-12-20" }),
            ];

            const filtered = filterSessionsByDateRange(sessions, "2024-12-12", "2024-12-18");

            expect(filtered).toHaveLength(1);
            expect(filtered[0].sessionId).toBe("s2");
        });

        it("should include all sessions if no date range specified", () => {
            const sessions = [
                createTestSession({ sessionId: "s1" }),
                createTestSession({ sessionId: "s2" }),
            ];

            const filtered = filterSessionsByDateRange(sessions);

            expect(filtered).toHaveLength(2);
        });
    });

    describe("calculateRealTimeStats", () => {
        it("should calculate current stats for active session", () => {
            const session = createTestSession({
                actualStartTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                actualEndTime: undefined,
                status: SessionStatus.ACTIVE,
            });

            const visitors = [
                createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ interestLevel: InterestLevel.MEDIUM }),
            ];

            const stats = calculateRealTimeStats(session, visitors);

            expect(stats.currentVisitorCount).toBe(3);
            expect(stats.interestLevelDistribution).toEqual({ high: 2, medium: 1, low: 0 });
            expect(stats.elapsedTime).toBeGreaterThanOrEqual(29);
            expect(stats.elapsedTime).toBeLessThanOrEqual(31);
        });
    });

    describe("calculatePerformanceComparison", () => {
        it("should compare current session to previous averages", () => {
            const currentSession = createTestSession({ sessionId: "current" });
            const currentVisitors = [
                createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ interestLevel: InterestLevel.HIGH }),
                createTestVisitor({ interestLevel: InterestLevel.HIGH }),
            ];

            const previousSessions = [
                createTestSession({ sessionId: "prev1" }),
                createTestSession({ sessionId: "prev2" }),
            ];

            const previousVisitors = [
                createTestVisitor({ sessionId: "prev1", interestLevel: InterestLevel.MEDIUM }),
                createTestVisitor({ sessionId: "prev2", interestLevel: InterestLevel.LOW }),
            ];

            const comparison = calculatePerformanceComparison(
                currentSession,
                currentVisitors,
                previousSessions,
                previousVisitors
            );

            expect(comparison.visitorCountComparison).toBe("above"); // 3 vs 1 average
            expect(comparison.interestLevelComparison).toBe("above"); // 3 vs 1.5 average
        });
    });

    describe("checkMilestones", () => {
        it("should detect visitor count milestones", () => {
            const session = createTestSession({
                actualStartTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            });

            const visitors = Array.from({ length: 10 }, (_, i) =>
                createTestVisitor({ visitorId: `v${i}` })
            );

            const milestones = checkMilestones(session, visitors);

            const firstVisitor = milestones.find(m => m.milestone === "First Visitor");
            const fiveVisitors = milestones.find(m => m.milestone === "5 Visitors");
            const tenVisitors = milestones.find(m => m.milestone === "10 Visitors");
            const thirtyMinutes = milestones.find(m => m.milestone === "30 Minutes");

            expect(firstVisitor?.reached).toBe(true);
            expect(fiveVisitors?.reached).toBe(true);
            expect(tenVisitors?.reached).toBe(true);
            expect(thirtyMinutes?.reached).toBe(true);
        });
    });

    describe("calculateTopPerformingProperties", () => {
        it("should rank properties by total visitors", () => {
            const sessions = [
                createTestSession({ sessionId: "s1", propertyAddress: "123 Main St" }),
                createTestSession({ sessionId: "s2", propertyAddress: "456 Oak Ave" }),
                createTestSession({ sessionId: "s3", propertyAddress: "123 Main St" }),
            ];

            const visitorsBySession = new Map([
                ["s1", [createTestVisitor(), createTestVisitor(), createTestVisitor()]],
                ["s2", [createTestVisitor()]],
                ["s3", [createTestVisitor(), createTestVisitor()]],
            ]);

            const topProperties = calculateTopPerformingProperties(sessions, visitorsBySession, 2);

            expect(topProperties).toHaveLength(2);
            expect(topProperties[0].propertyAddress).toBe("123 Main St");
            expect(topProperties[0].totalVisitors).toBe(5); // 3 + 2
            expect(topProperties[1].propertyAddress).toBe("456 Oak Ave");
            expect(topProperties[1].totalVisitors).toBe(1);
        });
    });
});
