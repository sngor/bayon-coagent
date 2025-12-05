/**
 * Engagement Reporting Service
 * 
 * Generates comprehensive engagement reports including feature adoption rates,
 * cohort analysis for user retention, and content creation statistics.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getAnalyticsEventKeys, getAggregatedMetricsKeys } from '@/aws/dynamodb/keys';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';

export interface FeatureAdoptionRate {
    featureName: string;
    totalUsers: number;
    activeUsers: number;
    adoptionRate: number; // Percentage
    usageCount: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
}

export interface CohortRetentionData {
    cohortDate: string; // Signup date (YYYY-MM-DD)
    cohortSize: number;
    retention: {
        day1: number;
        day7: number;
        day14: number;
        day30: number;
        day60: number;
        day90: number;
    };
}

export interface ContentCreationStats {
    totalContent: number;
    averagePerUser: number;
    contentByType: Record<string, number>;
    topContentTypes: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
    contentByDate: Array<{
        date: string;
        count: number;
    }>;
    topCreators: Array<{
        userId: string;
        userName: string;
        contentCount: number;
    }>;
}

export interface EngagementReport {
    reportId: string;
    generatedAt: number;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalUsers: number;
        activeUsers: number;
        engagementRate: number;
        averageSessionsPerUser: number;
        averageContentPerUser: number;
    };
    featureAdoption: FeatureAdoptionRate[];
    cohortRetention: CohortRetentionData[];
    contentStats: ContentCreationStats;
    insights: string[];
}

export class EngagementReportingService {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Calculates feature adoption rates over time
     */
    async calculateFeatureAdoption(
        startDate: Date,
        endDate: Date
    ): Promise<FeatureAdoptionRate[]> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Get all users
        const usersCommand = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'USERS',
            },
        });

        const usersResult = await client.send(usersCommand);
        const totalUsers = usersResult.Items?.length || 0;

        // Query feature usage events for the date range
        const featureUsageMap = new Map<string, Set<string>>();
        const featureCountMap = new Map<string, number>();

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const keys = getAnalyticsEventKeys(dateStr, '', 0, '');

            const command = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk',
                FilterExpression: '#data.#eventType = :eventType',
                ExpressionAttributeNames: {
                    '#data': 'Data',
                    '#eventType': 'eventType',
                },
                ExpressionAttributeValues: {
                    ':pk': keys.PK,
                    ':eventType': 'feature_use',
                },
            });

            try {
                const result = await client.send(command);

                result.Items?.forEach(item => {
                    const event = item.Data;
                    const featureName = event.eventData?.feature || 'unknown';
                    const userId = event.userId;

                    if (!featureUsageMap.has(featureName)) {
                        featureUsageMap.set(featureName, new Set());
                        featureCountMap.set(featureName, 0);
                    }

                    featureUsageMap.get(featureName)!.add(userId);
                    featureCountMap.set(featureName, featureCountMap.get(featureName)! + 1);
                });
            } catch (error) {
                console.error(`Failed to fetch feature usage for ${dateStr}:`, error);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate adoption rates and trends
        const adoptionRates: FeatureAdoptionRate[] = [];

        for (const [featureName, userSet] of featureUsageMap.entries()) {
            const activeUsers = userSet.size;
            const adoptionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
            const usageCount = featureCountMap.get(featureName) || 0;

            // Calculate trend by comparing first half vs second half of date range
            const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
            const firstHalfUsage = await this.getFeatureUsageForPeriod(
                featureName,
                startDate,
                midDate
            );
            const secondHalfUsage = await this.getFeatureUsageForPeriod(
                featureName,
                midDate,
                endDate
            );

            let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
            let changePercentage = 0;

            if (firstHalfUsage > 0) {
                changePercentage = ((secondHalfUsage - firstHalfUsage) / firstHalfUsage) * 100;
                if (changePercentage > 10) {
                    trend = 'increasing';
                } else if (changePercentage < -10) {
                    trend = 'decreasing';
                }
            } else if (secondHalfUsage > 0) {
                trend = 'increasing';
                changePercentage = 100;
            }

            adoptionRates.push({
                featureName,
                totalUsers,
                activeUsers,
                adoptionRate: Math.round(adoptionRate * 100) / 100,
                usageCount,
                trend,
                changePercentage: Math.round(changePercentage * 100) / 100,
            });
        }

        // Sort by adoption rate descending
        return adoptionRates.sort((a, b) => b.adoptionRate - a.adoptionRate);
    }

    /**
     * Helper to get feature usage count for a specific period
     */
    private async getFeatureUsageForPeriod(
        featureName: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        let count = 0;
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const keys = getAnalyticsEventKeys(dateStr, '', 0, '');

            const command = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk',
                FilterExpression: '#data.#eventType = :eventType AND #data.#eventData.#feature = :feature',
                ExpressionAttributeNames: {
                    '#data': 'Data',
                    '#eventType': 'eventType',
                    '#eventData': 'eventData',
                    '#feature': 'feature',
                },
                ExpressionAttributeValues: {
                    ':pk': keys.PK,
                    ':eventType': 'feature_use',
                    ':feature': featureName,
                },
            });

            try {
                const result = await client.send(command);
                count += result.Items?.length || 0;
            } catch (error) {
                console.error(`Failed to fetch feature usage for ${dateStr}:`, error);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return count;
    }

    /**
     * Implements cohort analysis for user retention
     */
    async calculateCohortRetention(
        startDate: Date,
        endDate: Date
    ): Promise<CohortRetentionData[]> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Get all users with their signup dates
        const usersCommand = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'USERS',
            },
        });

        const usersResult = await client.send(usersCommand);
        const users = usersResult.Items || [];

        // Group users by signup date (cohort)
        const cohorts = new Map<string, string[]>();

        users.forEach(user => {
            const signupDate = user.Data?.createdAt
                ? new Date(user.Data.createdAt).toISOString().split('T')[0]
                : null;

            if (signupDate && new Date(signupDate) >= startDate && new Date(signupDate) <= endDate) {
                if (!cohorts.has(signupDate)) {
                    cohorts.set(signupDate, []);
                }
                cohorts.get(signupDate)!.push(user.Data.userId);
            }
        });

        // Calculate retention for each cohort
        const retentionData: CohortRetentionData[] = [];

        for (const [cohortDate, userIds] of cohorts.entries()) {
            const cohortSize = userIds.length;
            const cohortDateObj = new Date(cohortDate);

            // Calculate retention at different intervals
            const retention = {
                day1: await this.calculateRetentionRate(userIds, cohortDateObj, 1),
                day7: await this.calculateRetentionRate(userIds, cohortDateObj, 7),
                day14: await this.calculateRetentionRate(userIds, cohortDateObj, 14),
                day30: await this.calculateRetentionRate(userIds, cohortDateObj, 30),
                day60: await this.calculateRetentionRate(userIds, cohortDateObj, 60),
                day90: await this.calculateRetentionRate(userIds, cohortDateObj, 90),
            };

            retentionData.push({
                cohortDate,
                cohortSize,
                retention,
            });
        }

        // Sort by cohort date
        return retentionData.sort((a, b) => a.cohortDate.localeCompare(b.cohortDate));
    }

    /**
     * Calculates retention rate for a cohort at a specific day offset
     */
    private async calculateRetentionRate(
        userIds: string[],
        cohortDate: Date,
        dayOffset: number
    ): Promise<number> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        const targetDate = new Date(cohortDate);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Check if target date is in the future
        if (targetDate > new Date()) {
            return 0;
        }

        // Count how many users from the cohort were active on the target date
        const keys = getAnalyticsEventKeys(targetDateStr, '', 0, '');
        let activeUsers = 0;

        for (const userId of userIds) {
            const command = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': `EVENT#`,
                },
                Limit: 1,
            });

            try {
                const result = await client.send(command);
                if (result.Items && result.Items.length > 0) {
                    // Check if any event occurred on the target date
                    const hasActivityOnDate = result.Items.some(item => {
                        const eventDate = new Date(item.Data.timestamp).toISOString().split('T')[0];
                        return eventDate === targetDateStr;
                    });

                    if (hasActivityOnDate) {
                        activeUsers++;
                    }
                }
            } catch (error) {
                console.error(`Failed to check activity for user ${userId}:`, error);
            }
        }

        return userIds.length > 0 ? Math.round((activeUsers / userIds.length) * 100) : 0;
    }

    /**
     * Generates content creation statistics
     */
    async generateContentStats(
        startDate: Date,
        endDate: Date
    ): Promise<ContentCreationStats> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        let totalContent = 0;
        const contentByType: Record<string, number> = {};
        const contentByDate: Array<{ date: string; count: number }> = [];
        const creatorCounts = new Map<string, { name: string; count: number }>();

        // Query content creation events
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const keys = getAnalyticsEventKeys(dateStr, '', 0, '');

            const command = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'PK = :pk',
                FilterExpression: '#data.#eventType = :eventType',
                ExpressionAttributeNames: {
                    '#data': 'Data',
                    '#eventType': 'eventType',
                },
                ExpressionAttributeValues: {
                    ':pk': keys.PK,
                    ':eventType': 'content_create',
                },
            });

            try {
                const result = await client.send(command);
                const dayCount = result.Items?.length || 0;
                totalContent += dayCount;

                contentByDate.push({
                    date: dateStr,
                    count: dayCount,
                });

                result.Items?.forEach(item => {
                    const event = item.Data;
                    const contentType = event.eventData?.contentType || 'unknown';
                    const userId = event.userId;
                    const userName = event.eventData?.userName || 'Unknown User';

                    // Count by type
                    contentByType[contentType] = (contentByType[contentType] || 0) + 1;

                    // Count by creator
                    if (!creatorCounts.has(userId)) {
                        creatorCounts.set(userId, { name: userName, count: 0 });
                    }
                    creatorCounts.get(userId)!.count++;
                });
            } catch (error) {
                console.error(`Failed to fetch content stats for ${dateStr}:`, error);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate top content types
        const topContentTypes = Object.entries(contentByType)
            .map(([type, count]) => ({
                type,
                count,
                percentage: totalContent > 0 ? Math.round((count / totalContent) * 100 * 100) / 100 : 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Get top creators
        const topCreators = Array.from(creatorCounts.entries())
            .map(([userId, data]) => ({
                userId,
                userName: data.name,
                contentCount: data.count,
            }))
            .sort((a, b) => b.contentCount - a.contentCount)
            .slice(0, 10);

        // Get total unique users
        const uniqueUsers = creatorCounts.size;
        const averagePerUser = uniqueUsers > 0 ? Math.round((totalContent / uniqueUsers) * 100) / 100 : 0;

        return {
            totalContent,
            averagePerUser,
            contentByType,
            topContentTypes,
            contentByDate,
            topCreators,
        };
    }

    /**
     * Creates a comprehensive engagement report with insights
     */
    async createEngagementReport(
        startDate: Date,
        endDate: Date
    ): Promise<EngagementReport> {
        const reportId = `report_${Date.now()}`;

        // Gather all data in parallel
        const [featureAdoption, cohortRetention, contentStats] = await Promise.all([
            this.calculateFeatureAdoption(startDate, endDate),
            this.calculateCohortRetention(startDate, endDate),
            this.generateContentStats(startDate, endDate),
        ]);

        // Get user counts
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        const usersCommand = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'USERS',
            },
        });

        const usersResult = await client.send(usersCommand);
        const totalUsers = usersResult.Items?.length || 0;

        // Calculate active users (users with any activity in the date range)
        const activeUserIds = new Set<string>();
        featureAdoption.forEach(feature => {
            // Active users are already calculated in feature adoption
        });

        // Get unique active users from all features
        const allActiveUsers = featureAdoption.reduce((sum, feature) =>
            Math.max(sum, feature.activeUsers), 0
        );

        const engagementRate = totalUsers > 0
            ? Math.round((allActiveUsers / totalUsers) * 100 * 100) / 100
            : 0;

        // Generate insights
        const insights = this.generateInsights(
            featureAdoption,
            cohortRetention,
            contentStats,
            totalUsers,
            allActiveUsers
        );

        return {
            reportId,
            generatedAt: Date.now(),
            dateRange: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            },
            summary: {
                totalUsers,
                activeUsers: allActiveUsers,
                engagementRate,
                averageSessionsPerUser: 0, // Would need session tracking
                averageContentPerUser: contentStats.averagePerUser,
            },
            featureAdoption,
            cohortRetention,
            contentStats,
            insights,
        };
    }

    /**
     * Generates insights from the engagement data
     */
    private generateInsights(
        featureAdoption: FeatureAdoptionRate[],
        cohortRetention: CohortRetentionData[],
        contentStats: ContentCreationStats,
        totalUsers: number,
        activeUsers: number
    ): string[] {
        const insights: string[] = [];

        // Feature adoption insights
        if (featureAdoption.length > 0) {
            const topFeature = featureAdoption[0];
            insights.push(
                `${topFeature.featureName} is the most popular feature with ${topFeature.adoptionRate}% adoption rate.`
            );

            const increasingFeatures = featureAdoption.filter(f => f.trend === 'increasing');
            if (increasingFeatures.length > 0) {
                insights.push(
                    `${increasingFeatures.length} features are showing increasing usage trends.`
                );
            }

            const lowAdoptionFeatures = featureAdoption.filter(f => f.adoptionRate < 10);
            if (lowAdoptionFeatures.length > 0) {
                insights.push(
                    `${lowAdoptionFeatures.length} features have less than 10% adoption and may need promotion.`
                );
            }
        }

        // Retention insights
        if (cohortRetention.length > 0) {
            const avgDay7Retention = cohortRetention.reduce((sum, c) => sum + c.retention.day7, 0) / cohortRetention.length;
            const avgDay30Retention = cohortRetention.reduce((sum, c) => sum + c.retention.day30, 0) / cohortRetention.length;

            insights.push(
                `Average 7-day retention is ${Math.round(avgDay7Retention)}%, and 30-day retention is ${Math.round(avgDay30Retention)}%.`
            );

            if (avgDay7Retention < 40) {
                insights.push(
                    'Low 7-day retention suggests onboarding improvements may be needed.'
                );
            }

            if (avgDay30Retention > 50) {
                insights.push(
                    'Strong 30-day retention indicates good product-market fit.'
                );
            }
        }

        // Content creation insights
        if (contentStats.totalContent > 0) {
            insights.push(
                `Users created ${contentStats.totalContent} pieces of content, averaging ${contentStats.averagePerUser} per active user.`
            );

            if (contentStats.topContentTypes.length > 0) {
                const topType = contentStats.topContentTypes[0];
                insights.push(
                    `${topType.type} is the most popular content type (${topType.percentage}% of all content).`
                );
            }

            if (contentStats.averagePerUser < 2) {
                insights.push(
                    'Low content creation per user suggests users may need more guidance or templates.'
                );
            }
        }

        // Overall engagement insights
        const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        if (engagementRate < 30) {
            insights.push(
                'Overall engagement is below 30%. Consider re-engagement campaigns for inactive users.'
            );
        } else if (engagementRate > 70) {
            insights.push(
                'Strong overall engagement above 70% indicates high user satisfaction.'
            );
        }

        return insights;
    }

    /**
     * Exports engagement report as PDF (placeholder for PDF generation)
     */
    async exportReportAsPDF(report: EngagementReport): Promise<Buffer> {
        // This is a placeholder. In a real implementation, you would use a library like:
        // - pdfkit
        // - puppeteer (for HTML to PDF)
        // - jsPDF

        // For now, return a simple text representation as a buffer
        const content = this.generatePDFContent(report);
        return Buffer.from(content, 'utf-8');
    }

    /**
     * Generates PDF content as text (placeholder)
     */
    private generatePDFContent(report: EngagementReport): string {
        let content = `ENGAGEMENT REPORT\n`;
        content += `Generated: ${new Date(report.generatedAt).toISOString()}\n`;
        content += `Date Range: ${report.dateRange.startDate} to ${report.dateRange.endDate}\n\n`;

        content += `SUMMARY\n`;
        content += `Total Users: ${report.summary.totalUsers}\n`;
        content += `Active Users: ${report.summary.activeUsers}\n`;
        content += `Engagement Rate: ${report.summary.engagementRate}%\n`;
        content += `Average Content Per User: ${report.summary.averageContentPerUser}\n\n`;

        content += `FEATURE ADOPTION\n`;
        report.featureAdoption.forEach(feature => {
            content += `- ${feature.featureName}: ${feature.adoptionRate}% (${feature.trend})\n`;
        });
        content += `\n`;

        content += `COHORT RETENTION\n`;
        report.cohortRetention.forEach(cohort => {
            content += `Cohort ${cohort.cohortDate} (${cohort.cohortSize} users):\n`;
            content += `  Day 7: ${cohort.retention.day7}%\n`;
            content += `  Day 30: ${cohort.retention.day30}%\n`;
        });
        content += `\n`;

        content += `CONTENT STATISTICS\n`;
        content += `Total Content: ${report.contentStats.totalContent}\n`;
        content += `Average Per User: ${report.contentStats.averagePerUser}\n`;
        content += `Top Content Types:\n`;
        report.contentStats.topContentTypes.forEach(type => {
            content += `- ${type.type}: ${type.count} (${type.percentage}%)\n`;
        });
        content += `\n`;

        content += `KEY INSIGHTS\n`;
        report.insights.forEach(insight => {
            content += `- ${insight}\n`;
        });

        return content;
    }
}

// Export singleton instance
export const engagementReportingService = new EngagementReportingService();
