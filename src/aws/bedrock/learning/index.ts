/**
 * Learning & Feedback Module
 * 
 * This module provides preference learning and feedback processing capabilities
 * for the AgentStrands system.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export {
    PreferenceEngine,
    getPreferenceEngine,
    resetPreferenceEngine,
} from './preference-engine';

export type {
    FeedbackRecord,
    EditRecord,
    EngagementMetrics,
    UserPreferences,
    PreferenceUpdate,
    FeedbackFilters,
    PreferenceLearningConfig,
} from './types';
