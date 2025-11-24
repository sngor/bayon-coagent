/**
 * Enhanced Workflow Orchestrator with AgentCore Integration
 * 
 * This orchestrator leverages AgentCore and Agent Strands for sophisticated
 * multi-agent coordination, adaptive task allocation, and intelligent workflow management.
 * 
 * Features:
 * - Dynamic agent strand allocation based on capabilities and performance
 * - Parallel execution with intelligent dependency management
 * - Context sharing between agents for improved collaboration
 * - Adaptive learning from workflow outcomes
 * - Real-time performance monitoring and optimization
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from './flow-base';
import { getAgentCore, type AgentCore, type AgentStrand } from './agent-core';
import { createStrandInstance } from './agent-strands';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import type { WorkerTask, WorkerResult } from './worker-protocol';
import { createWorkerTask, isSuccessResult, isErrorResult } from './worker-protocol';

/**
 * Enhanced task decomposition with capability matching
 */
const EnhancedTaskDecompositionSchema = z.object({
    tasks: z.array(z.object({
        type: z.enum(['data-analyst', 'content-generator', 'market-forecaster', 'search']),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        complexity: z.enum(['simple', 'moderate', 'complex', 'expert']),
        dependencies: z.array(z.string()).default([]),
        requiredCapabilities: z.array(z.string()),
        estimatedDuration: z.number().optional(),
        input: z.record(z.any()),
        contextSharing: z.object({
            requiresContext: z.boolean(),
            sharesContext: z.boolean(),
            contextKeys: z.array(z.string()).optional(),
        }).optional(),
        reasoning: z.string(),
    })).min(2).max(6), // Increased max for more complex workflows
    executionStrategy: z.enum(['sequential', 'parallel', 'mixed', 'adaptive']),
    coordinationPlan: z.object({
        contextSharingPlan: z.array(z.object({
            fromTask: z.string(),
            toTask: z.string(),
            contextType: z.string(),
            timing: z.enum(['immediate', 'on-completion', 'on-demand']),
        })),
        criticalPath: z.array(z.string()),
        parallelGroups: z.array(z.array(z.string())),
    }),
    qualityRequirements: z.object({
        minimumConfidence: z.number().min(0).max(1),
        requiresCitation: z.boolean(),
        requiresPersonalization: z.boolean(),
    }),
    reasoning: z.string(),
});

type EnhancedTaskDecomposition = z.infer<typeof EnhancedTaskDecompositionSchema>;

/**
 * Enhanced workflow execution result with detailed analytics
 */
export interface EnhancedWorkflowResult {
    synthesizedResponse: string;
    keyPoints: string[];
    citations: Array<{
        url: string;
        title: string;
        sourceType: string;
    }>;
    tasks: WorkerTask[];
    results: WorkerResult[];
    executionMetrics: {
        totalExecutionTime: number;
        parallelEfficiency: number;
        agentUtilization: Record<string, number>;
        contextSharingEvents: number;
        qualityScore: number;
        confidenceScore: number;
    };
    agentPerformance: Array<{
        strandId: string;
        agentType: string;
        tasksCompleted: number;
        avgExecutionTime: number;
        successRate: number;
        qualityScore: number;
    }>;
    workflowInsights: {
        bottlenecks: string[];
        optimizationSuggestions: string[];
        learningPoints: string[];
    };
    failedTasks: string[];
}

/**
 * Enhanced Workflow Orchestrator
 */
export class EnhancedWorkflowOrchestrator {
    private agentCore: AgentCore;
    private activeWorkflows: Map<string, WorkflowExecution> = new Map();

    constructor() {
        this.agentCore = getAgentCore();
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for agent coordination
     */
    private setupEventListeners(): void {
        this.agentCore.on('task-completed', (result: WorkerResult, strand: AgentStrand) => {
            this.handleTaskCompletion(result, strand);
        });

        this.agentCore.on('context-shared', (fromStrand: string, toStrand: string, context: any) => {
            this.handleContextSharing(fromStrand, toStrand, context);
        });
    }

    /**
     * Enhanced request decomposition with capability analysis
     */
    async decomposeRequest(
        prompt: string,
        agentProfile?: AgentProfile,
        options?: {
            maxTasks?: number;
            priorityLevel?: 'low' | 'medium' | 'high' | 'critical';
            qualityRequirements?: {
                minimumConfidence?: number;
                requiresCitation?: boolean;
                requiresPersonalization?: boolean;
            };
        }
    ): Promise<{ tasks: WorkerTask[]; coordinationPlan: any }> {
        // Get available agent capabilities
        const availableStrands = this.agentCore.getAllStrands();
        const capabilityMatrix = this.buildCapabilityMatrix(availableStrands);

        // Enhanced decomposition prompt
        const decompositionPrompt = definePrompt({
            name: 'enhancedWorkflowDecomposition',
            inputSchema: z.object({
                prompt: z.string(),
                agentProfile: z.any().optional(),
                availableCapabilities: z.record(z.any()),
                maxTasks: z.number().optional(),
                priorityLevel: z.string().optional(),
                qualityRequirements: z.any().optional(),
            }),
            outputSchema: EnhancedTaskDecompositionSchema,
            options: MODEL_CONFIGS.ANALYTICAL,
            systemPrompt: `You are an advanced workflow orchestration expert with deep understanding of agent capabilities and coordination strategies. Your role is to decompose complex requests into optimally coordinated sub-tasks.

**Enhanced Orchestration Capabilities:**
1. **Capability Matching**: Match tasks to agents based on expertise and performance
2. **Intelligent Coordination**: Plan context sharing and dependency management
3. **Performance Optimization**: Consider agent load, speed, and quality scores
4. **Adaptive Execution**: Design workflows that can adapt to changing conditions
5. **Quality Assurance**: Ensure tasks meet specified quality requirements

**Available Agent Types and Capabilities:**
- **data-analyst**: Market analysis, statistical analysis, trend analysis, property data
  - Strengths: Accuracy, data processing, market insights
  - Best for: Research, analysis, data-driven insights
  
- **content-generator**: Content creation, copywriting, personalization, brand voice
  - Strengths: Creativity, personalization, brand consistency
  - Best for: Marketing content, listings, communications
  
- **market-forecaster**: Market predictions, investment analysis, risk assessment
  - Strengths: Forecasting accuracy, risk analysis, economic modeling
  - Best for: Predictions, investment advice, market trends

**Coordination Strategies:**
- **Context Sharing**: Plan how agents share insights and build on each other's work
- **Dependency Management**: Optimize task sequencing for maximum efficiency
- **Parallel Execution**: Identify tasks that can run simultaneously
- **Quality Gates**: Ensure output quality meets requirements

**Task Complexity Levels:**
- **simple**: Basic, straightforward tasks (5-15 min)
- **moderate**: Standard tasks requiring some analysis (15-30 min)
- **complex**: Multi-step tasks requiring deep analysis (30-60 min)
- **expert**: Highly specialized tasks requiring domain expertise (60+ min)

**Priority Levels:**
- **critical**: Must succeed, use best agents, maximum quality
- **high**: Important for workflow success, prefer high-performance agents
- **medium**: Standard priority, balance quality and efficiency
- **low**: Nice to have, can use available capacity`,
            prompt: `Analyze this complex request and create an optimized workflow:

**User Request:**
{{{prompt}}}

**Agent Profile Context:**
{{{json agentProfile}}}

**Available Agent Capabilities:**
{{{json availableCapabilities}}}

**Workflow Constraints:**
- Maximum Tasks: {{{maxTasks}}} (default: 4)
- Priority Level: {{{priorityLevel}}} (default: medium)
- Quality Requirements: {{{json qualityRequirements}}}

Create an optimized workflow with:
1. **Task Decomposition**: 2-6 tasks matched to agent capabilities
2. **Coordination Plan**: Context sharing, dependencies, parallel execution
3. **Quality Requirements**: Confidence levels, citation needs, personalization
4. **Execution Strategy**: Sequential, parallel, mixed, or adaptive

**Requirements:**
- Match tasks to agent strengths and current performance
- Plan efficient context sharing between agents
- Optimize for both quality and execution time
- Consider agent load balancing
- Ensure quality requirements are met

Provide detailed reasoning for task allocation and coordination decisions.`,
        });

        // Execute decomposition
        const decomposition = await decompositionPrompt({
            prompt,
            agentProfile: agentProfile || null,
            availableCapabilities: capabilityMatrix,
            maxTasks: options?.maxTasks || 4,
            priorityLevel: options?.priorityLevel || 'medium',
            qualityRequirements: options?.qualityRequirements || {},
        });

        // Convert to WorkerTask objects with enhanced metadata
        const workerTasks: WorkerTask[] = decomposition.tasks.map((task, index) => {
            const taskId = `task_${Date.now()}_${index}`;

            return createWorkerTask(
                task.type,
                task.description,
                {
                    ...task.input,
                    _metadata: {
                        priority: task.priority,
                        complexity: task.complexity,
                        requiredCapabilities: task.requiredCapabilities,
                        estimatedDuration: task.estimatedDuration,
                        contextSharing: task.contextSharing,
                    },
                },
                {
                    dependencies: task.dependencies.map(depIndex => `task_${Date.now()}_${depIndex}`),
                    context: {
                        userId: agentProfile?.userId,
                        agentProfile,
                        workflowId: `workflow_${Date.now()}`,
                        qualityRequirements: decomposition.qualityRequirements,
                    },
                }
            );
        });

        return {
            tasks: workerTasks,
            coordinationPlan: decomposition.coordinationPlan,
        };
    }

    /**
     * Execute enhanced workflow with intelligent coordination
     */
    async executeEnhancedWorkflow(
        tasks: WorkerTask[],
        coordinationPlan: any,
        options?: {
            enableAdaptiveExecution?: boolean;
            qualityThreshold?: number;
            timeoutMs?: number;
        }
    ): Promise<WorkerResult[]> {
        const workflowId = `workflow_${Date.now()}`;
        const execution = new WorkflowExecution(workflowId, tasks, coordinationPlan, this.agentCore);

        this.activeWorkflows.set(workflowId, execution);

        try {
            const results = await execution.execute(options);

            // Update agent performance metrics
            results.forEach(result => {
                const strandId = execution.getStrandForTask(result.taskId);
                if (strandId) {
                    this.agentCore.updateStrandMetrics(strandId, result);
                }
            });

            return results;
        } finally {
            this.activeWorkflows.delete(workflowId);
        }
    }

    /**
     * Execute complete enhanced workflow from request to result
     */
    async executeCompleteEnhancedWorkflow(
        prompt: string,
        agentProfile?: AgentProfile,
        options?: {
            maxTasks?: number;
            priorityLevel?: 'low' | 'medium' | 'high' | 'critical';
            qualityRequirements?: {
                minimumConfidence?: number;
                requiresCitation?: boolean;
                requiresPersonalization?: boolean;
            };
            enableAdaptiveExecution?: boolean;
            timeoutMs?: number;
        }
    ): Promise<EnhancedWorkflowResult> {
        const startTime = Date.now();

        try {
            // Step 1: Enhanced decomposition
            const { tasks, coordinationPlan } = await this.decomposeRequest(
                prompt,
                agentProfile,
                {
                    maxTasks: options?.maxTasks,
                    priorityLevel: options?.priorityLevel,
                    qualityRequirements: options?.qualityRequirements,
                }
            );

            // Step 2: Execute workflow with coordination
            const results = await this.executeEnhancedWorkflow(
                tasks,
                coordinationPlan,
                {
                    enableAdaptiveExecution: options?.enableAdaptiveExecution,
                    qualityThreshold: options?.qualityRequirements?.minimumConfidence,
                    timeoutMs: options?.timeoutMs,
                }
            );

            // Step 3: Enhanced synthesis with quality analysis
            const synthesis = await this.synthesizeEnhancedResults(
                results,
                agentProfile,
                prompt,
                coordinationPlan
            );

            // Step 4: Generate execution metrics and insights
            const executionMetrics = this.calculateExecutionMetrics(tasks, results, startTime);
            const agentPerformance = this.analyzeAgentPerformance(results);
            const workflowInsights = this.generateWorkflowInsights(tasks, results, coordinationPlan);

            const totalExecutionTime = Date.now() - startTime;

            return {
                synthesizedResponse: synthesis.synthesizedResponse,
                keyPoints: synthesis.keyPoints,
                citations: synthesis.citations || [],
                tasks,
                results,
                executionMetrics: {
                    ...executionMetrics,
                    totalExecutionTime,
                },
                agentPerformance,
                workflowInsights,
                failedTasks: results.filter(isErrorResult).map(r => r.taskId),
            };
        } catch (error) {
            console.error('Enhanced workflow execution error:', error);
            throw error;
        }
    }

    /**
     * Build capability matrix for available agents
     */
    private buildCapabilityMatrix(strands: AgentStrand[]): Record<string, any> {
        const matrix: Record<string, any> = {};

        strands.forEach(strand => {
            matrix[strand.type] = {
                capabilities: strand.capabilities,
                currentLoad: strand.metrics.currentLoad,
                successRate: strand.metrics.successRate,
                avgExecutionTime: strand.metrics.avgExecutionTime,
                qualityScore: strand.capabilities.qualityScore,
                state: strand.state,
            };
        });

        return matrix;
    }

    /**
     * Enhanced result synthesis with quality analysis
     */
    private async synthesizeEnhancedResults(
        results: WorkerResult[],
        agentProfile?: AgentProfile,
        originalPrompt?: string,
        coordinationPlan?: any
    ): Promise<{
        synthesizedResponse: string;
        keyPoints: string[];
        citations: Array<{ url: string; title: string; sourceType: string }>;
    }> {
        const successfulResults = results.filter(isSuccessResult);
        const failedResults = results.filter(isErrorResult);

        if (successfulResults.length === 0) {
            throw new Error('All agent tasks failed. Cannot synthesize results.');
        }

        // Enhanced synthesis prompt with quality analysis
        const enhancedSynthesisPrompt = definePrompt({
            name: 'enhancedResultSynthesis',
            inputSchema: z.object({
                originalPrompt: z.string().optional(),
                results: z.string(),
                failedTasks: z.string().optional(),
                agentProfile: z.any().optional(),
                coordinationPlan: z.any().optional(),
                qualityMetrics: z.record(z.number()),
            }),
            outputSchema: z.object({
                synthesizedResponse: z.string(),
                keyPoints: z.array(z.string()),
                citations: z.array(z.object({
                    url: z.string(),
                    title: z.string(),
                    sourceType: z.string(),
                })).optional(),
                qualityAssessment: z.object({
                    overallQuality: z.number().min(0).max(1),
                    confidenceLevel: z.number().min(0).max(1),
                    completeness: z.number().min(0).max(1),
                    consistency: z.number().min(0).max(1),
                }),
            }),
            options: MODEL_CONFIGS.BALANCED,
            systemPrompt: `You are an advanced synthesis expert with quality analysis capabilities. You combine multi-agent results into cohesive, high-quality responses while maintaining rigorous quality standards.

**Enhanced Synthesis Capabilities:**
1. **Quality Integration**: Weigh results based on agent performance and confidence
2. **Consistency Analysis**: Ensure coherent narrative across different agent outputs
3. **Completeness Assessment**: Identify gaps and ensure comprehensive coverage
4. **Citation Management**: Properly attribute and format all sources
5. **Personalization Integration**: Seamlessly incorporate agent profile elements

**Quality Standards:**
- Prioritize high-confidence results from high-performing agents
- Resolve conflicts between agent outputs intelligently
- Maintain consistent tone and messaging throughout
- Ensure all claims are properly supported and cited
- Provide clear quality assessment metrics

**Synthesis Process:**
1. Analyze quality and confidence of each agent result
2. Identify key insights and supporting evidence
3. Resolve any conflicts or inconsistencies
4. Create cohesive narrative with proper attribution
5. Assess overall quality and completeness`,
            prompt: `Synthesize multi-agent results with enhanced quality analysis:

**Original Request:** {{{originalPrompt}}}

**Agent Profile:** {{{json agentProfile}}}

**Coordination Plan:** {{{json coordinationPlan}}}

**Agent Results:**
{{{results}}}

{{{failedTasks}}}

**Quality Metrics:** {{{json qualityMetrics}}}

Create a synthesized response that:
1. Integrates all successful results with quality weighting
2. Resolves any conflicts or inconsistencies
3. Maintains agent personalization and brand voice
4. Includes comprehensive citation management
5. Provides detailed quality assessment

Focus on creating a cohesive, high-quality response that leverages the best insights from each agent while maintaining consistency and accuracy.`,
        });

        // Prepare results and quality metrics
        const resultsText = this.formatResultsForSynthesis(successfulResults);
        const qualityMetrics = this.calculateQualityMetrics(successfulResults);
        const failedTasksText = failedResults.length > 0
            ? `\n**Failed Tasks:**\n${failedResults.map(r => `- ${r.workerType}: ${r.error?.message}`).join('\n')}`
            : '';

        // Execute synthesis
        const synthesis = await enhancedSynthesisPrompt({
            originalPrompt: originalPrompt || 'User request',
            results: resultsText,
            failedTasks: failedTasksText,
            agentProfile: agentProfile || null,
            coordinationPlan: coordinationPlan || null,
            qualityMetrics,
        });

        // Collect all citations
        const allCitations = successfulResults
            .flatMap(result => result.citations || [])
            .filter((citation, index, self) =>
                index === self.findIndex(c => c.url === citation.url)
            );

        return {
            synthesizedResponse: synthesis.synthesizedResponse,
            keyPoints: synthesis.keyPoints,
            citations: synthesis.citations || allCitations,
        };
    }

    /**
     * Format results for synthesis
     */
    private formatResultsForSynthesis(results: WorkerResult[]): string {
        return results.map((result, index) => {
            const output = result.output || {};
            const confidence = output.confidence || output.confidenceLevel || 'N/A';

            return `
**Agent ${index + 1} (${result.workerType}) - Confidence: ${confidence}:**
${JSON.stringify(output, null, 2)}

**Execution Time:** ${result.metadata.executionTime}ms
**Citations:** ${(result.citations || []).length} sources
`;
        }).join('\n---\n');
    }

    /**
     * Calculate quality metrics for results
     */
    private calculateQualityMetrics(results: WorkerResult[]): Record<string, number> {
        const metrics: Record<string, number> = {};

        results.forEach((result, index) => {
            const output = result.output || {};
            const confidence = output.confidence || output.confidenceLevel || 0.5;
            const executionTime = result.metadata.executionTime;

            metrics[`agent_${index}_confidence`] = confidence;
            metrics[`agent_${index}_speed`] = Math.max(0, 1 - (executionTime / 60000)); // Normalize to 0-1 based on 1 minute
        });

        // Calculate overall metrics
        const confidences = Object.values(metrics).filter(v => v <= 1);
        metrics.avgConfidence = confidences.length > 0
            ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
            : 0.5;

        return metrics;
    }

    /**
     * Calculate execution metrics
     */
    private calculateExecutionMetrics(tasks: WorkerTask[], results: WorkerResult[], startTime: number): any {
        const totalTime = Date.now() - startTime;
        const successfulResults = results.filter(isSuccessResult);

        // Calculate parallel efficiency
        const totalAgentTime = results.reduce((sum, r) => sum + r.metadata.executionTime, 0);
        const parallelEfficiency = totalAgentTime > 0 ? Math.min(1, totalAgentTime / totalTime) : 0;

        // Calculate agent utilization
        const agentUtilization: Record<string, number> = {};
        results.forEach(result => {
            const utilizationKey = result.workerType;
            if (!agentUtilization[utilizationKey]) {
                agentUtilization[utilizationKey] = 0;
            }
            agentUtilization[utilizationKey] += result.metadata.executionTime / totalTime;
        });

        // Calculate quality and confidence scores
        const qualityScore = successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => {
                const output = r.output || {};
                return sum + (output.qualityScore || output.confidence || 0.5);
            }, 0) / successfulResults.length
            : 0;

        const confidenceScore = successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => {
                const output = r.output || {};
                return sum + (output.confidence || output.confidenceLevel || 0.5);
            }, 0) / successfulResults.length
            : 0;

        return {
            parallelEfficiency,
            agentUtilization,
            contextSharingEvents: 0, // TODO: Track context sharing events
            qualityScore,
            confidenceScore,
        };
    }

    /**
     * Analyze agent performance
     */
    private analyzeAgentPerformance(results: WorkerResult[]): Array<{
        strandId: string;
        agentType: string;
        tasksCompleted: number;
        avgExecutionTime: number;
        successRate: number;
        qualityScore: number;
    }> {
        const performanceMap = new Map<string, any>();

        results.forEach(result => {
            const key = result.workerType;
            if (!performanceMap.has(key)) {
                performanceMap.set(key, {
                    strandId: 'unknown', // TODO: Track strand IDs
                    agentType: result.workerType,
                    tasksCompleted: 0,
                    totalExecutionTime: 0,
                    successCount: 0,
                    totalQuality: 0,
                });
            }

            const perf = performanceMap.get(key);
            perf.tasksCompleted += 1;
            perf.totalExecutionTime += result.metadata.executionTime;

            if (result.status === 'success') {
                perf.successCount += 1;
                const output = result.output || {};
                perf.totalQuality += (output.qualityScore || output.confidence || 0.5);
            }
        });

        return Array.from(performanceMap.values()).map(perf => ({
            strandId: perf.strandId,
            agentType: perf.agentType,
            tasksCompleted: perf.tasksCompleted,
            avgExecutionTime: perf.totalExecutionTime / perf.tasksCompleted,
            successRate: perf.successCount / perf.tasksCompleted,
            qualityScore: perf.successCount > 0 ? perf.totalQuality / perf.successCount : 0,
        }));
    }

    /**
     * Generate workflow insights
     */
    private generateWorkflowInsights(tasks: WorkerTask[], results: WorkerResult[], coordinationPlan: any): {
        bottlenecks: string[];
        optimizationSuggestions: string[];
        learningPoints: string[];
    } {
        const bottlenecks: string[] = [];
        const optimizationSuggestions: string[] = [];
        const learningPoints: string[] = [];

        // Identify bottlenecks
        const slowTasks = results.filter(r => r.metadata.executionTime > 30000); // > 30 seconds
        if (slowTasks.length > 0) {
            bottlenecks.push(`Slow execution detected in ${slowTasks.map(t => t.workerType).join(', ')}`);
        }

        // Generate optimization suggestions
        const failedTasks = results.filter(isErrorResult);
        if (failedTasks.length > 0) {
            optimizationSuggestions.push('Consider retry mechanisms for failed tasks');
            optimizationSuggestions.push('Review task complexity and agent capability matching');
        }

        // Generate learning points
        const successfulTasks = results.filter(isSuccessResult);
        if (successfulTasks.length > 0) {
            learningPoints.push(`Successfully completed ${successfulTasks.length}/${results.length} tasks`);

            const highQualityTasks = successfulTasks.filter(r => {
                const output = r.output || {};
                return (output.qualityScore || output.confidence || 0) > 0.8;
            });

            if (highQualityTasks.length > 0) {
                learningPoints.push(`${highQualityTasks.length} tasks achieved high quality scores`);
            }
        }

        return {
            bottlenecks,
            optimizationSuggestions,
            learningPoints,
        };
    }

    /**
     * Handle task completion events
     */
    private handleTaskCompletion(result: WorkerResult, strand: AgentStrand): void {
        // Update workflow execution state
        // TODO: Implement workflow state management
    }

    /**
     * Handle context sharing events
     */
    private handleContextSharing(fromStrand: string, toStrand: string, context: any): void {
        // Track context sharing for metrics
        // TODO: Implement context sharing tracking
    }
}

/**
 * Workflow execution manager
 */
class WorkflowExecution {
    private taskStrandMap: Map<string, string> = new Map();
    private completedTasks: Set<string> = new Set();
    private contextStore: Map<string, any> = new Map();

    constructor(
        private workflowId: string,
        private tasks: WorkerTask[],
        private coordinationPlan: any,
        private agentCore: AgentCore
    ) { }

    /**
     * Execute workflow with coordination
     */
    async execute(options?: {
        enableAdaptiveExecution?: boolean;
        qualityThreshold?: number;
        timeoutMs?: number;
    }): Promise<WorkerResult[]> {
        const results: WorkerResult[] = [];
        const taskMap = new Map(this.tasks.map(t => [t.id, t]));

        // Execute tasks with dependency management
        while (this.completedTasks.size < this.tasks.length) {
            const readyTasks = this.getReadyTasks(taskMap);

            if (readyTasks.length === 0) {
                // Handle deadlock or circular dependencies
                const remainingTasks = this.tasks.filter(t => !this.completedTasks.has(t.id));
                console.error('Workflow deadlock detected:', remainingTasks.map(t => t.id));
                break;
            }

            // Execute ready tasks in parallel
            const taskResults = await Promise.all(
                readyTasks.map(task => this.executeTask(task))
            );

            // Process results
            taskResults.forEach((result, index) => {
                const task = readyTasks[index];
                results.push(result);
                this.completedTasks.add(task.id);

                // Handle context sharing
                if (result.status === 'success' && result.output) {
                    this.handleTaskContextSharing(task, result);
                }
            });
        }

        return results;
    }

    /**
     * Get tasks ready for execution
     */
    private getReadyTasks(taskMap: Map<string, WorkerTask>): WorkerTask[] {
        return Array.from(taskMap.values()).filter(task => {
            if (this.completedTasks.has(task.id)) return false;

            return task.dependencies.every(depId => this.completedTasks.has(depId));
        });
    }

    /**
     * Execute a single task with strand allocation
     */
    private async executeTask(task: WorkerTask): Promise<WorkerResult> {
        try {
            // Allocate task to appropriate strand
            const strand = await this.agentCore.allocateTask(task);
            this.taskStrandMap.set(task.id, strand.id);

            // Create strand instance and execute
            const strandInstance = createStrandInstance(strand);
            const result = await strandInstance.executeTask(task);

            return result;
        } catch (error) {
            return {
                taskId: task.id,
                workerType: task.type,
                status: 'error',
                error: {
                    type: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                },
                metadata: {
                    executionTime: 0,
                    startedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * Handle context sharing after task completion
     */
    private handleTaskContextSharing(task: WorkerTask, result: WorkerResult): void {
        const contextSharing = task.input._metadata?.contextSharing;
        if (!contextSharing?.sharesContext) return;

        // Store context for sharing
        const contextKeys = contextSharing.contextKeys || ['output'];
        contextKeys.forEach(key => {
            if (result.output && result.output[key]) {
                this.contextStore.set(`${task.id}_${key}`, result.output[key]);
            }
        });

        // Share context with dependent tasks
        const sharingPlan = this.coordinationPlan.contextSharingPlan || [];
        sharingPlan
            .filter((plan: any) => plan.fromTask === task.id)
            .forEach((plan: any) => {
                const context = this.contextStore.get(`${task.id}_${plan.contextType}`);
                if (context) {
                    const fromStrand = this.taskStrandMap.get(task.id);
                    const toStrand = this.taskStrandMap.get(plan.toTask);

                    if (fromStrand && toStrand) {
                        this.agentCore.shareContext(fromStrand, toStrand, {
                            type: plan.contextType,
                            data: context,
                            sourceTask: task.id,
                        });
                    }
                }
            });
    }

    /**
     * Get strand ID for a task
     */
    getStrandForTask(taskId: string): string | undefined {
        return this.taskStrandMap.get(taskId);
    }
}

/**
 * Singleton instance
 */
let enhancedOrchestratorInstance: EnhancedWorkflowOrchestrator | null = null;

/**
 * Get the singleton enhanced orchestrator instance
 */
export function getEnhancedWorkflowOrchestrator(): EnhancedWorkflowOrchestrator {
    if (!enhancedOrchestratorInstance) {
        enhancedOrchestratorInstance = new EnhancedWorkflowOrchestrator();
    }
    return enhancedOrchestratorInstance;
}

/**
 * Reset the enhanced orchestrator singleton (useful for testing)
 */
export function resetEnhancedWorkflowOrchestrator(): void {
    enhancedOrchestratorInstance = null;
}