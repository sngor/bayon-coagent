'use server';

/**
 * Enhanced Agent Server Actions
 * 
 * Server actions that integrate the enhanced AI agent features with the application.
 * Provides endpoints for hub-specific agents, proactive suggestions, cross-hub insights,
 * and orchestrated workflows.
 */

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getAgentProfileRepository } from '@/aws/dynamodb/agent-profile-repository';
import { HubAgentRegistry, HubAgentSelectionSchema } from '@/aws/bedrock/hub-agents/hub-agent-registry';
import { getProactiveAgentManager } from '@/aws/bedrock/proactive/proactive-agent-manager';
import { getCrossHubCoordinator } from '@/aws/bedrock/intelligence/cross-hub-coordinator';
import { getEnhancedOrchestrator } from '@/aws/bedrock/orchestration/enhanced-orchestrator';
import { getBedrockClient } from '@/aws/bedrock/client';

/**
 * Response type for server actions
 */
interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Get hub-specific agent for a task
 */
export async function getHubAgentAction(
    selection: z.infer<typeof HubAgentSelectionSchema>
): Promise<ActionResponse<any>> {
    try {
        const validatedSelection = HubAgentSelectionSchema.parse(selection);

        const agent = HubAgentRegistry.getRecommendedAgent(
            validatedSelection.taskType,
            validatedSelection.hubContext,
            validatedSelection.expertiseRequired
        );

        if (!agent) {
            return {
                success: false,
                error: 'No suitable agent found for the specified criteria'
            };
        }

        return {
            success: true,
            data: {
                agent: {
                    id: agent.id,
                    name: agent.name,
                    hub: agent.hub,
                    personality: agent.personality,
                    expertise: agent.expertise,
                    capabilities: agent.capabilities
                }
            },
            message: `Selected ${agent.name} for ${validatedSelection.taskType}`
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get hub agent'
        };
    }
}

/**
 * Chat with a specific hub agent
 */
const hubAgentChatSchema = z.object({
    hubContext: z.string(),
    message: z.string().min(1).max(5000),
    taskType: z.string().optional(),
    conversationId: z.string().optional(),
});

export async function chatWithHubAgentAction(
    input: z.infer<typeof hubAgentChatSchema>
): Promise<ActionResponse<{
    response: string;
    agentUsed: string;
    conversationId: string;
    keyPoints?: string[];
}>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const validatedInput = hubAgentChatSchema.parse(input);

        // Get user's agent profile
        const agentProfileRepo = getAgentProfileRepository();
        const agentProfile = await agentProfileRepo.getProfile(user.id);

        // Get appropriate hub agent
        const hubAgent = HubAgentRegistry.getRecommendedAgent(
            validatedInput.taskType || 'general-query',
            validatedInput.hubContext
        );

        if (!hubAgent) {
            return {
                success: false,
                error: 'No suitable agent found for this hub'
            };
        }

        // Create personalized system prompt
        const systemPrompt = `${hubAgent.systemPrompt}

Current User Context:
- Agent Name: ${agentProfile?.agentName || 'Agent'}
- Primary Market: ${agentProfile?.primaryMarket || 'General market'}
- Specialization: ${agentProfile?.specialization || 'General real estate'}
- Hub Context: ${validatedInput.hubContext}

Respond as ${hubAgent.name} with your characteristic ${hubAgent.personality} personality.`;

        // Generate response using Bedrock with enhanced retry logic
        const client = getBedrockClient();

        let response;
        let retryCount = 0;
        const maxRetries = 2;
        const baseDelay = 1000; // 1 second base delay

        while (retryCount <= maxRetries) {
            try {
                response = await client.invokeWithPrompts(
                    systemPrompt,
                    validatedInput.message,
                    z.object({
                        response: z.string(),
                        keyPoints: z.array(z.string()).optional(),
                        suggestedActions: z.array(z.string()).optional()
                    }),
                    {
                        temperature: 0.7,
                        maxTokens: 2048,
                        flowName: `hub-agent-chat-${hubAgent.hub}`
                    }
                );
                break; // Success, exit retry loop
            } catch (error) {
                retryCount++;
                
                if (retryCount > maxRetries) {
                    // If all retries failed, provide specific error message
                    if (error instanceof Error) {
                        const errorMessage = error.message.toLowerCase();
                        if (errorMessage.includes('throttle') || errorMessage.includes('rate limit')) {
                            throw new Error('AI service is busy. Please try again in a moment.');
                        } else if (errorMessage.includes('timeout')) {
                            throw new Error('Request timed out. Please try a shorter message.');
                        } else if (errorMessage.includes('model')) {
                            throw new Error('AI model temporarily unavailable. Please try again.');
                        } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
                            throw new Error('Authentication error. Please refresh the page.');
                        }
                    }
                    throw error; // Re-throw original error if no specific handling
                }
                
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        const conversationId = validatedInput.conversationId || `conv-${Date.now()}`;

        if (!response) {
            throw new Error('Failed to generate response after all retries');
        }

        return {
            success: true,
            data: {
                response: response.response,
                agentUsed: hubAgent.name,
                conversationId,
                keyPoints: response.keyPoints
            },
            message: 'Response generated successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate response'
        };
    }
}

/**
 * Initialize proactive monitoring for a user
 */
const initProactiveMonitoringSchema = z.object({
    enabledFeatures: z.array(z.string()).optional(),
    preferences: z.object({
        notificationFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
        priorityThreshold: z.enum(['low', 'medium', 'high']).optional(),
        hubPreferences: z.record(z.boolean()).optional()
    }).optional()
});

export async function initProactiveMonitoringAction(
    config?: z.infer<typeof initProactiveMonitoringSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const agentProfileRepo = getAgentProfileRepository();
        const agentProfile = await agentProfileRepo.getProfile(user.id);

        if (!agentProfile) {
            return { success: false, error: 'Agent profile required for proactive monitoring' };
        }

        const proactiveManager = getProactiveAgentManager();

        await proactiveManager.initializeUserMonitoring(
            user.id,
            agentProfile,
            config?.preferences
        );

        return {
            success: true,
            message: 'Proactive monitoring initialized successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initialize proactive monitoring'
        };
    }
}

/**
 * Get proactive suggestions for a user
 */
const getProactiveSuggestionsSchema = z.object({
    limit: z.number().min(1).max(50).optional(),
    type: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    includeDismissed: z.boolean().optional()
});

export async function getProactiveSuggestionsAction(
    options?: z.infer<typeof getProactiveSuggestionsSchema>
): Promise<ActionResponse<any[]>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const proactiveManager = getProactiveAgentManager();

        const suggestions = await proactiveManager.getUserSuggestions(user.id, {
            limit: options?.limit,
            type: options?.type as any,
            priority: options?.priority,
            includeDismissed: options?.includeDismissed
        });

        return {
            success: true,
            data: suggestions,
            message: `Retrieved ${suggestions.length} suggestions`
        };

    } catch (error) {
        // Log the error for debugging but return empty suggestions instead of failing
        console.warn('Failed to get proactive suggestions:', error);
        return {
            success: true,
            data: [],
            message: 'No suggestions available'
        };
    }
}

/**
 * Dismiss a proactive suggestion
 */
export async function dismissSuggestionAction(suggestionId: string): Promise<ActionResponse> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const proactiveManager = getProactiveAgentManager();
        await proactiveManager.dismissSuggestion(user.id, suggestionId);

        return {
            success: true,
            message: 'Suggestion dismissed successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to dismiss suggestion'
        };
    }
}

/**
 * Mark suggestion as acted upon
 */
export async function actOnSuggestionAction(suggestionId: string): Promise<ActionResponse> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const proactiveManager = getProactiveAgentManager();
        await proactiveManager.markSuggestionActedUpon(user.id, suggestionId);

        return {
            success: true,
            message: 'Suggestion marked as acted upon'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to mark suggestion'
        };
    }
}

/**
 * Get cross-hub insights for a specific hub
 */
const getCrossHubInsightsSchema = z.object({
    targetHub: z.string(),
    limit: z.number().min(1).max(50).optional(),
    insightType: z.string().optional(),
    minConfidence: z.number().min(0).max(1).optional()
});

export async function getCrossHubInsightsAction(
    params: z.infer<typeof getCrossHubInsightsSchema>
): Promise<ActionResponse<any[]>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const validatedParams = getCrossHubInsightsSchema.parse(params);
        const crossHubCoordinator = getCrossHubCoordinator();

        const insights = await crossHubCoordinator.getInsightsForHub(
            user.id,
            validatedParams.targetHub,
            {
                limit: validatedParams.limit,
                insightType: validatedParams.insightType as any,
                minConfidence: validatedParams.minConfidence
            }
        );

        return {
            success: true,
            data: insights,
            message: `Retrieved ${insights.length} insights for ${validatedParams.targetHub} hub`
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get cross-hub insights'
        };
    }
}

/**
 * Generate cross-hub insights from data
 */
const generateCrossHubInsightsSchema = z.object({
    sourceHub: z.string(),
    sourceData: z.record(z.any())
});

export async function generateCrossHubInsightsAction(
    input: z.infer<typeof generateCrossHubInsightsSchema>
): Promise<ActionResponse<any[]>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const validatedInput = generateCrossHubInsightsSchema.parse(input);

        const agentProfileRepo = getAgentProfileRepository();
        const agentProfile = await agentProfileRepo.getProfile(user.id);

        if (!agentProfile) {
            return { success: false, error: 'Agent profile required' };
        }

        const crossHubCoordinator = getCrossHubCoordinator();

        const insights = await crossHubCoordinator.generateCrossHubInsights(
            user.id,
            validatedInput.sourceHub,
            validatedInput.sourceData,
            agentProfile
        );

        return {
            success: true,
            data: insights,
            message: `Generated ${insights.length} cross-hub insights`
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate insights'
        };
    }
}

/**
 * Create and execute an orchestration plan
 */
const createOrchestrationPlanSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    strategy: z.enum(['sequential', 'parallel', 'conditional', 'adaptive', 'collaborative']),
    tasks: z.array(z.object({
        name: z.string(),
        description: z.string(),
        hubContext: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        inputs: z.record(z.any()),
        expectedOutputs: z.array(z.string()),
        dependencies: z.array(z.string()),
        conditions: z.array(z.object({
            field: z.string(),
            operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
            value: z.any()
        })).optional(),
        timeout: z.number().optional(),
        metadata: z.record(z.any())
    })),
    estimatedDuration: z.number().optional()
});

export async function createOrchestrationPlanAction(
    planConfig: z.infer<typeof createOrchestrationPlanSchema>
): Promise<ActionResponse<any>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const validatedConfig = createOrchestrationPlanSchema.parse(planConfig);

        const agentProfileRepo = getAgentProfileRepository();
        const agentProfile = await agentProfileRepo.getProfile(user.id);

        if (!agentProfile) {
            return { success: false, error: 'Agent profile required' };
        }

        const orchestrator = getEnhancedOrchestrator();

        const plan = await orchestrator.createOrchestrationPlan(
            user.id,
            agentProfile,
            validatedConfig
        );

        return {
            success: true,
            data: {
                planId: plan.id,
                status: plan.status,
                progress: plan.progress,
                estimatedDuration: plan.estimatedDuration
            },
            message: 'Orchestration plan created and started'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create orchestration plan'
        };
    }
}

/**
 * Get orchestration plan status
 */
export async function getOrchestrationPlanAction(planId: string): Promise<ActionResponse<any>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const orchestrator = getEnhancedOrchestrator();
        const plan = await orchestrator.getPlan(user.id, planId);

        if (!plan) {
            return { success: false, error: 'Plan not found' };
        }

        return {
            success: true,
            data: {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                status: plan.status,
                progress: plan.progress,
                results: plan.results,
                executionLog: plan.executionLog.slice(-10), // Last 10 log entries
                createdAt: plan.createdAt,
                startedAt: plan.startedAt,
                completedAt: plan.completedAt,
                actualDuration: plan.actualDuration
            },
            message: 'Plan retrieved successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get plan'
        };
    }
}

/**
 * Get user's orchestration plans
 */
export async function getUserOrchestrationPlansAction(): Promise<ActionResponse<any[]>> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const orchestrator = getEnhancedOrchestrator();
        const plans = await orchestrator.getUserPlans(user.id);

        const planSummaries = plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            status: plan.status,
            progress: plan.progress,
            createdAt: plan.createdAt,
            completedAt: plan.completedAt,
            actualDuration: plan.actualDuration
        }));

        return {
            success: true,
            data: planSummaries,
            message: `Retrieved ${plans.length} orchestration plans`
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get plans'
        };
    }
}

/**
 * Cancel an orchestration plan
 */
export async function cancelOrchestrationPlanAction(planId: string): Promise<ActionResponse> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        const orchestrator = getEnhancedOrchestrator();
        await orchestrator.cancelPlan(user.id, planId);

        return {
            success: true,
            message: 'Plan cancelled successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel plan'
        };
    }
}