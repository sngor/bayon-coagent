/**
 * Routing Module - Adaptive Task Routing and Priority Management
 * 
 * This module provides intelligent task routing capabilities including:
 * - Priority-based task queuing
 * - Urgent task handling
 * - Queue metrics and monitoring
 * - Integration with AgentCore
 */

export {
    PriorityQueueManager,
    TaskPriority,
    determinePriority,
    getPriorityQueueManager,
    resetPriorityQueueManager,
} from './priority-queue-manager';

export type {
    PriorityQueueEntry,
    QueueMetrics,
    QueueConfig,
    PriorityQueueEvents,
} from './priority-queue-manager';

export {
    PriorityAwareOrchestrator,
    getPriorityAwareOrchestrator,
    resetPriorityAwareOrchestrator,
    exampleUsage,
} from './priority-queue-integration';
