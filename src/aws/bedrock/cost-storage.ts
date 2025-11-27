/**
 * Cost Storage Module
 * 
 * Provides storage and retrieval of execution logs for cost analysis.
 * In production, this would integrate with DynamoDB or CloudWatch Logs Insights.
 */

import type { FlowExecutionLog } from './execution-logger';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Storage key patterns for execution logs
 */
const EXECUTION_LOG_PREFIX = 'EXECUTION_LOG';

/**
 * Store an execution log
 * In production, this would write to DynamoDB or CloudWatch
 */
export async function storeExecutionLog(
    log: FlowExecutionLog,
    userId?: string
): Promise<void> {
    if (!userId) {
        // If no userId, just log to console (for system-level operations)
        console.log('[Cost Tracking] Execution log:', log);
        return;
    }

    try {
        const repository = getRepository();

        // Store in DynamoDB with timestamp-based SK for time-series queries
        await repository.put({
            PK: `USER#${userId}`,
            SK: `${EXECUTION_LOG_PREFIX}#${log.timestamp}#${log.flowName}`,
            type: 'execution-log',
            ...log,
            userId,
        });
    } catch (error) {
        console.error('[Cost Tracking] Failed to store execution log:', error);
        // Don't throw - logging failures shouldn't break the main flow
    }
}

/**
 * Query execution logs for a user within a date range
 */
export async function queryExecutionLogs(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<FlowExecutionLog[]> {
    try {
        const repository = getRepository();

        const startTimestamp = startDate.toISOString();
        const endTimestamp = endDate.toISOString();

        // Query logs within the date range
        const items = await repository.query({
            PK: `USER#${userId}`,
            SK: {
                $between: [
                    `${EXECUTION_LOG_PREFIX}#${startTimestamp}`,
                    `${EXECUTION_LOG_PREFIX}#${endTimestamp}`,
                ],
            },
        });

        // Filter and map to FlowExecutionLog
        return items
            .filter(item => item.type === 'execution-log')
            .map(item => ({
                timestamp: item.timestamp,
                flowName: item.flowName,
                modelId: item.modelId,
                executionTimeMs: item.executionTimeMs,
                tokenUsage: item.tokenUsage,
                success: item.success,
                error: item.error,
                metadata: item.metadata,
            }));
    } catch (error) {
        console.error('[Cost Tracking] Failed to query execution logs:', error);
        return [];
    }
}

/**
 * Query execution logs for all users (admin only)
 * In production, this would use a GSI or separate aggregation table
 */
export async function queryAllExecutionLogs(
    startDate: Date,
    endDate: Date
): Promise<FlowExecutionLog[]> {
    // This is a simplified implementation
    // In production, you'd want a GSI on timestamp or a separate aggregation table
    console.warn('[Cost Tracking] queryAllExecutionLogs is not fully implemented for production');
    return [];
}

/**
 * Delete old execution logs (for data retention)
 */
export async function deleteOldExecutionLogs(
    userId: string,
    beforeDate: Date
): Promise<number> {
    try {
        const repository = getRepository();

        const beforeTimestamp = beforeDate.toISOString();

        // Query logs before the date
        const items = await repository.query({
            PK: `USER#${userId}`,
            SK: {
                $between: [
                    `${EXECUTION_LOG_PREFIX}#`,
                    `${EXECUTION_LOG_PREFIX}#${beforeTimestamp}`,
                ],
            },
        });

        // Delete each log
        let deletedCount = 0;
        for (const item of items) {
            if (item.type === 'execution-log') {
                await repository.delete({
                    PK: item.PK,
                    SK: item.SK,
                });
                deletedCount++;
            }
        }

        return deletedCount;
    } catch (error) {
        console.error('[Cost Tracking] Failed to delete old execution logs:', error);
        return 0;
    }
}

/**
 * Get execution log statistics for a user
 */
export async function getExecutionLogStats(
    userId: string,
    days: number = 30
): Promise<{
    totalLogs: number;
    successfulLogs: number;
    failedLogs: number;
    dateRange: { start: string; end: string };
}> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await queryExecutionLogs(userId, startDate, endDate);

    return {
        totalLogs: logs.length,
        successfulLogs: logs.filter(log => log.success).length,
        failedLogs: logs.filter(log => !log.success).length,
        dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        },
    };
}

