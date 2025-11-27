/**
 * Stripe Create Subscription API Route
 * 
 * Creates a Stripe subscription for a user.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/stripe-config';

// Initialize Stripe only if secret key is available
const stripe = STRIPE_CONFIG.secretKey
    ? new Stripe(STRIPE_CONFIG.secretKey, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe is not configured' },
                { status: 500 }
            );
        }

        const { email, priceId, userId } = await request.json();

        if (!email || !priceId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create or retrieve customer
        const customers = await stripe.customers.list({
            email,
            limit: 1,
        });

        let customer: Stripe.Customer;

        if (customers.data.length > 0) {
            customer = customers.data[0];
        } else {
            customer = await stripe.customers.create({
                email,
                metadata: {
                    userId,
                },
            });
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId,
            },
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntentField = (invoice as any).payment_intent;

        const paymentIntent = typeof paymentIntentField === 'string'
            ? await stripe.paymentIntents.retrieve(paymentIntentField)
            : paymentIntentField as Stripe.PaymentIntent;

        if (!paymentIntent?.client_secret) {
            return NextResponse.json(
                { error: 'Failed to create payment intent' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            customerId: customer.id,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
