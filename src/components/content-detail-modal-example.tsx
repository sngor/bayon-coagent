"use client";

/**
 * Content Detail Modal - Usage Example
 * 
 * This file demonstrates how to use the ContentDetailModal component
 * in your application. It shows:
 * - Basic usage with scheduled content
 * - Handling edit, reschedule, duplicate, and delete actions
 * - Displaying analytics data when available
 */

import * as React from "react";
import { ContentDetailModal } from "./content-detail-modal";
import { Button } from "@/components/ui/button";
import type {
    ScheduledContent,
    ScheduledContentStatus,
    ContentCategory,
    PublishChannelType,
} from "@/lib/types/content-workflow-types";

/**
 * Example usage of ContentDetailModal
 */
export function ContentDetailModalExample() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    // Example scheduled content
    const exampleContent: ScheduledContent = {
        id: "schedule-123",
        userId: "user-456",
        contentId: "content-789",
        title: "Spring Market Update: What Buyers Need to Know",
        content: `The spring real estate market is heating up! 🏡

Here are the top 3 things buyers should know:

1. Inventory is increasing - More homes are hitting the market this month
2. Interest rates remain favorable - Now is still a great time to lock in a rate
3. Competition is moderate - Multiple offers are less common than last year

Ready to start your home search? Let's chat about your goals and find the perfect property for you!

#RealEstate #SpringMarket #HomeBuying #RealEstateAgent`,
        contentType: "social_media" as ContentCategory,
        publishTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        channels: [
            {
                type: "facebook" as PublishChannelType,
                accountId: "fb-123",
                accountName: "John Doe - Real Estate",
                isActive: true,
                connectionStatus: "connected" as const,
            },
            {
                type: "linkedin" as PublishChannelType,
                accountId: "li-456",
                accountName: "John Doe",
                isActive: true,
                connectionStatus: "connected" as const,
            },
        ],
        status: "scheduled" as ScheduledContentStatus,
        metadata: {
            tags: ["spring", "market-update", "buyers"],
            hashtags: ["RealEstate", "SpringMarket", "HomeBuying", "RealEstateAgent"],
            aiModel: "claude-3-5-sonnet",
            generatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Example analytics data (only shown for published content)
    const exampleAnalytics = {
        metrics: {
            views: 1234,
            likes: 89,
            shares: 23,
            comments: 15,
            clicks: 45,
            engagementRate: 0.072,
        },
        lastUpdated: new Date(),
    };

    // Handler for editing content
    const handleEdit = async (contentId: string, updates: Partial<ScheduledContent>) => {
        setIsLoading(true);
        try {
            console.log("Editing content:", contentId, updates);
            // In a real app, call your API here
            // await updateScheduledContent(contentId, updates);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            alert("Content updated successfully!");
        } catch (error) {
            console.error("Failed to edit content:", error);
            alert("Failed to update content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for rescheduling content
    const handleReschedule = async (contentId: string, newTime: Date) => {
        setIsLoading(true);
        try {
            console.log("Rescheduling content:", contentId, "to", newTime);
            // In a real app, call your API here
            // await rescheduleContent(contentId, newTime);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            alert(`Content rescheduled to ${newTime.toLocaleString()}`);
        } catch (error) {
            console.error("Failed to reschedule content:", error);
            alert("Failed to reschedule content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for duplicating content
    const handleDuplicate = async (contentId: string) => {
        setIsLoading(true);
        try {
            console.log("Duplicating content:", contentId);
            // In a real app, call your API here
            // await duplicateContent(contentId);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            alert("Content duplicated successfully!");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to duplicate content:", error);
            alert("Failed to duplicate content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for deleting content
    const handleDelete = async (contentId: string) => {
        setIsLoading(true);
        try {
            console.log("Deleting content:", contentId);
            // In a real app, call your API here
            // await deleteScheduledContent(contentId);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            alert("Content deleted successfully!");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to delete content:", error);
            alert("Failed to delete content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Content Detail Modal Example</h2>
                <p className="text-muted-foreground">
                    Click the button below to see the content detail modal in action.
                </p>
            </div>

            <Button onClick={() => setIsOpen(true)}>
                Open Content Detail Modal
            </Button>

            <ContentDetailModal
                open={isOpen}
                onOpenChange={setIsOpen}
                content={exampleContent}
                // Uncomment to show analytics (only for published content)
                // analytics={exampleAnalytics}
                onEdit={handleEdit}
                onReschedule={handleReschedule}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            <div className="mt-8 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Usage Notes:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>The modal displays comprehensive content details with preview</li>
                    <li>Scheduling information includes timezone display</li>
                    <li>Inline editing is available for scheduled content</li>
                    <li>Quick actions: Edit, Reschedule, Duplicate, Delete</li>
                    <li>Performance metrics are shown for published content</li>
                    <li>All actions are async and show loading states</li>
                </ul>
            </div>
        </div>
    );
}
