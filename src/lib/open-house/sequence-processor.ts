/**
 * Follow-up Sequence Processor
 * 
 * Background service for processing sequence touchpoints.
 * This service checks for pending touchpoints and executes them.
 * 
 * Validates Requirements: 15.3
 */

import { getPendingTouchpoints, executeTouchpoint } from '@/app/(app)/open-house/actions';

/**
 * Processes all pending touchpoints for all users
 * This function should be called periodically (e.g., every 5 minutes)
 * by a cron job or scheduled task
 */
export async function processAllPendingTouchpoints(): Promise<{
    processed: number;
    failed: number;
    errors: string[];
}> {
    const results = {
        processed: 0,
        failed: 0,
        errors: [] as string[],
    };

    try {
        // Get all pending touchpoints
        const { enrollments, error } = await getPendingTouchpoints();

        if (error) {
            results.errors.push(`Failed to fetch pending touchpoints: ${error}`);
            return results;
        }

        // Process each enrollment
        for (const enrollment of enrollments) {
            try {
                const result = await executeTouchpoint(enrollment.enrollmentId);

                if (result.success) {
                    results.processed++;
                } else {
                    results.failed++;
                    results.errors.push(
                        `Failed to execute touchpoint for enrollment ${enrollment.enrollmentId}: ${result.error}`
                    );
                }
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Error processing enrollment ${enrollment.enrollmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        return results;
    } catch (error) {
        results.errors.push(
            `Fatal error in processAllPendingTouchpoints: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return results;
    }
}

/**
 * Processes pending touchpoints for a specific user
 * This can be called on-demand or as part of a user-specific workflow
 */
export async function processPendingTouchpointsForUser(userId: string): Promise<{
    processed: number;
    failed: number;
    errors: string[];
}> {
    const results = {
        processed: 0,
        failed: 0,
        errors: [] as string[],
    };

    try {
        // Get pending touchpoints for the user
        const { enrollments, error } = await getPendingTouchpoints();

        if (error) {
            results.errors.push(`Failed to fetch pending touchpoints: ${error}`);
            return results;
        }

        // Filter for this user's enrollments
        const userEnrollments = enrollments.filter(e => e.userId === userId);

        // Process each enrollment
        for (const enrollment of userEnrollments) {
            try {
                const result = await executeTouchpoint(enrollment.enrollmentId);

                if (result.success) {
                    results.processed++;
                } else {
                    results.failed++;
                    results.errors.push(
                        `Failed to execute touchpoint for enrollment ${enrollment.enrollmentId}: ${result.error}`
                    );
                }
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Error processing enrollment ${enrollment.enrollmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        return results;
    } catch (error) {
        results.errors.push(
            `Fatal error in processPendingTouchpointsForUser: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return results;
    }
}

/**
 * Checks if a touchpoint is due for execution
 * Helper function for testing and validation
 */
export function isTouchpointDue(nextTouchpointAt: string | undefined): boolean {
    if (!nextTouchpointAt) {
        return false;
    }

    const now = new Date();
    const touchpointTime = new Date(nextTouchpointAt);

    return touchpointTime <= now;
}

/**
 * Calculates the next touchpoint execution time
 * Helper function for testing and validation
 */
export function calculateNextTouchpointTime(delayMinutes: number): string {
    const now = new Date();
    const nextTime = new Date(now.getTime() + delayMinutes * 60 * 1000);
    return nextTime.toISOString();
}
