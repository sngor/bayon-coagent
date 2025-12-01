/**
 * Dismiss Notification API Route
 * 
 * POST /api/notifications/[notificationId]/dismiss - Dismiss a notification
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

        // Dismiss notification
        await repository.dismissNotification(notificationId);

        return NextResponse.json({
            success: true,
            message: "Notification dismissed",
        });
    } catch (error) {
        console.error("[API] Dismiss notification error:", error);
        return NextResponse.json(
            {
                error: "Failed to dismiss notification",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
