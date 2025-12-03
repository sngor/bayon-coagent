/**
 * Gap Identifier
 * 
 * Analyzes content libraries to identify gaps in coverage, suggests topics
 * to address, and tracks gap resolution over time.
 * 
 * Features:
 * - Content library analysis
 * - Gap detection algorithm
 * - Topic suggestion generation
 * - Gap tracking and monitoring
 * - Best practice comparison
 */

import { AgentProfile } from './types';

/**
 * Content item in the library
 */
export interface ContentItem {
    /** Unique content identifier */
    id: string;

    /** Content type */
    type: 'blog-post' | 'social-media' | 'video-script' | 'listing-description' | 'market-update' | 'newsletter' | 'guide';

    /** Content title */
    title: string;

    /** Content body/text */
    content: string;

    /** Topics covered */
    topics: string[];

    /** Keywords */
    keywords: string[];

    /** Target audience */
    targetAudience?: string[];

    /** Content category */
    category?: string;

    /** Created timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt?: string;

    /** Performance metrics */
    metrics?: {
        views?: number;
        engagement?: number;
        conversions?: number;
    };
}

/**
 * Content gap detected in the library
 */
export interface ContentGap {
    /** Unique gap identifier */
    id: string;

    /** Gap type */
    type: 'topic' | 'format' | 'audience' | 'frequency' | 'quality';

    /** Gap title */
    title: string;

    /** Detailed description */
    description: string;

    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';

    /** Impact score (0-1) */
    impact: number;

    /** Confidence in this gap (0-1) */
    confidence: number;

    /** Missing topics or elements */
    missingElements: string[];

    /** Recommended actions */
    recommendations: GapRecommendation[];

    /** Supporting evidence */
    evidence: GapEvidence[];

    /** Detected timestamp */
    detectedAt: string;

    /** Status */
    status: 'open' | 'in-progress' | 'resolved' | 'dismissed';

    /** Resolution tracking */
    resolution?: {
        resolvedAt: string;
        resolvedBy: string;
        contentCreated: string[];
    };
}

/**
 * Recommendation for addressing a gap
 */
export interface GapRecommendation {
    /** Recommendation ID */
    id: string;

    /** Recommended action */
    action: string;

    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'urgent';

    /** Suggested content types */
    suggestedContentTypes: ContentItem['type'][];

    /** Suggested topics */
    suggestedTopics: string[];

    /** Expected impact */
    expectedImpact: string;

    /** Estimated effort */
    effort: 'low' | 'medium' | 'high';

    /** Timeline suggestion */
    timeline: string;
}

/**
 * Evidence supporting a gap
 */
export interface GapEvidence {
    /** Evidence type */
    type: 'missing-topic' | 'low-coverage' | 'competitor-comparison' | 'best-practice' | 'audience-need';

    /** Description */
    description: string;

    /** Supporting data */
    data: any;

    /** Source */
    source: string;

    /** Relevance score (0-1) */
    relevance: number;
}

/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
    /** Detected gaps */
    gaps: ContentGap[];

    /** Total gaps found */
    totalGaps: number;

    /** Coverage score (0-1) */
    coverageScore: number;

    /** Analysis summary */
    summary: {
        topicCoverage: number;
        formatDiversity: number;
        audienceReach: number;
        contentFrequency: number;
        overallHealth: number;
    };

    /** Analysis metadata */
    metadata: {
        /** Analysis duration in ms */
        analysisTime: number;

        /** Content items analyzed */
        itemsAnalyzed: number;

        /** Timestamp */
        timestamp: string;
    };
}

/**
 * Gap tracking record for DynamoDB
 */
export interface GapTrackingRecord {
    /** Primary key: USER#userId */
    PK: string;

    /** Sort key: GAP#gapId */
    SK: string;

    /** Entity type */
    entityType: 'GapTrackingRecord';

    /** Gap data */
    gap: ContentGap;

    /** User ID */
    userId: string;

    /** Agent profile */
    agentProfile?: AgentProfile;

    /** Created timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt: string;

    /** TTL for automatic cleanup */
    ttl?: number;
}

/**
 * Best practices for content coverage
 */
interface BestPractices {
    /** Recommended topics by specialization */
    topicsBySpecialization: Record<string, string[]>;

    /** Recommended content types */
    contentTypes: ContentItem['type'][];

    /** Minimum content frequency (items per month) */
    minFrequency: number;

    /** Recommended audience segments */
    audienceSegments: string[];

    /** Quality benchmarks */
    qualityBenchmarks: {
        minWordCount: Record<ContentItem['type'], number>;
        minKeywords: number;
        minTopicsPerMonth: number;
    };
}

/**
 * Configuration for gap identification
 */
export interface GapIdentifierConfig {
    /** Minimum confidence threshold (0-1) */
    minConfidence: number;

    /** Minimum impact threshold (0-1) */
    minImpact: number;

    /** Analysis time window (in days) */
    analysisWindow: number;

    /** Best practices to compare against */
    bestPractices: BestPractices;

    /** Enable competitor comparison */
    enableCompetitorComparison: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GapIdentifierConfig = {
    minConfidence: 0.6,
    minImpact: 0.4,
    analysisWindow: 90,
    bestPractices: {
        topicsBySpecialization: {
            'luxury homes': [
                'luxury market trends',
                'high-end property features',
                'luxury buyer profiles',
                'investment properties',
                'estate planning',
            ],
            'first-time buyers': [
                'home buying process',
                'financing options',
                'down payment assistance',
                'neighborhood guides',
                'home inspection tips',
            ],
            'residential': [
                'market updates',
                'home staging tips',
                'pricing strategies',
                'local schools',
                'community events',
            ],
            'commercial': [
                'commercial market analysis',
                'investment opportunities',
                'zoning regulations',
                'lease negotiations',
                'property management',
            ],
        },
        contentTypes: [
            'blog-post',
            'social-media',
            'video-script',
            'market-update',
            'newsletter',
            'guide',
        ],
        minFrequency: 8, // 8 pieces per month
        audienceSegments: [
            'buyers',
            'sellers',
            'investors',
            'first-time buyers',
            'luxury clients',
        ],
        qualityBenchmarks: {
            minWordCount: {
                'blog-post': 800,
                'social-media': 100,
                'video-script': 500,
                'listing-description': 200,
                'market-update': 600,
                'newsletter': 1000,
                'guide': 1500,
            },
            minKeywords: 5,
            minTopicsPerMonth: 10,
        },
    },
    enableCompetitorComparison: false,
};

/**
 * GapIdentifier - Analyzes content libraries for gaps
 */
export class GapIdentifier {
    private config: GapIdentifierConfig;

    constructor(config: Partial<GapIdentifierConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            bestPractices: {
                ...DEFAULT_CONFIG.bestPractices,
                ...config.bestPractices,
            },
        };
    }

    /**
     * Analyze content library for gaps
     */
    async analyzeLibrary(
        contentLibrary: ContentItem[],
        agentProfile: AgentProfile
    ): Promise<GapAnalysisResult> {
        const startTime = Date.now();

        // Filter content within analysis window
        const recentContent = this.filterRecentContent(
            contentLibrary,
            this.config.analysisWindow
        );

        // Detect various types of gaps
        const topicGaps = await this.detectTopicGaps(recentContent, agentProfile);
        const formatGaps = await this.detectFormatGaps(recentContent);
        const audienceGaps = await this.detectAudienceGaps(recentContent, agentProfile);
        const frequencyGaps = await this.detectFrequencyGaps(recentContent);
        const qualityGaps = await this.detectQualityGaps(recentContent);

        // Combine all gaps
        const allGaps = [
            ...topicGaps,
            ...formatGaps,
            ...audienceGaps,
            ...frequencyGaps,
            ...qualityGaps,
        ];

        // Filter by confidence and impact
        const significantGaps = allGaps.filter(
            gap =>
                gap.confidence >= this.config.minConfidence &&
                gap.impact >= this.config.minImpact
        );

        // Calculate coverage scores
        const summary = this.calculateCoverageSummary(recentContent, significantGaps);

        const analysisTime = Date.now() - startTime;

        return {
            gaps: significantGaps,
            totalGaps: significantGaps.length,
            coverageScore: summary.overallHealth,
            summary,
            metadata: {
                analysisTime,
                itemsAnalyzed: recentContent.length,
                timestamp: new Date().toISOString(),
            },
        };
    }

    /**
     * Generate topic suggestions for a gap
     */
    async generateTopicSuggestions(
        gap: ContentGap,
        agentProfile: AgentProfile
    ): Promise<string[]> {
        const suggestions: string[] = [];

        // Get recommended topics for agent's specialization
        for (const spec of agentProfile.specialization) {
            const topics = this.config.bestPractices.topicsBySpecialization[spec] || [];
            suggestions.push(...topics);
        }

        // Add gap-specific missing elements
        suggestions.push(...gap.missingElements);

        // Remove duplicates and return
        return Array.from(new Set(suggestions));
    }

    /**
     * Track gap resolution
     */
    async trackGapResolution(
        gapId: string,
        contentCreated: string[],
        resolvedBy: string
    ): Promise<ContentGap> {
        // This would typically update the gap in the database
        // For now, we'll return a mock resolved gap
        const resolvedGap: ContentGap = {
            id: gapId,
            type: 'topic',
            title: 'Resolved Gap',
            description: 'Gap has been resolved',
            severity: 'low',
            impact: 0.5,
            confidence: 0.8,
            missingElements: [],
            recommendations: [],
            evidence: [],
            detectedAt: new Date().toISOString(),
            status: 'resolved',
            resolution: {
                resolvedAt: new Date().toISOString(),
                resolvedBy,
                contentCreated,
            },
        };

        return resolvedGap;
    }

    /**
     * Monitor gaps over time
     */
    async monitorGaps(
        userId: string,
        historicalGaps: ContentGap[]
    ): Promise<{
        newGaps: ContentGap[];
        resolvedGaps: ContentGap[];
        persistentGaps: ContentGap[];
        trend: 'improving' | 'stable' | 'declining';
    }> {
        // Group gaps by status
        const newGaps = historicalGaps.filter(g => g.status === 'open');
        const resolvedGaps = historicalGaps.filter(g => g.status === 'resolved');
        const persistentGaps = historicalGaps.filter(
            g => g.status === 'open' && this.isOldGap(g)
        );

        // Determine trend
        const trend = this.determineTrend(historicalGaps);

        return {
            newGaps,
            resolvedGaps,
            persistentGaps,
            trend,
        };
    }

    /**
     * Filter content within analysis window
     */
    private filterRecentContent(
        content: ContentItem[],
        windowDays: number
    ): ContentItem[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - windowDays);

        return content.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= cutoffDate;
        });
    }

    /**
     * Detect topic gaps
     */
    private async detectTopicGaps(
        content: ContentItem[],
        agentProfile: AgentProfile
    ): Promise<ContentGap[]> {
        const gaps: ContentGap[] = [];

        // Get all topics covered
        const coveredTopics = new Set<string>();
        content.forEach(item => {
            item.topics.forEach(topic => coveredTopics.add(topic.toLowerCase()));
        });

        // Check against recommended topics for each specialization
        for (const spec of agentProfile.specialization) {
            const recommendedTopics =
                this.config.bestPractices.topicsBySpecialization[spec] || [];

            const missingTopics = recommendedTopics.filter(
                topic => !coveredTopics.has(topic.toLowerCase())
            );

            if (missingTopics.length > 0) {
                const gap: ContentGap = {
                    id: this.generateGapId(),
                    type: 'topic',
                    title: `Missing ${spec} Topics`,
                    description: `Your content library is missing key topics for ${spec} specialization`,
                    severity: this.calculateSeverity(
                        missingTopics.length,
                        recommendedTopics.length
                    ),
                    impact: missingTopics.length / recommendedTopics.length,
                    confidence: 0.9,
                    missingElements: missingTopics,
                    recommendations: this.generateTopicRecommendations(missingTopics, spec),
                    evidence: [
                        {
                            type: 'missing-topic',
                            description: `${missingTopics.length} of ${recommendedTopics.length} recommended topics are missing`,
                            data: { missingTopics, recommendedTopics },
                            source: 'best-practices',
                            relevance: 0.9,
                        },
                    ],
                    detectedAt: new Date().toISOString(),
                    status: 'open',
                };

                gaps.push(gap);
            }
        }

        return gaps;
    }

    /**
     * Detect format/content type gaps
     */
    private async detectFormatGaps(content: ContentItem[]): Promise<ContentGap[]> {
        const gaps: ContentGap[] = [];

        // Count content by type
        const typeCounts = new Map<ContentItem['type'], number>();
        content.forEach(item => {
            typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
        });

        // Check for missing or underrepresented types
        const missingTypes: ContentItem['type'][] = [];
        const underrepresentedTypes: ContentItem['type'][] = [];

        for (const type of this.config.bestPractices.contentTypes) {
            const count = typeCounts.get(type) || 0;

            if (count === 0) {
                missingTypes.push(type);
            } else if (count < 3) {
                // Less than 3 pieces in the window
                underrepresentedTypes.push(type);
            }
        }

        if (missingTypes.length > 0) {
            gaps.push({
                id: this.generateGapId(),
                type: 'format',
                title: 'Missing Content Formats',
                description: 'Your content library lacks diversity in content formats',
                severity: 'medium',
                impact: missingTypes.length / this.config.bestPractices.contentTypes.length,
                confidence: 0.85,
                missingElements: missingTypes,
                recommendations: this.generateFormatRecommendations(missingTypes),
                evidence: [
                    {
                        type: 'low-coverage',
                        description: `${missingTypes.length} content formats are completely missing`,
                        data: { missingTypes, typeCounts: Object.fromEntries(typeCounts) },
                        source: 'library-analysis',
                        relevance: 0.85,
                    },
                ],
                detectedAt: new Date().toISOString(),
                status: 'open',
            });
        }

        if (underrepresentedTypes.length > 0) {
            gaps.push({
                id: this.generateGapId(),
                type: 'format',
                title: 'Underrepresented Content Formats',
                description: 'Some content formats have very low representation',
                severity: 'low',
                impact: 0.3,
                confidence: 0.75,
                missingElements: underrepresentedTypes,
                recommendations: this.generateFormatRecommendations(underrepresentedTypes),
                evidence: [
                    {
                        type: 'low-coverage',
                        description: `${underrepresentedTypes.length} content formats have less than 3 pieces`,
                        data: { underrepresentedTypes, typeCounts: Object.fromEntries(typeCounts) },
                        source: 'library-analysis',
                        relevance: 0.75,
                    },
                ],
                detectedAt: new Date().toISOString(),
                status: 'open',
            });
        }

        return gaps;
    }

    /**
     * Detect audience gaps
     */
    private async detectAudienceGaps(
        content: ContentItem[],
        agentProfile: AgentProfile
    ): Promise<ContentGap[]> {
        const gaps: ContentGap[] = [];

        // Get all audiences covered
        const coveredAudiences = new Set<string>();
        content.forEach(item => {
            item.targetAudience?.forEach(audience =>
                coveredAudiences.add(audience.toLowerCase())
            );
        });

        // Check against recommended audience segments
        const missingAudiences = this.config.bestPractices.audienceSegments.filter(
            audience => !coveredAudiences.has(audience.toLowerCase())
        );

        if (missingAudiences.length > 0) {
            gaps.push({
                id: this.generateGapId(),
                type: 'audience',
                title: 'Missing Audience Segments',
                description: 'Your content does not address all key audience segments',
                severity: this.calculateSeverity(
                    missingAudiences.length,
                    this.config.bestPractices.audienceSegments.length
                ),
                impact:
                    missingAudiences.length /
                    this.config.bestPractices.audienceSegments.length,
                confidence: 0.8,
                missingElements: missingAudiences,
                recommendations: this.generateAudienceRecommendations(missingAudiences),
                evidence: [
                    {
                        type: 'audience-need',
                        description: `${missingAudiences.length} audience segments are not addressed`,
                        data: { missingAudiences, coveredAudiences: Array.from(coveredAudiences) },
                        source: 'audience-analysis',
                        relevance: 0.8,
                    },
                ],
                detectedAt: new Date().toISOString(),
                status: 'open',
            });
        }

        return gaps;
    }

    /**
     * Detect frequency gaps
     */
    private async detectFrequencyGaps(content: ContentItem[]): Promise<ContentGap[]> {
        const gaps: ContentGap[] = [];

        // Calculate content frequency (items per month)
        const monthsInWindow = this.config.analysisWindow / 30;
        const itemsPerMonth = content.length / monthsInWindow;

        if (itemsPerMonth < this.config.bestPractices.minFrequency) {
            const deficit = this.config.bestPractices.minFrequency - itemsPerMonth;

            gaps.push({
                id: this.generateGapId(),
                type: 'frequency',
                title: 'Low Content Frequency',
                description: 'Your content publishing frequency is below recommended levels',
                severity: deficit > 5 ? 'high' : 'medium',
                impact: Math.min(deficit / this.config.bestPractices.minFrequency, 1),
                confidence: 0.95,
                missingElements: [
                    `Need ${Math.ceil(deficit)} more pieces per month`,
                ],
                recommendations: this.generateFrequencyRecommendations(deficit),
                evidence: [
                    {
                        type: 'best-practice',
                        description: `Publishing ${itemsPerMonth.toFixed(1)} items/month vs recommended ${this.config.bestPractices.minFrequency}`,
                        data: { currentFrequency: itemsPerMonth, recommendedFrequency: this.config.bestPractices.minFrequency },
                        source: 'frequency-analysis',
                        relevance: 0.95,
                    },
                ],
                detectedAt: new Date().toISOString(),
                status: 'open',
            });
        }

        return gaps;
    }

    /**
     * Detect quality gaps
     */
    private async detectQualityGaps(content: ContentItem[]): Promise<ContentGap[]> {
        const gaps: ContentGap[] = [];

        // Check content quality metrics
        const lowQualityItems: ContentItem[] = [];

        for (const item of content) {
            const minWordCount = this.config.bestPractices.qualityBenchmarks.minWordCount[item.type];
            const wordCount = item.content.split(/\s+/).length;

            if (wordCount < minWordCount) {
                lowQualityItems.push(item);
            }
        }

        if (lowQualityItems.length > content.length * 0.2) {
            // More than 20% are low quality
            gaps.push({
                id: this.generateGapId(),
                type: 'quality',
                title: 'Content Quality Issues',
                description: 'A significant portion of your content does not meet quality benchmarks',
                severity: 'medium',
                impact: lowQualityItems.length / content.length,
                confidence: 0.85,
                missingElements: [
                    `${lowQualityItems.length} items below quality standards`,
                ],
                recommendations: this.generateQualityRecommendations(lowQualityItems),
                evidence: [
                    {
                        type: 'best-practice',
                        description: `${lowQualityItems.length} of ${content.length} items are below minimum word count`,
                        data: { lowQualityItems: lowQualityItems.map(i => i.id) },
                        source: 'quality-analysis',
                        relevance: 0.85,
                    },
                ],
                detectedAt: new Date().toISOString(),
                status: 'open',
            });
        }

        return gaps;
    }

    /**
     * Calculate coverage summary
     */
    private calculateCoverageSummary(
        content: ContentItem[],
        gaps: ContentGap[]
    ): GapAnalysisResult['summary'] {
        // Calculate individual scores
        const topicGaps = gaps.filter(g => g.type === 'topic');
        const formatGaps = gaps.filter(g => g.type === 'format');
        const audienceGaps = gaps.filter(g => g.type === 'audience');
        const frequencyGaps = gaps.filter(g => g.type === 'frequency');

        const topicCoverage = 1 - (topicGaps.length > 0 ? topicGaps[0].impact : 0);
        const formatDiversity = 1 - (formatGaps.length > 0 ? formatGaps[0].impact : 0);
        const audienceReach = 1 - (audienceGaps.length > 0 ? audienceGaps[0].impact : 0);
        const contentFrequency = 1 - (frequencyGaps.length > 0 ? frequencyGaps[0].impact : 0);

        const overallHealth =
            (topicCoverage + formatDiversity + audienceReach + contentFrequency) / 4;

        return {
            topicCoverage,
            formatDiversity,
            audienceReach,
            contentFrequency,
            overallHealth,
        };
    }

    /**
     * Calculate severity based on gap size
     */
    private calculateSeverity(
        missing: number,
        total: number
    ): ContentGap['severity'] {
        const ratio = missing / total;

        if (ratio > 0.7) return 'critical';
        if (ratio > 0.5) return 'high';
        if (ratio > 0.3) return 'medium';
        return 'low';
    }

    /**
     * Generate topic recommendations
     */
    private generateTopicRecommendations(
        missingTopics: string[],
        specialization: string
    ): GapRecommendation[] {
        return missingTopics.slice(0, 3).map((topic, index) => ({
            id: this.generateRecommendationId(),
            action: `Create content about ${topic}`,
            priority: index === 0 ? 'high' : 'medium',
            suggestedContentTypes: ['blog-post', 'social-media'],
            suggestedTopics: [topic],
            expectedImpact: `Improve ${specialization} topic coverage`,
            effort: 'medium',
            timeline: '1-2 weeks',
        }));
    }

    /**
     * Generate format recommendations
     */
    private generateFormatRecommendations(
        missingFormats: ContentItem['type'][]
    ): GapRecommendation[] {
        return missingFormats.slice(0, 2).map(format => ({
            id: this.generateRecommendationId(),
            action: `Create ${format} content`,
            priority: 'medium',
            suggestedContentTypes: [format],
            suggestedTopics: [],
            expectedImpact: 'Increase content format diversity',
            effort: 'medium',
            timeline: '1 week',
        }));
    }

    /**
     * Generate audience recommendations
     */
    private generateAudienceRecommendations(
        missingAudiences: string[]
    ): GapRecommendation[] {
        return missingAudiences.slice(0, 2).map(audience => ({
            id: this.generateRecommendationId(),
            action: `Create content targeting ${audience}`,
            priority: 'medium',
            suggestedContentTypes: ['blog-post', 'guide'],
            suggestedTopics: [],
            expectedImpact: `Reach ${audience} segment`,
            effort: 'medium',
            timeline: '1-2 weeks',
        }));
    }

    /**
     * Generate frequency recommendations
     */
    private generateFrequencyRecommendations(deficit: number): GapRecommendation[] {
        return [
            {
                id: this.generateRecommendationId(),
                action: `Increase publishing frequency by ${Math.ceil(deficit)} items per month`,
                priority: deficit > 5 ? 'high' : 'medium',
                suggestedContentTypes: ['social-media', 'market-update'],
                suggestedTopics: [],
                expectedImpact: 'Maintain consistent audience engagement',
                effort: 'high',
                timeline: 'ongoing',
            },
        ];
    }

    /**
     * Generate quality recommendations
     */
    private generateQualityRecommendations(
        lowQualityItems: ContentItem[]
    ): GapRecommendation[] {
        return [
            {
                id: this.generateRecommendationId(),
                action: 'Review and enhance content that falls below quality benchmarks',
                priority: 'medium',
                suggestedContentTypes: [],
                suggestedTopics: [],
                expectedImpact: 'Improve overall content quality and engagement',
                effort: 'high',
                timeline: '2-4 weeks',
            },
        ];
    }

    /**
     * Check if gap is old (persistent)
     */
    private isOldGap(gap: ContentGap): boolean {
        const gapAge = Date.now() - new Date(gap.detectedAt).getTime();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        return gapAge > thirtyDaysMs;
    }

    /**
     * Determine trend from historical gaps
     */
    private determineTrend(
        gaps: ContentGap[]
    ): 'improving' | 'stable' | 'declining' {
        const recentGaps = gaps.filter(g => !this.isOldGap(g));
        const oldGaps = gaps.filter(g => this.isOldGap(g));

        if (recentGaps.length < oldGaps.length * 0.7) return 'improving';
        if (recentGaps.length > oldGaps.length * 1.3) return 'declining';
        return 'stable';
    }

    /**
     * Generate unique IDs
     */
    private generateGapId(): string {
        return `gap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateRecommendationId(): string {
        return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Create a GapIdentifier instance with default configuration
 */
export function createGapIdentifier(
    config?: Partial<GapIdentifierConfig>
): GapIdentifier {
    return new GapIdentifier(config);
}
