'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/aws/auth';

export interface FeatureLimits {
    aiContentGeneration: {
        used: number;
        limit: number;
        unlimited: boolean;
    };
    imageEnhancements: {
        used: number;
        limit: number;
        unlimited: boolean;
    };
    researchReports: {
        used: number;
        limit: number;
        unlimited: boolean;
    };
    marketingPlans: {
        used: number;
        limit: number;
        unlimited: boolean;
    };
    brandMonitoring: {
        level: 'basic' | 'advanced';
    };
    competitorTracking: {
        enabled: boolean;
    };
    prioritySupport: {
        enabled: boolean;
    };
    whiteLabelOptions: {
        enabled: boolean;
    };
}

export interface SubscriptionInfo {
    isActive: boolean;
    plan: 'free' | 'starter' | 'professional' | 'omnia';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
    trialEndsAt: Date | null;
    isInTrial: boolean;
    trialDaysRemaining: number;
}

// Default limits for free tier
const FREE_TIER_LIMITS: FeatureLimits = {
    aiContentGeneration: {
        used: 0,
        limit: 10,
        unlimited: false,
    },
    imageEnhancements: {
        used: 0,
        limit: 5,
        unlimited: false,
    },
    researchReports: {
        used: 0,
        limit: 3,
        unlimited: false,
    },
    marketingPlans: {
        used: 0,
        limit: 1,
        unlimited: false,
    },
    brandMonitoring: {
        level: 'basic',
    },
    competitorTracking: {
        enabled: false,
    },
    prioritySupport: {
        enabled: false,
    },
    whiteLabelOptions: {
        enabled: false,
    },
};

export function useFeatureGates() {
    const { user } = useUser();
    const [subscription, setSubscription] = useState<SubscriptionInfo>({
        isActive: false,
        plan: 'free',
        status: null,
        trialEndsAt: null,
        isInTrial: false,
        trialDaysRemaining: 0,
    });
    const [limits, setLimits] = useState<FeatureLimits>(FREE_TIER_LIMITS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSubscriptionInfo() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Get subscription status from API
                const subscriptionResponse = await fetch(`/api/subscription/status?userId=${user.id}`);
                const subscriptionData = await subscriptionResponse.json();

                if (!subscriptionData.success) {
                    throw new Error('Failed to load subscription status');
                }

                const subscriptionStatus = subscriptionData.subscription;

                // Get usage data from API
                const usageResponse = await fetch(`/api/subscription/usage?userId=${user.id}`);
                const usageData = await usageResponse.json();

                if (!usageData.success) {
                    throw new Error('Failed to load usage data');
                }

                const usage = usageData.usage;

                // Set limits based on subscription status
                const getLimitsForPlan = (plan: string, isInTrial: boolean) => {
                    if (isInTrial || plan === 'professional' || plan === 'omnia') {
                        return {
                            aiContentGeneration: {
                                used: usage.aiContentGeneration,
                                limit: plan === 'starter' ? 50 : 100,
                                unlimited: plan === 'professional' || plan === 'omnia',
                            },
                            imageEnhancements: {
                                used: usage.imageEnhancements,
                                limit: plan === 'starter' ? 25 : 50,
                                unlimited: plan === 'professional' || plan === 'omnia',
                            },
                            researchReports: {
                                used: usage.researchReports,
                                limit: plan === 'starter' ? 15 : 20,
                                unlimited: plan === 'professional' || plan === 'omnia',
                            },
                            marketingPlans: {
                                used: usage.marketingPlans,
                                limit: plan === 'starter' ? 5 : 10,
                                unlimited: plan === 'professional' || plan === 'omnia',
                            },
                            brandMonitoring: {
                                level: (plan === 'professional' || plan === 'omnia' || isInTrial) ? 'advanced' as const : 'basic' as const,
                            },
                            competitorTracking: {
                                enabled: plan === 'professional' || plan === 'omnia' || isInTrial,
                            },
                            prioritySupport: {
                                enabled: plan === 'professional' || plan === 'omnia' || isInTrial,
                            },
                            whiteLabelOptions: {
                                enabled: plan === 'omnia',
                            },
                        };
                    } else if (plan === 'starter') {
                        return {
                            aiContentGeneration: {
                                used: usage.aiContentGeneration,
                                limit: 50,
                                unlimited: false,
                            },
                            imageEnhancements: {
                                used: usage.imageEnhancements,
                                limit: 25,
                                unlimited: false,
                            },
                            researchReports: {
                                used: usage.researchReports,
                                limit: 15,
                                unlimited: false,
                            },
                            marketingPlans: {
                                used: usage.marketingPlans,
                                limit: 5,
                                unlimited: false,
                            },
                            brandMonitoring: {
                                level: 'basic' as const,
                            },
                            competitorTracking: {
                                enabled: false,
                            },
                            prioritySupport: {
                                enabled: false,
                            },
                            whiteLabelOptions: {
                                enabled: false,
                            },
                        };
                    } else {
                        // Free tier
                        return {
                            ...FREE_TIER_LIMITS,
                            aiContentGeneration: {
                                ...FREE_TIER_LIMITS.aiContentGeneration,
                                used: usage.aiContentGeneration,
                            },
                            imageEnhancements: {
                                ...FREE_TIER_LIMITS.imageEnhancements,
                                used: usage.imageEnhancements,
                            },
                            researchReports: {
                                ...FREE_TIER_LIMITS.researchReports,
                                used: usage.researchReports,
                            },
                            marketingPlans: {
                                ...FREE_TIER_LIMITS.marketingPlans,
                                used: usage.marketingPlans,
                            },
                        };
                    }
                };

                setLimits(getLimitsForPlan(subscriptionStatus.plan, subscriptionStatus.isInTrial));
                setSubscription(subscriptionStatus);
            } catch (error) {
                console.error('Failed to load subscription info:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadSubscriptionInfo();
    }, [user]);

    const canUseFeature = (feature: keyof FeatureLimits): boolean => {
        // Trial users get professional-level access
        if (subscription.isInTrial || (subscription.isActive && subscription.plan && subscription.plan in ['starter', 'professional', 'omnia'])) {
            return true; // Premium/trial users can use all features
        }

        const limit = limits[feature];
        
        if ('used' in limit && 'limit' in limit) {
            return limit.used < limit.limit;
        }
        
        if ('enabled' in limit) {
            return limit.enabled;
        }
        
        if ('level' in limit) {
            return limit.level === 'advanced';
        }

        return false;
    };

    const getUsagePercentage = (feature: keyof FeatureLimits): number => {
        const limit = limits[feature];
        
        if ('used' in limit && 'limit' in limit) {
            return (limit.used / limit.limit) * 100;
        }
        
        return 0;
    };

    const getRemainingUsage = (feature: keyof FeatureLimits): number => {
        const limit = limits[feature];
        
        if ('used' in limit && 'limit' in limit) {
            return Math.max(0, limit.limit - limit.used);
        }
        
        return 0;
    };

    const incrementUsage = async (feature: keyof FeatureLimits): Promise<boolean> => {
        if (!canUseFeature(feature) || !user) {
            return false;
        }

        try {
            const response = await fetch('/api/subscription/usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    feature,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update local state with new usage
                const limit = limits[feature];
                if ('used' in limit && 'limit' in limit) {
                    setLimits(prev => ({
                        ...prev,
                        [feature]: {
                            ...prev[feature],
                            used: data.usage[feature],
                        },
                    }));
                }
                return true;
            } else {
                console.error('Failed to increment usage:', data.error);
                return false;
            }
        } catch (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }
    };

    const getUpgradeMessage = (feature: keyof FeatureLimits): string => {
        switch (feature) {
            case 'aiContentGeneration':
                return 'Upgrade to generate unlimited AI content';
            case 'imageEnhancements':
                return 'Upgrade to enhance unlimited images';
            case 'researchReports':
                return 'Upgrade to create unlimited research reports';
            case 'marketingPlans':
                return 'Upgrade to create unlimited marketing plans';
            case 'competitorTracking':
                return 'Upgrade to Professional or Omnia to track competitors';
            case 'prioritySupport':
                return 'Upgrade to Professional or Omnia for priority support';
            case 'whiteLabelOptions':
                return 'Upgrade to Omnia for white-label options';
            default:
                return 'Upgrade to unlock this premium feature';
        }
    };

    return {
        subscription,
        limits,
        isLoading,
        canUseFeature,
        getUsagePercentage,
        getRemainingUsage,
        incrementUsage,
        getUpgradeMessage,
    };
}