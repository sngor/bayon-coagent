/**
 * Strand Specialization Manager
 * 
 * Manages the creation, lifecycle, and routing of specialized agent strands.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import type { WorkerTask } from '../worker-protocol';
import type {
    SpecializationConfig,
    SpecializedStrand,
    SpecializationPerformance,
    SpecializationDecision,
    TaskContext,
    RoutingDecision,
    SpecializationManagerConfig,
    MarketSpecialization,
    AgentSpecificSpecialization,
    ContentTypeSpecialization,
    GeographicSpecialization,
    PerformanceSnapshot,
} from './types';

/**
 * Default configuration for specialization manager
 */
const DEFAULT_CONFIG: SpecializationManagerConfig = {
    minTasksForSpecialization: 20,
    minPerformanceImprovement: 10, // 10% improvement
    maxSpecializationsPerBase: 5,
    minUtilizationRate: 0.1, // 10% utilization
    pruneAfterDays: 30,
    autoDetectSpecializations: true,
};

/**
 * Strand Specialization Manager
 * 
 * Handles creation and management of specialized agent strands based on:
 * - Market focus (luxury, first-time buyers, commercial, etc.)
 * - Agent-specific style and preferences
 * - Content type (blog posts, social media, listings, etc.)
 * - Geographic region (local market knowledge)
 */
export class StrandSpecializationManager {
    private specializedStrands: Map<string, SpecializedStrand> = new Map();
    private baseStrands: Map<string, AgentStrand> = new Map();
    private specializationPerformance: Map<string, SpecializationPerformance> = new Map();
    private config: SpecializationManagerConfig;

    constructor(config?: Partial<SpecializationManagerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Create a specialized strand variant
     * Requirement 3.1, 3.2, 3.3, 3.4
     */
    async createSpecializedStrand(
        baseStrand: AgentStrand,
        specialization: SpecializationConfig
    ): Promise<SpecializedStrand> {
        // Store base strand if not already stored
        if (!this.baseStrands.has(baseStrand.id)) {
            this.baseStrands.set(baseStrand.id, baseStrand);
        }

        // Check if we've reached max specializations for this base
        const existingSpecializations = this.getSpecializationsForBase(baseStrand.id);
        if (existingSpecializations.length >= this.config.maxSpecializationsPerBase) {
            throw new Error(
                `Maximum specializations (${this.config.maxSpecializationsPerBase}) reached for base strand ${baseStrand.id}`
            );
        }

        // Create enhanced capabilities based on specialization
        const enhancedCapabilities = this.enhanceCapabilities(
            baseStrand.capabilities,
            specialization
        );

        // Create specialized memory with domain knowledge
        const specializedMemory = this.createSpecializedMemory(
            baseStrand.memory,
            specialization
        );

        // Generate unique ID for specialized strand
        const specializationId = this.generateSpecializationId(baseStrand.id, specialization);

        const now = new Date().toISOString();

        // Create the specialized strand
        const specializedStrand: SpecializedStrand = {
            id: specializationId,
            type: baseStrand.type,
            capabilities: enhancedCapabilities,
            state: 'idle',
            memory: specializedMemory,
            metrics: this.createInitialMetrics(),
            createdAt: now,
            lastActiveAt: now,
            specialization,
            baseStrandId: baseStrand.id,
            specializationPerformance: {
                specializationId,
                config: specialization,
                performanceHistory: [],
                comparisonToBase: {
                    qualityImprovement: 0,
                    speedChange: 0,
                    satisfactionImprovement: 0,
                },
                utilizationRate: 0,
                lastUsed: now,
                createdAt: now,
            },
        };

        // Store the specialized strand
        this.specializedStrands.set(specializationId, specializedStrand);
        this.specializationPerformance.set(specializationId, specializedStrand.specializationPerformance);

        return specializedStrand;
    }

    /**
     * Determine if specialization would improve performance
     * Requirement 3.5
     */
    shouldSpecialize(
        strandId: string,
        performanceData: PerformanceSnapshot[]
    ): SpecializationDecision {
        // Need minimum tasks to make a decision
        if (performanceData.length < this.config.minTasksForSpecialization) {
            return {
                shouldSpecialize: false,
                reason: `Insufficient data: ${performanceData.length} tasks, need ${this.config.minTasksForSpecialization}`,
                confidence: 0,
            };
        }

        // Analyze performance patterns to detect specialization opportunities
        const patterns = this.analyzePerformancePatterns(performanceData);

        // Check if there's a clear domain where performance is better
        if (patterns.hasSpecializationOpportunity) {
            const expectedBenefit = this.estimateSpecializationBenefit(patterns);

            if (expectedBenefit.qualityImprovement >= this.config.minPerformanceImprovement) {
                return {
                    shouldSpecialize: true,
                    reason: patterns.reason,
                    suggestedConfig: patterns.suggestedConfig,
                    expectedBenefit,
                    confidence: patterns.confidence,
                };
            }
        }

        return {
            shouldSpecialize: false,
            reason: 'No significant performance improvement detected',
            confidence: patterns.confidence,
        };
    }

    /**
     * Get or create appropriate specialist strand for a task
     * Requirement 3.1, 3.2, 3.3, 3.4
     */
    async getSpecialistStrand(
        task: WorkerTask,
        context: TaskContext
    ): Promise<RoutingDecision> {
        // Find all candidate strands (base + specialized)
        const candidates = this.findCandidateStrands(task, context);

        if (candidates.length === 0) {
            throw new Error(`No suitable strands found for task ${task.id}`);
        }

        // Score each candidate
        const scoredCandidates = candidates.map(strand => ({
            strand,
            score: this.calculateStrandScore(strand, task, context),
            reason: this.explainScore(strand, task, context),
        }));

        // Sort by score (highest first)
        scoredCandidates.sort((a, b) => b.score - a.score);

        const selected = scoredCandidates[0];
        const alternatives = scoredCandidates.slice(1, 4); // Top 3 alternatives

        return {
            selectedStrand: selected.strand,
            reason: selected.reason,
            confidence: selected.score,
            alternatives,
        };
    }

    /**
     * Prune unused specialized strands
     * Requirement 3.5
     */
    async pruneUnusedSpecialists(): Promise<string[]> {
        const now = Date.now();
        const pruneThresholdMs = this.config.pruneAfterDays * 24 * 60 * 60 * 1000;
        const prunedIds: string[] = [];

        for (const [id, strand] of this.specializedStrands.entries()) {
            const lastUsedTime = new Date(strand.specializationPerformance.lastUsed).getTime();
            const daysSinceLastUse = (now - lastUsedTime) / (24 * 60 * 60 * 1000);

            // Prune if:
            // 1. Not used in configured days AND
            // 2. Low utilization rate
            if (
                daysSinceLastUse >= this.config.pruneAfterDays &&
                strand.specializationPerformance.utilizationRate < this.config.minUtilizationRate
            ) {
                this.specializedStrands.delete(id);
                this.specializationPerformance.delete(id);
                prunedIds.push(id);
            }
        }

        return prunedIds;
    }

    /**
     * Get all specializations for a base strand
     */
    getSpecializationsForBase(baseStrandId: string): SpecializedStrand[] {
        return Array.from(this.specializedStrands.values()).filter(
            strand => strand.baseStrandId === baseStrandId
        );
    }

    /**
     * Get specialized strand by ID
     */
    getSpecializedStrand(id: string): SpecializedStrand | undefined {
        return this.specializedStrands.get(id);
    }

    /**
     * Get all specialized strands
     */
    getAllSpecializedStrands(): SpecializedStrand[] {
        return Array.from(this.specializedStrands.values());
    }

    /**
     * Update specialization performance after task completion
     */
    updateSpecializationPerformance(
        specializationId: string,
        snapshot: PerformanceSnapshot
    ): void {
        const performance = this.specializationPerformance.get(specializationId);
        const strand = this.specializedStrands.get(specializationId);

        if (!performance || !strand) return;

        // Add to performance history
        performance.performanceHistory.push(snapshot);

        // Keep only last 100 snapshots
        if (performance.performanceHistory.length > 100) {
            performance.performanceHistory = performance.performanceHistory.slice(-100);
        }

        // Update comparison to base strand
        if (strand.baseStrandId) {
            const baseStrand = this.baseStrands.get(strand.baseStrandId);
            if (baseStrand) {
                performance.comparisonToBase = this.compareToBase(
                    performance.performanceHistory,
                    baseStrand.metrics
                );
            }
        }

        // Update utilization rate
        performance.utilizationRate = this.calculateUtilizationRate(specializationId);
        performance.lastUsed = new Date().toISOString();

        // Update the strand's performance reference
        strand.specializationPerformance = performance;
    }

    /**
     * Private helper methods
     */

    private enhanceCapabilities(
        baseCapabilities: AgentCapabilities,
        specialization: SpecializationConfig
    ): AgentCapabilities {
        return {
            ...baseCapabilities,
            expertise: [
                ...baseCapabilities.expertise,
                ...specialization.expertise,
            ],
            // Boost quality score for specialized domain
            qualityScore: Math.min(baseCapabilities.qualityScore * 1.1, 1.0),
            // Slightly reduce speed due to specialization overhead
            speedScore: baseCapabilities.speedScore * 0.95,
        };
    }

    private createSpecializedMemory(
        baseMemory: AgentMemory,
        specialization: SpecializationConfig
    ): AgentMemory {
        return {
            workingMemory: {},
            knowledgeBase: {
                ...baseMemory.knowledgeBase,
                specialization: {
                    type: specialization.type,
                    domain: specialization.domain,
                    expertise: specialization.expertise,
                    trainingData: specialization.trainingData || [],
                },
            },
            recentTasks: [],
            learnedPatterns: {
                ...baseMemory.learnedPatterns,
            },
        };
    }

    private generateSpecializationId(baseStrandId: string, config: SpecializationConfig): string {
        const timestamp = Date.now();
        const hash = this.hashConfig(config);
        return `${baseStrandId}_${config.type}_${hash}_${timestamp}`;
    }

    private hashConfig(config: SpecializationConfig): string {
        const str = `${config.type}_${config.domain}_${config.expertise.join('_')}`;
        return str.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
    }

    private createInitialMetrics(): AgentMetrics {
        return {
            tasksCompleted: 0,
            successRate: 1.0,
            avgExecutionTime: 0,
            currentLoad: 0,
            recentQualityRatings: [],
            lastUpdated: new Date().toISOString(),
        };
    }

    private analyzePerformancePatterns(performanceData: PerformanceSnapshot[]): {
        hasSpecializationOpportunity: boolean;
        reason: string;
        suggestedConfig?: SpecializationConfig;
        confidence: number;
    } {
        // This is a simplified analysis - in production, this would use ML
        const avgQuality = performanceData.reduce((sum, p) => sum + p.avgQualityScore, 0) / performanceData.length;
        const avgSatisfaction = performanceData.reduce((sum, p) => sum + p.userSatisfaction, 0) / performanceData.length;

        // For now, return a basic analysis
        // In production, this would analyze task patterns, user feedback, etc.
        return {
            hasSpecializationOpportunity: false,
            reason: 'Automatic specialization detection not yet implemented',
            confidence: 0.5,
        };
    }

    private estimateSpecializationBenefit(patterns: any): {
        qualityImprovement: number;
        speedImprovement: number;
        satisfactionImprovement: number;
    } {
        // Simplified estimation - in production, use historical data
        return {
            qualityImprovement: 15,
            speedImprovement: -5, // Slight slowdown due to specialization
            satisfactionImprovement: 20,
        };
    }

    private findCandidateStrands(
        task: WorkerTask,
        context: TaskContext
    ): Array<AgentStrand | SpecializedStrand> {
        const candidates: Array<AgentStrand | SpecializedStrand> = [];

        // Add specialized strands that match the context
        for (const strand of this.specializedStrands.values()) {
            if (this.matchesContext(strand, task, context)) {
                candidates.push(strand);
            }
        }

        // Add base strands as fallback
        for (const strand of this.baseStrands.values()) {
            if (strand.type === task.type) {
                candidates.push(strand);
            }
        }

        return candidates;
    }

    private matchesContext(
        strand: SpecializedStrand,
        task: WorkerTask,
        context: TaskContext
    ): boolean {
        const spec = strand.specialization;

        switch (spec.type) {
            case 'market':
                return context.agentProfile?.marketFocus === spec.domain;

            case 'agent':
                return context.agentProfile?.id === spec.domain;

            case 'content-type':
                return context.contentType === spec.domain;

            case 'geographic':
                return context.geographic?.region === spec.domain ||
                    context.geographic?.city === spec.domain;

            default:
                return false;
        }
    }

    private calculateStrandScore(
        strand: AgentStrand | SpecializedStrand,
        task: WorkerTask,
        context: TaskContext
    ): number {
        let score = 0;

        // Base score from capabilities
        score += strand.capabilities.qualityScore * 0.3;
        score += strand.capabilities.speedScore * 0.2;
        score += strand.capabilities.reliabilityScore * 0.2;

        // Performance score
        score += strand.metrics.successRate * 0.2;

        // Load penalty
        score -= strand.metrics.currentLoad * 0.1;

        // Specialization bonus
        if ('specialization' in strand) {
            const specialized = strand as SpecializedStrand;
            if (this.matchesContext(specialized, task, context)) {
                score += 0.2; // 20% bonus for matching specialization
            }
        }

        return Math.max(0, Math.min(1, score));
    }

    private explainScore(
        strand: AgentStrand | SpecializedStrand,
        task: WorkerTask,
        context: TaskContext
    ): string {
        const reasons: string[] = [];

        if ('specialization' in strand) {
            const specialized = strand as SpecializedStrand;
            reasons.push(`Specialized for ${specialized.specialization.type}: ${specialized.specialization.domain}`);
        } else {
            reasons.push('Base strand');
        }

        reasons.push(`Quality: ${(strand.capabilities.qualityScore * 100).toFixed(0)}%`);
        reasons.push(`Success rate: ${(strand.metrics.successRate * 100).toFixed(0)}%`);
        reasons.push(`Load: ${(strand.metrics.currentLoad * 100).toFixed(0)}%`);

        return reasons.join(', ');
    }

    private compareToBase(
        specializationHistory: PerformanceSnapshot[],
        baseMetrics: AgentMetrics
    ): {
        qualityImprovement: number;
        speedChange: number;
        satisfactionImprovement: number;
    } {
        if (specializationHistory.length === 0) {
            return {
                qualityImprovement: 0,
                speedChange: 0,
                satisfactionImprovement: 0,
            };
        }

        // Calculate averages from recent history
        const recentHistory = specializationHistory.slice(-20);
        const avgQuality = recentHistory.reduce((sum, s) => sum + s.avgQualityScore, 0) / recentHistory.length;
        const avgSpeed = recentHistory.reduce((sum, s) => sum + s.avgExecutionTime, 0) / recentHistory.length;
        const avgSatisfaction = recentHistory.reduce((sum, s) => sum + s.userSatisfaction, 0) / recentHistory.length;

        // Compare to base (assuming base metrics represent baseline)
        const qualityImprovement = ((avgQuality - 0.8) / 0.8) * 100; // Assuming 0.8 as baseline
        const speedChange = baseMetrics.avgExecutionTime > 0
            ? ((avgSpeed - baseMetrics.avgExecutionTime) / baseMetrics.avgExecutionTime) * 100
            : 0;
        const satisfactionImprovement = ((avgSatisfaction - 0.75) / 0.75) * 100; // Assuming 0.75 as baseline

        return {
            qualityImprovement,
            speedChange,
            satisfactionImprovement,
        };
    }

    private calculateUtilizationRate(specializationId: string): number {
        const strand = this.specializedStrands.get(specializationId);
        if (!strand) return 0;

        const totalTasks = strand.metrics.tasksCompleted;
        const baseStrand = strand.baseStrandId ? this.baseStrands.get(strand.baseStrandId) : null;
        const baseTasks = baseStrand ? baseStrand.metrics.tasksCompleted : 1;

        // Utilization = specialized tasks / (specialized + base tasks)
        return totalTasks / (totalTasks + baseTasks);
    }
}

/**
 * Singleton instance
 */
let specializationManagerInstance: StrandSpecializationManager | null = null;

/**
 * Get the singleton StrandSpecializationManager instance
 */
export function getSpecializationManager(
    config?: Partial<SpecializationManagerConfig>
): StrandSpecializationManager {
    if (!specializationManagerInstance) {
        specializationManagerInstance = new StrandSpecializationManager(config);
    }
    return specializationManagerInstance;
}

/**
 * Reset the StrandSpecializationManager singleton (useful for testing)
 */
export function resetSpecializationManager(): void {
    specializationManagerInstance = null;
}
