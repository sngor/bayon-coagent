/**
 * Unit tests for PriorityQueueManager
 */

import {
    PriorityQueueManager,
    TaskPriority,
    determinePriority,
    getPriorityQueueManager,
    resetPriorityQueueManager,
} from '../priority-queue-manager';
import { createWorkerTask } from '../../worker-protocol';
import type { WorkerTask } from '../../worker-protocol';

describe('PriorityQueueManager', () => {
    let queueManager: PriorityQueueManager;

    beforeEach(() => {
        queueManager = new PriorityQueueManager({
            maxQueueSize: 100,
            enableAging: false, // Disable for predictable tests
            enableDeadlineBoost: false,
        });
    });

    afterEach(() => {
        queueManager.shutdown();
    });

    describe('Basic Queue Operations', () => {
        it('should enqueue and dequeue tasks', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            const enqueued = queueManager.enqueue(task, TaskPriority.NORMAL);
            expect(enqueued).toBe(true);
            expect(queueManager.getTotalQueueSize()).toBe(1);

            const dequeued = queueManager.dequeue();
            expect(dequeued).not.toBeNull();
            expect(dequeued?.task.id).toBe(task.id);
            expect(queueManager.getTotalQueueSize()).toBe(0);
        });

        it('should return null when dequeuing from empty queue', () => {
            const dequeued = queueManager.dequeue();
            expect(dequeued).toBeNull();
        });

        it('should prevent duplicate task enqueuing', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            const first = queueManager.enqueue(task, TaskPriority.NORMAL);
            const second = queueManager.enqueue(task, TaskPriority.HIGH);

            expect(first).toBe(true);
            expect(second).toBe(false);
            expect(queueManager.getTotalQueueSize()).toBe(1);
        });

        it('should respect max queue size', () => {
            const smallQueue = new PriorityQueueManager({ maxQueueSize: 2 });

            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            const task3 = createWorkerTask('data-analyst', 'Task 3', { query: 'test3' });

            expect(smallQueue.enqueue(task1, TaskPriority.NORMAL)).toBe(true);
            expect(smallQueue.enqueue(task2, TaskPriority.NORMAL)).toBe(true);
            expect(smallQueue.enqueue(task3, TaskPriority.NORMAL)).toBe(false);

            smallQueue.shutdown();
        });

        it('should check if queue is empty', () => {
            expect(queueManager.isEmpty()).toBe(true);

            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            queueManager.enqueue(task, TaskPriority.NORMAL);

            expect(queueManager.isEmpty()).toBe(false);
        });

        it('should clear all tasks', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });

            queueManager.enqueue(task1, TaskPriority.NORMAL);
            queueManager.enqueue(task2, TaskPriority.HIGH);

            expect(queueManager.getTotalQueueSize()).toBe(2);

            queueManager.clear();

            expect(queueManager.getTotalQueueSize()).toBe(0);
            expect(queueManager.isEmpty()).toBe(true);
        });
    });

    describe('Priority Ordering', () => {
        it('should dequeue critical tasks before high priority tasks', () => {
            const normalTask = createWorkerTask('data-analyst', 'Normal task', { query: 'normal' });
            const highTask = createWorkerTask('data-analyst', 'High task', { query: 'high' });
            const criticalTask = createWorkerTask('data-analyst', 'Critical task', { query: 'critical' });

            queueManager.enqueue(normalTask, TaskPriority.NORMAL);
            queueManager.enqueue(highTask, TaskPriority.HIGH);
            queueManager.enqueue(criticalTask, TaskPriority.CRITICAL);

            const first = queueManager.dequeue();
            expect(first?.task.id).toBe(criticalTask.id);

            const second = queueManager.dequeue();
            expect(second?.task.id).toBe(highTask.id);

            const third = queueManager.dequeue();
            expect(third?.task.id).toBe(normalTask.id);
        });

        it('should process tasks in FIFO order within same priority', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            const task3 = createWorkerTask('data-analyst', 'Task 3', { query: 'test3' });

            queueManager.enqueue(task1, TaskPriority.NORMAL);
            queueManager.enqueue(task2, TaskPriority.NORMAL);
            queueManager.enqueue(task3, TaskPriority.NORMAL);

            expect(queueManager.dequeue()?.task.id).toBe(task1.id);
            expect(queueManager.dequeue()?.task.id).toBe(task2.id);
            expect(queueManager.dequeue()?.task.id).toBe(task3.id);
        });

        it('should handle all priority levels correctly', () => {
            const tasks = [
                { task: createWorkerTask('data-analyst', 'Background', { query: 'bg' }), priority: TaskPriority.BACKGROUND },
                { task: createWorkerTask('data-analyst', 'Low', { query: 'low' }), priority: TaskPriority.LOW },
                { task: createWorkerTask('data-analyst', 'Normal', { query: 'normal' }), priority: TaskPriority.NORMAL },
                { task: createWorkerTask('data-analyst', 'High', { query: 'high' }), priority: TaskPriority.HIGH },
                { task: createWorkerTask('data-analyst', 'Critical', { query: 'critical' }), priority: TaskPriority.CRITICAL },
            ];

            // Enqueue in random order
            tasks.forEach(({ task, priority }) => {
                queueManager.enqueue(task, priority);
            });

            // Should dequeue in priority order
            expect(queueManager.dequeue()?.priority).toBe(TaskPriority.CRITICAL);
            expect(queueManager.dequeue()?.priority).toBe(TaskPriority.HIGH);
            expect(queueManager.dequeue()?.priority).toBe(TaskPriority.NORMAL);
            expect(queueManager.dequeue()?.priority).toBe(TaskPriority.LOW);
            expect(queueManager.dequeue()?.priority).toBe(TaskPriority.BACKGROUND);
        });
    });

    describe('Task Management', () => {
        it('should remove specific task from queue', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            const task3 = createWorkerTask('data-analyst', 'Task 3', { query: 'test3' });

            queueManager.enqueue(task1, TaskPriority.NORMAL);
            queueManager.enqueue(task2, TaskPriority.NORMAL);
            queueManager.enqueue(task3, TaskPriority.NORMAL);

            const removed = queueManager.remove(task2.id);
            expect(removed).toBe(true);
            expect(queueManager.getTotalQueueSize()).toBe(2);

            // Verify task2 is not in queue
            const dequeued1 = queueManager.dequeue();
            const dequeued2 = queueManager.dequeue();

            expect(dequeued1?.task.id).toBe(task1.id);
            expect(dequeued2?.task.id).toBe(task3.id);
        });

        it('should return false when removing non-existent task', () => {
            const removed = queueManager.remove('non-existent-id');
            expect(removed).toBe(false);
        });

        it('should update task priority', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            queueManager.enqueue(task, TaskPriority.LOW);

            const updated = queueManager.updatePriority(task.id, TaskPriority.CRITICAL);
            expect(updated).toBe(true);

            const dequeued = queueManager.dequeue();
            expect(dequeued?.priority).toBe(TaskPriority.CRITICAL);
        });

        it('should handle priority update for non-existent task', () => {
            const updated = queueManager.updatePriority('non-existent-id', TaskPriority.HIGH);
            expect(updated).toBe(false);
        });

        it('should peek at next task without removing it', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            queueManager.enqueue(task, TaskPriority.NORMAL);

            const peeked = queueManager.peek();
            expect(peeked?.task.id).toBe(task.id);
            expect(queueManager.getTotalQueueSize()).toBe(1);

            const dequeued = queueManager.dequeue();
            expect(dequeued?.task.id).toBe(task.id);
        });

        it('should get tasks by priority level', () => {
            const highTask1 = createWorkerTask('data-analyst', 'High 1', { query: 'high1' });
            const highTask2 = createWorkerTask('data-analyst', 'High 2', { query: 'high2' });
            const normalTask = createWorkerTask('data-analyst', 'Normal', { query: 'normal' });

            queueManager.enqueue(highTask1, TaskPriority.HIGH);
            queueManager.enqueue(highTask2, TaskPriority.HIGH);
            queueManager.enqueue(normalTask, TaskPriority.NORMAL);

            const highTasks = queueManager.getTasksByPriority(TaskPriority.HIGH);
            expect(highTasks.length).toBe(2);
            expect(highTasks[0].task.id).toBe(highTask1.id);
            expect(highTasks[1].task.id).toBe(highTask2.id);
        });

        it('should get all tasks in queue', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            const task3 = createWorkerTask('data-analyst', 'Task 3', { query: 'test3' });

            queueManager.enqueue(task1, TaskPriority.CRITICAL);
            queueManager.enqueue(task2, TaskPriority.NORMAL);
            queueManager.enqueue(task3, TaskPriority.LOW);

            const allTasks = queueManager.getAllTasks();
            expect(allTasks.length).toBe(3);

            // Should be in priority order
            expect(allTasks[0].priority).toBe(TaskPriority.CRITICAL);
            expect(allTasks[1].priority).toBe(TaskPriority.NORMAL);
            expect(allTasks[2].priority).toBe(TaskPriority.LOW);
        });
    });

    describe('Queue Metrics', () => {
        it('should track total tasks', () => {
            const metrics = queueManager.getMetrics();
            expect(metrics.totalTasks).toBe(0);

            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            queueManager.enqueue(task, TaskPriority.NORMAL);

            const updatedMetrics = queueManager.getMetrics();
            expect(updatedMetrics.totalTasks).toBe(1);
        });

        it('should track tasks by priority', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            const task3 = createWorkerTask('data-analyst', 'Task 3', { query: 'test3' });

            queueManager.enqueue(task1, TaskPriority.HIGH);
            queueManager.enqueue(task2, TaskPriority.HIGH);
            queueManager.enqueue(task3, TaskPriority.NORMAL);

            const metrics = queueManager.getMetrics();
            expect(metrics.tasksByPriority[TaskPriority.HIGH]).toBe(2);
            expect(metrics.tasksByPriority[TaskPriority.NORMAL]).toBe(1);
            expect(metrics.tasksByPriority[TaskPriority.LOW]).toBe(0);
        });

        it('should calculate average wait time by priority', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            queueManager.enqueue(task, TaskPriority.NORMAL);

            // Wait a bit
            const waitTime = 100;
            const start = Date.now();
            while (Date.now() - start < waitTime) {
                // Busy wait
            }

            const metrics = queueManager.getMetrics();
            expect(metrics.avgWaitTimeByPriority[TaskPriority.NORMAL]).toBeGreaterThan(0);
        });

        it('should track longest wait time', () => {
            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            queueManager.enqueue(task1, TaskPriority.NORMAL);

            // Wait a bit
            const waitTime = 50;
            const start = Date.now();
            while (Date.now() - start < waitTime) {
                // Busy wait
            }

            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });
            queueManager.enqueue(task2, TaskPriority.NORMAL);

            const metrics = queueManager.getMetrics();
            expect(metrics.longestWaitTime).toBeGreaterThan(0);
        });

        it('should calculate utilization rate', () => {
            const smallQueue = new PriorityQueueManager({ maxQueueSize: 10 });

            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });

            smallQueue.enqueue(task1, TaskPriority.NORMAL);
            smallQueue.enqueue(task2, TaskPriority.NORMAL);

            const metrics = smallQueue.getMetrics();
            expect(metrics.utilizationRate).toBe(0.2); // 2/10

            smallQueue.shutdown();
        });
    });

    describe('Priority Adjustments', () => {
        it('should boost priority based on aging when enabled', () => {
            const agingQueue = new PriorityQueueManager({
                enableAging: true,
                agingThresholdMs: 100, // 100ms for testing
            });

            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            agingQueue.enqueue(task, TaskPriority.LOW);

            // Wait for aging threshold
            const start = Date.now();
            while (Date.now() - start < 150) {
                // Busy wait
            }

            // Trigger priority adjustment by peeking
            const peeked = agingQueue.peek();

            // Priority should have been boosted
            expect(peeked?.priority).toBeLessThan(TaskPriority.LOW);

            agingQueue.shutdown();
        });

        it('should boost priority based on deadline when enabled', () => {
            const deadlineQueue = new PriorityQueueManager({
                enableDeadlineBoost: true,
                deadlineBoostThresholdMs: 5000, // 5 seconds
            });

            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            const deadline = new Date(Date.now() + 3000); // 3 seconds from now

            deadlineQueue.enqueue(task, TaskPriority.NORMAL, { deadline });

            // Trigger priority adjustment
            const peeked = deadlineQueue.peek();

            // Priority should have been boosted to HIGH
            expect(peeked?.priority).toBe(TaskPriority.HIGH);

            deadlineQueue.shutdown();
        });
    });

    describe('Event Emission', () => {
        it('should emit task-enqueued event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            queueManager.on('task-enqueued', (entry) => {
                expect(entry.task.id).toBe(task.id);
                done();
            });

            queueManager.enqueue(task, TaskPriority.NORMAL);
        });

        it('should emit task-dequeued event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            queueManager.enqueue(task, TaskPriority.NORMAL);

            queueManager.on('task-dequeued', (entry) => {
                expect(entry.task.id).toBe(task.id);
                done();
            });

            queueManager.dequeue();
        });

        it('should emit priority-boosted event', (done) => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            queueManager.enqueue(task, TaskPriority.LOW);

            queueManager.on('priority-boosted', (entry, oldPriority, newPriority) => {
                expect(oldPriority).toBe(TaskPriority.LOW);
                expect(newPriority).toBe(TaskPriority.HIGH);
                done();
            });

            queueManager.updatePriority(task.id, TaskPriority.HIGH);
        });

        it('should emit queue-full event', (done) => {
            const smallQueue = new PriorityQueueManager({ maxQueueSize: 1 });

            const task1 = createWorkerTask('data-analyst', 'Task 1', { query: 'test1' });
            const task2 = createWorkerTask('data-analyst', 'Task 2', { query: 'test2' });

            smallQueue.enqueue(task1, TaskPriority.NORMAL);

            smallQueue.on('queue-full', (task) => {
                expect(task.id).toBe(task2.id);
                smallQueue.shutdown();
                done();
            });

            smallQueue.enqueue(task2, TaskPriority.NORMAL);
        });
    });

    describe('Helper Functions', () => {
        it('should determine priority for urgent tasks', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            const priority = determinePriority(task, { isUrgent: true });
            expect(priority).toBe(TaskPriority.CRITICAL);
        });

        it('should determine priority for tasks with deadlines', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            const priority = determinePriority(task, { hasDeadline: true });
            expect(priority).toBe(TaskPriority.HIGH);
        });

        it('should determine priority based on user preference', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });

            expect(determinePriority(task, { userPriority: 'high' })).toBe(TaskPriority.HIGH);
            expect(determinePriority(task, { userPriority: 'normal' })).toBe(TaskPriority.NORMAL);
            expect(determinePriority(task, { userPriority: 'low' })).toBe(TaskPriority.LOW);
        });

        it('should default to normal priority', () => {
            const task = createWorkerTask('data-analyst', 'Test task', { query: 'test' });
            const priority = determinePriority(task);
            expect(priority).toBe(TaskPriority.NORMAL);
        });
    });

    describe('Singleton Pattern', () => {
        afterEach(() => {
            resetPriorityQueueManager();
        });

        it('should return same instance', () => {
            const instance1 = getPriorityQueueManager();
            const instance2 = getPriorityQueueManager();

            expect(instance1).toBe(instance2);
        });

        it('should reset singleton', () => {
            const instance1 = getPriorityQueueManager();
            resetPriorityQueueManager();
            const instance2 = getPriorityQueueManager();

            expect(instance1).not.toBe(instance2);
        });
    });
});
