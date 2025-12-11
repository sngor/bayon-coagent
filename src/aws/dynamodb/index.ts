/**
 * DynamoDB Module
 * 
 * Central export point for all DynamoDB-related functionality.
 */

// Import statements removed - functions are exported directly from keys module

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

// Key generation functions - All exports from keys.ts
export {
  getUserProfileKeys,
  getProfileKeys,
  getAgentProfileKeys,
  getAgentProfileKeysV2,
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
  getUserItemPrefix,
  extractUserIdFromPK,
  extractEntityIdFromSK,
  extractEntityTypeFromSK,
  validateKeyPattern,
  getCitationKeys,
  getConversationKeys,
  getWorkflowExecutionKeys,
  getListingKeys,
  getMLSConnectionKeys,
  getSocialConnectionKeys,
  getSocialPostKeys,
  getPerformanceMetricsKeys,
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
  getNotificationPreferencesKeys,
  getPushTokenKeys,
  getSyncOperationKeys,
  getMarketStatsKeys,
  getOpenHouseSessionKeys,
  getMeetingPrepKeys,
  getPropertyComparisonKeys,
  getScheduledContentKeys,
  getAnalyticsKeys,
  getABTestKeys,
  getTemplateKeys,
  getSharedTemplateKeys,
  getROIKeys,
  getAnnouncementKeys,
  getOptimalTimesKeys,
  getAnalyticsEventKeys,
  getAggregatedMetricsKeys,
  getAPIKeyKeys,
  getAdminAuditLogKeys,
  getContentModerationKeys,
  generateAdminKeys,
  getFeedbackKeys,
  getMaintenanceWindowKeys,
  getFeatureFlagKeys,
  getPlatformSettingKeys,
  getSupportTicketKeys,
  getTicketMessageKeys,
  getUserActivitySummaryKeys,
  getUserActivityIndexKeys,
  getEmailNotificationKeys,
  getMobileCaptureKeys,
  getQuickActionKeys,
  getVoiceNoteKeys,
  getLocationCheckInKeys,
  getAEOScoreKeys,
  getAEOMentionKeys,
  getAEORecommendationKeys,
  getAEOAnalysisKeys,
  getAEOCompetitorScoreKeys,
  getAIMentionKeys,
  getAIVisibilityScoreKeys,
  getAIMonitoringConfigKeys,
  getAIMonitoringJobKeys,
  getAPIUsageRecordKeys,
  getUserBudgetKeys,
  getCostSpikeAlertKeys,
  getWebsiteAnalysisKeys,
  getRoleAuditKeys,
  getRoleAuditQueryKeys,
  getUsersByRoleQueryKeys,
  getABTestConfigKeys,
  getABTestAssignmentKeys,
  getUserFeedbackKeys,
  createUserEntityKeys,
  createTimestampedKeys,
  createGSIKeys,
  getUserClientDashboardKeys,
  getUserSecuredLinkKeys,
  getUserDashboardAnalyticsKeys,
  getUserCMAReportKeys,
  getUserDashboardDocumentKeys,
  getUserDocumentDownloadLogKeys,
  getOpenHouseKeys,
  getVisitorKeys,
  getFollowUpSequenceKeys,
  getFollowUpContentKeys,
  getSessionTemplateKeys,
  getWebhookConfigKeys,
  getWebhookDeliveryLogKeys,
  getSequenceEnrollmentKeys,
  getOfflineSyncKeys,
  getAdminAnnouncementKeys,
  getWorkflowInstanceKeys,
  getOnboardingStateKeys,
  getOnboardingAnalyticsKeys,
  getSavedKeywordKeys,
  getTestimonialRequestKeys,
  getTestimonialKeys,
  getSEOAnalysisKeys,
  getClientDashboardKeys,
  getSecuredLinkKeys,
  getDashboardAnalyticsKeys,
  getCMAReportKeys,
  getDashboardDocumentKeys,
  getDocumentDownloadLogKeys,
  getPropertyShareKeys,
} from './keys';

// Stub implementations for functions not yet implemented in keys.ts
// These provide basic key generation patterns to prevent build failures

// Admin and system key stubs
export const getAnnouncementKeys = (teamId: string, announcementId: string, timestamp: string) => ({
  PK: `TEAM#${teamId}`,
  SK: `ANNOUNCEMENT#${timestamp}#${announcementId}`,
});

export const getAnalyticsEventKeys = (date: string, eventId: string, timestamp: number) => ({
  PK: `ANALYTICS#${date}`,
  SK: `EVENT#${timestamp}#${eventId}`,
  TTL: Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60),
});

export const getAggregatedMetricsKeys = (date: string) => ({
  PK: `METRICS#${date}`,
  SK: 'DAILY',
});

export const getAPIKeyKeys = (keyId: string) => ({
  PK: 'CONFIG#API_KEYS',
  SK: `KEY#${keyId}`,
});

export const getAdminAuditLogKeys = (date: string, auditId: string, timestamp: number) => ({
  PK: `AUDIT#${date}`,
  SK: `${timestamp}#${auditId}`,
  TTL: Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60),
});

export const getContentModerationKeys = (userId: string, contentId: string) => ({
  PK: `USER#${userId}`,
  SK: `CONTENT#${contentId}`,
});

export const generateAdminKeys = {
  emailNotification: (notificationId: string) => ({
    PK: `EMAIL_NOTIFICATION#${notificationId}`,
    SK: 'METADATA',
  }),
};

export const getFeedbackKeys = (feedbackId: string) => ({
  PK: `FEEDBACK#${feedbackId}`,
  SK: 'METADATA',
});

export const getMaintenanceWindowKeys = (windowId: string) => ({
  PK: 'CONFIG#MAINTENANCE',
  SK: `WINDOW#${windowId}`,
});

export const getFeatureFlagKeys = (flagId: string) => ({
  PK: 'CONFIG#FEATURE_FLAGS',
  SK: `FLAG#${flagId}`,
});

export const getPlatformSettingKeys = (category: string, key: string) => ({
  PK: 'CONFIG#SETTINGS',
  SK: `SETTING#${category}#${key}`,
});

export const getSupportTicketKeys = (ticketId: string) => ({
  PK: `TICKET#${ticketId}`,
  SK: 'METADATA',
});

export const getTicketMessageKeys = (ticketId: string, messageId: string, timestamp: number) => ({
  PK: `TICKET#${ticketId}`,
  SK: `MESSAGE#${timestamp}#${messageId}`,
});

export const getUserActivitySummaryKeys = (userId: string) => ({
  PK: `USER_ACTIVITY#${userId}`,
  SK: 'SUMMARY',
});

export const getUserActivityIndexKeys = (userId: string) => ({
  PK: 'USER_ACTIVITY_INDEX',
  SK: userId,
});

export const getEmailNotificationKeys = (notificationId: string) => ({
  PK: `EMAIL_NOTIFICATION#${notificationId}`,
  SK: 'METADATA',
});

// Mobile and capture key stubs
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

// AEO key stubs
export const getAEOScoreKeys = (userId: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#SCORE#${timestamp}`,
});

export const getAEOMentionKeys = (userId: string, mentionId: string) => ({
  PK: `USER#${userId}`,
  SK: `AEO#MENTION#${mentionId}`,
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

// AI monitoring key stubs
export const getAIMentionKeys = (userId: string, mentionId: string, platform: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `AI_MENTION#${platform}#${timestamp}#${mentionId}`,
});

export const getAIVisibilityScoreKeys = (userId: string, calculatedAt: string) => ({
  PK: `USER#${userId}`,
  SK: `AI_VISIBILITY_SCORE#${calculatedAt}`,
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

// Role audit key stubs
export const getRoleAuditKeys = (userId: string, auditId: string, timestamp: number) => ({
  PK: `USER#${userId}`,
  SK: `AUDIT#${timestamp}#${auditId}`,
});

export const getRoleAuditQueryKeys = () => ({
  GSI1PK: 'AUDIT#ROLE_CHANGE',
});

export const getUsersByRoleQueryKeys = (role: string) => ({
  GSI1PK: `ROLE#${role}`,
});

// A/B test key stubs
export const getABTestConfigKeys = (testId: string) => ({
  PK: 'CONFIG#AB_TESTS',
  SK: `TEST#${testId}`,
});

export const getABTestAssignmentKeys = (userId: string, testId: string) => ({
  PK: `USER#${userId}`,
  SK: `AB_TEST#${testId}`,
});

export const getUserFeedbackKeys = (userId: string, feedbackId: string) => ({
  PK: `USER#${userId}`,
  SK: `FEEDBACK#${feedbackId}`,
});

// Factory function stubs
export const createUserEntityKeys = (userId: string, entityType: string, entityId: string) => ({
  PK: `USER#${userId}`,
  SK: `${entityType}#${entityId}`,
});

export const createTimestampedKeys = (prefix: string, identifier: string, timestamp: string | number, entityId?: string) => {
  const sk = entityId ? `${identifier}#${timestamp}#${entityId}` : `${identifier}#${timestamp}`;
  return { PK: prefix, SK: sk };
};

export const createGSIKeys = (baseKeys: any) => ({ ...baseKeys });

// Client dashboard key stubs (User versions)
export const getUserClientDashboardKeys = (userId: string, dashboardId: string) => ({
  PK: `USER#${userId}`,
  SK: `CLIENT_DASHBOARD#${dashboardId}`,
});

export const getUserSecuredLinkKeys = (token: string) => ({
  PK: `SECURE_LINK#${token}`,
  SK: 'METADATA',
});

export const getUserDashboardAnalyticsKeys = (dashboardId: string) => ({
  PK: `DASHBOARD#${dashboardId}`,
  SK: 'ANALYTICS',
});

export const getUserCMAReportKeys = (userId: string, reportId: string) => ({
  PK: `USER#${userId}`,
  SK: `CMA_REPORT#${reportId}`,
});

export const getUserDashboardDocumentKeys = (userId: string, documentId: string) => ({
  PK: `USER#${userId}`,
  SK: `DASHBOARD_DOC#${documentId}`,
});

export const getUserDocumentDownloadLogKeys = (documentId: string, timestamp: number) => ({
  PK: `DOCUMENT#${documentId}`,
  SK: `DOWNLOAD#${timestamp}`,
});

// Open house key stubs
export const getOpenHouseKeys = (userId: string, sessionId: string) => ({
  PK: `USER#${userId}`,
  SK: `OPENHOUSE#${sessionId}`,
});

export const getVisitorKeys = (userId: string, sessionId: string, visitorId: string) => ({
  PK: `USER#${userId}`,
  SK: `VISITOR#${sessionId}#${visitorId}`,
});

export const getFollowUpSequenceKeys = (userId: string, sequenceId: string) => ({
  PK: `USER#${userId}`,
  SK: `SEQUENCE#${sequenceId}`,
});

export const getFollowUpContentKeys = (userId: string, sessionId: string, visitorId: string) => ({
  PK: `USER#${userId}`,
  SK: `FOLLOWUP#${sessionId}#${visitorId}`,
});

export const getSessionTemplateKeys = (userId: string, templateId: string) => ({
  PK: `USER#${userId}`,
  SK: `OH_TEMPLATE#${templateId}`,
});

export const getWebhookConfigKeys = (userId: string, webhookId: string) => ({
  PK: `USER#${userId}`,
  SK: `WEBHOOK#${webhookId}`,
});

export const getWebhookDeliveryLogKeys = (userId: string, webhookId: string, deliveryId: string) => ({
  PK: `USER#${userId}`,
  SK: `WEBHOOK_LOG#${webhookId}#${deliveryId}`,
});

export const getSequenceEnrollmentKeys = (userId: string, enrollmentId: string) => ({
  PK: `USER#${userId}`,
  SK: `ENROLLMENT#${enrollmentId}`,
});

export const getOfflineSyncKeys = (userId: string, operationId: string) => ({
  PK: `USER#${userId}`,
  SK: `OFFLINE_SYNC#${operationId}`,
});

export const getAdminAnnouncementKeys = (announcementId: string, targetAudience: string, scheduledFor: number) => ({
  PK: `ANNOUNCEMENT#${targetAudience}`,
  SK: `${scheduledFor}#${announcementId}`,
});

// Workflow key stubs
export const getWorkflowInstanceKeys = (userId: string, instanceId: string) => ({
  PK: `USER#${userId}`,
  SK: `WORKFLOW_INSTANCE#${instanceId}`,
});

// Onboarding key stubs
export const getOnboardingStateKeys = (userId: string) => ({
  PK: `USER#${userId}`,
  SK: 'ONBOARDING#STATE',
});

export const getOnboardingAnalyticsKeys = (userId: string, eventId: string, timestamp: string) => ({
  PK: `USER#${userId}`,
  SK: `ONBOARDING#ANALYTICS#${timestamp}#${eventId}`,
});

// SEO and keyword key stubs
export const getSavedKeywordKeys = (userId: string, keywordId: string) => ({
  PK: `USER#${userId}`,
  SK: `KEYWORD#${keywordId}`,
});

export const getTestimonialRequestKeys = (userId: string, requestId: string) => ({
  PK: `USER#${userId}`,
  SK: `REQUEST#${requestId}`,
});

export const getTestimonialKeys = getTestimonialRequestKeys;

export const getSEOAnalysisKeys = (userId: string, analysisId: string) => ({
  PK: `USER#${userId}`,
  SK: `SEO#${analysisId}`,
});

// Alias exports for backward compatibility
export const getClientDashboardKeys = getUserClientDashboardKeys;
export const getSecuredLinkKeys = getUserSecuredLinkKeys;
export const getDashboardAnalyticsKeys = getUserDashboardAnalyticsKeys;
export const getCMAReportKeys = getUserCMAReportKeys;
export const getDashboardDocumentKeys = getUserDashboardDocumentKeys;
export const getDocumentDownloadLogKeys = getUserDocumentDownloadLogKeys;
export const getPropertyShareKeys = (userId: string, shareId: string) => ({
  PK: `USER#${userId}`,
  SK: `SHARE#${shareId}`,
});

// Alias exports are now handled in keys.ts

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

// React Hooks
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
