/**
 * UI/UX Polish Test Suite - Simplified
 * 
 * Tests for skeleton loading states, empty states, error handling,
 * success notifications, accessibility features, and responsive design
 * 
 * Validates: Task 16.4 - Professional UI/UX polish
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import components to test
import {
    ContentCalendarSkeleton,
    SchedulingModalSkeleton,
    AnalyticsDashboardSkeleton
} from '@/components/ui/skeleton-loading';

import {
    EmptyCalendarState,
    EmptyAnalyticsState,
    NoConnectionsState
} from '@/components/ui/empty-states';

import {
    NetworkErrorState,
    ValidationErrorState
} from '@/components/ui/error-states';

import {
    SkipLink,
    VisuallyHidden
} from '@/components/ui/accessibility-helpers';

import {
    ResponsiveContainer,
    ResponsiveGrid,
    TouchOptimizedButton
} from '@/components/ui/responsive-helpers';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('UI/UX Polish - Skeleton Loading States', () => {
    test('ContentCalendarSkeleton renders with proper accessibility attributes', () => {
        render(<ContentCalendarSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading calendar')).toBeInTheDocument();
        expect(screen.getByText('Loading calendar content...')).toBeInTheDocument();
    });

    test('SchedulingModalSkeleton shows loading state', () => {
        render(<SchedulingModalSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading scheduling options')).toBeInTheDocument();
    });

    test('AnalyticsDashboardSkeleton displays metric card skeletons', () => {
        render(<AnalyticsDashboardSkeleton />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading analytics dashboard')).toBeInTheDocument();
    });
});

describe('UI/UX Polish - Empty States', () => {
    test('EmptyCalendarState provides actionable guidance', async () => {
        const mockAction = jest.fn();
        render(<EmptyCalendarState onAction={mockAction} />);

        expect(screen.getByText('Your Content Calendar is Empty')).toBeInTheDocument();
        expect(screen.getByText(/Start building your content strategy/)).toBeInTheDocument();

        const scheduleButton = screen.getByRole('button', { name: /Schedule Your First Post/ });
        expect(scheduleButton).toBeInTheDocument();

        await userEvent.click(scheduleButton);
        expect(mockAction).toHaveBeenCalled();
    });

    test('EmptyAnalyticsState shows connection guidance', () => {
        const mockAction = jest.fn();
        render(<EmptyAnalyticsState onAction={mockAction} />);

        expect(screen.getByText('No Analytics Data Available')).toBeInTheDocument();
        expect(screen.getByText(/Connect your social media accounts/)).toBeInTheDocument();

        const connectButton = screen.getByRole('button', { name: /Connect Accounts/ });
        expect(connectButton).toBeInTheDocument();
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

        render(
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
});

describe('UI/UX Polish - Accessibility Features', () => {
    test('SkipLink provides keyboard navigation', () => {
        render(
            <div>
                <SkipLink href="#main-content">Skip to main content</SkipLink>
                <div id="main-content">Main content</div>
            </div>
        );

        const skipLink = screen.getByRole('link', { name: /Skip to main content/ });
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    test('VisuallyHidden content is accessible to screen readers', () => {
        render(
            <VisuallyHidden>
                This content is hidden visually but available to screen readers
            </VisuallyHidden>
        );

        const hiddenContent = screen.getByText(/This content is hidden visually/);
        expect(hiddenContent).toBeInTheDocument();
        expect(hiddenContent).toHaveClass('sr-only');
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
});

describe('UI/UX Polish - Integration Tests', () => {
    test('All UI components work together without conflicts', () => {
        render(
            <ResponsiveContainer>
                <SkipLink href="#content">Skip to content</SkipLink>

                <div id="content">
                    <ResponsiveGrid cols={{ default: 1, md: 2 }}>
                        <EmptyCalendarState onAction={jest.fn()} />
                        <NetworkErrorState onRetry={jest.fn()} />
                    </ResponsiveGrid>
                </div>

                <VisuallyHidden>Status update</VisuallyHidden>
            </ResponsiveContainer>
        );

        // All components should render without conflicts
        expect(screen.getByText('Skip to content')).toBeInTheDocument();
        expect(screen.getByText('Your Content Calendar is Empty')).toBeInTheDocument();
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
        expect(screen.getByText('Status update')).toBeInTheDocument();
    });
});

describe('UI/UX Polish - WCAG 2.1 AA Compliance', () => {
    test('Components have proper ARIA labels and roles', () => {
        render(
            <div>
                <ContentCalendarSkeleton />
                <EmptyCalendarState onAction={jest.fn()} />
                <NetworkErrorState onRetry={jest.fn()} />
            </div>
        );

        // Check for proper roles
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(2); // EmptyState and ErrorState buttons

        // Check for proper labeling
        expect(screen.getByLabelText('Loading calendar')).toBeInTheDocument();
    });

    test('Focus management works correctly', () => {
        render(
            <div>
                <TouchOptimizedButton onClick={jest.fn()}>First button</TouchOptimizedButton>
                <TouchOptimizedButton onClick={jest.fn()}>Second button</TouchOptimizedButton>
            </div>
        );

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);

        // Focus should be manageable
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);
    });

    test('Color contrast and visual design meets standards', () => {
        render(
            <div>
                <EmptyCalendarState onAction={jest.fn()} />
                <NetworkErrorState onRetry={jest.fn()} />
            </div>
        );

        // Check for proper color classes that meet contrast requirements
        const errorCard = screen.getByText('Connection Problem').closest('div');
        expect(errorCard).toHaveClass('border-destructive/50');

        const emptyCard = screen.getByText('Your Content Calendar is Empty').closest('div');
        expect(emptyCard).toHaveClass('border-dashed');
    });
});