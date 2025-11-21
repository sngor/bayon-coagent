/**
 * Notification Types for Market Intelligence Alerts
 * 
 * Defines TypeScript types for notification preferences, templates,
 * and digest generation.
 */

import { Alert, AlertType } from './types';

// ==================== Notification Preferences ====================

export interface NotificationPreferences {
    userId: string;
    emailNotifications: boolean;
    emailAddress?: string;
    frequency: 'real-time' | 'daily' | 'weekly';
    digestTime?: string; // HH:MM format for daily/weekly digests
    enabledAlertTypes: AlertType[];
    quietHours?: {
        enabled: boolean;
        startTime: string; // HH:MM format
        endTime: string; // HH:MM format
        timezone: string;
    };
    updatedAt: string;
}

// ==================== Email Templates ====================

export interface EmailTemplateData {
    // Common template variables
    agentName: string;
    agentEmail: string;
    agentPhone?: string;
    agentBranding?: {
        logoUrl?: string;
        companyName?: string;
        website?: string;
    };

    // Alert-specific data
    alert?: Alert;
    alerts?: Alert[];

    // Digest-specific data
    digestDate?: string;
    totalAlerts?: number;
    highPriorityCount?: number;
    alertsByType?: Record<AlertType, number>;

    // Unsubscribe data
    unsubscribeUrl?: string;
    preferencesUrl?: string;
}

export interface EmailTemplate {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    description: string;
    variables: string[]; // List of template variables used
}

// ==================== Digest Generation ====================

export interface DigestData {
    userId: string;
    period: 'daily' | 'weekly';
    startDate: string;
    endDate: string;
    alerts: Alert[];
    summary: {
        totalCount: number;
        highPriorityCount: number;
        countsByType: Record<AlertType, number>;
        countsByPriority: Record<string, number>;
    };
    generatedAt: string;
}

export interface DigestEmail {
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    templateData: EmailTemplateData;
}

// ==================== Notification Queue ====================

export interface NotificationJob {
    id: string;
    userId: string;
    type: 'real-time' | 'digest';
    alertIds: string[];
    scheduledFor: string;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    attempts: number;
    maxAttempts: number;
    createdAt: string;
    processedAt?: string;
    error?: string;
}

// ==================== Notification Settings ====================

export interface NotificationSettings {
    userId: string;
    preferences: NotificationPreferences;
    templates: {
        realTime: string; // Template name for real-time notifications
        dailyDigest: string; // Template name for daily digest
        weeklyDigest: string; // Template name for weekly digest
    };
    fromEmail: string; // Verified sender email address
    replyToEmail?: string;
    updatedAt: string;
}

// ==================== Notification Events ====================

export interface NotificationEvent {
    id: string;
    userId: string;
    type: 'email_sent' | 'email_failed' | 'email_bounced' | 'email_complained';
    alertId?: string;
    jobId?: string;
    messageId?: string;
    email: string;
    timestamp: string;
    details?: Record<string, any>;
}

// ==================== Template Variables ====================

export interface AlertTemplateVariables {
    // Life Event Alert Variables
    prospectLocation?: string;
    eventType?: string;
    eventDate?: string;
    leadScore?: number;
    recommendedAction?: string;

    // Competitor Alert Variables
    competitorName?: string;
    propertyAddress?: string;
    listingPrice?: number;
    originalPrice?: number;
    newPrice?: number;
    priceReduction?: number;
    priceReductionPercent?: number;
    daysOnMarket?: number;

    // Neighborhood Trend Variables
    neighborhood?: string;
    trendType?: string;
    currentValue?: number;
    previousValue?: number;
    changePercent?: number;

    // Property Details Variables
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    propertyType?: string;
}

// ==================== Notification Delivery ====================

export interface NotificationDelivery {
    id: string;
    userId: string;
    jobId: string;
    email: string;
    messageId?: string;
    status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
    sentAt: string;
    deliveredAt?: string;
    error?: string;
    metadata?: Record<string, any>;
}

// ==================== Notification Analytics ====================

export interface NotificationAnalytics {
    userId: string;
    period: string; // YYYY-MM format
    totalSent: number;
    totalDelivered: number;
    totalBounced: number;
    totalComplaints: number;
    deliveryRate: number; // percentage
    bounceRate: number; // percentage
    complaintRate: number; // percentage
    byType: Record<AlertType, {
        sent: number;
        delivered: number;
        bounced: number;
        complaints: number;
    }>;
    calculatedAt: string;
}

// ==================== Unsubscribe Management ====================

export interface UnsubscribeRecord {
    userId: string;
    email: string;
    alertTypes: AlertType[]; // Empty array means unsubscribed from all
    unsubscribedAt: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

// ==================== Notification Validation ====================

export interface NotificationValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// ==================== Helper Types ====================

export type NotificationFrequency = 'real-time' | 'daily' | 'weekly';
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed';
export type DeliveryStatus = 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
export type NotificationEventType = 'email_sent' | 'email_failed' | 'email_bounced' | 'email_complained';

// ==================== API Response Types ====================

export interface NotificationResponse {
    success: boolean;
    messageId?: string;
    jobId?: string;
    error?: string;
}

export interface DigestResponse {
    success: boolean;
    digestId?: string;
    emailsSent: number;
    errors: string[];
}

export interface NotificationStatsResponse {
    totalNotifications: number;
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
    byType: Record<AlertType, number>;
}