/**
 * Notification Preferences API Route
 * 
 * GET /api/notifications/preferences - Get user notification preferences
 * POST /api/notifications/preferences - Update user notification preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { getPreferenceManager } from "@/lib/notifications/preference-manager";

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

        // Get preference manager
        const preferenceManager = getPreferenceManager();

        // Fetch preferences
        const preferences = await preferenceManager.getPreferences(userId);

        return NextResponse.json({
            preferences,
        });
    } catch (error) {
        console.error("[API] Get preferences error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch preferences",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, preferences } = body;

        if (!userId || !preferences) {
            return NextResponse.json(
                { error: "userId and preferences are required" },
                { status: 400 }
            );
        }

        // Get preference manager
        const preferenceManager = getPreferenceManager();

        // Update preferences
        await preferenceManager.updatePreferences(userId, preferences);

        // Fetch updated preferences
        const updatedPreferences = await preferenceManager.getPreferences(userId);

        return NextResponse.json({
            success: true,
            message: "Preferences updated successfully",
            preferences: updatedPreferences,
        });
    } catch (error) {
        console.error("[API] Update preferences error:", error);
        return NextResponse.json(
            {
                error: "Failed to update preferences",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
