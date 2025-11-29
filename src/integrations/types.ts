/**
 * Core Integration Types
 * 
 * Defines the base types and interfaces for the integration service architecture.
 * Supports multiple integration categories: social media, email marketing, SMS, calendar, and CRM.
 */

import { z } from 'zod';

/**
 * Integration Categories
 */
export type IntegrationType =
    | 'social'      // Social media platforms
    | 'email'       // Email marketing services
    | 'sms'         // SMS/messaging services
    | 'calendar'    // Calendar services
    | 'crm'         // CRM systems
    | 'analytics'   // Analytics platforms
    | 'automation'  // Automation platforms (Zapier, Make, etc.)
    | 'design'      // Design tools (Canva, Figma, etc.)
    | 'real-estate'; // Real estate data providers

/**
 * Integration Providers
 */
export type IntegrationProvider =
    // Social Media (existing)
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    // Email Marketing
    | 'mailchimp'
    | 'sendgrid'
    | 'mailgun'
    // SMS
    | 'twilio'
    // Calendar
    | 'google-calendar'
    | 'outlook-calendar'
    // CRM
    | 'hubspot'
    | 'salesforce'
    | 'followupboss'
    // Automation
    | 'zapier'
    // Design
    | 'canva'
    // Analytics
    | 'google-analytics'
    // Real Estate
    | 'zillow';

/**
 * Authentication Methods
 */
export type AuthMethod =
    | 'oauth2'      // OAuth 2.0 flow
    | 'api_key'     // API Key authentication
    | 'basic'       // HTTP Basic auth
    | 'token';      // Bearer token

/**
 * Integration Status
 */
export type IntegrationStatus =
    | 'active'      // Connected and working
    | 'inactive'    // Disconnected
    | 'error'       // Connection error
    | 'expired'     // Credentials expired
    | 'pending';    // OAuth flow in progress

/**
 * Base Integration Interface
 */
export interface BaseIntegration {
    provider: IntegrationProvider;
    type: IntegrationType;
    authMethod: AuthMethod;
    name: string;
    description: string;
    iconUrl?: string;
}

/**
 * Integration Configuration
 */
export interface IntegrationConfig {
    provider: IntegrationProvider;
    type: IntegrationType;
    authMethod: AuthMethod;
    // OAuth 2.0 Config
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scopes?: string[];
    authUrl?: string;
    tokenUrl?: string;
    // API Key Config
    apiKey?: string;
    apiSecret?: string;
    // Additional Config
    baseUrl?: string;
    metadata?: Record<string, any>;
}

/**
 * Integration Credentials (encrypted in storage)
 */
export interface IntegrationCredentials {
    provider: IntegrationProvider;
    authMethod: AuthMethod;
    // OAuth 2.0 Credentials
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string[];
    // API Key Credentials
    apiKey?: string;
    apiSecret?: string;
    // Additional Credentials
    accountId?: string;
    metadata?: Record<string, any>;
}

/**
 * Integration Connection (stored in DynamoDB)
 */
export interface IntegrationConnection {
    id: string;                             // Format: {provider}#{timestamp}
    userId: string;                         // User ID
    provider: IntegrationProvider;          // Integration provider
    type: IntegrationType;                  // Integration type
    status: IntegrationStatus;              // Connection status
    credentials: IntegrationCredentials;    // Encrypted credentials
    metadata: Record<string, any>;          // Provider-specific metadata
    createdAt: number;                      // Creation timestamp
    updatedAt: number;                      // Last update timestamp
    lastValidatedAt?: number;               // Last validation check
    expiresAt?: number;                     // Credential expiration (for OAuth)
    error?: string;                         // Last error message
}

/**
 * Integration Health Status
 */
export interface IntegrationHealth {
    provider: IntegrationProvider;
    isConnected: boolean;
    isValid: boolean;
    lastChecked: number;
    healthScore: number;    // 0-100
    issues: string[];
}

/**
 * Integration Operation Result
 */
export interface IntegrationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
}

// Zod Schemas for Runtime Validation

export const IntegrationTypeSchema = z.enum([
    'social',
    'email',
    'sms',
    'calendar',
    'crm',
    'analytics',
    'automation',
    'design',
    'real-estate'
]);

export const IntegrationProviderSchema = z.enum([
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'mailchimp',
    'sendgrid',
    'mailgun',
    'twilio',
    'google-calendar',
    'outlook-calendar',
    'hubspot',
    'salesforce',
    'followupboss',
    'zapier',
    'canva',
    'google-analytics',
    'zillow'
]);

export const AuthMethodSchema = z.enum([
    'oauth2',
    'api_key',
    'basic',
    'token'
]);

export const IntegrationStatusSchema = z.enum([
    'active',
    'inactive',
    'error',
    'expired',
    'pending'
]);

export const IntegrationCredentialsSchema = z.object({
    provider: IntegrationProviderSchema,
    authMethod: AuthMethodSchema,
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresAt: z.number().optional(),
    scope: z.array(z.string()).optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accountId: z.string().optional(),
    metadata: z.record(z.any()).optional()
});

export const IntegrationConnectionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    provider: IntegrationProviderSchema,
    type: IntegrationTypeSchema,
    status: IntegrationStatusSchema,
    credentials: IntegrationCredentialsSchema,
    metadata: z.record(z.any()),
    createdAt: z.number(),
    updatedAt: z.number(),
    lastValidatedAt: z.number().optional(),
    expiresAt: z.number().optional(),
    error: z.string().optional()
});
