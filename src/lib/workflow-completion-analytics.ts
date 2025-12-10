/**
 * Workflow Completion Time Analytics Utility
 * 
 * Provides analytics for workflow completion times including:
 * - Average completion time calculation across all users
 * - Caching for performance
 * - Automatic cache updates on workflow completion
 * 
 * Requirements: 8.5
 */

import { getWorkflowRepository } from '@/aws/dynamodb/workflow-repository';
import { WorkflowStatus, WorkflowInstance } from '@/types/workflows';

/**
 * Cache entry for workflow completion time analytics
 */
interface CompletionTimeCache {
    /** Average completion time in minutes */
    averageMinutes: number;
    /** Number of completed instances used in calculation */
    sampleSize: number;
    /** Timestamp when cache was last updated */
    lastUpdated: string;
    /** TTL for cache entry (1 hour) */
    expiresAt: string;
}

/**
 * In-memory cache for completion time analytics
 * Key: presetId, Value: CompletionTimeCache
 */
const completionTimeCache = new Map<string, CompletionTimeCache>();

/**
 * Cache TTL in milliseconds (1 hour)
 */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Calculates the average completion time for a workflow preset
 * 
 * This function queries all completed instances of a workflow preset
 * across all users and calculates the mean completion time.
 * Results are cached for performance.
 * 
 * @param presetId Workflow preset ID
 * @param forceRefresh If true, bypasses cache and recalculates
 * @returns Average completion time in minutes, or null if no data
 */
export async function getAverageCompletionTime(
    presetId: string,
    forceRefresh: boolean = false
): Promise<number | null> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = getCachedCompletionTime(presetId);
        if (cached !== null) {
            return cached;
        }
    }

    // Calculate average from database
    const average = await calculateAverageCompletionTime(presetId);

    // Cache the result
    if (average !== null) {
        cacheCompletionTime(presetId, average.averageMinutes, average.sampleSize);
    }

    return average?.averageMinutes ?? null;
}

/**
 * Calculates average completion time by querying all completed instances
 * 
 * Note: This queries across all users. In a production system with many users,
 * you might want to implement pagination or use a separate analytics table.
 * 
 * @param presetId Workflow preset ID
 * @returns Average time and sample size, or null if no completed instances
 */
async function calculateAverageCompletionTime(
    presetId: string
): Promise<{ averageMinutes: number; sampleSize: number } | null> {
    const repository = getWorkflowRepository();

    // We need to query across all users, but DynamoDB doesn't support
    // cross-partition queries efficiently. In a real production system,
    // you would either:
    // 1. Use a separate analytics table with presetId as partition key
    // 2. Use DynamoDB Streams to aggregate data into a summary table
    // 3. Use a scheduled job to pre-calculate and cache these values
    //
    // For this implementation, we'll use a scan operation with a filter.
    // This is acceptable for MVP but should be optimized for production.

    try {
        // Get all completed workflow instances for this preset
        // Note: This is a simplified implementation. In production, you'd want
        // to use a GSI with presetId as partition key and status as sort key,
        // or maintain a separate analytics table.
        const completedInstances = await queryCompletedInstancesByPreset(presetId);

        if (completedInstances.length === 0) {
            return null;
        }

        // Filter instances that have actualMinutes recorded
        const instancesWithTime = completedInstances.filter(
            (instance) => instance.actualMinutes !== undefined && instance.actualMinutes > 0
        );

        if (instancesWithTime.length === 0) {
            return null;
        }

        // Calculate mean completion time
        const totalMinutes = instancesWithTime.reduce(
            (sum, instance) => sum + (instance.actualMinutes || 0),
            0
        );

        const averageMinutes = Math.round(totalMinutes / instancesWithTime.length);

        return {
            averageMinutes,
            sampleSize: instancesWithTime.length,
        };
    } catch (error) {
        console.error('Error calculating average completion time:', error);
        return null;
    }
}

/**
 * Queries completed workflow instances for a specific preset
 * 
 * This implementation uses a DynamoDB scan operation to find all completed
 * workflow instances for a specific preset across all users.
 * 
 * IMPORTANT: This is acceptable for MVP but should be optimized for production:
 * 1. Use a GSI with presetId as partition key and status as sort key
 * 2. Or maintain a separate analytics table updated via DynamoDB Streams
 * 3. Or use a scheduled job to pre-calculate and cache these values
 * 
 * The scan operation is expensive and should not be used in high-traffic scenarios.
 * 
 * @param presetId Workflow preset ID
 * @returns Array of completed workflow instances with actualMinutes
 */
async function queryCompletedInstancesByPreset(
    presetId: string
): Promise<Array<{ actualMinutes?: number }>> {
    try {
        // Import DynamoDBRepository to perform scan
        const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
        const dynamoRepository = new DynamoDBRepository();

        // Perform a scan with filter for completed workflows of this preset
        // Note: This scans the entire table, which is expensive
        // The filter checks:
        // 1. presetId matches
        // 2. status is COMPLETED
        // 3. actualMinutes exists and is greater than 0
        const result = await dynamoRepository.scan<WorkflowInstance>({
            filterExpression: '#presetId = :presetId AND #status = :status AND #actualMinutes > :zero',
            expressionAttributeNames: {
                '#presetId': 'presetId',
                '#status': 'status',
                '#actualMinutes': 'actualMinutes',
            },
            expressionAttributeValues: {
                ':presetId': presetId,
                ':status': WorkflowStatus.COMPLETED,
                ':zero': 0,
            },
            limit: 1000, // Limit to prevent excessive scanning
        });

        // Extract actualMinutes from the results
        const instances = result.items || [];
        return instances
            .filter((item) => item.actualMinutes !== undefined && item.actualMinutes > 0)
            .map((item) => ({ actualMinutes: item.actualMinutes }));
    } catch (error) {
        console.error('Error querying completed instances by preset:', error);
        // Return empty array on error - we'll rely on cache updates
        return [];
    }
}

/**
 * Gets cached completion time if available and not expired
 * 
 * @param presetId Workflow preset ID
 * @returns Cached average time in minutes, or null if not cached or expired
 */
function getCachedCompletionTime(presetId: string): number | null {
    const cached = completionTimeCache.get(presetId);

    if (!cached) {
        return null;
    }

    // Check if cache has expired
    const now = new Date().toISOString();
    if (now > cached.expiresAt) {
        // Cache expired, remove it
        completionTimeCache.delete(presetId);
        return null;
    }

    return cached.averageMinutes;
}

/**
 * Caches completion time analytics
 * 
 * @param presetId Workflow preset ID
 * @param averageMinutes Average completion time in minutes
 * @param sampleSize Number of instances in the calculation
 */
function cacheCompletionTime(
    presetId: string,
    averageMinutes: number,
    sampleSize: number
): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    completionTimeCache.set(presetId, {
        averageMinutes,
        sampleSize,
        lastUpdated: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
    });
}

/**
 * Updates the completion time cache when a workflow is completed
 * 
 * This function should be called whenever a workflow is marked as complete.
 * It incrementally updates the cached average using the new completion time.
 * 
 * @param presetId Workflow preset ID
 * @param actualMinutes Actual completion time for the new instance
 */
export async function updateCompletionTimeCache(
    presetId: string,
    actualMinutes: number
): Promise<void> {
    if (!actualMinutes || actualMinutes <= 0) {
        return;
    }

    const cached = completionTimeCache.get(presetId);

    if (!cached) {
        // No cache exists, create initial cache entry
        cacheCompletionTime(presetId, actualMinutes, 1);
        return;
    }

    // Incrementally update the average
    // New average = (old average * old count + new value) / (old count + 1)
    const oldTotal = cached.averageMinutes * cached.sampleSize;
    const newTotal = oldTotal + actualMinutes;
    const newSampleSize = cached.sampleSize + 1;
    const newAverage = Math.round(newTotal / newSampleSize);

    cacheCompletionTime(presetId, newAverage, newSampleSize);
}

/**
 * Clears the completion time cache for a specific preset
 * 
 * @param presetId Workflow preset ID
 */
export function clearCompletionTimeCache(presetId?: string): void {
    if (presetId) {
        completionTimeCache.delete(presetId);
    } else {
        completionTimeCache.clear();
    }
}

/**
 * Gets cache statistics for monitoring
 * 
 * @returns Cache statistics
 */
export function getCompletionTimeCacheStats(): {
    size: number;
    entries: Array<{
        presetId: string;
        averageMinutes: number;
        sampleSize: number;
        lastUpdated: string;
    }>;
} {
    const entries = Array.from(completionTimeCache.entries()).map(
        ([presetId, cache]) => ({
            presetId,
            averageMinutes: cache.averageMinutes,
            sampleSize: cache.sampleSize,
            lastUpdated: cache.lastUpdated,
        })
    );

    return {
        size: completionTimeCache.size,
        entries,
    };
}
