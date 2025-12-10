/**
 * Middleware Types
 * 
 * Type definitions for middleware functions and data structures
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware handler function type
 */
export type MiddlewareHandler = (
    request: NextRequest
) => Promise<NextResponse | null>;

/**
 * Route configuration for middleware
 */
export interface RouteConfig {
    pattern: string;
    handler: MiddlewareHandler;
    priority: number;
    description?: string;
}

/**
 * Middleware execution context
 */
export interface MiddlewareContext {
    pathname: string;
    method: string;
    correlationId: string;
    startTime: number;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * Session data structure
 */
export interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    role?: 'user' | 'admin' | 'super_admin';
}

/**
 * Portal session data
 */
export interface PortalSessionData {
    clientId: string;
    dashboardId: string;
    expiresAt: number;
}

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
    contentSecurityPolicy?: string;
    strictTransportSecurity?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    xXSSProtection?: string;
    referrerPolicy?: string;
    permissionsPolicy?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
    timestamp: number;
    correlationId: string;
    userId?: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'error';
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Type guard for session data
 */
export function isValidSessionData(data: any): data is SessionData {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.userId === 'string' &&
        typeof data.accessToken === 'string' &&
        typeof data.expiresAt === 'number'
    );
}

/**
 * Type guard for portal session data
 */
export function isValidPortalSessionData(data: any): data is PortalSessionData {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.clientId === 'string' &&
        typeof data.dashboardId === 'string' &&
        typeof data.expiresAt === 'number'
    );
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown'
    );
}

/**
 * Create middleware context from request
 */
export function createMiddlewareContext(request: NextRequest): MiddlewareContext {
    return {
        pathname: request.nextUrl.pathname,
        method: request.method,
        correlationId: crypto.randomUUID(),
        startTime: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
    };
}