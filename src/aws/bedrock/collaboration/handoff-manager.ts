/**
 * Handoff Manager - Manages task handoffs between agent strands
 * 
 * This module handles the identification of appropriate next strands for task continuation,
 * context transfer between strands, and tracking of handoff history for analysis.
 * 
 * Requirements: 1.1, 1.3
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Context transferred during handoff
 */
export interface HandoffContext {
    taskId: string;
    intermediateResults: any;
    sharedContext: Record<string, any>;
    learnedPatterns: Record<string, any>;
    metadata: {
        handoffReason: string;
        confidence: number;
        timestamp: string;
    };
}

/**
 * Record of a handoff for tracking
 */
export interface HandoffRecord {
    id: string;
    fromStrandId: string;
    toStrandId: string;
    taskId: string;
    context: HandoffContext;
    timestamp: string;
    success: boolean;
    error?: string;
}

/**
 * HandoffManager - Coordinates task handoffs between strands
 */
export class HandoffManager {
    private repository = getRepository();

    /**
     * Identifies the next appropriate strand for task continuation
     * 
     * Algorithm:
     * 1. Analyze current result to determine what type of work is needed next
     * 2. Match required capabilities with available strands
     * 3. Select strand with highest capability match and lowest current load
     * 
     * @param currentTask - The task that was just completed
     * @param currentResult - The result from the current strand
     * @param availableStrands - Strands available for handoff
     * @returns The selected strand or null if no suitable strand found
     */
    identifyNextStrand(
        currentTask: WorkerTask,
        currentResult: WorkerResult,
        availableStrands: AgentStrand[]
    ): AgentStrand | null {
        // Determine what type of work is needed next based on result
        const nextWorkType = this.determineNextWorkType(currentTask, currentResult);

        if (!nextWorkType) {
            return null; // No follow-up work needed
        }

        // Filter strands that can handle the next work type
        const capableStrands = availableStrands.filter(strand =>
            this.canHandleWorkType(strand, nextWorkType) &&
            strand.state !== 'error' &&
            strand.state !== 'maintenance'
        );

        if (capableStrands.length === 0) {
            return null;
        }

        // Select best strand based on capability match and load
        return this.selectBestStrand(capableStrands, nextWorkType);
    }

    /**
     * Transfers context and results to the next strand
     * 
     * @param fromStrand - Source strand
     * @param toStrand - Destination strand
     * @param context - Context to transfer
     */
    async executeHandoff(
        fromStrand: AgentStrand,
        toStrand: AgentStrand,
        context: HandoffContext
    ): Promise<void> {
        try {
            // Transfer context to destination strand's working memory
            toStrand.memory.workingMemory[context.taskId] = {
                handoffContext: context,
                receivedAt: new Date().toISOString(),
                fromStrand: fromStrand.id,
            };

            // Transfer relevant learned patterns
            Object.entries(context.learnedPatterns).forEach(([key, value]) => {
                if (!toStrand.memory.learnedPatterns[key]) {
                    toStrand.memory.learnedPatterns[key] = value;
                }
            });

            // Update strand states
            toStrand.lastActiveAt = new Date().toISOString();

            // Record successful handoff
            await this.recordHandoff({
                id: this.generateHandoffId(),
                fromStrandId: fromStrand.id,
                toStrandId: toStrand.id,
                taskId: context.taskId,
                context,
                timestamp: new Date().toISOString(),
                success: true,
            });
        } catch (error) {
            // Record failed handoff
            await this.recordHandoff({
                id: this.generateHandoffId(),
                fromStrandId: fromStrand.id,
                toStrandId: toStrand.id,
                taskId: context.taskId,
                context,
                timestamp: new Date().toISOString(),
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Tracks handoff history for analysis
     * 
     * @param handoff - Handoff record to store
     */
    async recordHandoff(handoff: HandoffRecord): Promise<void> {
        try {
            await this.repository.create(
                `HANDOFF#${handoff.id}`,
                `RECORD#${handoff.timestamp}`,
                'HandoffRecord',
                handoff
            );
        } catch (error) {
            console.error('Failed to record handoff:', error);
            // Don't throw - handoff tracking failure shouldn't break the handoff
        }
    }

    /**
     * Determines what type of work is needed next based on current result
     */
    private determineNextWorkType(
        task: WorkerTask,
        result: WorkerResult
    ): string | null {
        // Check if result indicates follow-up work is needed
        if (result.status === 'error') {
            return null; // Errors don't trigger handoffs
        }

        // Analyze result output for handoff indicators
        const output = result.output;
        if (!output) {
            return null;
        }

        // Check for explicit handoff requests in output
        if (output.requiresFollowUp) {
            return output.nextWorkType || null;
        }

        // Infer next work type based on current task type and result
        switch (task.type) {
            case 'data-analyst':
                // Data analysis might need content generation
                if (output.insights && output.insights.length > 0) {
                    return 'content-generation';
                }
                break;

            case 'content-generator':
                // Content might need quality assurance
                if (output.content) {
                    return 'quality-assurance';
                }
                break;

            case 'market-forecaster':
                // Forecasts might need content generation
                if (output.predictions) {
                    return 'content-generation';
                }
                break;
        }

        return null;
    }

    /**
     * Checks if a strand can handle a specific work type
     */
    private canHandleWorkType(strand: AgentStrand, workType: string): boolean {
        // Check if work type matches strand's task types
        return strand.capabilities.taskTypes.some(taskType =>
            taskType.toLowerCase().includes(workType.toLowerCase()) ||
            workType.toLowerCase().includes(taskType.toLowerCase())
        );
    }

    /**
     * Selects the best strand for the next work
     */
    private selectBestStrand(
        candidates: AgentStrand[],
        workType: string
    ): AgentStrand {
        // Score each candidate
        const scored = candidates.map(strand => ({
            strand,
            score: this.calculateStrandScore(strand, workType),
        }));

        // Sort by score (highest first)
        scored.sort((a, b) => b.score - a.score);

        return scored[0].strand;
    }

    /**
     * Calculates a score for strand suitability
     */
    private calculateStrandScore(strand: AgentStrand, workType: string): number {
        let score = 0;

        // Capability match (40%)
        const capabilityMatch = strand.capabilities.taskTypes.filter(taskType =>
            taskType.toLowerCase().includes(workType.toLowerCase())
        ).length;
        score += capabilityMatch * 0.4;

        // Quality score (30%)
        score += strand.capabilities.qualityScore * 0.3;

        // Load penalty (30%) - prefer less loaded strands
        score += (1 - strand.metrics.currentLoad) * 0.3;

        return score;
    }

    /**
     * Generates a unique handoff ID
     */
    private generateHandoffId(): string {
        return `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let handoffManagerInstance: HandoffManager | null = null;

/**
 * Get the singleton HandoffManager instance
 */
export function getHandoffManager(): HandoffManager {
    if (!handoffManagerInstance) {
        handoffManagerInstance = new HandoffManager();
    }
    return handoffManagerInstance;
}

/**
 * Reset the HandoffManager singleton (useful for testing)
 */
export function resetHandoffManager(): void {
    handoffManagerInstance = null;
}
