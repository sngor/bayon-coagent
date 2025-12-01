/**
 * AgentCore - Advanced Multi-Agent Coordination System
 * 
 * This module provides the core infrastructure for managing complex multi-agent
 * workflows with agent strands, dynamic task allocation, and intelligent coordination.
 * 
 * Features:
 * - Agent Strands: Persistent agent contexts that maintain state across tasks
 * - Dynamic Task Allocation: Intelligent routing based on agent capabilities
 * - Parallel Execution: Concurrent task processing with dependency management
 * - Context Sharing: Shared memory and knowledge between agents
 * - Adaptive Learning: Performance-based agent selection
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import type { WorkerTask, WorkerResult, WorkerAgentType } from './worker-protocol';
import { createWorkerTask, createSuccessResult, createErrorResult } from './worker-protocol';

/**
 * Agent Strand - Persistent agent context with memory and capabilities
 */
export interface AgentStrand {
    /** Unique strand identifier */
    id: string;

    /** Agent type and capabilities */
    type: WorkerAgentType;

    /** Agent specialization and expertise areas */
    capabilities: AgentCapabilities;

    /** Current strand state */
    state: AgentStrandState;

    /** Shared memory and context */
    memory: AgentMemory;

    /** Performance metrics */
    metrics: AgentMetrics;

    /** Creation timestamp */
    createdAt: string;

    /** Last activity timestamp */
    lastActiveAt: string;
}

/**
 * Agent capabilities and expertise definition
 */
export interface AgentCapabilities {
    /** Primary expertise areas */
    expertise: string[];

    /** Supported task types */
    taskTypes: string[];

    /** Quality score (0-1) */
    qualityScore: number;

    /** Speed score (0-1) */
    speedScore: number;

    /** Reliability score (0-1) */
    reliabilityScore: number;

    /** Maximum concurrent tasks */
    maxConcurrentTasks: number;

    /** Preferred model configuration */
    preferredModel?: string;
}

/**
 * Agent strand state
 */
export type AgentStrandState =
    | 'idle'
    | 'active'
    | 'busy'
    | 'overloaded'
    | 'error'
    | 'maintenance';

/**
 * Agent memory for context sharing
 */
export interface AgentMemory {
    /** Short-term working memory */
    workingMemory: Record<string, any>;

    /** Long-term knowledge base */
    knowledgeBase: Record<string, any>;

    /** Recent task history */
    recentTasks: TaskHistoryEntry[];

    /** Learned patterns and preferences */
    learnedPatterns: Record<string, any>;
}

/**
 * Task history entry
 */
export interface TaskHistoryEntry {
    taskId: string;
    taskType: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    executionTime: number;
    success: boolean;
    timestamp: string;
}

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
    /** Total tasks completed */
    tasksCompleted: number;

    /** Success rate (0-1) */
    successRate: number;

    /** Average execution time (ms) */
    avgExecutionTime: number;

    /** Current load (0-1) */
    currentLoad: number;

    /** Quality ratings from recent tasks */
    recentQualityRatings: number[];

    /** Last performance update */
    lastUpdated: string;
}

/**
 * Task allocation strategy
 */
export type AllocationStrategy =
    | 'round-robin'
    | 'load-balanced'
    | 'capability-based'
    | 'performance-based'
    | 'hybrid';

/**
 * Coordination event types
 */
export interface CoordinationEvents {
    'strand-created': (strand: AgentStrand) => void;
    'strand-updated': (strand: AgentStrand) => void;
    'task-allocated': (task: WorkerTask, strand: AgentStrand) => void;
    'task-completed': (result: WorkerResult, strand: AgentStrand) => void;
    'context-shared': (fromStrand: string, toStrand: string, context: any) => void;
    'performance-updated': (strand: AgentStrand, metrics: AgentMetrics) => void;
}

/**
 * AgentCore - Main coordination system
 */
export class AgentCore extends EventEmitter {
    private strands: Map<string, AgentStrand> = new Map();
    private taskQueue: WorkerTask[] = [];
    private activeAllocations: Map<string, string> = new Map(); // taskId -> strandId
    private allocationStrategy: AllocationStrategy = 'hybrid';

    constructor() {
        super();
        this.initializeDefaultStrands();
    }

    /**
     * Initialize default agent strands with predefined capabilities
     */
    private initializeDefaultStrands(): void {
        const defaultStrands: Omit<AgentStrand, 'id' | 'createdAt' | 'lastActiveAt'>[] = [
            {
                type: 'data-analyst',
                capabilities: {
                    expertise: ['market-analysis', 'property-data', 'statistical-analysis', 'trend-analysis'],
                    taskTypes: ['data-analysis', 'market-research', 'property-comparison', 'trend-forecasting'],
                    qualityScore: 0.9,
                    speedScore: 0.8,
                    reliabilityScore: 0.95,
                    maxConcurrentTasks: 3,
                    preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                },
                state: 'idle',
                memory: this.createEmptyMemory(),
                metrics: this.createInitialMetrics(),
            },
            {
                type: 'content-generator',
                capabilities: {
                    expertise: ['content-creation', 'copywriting', 'personalization', 'brand-voice'],
                    taskTypes: ['content-generation', 'email-writing', 'listing-descriptions', 'social-media'],
                    qualityScore: 0.85,
                    speedScore: 0.9,
                    reliabilityScore: 0.9,
                    maxConcurrentTasks: 4,
                    preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                },
                state: 'idle',
                memory: this.createEmptyMemory(),
                metrics: this.createInitialMetrics(),
            },
            {
                type: 'market-forecaster',
                capabilities: {
                    expertise: ['market-forecasting', 'investment-analysis', 'risk-assessment', 'economic-trends'],
                    taskTypes: ['market-prediction', 'investment-analysis', 'risk-evaluation', 'economic-modeling'],
                    qualityScore: 0.88,
                    speedScore: 0.7,
                    reliabilityScore: 0.92,
                    maxConcurrentTasks: 2,
                    preferredModel: 'us.anthropic.claude-3-opus-20240229-v1:0',
                },
                state: 'idle',
                memory: this.createEmptyMemory(),
                metrics: this.createInitialMetrics(),
            },
            {
                type: 'knowledge-retriever',
                capabilities: {
                    expertise: ['document-search', 'semantic-retrieval', 'context-extraction', 'knowledge-base-query'],
                    taskTypes: ['knowledge-query', 'document-retrieval', 'context-gathering', 'rag-retrieval'],
                    qualityScore: 0.95,
                    speedScore: 0.85,
                    reliabilityScore: 0.98,
                    maxConcurrentTasks: 5,
                    preferredModel: 'amazon.titan-embed-text-v2:0',
                },
                state: 'idle',
                memory: this.createEmptyMemory(),
                metrics: this.createInitialMetrics(),
            },
        ];

        defaultStrands.forEach(strandConfig => {
            const strand = this.createStrand(strandConfig);
            this.strands.set(strand.id, strand);
            this.emit('strand-created', strand);
        });
    }

    /**
     * Create a new agent strand
     */
    createStrand(config: Omit<AgentStrand, 'id' | 'createdAt' | 'lastActiveAt'>): AgentStrand {
        const now = new Date().toISOString();
        const strand: AgentStrand = {
            ...config,
            id: this.generateStrandId(),
            createdAt: now,
            lastActiveAt: now,
        };

        return strand;
    }

    /**
     * Allocate a task to the most suitable agent strand
     */
    async allocateTask(task: WorkerTask): Promise<AgentStrand> {
        const suitableStrands = this.findSuitableStrands(task);

        if (suitableStrands.length === 0) {
            throw new Error(`No suitable agent strand found for task type: ${task.type}`);
        }

        const selectedStrand = this.selectBestStrand(suitableStrands, task);

        // Update strand state
        selectedStrand.state = selectedStrand.metrics.currentLoad > 0.8 ? 'busy' : 'active';
        selectedStrand.lastActiveAt = new Date().toISOString();

        // Track allocation
        this.activeAllocations.set(task.id, selectedStrand.id);

        // Add to strand's working memory
        selectedStrand.memory.workingMemory[task.id] = {
            task: task,
            startTime: Date.now(),
        };

        this.emit('task-allocated', task, selectedStrand);

        return selectedStrand;
    }

    /**
     * Find agent strands suitable for a task
     */
    private findSuitableStrands(task: WorkerTask): AgentStrand[] {
        return Array.from(this.strands.values()).filter(strand => {
            // Check if strand can handle this task type
            if (strand.type !== task.type) return false;

            // Check if strand is available
            if (strand.state === 'error' || strand.state === 'maintenance') return false;

            // Check if strand is not overloaded
            if (strand.metrics.currentLoad >= 1.0) return false;

            // Check task type compatibility
            const taskTypeMatch = strand.capabilities.taskTypes.some(supportedType =>
                task.description.toLowerCase().includes(supportedType.toLowerCase())
            );

            return taskTypeMatch;
        });
    }

    /**
     * Select the best strand based on allocation strategy
     */
    private selectBestStrand(candidates: AgentStrand[], task: WorkerTask): AgentStrand {
        switch (this.allocationStrategy) {
            case 'round-robin':
                return this.selectRoundRobin(candidates);

            case 'load-balanced':
                return this.selectLoadBalanced(candidates);

            case 'capability-based':
                return this.selectCapabilityBased(candidates, task);

            case 'performance-based':
                return this.selectPerformanceBased(candidates);

            case 'hybrid':
            default:
                return this.selectHybrid(candidates, task);
        }
    }

    /**
     * Round-robin selection
     */
    private selectRoundRobin(candidates: AgentStrand[]): AgentStrand {
        // Simple round-robin based on last activity
        return candidates.sort((a, b) =>
            new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()
        )[0];
    }

    /**
     * Load-balanced selection
     */
    private selectLoadBalanced(candidates: AgentStrand[]): AgentStrand {
        return candidates.sort((a, b) => a.metrics.currentLoad - b.metrics.currentLoad)[0];
    }

    /**
     * Capability-based selection
     */
    private selectCapabilityBased(candidates: AgentStrand[], task: WorkerTask): AgentStrand {
        return candidates.sort((a, b) => {
            const aScore = this.calculateCapabilityScore(a, task);
            const bScore = this.calculateCapabilityScore(b, task);
            return bScore - aScore; // Higher score first
        })[0];
    }

    /**
     * Performance-based selection
     */
    private selectPerformanceBased(candidates: AgentStrand[]): AgentStrand {
        return candidates.sort((a, b) => {
            const aScore = (a.metrics.successRate * 0.4) +
                (a.capabilities.qualityScore * 0.3) +
                (a.capabilities.speedScore * 0.3);
            const bScore = (b.metrics.successRate * 0.4) +
                (b.capabilities.qualityScore * 0.3) +
                (b.capabilities.speedScore * 0.3);
            return bScore - aScore; // Higher score first
        })[0];
    }

    /**
     * Hybrid selection (combines multiple factors)
     */
    private selectHybrid(candidates: AgentStrand[], task: WorkerTask): AgentStrand {
        return candidates.sort((a, b) => {
            const aCapabilityScore = this.calculateCapabilityScore(a, task);
            const aPerformanceScore = (a.metrics.successRate * 0.4) +
                (a.capabilities.qualityScore * 0.3) +
                (a.capabilities.speedScore * 0.3);
            const aLoadPenalty = a.metrics.currentLoad;
            const aFinalScore = (aCapabilityScore * 0.4) + (aPerformanceScore * 0.4) - (aLoadPenalty * 0.2);

            const bCapabilityScore = this.calculateCapabilityScore(b, task);
            const bPerformanceScore = (b.metrics.successRate * 0.4) +
                (b.capabilities.qualityScore * 0.3) +
                (b.capabilities.speedScore * 0.3);
            const bLoadPenalty = b.metrics.currentLoad;
            const bFinalScore = (bCapabilityScore * 0.4) + (bPerformanceScore * 0.4) - (bLoadPenalty * 0.2);

            return bFinalScore - aFinalScore; // Higher score first
        })[0];
    }

    /**
     * Calculate capability score for a strand and task
     */
    private calculateCapabilityScore(strand: AgentStrand, task: WorkerTask): number {
        let score = 0;

        // Check expertise match
        const taskDescription = task.description.toLowerCase();
        const expertiseMatches = strand.capabilities.expertise.filter(expertise =>
            taskDescription.includes(expertise.toLowerCase())
        ).length;
        score += expertiseMatches * 0.3;

        // Check task type match
        const taskTypeMatches = strand.capabilities.taskTypes.filter(taskType =>
            taskDescription.includes(taskType.toLowerCase())
        ).length;
        score += taskTypeMatches * 0.4;

        // Add base capability scores
        score += strand.capabilities.qualityScore * 0.3;

        return Math.min(score, 1.0); // Cap at 1.0
    }

    /**
     * Update strand performance metrics after task completion
     */
    updateStrandMetrics(strandId: string, result: WorkerResult): void {
        const strand = this.strands.get(strandId);
        if (!strand) return;

        const taskMemory = strand.memory.workingMemory[result.taskId];
        if (!taskMemory) return;

        const executionTime = result.metadata.executionTime;
        const success = result.status === 'success';

        // Update metrics
        strand.metrics.tasksCompleted += 1;
        strand.metrics.successRate = this.calculateSuccessRate(strand, success);
        strand.metrics.avgExecutionTime = this.calculateAvgExecutionTime(strand, executionTime);
        strand.metrics.currentLoad = this.calculateCurrentLoad(strand);
        strand.metrics.lastUpdated = new Date().toISOString();

        // Add to task history
        const historyEntry: TaskHistoryEntry = {
            taskId: result.taskId,
            taskType: taskMemory.task.type,
            input: taskMemory.task.input,
            output: result.output,
            executionTime,
            success,
            timestamp: new Date().toISOString(),
        };

        strand.memory.recentTasks.unshift(historyEntry);

        // Keep only last 50 tasks
        if (strand.memory.recentTasks.length > 50) {
            strand.memory.recentTasks = strand.memory.recentTasks.slice(0, 50);
        }

        // Clean up working memory
        delete strand.memory.workingMemory[result.taskId];

        // Update strand state
        strand.state = strand.metrics.currentLoad > 0.8 ? 'busy' :
            strand.metrics.currentLoad > 0 ? 'active' : 'idle';
        strand.lastActiveAt = new Date().toISOString();

        // Remove from active allocations
        this.activeAllocations.delete(result.taskId);

        this.emit('performance-updated', strand, strand.metrics);
        this.emit('task-completed', result, strand);
    }

    /**
     * Share context between agent strands
     */
    shareContext(fromStrandId: string, toStrandId: string, context: any): void {
        const fromStrand = this.strands.get(fromStrandId);
        const toStrand = this.strands.get(toStrandId);

        if (!fromStrand || !toStrand) return;

        // Add context to target strand's knowledge base
        const contextKey = `shared_from_${fromStrandId}_${Date.now()}`;
        toStrand.memory.knowledgeBase[contextKey] = {
            source: fromStrandId,
            context,
            timestamp: new Date().toISOString(),
        };

        this.emit('context-shared', fromStrandId, toStrandId, context);
    }

    /**
     * Get strand by ID
     */
    getStrand(strandId: string): AgentStrand | undefined {
        return this.strands.get(strandId);
    }

    /**
     * Get all strands
     */
    getAllStrands(): AgentStrand[] {
        return Array.from(this.strands.values());
    }

    /**
     * Get strands by type
     */
    getStrandsByType(type: WorkerAgentType): AgentStrand[] {
        return Array.from(this.strands.values()).filter(strand => strand.type === type);
    }

    /**
     * Set allocation strategy
     */
    setAllocationStrategy(strategy: AllocationStrategy): void {
        this.allocationStrategy = strategy;
    }

    /**
     * Helper methods
     */
    private generateStrandId(): string {
        return `strand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private createEmptyMemory(): AgentMemory {
        return {
            workingMemory: {},
            knowledgeBase: {},
            recentTasks: [],
            learnedPatterns: {},
        };
    }

    private createInitialMetrics(): AgentMetrics {
        return {
            tasksCompleted: 0,
            successRate: 1.0,
            avgExecutionTime: 0,
            currentLoad: 0,
            recentQualityRatings: [],
            lastUpdated: new Date().toISOString(),
        };
    }

    private calculateSuccessRate(strand: AgentStrand, newSuccess: boolean): number {
        const recentTasks = strand.memory.recentTasks.slice(0, 20); // Last 20 tasks
        const successCount = recentTasks.filter(t => t.success).length + (newSuccess ? 1 : 0);
        const totalCount = recentTasks.length + 1;
        return successCount / totalCount;
    }

    private calculateAvgExecutionTime(strand: AgentStrand, newTime: number): number {
        const recentTasks = strand.memory.recentTasks.slice(0, 10); // Last 10 tasks
        const totalTime = recentTasks.reduce((sum, t) => sum + t.executionTime, 0) + newTime;
        const totalCount = recentTasks.length + 1;
        return totalTime / totalCount;
    }

    private calculateCurrentLoad(strand: AgentStrand): number {
        const activeTasks = Object.keys(strand.memory.workingMemory).length;
        return activeTasks / strand.capabilities.maxConcurrentTasks;
    }
}

/**
 * Singleton instance
 */
let agentCoreInstance: AgentCore | null = null;

/**
 * Get the singleton AgentCore instance
 */
export function getAgentCore(): AgentCore {
    if (!agentCoreInstance) {
        agentCoreInstance = new AgentCore();
    }
    return agentCoreInstance;
}

/**
 * Reset the AgentCore singleton (useful for testing)
 */
export function resetAgentCore(): void {
    if (agentCoreInstance) {
        agentCoreInstance.removeAllListeners();
    }
    agentCoreInstance = null;
}