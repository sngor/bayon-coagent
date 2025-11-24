/**
 * Agent Strands - Persistent Agent Execution Contexts
 * 
 * This module provides specialized agent strands that maintain persistent contexts,
 * shared memory, and adaptive learning capabilities for complex multi-agent workflows.
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from './flow-base';
import type { AgentStrand, AgentMemory, TaskHistoryEntry } from './agent-core';
import type { WorkerTask, WorkerResult, WorkerAgentType } from './worker-protocol';
import { createSuccessResult, createErrorResult } from './worker-protocol';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Enhanced Data Analyst Strand with persistent context and learning
 */
export class DataAnalystStrand {
    constructor(private strand: AgentStrand) { }

    /**
     * Execute data analysis with context awareness and learning
     */
    async executeTask(task: WorkerTask): Promise<WorkerResult> {
        const startTime = Date.now();
        const startedAt = new Date().toISOString();

        try {
            // Extract relevant context from memory
            const relevantContext = this.extractRelevantContext(task);

            // Build enhanced prompt with context
            const enhancedPrompt = this.buildContextAwarePrompt(task, relevantContext);

            // Execute analysis with enhanced context
            const result = await enhancedPrompt({
                query: task.input.query,
                context: task.input.context || {},
                relevantHistory: relevantContext.history,
                learnedPatterns: relevantContext.patterns,
                agentProfile: task.context?.agentProfile,
            });

            // Learn from this execution
            this.updateLearning(task, result);

            const executionTime = Date.now() - startTime;

            return createSuccessResult(
                task.id,
                'data-analyst',
                result,
                {
                    executionTime,
                    startedAt,
                    modelId: this.strand.capabilities.preferredModel || MODEL_CONFIGS.ANALYTICAL.modelId,
                }
            );
        } catch (error) {
            const executionTime = Date.now() - startTime;

            return createErrorResult(
                task.id,
                'data-analyst',
                {
                    type: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                {
                    executionTime,
                    startedAt,
                }
            );
        }
    }

    /**
     * Extract relevant context from strand memory
     */
    private extractRelevantContext(task: WorkerTask): {
        history: TaskHistoryEntry[];
        patterns: Record<string, any>;
    } {
        const query = task.input.query?.toLowerCase() || '';
        const context = task.input.context || {};

        // Find similar past tasks
        const relevantHistory = this.strand.memory.recentTasks.filter(historyTask => {
            const taskQuery = historyTask.input.query?.toLowerCase() || '';
            const taskContext = historyTask.input.context || {};

            // Check for query similarity
            const querySimilarity = this.calculateSimilarity(query, taskQuery);

            // Check for context similarity (market, property type, etc.)
            const contextSimilarity = this.calculateContextSimilarity(context, taskContext);

            return querySimilarity > 0.3 || contextSimilarity > 0.5;
        }).slice(0, 5); // Top 5 most relevant

        // Extract learned patterns relevant to this task
        const relevantPatterns = Object.entries(this.strand.memory.learnedPatterns)
            .filter(([key]) => query.includes(key.toLowerCase()))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

        return {
            history: relevantHistory,
            patterns: relevantPatterns,
        };
    }

    /**
     * Build context-aware prompt with memory integration
     */
    private buildContextAwarePrompt(task: WorkerTask, relevantContext: any) {
        return definePrompt({
            name: 'contextAwareDataAnalyst',
            inputSchema: z.object({
                query: z.string(),
                context: z.any(),
                relevantHistory: z.array(z.any()),
                learnedPatterns: z.record(z.any()),
                agentProfile: z.any().optional(),
            }),
            outputSchema: z.object({
                dataPoints: z.array(z.object({
                    label: z.string(),
                    value: z.string(),
                    unit: z.string().optional(),
                    source: z.string(),
                    confidence: z.number().min(0).max(1),
                })),
                summary: z.string(),
                insights: z.array(z.string()),
                sources: z.array(z.object({
                    url: z.string(),
                    title: z.string(),
                    sourceType: z.string(),
                })),
                confidence: z.number().min(0).max(1),
                recommendations: z.array(z.string()).optional(),
            }),
            options: MODEL_CONFIGS.ANALYTICAL,
            systemPrompt: `You are an advanced real estate data analyst with persistent memory and learning capabilities. You have access to your previous analysis history and learned patterns to provide more accurate and contextual insights.

**Enhanced Capabilities:**
1. **Memory Integration**: Use relevant past analyses to inform current work
2. **Pattern Recognition**: Apply learned patterns from successful past analyses
3. **Context Awareness**: Consider agent profile and market specialization
4. **Adaptive Learning**: Improve analysis quality based on historical performance
5. **Confidence Assessment**: Provide confidence levels based on data quality and past accuracy

**Analysis Process:**
1. Review relevant historical analyses for similar queries
2. Apply learned patterns and successful approaches
3. Integrate agent-specific market knowledge
4. Provide confidence-weighted insights
5. Generate actionable recommendations

**Quality Standards:**
- Higher confidence for patterns seen in successful past analyses
- Lower confidence for novel queries without historical context
- Explicit uncertainty acknowledgment when data is limited
- Recommendations based on proven successful patterns`,
            prompt: `Analyze the following data request with enhanced context awareness:

**Current Query:** {{{query}}}

**Context:** {{{json context}}}

{{#if agentProfile}}
**Agent Profile:**
- Agent: {{{agentProfile.agentName}}}
- Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
{{/if}}

**Relevant Historical Analyses:**
{{{json relevantHistory}}}

**Learned Patterns:**
{{{json learnedPatterns}}}

Based on your enhanced context and memory, provide:
1. Structured data points with confidence levels
2. Summary incorporating historical insights
3. Key insights informed by past successful analyses
4. Source citations
5. Overall confidence assessment
6. Actionable recommendations based on proven patterns

Prioritize insights that have proven valuable in similar past analyses.`,
        });
    }

    /**
     * Update learning patterns based on task execution
     */
    private updateLearning(task: WorkerTask, result: any): void {
        const query = task.input.query?.toLowerCase() || '';
        const keywords = this.extractKeywords(query);

        // Update learned patterns for successful approaches
        keywords.forEach(keyword => {
            if (!this.strand.memory.learnedPatterns[keyword]) {
                this.strand.memory.learnedPatterns[keyword] = {
                    successfulApproaches: [],
                    commonInsights: [],
                    avgConfidence: 0,
                    usageCount: 0,
                };
            }

            const pattern = this.strand.memory.learnedPatterns[keyword];
            pattern.usageCount += 1;

            if (result.confidence > 0.7) {
                pattern.successfulApproaches.push({
                    approach: result.summary,
                    confidence: result.confidence,
                    timestamp: new Date().toISOString(),
                });

                // Keep only top 10 successful approaches
                pattern.successfulApproaches = pattern.successfulApproaches
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 10);
            }

            // Update average confidence
            pattern.avgConfidence = (pattern.avgConfidence * (pattern.usageCount - 1) + result.confidence) / pattern.usageCount;
        });
    }

    /**
     * Calculate similarity between two strings
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }

    /**
     * Calculate context similarity
     */
    private calculateContextSimilarity(context1: any, context2: any): number {
        const keys1 = Object.keys(context1);
        const keys2 = Object.keys(context2);
        const commonKeys = keys1.filter(key => keys2.includes(key));

        if (commonKeys.length === 0) return 0;

        const matchingValues = commonKeys.filter(key =>
            context1[key] === context2[key]
        ).length;

        return matchingValues / commonKeys.length;
    }

    /**
     * Extract keywords from query
     */
    private extractKeywords(query: string): string[] {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return query
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .slice(0, 10); // Top 10 keywords
    }
}

/**
 * Enhanced Content Generator Strand with brand consistency and style learning
 */
export class ContentGeneratorStrand {
    constructor(private strand: AgentStrand) { }

    /**
     * Execute content generation with brand consistency and style learning
     */
    async executeTask(task: WorkerTask): Promise<WorkerResult> {
        const startTime = Date.now();
        const startedAt = new Date().toISOString();

        try {
            // Extract brand patterns and style preferences
            const brandContext = this.extractBrandContext(task);

            // Build brand-aware prompt
            const brandAwarePrompt = this.buildBrandAwarePrompt(task, brandContext);

            // Execute content generation
            const result = await brandAwarePrompt({
                contentType: task.input.contentType,
                instructions: task.input.instructions,
                context: task.input.context || {},
                agentProfile: task.context?.agentProfile,
                brandPatterns: brandContext.patterns,
                stylePreferences: brandContext.stylePreferences,
                successfulExamples: brandContext.successfulExamples,
            });

            // Learn from successful content generation
            this.updateBrandLearning(task, result);

            const executionTime = Date.now() - startTime;

            return createSuccessResult(
                task.id,
                'content-generator',
                result,
                {
                    executionTime,
                    startedAt,
                    modelId: this.strand.capabilities.preferredModel || MODEL_CONFIGS.CREATIVE.modelId,
                }
            );
        } catch (error) {
            const executionTime = Date.now() - startTime;

            return createErrorResult(
                task.id,
                'content-generator',
                {
                    type: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                {
                    executionTime,
                    startedAt,
                }
            );
        }
    }

    /**
     * Extract brand context and learned patterns
     */
    private extractBrandContext(task: WorkerTask): {
        patterns: Record<string, any>;
        stylePreferences: Record<string, any>;
        successfulExamples: any[];
    } {
        const agentProfile = task.context?.agentProfile;
        const contentType = task.input.contentType;

        // Extract brand-specific patterns
        const brandKey = agentProfile ? `${agentProfile.agentName}_${agentProfile.primaryMarket}` : 'default';
        const brandPatterns = this.strand.memory.learnedPatterns[brandKey] || {};

        // Extract content type specific patterns
        const contentTypePatterns = this.strand.memory.learnedPatterns[contentType] || {};

        // Find successful examples of similar content
        const successfulExamples = this.strand.memory.recentTasks
            .filter(task =>
                task.success &&
                task.input.contentType === contentType &&
                task.output?.qualityScore > 0.8
            )
            .slice(0, 3)
            .map(task => ({
                input: task.input,
                output: task.output,
                executionTime: task.executionTime,
            }));

        return {
            patterns: { ...brandPatterns, ...contentTypePatterns },
            stylePreferences: brandPatterns.stylePreferences || {},
            successfulExamples,
        };
    }

    /**
     * Build brand-aware content generation prompt
     */
    private buildBrandAwarePrompt(task: WorkerTask, brandContext: any) {
        return definePrompt({
            name: 'brandAwareContentGenerator',
            inputSchema: z.object({
                contentType: z.string(),
                instructions: z.string(),
                context: z.any(),
                agentProfile: z.any().optional(),
                brandPatterns: z.record(z.any()),
                stylePreferences: z.record(z.any()),
                successfulExamples: z.array(z.any()),
            }),
            outputSchema: z.object({
                content: z.string(),
                tone: z.string(),
                wordCount: z.number(),
                keyThemes: z.array(z.string()),
                personalizationApplied: z.object({
                    agentNameUsed: z.boolean(),
                    marketMentioned: z.boolean(),
                    specializationReflected: z.boolean(),
                    corePrincipleIncluded: z.boolean(),
                    brandVoiceMatched: z.boolean(),
                }),
                qualityScore: z.number().min(0).max(1),
                brandConsistency: z.number().min(0).max(1),
            }),
            options: MODEL_CONFIGS.CREATIVE,
            systemPrompt: `You are an advanced content generator with brand learning capabilities. You maintain consistent brand voice and style across all content while adapting to specific requirements.

**Enhanced Capabilities:**
1. **Brand Consistency**: Maintain consistent voice, tone, and messaging
2. **Style Learning**: Adapt based on successful past content patterns
3. **Personalization**: Deep integration of agent profile and market context
4. **Quality Assessment**: Self-evaluate content quality and brand alignment
5. **Adaptive Improvement**: Learn from successful content patterns

**Brand Consistency Factors:**
- Consistent tone and voice across all content
- Appropriate use of agent name and credentials
- Market-specific terminology and insights
- Specialization-focused messaging
- Core principle integration

**Quality Standards:**
- High engagement potential
- Professional yet accessible language
- Clear value proposition
- Appropriate length and format
- Strong brand alignment`,
            prompt: `Generate {{{contentType}}} content with enhanced brand awareness:

**Content Requirements:**
- Type: {{{contentType}}}
- Instructions: {{{instructions}}}
- Context: {{{json context}}}

{{#if agentProfile}}
**Agent Brand Profile:**
- Name: {{{agentProfile.agentName}}}
- Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
- Tone: {{{agentProfile.preferredTone}}}
- Core Principle: {{{agentProfile.corePrinciple}}}
{{/if}}

**Learned Brand Patterns:**
{{{json brandPatterns}}}

**Style Preferences:**
{{{json stylePreferences}}}

**Successful Examples for Reference:**
{{{json successfulExamples}}}

Create content that:
1. Maintains perfect brand consistency with past successful content
2. Incorporates learned style preferences and patterns
3. Reflects the agent's unique voice and market expertise
4. Provides clear value to the target audience
5. Achieves high quality and engagement potential

Provide detailed analysis of personalization applied and quality assessment.`,
        });
    }

    /**
     * Update brand learning patterns
     */
    private updateBrandLearning(task: WorkerTask, result: any): void {
        const agentProfile = task.context?.agentProfile;
        const contentType = task.input.contentType;

        if (agentProfile && result.qualityScore > 0.7) {
            const brandKey = `${agentProfile.agentName}_${agentProfile.primaryMarket}`;

            if (!this.strand.memory.learnedPatterns[brandKey]) {
                this.strand.memory.learnedPatterns[brandKey] = {
                    stylePreferences: {},
                    successfulPatterns: [],
                    toneConsistency: [],
                    avgQualityScore: 0,
                    contentCount: 0,
                };
            }

            const brandPattern = this.strand.memory.learnedPatterns[brandKey];
            brandPattern.contentCount += 1;

            // Update style preferences
            if (result.tone) {
                brandPattern.stylePreferences.preferredTone = result.tone;
            }

            // Track successful patterns
            if (result.qualityScore > 0.8) {
                brandPattern.successfulPatterns.push({
                    contentType,
                    keyThemes: result.keyThemes,
                    tone: result.tone,
                    qualityScore: result.qualityScore,
                    brandConsistency: result.brandConsistency,
                    timestamp: new Date().toISOString(),
                });

                // Keep only top 20 successful patterns
                brandPattern.successfulPatterns = brandPattern.successfulPatterns
                    .sort((a, b) => b.qualityScore - a.qualityScore)
                    .slice(0, 20);
            }

            // Update average quality score
            brandPattern.avgQualityScore =
                (brandPattern.avgQualityScore * (brandPattern.contentCount - 1) + result.qualityScore) /
                brandPattern.contentCount;
        }
    }
}

/**
 * Enhanced Market Forecaster Strand with trend analysis and prediction accuracy tracking
 */
export class MarketForecasterStrand {
    constructor(private strand: AgentStrand) { }

    /**
     * Execute market forecasting with trend analysis and accuracy tracking
     */
    async executeTask(task: WorkerTask): Promise<WorkerResult> {
        const startTime = Date.now();
        const startedAt = new Date().toISOString();

        try {
            // Extract market trends and prediction patterns
            const marketContext = this.extractMarketContext(task);

            // Build trend-aware forecasting prompt
            const trendAwarePrompt = this.buildTrendAwarePrompt(task, marketContext);

            // Execute market forecasting
            const result = await trendAwarePrompt({
                query: task.input.query,
                timeframe: task.input.timeframe || '12 months',
                market: task.input.market,
                context: task.input.context || {},
                agentProfile: task.context?.agentProfile,
                historicalTrends: marketContext.historicalTrends,
                predictionPatterns: marketContext.predictionPatterns,
                accuracyMetrics: marketContext.accuracyMetrics,
            });

            // Track prediction for future accuracy assessment
            this.trackPrediction(task, result);

            const executionTime = Date.now() - startTime;

            return createSuccessResult(
                task.id,
                'market-forecaster',
                result,
                {
                    executionTime,
                    startedAt,
                    modelId: this.strand.capabilities.preferredModel || MODEL_CONFIGS.ANALYTICAL.modelId,
                }
            );
        } catch (error) {
            const executionTime = Date.now() - startTime;

            return createErrorResult(
                task.id,
                'market-forecaster',
                {
                    type: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                {
                    executionTime,
                    startedAt,
                }
            );
        }
    }

    /**
     * Extract market context and prediction patterns
     */
    private extractMarketContext(task: WorkerTask): {
        historicalTrends: any[];
        predictionPatterns: Record<string, any>;
        accuracyMetrics: Record<string, number>;
    } {
        const market = task.input.market || task.context?.agentProfile?.primaryMarket;
        const marketKey = market ? market.toLowerCase().replace(/\s+/g, '_') : 'general';

        // Extract market-specific patterns
        const marketPatterns = this.strand.memory.learnedPatterns[marketKey] || {};

        // Find historical trend data
        const historicalTrends = this.strand.memory.recentTasks
            .filter(task =>
                task.success &&
                task.input.market === market &&
                task.output?.predictions
            )
            .slice(0, 10)
            .map(task => ({
                predictions: task.output.predictions,
                timeframe: task.input.timeframe,
                timestamp: task.timestamp,
            }));

        // Calculate accuracy metrics for different prediction types
        const accuracyMetrics = this.calculateAccuracyMetrics(marketKey);

        return {
            historicalTrends,
            predictionPatterns: marketPatterns,
            accuracyMetrics,
        };
    }

    /**
     * Build trend-aware forecasting prompt
     */
    private buildTrendAwarePrompt(task: WorkerTask, marketContext: any) {
        return definePrompt({
            name: 'trendAwareMarketForecaster',
            inputSchema: z.object({
                query: z.string(),
                timeframe: z.string(),
                market: z.string().optional(),
                context: z.any(),
                agentProfile: z.any().optional(),
                historicalTrends: z.array(z.any()),
                predictionPatterns: z.record(z.any()),
                accuracyMetrics: z.record(z.number()),
            }),
            outputSchema: z.object({
                predictions: z.array(z.object({
                    metric: z.string(),
                    currentValue: z.string().optional(),
                    predictedValue: z.string(),
                    confidence: z.number().min(0).max(1),
                    timeframe: z.string(),
                    reasoning: z.string(),
                    qualifyingLanguage: z.string(),
                })),
                marketTrends: z.array(z.object({
                    trend: z.string(),
                    direction: z.enum(['up', 'down', 'stable', 'volatile']),
                    strength: z.enum(['weak', 'moderate', 'strong']),
                    confidence: z.number().min(0).max(1),
                })),
                riskFactors: z.array(z.string()),
                opportunities: z.array(z.string()),
                summary: z.string(),
                disclaimers: z.array(z.string()),
                confidenceLevel: z.number().min(0).max(1),
            }),
            options: MODEL_CONFIGS.ANALYTICAL,
            systemPrompt: `You are an advanced market forecaster with trend analysis capabilities and accuracy tracking. You provide market predictions with appropriate qualifying language and confidence levels based on historical accuracy.

**Enhanced Capabilities:**
1. **Trend Analysis**: Analyze historical patterns and market cycles
2. **Accuracy Tracking**: Adjust confidence based on past prediction accuracy
3. **Risk Assessment**: Identify potential market risks and opportunities
4. **Qualifying Language**: Use appropriate hedging language for predictions
5. **Market Specialization**: Adapt predictions to specific market characteristics

**Prediction Standards:**
- Always use qualifying language ("may", "could", "historical trends suggest")
- Provide confidence levels based on data quality and historical accuracy
- Include multiple scenarios when appropriate
- Clearly state assumptions and limitations
- Focus on trends rather than specific price predictions

**Risk Management:**
- Never guarantee specific outcomes
- Always include disclaimers about market volatility
- Acknowledge uncertainty and external factors
- Provide ranges rather than point predictions`,
            prompt: `Generate market forecast with enhanced trend analysis:

**Forecast Request:** {{{query}}}
**Timeframe:** {{{timeframe}}}
**Market:** {{{market}}}
**Context:** {{{json context}}}

{{#if agentProfile}}
**Agent Market Focus:**
- Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
{{/if}}

**Historical Market Trends:**
{{{json historicalTrends}}}

**Learned Prediction Patterns:**
{{{json predictionPatterns}}}

**Historical Accuracy Metrics:**
{{{json accuracyMetrics}}}

Based on trend analysis and historical accuracy, provide:
1. Specific predictions with confidence levels adjusted for past accuracy
2. Market trend analysis with strength and direction
3. Risk factors and opportunities
4. Comprehensive summary with appropriate qualifying language
5. Clear disclaimers about market uncertainty

Adjust confidence levels based on historical accuracy metrics for similar predictions.`,
        });
    }

    /**
     * Track predictions for future accuracy assessment
     */
    private trackPrediction(task: WorkerTask, result: any): void {
        const market = task.input.market || task.context?.agentProfile?.primaryMarket;
        const marketKey = market ? market.toLowerCase().replace(/\s+/g, '_') : 'general';

        if (!this.strand.memory.learnedPatterns[`${marketKey}_predictions`]) {
            this.strand.memory.learnedPatterns[`${marketKey}_predictions`] = {
                activePredictions: [],
                completedPredictions: [],
                accuracyHistory: [],
            };
        }

        const predictionTracker = this.strand.memory.learnedPatterns[`${marketKey}_predictions`];

        // Store prediction for future verification
        const predictionRecord = {
            id: task.id,
            predictions: result.predictions,
            timeframe: task.input.timeframe,
            market: market,
            createdAt: new Date().toISOString(),
            verificationDate: this.calculateVerificationDate(task.input.timeframe),
        };

        predictionTracker.activePredictions.push(predictionRecord);

        // Clean up old predictions (keep last 100)
        if (predictionTracker.activePredictions.length > 100) {
            predictionTracker.activePredictions = predictionTracker.activePredictions.slice(-100);
        }
    }

    /**
     * Calculate accuracy metrics for different prediction types
     */
    private calculateAccuracyMetrics(marketKey: string): Record<string, number> {
        const predictionTracker = this.strand.memory.learnedPatterns[`${marketKey}_predictions`];
        if (!predictionTracker) return {};

        const accuracyMetrics: Record<string, number> = {};

        // Calculate accuracy for different prediction types
        const completedPredictions = predictionTracker.completedPredictions || [];

        if (completedPredictions.length > 0) {
            const totalAccuracy = completedPredictions.reduce((sum: number, pred: any) =>
                sum + (pred.accuracy || 0), 0) / completedPredictions.length;

            accuracyMetrics.overall = totalAccuracy;

            // Calculate accuracy by timeframe
            const timeframes = ['3 months', '6 months', '12 months'];
            timeframes.forEach(timeframe => {
                const timeframePredictions = completedPredictions.filter((pred: any) =>
                    pred.timeframe === timeframe);
                if (timeframePredictions.length > 0) {
                    accuracyMetrics[timeframe] = timeframePredictions.reduce((sum: number, pred: any) =>
                        sum + (pred.accuracy || 0), 0) / timeframePredictions.length;
                }
            });
        }

        return accuracyMetrics;
    }

    /**
     * Calculate verification date based on timeframe
     */
    private calculateVerificationDate(timeframe: string): string {
        const now = new Date();
        const months = this.parseTimeframeToMonths(timeframe);
        now.setMonth(now.getMonth() + months);
        return now.toISOString();
    }

    /**
     * Parse timeframe string to months
     */
    private parseTimeframeToMonths(timeframe: string): number {
        const match = timeframe.match(/(\d+)\s*(month|year)/i);
        if (!match) return 12; // Default to 12 months

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        return unit === 'year' ? value * 12 : value;
    }
}

/**
 * Factory function to create appropriate strand instance
 */
export function createStrandInstance(strand: AgentStrand): DataAnalystStrand | ContentGeneratorStrand | MarketForecasterStrand {
    switch (strand.type) {
        case 'data-analyst':
            return new DataAnalystStrand(strand);
        case 'content-generator':
            return new ContentGeneratorStrand(strand);
        case 'market-forecaster':
            return new MarketForecasterStrand(strand);
        default:
            throw new Error(`Unsupported strand type: ${strand.type}`);
    }
}