/**
 * Priority Queue Integration with AgentCore
 * 
 * This module demonstrates how to integrate the PriorityQueueManager
 * with the existing AgentCore system for intelligent task routing.
 */

import { EventEmitter } from 'events';
import { getAgentCore } from '../agent-core';
import type { AgentCore, AgentStrand } from '../agent-core';
import { getPriorityQueueManager, TaskPriority, determinePriority } from './priority-queue-manager';
import type { PriorityQueueManager, PriorityQueueEntry } from './priority-queue-manager';
import type { WorkerTask, WorkerResult } from '../worker-protocol';

/**
 * Enhanced orchestrator that combines AgentCore with PriorityQueueManager
 */
export class PriorityAwareOrchestrator extends EventEmitter {
    private agentCore: AgentCore;
    private queueManager: PriorityQueueManager;
    private isProcessing: boolean = false;
    private processingInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.agentCore = getAgentCore();
        this.queueManager = getPriorityQueueManager({
            maxQueueSize: 1000,
            enableAging: true,
            agingThresholdMs: 5 * 60 * 1000, // 5 minutes
            enableDeadlineBoost: true,
            deadlineBoostThresholdMs: 2 * 60 * 1000, // 2 minutes
        });

        this.setupEventHandlers();
    }

    /**
     * Submit a task with automatic priority determination
     */
    async submitTask(
        task: WorkerTask,
        options?: {
            isUrgent?: boolean;
            deadline?: Date;
            userPriority?: 'high' | 'normal' | 'low';
            estimatedExecutionTime?: number;
        }
    ): Promise<boolean> {
        // Determine priority based on task characteristics
        const priority = determinePriority(task, {
            isUrgent: options?.isUrgent,
            hasDeadline: !!options?.deadline,
            userPriority: options?.userPriority,
        });

        // Enqueue the task
        const enqueued = this.queueManager.enqueue(task, priority, {
            deadline: options?.deadline,
            estimatedExecutionTime: options?.estimatedExecutionTime,
        });

        if (enqueued) {
            this.emit('task-submitted', task, priority);

            // Start processing if not already running
            if (!this.isProcessing) {
                this.startProcessing();
            }
        }

        return enqueued;
    }

    /**
     * Submit an urgent task (bypasses normal queue)
     */
    async submitUrgentTask(task: WorkerTask): Promise<boolean> {
        return this.submitTask(task, { isUrgent: true });
    }

    /**
     * Start processing tasks from the queue
     */
    private startProcessing(): void {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.emit('processing-started');

        // Process tasks continuously
        this.processingInterval = setInterval(() => {
            this.processNextTask();
        }, 100); // Check every 100ms
    }

    /**
     * Stop processing tasks
     */
    stopProcessing(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.isProcessing = false;
        this.emit('processing-stopped');
    }

    /**
     * Process the next task from the queue
     */
    private async processNextTask(): Promise<void> {
        // Check if queue is empty
        if (this.queueManager.isEmpty()) {
            this.stopProcessing();
            return;
        }

        // Get next task
        const entry = this.queueManager.dequeue();
        if (!entry) return;

        try {
            // Allocate task to appropriate agent strand
            const strand = await this.agentCore.allocateTask(entry.task);

            this.emit('task-allocated', entry.task, strand, entry.priority);

            // Execute task (this would be handled by the actual strand implementation)
            // For now, we just emit an event
            this.emit('task-executing', entry.task, strand);

        } catch (error) {
            this.emit('task-failed', entry.task, error);

            // Retry logic
            if (entry.retryCount < entry.maxRetries) {
                entry.retryCount++;
                this.queueManager.enqueue(
                    entry.task,
                    entry.priority,
                    {
                        deadline: entry.deadline ? new Date(entry.deadline) : undefined,
                        estimatedExecutionTime: entry.estimatedExecutionTime,
                        maxRetries: entry.maxRetries,
                    }
                );
                this.emit('task-retrying', entry.task, entry.retryCount);
            } else {
                this.emit('task-exhausted', entry.task);
            }
        }
    }

    /**
     * Get current queue status
     */
    getQueueStatus(): {
        totalTasks: number;
        tasksByPriority: Record<TaskPriority, number>;
        isProcessing: boolean;
        metrics: ReturnType<PriorityQueueManager['getMetrics']>;
    } {
        const metrics = this.queueManager.getMetrics();

        return {
            totalTasks: metrics.totalTasks,
            tasksByPriority: metrics.tasksByPriority,
            isProcessing: this.isProcessing,
            metrics,
        };
    }

    /**
     * Get tasks waiting for a specific agent type
     */
    getTasksForAgentType(agentType: string): PriorityQueueEntry[] {
        return this.queueManager.getAllTasks().filter(entry => entry.task.type === agentType);
    }

    /**
     * Cancel a pending task
     */
    cancelTask(taskId: string): boolean {
        return this.queueManager.remove(taskId);
    }

    /**
     * Boost task priority (e.g., user escalation)
     */
    boostTaskPriority(taskId: string, newPriority: TaskPriority): boolean {
        return this.queueManager.updatePriority(taskId, newPriority);
    }

    /**
     * Setup event handlers for monitoring
     */
    private setupEventHandlers(): void {
        // Forward queue events
        this.queueManager.on('task-enqueued', (entry) => {
            this.emit('queue-task-enqueued', entry);
        });

        this.queueManager.on('task-dequeued', (entry) => {
            this.emit('queue-task-dequeued', entry);
        });

        this.queueManager.on('priority-boosted', (entry, oldPriority, newPriority) => {
            this.emit('queue-priority-boosted', entry, oldPriority, newPriority);
        });

        this.queueManager.on('queue-full', (task) => {
            this.emit('queue-full', task);
        });

        this.queueManager.on('metrics-updated', (metrics) => {
            this.emit('queue-metrics-updated', metrics);
        });

        // Forward agent core events
        this.agentCore.on('task-allocated', (task, strand) => {
            this.emit('agent-task-allocated', task, strand);
        });

        this.agentCore.on('task-completed', (result, strand) => {
            this.emit('agent-task-completed', result, strand);
        });
    }

    /**
     * Shutdown the orchestrator
     */
    shutdown(): void {
        this.stopProcessing();
        this.queueManager.shutdown();
        this.removeAllListeners();
    }
}

/**
 * Example usage demonstrating priority-based task routing
 */
export async function exampleUsage() {
    const orchestrator = new PriorityAwareOrchestrator();

    // Listen to events
    orchestrator.on('task-submitted', (task, priority) => {
        console.log(`Task submitted: ${task.description} with priority ${TaskPriority[priority]}`);
    });

    orchestrator.on('task-allocated', (task, strand, priority) => {
        console.log(`Task allocated to ${strand.type} strand with priority ${TaskPriority[priority]}`);
    });

    // Submit various tasks with different priorities
    const urgentTask = {
        id: 'urgent-1',
        type: 'data-analyst' as const,
        description: 'Urgent market analysis needed',
        dependencies: [],
        input: { query: 'urgent market data' },
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
    };

    const normalTask = {
        id: 'normal-1',
        type: 'content-generator' as const,
        description: 'Generate blog post',
        dependencies: [],
        input: { contentType: 'blog-post' },
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
    };

    const lowPriorityTask = {
        id: 'low-1',
        type: 'market-forecaster' as const,
        description: 'Long-term market forecast',
        dependencies: [],
        input: { timeframe: '12 months' },
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
    };

    // Submit tasks
    await orchestrator.submitUrgentTask(urgentTask);
    await orchestrator.submitTask(normalTask, { userPriority: 'normal' });
    await orchestrator.submitTask(lowPriorityTask, { userPriority: 'low' });

    // Check queue status
    const status = orchestrator.getQueueStatus();
    console.log('Queue status:', status);

    // Cleanup
    setTimeout(() => {
        orchestrator.shutdown();
    }, 5000);
}

/**
 * Singleton instance
 */
let orchestratorInstance: PriorityAwareOrchestrator | null = null;

/**
 * Get the singleton orchestrator instance
 */
export function getPriorityAwareOrchestrator(): PriorityAwareOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new PriorityAwareOrchestrator();
    }
    return orchestratorInstance;
}

/**
 * Reset the orchestrator singleton (useful for testing)
 */
export function resetPriorityAwareOrchestrator(): void {
    if (orchestratorInstance) {
        orchestratorInstance.shutdown();
    }
    orchestratorInstance = null;
}
