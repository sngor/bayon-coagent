/**
 * Promotion Service
 * 
 * Manages seasonal promotions and coupon campaigns for real estate agents.
 * Includes market-specific promotions like spring buying season, holiday specials, etc.
 */

import Stripe from 'stripe';
import { getRepository } from '@/aws/dynamodb/repository';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';

// Initialize Stripe client
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
    apiVersion: '2024-11-20.acacia',
});

export interface PromotionCampaign {
    id: string;
    name: string;
    description: string;
    couponId: string;
    startDate: string;
    endDate: string;
    targetAudience: 'new_agents' | 'existing_agents' | 'all';
    marketSeason: 'spring_buying' | 'summer_peak' | 'fall_market' | 'winter_planning' | 'year_end' | 'new_year';
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
}

export interface SeasonalPromotion {
    season: string;
    title: string;
    description: string;
    suggestedDiscount: number;
    targetMonths: number[];
    marketingMessage: string;
}

export class PromotionService {
    /**
     * Predefined seasonal promotions for real estate market cycles
     */
    private readonly seasonalPromotions: SeasonalPromotion[] = [
        {
            season: 'spring_buying',
            title: 'Spring Buying Season Boost',
            description: 'Capitalize on the peak home buying season with enhanced marketing tools',
            suggestedDiscount: 25,
            targetMonths: [3, 4, 5], // March, April, May
            marketingMessage: 'Get ready for spring buyers with 25% off your first 3 months!'
        },
        {
            season: 'summer_peak',
            title: 'Summer Market Momentum',
            description: 'Maintain momentum during the busy summer market',
            suggestedDiscount: 15,
            targetMonths: [6, 7, 8], // June, July, August
            marketingMessage: 'Keep your summer sales hot with 15% off premium features!'
        },
        {
            season: 'fall_market',
            title: 'Fall Market Preparation',
            description: 'Prepare for the fall market with strategic content and competitor analysis',
            suggestedDiscount: 20,
            targetMonths: [9, 10, 11], // September, October, November
            marketingMessage: 'Fall into success with 20% off your marketing strategy tools!'
        },
        {
            season: 'winter_planning',
            title: 'Winter Planning Special',
            description: 'Use the slower winter months to build your brand and plan for next year',
            suggestedDiscount: 30,
            targetMonths: [12, 1, 2], // December, January, February
            marketingMessage: 'Plan your 2025 success with 30% off during the planning season!'
        },
        {
            season: 'new_year',
            title: 'New Year New Goals',
            description: 'Start the year strong with comprehensive real estate marketing tools',
            suggestedDiscount: 35,
            targetMonths: [1], // January
            marketingMessage: 'New Year, New Listings! Start strong with 35% off your first month!'
        },
        {
            season: 'year_end',
            title: 'Year-End Tax Advantage',
            description: 'Business expense deduction opportunity before year-end',
            suggestedDiscount: 20,
            targetMonths: [11, 12], // November, December
            marketingMessage: 'Maximize your business deductions with 20% off before year-end!'
        }
    ];

    /**
     * Get seasonal promotion suggestions based on current date
     */
    getSeasonalSuggestions(): SeasonalPromotion[] {
        const currentMonth = new Date().getMonth() + 1; // 1-based month

        return this.seasonalPromotions.filter(promo =>
            promo.targetMonths.includes(currentMonth)
        );
    }

    /**
     * Create a new promotional campaign
     */
    async createPromotionCampaign(
        campaign: Omit<PromotionCampaign, 'id' | 'couponId' | 'currentRedemptions' | 'createdAt'>,
        adminId: string
    ): Promise<PromotionCampaign> {
        try {
            // Create Stripe coupon
            const couponParams: Stripe.CouponCreateParams = {
                name: campaign.name,
                duration: 'once', // Can be 'once', 'repeating', or 'forever'
            };

            if (campaign.discountType === 'percentage') {
                couponParams.percent_off = campaign.discountValue;
            } else {
                couponParams.amount_off = Math.round(campaign.discountValue * 100); // Convert to cents
                couponParams.currency = 'usd';
            }

            if (campaign.maxRedemptions) {
                couponParams.max_redemptions = campaign.maxRedemptions;
            }

            // Set expiration date
            const endDate = new Date(campaign.endDate);
            couponParams.redeem_by = Math.floor(endDate.getTime() / 1000);

            const stripeCoupon = await stripe.coupons.create(couponParams);

            // Create campaign record
            const promotionCampaign: PromotionCampaign = {
                ...campaign,
                id: `PROMO_${Date.now()}`,
                couponId: stripeCoupon.id,
                currentRedemptions: 0,
                createdBy: adminId,
                createdAt: new Date().toISOString(),
            };

            // Save to DynamoDB
            const repository = getRepository();
            await repository.create({
                PK: 'PROMOTION#CAMPAIGN',
                SK: promotionCampaign.id,
                EntityType: 'PromotionCampaign',
                Data: promotionCampaign,
            });

            // Create audit log
            await repository.create({
                PK: 'AUDIT#PROMOTION',
                SK: `${Date.now()}#${promotionCampaign.id}`,
                EntityType: 'AuditLog',
                Data: {
                    action: 'campaign_created',
                    adminId,
                    campaignId: promotionCampaign.id,
                    couponId: stripeCoupon.id,
                    timestamp: Date.now(),
                },
            });

            return promotionCampaign;
        } catch (error) {
            console.error('Error creating promotion campaign:', error);
            throw new Error('Failed to create promotion campaign');
        }
    }

    /**
     * Create a quick seasonal promotion
     */
    async createSeasonalPromotion(
        seasonType: string,
        customDiscount?: number,
        adminId: string
    ): Promise<PromotionCampaign> {
        const seasonal = this.seasonalPromotions.find(p => p.season === seasonType);
        if (!seasonal) {
            throw new Error('Invalid seasonal promotion type');
        }

        const discount = customDiscount || seasonal.suggestedDiscount;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // 3-month campaign

        return await this.createPromotionCampaign({
            name: seasonal.title,
            description: seasonal.description,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            targetAudience: 'all',
            marketSeason: seasonType as any,
            discountType: 'percentage',
            discountValue: discount,
            maxRedemptions: 500, // Limit to prevent abuse
            isActive: true,
        }, adminId);
    }

    /**
     * Get all active promotion campaigns
     */
    async getActivePromotions(): Promise<PromotionCampaign[]> {
        try {
            const repository = getRepository();
            const campaigns = await repository.query('PROMOTION#CAMPAIGN');

            const now = new Date();
            return campaigns
                .map(item => item.Data as PromotionCampaign)
                .filter(campaign =>
                    campaign.isActive &&
                    new Date(campaign.startDate) <= now &&
                    new Date(campaign.endDate) >= now
                );
        } catch (error) {
            console.error('Error getting active promotions:', error);
            throw new Error('Failed to retrieve active promotions');
        }
    }

    /**
     * Get promotion campaign analytics
     */
    async getPromotionAnalytics(campaignId: string) {
        try {
            const repository = getRepository();
            const campaign = await repository.get('PROMOTION#CAMPAIGN', campaignId);

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const promotionData = campaign.Data as PromotionCampaign;

            // Get coupon usage from Stripe
            const stripeCoupon = await stripe.coupons.retrieve(promotionData.couponId);

            // Calculate analytics
            const redemptionRate = promotionData.maxRedemptions
                ? (stripeCoupon.times_redeemed || 0) / promotionData.maxRedemptions * 100
                : 0;

            const daysActive = Math.floor(
                (new Date().getTime() - new Date(promotionData.startDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            const totalDays = Math.floor(
                (new Date(promotionData.endDate).getTime() - new Date(promotionData.startDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                campaign: promotionData,
                analytics: {
                    totalRedemptions: stripeCoupon.times_redeemed || 0,
                    redemptionRate,
                    daysActive,
                    totalDays,
                    daysRemaining: Math.max(0, totalDays - daysActive),
                    averageRedemptionsPerDay: daysActive > 0 ? (stripeCoupon.times_redeemed || 0) / daysActive : 0,
                },
            };
        } catch (error) {
            console.error('Error getting promotion analytics:', error);
            throw new Error('Failed to retrieve promotion analytics');
        }
    }

    /**
     * Deactivate a promotion campaign
     */
    async deactivatePromotion(campaignId: string, adminId: string): Promise<void> {
        try {
            const repository = getRepository();
            const campaign = await repository.get('PROMOTION#CAMPAIGN', campaignId);

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const promotionData = campaign.Data as PromotionCampaign;

            // Delete Stripe coupon (this makes it invalid)
            await stripe.coupons.del(promotionData.couponId);

            // Update campaign status
            await repository.update('PROMOTION#CAMPAIGN', campaignId, {
                isActive: false,
            });

            // Create audit log
            await repository.create({
                PK: 'AUDIT#PROMOTION',
                SK: `${Date.now()}#${campaignId}`,
                EntityType: 'AuditLog',
                Data: {
                    action: 'campaign_deactivated',
                    adminId,
                    campaignId,
                    couponId: promotionData.couponId,
                    timestamp: Date.now(),
                },
            });
        } catch (error) {
            console.error('Error deactivating promotion:', error);
            throw new Error('Failed to deactivate promotion');
        }
    }

    /**
     * Get promotion usage by real estate market segments
     */
    async getMarketSegmentAnalytics() {
        try {
            const repository = getRepository();
            const campaigns = await repository.query('PROMOTION#CAMPAIGN');

            const analytics = {
                byMarketSeason: {} as Record<string, number>,
                byTargetAudience: {} as Record<string, number>,
                totalCampaigns: campaigns.length,
                activeCampaigns: 0,
            };

            for (const campaign of campaigns) {
                const data = campaign.Data as PromotionCampaign;

                // Count by market season
                analytics.byMarketSeason[data.marketSeason] =
                    (analytics.byMarketSeason[data.marketSeason] || 0) + 1;

                // Count by target audience
                analytics.byTargetAudience[data.targetAudience] =
                    (analytics.byTargetAudience[data.targetAudience] || 0) + 1;

                // Count active campaigns
                if (data.isActive) {
                    analytics.activeCampaigns++;
                }
            }

            return analytics;
        } catch (error) {
            console.error('Error getting market segment analytics:', error);
            throw new Error('Failed to retrieve market segment analytics');
        }
    }
}

// Export singleton instance
export const promotionService = new PromotionService();