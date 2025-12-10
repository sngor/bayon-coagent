/**
 * Middleware Configuration
 * 
 * Centralized configuration for all middleware functionality
 */

import { SecurityHeadersConfig, RateLimitConfig } from './types';

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS: SecurityHeadersConfig = {
    contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
    ].join('; '),

    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,      // 60 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
};

/**
 * Dashboard rate limiting (more restrictive)
 */
export const DASHBOARD_RATE_LIMIT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,      // 30 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
};

/**
 * Cookie configuration
 */
export const COOKIE_CONFIG = {
    SESSION_COOKIE_NAME: 'bayon-session',
    PORTAL_SESSION_COOKIE_NAME: 'client_portal_session',
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
};

/**
 * Middleware execution order
 */
export const MIDDLEWARE_ORDER = [
    'requestValidation',
    'securityHeaders',
    'rateLimiting',
    'dashboardAuth',
    'portalAuth',
    'onboardingDetection',
    'adminAuth',
] as const;

/**
 * Feature flags for middleware
 */
export const MIDDLEWARE_FEATURES = {
    REQUEST_VALIDATION: process.env.ENABLE_REQUEST_VALIDATION !== 'false',
    RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
    ONBOARDING_DETECTION: process.env.ENABLE_ONBOARDING_DETECTION !== 'false',
    AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING !== 'false',
    PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
} as const;