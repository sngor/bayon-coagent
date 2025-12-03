/**
 * Competitor Monitor
 * 
 * Tracks competitor content, identifies strategic patterns, and provides
 * competitive intelligence for real estate agents.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import {
    Competitor,
    CompetitorContent,
    StrategyPattern,
    PatternEvidence,
    CompetitorAnalysisResult,
    CompetitorContentFilters,
    PatternIdentificationConfig,
    CompetitorRecord,
    CompetitorContentRecord,
} from './types';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * CompetitorMonitor - Monitors competitor activities and identifies patterns
 */
export class CompetitorMonitor {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;

    constructor() {
        this.client = getBedrockClient();
        this.repository = getRepository();
    }

    /**
     * Add a competitor to monitor
     */
    async addCompetitor(
        userId: string,
        competitor: Omit<Competitor, 'id' | 'addedAt' | 'isActive'>
    ): Promise<Competitor> {
        const competitorId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullCompetitor: Competitor = {
            ...competitor,
            id: competitorId,
            addedAt: new Date().toISOString(),
            isActive: true,
        };

        const record: CompetitorRecord = {
            PK: `USER#${userId}`,
            SK: `COMPETITOR#${competitorId}`,
            entityType: 'CompetitorRecord',
            competitor: fullCompetitor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.repository.put(record);

        return fullCompetitor;
    }

    /**
     * Get all competitors for a user
     */
    async getCompetitors(userId: string, activeOnly: boolean = true): Promise<Competitor[]> {
        const records = await this.repository.query<CompetitorRecord>({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'COMPETITOR#' },
        });

        const competitors = records.map(r => r.competitor);

        if (activeOnly) {
            return competitors.filter(c => c.isActive);
        }

        return competitors;
    }

    /**
     * Track competitor content
     */
    async trackContent(
        competitorId: string,
        content: Omit<CompetitorContent, 'id' | 'competitorId' | 'discoveredAt'>
    ): Promise<CompetitorContent> {
        const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const fullContent: CompetitorContent = {
            ...content,
            id: contentId,
            competitorId,
            discoveredAt: timestamp,
        };

        // Store content with TTL (90 days)
        const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);

        const record: CompetitorContentRecord = {
            PK: `COMPETITOR#${competitorId}`,
            SK: `CONTENT#${content.publishedAt}#${contentId}`,
            entityType: 'CompetitorContentRecord',
            content: fullContent,
            createdAt: timestamp,
            ttl,
        };

        await this.repository.put(record);

        return fullContent;
    }

    /**
     * Get competitor content with filters
     */
    async getCompetitorContent(
        competitorId: string,
        filters?: CompetitorContentFilters
    ): Promise<CompetitorContent[]> {
        const records = await this.repository.query<CompetitorContentRecord>({
            PK: `COMPETITOR#${competitorId}`,
            SK: { beginsWith: 'CONTENT#' },
        });

        let content = records.map(r => r.content);

        // Apply filters
        if (filters) {
            if (filters.contentTypes && filters.contentTypes.length > 0) {
                content = content.filter(c => filters.contentTypes!.includes(c.type));
            }

            if (filters.platforms && filters.platforms.length > 0) {
                content = content.filter(c => filters.platforms!.includes(c.platform));
            }

            if (filters.topics && filters.topics.length > 0) {
                content = content.filter(c =>
                    c.topics && c.topics.some(t => filters.topics!.includes(t))
                );
            }

            if (filters.dateRange) {
                content = content.filter(c =>
                    c.publishedAt >= filters.dateRange!.start &&
                    c.publishedAt <= filters.dateRange!.end
                );
            }

            if (filters.minEngagement !== undefined && filters.minEngagement > 0) {
                content = content.filter(c => {
                    if (!c.engagement) return false;
                    const totalEngagement = (c.engagement.likes || 0) +
                        (c.engagement.comments || 0) +
                        (c.engagement.shares || 0);
                    return totalEngagement >= filters.minEngagement!;
                });
            }

            if (filters.limit && filters.limit > 0) {
                content = content.slice(0, filters.limit);
            }
        }

        return content;
    }

    /**
     * Identify strategic patterns in competitor content
     */
    async identifyPatterns(
        competitorId: string,
        config?: Partial<PatternIdentificationConfig>
    ): Promise<StrategyPattern[]> {
        const defaultConfig: PatternIdentificationConfig = {
            minFrequency: 3,
            minConfidence: 0.6,
            timeWindow: '90d',
            categories: ['content-strategy', 'messaging', 'targeting', 'timing', 'format', 'engagement'],
            includeEffectiveness: true,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Get recent content
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // 90 days back

        const content = await this.getCompetitorContent(competitorId, {
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
        });

        if (content.length === 0) {
            return [];
        }

        // Use AI to identify patterns
        const patterns = await this.analyzeContentForPatterns(content, finalConfig);

        return patterns;
    }

    /**
     * Analyze content using AI to identify strategic patterns
     */
    private async analyzeContentForPatterns(
        content: CompetitorContent[],
        config: PatternIdentificationConfig
    ): Promise<StrategyPattern[]> {
        const contentSummary = content.map(c => ({
            type: c.type,
            platform: c.platform,
            title: c.title,
            content: c.content.substring(0, 500), // Limit content length
            publishedAt: c.publishedAt,
            topics: c.topics,
            engagement: c.engagement,
        }));

        const prompt = `Analyze the following competitor content and identify strategic patterns in their approach.

Content to analyze (${content.length} pieces):
${JSON.stringify(contentSummary, null, 2)}

Identify patterns in these categories: ${config.categories.join(', ')}

For each pattern identified:
1. Name and describe the pattern
2. Provide specific evidence from the content
3. Assess the frequency and confidence
4. Evaluate effectiveness based on engagement metrics

Minimum frequency threshold: ${config.minFrequency}
Minimum confidence threshold: ${config.minConfidence}

Return a JSON array of patterns with this structure:
{
  "patterns": [
    {
      "name": "Pattern name",
      "description": "Detailed description",
      "category": "content-strategy|messaging|targeting|timing|format|engagement",
      "confidence": 0.0-1.0,
      "frequency": number,
      "evidence": [
        {
          "example": "Specific example from content",
          "relevance": 0.0-1.0
        }
      ],
      "effectiveness": 0.0-1.0,
      "trend": "increasing|stable|decreasing"
    }
  ]
}`;

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
                    maxTokens: 4000,
                    temperature: 0.3,
                },
            });

            const response = await this.client.send(command);
            const responseText = response.output?.message?.content?.[0]?.text || '{}';

            // Parse AI response
            const result = JSON.parse(responseText);
            const patterns: StrategyPattern[] = [];

            if (result.patterns && Array.isArray(result.patterns)) {
                for (const p of result.patterns) {
                    // Filter by thresholds
                    if (p.frequency >= config.minFrequency && p.confidence >= config.minConfidence) {
                        const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                        const evidence: PatternEvidence[] = p.evidence.map((e: any, idx: number) => ({
                            contentId: content[idx % content.length].id,
                            example: e.example,
                            relevance: e.relevance,
                            timestamp: new Date().toISOString(),
                        }));

                        patterns.push({
                            id: patternId,
                            name: p.name,
                            description: p.description,
                            category: p.category,
                            confidence: p.confidence,
                            frequency: p.frequency,
                            evidence,
                            effectiveness: config.includeEffectiveness ? p.effectiveness : undefined,
                            identifiedAt: new Date().toISOString(),
                            trend: p.trend,
                        });
                    }
                }
            }

            return patterns;
        } catch (error) {
            console.error('Error analyzing content for patterns:', error);
            throw new Error(`Failed to identify patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Perform comprehensive competitor analysis
     */
    async analyzeCompetitor(
        userId: string,
        competitorId: string,
        timeRange?: { start: string; end: string }
    ): Promise<CompetitorAnalysisResult> {
        const startTime = Date.now();

        // Get competitor info
        const competitorRecord = await this.repository.get<CompetitorRecord>({
            PK: `USER#${userId}`,
            SK: `COMPETITOR#${competitorId}`,
        });

        if (!competitorRecord) {
            throw new Error(`Competitor ${competitorId} not found`);
        }

        const competitor = competitorRecord.competitor;

        // Get content
        const content = await this.getCompetitorContent(competitorId, {
            dateRange: timeRange,
        });

        // Identify patterns
        const patterns = await this.identifyPatterns(competitorId);

        // Calculate summary statistics
        const contentTypes: Record<string, number> = {};
        const topicsMap: Record<string, number> = {};
        let totalEngagement = 0;
        let engagementCount = 0;
        const channelCounts: Record<string, number> = {};

        for (const c of content) {
            // Content types
            contentTypes[c.type] = (contentTypes[c.type] || 0) + 1;

            // Topics
            if (c.topics) {
                for (const topic of c.topics) {
                    topicsMap[topic] = (topicsMap[topic] || 0) + 1;
                }
            }

            // Engagement
            if (c.engagement) {
                const engagement = (c.engagement.likes || 0) +
                    (c.engagement.comments || 0) +
                    (c.engagement.shares || 0);
                totalEngagement += engagement;
                engagementCount++;
            }

            // Channels
            channelCounts[c.platform] = (channelCounts[c.platform] || 0) + 1;
        }

        const topTopics = Object.entries(topicsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic]) => topic);

        const mostActiveChannels = Object.entries(channelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([channel]) => channel);

        const averageEngagement = engagementCount > 0 ? totalEngagement / engagementCount : 0;

        // Calculate posting frequency (posts per week)
        const timeRangeMs = timeRange
            ? new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()
            : 90 * 24 * 60 * 60 * 1000; // 90 days default
        const weeks = timeRangeMs / (7 * 24 * 60 * 60 * 1000);
        const postingFrequency = content.length / weeks;

        const result: CompetitorAnalysisResult = {
            competitor,
            content,
            patterns,
            summary: {
                totalContent: content.length,
                contentTypes,
                topTopics,
                averageEngagement,
                postingFrequency,
                mostActiveChannels,
            },
            metadata: {
                analysisTime: Date.now() - startTime,
                contentAnalyzed: content.length,
                timeRange: timeRange || {
                    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            },
        };

        // Update competitor record with latest analysis
        competitorRecord.latestAnalysis = result;
        competitorRecord.competitor.lastAnalyzed = new Date().toISOString();
        competitorRecord.updatedAt = new Date().toISOString();
        await this.repository.put(competitorRecord);

        return result;
    }

    /**
     * Get latest analysis for a competitor
     */
    async getLatestAnalysis(
        userId: string,
        competitorId: string
    ): Promise<CompetitorAnalysisResult | null> {
        const record = await this.repository.get<CompetitorRecord>({
            PK: `USER#${userId}`,
            SK: `COMPETITOR#${competitorId}`,
        });

        return record?.latestAnalysis || null;
    }

    /**
     * Update competitor information
     */
    async updateCompetitor(
        userId: string,
        competitorId: string,
        updates: Partial<Omit<Competitor, 'id' | 'addedAt'>>
    ): Promise<Competitor> {
        const record = await this.repository.get<CompetitorRecord>({
            PK: `USER#${userId}`,
            SK: `COMPETITOR#${competitorId}`,
        });

        if (!record) {
            throw new Error(`Competitor ${competitorId} not found`);
        }

        record.competitor = {
            ...record.competitor,
            ...updates,
        };
        record.updatedAt = new Date().toISOString();

        await this.repository.put(record);

        return record.competitor;
    }

    /**
     * Delete a competitor
     */
    async deleteCompetitor(userId: string, competitorId: string): Promise<void> {
        await this.repository.delete({
            PK: `USER#${userId}`,
            SK: `COMPETITOR#${competitorId}`,
        });

        // Note: Content records will be automatically cleaned up by TTL
    }

    /**
     * Batch analyze multiple competitors
     */
    async analyzeMultipleCompetitors(
        userId: string,
        competitorIds: string[],
        timeRange?: { start: string; end: string }
    ): Promise<CompetitorAnalysisResult[]> {
        const results: CompetitorAnalysisResult[] = [];

        for (const competitorId of competitorIds) {
            try {
                const result = await this.analyzeCompetitor(userId, competitorId, timeRange);
                results.push(result);
            } catch (error) {
                console.error(`Error analyzing competitor ${competitorId}:`, error);
                // Continue with other competitors
            }
        }

        return results;
    }
}

/**
 * Create a new CompetitorMonitor instance
 */
export function createCompetitorMonitor(): CompetitorMonitor {
    return new CompetitorMonitor();
}
