/**
 * Stripe Subscription Event Handler (Lambda)
 * 
 * Processes Stripe subscription events from EventBridge and updates DynamoDB.
 * This replaces the webhook API route for better AWS-native integration.
 */

import { EventBridgeEvent } from 'aws-lambda';
import { getRepository } from '../aws/dynamodb/repository';

interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
}

export const handler = async (event: EventBridgeEvent<string, StripeEvent>) => {
    console.log('Processing Stripe event:', JSON.stringify(event, null, 2));

    const stripeEvent = event.detail;
    const repository = getRepository();

    try {
        switch (stripeEvent.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    console.warn('No userId in subscription metadata:', subscription.id);
                    return { statusCode: 200, body: 'No userId found' };
                }

                const currentPeriodEnd = subscription.current_period_end;

                await repository.update(
                    `USER#${userId}`,
                    'PROFILE',
                    {
                        subscriptionId: subscription.id,
                        subscriptionStatus: subscription.status,
                        subscriptionPriceId: subscription.items.data[0].price.id,
                        subscriptionCurrentPeriodEnd: currentPeriodEnd
                            ? new Date(currentPeriodEnd * 1000).toISOString()
                            : null,
                    }
                );

                console.log(`Updated subscription for user ${userId}:`, subscription.status);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    console.warn('No userId in subscription metadata:', subscription.id);
                    return { statusCode: 200, body: 'No userId found' };
                }

                await repository.update(
                    `USER#${userId}`,
                    'PROFILE',
                    {
                        subscriptionStatus: 'canceled',
                    }
                );

                console.log(`Canceled subscription for user ${userId}`);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = stripeEvent.data.object;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (!subscriptionId) {
                    console.warn('No subscription ID in invoice:', invoice.id);
                    return { statusCode: 200, body: 'No subscription found' };
                }

                // Get subscription to find userId
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                    apiVersion: '2025-11-17.clover',
                });

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    console.warn('No userId in subscription metadata:', subscriptionId);
                    return { statusCode: 200, body: 'No userId found' };
                }

                await repository.update(
                    `USER#${userId}`,
                    'PROFILE',
                    {
                        subscriptionStatus: 'active',
                    }
                );

                console.log(`Payment succeeded for user ${userId}`);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = stripeEvent.data.object;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (!subscriptionId) {
                    console.warn('No subscription ID in invoice:', invoice.id);
                    return { statusCode: 200, body: 'No subscription found' };
                }

                // Get subscription to find userId
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                    apiVersion: '2025-11-17.clover',
                });

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    console.warn('No userId in subscription metadata:', subscriptionId);
                    return { statusCode: 200, body: 'No userId found' };
                }

                await repository.update(
                    `USER#${userId}`,
                    'PROFILE',
                    {
                        subscriptionStatus: 'past_due',
                    }
                );

                console.log(`Payment failed for user ${userId}`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Event processed successfully' }),
        };
    } catch (error) {
        console.error('Error processing Stripe event:', error);
        throw error; // Let Lambda retry
    }
};
