/**
 * Subscription Change Plan API Route
 * 
 * Changes a user's subscription plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import Stripe from 'stripe';
import { STRIPE_CONFIG, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';

const stripe = STRIPE_CONFIG.secretKey
    ? new Stripe(STRIPE_CONFIG.secretKey, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        const { userId, newPlan, couponId } = await request.json();

        if (!userId || !newPlan) {
            return NextResponse.json(
                { error: 'User ID and new plan are required' },
                { status: 400 }
            );
        }

        if (!SUBSCRIPTION_PLANS[newPlan as SubscriptionPlan]) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe is not configured' },
                { status: 500 }
            );
        }

        const repository = getRepository();

        // Get current subscription data
        const subscriptionData = await repository.getItem<any>(
            `USER#${userId}`,
            'SUBSCRIPTION'
        );

        if (!subscriptionData?.Data?.subscriptionId) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 404 }
            );
        }

        const { subscriptionId } = subscriptionData.Data;
        const newPriceId = SUBSCRIPTION_PLANS[newPlan as SubscriptionPlan].priceId;

        // Get current subscription from Stripe
        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (!currentSubscription.items.data[0]) {
            return NextResponse.json(
                { error: 'Invalid subscription structure' },
                { status: 400 }
            );
        }

        // Update subscription in Stripe
        const updateParams: Stripe.SubscriptionUpdateParams = {
            items: [{
                id: currentSubscription.items.data[0].id,
                price: newPriceId,
            }],
            proration_behavior: 'create_prorations',
            metadata: {
                plan_changed_at: new Date().toISOString(),
                previous_plan: subscriptionData.Data.plan || 'unknown',
                new_plan: newPlan,
            },
        };

        // Add coupon if provided
        if (couponId) {
            updateParams.coupon = couponId;
        }

        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

        // Update subscription in database
        const now = new Date();
        await repository.put({
            PK: `USER#${userId}`,
            SK: 'SUBSCRIPTION',
            EntityType: 'UserPreferences',
            Data: {
                ...subscriptionData.Data,
                plan: newPlan,
                priceId: newPriceId,
                currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
                planChangedAt: now.toISOString(),
                previousPlan: subscriptionData.Data.plan || 'unknown',
            },
            CreatedAt: subscriptionData.CreatedAt,
            UpdatedAt: now.getTime(),
        });

        return NextResponse.json({
            success: true,
            message: 'Plan updated successfully',
            subscription: {
                plan: newPlan,
                status: updatedSubscription.status,
                currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
            },
        });
    } catch (error) {
        console.error('Error changing plan:', error);
        return NextResponse.json(
            { error: 'Failed to change plan' },
            { status: 500 }
        );
    }
}