/**
 * Admin Promotions API Route
 * 
 * Manages seasonal promotions and coupon campaigns for real estate agents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promotionService } from '@/services/admin/promotion-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // Validate action parameter
        const validActions = ['active', 'seasonal-suggestions', 'analytics'] as const;
        if (!action || !validActions.includes(action as any)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid action parameter',
                    validActions
                },
                { status: 400 }
            );
        }

        let result;
        switch (action) {
            case 'active':
                result = await promotionService.getActivePromotions();
                return NextResponse.json({
                    success: true,
                    data: { promotions: result }
                });

            case 'seasonal-suggestions':
                result = promotionService.getSeasonalSuggestions();
                return NextResponse.json({
                    success: true,
                    data: { suggestions: result }
                });

            case 'analytics':
                result = await promotionService.getMarketSegmentAnalytics();
                return NextResponse.json({
                    success: true,
                    data: { analytics: result }
                });
        }
    } catch (error) {
        console.error('Error in promotions GET:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to retrieve promotions data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action, ...data } = await request.json();
        const adminId = 'admin-user'; // In real app, get from auth context

        switch (action) {
            case 'create-campaign':
                const campaign = await promotionService.createPromotionCampaign(data, adminId);
                return NextResponse.json({ campaign });

            case 'create-seasonal':
                const { seasonType, customDiscount } = data;
                const seasonalCampaign = await promotionService.createSeasonalPromotion(
                    seasonType,
                    customDiscount,
                    adminId
                );
                return NextResponse.json({ campaign: seasonalCampaign });

            case 'deactivate':
                const { campaignId } = data;
                await promotionService.deactivatePromotion(campaignId, adminId);
                return NextResponse.json({ success: true });

            case 'analytics':
                const { campaignId: analyticsId } = data;
                const campaignAnalytics = await promotionService.getPromotionAnalytics(analyticsId);
                return NextResponse.json({ analytics: campaignAnalytics });

            default:
                return NextResponse.json(
                    { error: 'Invalid action parameter' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in promotions POST:', error);
        return NextResponse.json(
            { error: 'Failed to process promotion request' },
            { status: 500 }
        );
    }
}