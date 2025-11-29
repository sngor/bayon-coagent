/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription management.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';
import { getRepository } from '@/aws/dynamodb/repository';

// Initialize Stripe only if secret key is available
const stripe = STRIPE_CONFIG.secretKey
    ? new Stripe(STRIPE_CONFIG.secretKey, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe is not configured' },
            { status: 500 }
        );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_CONFIG.webhookSecret
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    const repository = getRepository();

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.userId;
                const currentPeriodEnd = (subscription as any).current_period_end;

                if (userId && currentPeriodEnd) {
                    await repository.update(
                        `USER#${userId}`,
                        'PROFILE',
                        {
                            subscriptionId: subscription.id,
                            subscriptionStatus: subscription.status,
                            subscriptionPriceId: subscription.items.data[0].price.id,
                            subscriptionCurrentPeriodEnd: new Date(
                                currentPeriodEnd * 1000
                            ).toISOString(),
                        }
                    );
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.userId;

                if (userId) {
                    await repository.update(
                        `USER#${userId}`,
                        'PROFILE',
                        {
                            subscriptionStatus: 'canceled',
                        }
                    );
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionField = (invoice as any).subscription;
                const subscriptionId = typeof subscriptionField === 'string'
                    ? subscriptionField
                    : subscriptionField?.id;

                if (subscriptionId) {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    const userId = sub.metadata.userId;

                    if (userId) {
                        await repository.update(
                            `USER#${userId}`,
                            'PROFILE',
                            {
                                subscriptionStatus: 'active',
                            }
                        );
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionField = (invoice as any).subscription;
                const subscriptionId = typeof subscriptionField === 'string'
                    ? subscriptionField
                    : subscriptionField?.id;

                if (subscriptionId) {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    const userId = sub.metadata.userId;

                    if (userId) {
                        await repository.update(
                            `USER#${userId}`,
                            'PROFILE',
                            {
                                subscriptionStatus: 'past_due',
                            }
                        );
                    }
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
