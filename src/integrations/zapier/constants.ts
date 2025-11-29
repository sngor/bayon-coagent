/**
 * Zapier Integration Constants
 */

/**
 * Zapier API Endpoints
 */
export const ZAPIER_ENDPOINTS = {
    auth: 'https://zapier.com/oauth/authorize',
    token: 'https://zapier.com/oauth/token',
    api: 'https://api.zapier.com/v1'
} as const;

/**
 * OAuth Scopes
 */
export const ZAPIER_SCOPES = [
    'zap:read',
    'zap:write',
    'profile:read'
] as const;

/**
 * Webhook Configuration
 */
export const WEBHOOK_CONFIG = {
    maxPayloadSize: 1024 * 1024, // 1MB
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
} as const;

/**
 * Trigger Event Names (mapped to our internal events)
 */
export const TRIGGER_EVENT_NAMES: Record<string, string> = {
    'client.created': 'New Client Added',
    'client.updated': 'Client Information Updated',
    'property.listed': 'Property Listed',
    'lead.captured': 'New Lead Captured',
    'deal.closed': 'Deal Closed',
    'review.received': 'Review Received',
    'openhouse.scheduled': 'Open House Scheduled',
    'document.uploaded': 'Document Uploaded',
    'analytics.milestone': 'Analytics Milestone Reached',
    'feedback.submitted': 'User Feedback Submitted'
} as const;

/**
 * Rate Limiting
 */
export const RATE_LIMITS = {
    webhooksPerMinute: 60,
    actionsPerMinute: 100,
    burstLimit: 20
} as const;
