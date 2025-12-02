/**
 * Real-Time Monitoring Components Usage Examples
 * 
 * This file demonstrates how to use the real-time monitoring components
 * for active open house sessions.
 * 
 * Components:
 * - ActiveSessionMonitor: Displays live statistics with polling
 * - CheckInTimeline: Shows chronological list of visitor check-ins
 * - PerformanceComparison: Compares current session to historical averages
 * - MilestoneNotifications: Celebrates achievements during the session
 */

import { OpenHouseSession, Visitor } from '@/lib/open-house/types';

// ============================================================================
// Example 1: Basic Real-Time Monitoring Setup
// ============================================================================

/**
 * Example session detail page with real-time monitoring
 * 
 * This shows how to integrate all monitoring components on a session detail page
 */
export const sessionDetailPageExample = `
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { PerformanceComparison } from '@/components/open-house/performance-comparison';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';

export default async function SessionDetailPage({ params }) {
    const { session } = await getOpenHouseSession(params.sessionId);
    const { visitors } = await getSessionVisitors(params.sessionId);
    const { analytics } = await getDashboardAnalytics({});

    // Only show real-time components for active sessions
    if (session.status !== 'active') {
        return <StaticSessionView session={session} />;
    }

    // Prepare performance metrics
    const performanceMetrics = [
        {
            label: 'Visitors',
            current: session.visitorCount || 0,
            average: analytics.averageVisitorsPerSession || 0,
            format: 'number',
        },
        {
            label: 'High Interest Rate',
            current: session.visitorCount > 0 
                ? ((session.interestLevelDistribution?.high || 0) / session.visitorCount) * 100
                : 0,
            average: analytics.averageInterestLevel || 0,
            format: 'percentage',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Milestone notifications appear at the top */}
            <MilestoneNotifications 
                session={session} 
                visitors={visitors}
            />

            {/* Live statistics with 2-second polling */}
            <ActiveSessionMonitor session={session} />

            {/* Performance comparison to historical data */}
            <PerformanceComparison metrics={performanceMetrics} />

            {/* Chronological check-in timeline */}
            <CheckInTimeline visitors={visitors} />
        </div>
    );
}
`;

// ============================================================================
// Example 2: ActiveSessionMonitor Component
// ============================================================================

/**
 * The ActiveSessionMonitor displays real-time statistics for active sessions
 * 
 * Features:
 * - Polls every 2 seconds (Requirement 11.2)
 * - Shows visitor count, interest distribution, elapsed time
 * - Visual distribution bar
 * - Live indicator animation
 */
export const activeSessionMonitorExample = `
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';

function MyComponent({ session }) {
    return (
        <ActiveSessionMonitor 
            session={session}
            className="mb-6"
        />
    );
}

// The component automatically:
// - Polls for updates every 2 seconds
// - Only displays for active sessions
// - Shows loading states during updates
// - Handles errors gracefully
`;

// ============================================================================
// Example 3: CheckInTimeline Component
// ============================================================================

/**
 * The CheckInTimeline shows a chronological list of visitor check-ins
 * 
 * Features:
 * - Sorted by most recent first
 * - Shows time ago and exact timestamp
 * - Highlights recent check-ins (within last minute)
 * - Displays interest level badges
 * - Shows QR code source indicator
 * - Scrollable for long lists
 */
export const checkInTimelineExample = `
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';

function MyComponent({ visitors }) {
    return (
        <CheckInTimeline 
            visitors={visitors}
            maxHeight="500px"
            className="lg:col-span-2"
        />
    );
}

// Timeline features:
// - Recent check-ins (< 1 minute) are highlighted with animation
// - Timeline dots connect check-ins visually
// - Visitor notes are shown if available
// - Empty state for sessions with no visitors
`;

// ============================================================================
// Example 4: PerformanceComparison Component
// ============================================================================

/**
 * The PerformanceComparison compares current session to historical averages
 * 
 * Features:
 * - Compares multiple metrics
 * - Shows percentage difference
 * - Visual comparison bars
 * - "Exceptional" badge for outstanding performance
 * - Color-coded indicators (green=above, red=below, gray=equal)
 */
export const performanceComparisonExample = `
import { PerformanceComparison } from '@/components/open-house/performance-comparison';

function MyComponent({ session, analytics }) {
    const metrics = [
        {
            label: 'Total Visitors',
            current: session.visitorCount || 0,
            average: analytics.averageVisitorsPerSession || 0,
            format: 'number',
        },
        {
            label: 'High Interest Rate',
            current: session.visitorCount > 0 
                ? ((session.interestLevelDistribution?.high || 0) / session.visitorCount) * 100
                : 0,
            average: analytics.averageInterestLevel || 0,
            format: 'percentage',
        },
        {
            label: 'Session Duration',
            current: getElapsedMinutes(session),
            average: analytics.averageSessionDuration || 0,
            format: 'time',
            unit: 'min',
        },
    ];

    return (
        <PerformanceComparison 
            metrics={metrics}
            className="mb-6"
        />
    );
}

// Metric formats:
// - 'number': Plain number with optional unit
// - 'percentage': Formatted as percentage (e.g., "75%")
// - 'time': Formatted as hours and minutes (e.g., "2h 30m")
`;

// ============================================================================
// Example 5: MilestoneNotifications Component
// ============================================================================

/**
 * The MilestoneNotifications celebrates achievements during the session
 * 
 * Features:
 * - Floating notifications for new milestones
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss option
 * - Summary of all achieved milestones
 * - Multiple milestone types (visitors, time, high interest)
 */
export const milestoneNotificationsExample = `
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';

function MyComponent({ session, visitors }) {
    return (
        <MilestoneNotifications 
            session={session}
            visitors={visitors}
            className="mb-6"
        />
    );
}

// Milestone types:
// - First visitor
// - Visitor count milestones (5, 10, 20, 50)
// - Time milestones (30 min, 1 hour, 2 hours)
// - High interest milestones (3, 5, 10 high interest visitors)

// The component automatically:
// - Detects when milestones are achieved
// - Shows floating notification for new milestones
// - Prevents duplicate notifications
// - Displays summary of all achieved milestones
`;

// ============================================================================
// Example 6: Complete Integration Example
// ============================================================================

/**
 * Complete example showing all components working together
 */
export const completeIntegrationExample = `
'use client';

import { useState, useEffect } from 'react';
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { PerformanceComparison } from '@/components/open-house/performance-comparison';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';
import { getOpenHouseSession, getSessionVisitors, getDashboardAnalytics } from './actions';

export function LiveSessionDashboard({ sessionId }) {
    const [session, setSession] = useState(null);
    const [visitors, setVisitors] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // Load initial data
    useEffect(() => {
        loadData();
    }, [sessionId]);

    // Refresh data every 5 seconds for visitor list and analytics
    useEffect(() => {
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [sessionId]);

    async function loadData() {
        const [sessionResult, visitorsResult, analyticsResult] = await Promise.all([
            getOpenHouseSession(sessionId),
            getSessionVisitors(sessionId),
            getDashboardAnalytics({}),
        ]);

        if (sessionResult.session) setSession(sessionResult.session);
        if (visitorsResult.visitors) setVisitors(visitorsResult.visitors);
        if (analyticsResult.analytics) setAnalytics(analyticsResult.analytics);
    }

    if (!session || session.status !== 'active') {
        return <div>Session is not active</div>;
    }

    const performanceMetrics = [
        {
            label: 'Visitors',
            current: session.visitorCount || 0,
            average: analytics?.averageVisitorsPerSession || 0,
            format: 'number',
        },
        {
            label: 'High Interest Rate',
            current: session.visitorCount > 0 
                ? ((session.interestLevelDistribution?.high || 0) / session.visitorCount) * 100
                : 0,
            average: analytics?.averageInterestLevel || 0,
            format: 'percentage',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Milestone celebrations */}
            <MilestoneNotifications 
                session={session} 
                visitors={visitors}
            />

            {/* Real-time stats (polls internally every 2 seconds) */}
            <ActiveSessionMonitor session={session} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance comparison */}
                <PerformanceComparison metrics={performanceMetrics} />

                {/* Check-in timeline */}
                <CheckInTimeline 
                    visitors={visitors}
                    maxHeight="600px"
                />
            </div>
        </div>
    );
}
`;

// ============================================================================
// Example 7: Mobile-Optimized Layout
// ============================================================================

/**
 * Mobile-optimized layout for real-time monitoring
 */
export const mobileOptimizedExample = `
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';

export function MobileSessionMonitor({ session, visitors }) {
    return (
        <div className="space-y-4 p-4">
            {/* Milestones at top */}
            <MilestoneNotifications 
                session={session} 
                visitors={visitors}
            />

            {/* Compact stats view */}
            <ActiveSessionMonitor 
                session={session}
                className="mb-4"
            />

            {/* Timeline with reduced height for mobile */}
            <CheckInTimeline 
                visitors={visitors}
                maxHeight="300px"
            />
        </div>
    );
}
`;

// ============================================================================
// Example 8: Custom Polling Intervals
// ============================================================================

/**
 * The ActiveSessionMonitor uses the useSessionStats hook internally
 * which polls every 2 seconds by default. You can customize this if needed.
 */
export const customPollingExample = `
import { useSessionStats } from '@/hooks/use-session-stats';

function CustomMonitor({ session }) {
    // Custom polling interval (default is 2000ms)
    const { stats, isLoading, error } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
        pollingInterval: 5000, // Poll every 5 seconds instead
        enabled: session.status === 'active',
    });

    return (
        <div>
            <h3>Visitor Count: {stats.visitorCount}</h3>
            <p>High Interest: {stats.interestLevelDistribution.high}</p>
            <p>Elapsed: {stats.elapsedTimeFormatted}</p>
        </div>
    );
}
`;

// ============================================================================
// Example 9: Error Handling
// ============================================================================

/**
 * All components handle errors gracefully
 */
export const errorHandlingExample = `
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';

function MyComponent({ session }) {
    return (
        <ActiveSessionMonitor session={session} />
    );
}

// The component automatically:
// - Shows error message if updates fail
// - Continues showing last known data
// - Retries on next polling interval
// - Displays error state visually
`;

// ============================================================================
// Example 10: Testing Real-Time Components
// ============================================================================

/**
 * Testing approach for real-time monitoring components
 */
export const testingExample = `
import { render, screen, waitFor } from '@testing-library/react';
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';

describe('Real-Time Monitoring', () => {
    it('should display live statistics', async () => {
        const session = {
            sessionId: 'test-123',
            status: 'active',
            visitorCount: 5,
            interestLevelDistribution: { high: 2, medium: 2, low: 1 },
            actualStartTime: new Date().toISOString(),
        };

        render(<ActiveSessionMonitor session={session} />);

        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // High interest
    });

    it('should show check-in timeline', () => {
        const visitors = [
            {
                visitorId: '1',
                name: 'John Doe',
                email: 'john@example.com',
                checkInTime: new Date().toISOString(),
                interestLevel: 'high',
            },
        ];

        render(<CheckInTimeline visitors={visitors} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should trigger milestone notifications', async () => {
        const session = {
            sessionId: 'test-123',
            status: 'active',
            actualStartTime: new Date().toISOString(),
        };

        const visitors = Array.from({ length: 10 }, (_, i) => ({
            visitorId: \`visitor-\${i}\`,
            name: \`Visitor \${i}\`,
            email: \`visitor\${i}@example.com\`,
            checkInTime: new Date().toISOString(),
            interestLevel: 'medium',
        }));

        render(<MilestoneNotifications session={session} visitors={visitors} />);

        await waitFor(() => {
            expect(screen.getByText('10 Visitors!')).toBeInTheDocument();
        });
    });
});
`;

// ============================================================================
// Type Definitions for Reference
// ============================================================================

export interface SessionStatsExample {
    visitorCount: number;
    interestLevelDistribution: {
        high: number;
        medium: number;
        low: number;
    };
    elapsedTimeFormatted: string;
    isActive: boolean;
}

export interface PerformanceMetricExample {
    label: string;
    current: number;
    average: number;
    unit?: string;
    format?: 'number' | 'percentage' | 'time';
}

export interface MilestoneExample {
    id: string;
    type: 'visitor_count' | 'time_elapsed' | 'high_interest' | 'first_visitor';
    title: string;
    description: string;
    achieved: boolean;
}
