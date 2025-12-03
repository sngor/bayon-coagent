/**
 * ROI Tracker
 * 
 * Tracks business outcomes and calculates ROI for strand-generated content.
 * Implements Requirement 9.4 from the AgentStrands enhancement spec.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getAWSConfig } from '@/aws/config';

/**
 * Business outcome types
 */
export type OutcomeType =
    | 'lead-generated'
    | 'property-viewed'
    | 'contact-made'
    | 'appointment-scheduled'
    | 'listing-signed'
    | 'sale-closed'
    | 'referral-received'
    | 'engagement'
    | 'brand-awareness';

/**
 * Business outcome record
 */
export interface BusinessOutcome {
    /** Outcome ID */
    id: string;
    /** Content ID that generated this outcome */
    contentId: string;
    /** Strand ID that created the content */
    strandId: string;
    /** User ID */
    userId: string;
    /** Type of outcome */
    type: OutcomeType;
    /** Monetary value in USD */
    value: number;
    /** Outcome description */
    description: string;
    /** Timestamp when outcome occurred */
    occurredAt: string;
    /** Additional metadata */
    metadata: Record<string, any>;
}

/**
 * Content performance metrics
 */
export interface ContentPerformance {
    /** Content ID */
    contentId: string;
    /** Content type */
    contentType: string;
    /** Creation cost in USD */
    creationCost: number;
    /** Distribution cost in USD */
    distributionCost: number;
    /** Total cost */
    totalCost: number;
    /** Views/impressions */
    views: number;
    /** Clicks/engagements */
    clicks: number;
    /** Shares */
    shares: number;
    /** Leads generated */
    leads: number;
    /** Conversions */
    conversions: number;
    /** Total revenue generated */
    revenue: number;
    /** ROI percentage */
    roi: number;
    /** Created at timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * ROI calculation result
 */
export interface ROICalculation {
    /** Content ID */
    contentId: string;
    /** Total investment (costs) */
    investment: number;
    /** Total return (revenue) */
    return: number;
    /** Net profit */
    profit: number;
    /** ROI percentage */
    roiPercentage: number;
    /** Payback period in days */
    paybackPeriod: number;
    /** Calculated at timestamp */
    calculatedAt: string;
}

/**
 * ROI report
 */
export interface ROIReport {
    /** Report ID */
    id: string;
    /** Report title */
    title: string;
    /** Report period */
    period: {
        start: string;
        end: string;
    };
    /** Total investment */
    totalInvestment: number;
    /** Total return */
    totalReturn: number;
    /** Overall ROI */
    overallROI: number;
    /** ROI by content type */
    byContentType: Record<string, ROICalculation>;
    /** ROI by strand */
    byStrand: Record<string, ROICalculation>;
    /** Top performing content */
    topPerformers: ContentPerformance[];
    /** Bottom performing content */
    bottomPerformers: ContentPerformance[];
    /** Insights */
    insights: string[];
    /** Recommendations */
    recommendations: string[];
    /** Generated at timestamp */
    generatedAt: string;
}

/**
 * Filters for ROI queries
 */
export interface ROIFilters {
    /** Filter by user ID */
    userId?: string;
    /** Filter by strand ID */
    strandId?: string;
    /** Filter by content type */
    contentType?: string;
    /** Start date */
    startDate?: string;
    /** End date */
    endDate?: string;
    /** Minimum ROI percentage */
    minROI?: number;
    /** Maximum ROI percentage */
    maxROI?: number;
}

/**
 * DynamoDB entity for business outcomes
 */
interface BusinessOutcomeEntity {
    PK: string; // CONTENT#{contentId}
    SK: string; // OUTCOME#{timestamp}#{outcomeId}
    entityType: 'BusinessOutcome';
    userId: string;
    strandId: string;
    outcome: BusinessOutcome;
    createdAt: string;
    ttl?: number;
}

/**
 * DynamoDB entity for content performance
 */
interface ContentPerformanceEntity {
    PK: string; // USER#{userId}
    SK: string; // CONTENT_PERF#{contentId}
    entityType: 'ContentPerformance';
    userId: string;
    strandId: string;
    performance: ContentPerformance;
    createdAt: string;
    updatedAt: string;
}

/**
 * Configuration for ROI tracking
 */
export interface ROITrackerConfig {
    /** DynamoDB table name */
    tableName: string;
    /** Data retention in days */
    retentionDays?: number;
    /** Default content creation cost multiplier */
    defaultCostMultiplier?: number;
}

/**
 * ROI Tracker
 * 
 * Tracks business outcomes, correlates them with content performance,
 * and calculates ROI for strand-generated content.
 */
export class ROITracker {
    private docClient: DynamoDBDocumentClient;
    private config: Required<ROITrackerConfig>;

    constructor(config: ROITrackerConfig) {
        const awsConfig = getAWSConfig();
        const client = new DynamoDBClient(awsConfig);
        this.docClient = DynamoDBDocumentClient.from(client);

        this.config = {
            tableName: config.tableName,
            retentionDays: config.retentionDays ?? 365,
            defaultCostMultiplier: config.defaultCostMultiplier ?? 1.0,
        };
    }

    /**
     * Track a business outcome
     */
    async trackOutcome(outcome: BusinessOutcome): Promise<void> {
        const timestamp = new Date().toISOString();

        const entity: BusinessOutcomeEntity = {
            PK: `CONTENT#${outcome.contentId}`,
            SK: `OUTCOME#${timestamp}#${outcome.id}`,
            entityType: 'BusinessOutcome',
            userId: outcome.userId,
            strandId: outcome.strandId,
            outcome: {
                ...outcome,
                occurredAt: timestamp,
            },
            createdAt: timestamp,
            ttl: this.calculateTTL(this.config.retentionDays),
        };

        await this.docClient.send(
            new PutCommand({
                TableName: this.config.tableName,
                Item: entity,
            })
        );

        // Update content performance
        await this.updateContentPerformance(outcome);
    }

    /**
     * Update content performance metrics
     */
    async updateContentPerformance(outcome: BusinessOutcome): Promise<void> {
        const performance = await this.getContentPerformance(outcome.contentId, outcome.userId);

        if (!performance) {
            // Create new performance record
            const newPerformance: ContentPerformance = {
                contentId: outcome.contentId,
                contentType: outcome.metadata.contentType || 'unknown',
                creationCost: outcome.metadata.creationCost || 0,
                distributionCost: outcome.metadata.distributionCost || 0,
                totalCost: (outcome.metadata.creationCost || 0) + (outcome.metadata.distributionCost || 0),
                views: 0,
                clicks: 0,
                shares: 0,
                leads: 0,
                conversions: 0,
                revenue: 0,
                roi: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await this.createContentPerformance(outcome.userId, outcome.strandId, newPerformance);
        }

        // Update metrics based on outcome type
        const updates = this.calculatePerformanceUpdates(outcome);

        await this.docClient.send(
            new UpdateCommand({
                TableName: this.config.tableName,
                Key: {
                    PK: `USER#${outcome.userId}`,
                    SK: `CONTENT_PERF#${outcome.contentId}`,
                },
                UpdateExpression: `
                    SET 
                        performance.views = performance.views + :views,
                        performance.clicks = performance.clicks + :clicks,
                        performance.shares = performance.shares + :shares,
                        performance.leads = performance.leads + :leads,
                        performance.conversions = performance.conversions + :conversions,
                        performance.revenue = performance.revenue + :revenue,
                        performance.updatedAt = :updatedAt
                `,
                ExpressionAttributeValues: {
                    ':views': updates.views,
                    ':clicks': updates.clicks,
                    ':shares': updates.shares,
                    ':leads': updates.leads,
                    ':conversions': updates.conversions,
                    ':revenue': updates.revenue,
                    ':updatedAt': new Date().toISOString(),
                },
            })
        );

        // Recalculate ROI
        await this.recalculateROI(outcome.contentId, outcome.userId);
    }

    /**
     * Calculate ROI for content
     */
    async calculateROI(contentId: string, userId: string): Promise<ROICalculation | null> {
        const performance = await this.getContentPerformance(contentId, userId);

        if (!performance) {
            return null;
        }

        const investment = performance.totalCost;
        const returnValue = performance.revenue;
        const profit = returnValue - investment;
        const roiPercentage = investment > 0 ? (profit / investment) * 100 : 0;

        // Calculate payback period (simplified)
        const outcomes = await this.getContentOutcomes(contentId);
        const paybackPeriod = this.calculatePaybackPeriod(outcomes, investment);

        return {
            contentId,
            investment,
            return: returnValue,
            profit,
            roiPercentage,
            paybackPeriod,
            calculatedAt: new Date().toISOString(),
        };
    }

    /**
     * Get content performance metrics
     */
    async getContentPerformance(contentId: string, userId: string): Promise<ContentPerformance | null> {
        const result = await this.docClient.send(
            new QueryCommand({
                TableName: this.config.tableName,
                KeyConditionExpression: 'PK = :pk AND SK = :sk',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': `CONTENT_PERF#${contentId}`,
                },
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        const entity = result.Items[0] as ContentPerformanceEntity;
        return entity.performance;
    }

    /**
     * Generate ROI report
     */
    async generateReport(filters: ROIFilters): Promise<ROIReport> {
        const performances = await this.queryContentPerformances(filters);

        // Calculate overall metrics
        const totalInvestment = performances.reduce((sum, p) => sum + p.totalCost, 0);
        const totalReturn = performances.reduce((sum, p) => sum + p.revenue, 0);
        const overallROI = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;

        // Group by content type
        const byContentType: Record<string, ROICalculation> = {};
        const contentTypeGroups = this.groupBy(performances, p => p.contentType);

        for (const [contentType, items] of Object.entries(contentTypeGroups)) {
            const investment = items.reduce((sum, p) => sum + p.totalCost, 0);
            const returnValue = items.reduce((sum, p) => sum + p.revenue, 0);
            const profit = returnValue - investment;
            const roiPercentage = investment > 0 ? (profit / investment) * 100 : 0;

            byContentType[contentType] = {
                contentId: contentType,
                investment,
                return: returnValue,
                profit,
                roiPercentage,
                paybackPeriod: 0, // Aggregate doesn't have payback period
                calculatedAt: new Date().toISOString(),
            };
        }

        // Group by strand (if available)
        const byStrand: Record<string, ROICalculation> = {};
        // Note: Would need to query strand associations separately

        // Sort by ROI
        const sorted = [...performances].sort((a, b) => b.roi - a.roi);
        const topPerformers = sorted.slice(0, 10);
        const bottomPerformers = sorted.slice(-10).reverse();

        // Generate insights
        const insights = this.generateInsights(performances, overallROI);
        const recommendations = this.generateRecommendations(performances, byContentType);

        return {
            id: `roi-report-${Date.now()}`,
            title: 'ROI Performance Report',
            period: {
                start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: filters.endDate || new Date().toISOString(),
            },
            totalInvestment,
            totalReturn,
            overallROI,
            byContentType,
            byStrand,
            topPerformers,
            bottomPerformers,
            insights,
            recommendations,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Correlate content performance with strand metrics
     */
    async correlatePerformance(
        userId: string,
        strandId: string,
        timeframe: string
    ): Promise<{
        correlation: number;
        insights: string[];
    }> {
        // Get all content created by this strand
        const performances = await this.queryContentPerformances({
            userId,
            strandId,
        });

        if (performances.length === 0) {
            return {
                correlation: 0,
                insights: ['No content performance data available for this strand'],
            };
        }

        // Calculate correlation metrics
        const avgROI = performances.reduce((sum, p) => sum + p.roi, 0) / performances.length;
        const avgConversionRate = performances.reduce((sum, p) => {
            return sum + (p.views > 0 ? p.conversions / p.views : 0);
        }, 0) / performances.length;

        const insights: string[] = [];

        if (avgROI > 100) {
            insights.push(`This strand generates excellent ROI with an average of ${avgROI.toFixed(0)}%`);
        } else if (avgROI > 50) {
            insights.push(`This strand generates good ROI with an average of ${avgROI.toFixed(0)}%`);
        } else if (avgROI > 0) {
            insights.push(`This strand generates positive ROI with an average of ${avgROI.toFixed(0)}%`);
        } else {
            insights.push(`This strand needs optimization - average ROI is ${avgROI.toFixed(0)}%`);
        }

        if (avgConversionRate > 0.05) {
            insights.push(`Strong conversion rate of ${(avgConversionRate * 100).toFixed(1)}%`);
        } else if (avgConversionRate > 0.02) {
            insights.push(`Moderate conversion rate of ${(avgConversionRate * 100).toFixed(1)}%`);
        } else {
            insights.push(`Conversion rate of ${(avgConversionRate * 100).toFixed(1)}% could be improved`);
        }

        // Simple correlation score (0-1)
        const correlation = Math.min(1, Math.max(0, avgROI / 200));

        return {
            correlation,
            insights,
        };
    }

    /**
     * Create content performance record
     */
    private async createContentPerformance(
        userId: string,
        strandId: string,
        performance: ContentPerformance
    ): Promise<void> {
        const entity: ContentPerformanceEntity = {
            PK: `USER#${userId}`,
            SK: `CONTENT_PERF#${performance.contentId}`,
            entityType: 'ContentPerformance',
            userId,
            strandId,
            performance,
            createdAt: performance.createdAt,
            updatedAt: performance.updatedAt,
        };

        await this.docClient.send(
            new PutCommand({
                TableName: this.config.tableName,
                Item: entity,
            })
        );
    }

    /**
     * Recalculate ROI for content
     */
    private async recalculateROI(contentId: string, userId: string): Promise<void> {
        const performance = await this.getContentPerformance(contentId, userId);

        if (!performance) {
            return;
        }

        const roi = performance.totalCost > 0
            ? ((performance.revenue - performance.totalCost) / performance.totalCost) * 100
            : 0;

        await this.docClient.send(
            new UpdateCommand({
                TableName: this.config.tableName,
                Key: {
                    PK: `USER#${userId}`,
                    SK: `CONTENT_PERF#${contentId}`,
                },
                UpdateExpression: 'SET performance.roi = :roi, performance.updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':roi': roi,
                    ':updatedAt': new Date().toISOString(),
                },
            })
        );
    }

    /**
     * Calculate performance updates from outcome
     */
    private calculatePerformanceUpdates(outcome: BusinessOutcome): {
        views: number;
        clicks: number;
        shares: number;
        leads: number;
        conversions: number;
        revenue: number;
    } {
        const updates = {
            views: 0,
            clicks: 0,
            shares: 0,
            leads: 0,
            conversions: 0,
            revenue: 0,
        };

        switch (outcome.type) {
            case 'property-viewed':
                updates.views = 1;
                break;
            case 'engagement':
                updates.clicks = 1;
                break;
            case 'lead-generated':
                updates.leads = 1;
                break;
            case 'contact-made':
            case 'appointment-scheduled':
                updates.conversions = 1;
                break;
            case 'listing-signed':
            case 'sale-closed':
                updates.conversions = 1;
                updates.revenue = outcome.value;
                break;
            case 'referral-received':
                updates.leads = 1;
                updates.revenue = outcome.value;
                break;
        }

        return updates;
    }

    /**
     * Get outcomes for content
     */
    private async getContentOutcomes(contentId: string): Promise<BusinessOutcome[]> {
        const result = await this.docClient.send(
            new QueryCommand({
                TableName: this.config.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `CONTENT#${contentId}`,
                    ':sk': 'OUTCOME#',
                },
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return [];
        }

        return result.Items.map((item: any) => (item as BusinessOutcomeEntity).outcome);
    }

    /**
     * Calculate payback period
     */
    private calculatePaybackPeriod(outcomes: BusinessOutcome[], investment: number): number {
        if (outcomes.length === 0 || investment === 0) {
            return 0;
        }

        // Sort by date
        const sorted = [...outcomes].sort((a, b) =>
            new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        );

        let cumulativeRevenue = 0;
        const firstDate = new Date(sorted[0].occurredAt);

        for (const outcome of sorted) {
            cumulativeRevenue += outcome.value;

            if (cumulativeRevenue >= investment) {
                const paybackDate = new Date(outcome.occurredAt);
                const days = Math.ceil(
                    (paybackDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                return days;
            }
        }

        // Not yet paid back
        return -1;
    }

    /**
     * Query content performances
     */
    private async queryContentPerformances(filters: ROIFilters): Promise<ContentPerformance[]> {
        const performances: ContentPerformance[] = [];

        if (filters.userId) {
            const result = await this.docClient.send(
                new QueryCommand({
                    TableName: this.config.tableName,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': `USER#${filters.userId}`,
                        ':sk': 'CONTENT_PERF#',
                    },
                })
            );

            if (result.Items) {
                performances.push(
                    ...result.Items.map((item: any) => (item as ContentPerformanceEntity).performance)
                );
            }
        }

        // Apply filters
        return this.applyROIFilters(performances, filters);
    }

    /**
     * Apply filters to performances
     */
    private applyROIFilters(
        performances: ContentPerformance[],
        filters: ROIFilters
    ): ContentPerformance[] {
        let filtered = performances;

        if (filters.contentType) {
            filtered = filtered.filter(p => p.contentType === filters.contentType);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(p => new Date(p.createdAt) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filtered = filtered.filter(p => new Date(p.createdAt) <= endDate);
        }

        if (filters.minROI !== undefined) {
            filtered = filtered.filter(p => p.roi >= filters.minROI!);
        }

        if (filters.maxROI !== undefined) {
            filtered = filtered.filter(p => p.roi <= filters.maxROI!);
        }

        return filtered;
    }

    /**
     * Generate insights from performance data
     */
    private generateInsights(performances: ContentPerformance[], overallROI: number): string[] {
        const insights: string[] = [];

        if (performances.length === 0) {
            insights.push('No content performance data available for this period');
            return insights;
        }

        // Overall ROI insight
        if (overallROI > 100) {
            insights.push(`Excellent overall ROI of ${overallROI.toFixed(0)}% - content is highly profitable`);
        } else if (overallROI > 50) {
            insights.push(`Good overall ROI of ${overallROI.toFixed(0)}% - content is profitable`);
        } else if (overallROI > 0) {
            insights.push(`Positive overall ROI of ${overallROI.toFixed(0)}% - content is generating returns`);
        } else {
            insights.push(`Negative overall ROI of ${overallROI.toFixed(0)}% - content needs optimization`);
        }

        // Content volume insight
        insights.push(`Analyzed ${performances.length} pieces of content`);

        // Revenue insight
        const totalRevenue = performances.reduce((sum, p) => sum + p.revenue, 0);
        if (totalRevenue > 0) {
            insights.push(`Generated $${totalRevenue.toFixed(2)} in tracked revenue`);
        }

        // Conversion insight
        const avgConversionRate = performances.reduce((sum, p) => {
            return sum + (p.views > 0 ? p.conversions / p.views : 0);
        }, 0) / performances.length;

        if (avgConversionRate > 0) {
            insights.push(`Average conversion rate of ${(avgConversionRate * 100).toFixed(2)}%`);
        }

        return insights;
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(
        performances: ContentPerformance[],
        byContentType: Record<string, ROICalculation>
    ): string[] {
        const recommendations: string[] = [];

        if (performances.length === 0) {
            recommendations.push('Start tracking business outcomes to measure content ROI');
            return recommendations;
        }

        // Find best performing content type
        const contentTypes = Object.entries(byContentType).sort(
            (a, b) => b[1].roiPercentage - a[1].roiPercentage
        );

        if (contentTypes.length > 0 && contentTypes[0][1].roiPercentage > 50) {
            recommendations.push(
                `Focus on ${contentTypes[0][0]} content - it has the highest ROI at ${contentTypes[0][1].roiPercentage.toFixed(0)}%`
            );
        }

        // Find underperforming content
        const underperforming = performances.filter(p => p.roi < 0);
        if (underperforming.length > performances.length * 0.3) {
            recommendations.push(
                `${underperforming.length} pieces of content have negative ROI - consider revising or removing`
            );
        }

        // Conversion optimization
        const lowConversion = performances.filter(p => p.views > 100 && p.conversions === 0);
        if (lowConversion.length > 0) {
            recommendations.push(
                `${lowConversion.length} pieces have high views but no conversions - add stronger calls-to-action`
            );
        }

        // Cost optimization
        const avgCost = performances.reduce((sum, p) => sum + p.totalCost, 0) / performances.length;
        if (avgCost > 10) {
            recommendations.push(
                `Average content cost is $${avgCost.toFixed(2)} - look for optimization opportunities`
            );
        }

        return recommendations;
    }

    /**
     * Helper: Group items by key
     */
    private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
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
}

/**
 * Create an ROI tracker instance
 */
export function createROITracker(config?: Partial<ROITrackerConfig>): ROITracker {
    const defaultConfig: ROITrackerConfig = {
        tableName: process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev',
        retentionDays: 365,
        defaultCostMultiplier: 1.0,
    };

    return new ROITracker({ ...defaultConfig, ...config });
}
