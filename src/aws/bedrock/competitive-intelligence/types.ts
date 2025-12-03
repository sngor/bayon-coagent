/**
 * Competitive Intelligence Types
 * 
 * Type definitions for competitor monitoring, pattern identification,
 * gap analysis, and competitive strategy recommendations.
 */

/**
 * Competitor information
 */
export interface Competitor {
    /** Unique competitor identifier */
    id: string;

    /** Competitor name */
    name: string;

    /** Business type */
    businessType: 'agent' | 'team' | 'brokerage';

    /** Market(s) they operate in */
    markets: string[];

    /** Website URL */
    website?: string;

    /** Social media profiles */
    socialProfiles?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        twitter?: string;
        youtube?: string;
        tiktok?: string;
    };

    /** When competitor was added */
    addedAt: string;

    /** Last analyzed timestamp */
    lastAnalyzed?: string;

    /** Active monitoring status */
    isActive: boolean;
}

/**
 * Competitor content piece
 */
export interface CompetitorContent {
    /** Unique content identifier */
    id: string;

    /** Competitor ID */
    competitorId: string;

    /** Content type */
    type: 'blog-post' | 'social-media' | 'video' | 'email' | 'listing' | 'advertisement' | 'other';

    /** Platform where content was found */
    platform: string;

    /** Content title */
    title?: string;

    /** Content body/description */
    content: string;

    /** Content URL */
    url?: string;

    /** Media URLs (images, videos) */
    mediaUrls?: string[];

    /** Publishing timestamp */
    publishedAt: string;

    /** When content was discovered */
    discoveredAt: string;

    /** Engagement metrics */
    engagement?: {
        likes?: number;
        comments?: number;
        shares?: number;
        views?: number;
    };

    /** Content topics/tags */
    topics?: string[];

    /** Sentiment analysis */
    sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Strategic pattern identified in competitor content
 */
export interface StrategyPattern {
    /** Pattern identifier */
    id: string;

    /** Pattern name */
    name: string;

    /** Pattern description */
    description: string;

    /** Pattern category */
    category: 'content-strategy' | 'messaging' | 'targeting' | 'timing' | 'format' | 'engagement';

    /** Confidence in this pattern (0-1) */
    confidence: number;

    /** Frequency of pattern occurrence */
    frequency: number;

    /** Supporting evidence */
    evidence: PatternEvidence[];

    /** Effectiveness score (0-1) */
    effectiveness?: number;

    /** When pattern was identified */
    identifiedAt: string;

    /** Trend direction */
    trend?: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Evidence supporting a pattern
 */
export interface PatternEvidence {
    /** Content ID that demonstrates this pattern */
    contentId: string;

    /** Specific example or quote */
    example: string;

    /** Relevance score (0-1) */
    relevance: number;

    /** Timestamp */
    timestamp: string;
}

/**
 * Competitive gap identified
 */
export interface CompetitiveGap {
    /** Gap identifier */
    id: string;

    /** Gap type */
    type: 'content' | 'channel' | 'audience' | 'messaging' | 'frequency' | 'quality';

    /** Gap title */
    title: string;

    /** Detailed description */
    description: string;

    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';

    /** What competitors are doing */
    competitorApproach: string;

    /** What agent is currently doing */
    agentApproach: string;

    /** Recommended action */
    recommendation: string;

    /** Potential impact of addressing gap (0-1) */
    potentialImpact: number;

    /** Effort required to address */
    effortRequired: 'low' | 'medium' | 'high';

    /** Priority score (0-1) */
    priority: number;

    /** Supporting data */
    supportingData: CompetitorContent[];

    /** Identified timestamp */
    identifiedAt: string;
}

/**
 * Competitive advantage identified
 */
export interface CompetitiveAdvantage {
    /** Advantage identifier */
    id: string;

    /** Advantage type */
    type: 'content-quality' | 'frequency' | 'engagement' | 'reach' | 'specialization' | 'innovation';

    /** Advantage title */
    title: string;

    /** Detailed description */
    description: string;

    /** Strength score (0-1) */
    strength: number;

    /** How to capitalize on this advantage */
    capitalizationStrategy: string;

    /** Recommended actions */
    recommendedActions: string[];

    /** Sustainability assessment */
    sustainability: 'temporary' | 'sustainable' | 'long-term';

    /** Identified timestamp */
    identifiedAt: string;
}

/**
 * Competitive benchmark metrics
 */
export interface CompetitiveBenchmark {
    /** Benchmark identifier */
    id: string;

    /** Metric name */
    metric: string;

    /** Metric category */
    category: 'content' | 'engagement' | 'reach' | 'frequency' | 'quality';

    /** Agent's value */
    agentValue: number;

    /** Market average */
    marketAverage: number;

    /** Top performer value */
    topPerformer: number;

    /** Agent's percentile rank (0-100) */
    percentileRank: number;

    /** Performance status */
    status: 'below-average' | 'average' | 'above-average' | 'top-performer';

    /** Gap to market average */
    gapToAverage: number;

    /** Gap to top performer */
    gapToTop: number;

    /** Improvement recommendations */
    recommendations: string[];

    /** Benchmark timestamp */
    timestamp: string;
}

/**
 * Differentiation strategy recommendation
 */
export interface DifferentiationStrategy {
    /** Strategy identifier */
    id: string;

    /** Strategy name */
    name: string;

    /** Detailed strategy description */
    description: string;

    /** Positioning statement */
    positioning: string;

    /** Key differentiators */
    differentiators: string[];

    /** Target audience */
    targetAudience: string;

    /** Messaging recommendations */
    messaging: string[];

    /** Content recommendations */
    contentRecommendations: ContentRecommendation[];

    /** Expected outcomes */
    expectedOutcomes: string[];

    /** Implementation steps */
    implementationSteps: string[];

    /** Success metrics */
    successMetrics: string[];

    /** Confidence in strategy (0-1) */
    confidence: number;

    /** Generated timestamp */
    generatedAt: string;
}

/**
 * Content recommendation for differentiation
 */
export interface ContentRecommendation {
    /** Content type */
    type: string;

    /** Topic */
    topic: string;

    /** Key message */
    message: string;

    /** Unique angle */
    angle: string;

    /** Priority */
    priority: 'low' | 'medium' | 'high';
}

/**
 * Competitor analysis result
 */
export interface CompetitorAnalysisResult {
    /** Competitor being analyzed */
    competitor: Competitor;

    /** Analyzed content */
    content: CompetitorContent[];

    /** Identified patterns */
    patterns: StrategyPattern[];

    /** Analysis summary */
    summary: {
        totalContent: number;
        contentTypes: Record<string, number>;
        topTopics: string[];
        averageEngagement: number;
        postingFrequency: number;
        mostActiveChannels: string[];
    };

    /** Analysis metadata */
    metadata: {
        analysisTime: number;
        contentAnalyzed: number;
        timeRange: {
            start: string;
            end: string;
        };
        timestamp: string;
    };
}

/**
 * Competitive landscape analysis
 */
export interface CompetitiveLandscapeAnalysis {
    /** Agent profile */
    agentId: string;

    /** Competitors analyzed */
    competitors: Competitor[];

    /** Identified gaps */
    gaps: CompetitiveGap[];

    /** Identified advantages */
    advantages: CompetitiveAdvantage[];

    /** Benchmarks */
    benchmarks: CompetitiveBenchmark[];

    /** Differentiation strategies */
    strategies: DifferentiationStrategy[];

    /** Market insights */
    insights: string[];

    /** Analysis timestamp */
    analyzedAt: string;
}

/**
 * Competitor monitoring configuration
 */
export interface MonitoringConfig {
    /** User ID */
    userId: string;

    /** Competitors to monitor */
    competitors: string[];

    /** Content types to track */
    contentTypes: string[];

    /** Platforms to monitor */
    platforms: string[];

    /** Monitoring frequency */
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

    /** Alert thresholds */
    alerts: {
        newContent: boolean;
        highEngagement: boolean;
        strategyChange: boolean;
        gapIdentified: boolean;
    };

    /** Active status */
    isActive: boolean;

    /** Created timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * Competitor storage record for DynamoDB
 */
export interface CompetitorRecord {
    /** Primary key: USER#userId */
    PK: string;

    /** Sort key: COMPETITOR#competitorId */
    SK: string;

    /** Entity type */
    entityType: 'CompetitorRecord';

    /** Competitor data */
    competitor: Competitor;

    /** Latest analysis */
    latestAnalysis?: CompetitorAnalysisResult;

    /** Monitoring configuration */
    monitoringConfig?: MonitoringConfig;

    /** Created timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt: string;

    /** TTL for automatic cleanup */
    ttl?: number;
}

/**
 * Competitor content storage record
 */
export interface CompetitorContentRecord {
    /** Primary key: COMPETITOR#competitorId */
    PK: string;

    /** Sort key: CONTENT#timestamp#contentId */
    SK: string;

    /** Entity type */
    entityType: 'CompetitorContentRecord';

    /** Content data */
    content: CompetitorContent;

    /** Analysis results */
    analysis?: {
        patterns: string[];
        topics: string[];
        sentiment: string;
        effectiveness: number;
    };

    /** Created timestamp */
    createdAt: string;

    /** TTL for automatic cleanup (90 days) */
    ttl: number;
}

/**
 * Competitive analysis storage record
 */
export interface CompetitiveAnalysisRecord {
    /** Primary key: USER#userId */
    PK: string;

    /** Sort key: ANALYSIS#timestamp */
    SK: string;

    /** Entity type */
    entityType: 'CompetitiveAnalysisRecord';

    /** Analysis data */
    analysis: CompetitiveLandscapeAnalysis;

    /** Created timestamp */
    createdAt: string;

    /** TTL for automatic cleanup (180 days) */
    ttl: number;
}

/**
 * Filters for competitor content queries
 */
export interface CompetitorContentFilters {
    /** Filter by competitor IDs */
    competitorIds?: string[];

    /** Filter by content types */
    contentTypes?: string[];

    /** Filter by platforms */
    platforms?: string[];

    /** Filter by topics */
    topics?: string[];

    /** Date range */
    dateRange?: {
        start: string;
        end: string;
    };

    /** Minimum engagement threshold */
    minEngagement?: number;

    /** Limit results */
    limit?: number;
}

/**
 * Pattern identification configuration
 */
export interface PatternIdentificationConfig {
    /** Minimum frequency for pattern detection */
    minFrequency: number;

    /** Minimum confidence threshold */
    minConfidence: number;

    /** Time window for analysis */
    timeWindow: string;

    /** Pattern categories to detect */
    categories: string[];

    /** Include effectiveness scoring */
    includeEffectiveness: boolean;
}

/**
 * Agent content summary for gap analysis
 */
export interface AgentContentSummary {
    userId: string;
    totalContent: number;
    contentTypes: Record<string, number>;
    platforms: string[];
    postingFrequency: number;
    averageEngagement: number;
    topTopics: string[];
    contentQuality: number;
    brandConsistency: number;
}

/**
 * Strategy comparison result
 */
export interface StrategyComparison {
    agentStrategy: StrategyDescription;
    competitorStrategies: Map<string, StrategyDescription>;
    differences: StrategyDifference[];
    recommendations: string[];
}

/**
 * Strategy description
 */
export interface StrategyDescription {
    contentFocus: string[];
    targetAudience: string[];
    messagingThemes: string[];
    channelMix: Record<string, number>;
    postingPattern: {
        frequency: number;
        bestTimes: string[];
        consistency: number;
    };
    engagementApproach: string[];
    uniqueElements: string[];
}

/**
 * Strategy difference
 */
export interface StrategyDifference {
    category: string;
    agentApproach: string;
    competitorApproach: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
}

/**
 * Gap visualization data
 */
export interface GapVisualization {
    radarChart: {
        categories: string[];
        agentScores: number[];
        competitorAverages: number[];
        topPerformerScores: number[];
    };
    barChart: {
        metrics: string[];
        agentValues: number[];
        marketAverages: number[];
        gaps: number[];
    };
    heatmap: {
        contentTypes: string[];
        platforms: string[];
        agentCoverage: number[][];
        competitorCoverage: number[][];
    };
    timeline: {
        dates: string[];
        agentActivity: number[];
        competitorActivity: number[];
    };
}
