'use client';

import { useMemo, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { ContentSection, DataGrid } from '@/components/ui';
import { SUBSCRIPTION_CONSTANTS } from '@/lib/constants/subscription-constants';

interface UsageLimit {
    feature: string;
    used: number;
    limit: number;
    unlimited: boolean;
}

interface SubscriptionStatus {
    isInTrial: boolean;
    trialDaysRemaining: number;
}

interface UsageLimitsSectionProps {
    subscriptionStatus: SubscriptionStatus;
}

// Type for usage data keys to ensure consistency
type UsageDataKey = keyof typeof SUBSCRIPTION_CONSTANTS.TRIAL_USAGE_LIMITS;

// Stable usage data generation with seed for consistency
const generateUsageData = (isInTrial: boolean): UsageLimit[] => {
    if (isInTrial) {
        // Trial users get professional-level limits with consistent "random" values
        return [
            {
                feature: 'AI Content Generation',
                used: 12, // Consistent value instead of random
                limit: 100,
                unlimited: false
            },
            {
                feature: 'Image Enhancements',
                used: 5,
                limit: 50,
                unlimited: false
            },
            {
                feature: 'Research Reports',
                used: 3,
                limit: 20,
                unlimited: false
            },
            {
                feature: 'Marketing Plans',
                used: 2,
                limit: 10,
                unlimited: false
            },
            {
                feature: 'AI Role-Play Sessions',
                used: 6,
                limit: 25,
                unlimited: false
            },
            {
                feature: 'AI Learning Plans',
                used: 1,
                limit: 5,
                unlimited: false
            }
        ];
    } else {
        // Free tier limits
        return [
            {
                feature: 'AI Content Generation',
                used: 8,
                limit: 10,
                unlimited: false
            },
            {
                feature: 'Image Enhancements',
                used: 2,
                limit: 5,
                unlimited: false
            },
            {
                feature: 'Research Reports',
                used: 1,
                limit: 3,
                unlimited: false
            },
            {
                feature: 'Marketing Plans',
                used: 0,
                limit: 1,
                unlimited: false
            },
            {
                feature: 'AI Role-Play Sessions',
                used: 2,
                limit: 3,
                unlimited: false
            },
            {
                feature: 'AI Learning Plans',
                used: 1,
                limit: 1,
                unlimited: false
            }
        ];
    }
};

// Memoized progress bar component for better performance
const UsageProgressBar = memo<{
    used: number;
    limit: number;
    feature: string;
}>(({ used, limit, feature }) => {
    const percentage = (used / limit) * 100;
    const isNearLimit = percentage >= SUBSCRIPTION_CONSTANTS.USAGE_THRESHOLDS.NEAR_LIMIT;
    const isAtLimit = percentage >= SUBSCRIPTION_CONSTANTS.USAGE_THRESHOLDS.AT_LIMIT;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{feature}</span>
                    {isAtLimit && (
                        <Badge variant="destructive" className="text-xs">
                            Limit Reached
                        </Badge>
                    )}
                    {isNearLimit && !isAtLimit && (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                            Near Limit
                        </Badge>
                    )}
                </div>
                <span className="text-sm text-muted-foreground">
                    {used} / {limit}
                </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ 
                        '--progress-width': `${Math.min(percentage, 100)}%`,
                        width: 'var(--progress-width)'
                    } as React.CSSProperties}
                    role="progressbar"
                    aria-valuenow={used}
                    aria-valuemin={0}
                    aria-valuemax={limit}
                    aria-label={`${feature} usage: ${used} of ${limit} used`}
                />
            </div>
        </div>
    );
});

UsageProgressBar.displayName = 'UsageProgressBar';

export function UsageLimitsSection({ subscriptionStatus }: UsageLimitsSectionProps) {
    // Memoize usage data to prevent recalculation on every render
    const usageLimits = useMemo(
        () => generateUsageData(subscriptionStatus.isInTrial),
        [subscriptionStatus.isInTrial]
    );

    return (
        <ContentSection 
            title={subscriptionStatus.isInTrial ? "Trial Usage" : "Usage Limits"} 
            description={subscriptionStatus.isInTrial 
                ? `Your trial usage - ${subscriptionStatus.trialDaysRemaining} days remaining`
                : "Your current usage against free tier limits"
            } 
            icon={subscriptionStatus.isInTrial ? CheckCircle2 : AlertTriangle} 
            variant="card"
        >
            <DataGrid columns={1}>
                {usageLimits.map((limit, index) => (
                    <UsageProgressBar
                        key={`${limit.feature}-${index}`}
                        used={limit.used}
                        limit={limit.limit}
                        feature={limit.feature}
                    />
                ))}
            </DataGrid>
            
            <div className={`mt-6 p-4 rounded-lg ${
                subscriptionStatus.isInTrial 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
            }`}>
                <div className="flex items-start gap-3">
                    {subscriptionStatus.isInTrial ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                        <p className={`text-sm font-medium ${
                            subscriptionStatus.isInTrial 
                                ? 'text-blue-900 dark:text-blue-100'
                                : 'text-amber-900 dark:text-amber-100'
                        }`}>
                            {subscriptionStatus.isInTrial 
                                ? `Enjoying your trial? ${subscriptionStatus.trialDaysRemaining} days left`
                                : 'Upgrade to unlock unlimited usage'
                            }
                        </p>
                        <p className={`text-xs mt-1 ${
                            subscriptionStatus.isInTrial 
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-amber-700 dark:text-amber-300'
                        }`}>
                            {subscriptionStatus.isInTrial 
                                ? 'Continue with a paid plan to keep these professional features and Learning hub access after your trial ends.'
                                : 'Premium plans include unlimited AI content generation, image enhancements, research reports, and full Learning hub access with AI role-play sessions.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </ContentSection>
    );
}