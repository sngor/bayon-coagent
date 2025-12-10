/**
 * Onboarding Metrics API Route
 * 
 * Provides access to onboarding metrics, funnel data, and alarm statuses.
 * Used by admin dashboard and monitoring UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingMonitoring } from '@/services/onboarding/onboarding-monitoring-service';
import type { OnboardingFlowType } from '@/types/onboarding';

export const dynamic = 'force-dynamic';

/**
 * GET /api/onboarding/metrics
 * 
 * Query parameters:
 * - flowType: 'user' | 'admin' | 'both' (optional)
 * - startDate: ISO date string (optional, defaults to 24 hours ago)
 * - endDate: ISO date string (optional, defaults to now)
 * - includeFunnel: 'true' | 'false' (optional, defaults to false)
 * - includeAlarms: 'true' | 'false' (optional, defaults to false)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters
        const flowType = searchParams.get('flowType') as OnboardingFlowType | null;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const includeFunnel = searchParams.get('includeFunnel') === 'true';
        const includeAlarms = searchParams.get('includeAlarms') === 'true';

        // Build time range
        const timeRange = {
            start: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: endDate ? new Date(endDate) : new Date(),
        };

        // Validate time range
        if (timeRange.start >= timeRange.end) {
            return NextResponse.json(
                { error: 'Invalid time range: start date must be before end date' },
                { status: 400 }
            );
        }

        // Get metrics
        const metrics = await onboardingMonitoring.getOnboardingMetrics(
            flowType || undefined,
            timeRange
        );

        // Build response
        const response: any = {
            metrics,
            timeRange: {
                start: timeRange.start.toISOString(),
                end: timeRange.end.toISOString(),
            },
        };

        // Include funnel data if requested
        if (includeFunnel && flowType) {
            response.funnel = await onboardingMonitoring.getFunnelData(flowType, timeRange);
        }

        // Include alarm statuses if requested
        if (includeAlarms) {
            response.alarms = await onboardingMonitoring.getAlarmStatuses();
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[ONBOARDING_METRICS_API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch onboarding metrics' },
            { status: 500 }
        );
    }
}
