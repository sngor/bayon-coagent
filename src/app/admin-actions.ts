/**
 * Admin Server Actions
 * 
 * Centralized server actions for admin operations
 */

'use server';

import { revalidatePath } from 'next/cache';
import { BillingServiceFactory } from '@/lib/factories/billing-service-factory';
import { handleAdminError, BillingError, AdminErrorCodes } from '@/lib/error-handling/admin-error-handler';
import { BillingMetrics, BillingAnalytics, TimeRange } from '@/lib/types/billing-types';

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

/**
 * Get billing dashboard metrics with caching
 */
export async function getBillingDashboardMetrics(): Promise<ActionResult<BillingMetrics>> {
    try {
        const billingService = BillingServiceFactory.getInstanceWithCache();
        const metrics = await billingService.getBillingDashboardMetrics();

        return {
            success: true,
            data: metrics
        };
    } catch (error) {
        const errorInfo = handleAdminError(error);

        return {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code
        };
    }
}

/**
 * Get billing analytics with time range
 */
export async function getBillingAnalytics(timeRange: TimeRange = '30d'): Promise<ActionResult<BillingAnalytics>> {
    try {
        const billingService = BillingServiceFactory.getInstanceWithCache();
        const analytics = await billingService.getBillingAnalytics(timeRange);

        return {
            success: true,
            data: analytics
        };
    } catch (error) {
        const errorInfo = handleAdminError(error);

        return {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code
        };
    }
}

/**
 * Search billing data with criteria
 */
export async function searchBillingData(
    type: 'customers' | 'subscriptions' | 'payments',
    criteria: Record<string, any>
): Promise<ActionResult<any[]>> {
    try {
        const billingService = BillingServiceFactory.getInstanceWithCache();

        let results;
        switch (type) {
            case 'customers':
                results = await billingService.searchCustomers(criteria);
                break;
            case 'subscriptions':
                results = await billingService.searchSubscriptions(criteria);
                break;
            case 'payments':
                results = await billingService.searchPayments(criteria);
                break;
            default:
                throw new BillingError(
                    'Invalid search type',
                    AdminErrorCodes.VALIDATION_ERROR,
                    400
                );
        }

        return {
            success: true,
            data: results
        };
    } catch (error) {
        const errorInfo = handleAdminError(error);

        return {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code
        };
    }
}

/**
 * Retry failed payment
 */
export async function retryFailedPayment(invoiceId: string): Promise<ActionResult<boolean>> {
    try {
        if (!invoiceId) {
            throw new BillingError(
                'Invoice ID is required',
                AdminErrorCodes.VALIDATION_ERROR,
                400
            );
        }

        const billingService = BillingServiceFactory.getInstance();
        const success = await billingService.retryPayment(invoiceId);

        // Revalidate billing pages
        revalidatePath('/super-admin/billing');

        return {
            success: true,
            data: success
        };
    } catch (error) {
        const errorInfo = handleAdminError(error);

        return {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code
        };
    }
}

/**
 * Cancel subscription
 */
export async function cancelUserSubscription(
    subscriptionId: string,
    adminId: string,
    reason?: string
): Promise<ActionResult<void>> {
    try {
        if (!subscriptionId || !adminId) {
            throw new BillingError(
                'Subscription ID and Admin ID are required',
                AdminErrorCodes.VALIDATION_ERROR,
                400
            );
        }

        const billingService = BillingServiceFactory.getInstance();
        await billingService.cancelSubscription(subscriptionId, adminId);

        // Revalidate billing pages
        revalidatePath('/super-admin/billing');

        return {
            success: true
        };
    } catch (error) {
        const errorInfo = handleAdminError(error);

        return {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code
        };
    }
}