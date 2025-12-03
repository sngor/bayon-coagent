/**
 * Advantage Capitalizer
 * 
 * Identifies competitive advantages and generates content strategies
 * to leverage those advantages for market differentiation.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import {
    CompetitiveAdvantage,
    CompetitorAnalysisResult,
    ContentRecommendation,
} from './types';
import { getRepository } from '@/aws/dynamodb/repository';
import { AgentContentSummary } from './gap-analyzer';

/**
 * Advantage tracking record
 */
export interface AdvantageTrackingRecord {
    /** Primary key: USER#userId */
    PK: string;
    /** Sort key: ADVANTAGE#advantageId */
    SK: string;
    /** Entity type */
    entityType: 'AdvantageTrackingRecord';
    /** Advantage data */
    advantage: CompetitiveAdvantage;
    /** Capitalization strategies */
    strategies: CapitalizationStrategy[];
    /** Performance metrics */
    performance?: AdvantagePerformance;
    /** Created timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
    /** TTL for automatic cleanup (365 days) */
    ttl: number;
}

/**
 * Capitalization strategy for an advantage
 */
export interface CapitalizationStrategy {
    id: string;
    advantageId: string;
    name: string;
    description: string;
    contentRecommendations: ContentRecommendation[];
    messagingGuidelines: string[];
    channels: string[];
    targetAudience: string;
    expectedImpact: number;
    implementationSteps: string[];
    successMetrics: string[];
    status: 'planned' | 'in-progress' | 'completed' | 'paused';
    createdAt: string;
    updatedAt: string;
}

/**
 * Advantage performance metrics
 */
export interface AdvantagePerformance {
    advantageId: string;
    contentCreated: number;
    engagementRate: number;
    reachIncrease: number;
    leadGeneration: number;
    brandAwareness: number;
    competitiveGap: number;
    lastMeasured: string;
}

/**
 * Advantage identification result
 */
export interface AdvantageIdentificationResult {
    advantages: CompetitiveAdvantage[];
    summary: {
        totalAdvantages: number;
        strongAdvantages: number;
        sustainableAdvantages: number;
        topAdvantages: CompetitiveAdvantage[];
    };
    timestamp: string;
}

/**
 * Strategy suggestion
 */
export interface StrategySuggestion {
    advantageId: string;
    advantageTitle: string;
    strategies: CapitalizationStrategy[];
    priorityOrder: number;
    estimatedImpact: number;
    quickWins: string[];
    longTermActions: string[];
}

/**
 * AdvantageCapitalizer - Identifies and capitalizes on competitive advantages
 */
export class AdvantageCapitalizer {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;

    constructor() {
        this.client = getBedrockClient();
        this.repository = getRepository();
    }

    /**
     * Identify competitive advantages
     */
    async identifyAdvantages(
        userId: string,
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<AdvantageIdentificationResult> {
        const advantages: CompetitiveAdvantage[] = [];

        // Identify content quality advantages
        const qualityAdvantages = this.identifyQualityAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...qualityAdvantages);

        // Identify frequency advantages
        const frequencyAdvantages = this.identifyFrequencyAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...frequencyAdvantages);

        // Identify engagement advantages
        const engagementAdvantages = this.identifyEngagementAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...engagementAdvantages);

        // Identify reach advantages
        const reachAdvantages = this.identifyReachAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...reachAdvantages);

        // Identify specialization advantages
        const specializationAdvantages = this.identifySpecializationAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...specializationAdvantages);

        // Identify innovation advantages
        const innovationAdvantages = this.identifyInnovationAdvantages(
            agentSummary,
            competitorAnalyses
        );
        advantages.push(...innovationAdvantages);

        // Store advantages
        for (const advantage of advantages) {
            await this.storeAdvantage(userId, advantage);
        }

        // Calculate summary
        const summary = this.calculateSummary(advantages);

        return {
            advantages,
            summary,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Identify content quality advantages
     */
    private identifyQualityAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        // Compare content quality
        const avgCompetitorQuality = competitorAnalyses.reduce(
            (sum, a) => sum + (a.summary.averageEngagement / a.summary.totalContent || 0),
            0
        ) / competitorAnalyses.length;

        const agentQualityScore = agentSummary.contentQuality || 0;

        if (agentQualityScore > avgCompetitorQuality * 1.2) {
            const strength = Math.min((agentQualityScore - avgCompetitorQuality) / avgCompetitorQuality, 1.0);

            advantages.push({
                id: `advantage_quality_${Date.now()}`,
                type: 'content-quality',
                title: 'Superior Content Quality',
                description: `Your content quality score (${agentQualityScore.toFixed(2)}) significantly exceeds the market average (${avgCompetitorQuality.toFixed(2)}), indicating higher value and engagement per piece.`,
                strength,
                capitalizationStrategy: 'Emphasize quality over quantity in marketing. Showcase your best work prominently and use it to attract high-value clients.',
                recommendedActions: [
                    'Create case studies highlighting your best content and its results',
                    'Develop a content quality framework to maintain standards',
                    'Use high-quality content as lead magnets',
                    'Promote content quality as a key differentiator in your marketing',
                ],
                sustainability: strength > 0.5 ? 'long-term' : 'sustainable',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Identify frequency advantages
     */
    private identifyFrequencyAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        const avgCompetitorFrequency = competitorAnalyses.reduce(
            (sum, a) => sum + a.summary.postingFrequency,
            0
        ) / competitorAnalyses.length;

        if (agentSummary.postingFrequency > avgCompetitorFrequency * 1.3) {
            const strength = Math.min((agentSummary.postingFrequency - avgCompetitorFrequency) / avgCompetitorFrequency, 1.0);

            advantages.push({
                id: `advantage_frequency_${Date.now()}`,
                type: 'frequency',
                title: 'Higher Posting Frequency',
                description: `You post ${agentSummary.postingFrequency.toFixed(1)} times per week compared to the market average of ${avgCompetitorFrequency.toFixed(1)}, giving you greater visibility and top-of-mind awareness.`,
                strength,
                capitalizationStrategy: 'Leverage your consistent presence to build stronger relationships and stay top-of-mind with your audience.',
                recommendedActions: [
                    'Highlight your active presence in your marketing materials',
                    'Create a content series that showcases your consistency',
                    'Use frequency to test and optimize content strategies faster',
                    'Build anticipation with regular content schedules',
                ],
                sustainability: 'sustainable',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Identify engagement advantages
     */
    private identifyEngagementAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        const avgCompetitorEngagement = competitorAnalyses.reduce(
            (sum, a) => sum + a.summary.averageEngagement,
            0
        ) / competitorAnalyses.length;

        if (agentSummary.averageEngagement > avgCompetitorEngagement * 1.25) {
            const strength = Math.min((agentSummary.averageEngagement - avgCompetitorEngagement) / avgCompetitorEngagement, 1.0);

            advantages.push({
                id: `advantage_engagement_${Date.now()}`,
                type: 'engagement',
                title: 'Superior Audience Engagement',
                description: `Your average engagement (${agentSummary.averageEngagement.toFixed(1)}) is significantly higher than competitors (${avgCompetitorEngagement.toFixed(1)}), indicating stronger audience connection.`,
                strength,
                capitalizationStrategy: 'Use your engaged audience as social proof and leverage their advocacy to expand your reach.',
                recommendedActions: [
                    'Showcase engagement metrics in your marketing',
                    'Create user-generated content campaigns',
                    'Develop referral programs leveraging engaged followers',
                    'Use testimonials and reviews from engaged audience',
                ],
                sustainability: 'long-term',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Identify reach advantages
     */
    private identifyReachAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        // Compare platform diversity
        const avgCompetitorPlatforms = competitorAnalyses.reduce(
            (sum, a) => sum + a.summary.mostActiveChannels.length,
            0
        ) / competitorAnalyses.length;

        if (agentSummary.platforms.length > avgCompetitorPlatforms * 1.3) {
            const strength = Math.min((agentSummary.platforms.length - avgCompetitorPlatforms) / avgCompetitorPlatforms, 1.0);

            advantages.push({
                id: `advantage_reach_${Date.now()}`,
                type: 'reach',
                title: 'Broader Platform Presence',
                description: `You maintain an active presence on ${agentSummary.platforms.length} platforms compared to the average of ${avgCompetitorPlatforms.toFixed(1)}, expanding your reach and audience diversity.`,
                strength,
                capitalizationStrategy: 'Leverage your multi-platform presence to reach different audience segments and maximize visibility.',
                recommendedActions: [
                    'Create cross-platform campaigns that amplify your message',
                    'Highlight your accessibility across multiple channels',
                    'Develop platform-specific content strategies',
                    'Use platform diversity as a service differentiator',
                ],
                sustainability: 'sustainable',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Identify specialization advantages
     */
    private identifySpecializationAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        // Identify unique topics
        const competitorTopics = new Set<string>();
        competitorAnalyses.forEach(a => {
            a.summary.topTopics.forEach(topic => competitorTopics.add(topic));
        });

        const uniqueTopics = agentSummary.topTopics.filter(
            topic => !competitorTopics.has(topic)
        );

        if (uniqueTopics.length > 0) {
            const strength = Math.min(uniqueTopics.length / agentSummary.topTopics.length, 1.0);

            advantages.push({
                id: `advantage_specialization_${Date.now()}`,
                type: 'specialization',
                title: 'Unique Content Specialization',
                description: `You cover ${uniqueTopics.length} unique topics that competitors aren't addressing: ${uniqueTopics.slice(0, 3).join(', ')}, positioning you as a specialist in these areas.`,
                strength,
                capitalizationStrategy: 'Position yourself as the go-to expert in your unique specialization areas and build thought leadership.',
                recommendedActions: [
                    'Create comprehensive content series on unique topics',
                    'Develop signature frameworks or methodologies',
                    'Speak at events or webinars on specialized topics',
                    'Build partnerships based on unique expertise',
                ],
                sustainability: 'long-term',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Identify innovation advantages
     */
    private identifyInnovationAdvantages(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): CompetitiveAdvantage[] {
        const advantages: CompetitiveAdvantage[] = [];

        if (competitorAnalyses.length === 0) {
            return advantages;
        }

        // Compare content type diversity
        const avgCompetitorTypes = competitorAnalyses.reduce(
            (sum, a) => sum + Object.keys(a.summary.contentTypes).length,
            0
        ) / competitorAnalyses.length;

        const agentContentTypes = Object.keys(agentSummary.contentTypes).length;

        if (agentContentTypes > avgCompetitorTypes * 1.4) {
            const strength = Math.min((agentContentTypes - avgCompetitorTypes) / avgCompetitorTypes, 1.0);

            advantages.push({
                id: `advantage_innovation_${Date.now()}`,
                type: 'innovation',
                title: 'Innovative Content Formats',
                description: `You utilize ${agentContentTypes} different content formats compared to the average of ${avgCompetitorTypes.toFixed(1)}, demonstrating innovation and adaptability.`,
                strength,
                capitalizationStrategy: 'Showcase your innovative approach and willingness to experiment with new formats to stay ahead of trends.',
                recommendedActions: [
                    'Highlight your innovative content approach in marketing',
                    'Create behind-the-scenes content showing your process',
                    'Position yourself as a forward-thinking industry leader',
                    'Share insights on content innovation with your audience',
                ],
                sustainability: 'sustainable',
                identifiedAt: new Date().toISOString(),
            });
        }

        return advantages;
    }

    /**
     * Calculate summary statistics
     */
    private calculateSummary(advantages: CompetitiveAdvantage[]): {
        totalAdvantages: number;
        strongAdvantages: number;
        sustainableAdvantages: number;
        topAdvantages: CompetitiveAdvantage[];
    } {
        const strongAdvantages = advantages.filter(a => a.strength >= 0.7).length;
        const sustainableAdvantages = advantages.filter(
            a => a.sustainability === 'sustainable' || a.sustainability === 'long-term'
        ).length;

        // Sort by strength and take top 3
        const topAdvantages = [...advantages]
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 3);

        return {
            totalAdvantages: advantages.length,
            strongAdvantages,
            sustainableAdvantages,
            topAdvantages,
        };
    }

    /**
     * Generate strategy suggestions for advantages
     */
    async generateStrategySuggestions(
        userId: string,
        advantages: CompetitiveAdvantage[]
    ): Promise<StrategySuggestion[]> {
        const suggestions: StrategySuggestion[] = [];

        // Sort advantages by strength
        const sortedAdvantages = [...advantages].sort((a, b) => b.strength - a.strength);

        for (let i = 0; i < sortedAdvantages.length; i++) {
            const advantage = sortedAdvantages[i];

            // Generate strategies using AI
            const strategies = await this.generateCapitalizationStrategies(advantage);

            // Identify quick wins and long-term actions
            const { quickWins, longTermActions } = this.categorizeActions(advantage);

            suggestions.push({
                advantageId: advantage.id,
                advantageTitle: advantage.title,
                strategies,
                priorityOrder: i + 1,
                estimatedImpact: advantage.strength,
                quickWins,
                longTermActions,
            });
        }

        return suggestions;
    }

    /**
     * Generate capitalization strategies using AI
     */
    private async generateCapitalizationStrategies(
        advantage: CompetitiveAdvantage
    ): Promise<CapitalizationStrategy[]> {
        const prompt = `Create detailed strategies to capitalize on this competitive advantage:

Advantage: ${advantage.title}
Type: ${advantage.type}
Description: ${advantage.description}
Strength: ${(advantage.strength * 100).toFixed(0)}%
Sustainability: ${advantage.sustainability}

Current Capitalization Strategy:
${advantage.capitalizationStrategy}

Recommended Actions:
${advantage.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Generate 2-3 comprehensive strategies to leverage this advantage. For each strategy, provide:
1. Strategy name (concise, action-oriented)
2. Detailed description (2-3 sentences)
3. 5-7 content recommendations (with type, topic, message, angle, priority)
4. 5-7 messaging guidelines
5. Recommended channels (platforms/mediums)
6. Target audience description
7. Expected impact (0-1 scale)
8. 5-7 implementation steps
9. 3-5 success metrics

Return as JSON array:
[
  {
    "name": "Strategy name",
    "description": "Description",
    "contentRecommendations": [
      {
        "type": "blog-post|social-media|video|email|etc",
        "topic": "Topic",
        "message": "Key message",
        "angle": "Unique angle",
        "priority": "low|medium|high"
      }
    ],
    "messagingGuidelines": ["guideline 1", ...],
    "channels": ["channel 1", ...],
    "targetAudience": "Audience description",
    "expectedImpact": 0.8,
    "implementationSteps": ["step 1", ...],
    "successMetrics": ["metric 1", ...]
  }
]`;

        try {
            const command = new ConverseCommand({
                modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt }],
                    },
                ],
                inferenceConfig: {
                    maxTokens: 3000,
                    temperature: 0.7,
                },
            });

            const response = await this.client.send(command);
            const responseText = response.output?.message?.content?.[0]?.text || '[]';

            const strategiesData = JSON.parse(responseText);

            return strategiesData.map((data: any, index: number) => ({
                id: `strategy_${advantage.id}_${index}_${Date.now()}`,
                advantageId: advantage.id,
                name: data.name || `Strategy ${index + 1}`,
                description: data.description || '',
                contentRecommendations: data.contentRecommendations || [],
                messagingGuidelines: data.messagingGuidelines || [],
                channels: data.channels || [],
                targetAudience: data.targetAudience || 'General audience',
                expectedImpact: data.expectedImpact || 0.5,
                implementationSteps: data.implementationSteps || [],
                successMetrics: data.successMetrics || [],
                status: 'planned' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Error generating strategies with AI:', error);
            return this.generateFallbackStrategies(advantage);
        }
    }

    /**
     * Generate fallback strategies without AI
     */
    private generateFallbackStrategies(
        advantage: CompetitiveAdvantage
    ): CapitalizationStrategy[] {
        const strategyId = `strategy_${advantage.id}_${Date.now()}`;

        const contentRecs: ContentRecommendation[] = advantage.recommendedActions.slice(0, 3).map((action, i) => ({
            type: 'blog-post',
            topic: advantage.title,
            message: action,
            angle: 'Leverage competitive advantage',
            priority: i === 0 ? 'high' : 'medium',
        }));

        return [
            {
                id: strategyId,
                advantageId: advantage.id,
                name: `Capitalize on ${advantage.title}`,
                description: advantage.capitalizationStrategy,
                contentRecommendations: contentRecs,
                messagingGuidelines: [
                    `Emphasize ${advantage.type} as a key differentiator`,
                    'Use concrete examples and metrics',
                    'Maintain authentic and credible tone',
                    'Connect advantage to client benefits',
                ],
                channels: ['social-media', 'blog', 'email'],
                targetAudience: 'Target market clients',
                expectedImpact: advantage.strength,
                implementationSteps: advantage.recommendedActions,
                successMetrics: [
                    'Engagement rate on advantage-focused content',
                    'Lead generation from advantage messaging',
                    'Brand awareness metrics',
                ],
                status: 'planned',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];
    }

    /**
     * Categorize actions into quick wins and long-term
     */
    private categorizeActions(advantage: CompetitiveAdvantage): {
        quickWins: string[];
        longTermActions: string[];
    } {
        const quickWinKeywords = ['highlight', 'showcase', 'promote', 'share', 'post', 'create'];
        const longTermKeywords = ['develop', 'build', 'establish', 'framework', 'program', 'partnership'];

        const quickWins: string[] = [];
        const longTermActions: string[] = [];

        for (const action of advantage.recommendedActions) {
            const lowerAction = action.toLowerCase();
            const isQuickWin = quickWinKeywords.some(keyword => lowerAction.includes(keyword));
            const isLongTerm = longTermKeywords.some(keyword => lowerAction.includes(keyword));

            if (isQuickWin && !isLongTerm) {
                quickWins.push(action);
            } else if (isLongTerm) {
                longTermActions.push(action);
            } else {
                // Default to quick win if unclear
                quickWins.push(action);
            }
        }

        return { quickWins, longTermActions };
    }

    /**
     * Track advantage performance
     */
    async trackAdvantagePerformance(
        userId: string,
        advantageId: string,
        performance: Partial<AdvantagePerformance>
    ): Promise<void> {
        const record = await this.repository.get<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: `ADVANTAGE#${advantageId}`,
        });

        if (!record) {
            throw new Error(`Advantage ${advantageId} not found`);
        }

        const updatedPerformance: AdvantagePerformance = {
            advantageId,
            contentCreated: performance.contentCreated ?? record.performance?.contentCreated ?? 0,
            engagementRate: performance.engagementRate ?? record.performance?.engagementRate ?? 0,
            reachIncrease: performance.reachIncrease ?? record.performance?.reachIncrease ?? 0,
            leadGeneration: performance.leadGeneration ?? record.performance?.leadGeneration ?? 0,
            brandAwareness: performance.brandAwareness ?? record.performance?.brandAwareness ?? 0,
            competitiveGap: performance.competitiveGap ?? record.performance?.competitiveGap ?? 0,
            lastMeasured: new Date().toISOString(),
        };

        record.performance = updatedPerformance;
        record.updatedAt = new Date().toISOString();

        await this.repository.put(record);
    }

    /**
     * Store advantage in database
     */
    private async storeAdvantage(
        userId: string,
        advantage: CompetitiveAdvantage
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        const ttl = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 365 days

        const record: AdvantageTrackingRecord = {
            PK: `USER#${userId}`,
            SK: `ADVANTAGE#${advantage.id}`,
            entityType: 'AdvantageTrackingRecord',
            advantage,
            strategies: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ttl,
        };

        await this.repository.put(record);
    }

    /**
     * Get advantages for a user
     */
    async getAdvantages(userId: string): Promise<CompetitiveAdvantage[]> {
        const records = await this.repository.query<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'ADVANTAGE#' },
        });

        return records.map(r => r.advantage);
    }

    /**
     * Get advantage with strategies
     */
    async getAdvantageWithStrategies(
        userId: string,
        advantageId: string
    ): Promise<{ advantage: CompetitiveAdvantage; strategies: CapitalizationStrategy[] } | null> {
        const record = await this.repository.get<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: `ADVANTAGE#${advantageId}`,
        });

        if (!record) {
            return null;
        }

        return {
            advantage: record.advantage,
            strategies: record.strategies,
        };
    }

    /**
     * Update strategy status
     */
    async updateStrategyStatus(
        userId: string,
        advantageId: string,
        strategyId: string,
        status: CapitalizationStrategy['status']
    ): Promise<void> {
        const record = await this.repository.get<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: `ADVANTAGE#${advantageId}`,
        });

        if (!record) {
            throw new Error(`Advantage ${advantageId} not found`);
        }

        const strategy = record.strategies.find(s => s.id === strategyId);
        if (!strategy) {
            throw new Error(`Strategy ${strategyId} not found`);
        }

        strategy.status = status;
        strategy.updatedAt = new Date().toISOString();
        record.updatedAt = new Date().toISOString();

        await this.repository.put(record);
    }

    /**
     * Add strategies to advantage
     */
    async addStrategiesToAdvantage(
        userId: string,
        advantageId: string,
        strategies: CapitalizationStrategy[]
    ): Promise<void> {
        const record = await this.repository.get<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: `ADVANTAGE#${advantageId}`,
        });

        if (!record) {
            throw new Error(`Advantage ${advantageId} not found`);
        }

        record.strategies.push(...strategies);
        record.updatedAt = new Date().toISOString();

        await this.repository.put(record);
    }

    /**
     * Get performance summary for all advantages
     */
    async getPerformanceSummary(userId: string): Promise<{
        totalAdvantages: number;
        activeStrategies: number;
        completedStrategies: number;
        averageImpact: number;
        topPerformers: Array<{
            advantage: CompetitiveAdvantage;
            performance: AdvantagePerformance;
        }>;
    }> {
        const records = await this.repository.query<AdvantageTrackingRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'ADVANTAGE#' },
        });

        const totalAdvantages = records.length;
        const activeStrategies = records.reduce(
            (sum, r) => sum + r.strategies.filter(s => s.status === 'in-progress').length,
            0
        );
        const completedStrategies = records.reduce(
            (sum, r) => sum + r.strategies.filter(s => s.status === 'completed').length,
            0
        );

        const recordsWithPerformance = records.filter(r => r.performance);
        const averageImpact = recordsWithPerformance.length > 0
            ? recordsWithPerformance.reduce((sum, r) => sum + (r.performance?.engagementRate || 0), 0) / recordsWithPerformance.length
            : 0;

        const topPerformers = recordsWithPerformance
            .filter(r => r.performance)
            .sort((a, b) => (b.performance!.engagementRate || 0) - (a.performance!.engagementRate || 0))
            .slice(0, 3)
            .map(r => ({
                advantage: r.advantage,
                performance: r.performance!,
            }));

        return {
            totalAdvantages,
            activeStrategies,
            completedStrategies,
            averageImpact,
            topPerformers,
        };
    }
}

/**
 * Create a new AdvantageCapitalizer instance
 */
export function createAdvantageCapitalizer(): AdvantageCapitalizer {
    return new AdvantageCapitalizer();
}
