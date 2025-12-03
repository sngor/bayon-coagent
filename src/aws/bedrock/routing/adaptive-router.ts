/**
 * Adaptive Router
 * 
 * Intelligent task routing system that adapts to real-time conditions,
 * routes based on confidence thresholds, manages fallbacks, and logs decisions.
 * Requirements: 10.1, 10.5
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import type {
    RoutingContext,
    RoutingDecision,
    RoutingAction,
    FallbackStrategy,
    LoadMetrics,
    RoutingDecisionLog,
    RoutingAnalytics,
    ConfidenceThresholds,
    AdaptiveRouterConfig,
} from './types';

/**
 * Default configuration for adaptive router
 */
const DEFAULT_CONFIG: AdaptiveRouterConfig = {
    confidenceThresholds: {
        autoExecute: 0.7,
        humanReview: 0.5,
        retry: 0.3,
        abort: 0.1,
    },
    enableLoadBalancing: true,
    enablePriorityQueue: true,
    maxQueueSize: 1000,
    enableDecisionLogging: true,
    logRetentionDays: 30,
    enableFallbacks: true,
    maxFallbackAttempts: 3,
};

/**
 * Adaptive Router
 * 
 * Routes tasks to optimal strands based on:
 * - Confidence scores and thresholds
 * - Real-time performance and load metrics
 * - Priority levels
 * - Fallback strategies
 */
export class AdaptiveRouter {
    private config: AdaptiveRouterConfig;
    private decisionLogs: Map<string, RoutingDecisionLog> = new Map();
    private loadMetrics: Map<string, LoadMetrics> = new Map();
    private fallbackStrategies: Map<string, FallbackStrategy> = new Map();

    constructor(config?: Partial<AdaptiveRouterConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeFallbackStrategies();
    }

    /**
     * Route task to optimal strand
     * Requirement 10.1, 10.5
     */
    async routeTask(
        task: WorkerTask,
        availableStrands: AgentStrand[],
        context: RoutingContext
    ): Promise<RoutingDecision> {
        const startTime = Date.now();

        // Filter available strands
        const suitableStrands = this.filterSuitableStrands(task, availableStrands);

        if (suitableStrands.length === 0) {
            throw new Error(`No suitable strands found for task ${task.id}`);
        }

        // Score each strand
        const scoredStrands = suitableStrands.map(strand => ({
            strand,
            score: this.calculateStrandScore(strand, task, context),
            reason: this.explainScore(strand, task, context),
        }));

        // Sort by score (highest first)
        scoredStrands.sort((a, b) => b.score - a.score);

        const selected = scoredStrands[0];
        const alternatives = scoredStrands.slice(1, 4); // Top 3 alternatives

        // Calculate confidence
        const confidence = this.calculateConfidence(selected.strand, task, context);

        // Determine routing action based on confidence
        const action = this.determineRoutingAction(confidence, context);

        // Estimate cost and time
        const estimatedCost = this.estimateCost(selected.strand, task);
        const estimatedTime = this.estimateExecutionTime(selected.strand, task);

        const decision: RoutingDecision = {
            selectedStrand: selected.strand,
            confidence,
            rationale: this.buildRationale(selected, confidence, action, context),
            alternativeStrands: alternatives,
            estimatedCost,
            estimatedTime,
            action,
            decidedAt: new Date().toISOString(),
        };

        // Log the decision
        if (this.config.enableDecisionLogging) {
            await this.logDecision(decision, task, context);
        }

        const decisionTime = Date.now() - startTime;
        console.log(`[AdaptiveRouter] Routing decision made in ${decisionTime}ms: ${action} (confidence: ${confidence.toFixed(2)})`);

        return decision;
    }

    /**
     * Handle low-confidence routing
     * Requirement 10.1
     */
    async handleLowConfidence(
        task: WorkerTask,
        result: WorkerResult,
        context: RoutingContext
    ): Promise<RoutingAction> {
        const confidence = result.metadata.confidence || 0;
        const threshold = context.confidenceThreshold || this.config.confidenceThresholds.humanReview;

        // Check if confidence is below threshold
        if (confidence < threshold) {
            console.log(`[AdaptiveRouter] Low confidence detected: ${confidence.toFixed(2)} < ${threshold.toFixed(2)}`);

            // Determine action based on confidence level
            if (confidence < this.config.confidenceThresholds.abort) {
                return 'abort';
            } else if (confidence < this.config.confidenceThresholds.retry) {
                return 'retry';
            } else if (confidence < this.config.confidenceThresholds.humanReview) {
                if (context.humanReviewAvailable) {
                    return 'human-review';
                } else {
                    return 'fallback';
                }
            }
        }

        return 'execute';
    }

    /**
     * Execute fallback strategy
     * Requirement 10.2
     */
    async executeFallback(
        failedStrand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext
    ): Promise<FallbackStrategy | null> {
        const retryCount = context.retryCount || 0;

        if (retryCount >= this.config.maxFallbackAttempts) {
            console.log(`[AdaptiveRouter] Max fallback attempts reached for task ${task.id}`);
            return null;
        }

        // Try to find a fallback strategy
        const fallbackKey = `${failedStrand.type}_fallback`;
        let fallback = this.fallbackStrategies.get(fallbackKey);

        if (!fallback) {
            // Create a default fallback strategy
            fallback = this.createDefaultFallback(failedStrand, task);
        }

        console.log(`[AdaptiveRouter] Executing fallback strategy: ${fallback.name}`);

        return fallback;
    }

    /**
     * Log routing decision
     * Requirement 10.5
     */
    async logDecision(
        decision: RoutingDecision,
        task: WorkerTask,
        context: RoutingContext
    ): Promise<void> {
        const logEntry: RoutingDecisionLog = {
            id: this.generateLogId(),
            taskId: task.id,
            userId: context.userId,
            decision,
            context,
            timestamp: new Date().toISOString(),
        };

        this.decisionLogs.set(logEntry.id, logEntry);

        // In production, this would persist to DynamoDB
        // await this.persistDecisionLog(logEntry);

        // Clean up old logs
        this.cleanupOldLogs();
    }

    /**
     * Update decision log with outcome
     */
    async updateDecisionOutcome(
        taskId: string,
        outcome: {
            success: boolean;
            executionTime: number;
            actualCost: number;
            confidence: number;
        }
    ): Promise<void> {
        // Find the log entry for this task
        const logEntry = Array.from(this.decisionLogs.values()).find(
            log => log.taskId === taskId
        );

        if (logEntry) {
            logEntry.outcome = outcome;
            // In production, update in DynamoDB
            // await this.updateDecisionLogInDB(logEntry);
        }
    }

    /**
     * Get routing analytics
     */
    async getAnalytics(
        startDate: string,
        endDate: string
    ): Promise<RoutingAnalytics> {
        const logs = Array.from(this.decisionLogs.values()).filter(
            log => log.timestamp >= startDate && log.timestamp <= endDate
        );

        const totalDecisions = logs.length;

        // Count by action
        const byAction: Record<RoutingAction, number> = {
            'execute': 0,
            'human-review': 0,
            'retry': 0,
            'fallback': 0,
            'abort': 0,
        };

        let totalConfidence = 0;
        let totalDecisionTime = 0;
        let costAccuracySum = 0;
        let timeAccuracySum = 0;
        let confidenceAccuracySum = 0;
        let accuracyCount = 0;

        logs.forEach(log => {
            byAction[log.decision.action]++;
            totalConfidence += log.decision.confidence;

            if (log.outcome) {
                // Calculate accuracy metrics
                const costAccuracy = 1 - Math.abs(log.decision.estimatedCost - log.outcome.actualCost) / log.outcome.actualCost;
                const timeAccuracy = 1 - Math.abs(log.decision.estimatedTime - log.outcome.executionTime) / log.outcome.executionTime;
                const confidenceAccuracy = 1 - Math.abs(log.decision.confidence - log.outcome.confidence);

                costAccuracySum += Math.max(0, costAccuracy);
                timeAccuracySum += Math.max(0, timeAccuracy);
                confidenceAccuracySum += Math.max(0, confidenceAccuracy);
                accuracyCount++;
            }
        });

        const avgConfidence = totalDecisions > 0 ? totalConfidence / totalDecisions : 0;
        const humanReviewRate = totalDecisions > 0 ? byAction['human-review'] / totalDecisions : 0;
        const fallbackRate = totalDecisions > 0 ? byAction['fallback'] / totalDecisions : 0;
        const retryRate = totalDecisions > 0 ? byAction['retry'] / totalDecisions : 0;

        return {
            totalDecisions,
            byAction,
            avgConfidence,
            humanReviewRate,
            fallbackRate,
            retryRate,
            avgDecisionTime: totalDecisionTime / Math.max(totalDecisions, 1),
            routingAccuracy: {
                costAccuracy: accuracyCount > 0 ? costAccuracySum / accuracyCount : 0,
                timeAccuracy: accuracyCount > 0 ? timeAccuracySum / accuracyCount : 0,
                confidenceAccuracy: accuracyCount > 0 ? confidenceAccuracySum / accuracyCount : 0,
            },
            period: {
                start: startDate,
                end: endDate,
            },
        };
    }

    /**
     * Update load metrics for a strand
     */
    updateLoadMetrics(strandId: string, metrics: Partial<LoadMetrics>): void {
        const existing = this.loadMetrics.get(strandId) || {
            strandId,
            currentLoad: 0,
            avgResponseTime: 0,
            successRate: 1.0,
            queueDepth: 0,
            lastUpdated: new Date().toISOString(),
        };

        this.loadMetrics.set(strandId, {
            ...existing,
            ...metrics,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Get load metrics for a strand
     */
    getLoadMetrics(strandId: string): LoadMetrics | undefined {
        return this.loadMetrics.get(strandId);
    }

    /**
     * Private helper methods
     */

    private filterSuitableStrands(
        task: WorkerTask,
        strands: AgentStrand[]
    ): AgentStrand[] {
        return strands.filter(strand => {
            // Check type match
            if (strand.type !== task.type) return false;

            // Check state
            if (strand.state === 'error' || strand.state === 'maintenance') return false;

            // Check load
            if (strand.metrics.currentLoad >= 1.0) return false;

            return true;
        });
    }

    private calculateStrandScore(
        strand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext
    ): number {
        let score = 0;

        // Base capability scores (40%)
        score += strand.capabilities.qualityScore * 0.15;
        score += strand.capabilities.speedScore * 0.15;
        score += strand.capabilities.reliabilityScore * 0.10;

        // Performance metrics (30%)
        score += strand.metrics.successRate * 0.20;
        score += (1 - strand.metrics.currentLoad) * 0.10; // Prefer less loaded strands

        // Load balancing (20%)
        if (this.config.enableLoadBalancing) {
            const loadMetrics = this.loadMetrics.get(strand.id);
            if (loadMetrics) {
                score += (1 - loadMetrics.currentLoad) * 0.10;
                score += (loadMetrics.successRate) * 0.10;
            }
        }

        // Priority adjustment (10%)
        if (context.priority === 'urgent') {
            score += strand.capabilities.speedScore * 0.10;
        } else if (context.priority === 'high') {
            score += strand.capabilities.qualityScore * 0.10;
        }

        return Math.max(0, Math.min(1, score));
    }

    private explainScore(
        strand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext
    ): string {
        const reasons: string[] = [];

        reasons.push(`Quality: ${(strand.capabilities.qualityScore * 100).toFixed(0)}%`);
        reasons.push(`Speed: ${(strand.capabilities.speedScore * 100).toFixed(0)}%`);
        reasons.push(`Success rate: ${(strand.metrics.successRate * 100).toFixed(0)}%`);
        reasons.push(`Load: ${(strand.metrics.currentLoad * 100).toFixed(0)}%`);

        if (context.priority === 'urgent' || context.priority === 'high') {
            reasons.push(`Priority: ${context.priority}`);
        }

        return reasons.join(', ');
    }

    private calculateConfidence(
        strand: AgentStrand,
        task: WorkerTask,
        context: RoutingContext
    ): number {
        let confidence = 0;

        // Base confidence from strand capabilities
        confidence += strand.capabilities.qualityScore * 0.3;
        confidence += strand.capabilities.reliabilityScore * 0.3;

        // Historical performance
        confidence += strand.metrics.successRate * 0.3;

        // Load factor (lower load = higher confidence)
        confidence += (1 - strand.metrics.currentLoad) * 0.1;

        return Math.max(0, Math.min(1, confidence));
    }

    private determineRoutingAction(
        confidence: number,
        context: RoutingContext
    ): RoutingAction {
        const threshold = context.confidenceThreshold || this.config.confidenceThresholds.autoExecute;

        if (confidence >= threshold) {
            return 'execute';
        } else if (confidence >= this.config.confidenceThresholds.humanReview) {
            if (context.humanReviewAvailable) {
                return 'human-review';
            } else {
                return 'execute'; // Execute anyway if no human review available
            }
        } else if (confidence >= this.config.confidenceThresholds.retry) {
            return 'retry';
        } else if (confidence >= this.config.confidenceThresholds.abort) {
            return 'fallback';
        } else {
            return 'abort';
        }
    }

    private buildRationale(
        selected: { strand: AgentStrand; score: number; reason: string },
        confidence: number,
        action: RoutingAction,
        context: RoutingContext
    ): string {
        const parts: string[] = [];

        parts.push(`Selected ${selected.strand.type} strand (score: ${selected.score.toFixed(2)})`);
        parts.push(`Confidence: ${confidence.toFixed(2)}`);
        parts.push(`Action: ${action}`);
        parts.push(`Reason: ${selected.reason}`);

        if (context.priority !== 'normal') {
            parts.push(`Priority: ${context.priority}`);
        }

        return parts.join(' | ');
    }

    private estimateCost(strand: AgentStrand, task: WorkerTask): number {
        // Simplified cost estimation
        // In production, this would use actual pricing models
        const baseTokens = 1000; // Estimated tokens
        const costPerToken = 0.00003; // $0.03 per 1K tokens (Claude 3.5 Sonnet)
        return baseTokens * costPerToken;
    }

    private estimateExecutionTime(strand: AgentStrand, task: WorkerTask): number {
        // Use strand's average execution time as baseline
        const baseTime = strand.metrics.avgExecutionTime || 5000;

        // Adjust based on current load
        const loadFactor = 1 + (strand.metrics.currentLoad * 0.5);

        return baseTime * loadFactor;
    }

    private initializeFallbackStrategies(): void {
        // Initialize default fallback strategies for each strand type
        const strandTypes = ['data-analyst', 'content-generator', 'market-forecaster', 'knowledge-retriever'];

        strandTypes.forEach(type => {
            this.fallbackStrategies.set(`${type}_fallback`, {
                id: `${type}_fallback`,
                name: `${type} fallback strategy`,
                retryWithBackoff: {
                    initialDelayMs: 1000,
                    maxDelayMs: 10000,
                    multiplier: 2,
                },
                simplifyModel: true,
            });
        });
    }

    private createDefaultFallback(
        failedStrand: AgentStrand,
        task: WorkerTask
    ): FallbackStrategy {
        return {
            id: `fallback_${Date.now()}`,
            name: 'Default fallback strategy',
            retryWithBackoff: {
                initialDelayMs: 1000,
                maxDelayMs: 5000,
                multiplier: 2,
            },
            simplifyModel: true,
        };
    }

    private generateLogId(): string {
        return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private cleanupOldLogs(): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);
        const cutoffTimestamp = cutoffDate.toISOString();

        for (const [id, log] of this.decisionLogs.entries()) {
            if (log.timestamp < cutoffTimestamp) {
                this.decisionLogs.delete(id);
            }
        }
    }
}

/**
 * Singleton instance
 */
let adaptiveRouterInstance: AdaptiveRouter | null = null;

/**
 * Get the singleton AdaptiveRouter instance
 */
export function getAdaptiveRouter(
    config?: Partial<AdaptiveRouterConfig>
): AdaptiveRouter {
    if (!adaptiveRouterInstance) {
        adaptiveRouterInstance = new AdaptiveRouter(config);
    }
    return adaptiveRouterInstance;
}

/**
 * Reset the AdaptiveRouter singleton (useful for testing)
 */
export function resetAdaptiveRouter(): void {
    adaptiveRouterInstance = null;
}
