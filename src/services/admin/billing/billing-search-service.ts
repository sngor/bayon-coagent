/**
 * Billing Search Service
 * Handles all search-related billing operations
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
    apiVersion: '2025-11-17.clover',
});

export interface SearchCriteria {
    customers?: {
        email?: string;
        domain?: string;
        name?: string;
        metadata?: Record<string, string>;
    };
    subscriptions?: {
        status?: 'active' | 'canceled' | 'past_due' | 'trialing';
        customerId?: string;
        priceId?: string;
    };
    payments?: {
        status?: 'succeeded' | 'requires_payment_method' | 'requires_action';
        customerId?: string;
        amountGreaterThan?: number;
        amountLessThan?: number;
        currency?: string;
    };
}

export class BillingSearchService {
    /**
     * Generic search method for different Stripe resources
     */
    private async searchBillingData(
        resourceType: 'customers' | 'subscriptions' | 'payment_intents' | 'invoices',
        params: Record<string, any> = {}
    ) {
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
            console.error(`Error searching ${resourceType}:`, error);
            throw new Error(`Failed to search ${resourceType}`);
        }
    }

    /**
     * Search customers with advanced filtering
     */
    async searchCustomers(criteria: SearchCriteria['customers'] = {}) {
        const params: Record<string, any> = {};

        if (criteria.email) {
            params.email = criteria.email;
        }

        const results = await this.searchBillingData('customers', params);

        // Client-side filtering for unsupported API criteria
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
    }

    /**
     * Search subscriptions with filtering
     */
    async searchSubscriptions(criteria: SearchCriteria['subscriptions'] = {}) {
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
    }

    /**
     * Search payments with filtering
     */
    async searchPayments(criteria: SearchCriteria['payments'] = {}) {
        const params: Record<string, any> = {};

        if (criteria.customerId) {
            params.customer = criteria.customerId;
        }

        const results = await this.searchBillingData('payment_intents', params);

        // Client-side filtering
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
    }
}

// Export singleton instance
export const billingSearchService = new BillingSearchService();