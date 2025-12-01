'use client';

import React from 'react';
import { ContentCalendar } from './content-calendar';
import {
    ScheduledContent,
    PublishChannelType,
    ContentCategory,
    ScheduledContentStatus
} from '@/lib/content-workflow-types';

// Example data for demonstration
const exampleScheduledContent: ScheduledContent[] = [
    {
        id: '1',
        userId: 'user1',
        contentId: 'content1',
        title: 'New Listing: Beautiful 3BR Home in Downtown',
        content: 'Check out this stunning 3-bedroom home with modern amenities...',
        contentType: ContentCategory.LISTING_DESCRIPTION,
        publishTime: new Date('2024-01-15T10:00:00Z'),
        channels: [
            {
                type: PublishChannelType.FACEBOOK,
                accountId: 'fb1',
                accountName: 'My Real Estate Page',
                isActive: true,
                connectionStatus: 'connected' as const
            },
            {
                type: PublishChannelType.INSTAGRAM,
                accountId: 'ig1',
                accountName: '@myrealestate',
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
        title: 'Market Update: January 2024 Trends',
        content: 'The real estate market is showing positive signs this January...',
        contentType: ContentCategory.MARKET_UPDATE,
        publishTime: new Date('2024-01-15T14:00:00Z'),
        channels: [
            {
                type: PublishChannelType.LINKEDIN,
                accountId: 'li1',
                accountName: 'John Doe - Real Estate Professional',
                isActive: true,
                connectionStatus: 'connected' as const
            }
        ],
        status: ScheduledContentStatus.PUBLISHED,
        createdAt: new Date('2024-01-10T11:00:00Z'),
        updatedAt: new Date('2024-01-15T14:00:00Z')
    },
    {
        id: '3',
        userId: 'user1',
        contentId: 'content3',
        title: 'Home Buying Tips for First-Time Buyers',
        content: 'Buying your first home can be overwhelming. Here are some tips...',
        contentType: ContentCategory.BLOG_POST,
        publishTime: new Date('2024-01-20T09:00:00Z'),
        channels: [
            {
                type: PublishChannelType.BLOG,
                accountId: 'blog1',
                accountName: 'My Real Estate Blog',
                isActive: true,
                connectionStatus: 'connected' as const
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        createdAt: new Date('2024-01-12T15:00:00Z'),
        updatedAt: new Date('2024-01-12T15:00:00Z')
    }
];

/**
 * Example component demonstrating the ContentCalendar usage
 */
export function ContentCalendarExample() {
    const handleContentClick = (contentId: string) => {
        console.log('Content clicked:', contentId);
        alert(`Viewing content: ${contentId}`);
    };

    const handleContentEdit = (contentId: string) => {
        console.log('Edit content:', contentId);
        alert(`Editing content: ${contentId}`);
    };

    const handleContentDelete = (scheduleId: string) => {
        console.log('Delete scheduled content:', scheduleId);
        alert(`Deleting scheduled content: ${scheduleId}`);
    };

    const handleContentDuplicate = (contentId: string) => {
        console.log('Duplicate content:', contentId);
        alert(`Duplicating content: ${contentId}`);
    };

    const handleScheduleUpdate = async (scheduleId: string, newDate: Date) => {
        console.log('Update schedule:', scheduleId, 'to', newDate);
        alert(`Rescheduling ${scheduleId} to ${newDate.toDateString()}`);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Content Calendar Example</h1>
                <p className="text-muted-foreground">
                    This demonstrates the ContentCalendar component with sample scheduled content.
                    You can navigate between months, view content details, and interact with scheduled items.
                </p>
            </div>

            <ContentCalendar
                userId="user1"
                scheduledContent={exampleScheduledContent}
                initialDate={new Date('2024-01-15')}
                onContentClick={handleContentClick}
                onContentEdit={handleContentEdit}
                onContentDelete={handleContentDelete}
                onContentDuplicate={handleContentDuplicate}
                onScheduleUpdate={handleScheduleUpdate}
            />
        </div>
    );
}