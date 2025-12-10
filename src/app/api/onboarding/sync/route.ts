/**
 * Onboarding State Sync API
 * 
 * Handles state synchronization during page unload using navigator.sendBeacon
 * This endpoint is optimized for quick responses and reliability.
 * 
 * Requirements: 6.2, 18.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingService } from '@/services/onboarding/onboarding-service';

export const runtime = 'edge';

/**
 * POST /api/onboarding/sync
 * Sync onboarding state (called during page unload)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, state, timestamp } = body;

        if (!userId || !state) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate timestamp is recent (within last 5 seconds)
        const now = Date.now();
        if (timestamp && Math.abs(now - timestamp) > 5000) {
            console.warn('[ONBOARDING_SYNC] Stale sync request:', { userId, age: now - timestamp });
        }

        // Update last accessed time
        await onboardingService.updateMetadata(userId, {
            ...state.metadata,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ONBOARDING_SYNC] Error syncing state:', error);

        // Return success anyway to avoid blocking page unload
        // The state will be synced on next page load
        return NextResponse.json({ success: true });
    }
}
