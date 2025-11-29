'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';
import { cn } from '@/lib/utils/common';

interface StripePricingProps {
    onSelectPlan: (plan: SubscriptionPlan) => void;
    selectedPlan?: SubscriptionPlan;
}

export function StripePricing({ onSelectPlan, selectedPlan }: StripePricingProps) {
    return (
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
                                        <span className="text-4xl font-bold">${plan.price}</span>
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
                                    onClick={() => onSelectPlan(key)}
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
    );
}
