/**
 * DynamoDB Type Definitions
 * 
 * Defines TypeScript types for DynamoDB items and operations.
 */

/**
 * Entity types that can be stored in DynamoDB
 */
export type EntityType =
  | 'UserProfile'
  | 'RealEstateAgentProfile'
  | 'AgentProfile'
  | 'Review'
  | 'BrandAudit'
  | 'Competitor'
  | 'ResearchReport'
  | 'Project'
  | 'SavedContent'
  | 'TrainingProgress'
  | 'MarketingPlan'
  | 'ReviewAnalysis'
  | 'OAuthToken'
  | 'PersonalizationProfile'
  | 'ImageMetadata'
  | 'EditRecord'
  | 'RateLimit'
  | 'Citation'
  | 'Conversation'
  | 'WorkflowExecution'
  | 'VisionAnalysis';

/**
 * Base DynamoDB item structure
 * All items in the table follow this pattern
 */
export interface DynamoDBItem<T = any> {
  /** Partition Key */
  PK: string;
  /** Sort Key */
  SK: string;
  /** Entity type for filtering and identification */
  EntityType: EntityType;
  /** The actual data payload */
  Data: T;
  /** Creation timestamp (Unix milliseconds) */
  CreatedAt: number;
  /** Last update timestamp (Unix milliseconds) */
  UpdatedAt: number;
  /** Optional GSI partition key for alternate access patterns */
  GSI1PK?: string;
  /** Optional GSI sort key for alternate access patterns */
  GSI1SK?: string;
}

/**
 * Key structure for DynamoDB operations
 */
export interface DynamoDBKey {
  PK: string;
  SK: string;
}

/**
 * Query options for DynamoDB operations
 */
export interface QueryOptions {
  /** Maximum number of items to return */
  limit?: number;
  /** Exclusive start key for pagination */
  exclusiveStartKey?: DynamoDBKey;
  /** Scan index forward (true = ascending, false = descending) */
  scanIndexForward?: boolean;
  /** Filter expression for additional filtering */
  filterExpression?: string;
  /** Expression attribute values for filter */
  expressionAttributeValues?: Record<string, any>;
  /** Expression attribute names for filter */
  expressionAttributeNames?: Record<string, string>;
}

/**
 * Query result with pagination support
 */
export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: DynamoDBKey;
  count: number;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  items: T[];
  unprocessedKeys?: DynamoDBKey[];
}

/**
 * Update operation options
 */
export interface UpdateOptions {
  /** Condition expression for conditional updates */
  conditionExpression?: string;
  /** Expression attribute values for condition */
  expressionAttributeValues?: Record<string, any>;
  /** Expression attribute names for condition */
  expressionAttributeNames?: Record<string, string>;
}
