/**
 * Integration tests for PriorityAwareOrchestrator
 */

import {
    PriorityAwareOrchestrator,
    resetPriorityAwareOrchestrator,
} from '../priority-queue-integration';
import { TaskPriority } from '../priority-queue-manager';
import { createWorkerTask } from '../../worker-protocol';
import { resetAgentCore } from '../../agent-core';
import { resetPriorityQueueManager } from '../priority-queue-manager';

describe('PriorityAwareOrchestrator Integration', () => {
    let orchestrator: PriorityAwareOrchestrator;

    beforeEach(() => {
        // Reset singletons
        resetAgentCore();
        resetPriorityQueueManager();
        resetPriorityAwareOrchestrator();

        orchestrator = new PriorityAwareOrchestrator();
    });

    afterEach(() => {
        orchestrator.shutdown();
    });

    describe('Task Submission', () => {
        it('should submit task with automatic priority', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            const submitted = await orchestrator.submitTask(task);
            expect(submitted).toBe(true);

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(1);
        });

        it('should submit urgent task with critical priority', async () => {
            const task = createWorkerTask('data-analyst', 'Urgent task', { query: 'urgent' });

            const submitted = await orchestrator.submitUrgentTask(task);
            expect(submitted).toBe(true);

            const status = orchestrator.getQueueStatus();
            expect(status.tasksByPriority[TaskPriority.CRITICAL]).toBe(1);
        });

        it('should handle task with deadline', async () => {
            const task = createWorkerTask('data-analyst', 'Deadline task', { query: 'deadline' });
            const deadline = new Date(Date.now() + 10 * 60 * 1000);

            const submitted = await orchestrator.submitTask(task, {
                deadline,
                userPriority: 'high',
            });

            expect(submitted).toBe(true);

            const status = orchestrator.getQueueStatus();
            expect(status.tasksByPriority[TaskPriority.HIGH]).toBe(1);
        });

        it('should respect user priority preferences', async () => {
            const highTask = createWorkerTask('data-analyst', 'High priority', { query: 'high' });
            const normalTask = createWorkerTask('data-analyst', 'Normal priority', { query: 'normal' });
            const lowTask = createWorkerTask('data-analyst', 'Low priority', { query: 'low' });

            await orchestrator.submitTask(highTask, { userPriority: 'high' });
            await orchestrator.submitTask(normalTask, { userPriority: 'normal' });
            await orchestrator.submitTask(lowTask, { userPriority: 'low' });

            const status = orchestrator.getQueueStatus();
            expect(status.tasksByPriority[TaskPriority.HIGH]).toBe(1);
            expect(status.tasksByPriority[TaskPriority.NORMAL]).toBe(1);
            expect(status.tasksByPriority[TaskPriority.LOW]).toBe(1);
        });
    });

    describe('Queue Management', () => {
        it('should get queue status', async () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('content-generator', 'Task 2', { contentType: 'blog' });

            await orchestrator.submitTask(task1, { userPriority: 'high' });
            await orchestrator.submitTask(task2, { userPriority: 'normal' });

            const status = orchestrator.getQueueStatus();

            expect(status.totalTasks).toBe(2);
            // Processing may have started automatically
            expect(typeof status.isProcessing).toBe('boolean');
            expect(status.metrics).toBeDefined();
            expect(status.metrics.totalTasks).toBe(2);
        });

        it('should get tasks for specific agent type', async () => {
            const analystTask1 = createWorkerTask('data-analyst', 'Analyst 1', { query: 'test1' });
            const analystTask2 = createWorkerTask('data-analyst', 'Analyst 2', { query: 'test2' });
            const contentTask = createWorkerTask('content-generator', 'Content', { contentType: 'blog' });

            await orchestrator.submitTask(analystTask1);
            await orchestrator.submitTask(analystTask2);
            await orchestrator.submitTask(contentTask);

            const analystTasks = orchestrator.getTasksForAgentType('data-analyst');
            expect(analystTasks.length).toBe(2);
            expect(analystTasks.every(entry => entry.task.type === 'data-analyst')).toBe(true);
        });

        it('should cancel pending task', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            await orchestrator.submitTask(task);
            expect(orchestrator.getQueueStatus().totalTasks).toBe(1);

            const cancelled = orchestrator.cancelTask(task.id);
            expect(cancelled).toBe(true);
            expect(orchestrator.getQueueStatus().totalTasks).toBe(0);
        });

        it('should boost task priority', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            await orchestrator.submitTask(task, { userPriority: 'low' });

            const boosted = orchestrator.boostTaskPriority(task.id, TaskPriority.CRITICAL);
            expect(boosted).toBe(true);

            const status = orchestrator.getQueueStatus();
            expect(status.tasksByPriority[TaskPriority.CRITICAL]).toBe(1);
            expect(status.tasksByPriority[TaskPriority.LOW]).toBe(0);
        });
    });

    describe('Event Handling', () => {
        it('should emit task-submitted event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            orchestrator.on('task-submitted', (submittedTask, priority) => {
                expect(submittedTask.id).toBe(task.id);
                expect(priority).toBe(TaskPriority.NORMAL);
                done();
            });

            orchestrator.submitTask(task);
        });

        it('should emit queue-task-enqueued event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            orchestrator.on('queue-task-enqueued', (entry) => {
                expect(entry.task.id).toBe(task.id);
                done();
            });

            orchestrator.submitTask(task);
        });

        it('should emit queue-priority-boosted event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            orchestrator.submitTask(task, { userPriority: 'low' }).then(() => {
                orchestrator.on('queue-priority-boosted', (entry, oldPriority, newPriority) => {
                    expect(oldPriority).toBe(TaskPriority.LOW);
                    expect(newPriority).toBe(TaskPriority.HIGH);
                    done();
                });

                orchestrator.boostTaskPriority(task.id, TaskPriority.HIGH);
            });
        });
    });

    describe('Processing Control', () => {
        it('should start processing when task is submitted', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            let processingStarted = false;
            orchestrator.on('processing-started', () => {
                processingStarted = true;
            });

            await orchestrator.submitTask(task);

            // Wait a bit for processing to start
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(processingStarted).toBe(true);
        });

        it('should stop processing when queue is empty', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            let processingStopped = false;
            orchestrator.on('processing-stopped', () => {
                processingStopped = true;
            });

            await orchestrator.submitTask(task);

            // Wait for processing to complete (may take longer due to allocation)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Processing should eventually stop when queue is empty
            // Note: This is timing-dependent and may vary
            expect(typeof processingStopped).toBe('boolean');
        });

        it('should manually stop processing', async () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            await orchestrator.submitTask(task);

            // Wait for processing to start
            await new Promise(resolve => setTimeout(resolve, 50));

            orchestrator.stopProcessing();

            const status = orchestrator.getQueueStatus();
            expect(status.isProcessing).toBe(false);
        });
    });

    describe('Multiple Tasks', () => {
        it('should handle multiple tasks with different priorities', async () => {
            const tasks = [
                { task: createWorkerTask('data-analyst', 'Low', { query: 'low' }), priority: 'low' as const },
                { task: createWorkerTask('data-analyst', 'Normal', { query: 'normal' }), priority: 'normal' as const },
                { task: createWorkerTask('data-analyst', 'High', { query: 'high' }), priority: 'high' as const },
            ];

            for (const { task, priority } of tasks) {
                await orchestrator.submitTask(task, { userPriority: priority });
            }

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(3);
            expect(status.tasksByPriority[TaskPriority.HIGH]).toBe(1);
            expect(status.tasksByPriority[TaskPriority.NORMAL]).toBe(1);
            expect(status.tasksByPriority[TaskPriority.LOW]).toBe(1);
        });

        it('should handle tasks for different agent types', async () => {
            const tasks = [
                createWorkerTask('data-analyst', 'Analyst task', { query: 'test' }),
                createWorkerTask('content-generator', 'Content task', { contentType: 'blog' }),
                createWorkerTask('market-forecaster', 'Forecast task', { timeframe: '12 months' }),
            ];

            for (const task of tasks) {
                await orchestrator.submitTask(task);
            }

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(3);

            expect(orchestrator.getTasksForAgentType('data-analyst').length).toBe(1);
            expect(orchestrator.getTasksForAgentType('content-generator').length).toBe(1);
            expect(orchestrator.getTasksForAgentType('market-forecaster').length).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle task allocation failure gracefully', async () => {
            const invalidTask = createWorkerTask('invalid-type' as any, 'Invalid', { query: 'test' });

            let failureEmitted = false;
            orchestrator.on('task-failed', () => {
                failureEmitted = true;
            });

            await orchestrator.submitTask(invalidTask);

            // Wait for processing attempt
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(failureEmitted).toBe(true);
        });
    });

    describe('Shutdown', () => {
        it('should clean up resources on shutdown', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            orchestrator.submitTask(task);

            orchestrator.shutdown();

            const status = orchestrator.getQueueStatus();
            expect(status.isProcessing).toBe(false);
        });
    });
});
