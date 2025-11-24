/**
 * Enhanced AI Flow Integration Layer
 * 
 * This module provides seamless integration between the enhanced multi-agent
 * architecture and the existing Bayon Coagent application. It maintains
 * backward compatibility while enabling advanced features.
 */

import { z } from 'zod';
import { getEnhancedWorkflowOrchestrator } from './enhanced-orchestrator';
import { getAgentCore } from './agent-core';
import { executeEnhancedResearchAgent, type EnhancedResearchAgentInput } from './flows/enhanced-research-agent';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Enhanced flow execution options
 */
export interface EnhancedFlowOptions {
    /** Enable multi-agent coordination */
    enableMultiAgent?: boolean;

    /** Quality requirements */
    qualityRequirements?: {
        minimumConfidence?: number;
        requiresCitation?: boolean;
        requiresPersonalization?: boolean;
    };

    /** Execution preferences */
    executionPreferences?: {
        priorityLevel?: 'low' | 'medium' | 'high' | 'critical';
        maxExecutionTime?: number;
        enableAdaptiveExecution?: boolean;
    };

    /** Context sharing preferences */
    contextSharing?: {
        enabled?: boolean;
        shareWithFutureRequests?: boolean;
    };
}

/**
 * Enhanced Research Agent Integration
 * 
 * Provides backward-compatible interface for the research agent
 * while enabling enhanced multi-agent capabilities.
 */
export class EnhancedResearchIntegration {
    /**
     * Execute research with enhanced multi-agent coordination
     */
    static async executeResearch(
        query: string,
        agentProfile?: AgentProfile,
        options?: EnhancedFlowOptions
    ): Promise<{
        response: string;
        sources: Array<{ url: string; title: string; sourceType: string }>;
        confidence: number;
        executionTime: number;
        // Enhanced fields
        keyFindings?: any[];
        qualityMetrics?: any;
        agentPerformance?: any[];
        followUpSuggestions?: any[];
    }> {
        const input: EnhancedResearchAgentInput = {
            query,
            researchDepth: 'standard',
            researchScope: {
                includeMarketData: true,
                includeTrendAnalysis: true,
                includeActionableInsights: true,
            },
            outputFormat: 'report',
            targetAudience: 'clients',
            qualityRequirements: options?.qualityRequirements,
            executionPreferences: options?.executionPreferences,
        };

        if (options?.enableMultiAgent !== false) {
            // Use enhanced multi-agent research
            const result = await executeEnhancedResearchAgent(input, agentProfile);

            return {
                response: result.researchReport,
                sources: result.sources,
                confidence: result.qualityMetrics.confidenceLevel,
                executionTime: result.executionDetails.executionTime,
                keyFindings: result.keyFindings,
                qualityMetrics: result.qualityMetrics,
                agentPerformance: [], // TODO: Map from execution details
                followUpSuggestions: result.followUpSuggestions,
            };
        } else {
            // Fallback to single-agent research (existing implementation)
            return this.executeLegacyResearch(query, agentProfile);
        }
    }

    /**
     * Fallback to existing single-agent research
     */
    private static async executeLegacyResearch(
        query: string,
        agentProfile?: AgentProfile
    ): Promise<any> {
        // Import and use existing research agent flow
        const { runResearchAgent } = await import('./flows/run-research-agent');

        const startTime = Date.now();
        const result = await runResearchAgent({
            query,
            context: agentProfile ? {
                agentProfile,
                market: agentProfile.primaryMarket,
            } : undefined,
        });

        return {
            response: result.response,
            sources: result.sources || [],
            confidence: result.confidence || 0.7,
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Enhanced Content Generation Integration
 */
export class EnhancedContentIntegration {
    /**
     * Execute content generation with enhanced capabilities
     */
    static async generateContent(
        contentType: string,
        instructions: string,
        agentProfile?: AgentProfile,
        options?: EnhancedFlowOptions & {
            targetLength?: number;
            targetAudience?: 'buyers' | 'sellers' | 'investors' | 'general';
            includeMarketInsights?: boolean;
        }
    ): Promise<{
        content: string;
        wordCount: number;
        tone: string;
        // Enhanced fields
        qualityScore?: number;
        brandConsistency?: number;
        personalizationApplied?: any;
        seoOptimization?: any;
    }> {
        if (options?.enableMultiAgent !== false && options?.includeMarketInsights) {
            // Use multi-agent approach with market research + content generation
            return this.executeMultiAgentContent(
                contentType,
                instructions,
                agentProfile,
                options
            );
        } else {
            // Use enhanced single-agent content generation
            return this.executeEnhancedSingleContent(
                contentType,
                instructions,
                agentProfile,
                options
            );
        }
    }

    /**
     * Multi-agent content generation with market insights
     */
    private static async executeMultiAgentContent(
        contentType: string,
        instructions: string,
        agentProfile?: AgentProfile,
        options?: any
    ): Promise<any> {
        const orchestrator = getEnhancedWorkflowOrchestrator();

        // Create a workflow that combines market research with content generation
        const workflowPrompt = `Create ${contentType} content: "${instructions}"

Requirements:
- Include relevant market insights and data
- Personalize for agent profile and target audience
- Ensure high quality and brand consistency
- Target length: ${options?.targetLength || 'appropriate'} words
- Target audience: ${options?.targetAudience || 'general'}`;

        const result = await orchestrator.executeCompleteEnhancedWorkflow(
            workflowPrompt,
            agentProfile,
            {
                maxTasks: 3, // Data analyst + Content generator + optional forecaster
                priorityLevel: options?.executionPreferences?.priorityLevel || 'medium',
                qualityRequirements: {
                    minimumConfidence: 0.8,
                    requiresCitation: false,
                    requiresPersonalization: true,
                    ...options?.qualityRequirements,
                },
            }
        );

        // Extract content generation result
        const contentResult = result.results.find(r =>
            r.workerType === 'content-generator' && r.status === 'success'
        );

        if (!contentResult?.output) {
            throw new Error('Content generation failed in multi-agent workflow');
        }

        return {
            content: contentResult.output.content,
            wordCount: contentResult.output.wordCount,
            tone: contentResult.output.tone,
            qualityScore: contentResult.output.qualityScore,
            brandConsistency: contentResult.output.brandConsistency,
            personalizationApplied: contentResult.output.personalizationApplied,
            seoOptimization: contentResult.output.seoOptimization,
        };
    }

    /**
     * Enhanced single-agent content generation
     */
    private static async executeEnhancedSingleContent(
        contentType: string,
        instructions: string,
        agentProfile?: AgentProfile,
        options?: any
    ): Promise<any> {
        const agentCore = getAgentCore();

        // Get the best content generator strand
        const contentStrands = agentCore.getStrandsByType('content-generator');
        if (contentStrands.length === 0) {
            throw new Error('No content generator agents available');
        }

        // Use the highest performing strand
        const bestStrand = contentStrands.sort((a, b) =>
            b.metrics.successRate - a.metrics.successRate
        )[0];

        // Import and use enhanced content generator
        const { createStrandInstance } = await import('./agent-strands');
        const strandInstance = createStrandInstance(bestStrand);

        const task = {
            id: `content_${Date.now()}`,
            type: 'content-generator' as const,
            description: `Generate ${contentType} content`,
            dependencies: [],
            input: {
                contentType,
                instructions,
                targetLength: options?.targetLength,
                targetAudience: options?.targetAudience,
                context: {
                    agentProfile,
                },
            },
            context: {
                userId: agentProfile?.userId,
                agentProfile,
            },
            createdAt: new Date().toISOString(),
            status: 'pending' as const,
        };

        const result = await strandInstance.executeTask(task);

        if (result.status === 'error') {
            throw new Error(result.error?.message || 'Content generation failed');
        }

        return {
            content: result.output?.content || '',
            wordCount: result.output?.wordCount || 0,
            tone: result.output?.tone || 'professional',
            qualityScore: result.output?.qualityScore,
            brandConsistency: result.output?.brandConsistency,
            personalizationApplied: result.output?.personalizationApplied,
            seoOptimization: result.output?.seoOptimization,
        };
    }
}

/**
 * Enhanced Market Analysis Integration
 */
export class EnhancedMarketIntegration {
    /**
     * Execute market analysis with enhanced forecasting
     */
    static async analyzeMarket(
        query: string,
        market?: string,
        agentProfile?: AgentProfile,
        options?: EnhancedFlowOptions & {
            includeForecasting?: boolean;
            timeframe?: string;
            analysisDepth?: 'surface' | 'standard' | 'deep';
        }
    ): Promise<{
        analysis: string;
        dataPoints: any[];
        trends: any[];
        confidence: number;
        // Enhanced fields
        predictions?: any[];
        riskFactors?: any[];
        opportunities?: any[];
        qualityMetrics?: any;
    }> {
        if (options?.includeForecasting) {
            // Use multi-agent approach with data analysis + forecasting
            return this.executeMultiAgentMarketAnalysis(
                query,
                market,
                agentProfile,
                options
            );
        } else {
            // Use enhanced single-agent data analysis
            return this.executeEnhancedDataAnalysis(
                query,
                market,
                agentProfile,
                options
            );
        }
    }

    /**
     * Multi-agent market analysis with forecasting
     */
    private static async executeMultiAgentMarketAnalysis(
        query: string,
        market?: string,
        agentProfile?: AgentProfile,
        options?: any
    ): Promise<any> {
        const orchestrator = getEnhancedWorkflowOrchestrator();

        const workflowPrompt = `Analyze market conditions and provide forecasting: "${query}"

Market: ${market || agentProfile?.primaryMarket || 'general'}
Timeframe: ${options?.timeframe || '12 months'}
Analysis Depth: ${options?.analysisDepth || 'standard'}

Requirements:
- Comprehensive market data analysis
- Trend identification and forecasting
- Risk and opportunity assessment
- Actionable insights for real estate professionals`;

        const result = await orchestrator.executeCompleteEnhancedWorkflow(
            workflowPrompt,
            agentProfile,
            {
                maxTasks: 3, // Data analyst + Market forecaster + Content generator
                priorityLevel: options?.executionPreferences?.priorityLevel || 'medium',
                qualityRequirements: {
                    minimumConfidence: 0.75,
                    requiresCitation: true,
                    requiresPersonalization: true,
                    ...options?.qualityRequirements,
                },
            }
        );

        // Combine results from data analyst and market forecaster
        const dataResult = result.results.find(r =>
            r.workerType === 'data-analyst' && r.status === 'success'
        );

        const forecastResult = result.results.find(r =>
            r.workerType === 'market-forecaster' && r.status === 'success'
        );

        return {
            analysis: result.synthesizedResponse,
            dataPoints: dataResult?.output?.dataPoints || [],
            trends: dataResult?.output?.trends || forecastResult?.output?.marketTrends || [],
            confidence: result.executionMetrics.confidenceScore,
            predictions: forecastResult?.output?.predictions || [],
            riskFactors: forecastResult?.output?.riskFactors || [],
            opportunities: forecastResult?.output?.opportunities || [],
            qualityMetrics: result.executionMetrics,
        };
    }

    /**
     * Enhanced single-agent data analysis
     */
    private static async executeEnhancedDataAnalysis(
        query: string,
        market?: string,
        agentProfile?: AgentProfile,
        options?: any
    ): Promise<any> {
        const agentCore = getAgentCore();

        // Get the best data analyst strand
        const dataStrands = agentCore.getStrandsByType('data-analyst');
        if (dataStrands.length === 0) {
            throw new Error('No data analyst agents available');
        }

        const bestStrand = dataStrands.sort((a, b) =>
            b.metrics.successRate - a.metrics.successRate
        )[0];

        const { createStrandInstance } = await import('./agent-strands');
        const strandInstance = createStrandInstance(bestStrand);

        const task = {
            id: `analysis_${Date.now()}`,
            type: 'data-analyst' as const,
            description: `Analyze market data: ${query}`,
            dependencies: [],
            input: {
                query,
                dataSource: 'tavily',
                analysisType: 'market-trends',
                analysisDepth: options?.analysisDepth || 'standard',
                context: {
                    market: market || agentProfile?.primaryMarket,
                    agentProfile,
                },
            },
            context: {
                userId: agentProfile?.userId,
                agentProfile,
            },
            createdAt: new Date().toISOString(),
            status: 'pending' as const,
        };

        const result = await strandInstance.executeTask(task);

        if (result.status === 'error') {
            throw new Error(result.error?.message || 'Market analysis failed');
        }

        return {
            analysis: result.output?.summary || '',
            dataPoints: result.output?.dataPoints || [],
            trends: result.output?.trends || [],
            confidence: result.output?.confidence || 0.7,
            qualityMetrics: result.output?.qualityMetrics,
        };
    }
}

/**
 * Enhanced Flow Manager
 * 
 * Central manager for all enhanced AI flows with intelligent routing
 */
export class EnhancedFlowManager {
    /**
     * Execute any flow with automatic enhancement detection
     */
    static async executeFlow(
        flowType: 'research' | 'content' | 'market' | 'forecast',
        input: any,
        agentProfile?: AgentProfile,
        options?: EnhancedFlowOptions
    ): Promise<any> {
        // Determine if enhanced multi-agent execution is beneficial
        const shouldUseMultiAgent = this.shouldUseMultiAgent(flowType, input, options);

        switch (flowType) {
            case 'research':
                return EnhancedResearchIntegration.executeResearch(
                    input.query,
                    agentProfile,
                    { ...options, enableMultiAgent: shouldUseMultiAgent }
                );

            case 'content':
                return EnhancedContentIntegration.generateContent(
                    input.contentType,
                    input.instructions,
                    agentProfile,
                    { ...options, enableMultiAgent: shouldUseMultiAgent, ...input }
                );

            case 'market':
                return EnhancedMarketIntegration.analyzeMarket(
                    input.query,
                    input.market,
                    agentProfile,
                    { ...options, enableMultiAgent: shouldUseMultiAgent, ...input }
                );

            default:
                throw new Error(`Unsupported flow type: ${flowType}`);
        }
    }

    /**
     * Determine if multi-agent execution would be beneficial
     */
    private static shouldUseMultiAgent(
        flowType: string,
        input: any,
        options?: EnhancedFlowOptions
    ): boolean {
        // User explicitly disabled multi-agent
        if (options?.enableMultiAgent === false) {
            return false;
        }

        // User explicitly enabled multi-agent
        if (options?.enableMultiAgent === true) {
            return true;
        }

        // Intelligent decision based on complexity and requirements
        const complexityFactors = [
            // Query complexity
            input.query?.length > 100,
            input.query?.includes('compare') || input.query?.includes('analyze'),

            // Quality requirements
            options?.qualityRequirements?.minimumConfidence > 0.8,
            options?.qualityRequirements?.requiresCitation,

            // Execution preferences
            options?.executionPreferences?.priorityLevel === 'high' ||
            options?.executionPreferences?.priorityLevel === 'critical',

            // Flow-specific factors
            flowType === 'research' && input.researchDepth === 'comprehensive',
            flowType === 'content' && input.includeMarketInsights,
            flowType === 'market' && input.includeForecasting,
        ];

        // Use multi-agent if 2 or more complexity factors are present
        return complexityFactors.filter(Boolean).length >= 2;
    }

    /**
     * Get agent performance metrics
     */
    static getAgentMetrics(): {
        strands: any[];
        overallPerformance: any;
        recommendations: string[];
    } {
        const agentCore = getAgentCore();
        const strands = agentCore.getAllStrands();

        const overallPerformance = {
            totalTasks: strands.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0),
            avgSuccessRate: strands.reduce((sum, s) => sum + s.metrics.successRate, 0) / strands.length,
            avgExecutionTime: strands.reduce((sum, s) => sum + s.metrics.avgExecutionTime, 0) / strands.length,
        };

        const recommendations = this.generatePerformanceRecommendations(strands);

        return {
            strands: strands.map(s => ({
                id: s.id,
                type: s.type,
                state: s.state,
                metrics: s.metrics,
                capabilities: s.capabilities,
            })),
            overallPerformance,
            recommendations,
        };
    }

    /**
     * Generate performance recommendations
     */
    private static generatePerformanceRecommendations(strands: any[]): string[] {
        const recommendations: string[] = [];

        // Check for underperforming strands
        const underperforming = strands.filter(s => s.metrics.successRate < 0.8);
        if (underperforming.length > 0) {
            recommendations.push(
                `${underperforming.length} agent(s) have success rates below 80%. Consider reviewing their configurations.`
            );
        }

        // Check for overloaded strands
        const overloaded = strands.filter(s => s.metrics.currentLoad > 0.8);
        if (overloaded.length > 0) {
            recommendations.push(
                `${overloaded.length} agent(s) are operating at high load. Consider scaling or load balancing.`
            );
        }

        // Check for idle strands
        const idle = strands.filter(s => s.state === 'idle' && s.metrics.tasksCompleted === 0);
        if (idle.length > 0) {
            recommendations.push(
                `${idle.length} agent(s) are idle and unused. Consider optimizing task allocation.`
            );
        }

        return recommendations;
    }
}

/**
 * Export enhanced integrations for easy use
 */
export {
    EnhancedResearchIntegration as Research,
    EnhancedContentIntegration as Content,
    EnhancedMarketIntegration as Market,
    EnhancedFlowManager as FlowManager,
};