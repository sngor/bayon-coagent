/**
 * AI Cost Control Service
 * 
 * Service for tracking API usage, managing budgets, and controlling costs
 * for AI visibility monitoring.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import { AIMonitoringConfig } from './types/common/common';

/**
 * API usage record
 */
export interface APIUsageRecord {
    id: string;
    userId: string;
    platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
    queryCount: number;
    estimatedCost: number; // in USD
    timestamp: string;
    periodStart: string;
    periodEnd: string;
    createdAt: number;
    updatedAt: number;
}

/**
 * User budget configuration
 */
export interface UserBudget {
    id: string;
    userId: string;
    monthlyLimit: number; // in USD
    currentSpend: number; // in USD
    periodStart: string;
    periodEnd: string;
    alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9] for 50%, 75%, 90%
    alertsSent: number[]; // Track which thresholds have triggered
    autoReduceFrequency: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Cost estimation for query execution
 */
export interface CostEstimate {
    totalCost: number;
    breakdown: {
        platform: string;
        queries: number;
        costPerQuery: number;
        totalCost: number;
    }[];
    withinBudget: boolean;
    remainingBudget: number;
}

/**
 * Cost spike alert
 */
export interface CostSpikeAlert {
    id: string;
    userId: string;
    currentSpend: number;
    previousPeriodSpend: number;
    percentageIncrease: number;
    timestamp: string;
    acknowledged: boolean;
    createdAt: number;
}

/**
 * Platform cost configuration (cost per 1000 tokens or per query)
 */
const PLATFORM_COSTS = {
    chatgpt: 0.002, // $0.002 per query (approximate)
    perplexity: 0.001, // $0.001 per query
    claude: 0.003, // $0.003 per query
    gemini: 0.0005, // $0.0005 per query
} as const;

/**
 * Default budget limits
 */
const DEFAULT_MONTHLY_BUDGET = 50; // $50 per month
const DEFAULT_ALERT_THRESHOLDS = [0.5, 0.75, 0.9]; // 50%, 75%, 90%
const COST_SPIKE_THRESHOLD = 0.5; // 50% increase triggers alert

/**
 * AI Cost Control Service
 */
export class AICostControlService {
    private readonly repository = getRepository();

    /**
     * Track API usage for a user
     * @param userId User ID
     * @param platform Platform used
     * @param queryCount Number of queries executed
     */
    async trackAPIUsage(
        userId: string,
        platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini',
        queryCount: number
    ): Promise<void> {
        try {
            const estimatedCost = this.calculateCost(platform, queryCount);
            const now = new Date();
            const periodStart = this.getMonthStart(now);
            const periodEnd = this.getMonthEnd(now);

            const usageRecord: APIUsageRecord = {
                id: uuidv4(),
                userId,
                platform,
                queryCount,
                estimatedCost,
                timestamp: now.toISOString(),
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            // Store usage record
            await this.repository.createAPIUsageRecord(userId, usageRecord.id, usageRecord);

            // Update user budget
            await this.updateBudgetSpend(userId, estimatedCost);

            console.log(
                `[AICostControl] Tracked ${queryCount} queries on ${platform} for user ${userId}, cost: $${estimatedCost.toFixed(4)}`
            );
        } catch (error) {
            console.error('[AICostControl] Error tracking API usage:', error);
            // Don't throw - tracking failure shouldn't block operations
        }
    }

    /**
     * Get or create user budget
     * @param userId User ID
     * @returns User budget
     */
    async getUserBudget(userId: string): Promise<UserBudget> {
        try {
            let budget = await this.repository.getUserBudget<UserBudget>(userId);

            if (!budget) {
                // Create default budget
                const now = new Date();
                budget = {
                    id: uuidv4(),
                    userId,
                    monthlyLimit: DEFAULT_MONTHLY_BUDGET,
                    currentSpend: 0,
                    periodStart: this.getMonthStart(now).toISOString(),
                    periodEnd: this.getMonthEnd(now).toISOString(),
                    alertThresholds: DEFAULT_ALERT_THRESHOLDS,
                    alertsSent: [],
                    autoReduceFrequency: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                await this.repository.saveUserBudget(userId, budget);
            }

            // Check if we need to reset for new month
            const periodEnd = new Date(budget.periodEnd);
            if (new Date() > periodEnd) {
                budget = await this.resetMonthlyBudget(userId, budget);
            }

            return budget;
        } catch (error) {
            console.error('[AICostControl] Error getting user budget:', error);
            throw error;
        }
    }

    /**
     * Update user budget configuration
     * @param userId User ID
     * @param updates Budget updates
     */
    async updateUserBudget(
        userId: string,
        updates: Partial<Pick<UserBudget, 'monthlyLimit' | 'alertThresholds' | 'autoReduceFrequency'>>
    ): Promise<void> {
        try {
            await this.repository.updateUserBudget(userId, updates);
            console.log(`[AICostControl] Updated budget for user ${userId}`);
        } catch (error) {
            console.error('[AICostControl] Error updating user budget:', error);
            throw error;
        }
    }

    /**
     * Estimate cost before query execution
     * @param userId User ID
     * @param platforms Platforms to query
     * @param queriesPerPlatform Number of queries per platform
     * @returns Cost estimate
     */
    async estimateCost(
        userId: string,
        platforms: Array<'chatgpt' | 'perplexity' | 'claude' | 'gemini'>,
        queriesPerPlatform: number
    ): Promise<CostEstimate> {
        try {
            const budget = await this.getUserBudget(userId);
            const breakdown = platforms.map((platform) => {
                const costPerQuery = PLATFORM_COSTS[platform];
                const totalCost = costPerQuery * queriesPerPlatform;

                return {
                    platform,
                    queries: queriesPerPlatform,
                    costPerQuery,
                    totalCost,
                };
            });

            const totalCost = breakdown.reduce((sum, item) => sum + item.totalCost, 0);
            const remainingBudget = budget.monthlyLimit - budget.currentSpend;
            const withinBudget = totalCost <= remainingBudget;

            return {
                totalCost,
                breakdown,
                withinBudget,
                remainingBudget,
            };
        } catch (error) {
            console.error('[AICostControl] Error estimating cost:', error);
            throw error;
        }
    }

    /**
     * Check if user is approaching budget limit
     * @param userId User ID
     * @returns True if approaching limit (>75% spent)
     */
    async isApproachingLimit(userId: string): Promise<boolean> {
        try {
            const budget = await this.getUserBudget(userId);
            const percentageUsed = budget.currentSpend / budget.monthlyLimit;
            return percentageUsed >= 0.75;
        } catch (error) {
            console.error('[AICostControl] Error checking budget limit:', error);
            return false;
        }
    }

    /**
     * Reduce monitoring frequency when approaching budget limit
     * @param userId User ID
     */
    async reduceFrequencyIfNeeded(userId: string): Promise<void> {
        try {
            const budget = await this.getUserBudget(userId);

            if (!budget.autoReduceFrequency) {
                return;
            }

            const percentageUsed = budget.currentSpend / budget.monthlyLimit;

            // If over 90% of budget used, reduce frequency
            if (percentageUsed >= 0.9) {
                const config = await this.repository.getAIMonitoringConfig<AIMonitoringConfig>(
                    userId
                );

                if (config && config.frequency !== 'monthly') {
                    const newFrequency = config.frequency === 'daily' ? 'weekly' : 'monthly';

                    await this.repository.updateAIMonitoringConfig(userId, {
                        frequency: newFrequency,
                    });

                    console.log(
                        `[AICostControl] Reduced monitoring frequency to ${newFrequency} for user ${userId} due to budget constraints`
                    );

                    // Send notification to user
                    await this.sendFrequencyReductionNotification(userId, newFrequency);
                }
            }
        } catch (error) {
            console.error('[AICostControl] Error reducing frequency:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Check for cost spikes and send admin alerts
     * @param userId User ID
     */
    async checkForCostSpikes(userId: string): Promise<void> {
        try {
            const currentBudget = await this.getUserBudget(userId);
            const previousPeriodSpend = await this.getPreviousPeriodSpend(userId);

            if (previousPeriodSpend === 0) {
                return; // No previous data to compare
            }

            const percentageIncrease =
                (currentBudget.currentSpend - previousPeriodSpend) / previousPeriodSpend;

            if (percentageIncrease >= COST_SPIKE_THRESHOLD) {
                const alert: CostSpikeAlert = {
                    id: uuidv4(),
                    userId,
                    currentSpend: currentBudget.currentSpend,
                    previousPeriodSpend,
                    percentageIncrease,
                    timestamp: new Date().toISOString(),
                    acknowledged: false,
                    createdAt: Date.now(),
                };

                await this.repository.createCostSpikeAlert(userId, alert.id, alert);

                console.log(
                    `[AICostControl] Cost spike detected for user ${userId}: ${(percentageIncrease * 100).toFixed(1)}% increase`
                );

                // Send admin alert
                await this.sendAdminCostSpikeAlert(alert);
            }
        } catch (error) {
            console.error('[AICostControl] Error checking for cost spikes:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Get API usage for a user in a date range
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @returns Array of usage records
     */
    async getAPIUsage(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<APIUsageRecord[]> {
        try {
            const result = await this.repository.queryAPIUsageByDateRange<APIUsageRecord>(
                userId,
                startDate,
                endDate
            );

            return result.items;
        } catch (error) {
            console.error('[AICostControl] Error getting API usage:', error);
            throw error;
        }
    }

    /**
     * Calculate cost for platform and query count
     * @param platform Platform name
     * @param queryCount Number of queries
     * @returns Estimated cost in USD
     */
    private calculateCost(
        platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini',
        queryCount: number
    ): number {
        return PLATFORM_COSTS[platform] * queryCount;
    }

    /**
     * Update budget spend
     * @param userId User ID
     * @param amount Amount to add to current spend
     */
    private async updateBudgetSpend(userId: string, amount: number): Promise<void> {
        try {
            const budget = await this.getUserBudget(userId);
            const newSpend = budget.currentSpend + amount;

            await this.repository.updateUserBudget(userId, {
                currentSpend: newSpend,
            });

            // Check alert thresholds
            await this.checkBudgetAlerts(userId, budget, newSpend);

            // Check for cost spikes
            await this.checkForCostSpikes(userId);

            // Reduce frequency if needed
            await this.reduceFrequencyIfNeeded(userId);
        } catch (error) {
            console.error('[AICostControl] Error updating budget spend:', error);
            throw error;
        }
    }

    /**
     * Check if budget alert thresholds have been crossed
     * @param userId User ID
     * @param budget Current budget
     * @param newSpend New spend amount
     */
    private async checkBudgetAlerts(
        userId: string,
        budget: UserBudget,
        newSpend: number
    ): Promise<void> {
        try {
            const percentageUsed = newSpend / budget.monthlyLimit;

            for (const threshold of budget.alertThresholds) {
                // Check if this threshold was just crossed
                const previousPercentage = budget.currentSpend / budget.monthlyLimit;
                const crossedThreshold =
                    previousPercentage < threshold && percentageUsed >= threshold;

                if (crossedThreshold && !budget.alertsSent.includes(threshold)) {
                    // Send alert
                    await this.sendBudgetAlert(userId, threshold, newSpend, budget.monthlyLimit);

                    // Mark alert as sent
                    const newAlertsSent = [...budget.alertsSent, threshold];
                    await this.repository.updateUserBudget(userId, {
                        alertsSent: newAlertsSent,
                    });

                    console.log(
                        `[AICostControl] Budget alert sent for user ${userId} at ${(threshold * 100).toFixed(0)}% threshold`
                    );
                }
            }
        } catch (error) {
            console.error('[AICostControl] Error checking budget alerts:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Reset monthly budget for new period
     * @param userId User ID
     * @param currentBudget Current budget
     * @returns Updated budget
     */
    private async resetMonthlyBudget(
        userId: string,
        currentBudget: UserBudget
    ): Promise<UserBudget> {
        try {
            const now = new Date();
            const updates = {
                currentSpend: 0,
                periodStart: this.getMonthStart(now).toISOString(),
                periodEnd: this.getMonthEnd(now).toISOString(),
                alertsSent: [],
            };

            await this.repository.updateUserBudget(userId, updates);

            console.log(`[AICostControl] Reset monthly budget for user ${userId}`);

            return {
                ...currentBudget,
                ...updates,
                updatedAt: Date.now(),
            };
        } catch (error) {
            console.error('[AICostControl] Error resetting monthly budget:', error);
            throw error;
        }
    }

    /**
     * Get previous period spend
     * @param userId User ID
     * @returns Previous period spend amount
     */
    private async getPreviousPeriodSpend(userId: string): Promise<number> {
        try {
            const now = new Date();
            const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const usage = await this.getAPIUsage(
                userId,
                previousMonthStart.toISOString(),
                previousMonthEnd.toISOString()
            );

            return usage.reduce((sum, record) => sum + record.estimatedCost, 0);
        } catch (error) {
            console.error('[AICostControl] Error getting previous period spend:', error);
            return 0;
        }
    }

    /**
     * Get start of month
     * @param date Date
     * @returns Start of month
     */
    private getMonthStart(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Get end of month
     * @param date Date
     * @returns End of month
     */
    private getMonthEnd(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    /**
     * Send budget alert notification
     * @param userId User ID
     * @param threshold Threshold crossed
     * @param currentSpend Current spend
     * @param monthlyLimit Monthly limit
     */
    private async sendBudgetAlert(
        userId: string,
        threshold: number,
        currentSpend: number,
        monthlyLimit: number
    ): Promise<void> {
        // TODO: Integrate with notification system
        console.log(
            `[AICostControl] Budget alert: User ${userId} has used ${(threshold * 100).toFixed(0)}% of monthly budget ($${currentSpend.toFixed(2)} / $${monthlyLimit.toFixed(2)})`
        );
    }

    /**
     * Send frequency reduction notification
     * @param userId User ID
     * @param newFrequency New monitoring frequency
     */
    private async sendFrequencyReductionNotification(
        userId: string,
        newFrequency: string
    ): Promise<void> {
        // TODO: Integrate with notification system
        console.log(
            `[AICostControl] Frequency reduction: User ${userId} monitoring frequency reduced to ${newFrequency} due to budget constraints`
        );
    }

    /**
     * Send admin cost spike alert
     * @param alert Cost spike alert
     */
    private async sendAdminCostSpikeAlert(alert: CostSpikeAlert): Promise<void> {
        // TODO: Integrate with admin notification system
        console.log(
            `[AICostControl] Admin alert: Cost spike detected for user ${alert.userId}: ${(alert.percentageIncrease * 100).toFixed(1)}% increase ($${alert.previousPeriodSpend.toFixed(2)} → $${alert.currentSpend.toFixed(2)})`
        );
    }
}

/**
 * Create an AI cost control service instance
 * @returns AICostControlService instance
 */
export function createAICostControlService(): AICostControlService {
    return new AICostControlService();
}
