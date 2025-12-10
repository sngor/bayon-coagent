/**
 * Cross-Hub Intelligence Coordinator
 * 
 * Enables intelligent sharing of insights and data between different hubs
 * to create a cohesive, interconnected AI experience.
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { getRepository } from '@/aws/dynamodb/repository';
import { getBedrockClient } from '../client';
import { HubAgentRegistry } from '../hub-agents/hub-agent-registry';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Intelligence insight types
 */
export type InsightType =
    | 'market-trend'
    | 'content-opportunity'
    | 'competitive-advantage'
    | 'client-behavior'
    | 'performance-metric'
    | 'workflow-optimization'
    | 'cross-reference'
    | 'predictive-alert';

/**
 * Hub connection types
 */
export type HubConnection = {
    sourceHub: string;
    targetHub: string;
    insightType: InsightType;
    relevanceScore: number;
    actionable: boolean;
};

/**
 * Intelligence insight interface
 */
export interface IntelligenceInsight {
    id: string;
    userId: string;
    sourceHub: string;
    targetHubs: string[];
    insightType: InsightType;
    title: string;
    description: string;
    data: Record<string, any>;
    confidence: number;
    relevanceScore: number;
    actionable: boolean;
    suggestedActions?: Array<{
        hub: string;
        action: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
    }>;
    metadata: {
        sourceData: Record<string, any>;
        analysisMethod: string;
        generatedAt: string;
        expiresAt?: string;
    };
    createdAt: string;
}

/**
 * Cross-hub workflow interface
 */
export interface CrossHubWorkflow {
    id: string;
    userId: string;
    name: string;
    description: string;
    triggerHub: string;
    steps: Array<{
        hub: string;
        action: string;
        inputs: Record<string, any>;
        outputs: string[];
        dependencies?: string[];
    }>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    results: Record<string, any>;
    createdAt: string;
    completedAt?: string;
}

/**
 * Cross-Hub Intelligence Coordinator
 */
export class CrossHubCoordinator extends EventEmitter {
    private repository = getRepository();
    private activeWorkflows: Map<string, CrossHubWorkflow> = new Map();
    private hubConnections: HubConnection[] = [];

    constructor() {
        super();
        this.initializeHubConnections();
    }

    /**
     * Initialize predefined hub connections and intelligence flows
     */
    private initializeHubConnections(): void {
        this.hubConnections = [
            // Research → Content Creation
            {
                sourceHub: 'research',
                targetHub: 'studio',
                insightType: 'content-opportunity',
                relevanceScore: 0.9,
                actionable: true
            },
            // Market → Brand Strategy
            {
                sourceHub: 'market',
                targetHub: 'brand',
                insightType: 'competitive-advantage',
                relevanceScore: 0.85,
                actionable: true
            },
            // Tools → Market Intelligence
            {
                sourceHub: 'tools',
                targetHub: 'market',
                insightType: 'market-trend',
                relevanceScore: 0.8,
                actionable: true
            },
            // Brand → Content Creation
            {
                sourceHub: 'brand',
                targetHub: 'studio',
                insightType: 'content-opportunity',
                relevanceScore: 0.88,
                actionable: true
            },
            // Library → All Hubs (Performance Analysis)
            {
                sourceHub: 'library',
                targetHub: 'studio',
                insightType: 'performance-metric',
                relevanceScore: 0.75,
                actionable: true
            },
            {
                sourceHub: 'library',
                targetHub: 'brand',
                insightType: 'performance-metric',
                relevanceScore: 0.75,
                actionable: true
            },
            // Market → Tools (Investment Opportunities)
            {
                sourceHub: 'market',
                targetHub: 'tools',
                insightType: 'market-trend',
                relevanceScore: 0.82,
                actionable: true
            }
        ];
    }

    /**
     * Analyze data from one hub and generate insights for other hubs
     */
    async generateCrossHubInsights(
        userId: string,
        sourceHub: string,
        sourceData: Record<string, any>,
        agentProfile: AgentProfile
    ): Promise<IntelligenceInsight[]> {
        const insights: IntelligenceInsight[] = [];

        // Find relevant hub connections
        const relevantConnections = this.hubConnections.filter(
            conn => conn.sourceHub === sourceHub
        );

        for (const connection of relevantConnections) {
            try {
                const insight = await this.generateSpecificInsight(
                    userId,
                    connection,
                    sourceData,
                    agentProfile
                );

                if (insight) {
                    insights.push(insight);
                    await this.saveInsight(insight);
                }
            } catch (error) {
                console.error(`Failed to generate insight for ${connection.targetHub}:`, error);
            }
        }

        // Emit insights generated event
        if (insights.length > 0) {
            this.emit('insights-generated', {
                userId,
                sourceHub,
                insights
            });
        }

        return insights;
    }

    /**
     * Generate a specific insight based on hub connection
     */
    private async generateSpecificInsight(
        userId: string,
        connection: HubConnection,
        sourceData: Record<string, any>,
        agentProfile: AgentProfile
    ): Promise<IntelligenceInsight | null> {
        const client = getBedrockClient();

        // Get the target hub agent for context
        const targetAgent = HubAgentRegistry.getAgentByHub(connection.targetHub);
        if (!targetAgent) return null;

        // Create analysis prompt based on connection type
        const prompt = this.createInsightPrompt(
            connection,
            sourceData,
            agentProfile,
            targetAgent.expertise
        );

        try {
            const response = await client.invoke(prompt, z.object({
                hasInsight: z.boolean(),
                insight: z.object({
                    title: z.string(),
                    description: z.string(),
                    confidence: z.number().min(0).max(1),
                    relevanceScore: z.number().min(0).max(1),
                    actionable: z.boolean(),
                    suggestedActions: z.array(z.object({
                        action: z.string(),
                        description: z.string(),
                        priority: z.enum(['low', 'medium', 'high'])
                    })).optional(),
                    keyData: z.record(z.any())
                }).optional()
            }));

            if (!response.hasInsight || !response.insight) {
                return null;
            }

            const insight: IntelligenceInsight = {
                id: `insight-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId,
                sourceHub: connection.sourceHub,
                targetHubs: [connection.targetHub],
                insightType: connection.insightType,
                title: response.insight.title,
                description: response.insight.description,
                data: response.insight.keyData,
                confidence: response.insight.confidence,
                relevanceScore: response.insight.relevanceScore,
                actionable: response.insight.actionable,
                suggestedActions: response.insight.suggestedActions?.map(action => ({
                    hub: connection.targetHub,
                    action: action.action,
                    description: action.description,
                    priority: action.priority
                })),
                metadata: {
                    sourceData,
                    analysisMethod: 'ai-cross-hub-analysis',
                    generatedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                },
                createdAt: new Date().toISOString()
            };

            return insight;
        } catch (error) {
            console.error('Failed to generate cross-hub insight:', error);
            return null;
        }
    }

    /**
     * Create analysis prompt for specific hub connection
     */
    private createInsightPrompt(
        connection: HubConnection,
        sourceData: Record<string, any>,
        agentProfile: AgentProfile,
        targetExpertise: string[]
    ): string {
        const basePrompt = `You are an AI intelligence coordinator analyzing data from the ${connection.sourceHub} hub to generate actionable insights for the ${connection.targetHub} hub.

Agent Profile:
- Name: ${agentProfile.agentName}
- Market: ${agentProfile.primaryMarket}
- Specialization: ${agentProfile.specialization}

Source Data from ${connection.sourceHub} hub:
${JSON.stringify(sourceData, null, 2)}

Target Hub Expertise Areas: ${targetExpertise.join(', ')}

`;

        // Add specific analysis instructions based on connection type
        switch (connection.insightType) {
            case 'content-opportunity':
                return basePrompt + `Analyze the source data to identify specific content creation opportunities for the ${connection.targetHub} hub. Look for:
- Trending topics that could become content
- Data gaps that content could address
- Performance patterns that suggest content needs
- Audience insights that could inform content strategy

Provide a specific, actionable insight if one exists, or indicate no insight if the data doesn't suggest clear opportunities.`;

            case 'competitive-advantage':
                return basePrompt + `Analyze the source data to identify competitive advantages or strategic opportunities for the ${connection.targetHub} hub. Look for:
- Market positioning opportunities
- Competitor weaknesses to exploit
- Unique value propositions to emphasize
- Strategic timing advantages

Provide a specific, actionable insight if one exists.`;

            case 'market-trend':
                return basePrompt + `Analyze the source data to identify market trends that could impact the ${connection.targetHub} hub. Look for:
- Emerging market patterns
- Price or demand shifts
- Seasonal opportunities
- Economic indicators affecting strategy

Provide a specific, actionable insight if one exists.`;

            case 'performance-metric':
                return basePrompt + `Analyze the source data to identify performance insights for the ${connection.targetHub} hub. Look for:
- Performance patterns and trends
- Optimization opportunities
- Success factors to replicate
- Areas needing improvement

Provide a specific, actionable insight if one exists.`;

            default:
                return basePrompt + `Analyze the source data for any relevant insights that could benefit the ${connection.targetHub} hub. Provide a specific, actionable insight if one exists.`;
        }
    }

    /**
     * Create and execute a cross-hub workflow
     */
    async createCrossHubWorkflow(
        userId: string,
        workflowConfig: {
            name: string;
            description: string;
            triggerHub: string;
            steps: Array<{
                hub: string;
                action: string;
                inputs: Record<string, any>;
                outputs: string[];
                dependencies?: string[];
            }>;
        }
    ): Promise<CrossHubWorkflow> {
        const workflow: CrossHubWorkflow = {
            id: `workflow-${userId}-${Date.now()}`,
            userId,
            name: workflowConfig.name,
            description: workflowConfig.description,
            triggerHub: workflowConfig.triggerHub,
            steps: workflowConfig.steps,
            status: 'pending',
            progress: 0,
            results: {},
            createdAt: new Date().toISOString()
        };

        this.activeWorkflows.set(workflow.id, workflow);
        await this.saveWorkflow(workflow);

        // Start workflow execution
        this.executeWorkflow(workflow.id);

        return workflow;
    }

    /**
     * Execute a cross-hub workflow
     */
    private async executeWorkflow(workflowId: string): Promise<void> {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) return;

        try {
            workflow.status = 'running';
            await this.updateWorkflow(workflow);

            const totalSteps = workflow.steps.length;
            let completedSteps = 0;

            for (const step of workflow.steps) {
                // Check dependencies
                if (step.dependencies) {
                    const dependenciesMet = step.dependencies.every(dep =>
                        workflow.results[dep] !== undefined
                    );
                    if (!dependenciesMet) {
                        throw new Error(`Dependencies not met for step: ${step.action}`);
                    }
                }

                // Execute step
                const stepResult = await this.executeWorkflowStep(workflow, step);
                workflow.results[step.action] = stepResult;

                completedSteps++;
                workflow.progress = (completedSteps / totalSteps) * 100;
                await this.updateWorkflow(workflow);

                this.emit('workflow-step-completed', {
                    workflowId,
                    step: step.action,
                    result: stepResult,
                    progress: workflow.progress
                });
            }

            workflow.status = 'completed';
            workflow.completedAt = new Date().toISOString();
            await this.updateWorkflow(workflow);

            this.emit('workflow-completed', {
                workflowId,
                results: workflow.results
            });

        } catch (error) {
            workflow.status = 'failed';
            await this.updateWorkflow(workflow);

            this.emit('workflow-failed', {
                workflowId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            this.activeWorkflows.delete(workflowId);
        }
    }

    /**
     * Execute a single workflow step
     */
    private async executeWorkflowStep(
        workflow: CrossHubWorkflow,
        step: CrossHubWorkflow['steps'][0]
    ): Promise<any> {
        // This would integrate with your existing hub actions
        // For now, we'll simulate step execution

        const stepInputs = {
            ...step.inputs,
            // Include results from previous steps as inputs
            ...Object.fromEntries(
                Object.entries(workflow.results).filter(([key]) =>
                    step.dependencies?.includes(key)
                )
            )
        };

        // Simulate step execution based on hub and action
        switch (step.hub) {
            case 'studio':
                return this.executeStudioStep(step.action, stepInputs);
            case 'brand':
                return this.executeBrandStep(step.action, stepInputs);
            case 'research':
                return this.executeResearchStep(step.action, stepInputs);
            case 'market':
                return this.executeMarketStep(step.action, stepInputs);
            case 'tools':
                return this.executeToolsStep(step.action, stepInputs);
            default:
                throw new Error(`Unknown hub: ${step.hub}`);
        }
    }

    /**
     * Hub-specific step execution methods
     */
    private async executeStudioStep(action: string, inputs: Record<string, any>): Promise<any> {
        // Integrate with studio actions
        switch (action) {
            case 'generate-content':
                return { contentId: `content-${Date.now()}`, status: 'generated' };
            case 'optimize-content':
                return { optimizationScore: 0.85, suggestions: ['Add more keywords', 'Improve readability'] };
            default:
                return { status: 'completed', action };
        }
    }

    private async executeBrandStep(action: string, inputs: Record<string, any>): Promise<any> {
        switch (action) {
            case 'analyze-competitors':
                return { competitorCount: 5, opportunities: ['SEO gap', 'Content gap'] };
            case 'update-strategy':
                return { strategyId: `strategy-${Date.now()}`, status: 'updated' };
            default:
                return { status: 'completed', action };
        }
    }

    private async executeResearchStep(action: string, inputs: Record<string, any>): Promise<any> {
        switch (action) {
            case 'research-topic':
                return { reportId: `report-${Date.now()}`, insights: ['Market trend 1', 'Market trend 2'] };
            case 'analyze-data':
                return { analysisId: `analysis-${Date.now()}`, findings: ['Finding 1', 'Finding 2'] };
            default:
                return { status: 'completed', action };
        }
    }

    private async executeMarketStep(action: string, inputs: Record<string, any>): Promise<any> {
        switch (action) {
            case 'analyze-trends':
                return { trendId: `trend-${Date.now()}`, trends: ['Trend 1', 'Trend 2'] };
            case 'identify-opportunities':
                return { opportunities: ['Opportunity 1', 'Opportunity 2'] };
            default:
                return { status: 'completed', action };
        }
    }

    private async executeToolsStep(action: string, inputs: Record<string, any>): Promise<any> {
        switch (action) {
            case 'calculate-roi':
                return { roi: 0.15, paybackPeriod: 24 };
            case 'value-property':
                return { estimatedValue: 450000, confidence: 0.85 };
            default:
                return { status: 'completed', action };
        }
    }

    /**
     * Get insights for a user and hub
     */
    async getInsightsForHub(
        userId: string,
        targetHub: string,
        options?: {
            limit?: number;
            insightType?: InsightType;
            minConfidence?: number;
        }
    ): Promise<IntelligenceInsight[]> {
        const items = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'INSIGHT#' }
        });

        let insights = items as IntelligenceInsight[];

        // Filter by target hub
        insights = insights.filter(insight =>
            insight.targetHubs.includes(targetHub)
        );

        // Apply additional filters
        if (options?.insightType) {
            insights = insights.filter(insight => insight.insightType === options.insightType);
        }

        if (options?.minConfidence) {
            insights = insights.filter(insight => insight.confidence >= options.minConfidence);
        }

        // Remove expired insights
        const now = new Date().toISOString();
        insights = insights.filter(insight =>
            !insight.metadata.expiresAt || insight.metadata.expiresAt > now
        );

        // Sort by relevance and confidence
        insights.sort((a, b) => {
            const aScore = a.relevanceScore * a.confidence;
            const bScore = b.relevanceScore * b.confidence;
            return bScore - aScore;
        });

        return insights.slice(0, options?.limit || 20);
    }

    /**
     * Get active workflows for a user
     */
    async getUserWorkflows(userId: string): Promise<CrossHubWorkflow[]> {
        const items = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'WORKFLOW#' }
        });

        return items as CrossHubWorkflow[];
    }

    /**
     * Database operations
     */
    private async saveInsight(insight: IntelligenceInsight): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${insight.userId}`,
            SK: `INSIGHT#${insight.id}`,
            ...insight
        });
    }

    private async saveWorkflow(workflow: CrossHubWorkflow): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${workflow.userId}`,
            SK: `WORKFLOW#${workflow.id}`,
            ...workflow
        });
    }

    private async updateWorkflow(workflow: CrossHubWorkflow): Promise<void> {
        await this.repository.updateItem(
            {
                PK: `USER#${workflow.userId}`,
                SK: `WORKFLOW#${workflow.id}`
            },
            {
                status: workflow.status,
                progress: workflow.progress,
                results: workflow.results,
                completedAt: workflow.completedAt,
                updatedAt: new Date().toISOString()
            }
        );
    }
}

/**
 * Singleton instance
 */
let crossHubCoordinatorInstance: CrossHubCoordinator | null = null;

/**
 * Get the singleton CrossHubCoordinator instance
 */
export function getCrossHubCoordinator(): CrossHubCoordinator {
    if (!crossHubCoordinatorInstance) {
        crossHubCoordinatorInstance = new CrossHubCoordinator();
    }
    return crossHubCoordinatorInstance;
}

/**
 * Reset the CrossHubCoordinator singleton (useful for testing)
 */
export function resetCrossHubCoordinator(): void {
    if (crossHubCoordinatorInstance) {
        crossHubCoordinatorInstance.removeAllListeners();
        crossHubCoordinatorInstance = null;
    }
}