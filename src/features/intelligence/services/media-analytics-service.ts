import type { MediaAnalytics, MediaMention } from '../types/media-types';
import { mediaMentionRepository } from '../repositories/media-mention-repository';

/**
 * Service for aggregating media analytics data
 */
export class MediaAnalyticsService {
    /**
     * Generate analytics for a user over a time period
     */
    async generateAnalytics(
        userId: string,
        period: '24h' | '7d' | '30d' | '90d'
    ): Promise<MediaAnalytics> {
        const { startTime, endTime } = this.getPeriodRange(period);
        const mentions = await mediaMentionRepository.getByUserAndTimeRange(
            userId,
            startTime,
            endTime
        );

        // Get comparison period data
        const comparisonPeriod = this.getComparisonPeriodRange(period);
        const comparisonMentions = await mediaMentionRepository.getByUserAndTimeRange(
            userId,
            comparisonPeriod.startTime,
            comparisonPeriod.endTime
        );

        return {
            userId,
            period,
            totalMentions: mentions.length,
            totalReach: this.calculateTotalReach(mentions),
            activeSources: this.countUniqueSources(mentions),
            sentimentBreakdown: this.calculateSentimentBreakdown(mentions),
            sentimentScore: this.calculateSentimentScore(mentions),
            typeBreakdown: this.calculateTypeBreakdown(mentions),
            timeline: this.generateTimeline(mentions, period),
            change: this.calculateChanges(mentions, comparisonMentions),
            generatedAt: Date.now(),
        };
    }

    /**
     * Get time range for a period
     */
    private getPeriodRange(period: '24h' | '7d' | '30d' | '90d'): { startTime: number; endTime: number } {
        const endTime = Date.now();
        let startTime: number;

        switch (period) {
            case '24h':
                startTime = endTime - 24 * 60 * 60 * 1000;
                break;
            case '7d':
                startTime = endTime - 7 * 24 * 60 * 60 * 1000;
                break;
            case '30d':
                startTime = endTime - 30 * 24 * 60 * 60 * 1000;
                break;
            case '90d':
                startTime = endTime - 90 * 24 * 60 * 60 * 1000;
                break;
        }

        return { startTime, endTime };
    }

    /**
     * Get comparison period range (previous period)
     */
    private getComparisonPeriodRange(period: '24h' | '7d' | '30d' | '90d'): { startTime: number; endTime: number } {
        const current = this.getPeriodRange(period);
        const duration = current.endTime - current.startTime;

        return {
            endTime: current.startTime,
            startTime: current.startTime - duration,
        };
    }

    /**
     * Calculate total reach from all mentions
     */
    private calculateTotalReach(mentions: MediaMention[]): number {
        return mentions.reduce((sum, mention) => sum + (mention.reach || 0), 0);
    }

    /**
     * Count unique sources
     */
    private countUniqueSources(mentions: MediaMention[]): number {
        const sources = new Set(mentions.map(m => m.source));
        return sources.size;
    }

    /**
     * Calculate sentiment breakdown
     */
    private calculateSentimentBreakdown(mentions: MediaMention[]): {
        positive: number;
        neutral: number;
        negative: number;
    } {
        const breakdown = { positive: 0, neutral: 0, negative: 0 };

        mentions.forEach(mention => {
            breakdown[mention.sentiment]++;
        });

        return breakdown;
    }

    /**
     * Calculate overall sentiment score (0-100)
     */
    private calculateSentimentScore(mentions: MediaMention[]): number {
        if (mentions.length === 0) return 50; // Neutral

        const totalScore = mentions.reduce((sum, mention) => {
            // Convert -1 to 1 scale to 0 to 100 scale
            return sum + ((mention.sentimentScore + 1) / 2) * 100;
        }, 0);

        return Math.round(totalScore / mentions.length);
    }

    /**
     * Calculate media type breakdown
     */
    private calculateTypeBreakdown(mentions: MediaMention[]): {
        broadcast: number;
        press: number;
        online: number;
        social: number;
    } {
        const breakdown = { broadcast: 0, press: 0, online: 0, social: 0 };

        mentions.forEach(mention => {
            breakdown[mention.mediaType]++;
        });

        return breakdown;
    }

    /**
     * Generate timeline data for charts
     */
    private generateTimeline(
        mentions: MediaMention[],
        period: '24h' | '7d' | '30d' | '90d'
    ): Array<{
        date: string;
        broadcast: number;
        press: number;
        online: number;
        social: number;
    }> {
        const timeline: Map<string, any> = new Map();
        const { startTime, endTime } = this.getPeriodRange(period);

        // Initialize all dates in range
        const dates = this.generateDateRange(startTime, endTime, period);
        dates.forEach(date => {
            timeline.set(date, {
                date,
                broadcast: 0,
                press: 0,
                online: 0,
                social: 0,
            });
        });

        // Aggregate mentions by date
        mentions.forEach(mention => {
            const dateKey = this.getDateKey(mention.publishedAt, period);
            const existing = timeline.get(dateKey);
            if (existing) {
                existing[mention.mediaType]++;
            }
        });

        return Array.from(timeline.values());
    }

    /**
     * Generate array of date keys for timeline
     */
    private generateDateRange(
        startTime: number,
        endTime: number,
        period: '24h' | '7d' | '30d' | '90d'
    ): string[] {
        const dates: string[] = [];
        const increment = period === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour or 1 day

        for (let time = startTime; time <= endTime; time += increment) {
            dates.push(this.getDateKey(time, period));
        }

        return dates;
    }

    /**
     * Get date key for grouping
     */
    private getDateKey(timestamp: number, period: '24h' | '7d' | '30d' | '90d'): string {
        const date = new Date(timestamp);

        if (period === '24h') {
            // Group by hour
            return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        } else {
            // Group by day
            return date.toISOString().slice(0, 10); // YYYY-MM-DD
        }
    }

    /**
     * Calculate changes compared to previous period
     */
    private calculateChanges(
        currentMentions: MediaMention[],
        previousMentions: MediaMention[]
    ): {
        mentions: number;
        reach: number;
        sentiment: number;
        sources: number;
    } {
        const currentCount = currentMentions.length;
        const previousCount = previousMentions.length;
        const mentionsChange = previousCount === 0 ? 0 :
            ((currentCount - previousCount) / previousCount) * 100;

        const currentReach = this.calculateTotalReach(currentMentions);
        const previousReach = this.calculateTotalReach(previousMentions);
        const reachChange = previousReach === 0 ? 0 :
            ((currentReach - previousReach) / previousReach) * 100;

        const currentSentiment = this.calculateSentimentScore(currentMentions);
        const previousSentiment = this.calculateSentimentScore(previousMentions);
        const sentimentChange = currentSentiment - previousSentiment;

        const currentSources = this.countUniqueSources(currentMentions);
        const previousSources = this.countUniqueSources(previousMentions);
        const sourcesChange = previousSources === 0 ? 0 :
            ((currentSources - previousSources) / previousSources) * 100;

        return {
            mentions: Math.round(mentionsChange * 10) / 10,
            reach: Math.round(reachChange * 10) / 10,
            sentiment: Math.round(sentimentChange * 10) / 10,
            sources: Math.round(sourcesChange * 10) / 10,
        };
    }
}

// Export singleton instance
export const mediaAnalyticsService = new MediaAnalyticsService();
