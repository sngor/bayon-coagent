/**
 * Open House Enhancement Types
 * 
 * TypeScript interfaces and enums for the Open House management system.
 * Validates Requirements: 1.1, 2.1, 3.1, 14.1, 15.1
 */

// ============================================================================
// Enums
// ============================================================================

export enum SessionStatus {
    SCHEDULED = "scheduled",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

export enum InterestLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

export enum CheckInSource {
    MANUAL = "manual",
    QR = "qr",
}

export enum FollowUpType {
    EMAIL = "email",
    SMS = "sms",
}

export enum DeliveryStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed",
}

export enum SyncOperationType {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
}

export enum SyncOperationEntity {
    SESSION = "session",
    VISITOR = "visitor",
    FOLLOWUP = "followup",
    PHOTO = "photo",
}

export enum SyncOperationStatus {
    PENDING = "pending",
    SYNCED = "synced",
    FAILED = "failed",
}

export enum FlyerTemplate {
    MODERN = "modern",
    CLASSIC = "classic",
    LUXURY = "luxury",
}

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Open House Session
 * Represents a time-bound open house event for a specific property
 */
export interface OpenHouseSession {
    sessionId: string;
    userId: string;
    propertyId?: string;
    propertyAddress: string;
    scheduledDate: string; // ISO 8601
    scheduledStartTime: string; // ISO 8601
    scheduledEndTime?: string; // ISO 8601
    actualStartTime?: string; // ISO 8601
    actualEndTime?: string; // ISO 8601
    status: SessionStatus;
    qrCodeUrl: string;
    visitorCount: number;
    interestLevelDistribution: InterestLevelDistribution;
    photos: SessionPhoto[];
    notes?: string;
    templateId?: string; // Reference to template used
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Interest Level Distribution
 * Tracks count of visitors by interest level
 */
export interface InterestLevelDistribution {
    high: number;
    medium: number;
    low: number;
}

/**
 * Visitor
 * Represents an individual who attended an open house session
 */
export interface Visitor {
    visitorId: string;
    sessionId: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    interestLevel: InterestLevel;
    notes?: string;
    checkInTime: string; // ISO 8601
    followUpGenerated: boolean;
    followUpSent: boolean;
    followUpSentAt?: string; // ISO 8601
    source: CheckInSource;
    sequenceEnrollmentId?: string; // Reference to follow-up sequence enrollment
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Follow-up Content
 * AI-generated personalized follow-up communications for a visitor
 */
export interface FollowUpContent {
    contentId: string;
    sessionId: string;
    visitorId: string;
    userId: string;
    emailSubject: string;
    emailBody: string;
    smsMessage: string;
    nextSteps: string[];
    photoIds?: string[]; // IDs of photos to include in follow-up
    generatedAt: string; // ISO 8601
    sentAt?: string; // ISO 8601
    deliveryStatus?: DeliveryStatus;
    openedAt?: string; // ISO 8601
    clickedAt?: string; // ISO 8601
}

/**
 * Follow-up Sequence
 * Automated multi-touchpoint follow-up campaign configuration
 */
export interface FollowUpSequence {
    sequenceId: string;
    userId: string;
    name: string;
    description?: string;
    interestLevel: InterestLevel | "all";
    touchpoints: FollowUpTouchpoint[];
    active: boolean;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Follow-up Touchpoint
 * Individual step in a follow-up sequence
 */
export interface FollowUpTouchpoint {
    touchpointId: string;
    order: number;
    delayMinutes: number; // Delay from previous touchpoint (or check-in for first)
    type: FollowUpType;
    templatePrompt: string; // Prompt for AI generation
}

/**
 * Sequence Enrollment
 * Tracks a visitor's enrollment in a follow-up sequence
 */
export interface SequenceEnrollment {
    enrollmentId: string;
    sequenceId: string;
    visitorId: string;
    sessionId: string;
    userId: string;
    currentTouchpointIndex: number;
    nextTouchpointAt?: string; // ISO 8601
    paused: boolean;
    completedAt?: string; // ISO 8601
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Session Template
 * Reusable configuration for creating open house sessions
 */
export interface SessionTemplate {
    templateId: string;
    userId: string;
    name: string;
    description?: string;
    propertyType?: string;
    typicalDuration: number; // Minutes
    customFields: Record<string, any>;
    usageCount: number;
    averageVisitors?: number;
    averageInterestLevel?: number;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Session Photo
 * Photo captured during an open house session
 */
export interface SessionPhoto {
    photoId: string;
    s3Key: string;
    url: string;
    aiDescription?: string;
    capturedAt: string; // ISO 8601
}

/**
 * Sync Operation
 * Queued operation for offline sync
 */
export interface SyncOperation {
    operationId: string;
    userId: string;
    type: SyncOperationType;
    entity: SyncOperationEntity;
    data: any;
    timestamp: string; // ISO 8601
    status: SyncOperationStatus;
    retryCount: number;
    error?: string;
}

// ============================================================================
// Analytics Models
// ============================================================================

/**
 * Session Analytics
 * Detailed analytics for a single session
 */
export interface SessionAnalytics {
    sessionId: string;
    totalVisitors: number;
    interestLevelDistribution: InterestLevelDistribution;
    averageInterestLevel: number;
    checkInTimeline: CheckInTimelinePoint[];
    peakCheckInTime?: string; // ISO 8601
    duration: number; // Minutes
    followUpsSent: number;
    followUpResponseRate: number;
}

/**
 * Check-in Timeline Point
 * Single point in the check-in timeline
 */
export interface CheckInTimelinePoint {
    timestamp: string; // ISO 8601
    cumulativeCount: number;
    interestLevel: InterestLevel;
}

/**
 * Dashboard Analytics
 * Aggregate analytics across multiple sessions
 */
export interface DashboardAnalytics {
    totalSessions: number;
    totalVisitors: number;
    averageVisitorsPerSession: number;
    averageInterestLevel: number;
    trends: AnalyticsTrends;
    topPerformingProperties: PropertyPerformance[];
}

/**
 * Analytics Trends
 * Trend data over time
 */
export interface AnalyticsTrends {
    visitorCounts: TrendDataPoint[];
    interestLevels: TrendDataPoint[];
    conversionMetrics: TrendDataPoint[];
}

/**
 * Trend Data Point
 * Single data point in a trend
 */
export interface TrendDataPoint {
    date: string; // ISO 8601
    value: number;
}

/**
 * Property Performance
 * Performance metrics for a specific property
 */
export interface PropertyPerformance {
    propertyAddress: string;
    sessionCount: number;
    totalVisitors: number;
    averageInterestLevel: number;
}

// ============================================================================
// Marketing Models
// ============================================================================

/**
 * Flyer Options
 * Configuration for generating open house flyers
 */
export interface FlyerOptions {
    includeQRCode: boolean;
    includePropertyImages: boolean;
    template: FlyerTemplate;
    brandColors?: BrandColors;
}

/**
 * Brand Colors
 * Agent's brand color configuration
 */
export interface BrandColors {
    primary: string;
    secondary: string;
}

/**
 * Email Invite Options
 * Configuration for generating email invitations
 */
export interface EmailInviteOptions {
    includeCalendarAttachment: boolean;
    includeRSVPLink: boolean;
    personalMessage?: string;
}

/**
 * Social Post
 * Generated social media post for a platform
 */
export interface SocialPost {
    platform: string;
    content: string;
    hashtags: string[];
    imageUrl?: string;
}

// ============================================================================
// Input Models (for validation)
// ============================================================================

/**
 * Create Open House Session Input
 */
export interface CreateOpenHouseSessionInput {
    propertyId?: string;
    propertyAddress: string;
    scheduledDate: string; // ISO 8601 date
    scheduledStartTime: string; // ISO 8601
    scheduledEndTime?: string; // ISO 8601
    notes?: string;
    templateId?: string;
}

/**
 * Update Open House Session Input
 */
export interface UpdateOpenHouseSessionInput {
    propertyAddress?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    notes?: string;
}

/**
 * Check-in Visitor Input
 */
export interface CheckInVisitorInput {
    name: string;
    email: string;
    phone: string;
    interestLevel: InterestLevel;
    notes?: string;
    source: CheckInSource;
}

/**
 * Update Visitor Input
 */
export interface UpdateVisitorInput {
    name?: string;
    email?: string;
    phone?: string;
    interestLevel?: InterestLevel;
    notes?: string;
}

/**
 * Create Follow-up Sequence Input
 */
export interface CreateFollowUpSequenceInput {
    name: string;
    description?: string;
    interestLevel: InterestLevel | "all";
    touchpoints: CreateFollowUpTouchpointInput[];
}

/**
 * Create Follow-up Touchpoint Input
 */
export interface CreateFollowUpTouchpointInput {
    order: number;
    delayMinutes: number;
    type: FollowUpType;
    templatePrompt: string;
}

/**
 * Update Follow-up Sequence Input
 */
export interface UpdateFollowUpSequenceInput {
    name?: string;
    description?: string;
    interestLevel?: InterestLevel | "all";
    touchpoints?: CreateFollowUpTouchpointInput[];
    active?: boolean;
}

/**
 * Create Session Template Input
 */
export interface CreateSessionTemplateInput {
    name: string;
    description?: string;
    propertyType?: string;
    typicalDuration: number;
    customFields?: Record<string, any>;
}

/**
 * Update Session Template Input
 */
export interface UpdateSessionTemplateInput {
    name?: string;
    description?: string;
    propertyType?: string;
    typicalDuration?: number;
    customFields?: Record<string, any>;
}

/**
 * Analytics Filters
 */
export interface AnalyticsFilters {
    startDate?: string; // ISO 8601
    endDate?: string; // ISO 8601
    propertyId?: string;
    status?: SessionStatus;
}

/**
 * Generate Follow-up Input
 */
export interface GenerateFollowUpInput {
    sessionId: string;
    visitorId: string;
}

/**
 * Send Follow-up Input
 */
export interface SendFollowUpInput {
    sessionId: string;
    visitorId: string;
    contentId: string;
}

/**
 * Upload Session Photo Input
 */
export interface UploadSessionPhotoInput {
    sessionId: string;
    file: File | Buffer;
    capturedAt?: string; // ISO 8601
}

/**
 * Webhook Configuration
 */
export interface WebhookConfiguration {
    webhookId: string;
    userId: string;
    url: string;
    events: WebhookEvent[];
    active: boolean;
    secret?: string;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Webhook Event Types
 */
export enum WebhookEvent {
    VISITOR_CHECKED_IN = "visitor.checked_in",
    SESSION_STARTED = "session.started",
    SESSION_ENDED = "session.ended",
    FOLLOW_UP_SENT = "followup.sent",
}

/**
 * Webhook Delivery Log
 */
export interface WebhookDeliveryLog {
    deliveryId: string;
    webhookId: string;
    event: WebhookEvent;
    payload: any;
    status: "success" | "failed";
    attempts: number;
    lastAttemptAt: string; // ISO 8601
    error?: string;
    createdAt: string; // ISO 8601
}

// ============================================================================
// Response Models
// ============================================================================

/**
 * Action Response
 * Standard response format for server actions
 */
export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
    code?: string;
    offline?: boolean;
}

/**
 * Session Summary
 * Summary generated when a session ends
 */
export interface SessionSummary {
    sessionId: string;
    totalVisitors: number;
    interestLevelDistribution: InterestLevelDistribution;
    duration: number; // Minutes
    averageInterestLevel: number;
    followUpsGenerated: number;
    followUpsSent: number;
}

/**
 * Follow-up Result
 * Result of generating follow-up for a single visitor
 */
export interface FollowUpResult {
    visitorId: string;
    success: boolean;
    contentId?: string;
    error?: string;
}

/**
 * Sync Result
 * Result of syncing a single offline operation
 */
export interface SyncResult {
    operationId: string;
    success: boolean;
    timestamp: string; // ISO 8601
    error?: string;
}

/**
 * Export Result
 * Result of exporting session data
 */
export interface ExportResult {
    url: string;
    expiresAt: string; // ISO 8601
}
