'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContentDetailModal } from '@/components/content-detail-modal';
import {
    ScheduledContent,
    PublishChannelType,
    ScheduledContentStatus,
    ContentCategory,
    EngagementMetrics,
    OptimalTime,
    ROIAnalytics
} from '@/lib/content-workflow-types';

/**
 * Example component demonstrating the ContentDetailModal usage
 * 
 * This shows how to integrate the modal with content calendar or other components
 * that need to display detailed content information with editing capabilities.
 */
export function ContentDetailModalExample() {
    const [isOpen, setIsOpen] = useState(false);

    // Mock content data
    const mockContent: ScheduledContent = {
        id: 'schedule-123',
        userId: 'user-456',
        contentId: 'content-789',
        title: 'Spring Market Update: What Buyers Need to Know',
        content: `The spring real estate market is heating up! Here are the key trends every buyer should know:

🏠 Inventory is up 15% compared to last year
📈 Interest rates are stabilizing around 6.5%
💰 Home prices are moderating in most markets
⏰ Average days on market: 28 days

Ready to make your move? Let's discuss your home buying strategy and find the perfect property for you.

#RealEstate #SpringMarket #HomeBuying #MarketUpdate`,
        contentType: ContentCategory.SOCIAL_MEDIA,
        publishTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        channels: [
            {
                type: PublishChannelType.FACEBOOK,
                accountId: 'fb-123',
                accountName: 'John Doe Real Estate',
                isActive: true,
                connectionStatus: 'connected' as const
            },
            {
                type: PublishChannelType.INSTAGRAM,
                accountId: 'ig-456',
                accountName: '@johndoerealestate',
                isActive: true,
                connectionStatus: 'connected' as const
            },
            {
                type: PublishChannelType.LINKEDIN,
                accountId: 'li-789',
                accountName: 'John Doe - Real Estate Professional',
                isActive: true,
                connectionStatus: 'connected' as const
            }
        ],
        status: ScheduledContentStatus.SCHEDULED,
        metadata: {
            originalPrompt: 'Create a spring market update post highlighting key trends for buyers',
            aiModel: 'Claude 3.5 Sonnet',
            generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            tags: ['spring-market', 'buyers', 'market-update', 'trends']
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    };

    // Mock analytics data
    const mockAnalytics: EngagementMetrics = {
        views: 2847,
        likes: 156,
        shares: 23,
        comments: 18,
        clicks: 89,
        saves: 34,
        engagementRate: 11.2,
        reach: 1923,
        impressions: 3456
    };

    // Mock optimal times
    const mockOptimalTimes: OptimalTime[] = [
        {
            time: '09:00',
            dayOfWeek: 2, // Tuesday
            expectedEngagement: 87.5,
            confidence: 0.92,
            historicalData: {
                sampleSize: 45,
                avgEngagement: 85.3,
                lastCalculated: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        {
            time: '14:30',
            dayOfWeek: 3, // Wednesday
            expectedEngagement: 82.1,
            confidence: 0.88,
            historicalData: {
                sampleSize: 38,
                avgEngagement: 79.8,
                lastCalculated: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        {
            time: '19:15',
            dayOfWeek: 4, // Thursday
            expectedEngagement: 79.3,
            confidence: 0.85,
            historicalData: {
                sampleSize: 42,
                avgEngagement: 76.9,
                lastCalculated: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        }
    ];

    // Mock ROI data
    const mockROIData: ROIAnalytics = {
        totalRevenue: 15750,
        totalLeads: 12,
        totalConversions: 3,
        costPerLead: 45.50,
        conversionRate: 25.0,
        averageOrderValue: 5250,
        returnOnAdSpend: 3.2,
        byContentType: {
            [ContentCategory.SOCIAL_MEDIA]: {
                revenue: 15750,
                leads: 12,
                conversions: 3,
                cost: 546,
                roi: 288.5,
                roas: 3.2,
                cpl: 45.50,
                cpa: 182.0
            },
            [ContentCategory.BLOG_POST]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.LISTING_DESCRIPTION]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.MARKET_UPDATE]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.NEIGHBORHOOD_GUIDE]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.VIDEO_SCRIPT]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.NEWSLETTER]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [ContentCategory.EMAIL_TEMPLATE]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            }
        },
        byChannel: {
            [PublishChannelType.FACEBOOK]: {
                revenue: 8250,
                leads: 6,
                conversions: 2,
                cost: 285,
                roi: 289.5,
                roas: 3.1,
                cpl: 47.50,
                cpa: 142.50
            },
            [PublishChannelType.INSTAGRAM]: {
                revenue: 5250,
                leads: 4,
                conversions: 1,
                cost: 182,
                roi: 288.5,
                roas: 3.2,
                cpl: 45.50,
                cpa: 182.0
            },
            [PublishChannelType.LINKEDIN]: {
                revenue: 2250,
                leads: 2,
                conversions: 0,
                cost: 79,
                roi: 284.8,
                roas: 3.0,
                cpl: 39.50,
                cpa: 0
            },
            [PublishChannelType.TWITTER]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [PublishChannelType.BLOG]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            },
            [PublishChannelType.NEWSLETTER]: {
                revenue: 0,
                leads: 0,
                conversions: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                cpl: 0,
                cpa: 0
            }
        },
        topPerformingContent: [
            {
                contentId: 'content-789',
                title: 'Spring Market Update: What Buyers Need to Know',
                contentType: ContentCategory.SOCIAL_MEDIA,
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                totalRevenue: 15750,
                totalLeads: 12,
                roi: 288.5,
                attribution: 'mixed' as const
            }
        ],
        conversionFunnel: [
            {
                step: 'Impression',
                count: 3456,
                conversionRate: 100,
                dropOffRate: 0
            },
            {
                step: 'Click',
                count: 89,
                conversionRate: 2.6,
                dropOffRate: 97.4
            },
            {
                step: 'Lead',
                count: 12,
                conversionRate: 13.5,
                dropOffRate: 86.5
            },
            {
                step: 'Conversion',
                count: 3,
                conversionRate: 25.0,
                dropOffRate: 75.0
            }
        ],
        timeRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        },
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    };

    // Mock handlers
    const handleUpdate = async (updates: Partial<ScheduledContent>) => {
        console.log('Updating content:', updates);
        // In a real app, this would call an API to update the content
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    };

    const handleDelete = async (contentId: string) => {
        console.log('Deleting content:', contentId);
        // In a real app, this would call an API to delete the content
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    };

    const handleDuplicate = async (contentId: string) => {
        console.log('Duplicating content:', contentId);
        // In a real app, this would call an API to duplicate the content
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    };

    const handleReschedule = async (contentId: string, newDate: Date) => {
        console.log('Rescheduling content:', contentId, 'to:', newDate);
        // In a real app, this would call an API to reschedule the content
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    };

    return (
        <div className="p-6 space-y-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Content Detail Modal Example</h2>
                <p className="text-muted-foreground">
                    This example demonstrates the rich content detail modal with inline editing,
                    performance metrics, optimal timing suggestions, and quick actions.
                </p>
            </div>

            <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Comprehensive content preview with metadata</li>
                        <li>• Inline editing for title, content, and publish time</li>
                        <li>• Real-time validation with error handling</li>
                        <li>• Performance metrics display (views, likes, engagement rate)</li>
                        <li>• ROI analytics with revenue and conversion tracking</li>
                        <li>• Optimal posting time recommendations</li>
                        <li>• Quick actions: reschedule, duplicate, delete</li>
                        <li>• Confirmation dialogs for destructive actions</li>
                        <li>• Responsive design for mobile and desktop</li>
                        <li>• Timezone support and relative time display</li>
                    </ul>
                </div>

                <Button onClick={() => setIsOpen(true)} size="lg">
                    Open Content Detail Modal
                </Button>
            </div>

            <ContentDetailModal
                content={mockContent}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onReschedule={handleReschedule}
                analytics={mockAnalytics}
                optimalTimes={mockOptimalTimes}
                roiData={mockROIData}
                loading={false}
            />
        </div>
    );
}