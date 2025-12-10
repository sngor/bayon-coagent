/**
 * Promotion Management API Route
 * 
 * Handles creation and management of seasonal promotions
 */

import { NextResponse } from 'next/server';
import { stripeIntegrationService } from '@/services/admin/stripe-integration';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/admin/auth-middleware';

async function handleGetPromotions(request: AuthenticatedRequest) {
    try {

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'seasonal-suggestions') {
            const suggestions = stripeIntegrationService.getSeasonalSuggestions();
            return NextResponse.json({
                success: true,
                suggestions,
            });
        }

        if (action === 'active') {
            // In a real implementation, this would fetch from database
            // For now, return empty array
            return NextResponse.json({
                success: true,
                promotions: [],
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action parameter' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Error in promotions GET API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handlePostPromotions(request: AuthenticatedRequest) {
    try {
        const body = await request.json();
        const { action, seasonType, customDiscount, campaignId } = body;

        if (action === 'create-seasonal') {
            if (!seasonType) {
                return NextResponse.json(
                    { success: false, error: 'Season type is required' },
                    { status: 400 }
                );
            }

            const campaign = await stripeIntegrationService.createSeasonalPromotion(
                seasonType,
                customDiscount
            );

            return NextResponse.json({
                success: true,
                campaign,
            });
        }

        if (action === 'deactivate') {
            if (!campaignId) {
                return NextResponse.json(
                    { success: false, error: 'Campaign ID is required' },
                    { status: 400 }
                );
            }

            await stripeIntegrationService.deactivatePromotion(campaignId);

            return NextResponse.json({
                success: true,
                message: 'Promotion deactivated successfully',
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Error in promotions POST API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Export with admin authentication middleware
export const GET = withAdminAuth(handleGetPromotions, { requireSuperAdmin: true });
export const POST = withAdminAuth(handlePostPromotions, { requireSuperAdmin: true });