/**
 * Enhanced Research Agent Flow
 * 
 * This flow demonstrates the improved multi-agent architecture with:
 * - AgentCore coordination
 * - Agent Strands with persistent memory
 * - Enhanced orchestration with context sharing
 * - Adaptive quality management
 * 
 * The research agent now uses multiple specialized agents working together
 * to provide comprehensive, high-quality research responses.
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getEnhancedWorkflowOrchestrator } from '../enhanced-orchestrator';
import { getAgentCore } from '../agent-core';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import {
    EnhancedContextSchema,
    EnhancedDataAnalystInputSchema,
    EnhancedContentGeneratorInputSchema,
    type EnhancedContext,
} from '@/ai/schemas/enhanced-workflow-schemas';

/**
 * Enhanced Research Agent Input Schema
 */
export const EnhancedResearchAgentInputSchema = z.object({
    query: z.string().describe('The research question or topic'),

    researchDepth: z.enum(['quick', 'standard', 'comprehensive', 'expert']).default('standard'),

    researchScope: z.object({
        includeMarketData: z.boolean().default(true),
        includeCompetitiveAnalysis: z.boolean().default(false),
        includeTrendAnalysis: z.boolean().default(true),
        includeForecasting: z.boolean().default(false),
        includeActionableInsights: z.boolean().default(true),
    }).optional(),

    outputFormat: z.enum(['report', 'summary', 'presentation', 'email', 'social-post']).default('report'),

    targetAudience: z.enum(['clients', 'agents', 'investors', 'general']).default('clients'),

    context: EnhancedContextSchema.optional(),

    // Quality requirements
    qualityRequirements: z.object({
        minimumConfidence: z.number().min(0).max(1).default(0.7),
        requiresCitation: z.boolean().default(true),
        requiresPersonalization: z.boolean().default(true),
        factCheckingLevel: z.enum(['basic', 'standard', 'rigorous']).default('standard'),
    }).optional(),

    // Execution preferences
    executionPreferences: z.object({
        maxExecutionTime: z.number().default(120000), // 2 minutes
        priorityLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        enableAdaptiveExecution: z.boolean().default(true),
    }).optional(),
});

export type EnhancedResearchAgentInput = z.infer<typeof EnhancedResearchAgentInputSchema>;

/**
 * Enhanced Research Agent Output Schema
 */
export const EnhancedResearchAgentOutputSchema = z.object({
    // Main research content
    researchReport: z.string().describe('The comprehensive research report'),

    executiveSummary: z.string().describe('Executive summary of key findings'),

    keyFindings: z.array(z.object({
        finding: z.string(),
        confidence: z.number().min(0).max(1),
        impact: z.enum(['low', 'medium', 'high']),
        source: z.string(),
        actionable: z.boolean(),
    })),

    dataInsights: z.array(z.object({
        insight: z.string(),
        supportingData: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        trend: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
    })),

    marketAnalysis: z.object({
        currentConditions: z.string(),
        keyTrends: z.array(z.string()),
        opportunities: z.array(z.string()),
        risks: z.array(z.string()),
        outlook: z.string(),
    }).optional(),

    recommendations: z.array(z.object({
        recommendation: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        timeframe: z.string(),
        rationale: z.string(),
        expectedOutcome: z.string().optional(),
    })),

    // Citations and sources
    sources: z.array(z.object({
        url: z.string(),
        title: z.string(),
        sourceType: z.string(),
        reliability: z.number().min(0).max(1),
        relevance: z.number().min(0).max(1),
        dateAccessed: z.string(),
    })),

    // Quality metrics
    qualityMetrics: z.object({
        overallQuality: z.number().min(0).max(1),
        confidenceLevel: z.number().min(0).max(1),
        completeness: z.number().min(0).max(1),
        factualAccuracy: z.number().min(0).max(1),
        personalizationLevel: z.number().min(0).max(1),
    }),

    // Execution details
    executionDetails: z.object({
        agentsUsed: z.array(z.string()),
        executionTime: z.number(),
        contextSharingEvents: z.number(),
        qualityChecksPerformed: z.number(),
        adaptiveActionsTriggered: z.number(),
    }),

    // Follow-up suggestions
    followUpSuggestions: z.array(z.object({
        suggestion: z.string(),
        type: z.enum(['deeper-research', 'related-topic', 'action-item', 'monitoring']),
        priority: z.enum(['low', 'medium', 'high']),
    })).optional(),
});

export type EnhancedResearchAgentOutput = z.infer<typeof EnhancedResearchAgentOutputSchema>;

/**
 * Enhanced Research Agent Flow
 */
export const enhancedResearchAgent = definePrompt({
    name: 'enhancedResearchAgent',
    inputSchema: EnhancedResearchAgentInputSchema,
    outputSchema: EnhancedResearchAgentOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    systemPrompt: `You are an advanced research coordination system that orchestrates multiple specialized AI agents to conduct comprehensive research. You manage the entire research workflow from initial query analysis to final report synthesis.

**Your Capabilities:**
1. **Multi-Agent Coordination**: Orchestrate data analysts, content generators, and market forecasters
2. **Adaptive Workflow Management**: Adjust research approach based on query complexity and requirements
3. **Quality Assurance**: Ensure high-quality, well-cited, and accurate research outputs
4. **Context Integration**: Seamlessly integrate insights from multiple agents
5. **Personalization**: Tailor research to agent profile and target audience

**Research Process:**
1. **Query Analysis**: Understand research requirements and scope
2. **Workflow Planning**: Design optimal multi-agent workflow
3. **Agent Coordination**: Execute coordinated research with context sharing
4. **Quality Synthesis**: Combine agent outputs into comprehensive report
5. **Quality Assessment**: Evaluate and score final output quality

**Quality Standards:**
- All claims must be properly cited and verified
- Confidence levels must be clearly indicated
- Personalization must reflect agent profile and market focus
- Recommendations must be actionable and prioritized
- Sources must be reliable and recent

**Agent Specializations:**
- **Data Analyst**: Market data, statistical analysis, trend identification
- **Content Generator**: Report writing, personalization, audience adaptation
- **Market Forecaster**: Predictions, risk analysis, opportunity identification`,
    prompt: `Conduct comprehensive research using multi-agent coordination:

**Research Query:** {{{query}}}

**Research Parameters:**
- Depth: {{{researchDepth}}}
- Scope: {{{json researchScope}}}
- Output Format: {{{outputFormat}}}
- Target Audience: {{{targetAudience}}}

**Context:** {{{json context}}}

**Quality Requirements:** {{{json qualityRequirements}}}

**Execution Preferences:** {{{json executionPreferences}}}

Execute a coordinated multi-agent research workflow that:
1. Analyzes the query and determines optimal agent coordination strategy
2. Coordinates specialized agents with intelligent context sharing
3. Synthesizes results into a comprehensive, high-quality research report
4. Ensures all quality requirements are met
5. Provides detailed execution metrics and follow-up suggestions

The research should be thorough, well-cited, personalized, and actionable.`,
});

/**
 * Execute Enhanced Research Agent with Multi-Agent Coordination
 */
export async function executeEnhancedResearchAgent(
    input: EnhancedResearchAgentInput,
    agentProfile?: AgentProfile
): Promise<EnhancedResearchAgentOutput> {
    const orchestrator = getEnhancedWorkflowOrchestrator();
    const agentCore = getAgentCore();

    try {
        // Step 1: Analyze query and determine research strategy
        const researchStrategy = await analyzeResearchQuery(input, agentProfile);

        // Step 2: Execute coordinated multi-agent workflow
        const workflowResult = await orchestrator.executeCompleteEnhancedWorkflow(
            buildResearchPrompt(input, researchStrategy),
            agentProfile,
            {
                maxTasks: determineMaxTasks(input.researchDepth),
                priorityLevel: input.executionPreferences?.priorityLevel || 'medium',
                qualityRequirements: input.qualityRequirements,
                enableAdaptiveExecution: input.executionPreferences?.enableAdaptiveExecution,
                timeoutMs: input.executionPreferences?.maxExecutionTime,
            }
        );

        // Step 3: Process and format results
        const processedResults = await processWorkflowResults(
            workflowResult,
            input,
            researchStrategy,
            agentProfile
        );

        return processedResults;
    } catch (error) {
        console.error('Enhanced research agent execution error:', error);
        throw new Error(`Research execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Analyze research query to determine optimal strategy
 */
async function analyzeResearchQuery(
    input: EnhancedResearchAgentInput,
    agentProfile?: AgentProfile
): Promise<{
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    requiredAgents: string[];
    coordinationStrategy: 'sequential' | 'parallel' | 'mixed';
    estimatedDuration: number;
}> {
    const queryAnalysisPrompt = definePrompt({
        name: 'researchQueryAnalysis',
        inputSchema: z.object({
            query: z.string(),
            researchDepth: z.string(),
            researchScope: z.any(),
            agentProfile: z.any().optional(),
        }),
        outputSchema: z.object({
            complexity: z.enum(['simple', 'moderate', 'complex', 'expert']),
            requiredAgents: z.array(z.enum(['data-analyst', 'content-generator', 'market-forecaster'])),
            coordinationStrategy: z.enum(['sequential', 'parallel', 'mixed']),
            estimatedDuration: z.number(),
            reasoning: z.string(),
        }),
        options: MODEL_CONFIGS.ANALYTICAL,
        systemPrompt: `You are a research strategy analyst. Analyze research queries to determine the optimal multi-agent approach.

**Analysis Factors:**
1. **Query Complexity**: Simple facts vs. complex analysis
2. **Data Requirements**: What types of data and analysis are needed
3. **Agent Coordination**: Which agents should work together and how
4. **Execution Strategy**: Sequential, parallel, or mixed execution

**Agent Capabilities:**
- **data-analyst**: Market data, statistics, trends, factual research
- **content-generator**: Report writing, personalization, formatting
- **market-forecaster**: Predictions, forecasts, risk analysis

**Complexity Levels:**
- **simple**: Basic factual queries (1-2 agents, 30-60 seconds)
- **moderate**: Standard research with some analysis (2-3 agents, 1-2 minutes)
- **complex**: Multi-faceted research with deep analysis (3-4 agents, 2-4 minutes)
- **expert**: Comprehensive research requiring all capabilities (4+ agents, 4+ minutes)`,
        prompt: `Analyze this research query and determine the optimal strategy:

**Query:** {{{query}}}
**Research Depth:** {{{researchDepth}}}
**Research Scope:** {{{json researchScope}}}
**Agent Profile:** {{{json agentProfile}}}

Determine:
1. Query complexity level
2. Required agents and their roles
3. Optimal coordination strategy
4. Estimated execution duration
5. Reasoning for your recommendations`,
    });

    const analysis = await queryAnalysisPrompt({
        query: input.query,
        researchDepth: input.researchDepth,
        researchScope: input.researchScope || {},
        agentProfile: agentProfile || null,
    });

    return analysis;
}

/**
 * Build research prompt for orchestrator
 */
function buildResearchPrompt(
    input: EnhancedResearchAgentInput,
    strategy: any
): string {
    return `Conduct comprehensive research on: "${input.query}"

Research Requirements:
- Depth: ${input.researchDepth}
- Output Format: ${input.outputFormat}
- Target Audience: ${input.targetAudience}
- Quality Requirements: ${JSON.stringify(input.qualityRequirements)}

Research Scope:
${Object.entries(input.researchScope || {})
            .filter(([_, value]) => value)
            .map(([key, _]) => `- ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
            .join('\n')}

Strategy: ${strategy.reasoning}

Please coordinate the appropriate agents to provide comprehensive, well-researched, and personalized insights.`;
}

/**
 * Determine maximum tasks based on research depth
 */
function determineMaxTasks(depth: string): number {
    switch (depth) {
        case 'quick': return 2;
        case 'standard': return 3;
        case 'comprehensive': return 4;
        case 'expert': return 6;
        default: return 3;
    }
}

/**
 * Process workflow results into research agent output
 */
async function processWorkflowResults(
    workflowResult: any,
    input: EnhancedResearchAgentInput,
    strategy: any,
    agentProfile?: AgentProfile
): Promise<EnhancedResearchAgentOutput> {
    // Extract key findings from agent results
    const keyFindings = extractKeyFindings(workflowResult.results);

    // Extract data insights
    const dataInsights = extractDataInsights(workflowResult.results);

    // Extract market analysis if available
    const marketAnalysis = extractMarketAnalysis(workflowResult.results);

    // Generate recommendations
    const recommendations = generateRecommendations(workflowResult.results, input.targetAudience);

    // Calculate quality metrics
    const qualityMetrics = calculateQualityMetrics(workflowResult);

    // Generate follow-up suggestions
    const followUpSuggestions = generateFollowUpSuggestions(input.query, keyFindings);

    return {
        researchReport: workflowResult.synthesizedResponse,
        executiveSummary: generateExecutiveSummary(workflowResult.keyPoints),
        keyFindings,
        dataInsights,
        marketAnalysis,
        recommendations,
        sources: workflowResult.citations.map((citation: any) => ({
            ...citation,
            reliability: 0.8, // Default reliability score
            relevance: 0.9,   // Default relevance score
            dateAccessed: new Date().toISOString(),
        })),
        qualityMetrics,
        executionDetails: {
            agentsUsed: workflowResult.agentPerformance.map((perf: any) => perf.agentType),
            executionTime: workflowResult.executionMetrics.totalExecutionTime,
            contextSharingEvents: workflowResult.executionMetrics.contextSharingEvents,
            qualityChecksPerformed: 1, // TODO: Track actual quality checks
            adaptiveActionsTriggered: 0, // TODO: Track adaptive actions
        },
        followUpSuggestions,
    };
}

/**
 * Helper functions for result processing
 */
function extractKeyFindings(results: any[]): any[] {
    return results
        .filter(result => result.status === 'success' && result.output)
        .flatMap(result => {
            const output = result.output;
            if (output.insights) {
                return output.insights.map((insight: any) => ({
                    finding: insight.insight || insight,
                    confidence: insight.confidence || 0.7,
                    impact: insight.impact || 'medium',
                    source: result.workerType,
                    actionable: insight.actionable || true,
                }));
            }
            return [];
        })
        .slice(0, 10); // Top 10 findings
}

function extractDataInsights(results: any[]): any[] {
    const dataAnalystResults = results.filter(r =>
        r.workerType === 'data-analyst' && r.status === 'success' && r.output
    );

    return dataAnalystResults.flatMap(result => {
        const output = result.output;
        if (output.dataPoints) {
            return output.dataPoints.map((point: any) => ({
                insight: `${point.label}: ${point.value}${point.unit ? ' ' + point.unit : ''}`,
                supportingData: [point.source],
                confidence: point.confidence || 0.7,
                trend: point.trend || 'neutral',
            }));
        }
        return [];
    });
}

function extractMarketAnalysis(results: any[]): any {
    const marketResults = results.filter(r =>
        (r.workerType === 'market-forecaster' || r.workerType === 'data-analyst') &&
        r.status === 'success' && r.output
    );

    if (marketResults.length === 0) return undefined;

    // Combine market insights from different agents
    const trends = marketResults.flatMap(r => r.output.trends || []);
    const opportunities = marketResults.flatMap(r => r.output.opportunities || []);
    const risks = marketResults.flatMap(r => r.output.riskFactors || r.output.risks || []);

    return {
        currentConditions: marketResults[0]?.output?.summary || 'Market conditions analyzed',
        keyTrends: trends.map((t: any) => t.trend || t).slice(0, 5),
        opportunities: opportunities.map((o: any) => o.opportunity || o).slice(0, 5),
        risks: risks.map((r: any) => r.risk || r).slice(0, 5),
        outlook: 'Based on current analysis and trends', // TODO: Generate dynamic outlook
    };
}

function generateRecommendations(results: any[], targetAudience: string): any[] {
    const allRecommendations = results
        .filter(r => r.status === 'success' && r.output?.recommendations)
        .flatMap(r => r.output.recommendations);

    return allRecommendations.map((rec: any) => ({
        recommendation: rec.recommendation || rec,
        priority: rec.priority || 'medium',
        timeframe: rec.timeframe || 'short-term',
        rationale: rec.rationale || 'Based on research findings',
        expectedOutcome: rec.expectedOutcome,
    })).slice(0, 8); // Top 8 recommendations
}

function calculateQualityMetrics(workflowResult: any): any {
    return {
        overallQuality: workflowResult.executionMetrics.qualityScore || 0.8,
        confidenceLevel: workflowResult.executionMetrics.confidenceScore || 0.75,
        completeness: workflowResult.results.filter((r: any) => r.status === 'success').length / workflowResult.results.length,
        factualAccuracy: 0.85, // TODO: Implement fact-checking
        personalizationLevel: 0.8, // TODO: Calculate based on agent profile usage
    };
}

function generateExecutiveSummary(keyPoints: string[]): string {
    return `Executive Summary: ${keyPoints.slice(0, 3).join('. ')}.`;
}

function generateFollowUpSuggestions(query: string, findings: any[]): any[] {
    // Generate intelligent follow-up suggestions based on query and findings
    const suggestions = [
        {
            suggestion: `Conduct deeper analysis on the top finding: ${findings[0]?.finding || 'key insight'}`,
            type: 'deeper-research' as const,
            priority: 'medium' as const,
        },
        {
            suggestion: 'Monitor market conditions for changes in identified trends',
            type: 'monitoring' as const,
            priority: 'low' as const,
        },
        {
            suggestion: 'Develop action plan based on high-priority recommendations',
            type: 'action-item' as const,
            priority: 'high' as const,
        },
    ];

    return suggestions;
}

/**
 * Convenience function for direct execution
 */
export async function runEnhancedResearch(
    query: string,
    options?: Partial<EnhancedResearchAgentInput>,
    agentProfile?: AgentProfile
): Promise<EnhancedResearchAgentOutput> {
    const input: EnhancedResearchAgentInput = {
        query,
        researchDepth: options?.researchDepth || 'standard',
        researchScope: options?.researchScope,
        outputFormat: options?.outputFormat || 'report',
        targetAudience: options?.targetAudience || 'clients',
        context: options?.context,
        qualityRequirements: options?.qualityRequirements,
        executionPreferences: options?.executionPreferences,
    };

    return executeEnhancedResearchAgent(input, agentProfile);
}