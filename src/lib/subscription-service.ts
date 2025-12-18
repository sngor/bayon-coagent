/**
 * Subscription Service
 * 
 * Centralized service for handling subscription logic and business rules.
 */

import { getRepository } from '@/aws/dynamodb/repository';

export interface SubscriptionLimits {
    aiContentGeneration: number;
    imageEnhancements: number;
    researchReports: number;
    marketingPlans: number;
}

export const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
    free: {
        aiContentGeneration: 10,
        imageEnhancements: 5,
        researchReports: 3,
        marketingPlans: 1,
    },
    starter: {
        aiContentGeneration: 50,
        imageEnhancements: 25,
        researchReports: 15,
        marketingPlans: 5,
    },
    professional: {
        aiContentGeneration: -1, // Unlimited
        imageEnhancements: -1,   // Unlimited
        researchReports: -1,     // Unlimited
        marketingPlans: -1,      // Unlimited
    },
    omnia: {
        aiContentGeneration: -1, // Unlimited
        imageEnhancements: -1,   // Unlimited
        researchReports: -1,     // Unlimited
        marketingPlans: -1,      // Unlimited
    },
};

export class SubscriptionService {
    private repository = getRepository();

    /**
     * Get user's subscription status including trial information
     */
    async getSubscriptionStatus(userId: string) {
        // Get subscription data
        const subscriptionData = await this.repository.getItem<any>(
            `USER#${userId}`,
            'SUBSCRIPTION'
        );

        // Get user profile for trial calculation
        const profileData = await this.repository.getItem<any>(
            `USER#${userId}`,
            'PROFILE'
        );

        const now = new Date();

        if (subscriptionData?.Data) {
            // User has subscription data
            const sub = subscriptionData.Data;
            return {
                isActive: sub.status === 'active' || sub.status === 'trialing',
                plan: sub.plan || 'free',
                status: sub.status,
                trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null,
                isInTrial: sub.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt) > now,
                trialDaysRemaining: sub.trialEndsAt ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0,
                currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
                customerId: sub.customerId || null,
                subscriptionId: sub.subscriptionId || null,
            };
        } else if (profileData?.Data?.createdAt) {
            // New user - check if still in trial period
            const userCreatedAt = new Date(profileData.Data.createdAt);
            const trialEndsAt = new Date(userCreatedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
            const isInTrial = now < trialEndsAt;
            const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

            if (isInTrial) {
                // Save trial status to database
                await this.repository.put({
                    PK: `USER#${userId}`,
                    SK: 'SUBSCRIPTION',
                    EntityType: 'UserPreferences',
                    Data: {
                        plan: 'professional',
                        status: 'trialing',
                        trialEndsAt: trialEndsAt.toISOString(),
                    },
                    CreatedAt: now.getTime(),
                    UpdatedAt: now.getTime(),
                });

                return {
                    isActive: true,
                    plan: 'professional',
                    status: 'trialing',
                    trialEndsAt,
                    isInTrial: true,
                    trialDaysRemaining,
                    currentPeriodEnd: trialEndsAt,
                    cancelAtPeriodEnd: false,
                    customerId: null,
                    subscriptionId: null,
                };
            }
        }

        // Default to free tier
        return {
            isActive: false,
            plan: 'free',
            status: null,
            trialEndsAt: null,
            isInTrial: false,
            trialDaysRemaining: 0,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            customerId: null,
            subscriptionId: null,
        };
    }

    /**
     * Get user's current usage for the month
     */
    async getUsage(userId: string) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        const usageData = await this.repository.getItem<any>(
            `USER#${userId}`,
            `USAGE#${currentMonth}`
        );

        return {
            aiContentGeneration: usageData?.Data?.aiContentGeneration || 0,
            imageEnhancements: usageData?.Data?.imageEnhancements || 0,
            researchReports: usageData?.Data?.researchReports || 0,
            marketingPlans: usageData?.Data?.marketingPlans || 0,
        };
    }

    /**
     * Check if user can use a specific feature
     */
    async canUseFeature(userId: string, feature: keyof SubscriptionLimits): Promise<boolean> {
        const [subscription, usage] = await Promise.all([
            this.getSubscriptionStatus(userId),
            this.getUsage(userId)
        ]);

        // Trial users and premium users get unlimited access
        if (subscription.isInTrial || subscription.plan === 'professional' || subscription.plan === 'omnia') {
            return true;
        }

        // Check limits for free/starter users
        const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free;
        const limit = limits[feature];
        
        // -1 means unlimited
        if (limit === -1) {
            return true;
        }

        return usage[feature] < limit;
    }

    /**
     * Increment usage for a feature
     */
    async incrementUsage(userId: string, feature: keyof SubscriptionLimits): Promise<boolean> {
        // Check if user can use the feature first
        const canUse = await this.canUseFeature(userId, feature);
        if (!canUse) {
            return false;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const now = new Date();

        // Get current usage
        const usageData = await this.repository.getItem<any>(
            `USER#${userId}`,
            `USAGE#${currentMonth}`
        );

        const currentUsage = usageData?.Data || {
            aiContentGeneration: 0,
            imageEnhancements: 0,
            researchReports: 0,
            marketingPlans: 0,
        };

        // Increment the specific feature usage
        const updatedUsage = {
            ...currentUsage,
            [feature]: (currentUsage[feature] || 0) + 1,
            month: currentMonth,
            updatedAt: now.toISOString(),
        };

        // If this is the first usage record for this month, add createdAt
        if (!usageData?.Data) {
            updatedUsage.createdAt = now.toISOString();
        }

        // Save updated usage
        await this.repository.put({
            PK: `USER#${userId}`,
            SK: `USAGE#${currentMonth}`,
            EntityType: 'Analytics',
            Data: updatedUsage,
            CreatedAt: usageData?.CreatedAt || now.getTime(),
            UpdatedAt: now.getTime(),
        });

        return true;
    }

    /**
     * Update subscription from Stripe data
     */
    async updateSubscriptionFromStripe(userId: string, stripeSubscription: any) {
        const now = new Date();

        // Get existing subscription data
        const existingData = await this.repository.getItem<any>(
            `USER#${userId}`,
            'SUBSCRIPTION'
        );

        await this.repository.put({
            PK: `USER#${userId}`,
            SK: 'SUBSCRIPTION',
            EntityType: 'UserPreferences',
            Data: {
                ...(existingData?.Data || {}),
                subscriptionId: stripeSubscription.id,
                customerId: stripeSubscription.customer,
                status: stripeSubscription.status,
                plan: stripeSubscription.metadata.plan || 'professional',
                priceId: stripeSubscription.items.data[0]?.price.id,
                currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
                trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
            },
            CreatedAt: existingData?.CreatedAt || now.getTime(),
            UpdatedAt: now.getTime(),
        });
    }

    /**
     * Handle trial expiration
     */
    async handleTrialExpiration(userId: string) {
        const now = new Date();

        // Get existing subscription data
        const existingData = await this.repository.getItem<any>(
            `USER#${userId}`,
            'SUBSCRIPTION'
        );

        if (existingData?.Data) {
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: 'SUBSCRIPTION',
                EntityType: 'UserPreferences',
                Data: {
                    ...existingData.Data,
                    status: 'expired',
                    plan: 'free',
                    trialExpiredAt: now.toISOString(),
                },
                CreatedAt: existingData.CreatedAt,
                UpdatedAt: now.getTime(),
            });
        }
    }

    /**
     * Get usage statistics for analytics
     */
    async getUsageStats(userId: string, months: number = 3) {
        const stats = [];
        const now = new Date();

        for (let i = 0; i < months; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.toISOString().slice(0, 7);

            const usageData = await this.repository.getItem<any>(
                `USER#${userId}`,
                `USAGE#${month}`
            );

            stats.push({
                month,
                usage: usageData?.Data || {
                    aiContentGeneration: 0,
                    imageEnhancements: 0,
                    researchReports: 0,
                    marketingPlans: 0,
                },
            });
        }

        return stats.reverse(); // Return in chronological order
    }
}

export const subscriptionService = new SubscriptionService();