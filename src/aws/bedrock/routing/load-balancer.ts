/**
 * Load Balancer
 * 
 * Intelligent load balancing system that distributes tasks across strands
 * based on real-time performance monitoring and dynamic strand selection.
 * Requirement 10.3
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask } from '../worker-protocol';
import type { LoadMetrics, RoutingContext } from './types';

/**
 * Load balancing strategy
 */
export type LoadBalancingStrategy =
    | 'least-loaded'        // Route to strand with lowest current load
    | 'weighted-round-robin' // Round-robin with performance weights
    | 'response-time'       // Route to strand with best response time
    | 'adaptive'            // Adaptive strategy based on multiple factors
    | 'power-of-two';       // Power of two choices algorithm

/**
 * Load balancing configuration
 */
export interface LoadBalancerConfig {
    /** Load balancing strategy */
    strategy: LoadBalancingStrategy;

    /** Enable real-time monitoring */
    enableMonitoring: boolean;

    /** Monitoring interval in ms */
    monitoringIntervalMs: number;

    /** Load threshold for overload detection (0-1) */
    overloadThreshold: number;

    /** Enable automatic rebalancing */
    enableRebalancing: boolean;

    /** Rebalancing interval in ms */
    rebalancingIntervalMs: number;

    /** Maximum load per strand (0-1) */
    maxLoadPerStrand: number;

    /** Enable health checks */
    enableHealthChecks: boolean;

    /** Health check interval in ms */
    healthCheckIntervalMs: number;
}

/**
 * Strand health status
 */
export interface StrandHealth {
    /** Strand ID */
    strandId: string;

    /** Health status */
    status: 'healthy' | 'degraded' | 'unhealthy';

    /** Health score (0-1) */
    healthScore: number;

    /** Last health check timestamp */
    lastChecked: string;

    /** Issues detected */
    issues: string[];
}

/**
 * Load distribution metrics
 */
export interface LoadDistribution {
    /** Total active strands */
    totalStrands: number;

    /** Average load across all strands */
    avgLoad: number;

    /** Load standard deviation */
    loadStdDev: number;

    /** Load balance score (0-1, higher is better) */
    balanceScore: number;

    /** Overloaded strands */
    overloadedStrands: string[];

    /** Underutilized strands */
    underutilizedStrands: string[];

    /** Timestamp */
    timestamp: string;
}

/**
 * Load Balancer
 * 
 * Distributes tasks across strands based on real-time load and performance metrics.
 */
export class LoadBalancer {
    private config: LoadBalancerConfig;
    private loadMetrics: Map<string, LoadMetrics> = new Map();
    private strandHealth: Map<string, StrandHealth> = new Map();
    private roundRobinIndex: number = 0;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private rebalancingInterval: NodeJS.Timeout | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor(config?: Partial<LoadBalancerConfig>) {
        this.config = {
            strategy: 'adaptive',
            enableMonitoring: true,
            monitoringIntervalMs: 5000,
            overloadThreshold: 0.8,
            enableRebalancing: true,
            rebalancingIntervalMs: 30000,
            maxLoadPerStrand: 0.9,
            enableHealthChecks: true,
            healthCheckIntervalMs: 10000,
            ...config,
        };

        this.startMonitoring();
    }

    /**
     * Select optimal strand for task based on load
     * Requirement 10.3
     */
    selectStrand(
        task: WorkerTask,
        availableStrands: AgentStrand[],
        context: RoutingContext
    ): AgentStrand {
        // Filter out unhealthy strands
        const healthyStrands = this.filterHealthyStrands(availableStrands);

        if (healthyStrands.length === 0) {
            throw new Error('No healthy strands available');
        }

        // Filter out overloaded strands
        const nonOverloadedStrands = healthyStrands.filter(strand => {
            const metrics = this.loadMetrics.get(strand.id);
            return !metrics || metrics.currentLoad < this.config.overloadThreshold;
        });

        // If all strands are overloaded, use all healthy strands
        const candidateStrands = nonOverloadedStrands.length > 0
            ? nonOverloadedStrands
            : healthyStrands;

        // Apply load balancing strategy
        switch (this.config.strategy) {
            case 'least-loaded':
                return this.selectLeastLoaded(candidateStrands);

            case 'weighted-round-robin':
                return this.selectWeightedRoundRobin(candidateStrands);

            case 'response-time':
                return this.selectByResponseTime(candidateStrands);

            case 'power-of-two':
                return this.selectPowerOfTwo(candidateStrands);

            case 'adaptive':
            default:
                return this.selectAdaptive(candidateStrands, task, context);
        }
    }

    /**
     * Update load metrics for a strand
     * Requirement 10.3
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

        // Update health status based on metrics
        this.updateHealthStatus(strandId, { ...existing, ...metrics });
    }

    /**
     * Get load metrics for a strand
     */
    getLoadMetrics(strandId: string): LoadMetrics | undefined {
        return this.loadMetrics.get(strandId);
    }

    /**
     * Get all load metrics
     */
    getAllLoadMetrics(): Map<string, LoadMetrics> {
        return new Map(this.loadMetrics);
    }

    /**
     * Get load distribution across all strands
     * Requirement 10.3
     */
    getLoadDistribution(): LoadDistribution {
        const metrics = Array.from(this.loadMetrics.values());

        if (metrics.length === 0) {
            return {
                totalStrands: 0,
                avgLoad: 0,
                loadStdDev: 0,
                balanceScore: 1.0,
                overloadedStrands: [],
                underutilizedStrands: [],
                timestamp: new Date().toISOString(),
            };
        }

        // Calculate average load
        const totalLoad = metrics.reduce((sum, m) => sum + m.currentLoad, 0);
        const avgLoad = totalLoad / metrics.length;

        // Calculate standard deviation
        const variance = metrics.reduce(
            (sum, m) => sum + Math.pow(m.currentLoad - avgLoad, 2),
            0
        ) / metrics.length;
        const loadStdDev = Math.sqrt(variance);

        // Calculate balance score (lower std dev = better balance)
        const balanceScore = Math.max(0, 1 - loadStdDev);

        // Identify overloaded and underutilized strands
        const overloadedStrands = metrics
            .filter(m => m.currentLoad > this.config.overloadThreshold)
            .map(m => m.strandId);

        const underutilizedStrands = metrics
            .filter(m => m.currentLoad < 0.3 && avgLoad > 0.5)
            .map(m => m.strandId);

        return {
            totalStrands: metrics.length,
            avgLoad,
            loadStdDev,
            balanceScore,
            overloadedStrands,
            underutilizedStrands,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get health status for a strand
     */
    getHealthStatus(strandId: string): StrandHealth | undefined {
        return this.strandHealth.get(strandId);
    }

    /**
     * Get all health statuses
     */
    getAllHealthStatuses(): Map<string, StrandHealth> {
        return new Map(this.strandHealth);
    }

    /**
     * Perform health check on a strand
     */
    async performHealthCheck(strand: AgentStrand): Promise<StrandHealth> {
        const metrics = this.loadMetrics.get(strand.id);
        const issues: string[] = [];
        let healthScore = 1.0;

        // Check load
        if (metrics && metrics.currentLoad > this.config.overloadThreshold) {
            issues.push(`High load: ${(metrics.currentLoad * 100).toFixed(0)}%`);
            healthScore -= 0.3;
        }

        // Check success rate
        if (metrics && metrics.successRate < 0.8) {
            issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(0)}%`);
            healthScore -= 0.3;
        }

        // Check response time
        if (metrics && metrics.avgResponseTime > 10000) {
            issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
            healthScore -= 0.2;
        }

        // Check queue depth
        if (metrics && metrics.queueDepth > 100) {
            issues.push(`Large queue: ${metrics.queueDepth} tasks`);
            healthScore -= 0.2;
        }

        // Determine status
        let status: 'healthy' | 'degraded' | 'unhealthy';
        if (healthScore >= 0.7) {
            status = 'healthy';
        } else if (healthScore >= 0.4) {
            status = 'degraded';
        } else {
            status = 'unhealthy';
        }

        const health: StrandHealth = {
            strandId: strand.id,
            status,
            healthScore: Math.max(0, healthScore),
            lastChecked: new Date().toISOString(),
            issues,
        };

        this.strandHealth.set(strand.id, health);

        return health;
    }

    /**
     * Start monitoring and health checks
     */
    private startMonitoring(): void {
        if (this.config.enableMonitoring && !this.monitoringInterval) {
            this.monitoringInterval = setInterval(() => {
                this.monitorLoadDistribution();
            }, this.config.monitoringIntervalMs);
        }

        if (this.config.enableHealthChecks && !this.healthCheckInterval) {
            this.healthCheckInterval = setInterval(() => {
                this.performHealthChecks();
            }, this.config.healthCheckIntervalMs);
        }

        if (this.config.enableRebalancing && !this.rebalancingInterval) {
            this.rebalancingInterval = setInterval(() => {
                this.rebalanceLoad();
            }, this.config.rebalancingIntervalMs);
        }
    }

    /**
     * Stop monitoring and health checks
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        if (this.rebalancingInterval) {
            clearInterval(this.rebalancingInterval);
            this.rebalancingInterval = null;
        }
    }

    /**
     * Private helper methods
     */

    private filterHealthyStrands(strands: AgentStrand[]): AgentStrand[] {
        return strands.filter(strand => {
            const health = this.strandHealth.get(strand.id);
            return !health || health.status !== 'unhealthy';
        });
    }

    private selectLeastLoaded(strands: AgentStrand[]): AgentStrand {
        return strands.sort((a, b) => {
            const aLoad = this.loadMetrics.get(a.id)?.currentLoad || 0;
            const bLoad = this.loadMetrics.get(b.id)?.currentLoad || 0;
            return aLoad - bLoad;
        })[0];
    }

    private selectWeightedRoundRobin(strands: AgentStrand[]): AgentStrand {
        // Calculate weights based on inverse load
        const weights = strands.map(strand => {
            const load = this.loadMetrics.get(strand.id)?.currentLoad || 0;
            return Math.max(0.1, 1 - load); // Minimum weight of 0.1
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // Select based on weighted probability
        let random = Math.random() * totalWeight;
        for (let i = 0; i < strands.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return strands[i];
            }
        }

        return strands[strands.length - 1];
    }

    private selectByResponseTime(strands: AgentStrand[]): AgentStrand {
        return strands.sort((a, b) => {
            const aTime = this.loadMetrics.get(a.id)?.avgResponseTime || Infinity;
            const bTime = this.loadMetrics.get(b.id)?.avgResponseTime || Infinity;
            return aTime - bTime;
        })[0];
    }

    private selectPowerOfTwo(strands: AgentStrand[]): AgentStrand {
        // Power of two choices: randomly select two strands and pick the better one
        if (strands.length === 1) {
            return strands[0];
        }

        const idx1 = Math.floor(Math.random() * strands.length);
        let idx2 = Math.floor(Math.random() * strands.length);
        while (idx2 === idx1 && strands.length > 1) {
            idx2 = Math.floor(Math.random() * strands.length);
        }

        const strand1 = strands[idx1];
        const strand2 = strands[idx2];

        const load1 = this.loadMetrics.get(strand1.id)?.currentLoad || 0;
        const load2 = this.loadMetrics.get(strand2.id)?.currentLoad || 0;

        return load1 <= load2 ? strand1 : strand2;
    }

    private selectAdaptive(
        strands: AgentStrand[],
        task: WorkerTask,
        context: RoutingContext
    ): AgentStrand {
        // Adaptive strategy combines multiple factors
        const scored = strands.map(strand => {
            const metrics = this.loadMetrics.get(strand.id);
            const health = this.strandHealth.get(strand.id);

            let score = 0;

            // Load factor (40%) - prefer less loaded strands
            const load = metrics?.currentLoad || 0;
            score += (1 - load) * 0.4;

            // Performance factor (30%) - prefer faster strands
            const avgTime = metrics?.avgResponseTime || 5000;
            const normalizedTime = Math.max(0, 1 - (avgTime / 10000));
            score += normalizedTime * 0.3;

            // Success rate factor (20%)
            const successRate = metrics?.successRate || 1.0;
            score += successRate * 0.2;

            // Health factor (10%)
            const healthScore = health?.healthScore || 1.0;
            score += healthScore * 0.1;

            // Priority adjustment
            if (context.priority === 'urgent') {
                // For urgent tasks, prioritize speed over load
                score += normalizedTime * 0.2;
            }

            return { strand, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].strand;
    }

    private updateHealthStatus(strandId: string, metrics: LoadMetrics): void {
        const issues: string[] = [];
        let healthScore = 1.0;

        // Check load
        if (metrics.currentLoad > this.config.overloadThreshold) {
            issues.push(`High load: ${(metrics.currentLoad * 100).toFixed(0)}%`);
            healthScore -= 0.3;
        }

        // Check success rate
        if (metrics.successRate < 0.8) {
            issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(0)}%`);
            healthScore -= 0.3;
        }

        // Check response time
        if (metrics.avgResponseTime > 10000) {
            issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
            healthScore -= 0.2;
        }

        // Check queue depth
        if (metrics.queueDepth > 100) {
            issues.push(`Large queue: ${metrics.queueDepth} tasks`);
            healthScore -= 0.2;
        }

        // Determine status
        let status: 'healthy' | 'degraded' | 'unhealthy';
        if (healthScore >= 0.7) {
            status = 'healthy';
        } else if (healthScore >= 0.4) {
            status = 'degraded';
        } else {
            status = 'unhealthy';
        }

        this.strandHealth.set(strandId, {
            strandId,
            status,
            healthScore: Math.max(0, healthScore),
            lastChecked: new Date().toISOString(),
            issues,
        });
    }

    private monitorLoadDistribution(): void {
        const distribution = this.getLoadDistribution();

        if (distribution.overloadedStrands.length > 0) {
            console.log(
                `[LoadBalancer] ${distribution.overloadedStrands.length} overloaded strands detected`,
                distribution.overloadedStrands
            );
        }

        if (distribution.balanceScore < 0.7) {
            console.log(
                `[LoadBalancer] Poor load balance detected (score: ${distribution.balanceScore.toFixed(2)})`
            );
        }
    }

    private performHealthChecks(): void {
        // In production, this would check actual strand health
        // For now, we update health based on metrics
        for (const [strandId, metrics] of this.loadMetrics.entries()) {
            this.updateHealthStatus(strandId, metrics);
        }
    }

    private rebalanceLoad(): void {
        const distribution = this.getLoadDistribution();

        // If load is well balanced, no action needed
        if (distribution.balanceScore >= 0.8) {
            return;
        }

        console.log(
            `[LoadBalancer] Rebalancing load (current balance score: ${distribution.balanceScore.toFixed(2)})`
        );

        // In production, this would trigger actual rebalancing actions
        // such as migrating tasks from overloaded to underutilized strands
    }
}

/**
 * Singleton instance
 */
let loadBalancerInstance: LoadBalancer | null = null;

/**
 * Get the singleton LoadBalancer instance
 */
export function getLoadBalancer(
    config?: Partial<LoadBalancerConfig>
): LoadBalancer {
    if (!loadBalancerInstance) {
        loadBalancerInstance = new LoadBalancer(config);
    }
    return loadBalancerInstance;
}

/**
 * Reset the LoadBalancer singleton (useful for testing)
 */
export function resetLoadBalancer(): void {
    if (loadBalancerInstance) {
        loadBalancerInstance.stopMonitoring();
    }
    loadBalancerInstance = null;
}
