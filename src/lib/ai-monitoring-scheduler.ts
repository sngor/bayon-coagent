/**
 * AI Monitoring Scheduler Service
 * 
 * Service for scheduling and executing AI visibility monitoring jobs.
 * Handles rate limiting, query execution, and result storage.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    AIPlatformQueryService,
    createAIPlatformQueryService,
    AIPlatformConfig,
    DEFAULT_QUERY_TEMPLATES,
    AgentData,
} from './ai-platform-query';
import { analyzeAIMention } from '@/aws/bedrock/flows/analyze-ai-mention';
import { calculateVisibilityScore } from '@/aws/bedrock/flows/calculate-visibility-score';
import {
    AIMonitoringConfig,
    AIMonitoringJob,
    AIMention,
    AIVisibilityScore,
} from './types/common/common';
import { AICostControlService, createAICostControlService } from './ai-cost-control';

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
    canExecute: boolean;
    remainingQueries: number;
    resetDate: string;
}

/**
 * Monitoring execution result
 */
export interface MonitoringExecutionResult {
    queriesExecuted: number;
    mentionsFound: number;
    errors: string[];
}

/**
 * Error thrown when monitoring operations fail
 */
export class AIMonitoringError extends Error {
    constructor(
        message: string,
        public readonly userId?: string,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = 'AIMonitoringError';
    }
}

/**
 * AI Monitoring Scheduler
 * Manages scheduling and execution of AI visibility monitoring
 */
export class AIMonitoringScheduler {
    private readonly repository = getRepository();
    private readonly queryService: AIPlatformQueryService;
    private readonly costControl: AICostControlService;

    // Rate limiting constants
    private readonly DEFAULT_QUERY_LIMIT = 100; // queries per period
    private readonly RATE_LIMIT_PERIOD_DAYS = 7; // weekly period

    constructor() {
        this.queryService = createAIPlatformQueryService();
        this.costControl = createAICostControlService();
    }

    /**
     * Schedule monitoring for a user
     * @param userId User ID
     * @param frequency Monitoring frequency
     */
    async scheduleMonitoring(
        userId: string,
        frequency: 'daily' | 'weekly' | 'monthly'
    ): Promise<void> {
        try {
            // Get or create monitoring config
            let config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(
                userId
            );

            const now = new Date();
            const nextScheduled = this.calculateNextScheduledTime(now, frequency);

            if (!config) {
                // Create new config
                const newConfig: AIMonitoringConfig = {
                    id: uuidv4(),
                    userId,
                    enabled: true,
                    frequency,
                    platforms: ['chatgpt', 'perplexity', 'claude', 'gemini'],
                    queryTemplates: DEFAULT_QUERY_TEMPLATES.map((t) => t.id),
                    alertThreshold: 20, // 20% change triggers alert
                    lastExecuted: '',
                    nextScheduled: nextScheduled.toISOString(),
                    queriesThisPeriod: 0,
                    queryLimit: this.DEFAULT_QUERY_LIMIT,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                await this.repository.saveAIMonitoringConfig(userId, newConfig);
            } else {
                // Update existing config
                await this.repository.updateAIMonitoringConfig(userId, {
                    frequency,
                    nextScheduled: nextScheduled.toISOString(),
                    enabled: true,
                });
            }

            console.log(
                `[AIMonitoringScheduler] Scheduled ${frequency} monitoring for user ${userId}`
            );
        } catch (error) {
            console.error(
                `[AIMonitoringScheduler] Error scheduling monitoring for user ${userId}:`,
                error
            );
            throw new AIMonitoringError(
                `Failed to schedule monitoring: ${error instanceof Error ? error.message : 'Unknown error'
                }`,
                userId,
                error
            );
        }
    }

    /**
     * Execute monitoring for a user
     * @param userId User ID
     * @returns Execution result
     */
    async executeMonitoring(userId: string): Promise<MonitoringExecutionResult> {
        const jobId = uuidv4();
        const startedAt = new Date().toISOString();

        try {
            // Create job record
            const job: AIMonitoringJob = {
                id: jobId,
                userId,
                status: 'running',
                startedAt,
                queriesExecuted: 0,
                mentionsFound: 0,
                errors: [],
                costEstimate: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            await this.repository.createAIMonitoringJob(userId, jobId, job);

            // Get monitoring config
            const config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(
                userId
            );

            if (!config || !config.enabled) {
                throw new AIMonitoringError(
                    'Monitoring not enabled for user',
                    userId
                );
            }

            // Check rate limits
            const rateLimitCheck = await this.checkRateLimits(userId);
            if (!rateLimitCheck.canExecute) {
                throw new AIMonitoringError(
                    `Rate limit exceeded. ${rateLimitCheck.remainingQueries} queries remaining until ${rateLimitCheck.resetDate}`,
                    userId
                );
            }

            // Estimate cost before execution
            const templates = DEFAULT_QUERY_TEMPLATES.filter((t) =>
                config.queryTemplates.includes(t.id)
            );
            const queriesPerPlatform = templates.length;
            const costEstimate = await this.costControl.estimateCost(
                userId,
                config.platforms,
                queriesPerPlatform
            );

            // Check if within budget
            if (!costEstimate.withinBudget) {
                throw new AIMonitoringError(
                    `Estimated cost ($${costEstimate.totalCost.toFixed(2)}) exceeds remaining budget ($${costEstimate.remainingBudget.toFixed(2)})`,
                    userId
                );
            }

            console.log(
                `[AIMonitoringScheduler] Cost estimate for user ${userId}: $${costEstimate.totalCost.toFixed(4)}`
            );

            // Get user profile for agent data
            const profile = await this.repository.get<any>(
                `USER#${userId}`,
                'PROFILE'
            );

            // Handle missing profile with fallback values
            const agentData: AgentData = {
                name: profile?.name ||
                    (profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : 'Real Estate Agent'),
                city: profile?.city || 'Unknown Location',
                specialties: profile?.specialties && Array.isArray(profile.specialties) && profile.specialties.length > 0
                    ? profile.specialties
                    : ['residential real estate'],
                neighborhood: profile?.neighborhood,
            };

            // Log warning if profile data is incomplete
            if (!profile || !profile.name || !profile.city) {
                console.warn(
                    `[AIMonitoringScheduler] Incomplete profile data for user ${userId}. Using fallback values.`
                );
            }

            // Generate queries from templates (already filtered above)
            const queries = this.queryService.generateQueries(templates, agentData);

            const result: MonitoringExecutionResult = {
                queriesExecuted: 0,
                mentionsFound: 0,
                errors: [],
            };

            // Execute queries for each platform
            for (const platformName of config.platforms) {
                // Check if we've hit rate limit
                const currentRateCheck = await this.checkRateLimits(userId);
                if (!currentRateCheck.canExecute) {
                    result.errors.push(
                        `Rate limit reached after ${result.queriesExecuted} queries`
                    );
                    break;
                }

                // Check if approaching budget limit
                const approachingLimit = await this.costControl.isApproachingLimit(userId);
                if (approachingLimit) {
                    console.log(
                        `[AIMonitoringScheduler] User ${userId} is approaching budget limit`
                    );
                }

                const platformConfig: AIPlatformConfig = {
                    name: platformName,
                    apiEndpoint: this.getPlatformEndpoint(platformName),
                    apiKey: await this.getPlatformApiKey(platformName),
                    rateLimit: 100,
                };

                let platformQueryCount = 0;

                // Execute queries for this platform
                for (const query of queries) {
                    try {
                        // Query the platform
                        const response = await this.queryService.queryPlatform(
                            platformConfig,
                            query
                        );

                        result.queriesExecuted++;
                        platformQueryCount++;

                        // Increment query counter with atomic operation
                        await this.incrementQueryCounter(userId);

                        // Detect mentions
                        const mentionDetection = await this.queryService.detectMentions(
                            response,
                            agentData.name
                        );

                        if (mentionDetection.found) {
                            result.mentionsFound++;

                            // Analyze mention with Bedrock
                            const analysis = await analyzeAIMention({
                                agentName: agentData.name,
                                aiResponse: response,
                                query,
                                platform: platformName,
                            });

                            // Store mention
                            const mention: AIMention = {
                                id: uuidv4(),
                                userId,
                                platform: platformName,
                                query,
                                queryCategory: templates.find((t) =>
                                    query.includes(t.template.split('{')[0])
                                )?.category || 'general',
                                response,
                                snippet: mentionDetection.snippets[0] || '',
                                sentiment: analysis.sentiment,
                                sentimentReason: analysis.sentimentReason,
                                topics: analysis.topics,
                                expertiseAreas: analysis.expertiseAreas,
                                prominence: analysis.prominence,
                                position: mentionDetection.position,
                                timestamp: new Date().toISOString(),
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                            };

                            await this.repository.createAIMention(
                                userId,
                                mention.id,
                                mention
                            );
                        }

                        // Small delay to avoid overwhelming APIs
                        await this.delay(1000);
                    } catch (error) {
                        console.error(
                            `[AIMonitoringScheduler] Error executing query on ${platformName}:`,
                            error
                        );
                        result.errors.push(
                            `${platformName}: ${error instanceof Error ? error.message : 'Unknown error'
                            }`
                        );
                    }
                }

                // Track API usage for this platform
                if (platformQueryCount > 0) {
                    await this.costControl.trackAPIUsage(
                        userId,
                        platformName,
                        platformQueryCount
                    );
                }
            }

            // Calculate visibility score
            await this.calculateAndStoreVisibilityScore(userId);

            // Invalidate cache after new data is added
            const { invalidateAIVisibilityCache } = await import('./ai-visibility-cache');
            invalidateAIVisibilityCache(userId);

            // Update job status
            await this.repository.updateAIMonitoringJob(userId, jobId, startedAt, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                queriesExecuted: result.queriesExecuted,
                mentionsFound: result.mentionsFound,
                errors: result.errors,
            });

            // Update config with last executed time
            await this.repository.updateAIMonitoringConfig(userId, {
                lastExecuted: new Date().toISOString(),
                nextScheduled: this.calculateNextScheduledTime(
                    new Date(),
                    config.frequency
                ).toISOString(),
            });

            console.log(
                `[AIMonitoringScheduler] Completed monitoring for user ${userId}:`,
                result
            );

            return result;
        } catch (error) {
            console.error(
                `[AIMonitoringScheduler] Error executing monitoring for user ${userId}:`,
                error
            );

            // Update job status to failed
            try {
                await this.repository.updateAIMonitoringJob(userId, jobId, startedAt, {
                    status: 'failed',
                    completedAt: new Date().toISOString(),
                    errors: [
                        error instanceof Error ? error.message : 'Unknown error',
                    ],
                });
            } catch (updateError) {
                console.error(
                    '[AIMonitoringScheduler] Error updating job status:',
                    updateError
                );
            }

            throw new AIMonitoringError(
                `Failed to execute monitoring: ${error instanceof Error ? error.message : 'Unknown error'
                }`,
                userId,
                error
            );
        }
    }

    /**
     * Check rate limits for a user
     * @param userId User ID
     * @returns Rate limit check result
     */
    async checkRateLimits(userId: string): Promise<RateLimitCheckResult> {
        try {
            const config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(
                userId
            );

            if (!config) {
                // No config means no queries executed yet
                return {
                    canExecute: true,
                    remainingQueries: this.DEFAULT_QUERY_LIMIT,
                    resetDate: this.calculateResetDate().toISOString(),
                };
            }

            // Check if we need to reset the counter
            const lastExecuted = config.lastExecuted
                ? new Date(config.lastExecuted)
                : new Date(0);
            const daysSinceLastExecution =
                (Date.now() - lastExecuted.getTime()) / (1000 * 60 * 60 * 24);

            let queriesThisPeriod = config.queriesThisPeriod;
            let resetDate = this.calculateResetDate();

            if (daysSinceLastExecution >= this.RATE_LIMIT_PERIOD_DAYS) {
                // Reset counter
                queriesThisPeriod = 0;
                await this.repository.updateAIMonitoringConfig(userId, {
                    queriesThisPeriod: 0,
                });
            }

            const remainingQueries = Math.max(
                0,
                config.queryLimit - queriesThisPeriod
            );
            const canExecute = remainingQueries > 0;

            return {
                canExecute,
                remainingQueries,
                resetDate: resetDate.toISOString(),
            };
        } catch (error) {
            console.error(
                `[AIMonitoringScheduler] Error checking rate limits for user ${userId}:`,
                error
            );
            throw new AIMonitoringError(
                `Failed to check rate limits: ${error instanceof Error ? error.message : 'Unknown error'
                }`,
                userId,
                error
            );
        }
    }

    /**
     * Increment query counter with atomic operation
     * @param userId User ID
     */
    private async incrementQueryCounter(userId: string): Promise<void> {
        try {
            const config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(
                userId
            );

            if (config) {
                await this.repository.updateAIMonitoringConfig(userId, {
                    queriesThisPeriod: (config.queriesThisPeriod || 0) + 1,
                });
            }
        } catch (error) {
            console.error(
                '[AIMonitoringScheduler] Error incrementing query counter:',
                error
            );
            // Don't throw - this is not critical
        }
    }

    /**
     * Calculate and store visibility score
     * Handles case when no mentions are found by storing a zero score
     * @param userId User ID
     */
    private async calculateAndStoreVisibilityScore(
        userId: string
    ): Promise<void> {
        try {
            // Get mentions from last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const mentionsResult = await this.repository.queryAIMentionsByDateRange<AIMention>(
                userId,
                thirtyDaysAgo.toISOString(),
                new Date().toISOString()
            );

            if (mentionsResult.items.length === 0) {
                console.log(
                    `[AIMonitoringScheduler] No mentions found for user ${userId}, storing zero score`
                );

                // Store a zero score to indicate monitoring was performed but no mentions found
                const zeroScore: AIVisibilityScore = {
                    id: uuidv4(),
                    userId,
                    score: 0,
                    breakdown: {
                        mentionFrequency: 0,
                        sentimentScore: 0,
                        prominenceScore: 0,
                        platformDiversity: 0,
                    },
                    mentionCount: 0,
                    sentimentDistribution: {
                        positive: 0,
                        neutral: 0,
                        negative: 0,
                    },
                    platformBreakdown: {
                        chatgpt: 0,
                        perplexity: 0,
                        claude: 0,
                        gemini: 0,
                    },
                    trend: 'stable',
                    trendPercentage: 0,
                    previousScore: 0,
                    calculatedAt: new Date().toISOString(),
                    periodStart: thirtyDaysAgo.toISOString(),
                    periodEnd: new Date().toISOString(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                await this.repository.saveAIVisibilityScore(
                    userId,
                    zeroScore.calculatedAt,
                    zeroScore,
                    true // Mark as latest
                );

                return;
            }

            // Calculate score using Bedrock flow
            const scoreResult = await calculateVisibilityScore({
                mentions: mentionsResult.items,
                timeRange: 30,
            });

            // Store score
            const score: AIVisibilityScore = {
                id: uuidv4(),
                userId,
                score: scoreResult.score,
                breakdown: scoreResult.breakdown,
                mentionCount: mentionsResult.items.length,
                sentimentDistribution: this.calculateSentimentDistribution(
                    mentionsResult.items
                ),
                platformBreakdown: this.calculatePlatformBreakdown(
                    mentionsResult.items
                ),
                trend: scoreResult.trend,
                trendPercentage: scoreResult.trendPercentage,
                previousScore: 0, // Will be updated by flow
                calculatedAt: new Date().toISOString(),
                periodStart: thirtyDaysAgo.toISOString(),
                periodEnd: new Date().toISOString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            await this.repository.saveAIVisibilityScore(
                userId,
                score.calculatedAt,
                score,
                true // Mark as latest
            );

            console.log(
                `[AIMonitoringScheduler] Stored visibility score for user ${userId}: ${score.score}`
            );
        } catch (error) {
            console.error(
                '[AIMonitoringScheduler] Error calculating visibility score:',
                error
            );
            // Don't throw - this is not critical
        }
    }

    /**
     * Calculate sentiment distribution from mentions
     * @param mentions Array of mentions
     * @returns Sentiment distribution
     */
    private calculateSentimentDistribution(mentions: AIMention[]): {
        positive: number;
        neutral: number;
        negative: number;
    } {
        const distribution = {
            positive: 0,
            neutral: 0,
            negative: 0,
        };

        for (const mention of mentions) {
            distribution[mention.sentiment]++;
        }

        return distribution;
    }

    /**
     * Calculate platform breakdown from mentions
     * @param mentions Array of mentions
     * @returns Platform breakdown
     */
    private calculatePlatformBreakdown(mentions: AIMention[]): {
        chatgpt: number;
        perplexity: number;
        claude: number;
        gemini: number;
    } {
        const breakdown = {
            chatgpt: 0,
            perplexity: 0,
            claude: 0,
            gemini: 0,
        };

        for (const mention of mentions) {
            breakdown[mention.platform]++;
        }

        return breakdown;
    }

    /**
     * Calculate next scheduled time based on frequency
     * @param from Starting date
     * @param frequency Monitoring frequency
     * @returns Next scheduled date
     */
    private calculateNextScheduledTime(
        from: Date,
        frequency: 'daily' | 'weekly' | 'monthly'
    ): Date {
        const next = new Date(from);

        switch (frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
        }

        return next;
    }

    /**
     * Calculate rate limit reset date
     * @returns Reset date
     */
    private calculateResetDate(): Date {
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + this.RATE_LIMIT_PERIOD_DAYS);
        return resetDate;
    }

    /**
     * Get platform API endpoint
     * @param platform Platform name
     * @returns API endpoint
     */
    private getPlatformEndpoint(
        platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini'
    ): string {
        const endpoints = {
            chatgpt: 'https://api.openai.com/v1/chat/completions',
            perplexity: 'https://api.perplexity.ai/chat/completions',
            claude: 'https://api.anthropic.com/v1/messages',
            gemini:
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        };

        return endpoints[platform];
    }

    /**
     * Get platform API key from environment
     * @param platform Platform name
     * @returns API key
     */
    private async getPlatformApiKey(
        platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini'
    ): Promise<string> {
        // In production, these would come from AWS Secrets Manager
        const envKeys = {
            chatgpt: process.env.OPENAI_API_KEY || '',
            perplexity: process.env.PERPLEXITY_API_KEY || '',
            claude: process.env.ANTHROPIC_API_KEY || '',
            gemini: process.env.GOOGLE_AI_API_KEY || '',
        };

        const key = envKeys[platform];

        if (!key) {
            throw new AIMonitoringError(
                `API key not configured for platform: ${platform}`
            );
        }

        return key;
    }

    /**
     * Delay execution
     * @param ms Milliseconds to delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create an AI monitoring scheduler instance
 * @returns AIMonitoringScheduler instance
 */
export function createAIMonitoringScheduler(): AIMonitoringScheduler {
    return new AIMonitoringScheduler();
}
