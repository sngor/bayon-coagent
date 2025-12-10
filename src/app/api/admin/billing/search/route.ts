/**
 * Admin Billing Search API Route
 * 
 * Provides advanced search capabilities for billing data using Stripe power.
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingService } from '@/services/admin/billing-service';

export async function POST(request: NextRequest) {
    try {
        const { searchType, criteria } = await request.json();

        let results;

        switch (searchType) {
            case 'customers':
                results = await billingService.searchCustomers(criteria);
                break;
            case 'subscriptions':
                results = await billingService.searchSubscriptions(criteria);
                break;
            case 'payments':
                results = await billingService.searchPayments(criteria);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid search type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error in billing search:', error);
        return NextResponse.json(
            { error: 'Failed to search billing data' },
            { status: 500 }
        );
    }
}