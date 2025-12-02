/**
 * Analytics Actions Integration Tests
 * 
 * Tests for analytics functionality including:
 * - Session-level analytics calculation
 * - Dashboard analytics with filters
 * - Property performance comparison
 * - Top performing properties calculation
 * 
 * Validates Requirements: 5.1, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from '@jest/globals';
import {
    calculateSessionAnalytics,
    calculateDashboardMetrics,
    calculateTopPerformingProperties,
    filterSessionsByDateRange,
    filterVisitorsByDateRange,
    calculateCompleteDashboardAnalytics,
} from '@/lib/open-house-analytics';
import {
    OpenHouseSession,
    Visitor,
    SessionStatus,
    InterestLevel,
    CheckInSource,
} from '@/lib/open-house/types';

describe('Analytics Calculations', () => {
    const mockSession: OpenHouseSession = {
        sessionId: 'session-123',
        userId: 'user-123',
        propertyAddress: '123 Main St',
        scheduledDate: '2024-12-15',
        scheduledStartTime: '2024-12-15T14:00:00Z',
        actualStartTime: '2024-12-15T14:00:00Z',
        actualEndTime: '2024-12-15T16:00:00Z',
        status: SessionStatus.COMPLETED,
        qrCodeUrl: 'https://example.com/qr.png',
        visitorCount: 3,
        interestLevelDistribution: {
            high: 1,
            medium: 1,
            low: 1,
        },
        photos: [],
        createdAt: '2024-12-15T13:00:00Z',
        updatedAt: '2024-12-15T16:00:00Z',
    };

    const mockVisitors: Visitor[] = [
        {
            visitorId: 'visitor-1',
            sessionId: 'session-123',
            userId: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            interestLevel: InterestLevel.HIGH,
            checkInTime: '2024-12-15T14:15:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.MANUAL,
            createdAt: '2024-12-15T14:15:00Z',
            updatedAt: '2024-12-15T14:15:00Z',
        },
        {
            visitorId: 'visitor-2',
            sessionId: 'session-123',
            userId: 'user-123',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-5678',
            interestLevel: InterestLevel.MEDIUM,
            checkInTime: '2024-12-15T14:30:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.QR,
            createdAt: '2024-12-15T14:30:00Z',
            updatedAt: '2024-12-15T14:30:00Z',
        },
        {
            visitorId: 'visitor-3',
            sessionId: 'session-123',
            userId: 'user-123',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '555-9012',
            interestLevel: InterestLevel.LOW,
            checkInTime: '2024-12-15T15:00:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.MANUAL,
            createdAt: '2024-12-15T15:00:00Z',
            updatedAt: '2024-12-15T15:00:00Z',
        },
    ];

    // ========================================================================
    // Session Analytics Tests
    // ========================================================================

    describe('calculateSessionAnalytics', () => {
        it('should calculate session analytics correctly', () => {
            const analytics = calculateSessionAnalytics(mockSession, mockVisitors);

            expect(analytics.sessionId).toBe('session-123');
            expect(analytics.totalVisitors).toBe(3);
            expect(analytics.interestLevelDistribution).toEqual({
                high: 1,
                medium: 1,
                low: 1,
            });
            expect(analytics.duration).toBe(120); // 2 hours
        });

        it('should calculate check-in timeline correctly', () => {
            const analytics = calculateSessionAnalytics(mockSession, mockVisitors);

            expect(analytics.checkInTimeline).toHaveLength(3);
            expect(analytics.checkInTimeline[0].cumulativeCount).toBe(1);
            expect(analytics.checkInTimeline[1].cumulativeCount).toBe(2);
            expect(analytics.checkInTimeline[2].cumulativeCount).toBe(3);
        });

        it('should calculate average interest level correctly', () => {
            const analytics = calculateSessionAnalytics(mockSession, mockVisitors);

            // Average of high(3), medium(2), low(1) = 2.0
            expect(analytics.averageInterestLevel).toBe(2.0);
        });

        it('should handle session with no visitors', () => {
            const analytics = calculateSessionAnalytics(mockSession, []);

            expect(analytics.totalVisitors).toBe(0);
            expect(analytics.averageInterestLevel).toBe(0);
            expect(analytics.checkInTimeline).toHaveLength(0);
        });
    });

    // ========================================================================
    // Dashboard Metrics Tests
    // ========================================================================

    describe('calculateDashboardMetrics', () => {
        const mockSessions: OpenHouseSession[] = [
            mockSession,
            {
                ...mockSession,
                sessionId: 'session-456',
                propertyAddress: '456 Oak Ave',
                scheduledDate: '2024-12-16',
                visitorCount: 2,
            },
        ];

        const allVisitors = [
            ...mockVisitors,
            ...mockVisitors.slice(0, 2).map(v => ({
                ...v,
                visitorId: `${v.visitorId}-2`,
                sessionId: 'session-456',
            })),
        ];

        it('should calculate dashboard metrics correctly', () => {
            const metrics = calculateDashboardMetrics(mockSessions, allVisitors);

            expect(metrics.totalSessions).toBe(2);
            expect(metrics.totalVisitors).toBe(5);
            expect(metrics.averageVisitorsPerSession).toBe(2.5);
        });

        it('should handle empty sessions', () => {
            const metrics = calculateDashboardMetrics([], []);

            expect(metrics.totalSessions).toBe(0);
            expect(metrics.totalVisitors).toBe(0);
            expect(metrics.averageVisitorsPerSession).toBe(0);
        });

        it('should calculate complete dashboard analytics', () => {
            const analytics = calculateCompleteDashboardAnalytics(mockSessions, allVisitors);

            expect(analytics.totalSessions).toBe(2);
            expect(analytics.totalVisitors).toBe(5);
            expect(analytics.trends).toBeDefined();
            expect(analytics.topPerformingProperties).toBeDefined();
        });
    });

    // ========================================================================
    // Date Range Filtering Tests
    // ========================================================================

    describe('filterSessionsByDateRange', () => {
        const sessions: OpenHouseSession[] = [
            {
                ...mockSession,
                sessionId: 'session-1',
                scheduledDate: '2024-12-10',
            },
            {
                ...mockSession,
                sessionId: 'session-2',
                scheduledDate: '2024-12-15',
            },
            {
                ...mockSession,
                sessionId: 'session-3',
                scheduledDate: '2024-12-20',
            },
        ];

        it('should filter by start date', () => {
            const filtered = filterSessionsByDateRange(sessions, '2024-12-15');

            expect(filtered).toHaveLength(2);
            expect(filtered[0].sessionId).toBe('session-2');
            expect(filtered[1].sessionId).toBe('session-3');
        });

        it('should filter by end date', () => {
            const filtered = filterSessionsByDateRange(sessions, undefined, '2024-12-15');

            expect(filtered).toHaveLength(2);
            expect(filtered[0].sessionId).toBe('session-1');
            expect(filtered[1].sessionId).toBe('session-2');
        });

        it('should filter by date range', () => {
            const filtered = filterSessionsByDateRange(sessions, '2024-12-12', '2024-12-18');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].sessionId).toBe('session-2');
        });

        it('should return all sessions if no filters', () => {
            const filtered = filterSessionsByDateRange(sessions);

            expect(filtered).toHaveLength(3);
        });
    });

    describe('filterVisitorsByDateRange', () => {
        const visitors: Visitor[] = [
            {
                ...mockVisitors[0],
                visitorId: 'visitor-1',
                checkInTime: '2024-12-10T14:00:00Z',
            },
            {
                ...mockVisitors[0],
                visitorId: 'visitor-2',
                checkInTime: '2024-12-15T14:00:00Z',
            },
            {
                ...mockVisitors[0],
                visitorId: 'visitor-3',
                checkInTime: '2024-12-20T14:00:00Z',
            },
        ];

        it('should filter by start date', () => {
            const filtered = filterVisitorsByDateRange(visitors, '2024-12-15');

            expect(filtered).toHaveLength(2);
            expect(filtered[0].visitorId).toBe('visitor-2');
            expect(filtered[1].visitorId).toBe('visitor-3');
        });

        it('should filter by end date', () => {
            const filtered = filterVisitorsByDateRange(visitors, undefined, '2024-12-15');

            expect(filtered).toHaveLength(2);
            expect(filtered[0].visitorId).toBe('visitor-1');
            expect(filtered[1].visitorId).toBe('visitor-2');
        });

        it('should filter by date range', () => {
            const filtered = filterVisitorsByDateRange(visitors, '2024-12-12', '2024-12-18');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].visitorId).toBe('visitor-2');
        });
    });

    // ========================================================================
    // Property Performance Tests
    // ========================================================================

    describe('calculateTopPerformingProperties', () => {
        const sessions: OpenHouseSession[] = [
            {
                ...mockSession,
                sessionId: 'session-1',
                propertyAddress: 'Property A',
            },
            {
                ...mockSession,
                sessionId: 'session-2',
                propertyAddress: 'Property B',
            },
            {
                ...mockSession,
                sessionId: 'session-3',
                propertyAddress: 'Property C',
            },
            {
                ...mockSession,
                sessionId: 'session-4',
                propertyAddress: 'Property A', // Same property as session-1
            },
        ];

        const visitorsBySession = new Map<string, Visitor[]>([
            ['session-1', mockVisitors], // 3 visitors
            ['session-2', mockVisitors.slice(0, 2)], // 2 visitors
            ['session-3', mockVisitors.slice(0, 1)], // 1 visitor
            ['session-4', mockVisitors.slice(0, 2)], // 2 visitors
        ]);

        it('should return top N properties sorted by visitor count', () => {
            const topProperties = calculateTopPerformingProperties(
                sessions,
                visitorsBySession,
                2
            );

            expect(topProperties).toHaveLength(2);
            // Property A: 5 visitors (3 + 2)
            // Property B: 2 visitors
            // Property C: 1 visitor
            expect(topProperties[0].propertyAddress).toBe('Property A');
            expect(topProperties[0].totalVisitors).toBe(5);
            expect(topProperties[0].sessionCount).toBe(2);
            expect(topProperties[1].propertyAddress).toBe('Property B');
            expect(topProperties[1].totalVisitors).toBe(2);
        });

        it('should calculate average interest level per property', () => {
            const topProperties = calculateTopPerformingProperties(
                sessions,
                visitorsBySession,
                3
            );

            // Property A has 5 visitors: 3 from session-1 (high, medium, low) + 2 from session-4 (high, medium)
            // Average = (3 + 2 + 1 + 3 + 2) / 5 = 11 / 5 = 2.2
            expect(topProperties[0].averageInterestLevel).toBe(2.2);
        });

        it('should return all properties if limit exceeds count', () => {
            const topProperties = calculateTopPerformingProperties(
                sessions,
                visitorsBySession,
                10
            );

            expect(topProperties).toHaveLength(3); // Only 3 unique properties
        });

        it('should handle empty sessions', () => {
            const topProperties = calculateTopPerformingProperties(
                [],
                new Map(),
                5
            );

            expect(topProperties).toHaveLength(0);
        });
    });
});
