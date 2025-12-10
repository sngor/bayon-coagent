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
    apiVersion: '2025-11-17.clover',
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
     * Advanced search for customers, subscriptions, and payments
     * Uses Stripe's list APIs with filtering
     * 
     * @param resourceType - The type of Stripe resource to search
     * @param params - Additional parameters for the Stripe API
     * @returns Promise<Array<any>> - Array of search results with metadata
     * @throws {BillingError} When search operation fails
     */
    async searchBillingData(
        resourceType: 'customers' | 'subscriptions' | 'payment_intents' | 'invoices',
        params: Record<string, any> = {}
    ): Promise<Array<any>> {
        try {
            let results;

            switch (resourceType) {
                case 'customers':
                    results = await stripe.customers.list({ limit: 50, ...params });
                    break;
                case 'subscriptions':
                    results = await stripe.subscriptions.list({ limit: 50, ...params });
                    break;
                case 'payment_intents':
                    results = await stripe.paymentIntents.list({ limit: 50, ...params });
                    break;
                case 'invoices':
                    results = await stripe.invoices.list({ limit: 50, ...params });
                    break;
                default:
                    throw new Error(`Unsupported resource type: ${resourceType}`);
            }

            return results.data.map((item: any) => ({
                id: item.id,
                type: resourceType,
                created: item.created,
                ...item,
            }));
        } catch (error) {
            console.error('Error searching billing data:', error);
            throw new Error('Failed to search billing data');
        }
    }

    /**
     * Search customers by various criteria
     */
    async searchCustomers(criteria: {
        email?: string;
        domain?: string;
        name?: string;
        metadata?: Record<string, string>;
    }) {
        try {
            const params: Record<string, any> = {};

            if (criteria.email) {
                params.email = criteria.email;
            }

            const results = await this.searchBillingData('customers', params);

            // Client-side filtering for criteria not supported by Stripe API
            return results.filter((customer: any) => {
                if (criteria.domain && customer.email && !customer.email.includes(criteria.domain)) {
                    return false;
                }
                if (criteria.name && customer.name && !customer.name.toLowerCase().includes(criteria.name.toLowerCase())) {
                    return false;
                }
                if (criteria.metadata) {
                    for (const [key, value] of Object.entries(criteria.metadata)) {
                        if (!customer.metadata?.[key] || customer.metadata[key] !== value) {
                            return false;
                        }
                    }
                }
                return true;
            });
        } catch (error) {
            console.error('Error searching customers:', error);
            throw new Error('Failed to search customers');
        }
    }

    /**
     * Search subscriptions by status, plan, or customer
     */
    async searchSubscriptions(criteria: {
        status?: 'active' | 'canceled' | 'past_due' | 'trialing';
        customerId?: string;
        priceId?: string;
    }) {
        try {
            const params: Record<string, any> = {};

            if (criteria.status) {
                params.status = criteria.status;
            }

            if (criteria.customerId) {
                params.customer = criteria.customerId;
            }

            const results = await this.searchBillingData('subscriptions', params);

            // Filter by price if specified
            if (criteria.priceId) {
                return results.filter((sub: any) =>
                    sub.items?.data?.some((item: any) => item.price.id === criteria.priceId)
                );
            }

            return results;
        } catch (error) {
            console.error('Error searching subscriptions:', error);
            throw new Error('Failed to search subscriptions');
        }
    }

    /**
     * Search payment intents by amount, status, or customer
     */
    async searchPayments(criteria: {
        status?: 'succeeded' | 'requires_payment_method' | 'requires_action';
        customerId?: string;
        amountGreaterThan?: number;
        amountLessThan?: number;
        currency?: string;
    }) {
        try {
            const params: Record<string, any> = {};

            if (criteria.customerId) {
                params.customer = criteria.customerId;
            }

            const results = await this.searchBillingData('payment_intents', params);

            // Client-side filtering for criteria not supported by Stripe list API
            return results.filter((payment: any) => {
                if (criteria.status && payment.status !== criteria.status) {
                    return false;
                }
                if (criteria.amountGreaterThan && payment.amount < criteria.amountGreaterThan * 100) {
                    return false;
                }
                if (criteria.amountLessThan && payment.amount > criteria.amountLessThan * 100) {
                    return false;
                }
                if (criteria.currency && payment.currency !== criteria.currency) {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Error searching payments:', error);
            throw new Error('Failed to search payments');
        }
    }

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
            const profile = await repository.get<{
                email?: string;
                name?: string;
                customerId?: string;
                subscriptionId?: string;
                subscriptionStatus?: string;
                subscriptionPriceId?: string;
                subscriptionCurrentPeriodEnd?: string;
            }>(`USER#${userId}`, 'PROFILE');

            if (!profile) {
                return null;
            }

            const profileData = profile as {
                email?: string;
                name?: string;
                customerId?: string;
                subscriptionId?: string;
                subscriptionStatus?: string;
                subscriptionPriceId?: string;
                subscriptionCurrentPeriodEnd?: string;
            };

            const userBillingInfo: UserBillingInfo = {
                userId,
                email: profileData.email || '',
                name: profileData.name || '',
                customerId: profileData.customerId,
                subscriptionId: profileData.subscriptionId,
                subscriptionStatus: profileData.subscriptionStatus,
                subscriptionPriceId: profileData.subscriptionPriceId,
                currentPeriodEnd: profileData.subscriptionCurrentPeriodEnd,
                paymentHistory: [],
                totalSpent: 0,
            };

            // If user has a Stripe customer ID, get additional details
            if (profileData.customerId) {
                try {
                    const customer = await stripe.customers.retrieve(profileData.customerId, {
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
                    console.warn(`Failed to retrieve customer ${profileData.customerId}:`, error);
                }
            }

            // If user has a subscription, get subscription details
            if (profileData.subscriptionId) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(
                        profileData.subscriptionId
                    );

                    userBillingInfo.subscriptionPlan =
                        subscription.items.data[0]?.price.nickname || 'Unknown';
                    userBillingInfo.currentPeriodStart = new Date(
                        (subscription as any).current_period_start * 1000
                    ).toISOString();
                    userBillingInfo.currentPeriodEnd = new Date(
                        (subscription as any).current_period_end * 1000
                    ).toISOString();
                    userBillingInfo.cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;

                    if (subscription.trial_end) {
                        userBillingInfo.trialEnd = new Date(
                            subscription.trial_end * 1000
                        ).toISOString();
                    }

                    // Get payment history from invoices
                    const invoices = await stripe.invoices.list({
                        subscription: profileData.subscriptionId,
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
                        `Failed to retrieve subscription ${profileData.subscriptionId}:`,
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
                    const subscription = (invoice as any).subscription as Stripe.Subscription | null;
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
            const profile = await repository.get<{
                subscriptionId?: string;
                trialEnd?: string;
            }>(`USER#${userId}`, 'PROFILE');

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
            const currentTrialEnd = (subscription as any).trial_end || Math.floor(Date.now() / 1000);
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
            await repository.create(
                'AUDIT#BILLING',
                `${Date.now()}#${userId}`,
                'AuditLog',
                {
                    action: 'trial_extension',
                    adminId,
                    userId,
                    extensionDays,
                    reason,
                    newTrialEnd: new Date(newTrialEnd * 1000).toISOString(),
                    timestamp: Date.now(),
                }
            );

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
                    if (!userId && (charge as any).invoice) {
                        try {
                            const invoice = await stripe.invoices.retrieve(
                                (charge as any).invoice as string,
                                { expand: ['subscription'] }
                            );
                            const subscription = (invoice as any).subscription as Stripe.Subscription | null;
                            if (subscription) {
                                userId = subscription.metadata?.userId || '';
                            }
                        } catch (error) {
                            console.warn(`Failed to retrieve invoice ${(charge as any).invoice}:`, error);
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
                await repository.create(
                    'AUDIT#BILLING',
                    `${Date.now()}#${userId}`,
                    'AuditLog',
                    {
                        action: 'subscription_canceled',
                        adminId,
                        userId,
                        subscriptionId,
                        timestamp: Date.now(),
                    }
                );
            }

            console.log(`Subscription ${subscriptionId} canceled by admin ${adminId}`);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    /**
     * Gets comprehensive billing analytics data with real estate seasonality insights
     */
    async getBillingAnalytics(timeRange: string = '30d'): Promise<any> {
        try {
            // Calculate date range
            const now = new Date();
            let startDate: Date;
            let previousStartDate: Date;

            switch (timeRange) {
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                    break;
                case '1y':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                    break;
                default: // 30d
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            }

            // Get current period revenue
            const currentCharges = await stripe.charges.list({
                limit: 100,
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lte: Math.floor(now.getTime() / 1000),
                },
            });

            // Get previous period revenue for comparison
            const previousCharges = await stripe.charges.list({
                limit: 100,
                created: {
                    gte: Math.floor(previousStartDate.getTime() / 1000),
                    lte: Math.floor(startDate.getTime() / 1000),
                },
            });

            const currentRevenue = currentCharges.data
                .filter(charge => charge.status === 'succeeded')
                .reduce((sum, charge) => sum + charge.amount / 100, 0);

            const previousRevenue = previousCharges.data
                .filter(charge => charge.status === 'succeeded')
                .reduce((sum, charge) => sum + charge.amount / 100, 0);

            const revenueGrowthPercentage = previousRevenue > 0
                ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
                : 0;

            // Get subscription trends
            const currentSubscriptions = await stripe.subscriptions.list({
                limit: 100,
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                },
                status: 'all',
            });

            const newSubscriptions = currentSubscriptions.data.filter(sub =>
                sub.status === 'active' || sub.status === 'trialing'
            ).length;

            const canceledSubscriptions = currentSubscriptions.data.filter(sub =>
                sub.status === 'canceled'
            ).length;

            // Get payment metrics
            const paymentIntents = await stripe.paymentIntents.list({
                limit: 100,
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                },
            });

            const successfulPayments = paymentIntents.data.filter(pi => pi.status === 'succeeded');
            const totalPayments = paymentIntents.data.length;
            const successRate = totalPayments > 0 ? (successfulPayments.length / totalPayments) * 100 : 0;

            const averageTransactionValue = successfulPayments.length > 0
                ? successfulPayments.reduce((sum, pi) => sum + pi.amount / 100, 0) / successfulPayments.length
                : 0;

            // Get customer segments (simplified - based on subscription plans)
            const allSubscriptions = await stripe.subscriptions.list({
                limit: 100,
                status: 'active',
                expand: ['data.items.data.price'],
            });

            const customerSegments = this.calculateCustomerSegments(allSubscriptions.data);

            // Get monthly data for trends (last 6 months)
            const monthlyData = await this.getMonthlyTrends();

            return {
                revenueGrowth: {
                    current: currentRevenue,
                    previous: previousRevenue,
                    percentage: revenueGrowthPercentage,
                },
                subscriptionTrends: {
                    newSubscriptions,
                    canceledSubscriptions,
                    netGrowth: newSubscriptions - canceledSubscriptions,
                },
                paymentMetrics: {
                    successRate,
                    averageTransactionValue,
                    totalTransactions: totalPayments,
                },
                customerSegments,
                monthlyData,
            };

        } catch (error) {
            console.error('Error getting billing analytics:', error);
            throw new Error('Failed to retrieve billing analytics');
        }
    }

    /**
     * Calculate customer segments based on subscription data
     * Tailored for real estate agent platform
     */
    private calculateCustomerSegments(subscriptions: any[]): Array<{
        segment: string;
        count: number;
        revenue: number;
        percentage: number;
    }> {
        const segments = new Map<string, { count: number; revenue: number }>();

        subscriptions.forEach(subscription => {
            const price = subscription.items.data[0]?.price;
            if (!price) return;

            const amount = price.unit_amount / 100;
            let segment = 'Other';

            // Real estate agent-specific segmentation
            if (amount <= 29) {
                segment = 'Solo Agents (Starter)';
            } else if (amount <= 79) {
                segment = 'Professional Agents';
            } else if (amount <= 149) {
                segment = 'Top Producers';
            } else if (amount <= 299) {
                segment = 'Team Leaders';
            } else {
                segment = 'Brokerages & Enterprise';
            }

            const existing = segments.get(segment) || { count: 0, revenue: 0 };
            segments.set(segment, {
                count: existing.count + 1,
                revenue: existing.revenue + amount,
            });
        });

        const totalRevenue = Array.from(segments.values()).reduce((sum, seg) => sum + seg.revenue, 0);

        return Array.from(segments.entries()).map(([segment, data]) => ({
            segment,
            count: data.count,
            revenue: data.revenue,
            percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        }));
    }

    /**
     * Get monthly trends for the last 6 months
     */
    private async getMonthlyTrends(): Promise<Array<{
        month: string;
        revenue: number;
        subscriptions: number;
        churn: number;
    }>> {
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            // Get charges for the month
            const charges = await stripe.charges.list({
                limit: 100,
                created: {
                    gte: Math.floor(monthStart.getTime() / 1000),
                    lte: Math.floor(monthEnd.getTime() / 1000),
                },
            });

            const monthRevenue = charges.data
                .filter(charge => charge.status === 'succeeded')
                .reduce((sum, charge) => sum + charge.amount / 100, 0);

            // Get subscriptions created in this month
            const subscriptions = await stripe.subscriptions.list({
                limit: 100,
                created: {
                    gte: Math.floor(monthStart.getTime() / 1000),
                    lte: Math.floor(monthEnd.getTime() / 1000),
                },
            });

            // Get canceled subscriptions for churn calculation
            const allCanceledSubs = await stripe.subscriptions.list({
                limit: 100,
                status: 'canceled',
            });

            // Filter by cancellation date manually since Stripe doesn't support canceled_at filter
            const canceledSubs = {
                data: allCanceledSubs.data.filter(sub => {
                    if (!sub.canceled_at) return false;
                    const canceledTime = sub.canceled_at * 1000;
                    return canceledTime >= monthStart.getTime() && canceledTime <= monthEnd.getTime();
                })
            };

            // Calculate churn rate (simplified)
            const totalSubs = subscriptions.data.length;
            const churnRate = totalSubs > 0 ? (canceledSubs.data.length / totalSubs) * 100 : 0;

            months.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                revenue: monthRevenue,
                subscriptions: totalSubs,
                churn: churnRate,
            });
        }

        return months;
    }

    /**
     * Get real estate seasonal insights for billing patterns
     */
    async getSeasonalInsights(): Promise<{
        currentSeason: string;
        seasonalTrends: Array<{
            season: string;
            months: string[];
            expectedGrowth: number;
            description: string;
        }>;
        recommendations: string[];
    }> {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12

        let currentSeason = 'Winter Planning';
        if (month >= 3 && month <= 5) currentSeason = 'Spring Buying Season';
        else if (month >= 6 && month <= 8) currentSeason = 'Summer Peak';
        else if (month >= 9 && month <= 11) currentSeason = 'Fall Market';

        const seasonalTrends = [
            {
                season: 'Spring Buying Season',
                months: ['March', 'April', 'May'],
                expectedGrowth: 25,
                description: 'Peak home buying activity drives agent subscriptions'
            },
            {
                season: 'Summer Peak',
                months: ['June', 'July', 'August'],
                expectedGrowth: 15,
                description: 'Maximum listing activity and content creation needs'
            },
            {
                season: 'Fall Market',
                months: ['September', 'October', 'November'],
                expectedGrowth: 10,
                description: 'Opportunity capture and year-end planning'
            },
            {
                season: 'Winter Planning',
                months: ['December', 'January', 'February'],
                expectedGrowth: -5,
                description: 'Strategic planning and preparation for spring'
            }
        ];

        const recommendations = [
            'Launch spring promotion campaigns in February',
            'Focus on content creation tools during summer peak',
            'Emphasize market analysis features in fall',
            'Promote annual plans during winter planning season'
        ];

        return {
            currentSeason,
            seasonalTrends,
            recommendations
        };
    }
}

// Export singleton instance
export const billingService = new BillingService();

