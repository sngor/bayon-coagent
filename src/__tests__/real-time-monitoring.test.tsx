/**
 * Real-Time Monitoring Components Tests
 * 
 * Tests for the real-time monitoring components used in active open house sessions
 */

import { render, screen, waitFor } from '@testing-library/react';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { PerformanceComparison } from '@/components/open-house/performance-comparison';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';
import { Visitor, OpenHouseSession } from '@/lib/open-house/types';

describe('CheckInTimeline', () => {
    const mockVisitors: Visitor[] = [
        {
            visitorId: 'visitor-1',
            sessionId: 'session-123',
            userId: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            interestLevel: 'high',
            checkInTime: new Date().toISOString(),
            followUpGenerated: false,
            followUpSent: false,
            source: 'manual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            visitorId: 'visitor-2',
            sessionId: 'session-123',
            userId: 'user-123',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-5678',
            interestLevel: 'medium',
            checkInTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            followUpGenerated: false,
            followUpSent: false,
            source: 'qr',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    it('should render visitor timeline', () => {
        render(<CheckInTimeline visitors={mockVisitors} />);

        expect(screen.getByText('Check-In Timeline')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should show empty state when no visitors', () => {
        render(<CheckInTimeline visitors={[]} />);

        expect(screen.getByText('No visitors yet')).toBeInTheDocument();
        expect(screen.getByText('Check-ins will appear here in real-time')).toBeInTheDocument();
    });

    it('should display interest level badges', () => {
        render(<CheckInTimeline visitors={mockVisitors} />);

        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should show QR code indicator', () => {
        render(<CheckInTimeline visitors={mockVisitors} />);

        const qrBadges = screen.getAllByText('QR');
        expect(qrBadges.length).toBeGreaterThan(0);
    });

    it('should sort visitors by most recent first', () => {
        render(<CheckInTimeline visitors={mockVisitors} />);

        const visitorNames = screen.getAllByText(/John Doe|Jane Smith/);
        expect(visitorNames[0]).toHaveTextContent('John Doe'); // Most recent
    });
});

describe('PerformanceComparison', () => {
    const mockMetrics = [
        {
            label: 'Visitors',
            current: 15,
            average: 12,
            format: 'number' as const,
        },
        {
            label: 'High Interest Rate',
            current: 60,
            average: 45,
            format: 'percentage' as const,
        },
        {
            label: 'Session Duration',
            current: 90,
            average: 120,
            format: 'time' as const,
        },
    ];

    it('should render performance metrics', () => {
        render(<PerformanceComparison metrics={mockMetrics} />);

        expect(screen.getByText('Performance Comparison')).toBeInTheDocument();
        expect(screen.getByText('Visitors')).toBeInTheDocument();
        expect(screen.getByText('High Interest Rate')).toBeInTheDocument();
        expect(screen.getByText('Session Duration')).toBeInTheDocument();
    });

    it('should show current and average values', () => {
        render(<PerformanceComparison metrics={mockMetrics} />);

        expect(screen.getByText('15')).toBeInTheDocument(); // Current visitors
        expect(screen.getByText('12')).toBeInTheDocument(); // Average visitors
    });

    it('should display percentage differences', () => {
        render(<PerformanceComparison metrics={mockMetrics} />);

        expect(screen.getByText('+25%')).toBeInTheDocument(); // Visitors above average
        expect(screen.getByText('+33%')).toBeInTheDocument(); // Interest rate above average
        expect(screen.getByText('-25%')).toBeInTheDocument(); // Duration below average
    });

    it('should show exceptional badge for outstanding performance', () => {
        const exceptionalMetrics = [
            {
                label: 'Visitors',
                current: 30,
                average: 12,
                format: 'number' as const,
            },
        ];

        render(<PerformanceComparison metrics={exceptionalMetrics} />);

        expect(screen.getByText('Exceptional')).toBeInTheDocument();
    });

    it('should format percentage values correctly', () => {
        render(<PerformanceComparison metrics={mockMetrics} />);

        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should format time values correctly', () => {
        render(<PerformanceComparison metrics={mockMetrics} />);

        expect(screen.getByText('1h 30m')).toBeInTheDocument(); // 90 minutes
        expect(screen.getByText('2h 0m')).toBeInTheDocument(); // 120 minutes
    });
});

describe('MilestoneNotifications', () => {
    const mockSession: OpenHouseSession = {
        sessionId: 'session-123',
        userId: 'user-123',
        propertyAddress: '123 Main St',
        scheduledDate: '2024-12-15',
        scheduledStartTime: new Date().toISOString(),
        status: 'active',
        actualStartTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        qrCodeUrl: 'https://example.com/qr.png',
        visitorCount: 10,
        interestLevelDistribution: {
            high: 5,
            medium: 3,
            low: 2,
        },
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockVisitors: Visitor[] = Array.from({ length: 10 }, (_, i) => ({
        visitorId: `visitor-${i}`,
        sessionId: 'session-123',
        userId: 'user-123',
        name: `Visitor ${i}`,
        email: `visitor${i}@example.com`,
        phone: '555-1234',
        interestLevel: i < 5 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
        checkInTime: new Date().toISOString(),
        followUpGenerated: false,
        followUpSent: false,
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    it('should detect visitor count milestones', async () => {
        render(<MilestoneNotifications session={mockSession} visitors={mockVisitors} />);

        await waitFor(() => {
            expect(screen.getByText('10 Visitors!')).toBeInTheDocument();
        });
    });

    it('should detect time milestones', async () => {
        render(<MilestoneNotifications session={mockSession} visitors={mockVisitors} />);

        await waitFor(() => {
            expect(screen.getByText('1 Hour Mark')).toBeInTheDocument();
        });
    });

    it('should detect high interest milestones', async () => {
        render(<MilestoneNotifications session={mockSession} visitors={mockVisitors} />);

        await waitFor(() => {
            expect(screen.getByText('5 High Interest Leads!')).toBeInTheDocument();
        });
    });

    it('should show first visitor milestone', async () => {
        const singleVisitorSession = {
            ...mockSession,
            visitorCount: 1,
            interestLevelDistribution: { high: 1, medium: 0, low: 0 },
        };

        const singleVisitor = [mockVisitors[0]];

        render(<MilestoneNotifications session={singleVisitorSession} visitors={singleVisitor} />);

        await waitFor(() => {
            expect(screen.getByText('First Visitor!')).toBeInTheDocument();
        });
    });

    it('should not render for inactive sessions', () => {
        const inactiveSession = {
            ...mockSession,
            status: 'completed' as const,
        };

        const { container } = render(
            <MilestoneNotifications session={inactiveSession} visitors={mockVisitors} />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should show milestone count badge', async () => {
        render(<MilestoneNotifications session={mockSession} visitors={mockVisitors} />);

        await waitFor(() => {
            const badges = screen.getAllByText(/\d+/);
            expect(badges.length).toBeGreaterThan(0);
        });
    });
});

describe('Real-Time Monitoring Integration', () => {
    it('should work together in a session view', () => {
        const mockSession: OpenHouseSession = {
            sessionId: 'session-123',
            userId: 'user-123',
            propertyAddress: '123 Main St',
            scheduledDate: '2024-12-15',
            scheduledStartTime: new Date().toISOString(),
            status: 'active',
            actualStartTime: new Date().toISOString(),
            qrCodeUrl: 'https://example.com/qr.png',
            visitorCount: 5,
            interestLevelDistribution: {
                high: 2,
                medium: 2,
                low: 1,
            },
            photos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mockVisitors: Visitor[] = [
            {
                visitorId: 'visitor-1',
                sessionId: 'session-123',
                userId: 'user-123',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '555-1234',
                interestLevel: 'high',
                checkInTime: new Date().toISOString(),
                followUpGenerated: false,
                followUpSent: false,
                source: 'manual',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        const mockMetrics = [
            {
                label: 'Visitors',
                current: 5,
                average: 8,
                format: 'number' as const,
            },
        ];

        const { container } = render(
            <div>
                <MilestoneNotifications session={mockSession} visitors={mockVisitors} />
                <PerformanceComparison metrics={mockMetrics} />
                <CheckInTimeline visitors={mockVisitors} />
            </div>
        );

        expect(container).toBeInTheDocument();
        expect(screen.getByText('Performance Comparison')).toBeInTheDocument();
        expect(screen.getByText('Check-In Timeline')).toBeInTheDocument();
    });
});
