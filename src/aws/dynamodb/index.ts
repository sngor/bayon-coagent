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

// Key generation functions
export {
  getUserProfileKeys,
  getAgentProfileKeys,
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
  getUserItemPrefix,
  extractUserIdFromPK,
  extractEntityIdFromSK,
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
