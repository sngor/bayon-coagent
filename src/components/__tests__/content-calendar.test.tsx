import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { ContentCalendar } from '../content-calendar';
import {
    ScheduledContent,
    PublishChannelType,
    ContentCategory,
    ScheduledContentStatus
} from '@/lib/content-workflow-types';

// Mock the mobile hook
jest.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false
}));

// Mock data
const mockScheduledContent: ScheduledContent[] = [
    {
        id: '1',
        userId: 'user1',
        contentId: 'content1',
        title: 'Test Blog Post',
        content: 'This is a test blog post content',
        contentType: ContentCategory.BLOG_POST,
        publishTime: new Date('2024-01-15T10:00:00Z'),
        channels: [
            {
                type: PublishChannelType.FACEBOOK,
                accountId: 'fb1',
                accountName: 'Test Facebook',
                isActive: true,
                connectionStatus: 'connected' as const
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z')
    },
    {
        id: '2',
        userId: 'user1',
        contentId: 'content2',
        title: 'Social Media Update',
        content: 'This is a social media update',
        contentType: ContentCategory.SOCIAL_MEDIA,
        publishTime: new Date('2024-01-15T14:00:00Z'),
        channels: [
            {
                type: PublishChannelType.INSTAGRAM,
                accountId: 'ig1',
                accountName: 'Test Instagram',
                isActive: true,
                connectionStatus: 'connected' as const
            }
        ],
        status: ScheduledContentStatus.PUBLISHED,
        createdAt: new Date('2024-01-10T11:00:00Z'),
        updatedAt: new Date('2024-01-15T14:00:00Z')
    }
];

describe('ContentCalendar', () => {
    const defaultProps = {
        userId: 'user1',
        scheduledContent: mockScheduledContent,
        initialDate: new Date('2024-01-15T00:00:00Z')
    };

    it('renders calendar with scheduled content', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Check if calendar header is rendered
        expect(screen.getByText('January 2024')).toBeInTheDocument();

        // Check if navigation buttons are present
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });

    it('displays weekday headers', () => {
        render(<ContentCalendar {...defaultProps} />);

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            expect(screen.getByText(day)).toBeInTheDocument();
        });
    });

    it('shows content count badge for days with scheduled content', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Should show badge with count for January 15th (which has 2 items)
        const badges = screen.getAllByText('2');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('handles navigation between months', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Click next month
        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        expect(screen.getByText('February 2024')).toBeInTheDocument();

        // Click previous month
        const prevButton = screen.getByRole('button', { name: /previous/i });
        fireEvent.click(prevButton);

        expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('handles today button click', () => {
        const today = new Date();
        const expectedMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        render(<ContentCalendar {...defaultProps} />);

        const todayButton = screen.getByRole('button', { name: /today/i });
        fireEvent.click(todayButton);

        expect(screen.getByText(expectedMonth)).toBeInTheDocument();
    });

    it('calls onContentClick when content is clicked', () => {
        const mockOnContentClick = jest.fn();
        render(
            <ContentCalendar
                {...defaultProps}
                onContentClick={mockOnContentClick}
            />
        );

        // Click on a day with content to select it
        const dayWithContent = screen.getByLabelText(/January 15, 2024/i);
        fireEvent.click(dayWithContent);

        // Then click on the content item
        const contentTitle = screen.getByText('Test Blog Post');
        fireEvent.click(contentTitle);

        expect(mockOnContentClick).toHaveBeenCalledWith('content1');
    });

    it('shows loading state when loading prop is true', () => {
        render(<ContentCalendar {...defaultProps} loading={true} />);

        // Should show loading spinner
        const loadingSpinner = document.querySelector('.animate-spin');
        expect(loadingSpinner).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Test arrow key navigation
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(screen.getByText('February 2024')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(screen.getByText('January 2024')).toBeInTheDocument();

        // Test Home key (today)
        fireEvent.keyDown(document, { key: 'Home' });
        const today = new Date();
        const expectedMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        expect(screen.getByText(expectedMonth)).toBeInTheDocument();
    });

    it('displays channel badges correctly', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Click on day with content to show details
        const dayWithContent = screen.getByLabelText(/January 15, 2024/i);
        fireEvent.click(dayWithContent);

        // Should show channel badges
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    it('shows status badges for content', () => {
        render(<ContentCalendar {...defaultProps} />);

        // Click on day with content to show details
        const dayWithContent = screen.getByLabelText(/January 15, 2024/i);
        fireEvent.click(dayWithContent);

        // Should show status badges
        expect(screen.getByText('scheduled')).toBeInTheDocument();
        expect(screen.getByText('published')).toBeInTheDocument();
    });
});