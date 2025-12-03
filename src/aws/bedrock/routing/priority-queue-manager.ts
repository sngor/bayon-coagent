/**
 * Priority Queue Manager - Intelligent Task Prioritization System
 * 
 * This module provides priority-based task queuing and processing to ensure
 * urgent tasks are handled before routine tasks while maintaining fairness
 * and preventing starvation.
 * 
 * Requirements: 10.4
 */

import { EventEmitter } from 'events';
import type { WorkerTask, WorkerAgentType } from '../worker-protocol';

/**
 * Task priority levels
 */
export enum TaskPriority {
    CRITICAL = 0,  // Immediate processing required
    HIGH = 1,      // Process as soon as possible
    NORMAL = 2,    // Standard priority
    LOW = 3,       // Process when resources available
    BACKGROUND = 4 // Lowest priority, process during idle time
}

/**
 * Priority queue entry with metadata
 */
export interface PriorityQueueEntry {
    /** The task to be executed */
    task: WorkerTask;

    /** Priority level */
    priority: TaskPriority;

    /** Timestamp when task was enqueued */
    enqueuedAt: string;

    /** Optional deadline for task completion */
    deadline?: string;

    /** Number of times task has been retried */
    retryCount: number;

    /** Maximum allowed retries */
    maxRetries: number;

    /** Estimated execution time in milliseconds */
    estimatedExecutionTime?: number;
}

/**
 * Queue metrics for monitoring and optimization
 */
export interface QueueMetrics {
    /** Total tasks currently in queue */
    totalTasks: number;

    /** Tasks by priority level */
    tasksByPriority: Record<TaskPriority, number>;

    /** Average wait time by priority (ms) */
    avgWaitTimeByPriority: Record<TaskPriority, number>;

    /** Longest waiting task */
    longestWaitTime: number;

    /** Tasks processed in last hour */
    tasksProcessedLastHour: number;

    /** Current throughput (tasks/minute) */
    currentThroughput: number;

    /** Queue capacity utilization (0-1) */
    utilizationRate: number;

    /** Last metrics update timestamp */
    lastUpdated: string;
}

/**
 * Queue configuration options
 */
export interface QueueConfig {
    /** Maximum queue size (0 = unlimited) */
    maxQueueSize: number;

    /** Enable aging to prevent starvation */
    enableAging: boolean;

    /** Time in ms before priority increases due to aging */
    agingThresholdMs: number;

    /** Enable deadline-based priority boost */
    enableDeadlineBoost: boolean;

    /** Time in ms before deadline to boost priority */
    deadlineBoostThresholdMs: number;
}

/**
 * Priority Queue Manager Events
 */
export interface PriorityQueueEvents {
    'task-enqueued': (entry: PriorityQueueEntry) => void;
    'task-dequeued': (entry: PriorityQueueEntry) => void;
    'priority-boosted': (entry: PriorityQueueEntry, oldPriority: TaskPriority, newPriority: TaskPriority) => void;
    'queue-full': (task: WorkerTask) => void;
    'metrics-updated': (metrics: QueueMetrics) => void;
}

/**
 * Priority Queue Manager - Manages task prioritization and ordering
 */
export class PriorityQueueManager extends EventEmitter {
    private queues: Map<TaskPriority, PriorityQueueEntry[]> = new Map();
    private taskIndex: Map<string, PriorityQueueEntry> = new Map();
    private processedTasks: Array<{ timestamp: string; priority: TaskPriority; waitTime: number }> = [];
    private config: QueueConfig;
    private metricsUpdateInterval: NodeJS.Timeout | null = null;

    constructor(config?: Partial<QueueConfig>) {
        super();

        // Initialize default configuration
        this.config = {
            maxQueueSize: 1000,
            enableAging: true,
            agingThresholdMs: 5 * 60 * 1000, // 5 minutes
            enableDeadlineBoost: true,
            deadlineBoostThresholdMs: 2 * 60 * 1000, // 2 minutes before deadline
            ...config,
        };

        // Initialize priority queues
        Object.values(TaskPriority)
            .filter(v => typeof v === 'number')
            .forEach(priority => {
                this.queues.set(priority as TaskPriority, []);
            });

        // Start metrics update interval
        this.startMetricsUpdates();
    }

    /**
     * Enqueue a task with specified priority
     */
    enqueue(
        task: WorkerTask,
        priority: TaskPriority = TaskPriority.NORMAL,
        options?: {
            deadline?: Date;
            estimatedExecutionTime?: number;
            maxRetries?: number;
        }
    ): boolean {
        // Check queue capacity
        if (this.config.maxQueueSize > 0 && this.getTotalQueueSize() >= this.config.maxQueueSize) {
            this.emit('queue-full', task);
            return false;
        }

        // Check if task already exists
        if (this.taskIndex.has(task.id)) {
            return false;
        }

        // Create queue entry
        const entry: PriorityQueueEntry = {
            task,
            priority,
            enqueuedAt: new Date().toISOString(),
            deadline: options?.deadline?.toISOString(),
            retryCount: 0,
            maxRetries: options?.maxRetries ?? 3,
            estimatedExecutionTime: options?.estimatedExecutionTime,
        };

        // Add to appropriate priority queue
        const queue = this.queues.get(priority);
        if (!queue) {
            throw new Error(`Invalid priority level: ${priority}`);
        }

        queue.push(entry);
        this.taskIndex.set(task.id, entry);

        this.emit('task-enqueued', entry);

        return true;
    }

    /**
     * Dequeue the highest priority task
     */
    dequeue(): PriorityQueueEntry | null {
        // Apply aging and deadline boosts before dequeuing
        this.applyPriorityAdjustments();

        // Find highest priority non-empty queue
        for (const priority of this.getPrioritiesInOrder()) {
            const queue = this.queues.get(priority);
            if (!queue || queue.length === 0) continue;

            // Get oldest task from this priority level
            const entry = queue.shift()!;
            this.taskIndex.delete(entry.task.id);

            // Record processing metrics
            const waitTime = Date.now() - new Date(entry.enqueuedAt).getTime();
            this.processedTasks.push({
                timestamp: new Date().toISOString(),
                priority: entry.priority,
                waitTime,
            });

            // Keep only last hour of processed tasks
            const oneHourAgo = Date.now() - 60 * 60 * 1000;
            this.processedTasks = this.processedTasks.filter(t =>
                new Date(t.timestamp).getTime() > oneHourAgo
            );

            this.emit('task-dequeued', entry);

            return entry;
        }

        return null;
    }

    /**
     * Peek at the next task without removing it
     */
    peek(): PriorityQueueEntry | null {
        this.applyPriorityAdjustments();

        for (const priority of this.getPrioritiesInOrder()) {
            const queue = this.queues.get(priority);
            if (!queue || queue.length === 0) continue;

            return queue[0];
        }

        return null;
    }

    /**
     * Get tasks by priority level
     */
    getTasksByPriority(priority: TaskPriority): PriorityQueueEntry[] {
        return [...(this.queues.get(priority) || [])];
    }

    /**
     * Get all tasks in queue
     */
    getAllTasks(): PriorityQueueEntry[] {
        const allTasks: PriorityQueueEntry[] = [];

        for (const priority of this.getPrioritiesInOrder()) {
            const queue = this.queues.get(priority);
            if (queue) {
                allTasks.push(...queue);
            }
        }

        return allTasks;
    }

    /**
     * Remove a specific task from the queue
     */
    remove(taskId: string): boolean {
        const entry = this.taskIndex.get(taskId);
        if (!entry) return false;

        const queue = this.queues.get(entry.priority);
        if (!queue) return false;

        const index = queue.findIndex(e => e.task.id === taskId);
        if (index === -1) return false;

        queue.splice(index, 1);
        this.taskIndex.delete(taskId);

        return true;
    }

    /**
     * Update task priority
     */
    updatePriority(taskId: string, newPriority: TaskPriority): boolean {
        const entry = this.taskIndex.get(taskId);
        if (!entry) return false;

        const oldPriority = entry.priority;
        if (oldPriority === newPriority) return true;

        // Remove from old queue
        const oldQueue = this.queues.get(oldPriority);
        if (oldQueue) {
            const index = oldQueue.findIndex(e => e.task.id === taskId);
            if (index !== -1) {
                oldQueue.splice(index, 1);
            }
        }

        // Add to new queue
        entry.priority = newPriority;
        const newQueue = this.queues.get(newPriority);
        if (newQueue) {
            newQueue.push(entry);
        }

        this.emit('priority-boosted', entry, oldPriority, newPriority);

        return true;
    }

    /**
     * Check if queue is empty
     */
    isEmpty(): boolean {
        return this.getTotalQueueSize() === 0;
    }

    /**
     * Get total number of tasks in queue
     */
    getTotalQueueSize(): number {
        return this.taskIndex.size;
    }

    /**
     * Get current queue metrics
     */
    getMetrics(): QueueMetrics {
        const tasksByPriority: Record<TaskPriority, number> = {} as any;
        const avgWaitTimeByPriority: Record<TaskPriority, number> = {} as any;

        // Calculate tasks by priority
        for (const [priority, queue] of this.queues.entries()) {
            tasksByPriority[priority] = queue.length;
        }

        // Calculate average wait times
        const now = Date.now();
        for (const [priority, queue] of this.queues.entries()) {
            if (queue.length === 0) {
                avgWaitTimeByPriority[priority] = 0;
                continue;
            }

            const totalWaitTime = queue.reduce((sum, entry) => {
                return sum + (now - new Date(entry.enqueuedAt).getTime());
            }, 0);

            avgWaitTimeByPriority[priority] = totalWaitTime / queue.length;
        }

        // Find longest waiting task
        let longestWaitTime = 0;
        for (const queue of this.queues.values()) {
            for (const entry of queue) {
                const waitTime = now - new Date(entry.enqueuedAt).getTime();
                if (waitTime > longestWaitTime) {
                    longestWaitTime = waitTime;
                }
            }
        }

        // Calculate throughput
        const tasksProcessedLastHour = this.processedTasks.length;
        const currentThroughput = tasksProcessedLastHour / 60; // tasks per minute

        // Calculate utilization
        const utilizationRate = this.config.maxQueueSize > 0
            ? this.getTotalQueueSize() / this.config.maxQueueSize
            : 0;

        return {
            totalTasks: this.getTotalQueueSize(),
            tasksByPriority,
            avgWaitTimeByPriority,
            longestWaitTime,
            tasksProcessedLastHour,
            currentThroughput,
            utilizationRate,
            lastUpdated: new Date().toISOString(),
        };
    }

    /**
     * Clear all tasks from queue
     */
    clear(): void {
        for (const queue of this.queues.values()) {
            queue.length = 0;
        }
        this.taskIndex.clear();
    }

    /**
     * Shutdown the queue manager
     */
    shutdown(): void {
        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
            this.metricsUpdateInterval = null;
        }
        this.removeAllListeners();
    }

    /**
     * Apply priority adjustments based on aging and deadlines
     */
    private applyPriorityAdjustments(): void {
        if (!this.config.enableAging && !this.config.enableDeadlineBoost) {
            return;
        }

        const now = Date.now();
        const adjustments: Array<{ taskId: string; newPriority: TaskPriority }> = [];

        // Check all tasks for priority adjustments
        for (const entry of this.taskIndex.values()) {
            let shouldBoost = false;
            let newPriority = entry.priority;

            // Check aging
            if (this.config.enableAging) {
                const waitTime = now - new Date(entry.enqueuedAt).getTime();
                if (waitTime > this.config.agingThresholdMs && entry.priority > TaskPriority.CRITICAL) {
                    shouldBoost = true;
                    newPriority = Math.max(TaskPriority.CRITICAL, entry.priority - 1) as TaskPriority;
                }
            }

            // Check deadline
            if (this.config.enableDeadlineBoost && entry.deadline) {
                const timeUntilDeadline = new Date(entry.deadline).getTime() - now;
                if (timeUntilDeadline < this.config.deadlineBoostThresholdMs && timeUntilDeadline > 0) {
                    shouldBoost = true;
                    newPriority = TaskPriority.HIGH;
                }
            }

            if (shouldBoost && newPriority !== entry.priority) {
                adjustments.push({ taskId: entry.task.id, newPriority });
            }
        }

        // Apply adjustments
        for (const adjustment of adjustments) {
            this.updatePriority(adjustment.taskId, adjustment.newPriority);
        }
    }

    /**
     * Get priorities in order (highest to lowest)
     */
    private getPrioritiesInOrder(): TaskPriority[] {
        return [
            TaskPriority.CRITICAL,
            TaskPriority.HIGH,
            TaskPriority.NORMAL,
            TaskPriority.LOW,
            TaskPriority.BACKGROUND,
        ];
    }

    /**
     * Start periodic metrics updates
     */
    private startMetricsUpdates(): void {
        // Update metrics every 30 seconds
        this.metricsUpdateInterval = setInterval(() => {
            const metrics = this.getMetrics();
            this.emit('metrics-updated', metrics);
        }, 30000);
    }
}

/**
 * Helper function to determine task priority based on task characteristics
 */
export function determinePriority(task: WorkerTask, options?: {
    isUrgent?: boolean;
    hasDeadline?: boolean;
    userPriority?: 'high' | 'normal' | 'low';
}): TaskPriority {
    // Critical priority for urgent tasks
    if (options?.isUrgent) {
        return TaskPriority.CRITICAL;
    }

    // High priority for tasks with deadlines
    if (options?.hasDeadline) {
        return TaskPriority.HIGH;
    }

    // User-specified priority
    if (options?.userPriority === 'high') {
        return TaskPriority.HIGH;
    }
    if (options?.userPriority === 'low') {
        return TaskPriority.LOW;
    }

    // Default to normal priority
    return TaskPriority.NORMAL;
}

/**
 * Singleton instance
 */
let priorityQueueManagerInstance: PriorityQueueManager | null = null;

/**
 * Get the singleton PriorityQueueManager instance
 */
export function getPriorityQueueManager(config?: Partial<QueueConfig>): PriorityQueueManager {
    if (!priorityQueueManagerInstance) {
        priorityQueueManagerInstance = new PriorityQueueManager(config);
    }
    return priorityQueueManagerInstance;
}

/**
 * Reset the PriorityQueueManager singleton (useful for testing)
 */
export function resetPriorityQueueManager(): void {
    if (priorityQueueManagerInstance) {
        priorityQueueManagerInstance.shutdown();
    }
    priorityQueueManagerInstance = null;
}
