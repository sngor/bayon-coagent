/**
 * Enhanced Billing Search API Route
 * 
 * Provides advanced search capabilities for Stripe billing data
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeIntegrationService } from '@/services/admin/stripe-integration';
import { getCurrentUser } from '@/aws/auth/cognito-client';

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated and has super admin role
        const user = await getCurrentUser();
        if (!user || user.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Super Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { searchType, criteria } = body;

        // Validate input
        if (!searchType || !['customers', 'subscriptions', 'payments'].includes(searchType)) {
            return NextResponse.json(
                { error: 'Invalid search type' },
                { status: 400 }
            );
        }

        // Perform search using Stripe integration service
        const results = await stripeIntegrationService.searchBilling({
            searchType,
            criteria: criteria || {},
        });

        return NextResponse.json({
            success: true,
            results: results.results,
            total: results.total,
        });

    } catch (error) {
        console.error('Error in billing search API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}