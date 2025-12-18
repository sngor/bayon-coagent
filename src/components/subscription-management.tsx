'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, CheckCircle2, AlertTriangle, Crown, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { StripePricing } from '@/components/stripe-pricing';
import { StripePaymentForm } from '@/components/stripe-payment-form';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';
import { ContentSection, DataGrid } from '@/components/ui';

interface SubscriptionStatus {
    isActive: boolean;
    plan: SubscriptionPlan | null;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    customerId: string | null;
    subscriptionId: string | null;
    trialEndsAt: Date | null;
    isInTrial: boolean;
    trialDaysRemaining: number;
}

interface UsageLimit {
    feature: string;
    used: number;
    limit: number;
    unlimited: boolean;
}

export function SubscriptionManagement() {
    const { user } = useUser();
    const { toast } = useToast();
    
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
        isActive: false,
        plan: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        customerId: null,
        subscriptionId: null,
        trialEndsAt: null,
        isInTrial: false,
        trialDaysRemaining: 0,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>();
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    // Mock usage data - changes based on trial status
    const getUsageLimits = (): UsageLimit[] => {
        if (subscriptionStatus.isInTrial) {
            // Trial users get professional-level limits
            return [
                {
                    feature: 'AI Content Generation',
                    used: Math.floor(Math.random() * 15) + 5, // 5-19 used
                    limit: 100,
                    unlimited: false
                },
                {
                    feature: 'Image Enhancements',
                    used: Math.floor(Math.random() * 8) + 2, // 2-9 used
                    limit: 50,
                    unlimited: false
                },
                {
                    feature: 'Research Reports',
                    used: Math.floor(Math.random() * 5) + 1, // 1-5 used
                    limit: 20,
                    unlimited: false
                },
                {
                    feature: 'Marketing Plans',
                    used: Math.floor(Math.random() * 3) + 1, // 1-3 used
                    limit: 10,
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
                }
            ];
        }
    };

    const usageLimits = getUsageLimits();

    // Load subscription status
    useEffect(() => {
        async function loadSubscriptionStatus() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Get subscription status from API
                const response = await fetch(`/api/subscription/status?userId=${user.id}`);
                const data = await response.json();

                if (data.success) {
                    setSubscriptionStatus(data.subscription);
                } else {
                    throw new Error(data.error || 'Failed to load subscription status');
                }
            } catch (error) {
                console.error('Failed to load subscription status:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load subscription status.',
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadSubscriptionStatus();
    }, [user, toast]);

    const handlePlanSelection = async (plan: SubscriptionPlan, couponId?: string) => {
        if (!user) return;

        setSelectedPlan(plan);
        setIsUpdating(true);

        try {
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    priceId: SUBSCRIPTION_PLANS[plan].priceId,
                    userId: user.id,
                    couponId,
                }),
            });

            const data = await response.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setShowPaymentForm(true);
                setShowPricing(false);
            } else {
                throw new Error('Failed to create subscription');
            }
        } catch (error) {
            console.error('Error creating subscription:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create subscription. Please try again.',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentForm(false);
        setClientSecret(null);
        toast({
            title: 'Subscription activated!',
            description: 'Your subscription has been successfully activated.',
        });
        // Reload subscription status
        window.location.reload();
    };

    const handleCancelSubscription = async () => {
        if (!subscriptionStatus.subscriptionId || !user) return;

        setIsUpdating(true);
        try {
            const response = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    reason: 'User requested cancellation',
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubscriptionStatus(prev => ({
                    ...prev,
                    cancelAtPeriodEnd: true,
                }));
                
                toast({
                    title: 'Subscription canceled',
                    description: 'Your subscription will remain active until the end of your billing period.',
                });
            } else {
                throw new Error(data.error || 'Failed to cancel subscription');
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to cancel subscription. Please try again.',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const getPlanIcon = (plan: SubscriptionPlan) => {
        switch (plan) {
            case 'starter':
                return <Zap className="h-5 w-5" />;
            case 'professional':
                return <Star className="h-5 w-5" />;
            case 'omnia':
                return <Crown className="h-5 w-5" />;
            default:
                return <CreditCard className="h-5 w-5" />;
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Show payment form
    if (showPaymentForm && clientSecret) {
        return (
            <ContentSection title="Complete Subscription" description="Enter your payment details to activate your subscription" icon={CreditCard} variant="card">
                <StripePaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => {
                        setShowPaymentForm(false);
                        setShowPricing(true);
                        setClientSecret(null);
                    }}
                />
            </ContentSection>
        );
    }

    // Show pricing selection
    if (showPricing) {
        return (
            <div className="space-y-6">
                <ContentSection title="Choose Your Plan" description="Select a subscription plan to unlock premium features" icon={CreditCard} variant="card">
                    <div className="text-center mb-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowPricing(false)}
                            className="mb-4"
                        >
                            ← Back to Subscription
                        </Button>
                    </div>
                </ContentSection>
                
                <StripePricing
                    onSelectPlan={handlePlanSelection}
                    selectedPlan={selectedPlan}
                    isLoading={isUpdating}
                    showCouponInput={true}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription Status */}
            <ContentSection title="Current Subscription" description="Your subscription status and plan details" icon={CreditCard} variant="card">
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 border rounded-xl bg-gradient-to-br from-card to-accent/5">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                                {subscriptionStatus.plan ? getPlanIcon(subscriptionStatus.plan) : <CreditCard className="h-7 w-7 text-muted-foreground" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-semibold">
                                        {subscriptionStatus.plan ? SUBSCRIPTION_PLANS[subscriptionStatus.plan].name : 'Free Tier'}
                                    </h3>
                                    {getStatusBadge(subscriptionStatus.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {subscriptionStatus.isInTrial
                                        ? `Free trial - ${subscriptionStatus.trialDaysRemaining} days remaining`
                                        : subscriptionStatus.plan && subscriptionStatus.plan in SUBSCRIPTION_PLANS
                                        ? `$${SUBSCRIPTION_PLANS[subscriptionStatus.plan as SubscriptionPlan].price}/month`
                                        : 'Limited features with usage limits'
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
                                onClick={() => setShowPricing(true)}
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
                                    onClick={() => setShowPricing(true)}
                                    disabled={isUpdating}
                                >
                                    Change Plan
                                </Button>
                                {!subscriptionStatus.cancelAtPeriodEnd && (
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelSubscription}
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
            </ContentSection>

            {/* Usage Limits for Free Tier and Trial */}
            {(!subscriptionStatus.isActive || subscriptionStatus.isInTrial) && (
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
                        {usageLimits.map((limit: any, index: number) => {
                            const percentage = (limit.used / limit.limit) * 100;
                            const isNearLimit = percentage >= 80;
                            const isAtLimit = percentage >= 100;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{limit.feature}</span>
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
                                            {limit.used} / {limit.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
                                            }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
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
                                        ? 'Continue with a paid plan to keep these professional features after your trial ends.'
                                        : 'Premium plans include unlimited AI content generation, image enhancements, and research reports.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </ContentSection>
            )}

            {/* Plan Comparison */}
            <ContentSection title="Plan Comparison" description="Compare features across all subscription tiers" icon={CheckCircle2} variant="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">Feature</th>
                                <th className="text-center py-3 px-4 font-medium">Free</th>
                                <th className="text-center py-3 px-4 font-medium">Starter</th>
                                <th className="text-center py-3 px-4 font-medium">Professional</th>
                                <th className="text-center py-3 px-4 font-medium">Omnia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="py-3 px-4">AI Content Generation</td>
                                <td className="text-center py-3 px-4">10/month</td>
                                <td className="text-center py-3 px-4">50/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Image Enhancements</td>
                                <td className="text-center py-3 px-4">5/month</td>
                                <td className="text-center py-3 px-4">25/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Research Reports</td>
                                <td className="text-center py-3 px-4">3/month</td>
                                <td className="text-center py-3 px-4">15/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Marketing Plans</td>
                                <td className="text-center py-3 px-4">1/month</td>
                                <td className="text-center py-3 px-4">5/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Brand Monitoring</td>
                                <td className="text-center py-3 px-4">Basic</td>
                                <td className="text-center py-3 px-4">Basic</td>
                                <td className="text-center py-3 px-4">Advanced</td>
                                <td className="text-center py-3 px-4">Advanced</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Competitor Tracking</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">✓</td>
                                <td className="text-center py-3 px-4">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">Priority Support</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">✓</td>
                                <td className="text-center py-3 px-4">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">White-Label Options</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">-</td>
                                <td className="text-center py-3 px-4">✓</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </ContentSection>
        </div>
    );
}