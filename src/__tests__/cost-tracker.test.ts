/**
 * Cost Tracker Tests
 * 
 * Tests for cost calculation, aggregation, and reporting functionality.
 */

import {
    calculateExecutionCost,
    aggregateFeatureCosts,
    generateCostComparison,
    generateDashboardMetrics,
    formatCost,
    formatTokenCount,
    MODEL_PRICING,
} from '@/aws/bedrock/cost-tracker';
import { BEDROCK_MODELS } from '@/aws/bedrock/flow-base';
import type { FlowExecutionLog, TokenUsage } from '@/aws/bedrock/execution-logger';

describe('Cost Tracker', () => {
    describe('calculateExecutionCost', () => {
        it('should calculate cost correctly for Haiku', () => {
            const tokenUsage: TokenUsage = {
                input: 1000,
                output: 500,
            };

            const cost = calculateExecutionCost(tokenUsage, BEDROCK_MODELS.HAIKU);

            // Haiku: $0.25/1M input, $1.25/1M output
            // Input: (1000 / 1,000,000) * 0.25 = 0.00025
            // Output: (500 / 1,000,000) * 1.25 = 0.000625
            // Total: 0.000875
            expect(cost.inputCost).toBeCloseTo(0.00025, 6);
            expect(cost.outputCost).toBeCloseTo(0.000625, 6);
            expect(cost.totalCost).toBeCloseTo(0.000875, 6);
            expect(cost.modelId).toBe(BEDROCK_MODELS.HAIKU);
        });

        it('should calculate cost correctly for Sonnet', () => {
            const tokenUsage: TokenUsage = {
                input: 10000,
                output: 5000,
            };

            const cost = calculateExecutionCost(tokenUsage, BEDROCK_MODELS.SONNET_3_5_V2);

            // Sonnet: $3/1M input, $15/1M output
            // Input: (10000 / 1,000,000) * 3 = 0.03
            // Output: (5000 / 1,000,000) * 15 = 0.075
            // Total: 0.105
            expect(cost.inputCost).toBeCloseTo(0.03, 6);
            expect(cost.outputCost).toBeCloseTo(0.075, 6);
            expect(cost.totalCost).toBeCloseTo(0.105, 6);
        });

        it('should calculate cost correctly for Opus', () => {
            const tokenUsage: TokenUsage = {
                input: 5000,
                output: 2000,
            };

            const cost = calculateExecutionCost(tokenUsage, BEDROCK_MODELS.OPUS);

            // Opus: $15/1M input, $75/1M output
            // Input: (5000 / 1,000,000) * 15 = 0.075
            // Output: (2000 / 1,000,000) * 75 = 0.15
            // Total: 0.225
            expect(cost.inputCost).toBeCloseTo(0.075, 6);
            expect(cost.outputCost).toBeCloseTo(0.15, 6);
            expect(cost.totalCost).toBeCloseTo(0.225, 6);
        });

        it('should throw error for unknown model', () => {
            const tokenUsage: TokenUsage = { input: 1000, output: 500 };

            expect(() => {
                calculateExecutionCost(tokenUsage, 'unknown-model');
            }).toThrow('Unknown model ID for pricing');
        });
    });

    describe('aggregateFeatureCosts', () => {
        it('should aggregate costs from multiple logs', () => {
            const logs: FlowExecutionLog[] = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    flowName: 'generateBlogPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 2000,
                    tokenUsage: { input: 1000, output: 5000 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 8192,
                    },
                },
                {
                    timestamp: '2024-01-01T11:00:00Z',
                    flowName: 'generateBlogPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 1800,
                    tokenUsage: { input: 1200, output: 4800 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 8192,
                    },
                },
                {
                    timestamp: '2024-01-01T12:00:00Z',
                    flowName: 'generateAgentBio',
                    modelId: BEDROCK_MODELS.HAIKU,
                    executionTimeMs: 500,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.3,
                        maxTokens: 2048,
                    },
                },
            ];

            const aggregated = aggregateFeatureCosts(logs);

            expect(Object.keys(aggregated)).toHaveLength(2);

            // Check blog post aggregation
            expect(aggregated.generateBlogPost.invocationCount).toBe(2);
            expect(aggregated.generateBlogPost.totalTokens.input).toBe(2200);
            expect(aggregated.generateBlogPost.totalTokens.output).toBe(9800);
            expect(aggregated.generateBlogPost.totalCost).toBeGreaterThan(0);

            // Check agent bio
            expect(aggregated.generateAgentBio.invocationCount).toBe(1);
            expect(aggregated.generateAgentBio.totalTokens.input).toBe(500);
            expect(aggregated.generateAgentBio.totalTokens.output).toBe(200);
        });

        it('should skip failed executions without token usage', () => {
            const logs: FlowExecutionLog[] = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    flowName: 'generateBlogPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 2000,
                    success: false,
                    error: {
                        type: 'BedrockError',
                        message: 'Throttling',
                        retryCount: 3,
                    },
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 8192,
                    },
                },
            ];

            const aggregated = aggregateFeatureCosts(logs);

            expect(Object.keys(aggregated)).toHaveLength(0);
        });

        it('should track model breakdown correctly', () => {
            const logs: FlowExecutionLog[] = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    flowName: 'generateSocialPost',
                    modelId: BEDROCK_MODELS.HAIKU,
                    executionTimeMs: 500,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 2048,
                    },
                },
                {
                    timestamp: '2024-01-01T11:00:00Z',
                    flowName: 'generateSocialPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 1000,
                    tokenUsage: { input: 800, output: 400 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 4096,
                    },
                },
            ];

            const aggregated = aggregateFeatureCosts(logs);

            expect(aggregated.generateSocialPost.modelBreakdown[BEDROCK_MODELS.HAIKU]).toBeDefined();
            expect(aggregated.generateSocialPost.modelBreakdown[BEDROCK_MODELS.SONNET_3_5_V2]).toBeDefined();
            expect(aggregated.generateSocialPost.modelBreakdown[BEDROCK_MODELS.HAIKU].invocationCount).toBe(1);
            expect(aggregated.generateSocialPost.modelBreakdown[BEDROCK_MODELS.SONNET_3_5_V2].invocationCount).toBe(1);
        });
    });

    describe('generateCostComparison', () => {
        it('should generate comparison showing savings', () => {
            // Before: Using Sonnet for everything
            const beforeLogs: FlowExecutionLog[] = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    flowName: 'generateAgentBio',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 1000,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.3,
                        maxTokens: 2048,
                    },
                },
            ];

            // After: Using Haiku for simple tasks
            const afterLogs: FlowExecutionLog[] = [
                {
                    timestamp: '2024-01-15T10:00:00Z',
                    flowName: 'generateAgentBio',
                    modelId: BEDROCK_MODELS.HAIKU,
                    executionTimeMs: 500,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.3,
                        maxTokens: 2048,
                    },
                },
            ];

            const comparison = generateCostComparison(beforeLogs, afterLogs, 'test');

            expect(comparison.before.totalCost).toBeGreaterThan(comparison.after.totalCost);
            expect(comparison.savings.absoluteSavings).toBeGreaterThan(0);
            expect(comparison.savings.percentageSavings).toBeGreaterThan(0);
            expect(comparison.savings.savingsByFeature.generateAgentBio.absoluteSavings).toBeGreaterThan(0);
        });

        it('should handle empty logs', () => {
            const comparison = generateCostComparison([], [], 'test');

            expect(comparison.before.totalCost).toBe(0);
            expect(comparison.after.totalCost).toBe(0);
            expect(comparison.savings.absoluteSavings).toBe(0);
            expect(comparison.savings.percentageSavings).toBe(0);
        });
    });

    describe('generateDashboardMetrics', () => {
        it('should generate comprehensive dashboard metrics', () => {
            const logs: FlowExecutionLog[] = [
                {
                    timestamp: new Date().toISOString(),
                    flowName: 'generateBlogPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 2000,
                    tokenUsage: { input: 1000, output: 5000 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 8192,
                    },
                },
                {
                    timestamp: new Date().toISOString(),
                    flowName: 'generateAgentBio',
                    modelId: BEDROCK_MODELS.HAIKU,
                    executionTimeMs: 500,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.3,
                        maxTokens: 2048,
                    },
                },
            ];

            const metrics = generateDashboardMetrics(logs, 30);

            expect(metrics.currentPeriod.totalCost).toBeGreaterThan(0);
            expect(metrics.currentPeriod.totalInvocations).toBe(2);
            expect(metrics.currentPeriod.costByCategory['content-generation']).toBeDefined();
            expect(metrics.currentPeriod.costByModel[BEDROCK_MODELS.SONNET_3_5_V2]).toBeDefined();
            expect(metrics.currentPeriod.costByModel[BEDROCK_MODELS.HAIKU]).toBeDefined();
            expect(metrics.currentPeriod.topCostlyFeatures.length).toBeGreaterThan(0);
            expect(metrics.projections.monthlyProjection).toBeGreaterThan(0);
        });

        it('should filter logs by date range', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 60);

            const logs: FlowExecutionLog[] = [
                {
                    timestamp: oldDate.toISOString(),
                    flowName: 'generateBlogPost',
                    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
                    executionTimeMs: 2000,
                    tokenUsage: { input: 1000, output: 5000 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.7,
                        maxTokens: 8192,
                    },
                },
                {
                    timestamp: new Date().toISOString(),
                    flowName: 'generateAgentBio',
                    modelId: BEDROCK_MODELS.HAIKU,
                    executionTimeMs: 500,
                    tokenUsage: { input: 500, output: 200 },
                    success: true,
                    metadata: {
                        featureCategory: 'content-generation',
                        temperature: 0.3,
                        maxTokens: 2048,
                    },
                },
            ];

            const metrics = generateDashboardMetrics(logs, 30);

            // Should only include the recent log
            expect(metrics.currentPeriod.totalInvocations).toBe(1);
        });
    });

    describe('formatCost', () => {
        it('should format cost as currency', () => {
            expect(formatCost(0.000875)).toBe('$0.0009');
            expect(formatCost(1.2345)).toBe('$1.2345');
            expect(formatCost(100)).toBe('$100.0000');
        });
    });

    describe('formatTokenCount', () => {
        it('should format token counts with appropriate units', () => {
            expect(formatTokenCount(500)).toBe('500');
            expect(formatTokenCount(1500)).toBe('1.50K');
            expect(formatTokenCount(1500000)).toBe('1.50M');
        });
    });

    describe('MODEL_PRICING', () => {
        it('should have pricing for all models', () => {
            expect(MODEL_PRICING[BEDROCK_MODELS.HAIKU]).toBeDefined();
            expect(MODEL_PRICING[BEDROCK_MODELS.SONNET_3]).toBeDefined();
            expect(MODEL_PRICING[BEDROCK_MODELS.SONNET_3_5_V1]).toBeDefined();
            expect(MODEL_PRICING[BEDROCK_MODELS.SONNET_3_5_V2]).toBeDefined();
            expect(MODEL_PRICING[BEDROCK_MODELS.OPUS]).toBeDefined();
        });

        it('should have valid pricing values', () => {
            for (const [modelId, pricing] of Object.entries(MODEL_PRICING)) {
                expect(pricing.input).toBeGreaterThan(0);
                expect(pricing.output).toBeGreaterThan(0);
                expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
            }
        });
    });
});

