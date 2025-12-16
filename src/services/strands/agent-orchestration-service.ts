import { createLogger } from '@/aws/logging/logger';
const logger = createLogger({ service: 'agent-orchestration' });

/**
 * Enhanced Agent Orchestration Service - Strands-Inspired Implementation
 * 
 * Orchestrates multiple AI agents to execute complex workflows and multi-step processes
 * Provides intelligent workflow management, agent coordination, and result synthesis
 */

import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';

// Constants for workflow execution
const WORKFLOW_CONSTANTS = {
    DEFAULT_ESTIMATED_DURATION: 300, // seconds
    MAX_BACKOFF_DELAY: 30000, // 30 seconds
    BACKOFF_BASE: 2,
    BACKOFF_INITIAL: 1000, // 1 second
} as const;

// Error types for better categorization
export enum WorkflowErrorType {
    TIMEOUT = 'TIMEOUT',
    AGENT_FAILURE = 'AGENT_FAILURE',
    DEPENDENCY_FAILURE = 'DEPENDENCY_FAILURE',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class WorkflowError extends Error {
    constructor(
        message: string,
        public type: WorkflowErrorType,
        public stepId?: string,
        public retryable: boolean = true,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'WorkflowError';
    }
}

// Workflow types
export const WorkflowTypeSchema = z.enum([
    'content-campaign',
    'market-research-suite',
    'listing-optimization',
    'brand-building',
    'competitive-analysis',
    'investment-analysis',
    'client-onboarding'
]);

// Agent types available for orchestration
export const AgentTypeSchema = z.enum([
    'research-agent',
    'content-studio',
    'listing-description',
    'market-intelligence',
    'competitive-analysis',
    'seo-optimization',
    'social-media'
]);

// Workflow step status
export const StepStatusSchema = z.enum([
    'pending',
    'running',
    'completed',
    'failed',
    'skipped'
]);

// Workflow execution priority
export const WorkflowPrioritySchema = z.enum([
    'low',
    'normal',
    'high',
    'urgent'
]);

// Individual workflow step schema
export const WorkflowStepSchema = z.object({
    id: z.string(),
    name: z.string(),
    agentType: AgentTypeSchema,
    inputs: z.record(z.any()),
    outputs: z.record(z.any()).optional(),
    status: StepStatusSchema.default('pending'),
    dependencies: z.array(z.string()).default([]),
    retryCount: z.number().default(0),
    maxRetries: z.number().default(2),
    estimatedDuration: z.number().optional(), // in seconds
    actualDuration: z.number().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    error: z.string().optional(),
});

// Enhanced workflow orchestration input schema
export const WorkflowOrchestrationInputSchema = z.object({
    workflowType: WorkflowTypeSchema,
    userId: z.string().min(1, 'User ID is required'),

    // Workflow configuration
    name: z.string().min(1, 'Workflow name is required'),
    description: z.string().optional(),
    priority: WorkflowPrioritySchema.default('normal'),

    // Input parameters for the workflow
    parameters: z.record(z.any()),

    // Execution options
    executeAsync: z.boolean().default(true),
    saveResults: z.boolean().default(true),
    notifyOnCompletion: z.boolean().default(false),

    // Custom steps (optional - overrides default workflow)
    customSteps: z.array(WorkflowStepSchema).optional(),
});

export const WorkflowOrchestrationOutputSchema = z.object({
    success: z.boolean(),
    workflowId: z.string().optional(),
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
    steps: z.array(WorkflowStepSchema).optional(),
    results: z.record(z.any()).optional(),
    summary: z.string().optional(),
    totalDuration: z.number().optional(),
    completedSteps: z.number().optional(),
    totalSteps: z.number().optional(),
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    source: z.string().optional(),
    error: z.string().optional(),
});

export type WorkflowOrchestrationInput = z.infer<typeof WorkflowOrchestrationInputSchema>;
export type WorkflowOrchestrationOutput = z.infer<typeof WorkflowOrchestrationOutputSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// Workflow parameter interfaces for type safety
export interface ContentCampaignParameters {
    topic: string;
    targetAudience?: string;
    platforms?: string[];
    location?: string;
}

export interface ListingOptimizationParameters {
    propertyType: string;
    location: string;
    keyFeatures: string;
    buyerPersona: string;
    price?: string;
}

export interface BrandBuildingParameters {
    agentName: string;
    location: string;
    specialization: string;
    targetMarket?: string;
}

export interface InvestmentAnalysisParameters {
    location: string;
    propertyType: string;
    investmentGoals: string;
    budget?: string;
}

/**
 * Retry configuration for different agent types
 */
const AGENT_RETRY_CONFIG = {
    'research-agent': { maxRetries: 3, timeoutMultiplier: 2.5 }, // Research can be flaky
    'content-studio': { maxRetries: 2, timeoutMultiplier: 2.0 }, // Content generation is usually stable
    'listing-description': { maxRetries: 2, timeoutMultiplier: 1.5 }, // Fast and reliable
    'market-intelligence': { maxRetries: 3, timeoutMultiplier: 2.0 }, // External data dependencies
    'competitive-analysis': { maxRetries: 2, timeoutMultiplier: 2.0 },
    'seo-optimization': { maxRetries: 1, timeoutMultiplier: 1.5 },
    'social-media': { maxRetries: 2, timeoutMultiplier: 1.5 }
} as const;

/**
 * Step Factory - Creates workflow steps with consistent defaults
 */
class WorkflowStepFactory {
    /**
     * Create a workflow step with intelligent retry configuration based on agent type
     */
    static createStep(config: {
        id: string;
        name: string;
        agentType: z.infer<typeof AgentTypeSchema>;
        inputs: Record<string, any>;
        dependencies?: string[];
        estimatedDuration?: number;
        maxRetries?: number;
    }): WorkflowStep {
        const agentConfig = AGENT_RETRY_CONFIG[config.agentType] || { maxRetries: 2, timeoutMultiplier: 2.0 };

        return {
            id: config.id,
            name: config.name,
            agentType: config.agentType,
            inputs: config.inputs,
            dependencies: config.dependencies || [],
            estimatedDuration: config.estimatedDuration,
            maxRetries: config.maxRetries || agentConfig.maxRetries,
            status: 'pending' as const,
            retryCount: 0
        };
    }

    /**
     * Get timeout for agent type
     */
    static getTimeoutForAgent(agentType: string, estimatedDuration: number = WORKFLOW_CONSTANTS.DEFAULT_ESTIMATED_DURATION): number {
        const config = AGENT_RETRY_CONFIG[agentType as keyof typeof AGENT_RETRY_CONFIG] || { timeoutMultiplier: 2.0 };
        return estimatedDuration * 1000 * config.timeoutMultiplier;
    }
}

/**
 * Workflow Templates - Predefined multi-agent workflows
 */
class WorkflowTemplates {

    /**
     * Content Campaign Workflow
     * Research → Content Creation → SEO Optimization → Social Media
     */
    static getContentCampaignWorkflow(parameters: any): WorkflowStep[] {
        const { topic, targetAudience, platforms, location } = parameters;

        return [
            WorkflowStepFactory.createStep({
                id: 'research',
                name: 'Market Research',
                agentType: 'research-agent',
                inputs: {
                    topic,
                    searchDepth: 'advanced',
                    includeMarketAnalysis: true,
                    targetAudience: targetAudience || 'agents'
                },
                estimatedDuration: 120
            }),
            WorkflowStepFactory.createStep({
                id: 'blog-content',
                name: 'Blog Post Creation',
                agentType: 'content-studio',
                inputs: {
                    contentType: 'blog-post',
                    topic,
                    tone: 'professional',
                    includeWebSearch: true,
                    includeSEO: true
                },
                dependencies: ['research'],
                estimatedDuration: 90
            }),
            WorkflowStepFactory.createStep({
                id: 'social-content',
                name: 'Social Media Content',
                agentType: 'content-studio',
                inputs: {
                    contentType: 'social-media',
                    topic,
                    platforms: platforms || ['linkedin', 'facebook'],
                    tone: 'conversational',
                    includeHashtags: true
                },
                dependencies: ['research'],
                estimatedDuration: 60
            }),
            WorkflowStepFactory.createStep({
                id: 'market-update',
                name: 'Market Update',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'market-update',
                    location: location || 'Local Market',
                    targetAudience: targetAudience || 'agents'
                },
                estimatedDuration: 75
            })
        ];
    }

    /**
     * Listing Optimization Workflow
     * Market Analysis → Competitive Research → Description Generation → SEO Optimization
     */
    static getListingOptimizationWorkflow(parameters: any): WorkflowStep[] {
        const { propertyType, location, keyFeatures, buyerPersona, price } = parameters;

        return [
            WorkflowStepFactory.createStep({
                id: 'market-analysis',
                name: 'Market Analysis',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'market-update',
                    location,
                    marketSegment: propertyType || 'residential'
                },
                estimatedDuration: 90
            }),
            WorkflowStepFactory.createStep({
                id: 'competitive-analysis',
                name: 'Competitive Analysis',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'competitive-landscape',
                    location,
                    priceRange: price
                },
                estimatedDuration: 75
            }),
            WorkflowStepFactory.createStep({
                id: 'listing-description',
                name: 'Listing Description Generation',
                agentType: 'listing-description',
                inputs: {
                    propertyType,
                    location,
                    keyFeatures,
                    buyerPersona,
                    includeMarketAnalysis: true,
                    includeCompetitiveAnalysis: true,
                    includeSEOOptimization: true
                },
                dependencies: ['market-analysis', 'competitive-analysis'],
                estimatedDuration: 60
            })
        ];
    }

    /**
     * Brand Building Workflow
     * Competitive Research → Market Positioning → Content Strategy → Implementation
     */
    static getBrandBuildingWorkflow(parameters: any): WorkflowStep[] {
        const { agentName, location, specialization, targetMarket } = parameters;

        return [
            WorkflowStepFactory.createStep({
                id: 'competitive-research',
                name: 'Competitive Landscape Analysis',
                agentType: 'research-agent',
                inputs: {
                    topic: `real estate agents ${location} ${specialization}`,
                    searchDepth: 'advanced',
                    includeMarketAnalysis: true,
                    targetAudience: 'agents'
                },
                estimatedDuration: 150
            }),
            WorkflowStepFactory.createStep({
                id: 'market-positioning',
                name: 'Market Positioning Analysis',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'opportunity-identification',
                    location,
                    targetAudience: 'agents'
                },
                dependencies: ['competitive-research'],
                estimatedDuration: 120
            }),
            WorkflowStepFactory.createStep({
                id: 'content-strategy',
                name: 'Content Strategy Development',
                agentType: 'content-studio',
                inputs: {
                    contentType: 'blog-post',
                    topic: `${specialization} real estate strategy ${location}`,
                    targetAudience: targetMarket || 'general',
                    tone: 'professional'
                },
                dependencies: ['market-positioning'],
                estimatedDuration: 90
            })
        ];
    }

    /**
     * Investment Analysis Workflow
     * Market Research → Property Analysis → ROI Calculation → Risk Assessment
     */
    static getInvestmentAnalysisWorkflow(parameters: any): WorkflowStep[] {
        const { location, propertyType, investmentGoals, budget } = parameters;

        return [
            WorkflowStepFactory.createStep({
                id: 'market-research',
                name: 'Investment Market Research',
                agentType: 'research-agent',
                inputs: {
                    topic: `${location} ${propertyType} investment opportunities`,
                    searchDepth: 'advanced',
                    includeMarketAnalysis: true,
                    targetAudience: 'investors'
                },
                estimatedDuration: 180
            }),
            WorkflowStepFactory.createStep({
                id: 'market-trends',
                name: 'Market Trend Analysis',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'trend-analysis',
                    location,
                    marketSegment: 'investment',
                    timePeriod: '3-year'
                },
                estimatedDuration: 120
            }),
            WorkflowStepFactory.createStep({
                id: 'opportunity-analysis',
                name: 'Investment Opportunity Analysis',
                agentType: 'market-intelligence',
                inputs: {
                    analysisType: 'investment-analysis',
                    location,
                    targetAudience: 'investors',
                    includeInvestmentMetrics: true,
                    priceRange: budget
                },
                dependencies: ['market-research', 'market-trends'],
                estimatedDuration: 90
            })
        ];
    }
}

/**
 * Agent Execution Engine - Executes individual agent steps
 */
class AgentExecutionEngine {

    /**
     * Execute a single workflow step using the appropriate agent
     */
    static async executeStep(step: WorkflowStep, workflowContext: any): Promise<WorkflowStep> {
        const updatedStep = { ...step };
        updatedStep.startTime = new Date().toISOString();
        updatedStep.status = 'running';

        try {
            logger.info(`🤖 Executing step: ${step.name} (${step.agentType})`);

            const result = await this.executeAgentWithTimeout(step, workflowContext);

            updatedStep.outputs = result;
            updatedStep.status = 'completed';
            updatedStep.endTime = new Date().toISOString();

            if (updatedStep.startTime && updatedStep.endTime) {
                updatedStep.actualDuration = Math.round(
                    (new Date(updatedStep.endTime).getTime() - new Date(updatedStep.startTime).getTime()) / 1000
                );
            }

            logger.info(`✅ Step completed: ${step.name} (${updatedStep.actualDuration}s)`);

        } catch (error) {
            logger.error(`❌ Step failed: ${step.name}`, error instanceof Error ? error : new Error(String(error)));

            const workflowError = this.categorizeError(error, step.id);

            updatedStep.status = 'failed';
            updatedStep.error = workflowError.message;
            updatedStep.endTime = new Date().toISOString();
            updatedStep.retryCount = (updatedStep.retryCount || 0) + 1;

            // Only retry if error is retryable and we haven't exceeded max retries
            if (workflowError.retryable && updatedStep.retryCount < updatedStep.maxRetries) {
                const backoffDelay = Math.min(
                    WORKFLOW_CONSTANTS.BACKOFF_INITIAL * Math.pow(WORKFLOW_CONSTANTS.BACKOFF_BASE, updatedStep.retryCount),
                    WORKFLOW_CONSTANTS.MAX_BACKOFF_DELAY
                );
                logger.info(`⏳ Waiting ${backoffDelay}ms before retry (${workflowError.type})...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else if (!workflowError.retryable) {
                logger.info(`🚫 Error not retryable: ${workflowError.type}`);
            }
        }

        return updatedStep;
    }

    /**
     * Execute agent with timeout protection
     */
    private static async executeAgentWithTimeout(step: WorkflowStep, workflowContext: any): Promise<any> {
        const timeoutMs = WorkflowStepFactory.getTimeoutForAgent(step.agentType, step.estimatedDuration || WORKFLOW_CONSTANTS.DEFAULT_ESTIMATED_DURATION);

        const executePromise = this.executeAgentByType(step.agentType, step.inputs, workflowContext);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Step timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        return Promise.race([executePromise, timeoutPromise]);
    }

    /**
     * Execute agent by type with centralized routing
     */
    private static async executeAgentByType(agentType: string, inputs: any, workflowContext: any): Promise<any> {
        switch (agentType) {
            case 'research-agent':
                return this.executeResearchAgent(inputs, workflowContext);
            case 'content-studio':
                return this.executeContentStudio(inputs, workflowContext);
            case 'listing-description':
                return this.executeListingDescription(inputs, workflowContext);
            case 'market-intelligence':
                return this.executeMarketIntelligence(inputs, workflowContext);
            default:
                throw new WorkflowError(
                    `Unknown agent type: ${agentType}`,
                    WorkflowErrorType.VALIDATION_ERROR,
                    undefined,
                    false // Not retryable
                );
        }
    }

    /**
     * Categorize errors for better handling and monitoring
     */
    private static categorizeError(error: unknown, stepId: string): WorkflowError {
        if (error instanceof WorkflowError) {
            return error;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Timeout errors
        if (errorMessage.includes('timeout')) {
            return new WorkflowError(
                errorMessage,
                WorkflowErrorType.TIMEOUT,
                stepId,
                true,
                error instanceof Error ? error : undefined
            );
        }

        // Network errors
        if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
            return new WorkflowError(
                errorMessage,
                WorkflowErrorType.NETWORK_ERROR,
                stepId,
                true,
                error instanceof Error ? error : undefined
            );
        }

        // Validation errors (usually not retryable)
        if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
            return new WorkflowError(
                errorMessage,
                WorkflowErrorType.VALIDATION_ERROR,
                stepId,
                false,
                error instanceof Error ? error : undefined
            );
        }

        // Default to agent failure (retryable)
        return new WorkflowError(
            errorMessage,
            WorkflowErrorType.AGENT_FAILURE,
            stepId,
            true,
            error instanceof Error ? error : undefined
        );
    }

    /**
     * Execute research agent
     */
    private static async executeResearchAgent(inputs: any, context: any): Promise<any> {
        const { runEnhancedResearch } = await import('@/services/strands/enhanced-research-service');

        return await runEnhancedResearch(
            inputs.topic,
            context.userId,
            {
                searchDepth: inputs.searchDepth || 'advanced',
                includeMarketAnalysis: inputs.includeMarketAnalysis ?? true,
                includeRecommendations: inputs.includeRecommendations ?? true,
                targetAudience: inputs.targetAudience || 'agents'
            }
        );
    }

    /**
     * Execute content studio agent
     */
    private static async executeContentStudio(inputs: any, context: any): Promise<any> {
        const { generateContent } = await import('@/services/strands/content-studio-service');

        return await generateContent({
            contentType: inputs.contentType,
            topic: inputs.topic,
            userId: context.userId,
            tone: inputs.tone || 'professional',
            targetAudience: inputs.targetAudience || 'general',
            length: inputs.length || 'medium',
            searchDepth: inputs.searchDepth || 'basic',
            includeData: inputs.includeData ?? true,
            generateVariations: inputs.generateVariations || 1,
            platforms: inputs.platforms,
            includeWebSearch: inputs.includeWebSearch ?? true,
            includeSEO: inputs.includeSEO ?? true,
            includeHashtags: inputs.includeHashtags ?? true,
            saveToLibrary: true
        });
    }

    /**
     * Execute listing description agent
     */
    private static async executeListingDescription(inputs: any, context: any): Promise<any> {
        const { generateIntelligentListingDescription } = await import('@/services/strands/listing-description-service');

        return await generateIntelligentListingDescription({
            propertyType: inputs.propertyType,
            location: inputs.location,
            keyFeatures: inputs.keyFeatures,
            buyerPersona: inputs.buyerPersona,
            writingStyle: inputs.writingStyle || 'professional',
            userId: context.userId,
            includeMarketAnalysis: inputs.includeMarketAnalysis ?? true,
            includeNeighborhoodInsights: inputs.includeNeighborhoodInsights ?? true,
            includeSEOOptimization: inputs.includeSEOOptimization ?? true,
            includeCompetitiveAnalysis: inputs.includeCompetitiveAnalysis ?? false
        });
    }

    /**
     * Execute market intelligence agent
     */
    private static async executeMarketIntelligence(inputs: any, context: any): Promise<any> {
        const { executeMarketIntelligence } = await import('@/services/strands/market-intelligence-service');

        return await executeMarketIntelligence({
            analysisType: inputs.analysisType,
            location: inputs.location,
            userId: context.userId,
            timePeriod: inputs.timePeriod || 'current',
            marketSegment: inputs.marketSegment || 'residential',
            targetAudience: inputs.targetAudience || 'agents',
            includeWebResearch: inputs.includeWebResearch ?? true,
            includeHistoricalData: inputs.includeHistoricalData ?? true,
            includeCompetitiveAnalysis: inputs.includeCompetitiveAnalysis ?? false,
            includePredictiveModeling: inputs.includePredictiveModeling ?? true,
            includeInvestmentMetrics: inputs.includeInvestmentMetrics ?? false,
            priceRange: inputs.priceRange,
            propertyType: inputs.propertyType
        });
    }
}

/**
 * Workflow Execution Manager
 */
class WorkflowExecutionManager {

    /**
     * Execute workflow steps with dependency management
     */
    static async executeWorkflow(
        steps: WorkflowStep[],
        workflowContext: any
    ): Promise<{ steps: WorkflowStep[]; results: any; summary: string }> {
        const executedSteps = [...steps];
        const results: any = {};
        let completedCount = 0;

        // Create dependency graph
        const dependencyMap = new Map<string, string[]>();
        const completedSteps = new Set<string>();

        steps.forEach(step => {
            dependencyMap.set(step.id, step.dependencies);
        });

        // Execute steps in dependency order
        while (completedCount < steps.length) {
            const readySteps = executedSteps.filter(step =>
                step.status === 'pending' &&
                step.dependencies.every(dep => completedSteps.has(dep))
            );

            if (readySteps.length === 0) {
                // Check for failed dependencies
                const failedSteps = executedSteps.filter(step => step.status === 'failed');
                if (failedSteps.length > 0) {
                    logger.warn('⚠️ Workflow has failed steps, skipping dependent steps');
                    break;
                }

                // No ready steps and no failures - possible circular dependency
                logger.error('❌ No ready steps found - possible circular dependency');
                break;
            }

            // Execute ready steps in parallel
            const stepPromises = readySteps.map(async (step) => {
                const stepIndex = executedSteps.findIndex(s => s.id === step.id);
                const updatedStep = await AgentExecutionEngine.executeStep(step, workflowContext);
                executedSteps[stepIndex] = updatedStep;

                if (updatedStep.status === 'completed') {
                    completedSteps.add(updatedStep.id);
                    results[updatedStep.id] = updatedStep.outputs;
                    completedCount++;
                } else if (updatedStep.status === 'failed') {
                    // Check if we should retry
                    if (updatedStep.retryCount < updatedStep.maxRetries) {
                        logger.info(`🔄 Retrying step: ${updatedStep.name} (attempt ${updatedStep.retryCount + 1})`);
                        updatedStep.status = 'pending';
                    } else {
                        logger.error(`💥 Step failed permanently: ${updatedStep.name}`);
                        completedCount++; // Count as completed to avoid infinite loop
                    }
                }

                return updatedStep;
            });

            await Promise.all(stepPromises);
        }

        // Generate workflow summary
        const successful = executedSteps.filter(s => s.status === 'completed').length;
        const failed = executedSteps.filter(s => s.status === 'failed').length;
        const totalDuration = executedSteps.reduce((sum, step) => sum + (step.actualDuration || 0), 0);

        const summary = `Workflow completed: ${successful}/${steps.length} steps successful, ${failed} failed. Total duration: ${totalDuration}s`;

        return { steps: executedSteps, results, summary };
    }
}

/**
 * Enhanced Agent Orchestration Service
 */
class AgentOrchestrationService {
    private templates: typeof WorkflowTemplates;
    private executionManager: typeof WorkflowExecutionManager;

    constructor() {
        this.templates = WorkflowTemplates;
        this.executionManager = WorkflowExecutionManager;
    }

    /**
     * Execute a complete workflow with multiple agents
     */
    async executeWorkflow(input: WorkflowOrchestrationInput): Promise<WorkflowOrchestrationOutput> {
        try {
            logger.info(`🚀 Starting workflow orchestration: ${input.workflowType}`);

            const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const startTime = new Date().toISOString();

            // Get workflow steps (custom or template)
            let steps: WorkflowStep[];

            if (input.customSteps) {
                steps = input.customSteps;
            } else {
                steps = this.getWorkflowTemplate(input.workflowType, input.parameters);
            }

            // Save workflow to database if requested
            if (input.saveResults) {
                await this.saveWorkflowStart(workflowId, input, steps);
            }

            // Execute workflow
            const workflowContext = {
                workflowId,
                userId: input.userId,
                workflowType: input.workflowType,
                parameters: input.parameters
            };

            const execution = await this.executionManager.executeWorkflow(steps, workflowContext);

            const endTime = new Date().toISOString();
            const totalDuration = Math.round(
                (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
            );

            // Update workflow in database
            if (input.saveResults) {
                await this.saveWorkflowCompletion(workflowId, execution, totalDuration);
            }

            logger.info(`✅ Workflow orchestration completed: ${workflowId}`);

            return {
                success: true,
                workflowId,
                status: 'completed',
                steps: execution.steps,
                results: execution.results,
                summary: execution.summary,
                totalDuration,
                completedSteps: execution.steps.filter(s => s.status === 'completed').length,
                totalSteps: execution.steps.length,
                timestamp: endTime,
                userId: input.userId,
                source: 'agent-orchestration-service',
            };

        } catch (error) {
            logger.error('❌ Workflow orchestration failed:', error instanceof Error ? error : new Error(String(error)));

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: new Date().toISOString(),
                userId: input.userId,
                source: 'agent-orchestration-service',
            };
        }
    }

    /**
     * Get workflow template based on type
     */
    private getWorkflowTemplate(workflowType: string, parameters: any): WorkflowStep[] {
        switch (workflowType) {
            case 'content-campaign':
                return this.templates.getContentCampaignWorkflow(parameters);
            case 'listing-optimization':
                return this.templates.getListingOptimizationWorkflow(parameters);
            case 'brand-building':
                return this.templates.getBrandBuildingWorkflow(parameters);
            case 'investment-analysis':
                return this.templates.getInvestmentAnalysisWorkflow(parameters);
            default:
                throw new Error(`Unknown workflow type: ${workflowType}`);
        }
    }

    /**
     * Save workflow start to database
     */
    private async saveWorkflowStart(
        workflowId: string,
        input: WorkflowOrchestrationInput,
        steps: WorkflowStep[]
    ): Promise<void> {
        try {
            const repository = getRepository();
            const timestamp = new Date().toISOString();

            const workflowItem = {
                PK: `USER#${input.userId}`,
                SK: `WORKFLOW#${workflowId}`,
                GSI1PK: `USER#${input.userId}`,
                GSI1SK: `WORKFLOW#${timestamp}`,
                id: workflowId,
                userId: input.userId,
                type: 'workflow',
                workflowType: input.workflowType,
                name: input.name,
                description: input.description,
                status: 'running',
                steps: steps,
                parameters: input.parameters,
                createdAt: timestamp,
                updatedAt: timestamp,
                source: 'agent-orchestration-service'
            };

            await repository.create(
                workflowItem.PK,
                workflowItem.SK,
                'Workflow',
                workflowItem,
                {
                    GSI1PK: workflowItem.GSI1PK,
                    GSI1SK: workflowItem.GSI1SK
                }
            );
        } catch (error) {
            logger.error('Failed to save workflow start:', error instanceof Error ? error : new Error(String(error)));
            // Don't fail the workflow if saving fails
        }
    }

    /**
     * Save workflow completion to database
     */
    private async saveWorkflowCompletion(
        workflowId: string,
        execution: any,
        totalDuration: number
    ): Promise<void> {
        try {
            const repository = getRepository();
            const timestamp = new Date().toISOString();

            const updates = {
                status: 'completed',
                steps: execution.steps,
                results: execution.results,
                summary: execution.summary,
                totalDuration,
                completedSteps: execution.steps.filter((s: any) => s.status === 'completed').length,
                totalSteps: execution.steps.length,
                completedAt: timestamp,
                updatedAt: timestamp
            };

            // We need to find the workflow first to get the correct keys
            const items = await repository.query(`USER#${execution.steps[0]?.userId || 'unknown'}`, `WORKFLOW#${workflowId}`);

            if (items.items.length > 0) {
                const item = items.items[0] as any;
                await repository.update(item.PK, item.SK, updates);
            }
        } catch (error) {
            logger.error('Failed to save workflow completion:', error instanceof Error ? error : new Error(String(error)));
            // Don't fail the workflow if saving fails
        }
    }
}

/**
 * Main execution functions
 */
export async function executeAgentWorkflow(
    input: WorkflowOrchestrationInput
): Promise<WorkflowOrchestrationOutput> {
    const orchestrator = new AgentOrchestrationService();
    return orchestrator.executeWorkflow(input);
}

/**
 * Convenience functions for specific workflows
 */
export async function executeContentCampaign(
    topic: string,
    userId: string,
    options?: {
        targetAudience?: string;
        platforms?: string[];
        location?: string;
    }
): Promise<WorkflowOrchestrationOutput> {
    return executeAgentWorkflow({
        workflowType: 'content-campaign',
        userId,
        name: `Content Campaign: ${topic}`,
        description: `Multi-channel content campaign for ${topic}`,
        priority: 'normal',
        saveResults: true,
        executeAsync: true,
        notifyOnCompletion: false,
        parameters: {
            topic,
            targetAudience: options?.targetAudience || 'agents',
            platforms: options?.platforms || ['linkedin', 'facebook'],
            location: options?.location || 'Local Market'
        }
    });
}

export async function executeListingOptimization(
    propertyDetails: {
        propertyType: string;
        location: string;
        keyFeatures: string;
        buyerPersona: string;
        price?: string;
    },
    userId: string
): Promise<WorkflowOrchestrationOutput> {
    return executeAgentWorkflow({
        workflowType: 'listing-optimization',
        userId,
        name: `Listing Optimization: ${propertyDetails.location}`,
        description: `Complete listing optimization for ${propertyDetails.propertyType} in ${propertyDetails.location}`,
        priority: 'normal' as const,
        saveResults: true,
        executeAsync: true,
        notifyOnCompletion: false,
        parameters: propertyDetails
    });
}

export async function executeBrandBuilding(
    agentDetails: {
        agentName: string;
        location: string;
        specialization: string;
        targetMarket?: string;
    },
    userId: string
): Promise<WorkflowOrchestrationOutput> {
    return executeAgentWorkflow({
        workflowType: 'brand-building',
        userId,
        name: `Brand Building: ${agentDetails.agentName}`,
        description: `Comprehensive brand building strategy for ${agentDetails.agentName}`,
        priority: 'normal' as const,
        saveResults: true,
        executeAsync: true,
        notifyOnCompletion: false,
        parameters: agentDetails
    });
}

export async function executeInvestmentAnalysis(
    investmentDetails: {
        location: string;
        propertyType: string;
        investmentGoals: string;
        budget?: string;
    },
    userId: string
): Promise<WorkflowOrchestrationOutput> {
    return executeAgentWorkflow({
        workflowType: 'investment-analysis',
        userId,
        name: `Investment Analysis: ${investmentDetails.location}`,
        description: `Comprehensive investment analysis for ${investmentDetails.propertyType} in ${investmentDetails.location}`,
        priority: 'normal' as const,
        saveResults: true,
        executeAsync: true,
        notifyOnCompletion: false,
        parameters: investmentDetails
    });
}