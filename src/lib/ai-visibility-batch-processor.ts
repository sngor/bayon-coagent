/**
 * AI Visibility Batch Processor
 * 
 * Optimizes batch processing for multiple agents
 * Implements parallel processing with rate limiting and error handling
 */

import { AIMonitoringScheduler } from './ai-monitoring-scheduler';
import type { MonitoringExecutionResult } from './ai-monitoring-scheduler';

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
    /**
     * Maximum number of concurrent jobs
     */
    maxConcurrency?: number;

    /**
     * Delay between batches in milliseconds
     */
    batchDelay?: number;

    /**
     * Continue processing on error
     */
    continueOnError?: boolean;

    /**
     * Callback for progress updates
     */
    onProgress?: (completed: number, total: number, userId: string) => void;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
    /**
     * Total users processed
     */
    totalProcessed: number;

    /**
     * Successful executions
     */
    successful: number;

    /**
     * Failed executions
     */
    failed: number;

    /**
     * Results per user
     */
    results: Array<{
        userId: string;
        success: boolean;
        result?: MonitoringExecutionResult;
        error?: string;
    }>;

    /**
     * Total execution time in milliseconds
     */
    executionTime: number;
}

/**
 * AI Visibility Batch Processor
 * Handles batch processing of monitoring jobs for multiple users
 */
export class AIVisibilityBatchProcessor {
    private readonly scheduler: AIMonitoringScheduler;
    private readonly DEFAULT_MAX_CONCURRENCY = 5;
    private readonly DEFAULT_BATCH_DELAY = 1000; // 1 second

    constructor(scheduler?: AIMonitoringScheduler) {
        this.scheduler = scheduler || new AIMonitoringScheduler();
    }

    /**
     * Process monitoring for multiple users in batches
     * @param userIds Array of user IDs to process
     * @param options Batch processing options
     * @returns Batch processing result
     */
    async processBatch(
        userIds: string[],
        options: BatchProcessingOptions = {}
    ): Promise<BatchProcessingResult> {
        const startTime = Date.now();
        const maxConcurrency = options.maxConcurrency || this.DEFAULT_MAX_CONCURRENCY;
        const batchDelay = options.batchDelay || this.DEFAULT_BATCH_DELAY;
        const continueOnError = options.continueOnError ?? true;

        const results: BatchProcessingResult['results'] = [];
        let successful = 0;
        let failed = 0;

        console.log(
            `[AIVisibilityBatchProcessor] Starting batch processing for ${userIds.length} users (concurrency: ${maxConcurrency})`
        );

        // Process users in batches
        for (let i = 0; i < userIds.length; i += maxConcurrency) {
            const batch = userIds.slice(i, i + maxConcurrency);

            console.log(
                `[AIVisibilityBatchProcessor] Processing batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(userIds.length / maxConcurrency)} (${batch.length} users)`
            );

            // Process batch in parallel
            const batchPromises = batch.map(async (userId) => {
                try {
                    const result = await this.scheduler.executeMonitoring(userId);

                    successful++;
                    results.push({
                        userId,
                        success: true,
                        result,
                    });

                    // Call progress callback
                    if (options.onProgress) {
                        options.onProgress(successful + failed, userIds.length, userId);
                    }

                    console.log(
                        `[AIVisibilityBatchProcessor] Successfully processed user ${userId}: ${result.queriesExecuted} queries, ${result.mentionsFound} mentions`
                    );

                    return { userId, success: true, result };
                } catch (error) {
                    failed++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                    results.push({
                        userId,
                        success: false,
                        error: errorMessage,
                    });

                    // Call progress callback
                    if (options.onProgress) {
                        options.onProgress(successful + failed, userIds.length, userId);
                    }

                    console.error(
                        `[AIVisibilityBatchProcessor] Failed to process user ${userId}:`,
                        error
                    );

                    if (!continueOnError) {
                        throw error;
                    }

                    return { userId, success: false, error: errorMessage };
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);

            // Delay between batches (except for last batch)
            if (i + maxConcurrency < userIds.length) {
                console.log(
                    `[AIVisibilityBatchProcessor] Waiting ${batchDelay}ms before next batch...`
                );
                await this.delay(batchDelay);
            }
        }

        const executionTime = Date.now() - startTime;

        console.log(
            `[AIVisibilityBatchProcessor] Batch processing complete: ${successful} successful, ${failed} failed, ${executionTime}ms total`
        );

        return {
            totalProcessed: userIds.length,
            successful,
            failed,
            results,
            executionTime,
        };
    }

    /**
     * Process monitoring for users with priority
     * Active users are processed first
     * @param userIds Array of user IDs with priority flags
     * @param options Batch processing options
     * @returns Batch processing result
     */
    async processBatchWithPriority(
        userIds: Array<{ userId: string; priority: 'high' | 'normal' | 'low' }>,
        options: BatchProcessingOptions = {}
    ): Promise<BatchProcessingResult> {
        // Sort by priority
        const sortedUsers = [...userIds].sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        console.log(
            `[AIVisibilityBatchProcessor] Processing ${sortedUsers.length} users with priority (${sortedUsers.filter(u => u.priority === 'high').length} high, ${sortedUsers.filter(u => u.priority === 'normal').length} normal, ${sortedUsers.filter(u => u.priority === 'low').length} low)`
        );

        return this.processBatch(
            sortedUsers.map(u => u.userId),
            options
        );
    }

    /**
     * Get recommended batch size based on system load
     * @returns Recommended batch size
     */
    getRecommendedBatchSize(): number {
        // In production, this could check system metrics
        // For now, return a conservative default
        return this.DEFAULT_MAX_CONCURRENCY;
    }

    /**
     * Estimate batch processing time
     * @param userCount Number of users to process
     * @param avgTimePerUser Average time per user in milliseconds
     * @param concurrency Concurrency level
     * @returns Estimated time in milliseconds
     */
    estimateBatchTime(
        userCount: number,
        avgTimePerUser: number = 30000, // 30 seconds default
        concurrency: number = this.DEFAULT_MAX_CONCURRENCY
    ): number {
        const batches = Math.ceil(userCount / concurrency);
        const batchTime = avgTimePerUser; // Parallel execution
        const delayTime = (batches - 1) * this.DEFAULT_BATCH_DELAY;

        return (batches * batchTime) + delayTime;
    }

    /**
     * Delay execution
     * @param ms Milliseconds to delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create a batch processor instance
 * @returns AIVisibilityBatchProcessor instance
 */
export function createBatchProcessor(): AIVisibilityBatchProcessor {
    return new AIVisibilityBatchProcessor();
}
