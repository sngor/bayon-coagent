/**
 * Content Workflow Features - TypeScript Interfaces
 * 
 * Comprehensive type definitions for content scheduling, analytics, templates,
 * A/B testing, and ROI tracking features. All interfaces align with DynamoDB
 * single-table design patterns and follow existing project conventions.
 */

// ==================== Enums ====================

/**
 * Status values for scheduled content
 */
export enum ScheduledContentStatus {
    SCHEDULED = 'scheduled',
    PUBLISHING = 'publishing',
    PUBLISHED = 'published',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

/**
 * Social media and publishing channel types
 */
export enum PublishChannelType {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    BLOG = 'blog',
    NEWSLETTER = 'newsletter'
}

/**
 * Content categories for organization and analytics
 */
export enum ContentCategory {
    BLOG_POST = 'blog_post',
    SOCIAL_MEDIA = 'social_media',
    LISTING_DESCRIPTION = 'listing_description',
    MARKET_UPDATE = 'market_update',
    NEIGHBORHOOD_GUIDE = 'neighborhood_guide',
    VIDEO_SCRIPT = 'video_script',
    NEWSLETTER = 'newsletter',
    EMAIL_TEMPLATE = 'email_template'
}

/**
 * A/B test status values
 */
export enum ABTestStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DRAFT = 'draft'
}

/**
 * ROI event types for attribution tracking
 */
export enum ROIEventType {
    LEAD = 'lead',
    CONVERSION = 'conversion',
    REVENUE = 'revenue',
    CONSULTATION = 'consultation',
    LISTING_INQUIRY = 'listing_inquiry'
}

/**
 * Template permission levels
 */
export enum TemplatePermission {
    VIEW = 'view',
    EDIT = 'edit',
    SHARE = 'share',
    DELETE = 'delete'
}

/**
 * Scheduling pattern types for bulk operations
 */
export enum SchedulingPatternType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    CUSTOM = 'custom'
}

/**
 * Analytics sync status
 */
export enum AnalyticsSyncStatus {
    PENDING = 'pending',
    SYNCING = 'syncing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

// ==================== Core Interfaces ====================

/**
 * Publishing channel configuration
 */
export interface PublishChannel {
    type: PublishChannelType;
    accountId: string;
    accountName: string;
    isActive: boolean;
    lastUsed?: Date;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    permissions?: string[];
}

/**
 * Scheduled content entity
 * DynamoDB Pattern: PK: USER#<userId>, SK: SCHEDULE#<scheduleId>
 */
export interface ScheduledContent {
    id: string;
    userId: string;
    contentId: string;
    title: string;
    content: string;
    contentType: ContentCategory;
    publishTime: Date;
    channels: PublishChannel[];
    status: ScheduledContentStatus;
    metadata?: {
        originalPrompt?: string;
        aiModel?: string;
        generatedAt?: Date;
        tags?: string[];
        mediaUrls?: string[];
        hashtags?: string[];
        htmlContent?: string;
        plainTextContent?: string;
        recipients?: string[];
    };
    publishResults?: PublishResult[];
    retryCount?: number;
    lastRetryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    // DynamoDB GSI keys for efficient querying
    GSI1PK?: string; // SCHEDULE#<status>
    GSI1SK?: string; // TIME#<publishTime>
}

/**
 * Publishing result for tracking success/failure per channel
 */
export interface PublishResult {
    channel: PublishChannel;
    success: boolean;
    platformPostId?: string;
    publishedUrl?: string;
    error?: string;
    publishedAt?: Date;
    metrics?: {
        initialViews?: number;
        initialLikes?: number;
        initialShares?: number;
    };
}

/**
 * Analytics data entity
 * DynamoDB Pattern: PK: USER#<userId>, SK: ANALYTICS#<contentId>#<channel>
 */
export interface Analytics {
    id: string;
    userId: string;
    contentId: string;
    contentType: ContentCategory;
    channel: PublishChannelType;
    publishedAt: Date;
    metrics: EngagementMetrics;
    platformMetrics?: Record<string, any>; // Platform-specific raw data
    lastSynced: Date;
    syncStatus: AnalyticsSyncStatus;
    // DynamoDB GSI keys
    GSI1PK?: string; // ANALYTICS#<contentType>
    GSI1SK?: string; // DATE#<publishDate>
}

/**
 * Standardized engagement metrics across all platforms
 */
export interface EngagementMetrics {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    saves?: number;
    engagementRate: number;
    reach?: number;
    impressions?: number;
}

/**
 * A/B test entity
 * DynamoDB Pattern: PK: USER#<userId>, SK: ABTEST#<testId>
 */
export interface ABTest {
    id: string;
    userId: string;
    name: string;
    description?: string;
    contentType: ContentCategory;
    variations: ContentVariation[];
    status: ABTestStatus;
    startedAt: Date;
    completedAt?: Date;
    targetMetric: keyof EngagementMetrics;
    minimumSampleSize: number;
    confidenceLevel: number; // e.g., 0.95 for 95%
    results?: ABTestResults;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Individual variation in an A/B test
 */
export interface ContentVariation {
    id: string;
    name: string;
    content: string;
    contentId?: string; // Reference to actual content if published
    metrics?: EngagementMetrics;
    sampleSize?: number;
}

/**
 * A/B test results with statistical analysis
 */
export interface ABTestResults {
    testId: string;
    variations: VariationResults[];
    winner?: string; // Variation ID
    confidence: number;
    statisticalSignificance: boolean;
    pValue?: number;
    effectSize?: number;
    recommendedAction: string;
    calculatedAt: Date;
}

/**
 * Results for individual variation
 */
export interface VariationResults {
    variationId: string;
    name: string;
    metrics: EngagementMetrics;
    sampleSize: number;
    conversionRate: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    isWinner: boolean;
}

/**
 * ROI tracking entity
 * DynamoDB Pattern: PK: USER#<userId>, SK: ROI#<contentId>#<eventId>
 */
export interface ROI {
    id: string;
    userId: string;
    contentId: string;
    contentType: ContentCategory;
    eventType: ROIEventType;
    value: number; // Monetary value or lead score
    currency?: string; // Default: USD
    attribution: AttributionData;
    clientInfo?: {
        clientId?: string;
        clientName?: string;
        contactInfo?: string;
    };
    conversionPath?: ConversionStep[];
    occurredAt: Date;
    createdAt: Date;
}

/**
 * Attribution data for ROI tracking
 */
export interface AttributionData {
    isDirect: boolean; // Last-touch attribution
    isAssisted: boolean; // Multi-touch attribution
    touchPoints: TouchPoint[];
    attributionModel: 'first-touch' | 'last-touch' | 'linear' | 'time-decay';
    attributionWeight: number; // 0-1, portion of credit for this content
}

/**
 * Individual touch point in conversion path
 */
export interface TouchPoint {
    contentId: string;
    channel: PublishChannelType;
    touchedAt: Date;
    interactionType: 'view' | 'click' | 'share' | 'comment' | 'save';
}

/**
 * Conversion step in customer journey
 */
export interface ConversionStep {
    step: string;
    completedAt: Date;
    value?: number;
    notes?: string;
}

/**
 * Template entity
 * DynamoDB Pattern: PK: USER#<userId>, SK: TEMPLATE#<templateId>
 */
export interface Template {
    id: string;
    userId: string;
    name: string;
    description: string;
    contentType: ContentCategory;
    configuration: TemplateConfiguration;
    isShared: boolean;
    brokerageId?: string;
    permissions?: TemplatePermissions;
    isSeasonal: boolean;
    seasonalTags?: string[];
    usageCount: number;
    lastUsed?: Date;
    previewImage?: string;
    createdAt: Date;
    updatedAt: Date;
    // DynamoDB GSI keys
    GSI1PK?: string; // TEMPLATE#<contentType>
    GSI1SK?: string; // NAME#<name>
}

/**
 * Template configuration with all customizable parameters
 */
export interface TemplateConfiguration {
    promptParameters: Record<string, any>;
    contentStructure: {
        sections: string[];
        format: string;
        wordCount?: number;
        includeImages?: boolean;
        includeHashtags?: boolean;
    };
    stylePreferences: {
        tone: string;
        length: string;
        keywords: string[];
        targetAudience?: string;
        callToAction?: string;
    };
    brandingElements?: {
        includeLogo?: boolean;
        includeContactInfo?: boolean;
        includeDisclaimer?: boolean;
        colorScheme?: string;
    };
    schedulingDefaults?: {
        preferredChannels?: PublishChannelType[];
        optimalTimes?: OptimalTime[];
    };
}

/**
 * Template permissions for team sharing
 */
export interface TemplatePermissions {
    canView: string[]; // User IDs
    canEdit: string[]; // User IDs  
    canShare: string[]; // User IDs
    canDelete: string[]; // User IDs
    isPublic?: boolean;
    brokerageAccess?: {
        brokerageId: string;
        permissions: TemplatePermission[];
    };
}

// ==================== Scheduling Interfaces ====================

/**
 * Bulk scheduling configuration
 */
export interface BulkScheduleRequest {
    userId: string;
    items: BulkScheduleItem[];
    pattern: SchedulingPattern;
    channels: PublishChannel[];
    conflictResolution?: 'skip' | 'reschedule' | 'override';
}

/**
 * Individual item in bulk scheduling
 */
export interface BulkScheduleItem {
    contentId: string;
    title: string;
    content: string;
    contentType: ContentCategory;
    priority?: number; // 1-5, for conflict resolution
    customTime?: Date; // Override pattern for specific item
}

/**
 * Scheduling pattern for bulk operations
 */
export interface SchedulingPattern {
    type: SchedulingPatternType;
    interval?: number; // Days between posts
    daysOfWeek?: number[]; // 0-6, Sunday=0
    timeOfDay?: string; // HH:MM format
    startDate: Date;
    endDate?: Date;
    excludeWeekends?: boolean;
    excludeHolidays?: boolean;
    customDates?: Date[]; // Specific dates for custom pattern
}

/**
 * Optimal posting time recommendation
 */
export interface OptimalTime {
    time: string; // HH:MM format
    dayOfWeek: number; // 0-6, Sunday=0
    expectedEngagement: number; // Predicted engagement score
    confidence: number; // 0-1, confidence in prediction
    historicalData: {
        sampleSize: number;
        avgEngagement: number;
        lastCalculated: Date;
    };
}

/**
 * Calendar content for display
 */
export interface CalendarContent {
    date: Date;
    items: ScheduledContent[];
    hasConflicts: boolean;
    totalItems: number;
    channelBreakdown: Record<PublishChannelType, number>;
}

// ==================== Analytics Interfaces ====================

/**
 * Analytics aggregation by content type
 */
export interface TypeAnalytics {
    contentType: ContentCategory;
    totalPublished: number;
    avgEngagement: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    engagementRate: number;
    topPerforming: ContentSummary[];
    trendData: TrendDataPoint[];
    lastUpdated: Date;
}

/**
 * Content summary for analytics display
 */
export interface ContentSummary {
    contentId: string;
    title: string;
    contentType: ContentCategory;
    publishedAt: Date;
    totalEngagement: number;
    engagementRate: number;
    topChannel: PublishChannelType;
}

/**
 * Trend data point for time series analysis
 */
export interface TrendDataPoint {
    date: Date;
    value: number;
    metric: keyof EngagementMetrics;
}

/**
 * ROI analytics aggregation
 */
export interface ROIAnalytics {
    totalRevenue: number;
    totalLeads: number;
    totalConversions: number;
    costPerLead: number;
    conversionRate: number;
    averageOrderValue: number;
    returnOnAdSpend: number;
    byContentType: Record<ContentCategory, ROIMetrics>;
    byChannel: Record<PublishChannelType, ROIMetrics>;
    topPerformingContent: ContentROI[];
    conversionFunnel: FunnelStep[];
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    lastUpdated: Date;
}

/**
 * ROI metrics for specific segment
 */
export interface ROIMetrics {
    revenue: number;
    leads: number;
    conversions: number;
    cost: number;
    roi: number; // Return on Investment percentage
    roas: number; // Return on Ad Spend
    cpl: number; // Cost Per Lead
    cpa: number; // Cost Per Acquisition
}

/**
 * Content ROI performance
 */
export interface ContentROI {
    contentId: string;
    title: string;
    contentType: ContentCategory;
    publishedAt: Date;
    totalRevenue: number;
    totalLeads: number;
    roi: number;
    attribution: 'direct' | 'assisted' | 'mixed';
}

/**
 * Conversion funnel step
 */
export interface FunnelStep {
    step: string;
    count: number;
    conversionRate: number;
    dropOffRate: number;
}

// ==================== External Integration Interfaces ====================

/**
 * Social media analytics sync result
 */
export interface SyncResult {
    channel: PublishChannelType;
    success: boolean;
    itemsSynced: number;
    errors: string[];
    lastSyncTime: Date;
    nextSyncTime: Date;
    rateLimitStatus?: {
        remaining: number;
        resetTime: Date;
    };
}

/**
 * External analytics API response
 */
export interface ExternalAnalyticsData {
    platform: PublishChannelType;
    postId: string;
    metrics: Record<string, number>;
    rawData: Record<string, any>;
    retrievedAt: Date;
}

// ==================== UI/UX Interfaces ====================

/**
 * Calendar view configuration
 */
export interface CalendarViewConfig {
    viewMode: 'month' | 'week' | 'day';
    startDate: Date;
    endDate: Date;
    filters: {
        channels?: PublishChannelType[];
        contentTypes?: ContentCategory[];
        status?: ScheduledContentStatus[];
    };
    groupBy?: 'channel' | 'type' | 'status';
}

/**
 * Analytics dashboard configuration
 */
export interface AnalyticsDashboardConfig {
    dateRange: {
        start: Date;
        end: Date;
    };
    metrics: (keyof EngagementMetrics)[];
    groupBy: 'day' | 'week' | 'month';
    compareWith?: {
        start: Date;
        end: Date;
    };
    filters: {
        contentTypes?: ContentCategory[];
        channels?: PublishChannelType[];
    };
}

/**
 * Template browser configuration
 */
export interface TemplateBrowserConfig {
    contentType?: ContentCategory;
    isSeasonal?: boolean;
    isShared?: boolean;
    sortBy: 'name' | 'created' | 'usage' | 'updated';
    sortOrder: 'asc' | 'desc';
    searchQuery?: string;
    tags?: string[];
}

// ==================== Error and Response Interfaces ====================

/**
 * Standard API response wrapper
 */
export interface ContentWorkflowResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: string[];
    message?: string;
    timestamp: Date;
}

/**
 * Validation error details
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}

/**
 * Scheduling conflict details
 */
export interface SchedulingConflict {
    contentId: string;
    requestedTime: Date;
    conflictingItems: ScheduledContent[];
    suggestedTimes: Date[];
    resolution: 'manual' | 'auto-reschedule' | 'skip';
}

// ==================== Utility Types ====================

/**
 * Partial update type for entities
 */
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'userId' | 'createdAt'>> & {
    updatedAt: Date;
};

/**
 * Query filters for content workflow entities
 */
export interface ContentWorkflowFilters {
    userId: string;
    startDate?: Date;
    endDate?: Date;
    contentTypes?: ContentCategory[];
    channels?: PublishChannelType[];
    status?: ScheduledContentStatus | ABTestStatus;
    limit?: number;
    offset?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}