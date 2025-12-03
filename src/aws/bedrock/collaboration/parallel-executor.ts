/**
 * Parallel Execution Engine - Executes independent tasks concurrently
 * 
 * This module manages parallel execution of independent tasks to improve throughput.
 * It respects dependencies and ensures proper ordering while maximizing concurrency.
 * 
 * Requirements: 1.5
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { getDependencyTracker } from './dependency-tracker';

/**
 * Execution result with task info
 */
interface ExecutionResult {
    taskId: string;
    result: WorkerResult;
    executionTime: number;
    startedAt: string;
    completedAt: string;
}

/**
 * Execution options
 */
interface ExecutionOptions {
    maxConcurrency?: number;
    timeout?: number;
    onTaskComplete?: (result: ExecutionResult) => void;
    onTaskError?: (taskId: string, error: Error) => void;
}

/**
 * ParallelExecutor - Manages parallel task execution
 */
export class ParallelExecutor {
    private dependencyTracker = getDependencyTracker();
    private activeTasks: Map<string, Promise<ExecutionResult>> = new Map();
    private maxConcurrency: number;

    constructor(maxConcurrency: number = 10) {
        this.maxConcurrency = maxConcurrency;
    }

    /**
     * Executes tasks in parallel while respecting dependencies
     * 
     * @param tasks - Tasks to execute
     * @param strands - Available strands for execution
     * @param executor - Function to execute a task on a strand
     * @param options - Execution options
     * @returns Array of execution results
     */
    async executeParallel(
        tasks: WorkerTask[],
        strands: AgentStrand[],
        executor: (task: WorkerTask, strand: AgentStrand) => Promise<WorkerResult>,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult[]> {
        const {
            maxConcurrency = this.maxConcurrency,
            timeout,
            onTaskComplete,
            onTaskError,
        } = options;

        // Register all task dependencies
        tasks.forEach(task => {
            this.dependencyTracker.registerDependencies(task.id, task.dependencies);
        });

        const results: ExecutionResult[] = [];
        const pendingTasks = new Set(tasks.map(t => t.id));
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        // Execute tasks in waves based on dependencies
        while (pendingTasks.size > 0) {
            // Get tasks ready for execution
            const readyTaskIds = this.dependencyTracker
                .getReadyTasks()
                .filter(id => pendingTasks.has(id));

            if (readyTaskIds.length === 0) {
                // No tasks ready - check if we're waiting on active tasks
                if (this.activeTasks.size === 0) {
                    // Deadlock - no tasks ready and none executing
                    const remaining = Array.from(pendingTasks);
                    throw new Error(
                        `Deadlock detected: ${remaining.length} tasks cannot execute due to unsatisfied dependencies`
                    );
                }

                // Wait for at least one active task to complete
                await Promise.race(Array.from(this.activeTasks.values()));
                continue;
            }

            // Limit concurrency
            const tasksToExecute = readyTaskIds.slice(
                0,
                maxConcurrency - this.activeTasks.size
            );

            // Start executing ready tasks
            const executions = tasksToExecute.map(taskId => {
                const task = taskMap.get(taskId)!;
                const strand = this.selectStrand(task, strands);

                const execution = this.executeTask(
                    task,
                    strand,
                    executor,
                    timeout
                ).then(result => {
                    // Mark task as completed
                    this.dependencyTracker.markCompleted(taskId);
                    pendingTasks.delete(taskId);
                    this.activeTasks.delete(taskId);

                    // Call completion callback
                    if (onTaskComplete) {
                        onTaskComplete(result);
                    }

                    results.push(result);
                    return result;
                }).catch(error => {
                    // Handle task error
                    pendingTasks.delete(taskId);
                    this.activeTasks.delete(taskId);

                    if (onTaskError) {
                        onTaskError(taskId, error);
                    }

                    throw error;
                });

                this.activeTasks.set(taskId, execution);
                return execution;
            });

            // Wait for at least one task to complete before starting more
            if (executions.length > 0) {
                await Promise.race(executions);
            }
        }

        // Wait for all remaining tasks to complete
        if (this.activeTasks.size > 0) {
            await Promise.all(Array.from(this.activeTasks.values()));
        }

        return results;
    }

    /**
     * Executes a single task with timeout
     */
    private async executeTask(
        task: WorkerTask,
        strand: AgentStrand,
        executor: (task: WorkerTask, strand: AgentStrand) => Promise<WorkerResult>,
        timeout?: number
    ): Promise<ExecutionResult> {
        const startedAt = new Date().toISOString();
        const startTime = Date.now();

        try {
            let result: WorkerResult;

            if (timeout) {
                // Execute with timeout
                result = await this.withTimeout(
                    executor(task, strand),
                    timeout,
                    `Task ${task.id} timed out after ${timeout}ms`
                );
            } else {
                // Execute without timeout
                result = await executor(task, strand);
            }

            const completedAt = new Date().toISOString();
            const executionTime = Date.now() - startTime;

            return {
                taskId: task.id,
                result,
                executionTime,
                startedAt,
                completedAt,
            };
        } catch (error) {
            const completedAt = new Date().toISOString();
            const executionTime = Date.now() - startTime;

            // Create error result
            const errorResult: WorkerResult = {
                taskId: task.id,
                workerType: task.type,
                status: 'error',
                error: {
                    type: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: completedAt,
                },
                metadata: {
                    executionTime,
                    startedAt,
                    completedAt,
                },
            };

            return {
                taskId: task.id,
                result: errorResult,
                executionTime,
                startedAt,
                completedAt,
            };
        }
    }

    /**
     * Selects an appropriate strand for task execution
     */
    private selectStrand(task: WorkerTask, strands: AgentStrand[]): AgentStrand {
        // Filter strands that can handle this task type
        const capableStrands = strands.filter(
            strand =>
                strand.type === task.type &&
                strand.state !== 'error' &&
                strand.state !== 'maintenance'
        );

        if (capableStrands.length === 0) {
            throw new Error(`No capable strand found for task type: ${task.type}`);
        }

        // Select strand with lowest current load
        return capableStrands.reduce((best, current) =>
            current.metrics.currentLoad < best.metrics.currentLoad ? current : best
        );
    }

    /**
     * Wraps a promise with a timeout
     */
    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        timeoutMessage: string
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
            ),
        ]);
    }

    /**
     * Gets current execution statistics
     */
    getStats(): {
        activeTasks: number;
        maxConcurrency: number;
    } {
        return {
            activeTasks: this.activeTasks.size,
            maxConcurrency: this.maxConcurrency,
        };
    }

    /**
     * Sets maximum concurrency
     */
    setMaxConcurrency(max: number): void {
        if (max < 1) {
            throw new Error('Max concurrency must be at least 1');
        }
        this.maxConcurrency = max;
    }

    /**
     * Cancels all active tasks
     */
    async cancelAll(): Promise<void> {
        // Note: This doesn't actually cancel the promises, just clears tracking
        // Actual cancellation would require AbortController support in executors
        this.activeTasks.clear();
    }
}

/**
 * Singleton instance
 */
let parallelExecutorInstance: ParallelExecutor | null = null;

/**
 * Get the singleton ParallelExecutor instance
 */
export function getParallelExecutor(): ParallelExecutor {
    if (!parallelExecutorInstance) {
        parallelExecutorInstance = new ParallelExecutor();
    }
    return parallelExecutorInstance;
}

/**
 * Reset the ParallelExecutor singleton (useful for testing)
 */
export function resetParallelExecutor(): void {
    parallelExecutorInstance = null;
}
