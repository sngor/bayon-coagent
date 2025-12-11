/**
 * Billing Service Stub
 * 
 * Temporary stub implementation to prevent build failures.
 * This provides the same interface but returns mock data during build.
 */

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
     * Stub implementation - returns mock data
     */
    async getBillingAnalytics(timeRange: string = '30d'): Promise<any> {
        console.warn('Using billing service stub - returning mock data');

        return {
            revenueGrowth: {
                current: 0,
                previous: 0,
                percentage: 0,
            },
            subscriptionTrends: {
                newSubscriptions: 0,
                canceledSubscriptions: 0,
                netGrowth: 0,
            },
            paymentMetrics: {
                successRate: 100,
                averageTransactionValue: 0,
                totalTransactions: 0,
            },
            customerSegments: [],
            monthlyData: [],
        };
    }

    async getBillingDashboardMetrics(): Promise<BillingDashboardMetrics> {
        console.warn('Using billing service stub - returning mock data');

        return {
            totalRevenue: 0,
            monthlyRecurringRevenue: 0,
            activeSubscriptions: 0,
            trialSubscriptions: 0,
            canceledSubscriptions: 0,
            pastDueSubscriptions: 0,
            paymentFailures: 0,
            churnRate: 0,
            averageRevenuePerUser: 0,
            lifetimeValue: 0,
        };
    }

    async getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
        console.warn('Using billing service stub - returning mock data');

        return {
            userId,
            email: 'stub@example.com',
            name: 'Stub User',
            paymentHistory: [],
            totalSpent: 0,
        };
    }

    async getPaymentFailures(): Promise<PaymentFailure[]> {
        console.warn('Using billing service stub - returning mock data');
        return [];
    }

    async grantTrialExtension(
        userId: string,
        extensionDays: number,
        adminId: string,
        reason: string
    ): Promise<void> {
        console.warn('Using billing service stub - no action taken');
    }

    async exportBillingData(
        startDate: Date,
        endDate: Date
    ): Promise<BillingExportData> {
        console.warn('Using billing service stub - returning mock data');

        return {
            transactions: [],
            summary: {
                totalTransactions: 0,
                totalRevenue: 0,
                totalRefunds: 0,
                netRevenue: 0,
            },
        };
    }

    async searchBillingData(
        resourceType: 'customers' | 'subscriptions' | 'payment_intents' | 'invoices',
        params: Record<string, any> = {}
    ): Promise<Array<any>> {
        console.warn('Using billing service stub - returning mock data');
        return [];
    }

    async searchCustomers(criteria: any) {
        console.warn('Using billing service stub - returning mock data');
        return [];
    }

    async searchSubscriptions(criteria: any) {
        console.warn('Using billing service stub - returning mock data');
        return [];
    }

    async searchPayments(criteria: any) {
        console.warn('Using billing service stub - returning mock data');
        return [];
    }

    async retryPayment(invoiceId: string): Promise<boolean> {
        console.warn('Using billing service stub - returning false');
        return false;
    }

    async cancelSubscription(subscriptionId: string, adminId: string): Promise<void> {
        console.warn('Using billing service stub - no action taken');
    }

    async getSeasonalInsights(): Promise<any> {
        console.warn('Using billing service stub - returning mock data');

        return {
            currentSeason: 'Winter Planning',
            seasonalTrends: [],
            recommendations: [],
        };
    }
}

// Export singleton instance
export const billingService = new BillingService();