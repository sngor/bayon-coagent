/**
 * Notification Stream API Route
 * 
 * Server-Sent Events (SSE) endpoint for real-time notification delivery.
 * Clients connect to this endpoint to receive notifications in real-time.
 * Validates Requirements: 2.1, 2.2
 */

import { NextRequest } from "next/server";
import { getNotificationBroadcaster } from "@/lib/notifications/realtime/notification-broadcaster";
import { getCurrentUser } from "@/aws/auth/cognito-client";

/**
 * GET /api/notifications/stream
 * 
 * Establishes an SSE connection for real-time notifications.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
    try {
        // Get current user from session
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const userId = user.id;

        // Create a ReadableStream for SSE
        const stream = new ReadableStream({
            start(controller) {
                // Register client with broadcaster
                const broadcaster = getNotificationBroadcaster();
                const cleanup = broadcaster.registerClient(userId, controller);

                // Store cleanup function for when connection closes
                request.signal.addEventListener("abort", () => {
                    console.log(`[SSE] Connection aborted for user ${userId}`);
                    cleanup();
                });
            },
            cancel() {
                console.log(`[SSE] Stream cancelled for user ${userId}`);
            },
        });

        // Return SSE response
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no", // Disable buffering in nginx
            },
        });
    } catch (error) {
        console.error("[SSE] Error establishing connection:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

/**
 * OPTIONS /api/notifications/stream
 * 
 * CORS preflight handler
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
