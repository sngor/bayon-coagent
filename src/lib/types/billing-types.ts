/**
 * Billing Types and Interfaces
 */

export interface BillingMetrics {
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

export interface MetricTrend {
    value: number;
    isPositive: boolean;
}

export interface BillingAnalytics {
    revenueGrowth: {
        current: number;
        previous: number;
        percentage: number;
    };
    subscriptionTrends: {
        newSubscriptions: number;
        canceledSubscriptions: number;
        netGrowth: number;
    };
    paymentMetrics: {
        successRate: number;
        averageTransactionValue: number;
        totalTransactions: number;
    };
    customerSegments: Array<{
        segment: string;
        count: number;
        revenue: number;
        percentage: number;
    }>;
    monthlyData: Array<{
        month: string;
        revenue: number;
        subscriptions: number;
        churn: number;
    }>;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface SearchCriteria {
    email?: string;
    domain?: string;
    name?: string;
    status?: string;
    customerId?: string;
    priceId?: string;
    amountGreaterThan?: number;
    amountLessThan?: number;
    currency?: string;
    metadata?: Record<string, string>;
}

export class BillingError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'BillingError';
    }
}

export interface IBillingService {
    getBillingDashboardMetrics(): Promise<BillingMetrics>;
    getBillingAnalytics(timeRange?: TimeRange): Promise<BillingAnalytics>;
    searchCustomers(criteria: SearchCriteria): Promise<any[]>;
    searchSubscriptions(criteria: SearchCriteria): Promise<any[]>;
    searchPayments(criteria: SearchCriteria): Promise<any[]>;
    retryPayment(invoiceId: string): Promise<boolean>;
    cancelSubscription(subscriptionId: string, adminId: string): Promise<void>;
}