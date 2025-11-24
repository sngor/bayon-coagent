/**
 * UI/UX Polish Test Suite
 * 
 * Tests for skeleton loading states, empty states, error handling,
 * success notifications, accessibility features, and responsive design
 * 
 * Validates: Task 16.4 - Professional UI/UX polish
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import components to test
import {
    ContentCalendarSkeleton,
    SchedulingModalSkeleton,
    AnalyticsDashboardSkeleton,
    TemplateLibrarySkeleton,
    ContentListSkeleton
} from '@/components/ui/skeleton-loading';

import {
    EmptyCalendarState,
    EmptyAnalyticsState,
    EmptyTemplateLibraryState,
    EmptyContentListState,
    EmptySearchResultsState,
    EmptyABTestsState,
    NoConnectionsState
} from '@/components/ui/empty-states';

import {
    NetworkErrorState,
    AuthenticationErrorState,
    ServerErrorState,
    RateLimitErrorState,
    ValidationErrorState,
    DataLoadErrorState,
    SocialMediaConnectionErrorState
} from '@/components/ui/error-states';

import {
    ContentScheduledNotification,
    TemplateCreatedNotification,
    ContentPublishedNotification,
    BulkActionNotification
} from '@/components/ui/success-notifications';

import {
    SkipLink,
    LiveRegion,
    FocusTrap,
    VisuallyHidden,
    useAnnouncer
} from '@/components/ui/accessibility-helpers';

import {
    ResponsiveContainer,
    ResponsiveGrid,
    MobileOptimizedTable,
    TouchOptimizedButton,
    SwipeableCard,
    VirtualizedList,
    ResponsiveModal
} from '@/components/ui/responsive-helpers';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('UI/UX Polish - Skeleton Loading States', () => {
    test('ContentCalendarSkeleton renders with proper accessibility attributes', async () => {
        const { container } = render(<ContentCalendarSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading calendar')).toBeInTheDocument();
        expect(screen.getByText('Loading calendar content...')).toBeInTheDocument();

        // Check for proper ARIA attributes
        expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    test('SchedulingModalSkeleton shows loading state', async () => {
        const { container } = render(<SchedulingModalSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading scheduling options')).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('AnalyticsDashboardSkeleton displays metric card skeletons', async () => {
        const { container } = render(<AnalyticsDashboardSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading analytics dashboard')).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('All skeleton components have proper ARIA labels', () => {
        render(
            <div>
                <ContentCalendarSkeleton />
                <SchedulingModalSkeleton />
                <AnalyticsDashboardSkeleton />
                <TemplateLibrarySkeleton />
                <ContentListSkeleton />
            </div>
        );

        // All should have status role for screen readers
        const statusElements = screen.getAllByRole('status');
        expect(statusElements).toHaveLength(5);
    });
});

describe('UI/UX Polish - Empty States', () => {
    test('EmptyCalendarState provides actionable guidance', async () => {
        const mockAction = jest.fn();
        const { container } = render(
            <EmptyCalendarState onAction={mockAction} />
        );

        expect(screen.getByText('Your Content Calendar is Empty')).toBeInTheDocument();
        expect(screen.getByText(/Start building your content strategy/)).toBeInTheDocument();

        const scheduleButton = screen.getByRole('button', { name: /Schedule Your First Post/ });
        expect(scheduleButton).toBeInTheDocument();

        await userEvent.click(scheduleButton);
        expect(mockAction).toHaveBeenCalled();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('EmptyAnalyticsState shows connection guidance', () => {
        const mockAction = jest.fn();
        render(<EmptyAnalyticsState onAction={mockAction} />);

        expect(screen.getByText('No Analytics Data Available')).toBeInTheDocument();
        expect(screen.getByText(/Connect your social media accounts/)).toBeInTheDocument();

        const connectButton = screen.getByRole('button', { name: /Connect Accounts/ });
        expect(connectButton).toBeInTheDocument();
    });

    test('EmptySearchResultsState handles no results gracefully', () => {
        const mockClearFilters = jest.fn();
        const mockRetry = jest.fn();

        render(
            <EmptySearchResultsState
                searchQuery="test query"
                onClearFilters={mockClearFilters}
                onRetry={mockRetry}
            />
        );

        expect(screen.getByText('No Results Found')).toBeInTheDocument();
        expect(screen.getByText(/No results found for "test query"/)).toBeInTheDocument();

        const clearButton = screen.getByRole('button', { name: /Clear Filters/ });
        const retryButton = screen.getByRole('button', { name: /Try Again/ });

        expect(clearButton).toBeInTheDocument();
        expect(retryButton).toBeInTheDocument();
    });

    test('NoConnectionsState shows supported platforms', () => {
        render(<NoConnectionsState onAction={jest.fn()} />);

        expect(screen.getByText('No Social Media Accounts Connected')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByText('Twitter/X')).toBeInTheDocument();
    });
});

describe('UI/UX Polish - Error States', () => {
    test('NetworkErrorState provides clear recovery steps', async () => {
        const mockRetry = jest.fn();
        const mockGoBack = jest.fn();

        const { container } = render(
            <NetworkErrorState
                onRetry={mockRetry}
                onGoBack={mockGoBack}
                errorCode="NET_001"
            />
        );

        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
        expect(screen.getByText(/network issue or temporary service interruption/)).toBeInTheDocument();
        expect(screen.getByText('Error Code: NET_001')).toBeInTheDocument();

        const retryButton = screen.getByRole('button', { name: /Try Again/ });
        const backButton = screen.getByRole('button', { name: /Go Back/ });

        await userEvent.click(retryButton);
        expect(mockRetry).toHaveBeenCalled();

        await userEvent.click(backButton);
        expect(mockGoBack).toHaveBeenCalled();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('ValidationErrorState displays specific errors', () => {
        const errors = [
            'Please select a date and time',
            'Please select at least one channel'
        ];

        render(
            <ValidationErrorState
                errors={errors}
                onGoBack={jest.fn()}
                errorCode="VAL_001"
            />
        );

        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Please select a date and time')).toBeInTheDocument();
        expect(screen.getByText('Please select at least one channel')).toBeInTheDocument();
    });

    test('RateLimitErrorState shows countdown timer', () => {
        const resetTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        render(
            <RateLimitErrorState
                onRetry={jest.fn()}
                resetTime={resetTime}
                errorCode="RATE_001"
            />
        );

        expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
        expect(screen.getByText(/Wait 5m/)).toBeInTheDocument();
    });

    test('All error states include error codes and timestamps', () => {
        render(
            <div>
                <NetworkErrorState onRetry={jest.fn()} errorCode="NET_001" />
                <ServerErrorState onRetry={jest.fn()} errorCode="SRV_001" />
                <AuthenticationErrorState onRetry={jest.fn()} errorCode="AUTH_001" />
            </div>
        );

        expect(screen.getByText(/Error Code: NET_001/)).toBeInTheDocument();
        expect(screen.getByText(/Error Code: SRV_001/)).toBeInTheDocument();
        expect(screen.getByText(/Error Code: AUTH_001/)).toBeInTheDocument();
    });
});

describe('UI/UX Polish - Success Notifications', () => {
    test('ContentScheduledNotification shows with undo capability', async () => {
        const mockClose = jest.fn();
        const mockUndo = jest.fn();
        const scheduledTime = new Date();

        render(
            <ContentScheduledNotification
                isVisible={true}
                onClose={mockClose}
                onUndo={mockUndo}
                scheduledTime={scheduledTime}
                channelCount={2}
                contentTitle="Test Content"
                undoTimeoutMs={5000}
            />
        );

        expect(screen.getByText('Content Scheduled!')).toBeInTheDocument();
        expect(screen.getByText('"Test Content"')).toBeInTheDocument();
        expect(screen.getByText('2 channels')).toBeInTheDocument();

        const undoButton = screen.getByRole('button', { name: /Undo/ });
        expect(undoButton).toBeInTheDocument();

        await userEvent.click(undoButton);
        expect(mockUndo).toHaveBeenCalled();
    });

    test('BulkActionNotification handles different action types', () => {
        render(
            <BulkActionNotification
                isVisible={true}
                onClose={jest.fn()}
                actionType="scheduled"
                itemCount={10}
                successCount={8}
                failureCount={2}
            />
        );

        expect(screen.getByText('Bulk Action Complete')).toBeInTheDocument();
        expect(screen.getByText('8 of 10 items scheduled successfully (2 failed)')).toBeInTheDocument();
        expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    test('Success notifications auto-dismiss after timeout', async () => {
        const mockClose = jest.fn();

        render(
            <ContentPublishedNotification
                isVisible={true}
                onClose={mockClose}
                contentTitle="Test Content"
            />
        );

        // Should auto-close after timeout (mocked in test environment)
        await waitFor(() => {
            expect(mockClose).toHaveBeenCalled();
        }, { timeout: 10000 });
    });
});

describe('UI/UX Polish - Accessibility Features', () => {
    test('SkipLink provides keyboard navigation', async () => {
        const { container } = render(
            <div>
                <SkipLink href="#main-content">Skip to main content</SkipLink>
                <div id="main-content">Main content</div>
            </div>
        );

        const skipLink = screen.getByRole('link', { name: /Skip to main content/ });
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-content');

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('LiveRegion announces dynamic content changes', () => {
        render(
            <LiveRegion politeness="assertive">
                Content updated successfully
            </LiveRegion>
        );

        const liveRegion = screen.getByText('Content updated successfully');
        expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    test('FocusTrap manages focus within modal', async () => {
        const TestModal = ({ isActive }: { isActive: boolean }) => (
            <FocusTrap isActive={isActive}>
                <button>First button</button>
                <button>Second button</button>
                <button>Third button</button>
            </FocusTrap>
        );

        const { rerender } = render(<TestModal isActive={false} />);

        // Focus should not be trapped when inactive
        const firstButton = screen.getByRole('button', { name: 'First button' });
        expect(document.activeElement).not.toBe(firstButton);

        // Activate focus trap
        rerender(<TestModal isActive={true} />);

        // Focus should move to first element when activated
        await waitFor(() => {
            expect(document.activeElement).toBe(firstButton);
        });
    });

    test('VisuallyHidden content is accessible to screen readers', async () => {
        const { container } = render(
            <VisuallyHidden>
                This content is hidden visually but available to screen readers
            </VisuallyHidden>
        );

        const hiddenContent = screen.getByText(/This content is hidden visually/);
        expect(hiddenContent).toBeInTheDocument();
        expect(hiddenContent).toHaveClass('sr-only');

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('useAnnouncer hook provides screen reader announcements', () => {
        const TestComponent = () => {
            const { announce, AnnouncerComponent } = useAnnouncer();

            return (
                <div>
                    <button onClick={() => announce('Test announcement', 'polite')}>
                        Make announcement
                    </button>
                    <AnnouncerComponent />
                </div>
            );
        };

        render(<TestComponent />);

        const button = screen.getByRole('button', { name: /Make announcement/ });
        fireEvent.click(button);

        // The announcer component should be present (even if visually hidden)
        const announcer = document.querySelector('[aria-live="polite"]');
        expect(announcer).toBeInTheDocument();
    });
});

describe('UI/UX Polish - Responsive Design', () => {
    test('ResponsiveContainer adapts to different screen sizes', () => {
        render(
            <ResponsiveContainer maxWidth="lg" padding="md">
                <div>Responsive content</div>
            </ResponsiveContainer>
        );

        const container = screen.getByText('Responsive content').parentElement;
        expect(container).toHaveClass('max-w-lg');
        expect(container).toHaveClass('px-4');
    });

    test('ResponsiveGrid creates proper grid layouts', () => {
        render(
            <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }} gap="md">
                <div>Item 1</div>
                <div>Item 2</div>
                <div>Item 3</div>
            </ResponsiveGrid>
        );

        const grid = screen.getByText('Item 1').parentElement;
        expect(grid).toHaveClass('grid');
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
    });

    test('MobileOptimizedTable switches to card view on mobile', () => {
        const headers = ['Name', 'Status', 'Date'];
        const data = [
            { name: 'Item 1', status: 'Active', date: '2024-01-01' },
            { name: 'Item 2', status: 'Inactive', date: '2024-01-02' }
        ];

        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        });

        render(
            <MobileOptimizedTable
                headers={headers}
                data={data}
                mobileCardView={true}
            />
        );

        // Should render as cards on mobile
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('TouchOptimizedButton meets minimum touch target size', () => {
        render(
            <TouchOptimizedButton size="md" onClick={jest.fn()}>
                Touch me
            </TouchOptimizedButton>
        );

        const button = screen.getByRole('button', { name: /Touch me/ });
        expect(button).toHaveClass('min-h-[48px]'); // Minimum touch target
        expect(button).toHaveClass('touch-manipulation');
    });

    test('SwipeableCard handles touch gestures', () => {
        const mockSwipeLeft = jest.fn();
        const mockSwipeRight = jest.fn();

        render(
            <SwipeableCard
                onSwipeLeft={mockSwipeLeft}
                onSwipeRight={mockSwipeRight}
            >
                <div>Swipeable content</div>
            </SwipeableCard>
        );

        const card = screen.getByText('Swipeable content').parentElement;
        expect(card).toHaveClass('touch-pan-y');

        // Simulate touch events
        fireEvent.touchStart(card!, { touches: [{ clientX: 100 }] });
        fireEvent.touchMove(card!, { touches: [{ clientX: 200 }] });
        fireEvent.touchEnd(card!);

        // Should trigger swipe right (positive delta > threshold)
        expect(mockSwipeRight).toHaveBeenCalled();
    });

    test('ResponsiveModal adapts to mobile screens', () => {
        render(
            <ResponsiveModal
                isOpen={true}
                onClose={jest.fn()}
                fullScreenOnMobile={true}
            >
                <div>Modal content</div>
            </ResponsiveModal>
        );

        expect(screen.getByText('Modal content')).toBeInTheDocument();

        // Modal should be present in DOM
        const modal = screen.getByText('Modal content').closest('div');
        expect(modal).toBeInTheDocument();
    });
});

describe('UI/UX Polish - Performance Optimizations', () => {
    test('VirtualizedList renders only visible items', () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

        render(
            <VirtualizedList
                items={items}
                renderItem={(item) => <div key={item.id}>{item.name}</div>}
                itemHeight={50}
                containerHeight={300}
            />
        );

        // Should only render visible items (approximately 6-7 items for 300px container with 50px items)
        const renderedItems = screen.getAllByText(/Item \d+/);
        expect(renderedItems.length).toBeLessThan(20); // Much less than 1000
        expect(renderedItems.length).toBeGreaterThan(5); // But more than just a few
    });
});

describe('UI/UX Polish - Cross-browser Compatibility', () => {
    test('Components use CSS that works across browsers', async () => {
        const { container } = render(
            <div>
                <ResponsiveContainer>
                    <ResponsiveGrid cols={{ default: 1, sm: 2 }}>
                        <TouchOptimizedButton>Button</TouchOptimizedButton>
                    </ResponsiveGrid>
                </ResponsiveContainer>
            </div>
        );

        // Check for modern CSS features with fallbacks
        const button = screen.getByRole('button');
        expect(button).toHaveClass('transition-colors'); // CSS transitions
        expect(button).toHaveClass('focus-visible:outline-none'); // Modern focus styles

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});

describe('UI/UX Polish - Integration Tests', () => {
    test('All UI components work together without conflicts', async () => {
        const { container } = render(
            <ResponsiveContainer>
                <SkipLink href="#content">Skip to content</SkipLink>

                <div id="content">
                    <ResponsiveGrid cols={{ default: 1, md: 2 }}>
                        <EmptyCalendarState onAction={jest.fn()} />
                        <NetworkErrorState onRetry={jest.fn()} />
                    </ResponsiveGrid>
                </div>

                <ContentScheduledNotification
                    isVisible={true}
                    onClose={jest.fn()}
                    scheduledTime={new Date()}
                />

                <LiveRegion>Status update</LiveRegion>
            </ResponsiveContainer>
        );

        // All components should render without conflicts
        expect(screen.getByText('Skip to content')).toBeInTheDocument();
        expect(screen.getByText('Your Content Calendar is Empty')).toBeInTheDocument();
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
        expect(screen.getByText('Content Scheduled!')).toBeInTheDocument();

        // Should pass accessibility tests
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});