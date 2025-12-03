/**
 * Integration & Automation Types
 * 
 * Type definitions for social media scheduling, CRM integration,
 * campaign generation, and analytics integration.
 */

/**
 * Social Media Post
 */
export interface SocialMediaPost {
    id?: string;
    userId: string;
    content: string;
    platform: SocialMediaPlatform;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    metadata?: Record<string, any>;
    createdAt?: string;
}

/**
 * Supported social media platforms
 */
export type SocialMediaPlatform =
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'linkedin'
    | 'youtube'
    | 'tiktok';

/**
 * Scheduled post with timing information
 */
export interface ScheduledPost {
    id: string;
    userId: string;
    post: SocialMediaPost;
    scheduledTime: Date;
    platforms: SocialMediaPlatform[];
    status: ScheduleStatus;
    createdAt: string;
    updatedAt: string;
    postedAt?: string;
    error?: string;
}

/**
 * Schedule status
 */
export type ScheduleStatus =
    | 'pending'
    | 'scheduled'
    | 'posting'
    | 'posted'
    | 'failed'
    | 'cancelled';

/**
 * Post result after publishing
 */
export interface PostResult {
    platform: SocialMediaPlatform;
    success: boolean;
    postId?: string;
    url?: string;
    error?: string;
    timestamp: string;
}

/**
 * Optimal time recommendation
 */
export interface OptimalTimeRecommendation {
    recommendedTime: Date;
    confidence: number;
    reasoning: string;
    alternativeTimes: Date[];
    historicalData: {
        averageEngagement: number;
        bestPerformingHour: number;
        bestPerformingDay: string;
    };
}

/**
 * Client data from CRM
 */
export interface ClientData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    preferences?: Record<string, any>;
    history?: ClientInteraction[];
    tags?: string[];
    customFields?: Record<string, any>;
}

/**
 * Client interaction record
 */
export interface ClientInteraction {
    id: string;
    type: 'email' | 'call' | 'meeting' | 'property_view' | 'other';
    date: string;
    notes?: string;
    outcome?: string;
}

/**
 * Activity record for CRM sync
 */
export interface ActivityRecord {
    userId: string;
    clientId?: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

/**
 * Email campaign
 */
export interface EmailCampaign {
    id: string;
    userId: string;
    name: string;
    emails: CampaignEmail[];
    status: CampaignStatus;
    createdAt: string;
    startDate?: string;
    completedAt?: string;
}

/**
 * Campaign status
 */
export type CampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled';

/**
 * Individual email in a campaign
 */
export interface CampaignEmail {
    id: string;
    sequence: number;
    subject: string;
    content: string;
    delayDays: number;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
}

/**
 * Analytics data
 */
export interface AnalyticsData {
    contentId: string;
    platform: string;
    metrics: {
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        engagementRate: number;
        reachRate?: number;
        clickThroughRate?: number;
    };
    demographics?: {
        ageGroups?: Record<string, number>;
        locations?: Record<string, number>;
        devices?: Record<string, number>;
    };
    timestamp: string;
}

/**
 * Workflow definition
 */
export interface Workflow {
    id: string;
    userId: string;
    name: string;
    steps: WorkflowStep[];
    status: 'active' | 'paused' | 'completed';
    createdAt: string;
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
    id: string;
    type: 'generate' | 'review' | 'schedule' | 'post' | 'analyze';
    config: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    completedAt?: string;
    error?: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
    totalPending: number;
    totalScheduled: number;
    nextPostTime?: Date;
    platformBreakdown: Record<SocialMediaPlatform, number>;
}
