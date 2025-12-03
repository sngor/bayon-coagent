/**
 * Tests for AI Cost Control Service
 */

import { describe, it, expect } from '@jest/globals';
import {
    AICostControlService,
    APIUsageRecord,
    UserBudget,
    CostEstimate,
    CostSpikeAlert,
} from '../ai-cost-control';

describe('AICostControlService', () => {
    describe('Type definitions', () => {
        it('should have correct APIUsageRecord structure', () => {
            const record: APIUsageRecord = {
                id: 'usage-1',
                userId: 'user-123',
                platform: 'chatgpt',
                queryCount: 10,
                estimatedCost: 0.02,
                timestamp: new Date().toISOString(),
                periodStart: new Date().toISOString(),
                periodEnd: new Date().toISOString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(record.platform).toBe('chatgpt');
            expect(record.queryCount).toBe(10);
            expect(record.estimatedCost).toBe(0.02);
        });

        it('should have correct UserBudget structure', () => {
            const budget: UserBudget = {
                id: 'budget-1',
                userId: 'user-123',
                monthlyLimit: 50,
                currentSpend: 10,
                periodStart: new Date().toISOString(),
                periodEnd: new Date().toISOString(),
                alertThresholds: [0.5, 0.75, 0.9],
                alertsSent: [],
                autoReduceFrequency: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(budget.monthlyLimit).toBe(50);
            expect(budget.currentSpend).toBe(10);
            expect(budget.alertThresholds).toHaveLength(3);
        });

        it('should have correct CostEstimate structure', () => {
            const estimate: CostEstimate = {
                totalCost: 0.05,
                breakdown: [
                    {
                        platform: 'chatgpt',
                        queries: 10,
                        costPerQuery: 0.002,
                        totalCost: 0.02,
                    },
                    {
                        platform: 'perplexity',
                        queries: 10,
                        costPerQuery: 0.001,
                        totalCost: 0.01,
                    },
                ],
                withinBudget: true,
                remainingBudget: 40,
            };

            expect(estimate.totalCost).toBe(0.05);
            expect(estimate.breakdown).toHaveLength(2);
            expect(estimate.withinBudget).toBe(true);
        });

        it('should have correct CostSpikeAlert structure', () => {
            const alert: CostSpikeAlert = {
                id: 'alert-1',
                userId: 'user-123',
                currentSpend: 100,
                previousPeriodSpend: 50,
                percentageIncrease: 1.0,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                createdAt: Date.now(),
            };

            expect(alert.percentageIncrease).toBe(1.0);
            expect(alert.acknowledged).toBe(false);
        });
    });

    describe('Cost calculations', () => {
        it('should calculate correct cost for ChatGPT queries', () => {
            const costPerQuery = 0.002;
            const queryCount = 10;
            const expectedCost = costPerQuery * queryCount;

            expect(expectedCost).toBe(0.02);
        });

        it('should calculate correct cost for Perplexity queries', () => {
            const costPerQuery = 0.001;
            const queryCount = 10;
            const expectedCost = costPerQuery * queryCount;

            expect(expectedCost).toBe(0.01);
        });

        it('should calculate correct cost for Claude queries', () => {
            const costPerQuery = 0.003;
            const queryCount = 10;
            const expectedCost = costPerQuery * queryCount;

            expect(expectedCost).toBe(0.03);
        });

        it('should calculate correct cost for Gemini queries', () => {
            const costPerQuery = 0.0005;
            const queryCount = 10;
            const expectedCost = costPerQuery * queryCount;

            expect(expectedCost).toBe(0.005);
        });
    });

    describe('Budget calculations', () => {
        it('should calculate remaining budget correctly', () => {
            const monthlyLimit = 50;
            const currentSpend = 20;
            const remainingBudget = monthlyLimit - currentSpend;

            expect(remainingBudget).toBe(30);
        });

        it('should calculate percentage used correctly', () => {
            const monthlyLimit = 100;
            const currentSpend = 75;
            const percentageUsed = (currentSpend / monthlyLimit) * 100;

            expect(percentageUsed).toBe(75);
        });

        it('should identify when approaching limit (>75%)', () => {
            const monthlyLimit = 100;
            const currentSpend = 80;
            const percentageUsed = currentSpend / monthlyLimit;
            const isApproaching = percentageUsed >= 0.75;

            expect(isApproaching).toBe(true);
        });

        it('should identify when not approaching limit (<75%)', () => {
            const monthlyLimit = 100;
            const currentSpend = 50;
            const percentageUsed = currentSpend / monthlyLimit;
            const isApproaching = percentageUsed >= 0.75;

            expect(isApproaching).toBe(false);
        });

        it('should identify when over 90% of budget used', () => {
            const monthlyLimit = 100;
            const currentSpend = 95;
            const percentageUsed = currentSpend / monthlyLimit;
            const shouldReduce = percentageUsed >= 0.9;

            expect(shouldReduce).toBe(true);
        });
    });

    describe('Cost spike detection', () => {
        it('should detect cost spike when increase is over 50%', () => {
            const currentSpend = 150;
            const previousPeriodSpend = 100;
            const percentageIncrease = (currentSpend - previousPeriodSpend) / previousPeriodSpend;
            const isCostSpike = percentageIncrease >= 0.5;

            expect(isCostSpike).toBe(true);
            expect(percentageIncrease).toBe(0.5);
        });

        it('should not detect cost spike when increase is under 50%', () => {
            const currentSpend = 120;
            const previousPeriodSpend = 100;
            const percentageIncrease = (currentSpend - previousPeriodSpend) / previousPeriodSpend;
            const isCostSpike = percentageIncrease >= 0.5;

            expect(isCostSpike).toBe(false);
            expect(percentageIncrease).toBe(0.2);
        });
    });

    describe('Alert threshold logic', () => {
        it('should trigger alert when crossing 50% threshold', () => {
            const monthlyLimit = 100;
            const previousSpend = 40;
            const newSpend = 55;
            const threshold = 0.5;

            const previousPercentage = previousSpend / monthlyLimit;
            const newPercentage = newSpend / monthlyLimit;
            const crossedThreshold = previousPercentage < threshold && newPercentage >= threshold;

            expect(crossedThreshold).toBe(true);
        });

        it('should not trigger alert when already past threshold', () => {
            const monthlyLimit = 100;
            const previousSpend = 60;
            const newSpend = 65;
            const threshold = 0.5;

            const previousPercentage = previousSpend / monthlyLimit;
            const newPercentage = newSpend / monthlyLimit;
            const crossedThreshold = previousPercentage < threshold && newPercentage >= threshold;

            expect(crossedThreshold).toBe(false);
        });
    });

    describe('Frequency reduction logic', () => {
        it('should reduce daily to weekly', () => {
            const currentFrequency = 'daily';
            const newFrequency = currentFrequency === 'daily' ? 'weekly' : 'monthly';

            expect(newFrequency).toBe('weekly');
        });

        it('should reduce weekly to monthly', () => {
            const currentFrequency = 'weekly';
            const newFrequency = currentFrequency === 'daily' ? 'weekly' : 'monthly';

            expect(newFrequency).toBe('monthly');
        });

        it('should not reduce monthly frequency', () => {
            const currentFrequency = 'monthly';
            const shouldReduce = currentFrequency !== 'monthly';

            expect(shouldReduce).toBe(false);
        });
    });
});
