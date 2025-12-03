/**
 * Preference Learning Engine
 * 
 * Learns user preferences from feedback and applies them to task execution.
 * Requirements: 2.3, 2.4
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type {
    FeedbackRecord,
    UserPreferences,
    PreferenceUpdate,
    PreferenceLearningConfig,
    FeedbackFilters,
} from './types';

/**
 * Default configuration for preference learning
 */
const DEFAULT_CONFIG: PreferenceLearningConfig = {
    minSamplesForLearning: 5,
    recencyWeight: 0.7,
    confidenceThreshold: 0.6,
    autoUpdate: true,
};

/**
 * PreferenceEngine learns from user feedback and applies preferences to tasks
 */
export class PreferenceEngine {
    private config: PreferenceLearningConfig;
    private repository = getRepository();

    constructor(config: Partial<PreferenceLearningConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Learns user preferences from feedback records
     * 
     * Analyzes feedback patterns to extract user preferences for:
     * - Content style (tone, formality, length)
     * - Topic preferences
     * - Format preferences
     * - Quality thresholds
     * 
     * Requirements: 2.3
     */
    async learnPreferences(
        userId: string,
        feedbackRecords: FeedbackRecord[]
    ): Promise<UserPreferences> {
        // Check if we have enough samples
        if (feedbackRecords.length < this.config.minSamplesForLearning) {
            // Return default preferences if insufficient data
            return this.getDefaultPreferences(userId);
        }

        // Separate feedback by type
        const ratings = feedbackRecords.filter(f => f.feedbackType === 'rating' && f.rating);
        const edits = feedbackRecords.filter(f => f.feedbackType === 'edit' && f.edits);
        const engagement = feedbackRecords.filter(f => f.feedbackType === 'engagement' && f.engagement);

        // Learn content style preferences
        const contentStyle = this.learnContentStyle(ratings, edits);

        // Learn topic preferences
        const topicPreferences = this.learnTopicPreferences(ratings, engagement);

        // Learn format preferences
        const formatPreferences = this.learnFormatPreferences(ratings, engagement);

        // Learn quality thresholds
        const qualityThresholds = this.learnQualityThresholds(ratings);

        const preferences: UserPreferences = {
            userId,
            contentStyle,
            topicPreferences,
            formatPreferences,
            qualityThresholds,
            lastUpdated: new Date().toISOString(),
            version: 1,
        };

        // Store preferences
        await this.storePreferences(preferences);

        return preferences;
    }

    /**
     * Applies learned preferences to a task
     * 
     * Modifies task parameters based on user preferences to improve output quality.
     * 
     * Requirements: 2.4
     */
    async applyPreferences<T extends Record<string, any>>(
        task: T,
        preferences: UserPreferences
    ): Promise<T> {
        const modifiedTask = { ...task } as any;

        // Apply content style preferences
        if (preferences.contentStyle) {
            modifiedTask.tone = preferences.contentStyle.tone;
            modifiedTask.formality = preferences.contentStyle.formality;
            modifiedTask.targetLength = preferences.contentStyle.length;
        }

        // Apply quality thresholds
        if (preferences.qualityThresholds) {
            modifiedTask.minConfidence = preferences.qualityThresholds.minConfidence;
            modifiedTask.requireCitations = preferences.qualityThresholds.requireCitations;
        }

        // Apply topic preferences if task has topic
        if (modifiedTask.topic && preferences.topicPreferences[modifiedTask.topic]) {
            modifiedTask.topicWeight = preferences.topicPreferences[modifiedTask.topic];
        }

        // Apply format preferences if task has format
        if (modifiedTask.format && preferences.formatPreferences[modifiedTask.format]) {
            modifiedTask.formatWeight = preferences.formatPreferences[modifiedTask.format];
        }

        return modifiedTask as T;
    }

    /**
     * Gets current preferences for a user
     * 
     * Retrieves stored preferences or returns defaults if none exist.
     */
    async getPreferences(userId: string): Promise<UserPreferences> {
        try {
            const item = await this.repository.getItem(
                `USER#${userId}`,
                'PREFERENCES'
            );

            if (item && item.Data) {
                return item.Data as UserPreferences;
            }
        } catch (error) {
            console.error('Error retrieving preferences:', error);
        }

        // Return default preferences if none found
        return this.getDefaultPreferences(userId);
    }

    /**
     * Updates preferences based on new feedback
     * 
     * Incrementally updates preferences without full relearning.
     * Uses exponential moving average for smooth updates.
     * 
     * Requirements: 2.3
     */
    async updatePreferences(
        userId: string,
        newFeedback: FeedbackRecord
    ): Promise<void> {
        if (!this.config.autoUpdate) {
            return;
        }

        const currentPreferences = await this.getPreferences(userId);

        // Calculate update based on feedback type
        const update = this.calculatePreferenceUpdate(newFeedback, currentPreferences);

        if (update.confidence < this.config.confidenceThreshold) {
            // Skip update if confidence is too low
            return;
        }

        // Apply incremental update
        const updatedPreferences = this.applyIncrementalUpdate(
            currentPreferences,
            update
        );

        // Store updated preferences
        await this.storePreferences(updatedPreferences);
    }

    /**
     * Learns content style from ratings and edits
     */
    private learnContentStyle(
        ratings: FeedbackRecord[],
        edits: FeedbackRecord[]
    ): UserPreferences['contentStyle'] {
        // Analyze highly rated content for style patterns
        const highRatedContent = ratings.filter(r => r.rating! >= 4);

        // Extract tone from metadata
        const tones = highRatedContent
            .map(r => r.metadata.tone)
            .filter(Boolean);
        const preferredTone = this.getMostFrequent(tones) || 'professional';

        // Calculate formality from ratings
        const formalityScores = highRatedContent
            .map(r => r.metadata.formality)
            .filter(n => typeof n === 'number');
        const avgFormality = formalityScores.length > 0
            ? formalityScores.reduce((a, b) => a + b, 0) / formalityScores.length
            : 0.5;

        // Analyze edit patterns for length preference
        const lengthPreference = this.analyzeLengthPreference(edits);

        return {
            tone: preferredTone,
            formality: avgFormality,
            length: lengthPreference,
        };
    }

    /**
     * Learns topic preferences from ratings and engagement
     */
    private learnTopicPreferences(
        ratings: FeedbackRecord[],
        engagement: FeedbackRecord[]
    ): Record<string, number> {
        const topicScores: Record<string, number[]> = {};

        // Collect ratings by topic
        for (const record of ratings) {
            const topic = record.metadata.topic;
            if (topic && record.rating) {
                if (!topicScores[topic]) {
                    topicScores[topic] = [];
                }
                topicScores[topic].push(record.rating / 5); // Normalize to 0-1
            }
        }

        // Add engagement scores
        for (const record of engagement) {
            const topic = record.metadata.topic;
            if (topic && record.engagement) {
                const engagementScore = this.calculateEngagementScore(record.engagement);
                if (!topicScores[topic]) {
                    topicScores[topic] = [];
                }
                topicScores[topic].push(engagementScore);
            }
        }

        // Calculate average scores
        const preferences: Record<string, number> = {};
        for (const [topic, scores] of Object.entries(topicScores)) {
            preferences[topic] = scores.reduce((a, b) => a + b, 0) / scores.length;
        }

        return preferences;
    }

    /**
     * Learns format preferences from ratings and engagement
     */
    private learnFormatPreferences(
        ratings: FeedbackRecord[],
        engagement: FeedbackRecord[]
    ): Record<string, number> {
        const formatScores: Record<string, number[]> = {};

        // Collect ratings by format
        for (const record of ratings) {
            const format = record.metadata.format;
            if (format && record.rating) {
                if (!formatScores[format]) {
                    formatScores[format] = [];
                }
                formatScores[format].push(record.rating / 5);
            }
        }

        // Add engagement scores
        for (const record of engagement) {
            const format = record.metadata.format;
            if (format && record.engagement) {
                const engagementScore = this.calculateEngagementScore(record.engagement);
                if (!formatScores[format]) {
                    formatScores[format] = [];
                }
                formatScores[format].push(engagementScore);
            }
        }

        // Calculate average scores
        const preferences: Record<string, number> = {};
        for (const [format, scores] of Object.entries(formatScores)) {
            preferences[format] = scores.reduce((a, b) => a + b, 0) / scores.length;
        }

        return preferences;
    }

    /**
     * Learns quality thresholds from ratings
     */
    private learnQualityThresholds(
        ratings: FeedbackRecord[]
    ): UserPreferences['qualityThresholds'] {
        // Find minimum acceptable rating
        const acceptableRatings = ratings.filter(r => r.rating! >= 3);
        const avgAcceptableConfidence = acceptableRatings
            .map(r => r.metadata.confidence)
            .filter(c => typeof c === 'number')
            .reduce((a, b, _, arr) => a + b / arr.length, 0);

        // Check if user prefers citations
        const withCitations = ratings.filter(r => r.metadata.hasCitations && r.rating! >= 4);
        const requireCitations = withCitations.length / ratings.length > 0.7;

        return {
            minConfidence: Math.max(0.5, avgAcceptableConfidence || 0.6),
            requireCitations,
        };
    }

    /**
     * Analyzes edit patterns to determine length preference
     */
    private analyzeLengthPreference(edits: FeedbackRecord[]): 'concise' | 'moderate' | 'detailed' {
        if (edits.length === 0) {
            return 'moderate';
        }

        let shorteningCount = 0;
        let lengtheningCount = 0;

        for (const edit of edits) {
            if (!edit.edits) continue;

            const originalLength = edit.edits.originalContent.length;
            const editedLength = edit.edits.editedContent.length;

            if (editedLength < originalLength * 0.8) {
                shorteningCount++;
            } else if (editedLength > originalLength * 1.2) {
                lengtheningCount++;
            }
        }

        if (shorteningCount > lengtheningCount * 1.5) {
            return 'concise';
        } else if (lengtheningCount > shorteningCount * 1.5) {
            return 'detailed';
        }

        return 'moderate';
    }

    /**
     * Calculates engagement score from metrics
     */
    private calculateEngagementScore(metrics: import('./types').EngagementMetrics): number {
        // Weighted engagement score
        const viewScore = Math.min(metrics.views / 100, 1) * 0.2;
        const clickScore = Math.min(metrics.clicks / 50, 1) * 0.3;
        const shareScore = Math.min(metrics.shares / 10, 1) * 0.3;
        const conversionScore = Math.min(metrics.conversions / 5, 1) * 0.2;

        return viewScore + clickScore + shareScore + conversionScore;
    }

    /**
     * Calculates preference update from new feedback
     */
    private calculatePreferenceUpdate(
        feedback: FeedbackRecord,
        current: UserPreferences
    ): PreferenceUpdate {
        const changes: Partial<UserPreferences> = {};
        let confidence = 0.5;

        if (feedback.feedbackType === 'rating' && feedback.rating) {
            // High ratings increase confidence
            confidence = feedback.rating / 5;

            // Update topic preference if available
            if (feedback.metadata.topic) {
                const currentScore = current.topicPreferences[feedback.metadata.topic] || 0.5;
                const newScore = currentScore * (1 - this.config.recencyWeight) +
                    (feedback.rating / 5) * this.config.recencyWeight;

                changes.topicPreferences = {
                    ...current.topicPreferences,
                    [feedback.metadata.topic]: newScore,
                };
            }
        }

        return {
            userId: feedback.userId,
            updateType: 'feedback',
            changes,
            confidence,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Applies incremental update to preferences
     */
    private applyIncrementalUpdate(
        current: UserPreferences,
        update: PreferenceUpdate
    ): UserPreferences {
        const updated = { ...current };

        // Apply changes with exponential moving average
        if (update.changes.topicPreferences) {
            updated.topicPreferences = {
                ...current.topicPreferences,
                ...update.changes.topicPreferences,
            };
        }

        if (update.changes.formatPreferences) {
            updated.formatPreferences = {
                ...current.formatPreferences,
                ...update.changes.formatPreferences,
            };
        }

        if (update.changes.contentStyle) {
            updated.contentStyle = {
                ...current.contentStyle,
                ...update.changes.contentStyle,
            };
        }

        updated.lastUpdated = update.timestamp;
        updated.version += 1;

        return updated;
    }

    /**
     * Stores preferences in DynamoDB
     */
    private async storePreferences(preferences: UserPreferences): Promise<void> {
        await this.repository.create(
            `USER#${preferences.userId}`,
            'PREFERENCES',
            'UserPreferences',
            preferences
        );
    }

    /**
     * Gets default preferences for a user
     */
    private getDefaultPreferences(userId: string): UserPreferences {
        return {
            userId,
            contentStyle: {
                tone: 'professional',
                formality: 0.7,
                length: 'moderate',
            },
            topicPreferences: {},
            formatPreferences: {},
            qualityThresholds: {
                minConfidence: 0.6,
                requireCitations: false,
            },
            lastUpdated: new Date().toISOString(),
            version: 0,
        };
    }

    /**
     * Gets most frequent value from array
     */
    private getMostFrequent<T>(arr: T[]): T | null {
        if (arr.length === 0) return null;

        const counts = new Map<T, number>();
        for (const item of arr) {
            counts.set(item, (counts.get(item) || 0) + 1);
        }

        let maxCount = 0;
        let mostFrequent: T | null = null;

        for (const [item, count] of counts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = item;
            }
        }

        return mostFrequent;
    }
}

/**
 * Singleton instance
 */
let preferenceEngineInstance: PreferenceEngine | null = null;

/**
 * Gets the singleton PreferenceEngine instance
 */
export function getPreferenceEngine(
    config?: Partial<PreferenceLearningConfig>
): PreferenceEngine {
    if (!preferenceEngineInstance) {
        preferenceEngineInstance = new PreferenceEngine(config);
    }
    return preferenceEngineInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetPreferenceEngine(): void {
    preferenceEngineInstance = null;
}
