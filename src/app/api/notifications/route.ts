/**
 * Notifications API Route
 * 
 * GET /api/notifications - Fetch notifications for a user
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotificationRepository } from "@/lib/notifications/repository";
import { NotificationType, NotificationStatus } from "@/lib/notifications/types";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Parse filter parameters
        const typesParam = searchParams.get("types");
        const statusParam = searchParams.get("status");
        const limitParam = searchParams.get("limit");
        const unreadOnlyParam = searchParams.get("unreadOnly");

        const types = typesParam
            ? (typesParam.split(",") as NotificationType[])
            : undefined;
        let status = statusParam
            ? (statusParam.split(",") as NotificationStatus[])
            : undefined;
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;
        const unreadOnly = unreadOnlyParam === "true";

        // If unreadOnly is true, filter by unread statuses
        if (unreadOnly) {
            status = [
                NotificationStatus.PENDING,
                NotificationStatus.SENT,
                NotificationStatus.DELIVERED,
            ];
        }

        // Get notification repository
        const repository = getNotificationRepository();

        // Fetch notifications
        const history = await repository.getUserNotifications(userId, {
            types,
            status,
            limit,
        });

        return NextResponse.json({
            notifications: history.notifications,
            count: history.notifications.length,
        });
    } catch (error) {
        console.error("[API] Notifications fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch notifications",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
