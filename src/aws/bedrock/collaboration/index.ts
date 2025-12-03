/**
 * Collaboration Module - Cross-strand collaboration infrastructure
 * 
 * This module provides the core infrastructure for multi-agent collaboration
 * including handoffs, shared context, dependency tracking, and parallel execution.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

export {
    HandoffManager,
    getHandoffManager,
    resetHandoffManager,
    type HandoffContext,
    type HandoffRecord,
} from './handoff-manager';

export {
    SharedContextPool,
    getSharedContextPool,
    resetSharedContextPool,
} from './shared-context-pool';

export {
    DependencyTracker,
    getDependencyTracker,
    resetDependencyTracker,
    type DependencyGraph,
} from './dependency-tracker';

export {
    ParallelExecutor,
    getParallelExecutor,
    resetParallelExecutor,
} from './parallel-executor';
