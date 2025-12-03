/**
 * Fallback Manager
 * 
 * Manages fallback strategies when primary strands fail, including
 * automatic retry logic, strategy selection, and fallback tracking.
 * Requirement: 10.2
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import type {
    RoutingContext,
    FallbackStrategy,
} from './types';

/**
 * Fallback execution result
 */
export interface FallbackResult {
    /** Whether fallback succeeded */
    success: boolean;

    /** Result from fallback execution (if successful) */
    result?: WorkerResult;

    /** Strategy that was used */
    strategy: FallbackStrategy;

    /** Number of attempts made */
    attempts: number;

    /** Total time spent in ms */
    totalTime: number;

    /** Error if fallback failed */
    error?: Error;

    /** Execution history */
    history: FallbackAttempt[];
}

/**
 * Individual fallback attempt
 */
export interface FallbackAttempt {
    /** Attempt number */
    attemptNumber: number;

    /** Strategy used */
    strategy: FallbackStrategy;

    /** Strand used (if any) */
    strand?: AgentStrand;

    /** Success status */
    success: boolean;

    /** Execution time in ms */
    executionTime: number;

    /** Error if failed */
    error?: string;

    /** Timestamp */
    timestamp: string;
}

/**
 * Fallback tracking record
 */
export interface FallbackTrackingRecord {
    /** Record ID */
    id: string;

    /** Task ID */
    taskId: string;

    /** User ID */
    userId: string;

    /** Failed strand */
    failedStrand: AgentStrand;

    /** Fallback result */
    result: FallbackResult;

    /** Context */
    context: RoutingContext;

    /** Created at */
    createdAt: string;
}

/**
 * Fallback statistics
 */
export interface FallbackStatistics {
    /** Total fallback attempts */
    totalAttempts: number;

    /** Successful fallbacks */
    successfulFallbacks: number;

    /** Failed fallbacks */
    failedFallbacks: number;

    /** Success rate */
    successRate: number;

    /** Average attempts per fallback */
    avgAttemptsPerFallback: number;

    /** Average fallback time in ms */
    avgFallbackTime: number;

    /** Most common failure reasons */
    commonFailureReasons: Array<{ reason: string; count: number }>;

    /** Most effective strategies */
    effectiveStrategies: Array<{ strategyId: string; successRate: number }>;

    /** Time period */
    period: {
        start: string;
        end: string;
    };
}

/**
 * Fallback Manager Configuration
 */
export interface FallbackManagerConfig {
    /** Maximum fallback attempts */
    maxAttempts: number;

    /** Enable exponential backoff */
    enableBackoff: boolean;

    /** Initial backoff delay in ms */
    initialBackoffMs: number;

    /** Maximum backoff delay in ms */
    maxBackoffMs: number;

    /** Backoff multiplier */
    backoffMultiplier: number;

    /** Enable fallback tracking */
    enableTracking: boolean;

    /** Tracking retention days */
    trackingRetentionDays: number;

    /** Enable strategy learning */
    enableStrategyLearning: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FallbackManagerConfig = {
    maxAttempts: 3,
    enableBackoff: true,
    initialBackoffMs: 1000,
    maxBackoffMs: 10000,
    backoffMultiplier: 2,
    enableTracking: true,
    trackingRetentionDays: 30,
    enableStrategyLearning: true,
};

/**
 * Fallback Manager
 * 
 * Manages fallback execution when primary strands fail:
 * - Selects appropriate fallback strategies
 * - Executes retries with exponential backoff
 * - Tracks fallback performance
 * - Learns from fallback outcomes
 */
export class FallbackManager {
    private config: FallbackManagerConfig;
    private strategies: Map<string, FallbackStrategy> = new Map();
    private trackingRecords: Map<string, FallbackTrackingRecord> = new Map();
    private strategyPerformance: Map<string, { attempts: number; successes: number }> = new Map();

    constructor(config?: Partial<FallbackManagerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeDefaultStrategies();
    }

    /**
     * Execute fallback for a failed task
     * Requirement 10.2
     */
    async executeFallback(
        failedStrand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext,
        error: Error
    ): Promise<FallbackResult> {
        const startTime = Date.now();
        const history: FallbackAttempt[] = [];

        console.log(`[FallbackManager] Starting fallback for task ${task.id} after ${failedStrand.type} failure`);

        // Select fallback strategies
        const strategies = this.selectFallbackStrategies(failedStrand, task, context, error);

        if (strategies.length === 0) {
            console.log(`[FallbackManager] No fallback strategies available for task ${task.id}`);
            return {
                success: false,
                strategy: this.createEmptyStrategy(),
                attempts: 0,
                totalTime: Date.now() - startTime,
                error: new Error('No fallback strategies available'),
                history,
            };
        }

        // Try each strategy
        for (let i = 0; i < Math.min(strategies.length, this.config.maxAttempts); i++) {
            const strategy = strategies[i];
            const attemptNumber = i + 1;

            console.log(`[FallbackManager] Attempt ${attemptNumber}/${this.config.maxAttempts}: ${strategy.name}`);

            // Apply backoff delay (except for first attempt)
            if (i > 0 && this.config.enableBackoff && strategy.retryWithBackoff) {
                const delay = this.calculateBackoffDelay(i, strategy.retryWithBackoff);
                console.log(`[FallbackManager] Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }

            // Execute the fallback strategy
            const attemptStartTime = Date.now();
            try {
                const result = await this.executeStrategy(strategy, task, context);
                const executionTime = Date.now() - attemptStartTime;

                // Record successful attempt
                history.push({
                    attemptNumber,
                    strategy,
                    strand: strategy.alternativeStrand,
                    success: true,
                    executionTime,
                    timestamp: new Date().toISOString(),
                });

                // Update strategy performance
                this.updateStrategyPerformance(strategy.id, true);

                const totalTime = Date.now() - startTime;
                console.log(`[FallbackManager] Fallback succeeded on attempt ${attemptNumber} (${totalTime}ms total)`);

                const fallbackResult: FallbackResult = {
                    success: true,
                    result,
                    strategy,
                    attempts: attemptNumber,
                    totalTime,
                    history,
                };

                // Track the fallback
                if (this.config.enableTracking) {
                    await this.trackFallback(failedStrand, task, context, fallbackResult);
                }

                return fallbackResult;

            } catch (attemptError) {
                const executionTime = Date.now() - attemptStartTime;
                const errorMessage = attemptError instanceof Error ? attemptError.message : String(attemptError);

                console.log(`[FallbackManager] Attempt ${attemptNumber} failed: ${errorMessage}`);

                // Record failed attempt
                history.push({
                    attemptNumber,
                    strategy,
                    strand: strategy.alternativeStrand,
                    success: false,
                    executionTime,
                    error: errorMessage,
                    timestamp: new Date().toISOString(),
                });

                // Update strategy performance
                this.updateStrategyPerformance(strategy.id, false);

                // Continue to next strategy
                continue;
            }
        }

        // All strategies failed
        const totalTime = Date.now() - startTime;
        console.log(`[FallbackManager] All fallback strategies exhausted for task ${task.id}`);

        const fallbackResult: FallbackResult = {
            success: false,
            strategy: strategies[0],
            attempts: history.length,
            totalTime,
            error: new Error('All fallback strategies failed'),
            history,
        };

        // Track the failed fallback
        if (this.config.enableTracking) {
            await this.trackFallback(failedStrand, task, context, fallbackResult);
        }

        return fallbackResult;
    }

    /**
     * Select appropriate fallback strategies
     * Requirement 10.2
     */
    selectFallbackStrategies(
        failedStrand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext,
        error: Error
    ): FallbackStrategy[] {
        const strategies: FallbackStrategy[] = [];

        // Strategy 1: Retry with same strand (for transient errors)
        if (this.isTransientError(error)) {
            strategies.push(this.createRetryStrategy(failedStrand, task));
        }

        // Strategy 2: Try alternative strand of same type
        const alternativeStrandStrategy = this.strategies.get(`${failedStrand.type}_alternative`);
        if (alternativeStrandStrategy) {
            strategies.push(alternativeStrandStrategy);
        }

        // Strategy 3: Simplify task and retry
        if (this.canSimplifyTask(task)) {
            strategies.push(this.createSimplifiedTaskStrategy(failedStrand, task));
        }

        // Strategy 4: Route to human review (if available)
        if (context.humanReviewAvailable) {
            strategies.push(this.createHumanReviewStrategy());
        }

        // Strategy 5: Use fallback model (simpler/cheaper)
        strategies.push(this.createFallbackModelStrategy(failedStrand, task));

        // Sort strategies by historical performance
        if (this.config.enableStrategyLearning) {
            strategies.sort((a, b) => {
                const perfA = this.getStrategySuccessRate(a.id);
                const perfB = this.getStrategySuccessRate(b.id);
                return perfB - perfA;
            });
        }

        return strategies;
    }

    /**
     * Execute a specific fallback strategy
     */
    private async executeStrategy(
        strategy: FallbackStrategy,
        task: WorkerTask,
        context: RoutingContext
    ): Promise<WorkerResult> {
        // Route to human review
        if (strategy.routeToHuman) {
            return this.routeToHumanReview(task, context);
        }

        // Use alternative strand
        if (strategy.alternativeStrand) {
            return this.executeWithAlternativeStrand(strategy.alternativeStrand, task, context);
        }

        // Modify task and retry
        if (strategy.modifiedTask) {
            const modifiedTask = { ...task, ...strategy.modifiedTask };
            return this.executeModifiedTask(modifiedTask, context);
        }

        // Simplify model
        if (strategy.simplifyModel) {
            return this.executeWithSimplifiedModel(task, context);
        }

        throw new Error(`Unknown fallback strategy: ${strategy.name}`);
    }

    /**
     * Track fallback execution
     * Requirement 10.2
     */
    private async trackFallback(
        failedStrand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext,
        result: FallbackResult
    ): Promise<void> {
        const record: FallbackTrackingRecord = {
            id: this.generateTrackingId(),
            taskId: task.id,
            userId: context.userId,
            failedStrand,
            result,
            context,
            createdAt: new Date().toISOString(),
        };

        this.trackingRecords.set(record.id, record);

        // In production, persist to DynamoDB
        // await this.persistTrackingRecord(record);

        // Clean up old records
        this.cleanupOldRecords();
    }

    /**
     * Get fallback statistics
     */
    async getStatistics(startDate: string, endDate: string): Promise<FallbackStatistics> {
        const records = Array.from(this.trackingRecords.values()).filter(
            record => record.createdAt >= startDate && record.createdAt <= endDate
        );

        const totalAttempts = records.length;
        const successfulFallbacks = records.filter(r => r.result.success).length;
        const failedFallbacks = totalAttempts - successfulFallbacks;
        const successRate = totalAttempts > 0 ? successfulFallbacks / totalAttempts : 0;

        // Calculate average attempts
        const totalAttemptsSum = records.reduce((sum, r) => sum + r.result.attempts, 0);
        const avgAttemptsPerFallback = totalAttempts > 0 ? totalAttemptsSum / totalAttempts : 0;

        // Calculate average time
        const totalTimeSum = records.reduce((sum, r) => sum + r.result.totalTime, 0);
        const avgFallbackTime = totalAttempts > 0 ? totalTimeSum / totalAttempts : 0;

        // Find common failure reasons
        const failureReasons = new Map<string, number>();
        records.filter(r => !r.result.success).forEach(record => {
            const reason = record.result.error?.message || 'Unknown error';
            failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
        });

        const commonFailureReasons = Array.from(failureReasons.entries())
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Calculate strategy effectiveness
        const strategyStats = new Map<string, { attempts: number; successes: number }>();
        records.forEach(record => {
            const strategyId = record.result.strategy.id;
            const stats = strategyStats.get(strategyId) || { attempts: 0, successes: 0 };
            stats.attempts++;
            if (record.result.success) {
                stats.successes++;
            }
            strategyStats.set(strategyId, stats);
        });

        const effectiveStrategies = Array.from(strategyStats.entries())
            .map(([strategyId, stats]) => ({
                strategyId,
                successRate: stats.attempts > 0 ? stats.successes / stats.attempts : 0,
            }))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);

        return {
            totalAttempts,
            successfulFallbacks,
            failedFallbacks,
            successRate,
            avgAttemptsPerFallback,
            avgFallbackTime,
            commonFailureReasons,
            effectiveStrategies,
            period: {
                start: startDate,
                end: endDate,
            },
        };
    }

    /**
     * Register a custom fallback strategy
     */
    registerStrategy(strategy: FallbackStrategy): void {
        this.strategies.set(strategy.id, strategy);
        console.log(`[FallbackManager] Registered strategy: ${strategy.name}`);
    }

    /**
     * Get a registered strategy
     */
    getStrategy(strategyId: string): FallbackStrategy | undefined {
        return this.strategies.get(strategyId);
    }

    /**
     * Get all tracking records
     */
    getTrackingRecords(filters?: {
        userId?: string;
        taskId?: string;
        success?: boolean;
        startDate?: string;
        endDate?: string;
    }): FallbackTrackingRecord[] {
        let records = Array.from(this.trackingRecords.values());

        if (filters) {
            if (filters.userId) {
                records = records.filter(r => r.userId === filters.userId);
            }
            if (filters.taskId) {
                records = records.filter(r => r.taskId === filters.taskId);
            }
            if (filters.success !== undefined) {
                records = records.filter(r => r.result.success === filters.success);
            }
            if (filters.startDate) {
                records = records.filter(r => r.createdAt >= filters.startDate!);
            }
            if (filters.endDate) {
                records = records.filter(r => r.createdAt <= filters.endDate!);
            }
        }

        return records;
    }

    /**
     * Private helper methods
     */

    private initializeDefaultStrategies(): void {
        // Default strategies for common strand types
        const strandTypes = ['data-analyst', 'content-generator', 'market-forecaster', 'knowledge-retriever'];

        strandTypes.forEach(type => {
            // Retry strategy
            this.strategies.set(`${type}_retry`, {
                id: `${type}_retry`,
                name: `${type} retry with backoff`,
                retryWithBackoff: {
                    initialDelayMs: this.config.initialBackoffMs,
                    maxDelayMs: this.config.maxBackoffMs,
                    multiplier: this.config.backoffMultiplier,
                },
            });

            // Simplified model strategy
            this.strategies.set(`${type}_simplified`, {
                id: `${type}_simplified`,
                name: `${type} with simplified model`,
                simplifyModel: true,
            });
        });

        // Human review strategy
        this.strategies.set('human_review', {
            id: 'human_review',
            name: 'Route to human review',
            routeToHuman: true,
        });
    }

    private createRetryStrategy(strand: AgentStrand, task: WorkerTask): FallbackStrategy {
        return {
            id: `retry_${strand.id}_${Date.now()}`,
            name: `Retry ${strand.type} with backoff`,
            alternativeStrand: strand,
            retryWithBackoff: {
                initialDelayMs: this.config.initialBackoffMs,
                maxDelayMs: this.config.maxBackoffMs,
                multiplier: this.config.backoffMultiplier,
            },
        };
    }

    private createSimplifiedTaskStrategy(strand: AgentStrand, task: WorkerTask): FallbackStrategy {
        return {
            id: `simplified_${strand.id}_${Date.now()}`,
            name: `Simplified task for ${strand.type}`,
            alternativeStrand: strand,
            modifiedTask: {
                input: this.simplifyTaskInput(task.input),
            },
            simplifyModel: true,
        };
    }

    private createHumanReviewStrategy(): FallbackStrategy {
        return {
            id: `human_review_${Date.now()}`,
            name: 'Route to human review',
            routeToHuman: true,
        };
    }

    private createFallbackModelStrategy(strand: AgentStrand, task: WorkerTask): FallbackStrategy {
        return {
            id: `fallback_model_${strand.id}_${Date.now()}`,
            name: `Fallback model for ${strand.type}`,
            alternativeStrand: strand,
            simplifyModel: true,
        };
    }

    private createEmptyStrategy(): FallbackStrategy {
        return {
            id: 'empty',
            name: 'No strategy available',
        };
    }

    private isTransientError(error: Error): boolean {
        const transientPatterns = [
            'timeout',
            'network',
            'connection',
            'throttle',
            'rate limit',
            'temporary',
            'unavailable',
        ];

        const errorMessage = error.message.toLowerCase();
        return transientPatterns.some(pattern => errorMessage.includes(pattern));
    }

    private canSimplifyTask(task: WorkerTask): boolean {
        // Check if task has parameters that can be simplified
        return task.input && Object.keys(task.input).length > 0;
    }

    private simplifyTaskInput(input: Record<string, any>): Record<string, any> {
        // Simplify task input by reducing complexity
        const simplified: Record<string, any> = {};

        for (const [key, value] of Object.entries(input)) {
            if (typeof value === 'string' && value.length > 1000) {
                // Truncate long strings
                simplified[key] = value.substring(0, 1000) + '...';
            } else if (Array.isArray(value) && value.length > 10) {
                // Limit array size
                simplified[key] = value.slice(0, 10);
            } else {
                simplified[key] = value;
            }
        }

        return simplified;
    }

    private calculateBackoffDelay(attemptNumber: number, config: NonNullable<FallbackStrategy['retryWithBackoff']>): number {
        const delay = config.initialDelayMs * Math.pow(config.multiplier, attemptNumber - 1);
        return Math.min(delay, config.maxDelayMs);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async routeToHumanReview(task: WorkerTask, context: RoutingContext): Promise<WorkerResult> {
        // In production, this would create a human review task
        console.log(`[FallbackManager] Routing task ${task.id} to human review`);

        return {
            taskId: task.id,
            success: true,
            output: {
                message: 'Task routed to human review',
                reviewRequired: true,
            },
            metadata: {
                confidence: 0,
                routedToHuman: true,
            },
            completedAt: new Date().toISOString(),
        };
    }

    private async executeWithAlternativeStrand(
        strand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext
    ): Promise<WorkerResult> {
        // In production, this would execute the task with the alternative strand
        console.log(`[FallbackManager] Executing task ${task.id} with alternative strand ${strand.id}`);

        // Simulate execution
        return {
            taskId: task.id,
            success: true,
            output: {
                message: 'Task executed with alternative strand',
            },
            metadata: {
                confidence: 0.7,
                strandId: strand.id,
            },
            completedAt: new Date().toISOString(),
        };
    }

    private async executeModifiedTask(
        task: WorkerTask,
        context: RoutingContext
    ): Promise<WorkerResult> {
        // In production, this would execute the modified task
        console.log(`[FallbackManager] Executing modified task ${task.id}`);

        return {
            taskId: task.id,
            success: true,
            output: {
                message: 'Modified task executed',
            },
            metadata: {
                confidence: 0.6,
                modified: true,
            },
            completedAt: new Date().toISOString(),
        };
    }

    private async executeWithSimplifiedModel(
        task: WorkerTask,
        context: RoutingContext
    ): Promise<WorkerResult> {
        // In production, this would use a simpler/cheaper model
        console.log(`[FallbackManager] Executing task ${task.id} with simplified model`);

        return {
            taskId: task.id,
            success: true,
            output: {
                message: 'Task executed with simplified model',
            },
            metadata: {
                confidence: 0.65,
                simplifiedModel: true,
            },
            completedAt: new Date().toISOString(),
        };
    }

    private updateStrategyPerformance(strategyId: string, success: boolean): void {
        const perf = this.strategyPerformance.get(strategyId) || { attempts: 0, successes: 0 };
        perf.attempts++;
        if (success) {
            perf.successes++;
        }
        this.strategyPerformance.set(strategyId, perf);
    }

    private getStrategySuccessRate(strategyId: string): number {
        const perf = this.strategyPerformance.get(strategyId);
        if (!perf || perf.attempts === 0) {
            return 0.5; // Default to 50% for unknown strategies
        }
        return perf.successes / perf.attempts;
    }

    private generateTrackingId(): string {
        return `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private cleanupOldRecords(): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.trackingRetentionDays);
        const cutoffTimestamp = cutoffDate.toISOString();

        for (const [id, record] of this.trackingRecords.entries()) {
            if (record.createdAt < cutoffTimestamp) {
                this.trackingRecords.delete(id);
            }
        }
    }
}

/**
 * Singleton instance
 */
let fallbackManagerInstance: FallbackManager | null = null;

/**
 * Get the singleton FallbackManager instance
 */
export function getFallbackManager(
    config?: Partial<FallbackManagerConfig>
): FallbackManager {
    if (!fallbackManagerInstance) {
        fallbackManagerInstance = new FallbackManager(config);
    }
    return fallbackManagerInstance;
}

/**
 * Reset the FallbackManager singleton (useful for testing)
 */
export function resetFallbackManager(): void {
    fallbackManagerInstance = null;
}
