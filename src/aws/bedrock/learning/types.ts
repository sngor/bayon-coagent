/**
 * Learning & Feedback Types
 * 
 * Type definitions for the preference learning and feedback system.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

/**
 * User feedback record
 */
export interface FeedbackRecord {
    id: string;
    userId: string;
    taskId: string;
    strandId: string;
    feedbackType: 'rating' | 'edit' | 'engagement';
    rating?: number;
    edits?: EditRecord;
    engagement?: EngagementMetrics;
    timestamp: string;
    metadata: Record<string, any>;
}

/**
 * Edit tracking record
 */
export interface EditRecord {
    originalContent: string;
    editedContent: string;
    sectionsModified: string[];
    changeType: 'addition' | 'deletion' | 'modification';
    editDuration: number;
    timestamp: string;
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
    views: number;
    clicks: number;
    shares: number;
    conversions: number;
    timeOnPage?: number;
}

/**
 * User preferences learned from feedback
 */
export interface UserPreferences {
    userId: string;
    contentStyle: {
        tone: string;
        formality: number; // 0-1 scale
        length: 'concise' | 'moderate' | 'detailed';
    };
    topicPreferences: Record<string, number>; // topic -> preference score
    formatPreferences: Record<string, number>; // format -> preference score
    qualityThresholds: {
        minConfidence: number;
        requireCitations: boolean;
    };
    lastUpdated: string;
    version: number;
}

/**
 * Preference update event
 */
export interface PreferenceUpdate {
    userId: string;
    updateType: 'feedback' | 'explicit' | 'inferred';
    changes: Partial<UserPreferences>;
    confidence: number;
    timestamp: string;
}

/**
 * Feedback filters for querying
 */
export interface FeedbackFilters {
    userId?: string;
    strandId?: string;
    feedbackType?: FeedbackRecord['feedbackType'];
    startDate?: string;
    endDate?: string;
    minRating?: number;
    maxRating?: number;
}

/**
 * Preference learning configuration
 */
export interface PreferenceLearningConfig {
    /** Minimum feedback samples required before learning */
    minSamplesForLearning: number;
    /** Weight for recent feedback vs historical */
    recencyWeight: number;
    /** Confidence threshold for applying preferences */
    confidenceThreshold: number;
    /** Enable automatic preference updates */
    autoUpdate: boolean;
}
