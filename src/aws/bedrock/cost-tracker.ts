/**
 * Bedrock Cost Tracking Module
 * 
 * Provides cost tracking and analysis for Bedrock AI flows.
 * Tracks token usage, calculates costs, and generates cost reports.
 */

import { z } from 'zod';
import { BEDROCK_MODELS } from './flow-base';
import type { TokenUsage, FlowExecutionLog } from './execution-logger';

/**
 * Pricing information for Bedrock models (per 1M tokens)
 * Prices as of November 2024
 */
export const MODEL_PRICING = {
    [BEDROCK_MODELS.HAIKU]: {
        input: 0.25,  // $0.25 per 1M input tokens
        output: 1.25, // $1.25 per 1M output tokens
    },
    [BEDROCK_MODELS.SONNET_3]: {
        input: 3.0,   // $3.00 per 1M input tokens
        output: 15.0, // $15.00 per 1M output tokens
    },
    [BEDROCK_MODELS.SONNET_3_5_V1]: {
        input: 3.0,   // $3.00 per 1M input tokens
        output: 15.0, // $15.00 per 1M output tokens
    },
    [BEDROCK_MODELS.SONNET_3_5_V2]: {
        input: 3.0,   // $3.00 per 1M input tokens
        output: 15.0, // $15.00 per 1M output tokens
    },
    [BEDROCK_MODELS.OPUS]: {
        input: 15.0,  // $15.00 per 1M input tokens
        output: 75.0, // $75.00 per 1M output tokens
    },
} as const;

/**
 * Cost calculation result
 */
export interface CostCalculation {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    tokenUsage: TokenUsage;
    modelId: string;
}

/**
 * Feature cost summary
 */
export interface FeatureCostSummary {
    flowName: string;
    featureCategory: string;
    invocationCount: number;
    totalTokens: {
        input: number;
        output: number;
    };
    totalCost: number;
    averageCostPerInvocation: number;
    modelBreakdown: Record<string, {
        invocationCount: number;
        totalCost: number;
    }>;
}

/**
 * Cost comparison between two periods or configurations
 */
export interface CostComparison {
    period: string;
    before: {
        totalCost: number;
        totalInvocations: number;
        averageCostPerInvocation: number;
        byFeature: Record<string, FeatureCostSummary>;
    };
    after: {
        totalCost: number;
        totalInvocations: number;
        averageCostPerInvocation: number;
        byFeature: Record<string, FeatureCostSummary>;
    };
    savings: {
        absoluteSavings: number;
        percentageSavings: number;
        savingsByFeature: Record<string, {
            absoluteSavings: number;
            percentageSavings: number;
        }>;
    };
}

/**
 * Dashboard metrics for cost monitoring
 */
export interface CostDashboardMetrics {
    currentPeriod: {
        totalCost: number;
        totalInvocations: number;
        averageCostPerInvocation: number;
        costByCategory: Record<string, number>;
        costByModel: Record<string, number>;
        topCostlyFeatures: Array<{
            flowName: string;
            totalCost: number;
            invocationCount: number;
        }>;
    };
    trends: {
        dailyCosts: Array<{
            date: string;
            cost: number;
            invocations: number;
        }>;
        costByFeatureOverTime: Record<string, Array<{
            date: string;
            cost: number;
        }>>;
    };
    projections: {
        monthlyProjection: number;
        dailyAverage: number;
    };
}

/**
 * Calculate cost for a single execution
 */
export function calculateExecutionCost(
    tokenUsage: TokenUsage,
    modelId: string
): CostCalculation {
    // Get pricing for the model
    const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];

    if (!pricing) {
        throw new Error(`Unknown model ID for pricing: ${modelId}`);
    }

    // Calculate costs (pricing is per 1M tokens)
    const inputCost = (tokenUsage.input / 1_000_000) * pricing.input;
    const outputCost = (tokenUsage.output / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
        inputCost,
        outputCost,
        totalCost,
        tokenUsage,
        modelId,
    };
}

/**
 * Aggregate costs from multiple execution logs
 */
export function aggregateFeatureCosts(
    logs: FlowExecutionLog[]
): Record<string, FeatureCostSummary> {
    const featureMap = new Map<string, FeatureCostSummary>();

    for (const log of logs) {
        // Skip failed executions without token usage
        if (!log.success || !log.tokenUsage) {
            continue;
        }

        const flowName = log.flowName;

        // Get or create feature summary
        let summary = featureMap.get(flowName);
        if (!summary) {
            summary = {
                flowName,
                featureCategory: log.metadata.featureCategory,
                invocationCount: 0,
                totalTokens: {
                    input: 0,
                    output: 0,
                },
                totalCost: 0,
                averageCostPerInvocation: 0,
                modelBreakdown: {},
            };
            featureMap.set(flowName, summary);
        }

        // Calculate cost for this execution
        const cost = calculateExecutionCost(log.tokenUsage, log.modelId);

        // Update summary
        summary.invocationCount++;
        summary.totalTokens.input += log.tokenUsage.input;
        summary.totalTokens.output += log.tokenUsage.output;
        summary.totalCost += cost.totalCost;
        summary.averageCostPerInvocation = summary.totalCost / summary.invocationCount;

        // Update model breakdown
        if (!summary.modelBreakdown[log.modelId]) {
            summary.modelBreakdown[log.modelId] = {
                invocationCount: 0,
                totalCost: 0,
            };
        }
        summary.modelBreakdown[log.modelId].invocationCount++;
        summary.modelBreakdown[log.modelId].totalCost += cost.totalCost;
    }

    return Object.fromEntries(featureMap);
}

/**
 * Generate cost comparison report
 */
export function generateCostComparison(
    beforeLogs: FlowExecutionLog[],
    afterLogs: FlowExecutionLog[],
    period: string = 'comparison'
): CostComparison {
    // Aggregate costs for both periods
    const beforeFeatures = aggregateFeatureCosts(beforeLogs);
    const afterFeatures = aggregateFeatureCosts(afterLogs);

    // Calculate totals for before period
    const beforeTotal = Object.values(beforeFeatures).reduce(
        (sum, feature) => sum + feature.totalCost,
        0
    );
    const beforeInvocations = Object.values(beforeFeatures).reduce(
        (sum, feature) => sum + feature.invocationCount,
        0
    );

    // Calculate totals for after period
    const afterTotal = Object.values(afterFeatures).reduce(
        (sum, feature) => sum + feature.totalCost,
        0
    );
    const afterInvocations = Object.values(afterFeatures).reduce(
        (sum, feature) => sum + feature.invocationCount,
        0
    );

    // Calculate savings
    const absoluteSavings = beforeTotal - afterTotal;
    const percentageSavings = beforeTotal > 0
        ? (absoluteSavings / beforeTotal) * 100
        : 0;

    // Calculate savings by feature
    const savingsByFeature: Record<string, { absoluteSavings: number; percentageSavings: number }> = {};

    for (const flowName of new Set([
        ...Object.keys(beforeFeatures),
        ...Object.keys(afterFeatures),
    ])) {
        const beforeCost = beforeFeatures[flowName]?.totalCost || 0;
        const afterCost = afterFeatures[flowName]?.totalCost || 0;
        const featureSavings = beforeCost - afterCost;
        const featurePercentage = beforeCost > 0
            ? (featureSavings / beforeCost) * 100
            : 0;

        savingsByFeature[flowName] = {
            absoluteSavings: featureSavings,
            percentageSavings: featurePercentage,
        };
    }

    return {
        period,
        before: {
            totalCost: beforeTotal,
            totalInvocations: beforeInvocations,
            averageCostPerInvocation: beforeInvocations > 0
                ? beforeTotal / beforeInvocations
                : 0,
            byFeature: beforeFeatures,
        },
        after: {
            totalCost: afterTotal,
            totalInvocations: afterInvocations,
            averageCostPerInvocation: afterInvocations > 0
                ? afterTotal / afterInvocations
                : 0,
            byFeature: afterFeatures,
        },
        savings: {
            absoluteSavings,
            percentageSavings,
            savingsByFeature,
        },
    };
}

/**
 * Generate dashboard metrics from execution logs
 */
export function generateDashboardMetrics(
    logs: FlowExecutionLog[],
    daysToInclude: number = 30
): CostDashboardMetrics {
    // Filter logs to the specified time period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToInclude);

    const recentLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
    });

    // Aggregate feature costs
    const featureCosts = aggregateFeatureCosts(recentLogs);

    // Calculate totals
    const totalCost = Object.values(featureCosts).reduce(
        (sum, feature) => sum + feature.totalCost,
        0
    );
    const totalInvocations = Object.values(featureCosts).reduce(
        (sum, feature) => sum + feature.invocationCount,
        0
    );

    // Calculate cost by category
    const costByCategory: Record<string, number> = {};
    for (const feature of Object.values(featureCosts)) {
        costByCategory[feature.featureCategory] =
            (costByCategory[feature.featureCategory] || 0) + feature.totalCost;
    }

    // Calculate cost by model
    const costByModel: Record<string, number> = {};
    for (const log of recentLogs) {
        if (log.success && log.tokenUsage) {
            const cost = calculateExecutionCost(log.tokenUsage, log.modelId);
            costByModel[log.modelId] = (costByModel[log.modelId] || 0) + cost.totalCost;
        }
    }

    // Get top costly features
    const topCostlyFeatures = Object.values(featureCosts)
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10)
        .map(feature => ({
            flowName: feature.flowName,
            totalCost: feature.totalCost,
            invocationCount: feature.invocationCount,
        }));

    // Calculate daily costs
    const dailyCostsMap = new Map<string, { cost: number; invocations: number }>();
    for (const log of recentLogs) {
        if (log.success && log.tokenUsage) {
            const date = new Date(log.timestamp).toISOString().split('T')[0];
            const cost = calculateExecutionCost(log.tokenUsage, log.modelId);

            const existing = dailyCostsMap.get(date) || { cost: 0, invocations: 0 };
            dailyCostsMap.set(date, {
                cost: existing.cost + cost.totalCost,
                invocations: existing.invocations + 1,
            });
        }
    }

    const dailyCosts = Array.from(dailyCostsMap.entries())
        .map(([date, data]) => ({
            date,
            cost: data.cost,
            invocations: data.invocations,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cost by feature over time
    const costByFeatureOverTime: Record<string, Array<{ date: string; cost: number }>> = {};
    for (const log of recentLogs) {
        if (log.success && log.tokenUsage) {
            const date = new Date(log.timestamp).toISOString().split('T')[0];
            const cost = calculateExecutionCost(log.tokenUsage, log.modelId);

            if (!costByFeatureOverTime[log.flowName]) {
                costByFeatureOverTime[log.flowName] = [];
            }

            const existing = costByFeatureOverTime[log.flowName].find(d => d.date === date);
            if (existing) {
                existing.cost += cost.totalCost;
            } else {
                costByFeatureOverTime[log.flowName].push({ date, cost: cost.totalCost });
            }
        }
    }

    // Sort each feature's timeline
    for (const flowName in costByFeatureOverTime) {
        costByFeatureOverTime[flowName].sort((a, b) => a.date.localeCompare(b.date));
    }

    // Calculate projections
    const dailyAverage = dailyCosts.length > 0
        ? totalCost / dailyCosts.length
        : 0;
    const monthlyProjection = dailyAverage * 30;

    return {
        currentPeriod: {
            totalCost,
            totalInvocations,
            averageCostPerInvocation: totalInvocations > 0
                ? totalCost / totalInvocations
                : 0,
            costByCategory,
            costByModel,
            topCostlyFeatures,
        },
        trends: {
            dailyCosts,
            costByFeatureOverTime,
        },
        projections: {
            monthlyProjection,
            dailyAverage,
        },
    };
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    }).format(cost);
}

/**
 * Format large numbers with appropriate units
 */
export function formatTokenCount(tokens: number): string {
    if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
    if (tokens >= 1_000) {
        return `${(tokens / 1_000).toFixed(2)}K`;
    }
    return tokens.toString();
}

/**
 * Zod schemas for validation
 */
export const CostCalculationSchema = z.object({
    inputCost: z.number(),
    outputCost: z.number(),
    totalCost: z.number(),
    tokenUsage: z.object({
        input: z.number(),
        output: z.number(),
    }),
    modelId: z.string(),
});

export const FeatureCostSummarySchema = z.object({
    flowName: z.string(),
    featureCategory: z.string(),
    invocationCount: z.number(),
    totalTokens: z.object({
        input: z.number(),
        output: z.number(),
    }),
    totalCost: z.number(),
    averageCostPerInvocation: z.number(),
    modelBreakdown: z.record(z.object({
        invocationCount: z.number(),
        totalCost: z.number(),
    })),
});

export const CostComparisonSchema = z.object({
    period: z.string(),
    before: z.object({
        totalCost: z.number(),
        totalInvocations: z.number(),
        averageCostPerInvocation: z.number(),
        byFeature: z.record(FeatureCostSummarySchema),
    }),
    after: z.object({
        totalCost: z.number(),
        totalInvocations: z.number(),
        averageCostPerInvocation: z.number(),
        byFeature: z.record(FeatureCostSummarySchema),
    }),
    savings: z.object({
        absoluteSavings: z.number(),
        percentageSavings: z.number(),
        savingsByFeature: z.record(z.object({
            absoluteSavings: z.number(),
            percentageSavings: z.number(),
        })),
    }),
});

