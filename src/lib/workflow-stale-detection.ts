/**
 * Stale Workflow Detection Utility
 * 
 * Provides functionality to detect and mark workflows that have been
 * inactive for more than 30 days as stale.
 * 
 * Can be run:
 * - On dashboard load (client-side trigger)
 * - As a scheduled job (server-side cron)
 * - Manually via admin action
 * 
 * Requirements: 7.4, 7.5
 */

import { getWorkflowRepository } from '@/aws/dynamodb/workflow-repository';
import { WorkflowStatus } from '@/types/workflows';
import { getWorkflowAnalyticsService } from './workflow-analytics';
import { workflowPresetService } from '@/services/workflow-preset-service';

/**
 * Number of days of inactivity before a workflow is considered stale
 */
export const STALE_THRESHOLD_DAYS = 30;

/**
 * Result of stale workflow detection
 */
export interface StaleDetectionResult {
    /** Number of workflows marked as stale */
    staleCount: number;
    /** Total number of active workflows checked */
    totalActive: number;
    /** Timestamp when detection was run */
    timestamp: string;
    /** User ID for which detection was run */
    userId: string;
}

/**
 * Calculates the number of days since a workflow was last active
 * 
 * @param lastActiveAt ISO timestamp of last activity
 * @returns Number of days since last active
 */
export function calculateDaysSinceLastActive(lastActiveAt: string): number {
    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Checks if a workflow should be marked as stale
 * 
 * @param lastActiveAt ISO timestamp of last activity
 * @param thresholdDays Number of days threshold (default: 30)
 * @returns True if workflow is stale
 */
export function isWorkflowStale(
    lastActiveAt: string,
    thresholdDays: number = STALE_THRESHOLD_DAYS
): boolean {
    const daysSinceActive = calculateDaysSinceLastActive(lastActiveAt);
    return daysSinceActive > thresholdDays;
}

/**
 * Detects and marks stale workflows for a user
 * 
 * This function:
 * 1. Queries all active workflows for the user
 * 2. Calculates days since last active for each
 * 3. Marks workflows inactive >30 days as stale
 * 4. Updates workflow status in database
 * 
 * @param userId User ID to check workflows for
 * @returns Detection result with count of stale workflows
 */
export async function detectAndMarkStaleWorkflows(
    userId: string
): Promise<StaleDetectionResult> {
    const repository = getWorkflowRepository();

    // Get all active workflows for the user
    const activeWorkflows = await repository.getUserWorkflowInstances(userId, {
        status: WorkflowStatus.ACTIVE,
    });

    const totalActive = activeWorkflows.length;
    let staleCount = 0;

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS);
    const thresholdISO = thresholdDate.toISOString();

    // Check each workflow and mark as stale if needed
    const analytics = getWorkflowAnalyticsService();

    for (const workflow of activeWorkflows) {
        if (workflow.lastActiveAt < thresholdISO) {
            await repository.updateWorkflowInstance(userId, workflow.id, {
                status: WorkflowStatus.STALE,
            });
            staleCount++;

            // Track workflow abandonment event
            const daysSinceActive = calculateDaysSinceLastActive(workflow.lastActiveAt);
            const preset = workflowPresetService.getPresetById(workflow.presetId);
            if (preset) {
                analytics.trackWorkflowAbandonment(userId, workflow, preset, daysSinceActive);
            }
        }
    }

    return {
        staleCount,
        totalActive,
        timestamp: new Date().toISOString(),
        userId,
    };
}

/**
 * Detects stale workflows without marking them (read-only check)
 * 
 * Useful for displaying stale workflow count without modifying data.
 * 
 * @param userId User ID to check workflows for
 * @returns Array of workflow IDs that are stale
 */
export async function detectStaleWorkflows(
    userId: string
): Promise<string[]> {
    const repository = getWorkflowRepository();

    // Get all active workflows for the user
    const activeWorkflows = await repository.getUserWorkflowInstances(userId, {
        status: WorkflowStatus.ACTIVE,
    });

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS);
    const thresholdISO = thresholdDate.toISOString();

    // Filter stale workflows
    const staleWorkflowIds = activeWorkflows
        .filter(workflow => workflow.lastActiveAt < thresholdISO)
        .map(workflow => workflow.id);

    return staleWorkflowIds;
}

/**
 * Gets statistics about workflow staleness for a user
 * 
 * @param userId User ID to get statistics for
 * @returns Statistics object with counts and percentages
 */
export async function getStaleWorkflowStats(userId: string): Promise<{
    totalActive: number;
    staleCount: number;
    stalePercentage: number;
    averageDaysSinceActive: number;
}> {
    const repository = getWorkflowRepository();

    // Get all active workflows for the user
    const activeWorkflows = await repository.getUserWorkflowInstances(userId, {
        status: WorkflowStatus.ACTIVE,
    });

    const totalActive = activeWorkflows.length;

    if (totalActive === 0) {
        return {
            totalActive: 0,
            staleCount: 0,
            stalePercentage: 0,
            averageDaysSinceActive: 0,
        };
    }

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS);
    const thresholdISO = thresholdDate.toISOString();

    // Count stale workflows and calculate average days
    let staleCount = 0;
    let totalDays = 0;

    for (const workflow of activeWorkflows) {
        const daysSinceActive = calculateDaysSinceLastActive(workflow.lastActiveAt);
        totalDays += daysSinceActive;

        if (workflow.lastActiveAt < thresholdISO) {
            staleCount++;
        }
    }

    const stalePercentage = (staleCount / totalActive) * 100;
    const averageDaysSinceActive = totalDays / totalActive;

    return {
        totalActive,
        staleCount,
        stalePercentage: Math.round(stalePercentage * 10) / 10, // Round to 1 decimal
        averageDaysSinceActive: Math.round(averageDaysSinceActive * 10) / 10,
    };
}

/**
 * Batch processes stale workflow detection for multiple users
 * 
 * Useful for scheduled jobs that need to process all users.
 * 
 * @param userIds Array of user IDs to process
 * @returns Array of detection results for each user
 */
export async function batchDetectStaleWorkflows(
    userIds: string[]
): Promise<StaleDetectionResult[]> {
    const results: StaleDetectionResult[] = [];

    for (const userId of userIds) {
        try {
            const result = await detectAndMarkStaleWorkflows(userId);
            results.push(result);
        } catch (error) {
            console.error(`Failed to detect stale workflows for user ${userId}:`, error);
            // Continue processing other users even if one fails
            results.push({
                staleCount: 0,
                totalActive: 0,
                timestamp: new Date().toISOString(),
                userId,
            });
        }
    }

    return results;
}
