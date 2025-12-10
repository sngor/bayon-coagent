/**
 * Stripe Integration Service
 * 
 * Enhanced Stripe integration using Kiro Powers for billing management
 */

import { kiroPowers } from '@/lib/kiro-powers';

export interface StripeCustomer {
    id: string;
    email: string;
    name?: string;
    created: number;
    subscriptions?: StripeSubscription[];
}

export interface StripeSubscription {
    id: string;
    customer: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    current_period_start: number;
    current_period_end: number;
    items: {
        data: Array<{
            price: {
                id: string;
                unit_amount: number;
                currency: string;
                recurring?: {
                    interval: string;
                };
            };
        }>;
    };
}

export interface StripePaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    customer?: string;
    created: number;
}

export interface BillingSearchCriteria {
    searchType: 'customers' | 'subscriptions' | 'payments';
    criteria: {
        email?: string;
        domain?: string;
        name?: string;
        status?: string;
        customerId?: string;
        amountGreaterThan?: number;
        amountLessThan?: number;
        currency?: string;
    };
}

export interface PromotionCampaign {
    id: string;
    name: string;
    description: string;
    couponId: string;
    startDate: string;
    endDate: string;
    targetAudience: string;
    marketSeason: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    isActive: boolean;
}

class StripeIntegrationService {
    /**
     * Search Stripe data using enhanced search capabilities
     */
    async searchBilling(criteria: BillingSearchCriteria): Promise<{
        results: any[];
        total: number;
    }> {
        try {
            // Use Kiro Powers Stripe integration for advanced search
            const result = await kiroPowers.use('stripe', 'stripe', 'search', {
                searchType: criteria.searchType,
                ...criteria.criteria,
            });

            return {
                results: result.data || [],
                total: result.total || 0,
            };
        } catch (error) {
            console.error('Error searching billing data:', error);
            throw new Error('Failed to search billing data');
        }
    }

    /**
     * Get comprehensive billing dashboard metrics
     */
    async getDashboardMetrics(): Promise<{
        totalRevenue: number;
        monthlyRecurringRevenue: number;
        activeSubscriptions: number;
        trialSubscriptions: number;
        canceledSubscriptions: number;
        pastDueSubscriptions: number;
        paymentFailures: number;
        churnRate: number;
        averageRevenuePerUser: number;
        lifetimeValue: number;
    }> {
        try {
            // Get all subscriptions with enhanced filtering
            const subscriptionsResult = await kiroPowers.use('stripe', 'stripe', 'listSubscriptions', {
                limit: 100,
                expand: ['data.customer'],
            });

            const subscriptions = subscriptionsResult.data || [];

            // Get payment intents for revenue calculation
            const paymentsResult = await kiroPowers.use('stripe', 'stripe', 'listPaymentIntents', {
                limit: 100,
            });

            const payments = paymentsResult.data || [];

            // Calculate metrics
            let totalRevenue = 0;
            let monthlyRecurringRevenue = 0;
            let activeSubscriptions = 0;
            let trialSubscriptions = 0;
            let canceledSubscriptions = 0;
            let pastDueSubscriptions = 0;
            let paymentFailures = 0;

            // Process subscriptions
            for (const sub of subscriptions) {
                const amount = sub.items?.data[0]?.price?.unit_amount || 0;
                const amountInDollars = amount / 100;

                switch (sub.status) {
                    case 'active':
                        activeSubscriptions++;
                        monthlyRecurringRevenue += amountInDollars;
                        break;
                    case 'trialing':
                        trialSubscriptions++;
                        break;
                    case 'canceled':
                        canceledSubscriptions++;
                        break;
                    case 'past_due':
                        pastDueSubscriptions++;
                        break;
                }
            }

            // Process payments for total revenue and failures
            for (const payment of payments) {
                if (payment.status === 'succeeded') {
                    totalRevenue += (payment.amount || 0) / 100;
                } else if (payment.status === 'requires_payment_method') {
                    paymentFailures++;
                }
            }

            // Calculate derived metrics
            const totalCustomers = activeSubscriptions + canceledSubscriptions;
            const churnRate = totalCustomers > 0 ? (canceledSubscriptions / totalCustomers) * 100 : 0;
            const averageRevenuePerUser = activeSubscriptions > 0 ? monthlyRecurringRevenue / activeSubscriptions : 0;
            const lifetimeValue = churnRate > 0 ? averageRevenuePerUser / (churnRate / 100) : averageRevenuePerUser * 12;

            return {
                totalRevenue,
                monthlyRecurringRevenue,
                activeSubscriptions,
                trialSubscriptions,
                canceledSubscriptions,
                pastDueSubscriptions,
                paymentFailures,
                churnRate,
                averageRevenuePerUser,
                lifetimeValue,
            };
        } catch (error) {
            console.error('Error getting dashboard metrics:', error);
            throw new Error('Failed to get billing metrics');
        }
    }

    /**
     * Create seasonal promotion campaign
     */
    async createSeasonalPromotion(seasonType: string, customDiscount?: number): Promise<PromotionCampaign> {
        try {
            // Define seasonal promotion templates
            const seasonalTemplates = {
                spring_buying: {
                    name: 'Spring Home Buying Season',
                    description: 'Special pricing for agents during peak spring market',
                    discount: customDiscount || 25,
                    targetAudience: 'new_agents',
                    marketingMessage: 'Spring into success with 25% off your first 3 months!',
                },
                summer_peak: {
                    name: 'Summer Market Peak',
                    description: 'Maximize your summer listings with premium tools',
                    discount: customDiscount || 20,
                    targetAudience: 'active_agents',
                    marketingMessage: 'Beat the summer heat with 20% off premium features!',
                },
                fall_market: {
                    name: 'Fall Market Opportunity',
                    description: 'Capture fall buyers with enhanced marketing tools',
                    discount: customDiscount || 30,
                    targetAudience: 'experienced_agents',
                    marketingMessage: 'Fall into savings with 30% off annual plans!',
                },
                winter_planning: {
                    name: 'Winter Planning Special',
                    description: 'Plan for next year with discounted annual subscriptions',
                    discount: customDiscount || 35,
                    targetAudience: 'all_agents',
                    marketingMessage: 'Winter planning special: 35% off annual subscriptions!',
                },
            };

            const template = seasonalTemplates[seasonType as keyof typeof seasonalTemplates];
            if (!template) {
                throw new Error('Invalid season type');
            }

            // Create Stripe coupon
            const coupon = await kiroPowers.use('stripe', 'stripe', 'createCoupon', {
                percent_off: template.discount,
                duration: 'repeating',
                duration_in_months: 3,
                name: template.name,
                metadata: {
                    season: seasonType,
                    target_audience: template.targetAudience,
                },
            });

            // Create campaign record
            const campaign: PromotionCampaign = {
                id: `campaign_${Date.now()}`,
                name: template.name,
                description: template.description,
                couponId: coupon.id,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
                targetAudience: template.targetAudience,
                marketSeason: seasonType,
                discountType: 'percentage',
                discountValue: template.discount,
                maxRedemptions: 1000,
                currentRedemptions: 0,
                isActive: true,
            };

            return campaign;
        } catch (error) {
            console.error('Error creating seasonal promotion:', error);
            throw new Error('Failed to create seasonal promotion');
        }
    }

    /**
     * Get seasonal promotion suggestions based on current date
     */
    getSeasonalSuggestions(): Array<{
        season: string;
        title: string;
        description: string;
        suggestedDiscount: number;
        targetMonths: number[];
        marketingMessage: string;
    }> {
        const currentMonth = new Date().getMonth() + 1; // 1-12

        const suggestions = [
            {
                season: 'spring_buying',
                title: 'Spring Home Buying Season',
                description: 'Target agents preparing for the busy spring market with special pricing',
                suggestedDiscount: 25,
                targetMonths: [3, 4, 5],
                marketingMessage: 'Spring into success with our seasonal agent discount!',
            },
            {
                season: 'summer_peak',
                title: 'Summer Market Peak',
                description: 'Help agents maximize their summer listings with premium tools',
                suggestedDiscount: 20,
                targetMonths: [6, 7, 8],
                marketingMessage: 'Beat the summer heat with discounted premium features!',
            },
            {
                season: 'fall_market',
                title: 'Fall Market Opportunity',
                description: 'Capture fall buyers with enhanced marketing and lead generation',
                suggestedDiscount: 30,
                targetMonths: [9, 10, 11],
                marketingMessage: 'Fall into savings with our autumn promotion!',
            },
            {
                season: 'winter_planning',
                title: 'Winter Planning Special',
                description: 'End-of-year planning with discounted annual subscriptions',
                suggestedDiscount: 35,
                targetMonths: [12, 1, 2],
                marketingMessage: 'Plan ahead and save with our winter special!',
            },
            {
                season: 'new_year',
                title: 'New Year, New Goals',
                description: 'Help agents start the year strong with goal-setting tools',
                suggestedDiscount: 40,
                targetMonths: [1],
                marketingMessage: 'New year, new success! Start with 40% off!',
            },
            {
                season: 'year_end',
                title: 'Year-End Success Push',
                description: 'Final quarter push to help agents close out the year strong',
                suggestedDiscount: 25,
                targetMonths: [11, 12],
                marketingMessage: 'Finish the year strong with our year-end promotion!',
            },
        ];

        // Filter suggestions relevant to current time of year
        return suggestions.filter(suggestion =>
            suggestion.targetMonths.includes(currentMonth) ||
            suggestion.targetMonths.includes((currentMonth % 12) + 1) // Next month
        );
    }

    /**
     * Deactivate a promotion campaign
     */
    async deactivatePromotion(campaignId: string): Promise<void> {
        try {
            // In a real implementation, this would:
            // 1. Update the campaign status in the database
            // 2. Optionally deactivate the Stripe coupon
            // 3. Send notifications to relevant stakeholders

            console.log(`Deactivating promotion campaign: ${campaignId}`);

            // For now, we'll just log the action
            // In production, implement proper campaign management
        } catch (error) {
            console.error('Error deactivating promotion:', error);
            throw new Error('Failed to deactivate promotion');
        }
    }
}

export const stripeIntegrationService = new StripeIntegrationService();