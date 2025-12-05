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
  | 'AgentDocument'
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
  | 'VisionAnalysis'
  | 'LoginSession'
  | 'Listing'
  | 'MLSConnection'
  | 'SocialConnection'
  | 'SocialPost'
  | 'PerformanceMetrics'
  | 'Alert'
  | 'AlertSettings'
  | 'NeighborhoodProfile'
  | 'LifeEvent'
  | 'Prospect'
  | 'TrackedCompetitor'
  | 'ListingEvent'
  | 'TrendIndicators'
  | 'TargetArea'
  | 'PriceHistory'
  | 'ListingSnapshot'
  | 'MarketStats'
  | 'PropertyComparison'
  | 'Team'
  | 'TeamMember'
  | 'Organization'
  | 'Invitation'
  | 'FeatureToggle'
  | 'FeatureToggle'
  | 'MeetingPrep'
  | 'SyncOperation'
  | 'NotificationPreferences'
  | 'OpenHouseSession'
  | 'PushToken'
  | 'VoiceRecording'
  | 'ScheduledContent'
  | 'Analytics'
  | 'ABTest'
  | 'Template'
  | 'ROI'
  | 'OptimalTimesCache'
  | 'Feedback'
  | 'Profile'
  | 'RolePlaySession'
  | 'ClientDashboard'
  | 'SecuredLink'
  | 'DashboardView'
  | 'PropertyView'
  | 'DocumentDownload'
  | 'ContactRequest'
  | 'CMAReport'
  | 'HomeValuation'
  | 'ValuationRequest'
  | 'DashboardDocument'
  | 'DashboardAccessLog'
  | 'Organization'
  | 'TeamMember'
  | 'Invitation'
  | 'Notification'
  | 'NotificationPreferences'
  | 'DeliveryRecord'
  | 'NotificationJob'
  | 'NotificationEvent'
  | 'RateLimitCounter'
  | 'RateLimitMetrics'
  | 'RateLimitAlert'
  | 'Testimonial'
  | 'TestimonialRequest'
  | 'SEOAnalysis'
  | 'SavedKeyword'
  | 'ClientInvitation'
  | 'Announcement'
  | 'EditingSession'
  | 'EditSuggestion'
  | 'EditingSummary'
  | 'ContentPerformance'
  | 'SystemConfig'
  | 'SystemConfigHistory'
  | 'OAuthState'
  | 'OpenHouseSession'
  | 'Visitor'
  | 'FollowUpContent'
  | 'FollowUpSequence'
  | 'SequenceEnrollment'
  | 'SessionTemplate'
  | 'SessionPhoto'
  | 'SyncOperation'
  | 'WebhookConfig'
  | 'PropertyShare'
  | 'MobileCapture'
  | 'QuickAction'
  | 'VoiceNote'
  | 'LocationCheckIn'
  | 'Lead'
  | 'LeadInteraction'
  | 'FollowUpReminder'
  | 'ChatSession'
  | 'MemoryEntry'
  | 'HandoffRecord'
  | 'UserPreferences'
  | 'WebhookDeliveryLog'
  | 'AIMention'
  | 'AIVisibilityScore'
  | 'AIMonitoringConfig'
  | 'AIMonitoringJob'
  | 'AIVisibilityAlert'
  | 'WebsiteAnalysis'
  | 'RoleAuditLog'
  | 'AnalyticsEvent'
  | 'AggregatedMetrics'
  | 'SupportTicket'
  | 'TicketMessage'
  | 'FeatureFlag'
  | 'PlatformSetting'
  | 'ContentModeration'
  | 'AdminAuditLog'
  | 'AdminAnnouncement'
  | 'ABTestConfig'
  | 'ABTestAssignment'
  | 'MaintenanceWindow'
  | 'APIKey'
  | 'UserFeedback';

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
  /** Optional GSI1 partition key for alternate access patterns */
  GSI1PK?: string;
  /** Optional GSI1 sort key for alternate access patterns */
  GSI1SK?: string;
  /** Optional GSI2 partition key for content workflow scheduling */
  GSI2PK?: string;
  /** Optional GSI2 sort key for content workflow scheduling */
  GSI2SK?: string;
  /** Optional GSI3 partition key for content workflow analytics */
  GSI3PK?: string;
  /** Optional GSI3 sort key for content workflow analytics */
  GSI3SK?: string;
  /** Optional GSI4 partition key for content workflow templates */
  GSI4PK?: string;
  /** Optional GSI4 sort key for content workflow templates */
  GSI4SK?: string;
  /** Optional Time To Live timestamp (Unix seconds) */
  TTL?: number;
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
  /** Index name for GSI queries */
  indexName?: string;
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
