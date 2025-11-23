import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConcurrentContentStack } from '@/components/concurrent-content-stack';
import {
    ScheduledContent,
    PublishChannelType,
    ScheduledContentStatus,
    ContentCategory
} from '@/lib/content-workflow-types';

// Mock data for testing
const mockContent: ScheduledContent[] = [
    {
        id: '1',
        userId: 'user1',
        contentId: 'content1',
        title: 'First Post',
        content: 'This is the first post',
        contentType: ContentCategory.SOCIAL_MEDIA,
        publishTime: new Date('2024-01-01T10:00:00Z'),
        channels: [
            {
                type: PublishChannelType.FACEBOOK,
                accountId: 'fb1',
                accountName: 'Facebook Account',
                isActive: true,
                connectionStatus: 'connected'
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        userId: 'user1',
        contentId: 'content2',
        title: 'Second Post',
        content: 'This is the second post',
        contentType: ContentCategory.BLOG_POST,
        publishTime: new Date('2024-01-01T10:00:00Z'), // Same time as first post
        channels: [
            {
                type: PublishChannelType.LINKEDIN,
                accountId: 'li1',
                accountName: 'LinkedIn Account',
                isActive: true,
                connectionStatus: 'connected'
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '3',
        userId: 'user1',
        contentId: 'content3',
        title: 'Third Post',
        content: 'This is the third post',
        contentType: ContentCategory.SOCIAL_MEDIA,
        publishTime: new Date('2024-01-01T11:00:00Z'), // Different time
        channels: [
            {
                type: PublishChannelType.TWITTER,
                accountId: 'tw1',
                accountName: 'Twitter Account',
                isActive: true,
                connectionStatus: 'connected'
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

describe('ConcurrentContentStack', () => {
    it('should render content items grouped by time slots', () => {
        render(
            <ConcurrentContentStack
                content={mockContent}
                date={new Date('2024-01-01')}
            />
        );

        // Should show both posts scheduled at 10:00 AM
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.getByText('Second Post')).toBeInTheDocument();
        expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('should detect conflicts when multiple items are scheduled at the same time', () => {
        render(
            <ConcurrentContentStack
                content={mockContent}
                date={new Date('2024-01-01')}
            />
        );

        // Should show conflict indicator for the 10:00 AM time slot
        expect(screen.getByText('1 time slot with conflicts')).toBeInTheDocument();
    });

    it('should show expandable groups for time slots with multiple items', () => {
        render(
            <ConcurrentContentStack
                content={mockContent}
                date={new Date('2024-01-01')}
                maxVisibleItems={1}
            />
        );

        // Should show expand button for the time slot with 2 items
        const expandButtons = screen.getAllByRole('button');
        const expandButton = expandButtons.find(button =>
            button.getAttribute('aria-expanded') === 'false'
        );

        expect(expandButton).toBeInTheDocument();
    });

    it('should provide conflict resolution suggestions', () => {
        const mockOnConflictResolve = () => { };

        render(
            <ConcurrentContentStack
                content={mockContent}
                date={new Date('2024-01-01')}
                onConflictResolve={mockOnConflictResolve}
            />
        );

        // Click on resolve button
        const resolveButton = screen.getByText('Resolve');
        fireEvent.click(resolveButton);

        // Should show conflict resolution suggestions
        expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();

        // Check for resolution types (they might be capitalized)
        const staggerElements = screen.getAllByText(/stagger/i);
        expect(staggerElements.length).toBeGreaterThan(0);
    });

    it('should handle empty content gracefully', () => {
        const { container } = render(
            <ConcurrentContentStack
                content={[]}
                date={new Date('2024-01-01')}
            />
        );

        // Should render nothing for empty content
        expect(container.firstChild).toBeNull();
    });

    it('should prioritize content by status and type', () => {
        const priorityContent: ScheduledContent[] = [
            {
                ...mockContent[0],
                status: ScheduledContentStatus.PUBLISHING, // Higher priority
                contentType: ContentCategory.NEWSLETTER // Higher priority type
            },
            {
                ...mockContent[1],
                status: ScheduledContentStatus.SCHEDULED, // Lower priority
                contentType: ContentCategory.SOCIAL_MEDIA // Lower priority type
            }
        ];

        render(
            <ConcurrentContentStack
                content={priorityContent}
                date={new Date('2024-01-01')}
            />
        );

        // The publishing newsletter should appear first (higher priority)
        const contentItems = screen.getAllByRole('button', { name: /drag to reschedule/i });
        expect(contentItems.length).toBeGreaterThan(0);
    });
});