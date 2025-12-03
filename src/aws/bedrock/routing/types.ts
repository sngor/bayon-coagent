/**
 * Adaptive Routing Types
 * 
 * Type definitions for the adaptive routing system that intelligently
 * routes tasks based on confidence, performance, load, and priority.
 * Requirements: 10.1, 10.5
 */

import type { AgentStrand } from '../agent-core';
import type { WorkerTask, WorkerResult } from '../worker-protocol';

/**
 * Routing action to take based on confidence and conditions
 */
export type RoutingAction =
    | 'execute'           // Execute task normally
    | 'human-review'      // Route to human review
    | 'retry'             // Retry with same or different strand
    | 'fallback'          // Use fallback strategy
    | 'abort';            // Abort task execution

/**
 * Routing context for decision making
 */
export interface RoutingContext {
    /** User ID for user-specific routing */
    userId: string;

    /** Task priority level */
    priority: 'low' | 'normal' | 'high' | 'urgent';

    /** Confidence threshold for this task */
    confidenceThreshold?: number;

    /** Whether human review is available */
    humanReviewAvailable: boolean;

    /** Maximum retry attempts */
    maxRetries?: number;

    /** Current retry count */
    retryCount?: number;

    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Routing decision with rationale
 */
export interface RoutingDecision {
    /** Selected strand for execution */
    selectedStrand: AgentStrand;

    /** Confidence score (0-1) */
    confidence: number;

    /** Rationale for the decision */
    rationale: string;

    /** Alternative strands considered */
    alternativeStrands: Array<{
        strand: AgentStrand;
        score: number;
        reason: string;
    }>;

    /** Estimated cost in USD */
    estimatedCost: number;

    /** Estimated execution time in ms */
    estimatedTime: number;

    /** Routing action to take */
    action: RoutingAction;

    /** Timestamp of decision */
    decidedAt: string;
}

/**
 * Fallback strategy configuration
 */
export interface FallbackStrategy {
    /** Strategy ID */
    id: string;

    /** Strategy name */
    name: string;

    /** Alternative strand to try */
    alternativeStrand?: AgentStrand;

    /** Modified task parameters */
    modifiedTask?: Partial<WorkerTask>;

    /** Retry with exponential backoff */
    retryWithBackoff?: {
        initialDelayMs: number;
        maxDelayMs: number;
        multiplier: number;
    };

    /** Fallback to simpler model */
    simplifyModel?: boolean;

    /** Route to human review */
    routeToHuman?: boolean;
}

/**
 * Load balancing metrics
 */
export interface LoadMetrics {
    /** Strand ID */
    strandId: string;

    /** Current load (0-1) */
    currentLoad: number;

    /** Average response time in ms */
    avgResponseTime: number;

    /** Success rate (0-1) */
    successRate: number;

    /** Queue depth */
    queueDepth: number;

    /** Last updated timestamp */
    lastUpdated: string;
}

/**
 * Priority queue entry
 */
export interface PriorityQueueEntry {
    /** Task to execute */
    task: WorkerTask;

    /** Routing context */
    context: RoutingContext;

    /** Priority score (higher = more urgent) */
    priorityScore: number;

    /** Enqueued at timestamp */
    enqueuedAt: string;

    /** Deadline timestamp (optional) */
    deadline?: string;
}

/**
 * Routing decision log entry
 */
export interface RoutingDecisionLog {
    /** Log entry ID */
    id: string;

    /** Task ID */
    taskId: string;

    /** User ID */
    userId: string;

    /** Routing decision */
    decision: RoutingDecision;

    /** Routing context */
    context: RoutingContext;

    /** Actual outcome */
    outcome?: {
        success: boolean;
        executionTime: number;
        actualCost: number;
        confidence: number;
    };

    /** Timestamp */
    timestamp: string;
}

/**
 * Routing analytics
 */
export interface RoutingAnalytics {
    /** Total routing decisions made */
    totalDecisions: number;

    /** Decisions by action */
    byAction: Record<RoutingAction, number>;

    /** Average confidence score */
    avgConfidence: number;

    /** Human review rate */
    humanReviewRate: number;

    /** Fallback rate */
    fallbackRate: number;

    /** Retry rate */
    retryRate: number;

    /** Average decision time in ms */
    avgDecisionTime: number;

    /** Routing accuracy (predicted vs actual) */
    routingAccuracy: {
        costAccuracy: number;
        timeAccuracy: number;
        confidenceAccuracy: number;
    };

    /** Time period */
    period: {
        start: string;
        end: string;
    };
}

/**
 * Confidence threshold configuration
 */
export interface ConfidenceThresholds {
    /** Minimum confidence for automatic execution */
    autoExecute: number;

    /** Threshold for human review */
    humanReview: number;

    /** Threshold for retry */
    retry: number;

    /** Threshold for abort */
    abort: number;
}

/**
 * Adaptive router configuration
 */
export interface AdaptiveRouterConfig {
    /** Default confidence thresholds */
    confidenceThresholds: ConfidenceThresholds;

    /** Enable load balancing */
    enableLoadBalancing: boolean;

    /** Enable priority queue */
    enablePriorityQueue: boolean;

    /** Maximum queue size */
    maxQueueSize: number;

    /** Enable decision logging */
    enableDecisionLogging: boolean;

    /** Log retention period in days */
    logRetentionDays: number;

    /** Enable fallback strategies */
    enableFallbacks: boolean;

    /** Maximum fallback attempts */
    maxFallbackAttempts: number;
}

/**
 * DynamoDB entity for routing decision logs
 */
export interface RoutingDecisionLogEntity {
    PK: string; // USER#{userId}
    SK: string; // ROUTING#{timestamp}#{taskId}
    entityType: 'RoutingDecisionLog';
    userId: string;
    taskId: string;
    log: RoutingDecisionLog;
    createdAt: string;
    ttl?: number; // For automatic cleanup
}

/**
 * DynamoDB entity for load metrics
 */
export interface LoadMetricsEntity {
    PK: string; // STRAND#{strandId}
    SK: string; // LOAD#{timestamp}
    entityType: 'LoadMetrics';
    strandId: string;
    metrics: LoadMetrics;
    createdAt: string;
    ttl?: number;
}

/**
 * DynamoDB entity for fallback tracking records
 */
export interface FallbackTrackingEntity {
    PK: string; // USER#{userId}
    SK: string; // FALLBACK#{timestamp}#{taskId}
    entityType: 'FallbackTracking';
    userId: string;
    taskId: string;
    failedStrandId: string;
    failedStrandType: string;
    success: boolean;
    attempts: number;
    totalTime: number;
    strategyId: string;
    strategyName: string;
    createdAt: string;
    ttl?: number;
}

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
