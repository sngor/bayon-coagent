import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/admin/auth-middleware';
import { z } from 'zod';

import { billingService } from '@/services/admin/billing-service';

// Input validation schema
const analyticsQuerySchema = z.object({
    timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

async function handleGetAnalytics(request: AuthenticatedRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Validate query parameters
        const queryResult = analyticsQuerySchema.safeParse({
            timeRange: searchParams.get('timeRange'),
        });

        if (!queryResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid query parameters',
                    details: queryResult.error.errors,
                },
                { status: 400 }
            );
        }

        const { timeRange } = queryResult.data;

        // Get analytics data from billing service
        const analyticsData = await billingService.getBillingAnalytics(timeRange);

        return NextResponse.json({
            success: true,
            data: analyticsData,
            meta: {
                timeRange,
                generatedAt: new Date().toISOString(),
                requestedBy: request.user.id,
            },
        });

    } catch (error: any) {
        console.error('Error in billing analytics API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch billing analytics'
            },
            { status: 500 }
        );
    }
}

// Export with admin authentication middleware
export const GET = withAdminAuth(handleGetAnalytics, { requireSuperAdmin: true });