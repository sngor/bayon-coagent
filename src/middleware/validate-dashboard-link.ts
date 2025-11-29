/**
 * Dashboard Link Authorization Middleware
 * 
 * This middleware provides authorization and access control for client dashboards.
 * It validates secured links, checks expiration, verifies dashboard existence,
 * implements rate limiting, and logs all access attempts for security auditing.
 * 
 * Requirements: 10.3 (Authorization and Security)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    getSecuredLinkKeys as getSecuredLinkKeysFunc,
    getClientDashboardKeys as getClientDashboardKeysFunc,
    getDashboardAnalyticsKeys as getDashboardAnalyticsKeysFunc
} from '@/aws/dynamodb/keys';
import type { SecuredLink, ClientDashboard } from '@/features/client-dashboards/actions/client-dashboard-actions';

// Re-export for backward compatibility
export const getSecuredLinkKeys = getSecuredLinkKeysFunc;
export const getClientDashboardKeys = getClientDashboardKeysFunc;
export const getDashboardAnalyticsKeys = getDashboardAnalyticsKeysFunc;

// ==================== Rate Limiting ====================

/**
 * Simple in-memory rate limiter to prevent scraping and abuse
 * In production, consider using Redis or DynamoDB for distributed rate limiting
 */
class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 60) {
        this.windowMs = windowMs; // 1 minute window
        this.maxRequests = maxRequests; // 60 requests per minute
    }

    /**
     * Check if a request should be allowed
     * @param identifier - Unique identifier (IP address or token)
     * @returns true if request is allowed, false if rate limit exceeded
     */
    isAllowed(identifier: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];

        // Remove requests outside the time window
        const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

        // Check if limit exceeded
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        // Add current request
        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);

        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            this.cleanup(now);
        }

        return true;
    }

    /**
     * Cleanup old entries to prevent memory leaks
     */
    private cleanup(now: number): void {
        for (const [identifier, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
            if (recentRequests.length === 0) {
                this.requests.delete(identifier);
            } else {
                this.requests.set(identifier, recentRequests);
            }
        }
    }

    /**
     * Get remaining requests for an identifier
     */
    getRemaining(identifier: string): number {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];
        const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
        return Math.max(0, this.maxRequests - recentRequests.length);
    }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(60000, 60); // 60 requests per minute

// ==================== Audit Logging ====================

/**
 * Log access attempts for security auditing
 */
async function logAccessAttempt(
    token: string,
    success: boolean,
    reason: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    try {
        const repository = getRepository();
        const timestamp = Date.now();
        const logId = `${timestamp}-${Math.random().toString(36).substring(7)}`;

        // Store audit log in DynamoDB
        await repository.create(
            `AUDIT#DASHBOARD_ACCESS`,
            `LOG#${timestamp}#${logId}`,
            'DashboardAccessLog',
            {
                token,
                success,
                reason,
                ipAddress,
                userAgent,
                timestamp,
            }
        );
    } catch (error) {
        // Log to console if DynamoDB fails, but don't block the request
        console.error('Failed to log access attempt:', error);
    }
}

// ==================== Authorization Functions ====================

/**
 * Validate a dashboard link token
 * 
 * This function:
 * - Validates the link token exists
 * - Checks if the link has expired
 * - Checks if the link has been revoked
 * - Verifies the dashboard exists
 * - Returns dashboard data if valid
 * 
 * Requirements: 2.1, 10.3
 */
export async function validateDashboardLinkToken(
    token: string
): Promise<{
    valid: boolean;
    dashboard?: ClientDashboard;
    link?: SecuredLink;
    error?: string;
}> {
    try {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return {
                valid: false,
                error: 'Invalid link token',
            };
        }

        const repository = getRepository();
        const linkKeys = keys.getSecuredLinkKeys(token);

        // Get the secured link
        const link = await repository.get<SecuredLink>(linkKeys.PK, linkKeys.SK);

        if (!link) {
            return {
                valid: false,
                error: 'Invalid link - link does not exist',
            };
        }

        // Check if link has been revoked
        if (link.revoked) {
            return {
                valid: false,
                error: 'Link revoked - this link has been revoked by the agent',
            };
        }

        // Check if link has expired
        const now = Date.now();
        if (link.expiresAt < now) {
            return {
                valid: false,
                error: 'Link expired - please request a new link from your agent',
            };
        }

        // Get the dashboard data
        const dashboardKeys = keys.getClientDashboardKeys(link.agentId, link.dashboardId);
        const dashboard = await repository.get<ClientDashboard>(
            dashboardKeys.PK,
            dashboardKeys.SK
        );

        if (!dashboard) {
            return {
                valid: false,
                error: 'Dashboard not found - the dashboard associated with this link no longer exists',
            };
        }

        return {
            valid: true,
            dashboard,
            link,
        };
    } catch (error) {
        console.error('Error validating dashboard link:', error);
        return {
            valid: false,
            error: 'Internal error validating link',
        };
    }
}

/**
 * Track dashboard access for analytics
 */
async function trackDashboardAccess(
    dashboardId: string,
    token: string
): Promise<void> {
    try {
        const repository = getRepository();
        const now = Date.now();
        const analyticsKeys = keys.getDashboardAnalyticsKeys(dashboardId, now.toString());

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'DashboardView',
            {
                dashboardId,
                timestamp: now,
                token,
            }
        );
    } catch (error) {
        // Log error but don't block the request
        console.error('Failed to track dashboard access:', error);
    }
}

/**
 * Update link access count and last accessed timestamp
 */
async function updateLinkAccess(
    token: string,
    link: SecuredLink
): Promise<void> {
    try {
        const repository = getRepository();
        const linkKeys = keys.getSecuredLinkKeys(token);
        const now = Date.now();

        await repository.update<SecuredLink>(
            linkKeys.PK,
            linkKeys.SK,
            {
                accessCount: link.accessCount + 1,
                lastAccessedAt: now,
            }
        );
    } catch (error) {
        // Log error but don't block the request
        console.error('Failed to update link access:', error);
    }
}

// ==================== Middleware Function ====================

/**
 * Middleware to validate dashboard link access
 * 
 * This middleware:
 * - Implements rate limiting to prevent scraping
 * - Validates the dashboard link token
 * - Checks authorization (expiration, revocation, dashboard existence)
 * - Logs all access attempts for security auditing
 * - Tracks dashboard views for analytics
 * - Updates link access count
 * 
 * Requirements: 10.3
 */
export async function validateDashboardLinkMiddleware(
    request: NextRequest,
    token: string
): Promise<NextResponse | null> {
    const ipAddress = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting - use IP address as identifier
    const rateLimitIdentifier = `${ipAddress}:${token}`;
    if (!rateLimiter.isAllowed(rateLimitIdentifier)) {
        await logAccessAttempt(
            token,
            false,
            'Rate limit exceeded',
            ipAddress,
            userAgent
        );

        return new NextResponse(
            JSON.stringify({
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                },
            }
        );
    }

    // Validate the dashboard link
    const validation = await validateDashboardLinkToken(token);

    if (!validation.valid) {
        await logAccessAttempt(
            token,
            false,
            validation.error || 'Validation failed',
            ipAddress,
            userAgent
        );

        return new NextResponse(
            JSON.stringify({
                error: 'Unauthorized',
                message: validation.error || 'Invalid or expired link',
            }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    // Log successful access
    await logAccessAttempt(
        token,
        true,
        'Access granted',
        ipAddress,
        userAgent
    );

    // Track dashboard access for analytics
    if (validation.dashboard && validation.link) {
        await trackDashboardAccess(validation.dashboard.id, token);
        await updateLinkAccess(token, validation.link);
    }

    // Access granted - return null to continue processing
    return null;
}

/**
 * Helper function to extract token from request
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
    // Try to get token from URL path (e.g., /d/[token])
    const pathMatch = request.nextUrl.pathname.match(/\/d\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
    }

    // Try to get token from query parameter
    const tokenParam = request.nextUrl.searchParams.get('token');
    if (tokenParam) {
        return tokenParam;
    }

    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return null;
}

// ==================== CSRF Protection ====================

/**
 * Generate a CSRF token for forms
 */
export function generateCSRFToken(): string {
    return crypto.randomUUID();
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
}

// ==================== Security Headers ====================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';"
    );

    // HTTP Strict Transport Security
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    // X-Frame-Options (prevent clickjacking)
    response.headers.set('X-Frame-Options', 'DENY');

    // X-Content-Type-Options (prevent MIME sniffing)
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    response.headers.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
    );

    return response;
}

// ==================== Export Types ====================

export type DashboardAccessLog = {
    token: string;
    success: boolean;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: number;
};
