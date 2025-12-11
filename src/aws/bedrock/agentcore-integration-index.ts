/**
 * AgentCore Integration - Main Export
 * 
 * This module provides a unified interface to the enhanced AgentCore system
 * with all integrated components.
 */

// Main integration class
export {
    EnhancedAgentCore,
    getEnhancedAgentCore,
    resetEnhancedAgentCore,
} from './agentcore-integration';

// Core AgentCore exports
export {
    AgentCore,
    getAgentCore,
    resetAgentCore,
    type AgentStrand,
    type AgentCapabilities,
    type AgentStrandState,
    type AgentMemory,
    type TaskHistoryEntry,
    type AgentMetrics,
    type AllocationStrategy,
    type CoordinationEvents,
} from './agent-core';

// Collaboration Layer
export * from './collaboration';

// Learning Layer
export * from './learning';

// Specialization Layer
// export * from './specialization'; // Commented out due to PerformanceSnapshot conflict

// Intelligence Layer
export * from './intelligence';

// Multi-Modal Layer
export * from './multi-modal';

// Competitive Intelligence Layer
export * from './competitive-intelligence';

// Memory Layer
export * from './memory';

// Quality Assurance Layer
export * from './quality-assurance';

// Analytics Layer  
// export * from './analytics'; // Commented out due to PerformanceMetrics conflict

// Routing Layer
export * from './routing';

// Collaborative Editing Layer
export * from './collaborative-editing';

// Integration Layer
export * from './integration';

// Worker Protocol
export * from './worker-protocol';
