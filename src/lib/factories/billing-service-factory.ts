/**
 * Billing Service Factory
 * 
 * Provides dependency injection and service configuration
 */

import { BillingService } from '@/services/admin/billing-service';
import { billingCache } from '@/lib/admin/billing-cache';
import { IBillingService } from '@/lib/types/billing-types';

class BillingServiceFactory {
    private static instance: IBillingService | null = null;

    static getInstance(): IBillingService {
        if (!this.instance) {
            this.instance = new BillingService();
        }
        return this.instance;
    }

    static getInstanceWithCache(): IBillingService {
        const service = this.getInstance();
        return new CachedBillingService(service);
    }

    static reset(): void {
        this.instance = null;
        billingCache.invalidateAll();
    }
}

/**
 * Decorator pattern for caching billing service operations
 */
class CachedBillingService implements IBillingService {
    constructor(private billingService: IBillingService) { }

    async getBillingDashboardMetrics() {
        const cached = billingCache.getCachedMetrics();
        if (cached) {
            return cached;
        }

        const metrics = await this.billingService.getBillingDashboardMetrics();
        billingCache.cacheMetrics(metrics);
        return metrics;
    }

    async getBillingAnalytics(timeRange = '30d' as const) {
        const cached = billingCache.getCachedAnalytics(timeRange);
        if (cached) {
            return cached;
        }

        const analytics = await this.billingService.getBillingAnalytics(timeRange);
        billingCache.cacheAnalytics(timeRange, analytics);
        return analytics;
    }

    async searchCustomers(criteria: any) {
        const cached = billingCache.getCachedSearchResults('customers', criteria);
        if (cached) {
            return cached;
        }

        const results = await this.billingService.searchCustomers(criteria);
        billingCache.cacheSearchResults('customers', criteria, results);
        return results;
    }

    async searchSubscriptions(criteria: any) {
        const cached = billingCache.getCachedSearchResults('subscriptions', criteria);
        if (cached) {
            return cached;
        }

        const results = await this.billingService.searchSubscriptions(criteria);
        billingCache.cacheSearchResults('subscriptions', criteria, results);
        return results;
    }

    async searchPayments(criteria: any) {
        const cached = billingCache.getCachedSearchResults('payments', criteria);
        if (cached) {
            return cached;
        }

        const results = await this.billingService.searchPayments(criteria);
        billingCache.cacheSearchResults('payments', criteria, results);
        return results;
    }

    // Pass-through methods that shouldn't be cached
    async retryPayment(invoiceId: string) {
        billingCache.invalidate('metrics'); // Invalidate metrics after payment retry
        return this.billingService.retryPayment(invoiceId);
    }

    async cancelSubscription(subscriptionId: string, adminId: string) {
        billingCache.invalidateAll(); // Invalidate all cache after subscription change
        return this.billingService.cancelSubscription(subscriptionId, adminId);
    }
}

export { BillingServiceFactory };