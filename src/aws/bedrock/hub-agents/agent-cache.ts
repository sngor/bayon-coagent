/**
 * Agent Registry Cache
 * 
 * Provides caching and indexed lookups for better performance.
 */

import type { HubAgentConfig, HubAgentType } from './hub-agent-registry';

/**
 * Cache for agent lookups with indexed access
 */
export class AgentCache {
    private hubIndex = new Map<string, HubAgentConfig>();
    private expertiseIndex = new Map<string, HubAgentConfig[]>();
    private taskTypeIndex = new Map<string, HubAgentConfig[]>();
    private recommendationCache = new Map<string, HubAgentConfig>();

    constructor(agents: Map<HubAgentType, HubAgentConfig>) {
        this.buildIndexes(agents);
    }

    /**
     * Build performance indexes
     */
    private buildIndexes(agents: Map<HubAgentType, HubAgentConfig>): void {
        // Clear existing indexes
        this.hubIndex.clear();
        this.expertiseIndex.clear();
        this.taskTypeIndex.clear();

        for (const agent of agents.values()) {
            // Hub index
            this.hubIndex.set(agent.hub, agent);

            // Expertise index
            for (const expertise of agent.expertise) {
                if (!this.expertiseIndex.has(expertise)) {
                    this.expertiseIndex.set(expertise, []);
                }
                this.expertiseIndex.get(expertise)!.push(agent);
            }

            // Task type index
            for (const taskType of agent.capabilities.taskTypes) {
                if (!this.taskTypeIndex.has(taskType)) {
                    this.taskTypeIndex.set(taskType, []);
                }
                this.taskTypeIndex.get(taskType)!.push(agent);
            }
        }
    }

    /**
     * Get agent by hub (O(1) lookup)
     */
    getAgentByHub(hubName: string): HubAgentConfig | undefined {
        return this.hubIndex.get(hubName);
    }

    /**
     * Get agents by expertise (O(1) lookup)
     */
    getAgentsByExpertise(expertise: string): HubAgentConfig[] {
        return this.expertiseIndex.get(expertise) || [];
    }

    /**
     * Get agents by task type (O(1) lookup)
     */
    getAgentsByTaskType(taskType: string): HubAgentConfig[] {
        return this.taskTypeIndex.get(taskType) || [];
    }

    /**
     * Get cached recommendation or compute and cache
     */
    getRecommendation(
        cacheKey: string,
        computeFn: () => HubAgentConfig | undefined
    ): HubAgentConfig | undefined {
        if (this.recommendationCache.has(cacheKey)) {
            return this.recommendationCache.get(cacheKey);
        }

        const result = computeFn();
        if (result) {
            // Cache with TTL-like behavior (simple LRU)
            if (this.recommendationCache.size > 100) {
                const firstKey = this.recommendationCache.keys().next().value;
                this.recommendationCache.delete(firstKey);
            }
            this.recommendationCache.set(cacheKey, result);
        }

        return result;
    }

    /**
     * Clear recommendation cache
     */
    clearRecommendationCache(): void {
        this.recommendationCache.clear();
    }

    /**
     * Rebuild indexes (call when agents are updated)
     */
    rebuildIndexes(agents: Map<HubAgentType, HubAgentConfig>): void {
        this.buildIndexes(agents);
        this.clearRecommendationCache();
    }
}