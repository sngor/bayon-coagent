/**
 * Hub Agent Registry
 * 
 * Manages specialized AI agents for each hub with distinct personalities,
 * capabilities, and expertise areas.
 * 
 * Features:
 * - Performance-optimized with caching and indexing
 * - Configurable scoring strategies for agent recommendation
 * - Separated configuration for better maintainability
 */

import { z } from 'zod';
import type { AgentStrand, AgentCapabilities } from '../agent-core';
import { AGENT_CONFIGS } from './agent-configs';
import { AgentCache } from './agent-cache';
import { AgentScorer, WeightedScoringStrategy, type AgentScoringStrategy } from './agent-scoring';

/**
 * Hub-specific agent types
 */
export type HubAgentType =
    | 'studio-creative'
    | 'brand-strategist'
    | 'research-analyst'
    | 'market-intelligence'
    | 'tools-financial'
    | 'library-curator'
    | 'assistant-general'
    | 'dashboard-overview'
    | 'client-relationship'
    | 'event-coordinator';

/**
 * Hub agent configuration
 */
export interface HubAgentConfig {
    id: string;
    name: string;
    hub: string;
    personality: string;
    expertise: string[];
    systemPrompt: string;
    capabilities: AgentCapabilities;
    proactiveFeatures: string[];
}

/**
 * Agent recommendation context
 */
export interface AgentRecommendationContext {
    taskType: string;
    hubContext?: string;
    expertiseRequired?: string[];
    prioritizePerformance?: boolean;
    prioritizeQuality?: boolean;
}

/**
 * Hub Agent Registry
 */
export class HubAgentRegistry {
    private static agents: Map<HubAgentType, HubAgentConfig> = new Map();
    private static cache: AgentCache;
    private static scorer: AgentScorer = new AgentScorer();

    static {
        // Initialize agents from configuration
        for (const [type, config] of Object.entries(AGENT_CONFIGS)) {
            this.agents.set(type as HubAgentType, config);
        }

        // Initialize cache with performance indexes
        this.cache = new AgentCache(this.agents);
    }

    /**
     * Register a new hub agent
     */
    static registerAgent(type: HubAgentType, config: HubAgentConfig): void {
        this.agents.set(type, config);
        // Rebuild cache when agents are modified
        this.cache.rebuildIndexes(this.agents);
    }

    /**
     * Get agent configuration by type
     */
    static getAgent(type: HubAgentType): HubAgentConfig | undefined {
        return this.agents.get(type);
    }

    /**
     * Update agent configuration
     */
    static updateAgent(type: HubAgentType, updates: Partial<HubAgentConfig>): boolean {
        const existing = this.agents.get(type);
        if (!existing) return false;

        const updated = { ...existing, ...updates };
        this.agents.set(type, updated);
        this.cache.rebuildIndexes(this.agents);
        return true;
    }

    /**
     * Remove agent
     */
    static removeAgent(type: HubAgentType): boolean {
        const removed = this.agents.delete(type);
        if (removed) {
            this.cache.rebuildIndexes(this.agents);
        }
        return removed;
    }

    /**
     * Get agent statistics
     */
    static getAgentStats(): {
        totalAgents: number;
        agentsByHub: Record<string, number>;
        averageQualityScore: number;
        averageSpeedScore: number;
        totalExpertiseAreas: number;
    } {
        const agents = Array.from(this.agents.values());
        const agentsByHub: Record<string, number> = {};
        const expertiseSet = new Set<string>();

        let totalQuality = 0;
        let totalSpeed = 0;

        for (const agent of agents) {
            agentsByHub[agent.hub] = (agentsByHub[agent.hub] || 0) + 1;
            totalQuality += agent.capabilities.qualityScore;
            totalSpeed += agent.capabilities.speedScore;
            agent.expertise.forEach(exp => expertiseSet.add(exp));
        }

        return {
            totalAgents: agents.length,
            agentsByHub,
            averageQualityScore: totalQuality / agents.length,
            averageSpeedScore: totalSpeed / agents.length,
            totalExpertiseAreas: expertiseSet.size,
        };
    }

    /**
     * Validate agent configuration
     */
    static validateAgentConfig(config: HubAgentConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.id?.trim()) errors.push('Agent ID is required');
        if (!config.name?.trim()) errors.push('Agent name is required');
        if (!config.hub?.trim()) errors.push('Hub is required');
        if (!config.expertise?.length) errors.push('At least one expertise area is required');
        if (!config.capabilities?.taskTypes?.length) errors.push('At least one task type is required');

        // Validate score ranges
        const { capabilities } = config;
        if (capabilities.qualityScore < 0 || capabilities.qualityScore > 1) {
            errors.push('Quality score must be between 0 and 1');
        }
        if (capabilities.speedScore < 0 || capabilities.speedScore > 1) {
            errors.push('Speed score must be between 0 and 1');
        }
        if (capabilities.reliabilityScore < 0 || capabilities.reliabilityScore > 1) {
            errors.push('Reliability score must be between 0 and 1');
        }
        if (capabilities.maxConcurrentTasks < 1) {
            errors.push('Max concurrent tasks must be at least 1');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Get agent by hub name (O(1) lookup) with fallback
     */
    static getAgentByHub(hubName: string): HubAgentConfig | undefined {
        const agent = this.cache.getAgentByHub(hubName);
        
        // If no specific agent found, try fallback to general assistant
        if (!agent && hubName !== 'assistant') {
            return this.cache.getAgentByHub('assistant');
        }
        
        return agent;
    }

    /**
     * Get all agents
     */
    static getAllAgents(): Map<HubAgentType, HubAgentConfig> {
        return new Map(this.agents);
    }

    /**
     * Get agents by expertise area (O(1) lookup)
     */
    static getAgentsByExpertise(expertise: string): HubAgentConfig[] {
        return this.cache.getAgentsByExpertise(expertise);
    }

    /**
     * Get agents by task type (O(1) lookup)
     */
    static getAgentsByTaskType(taskType: string): HubAgentConfig[] {
        return this.cache.getAgentsByTaskType(taskType);
    }

    /**
     * Set scoring strategy for agent recommendations
     */
    static setScoringStrategy(strategy: AgentScoringStrategy): void {
        this.scorer.setStrategy(strategy);
    }

    /**
     * Get agent recommendations for a task (with caching and improved algorithm)
     */
    static getRecommendedAgent(
        context: AgentRecommendationContext
    ): HubAgentConfig | undefined;
    static getRecommendedAgent(
        taskType: string,
        hubContext?: string,
        expertiseRequired?: string[]
    ): HubAgentConfig | undefined;
    static getRecommendedAgent(
        contextOrTaskType: AgentRecommendationContext | string,
        hubContext?: string,
        expertiseRequired?: string[]
    ): HubAgentConfig | undefined {
        // Handle both function signatures
        const context: AgentRecommendationContext = typeof contextOrTaskType === 'string'
            ? { taskType: contextOrTaskType, hubContext, expertiseRequired }
            : contextOrTaskType;

        // Create cache key for memoization
        const cacheKey = JSON.stringify({
            taskType: context.taskType,
            hubContext: context.hubContext,
            expertiseRequired: context.expertiseRequired?.sort(),
            prioritizePerformance: context.prioritizePerformance,
            prioritizeQuality: context.prioritizeQuality,
        });

        return this.cache.getRecommendation(cacheKey, () => {
            return this.computeRecommendation(context);
        });
    }

    /**
     * Compute agent recommendation using optimized algorithm
     */
    private static computeRecommendation(context: AgentRecommendationContext): HubAgentConfig | undefined {
        let candidates: HubAgentConfig[] = [];

        // Collect candidates from multiple sources
        if (context.hubContext) {
            const hubAgent = this.getAgentByHub(context.hubContext);
            if (hubAgent) candidates.push(hubAgent);
        }

        if (context.expertiseRequired?.length) {
            for (const expertise of context.expertiseRequired) {
                candidates.push(...this.getAgentsByExpertise(expertise));
            }
        }

        // Add task type matches
        candidates.push(...this.getAgentsByTaskType(context.taskType));

        // Remove duplicates
        const uniqueCandidates = Array.from(
            new Map(candidates.map(agent => [agent.id, agent])).values()
        );

        if (uniqueCandidates.length === 0) {
            return this.getAgent('assistant-general');
        }

        // Apply appropriate scoring strategy
        if (context.prioritizePerformance) {
            const { PerformanceScoringStrategy } = require('./agent-scoring');
            this.scorer.setStrategy(new PerformanceScoringStrategy());
        } else if (context.prioritizeQuality) {
            const { QualityScoringStrategy } = require('./agent-scoring');
            this.scorer.setStrategy(new QualityScoringStrategy());
        }

        // Score and return best match
        const scoredCandidates = this.scorer.scoreAgents(uniqueCandidates, context);
        return scoredCandidates[0]?.agent;
    }

    /**
     * Get multiple agent recommendations with scores
     */
    static getAgentRecommendations(
        context: AgentRecommendationContext,
        limit: number = 3
    ): Array<{ agent: HubAgentConfig; score: number }> {
        let candidates: HubAgentConfig[] = [];

        // Collect all potential candidates
        if (context.hubContext) {
            const hubAgent = this.getAgentByHub(context.hubContext);
            if (hubAgent) candidates.push(hubAgent);
        }

        if (context.expertiseRequired?.length) {
            for (const expertise of context.expertiseRequired) {
                candidates.push(...this.getAgentsByExpertise(expertise));
            }
        }

        candidates.push(...this.getAgentsByTaskType(context.taskType));

        // If no specific matches, include all agents
        if (candidates.length === 0) {
            candidates = Array.from(this.agents.values());
        }

        // Remove duplicates
        const uniqueCandidates = Array.from(
            new Map(candidates.map(agent => [agent.id, agent])).values()
        );

        // Score and return top matches
        return this.scorer.scoreAgents(uniqueCandidates, context).slice(0, limit);
    }
}

/**
 * Hub agent selection schema for validation
 */
export const HubAgentSelectionSchema = z.object({
    hubContext: z.string().optional(),
    taskType: z.string(),
    expertiseRequired: z.array(z.string()).optional(),
    preferredAgent: z.enum([
        'studio-creative',
        'brand-strategist',
        'research-analyst',
        'market-intelligence',
        'tools-financial',
        'library-curator',
        'assistant-general'
    ]).optional(),
});

export type HubAgentSelection = z.infer<typeof HubAgentSelectionSchema>;

// Re-export related types and utilities
export { AgentCache } from './agent-cache';
export {
    AgentScorer,
    WeightedScoringStrategy,
    PerformanceScoringStrategy,
    QualityScoringStrategy,
    type AgentScoringStrategy
} from './agent-scoring';
export { AGENT_CONFIGS } from './agent-configs';