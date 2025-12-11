/**
 * DynamoDB Module
 * 
 * Central export point for all DynamoDB-related functionality.
 * 
 * @performance Exports are organized by domain to enable tree-shaking
 * @architecture Follows hub-based organization matching the app structure
 */

// Client
export {
  getDynamoDBClient,
  getDocumentClient,
  resetClients,
  getTableName,
} from './client';

// Repository
export {
  DynamoDBRepository,
  getRepository,
  resetRepository,
} from './repository';

// Types
export type {
  EntityType,
  DynamoDBItem,
  DynamoDBKey,
  QueryOptions,
  QueryResult,
  BatchResult,
  UpdateOptions,
} from './types';

// Admin Role Management Types
export type {
  UserRole,
  UserProfile,
  RoleAuditLog,
} from './admin-types';

/**
 * Key generation functions organized by business domain
 * Only exports functions that actually exist in keys.ts
 */
export {
  // Core user and profile keys
  getUserProfileKeys,
  getProfileKeys,
  getAgentProfileKeys,
  getAgentProfileKeysV2,

  // Content and business keys
  getReviewKeys,
  getBrandAuditKeys,
  getCompetitorKeys,
  getResearchReportKeys,
  getProjectKeys,
  getSavedContentKeys,
  getTrainingProgressKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getOAuthTokenKeys,
  getImageMetadataKeys,
  getEditRecordKeys,
  getLoginSessionKeys,
  getCitationKeys,
  getConversationKeys,
  getWorkflowExecutionKeys,

  // Listing and MLS keys
  getListingKeys,
  getMLSConnectionKeys,
  getSocialConnectionKeys,
  getSocialPostKeys,
  getPerformanceMetricsKeys,

  // Market intelligence keys
  getAlertKeys,
  getAlertSettingsKeys,
  getNeighborhoodProfileKeys,
  getLifeEventKeys,
  getProspectKeys,
  getTrackedCompetitorKeys,
  getListingEventKeys,
  getTrendIndicatorsKeys,
  getTargetAreaKeys,
  getPriceHistoryKeys,
  getListingSnapshotKeys,

  // Mobile and notification keys
  getNotificationPreferencesKeys,
  getPushTokenKeys,
  getSyncOperationKeys,
  getMarketStatsKeys,
  getOpenHouseSessionKeys,
  getMeetingPrepKeys,
  getPropertyComparisonKeys,

  // Content workflow keys
  getScheduledContentKeys,
  getAnalyticsKeys,
  getABTestKeys,
  getTemplateKeys,
  getSharedTemplateKeys,
  getROIKeys,
  getOptimalTimesKeys,

  // Utility functions
  getUserItemPrefix,
  extractUserIdFromPK,
  extractEntityIdFromSK,
} from './keys';

// Additional key functions from extra-keys.ts (non-conflicting)
export {
  getAnnouncementKeys as getTeamAnnouncementKeys,
  getClientDashboardKeys,
  getSecuredLinkKeys,
  getDashboardAnalyticsKeys,
  getCMAReportKeys,
  getDashboardDocumentKeys,
  getDocumentDownloadLogKeys,
} from './extra-keys';

// Error handling
export {
  DynamoDBError,
  ItemNotFoundError,
  ConditionalCheckFailedError,
  ThroughputExceededError,
  ValidationError,
  isRetryableError,
  wrapDynamoDBError,
} from './errors';

// Retry utilities
export {
  withRetry,
  withBatchRetry,
  type RetryOptions,
} from './retry';

// OAuth Token Management
export {
  storeOAuthTokens,
  getOAuthTokens,
  updateOAuthTokens,
  deleteOAuthTokens,
  areTokensExpired,
  refreshOAuthTokens,
  getValidOAuthTokens,
  type OAuthTokenData,
} from './oauth-tokens';

// React Hooks (lazy-loaded to avoid SSR issues)
export {
  useItem,
  useQuery,
  type UseItemResult,
  type UseItemOptions,
  type UseQueryResult,
  type UseQueryConfig,
  type WithIdItem,
  type WithIdQuery,
  getCache,
  resetCache,
} from './hooks';

// Key Builder (performance-optimized)
export { KeyBuilder } from './key-builder';

// Agent Profile Repository (Kiro AI Assistant)
export {
  AgentProfileRepository,
  getAgentProfileRepository,
  resetAgentProfileRepository,
  type AgentProfile,
  type CreateAgentProfileInput,
  type UpdateAgentProfileInput,
  type ValidationError as AgentProfileValidationError,
  type PerformanceMetrics,
} from './agent-profile-repository';

// Testimonial Request Repository
export {
  createTestimonialRequest,
  getTestimonialRequest,
  getTestimonialRequestByToken,
  updateTestimonialRequest,
  updateTestimonialRequestStatus,
  deleteTestimonialRequest,
  queryTestimonialRequests,
  queryPendingRequestsOlderThan,
  checkAndUpdateExpiredRequest,
} from './testimonial-request-repository';

// Keyword Repository
export {
  KeywordRepository,
  keywordRepository,
} from './keyword-repository';

// SEO Repository
export {
  SEORepository,
  seoRepository,
  type SEOAnalysis as SEOAnalysisType,
} from './seo-repository';

// Core key generators for common patterns
const createUserEntityKeysInternal = (userId: string, entityType: string, entityId: string) => ({
  PK: `USER#${userId}`,
  SK: `${entityType}#${entityId}`,
});

// Testimonial and SEO key generators using the common pattern
export const getTestimonialRequestKeys = (userId: string, requestId: string) =>
  createUserEntityKeys(userId, 'TESTIMONIAL_REQUEST', requestId);

export const getSavedKeywordKeys = (userId: string, keywordId: string) =>
  createUserEntityKeys(userId, 'SAVED_KEYWORD', keywordId);

export const getSEOAnalysisKeys = (userId: string, analysisId: string) =>
  createUserEntityKeys(userId, 'SEO_ANALYSIS', analysisId);

// Stub functions for missing admin and advanced features
export const getAnalyticsEventKeys = (date: string, eventId: string, timestamp: number, userId?: string) => ({
  PK: `ANALYTICS#${date}`,
  SK: `EVENT#${timestamp}#${eventId}`,
  ...(userId && { GSI1PK: `USER#${userId}`, GSI1SK: `EVENT#${timestamp}` }),
});

export const getAggregatedMetricsKeys = (date: string) => ({
  PK: `METRICS#${date}`,
  SK: 'DAILY',
});

export const getSupportTicketKeys = (ticketId: string, status?: string, priority?: string, createdAt?: number) => ({
  PK: `TICKET#${ticketId}`,
  SK: 'METADATA',
  ...(status && priority && createdAt && { GSI1PK: `TICKETS#${status}`, GSI1SK: `${priority}#${createdAt}` }),
});

export const getTicketMessageKeys = (ticketId: string, messageId: string, timestamp: number) => ({
  PK: `TICKET#${ticketId}`,
  SK: `MESSAGE#${timestamp}#${messageId}`,
});

export const getFeedbackKeys = (feedbackId: string, createdAt?: number) => ({
  PK: `FEEDBACK#${feedbackId}`,
  SK: 'METADATA',
  ...(createdAt && { GSI1PK: 'FEEDBACK#ALL', GSI1SK: `${createdAt}` }),
});

export const getFeatureFlagKeys = (flagId: string) => ({
  PK: 'CONFIG#FEATURE_FLAGS',
  SK: `FLAG#${flagId}`,
});

export const getPlatformSettingKeys = (category: string, key: string) => ({
  PK: 'CONFIG#SETTINGS',
  SK: `SETTING#${category}#${key}`,
});

export const getContentModerationKeys = (userId: string, contentId: string, status?: string, createdAt?: number) => ({
  PK: `USER#${userId}`,
  SK: `CONTENT#${contentId}`,
  ...(status && createdAt && { GSI1PK: `MODERATION#${status}`, GSI1SK: createdAt.toString() }),
});

export const getAdminAuditLogKeys = (date: string, auditId: string, timestamp: number, adminId?: string, actionType?: string) => ({
  PK: `AUDIT#${date}`,
  SK: `${timestamp}#${auditId}`,
  TTL: Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60),
  ...(adminId && { GSI1PK: `AUDIT#${adminId}`, GSI1SK: timestamp.toString() }),
  ...(actionType && { GSI2PK: `AUDIT#${actionType}`, GSI2SK: timestamp.toString() }),
});

export const getABTestConfigKeys = (testId: string) => ({
  PK: 'CONFIG#AB_TESTS',
  SK: `TEST#${testId}`,
});

export const getABTestAssignmentKeys = (userId: string, testId: string) => ({
  PK: `USER#${userId}`,
  SK: `AB_TEST#${testId}`,
});

export const getMaintenanceWindowKeys = (windowId: string, status?: string, startTime?: number) => ({
  PK: 'CONFIG#MAINTENANCE',
  SK: `WINDOW#${windowId}`,
  ...(status && startTime && { GSI1PK: `MAINTENANCE#${status}`, GSI1SK: startTime.toString() }),
});

export const getAPIKeyKeys = (keyId: string, hashedKey?: string) => ({
  PK: 'CONFIG#API_KEYS',
  SK: `KEY#${keyId}`,
  ...(hashedKey && { GSI1PK: `API_KEY#${hashedKey}`, GSI1SK: 'METADATA' }),
});

export const getUserFeedbackKeys = (userId: string, feedbackId: string, category?: string, timestamp?: number) => ({
  PK: `USER#${userId}`,
  SK: `FEEDBACK#${feedbackId}`,
  ...(category && timestamp && { GSI1PK: `FEEDBACK#${category}`, GSI1SK: timestamp.toString() }),
});

export const getUserActivitySummaryKeys = (userId: string, activityLevel?: 'active' | 'inactive' | 'dormant', lastLogin?: number) => ({
  PK: `USER_ACTIVITY#${userId}`,
  SK: 'SUMMARY',
  ...(activityLevel && lastLogin && { GSI1PK: `ACTIVITY_LEVEL#${activityLevel}`, GSI1SK: lastLogin.toString() }),
});

export const getUserActivityIndexKeys = (userId: string) => ({
  PK: 'USER_ACTIVITY_INDEX',
  SK: userId,
});

export const getEmailNotificationKeys = (notificationId: string, type?: string, timestamp?: number) => ({
  PK: `EMAIL_NOTIFICATION#${notificationId}`,
  SK: 'METADATA',
  ...(timestamp && { GSI1PK: 'EMAIL_NOTIFICATIONS', GSI1SK: timestamp.toString() }),
  ...(type && timestamp && { GSI2PK: `EMAIL_NOTIFICATION#${type}`, GSI2SK: timestamp.toString() }),
});

export const generateAdminKeys = {
  emailNotification: (notificationId: string) => ({
    PK: `EMAIL_NOTIFICATION#${notificationId}`,
    SK: 'METADATA',
  }),
  emailNotificationList: () => ({
    PK: 'EMAIL_NOTIFICATIONS',
    SK: '',
  }),
};

export const getWorkflowInstanceKeys = (userId: string, instanceId: string, status?: string, lastActiveAt?: string) => ({
  PK: `USER#${userId}`,
  SK: `WORKFLOW_INSTANCE#${instanceId}`,
  ...(status && lastActiveAt && { GSI1PK: `USER#${userId}`, GSI1SK: `STATUS#${status}#${lastActiveAt}` }),
});

export const getOnboardingStateKeys = (userId: string, isComplete?: boolean, lastAccessedAt?: string) => ({
  PK: `USER#${userId}`,
  SK: 'ONBOARDING#STATE',
  ...(isComplete === false && lastAccessedAt && { GSI1PK: 'ONBOARDING#INCOMPLETE', GSI1SK: lastAccessedAt }),
});

export const getOnboardingAnalyticsKeys = (userId: string, eventId: string, timestamp: string, eventType?: string) => ({
  PK: `USER#${userId}`,
  SK: `ONBOARDING#ANALYTICS#${timestamp}#${eventId}`,
  ...(eventType && { GSI1PK: `ANALYTICS#ONBOARDING#${eventType}`, GSI1SK: timestamp }),
});

// createUserEntityKeys is already defined above and used by the testimonial functions

export const createTimestampedKeys = (prefix: string, identifier: string, timestamp: string | number, entityId?: string) => {
  const sk = entityId ? `${identifier}#${timestamp}#${entityId}` : `${identifier}#${timestamp}`;
  return { PK: prefix, SK: sk };
};

export const createGSIKeys = (baseKeys: any, gsiConfig: any) => ({ ...baseKeys, ...gsiConfig });

export const getAdminAnnouncementKeys = (announcementId: string, targetAudience: string, scheduledFor: number) => ({
  PK: `ANNOUNCEMENT#${targetAudience}`,
  SK: `${scheduledFor}#${announcementId}`,
  GSI1PK: `ANNOUNCEMENT#${announcementId}`,
  GSI1SK: 'METADATA',
});

// AEO and AI monitoring stubs
export const getAEOScoreKeys = (userId: string, timestamp: string, includeGSI?: boolean) => ({
  PK: `USER#${userId}`,
  SK: `AEO#SCORE#${timestamp}`,
  ...(includeGSI && { GSI1PK: 'AEO#SCORE', GSI1SK: timestamp }),
});

export const getAEOMentionKeys = (userId: string, mentionId: string, source?: string, timestamp?: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#MENTION#${mentionId}`,
  ...(source && timestamp && { GSI1PK: `AEO#MENTION#${source}`, GSI1SK: timestamp }),
});

export const getAEORecommendationKeys = (userId: string, recommendationId: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#RECOMMENDATION#${recommendationId}`,
});

export const getAEOAnalysisKeys = (userId: string, analysisId: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#ANALYSIS#${analysisId}`,
});

export const getAEOCompetitorScoreKeys = (userId: string, competitorId: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#COMPETITOR#${competitorId}#${timestamp}`,
});

export const getAIMentionKeys = (userId: string, mentionId: string, platform: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `AI_MENTION#${platform}#${timestamp}#${mentionId}`,
  GSI1PK: `USER#${userId}`,
  GSI1SK: `AI_MENTION_BY_DATE#${timestamp}`,
});

export const getAIVisibilityScoreKeys = (userId: string, calculatedAt: string, isLatest?: boolean) => ({
  PK: `USER#${userId}`,
  SK: `AI_VISIBILITY_SCORE#${calculatedAt}`,
  ...(isLatest && { GSI1PK: `USER#${userId}`, GSI1SK: 'AI_SCORE_LATEST' }),
});

export const getAIMonitoringConfigKeys = (userId: string) => ({
  PK: `USER#${userId}`,
  SK: 'AI_MONITORING_CONFIG',
});

export const getAIMonitoringJobKeys = (userId: string, jobId: string, startedAt: string) => ({
  PK: `USER#${userId}`,
  SK: `AI_MONITORING_JOB#${startedAt}#${jobId}`,
});

export const getAPIUsageRecordKeys = (userId: string, recordId: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `API_USAGE#${timestamp}#${recordId}`,
});

export const getUserBudgetKeys = (userId: string) => ({
  PK: `USER#${userId}`,
  SK: 'USER_BUDGET',
});

export const getCostSpikeAlertKeys = (userId: string, alertId: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `COST_SPIKE_ALERT#${timestamp}#${alertId}`,
});

export const getWebsiteAnalysisKeys = (userId: string, timestamp?: string) => ({
  PK: `USER#${userId}`,
  SK: timestamp ? `WEBSITE_ANALYSIS#${timestamp}` : 'WEBSITE_ANALYSIS#latest',
});

export const getRoleAuditKeys = (userId: string, auditId: string, timestamp: number) => ({
  PK: `USER#${userId}`,
  SK: `AUDIT#${timestamp}#${auditId}`,
  GSI1PK: 'AUDIT#ROLE_CHANGE',
  GSI1SK: timestamp.toString(),
});

export const getRoleAuditQueryKeys = () => ({
  GSI1PK: 'AUDIT#ROLE_CHANGE',
});

export const getUsersByRoleQueryKeys = (role: string) => ({
  GSI1PK: `ROLE#${role}`,
});

// Mobile and open house stubs
export const getSequenceEnrollmentKeys = (userId: string, enrollmentId: string, sequenceId?: string, visitorId?: string) => ({
  PK: `USER#${userId}`,
  SK: `ENROLLMENT#${enrollmentId}`,
  ...(sequenceId && { GSI1PK: `SEQUENCE#${sequenceId}` }),
  ...(visitorId && { GSI1SK: `VISITOR#${visitorId}`, GSI2PK: `VISITOR#${visitorId}`, GSI2SK: `ENROLLMENT#${enrollmentId}` }),
});

export const getOfflineSyncKeys = (userId: string, operationId: string) => ({
  PK: `USER#${userId}`,
  SK: `OFFLINE_SYNC#${operationId}`,
});

export const getPropertyShareKeys = (userId: string, shareId: string) => ({
  PK: `USER#${userId}`,
  SK: `SHARE#${shareId}`,
});

export const getMobileCaptureKeys = (userId: string, captureId: string) => ({
  PK: `USER#${userId}`,
  SK: `CAPTURE#${captureId}`,
});

export const getQuickActionKeys = (userId: string, actionId: string) => ({
  PK: `USER#${userId}`,
  SK: `QUICKACTION#${actionId}`,
});

export const getVoiceNoteKeys = (userId: string, noteId: string) => ({
  PK: `USER#${userId}`,
  SK: `VOICENOTE#${noteId}`,
});

export const getLocationCheckInKeys = (userId: string, checkInId: string) => ({
  PK: `USER#${userId}`,
  SK: `CHECKIN#${checkInId}`,
});

// Alias for backward compatibility
export const getTestimonialKeys = getTestimonialRequestKeys;

// Utility functions
export const extractEntityTypeFromSK = (sk: string): string => {
  const parts = sk.split('#');
  return parts[0] || '';
};

export const validateKeyPattern = (key: any): boolean => {
  return key && typeof key.PK === 'string' && typeof key.SK === 'string';
};