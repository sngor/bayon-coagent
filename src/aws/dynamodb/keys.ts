/**
 * DynamoDB Key Generation Functions
 * 
 * Provides functions to generate partition keys (PK) and sort keys (SK)
 * for all entity types following the single-table design pattern.
 */

import { DynamoDBKey } from './types';

/**
 * Extended key interfaces for different GSI patterns
 */
export interface DynamoDBKeyWithGSI1 extends DynamoDBKey {
  GSI1PK?: string;
  GSI1SK?: string;
}

export interface DynamoDBKeyWithGSI2 extends DynamoDBKey {
  GSI2PK?: string;
  GSI2SK?: string;
}

export interface DynamoDBKeyWithMultipleGSI extends DynamoDBKey {
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  GSI4PK?: string;
  GSI4SK?: string;
}

export interface DynamoDBKeyWithTTL extends DynamoDBKey {
  TTL?: number;
}

/**
 * Generates keys for UserProfile
 * Pattern: PK: USER#<userId>, SK: PROFILE
 */
export function getUserProfileKeys(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'PROFILE',
  };
}

/**
 * Alias for getUserProfileKeys for consistency
 */
export function getProfileKeys(userId: string): DynamoDBKey {
  return getUserProfileKeys(userId);
}

/**
 * Generates keys for RealEstateAgentProfile
 * Pattern: PK: USER#<userId>, SK: AGENT#<agentProfileId>
 */
export function getAgentProfileKeys(
  userId: string,
  agentProfileId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AGENT#${agentProfileId}`,
  };
}

/**
 * Generates keys for Review
 * Pattern: PK: REVIEW#<agentId>, SK: REVIEW#<reviewId>
 * GSI1: PK: REVIEW#<reviewId> (for direct lookup)
 */
export function getReviewKeys(agentId: string, reviewId: string): DynamoDBKey & {
  GSI1PK: string;
} {
  return {
    PK: `REVIEW#${agentId}`,
    SK: `REVIEW#${reviewId}`,
    GSI1PK: `REVIEW#${reviewId}`,
  };
}

/**
 * Generates keys for BrandAudit
 * Pattern: PK: USER#<userId>, SK: AUDIT#<auditId>
 */
export function getBrandAuditKeys(userId: string, auditId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AUDIT#${auditId}`,
  };
}

/**
 * Generates keys for Competitor
 * Pattern: PK: USER#<userId>, SK: COMPETITOR#<competitorId>
 */
export function getCompetitorKeys(
  userId: string,
  competitorId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `COMPETITOR#${competitorId}`,
  };
}

/**
 * Generates keys for ResearchReport
 * Pattern: PK: USER#<userId>, SK: REPORT#<reportId>
 */
export function getResearchReportKeys(
  userId: string,
  reportId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `REPORT#${reportId}`,
  };
}

/**
 * Generates keys for Project
 * Pattern: PK: USER#<userId>, SK: PROJECT#<projectId>
 */
export function getProjectKeys(userId: string, projectId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `PROJECT#${projectId}`,
  };
}

/**
 * Generates keys for SavedContent
 * Pattern: PK: USER#<userId>, SK: CONTENT#<contentId>
 */
export function getSavedContentKeys(
  userId: string,
  contentId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CONTENT#${contentId}`,
  };
}

/**
 * Generates keys for TrainingProgress
 * Pattern: PK: USER#<userId>, SK: TRAINING#<moduleId>
 */
export function getTrainingProgressKeys(
  userId: string,
  moduleId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `TRAINING#${moduleId}`,
  };
}

/**
 * Generates keys for MarketingPlan
 * Pattern: PK: USER#<userId>, SK: PLAN#<planId>
 */
export function getMarketingPlanKeys(
  userId: string,
  planId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `PLAN#${planId}`,
  };
}

/**
 * Generates keys for ReviewAnalysis
 * Pattern: PK: USER#<userId>, SK: ANALYSIS#<analysisId>
 */
export function getReviewAnalysisKeys(
  userId: string,
  analysisId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `ANALYSIS#${analysisId}`,
  };
}

/**
 * Generates keys for OAuthToken
 * Pattern: PK: OAUTH#<userId>, SK: <provider> (e.g., GOOGLE_BUSINESS)
 */
export function getOAuthTokenKeys(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): DynamoDBKey {
  return {
    PK: `OAUTH#${userId}`,
    SK: provider,
  };
}

/**
 * Helper function to generate a query prefix for a user's items
 * This can be used to query all items of a specific type for a user
 */
export function getUserItemPrefix(userId: string, itemType?: string): string {
  const pk = `USER#${userId}`;
  if (itemType) {
    return itemType;
  }
  return pk;
}

/**
 * Helper function to extract userId from a PK
 */
export function extractUserIdFromPK(pk: string): string | null {
  const match = pk.match(/^USER#(.+)$/);
  return match ? match[1] : null;
}

/**
 * Helper function to extract entity ID from SK
 */
export function extractEntityIdFromSK(sk: string): string | null {
  const match = sk.match(/^[A-Z_]+#(.+)$/);
  return match ? match[1] : null;
}

/**
 * Helper function to extract entity type from SK
 */
export function extractEntityTypeFromSK(sk: string): string | null {
  const match = sk.match(/^([A-Z_]+)#/);
  return match ? match[1] : null;
}

/**
 * Validates that a key follows the expected pattern
 */
export function validateKeyPattern(key: DynamoDBKey): boolean {
  const pkPattern = /^[A-Z_]+#.+$/;
  const skPattern = /^([A-Z_]+#.+|[A-Z_]+)$/;

  return pkPattern.test(key.PK) && skPattern.test(key.SK);
}

/**
 * Generates keys for ImageMetadata
 * Pattern: PK: USER#<userId>, SK: IMAGE#<imageId>
 */
export function getImageMetadataKeys(
  userId: string,
  imageId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `IMAGE#${imageId}`,
  };
}

/**
 * Generates keys for EditRecord
 * Pattern: PK: USER#<userId>, SK: EDIT#<editId>
 */
export function getEditRecordKeys(
  userId: string,
  editId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `EDIT#${editId}`,
  };
}

/**
 * Generates keys for AgentProfile (Bayon AI Assistant)
 * Pattern: PK: USER#<userId>, SK: PROFILE#AGENT
 */
export function getAgentProfileKeysV2(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'PROFILE#AGENT',
  };
}

/**
 * Generates keys for Citation (Bayon AI Assistant)
 * Pattern: PK: USER#<userId>, SK: CITATION#<citationId>
 */
export function getCitationKeys(
  userId: string,
  citationId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CITATION#${citationId}`,
  };
}

/**
 * Generates keys for Conversation (Bayon AI Assistant)
 * Pattern: PK: USER#<userId>, SK: CONVERSATION#<conversationId>
 */
export function getConversationKeys(
  userId: string,
  conversationId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CONVERSATION#${conversationId}`,
  };
}

/**
 * Generates keys for WorkflowExecution (Bayon AI Assistant)
 * Pattern: PK: USER#<userId>, SK: WORKFLOW#<workflowId>
 */
export function getWorkflowExecutionKeys(
  userId: string,
  workflowId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `WORKFLOW#${workflowId}`,
  };
}

/**
 * Generates keys for LoginSession
 * Pattern: PK: USER#<userId>, SK: SESSION#<timestamp>#<sessionId>
 */
export function getLoginSessionKeys(
  userId: string,
  sessionId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SESSION#${sessionId}`,
  };
}

/**
 * Generates keys for Listing
 * Pattern: PK: USER#<userId>, SK: LISTING#<listingId>
 * GSI1: PK: MLS#<mlsProvider>#<mlsNumber>, SK: STATUS#<status>
 */
export function getListingKeys(
  userId: string,
  listingId: string,
  mlsProvider?: string,
  mlsNumber?: string,
  status?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `LISTING#${listingId}`,
  };

  // Add GSI keys for MLS number and status lookups
  if (mlsProvider && mlsNumber) {
    keys.GSI1PK = `MLS#${mlsProvider}#${mlsNumber}`;
  }
  if (status) {
    keys.GSI1SK = `STATUS#${status}`;
  }

  return keys;
}

/**
 * Generates keys for MLSConnection
 * Pattern: PK: USER#<userId>, SK: MLS_CONNECTION#<connectionId>
 */
export function getMLSConnectionKeys(
  userId: string,
  connectionId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `MLS_CONNECTION#${connectionId}`,
  };
}

/**
 * Generates keys for SocialConnection (OAuth)
 * Pattern: PK: USER#<userId>, SK: SOCIAL#<platform>
 */
export function getSocialConnectionKeys(
  userId: string,
  platform: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SOCIAL#${platform.toUpperCase()}`,
  };
}

/**
 * Generates keys for SocialPost
 * Pattern: PK: USER#<userId>, SK: POST#<postId>
 * GSI1: PK: LISTING#<listingId>, SK: POST#<postId>
 */
export function getSocialPostKeys(
  userId: string,
  postId: string,
  listingId?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `POST#${postId}`,
  };

  // Add GSI keys for listing lookups
  if (listingId) {
    keys.GSI1PK = `LISTING#${listingId}`;
    keys.GSI1SK = `POST#${postId}`;
  }

  return keys;
}

/**
 * Generates keys for PerformanceMetrics
 * Pattern: PK: USER#<userId>, SK: METRICS#<listingId>#<date>
 */
export function getPerformanceMetricsKeys(
  userId: string,
  listingId: string,
  date: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `METRICS#${listingId}#${date}`,
  };
}

// ==================== Market Intelligence Alerts Keys ====================

/**
 * Generates keys for Alert
 * Pattern: PK: USER#<userId>, SK: ALERT#<timestamp>#<alertId>
 * GSI1: PK: ALERT#<userId>#<type>, SK: <timestamp>
 */
export function getAlertKeys(
  userId: string,
  alertId: string,
  timestamp: string,
  alertType?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `ALERT#${timestamp}#${alertId}`,
  };

  // Add GSI keys for querying alerts by type
  if (alertType) {
    keys.GSI1PK = `ALERT#${userId}#${alertType}`;
    keys.GSI1SK = timestamp;
  }

  return keys;
}

/**
 * Generates keys for AlertSettings
 * Pattern: PK: USER#<userId>, SK: SETTINGS#ALERTS
 */
export function getAlertSettingsKeys(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'SETTINGS#ALERTS',
  };
}

/**
 * Generates keys for NeighborhoodProfile
 * Pattern: PK: USER#<userId>, SK: NEIGHBORHOOD#<profileId>
 */
export function getNeighborhoodProfileKeys(
  userId: string,
  profileId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `NEIGHBORHOOD#${profileId}`,
  };
}

/**
 * Generates keys for LifeEvent
 * Pattern: PK: USER#<userId>, SK: LIFE_EVENT#<eventId>
 */
export function getLifeEventKeys(
  userId: string,
  eventId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `LIFE_EVENT#${eventId}`,
  };
}

/**
 * Generates keys for Prospect
 * Pattern: PK: USER#<userId>, SK: PROSPECT#<prospectId>
 */
export function getProspectKeys(
  userId: string,
  prospectId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `PROSPECT#${prospectId}`,
  };
}

/**
 * Generates keys for TrackedCompetitor
 * Pattern: PK: USER#<userId>, SK: TRACKED_COMPETITOR#<competitorId>
 */
export function getTrackedCompetitorKeys(
  userId: string,
  competitorId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `TRACKED_COMPETITOR#${competitorId}`,
  };
}

/**
 * Generates keys for ListingEvent
 * Pattern: PK: USER#<userId>, SK: LISTING_EVENT#<eventId>
 */
export function getListingEventKeys(
  userId: string,
  eventId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `LISTING_EVENT#${eventId}`,
  };
}

/**
 * Generates keys for TrendIndicators
 * Pattern: PK: USER#<userId>, SK: TREND#<neighborhood>#<period>
 */
export function getTrendIndicatorsKeys(
  userId: string,
  neighborhood: string,
  period: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `TREND#${neighborhood}#${period}`,
  };
}

/**
 * Generates keys for TargetArea
 * Pattern: PK: USER#<userId>, SK: TARGET_AREA#<areaId>
 */
export function getTargetAreaKeys(
  userId: string,
  areaId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `TARGET_AREA#${areaId}`,
  };
}

/**
 * Generates keys for PriceHistory
 * Pattern: PK: USER#<userId>, SK: PRICE_HISTORY#<mlsNumber>
 */
export function getPriceHistoryKeys(
  userId: string,
  mlsNumber: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `PRICE_HISTORY#${mlsNumber}`,
  };
}

/**
 * Generates keys for ListingSnapshot
 * Pattern: PK: USER#<userId>, SK: LISTING_SNAPSHOT#<mlsNumber>
 */
export function getListingSnapshotKeys(
  userId: string,
  mlsNumber: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `LISTING_SNAPSHOT#${mlsNumber}`,
  };
}

// ==================== Mobile Enhancements Keys ====================

/**
 * Generates keys for NotificationPreferences
 * Pattern: PK: USER#<userId>, SK: NOTIFICATIONPREFS
 */
export function getNotificationPreferencesKeys(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'NOTIFICATIONPREFS',
  };
}

/**
 * Generates keys for PushToken
 * Pattern: PK: USER#<userId>, SK: PUSH_TOKEN#<deviceId>
 */
export function getPushTokenKeys(
  userId: string,
  deviceId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `PUSH_TOKEN#${deviceId}`,
  };
}

/**
 * Generates keys for SyncOperation
 * Pattern: PK: USER#<userId>, SK: SYNC#<operationId>
 */
export function getSyncOperationKeys(
  userId: string,
  operationId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SYNC#${operationId}`,
  };
}

/**
 * Generates keys for MarketStats (cached)
 * Pattern: PK: USER#<userId>, SK: MARKETSTATS#<location>
 */
export function getMarketStatsKeys(
  userId: string,
  location: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `MARKETSTATS#${location}`,
  };
}

/**
 * Generates keys for OpenHouseSession
 * Pattern: PK: USER#<userId>, SK: OPENHOUSE#<sessionId>
 */
export function getOpenHouseSessionKeys(
  userId: string,
  sessionId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `OPENHOUSE#${sessionId}`,
  };
}

/**
 * Generates keys for MeetingPrep
 * Pattern: PK: USER#<userId>, SK: MEETINGPREP#<prepId>
 */
export function getMeetingPrepKeys(
  userId: string,
  prepId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `MEETINGPREP#${prepId}`,
  };
}

/**
 * Generates keys for PropertyComparison
 * Pattern: PK: USER#<userId>, SK: COMPARISON#<comparisonId>
 */
export function getPropertyComparisonKeys(
  userId: string,
  comparisonId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `COMPARISON#${comparisonId}`,
  };
}

// ==================== Content Workflow Features Keys ====================

/**
 * Generates keys for ScheduledContent
 * Pattern: PK: USER#<userId>, SK: SCHEDULE#<scheduleId>
 * GSI2: PK: SCHEDULE#<status>, SK: TIME#<publishTime>
 */
export function getScheduledContentKeys(
  userId: string,
  scheduleId: string,
  status?: string,
  publishTime?: string
): DynamoDBKey & {
  GSI2PK?: string;
  GSI2SK?: string;
} {
  const keys: DynamoDBKey & { GSI2PK?: string; GSI2SK?: string } = {
    PK: `USER#${userId}`,
    SK: `SCHEDULE#${scheduleId}`,
  };

  // Add GSI2 keys for efficient querying by status and time
  if (status) {
    keys.GSI2PK = `SCHEDULE#${status}`;
  }
  if (publishTime) {
    keys.GSI2SK = `TIME#${publishTime}`;
  }

  return keys;
}

/**
 * Generates keys for Analytics
 * Pattern: PK: USER#<userId>, SK: ANALYTICS#<contentId>#<channel>
 * GSI3: PK: ANALYTICS#<contentType>, SK: DATE#<publishDate>
 */
export function getAnalyticsKeys(
  userId: string,
  contentId: string,
  channel: string,
  contentType?: string,
  publishDate?: string
): DynamoDBKey & {
  GSI3PK?: string;
  GSI3SK?: string;
} {
  const keys: DynamoDBKey & { GSI3PK?: string; GSI3SK?: string } = {
    PK: `USER#${userId}`,
    SK: `ANALYTICS#${contentId}#${channel}`,
  };

  // Add GSI3 keys for content type analytics aggregation
  if (contentType) {
    keys.GSI3PK = `ANALYTICS#${contentType}`;
  }
  if (publishDate) {
    keys.GSI3SK = `DATE#${publishDate}`;
  }

  return keys;
}

/**
 * Generates keys for ABTest
 * Pattern: PK: USER#<userId>, SK: ABTEST#<testId>
 */
export function getABTestKeys(
  userId: string,
  testId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `ABTEST#${testId}`,
  };
}

/**
 * Generates keys for Template
 * Pattern: PK: USER#<userId>, SK: TEMPLATE#<templateId>
 * GSI4: PK: TEMPLATE#<contentType>, SK: NAME#<name>
 */
export function getTemplateKeys(
  userId: string,
  templateId: string,
  contentType?: string,
  name?: string
): DynamoDBKey & {
  GSI4PK?: string;
  GSI4SK?: string;
} {
  const keys: DynamoDBKey & { GSI4PK?: string; GSI4SK?: string } = {
    PK: `USER#${userId}`,
    SK: `TEMPLATE#${templateId}`,
  };

  // Add GSI4 keys for template discovery and search
  if (contentType) {
    keys.GSI4PK = `TEMPLATE#${contentType}`;
  }
  if (name) {
    keys.GSI4SK = `NAME#${name}`;
  }

  return keys;
}

/**
 * Generates keys for shared templates (brokerage access)
 * Pattern: PK: BROKERAGE#<brokerageId>, SK: TEMPLATE#<templateId>
 */
export function getSharedTemplateKeys(
  brokerageId: string,
  templateId: string
): DynamoDBKey {
  return {
    PK: `BROKERAGE#${brokerageId}`,
    SK: `TEMPLATE#${templateId}`,
  };
}

/**
 * Generates keys for ROI events
 * Pattern: PK: USER#<userId>, SK: ROI#<contentId>#<eventId>
 */
export function getROIKeys(
  userId: string,
  contentId: string,
  eventId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `ROI#${contentId}#${eventId}`,
  };
}

/**
 * Generates keys for Announcement
 * Pattern: PK: TEAM#<teamId>, SK: ANNOUNCEMENT#<timestamp>#<announcementId>
 * If teamId is 'GLOBAL', it's a system-wide announcement.
 */
export function getAnnouncementKeys(
  teamId: string,
  announcementId: string,
  timestamp: string
): DynamoDBKey {
  return {
    PK: `TEAM#${teamId}`,
    SK: `ANNOUNCEMENT#${timestamp}#${announcementId}`,
  };
}

/**
 * Generates keys for optimal times cache
 * Pattern: PK: USER#<userId>, SK: OPTIMAL#<channel>#<contentType>
 */
export function getOptimalTimesKeys(
  userId: string,
  channel: string,
  contentType: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `OPTIMAL#${channel}#${contentType}`,
  };
}

// ==================== Client Portal Keys ====================

/**
 * Generates keys for ClientDashboard
 * Pattern: PK: AGENT#<agentId>, SK: DASHBOARD#<dashboardId>
 */
export function getClientDashboardKeys(
  agentId: string,
  dashboardId: string
): DynamoDBKey {
  return {
    PK: `AGENT#${agentId}`,
    SK: `DASHBOARD#${dashboardId}`,
  };
}

/**
 * Generates keys for SecuredLink
 * Pattern: PK: LINK#<linkToken>, SK: METADATA
 * GSI1: PK: AGENT#<agentId>, SK: DASHBOARD#<dashboardId>
 */
export function getSecuredLinkKeys(
  linkToken: string,
  agentId?: string,
  dashboardId?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `LINK#${linkToken}`,
    SK: 'METADATA',
  };

  // Add GSI1 keys for agent/dashboard lookups
  if (agentId) {
    keys.GSI1PK = `AGENT#${agentId}`;
  }
  if (dashboardId) {
    keys.GSI1SK = `DASHBOARD#${dashboardId}`;
  }

  return keys;
}

/**
 * Generates keys for DashboardAnalytics
 * Pattern: PK: DASHBOARD#<dashboardId>, SK: VIEW#<timestamp>
 */
export function getDashboardAnalyticsKeys(
  dashboardId: string,
  timestamp: string
): DynamoDBKey {
  return {
    PK: `DASHBOARD#${dashboardId}`,
    SK: `VIEW#${timestamp}`,
  };
}

/**
 * Generates keys for CMAReport
 * Pattern: PK: AGENT#<agentId>, SK: CMA#<cmaReportId>
 */
export function getCMAReportKeys(
  agentId: string,
  cmaReportId: string
): DynamoDBKey {
  return {
    PK: `AGENT#${agentId}`,
    SK: `CMA#${cmaReportId}`,
  };
}

/**
 * Generates keys for DashboardDocument
 * Pattern: PK: AGENT#<agentId>, SK: DOCUMENT#<documentId>
 */
export function getDashboardDocumentKeys(
  agentId: string,
  documentId: string
): DynamoDBKey {
  return {
    PK: `AGENT#${agentId}`,
    SK: `DOCUMENT#${documentId}`,
  };
}

/**
 * Generates keys for DocumentDownloadLog
 * Pattern: PK: DOCUMENT#<documentId>, SK: DOWNLOAD#<timestamp>#<dashboardId>
 */
export function getDocumentDownloadLogKeys(
  documentId: string,
  timestamp: string,
  dashboardId: string
): DynamoDBKey {
  return {
    PK: `DOCUMENT#${documentId}`,
    SK: `DOWNLOAD#${timestamp}#${dashboardId}`,
  };
}

// ==================== Testimonial & SEO Features Keys ====================

/**
 * Generates keys for Testimonial
 * Pattern: PK: USER#<userId>, SK: TESTIMONIAL#<testimonialId>
 */
export function getTestimonialKeys(
  userId: string,
  testimonialId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `TESTIMONIAL#${testimonialId}`,
  };
}

/**
 * Generates keys for TestimonialRequest
 * Pattern: PK: USER#<userId>, SK: REQUEST#<requestId>
 */
export function getTestimonialRequestKeys(
  userId: string,
  requestId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `REQUEST#${requestId}`,
  };
}

/**
 * Generates keys for SEOAnalysis
 * Pattern: PK: USER#<userId>, SK: SEO#<analysisId>
 */
export function getSEOAnalysisKeys(
  userId: string,
  analysisId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SEO#${analysisId}`,
  };
}

/**
 * Generates keys for SavedKeyword
 * Pattern: PK: USER#<userId>, SK: KEYWORD#<keywordId>
 */
export function getSavedKeywordKeys(
  userId: string,
  keywordId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `KEYWORD#${keywordId}`,
  };
}

// ==================== Client Dashboard Keys ====================

/**
 * Generates keys for UserClientDashboard
 * Pattern: PK: USER#<userId>, SK: CLIENT_DASHBOARD#<dashboardId>
 */
export function getUserClientDashboardKeys(userId: string, dashboardId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CLIENT_DASHBOARD#${dashboardId}`,
  };
}

/**
 * Generates keys for UserSecuredLink
 * Pattern: PK: SECURE_LINK#<token>, SK: METADATA
 * GSI1: PK: USER#<userId>, SK: DASHBOARD#<dashboardId>
 */
export function getUserSecuredLinkKeys(
  token: string,
  userId?: string,
  dashboardId?: string
): DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `SECURE_LINK#${token}`,
    SK: 'METADATA',
  };

  if (userId && dashboardId) {
    keys.GSI1PK = `USER#${userId}`;
    keys.GSI1SK = `DASHBOARD#${dashboardId}`;
  }

  return keys;
}

/**
 * Generates keys for DashboardAnalytics (User-based)
 * Pattern: PK: DASHBOARD#<dashboardId>, SK: ANALYTICS
 */
export function getUserDashboardAnalyticsKeys(
  dashboardId: string,
  timestamp?: string | number
): DynamoDBKey {
  return {
    PK: `DASHBOARD#${dashboardId}`,
    SK: 'ANALYTICS',
  };
}

/**
 * Generates keys for CMAReport (User-based)
 * Pattern: PK: USER#<userId>, SK: CMA_REPORT#<reportId>
 */
export function getUserCMAReportKeys(userId: string, reportId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CMA_REPORT#${reportId}`,
  };
}

/**
 * Generates keys for DashboardDocument (User-based)
 * Pattern: PK: USER#<userId>, SK: DASHBOARD_DOC#<documentId>
 */
export function getUserDashboardDocumentKeys(
  userId: string,
  documentId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `DASHBOARD_DOC#${documentId}`,
  };
}

/**
 * Generates keys for DocumentDownloadLog (User-based)
 * Pattern: PK: DOCUMENT#<documentId>, SK: DOWNLOAD#<timestamp>
 * GSI1: PK: DASHBOARD#<dashboardId>, SK: DOWNLOAD#<timestamp>
 */
export function getUserDocumentDownloadLogKeys(
  documentId: string,
  timestamp: number,
  dashboardId?: string
): DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `DOCUMENT#${documentId}`,
    SK: `DOWNLOAD#${timestamp}`,
  };

  if (dashboardId) {
    keys.GSI1PK = `DASHBOARD#${dashboardId}`;
    keys.GSI1SK = `DOWNLOAD#${timestamp}`;
  }

  return keys;
}

// ==================== Open House Enhancement Keys ====================

/**
 * Generates keys for OpenHouseSession
 * Pattern: PK: USER#<userId>, SK: OPENHOUSE#<sessionId>
 * GSI1: PK: SESSION#<status>, SK: DATE#<scheduledDate>
 * GSI2: PK: SESSIONID#<sessionId>, SK: USER#<userId> (for public QR code access)
 */
export function getOpenHouseKeys(
  userId: string,
  sessionId: string,
  status?: string,
  scheduledDate?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
  } = {
    PK: `USER#${userId}`,
    SK: `OPENHOUSE#${sessionId}`,
  };

  // Add GSI1 keys for querying by status and date
  if (status) {
    keys.GSI1PK = `SESSION#${status}`;
  }
  if (scheduledDate) {
    keys.GSI1SK = `DATE#${scheduledDate}`;
  }

  // Add GSI2 keys for public access by sessionId (for QR code check-in)
  keys.GSI2PK = `SESSIONID#${sessionId}`;
  keys.GSI2SK = `USER#${userId}`;

  return keys;
}

/**
 * Generates keys for Visitor
 * Pattern: PK: USER#<userId>, SK: VISITOR#<sessionId>#<visitorId>
 * GSI1: PK: SESSION#<sessionId>, SK: INTEREST#<level>#<timestamp>
 */
export function getVisitorKeys(
  userId: string,
  sessionId: string,
  visitorId: string,
  interestLevel?: string,
  checkInTime?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `VISITOR#${sessionId}#${visitorId}`,
  };

  // Add GSI1 keys for querying visitors by session and interest level
  if (sessionId) {
    keys.GSI1PK = `SESSION#${sessionId}`;
  }
  if (interestLevel && checkInTime) {
    keys.GSI1SK = `INTEREST#${interestLevel}#${checkInTime}`;
  }

  return keys;
}

/**
 * Generates keys for FollowUpSequence
 * Pattern: PK: USER#<userId>, SK: SEQUENCE#<sequenceId>
 */
export function getFollowUpSequenceKeys(
  userId: string,
  sequenceId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SEQUENCE#${sequenceId}`,
  };
}

/**
 * Generates keys for FollowUpContent
 * Pattern: PK: USER#<userId>, SK: FOLLOWUP#<sessionId>#<visitorId>
 */
export function getFollowUpContentKeys(
  userId: string,
  sessionId: string,
  visitorId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `FOLLOWUP#${sessionId}#${visitorId}`,
  };
}

/**
 * Generates keys for SessionTemplate
 * Pattern: PK: USER#<userId>, SK: OH_TEMPLATE#<templateId>
 */
export function getSessionTemplateKeys(
  userId: string,
  templateId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `OH_TEMPLATE#${templateId}`,
  };
}

/**
 * Generates keys for WebhookConfig
 * Pattern: PK: USER#<userId>, SK: WEBHOOK#<webhookId>
 */
export function getWebhookConfigKeys(
  userId: string,
  webhookId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `WEBHOOK#${webhookId}`,
  };
}

/**
 * Generates keys for WebhookDeliveryLog
 * Pattern: PK: USER#<userId>, SK: WEBHOOK_LOG#<webhookId>#<deliveryId>
 * GSI1: PK: WEBHOOK#<webhookId>, SK: DELIVERY#<timestamp>
 */
export function getWebhookDeliveryLogKeys(
  userId: string,
  webhookId: string,
  deliveryId: string,
  timestamp?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
  } = {
    PK: `USER#${userId}`,
    SK: `WEBHOOK_LOG#${webhookId}#${deliveryId}`,
  };

  // Add GSI1 keys for querying logs by webhook
  if (timestamp) {
    keys.GSI1PK = `WEBHOOK#${webhookId}`;
    keys.GSI1SK = `DELIVERY#${timestamp}`;
  }

  return keys;
}

/**
 * Generates keys for SequenceEnrollment
 * Pattern: PK: USER#<userId>, SK: ENROLLMENT#<enrollmentId>
 * GSI1: PK: SEQUENCE#<sequenceId>, SK: VISITOR#<visitorId>
 * GSI2: PK: VISITOR#<visitorId>, SK: ENROLLMENT#<enrollmentId>
 */
export function getSequenceEnrollmentKeys(
  userId: string,
  enrollmentId: string,
  sequenceId?: string,
  visitorId?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
  } = {
    PK: `USER#${userId}`,
    SK: `ENROLLMENT#${enrollmentId}`,
  };

  // Add GSI1 keys for querying enrollments by sequence
  if (sequenceId) {
    keys.GSI1PK = `SEQUENCE#${sequenceId}`;
  }
  if (visitorId) {
    keys.GSI1SK = `VISITOR#${visitorId}`;
    // Add GSI2 keys for querying enrollments by visitor
    keys.GSI2PK = `VISITOR#${visitorId}`;
    keys.GSI2SK = `ENROLLMENT#${enrollmentId}`;
  }

  return keys;
}

/**
 * Generates keys for OfflineSync operations
 * Pattern: PK: USER#<userId>, SK: OFFLINE_SYNC#<operationId>
 */
export function getOfflineSyncKeys(
  userId: string,
  operationId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `OFFLINE_SYNC#${operationId}`,
  };
}

/**
 * Generates keys for PropertyShare
 * Pattern: PK: USER#<userId>, SK: SHARE#<shareId>
 */
export function getPropertyShareKeys(
  userId: string,
  shareId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `SHARE#${shareId}`,
  };
}

/**
 * Generates keys for MobileCapture
 * Pattern: PK: USER#<userId>, SK: CAPTURE#<captureId>
 */
export function getMobileCaptureKeys(
  userId: string,
  captureId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CAPTURE#${captureId}`,
  };
}

/**
 * Generates keys for QuickAction
 * Pattern: PK: USER#<userId>, SK: QUICKACTION#<actionId>
 */
export function getQuickActionKeys(
  userId: string,
  actionId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `QUICKACTION#${actionId}`,
  };
}

/**
 * Generates keys for VoiceNote
 * Pattern: PK: USER#<userId>, SK: VOICENOTE#<noteId>
 */
export function getVoiceNoteKeys(
  userId: string,
  noteId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `VOICENOTE#${noteId}`,
  };
}

/**
 * Generates keys for LocationCheckIn
 * Pattern: PK: USER#<userId>, SK: CHECKIN#<checkInId>
 */
export function getLocationCheckInKeys(
  userId: string,
  checkInId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `CHECKIN#${checkInId}`,
  };
}

// ==================== AEO (Answer Engine Optimization) Keys ====================

/**
 * Generates keys for AEO Score
 * Pattern: PK: USER#<userId>, SK: AEO#SCORE#<timestamp>
 * GSI1: PK: AEO#SCORE, SK: <timestamp> (for global leaderboard)
 */
export function getAEOScoreKeys(
  userId: string,
  timestamp: string,
  includeGSI?: boolean
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `AEO#SCORE#${timestamp}`,
  };

  // Add GSI1 keys for global leaderboard
  if (includeGSI) {
    keys.GSI1PK = 'AEO#SCORE';
    keys.GSI1SK = timestamp;
  }

  return keys;
}

/**
 * Generates keys for AEO Mention
 * Pattern: PK: USER#<userId>, SK: AEO#MENTION#<mentionId>
 * GSI1: PK: AEO#MENTION#<source>, SK: <timestamp>
 */
export function getAEOMentionKeys(
  userId: string,
  mentionId: string,
  source?: string,
  timestamp?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `AEO#MENTION#${mentionId}`,
  };

  // Add GSI1 keys for querying by source
  if (source && timestamp) {
    keys.GSI1PK = `AEO#MENTION#${source}`;
    keys.GSI1SK = timestamp;
  }

  return keys;
}

/**
 * Generates keys for AEO Recommendation
 * Pattern: PK: USER#<userId>, SK: AEO#RECOMMENDATION#<recommendationId>
 */
export function getAEORecommendationKeys(
  userId: string,
  recommendationId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AEO#RECOMMENDATION#${recommendationId}`,
  };
}

/**
 * Generates keys for AEO Analysis
 * Pattern: PK: USER#<userId>, SK: AEO#ANALYSIS#<analysisId>
 */
export function getAEOAnalysisKeys(
  userId: string,
  analysisId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AEO#ANALYSIS#${analysisId}`,
  };
}

/**
 * Generates keys for AEO Competitor Score
 * Pattern: PK: USER#<userId>, SK: AEO#COMPETITOR#<competitorId>#<timestamp>
 */
export function getAEOCompetitorScoreKeys(
  userId: string,
  competitorId: string,
  timestamp: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AEO#COMPETITOR#${competitorId}#${timestamp}`,
  };
}

// ==================== AI Search Monitoring Keys ====================

/**
 * Generates keys for AIMention
 * Pattern: PK: USER#<userId>, SK: AI_MENTION#<platform>#<timestamp>#<id>
 * GSI1: PK: USER#<userId>, SK: AI_MENTION_BY_DATE#<timestamp>
 */
export function getAIMentionKeys(
  userId: string,
  mentionId: string,
  platform: string,
  timestamp: string
): DynamoDBKey & {
  GSI1PK: string;
  GSI1SK: string;
} {
  return {
    PK: `USER#${userId}`,
    SK: `AI_MENTION#${platform}#${timestamp}#${mentionId}`,
    GSI1PK: `USER#${userId}`,
    GSI1SK: `AI_MENTION_BY_DATE#${timestamp}`,
  };
}

/**
 * Generates keys for AIVisibilityScore
 * Pattern: PK: USER#<userId>, SK: AI_VISIBILITY_SCORE#<calculatedAt>
 * GSI1: PK: USER#<userId>, SK: AI_SCORE_LATEST
 */
export function getAIVisibilityScoreKeys(
  userId: string,
  calculatedAt: string,
  isLatest?: boolean
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `AI_VISIBILITY_SCORE#${calculatedAt}`,
  };

  // Add GSI1 keys for latest score lookup
  if (isLatest) {
    keys.GSI1PK = `USER#${userId}`;
    keys.GSI1SK = 'AI_SCORE_LATEST';
  }

  return keys;
}

/**
 * Generates keys for AIMonitoringConfig
 * Pattern: PK: USER#<userId>, SK: AI_MONITORING_CONFIG
 */
export function getAIMonitoringConfigKeys(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'AI_MONITORING_CONFIG',
  };
}

/**
 * Generates keys for AIMonitoringJob
 * Pattern: PK: USER#<userId>, SK: AI_MONITORING_JOB#<startedAt>#<id>
 */
export function getAIMonitoringJobKeys(
  userId: string,
  jobId: string,
  startedAt: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AI_MONITORING_JOB#${startedAt}#${jobId}`,
  };
}

/**
 * Generates keys for APIUsageRecord
 * Pattern: PK: USER#<userId>, SK: API_USAGE#<timestamp>#<id>
 */
export function getAPIUsageRecordKeys(
  userId: string,
  recordId: string,
  timestamp: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `API_USAGE#${timestamp}#${recordId}`,
  };
}

/**
 * Generates keys for UserBudget
 * Pattern: PK: USER#<userId>, SK: USER_BUDGET
 */
export function getUserBudgetKeys(userId: string): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: 'USER_BUDGET',
  };
}

/**
 * Generates keys for CostSpikeAlert
 * Pattern: PK: USER#<userId>, SK: COST_SPIKE_ALERT#<timestamp>#<id>
 */
export function getCostSpikeAlertKeys(
  userId: string,
  alertId: string,
  timestamp: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `COST_SPIKE_ALERT#${timestamp}#${alertId}`,
  };
}

// ==================== Website Analysis Keys ====================

/**
 * Generates keys for WebsiteAnalysis
 * Pattern: PK: USER#<userId>, SK: WEBSITE_ANALYSIS#latest (for latest analysis)
 * Pattern: PK: USER#<userId>, SK: WEBSITE_ANALYSIS#<timestamp> (for historical analyses)
 */
export function getWebsiteAnalysisKeys(
  userId: string,
  timestamp?: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: timestamp ? `WEBSITE_ANALYSIS#${timestamp}` : 'WEBSITE_ANALYSIS#latest',
  };
}

// ==================== Admin Role Management Keys ====================

/**
 * Generates keys for RoleAuditLog
 * Pattern: PK: USER#<userId>, SK: AUDIT#<timestamp>#<auditId>
 * GSI1: PK: AUDIT#ROLE_CHANGE, SK: <timestamp> (for querying all role changes)
 */
export function getRoleAuditKeys(
  userId: string,
  auditId: string,
  timestamp: number
): DynamoDBKey & { GSI1PK: string; GSI1SK: string } {
  return {
    PK: `USER#${userId}`,
    SK: `AUDIT#${timestamp}#${auditId}`,
    GSI1PK: 'AUDIT#ROLE_CHANGE',
    GSI1SK: timestamp.toString(),
  };
}

/**
 * Generates keys for querying all role audit logs using GSI1
 * Pattern: GSI1PK: AUDIT#ROLE_CHANGE, GSI1SK: <timestamp>
 */
export function getRoleAuditQueryKeys(): { GSI1PK: string } {
  return {
    GSI1PK: 'AUDIT#ROLE_CHANGE',
  };
}

/**
 * Generates keys for querying users by role using GSI
 * Pattern: GSI1PK: ROLE#<role>, GSI1SK: USER#<userId>
 */
export function getUsersByRoleQueryKeys(role: string): { GSI1PK: string } {
  return {
    GSI1PK: `ROLE#${role}`,
  };
}

// ==================== Admin Platform Management Keys ====================

/**
 * Generates keys for AnalyticsEvent
 * Pattern: PK: ANALYTICS#<date>, SK: EVENT#<timestamp>#<eventId>
 * GSI1: PK: USER#<userId>, SK: EVENT#<timestamp>
 * TTL: <timestamp + 90 days>
 */
export function getAnalyticsEventKeys(
  date: string,
  eventId: string,
  timestamp: number,
  userId?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
  TTL?: number;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
    TTL?: number;
  } = {
    PK: `ANALYTICS#${date}`,
    SK: `EVENT#${timestamp}#${eventId}`,
    TTL: Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60), // 90 days in seconds
  };

  // Add GSI1 keys for querying by user
  if (userId) {
    keys.GSI1PK = `USER#${userId}`;
    keys.GSI1SK = `EVENT#${timestamp}`;
  }

  return keys;
}

/**
 * Generates keys for AggregatedMetrics
 * Pattern: PK: METRICS#<date>, SK: DAILY
 */
export function getAggregatedMetricsKeys(date: string): DynamoDBKey {
  return {
    PK: `METRICS#${date}`,
    SK: 'DAILY',
  };
}

/**
 * Generates keys for SupportTicket
 * Pattern: PK: TICKET#<ticketId>, SK: METADATA
 * GSI1: PK: TICKETS#<status>, SK: <priority>#<createdAt>
 */
export function getSupportTicketKeys(
  ticketId: string,
  status?: string,
  priority?: string,
  createdAt?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `TICKET#${ticketId}`,
    SK: 'METADATA',
  };

  // Add GSI1 keys for querying by status
  if (status && priority && createdAt) {
    keys.GSI1PK = `TICKETS#${status}`;
    keys.GSI1SK = `${priority}#${createdAt}`;
  }

  return keys;
}

/**
 * Generates keys for TicketMessage
 * Pattern: PK: TICKET#<ticketId>, SK: MESSAGE#<timestamp>#<messageId>
 */
export function getTicketMessageKeys(
  ticketId: string,
  messageId: string,
  timestamp: number
): DynamoDBKey {
  return {
    PK: `TICKET#${ticketId}`,
    SK: `MESSAGE#${timestamp}#${messageId}`,
  };
}

/**
 * Generates keys for Feedback
 * Pattern: PK: FEEDBACK#<feedbackId>, SK: METADATA
 * GSI1: PK: FEEDBACK#ALL, SK: <createdAt>
 */
export function getFeedbackKeys(
  feedbackId: string,
  createdAt?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `FEEDBACK#${feedbackId}`,
    SK: 'METADATA',
  };

  // Add GSI1 keys for querying all feedback sorted by date
  if (createdAt) {
    keys.GSI1PK = 'FEEDBACK#ALL';
    keys.GSI1SK = `${createdAt}`;
  }

  return keys;
}

/**
 * Generates keys for FeatureFlag
 * Pattern: PK: CONFIG#FEATURE_FLAGS, SK: FLAG#<flagId>
 */
export function getFeatureFlagKeys(flagId: string): DynamoDBKey {
  return {
    PK: 'CONFIG#FEATURE_FLAGS',
    SK: `FLAG#${flagId}`,
  };
}

/**
 * Generates keys for PlatformSetting
 * Pattern: PK: CONFIG#SETTINGS, SK: SETTING#<category>#<key>
 */
export function getPlatformSettingKeys(
  category: string,
  key: string
): DynamoDBKey {
  return {
    PK: 'CONFIG#SETTINGS',
    SK: `SETTING#${category}#${key}`,
  };
}

/**
 * Generates keys for ContentModeration
 * Pattern: PK: USER#<userId>, SK: CONTENT#<contentId>
 * GSI1: PK: MODERATION#<status>, SK: <createdAt>
 */
export function getContentModerationKeys(
  userId: string,
  contentId: string,
  status?: string,
  createdAt?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `CONTENT#${contentId}`,
  };

  // Add GSI1 keys for moderation queue
  if (status && createdAt) {
    keys.GSI1PK = `MODERATION#${status}`;
    keys.GSI1SK = createdAt.toString();
  }

  return keys;
}

/**
 * Generates keys for AdminAuditLog
 * Pattern: PK: AUDIT#<date>, SK: <timestamp>#<auditId>
 * GSI1: PK: AUDIT#<adminId>, SK: <timestamp>
 * GSI2: PK: AUDIT#<actionType>, SK: <timestamp>
 */
export function getAdminAuditLogKeys(
  date: string,
  auditId: string,
  timestamp: number,
  adminId?: string,
  actionType?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  TTL?: number;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
    TTL?: number;
  } = {
    PK: `AUDIT#${date}`,
    SK: `${timestamp}#${auditId}`,
    TTL: Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60), // 90 days retention
  };

  // Add GSI1 keys for querying by admin
  if (adminId) {
    keys.GSI1PK = `AUDIT#${adminId}`;
    keys.GSI1SK = timestamp.toString();
  }

  // Add GSI2 keys for querying by action type
  if (actionType) {
    keys.GSI2PK = `AUDIT#${actionType}`;
    keys.GSI2SK = timestamp.toString();
  }

  return keys;
}

/**
 * Generates keys for Announcement
 * Pattern: PK: ANNOUNCEMENT#<targetAudience>, SK: <scheduledFor>#<announcementId>
 * GSI1: PK: ANNOUNCEMENT#<announcementId>, SK: METADATA
 */
export function getAdminAnnouncementKeys(
  announcementId: string,
  targetAudience: string,
  scheduledFor: number
): DynamoDBKey & {
  GSI1PK: string;
  GSI1SK: string;
} {
  return {
    PK: `ANNOUNCEMENT#${targetAudience}`,
    SK: `${scheduledFor}#${announcementId}`,
    GSI1PK: `ANNOUNCEMENT#${announcementId}`,
    GSI1SK: 'METADATA',
  };
}

/**
 * Generates keys for ABTestConfig
 * Pattern: PK: CONFIG#AB_TESTS, SK: TEST#<testId>
 */
export function getABTestConfigKeys(testId: string): DynamoDBKey {
  return {
    PK: 'CONFIG#AB_TESTS',
    SK: `TEST#${testId}`,
  };
}

/**
 * Generates keys for ABTestAssignment
 * Pattern: PK: USER#<userId>, SK: AB_TEST#<testId>
 */
export function getABTestAssignmentKeys(
  userId: string,
  testId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `AB_TEST#${testId}`,
  };
}

/**
 * Generates keys for MaintenanceWindow
 * Pattern: PK: CONFIG#MAINTENANCE, SK: WINDOW#<windowId>
 * GSI1: PK: MAINTENANCE#<status>, SK: <startTime>
 */
export function getMaintenanceWindowKeys(
  windowId: string,
  status?: string,
  startTime?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: 'CONFIG#MAINTENANCE',
    SK: `WINDOW#${windowId}`,
  };

  // Add GSI1 keys for querying by status
  if (status && startTime) {
    keys.GSI1PK = `MAINTENANCE#${status}`;
    keys.GSI1SK = startTime.toString();
  }

  return keys;
}

/**
 * Generates keys for APIKey
 * Pattern: PK: CONFIG#API_KEYS, SK: KEY#<keyId>
 * GSI1: PK: API_KEY#<hashedKey>, SK: METADATA
 */
export function getAPIKeyKeys(
  keyId: string,
  hashedKey?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: 'CONFIG#API_KEYS',
    SK: `KEY#${keyId}`,
  };

  // Add GSI1 keys for key validation
  if (hashedKey) {
    keys.GSI1PK = `API_KEY#${hashedKey}`;
    keys.GSI1SK = 'METADATA';
  }

  return keys;
}

/**
 * Generates keys for UserFeedback
 * Pattern: PK: USER#<userId>, SK: FEEDBACK#<feedbackId>
 * GSI1: PK: FEEDBACK#<category>, SK: <timestamp>
 */
export function getUserFeedbackKeys(
  userId: string,
  feedbackId: string,
  category?: string,
  timestamp?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `FEEDBACK#${feedbackId}`,
  };

  // Add GSI1 keys for querying by category
  if (category && timestamp) {
    keys.GSI1PK = `FEEDBACK#${category}`;
    keys.GSI1SK = timestamp.toString();
  }

  return keys;
}

/**
 * Generates keys for UserActivity summary
 * Pattern: PK: USER_ACTIVITY#<userId>, SK: SUMMARY
 * GSI1: PK: ACTIVITY_LEVEL#<level>, SK: <lastLogin>
 */
export function getUserActivitySummaryKeys(
  userId: string,
  activityLevel?: 'active' | 'inactive' | 'dormant',
  lastLogin?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER_ACTIVITY#${userId}`,
    SK: 'SUMMARY',
  };

  // Add GSI1 keys for querying by activity level
  if (activityLevel && lastLogin) {
    keys.GSI1PK = `ACTIVITY_LEVEL#${activityLevel}`;
    keys.GSI1SK = lastLogin.toString();
  }

  return keys;
}

/**
 * Generates keys for querying all user activity summaries
 * Pattern: PK: USER_ACTIVITY_INDEX, SK: <userId>
 * Used for scanning all user activities efficiently
 */
export function getUserActivityIndexKeys(userId: string): DynamoDBKey {
  return {
    PK: 'USER_ACTIVITY_INDEX',
    SK: userId,
  };
}

/**
 * Generates keys for EmailNotification
 * Pattern: PK: EMAIL_NOTIFICATION#<notificationId>, SK: METADATA
 * GSI1: PK: EMAIL_NOTIFICATIONS, SK: <timestamp>
 * GSI2: PK: EMAIL_NOTIFICATION#<type>, SK: <timestamp>
 */
export function getEmailNotificationKeys(
  notificationId: string,
  type?: string,
  timestamp?: number
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
} {
  const keys: DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
  } = {
    PK: `EMAIL_NOTIFICATION#${notificationId}`,
    SK: 'METADATA',
  };

  // Add GSI1 keys for querying all notifications
  if (timestamp) {
    keys.GSI1PK = 'EMAIL_NOTIFICATIONS';
    keys.GSI1SK = timestamp.toString();
  }

  // Add GSI2 keys for querying by type
  if (type && timestamp) {
    keys.GSI2PK = `EMAIL_NOTIFICATION#${type}`;
    keys.GSI2SK = timestamp.toString();
  }

  return keys;
}

/**
 * Admin key generators namespace
 */
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

// ==================== Guided Workflows Keys ====================

/**
 * Generates keys for WorkflowInstance
 * Pattern: PK: USER#<userId>, SK: WORKFLOW_INSTANCE#<instanceId>
 * GSI1: PK: USER#<userId>, GSI1SK: STATUS#<status>#<lastActiveAt>
 */
export function getWorkflowInstanceKeys(
  userId: string,
  instanceId: string,
  status?: string,
  lastActiveAt?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `WORKFLOW_INSTANCE#${instanceId}`,
  };

  // Add GSI1 keys for status filtering
  if (status && lastActiveAt) {
    keys.GSI1PK = `USER#${userId}`;
    keys.GSI1SK = `STATUS#${status}#${lastActiveAt}`;
  }

  return keys;
}

// ==================== User Onboarding Keys ====================

/**
 * Generates keys for OnboardingState
 * Pattern: PK: USER#<userId>, SK: ONBOARDING#STATE
 * GSI1: PK: ONBOARDING#INCOMPLETE, SK: <lastAccessedAt> (for querying incomplete onboardings)
 */
export function getOnboardingStateKeys(
  userId: string,
  isComplete?: boolean,
  lastAccessedAt?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: 'ONBOARDING#STATE',
  };

  // Add GSI1 keys for querying incomplete onboardings
  if (isComplete === false && lastAccessedAt) {
    keys.GSI1PK = 'ONBOARDING#INCOMPLETE';
    keys.GSI1SK = lastAccessedAt;
  }

  return keys;
}

/**
 * Generates keys for OnboardingAnalytics
 * Pattern: PK: USER#<userId>, SK: ONBOARDING#ANALYTICS#<timestamp>#<eventId>
 * GSI1: PK: ANALYTICS#ONBOARDING#<eventType>, SK: <timestamp> (for aggregating by event type)
 */
export function getOnboardingAnalyticsKeys(
  userId: string,
  eventId: string,
  timestamp: string,
  eventType?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `ONBOARDING#ANALYTICS#${timestamp}#${eventId}`,
  };

  // Add GSI1 keys for querying by event type
  if (eventType) {
    keys.GSI1PK = `ANALYTICS#ONBOARDING#${eventType}`;
    keys.GSI1SK = timestamp;
  }

  return keys;
}

// ==================== Key Factory Functions ====================

/**
 * Factory function for creating user-scoped entity keys
 * Reduces boilerplate for common USER#<userId> patterns
 */
export function createUserEntityKeys(
  userId: string,
  entityType: string,
  entityId: string
): DynamoDBKey {
  return {
    PK: `USER#${userId}`,
    SK: `${entityType}#${entityId}`,
  };
}

/**
 * Factory function for creating timestamped keys
 * Common pattern for time-series data
 */
export function createTimestampedKeys(
  prefix: string,
  identifier: string,
  timestamp: string | number,
  entityId?: string
): DynamoDBKey {
  const sk = entityId
    ? `${identifier}#${timestamp}#${entityId}`
    : `${identifier}#${timestamp}`;

  return {
    PK: prefix,
    SK: sk,
  };
}

/**
 * Factory function for creating GSI keys with consistent patterns
 */
export function createGSIKeys(
  baseKeys: DynamoDBKey,
  gsiConfig: {
    gsi1?: { pk: string; sk?: string };
    gsi2?: { pk: string; sk?: string };
  }
): DynamoDBKeyWithMultipleGSI {
  const keys: DynamoDBKeyWithMultipleGSI = { ...baseKeys };

  if (gsiConfig.gsi1) {
    keys.GSI1PK = gsiConfig.gsi1.pk;
    if (gsiConfig.gsi1.sk) keys.GSI1SK = gsiConfig.gsi1.sk;
  }

  if (gsiConfig.gsi2) {
    keys.GSI2PK = gsiConfig.gsi2.pk;
    if (gsiConfig.gsi2.sk) keys.GSI2SK = gsiConfig.gsi2.sk;
  }

  return keys;
}

// ==================== Alias Functions for Compatibility ====================

/**
 * Alias functions for backward compatibility
 */
export const getTestimonialKeys = getTestimonialRequestKeys;
export const getClientDashboardKeys = getUserClientDashboardKeys;
export const getSecuredLinkKeys = getUserSecuredLinkKeys;
export const getDashboardAnalyticsKeys = getUserDashboardAnalyticsKeys;
export const getCMAReportKeys = getUserCMAReportKeys;
export const getDashboardDocumentKeys = getUserDashboardDocumentKeys;
export const getDocumentDownloadLogKeys = getUserDocumentDownloadLogKeys;