/**
 * Enhanced Agent Orchestrator
 * 
 * Advanced orchestration system that coordinates multiple agents for complex
 * multi-step workflows with intelligent task allocation and dependency management.
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { getAgentCore, type AgentStrand } from '../agent-core';
import { HubAgentRegistry, type HubAgentType } from '../hub-agents/hub-agent-registry';
import { getCrossHubCoordinator } from '../intelligence/cross-hub-coordinator';
import { getProactiveAgentManager } from '../proactive/proactive-agent-manager';
import { createWorkerTask, type WorkerTask, type WorkerResult } from '../worker-protocol';
import { getRepository } from '@/aws/dynamodb/repository';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Orchestration strategy types
 */
export type OrchestrationStrategy =
    | 'sequential'     // Execute tasks one after another
    | 'parallel'       // Execute tasks simultaneously
    | 'conditional'    // Execute based on conditions
    | 'adaptive'       // Dynamically adjust based on results
    | 'collaborative'; // Multiple agents work together

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Orchestrated task interface
 */
export interface OrchestratedTask {
    id: string;
    name: string;
    description: string;
    hubContext: string;
    agentType?: HubAgentType;
    priority: TaskPriority;
    inputs: Record<string, any>;
    expectedOutputs: string[];
    dependencies: string[];
    conditions?: Array<{
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
        value: any;
    }>;
    timeout?: number; // milliseconds
    retryConfig?: {
        maxRetries: number;
        backoffMultiplier: number;
    };
    metadata: Record<string, any>;
}

/**
 * Orchestration plan interface
 */
export interface OrchestrationPlan {
    id: string;
    userId: string;
    name: string;
    description: string;
    strategy: OrchestrationStrategy;
    tasks: OrchestratedTask[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        percentage: number;
    };
    results: Record<string, any>;
    executionLog: Array<{
        timestamp: string;
        taskId: string;
        event: string;
        details: any;
    }>;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    estimatedDuration?: number;
    actualDuration?: number;
}

/**
 * Agent allocation result
 */
interface AgentAllocation {
    task: OrchestratedTask;
    agent: AgentStrand;
    estimatedDuration: number;
    confidence: number;
}

/**
 * Enhanced Agent Orchestrator
 */
export class EnhancedOrchestrator extends EventEmitter {
    private agentCore = getAgentCore();
    private crossHubCoordinator = getCrossHubCoordinator();
    private proactiveManager = getProactiveAgentManager();
    private repository = getRepository();
    private activePlans: Map<string, OrchestrationPlan> = new Map();
    private taskExecutions: Map<string, Promise<WorkerResult>> = new Map();

    constructor() {
        super();
        this.setupEventHandlers();
    }

    /**
     * Create and execute an orchestration plan
     */
    async createOrchestrationPlan(
        userId: string,
        agentProfile: AgentProfile,
        planConfig: {
            name: string;
            description: string;
            strategy: OrchestrationStrategy;
            tasks: Omit<OrchestratedTask, 'id'>[];
            estimatedDuration?: number;
        }
    ): Promise<OrchestrationPlan> {
        const plan: OrchestrationPlan = {
            id: `plan-${userId}-${Date.now()}`,
            userId,
            name: planConfig.name,
            description: planConfig.description,
            strategy: planConfig.strategy,
            tasks: planConfig.tasks.map((task, index) => ({
                ...task,
                id: `task-${index + 1}-${Date.now()}`
            })),
            status: 'pending',
            progress: {
                totalTasks: planConfig.tasks.length,
                completedTasks: 0,
                failedTasks: 0,
                percentage: 0
            },
            results: {},
            executionLog: [],
            createdAt: new Date().toISOString(),
            estimatedDuration: planConfig.estimatedDuration
        };

        // Validate task dependencies
        this.validateTaskDependencies(plan.tasks);

        // Save plan to database
        await this.savePlan(plan);
        this.activePlans.set(plan.id, plan);

        // Start execution
        this.executePlan(plan.id, agentProfile);

        return plan;
    }

    /**
     * Execute an orchestration plan
     */
    private async executePlan(planId: string, agentProfile: AgentProfile): Promise<void> {
        const plan = this.activePlans.get(planId);
        if (!plan) return;

        try {
            plan.status = 'running';
            plan.startedAt = new Date().toISOString();
            await this.updatePlan(plan);

            this.logExecution(plan, 'plan-started', { strategy: plan.strategy });

            // Execute based on strategy
            switch (plan.strategy) {
                case 'sequential':
                    await this.executeSequential(plan, agentProfile);
                    break;
                case 'parallel':
                    await this.executeParallel(plan, agentProfile);
                    break;
                case 'conditional':
                    await this.executeConditional(plan, agentProfile);
                    break;
                case 'adaptive':
                    await this.executeAdaptive(plan, agentProfile);
                    break;
                case 'collaborative':
                    await this.executeCollaborative(plan, agentProfile);
                    break;
            }

            plan.status = 'completed';
            plan.completedAt = new Date().toISOString();
            plan.actualDuration = new Date(plan.completedAt).getTime() -
                new Date(plan.startedAt!).getTime();

            this.logExecution(plan, 'plan-completed', {
                duration: plan.actualDuration,
                results: Object.keys(plan.results).length
            });

            // Generate cross-hub insights from results
            await this.generateInsightsFromResults(plan, agentProfile);

            this.emit('plan-completed', { planId, results: plan.results });

        } catch (error) {
            plan.status = 'failed';
            this.logExecution(plan, 'plan-failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.emit('plan-failed', { planId, error });
        } finally {
            await this.updatePlan(plan);
            this.activePlans.delete(planId);
        }
    }

    /**
     * Sequential execution strategy
     */
    private async executeSequential(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        const sortedTasks = this.topologicalSort(plan.tasks);

        for (const task of sortedTasks) {
            if (this.shouldExecuteTask(task, plan.results)) {
                const result = await this.executeTask(task, plan, agentProfile);
                plan.results[task.id] = result;
                this.updateProgress(plan);
            }
        }
    }

    /**
     * Parallel execution strategy
     */
    private async executeParallel(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        const taskGroups = this.groupTasksByDependencies(plan.tasks);

        for (const group of taskGroups) {
            const promises = group
                .filter(task => this.shouldExecuteTask(task, plan.results))
                .map(async (task) => {
                    const result = await this.executeTask(task, plan, agentProfile);
                    plan.results[task.id] = result;
                    return { taskId: task.id, result };
                });

            const results = await Promise.allSettled(promises);

            // Handle results and failures
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.logExecution(plan, 'task-completed', {
                        taskId: result.value.taskId,
                        result: result.value.result
                    });
                } else {
                    plan.progress.failedTasks++;
                    this.logExecution(plan, 'task-failed', {
                        taskId: group[index].id,
                        error: result.reason
                    });
                }
            });

            this.updateProgress(plan);
        }
    }

    /**
     * Conditional execution strategy
     */
    private async executeConditional(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        const sortedTasks = this.topologicalSort(plan.tasks);

        for (const task of sortedTasks) {
            if (this.shouldExecuteTask(task, plan.results) && this.evaluateConditions(task, plan.results)) {
                const result = await this.executeTask(task, plan, agentProfile);
                plan.results[task.id] = result;
                this.updateProgress(plan);
            } else {
                this.logExecution(plan, 'task-skipped', {
                    taskId: task.id,
                    reason: 'conditions-not-met'
                });
            }
        }
    }

    /**
     * Adaptive execution strategy
     */
    private async executeAdaptive(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        const remainingTasks = [...plan.tasks];

        while (remainingTasks.length > 0) {
            // Select next best task based on current results and agent availability
            const nextTask = this.selectNextAdaptiveTask(remainingTasks, plan.results);

            if (!nextTask) break;

            const result = await this.executeTask(nextTask, plan, agentProfile);
            plan.results[nextTask.id] = result;

            // Remove completed task
            const taskIndex = remainingTasks.findIndex(t => t.id === nextTask.id);
            remainingTasks.splice(taskIndex, 1);

            // Adapt remaining tasks based on results
            this.adaptRemainingTasks(remainingTasks, result, plan.results);

            this.updateProgress(plan);
        }
    }

    /**
     * Collaborative execution strategy
     */
    private async executeCollaborative(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        // Group tasks by collaboration potential
        const collaborativeGroups = this.identifyCollaborativeGroups(plan.tasks);

        for (const group of collaborativeGroups) {
            if (group.length === 1) {
                // Single task execution
                const task = group[0];
                if (this.shouldExecuteTask(task, plan.results)) {
                    const result = await this.executeTask(task, plan, agentProfile);
                    plan.results[task.id] = result;
                }
            } else {
                // Multi-agent collaboration
                const collaborationResult = await this.executeCollaborativeGroup(group, plan, agentProfile);

                // Merge results from all tasks in the group
                group.forEach((task, index) => {
                    plan.results[task.id] = collaborationResult.taskResults[index];
                });
            }

            this.updateProgress(plan);
        }
    }

    /**
     * Execute a single task
     */
    private async executeTask(
        task: OrchestratedTask,
        plan: OrchestrationPlan,
        agentProfile: AgentProfile
    ): Promise<any> {
        this.logExecution(plan, 'task-started', { taskId: task.id, name: task.name });

        try {
            // Allocate appropriate agent
            const allocation = await this.allocateAgent(task, agentProfile);

            // Prepare task inputs with dependency results
            const taskInputs = this.prepareTaskInputs(task, plan.results);

            // Create worker task
            const workerTask = createWorkerTask(
                allocation.agent.type,
                task.description,
                taskInputs
            );

            // Execute task with timeout
            const timeoutMs = task.timeout || 300000; // 5 minutes default
            const executionPromise = this.executeWorkerTask(workerTask, allocation.agent);

            let result: WorkerResult;
            if (timeoutMs > 0) {
                result = await Promise.race([
                    executionPromise,
                    new Promise<WorkerResult>((_, reject) =>
                        setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
                    )
                ]);
            } else {
                result = await executionPromise;
            }

            if (result.status === 'success') {
                plan.progress.completedTasks++;
                this.logExecution(plan, 'task-completed', {
                    taskId: task.id,
                    agentId: allocation.agent.id,
                    duration: result.executionTime
                });
                return result.output;
            } else {
                throw new Error(result.error || 'Task execution failed');
            }

        } catch (error) {
            plan.progress.failedTasks++;
            this.logExecution(plan, 'task-failed', {
                taskId: task.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Retry logic
            if (task.retryConfig && task.retryConfig.maxRetries > 0) {
                return this.retryTask(task, plan, agentProfile, error);
            }

            throw error;
        }
    }

    /**
     * Allocate the best agent for a task
     */
    private async allocateAgent(task: OrchestratedTask, agentProfile: AgentProfile): Promise<AgentAllocation> {
        // Get recommended agent from registry
        const recommendedAgent = HubAgentRegistry.getRecommendedAgent(
            task.name,
            task.hubContext,
            task.expectedOutputs
        );

        if (!recommendedAgent) {
            throw new Error(`No suitable agent found for task: ${task.name}`);
        }

        // Allocate agent strand through AgentCore
        const workerTask = createWorkerTask(
            recommendedAgent.id as any,
            task.description,
            task.inputs
        );

        const agentStrand = await this.agentCore.allocateTask(workerTask);

        return {
            task,
            agent: agentStrand,
            estimatedDuration: this.estimateTaskDuration(task, recommendedAgent.capabilities),
            confidence: recommendedAgent.capabilities.qualityScore
        };
    }

    /**
     * Execute collaborative group of tasks
     */
    private async executeCollaborativeGroup(
        tasks: OrchestratedTask[],
        plan: OrchestrationPlan,
        agentProfile: AgentProfile
    ): Promise<{ taskResults: any[]; collaborationInsights: any }> {
        // Allocate agents for all tasks
        const allocations = await Promise.all(
            tasks.map(task => this.allocateAgent(task, agentProfile))
        );

        // Create shared context for collaboration
        const sharedContext = {
            planId: plan.id,
            userId: plan.userId,
            collaborativeTasks: tasks.map(t => ({ id: t.id, name: t.name, description: t.description })),
            agentProfiles: allocations.map(a => ({
                agentId: a.agent.id,
                capabilities: a.agent.capabilities,
                expertise: a.agent.capabilities.expertise
            }))
        };

        // Execute tasks with shared context
        const taskPromises = allocations.map(async (allocation, index) => {
            const task = tasks[index];
            const taskInputs = {
                ...this.prepareTaskInputs(task, plan.results),
                sharedContext,
                collaborationMode: true
            };

            const workerTask = createWorkerTask(
                allocation.agent.type,
                task.description,
                taskInputs
            );

            return this.executeWorkerTask(workerTask, allocation.agent);
        });

        const results = await Promise.all(taskPromises);

        // Extract collaboration insights
        const collaborationInsights = {
            agentInteractions: results.length,
            sharedKnowledge: sharedContext,
            emergentInsights: this.extractEmergentInsights(results)
        };

        return {
            taskResults: results.map(r => r.output),
            collaborationInsights
        };
    }

    /**
     * Helper methods
     */
    private validateTaskDependencies(tasks: OrchestratedTask[]): void {
        const taskIds = new Set(tasks.map(t => t.id));

        for (const task of tasks) {
            for (const dep of task.dependencies) {
                if (!taskIds.has(dep)) {
                    throw new Error(`Task ${task.id} has invalid dependency: ${dep}`);
                }
            }
        }

        // Check for circular dependencies
        if (this.hasCircularDependencies(tasks)) {
            throw new Error('Circular dependencies detected in task plan');
        }
    }

    private topologicalSort(tasks: OrchestratedTask[]): OrchestratedTask[] {
        const visited = new Set<string>();
        const result: OrchestratedTask[] = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        const visit = (taskId: string) => {
            if (visited.has(taskId)) return;
            visited.add(taskId);

            const task = taskMap.get(taskId);
            if (task) {
                task.dependencies.forEach(visit);
                result.push(task);
            }
        };

        tasks.forEach(task => visit(task.id));
        return result;
    }

    private shouldExecuteTask(task: OrchestratedTask, results: Record<string, any>): boolean {
        return task.dependencies.every(dep => results[dep] !== undefined);
    }

    private evaluateConditions(task: OrchestratedTask, results: Record<string, any>): boolean {
        if (!task.conditions || task.conditions.length === 0) return true;

        return task.conditions.every(condition => {
            const value = results[condition.field];

            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'not_equals':
                    return value !== condition.value;
                case 'greater_than':
                    return value > condition.value;
                case 'less_than':
                    return value < condition.value;
                case 'contains':
                    return Array.isArray(value) ? value.includes(condition.value) :
                        typeof value === 'string' ? value.includes(condition.value) : false;
                default:
                    return false;
            }
        });
    }

    private prepareTaskInputs(task: OrchestratedTask, results: Record<string, any>): Record<string, any> {
        const inputs = { ...task.inputs };

        // Add dependency results as inputs
        task.dependencies.forEach(dep => {
            if (results[dep]) {
                inputs[`dependency_${dep}`] = results[dep];
            }
        });

        return inputs;
    }

    private updateProgress(plan: OrchestrationPlan): void {
        plan.progress.percentage = (plan.progress.completedTasks / plan.progress.totalTasks) * 100;
        this.emit('plan-progress', {
            planId: plan.id,
            progress: plan.progress
        });
    }

    private logExecution(plan: OrchestrationPlan, event: string, details: any): void {
        plan.executionLog.push({
            timestamp: new Date().toISOString(),
            taskId: details.taskId || 'plan',
            event,
            details
        });
    }

    private async generateInsightsFromResults(plan: OrchestrationPlan, agentProfile: AgentProfile): Promise<void> {
        // Generate cross-hub insights from orchestration results
        const hubResults = this.groupResultsByHub(plan);

        for (const [hub, results] of Object.entries(hubResults)) {
            await this.crossHubCoordinator.generateCrossHubInsights(
                plan.userId,
                hub,
                results,
                agentProfile
            );
        }
    }

    private groupResultsByHub(plan: OrchestrationPlan): Record<string, any> {
        const hubResults: Record<string, any> = {};

        plan.tasks.forEach(task => {
            const hub = task.hubContext;
            if (!hubResults[hub]) {
                hubResults[hub] = {};
            }
            hubResults[hub][task.id] = plan.results[task.id];
        });

        return hubResults;
    }

    // Additional helper methods would be implemented here...
    private hasCircularDependencies(tasks: OrchestratedTask[]): boolean {
        // Implementation for circular dependency detection
        return false; // Simplified for now
    }

    private groupTasksByDependencies(tasks: OrchestratedTask[]): OrchestratedTask[][] {
        // Implementation for grouping tasks by dependency levels
        return [tasks]; // Simplified for now
    }

    private selectNextAdaptiveTask(tasks: OrchestratedTask[], results: Record<string, any>): OrchestratedTask | null {
        // Implementation for adaptive task selection
        return tasks.find(task => this.shouldExecuteTask(task, results)) || null;
    }

    private adaptRemainingTasks(tasks: OrchestratedTask[], result: any, allResults: Record<string, any>): void {
        // Implementation for adapting tasks based on results
    }

    private identifyCollaborativeGroups(tasks: OrchestratedTask[]): OrchestratedTask[][] {
        // Implementation for identifying collaborative task groups
        return tasks.map(task => [task]); // Simplified for now
    }

    private extractEmergentInsights(results: any[]): any {
        // Implementation for extracting emergent insights from collaboration
        return { insights: results.length };
    }

    private estimateTaskDuration(task: OrchestratedTask, capabilities: any): number {
        // Implementation for task duration estimation
        return 60000; // 1 minute default
    }

    private async executeWorkerTask(workerTask: WorkerTask, agent: AgentStrand): Promise<WorkerResult> {
        // Implementation would integrate with your existing worker execution system
        // For now, return a mock result
        return {
            taskId: workerTask.id,
            status: 'success',
            output: { result: 'Task completed successfully' },
            executionTime: 1000,
            agentId: agent.id
        };
    }

    private async retryTask(task: OrchestratedTask, plan: OrchestrationPlan, agentProfile: AgentProfile, lastError: any): Promise<any> {
        // Implementation for task retry logic
        throw lastError; // Simplified for now
    }

    private setupEventHandlers(): void {
        // Setup event handlers for agent core and other components
    }

    /**
     * Database operations
     */
    private async savePlan(plan: OrchestrationPlan): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${plan.userId}`,
            SK: `ORCHESTRATION_PLAN#${plan.id}`,
            ...plan
        });
    }

    private async updatePlan(plan: OrchestrationPlan): Promise<void> {
        await this.repository.updateItem(
            {
                PK: `USER#${plan.userId}`,
                SK: `ORCHESTRATION_PLAN#${plan.id}`
            },
            {
                status: plan.status,
                progress: plan.progress,
                results: plan.results,
                executionLog: plan.executionLog,
                startedAt: plan.startedAt,
                completedAt: plan.completedAt,
                actualDuration: plan.actualDuration,
                updatedAt: new Date().toISOString()
            }
        );
    }

    /**
     * Public API methods
     */
    async getPlan(userId: string, planId: string): Promise<OrchestrationPlan | null> {
        const item = await this.repository.getItem({
            PK: `USER#${userId}`,
            SK: `ORCHESTRATION_PLAN#${planId}`
        });

        return item as OrchestrationPlan || null;
    }

    async getUserPlans(userId: string): Promise<OrchestrationPlan[]> {
        const items = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'ORCHESTRATION_PLAN#' }
        });

        return items as OrchestrationPlan[];
    }

    async cancelPlan(userId: string, planId: string): Promise<void> {
        const plan = this.activePlans.get(planId);
        if (plan) {
            plan.status = 'cancelled';
            await this.updatePlan(plan);
            this.activePlans.delete(planId);
            this.emit('plan-cancelled', { planId });
        }
    }
}

/**
 * Singleton instance
 */
let enhancedOrchestratorInstance: EnhancedOrchestrator | null = null;

/**
 * Get the singleton EnhancedOrchestrator instance
 */
export function getEnhancedOrchestrator(): EnhancedOrchestrator {
    if (!enhancedOrchestratorInstance) {
        enhancedOrchestratorInstance = new EnhancedOrchestrator();
    }
    return enhancedOrchestratorInstance;
}

/**
 * Reset the EnhancedOrchestrator singleton (useful for testing)
 */
export function resetEnhancedOrchestrator(): void {
    if (enhancedOrchestratorInstance) {
        enhancedOrchestratorInstance.removeAllListeners();
        enhancedOrchestratorInstance = null;
    }
}