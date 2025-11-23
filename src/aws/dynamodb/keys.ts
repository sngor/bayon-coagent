/**
 * DynamoDB Key Generation Functions
 * 
 * Provides functions to generate partition keys (PK) and sort keys (SK)
 * for all entity types following the single-table design pattern.
 */

import { DynamoDBKey } from './types';

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
  const match = sk.match(/^[A-Z]+#(.+)$/);
  return match ? match[1] : null;
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
 * GSI1: PK: SCHEDULE#<status>, SK: TIME#<publishTime>
 */
export function getScheduledContentKeys(
  userId: string,
  scheduleId: string,
  status?: string,
  publishTime?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `SCHEDULE#${scheduleId}`,
  };

  // Add GSI keys for efficient querying by status and time
  if (status) {
    keys.GSI1PK = `SCHEDULE#${status}`;
  }
  if (publishTime) {
    keys.GSI1SK = `TIME#${publishTime}`;
  }

  return keys;
}

/**
 * Generates keys for Analytics
 * Pattern: PK: USER#<userId>, SK: ANALYTICS#<contentId>#<channel>
 * GSI1: PK: ANALYTICS#<contentType>, SK: DATE#<publishDate>
 */
export function getAnalyticsKeys(
  userId: string,
  contentId: string,
  channel: string,
  contentType?: string,
  publishDate?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `ANALYTICS#${contentId}#${channel}`,
  };

  // Add GSI keys for content type analytics aggregation
  if (contentType) {
    keys.GSI1PK = `ANALYTICS#${contentType}`;
  }
  if (publishDate) {
    keys.GSI1SK = `DATE#${publishDate}`;
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
 * GSI1: PK: TEMPLATE#<contentType>, SK: NAME#<name>
 */
export function getTemplateKeys(
  userId: string,
  templateId: string,
  contentType?: string,
  name?: string
): DynamoDBKey & {
  GSI1PK?: string;
  GSI1SK?: string;
} {
  const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
    PK: `USER#${userId}`,
    SK: `TEMPLATE#${templateId}`,
  };

  // Add GSI keys for template discovery and search
  if (contentType) {
    keys.GSI1PK = `TEMPLATE#${contentType}`;
  }
  if (name) {
    keys.GSI1SK = `NAME#${name}`;
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
