/**
 * Agent Scoring Strategies
 * 
 * Implements different scoring algorithms for agent recommendation.
 */

import type { HubAgentConfig } from './hub-agent-registry';

export interface AgentScoringStrategy {
    calculateScore(
        agent: HubAgentConfig,
        context: {
            taskType: string;
            hubContext?: string;
            expertiseRequired?: string[];
        }
    ): number;
}

/**
 * Default scoring strategy with weighted criteria
 */
export class WeightedScoringStrategy implements AgentScoringStrategy {
    private readonly weights = {
        hubMatch: 10,
        expertiseMatch: 3,
        taskTypeMatch: 5,
        qualityBonus: 2,
        reliabilityBonus: 2,
    } as const;

    calculateScore(
        agent: HubAgentConfig,
        context: {
            taskType: string;
            hubContext?: string;
            expertiseRequired?: string[];
        }
    ): number {
        let score = 0;

        // Hub context match (highest priority)
        if (context.hubContext && agent.hub === context.hubContext) {
            score += this.weights.hubMatch;
        }

        // Expertise match
        if (context.expertiseRequired) {
            const matchingExpertise = context.expertiseRequired.filter(exp =>
                agent.expertise.includes(exp)
            ).length;
            score += matchingExpertise * this.weights.expertiseMatch;
        }

        // Task type match
        if (agent.capabilities.taskTypes.includes(context.taskType)) {
            score += this.weights.taskTypeMatch;
        }

        // Quality and reliability bonus
        score += agent.capabilities.qualityScore * this.weights.qualityBonus;
        score += agent.capabilities.reliabilityScore * this.weights.reliabilityBonus;

        return score;
    }
}

/**
 * Performance-focused scoring strategy
 */
export class PerformanceScoringStrategy implements AgentScoringStrategy {
    calculateScore(
        agent: HubAgentConfig,
        context: {
            taskType: string;
            hubContext?: string;
            expertiseRequired?: string[];
        }
    ): number {
        let score = 0;

        // Prioritize speed and concurrent task capacity
        score += agent.capabilities.speedScore * 5;
        score += agent.capabilities.maxConcurrentTasks * 2;

        // Still consider hub match but with lower weight
        if (context.hubContext && agent.hub === context.hubContext) {
            score += 5;
        }

        // Task type match
        if (agent.capabilities.taskTypes.includes(context.taskType)) {
            score += 3;
        }

        return score;
    }
}

/**
 * Quality-focused scoring strategy
 */
export class QualityScoringStrategy implements AgentScoringStrategy {
    calculateScore(
        agent: HubAgentConfig,
        context: {
            taskType: string;
            hubContext?: string;
            expertiseRequired?: string[];
        }
    ): number {
        let score = 0;

        // Prioritize quality and reliability
        score += agent.capabilities.qualityScore * 10;
        score += agent.capabilities.reliabilityScore * 8;

        // Hub match
        if (context.hubContext && agent.hub === context.hubContext) {
            score += 6;
        }

        // Expertise depth
        if (context.expertiseRequired) {
            const matchingExpertise = context.expertiseRequired.filter(exp =>
                agent.expertise.includes(exp)
            ).length;
            score += matchingExpertise * 4;
        }

        return score;
    }
}

/**
 * Agent scorer with configurable strategy
 */
export class AgentScorer {
    constructor(private strategy: AgentScoringStrategy = new WeightedScoringStrategy()) { }

    setStrategy(strategy: AgentScoringStrategy): void {
        this.strategy = strategy;
    }

    scoreAgents(
        agents: HubAgentConfig[],
        context: {
            taskType: string;
            hubContext?: string;
            expertiseRequired?: string[];
        }
    ): Array<{ agent: HubAgentConfig; score: number }> {
        return agents
            .map(agent => ({
                agent,
                score: this.strategy.calculateScore(agent, context)
            }))
            .sort((a, b) => b.score - a.score);
    }
}