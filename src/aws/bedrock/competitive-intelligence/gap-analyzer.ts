/**
 * Gap Analyzer
 * 
 * Analyzes competitive gaps between agent and competitors,
 * compares strategies, and provides actionable recommendations.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import {
    CompetitiveGap,
    CompetitorAnalysisResult,
    Competitor,
    CompetitorContent,
    StrategyPattern,
} from './types';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Agent content summary for comparison
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

/**
 * GapAnalyzer - Identifies and analyzes competitive gaps
 */
export class GapAnalyzer {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;

    constructor() {
        this.client = getBedrockClient();
        this.repository = getRepository();
    }

    /**
     * Analyze gaps between agent and competitors
     */
    async analyzeGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        if (competitorAnalyses.length === 0) {
            return [];
        }

        const gaps: CompetitiveGap[] = [];

        // Analyze content gaps
        const contentGaps = await this.analyzeContentGaps(agentSummary, competitorAnalyses);
        gaps.push(...contentGaps);

        // Analyze channel gaps
        const channelGaps = await this.analyzeChannelGaps(agentSummary, competitorAnalyses);
        gaps.push(...channelGaps);

        // Analyze frequency gaps
        const frequencyGaps = await this.analyzeFrequencyGaps(agentSummary, competitorAnalyses);
        gaps.push(...frequencyGaps);

        // Analyze messaging gaps
        const messagingGaps = await this.analyzeMessagingGaps(agentSummary, competitorAnalyses);
        gaps.push(...messagingGaps);

        // Analyze quality gaps
        const qualityGaps = await this.analyzeQualityGaps(agentSummary, competitorAnalyses);
        gaps.push(...qualityGaps);

        // Calculate priority scores
        gaps.forEach(gap => {
            gap.priority = this.calculatePriority(gap);
        });

        // Sort by priority
        gaps.sort((a, b) => b.priority - a.priority);

        return gaps;
    }

    /**
     * Analyze content type gaps
     */
    private async analyzeContentGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        const gaps: CompetitiveGap[] = [];

        // Aggregate competitor content types
        const competitorContentTypes = new Map<string, number>();
        for (const analysis of competitorAnalyses) {
            for (const [type, count] of Object.entries(analysis.summary.contentTypes)) {
                competitorContentTypes.set(
                    type,
                    (competitorContentTypes.get(type) || 0) + count
                );
            }
        }

        // Find missing content types
        for (const [type, competitorCount] of competitorContentTypes.entries()) {
            const agentCount = agentSummary.contentTypes[type] || 0;
            const avgCompetitorCount = competitorCount / competitorAnalyses.length;

            if (agentCount < avgCompetitorCount * 0.5) {
                const gapId = `gap_content_${type}_${Date.now()}`;

                gaps.push({
                    id: gapId,
                    type: 'content',
                    title: `Underutilized Content Type: ${type}`,
                    description: `Competitors are producing ${avgCompetitorCount.toFixed(1)} ${type} pieces on average, while you have ${agentCount}.`,
                    severity: agentCount === 0 ? 'high' : 'medium',
                    competitorApproach: `Regularly publishing ${type} content (avg ${avgCompetitorCount.toFixed(1)} pieces)`,
                    agentApproach: agentCount === 0 ? `Not producing ${type} content` : `Limited ${type} content (${agentCount} pieces)`,
                    recommendation: `Consider adding ${type} to your content mix. Start with ${Math.ceil(avgCompetitorCount * 0.5)} pieces to test effectiveness.`,
                    potentialImpact: 0.7,
                    effortRequired: 'medium',
                    priority: 0,
                    supportingData: [],
                    identifiedAt: new Date().toISOString(),
                });
            }
        }

        // Find topic gaps
        const competitorTopics = new Set<string>();
        for (const analysis of competitorAnalyses) {
            analysis.summary.topTopics.forEach(topic => competitorTopics.add(topic));
        }

        const agentTopics = new Set(agentSummary.topTopics);
        const missingTopics = Array.from(competitorTopics).filter(t => !agentTopics.has(t));

        if (missingTopics.length > 0) {
            const gapId = `gap_topics_${Date.now()}`;

            gaps.push({
                id: gapId,
                type: 'content',
                title: 'Topic Coverage Gaps',
                description: `Competitors are covering ${missingTopics.length} topics that you're not addressing.`,
                severity: missingTopics.length > 5 ? 'high' : 'medium',
                competitorApproach: `Covering topics: ${missingTopics.slice(0, 5).join(', ')}${missingTopics.length > 5 ? '...' : ''}`,
                agentApproach: 'Limited topic diversity',
                recommendation: `Expand content to cover these high-value topics: ${missingTopics.slice(0, 3).join(', ')}`,
                potentialImpact: 0.8,
                effortRequired: 'medium',
                priority: 0,
                supportingData: [],
                identifiedAt: new Date().toISOString(),
            });
        }

        return gaps;
    }

    /**
     * Analyze channel/platform gaps
     */
    private async analyzeChannelGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        const gaps: CompetitiveGap[] = [];

        // Aggregate competitor channels
        const competitorChannels = new Map<string, number>();
        for (const analysis of competitorAnalyses) {
            analysis.summary.mostActiveChannels.forEach(channel => {
                competitorChannels.set(
                    channel,
                    (competitorChannels.get(channel) || 0) + 1
                );
            });
        }

        // Find missing channels
        const agentChannels = new Set(agentSummary.platforms);

        for (const [channel, count] of competitorChannels.entries()) {
            const usage = count / competitorAnalyses.length;

            if (!agentChannels.has(channel) && usage > 0.5) {
                const gapId = `gap_channel_${channel}_${Date.now()}`;

                gaps.push({
                    id: gapId,
                    type: 'channel',
                    title: `Missing Platform: ${channel}`,
                    description: `${Math.round(usage * 100)}% of competitors are active on ${channel}, but you're not present there.`,
                    severity: usage > 0.75 ? 'high' : 'medium',
                    competitorApproach: `Active presence on ${channel}`,
                    agentApproach: `No presence on ${channel}`,
                    recommendation: `Establish a presence on ${channel}. Start with 2-3 posts per week to build audience.`,
                    potentialImpact: 0.75,
                    effortRequired: 'high',
                    priority: 0,
                    supportingData: [],
                    identifiedAt: new Date().toISOString(),
                });
            }
        }

        return gaps;
    }

    /**
     * Analyze posting frequency gaps
     */
    private async analyzeFrequencyGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        const gaps: CompetitiveGap[] = [];

        const avgCompetitorFrequency = competitorAnalyses.reduce(
            (sum, a) => sum + a.summary.postingFrequency,
            0
        ) / competitorAnalyses.length;

        if (agentSummary.postingFrequency < avgCompetitorFrequency * 0.6) {
            const gapId = `gap_frequency_${Date.now()}`;

            gaps.push({
                id: gapId,
                type: 'frequency',
                title: 'Low Posting Frequency',
                description: `You're posting ${agentSummary.postingFrequency.toFixed(1)} times per week vs competitor average of ${avgCompetitorFrequency.toFixed(1)}.`,
                severity: agentSummary.postingFrequency < avgCompetitorFrequency * 0.3 ? 'critical' : 'high',
                competitorApproach: `Posting ${avgCompetitorFrequency.toFixed(1)} times per week`,
                agentApproach: `Posting ${agentSummary.postingFrequency.toFixed(1)} times per week`,
                recommendation: `Increase posting frequency to at least ${(avgCompetitorFrequency * 0.8).toFixed(1)} times per week. Focus on quality over quantity.`,
                potentialImpact: 0.85,
                effortRequired: 'high',
                priority: 0,
                supportingData: [],
                identifiedAt: new Date().toISOString(),
            });
        }

        return gaps;
    }

    /**
     * Analyze messaging and strategy gaps using AI
     */
    private async analyzeMessagingGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        const gaps: CompetitiveGap[] = [];

        // Extract competitor patterns
        const allPatterns: StrategyPattern[] = [];
        for (const analysis of competitorAnalyses) {
            allPatterns.push(...analysis.patterns);
        }

        if (allPatterns.length === 0) {
            return gaps;
        }

        // Group patterns by category
        const patternsByCategory = new Map<string, StrategyPattern[]>();
        for (const pattern of allPatterns) {
            const existing = patternsByCategory.get(pattern.category) || [];
            existing.push(pattern);
            patternsByCategory.set(pattern.category, existing);
        }

        // Analyze each category
        for (const [category, patterns] of patternsByCategory.entries()) {
            if (patterns.length >= 2) {
                const gapId = `gap_messaging_${category}_${Date.now()}`;

                const topPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0];

                gaps.push({
                    id: gapId,
                    type: 'messaging',
                    title: `Messaging Gap: ${category}`,
                    description: `Competitors are using effective ${category} strategies that you may not be leveraging.`,
                    severity: 'medium',
                    competitorApproach: topPattern.description,
                    agentApproach: 'Strategy not identified in current content',
                    recommendation: `Consider adopting: ${topPattern.name}. ${topPattern.evidence[0]?.example || ''}`,
                    potentialImpact: topPattern.effectiveness || 0.6,
                    effortRequired: 'medium',
                    priority: 0,
                    supportingData: [],
                    identifiedAt: new Date().toISOString(),
                });
            }
        }

        return gaps;
    }

    /**
     * Analyze quality gaps
     */
    private async analyzeQualityGaps(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<CompetitiveGap[]> {
        const gaps: CompetitiveGap[] = [];

        const avgCompetitorEngagement = competitorAnalyses.reduce(
            (sum, a) => sum + a.summary.averageEngagement,
            0
        ) / competitorAnalyses.length;

        if (agentSummary.averageEngagement < avgCompetitorEngagement * 0.7) {
            const gapId = `gap_engagement_${Date.now()}`;

            gaps.push({
                id: gapId,
                type: 'quality',
                title: 'Low Engagement Rate',
                description: `Your average engagement (${agentSummary.averageEngagement.toFixed(1)}) is below competitor average (${avgCompetitorEngagement.toFixed(1)}).`,
                severity: 'high',
                competitorApproach: `Achieving ${avgCompetitorEngagement.toFixed(1)} average engagement`,
                agentApproach: `Achieving ${agentSummary.averageEngagement.toFixed(1)} average engagement`,
                recommendation: 'Focus on content quality, timing, and audience targeting. Analyze top-performing competitor content for insights.',
                potentialImpact: 0.9,
                effortRequired: 'medium',
                priority: 0,
                supportingData: [],
                identifiedAt: new Date().toISOString(),
            });
        }

        return gaps;
    }

    /**
     * Compare strategies between agent and competitors
     */
    async compareStrategies(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[]
    ): Promise<StrategyComparison> {
        // Build agent strategy description
        const agentStrategy = this.buildStrategyDescription(
            agentSummary.contentTypes,
            agentSummary.topTopics,
            agentSummary.platforms,
            agentSummary.postingFrequency
        );

        // Build competitor strategies
        const competitorStrategies = new Map<string, StrategyDescription>();
        for (const analysis of competitorAnalyses) {
            const strategy = this.buildStrategyDescription(
                analysis.summary.contentTypes,
                analysis.summary.topTopics,
                analysis.summary.mostActiveChannels,
                analysis.summary.postingFrequency
            );
            competitorStrategies.set(analysis.competitor.name, strategy);
        }

        // Identify differences
        const differences = this.identifyStrategyDifferences(
            agentStrategy,
            Array.from(competitorStrategies.values())
        );

        // Generate recommendations
        const recommendations = this.generateStrategyRecommendations(differences);

        return {
            agentStrategy,
            competitorStrategies,
            differences,
            recommendations,
        };
    }

    /**
     * Build strategy description from data
     */
    private buildStrategyDescription(
        contentTypes: Record<string, number>,
        topTopics: string[],
        channels: string[],
        frequency: number
    ): StrategyDescription {
        const totalContent = Object.values(contentTypes).reduce((sum, count) => sum + count, 0);
        const channelMix: Record<string, number> = {};

        channels.forEach(channel => {
            channelMix[channel] = 1 / channels.length;
        });

        return {
            contentFocus: Object.keys(contentTypes),
            targetAudience: [], // Would need additional data
            messagingThemes: topTopics,
            channelMix,
            postingPattern: {
                frequency,
                bestTimes: [], // Would need additional data
                consistency: 0.8, // Placeholder
            },
            engagementApproach: [],
            uniqueElements: [],
        };
    }

    /**
     * Identify differences between strategies
     */
    private identifyStrategyDifferences(
        agentStrategy: StrategyDescription,
        competitorStrategies: StrategyDescription[]
    ): StrategyDifference[] {
        const differences: StrategyDifference[] = [];

        // Content focus differences
        const competitorContentTypes = new Set<string>();
        competitorStrategies.forEach(s => {
            s.contentFocus.forEach(type => competitorContentTypes.add(type));
        });

        const agentContentTypes = new Set(agentStrategy.contentFocus);
        const missingTypes = Array.from(competitorContentTypes).filter(t => !agentContentTypes.has(t));

        if (missingTypes.length > 0) {
            differences.push({
                category: 'Content Focus',
                agentApproach: `Focusing on: ${agentStrategy.contentFocus.join(', ')}`,
                competitorApproach: `Also using: ${missingTypes.join(', ')}`,
                impact: 'high',
                recommendation: `Diversify content types to include ${missingTypes.slice(0, 2).join(' and ')}`,
            });
        }

        // Channel mix differences
        const competitorChannels = new Set<string>();
        competitorStrategies.forEach(s => {
            Object.keys(s.channelMix).forEach(channel => competitorChannels.add(channel));
        });

        const agentChannels = new Set(Object.keys(agentStrategy.channelMix));
        const missingChannels = Array.from(competitorChannels).filter(c => !agentChannels.has(c));

        if (missingChannels.length > 0) {
            differences.push({
                category: 'Channel Mix',
                agentApproach: `Active on: ${Array.from(agentChannels).join(', ')}`,
                competitorApproach: `Also active on: ${missingChannels.join(', ')}`,
                impact: 'medium',
                recommendation: `Expand to ${missingChannels[0]} to reach wider audience`,
            });
        }

        // Frequency differences
        const avgCompetitorFrequency = competitorStrategies.reduce(
            (sum, s) => sum + s.postingPattern.frequency,
            0
        ) / competitorStrategies.length;

        if (agentStrategy.postingPattern.frequency < avgCompetitorFrequency * 0.7) {
            differences.push({
                category: 'Posting Frequency',
                agentApproach: `${agentStrategy.postingPattern.frequency.toFixed(1)} posts/week`,
                competitorApproach: `${avgCompetitorFrequency.toFixed(1)} posts/week average`,
                impact: 'high',
                recommendation: `Increase posting frequency to at least ${(avgCompetitorFrequency * 0.8).toFixed(1)} posts/week`,
            });
        }

        return differences;
    }

    /**
     * Generate strategy recommendations
     */
    private generateStrategyRecommendations(differences: StrategyDifference[]): string[] {
        const recommendations: string[] = [];

        // Prioritize high-impact differences
        const highImpact = differences.filter(d => d.impact === 'high');
        highImpact.forEach(diff => {
            recommendations.push(diff.recommendation);
        });

        // Add medium-impact if we have room
        if (recommendations.length < 5) {
            const mediumImpact = differences.filter(d => d.impact === 'medium');
            mediumImpact.slice(0, 5 - recommendations.length).forEach(diff => {
                recommendations.push(diff.recommendation);
            });
        }

        return recommendations;
    }

    /**
     * Generate gap visualization data
     */
    async generateVisualization(
        agentSummary: AgentContentSummary,
        competitorAnalyses: CompetitorAnalysisResult[],
        gaps: CompetitiveGap[]
    ): Promise<GapVisualization> {
        // Radar chart data
        const categories = ['Content Volume', 'Engagement', 'Channel Diversity', 'Posting Frequency', 'Topic Coverage'];

        const agentScores = [
            Math.min(agentSummary.totalContent / 100, 1) * 100,
            Math.min(agentSummary.averageEngagement / 100, 1) * 100,
            Math.min(agentSummary.platforms.length / 5, 1) * 100,
            Math.min(agentSummary.postingFrequency / 10, 1) * 100,
            Math.min(agentSummary.topTopics.length / 20, 1) * 100,
        ];

        const competitorAverages = [
            Math.min((competitorAnalyses.reduce((sum, a) => sum + a.summary.totalContent, 0) / competitorAnalyses.length) / 100, 1) * 100,
            Math.min((competitorAnalyses.reduce((sum, a) => sum + a.summary.averageEngagement, 0) / competitorAnalyses.length) / 100, 1) * 100,
            Math.min((competitorAnalyses.reduce((sum, a) => sum + a.summary.mostActiveChannels.length, 0) / competitorAnalyses.length) / 5, 1) * 100,
            Math.min((competitorAnalyses.reduce((sum, a) => sum + a.summary.postingFrequency, 0) / competitorAnalyses.length) / 10, 1) * 100,
            Math.min((competitorAnalyses.reduce((sum, a) => sum + a.summary.topTopics.length, 0) / competitorAnalyses.length) / 20, 1) * 100,
        ];

        const topPerformerScores = competitorAverages.map(score => Math.min(score * 1.3, 100));

        // Bar chart data
        const metrics = ['Posts/Week', 'Avg Engagement', 'Platforms', 'Content Types'];
        const agentValues = [
            agentSummary.postingFrequency,
            agentSummary.averageEngagement,
            agentSummary.platforms.length,
            Object.keys(agentSummary.contentTypes).length,
        ];

        const marketAverages = [
            competitorAnalyses.reduce((sum, a) => sum + a.summary.postingFrequency, 0) / competitorAnalyses.length,
            competitorAnalyses.reduce((sum, a) => sum + a.summary.averageEngagement, 0) / competitorAnalyses.length,
            competitorAnalyses.reduce((sum, a) => sum + a.summary.mostActiveChannels.length, 0) / competitorAnalyses.length,
            competitorAnalyses.reduce((sum, a) => sum + Object.keys(a.summary.contentTypes).length, 0) / competitorAnalyses.length,
        ];

        const gapsData = agentValues.map((val, idx) => marketAverages[idx] - val);

        // Heatmap data (simplified)
        const contentTypes = Array.from(new Set([
            ...Object.keys(agentSummary.contentTypes),
            ...competitorAnalyses.flatMap(a => Object.keys(a.summary.contentTypes)),
        ]));

        const platforms = Array.from(new Set([
            ...agentSummary.platforms,
            ...competitorAnalyses.flatMap(a => a.summary.mostActiveChannels),
        ]));

        const agentCoverage = contentTypes.map(type =>
            platforms.map(platform => agentSummary.contentTypes[type] ? 1 : 0)
        );

        const competitorCoverage = contentTypes.map(type =>
            platforms.map(platform => {
                const count = competitorAnalyses.filter(a =>
                    a.summary.contentTypes[type] && a.summary.mostActiveChannels.includes(platform)
                ).length;
                return count / competitorAnalyses.length;
            })
        );

        // Timeline data (last 12 weeks)
        const dates: string[] = [];
        const agentActivity: number[] = [];
        const competitorActivity: number[] = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            dates.push(date.toISOString().split('T')[0]);
            agentActivity.push(agentSummary.postingFrequency);
            competitorActivity.push(
                competitorAnalyses.reduce((sum, a) => sum + a.summary.postingFrequency, 0) / competitorAnalyses.length
            );
        }

        return {
            radarChart: {
                categories,
                agentScores,
                competitorAverages,
                topPerformerScores,
            },
            barChart: {
                metrics,
                agentValues,
                marketAverages,
                gaps: gapsData,
            },
            heatmap: {
                contentTypes,
                platforms,
                agentCoverage,
                competitorCoverage,
            },
            timeline: {
                dates,
                agentActivity,
                competitorActivity,
            },
        };
    }

    /**
     * Calculate priority score for a gap
     */
    private calculatePriority(gap: CompetitiveGap): number {
        const severityScores = {
            low: 0.25,
            medium: 0.5,
            high: 0.75,
            critical: 1.0,
        };

        const effortScores = {
            low: 1.0,
            medium: 0.7,
            high: 0.4,
        };

        const severityScore = severityScores[gap.severity];
        const effortScore = effortScores[gap.effortRequired];
        const impactScore = gap.potentialImpact;

        // Priority = (Severity * Impact) / Effort
        return (severityScore * impactScore * 100) / (1 / effortScore);
    }
}

/**
 * Create a new GapAnalyzer instance
 */
export function createGapAnalyzer(): GapAnalyzer {
    return new GapAnalyzer();
}
