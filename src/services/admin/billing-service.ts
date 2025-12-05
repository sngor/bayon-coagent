/**
 * Billing Service
 *
 * Manages billing operations for SuperAdmins including:
 * - Retrieving billing data from Stripe
 * - Dashboard metrics
 * - User billing information
 * - Payment failure handling
 * - Trial extensions
 * - Billing data export
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import Stripe from 'stripe';
import { getRepository } from '@/aws/dynamodb/repository';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';

// Initialize Stripe client
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
    apiVersion: '2024-11-20.acacia',
});

export interface BillingDashboardMetrics {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
    pastDueSubscriptions: number;
    paymentFailures: number;
    churnRate: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
}

export interface UserBillingInfo {
    userId: string;
    email: string;
    name: string;
    customerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionPriceId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string;
    paymentMethod?: {
        type: string;
        last4?: string;
        brand?: string;
        expiryMonth?: number;
        expiryYear?: number;
    };
    paymentHistory: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: number;
        description?: string;
    }>;
    totalSpent: number;
}

export interface PaymentFailure {
    userId: string;
    email: string;
    name: string;
    subscriptionId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    attemptCount: number;
    nextPaymentAttempt?: number;
    failureReason?: string;
    failureCode?: string;
    created: number;
}

export interface BillingExportData {
    transactions: Array<{
        date: string;
        userId: string;
        userEmail: string;
        userName: string;
        transactionId: string;
        type: 'payment' | 'refund' | 'subscription' | 'trial';
        amount: number;
        currency: string;
        status: string;
        description: string;
    }>;
    summary: {
        totalTransactions: number;
        totalRevenue: number;
        totalRefunds: number;
        netRevenue: number;
    };
}

export class BillingService {
    /**
     * Gets billing dashboard metrics
     * Requirements: 7.1
     */
    async getBillingDashboardMetrics(): Promise<BillingDashboardMetrics> {
        try {
            // Get all subscriptions
            const subscriptions = await stripe.subscriptions.list({
                limit: 100,
                expand: ['data.customer'],
            });

            let totalRevenue = 0;
            let monthlyRecurringRevenue = 0;
            let activeSubscriptions = 0;
            let trialSubscriptions = 0;
            let canceledSubscriptions = 0;
            let pastDueSubscriptions = 0;

            for (const sub of subscriptions.data) {
                const amount = sub.items.data[0]?.price.unit_amount || 0;
                const amountInDollars = amount / 100;

                if (sub.status === 'active') {
                    activeSubscriptions++;
                    monthlyRecurringRevenue += amountInDollars;
                } else if (sub.status === 'trialing') {
                    trialSubscriptions++;
                } else if (sub.status === 'canceled') {
                    canceledSubscriptions++;
                } else if (sub.status === 'past_due') {
                    pastDueSubscriptions++;
                }
            }

            // Get payment failures (invoices with payment_failed status)
            const failedInvoices = await stripe.invoices.list({
                limit: 100,
                status: 'open',
            });

            const paymentFailures = failedInvoices.data.filter(
                (inv) => inv.attempt_count > 0
            ).length;

            // Calculate total revenue from successful charges
            const charges = await stripe.charges.list({
                limit: 100,
            });

            totalRevenue = charges.data
                .filter((charge) => charge.status === 'succeeded')
                .reduce((sum, charge) => sum + charge.amount / 100, 0);

            // Calculate churn rate (canceled / total)
            const totalSubscriptions =
                activeSubscriptions +
                trialSubscriptions +
                canceledSubscriptions +
                pastDueSubscriptions;
            const churnRate =
                totalSubscriptions > 0
                    ? (canceledSubscriptions / totalSubscriptions) * 100
                    : 0;

            // Calculate ARPU
            const averageRevenuePerUser =
                activeSubscriptions > 0 ? monthlyRecurringRevenue / activeSubscriptions : 0;

            // Estimate LTV (simple calculation: ARPU * 12 months / churn rate)
            const lifetimeValue =
                churnRate > 0 ? (averageRevenuePerUser * 12) / (churnRate / 100) : 0;

            return {
                totalRevenue,
                monthlyRecurringRevenue,
                activeSubscriptions,
                trialSubscriptions,
                canceledSubscriptions,
                pastDueSubscriptions,
                paymentFailures,
                churnRate,
                averageRevenuePerUser,
                lifetimeValue,
            };
        } catch (error) {
            console.error('Error getting billing dashboard metrics:', error);
            throw new Error('Failed to retrieve billing metrics');
        }
    }

    /**
     * Gets billing information for a specific user
     * Requirements: 7.2
     */
    async getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
        try {
            const repository = getRepository();

            // Get user profile from DynamoDB
            const profile = await repository.get(`USER#${userId}`, 'PROFILE');

            if (!profile) {
                return null;
            }

            const userBillingInfo: UserBillingInfo = {
                userId,
                email: profile.email || '',
                name: profile.name || '',
                customerId: profile.customerId,
                subscriptionId: profile.subscriptionId,
                subscriptionStatus: profile.subscriptionStatus,
                subscriptionPriceId: profile.subscriptionPriceId,
                currentPeriodEnd: profile.subscriptionCurrentPeriodEnd,
                paymentHistory: [],
                totalSpent: 0,
            };

            // If user has a Stripe customer ID, get additional details
            if (profile.customerId) {
                try {
                    const customer = await stripe.customers.retrieve(profile.customerId, {
                        expand: ['invoice_settings.default_payment_method'],
                    });

                    if (!customer.deleted) {
                        // Get payment method details
                        const defaultPaymentMethod = customer.invoice_settings
                            ?.default_payment_method as Stripe.PaymentMethod | null;

                        if (defaultPaymentMethod) {
                            userBillingInfo.paymentMethod = {
                                type: defaultPaymentMethod.type,
                                last4: defaultPaymentMethod.card?.last4,
                                brand: defaultPaymentMethod.card?.brand,
                                expiryMonth: defaultPaymentMethod.card?.exp_month,
                                expiryYear: defaultPaymentMethod.card?.exp_year,
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to retrieve customer ${profile.customerId}:`, error);
                }
            }

            // If user has a subscription, get subscription details
            if (profile.subscriptionId) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(
                        profile.subscriptionId
                    );

                    userBillingInfo.subscriptionPlan =
                        subscription.items.data[0]?.price.nickname || 'Unknown';
                    userBillingInfo.currentPeriodStart = new Date(
                        subscription.current_period_start * 1000
                    ).toISOString();
                    userBillingInfo.currentPeriodEnd = new Date(
                        subscription.current_period_end * 1000
                    ).toISOString();
                    userBillingInfo.cancelAtPeriodEnd = subscription.cancel_at_period_end;

                    if (subscription.trial_end) {
                        userBillingInfo.trialEnd = new Date(
                            subscription.trial_end * 1000
                        ).toISOString();
                    }

                    // Get payment history from invoices
                    const invoices = await stripe.invoices.list({
                        subscription: profile.subscriptionId,
                        limit: 50,
                    });

                    userBillingInfo.paymentHistory = invoices.data.map((invoice) => ({
                        id: invoice.id,
                        amount: invoice.amount_paid / 100,
                        currency: invoice.currency,
                        status: invoice.status || 'unknown',
                        created: invoice.created,
                        description: invoice.description || undefined,
                    }));

                    userBillingInfo.totalSpent = invoices.data
                        .filter((inv) => inv.status === 'paid')
                        .reduce((sum, inv) => sum + inv.amount_paid / 100, 0);
                } catch (error) {
                    console.warn(
                        `Failed to retrieve subscription ${profile.subscriptionId}:`,
                        error
                    );
                }
            }

            return userBillingInfo;
        } catch (error) {
            console.error('Error getting user billing info:', error);
            throw new Error('Failed to retrieve user billing information');
        }
    }

    /**
     * Gets list of payment failures with retry options
     * Requirements: 7.3
     */
    async getPaymentFailures(): Promise<PaymentFailure[]> {
        try {
            // Get all open invoices (unpaid)
            const invoices = await stripe.invoices.list({
                limit: 100,
                status: 'open',
                expand: ['data.subscription', 'data.customer'],
            });

            const failures: PaymentFailure[] = [];

            for (const invoice of invoices.data) {
                // Only include invoices with failed payment attempts
                if (invoice.attempt_count > 0) {
                    const subscription = invoice.subscription as Stripe.Subscription | null;
                    const customer = invoice.customer as Stripe.Customer | null;

                    if (subscription && customer && !customer.deleted) {
                        const userId = subscription.metadata?.userId;

                        if (userId) {
                            failures.push({
                                userId,
                                email: customer.email || '',
                                name: customer.name || '',
                                subscriptionId: subscription.id,
                                invoiceId: invoice.id,
                                amount: invoice.amount_due / 100,
                                currency: invoice.currency,
                                attemptCount: invoice.attempt_count,
                                nextPaymentAttempt: invoice.next_payment_attempt || undefined,
                                failureReason: invoice.last_finalization_error?.message,
                                failureCode: invoice.last_finalization_error?.code,
                                created: invoice.created,
                            });
                        }
                    }
                }
            }

            return failures.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Error getting payment failures:', error);
            throw new Error('Failed to retrieve payment failures');
        }
    }

    /**
     * Grants a trial extension to a user
     * Requirements: 7.4
     */
    async grantTrialExtension(
        userId: string,
        extensionDays: number,
        adminId: string,
        reason: string
    ): Promise<void> {
        try {
            const repository = getRepository();

            // Get user profile
            const profile = await repository.get(`USER#${userId}`, 'PROFILE');

            if (!profile) {
                throw new Error('User not found');
            }

            if (!profile.subscriptionId) {
                throw new Error('User does not have an active subscription');
            }

            // Get subscription from Stripe
            const subscription = await stripe.subscriptions.retrieve(
                profile.subscriptionId
            );

            // Calculate new trial end date
            const currentTrialEnd = subscription.trial_end || Math.floor(Date.now() / 1000);
            const newTrialEnd = currentTrialEnd + extensionDays * 24 * 60 * 60;

            // Update subscription with new trial end
            await stripe.subscriptions.update(profile.subscriptionId, {
                trial_end: newTrialEnd,
            });

            // Update DynamoDB
            await repository.update(`USER#${userId}`, 'PROFILE', {
                trialEnd: new Date(newTrialEnd * 1000).toISOString(),
            });

            // Create audit log
            await repository.create({
                PK: 'AUDIT#BILLING',
                SK: `${Date.now()}#${userId}`,
                EntityType: 'AuditLog',
                Data: {
                    action: 'trial_extension',
                    adminId,
                    userId,
                    extensionDays,
                    reason,
                    newTrialEnd: new Date(newTrialEnd * 1000).toISOString(),
                    timestamp: Date.now(),
                },
            });

            console.log(
                `Trial extended for user ${userId} by ${extensionDays} days by admin ${adminId}`
            );
        } catch (error) {
            console.error('Error granting trial extension:', error);
            throw new Error('Failed to grant trial extension');
        }
    }

    /**
     * Exports billing data for a date range
     * Requirements: 7.5
     */
    async exportBillingData(
        startDate: Date,
        endDate: Date
    ): Promise<BillingExportData> {
        try {
            const repository = getRepository();

            // Get all charges in date range
            const charges = await stripe.charges.list({
                limit: 100,
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lte: Math.floor(endDate.getTime() / 1000),
                },
                expand: ['data.customer'],
            });

            const transactions: BillingExportData['transactions'] = [];
            let totalRevenue = 0;
            let totalRefunds = 0;

            for (const charge of charges.data) {
                const customer = charge.customer as Stripe.Customer | null;

                if (customer && !customer.deleted) {
                    // Try to find userId from customer metadata or subscription
                    let userId = customer.metadata?.userId || '';
                    let userName = customer.name || '';
                    let userEmail = customer.email || '';

                    // If we don't have userId in customer metadata, try to find it from subscription
                    if (!userId && charge.invoice) {
                        try {
                            const invoice = await stripe.invoices.retrieve(
                                charge.invoice as string,
                                { expand: ['subscription'] }
                            );
                            const subscription = invoice.subscription as Stripe.Subscription | null;
                            if (subscription) {
                                userId = subscription.metadata?.userId || '';
                            }
                        } catch (error) {
                            console.warn(`Failed to retrieve invoice ${charge.invoice}:`, error);
                        }
                    }

                    const amount = charge.amount / 100;
                    const isRefunded = charge.refunded;

                    transactions.push({
                        date: new Date(charge.created * 1000).toISOString(),
                        userId,
                        userEmail,
                        userName,
                        transactionId: charge.id,
                        type: isRefunded ? 'refund' : 'payment',
                        amount,
                        currency: charge.currency,
                        status: charge.status,
                        description: charge.description || '',
                    });

                    if (charge.status === 'succeeded') {
                        if (isRefunded) {
                            totalRefunds += amount;
                        } else {
                            totalRevenue += amount;
                        }
                    }
                }
            }

            // Get subscription events in date range
            const subscriptions = await stripe.subscriptions.list({
                limit: 100,
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lte: Math.floor(endDate.getTime() / 1000),
                },
                expand: ['data.customer'],
            });

            for (const subscription of subscriptions.data) {
                const customer = subscription.customer as Stripe.Customer | null;

                if (customer && !customer.deleted) {
                    const userId = subscription.metadata?.userId || '';
                    const amount = subscription.items.data[0]?.price.unit_amount || 0;

                    transactions.push({
                        date: new Date(subscription.created * 1000).toISOString(),
                        userId,
                        userEmail: customer.email || '',
                        userName: customer.name || '',
                        transactionId: subscription.id,
                        type: subscription.status === 'trialing' ? 'trial' : 'subscription',
                        amount: amount / 100,
                        currency: subscription.currency,
                        status: subscription.status,
                        description: `Subscription ${subscription.status}`,
                    });
                }
            }

            // Sort by date descending
            transactions.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            return {
                transactions,
                summary: {
                    totalTransactions: transactions.length,
                    totalRevenue,
                    totalRefunds,
                    netRevenue: totalRevenue - totalRefunds,
                },
            };
        } catch (error) {
            console.error('Error exporting billing data:', error);
            throw new Error('Failed to export billing data');
        }
    }

    /**
     * Retries a failed payment
     */
    async retryPayment(invoiceId: string): Promise<boolean> {
        try {
            const invoice = await stripe.invoices.retrieve(invoiceId);

            if (invoice.status === 'open') {
                await stripe.invoices.pay(invoiceId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error retrying payment:', error);
            return false;
        }
    }

    /**
     * Cancels a subscription
     */
    async cancelSubscription(subscriptionId: string, adminId: string): Promise<void> {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata?.userId;

            await stripe.subscriptions.cancel(subscriptionId);

            if (userId) {
                const repository = getRepository();

                // Update DynamoDB
                await repository.update(`USER#${userId}`, 'PROFILE', {
                    subscriptionStatus: 'canceled',
                });

                // Create audit log
                await repository.create({
                    PK: 'AUDIT#BILLING',
                    SK: `${Date.now()}#${userId}`,
                    EntityType: 'AuditLog',
                    Data: {
                        action: 'subscription_canceled',
                        adminId,
                        userId,
                        subscriptionId,
                        timestamp: Date.now(),
                    },
                });
            }

            console.log(`Subscription ${subscriptionId} canceled by admin ${adminId}`);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }
}

// Export singleton instance
export const billingService = new BillingService();

