'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, Crown } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';

interface SubscriptionStatus {
    isActive: boolean;
    plan: SubscriptionPlan | null;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    isInTrial: boolean;
    trialDaysRemaining: number;
}

interface SubscriptionStatusCardProps {
    subscriptionStatus: SubscriptionStatus;
    isUpdating: boolean;
    onUpgrade: () => void;
    onChangePlan: () => void;
    onCancel: () => void;
}

// Type-safe helper functions
const getPlanName = (plan: SubscriptionPlan | null): string => {
    return plan && plan in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[plan].name : 'Free Tier';
};

const getPlanPrice = (plan: SubscriptionPlan | null): string => {
    return plan && plan in SUBSCRIPTION_PLANS ? `$${SUBSCRIPTION_PLANS[plan].price}/month` : 'Limited features with usage limits';
};

const getPlanIcon = (plan: SubscriptionPlan | null) => {
    if (!plan) return <CreditCard className="h-7 w-7 text-muted-foreground" />;
    
    switch (plan) {
        case 'starter':
            return <CreditCard className="h-7 w-7" />;
        case 'professional':
            return <Crown className="h-7 w-7" />;
        case 'omnia':
            return <Crown className="h-7 w-7 text-amber-500" />;
        default:
            return <CreditCard className="h-7 w-7 text-muted-foreground" />;
    }
};

const getStatusBadge = (status: string | null) => {
    switch (status) {
        case 'active':
            return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Active</Badge>;
        case 'trialing':
            return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Trial</Badge>;
        case 'past_due':
            return <Badge variant="destructive">Past Due</Badge>;
        case 'canceled':
            return <Badge variant="secondary">Canceled</Badge>;
        case 'incomplete':
            return <Badge variant="outline">Incomplete</Badge>;
        default:
            return <Badge variant="outline">Free Tier</Badge>;
    }
};

export function SubscriptionStatusCard({
    subscriptionStatus,
    isUpdating,
    onUpgrade,
    onChangePlan,
    onCancel,
}: SubscriptionStatusCardProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-6 border rounded-xl bg-gradient-to-br from-card to-accent/5">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        {getPlanIcon(subscriptionStatus.plan)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">
                                {getPlanName(subscriptionStatus.plan)}
                            </h3>
                            {getStatusBadge(subscriptionStatus.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {subscriptionStatus.isInTrial
                                ? `Free trial - ${subscriptionStatus.trialDaysRemaining} days remaining`
                                : getPlanPrice(subscriptionStatus.plan)
                            }
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    {subscriptionStatus.currentPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {subscriptionStatus.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on{' '}
                                {subscriptionStatus.currentPeriodEnd.toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!subscriptionStatus.isActive || subscriptionStatus.isInTrial ? (
                    <Button
                        onClick={onUpgrade}
                        className="gap-2"
                        disabled={isUpdating}
                        variant={subscriptionStatus.isInTrial ? "default" : "default"}
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Crown className="h-4 w-4" />
                        )}
                        {subscriptionStatus.isInTrial ? 'Continue with Paid Plan' : 'Upgrade to Premium'}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            onClick={onChangePlan}
                            disabled={isUpdating}
                        >
                            Change Plan
                        </Button>
                        {!subscriptionStatus.cancelAtPeriodEnd && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={isUpdating}
                                className="text-destructive hover:text-destructive"
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Cancel Subscription'
                                )}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}