/**
 * Analytics & Monitoring Types
 * 
 * Type definitions for performance tracking, cost monitoring, and analytics
 * in the AgentStrands enhancement system.
 */

/**
 * Performance metrics for strand execution
 */
export interface PerformanceMetrics {
    /** Execution time in milliseconds */
    executionTime: number;
    /** Number of tokens used */
    tokenUsage: number;
    /** Cost in USD */
    cost: number;
    /** Success rate (0-1) */
    successRate: number;
    /** User satisfaction score (0-5) */
    userSatisfaction: number;
    /** Quality score (0-100) */
    qualityScore: number;
    /** Timestamp of measurement */
    timestamp: string;
}

/**
 * Filters for analytics queries
 */
export interface AnalyticsFilters {
    /** Filter by strand ID */
    strandId?: string;
    /** Filter by user ID */
    userId?: string;
    /** Filter by task type */
    taskType?: string;
    /** Start date for time range */
    startDate?: string;
    /** End date for time range */
    endDate?: string;
    /** Minimum quality score */
    minQualityScore?: number;
    /** Maximum cost */
    maxCost?: number;
}

/**
 * Aggregated performance analytics
 */
export interface PerformanceAnalytics {
    /** Total number of tasks */
    totalTasks: number;
    /** Average execution time in ms */
    avgExecutionTime: number;
    /** Total token usage */
    totalTokens: number;
    /** Total cost in USD */
    totalCost: number;
    /** Overall success rate (0-1) */
    successRate: number;
    /** Average user satisfaction (0-5) */
    avgSatisfaction: number;
    /** Average quality score (0-100) */
    avgQualityScore: number;
    /** Metrics by strand type */
    byStrand: Record<string, PerformanceMetrics>;
    /** Metrics by task type */
    byTaskType: Record<string, PerformanceMetrics>;
    /** Time series data */
    timeSeries: TimeSeriesData[];
}

/**
 * Time series data point
 */
export interface TimeSeriesData {
    /** Timestamp */
    timestamp: string;
    /** Metric value */
    value: number;
    /** Metric name */
    metric: string;
}

/**
 * Performance anomaly detection
 */
export interface Anomaly {
    /** Anomaly ID */
    id: string;
    /** Type of anomaly */
    type: 'latency' | 'error-rate' | 'cost' | 'quality';
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Description of the anomaly */
    description: string;
    /** Affected strand or component */
    affectedComponent: string;
    /** Detected at timestamp */
    detectedAt: string;
    /** Current value */
    currentValue: number;
    /** Expected value */
    expectedValue: number;
    /** Deviation percentage */
    deviation: number;
    /** Suggested actions */
    suggestedActions: string[];
}

/**
 * Performance report types
 */
export type ReportType =
    | 'daily-summary'
    | 'weekly-summary'
    | 'monthly-summary'
    | 'strand-performance'
    | 'cost-analysis'
    | 'quality-trends'
    | 'user-satisfaction'
    | 'bottleneck-analysis';

/**
 * Performance report
 */
export interface PerformanceReport {
    /** Report ID */
    id: string;
    /** Report type */
    type: ReportType;
    /** Report title */
    title: string;
    /** Report description */
    description: string;
    /** Generated at timestamp */
    generatedAt: string;
    /** Time period covered */
    period: {
        start: string;
        end: string;
    };
    /** Report data */
    data: PerformanceAnalytics;
    /** Key insights */
    insights: string[];
    /** Recommendations */
    recommendations: string[];
    /** Anomalies detected */
    anomalies: Anomaly[];
}

/**
 * Performance snapshot for historical tracking
 */
export interface PerformanceSnapshot {
    /** Snapshot ID */
    id: string;
    /** Strand ID */
    strandId: string;
    /** Metrics at this point in time */
    metrics: PerformanceMetrics;
    /** Timestamp */
    timestamp: string;
    /** Additional metadata */
    metadata: Record<string, any>;
}

/**
 * Cost operation for tracking
 */
export interface CostOperation {
    /** Operation ID */
    id: string;
    /** Strand ID */
    strandId: string;
    /** User ID */
    userId: string;
    /** Task type */
    taskType: string;
    /** Model used */
    model: string;
    /** Input tokens */
    inputTokens: number;
    /** Output tokens */
    outputTokens: number;
    /** Total cost in USD */
    cost: number;
    /** Timestamp */
    timestamp: string;
    /** Additional metadata */
    metadata: Record<string, any>;
}

/**
 * Cost breakdown by dimension
 */
export interface CostBreakdown {
    /** Total cost */
    total: number;
    /** Breakdown by category */
    breakdown: Record<string, number>;
    /** Time period */
    period: {
        start: string;
        end: string;
    };
    /** Top cost drivers */
    topDrivers: Array<{
        name: string;
        cost: number;
        percentage: number;
    }>;
}

/**
 * Cost alert
 */
export interface CostAlert {
    /** Alert ID */
    id: string;
    /** Alert type */
    type: 'threshold-exceeded' | 'unusual-spike' | 'budget-warning';
    /** Severity */
    severity: 'low' | 'medium' | 'high';
    /** Message */
    message: string;
    /** Current cost */
    currentCost: number;
    /** Threshold */
    threshold: number;
    /** Dimension (strand, user, task-type) */
    dimension: string;
    /** Dimension value */
    dimensionValue: string;
    /** Triggered at */
    triggeredAt: string;
}

/**
 * Cost optimization suggestion
 */
export interface CostOptimization {
    /** Optimization ID */
    id: string;
    /** Title */
    title: string;
    /** Description */
    description: string;
    /** Potential savings in USD */
    potentialSavings: number;
    /** Implementation effort */
    effort: 'low' | 'medium' | 'high';
    /** Priority */
    priority: 'low' | 'medium' | 'high';
    /** Specific actions */
    actions: string[];
    /** Affected components */
    affectedComponents: string[];
}

/**
 * DynamoDB entity for performance metrics
 */
export interface PerformanceMetricsEntity {
    PK: string; // STRAND#{strandId}
    SK: string; // PERF#{timestamp}
    entityType: 'PerformanceMetrics';
    strandId: string;
    userId: string;
    taskId: string;
    taskType: string;
    metrics: PerformanceMetrics;
    createdAt: string;
    ttl?: number; // Optional TTL for automatic cleanup
}

/**
 * DynamoDB entity for cost records
 */
export interface CostRecordEntity {
    PK: string; // USER#{userId}
    SK: string; // COST#{timestamp}#{strandId}
    entityType: 'CostRecord';
    userId: string;
    strandId: string;
    operation: CostOperation;
    createdAt: string;
    ttl?: number;
}

/**
 * DynamoDB entity for anomalies
 */
export interface AnomalyEntity {
    PK: string; // STRAND#{strandId}
    SK: string; // ANOMALY#{timestamp}
    entityType: 'Anomaly';
    strandId: string;
    anomaly: Anomaly;
    resolved: boolean;
    resolvedAt?: string;
    createdAt: string;
}

/**
 * Business outcome types
 */
export type OutcomeType =
    | 'lead-generated'
    | 'property-viewed'
    | 'contact-made'
    | 'appointment-scheduled'
    | 'listing-signed'
    | 'sale-closed'
    | 'referral-received'
    | 'engagement'
    | 'brand-awareness';

/**
 * Business outcome record
 */
export interface BusinessOutcome {
    /** Outcome ID */
    id: string;
    /** Content ID that generated this outcome */
    contentId: string;
    /** Strand ID that created the content */
    strandId: string;
    /** User ID */
    userId: string;
    /** Type of outcome */
    type: OutcomeType;
    /** Monetary value in USD */
    value: number;
    /** Outcome description */
    description: string;
    /** Timestamp when outcome occurred */
    occurredAt: string;
    /** Additional metadata */
    metadata: Record<string, any>;
}

/**
 * Content performance metrics
 */
export interface ContentPerformance {
    /** Content ID */
    contentId: string;
    /** Content type */
    contentType: string;
    /** Creation cost in USD */
    creationCost: number;
    /** Distribution cost in USD */
    distributionCost: number;
    /** Total cost */
    totalCost: number;
    /** Views/impressions */
    views: number;
    /** Clicks/engagements */
    clicks: number;
    /** Shares */
    shares: number;
    /** Leads generated */
    leads: number;
    /** Conversions */
    conversions: number;
    /** Total revenue generated */
    revenue: number;
    /** ROI percentage */
    roi: number;
    /** Created at timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * ROI calculation result
 */
export interface ROICalculation {
    /** Content ID */
    contentId: string;
    /** Total investment (costs) */
    investment: number;
    /** Total return (revenue) */
    return: number;
    /** Net profit */
    profit: number;
    /** ROI percentage */
    roiPercentage: number;
    /** Payback period in days */
    paybackPeriod: number;
    /** Calculated at timestamp */
    calculatedAt: string;
}

/**
 * ROI report
 */
export interface ROIReport {
    /** Report ID */
    id: string;
    /** Report title */
    title: string;
    /** Report period */
    period: {
        start: string;
        end: string;
    };
    /** Total investment */
    totalInvestment: number;
    /** Total return */
    totalReturn: number;
    /** Overall ROI */
    overallROI: number;
    /** ROI by content type */
    byContentType: Record<string, ROICalculation>;
    /** ROI by strand */
    byStrand: Record<string, ROICalculation>;
    /** Top performing content */
    topPerformers: ContentPerformance[];
    /** Bottom performing content */
    bottomPerformers: ContentPerformance[];
    /** Insights */
    insights: string[];
    /** Recommendations */
    recommendations: string[];
    /** Generated at timestamp */
    generatedAt: string;
}

/**
 * Filters for ROI queries
 */
export interface ROIFilters {
    /** Filter by user ID */
    userId?: string;
    /** Filter by strand ID */
    strandId?: string;
    /** Filter by content type */
    contentType?: string;
    /** Start date */
    startDate?: string;
    /** End date */
    endDate?: string;
    /** Minimum ROI percentage */
    minROI?: number;
    /** Maximum ROI percentage */
    maxROI?: number;
}

/**
 * DynamoDB entity for business outcomes
 */
export interface BusinessOutcomeEntity {
    PK: string; // CONTENT#{contentId}
    SK: string; // OUTCOME#{timestamp}#{outcomeId}
    entityType: 'BusinessOutcome';
    userId: string;
    strandId: string;
    outcome: BusinessOutcome;
    createdAt: string;
    ttl?: number;
}

/**
 * DynamoDB entity for content performance
 */
export interface ContentPerformanceEntity {
    PK: string; // USER#{userId}
    SK: string; // CONTENT_PERF#{contentId}
    entityType: 'ContentPerformance';
    userId: string;
    strandId: string;
    performance: ContentPerformance;
    createdAt: string;
    updatedAt: string;
}
