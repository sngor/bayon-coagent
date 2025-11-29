/**
 * Server Actions for Cost Tracking
 * 
 * Provides server-side actions for retrieving cost metrics and reports.
 */

'use server';

import { getCurrentUser } from '@/aws/auth/cognito-client';
import {
    queryExecutionLogs,
    getExecutionLogStats,
} from '@/aws/bedrock/cost-storage';
import {
    generateDashboardMetrics,
    generateCostComparison,
    aggregateFeatureCosts,
    type CostDashboardMetrics,
    type CostComparison,
    type FeatureCostSummary,
} from '@/aws/bedrock/cost-tracker';

/**
 * Get cost dashboard metrics for the current user
 */
export async function getCostDashboardMetrics(
    daysToInclude: number = 30
): Promise<{
    success: boolean;
    data?: CostDashboardMetrics;
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Query execution logs for the specified period
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToInclude);

        const logs = await queryExecutionLogs(user.id, startDate, endDate);

        // Generate dashboard metrics
        const metrics = generateDashboardMetrics(logs, daysToInclude);

        return { success: true, data: metrics };
    } catch (error) {
        console.error('Failed to get cost dashboard metrics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get feature cost summary for the current user
 */
export async function getFeatureCostSummary(
    daysToInclude: number = 30
): Promise<{
    success: boolean;
    data?: Record<string, FeatureCostSummary>;
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Query execution logs for the specified period
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToInclude);

        const logs = await queryExecutionLogs(user.id, startDate, endDate);

        // Aggregate feature costs
        const featureCosts = aggregateFeatureCosts(logs);

        return { success: true, data: featureCosts };
    } catch (error) {
        console.error('Failed to get feature cost summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate cost comparison report between two periods
 */
export async function getCostComparison(
    beforeDays: number = 60,
    afterDays: number = 30
): Promise<{
    success: boolean;
    data?: CostComparison;
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Query logs for "before" period
        const beforeEndDate = new Date();
        beforeEndDate.setDate(beforeEndDate.getDate() - afterDays);
        const beforeStartDate = new Date(beforeEndDate);
        beforeStartDate.setDate(beforeStartDate.getDate() - beforeDays);

        const beforeLogs = await queryExecutionLogs(
            user.id,
            beforeStartDate,
            beforeEndDate
        );

        // Query logs for "after" period (most recent)
        const afterEndDate = new Date();
        const afterStartDate = new Date();
        afterStartDate.setDate(afterStartDate.getDate() - afterDays);

        const afterLogs = await queryExecutionLogs(
            user.id,
            afterStartDate,
            afterEndDate
        );

        // Generate comparison
        const comparison = generateCostComparison(
            beforeLogs,
            afterLogs,
            `Last ${afterDays} days vs Previous ${beforeDays} days`
        );

        return { success: true, data: comparison };
    } catch (error) {
        console.error('Failed to generate cost comparison:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get execution log statistics
 */
export async function getExecutionStats(
    days: number = 30
): Promise<{
    success: boolean;
    data?: {
        totalLogs: number;
        successfulLogs: number;
        failedLogs: number;
        dateRange: { start: string; end: string };
    };
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const stats = await getExecutionLogStats(user.id, days);

        return { success: true, data: stats };
    } catch (error) {
        console.error('Failed to get execution stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

