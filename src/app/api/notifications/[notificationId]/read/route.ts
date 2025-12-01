/**
 * Mark Notification as Read API Route
 * 
 * POST /api/notifications/[notificationId]/read - Mark a notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotificationRepository } from "@/lib/notifications/repository";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    try {
        const { notificationId } = await params;

        if (!notificationId) {
            return NextResponse.json(
                { error: "notificationId is required" },
                { status: 400 }
            );
        }

        // Get notification repository
        const repository = getNotificationRepository();

        // Mark as read
        await repository.markAsRead(notificationId);

        return NextResponse.json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        console.error("[API] Mark as read error:", error);
        return NextResponse.json(
            {
                error: "Failed to mark notification as read",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
