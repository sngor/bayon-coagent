'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, Tag, X } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';
import { cn } from '@/lib/utils/common';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
    id: string;
    name: string;
    percent_off?: number;
    amount_off?: number;
    currency?: string;
    duration: string;
    valid: boolean;
}

interface StripePricingProps {
    onSelectPlan: (plan: SubscriptionPlan, couponId?: string) => void;
    selectedPlan?: SubscriptionPlan;
    showCouponInput?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function StripePricing({
    onSelectPlan,
    selectedPlan,
    showCouponInput = true,
    isLoading = false,
    disabled = false,
    className
}: StripePricingProps) {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const { toast } = useToast();

    const validateCoupon = async (code: string) => {
        if (!code.trim()) return;

        setIsValidatingCoupon(true);
        try {
            const response = await fetch('/api/stripe/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ couponId: code.toUpperCase() }),
            });

            const data = await response.json();

            if (response.ok && data.coupon) {
                setAppliedCoupon(data.coupon);
                toast({
                    title: 'Coupon applied!',
                    description: `${data.coupon.name} - ${data.coupon.percent_off ? `${data.coupon.percent_off}% off` : `$${data.coupon.amount_off / 100} off`}`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Invalid coupon',
                    description: data.error || 'This coupon code is not valid or has expired.',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to validate coupon code.',
            });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const calculateDiscountedPrice = (originalPrice: number) => {
        if (!appliedCoupon) return originalPrice;

        if (appliedCoupon.percent_off) {
            return originalPrice * (1 - appliedCoupon.percent_off / 100);
        }

        if (appliedCoupon.amount_off) {
            return Math.max(0, originalPrice - (appliedCoupon.amount_off / 100));
        }

        return originalPrice;
    };

    return (
        <div className="space-y-6">
            {showCouponInput && (
                <div className="max-w-md mx-auto">
                    {!appliedCoupon ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && validateCoupon(couponCode)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                onClick={() => validateCoupon(couponCode)}
                                disabled={!couponCode.trim() || isValidatingCoupon}
                                variant="outline"
                            >
                                {isValidatingCoupon ? 'Checking...' : 'Apply'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                    {appliedCoupon.name} - {appliedCoupon.percent_off ? `${appliedCoupon.percent_off}% off` : `$${appliedCoupon.amount_off! / 100} off`}
                                </span>
                            </div>
                            <Button
                                onClick={removeCoupon}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
                {(Object.entries(SUBSCRIPTION_PLANS) as [SubscriptionPlan, typeof SUBSCRIPTION_PLANS[SubscriptionPlan]][]).map(
                    ([key, plan]) => {
                        const isPopular = key === 'professional';
                        const isSelected = selectedPlan === key;

                        return (
                            <div
                                key={key}
                                className={cn(
                                    'relative rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg',
                                    isPopular
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-border bg-card',
                                    isSelected && 'ring-2 ring-primary ring-offset-2'
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                                            <Sparkles className="h-3 w-3" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-headline text-2xl font-bold">{plan.name}</h3>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            {appliedCoupon ? (
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-bold line-through text-muted-foreground">
                                                            ${plan.price}
                                                        </span>
                                                        <span className="text-4xl font-bold text-green-600">
                                                            ${Math.round(calculateDiscountedPrice(plan.price))}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        Save ${Math.round(plan.price - calculateDiscountedPrice(plan.price))}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-4xl font-bold">${plan.price}</span>
                                            )}
                                            <span className="text-muted-foreground">/{plan.interval}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                                                <span className="text-sm text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => onSelectPlan(key, appliedCoupon?.id)}
                                        variant={isPopular ? 'premium' : 'outline'}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isSelected ? 'Selected' : 'Select Plan'}
                                    </Button>
                                </div>
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}
