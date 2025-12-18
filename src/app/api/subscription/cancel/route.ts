/**
 * Subscription Cancel API Route
 * 
 * Cancels a user's subscription (sets to cancel at period end).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';

const stripe = STRIPE_CONFIG.secretKey
    ? new Stripe(STRIPE_CONFIG.secretKey, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        const { userId, reason } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        // Cancel subscription at period end in Stripe
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            metadata: {
                cancellation_reason: reason || 'User requested',
                cancelled_by: 'user',
                cancelled_at: new Date().toISOString(),
            },
        });

        // Update subscription in database
        const now = new Date();
        await repository.put({
            PK: `USER#${userId}`,
            SK: 'SUBSCRIPTION',
            EntityType: 'UserPreferences',
            Data: {
                ...subscriptionData.Data,
                cancelAtPeriodEnd: true,
                cancellationReason: reason || 'User requested',
                cancelledAt: now.toISOString(),
            },
            CreatedAt: subscriptionData.CreatedAt,
            UpdatedAt: now.getTime(),
        });

        return NextResponse.json({
            success: true,
            message: 'Subscription will be cancelled at the end of the current billing period',
            cancelAtPeriodEnd: true,
            currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}