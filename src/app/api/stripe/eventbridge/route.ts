/**
 * Stripe EventBridge Handler
 * 
 * Handles Stripe events delivered via AWS EventBridge.
 * This replaces the traditional webhook approach.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';
import { emailService } from '@/lib/email-service';

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

        const event = await request.json();

        console.log('Received Stripe event via EventBridge:', event.type);

        // EventBridge delivers the event in a specific format
        // The actual Stripe event is in the detail field
        const stripeEvent = event.detail || event;

        // Handle different event types
        switch (stripeEvent.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(stripeEvent.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(stripeEvent.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(stripeEvent.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(stripeEvent.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(stripeEvent.data.object);
                break;

            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(stripeEvent.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing Stripe event:', error);
        return NextResponse.json(
            { error: 'Failed to process event' },
            { status: 500 }
        );
    }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const repository = getRepository();
    const userId = subscription.metadata.userId;

    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    const now = new Date();
    await repository.put({
        PK: `USER#${userId}`,
        SK: 'SUBSCRIPTION',
        EntityType: 'UserPreferences',
        Data: {
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: subscription.status,
            plan: subscription.metadata.plan || 'professional',
            priceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            trialEndsAt: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
        },
        CreatedAt: now.getTime(),
        UpdatedAt: now.getTime(),
    });

    console.log(`Subscription created for user ${userId}`);

    // Send subscription confirmation email
    try {
        const userProfile = await repository.get<any>(`USER#${userId}`, 'PROFILE');
        if (userProfile?.email) {
            const planName = subscription.metadata.plan || 'Professional';
            const amount = subscription.items.data[0]?.price.unit_amount 
                ? `$${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`
                : '$99.00';
            
            await emailService.sendSubscriptionConfirmation(
                userProfile.email,
                userProfile.firstName || userProfile.name || 'there',
                planName,
                amount
            );
        }
    } catch (emailError) {
        console.error('Failed to send subscription confirmation email:', emailError);
        // Don't fail the webhook for email errors
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const repository = getRepository();
    const userId = subscription.metadata.userId;

    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    // Get existing subscription data
    const existingData = await repository.getItem<any>(
        `USER#${userId}`,
        'SUBSCRIPTION'
    );

    const now = new Date();
    await repository.put({
        PK: `USER#${userId}`,
        SK: 'SUBSCRIPTION',
        EntityType: 'UserPreferences',
        Data: {
            ...(existingData?.Data || {}),
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: subscription.status,
            plan: subscription.metadata.plan || existingData?.Data?.plan || 'professional',
            priceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            trialEndsAt: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
        },
        CreatedAt: existingData?.CreatedAt || now.getTime(),
        UpdatedAt: now.getTime(),
    });

    console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const repository = getRepository();
    const userId = subscription.metadata.userId;

    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    // Get existing subscription data
    const existingData = await repository.getItem<any>(
        `USER#${userId}`,
        'SUBSCRIPTION'
    );

    const now = new Date();
    await repository.put({
        PK: `USER#${userId}`,
        SK: 'SUBSCRIPTION',
        EntityType: 'UserPreferences',
        Data: {
            ...(existingData?.Data || {}),
            status: 'canceled',
            canceledAt: now.toISOString(),
        },
        CreatedAt: existingData?.CreatedAt || now.getTime(),
        UpdatedAt: now.getTime(),
    });

    console.log(`Subscription deleted for user ${userId}`);

    // Send cancellation confirmation email
    try {
        const userProfile = await repository.get<any>(`USER#${userId}`, 'PROFILE');
        if (userProfile?.email) {
            const endDate = (subscription as any).current_period_end 
                ? new Date((subscription as any).current_period_end * 1000).toLocaleDateString()
                : 'the end of your billing period';
            
            await emailService.sendCancellationConfirmation(
                userProfile.email,
                userProfile.firstName || userProfile.name || 'there',
                endDate
            );
        }
    } catch (emailError) {
        console.error('Failed to send cancellation confirmation email:', emailError);
        // Don't fail the webhook for email errors
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const repository = getRepository();
    const customerId = invoice.customer as string;

    if (!customerId) {
        console.error('No customer in invoice');
        return;
    }

    // Find user by customer ID
    // Note: In production, you might want to maintain a customer ID index
    console.log(`Payment succeeded for customer ${customerId}`);

    // You can add logic here to:
    // - Send payment confirmation email
    // - Update payment history
    // - Trigger analytics events
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const repository = getRepository();
    const customerId = invoice.customer as string;

    if (!customerId) {
        console.error('No customer in invoice');
        return;
    }

    console.log(`Payment failed for customer ${customerId}`);

    // You can add logic here to:
    // - Send payment failure notification
    // - Update subscription status
    // - Trigger retry logic
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
    const repository = getRepository();
    const userId = subscription.metadata.userId;

    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    console.log(`Trial will end soon for user ${userId}`);

    // You can add logic here to:
    // - Send trial ending notification email
    // - Show in-app notifications
    // - Trigger conversion campaigns
}