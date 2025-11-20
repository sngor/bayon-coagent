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
