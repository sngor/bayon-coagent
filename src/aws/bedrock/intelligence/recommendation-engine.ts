/**
 * Recommendation Engine
 * 
 * Generates timing recommendations, scheduling strategy suggestions,
 * and prioritizes recommendations based on historical data analysis.
 * 
 * Features:
 * - Timing recommendation logic based on historical performance
 * - Scheduling strategy suggestions for optimal content posting
 * - Historical data analysis for pattern detection
 * - Recommendation prioritization by impact and feasibility
 */

import {
    AgentProfile,
    ActionableSuggestion,
} from './types';

/**
 * Content performance data
 */
export interface ContentPerformance {
    /** Content ID */
    contentId: string;

    /** Content type */
    contentType: string;

    /** Publishing timestamp */
    publishedAt: string;

    /** Day of week (0-6, Sunday-Saturday) */
    dayOfWeek: number;

    /** Hour of day (0-23) */
    hourOfDay: number;

    /** Performance metrics */
    metrics: {
        views: number;
        engagement: number;
        clicks: number;
        shares: number;
        conversions: number;
    };

    /** Platform published to */
    platform: string;

    /** Topics covered */
    topics: string[];
}

/**
 * Timing recommendation
 */
export interface TimingRecommendation {
    /** Recommendation ID */
    id: string;

    /** Content type this applies to */
    contentType: string;

    /** Platform this applies to */
    platform: string;

    /** Recommended day of week */
    dayOfWeek: number;

    /** Recommended hour of day */
    hourOfDay: number;

    /** Confidence in this recommendation (0-1) */
    confidence: number;

    /** Expected performance improvement */
    expectedImprovement: number;

    /** Supporting evidence */
    evidence: {
        historicalPerformance: number;
        sampleSize: number;
        consistencyScore: number;
    };

    /** Alternative times */
    alternatives: Array<{
        dayOfWeek: number;
        hourOfDay: number;
        expectedPerformance: number;
    }>;

    /** Generated timestamp */
    generatedAt: string;
}

/**
 * Scheduling strategy
 */
export interface SchedulingStrategy {
    /** Strategy ID */
    id: string;

    /** Strategy name */
    name: string;

    /** Strategy description */
    description: string;

    /** Recommended posting frequency */
    frequency: {
        postsPerWeek: number;
        postsPerMonth: number;
    };

    /** Recommended content mix */
    contentMix: Array<{
        contentType: string;
        percentage: number;
        frequency: string;
    }>;

    /** Optimal posting schedule */
    schedule: Array<{
        dayOfWeek: number;
        hourOfDay: number;
        contentType: string;
        priority: number;
    }>;

    /** Expected outcomes */
    expectedOutcomes: {
        engagementIncrease: number;
        reachIncrease: number;
        consistencyScore: number;
    };

    /** Confidence in strategy (0-1) */
    confidence: number;

    /** Generated timestamp */
    generatedAt: string;
}

/**
 * Recommendation with priority
 */
export interface PrioritizedRecommendation {
    /** Recommendation ID */
    id: string;

    /** Recommendation type */
    type: 'timing' | 'scheduling' | 'content' | 'strategy';

    /** Title */
    title: string;

    /** Description */
    description: string;

    /** Priority score (0-1) */
    priority: number;

    /** Impact score (0-1) */
    impact: number;

    /** Feasibility score (0-1) */
    feasibility: number;

    /** Confidence score (0-1) */
    confidence: number;

    /** Action items */
    actionItems: string[];

    /** Expected results */
    expectedResults: string[];

    /** Time to implement */
    timeToImplement: string;

    /** Resources needed */
    resourcesNeeded: string[];

    /** Related data */
    data: TimingRecommendation | SchedulingStrategy | any;

    /** Generated timestamp */
    generatedAt: string;
}

/**
 * Historical pattern detected in data
 */
export interface HistoricalPattern {
    /** Pattern ID */
    id: string;

    /** Pattern type */
    type: 'time-of-day' | 'day-of-week' | 'seasonal' | 'content-type' | 'topic';

    /** Pattern description */
    description: string;

    /** Pattern strength (0-1) */
    strength: number;

    /** Confidence in pattern (0-1) */
    confidence: number;

    /** Supporting data */
    supportingData: {
        sampleSize: number;
        averagePerformance: number;
        standardDeviation: number;
        consistency: number;
    };

    /** Detected timestamp */
    detectedAt: string;
}

/**
 * Configuration for recommendation engine
 */
export interface RecommendationEngineConfig {
    /** Minimum data points required for recommendations */
    minDataPoints: number;

    /** Minimum confidence threshold (0-1) */
    minConfidence: number;

    /** Analysis window in days */
    analysisWindow: number;

    /** Minimum sample size for patterns */
    minSampleSize: number;

    /** Consistency threshold for reliable patterns */
    consistencyThreshold: number;

    /** Weight for impact in prioritization */
    impactWeight: number;

    /** Weight for feasibility in prioritization */
    feasibilityWeight: number;

    /** Weight for confidence in prioritization */
    confidenceWeight: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RecommendationEngineConfig = {
    minDataPoints: 10,
    minConfidence: 0.6,
    analysisWindow: 90,
    minSampleSize: 5,
    consistencyThreshold: 0.7,
    impactWeight: 0.4,
    feasibilityWeight: 0.3,
    confidenceWeight: 0.3,
};

/**
 * RecommendationEngine - Generates timing and scheduling recommendations
 */
export class RecommendationEngine {
    private config: RecommendationEngineConfig;

    constructor(config: Partial<RecommendationEngineConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Generate timing recommendations based on historical data
     */
    async generateTimingRecommendations(
        historicalData: ContentPerformance[],
        contentType: string,
        platform: string
    ): Promise<TimingRecommendation[]> {
        // Filter data for specific content type and platform
        const relevantData = historicalData.filter(
            d => d.contentType === contentType && d.platform === platform
        );

        if (relevantData.length < this.config.minDataPoints) {
            return [];
        }

        // Analyze performance by time slots
        const timeSlotPerformance = this.analyzeTimeSlotPerformance(relevantData);

        // Find optimal times
        const recommendations: TimingRecommendation[] = [];

        for (const [timeSlot, performance] of Object.entries(timeSlotPerformance)) {
            const [dayOfWeek, hourOfDay] = timeSlot.split('-').map(Number);

            if (performance.sampleSize < this.config.minSampleSize) {
                continue;
            }

            const confidence = this.calculateTimingConfidence(performance);

            if (confidence < this.config.minConfidence) {
                continue;
            }

            // Calculate expected improvement vs average
            const avgPerformance = this.calculateAveragePerformance(relevantData);
            const expectedImprovement = (performance.avgScore - avgPerformance) / avgPerformance;

            // Find alternative times
            const alternatives = this.findAlternativeTimes(
                timeSlotPerformance,
                dayOfWeek,
                hourOfDay
            );

            recommendations.push({
                id: this.generateRecommendationId(),
                contentType,
                platform,
                dayOfWeek,
                hourOfDay,
                confidence,
                expectedImprovement,
                evidence: {
                    historicalPerformance: performance.avgScore,
                    sampleSize: performance.sampleSize,
                    consistencyScore: performance.consistency,
                },
                alternatives,
                generatedAt: new Date().toISOString(),
            });
        }

        // Sort by expected improvement
        return recommendations.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
    }

    /**
     * Generate scheduling strategy suggestions
     */
    async generateSchedulingStrategy(
        historicalData: ContentPerformance[],
        agentProfile: AgentProfile
    ): Promise<SchedulingStrategy> {
        if (historicalData.length < this.config.minDataPoints) {
            return this.generateDefaultStrategy(agentProfile);
        }

        // Analyze historical patterns
        const patterns = await this.analyzeHistoricalPatterns(historicalData);

        // Determine optimal frequency
        const frequency = this.determineOptimalFrequency(historicalData, patterns);

        // Determine content mix
        const contentMix = this.determineContentMix(historicalData, agentProfile);

        // Generate optimal schedule
        const schedule = this.generateOptimalSchedule(
            historicalData,
            patterns,
            frequency,
            contentMix
        );

        // Calculate expected outcomes
        const expectedOutcomes = this.calculateExpectedOutcomes(
            historicalData,
            schedule
        );

        // Calculate confidence
        const confidence = this.calculateStrategyConfidence(
            historicalData.length,
            patterns
        );

        return {
            id: this.generateStrategyId(),
            name: 'Optimized Posting Strategy',
            description: this.generateStrategyDescription(frequency, contentMix),
            frequency,
            contentMix,
            schedule,
            expectedOutcomes,
            confidence,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Analyze historical data for patterns
     */
    async analyzeHistoricalPatterns(
        historicalData: ContentPerformance[]
    ): Promise<HistoricalPattern[]> {
        const patterns: HistoricalPattern[] = [];

        // Analyze time-of-day patterns
        const timeOfDayPattern = this.detectTimeOfDayPattern(historicalData);
        if (timeOfDayPattern) {
            patterns.push(timeOfDayPattern);
        }

        // Analyze day-of-week patterns
        const dayOfWeekPattern = this.detectDayOfWeekPattern(historicalData);
        if (dayOfWeekPattern) {
            patterns.push(dayOfWeekPattern);
        }

        // Analyze content-type patterns
        const contentTypePattern = this.detectContentTypePattern(historicalData);
        if (contentTypePattern) {
            patterns.push(contentTypePattern);
        }

        // Analyze topic patterns
        const topicPattern = this.detectTopicPattern(historicalData);
        if (topicPattern) {
            patterns.push(topicPattern);
        }

        return patterns;
    }

    /**
     * Prioritize recommendations
     */
    prioritizeRecommendations(
        recommendations: Array<TimingRecommendation | SchedulingStrategy | any>,
        agentProfile: AgentProfile
    ): PrioritizedRecommendation[] {
        const prioritized: PrioritizedRecommendation[] = [];

        for (const rec of recommendations) {
            const prioritizedRec = this.createPrioritizedRecommendation(rec, agentProfile);
            prioritized.push(prioritizedRec);
        }

        // Sort by priority score
        return prioritized.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Analyze performance by time slots
     */
    private analyzeTimeSlotPerformance(
        data: ContentPerformance[]
    ): Record<string, { avgScore: number; sampleSize: number; consistency: number }> {
        const timeSlots: Record<string, number[]> = {};

        // Group by time slot (day-hour)
        for (const item of data) {
            const key = `${item.dayOfWeek}-${item.hourOfDay}`;
            if (!timeSlots[key]) {
                timeSlots[key] = [];
            }

            // Calculate performance score
            const score = this.calculatePerformanceScore(item.metrics);
            timeSlots[key].push(score);
        }

        // Calculate statistics for each time slot
        const result: Record<string, { avgScore: number; sampleSize: number; consistency: number }> = {};

        for (const [key, scores] of Object.entries(timeSlots)) {
            const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
            const sampleSize = scores.length;

            // Calculate consistency (inverse of coefficient of variation)
            const stdDev = this.calculateStandardDeviation(scores);
            const consistency = avgScore > 0 ? 1 - (stdDev / avgScore) : 0;

            result[key] = {
                avgScore,
                sampleSize,
                consistency: Math.max(0, Math.min(1, consistency)),
            };
        }

        return result;
    }

    /**
     * Calculate performance score from metrics
     */
    private calculatePerformanceScore(metrics: ContentPerformance['metrics']): number {
        // Weighted score: engagement is most important
        return (
            metrics.engagement * 0.4 +
            metrics.views * 0.2 +
            metrics.clicks * 0.2 +
            metrics.shares * 0.1 +
            metrics.conversions * 0.1
        );
    }

    /**
     * Calculate timing confidence
     */
    private calculateTimingConfidence(performance: {
        avgScore: number;
        sampleSize: number;
        consistency: number;
    }): number {
        // Confidence based on sample size and consistency
        const sampleSizeScore = Math.min(performance.sampleSize / 20, 1);
        const consistencyScore = performance.consistency;

        return (sampleSizeScore * 0.4 + consistencyScore * 0.6);
    }

    /**
     * Calculate average performance across all data
     */
    private calculateAveragePerformance(data: ContentPerformance[]): number {
        const scores = data.map(d => this.calculatePerformanceScore(d.metrics));
        return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }

    /**
     * Find alternative times near the optimal time
     */
    private findAlternativeTimes(
        timeSlotPerformance: Record<string, { avgScore: number; sampleSize: number; consistency: number }>,
        targetDay: number,
        targetHour: number
    ): Array<{ dayOfWeek: number; hourOfDay: number; expectedPerformance: number }> {
        const alternatives: Array<{ dayOfWeek: number; hourOfDay: number; expectedPerformance: number }> = [];

        // Look at nearby time slots
        for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
            for (let hourOffset = -2; hourOffset <= 2; hourOffset++) {
                if (dayOffset === 0 && hourOffset === 0) continue;

                const day = (targetDay + dayOffset + 7) % 7;
                const hour = (targetHour + hourOffset + 24) % 24;
                const key = `${day}-${hour}`;

                if (timeSlotPerformance[key]) {
                    alternatives.push({
                        dayOfWeek: day,
                        hourOfDay: hour,
                        expectedPerformance: timeSlotPerformance[key].avgScore,
                    });
                }
            }
        }

        // Sort by performance
        return alternatives
            .sort((a, b) => b.expectedPerformance - a.expectedPerformance)
            .slice(0, 3);
    }

    /**
     * Determine optimal posting frequency
     */
    private determineOptimalFrequency(
        data: ContentPerformance[],
        patterns: HistoricalPattern[]
    ): { postsPerWeek: number; postsPerMonth: number } {
        // Calculate current frequency
        const timeSpan = this.calculateTimeSpan(data);
        const currentFrequency = data.length / (timeSpan / 7); // posts per week

        // Analyze engagement vs frequency
        const optimalWeekly = Math.max(3, Math.min(7, Math.round(currentFrequency * 1.2)));

        return {
            postsPerWeek: optimalWeekly,
            postsPerMonth: optimalWeekly * 4,
        };
    }

    /**
     * Determine content mix
     */
    private determineContentMix(
        data: ContentPerformance[],
        agentProfile: AgentProfile
    ): Array<{ contentType: string; percentage: number; frequency: string }> {
        // Count content types
        const typeCounts: Record<string, number> = {};
        const typePerformance: Record<string, number[]> = {};

        for (const item of data) {
            typeCounts[item.contentType] = (typeCounts[item.contentType] || 0) + 1;

            if (!typePerformance[item.contentType]) {
                typePerformance[item.contentType] = [];
            }
            typePerformance[item.contentType].push(
                this.calculatePerformanceScore(item.metrics)
            );
        }

        // Calculate mix based on performance
        const mix: Array<{ contentType: string; percentage: number; frequency: string }> = [];
        const total = data.length;

        for (const [type, count] of Object.entries(typeCounts)) {
            const avgPerformance = typePerformance[type].reduce((sum, s) => sum + s, 0) / typePerformance[type].length;
            const currentPercentage = (count / total) * 100;

            // Adjust percentage based on performance
            let recommendedPercentage = currentPercentage;
            if (avgPerformance > this.calculateAveragePerformance(data)) {
                recommendedPercentage = Math.min(50, currentPercentage * 1.2);
            }

            mix.push({
                contentType: type,
                percentage: Math.round(recommendedPercentage),
                frequency: this.determineTypeFrequency(recommendedPercentage),
            });
        }

        // Normalize percentages
        const totalPercentage = mix.reduce((sum, m) => sum + m.percentage, 0);
        mix.forEach(m => {
            m.percentage = Math.round((m.percentage / totalPercentage) * 100);
        });

        return mix;
    }

    /**
     * Generate optimal schedule
     */
    private generateOptimalSchedule(
        data: ContentPerformance[],
        patterns: HistoricalPattern[],
        frequency: { postsPerWeek: number; postsPerMonth: number },
        contentMix: Array<{ contentType: string; percentage: number; frequency: string }>
    ): Array<{ dayOfWeek: number; hourOfDay: number; contentType: string; priority: number }> {
        const schedule: Array<{ dayOfWeek: number; hourOfDay: number; contentType: string; priority: number }> = [];

        // Find best performing time slots
        const timeSlotPerformance = this.analyzeTimeSlotPerformance(data);
        const sortedSlots = Object.entries(timeSlotPerformance)
            .sort((a, b) => b[1].avgScore - a[1].avgScore)
            .slice(0, frequency.postsPerWeek);

        // Assign content types to time slots
        let contentTypeIndex = 0;
        for (let i = 0; i < sortedSlots.length; i++) {
            const [timeSlot, performance] = sortedSlots[i];
            const [dayOfWeek, hourOfDay] = timeSlot.split('-').map(Number);

            // Rotate through content types based on mix
            const contentType = contentMix[contentTypeIndex % contentMix.length].contentType;
            contentTypeIndex++;

            schedule.push({
                dayOfWeek,
                hourOfDay,
                contentType,
                priority: sortedSlots.length - i, // Higher priority for better slots
            });
        }

        return schedule.sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
            return a.hourOfDay - b.hourOfDay;
        });
    }

    /**
     * Calculate expected outcomes
     */
    private calculateExpectedOutcomes(
        data: ContentPerformance[],
        schedule: Array<{ dayOfWeek: number; hourOfDay: number; contentType: string; priority: number }>
    ): { engagementIncrease: number; reachIncrease: number; consistencyScore: number } {
        const currentAvg = this.calculateAveragePerformance(data);

        // Estimate improvement based on schedule optimization
        const timeSlotPerformance = this.analyzeTimeSlotPerformance(data);
        const scheduledPerformance = schedule.map(s => {
            const key = `${s.dayOfWeek}-${s.hourOfDay}`;
            return timeSlotPerformance[key]?.avgScore || currentAvg;
        });

        const avgScheduledPerformance = scheduledPerformance.reduce((sum, s) => sum + s, 0) / scheduledPerformance.length;
        const engagementIncrease = ((avgScheduledPerformance - currentAvg) / currentAvg) * 100;

        return {
            engagementIncrease: Math.max(0, Math.round(engagementIncrease)),
            reachIncrease: Math.max(0, Math.round(engagementIncrease * 0.8)),
            consistencyScore: 0.85, // High consistency with scheduled approach
        };
    }

    /**
     * Calculate strategy confidence
     */
    private calculateStrategyConfidence(
        dataSize: number,
        patterns: HistoricalPattern[]
    ): number {
        const dataSizeScore = Math.min(dataSize / 50, 1);
        const patternScore = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
            : 0.5;

        return (dataSizeScore * 0.6 + patternScore * 0.4);
    }

    /**
     * Detect time-of-day pattern
     */
    private detectTimeOfDayPattern(data: ContentPerformance[]): HistoricalPattern | null {
        const hourPerformance: Record<number, number[]> = {};

        for (const item of data) {
            if (!hourPerformance[item.hourOfDay]) {
                hourPerformance[item.hourOfDay] = [];
            }
            hourPerformance[item.hourOfDay].push(
                this.calculatePerformanceScore(item.metrics)
            );
        }

        // Find best performing hours
        const hourAvgs = Object.entries(hourPerformance).map(([hour, scores]) => ({
            hour: Number(hour),
            avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            count: scores.length,
        }));

        if (hourAvgs.length < 3) return null;

        const bestHours = hourAvgs
            .filter(h => h.count >= this.config.minSampleSize)
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 3);

        if (bestHours.length === 0) return null;

        const avgPerformance = hourAvgs.reduce((sum, h) => sum + h.avg, 0) / hourAvgs.length;
        const bestAvg = bestHours[0].avg;
        const strength = (bestAvg - avgPerformance) / avgPerformance;

        return {
            id: this.generatePatternId(),
            type: 'time-of-day',
            description: `Best performance during hours: ${bestHours.map(h => h.hour).join(', ')}`,
            strength: Math.min(1, strength),
            confidence: this.calculatePatternConfidence(bestHours[0].count),
            supportingData: {
                sampleSize: bestHours[0].count,
                averagePerformance: bestAvg,
                standardDeviation: this.calculateStandardDeviation(
                    hourPerformance[bestHours[0].hour]
                ),
                consistency: 0.8,
            },
            detectedAt: new Date().toISOString(),
        };
    }

    /**
     * Detect day-of-week pattern
     */
    private detectDayOfWeekPattern(data: ContentPerformance[]): HistoricalPattern | null {
        const dayPerformance: Record<number, number[]> = {};

        for (const item of data) {
            if (!dayPerformance[item.dayOfWeek]) {
                dayPerformance[item.dayOfWeek] = [];
            }
            dayPerformance[item.dayOfWeek].push(
                this.calculatePerformanceScore(item.metrics)
            );
        }

        const dayAvgs = Object.entries(dayPerformance).map(([day, scores]) => ({
            day: Number(day),
            avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            count: scores.length,
        }));

        if (dayAvgs.length < 3) return null;

        const bestDays = dayAvgs
            .filter(d => d.count >= this.config.minSampleSize)
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 3);

        if (bestDays.length === 0) return null;

        const avgPerformance = dayAvgs.reduce((sum, d) => sum + d.avg, 0) / dayAvgs.length;
        const bestAvg = bestDays[0].avg;
        const strength = (bestAvg - avgPerformance) / avgPerformance;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return {
            id: this.generatePatternId(),
            type: 'day-of-week',
            description: `Best performance on: ${bestDays.map(d => dayNames[d.day]).join(', ')}`,
            strength: Math.min(1, strength),
            confidence: this.calculatePatternConfidence(bestDays[0].count),
            supportingData: {
                sampleSize: bestDays[0].count,
                averagePerformance: bestAvg,
                standardDeviation: this.calculateStandardDeviation(
                    dayPerformance[bestDays[0].day]
                ),
                consistency: 0.8,
            },
            detectedAt: new Date().toISOString(),
        };
    }

    /**
     * Detect content-type pattern
     */
    private detectContentTypePattern(data: ContentPerformance[]): HistoricalPattern | null {
        const typePerformance: Record<string, number[]> = {};

        for (const item of data) {
            if (!typePerformance[item.contentType]) {
                typePerformance[item.contentType] = [];
            }
            typePerformance[item.contentType].push(
                this.calculatePerformanceScore(item.metrics)
            );
        }

        const typeAvgs = Object.entries(typePerformance).map(([type, scores]) => ({
            type,
            avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            count: scores.length,
        }));

        if (typeAvgs.length < 2) return null;

        const bestType = typeAvgs
            .filter(t => t.count >= this.config.minSampleSize)
            .sort((a, b) => b.avg - a.avg)[0];

        if (!bestType) return null;

        const avgPerformance = typeAvgs.reduce((sum, t) => sum + t.avg, 0) / typeAvgs.length;
        const strength = (bestType.avg - avgPerformance) / avgPerformance;

        return {
            id: this.generatePatternId(),
            type: 'content-type',
            description: `${bestType.type} performs best`,
            strength: Math.min(1, strength),
            confidence: this.calculatePatternConfidence(bestType.count),
            supportingData: {
                sampleSize: bestType.count,
                averagePerformance: bestType.avg,
                standardDeviation: this.calculateStandardDeviation(
                    typePerformance[bestType.type]
                ),
                consistency: 0.8,
            },
            detectedAt: new Date().toISOString(),
        };
    }

    /**
     * Detect topic pattern
     */
    private detectTopicPattern(data: ContentPerformance[]): HistoricalPattern | null {
        const topicPerformance: Record<string, number[]> = {};

        for (const item of data) {
            for (const topic of item.topics) {
                if (!topicPerformance[topic]) {
                    topicPerformance[topic] = [];
                }
                topicPerformance[topic].push(
                    this.calculatePerformanceScore(item.metrics)
                );
            }
        }

        const topicAvgs = Object.entries(topicPerformance).map(([topic, scores]) => ({
            topic,
            avg: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            count: scores.length,
        }));

        if (topicAvgs.length < 2) return null;

        const bestTopic = topicAvgs
            .filter(t => t.count >= this.config.minSampleSize)
            .sort((a, b) => b.avg - a.avg)[0];

        if (!bestTopic) return null;

        const avgPerformance = topicAvgs.reduce((sum, t) => sum + t.avg, 0) / topicAvgs.length;
        const strength = (bestTopic.avg - avgPerformance) / avgPerformance;

        return {
            id: this.generatePatternId(),
            type: 'topic',
            description: `Topic "${bestTopic.topic}" performs best`,
            strength: Math.min(1, strength),
            confidence: this.calculatePatternConfidence(bestTopic.count),
            supportingData: {
                sampleSize: bestTopic.count,
                averagePerformance: bestTopic.avg,
                standardDeviation: this.calculateStandardDeviation(
                    topicPerformance[bestTopic.topic]
                ),
                consistency: 0.8,
            },
            detectedAt: new Date().toISOString(),
        };
    }

    /**
     * Create prioritized recommendation
     */
    private createPrioritizedRecommendation(
        rec: any,
        agentProfile: AgentProfile
    ): PrioritizedRecommendation {
        let type: PrioritizedRecommendation['type'];
        let title: string;
        let description: string;
        let impact: number;
        let feasibility: number;
        let confidence: number;
        let actionItems: string[];
        let expectedResults: string[];
        let timeToImplement: string;
        let resourcesNeeded: string[];

        if ('dayOfWeek' in rec && 'hourOfDay' in rec) {
            // Timing recommendation
            type = 'timing';
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            title = `Optimal Posting Time for ${rec.contentType}`;
            description = `Post ${rec.contentType} on ${dayNames[rec.dayOfWeek]} at ${rec.hourOfDay}:00 for best results`;
            impact = Math.min(1, rec.expectedImprovement + 0.3);
            feasibility = 0.9; // Easy to implement
            confidence = rec.confidence;
            actionItems = [
                `Schedule ${rec.contentType} posts for ${dayNames[rec.dayOfWeek]} at ${rec.hourOfDay}:00`,
                'Monitor performance for 2-4 weeks',
                'Adjust timing based on results',
            ];
            expectedResults = [
                `${Math.round(rec.expectedImprovement * 100)}% improvement in engagement`,
                'More consistent audience reach',
                'Better content visibility',
            ];
            timeToImplement = 'Immediate';
            resourcesNeeded = ['Scheduling tool or calendar'];
        } else if ('schedule' in rec) {
            // Scheduling strategy
            type = 'scheduling';
            title = 'Optimized Content Schedule';
            description = rec.description;
            impact = Math.min(1, rec.expectedOutcomes.engagementIncrease / 100 + 0.4);
            feasibility = 0.7; // Requires more planning
            confidence = rec.confidence;
            actionItems = [
                `Post ${rec.frequency.postsPerWeek} times per week`,
                'Follow recommended content mix',
                'Use optimal time slots from schedule',
                'Track performance metrics',
            ];
            expectedResults = [
                `${rec.expectedOutcomes.engagementIncrease}% increase in engagement`,
                `${rec.expectedOutcomes.reachIncrease}% increase in reach`,
                'More consistent posting rhythm',
            ];
            timeToImplement = '1-2 weeks';
            resourcesNeeded = ['Content calendar', 'Scheduling tool', 'Content library'];
        } else {
            // Generic recommendation
            type = 'strategy';
            title = 'Content Strategy Recommendation';
            description = 'Optimize your content strategy based on historical data';
            impact = 0.6;
            feasibility = 0.7;
            confidence = 0.7;
            actionItems = ['Review recommendation details', 'Plan implementation'];
            expectedResults = ['Improved content performance'];
            timeToImplement = '1-2 weeks';
            resourcesNeeded = ['Time and planning'];
        }

        // Calculate priority score
        const priority = (
            impact * this.config.impactWeight +
            feasibility * this.config.feasibilityWeight +
            confidence * this.config.confidenceWeight
        );

        return {
            id: this.generateRecommendationId(),
            type,
            title,
            description,
            priority,
            impact,
            feasibility,
            confidence,
            actionItems,
            expectedResults,
            timeToImplement,
            resourcesNeeded,
            data: rec,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generate default strategy when insufficient data
     */
    private generateDefaultStrategy(agentProfile: AgentProfile): SchedulingStrategy {
        return {
            id: this.generateStrategyId(),
            name: 'Starter Posting Strategy',
            description: 'Recommended starting strategy based on industry best practices',
            frequency: {
                postsPerWeek: 3,
                postsPerMonth: 12,
            },
            contentMix: [
                { contentType: 'blog-post', percentage: 40, frequency: '1-2 per week' },
                { contentType: 'social-media', percentage: 40, frequency: '1-2 per week' },
                { contentType: 'market-update', percentage: 20, frequency: '1 per week' },
            ],
            schedule: [
                { dayOfWeek: 2, hourOfDay: 9, contentType: 'blog-post', priority: 3 },
                { dayOfWeek: 4, hourOfDay: 14, contentType: 'social-media', priority: 2 },
                { dayOfWeek: 6, hourOfDay: 10, contentType: 'market-update', priority: 1 },
            ],
            expectedOutcomes: {
                engagementIncrease: 15,
                reachIncrease: 12,
                consistencyScore: 0.8,
            },
            confidence: 0.5,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Helper: Calculate standard deviation
     */
    private calculateStandardDeviation(values: number[]): number {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Helper: Calculate time span in days
     */
    private calculateTimeSpan(data: ContentPerformance[]): number {
        if (data.length === 0) return 0;

        const timestamps = data.map(d => new Date(d.publishedAt).getTime());
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);

        return (max - min) / (1000 * 60 * 60 * 24); // Convert to days
    }

    /**
     * Helper: Determine type frequency
     */
    private determineTypeFrequency(percentage: number): string {
        if (percentage >= 40) return '2-3 per week';
        if (percentage >= 25) return '1-2 per week';
        if (percentage >= 15) return '1 per week';
        return '2-3 per month';
    }

    /**
     * Helper: Calculate pattern confidence
     */
    private calculatePatternConfidence(sampleSize: number): number {
        return Math.min(sampleSize / 20, 1);
    }

    /**
     * Helper: Generate strategy description
     */
    private generateStrategyDescription(
        frequency: { postsPerWeek: number; postsPerMonth: number },
        contentMix: Array<{ contentType: string; percentage: number; frequency: string }>
    ): string {
        const topTypes = contentMix
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 2)
            .map(m => m.contentType)
            .join(' and ');

        return `Post ${frequency.postsPerWeek} times per week, focusing on ${topTypes} for optimal engagement`;
    }

    /**
     * Helper: Generate unique IDs
     */
    private generateRecommendationId(): string {
        return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateStrategyId(): string {
        return `strategy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generatePatternId(): string {
        return `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Create a RecommendationEngine instance with default configuration
 */
export function createRecommendationEngine(
    config?: Partial<RecommendationEngineConfig>
): RecommendationEngine {
    return new RecommendationEngine(config);
}
