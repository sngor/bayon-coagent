/**
 * Stripe Configuration
 * 
 * This module provides Stripe configuration and utilities.
 */

export const STRIPE_CONFIG = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const;

export const SUBSCRIPTION_PLANS = {
    starter: {
        name: 'Starter',
        priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
        price: 49,
        interval: 'month',
        features: [
            'AI Content Generation',
            'Basic Brand Monitoring',
            '50 Content Pieces/Month',
            'Email Support',
        ],
    },
    professional: {
        name: 'Professional',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || '',
        price: 99,
        interval: 'month',
        features: [
            'Everything in Starter',
            'Advanced Brand Intelligence',
            'Unlimited Content',
            'Competitor Tracking',
            'Priority Support',
        ],
    },
    enterprise: {
        name: 'Enterprise',
        priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
        price: 199,
        interval: 'month',
        features: [
            'Everything in Professional',
            'White-Label Options',
            'Custom Integrations',
            'Dedicated Account Manager',
            '24/7 Phone Support',
        ],
    },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
