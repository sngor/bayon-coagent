/**
 * Feedback Management Service
 * 
 * Handles user feedback retrieval, categorization, sentiment analysis, and admin responses.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getFeedbackKeys } from '@/aws/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';

export interface Feedback {
    feedbackId: string;
    userId: string;
    userName: string;
    userEmail: string;
    feedbackText: string;
    category: 'bug' | 'feature_request' | 'general' | 'uncategorized';
    sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
    status: 'new' | 'addressed' | 'archived';
    createdAt: number;
    updatedAt: number;
    adminResponse?: string;
    respondedBy?: string;
    respondedAt?: number;
}

export interface FeedbackSummaryReport {
    totalFeedback: number;
    byCategory: Record<string, number>;
    bySentiment: Record<string, number>;
    commonThemes: Array<{ theme: string; count: number }>;
    topFeatureRequests: Array<{ request: string; count: number }>;
    sentimentTrend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
}

export class FeedbackService {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates a new feedback entry
     */
    async createFeedback(
        userId: string,
        userName: string,
        userEmail: string,
        feedbackText: string
    ): Promise<Feedback> {
        const feedbackId = uuidv4();
        const now = Date.now();

        // Perform basic sentiment analysis
        const sentiment = this.analyzeSentiment(feedbackText);

        const feedback: Feedback = {
            feedbackId,
            userId,
            userName,
            userEmail,
            feedbackText,
            category: 'uncategorized',
            sentiment,
            status: 'new',
            createdAt: now,
            updatedAt: now,
        };

        const keys = getFeedbackKeys(feedbackId, now);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'Feedback',
            feedback,
            {
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            }
        );

        return feedback;
    }

    /**
     * Gets feedback with filtering
     */
    async getFeedback(options?: {
        status?: string;
        category?: string;
        sentiment?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        lastKey?: string;
    }): Promise<{
        feedback: Feedback[];
        lastKey?: string;
    }> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Use GSI1 to query feedback sorted by date
        const command = new QueryCommand({
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'FEEDBACK#ALL',
            },
            Limit: options?.limit || 50,
            ExclusiveStartKey: options?.lastKey ? JSON.parse(options.lastKey) : undefined,
            ScanIndexForward: false, // Most recent first
        });

        const result = await client.send(command);
        let feedback = (result.Items || []).map((item: any) => item.Data as Feedback);

        // Apply filters
        if (options?.status) {
            feedback = feedback.filter((f: Feedback) => f.status === options.status);
        }
        if (options?.category) {
            feedback = feedback.filter((f: Feedback) => f.category === options.category);
        }
        if (options?.sentiment) {
            feedback = feedback.filter((f: Feedback) => f.sentiment === options.sentiment);
        }
        if (options?.userId) {
            feedback = feedback.filter((f: Feedback) => f.userId === options.userId);
        }
        if (options?.startDate) {
            const startTime = options.startDate.getTime();
            feedback = feedback.filter((f: Feedback) => f.createdAt >= startTime);
        }
        if (options?.endDate) {
            const endTime = options.endDate.getTime();
            feedback = feedback.filter((f: Feedback) => f.createdAt <= endTime);
        }

        return {
            feedback,
            lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        };
    }

    /**
     * Gets a specific feedback item
     */
    async getFeedbackById(feedbackId: string): Promise<Feedback | null> {
        const keys = getFeedbackKeys(feedbackId);
        return await this.repository.get<Feedback>(keys.PK, keys.SK);
    }

    /**
     * Categorizes feedback
     */
    async categorizeFeedback(
        feedbackId: string,
        category: Feedback['category'],
        adminId: string
    ): Promise<void> {
        const keys = getFeedbackKeys(feedbackId);
        await this.repository.update(keys.PK, keys.SK, {
            category,
            updatedAt: Date.now(),
        });
    }

    /**
     * Responds to feedback
     */
    async respondToFeedback(
        feedbackId: string,
        adminId: string,
        adminName: string,
        response: string
    ): Promise<void> {
        const keys = getFeedbackKeys(feedbackId);
        const now = Date.now();

        await this.repository.update(keys.PK, keys.SK, {
            adminResponse: response,
            respondedBy: adminId,
            respondedAt: now,
            status: 'addressed',
            updatedAt: now,
        });

        // TODO: Send email notification to user
        // This would integrate with SES to send an email to the user
    }

    /**
     * Archives feedback
     */
    async archiveFeedback(feedbackId: string): Promise<void> {
        const keys = getFeedbackKeys(feedbackId);
        await this.repository.update(keys.PK, keys.SK, {
            status: 'archived',
            updatedAt: Date.now(),
        });
    }

    /**
     * Generates a feedback summary report
     */
    async generateSummaryReport(options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<FeedbackSummaryReport> {
        // Get all feedback in the date range
        const { feedback } = await this.getFeedback({
            startDate: options?.startDate,
            endDate: options?.endDate,
            limit: 1000, // Get more for analysis
        });

        // Calculate statistics
        const byCategory: Record<string, number> = {};
        const bySentiment: Record<string, number> = {};
        const featureRequests: Map<string, number> = new Map();
        const themes: Map<string, number> = new Map();

        feedback.forEach((f: Feedback) => {
            // Count by category
            byCategory[f.category] = (byCategory[f.category] || 0) + 1;

            // Count by sentiment
            bySentiment[f.sentiment] = (bySentiment[f.sentiment] || 0) + 1;

            // Extract feature requests
            if (f.category === 'feature_request') {
                const key = f.feedbackText.substring(0, 100); // Use first 100 chars as key
                featureRequests.set(key, (featureRequests.get(key) || 0) + 1);
            }

            // Extract common themes (simple keyword extraction)
            const keywords = this.extractKeywords(f.feedbackText);
            keywords.forEach(keyword => {
                themes.set(keyword, (themes.get(keyword) || 0) + 1);
            });
        });

        // Get top feature requests
        const topFeatureRequests = Array.from(featureRequests.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([request, count]) => ({ request, count }));

        // Get common themes
        const commonThemes = Array.from(themes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([theme, count]) => ({ theme, count }));

        // Calculate sentiment trend (by day)
        const sentimentTrend = this.calculateSentimentTrend(feedback);

        return {
            totalFeedback: feedback.length,
            byCategory,
            bySentiment,
            commonThemes,
            topFeatureRequests,
            sentimentTrend,
        };
    }

    /**
     * Performs basic sentiment analysis on text
     */
    private analyzeSentiment(text: string): Feedback['sentiment'] {
        const lowerText = text.toLowerCase();

        // Simple keyword-based sentiment analysis
        const positiveWords = ['great', 'excellent', 'love', 'amazing', 'fantastic', 'wonderful', 'perfect', 'awesome', 'good', 'helpful', 'thank'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'poor', 'broken', 'bug', 'issue', 'problem', 'error', 'fail'];

        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveCount++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeCount++;
        });

        if (positiveCount > negativeCount) {
            return 'positive';
        } else if (negativeCount > positiveCount) {
            return 'negative';
        } else if (positiveCount === 0 && negativeCount === 0) {
            return 'unknown';
        } else {
            return 'neutral';
        }
    }

    /**
     * Extracts keywords from text for theme analysis
     */
    private extractKeywords(text: string): string[] {
        const lowerText = text.toLowerCase();
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);

        // Extract words (simple tokenization)
        const words = lowerText.match(/\b[a-z]{3,}\b/g) || [];

        // Filter out common words and return unique keywords
        const uniqueWords = new Set(words.filter(word => !commonWords.has(word)));
        return Array.from(uniqueWords);
    }

    /**
     * Calculates sentiment trend over time
     */
    private calculateSentimentTrend(feedback: Feedback[]): Array<{ date: string; positive: number; neutral: number; negative: number }> {
        const trendMap: Map<string, { positive: number; neutral: number; negative: number }> = new Map();

        feedback.forEach((f: Feedback) => {
            const date = new Date(f.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
            const trend = trendMap.get(date) || { positive: 0, neutral: 0, negative: 0 };

            if (f.sentiment === 'positive') {
                trend.positive++;
            } else if (f.sentiment === 'neutral') {
                trend.neutral++;
            } else if (f.sentiment === 'negative') {
                trend.negative++;
            }

            trendMap.set(date, trend);
        });

        // Convert to array and sort by date
        return Array.from(trendMap.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
