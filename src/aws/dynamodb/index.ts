/**
 * DynamoDB Module
 * 
 * Central export point for all DynamoDB-related functionality.
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

// Key generation functions
export {
  getUserProfileKeys,
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
  getTestimonialKeys,
  getTestimonialRequestKeys,
  getSEOAnalysisKeys,
  getSavedKeywordKeys,
  getClientDashboardKeys,
  getSecuredLinkKeys,
  getDashboardAnalyticsKeys,
  getCMAReportKeys,
  getDashboardDocumentKeys,
  getDocumentDownloadLogKeys,
  getRoleAuditKeys,
} from './keys';

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
