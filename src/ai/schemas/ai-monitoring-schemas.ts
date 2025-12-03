import { z } from 'zod';

/**
 * Schema for analyzing an AI mention
 */
export const AnalyzeAIMentionInputSchema = z.object({
    agentName: z.string().describe('The name of the real estate agent'),
    aiResponse: z.string().describe('The full AI response text'),
    query: z.string().describe('The query that triggered the mention'),
    platform: z.enum(['chatgpt', 'perplexity', 'claude', 'gemini']).describe('The AI platform that generated the response'),
});

export const AnalyzeAIMentionOutputSchema = z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']).describe('The sentiment of the mention'),
    sentimentReason: z.string().describe('Brief explanation of why the sentiment was classified this way'),
    topics: z.array(z.string()).describe('Key topics extracted from the mention'),
    expertiseAreas: z.array(z.string()).describe('Areas of expertise associated with the agent in this mention'),
    contextSnippet: z.string().describe('A brief excerpt containing the mention'),
    prominence: z.enum(['high', 'medium', 'low']).describe('How prominently the agent is featured in the response'),
});

export type AnalyzeAIMentionInput = z.infer<typeof AnalyzeAIMentionInputSchema>;
export type AnalyzeAIMentionOutput = z.infer<typeof AnalyzeAIMentionOutputSchema>;

/**
 * Schema for calculating visibility score
 */
export const CalculateVisibilityScoreInputSchema = z.object({
    mentions: z.array(z.object({
        sentiment: z.enum(['positive', 'neutral', 'negative']),
        prominence: z.enum(['high', 'medium', 'low']),
        platform: z.enum(['chatgpt', 'perplexity', 'claude', 'gemini']),
        timestamp: z.string(),
    })).describe('Array of mentions to analyze'),
    timeRange: z.number().describe('Time range in days'),
    previousScore: z.number().optional().describe('Previous visibility score for trend calculation'),
});

export const CalculateVisibilityScoreOutputSchema = z.object({
    score: z.number().min(0).max(100).describe('Overall visibility score from 0-100'),
    breakdown: z.object({
        mentionFrequency: z.number().describe('Score component based on mention frequency'),
        sentimentScore: z.number().describe('Score component based on sentiment distribution'),
        prominenceScore: z.number().describe('Score component based on mention prominence'),
        platformDiversity: z.number().describe('Score component based on platform diversity'),
    }).describe('Breakdown of score components'),
    trend: z.enum(['up', 'down', 'stable']).describe('Trend compared to previous period'),
    trendPercentage: z.number().describe('Percentage change from previous score'),
});

export type CalculateVisibilityScoreInput = z.infer<typeof CalculateVisibilityScoreInputSchema>;
export type CalculateVisibilityScoreOutput = z.infer<typeof CalculateVisibilityScoreOutputSchema>;

/**
 * Schema for extracting topics
 */
export const ExtractTopicsInputSchema = z.object({
    mentions: z.array(z.object({
        topics: z.array(z.string()),
        contextSnippet: z.string(),
    })).describe('Array of mentions with topics'),
});

export const ExtractTopicsOutputSchema = z.object({
    topics: z.array(z.object({
        topic: z.string().describe('The topic name'),
        count: z.number().describe('Number of mentions containing this topic'),
        examples: z.array(z.string()).describe('Example quotes for this topic'),
    })).describe('Aggregated topics with counts and examples'),
});

export type ExtractTopicsInput = z.infer<typeof ExtractTopicsInputSchema>;
export type ExtractTopicsOutput = z.infer<typeof ExtractTopicsOutputSchema>;

/**
 * Schema for getting AI visibility data
 */
export const GetAIVisibilityDataInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

export type GetAIVisibilityDataInput = z.infer<typeof GetAIVisibilityDataInputSchema>;

/**
 * Schema for getting AI mentions with filtering
 */
export const GetAIMentionsInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    limit: z.number().min(1).max(100).optional().default(20),
    platform: z.enum(['chatgpt', 'perplexity', 'claude', 'gemini']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type GetAIMentionsInput = z.infer<typeof GetAIMentionsInputSchema>;

/**
 * Schema for getting competitor AI visibility
 */
export const GetCompetitorAIVisibilityInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    competitorIds: z.array(z.string()).min(1, 'At least one competitor ID is required'),
});

export type GetCompetitorAIVisibilityInput = z.infer<typeof GetCompetitorAIVisibilityInputSchema>;

/**
 * Schema for triggering manual monitoring
 */
export const TriggerManualMonitoringInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

export type TriggerManualMonitoringInput = z.infer<typeof TriggerManualMonitoringInputSchema>;

/**
 * Schema for exporting AI visibility report
 */
export const ExportAIVisibilityReportInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    dateRange: z.object({
        start: z.string().datetime('Invalid start date format'),
        end: z.string().datetime('Invalid end date format'),
    }).refine(
        (data) => new Date(data.start) <= new Date(data.end),
        'Start date must be before or equal to end date'
    ),
});

export type ExportAIVisibilityReportInput = z.infer<typeof ExportAIVisibilityReportInputSchema>;
