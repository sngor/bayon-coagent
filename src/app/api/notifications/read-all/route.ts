/**
 * Mark All Notifications as Read API Route
 * 
 * POST /api/notifications/read-all - Mark all notifications as read for a user
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotificationRepository } from "@/lib/notifications/repository";
import { NotificationStatus } from "@/lib/notifications/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Get notification repository
        const repository = getNotificationRepository();

        // Get all unread notifications
        const history = await repository.getUserNotifications(userId, {
            status: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED],
        });

        // Mark each as read
        await Promise.all(
            history.notifications.map((notification) =>
                repository.markAsRead(notification.id)
            )
        );

        return NextResponse.json({
            success: true,
            message: "All notifications marked as read",
            count: history.notifications.length,
        });
    } catch (error) {
        console.error("[API] Mark all as read error:", error);
        return NextResponse.json(
            {
                error: "Failed to mark all notifications as read",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
