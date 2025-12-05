/**
 * Admin Authorization Middleware
 * 
 * Handles role-based access control for admin routes
 * Logs all admin actions for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if a route requires SuperAdmin access
 */
export function isSuperAdminRoute(pathname: string): boolean {
    const superAdminRoutes = [
        '/admin/billing',
        '/admin/integrations',
        '/admin/audit',
        '/admin/config/settings',
        '/admin/system/maintenance',
    ];

    return superAdminRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a route requires Admin access
 */
export function isAdminRoute(pathname: string): boolean {
    return pathname.startsWith('/admin');
}

/**
 * Add audit log headers for admin actions
 */
export function addAuditHeaders(
    response: NextResponse,
    request: NextRequest,
    userId?: string,
    role?: string
): NextResponse {
    // Add audit tracking headers
    response.headers.set('X-Admin-Action', 'true');
    response.headers.set('X-Admin-Path', request.nextUrl.pathname);
    response.headers.set('X-Admin-Method', request.method);

    if (userId) {
        response.headers.set('X-Admin-User-Id', userId);
    }

    if (role) {
        response.headers.set('X-Admin-Role', role);
    }

    // Add timestamp for audit trail
    response.headers.set('X-Admin-Timestamp', new Date().toISOString());

    return response;
}

/**
 * Create unauthorized response for admin routes
 */
export function createUnauthorizedResponse(
    message: string = 'Unauthorized access to admin area'
): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Unauthorized',
            message,
        }),
        {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}

/**
 * Validate admin access based on route and user role
 */
export function validateAdminAccess(
    pathname: string,
    userRole: string | null
): { authorized: boolean; message?: string } {
    // Check if route requires admin access
    if (!isAdminRoute(pathname)) {
        return { authorized: true };
    }

    // Check if user has any admin role
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
        return {
            authorized: false,
            message: 'Admin or SuperAdmin role required',
        };
    }

    // Check if route requires SuperAdmin access
    if (isSuperAdminRoute(pathname) && userRole !== 'super_admin') {
        return {
            authorized: false,
            message: 'SuperAdmin role required for this resource',
        };
    }

    return { authorized: true };
}
