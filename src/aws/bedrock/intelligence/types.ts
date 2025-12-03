/**
 * Intelligence Layer Types
 * 
 * Type definitions for proactive intelligence, opportunity detection,
 * trend analysis, and recommendation systems.
 */

/**
 * Opportunity types that can be detected
 */
export type OpportunityType = 'trend' | 'gap' | 'timing' | 'competitive';

/**
 * Opportunity detected by the intelligence system
 */
export interface Opportunity {
    /** Unique opportunity identifier */
    id: string;

    /** Type of opportunity */
    type: OpportunityType;

    /** Human-readable title */
    title: string;

    /** Detailed description */
    description: string;

    /** Potential impact score (0-1) */
    potentialImpact: number;

    /** Confidence in this opportunity (0-1) */
    confidence: number;

    /** Supporting data and evidence */
    supportingData: OpportunitySupportingData[];

    /** When this opportunity expires (optional) */
    expiresAt?: string;

    /** When this opportunity was detected */
    detectedAt: string;

    /** Market or context this applies to */
    market?: string;

    /** Agent profile this is relevant for */
    agentId?: string;
}

/**
 * Supporting data for an opportunity
 */
export interface OpportunitySupportingData {
    /** Type of supporting data */
    type: 'market-data' | 'trend' | 'competitor-activity' | 'historical-pattern' | 'user-behavior';

    /** Data source */
    source: string;

    /** The actual data */
    data: any;

    /** Relevance score (0-1) */
    relevance: number;

    /** When this data was collected */
    timestamp: string;
}

/**
 * Actionable suggestion generated from an opportunity
 */
export interface ActionableSuggestion {
    /** Unique suggestion identifier */
    id: string;

    /** Related opportunity ID */
    opportunityId: string;

    /** Suggested action */
    action: string;

    /** Detailed steps to take */
    steps: string[];

    /** Expected outcome */
    expectedOutcome: string;

    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'urgent';

    /** Estimated effort required */
    effort: 'low' | 'medium' | 'high';

    /** Estimated time to complete */
    estimatedTime: string;

    /** Resources needed */
    resourcesNeeded: string[];

    /** Success metrics */
    successMetrics: string[];
}

/**
 * Market data for analysis
 */
export interface MarketData {
    /** Market identifier */
    market: string;

    /** Data type */
    dataType: 'price' | 'inventory' | 'demand' | 'demographic' | 'economic';

    /** Metric name */
    metric: string;

    /** Current value */
    value: number | string;

    /** Previous value for comparison */
    previousValue?: number | string;

    /** Change percentage */
    changePercent?: number;

    /** Trend direction */
    trend?: 'up' | 'down' | 'stable';

    /** Data source */
    source: string;

    /** Timestamp */
    timestamp: string;

    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Agent profile for opportunity matching
 */
export interface AgentProfile {
    /** Agent ID */
    id: string;

    /** Agent name */
    agentName: string;

    /** Primary market */
    primaryMarket: string;

    /** Specialization areas */
    specialization: string[];

    /** Target audience */
    targetAudience?: string[];

    /** Content preferences */
    contentPreferences?: {
        topics: string[];
        formats: string[];
        frequency: string;
    };

    /** Performance goals */
    goals?: {
        leadGeneration?: number;
        brandAwareness?: boolean;
        marketShare?: number;
    };
}

/**
 * Opportunity detection filters
 */
export interface OpportunityFilters {
    /** Filter by opportunity type */
    types?: OpportunityType[];

    /** Minimum impact threshold */
    minImpact?: number;

    /** Minimum confidence threshold */
    minConfidence?: number;

    /** Filter by market */
    market?: string;

    /** Filter by agent */
    agentId?: string;

    /** Only include non-expired opportunities */
    activeOnly?: boolean;

    /** Date range */
    dateRange?: {
        start: string;
        end: string;
    };
}

/**
 * Opportunity prioritization criteria
 */
export interface PrioritizationCriteria {
    /** Weight for impact score (0-1) */
    impactWeight: number;

    /** Weight for confidence score (0-1) */
    confidenceWeight: number;

    /** Weight for urgency (0-1) */
    urgencyWeight: number;

    /** Weight for alignment with agent preferences (0-1) */
    alignmentWeight: number;

    /** User-specific preferences */
    userPreferences?: {
        preferredTypes: OpportunityType[];
        preferredMarkets: string[];
        riskTolerance: 'low' | 'medium' | 'high';
    };
}

/**
 * Opportunity detection result
 */
export interface OpportunityDetectionResult {
    /** Detected opportunities */
    opportunities: Opportunity[];

    /** Total opportunities found */
    totalFound: number;

    /** Analysis metadata */
    metadata: {
        /** Analysis duration in ms */
        analysisTime: number;

        /** Data sources used */
        sourcesAnalyzed: string[];

        /** Markets analyzed */
        marketsAnalyzed: string[];

        /** Timestamp */
        timestamp: string;
    };
}

/**
 * Opportunity storage record for DynamoDB
 */
export interface OpportunityRecord {
    /** Primary key: USER#userId */
    PK: string;

    /** Sort key: OPPORTUNITY#opportunityId */
    SK: string;

    /** Entity type */
    entityType: 'OpportunityRecord';

    /** Opportunity data */
    opportunity: Opportunity;

    /** Current status */
    status: 'new' | 'viewed' | 'acted-on' | 'dismissed' | 'expired';

    /** Generated suggestions */
    suggestions: ActionableSuggestion[];

    /** User ID */
    userId: string;

    /** Created timestamp */
    createdAt: string;

    /** Expires timestamp */
    expiresAt?: string;

    /** Outcome tracking */
    outcome?: {
        action: string;
        result: string;
        impact: number;
        timestamp: string;
    };

    /** Last updated timestamp */
    updatedAt: string;

    /** TTL for automatic cleanup */
    ttl?: number;
}

/**
 * Trend direction
 */
export type TrendDirection = 'rising' | 'falling' | 'stable' | 'volatile';

/**
 * Trend strength
 */
export type TrendStrength = 'weak' | 'moderate' | 'strong' | 'very-strong';

/**
 * Market trend detected by analysis
 */
export interface Trend {
    /** Unique trend identifier */
    id: string;

    /** Trend name/title */
    name: string;

    /** Detailed description */
    description: string;

    /** Market this trend applies to */
    market: string;

    /** Trend category */
    category: 'price' | 'inventory' | 'demand' | 'demographic' | 'economic' | 'seasonal' | 'behavioral';

    /** Current direction */
    direction: TrendDirection;

    /** Trend strength */
    strength: TrendStrength;

    /** Confidence in this trend (0-1) */
    confidence: number;

    /** Relevance to agent (0-1) */
    relevance: number;

    /** Supporting data points */
    dataPoints: TrendDataPoint[];

    /** Statistical metrics */
    statistics: TrendStatistics;

    /** When trend was first detected */
    detectedAt: string;

    /** When trend data was last updated */
    lastUpdated: string;

    /** Predicted duration */
    predictedDuration?: string;

    /** Related trends */
    relatedTrends?: string[];
}

/**
 * Data point in a trend
 */
export interface TrendDataPoint {
    /** Timestamp */
    timestamp: string;

    /** Value */
    value: number;

    /** Data source */
    source: string;

    /** Additional context */
    context?: string;
}

/**
 * Statistical metrics for a trend
 */
export interface TrendStatistics {
    /** Average value */
    mean: number;

    /** Standard deviation */
    standardDeviation: number;

    /** Rate of change (per time period) */
    rateOfChange: number;

    /** Percentage change from start */
    percentChange: number;

    /** Volatility measure (0-1) */
    volatility: number;

    /** R-squared for trend fit (0-1) */
    rSquared?: number;

    /** Momentum indicator */
    momentum?: number;
}

/**
 * Trend prediction
 */
export interface TrendPrediction {
    /** Trend being predicted */
    trendId: string;

    /** Predicted direction */
    predictedDirection: TrendDirection;

    /** Predicted values over time */
    predictions: PredictedValue[];

    /** Confidence in prediction (0-1) */
    confidence: number;

    /** Prediction methodology */
    methodology: 'linear-regression' | 'moving-average' | 'exponential-smoothing' | 'ml-model';

    /** Factors influencing prediction */
    influencingFactors: string[];

    /** Risk factors */
    riskFactors: string[];

    /** Prediction timestamp */
    predictedAt: string;

    /** Prediction horizon */
    horizon: string;
}

/**
 * Predicted value at a future point
 */
export interface PredictedValue {
    /** Future timestamp */
    timestamp: string;

    /** Predicted value */
    value: number;

    /** Lower bound of confidence interval */
    lowerBound: number;

    /** Upper bound of confidence interval */
    upperBound: number;

    /** Confidence level (e.g., 0.95 for 95%) */
    confidenceLevel: number;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
    /** Detected trends */
    trends: Trend[];

    /** Total trends found */
    totalFound: number;

    /** Analysis metadata */
    metadata: {
        /** Analysis duration in ms */
        analysisTime: number;

        /** Data sources analyzed */
        sourcesAnalyzed: string[];

        /** Markets analyzed */
        marketsAnalyzed: string[];

        /** Time period analyzed */
        timePeriod: {
            start: string;
            end: string;
        };

        /** Timestamp */
        timestamp: string;
    };
}

/**
 * Trend notification
 */
export interface TrendNotification {
    /** Notification ID */
    id: string;

    /** User ID */
    userId: string;

    /** Related trend */
    trend: Trend;

    /** Notification type */
    type: 'new-trend' | 'trend-change' | 'trend-alert' | 'trend-opportunity';

    /** Notification message */
    message: string;

    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'urgent';

    /** Action items */
    actionItems: string[];

    /** Created timestamp */
    createdAt: string;

    /** Read status */
    read: boolean;

    /** Expires timestamp */
    expiresAt?: string;
}

/**
 * Trend storage record for DynamoDB
 */
export interface TrendRecord {
    /** Primary key: MARKET#marketId */
    PK: string;

    /** Sort key: TREND#trendId */
    SK: string;

    /** Entity type */
    entityType: 'TrendRecord';

    /** Trend data */
    trend: Trend;

    /** Prediction data */
    prediction?: TrendPrediction;

    /** Created timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt: string;

    /** TTL for automatic cleanup */
    ttl?: number;
}
