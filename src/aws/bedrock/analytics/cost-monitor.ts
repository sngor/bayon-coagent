/**
 * Cost Monitor
 * 
 * Monitors AI operation costs, tracks token usage, calculates costs by dimension,
 * provides cost alerts, and suggests optimizations.
 * Implements Requirement 9.2 from the AgentStrands enhancement spec.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAWSConfig } from '@/aws/config';
import {
    CostOperation,
    CostBreakdown,
    CostAlert,
    CostOptimization,
    CostRecordEntity,
} from './types';

/**
 * Configuration for cost monitoring
 */
export interface CostMonitorConfig {
    /** DynamoDB table name */
    tableName: string;
    /** Enable cost alerts */
    enableAlerts?: boolean;
    /** Alert thresholds by dimension */
    alertThresholds?: {
        perStrand?: number; // USD per strand per day
        perUser?: number; // USD per user per day
        perTaskType?: number; // USD per task type per day
        totalDaily?: number; // Total USD per day
    };
    /** Model pricing (USD per 1K tokens) */
    modelPricing?: Record<string, { input: number; output: number }>;
    /** Data retention in days */
    retentionDays?: number;
}

/**
 * Alert callback function type
 */
export type AlertCallback = (alert: CostAlert) => void;

/**
 * Cost Monitor
 * 
 * Tracks AI operation costs, monitors token usage, calculates costs by various dimensions,
 * triggers alerts when thresholds are exceeded, and provides optimization suggestions.
 */
export class CostMonitor {
    private docClient: DynamoDBDocumentClient;
    private config: Required<CostMonitorConfig>;
    private alertCallbacks: Map<string, AlertCallback>;
    private costCache: Map<string, number>; // Cache for daily costs by dimension
    private lastCacheUpdate: Date;

    constructor(config: CostMonitorConfig) {
        const awsConfig = getAWSConfig();
        const client = new DynamoDBClient(awsConfig);
        this.docClient = DynamoDBDocumentClient.from(client);

        this.config = {
            tableName: config.tableName,
            enableAlerts: config.enableAlerts ?? true,
            alertThresholds: config.alertThresholds ?? {
                perStrand: 50,
                perUser: 100,
                perTaskType: 75,
                totalDaily: 500,
            },
            modelPricing: config.modelPricing ?? this.getDefaultModelPricing(),
            retentionDays: config.retentionDays ?? 90,
        };

        this.alertCallbacks = new Map();
        this.costCache = new Map();
        this.lastCacheUpdate = new Date();
    }

    /**
     * Track cost for an AI operation
     */
    async trackCost(operation: CostOperation): Promise<void> {
        const timestamp = new Date().toISOString();

        // Create entity
        const entity: CostRecordEntity = {
            PK: `USER#${operation.userId}`,
            SK: `COST#${timestamp}#${operation.strandId}`,
            entityType: 'CostRecord',
            userId: operation.userId,
            strandId: operation.strandId,
            operation: {
                ...operation,
                timestamp,
            },
            createdAt: timestamp,
            ttl: this.calculateTTL(this.config.retentionDays),
        };

        // Store in DynamoDB
        await this.docClient.send(
            new PutCommand({
                TableName: this.config.tableName,
                Item: entity,
            })
        );

        // Update cache
        this.updateCostCache(operation);

        // Check for alerts if enabled
        if (this.config.enableAlerts) {
            await this.checkAlerts(operation);
        }
    }

    /**
     * Calculate costs by dimension (strand, user, or task-type)
     */
    async calculateCosts(
        dimension: 'strand' | 'user' | 'task-type',
        timeframe: string
    ): Promise<CostBreakdown> {
        const endDate = new Date();
        const startDate = this.calculateStartDate(endDate, timeframe);

        // Query cost records
        const records = await this.queryCostRecords(startDate, endDate);

        // Group by dimension
        const grouped = this.groupByDimension(records, dimension);

        // Calculate totals
        const breakdown: Record<string, number> = {};
        let total = 0;

        for (const [key, ops] of Object.entries(grouped)) {
            const cost = ops.reduce((sum, op) => sum + op.operation.cost, 0);
            breakdown[key] = cost;
            total += cost;
        }

        // Find top drivers
        const topDrivers = Object.entries(breakdown)
            .map(([name, cost]) => ({
                name,
                cost,
                percentage: (cost / total) * 100,
            }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10);

        return {
            total,
            breakdown,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            topDrivers,
        };
    }

    /**
     * Set alert for cost threshold
     */
    setAlert(
        threshold: number,
        dimension: string,
        callback: AlertCallback
    ): void {
        const key = `${dimension}:${threshold}`;
        this.alertCallbacks.set(key, callback);
    }

    /**
     * Remove alert
     */
    removeAlert(dimension: string, threshold: number): void {
        const key = `${dimension}:${threshold}`;
        this.alertCallbacks.delete(key);
    }

    /**
     * Suggest cost optimizations
     */
    async suggestOptimizations(): Promise<CostOptimization[]> {
        const optimizations: CostOptimization[] = [];

        // Analyze last 7 days
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const records = await this.queryCostRecords(startDate, endDate);

        if (records.length === 0) {
            return optimizations;
        }

        // Check for high token usage patterns
        const highTokenOps = records.filter(
            r => r.operation.inputTokens + r.operation.outputTokens > 10000
        );

        if (highTokenOps.length > records.length * 0.2) {
            optimizations.push({
                id: 'opt-high-tokens',
                title: 'Reduce Token Usage',
                description: `${((highTokenOps.length / records.length) * 100).toFixed(0)}% of operations use >10K tokens. Consider optimizing prompts or using smaller context windows.`,
                potentialSavings: this.calculatePotentialSavings(highTokenOps, 0.3),
                effort: 'medium',
                priority: 'high',
                actions: [
                    'Review and optimize prompt templates',
                    'Implement context window management',
                    'Use summarization for long inputs',
                    'Cache frequently used responses',
                ],
                affectedComponents: this.getAffectedStrands(highTokenOps),
            });
        }

        // Check for expensive models on simple tasks
        const simpleTasksWithExpensiveModels = records.filter(
            r => r.operation.taskType.includes('simple') &&
                r.operation.model.includes('sonnet')
        );

        if (simpleTasksWithExpensiveModels.length > 0) {
            optimizations.push({
                id: 'opt-model-selection',
                title: 'Optimize Model Selection',
                description: `${simpleTasksWithExpensiveModels.length} simple tasks are using expensive models. Consider using lighter models for routine operations.`,
                potentialSavings: this.calculatePotentialSavings(simpleTasksWithExpensiveModels, 0.5),
                effort: 'low',
                priority: 'high',
                actions: [
                    'Use Claude Haiku for simple tasks',
                    'Implement model routing based on complexity',
                    'Create task complexity classifier',
                ],
                affectedComponents: this.getAffectedStrands(simpleTasksWithExpensiveModels),
            });
        }

        // Check for redundant operations
        const operationsByTask = this.groupBy(records, r => r.operation.taskType);
        for (const [taskType, ops] of Object.entries(operationsByTask)) {
            if (ops.length > 100) {
                const avgCost = ops.reduce((sum, op) => sum + op.operation.cost, 0) / ops.length;
                if (avgCost > 0.1) {
                    optimizations.push({
                        id: `opt-cache-${taskType}`,
                        title: `Implement Caching for ${taskType}`,
                        description: `${ops.length} operations of type "${taskType}" with average cost $${avgCost.toFixed(3)}. Caching could significantly reduce costs.`,
                        potentialSavings: ops.reduce((sum, op) => sum + op.operation.cost, 0) * 0.6,
                        effort: 'medium',
                        priority: 'medium',
                        actions: [
                            'Implement response caching',
                            'Add cache invalidation strategy',
                            'Monitor cache hit rates',
                        ],
                        affectedComponents: [taskType],
                    });
                }
            }
        }

        // Check for high output token usage
        const highOutputOps = records.filter(
            r => r.operation.outputTokens > r.operation.inputTokens * 2
        );

        if (highOutputOps.length > records.length * 0.15) {
            optimizations.push({
                id: 'opt-output-length',
                title: 'Control Output Length',
                description: `${((highOutputOps.length / records.length) * 100).toFixed(0)}% of operations generate outputs >2x input size. Consider adding length constraints.`,
                potentialSavings: this.calculatePotentialSavings(highOutputOps, 0.25),
                effort: 'low',
                priority: 'medium',
                actions: [
                    'Add max_tokens parameter to prompts',
                    'Implement output length guidelines',
                    'Use structured outputs where possible',
                ],
                affectedComponents: this.getAffectedStrands(highOutputOps),
            });
        }

        // Check for batch opportunities
        const operationsByHour = this.groupBy(records, r => {
            const date = new Date(r.operation.timestamp);
            date.setMinutes(0, 0, 0);
            return date.toISOString();
        });

        for (const [hour, ops] of Object.entries(operationsByHour)) {
            if (ops.length > 50) {
                const batchableOps = ops.filter(op =>
                    op.operation.taskType.includes('analysis') ||
                    op.operation.taskType.includes('generation')
                );

                if (batchableOps.length > 20) {
                    optimizations.push({
                        id: `opt-batch-${hour}`,
                        title: 'Implement Batch Processing',
                        description: `${batchableOps.length} similar operations detected in a single hour. Batch processing could reduce overhead.`,
                        potentialSavings: batchableOps.reduce((sum, op) => sum + op.operation.cost, 0) * 0.15,
                        effort: 'high',
                        priority: 'low',
                        actions: [
                            'Implement batch processing queue',
                            'Group similar operations',
                            'Add batch size optimization',
                        ],
                        affectedComponents: this.getAffectedStrands(batchableOps),
                    });
                    break; // Only suggest once
                }
            }
        }

        // Sort by potential savings
        return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }

    /**
     * Get cost summary for a specific dimension value
     */
    async getCostSummary(
        dimension: 'strand' | 'user' | 'task-type',
        value: string,
        timeframe: string
    ): Promise<{
        total: number;
        operations: number;
        avgCost: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    }> {
        const endDate = new Date();
        const startDate = this.calculateStartDate(endDate, timeframe);
        const records = await this.queryCostRecords(startDate, endDate);

        // Filter by dimension
        const filtered = records.filter(r => {
            switch (dimension) {
                case 'strand':
                    return r.strandId === value;
                case 'user':
                    return r.userId === value;
                case 'task-type':
                    return r.operation.taskType === value;
                default:
                    return false;
            }
        });

        const total = filtered.reduce((sum, r) => sum + r.operation.cost, 0);
        const operations = filtered.length;
        const avgCost = operations > 0 ? total / operations : 0;

        // Calculate trend
        const midpoint = Math.floor(filtered.length / 2);
        const firstHalf = filtered.slice(0, midpoint);
        const secondHalf = filtered.slice(midpoint);

        const firstHalfAvg = firstHalf.length > 0
            ? firstHalf.reduce((sum, r) => sum + r.operation.cost, 0) / firstHalf.length
            : 0;
        const secondHalfAvg = secondHalf.length > 0
            ? secondHalf.reduce((sum, r) => sum + r.operation.cost, 0) / secondHalf.length
            : 0;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (secondHalfAvg > firstHalfAvg * 1.1) {
            trend = 'increasing';
        } else if (secondHalfAvg < firstHalfAvg * 0.9) {
            trend = 'decreasing';
        }

        return {
            total,
            operations,
            avgCost,
            trend,
        };
    }

    /**
     * Query cost records from DynamoDB
     */
    private async queryCostRecords(
        startDate: Date,
        endDate: Date
    ): Promise<CostRecordEntity[]> {
        const items: CostRecordEntity[] = [];

        // Note: In production, this would use a GSI for efficient querying
        // For now, we'll use a simplified approach
        // This is a placeholder - actual implementation would need proper indexing

        // Query all cost records (simplified - would need pagination in production)
        const result = await this.docClient.send(
            new QueryCommand({
                TableName: this.config.tableName,
                IndexName: 'EntityTypeIndex', // Assumes GSI exists
                KeyConditionExpression: 'entityType = :type',
                FilterExpression: 'createdAt BETWEEN :start AND :end',
                ExpressionAttributeValues: {
                    ':type': 'CostRecord',
                    ':start': startDate.toISOString(),
                    ':end': endDate.toISOString(),
                },
            })
        );

        if (result.Items) {
            items.push(...(result.Items as CostRecordEntity[]));
        }

        return items;
    }

    /**
     * Group records by dimension
     */
    private groupByDimension(
        records: CostRecordEntity[],
        dimension: 'strand' | 'user' | 'task-type'
    ): Record<string, CostRecordEntity[]> {
        const grouped: Record<string, CostRecordEntity[]> = {};

        for (const record of records) {
            let key: string;

            switch (dimension) {
                case 'strand':
                    key = record.strandId;
                    break;
                case 'user':
                    key = record.userId;
                    break;
                case 'task-type':
                    key = record.operation.taskType;
                    break;
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(record);
        }

        return grouped;
    }

    /**
     * Update cost cache
     */
    private updateCostCache(operation: CostOperation): void {
        const today = new Date().toISOString().split('T')[0];

        // Update strand cost
        const strandKey = `strand:${operation.strandId}:${today}`;
        this.costCache.set(strandKey, (this.costCache.get(strandKey) || 0) + operation.cost);

        // Update user cost
        const userKey = `user:${operation.userId}:${today}`;
        this.costCache.set(userKey, (this.costCache.get(userKey) || 0) + operation.cost);

        // Update task type cost
        const taskKey = `task-type:${operation.taskType}:${today}`;
        this.costCache.set(taskKey, (this.costCache.get(taskKey) || 0) + operation.cost);

        // Update total cost
        const totalKey = `total:${today}`;
        this.costCache.set(totalKey, (this.costCache.get(totalKey) || 0) + operation.cost);

        // Clear cache if it's a new day
        const now = new Date();
        if (now.getDate() !== this.lastCacheUpdate.getDate()) {
            this.clearOldCacheEntries();
            this.lastCacheUpdate = now;
        }
    }

    /**
     * Clear old cache entries
     */
    private clearOldCacheEntries(): void {
        const today = new Date().toISOString().split('T')[0];
        const keysToDelete: string[] = [];

        for (const key of this.costCache.keys()) {
            if (!key.endsWith(today)) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.costCache.delete(key);
        }
    }

    /**
     * Check for alert conditions
     */
    private async checkAlerts(operation: CostOperation): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const thresholds = this.config.alertThresholds;

        // Check strand threshold
        if (thresholds.perStrand) {
            const strandKey = `strand:${operation.strandId}:${today}`;
            const strandCost = this.costCache.get(strandKey) || 0;

            if (strandCost > thresholds.perStrand) {
                await this.triggerAlert({
                    id: `alert-${Date.now()}-strand`,
                    type: 'threshold-exceeded',
                    severity: 'medium',
                    message: `Strand ${operation.strandId} has exceeded daily cost threshold`,
                    currentCost: strandCost,
                    threshold: thresholds.perStrand,
                    dimension: 'strand',
                    dimensionValue: operation.strandId,
                    triggeredAt: new Date().toISOString(),
                });
            }
        }

        // Check user threshold
        if (thresholds.perUser) {
            const userKey = `user:${operation.userId}:${today}`;
            const userCost = this.costCache.get(userKey) || 0;

            if (userCost > thresholds.perUser) {
                await this.triggerAlert({
                    id: `alert-${Date.now()}-user`,
                    type: 'threshold-exceeded',
                    severity: 'high',
                    message: `User ${operation.userId} has exceeded daily cost threshold`,
                    currentCost: userCost,
                    threshold: thresholds.perUser,
                    dimension: 'user',
                    dimensionValue: operation.userId,
                    triggeredAt: new Date().toISOString(),
                });
            }
        }

        // Check task type threshold
        if (thresholds.perTaskType) {
            const taskKey = `task-type:${operation.taskType}:${today}`;
            const taskCost = this.costCache.get(taskKey) || 0;

            if (taskCost > thresholds.perTaskType) {
                await this.triggerAlert({
                    id: `alert-${Date.now()}-task`,
                    type: 'threshold-exceeded',
                    severity: 'medium',
                    message: `Task type ${operation.taskType} has exceeded daily cost threshold`,
                    currentCost: taskCost,
                    threshold: thresholds.perTaskType,
                    dimension: 'task-type',
                    dimensionValue: operation.taskType,
                    triggeredAt: new Date().toISOString(),
                });
            }
        }

        // Check total daily threshold
        if (thresholds.totalDaily) {
            const totalKey = `total:${today}`;
            const totalCost = this.costCache.get(totalKey) || 0;

            if (totalCost > thresholds.totalDaily) {
                await this.triggerAlert({
                    id: `alert-${Date.now()}-total`,
                    type: 'threshold-exceeded',
                    severity: 'high',
                    message: `Total daily cost has exceeded threshold`,
                    currentCost: totalCost,
                    threshold: thresholds.totalDaily,
                    dimension: 'total',
                    dimensionValue: 'all',
                    triggeredAt: new Date().toISOString(),
                });
            }
        }
    }

    /**
     * Trigger alert
     */
    private async triggerAlert(alert: CostAlert): Promise<void> {
        // Call registered callbacks
        for (const [key, callback] of this.alertCallbacks.entries()) {
            const [dimension, threshold] = key.split(':');
            if (dimension === alert.dimension || dimension === 'all') {
                callback(alert);
            }
        }

        // Store alert in DynamoDB for historical tracking
        await this.docClient.send(
            new PutCommand({
                TableName: this.config.tableName,
                Item: {
                    PK: `ALERT#${alert.dimension}#${alert.dimensionValue}`,
                    SK: `ALERT#${alert.triggeredAt}`,
                    entityType: 'CostAlert',
                    alert,
                    createdAt: alert.triggeredAt,
                },
            })
        );
    }

    /**
     * Calculate potential savings
     */
    private calculatePotentialSavings(
        records: CostRecordEntity[],
        savingsPercentage: number
    ): number {
        const totalCost = records.reduce((sum, r) => sum + r.operation.cost, 0);
        return totalCost * savingsPercentage;
    }

    /**
     * Get affected strands from records
     */
    private getAffectedStrands(records: CostRecordEntity[]): string[] {
        const strands = new Set(records.map(r => r.strandId));
        return Array.from(strands);
    }

    /**
     * Helper: Group items by key
     */
    private groupBy<T>(
        items: T[],
        keyFn: (item: T) => string
    ): Record<string, T[]> {
        const groups: Record<string, T[]> = {};

        for (const item of items) {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        }

        return groups;
    }

    /**
     * Calculate TTL timestamp
     */
    private calculateTTL(days: number): number {
        return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
    }

    /**
     * Calculate start date from timeframe
     */
    private calculateStartDate(endDate: Date, timeframe: string): Date {
        const match = timeframe.match(/^(\d+)([hdwmy])$/);
        if (!match) {
            throw new Error(`Invalid timeframe format: ${timeframe}`);
        }

        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        const startDate = new Date(endDate);

        switch (unit) {
            case 'h':
                startDate.setHours(startDate.getHours() - value);
                break;
            case 'd':
                startDate.setDate(startDate.getDate() - value);
                break;
            case 'w':
                startDate.setDate(startDate.getDate() - value * 7);
                break;
            case 'm':
                startDate.setMonth(startDate.getMonth() - value);
                break;
            case 'y':
                startDate.setFullYear(startDate.getFullYear() - value);
                break;
        }

        return startDate;
    }

    /**
     * Get default model pricing
     */
    private getDefaultModelPricing(): Record<string, { input: number; output: number }> {
        return {
            // Claude 3.5 Sonnet v2
            'anthropic.claude-3-5-sonnet-20241022-v2:0': {
                input: 0.003, // $3 per 1M input tokens
                output: 0.015, // $15 per 1M output tokens
            },
            // Claude 3.5 Sonnet
            'anthropic.claude-3-5-sonnet-20240620-v1:0': {
                input: 0.003,
                output: 0.015,
            },
            // Claude 3 Haiku
            'anthropic.claude-3-haiku-20240307-v1:0': {
                input: 0.00025, // $0.25 per 1M input tokens
                output: 0.00125, // $1.25 per 1M output tokens
            },
            // Claude 3 Opus
            'anthropic.claude-3-opus-20240229-v1:0': {
                input: 0.015, // $15 per 1M input tokens
                output: 0.075, // $75 per 1M output tokens
            },
        };
    }

    /**
     * Calculate cost for an operation based on token usage
     */
    calculateOperationCost(
        model: string,
        inputTokens: number,
        outputTokens: number
    ): number {
        const pricing = this.config.modelPricing[model];

        if (!pricing) {
            console.warn(`No pricing found for model: ${model}, using default`);
            return (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
        }

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;

        return inputCost + outputCost;
    }
}

/**
 * Create a cost monitor instance
 */
export function createCostMonitor(
    config?: Partial<CostMonitorConfig>
): CostMonitor {
    const defaultConfig: CostMonitorConfig = {
        tableName: process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev',
        enableAlerts: true,
        retentionDays: 90,
    };

    return new CostMonitor({ ...defaultConfig, ...config });
}
