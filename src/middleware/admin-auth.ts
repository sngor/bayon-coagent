/**
 * Admin Authorization Middleware
 * 
 * Handles role-based access control for admin routes using Cognito Groups
 * Logs all admin actions for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { CognitoGroupsClient, UserRole } from '@/aws/auth/cognito-groups';

/**
 * Check if a route requires SuperAdmin access
 */
export function isSuperAdminRoute(pathname: string): boolean {
    const superAdminRoutes = [
        '/super-admin',
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
    return pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
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
 * Get user roles from JWT token in request
 */
export function getUserRolesFromRequest(request: NextRequest): UserRole[] {
    try {
        const sessionCookie = request.cookies.get('cognito_session');
        
        if (!sessionCookie) {
            return ['user'];
        }

        const session = JSON.parse(sessionCookie.value);
        
        if (!session.idToken) {
            return ['user'];
        }

        return CognitoGroupsClient.extractRolesFromToken(session.idToken);
    } catch (error) {
        console.error('Failed to extract roles from request:', error);
        return ['user'];
    }
}

/**
 * Check if user has specific role from request
 */
export function hasRoleInRequest(request: NextRequest, role: UserRole): boolean {
    const roles = getUserRolesFromRequest(request);
    return roles.includes(role);
}

/**
 * Validate admin access based on route and user roles from Cognito Groups
 */
export function validateAdminAccess(
    pathname: string,
    request: NextRequest
): { authorized: boolean; message?: string; roles: UserRole[] } {
    const roles = getUserRolesFromRequest(request);
    
    // Check if route requires admin access
    if (!isAdminRoute(pathname)) {
        return { authorized: true, roles };
    }

    // Check if user has any admin role
    const isAdmin = roles.includes('admin') || roles.includes('superadmin');
    
    if (!isAdmin) {
        return {
            authorized: false,
            message: 'Admin or SuperAdmin role required',
            roles,
        };
    }

    // Check if route requires SuperAdmin access
    if (isSuperAdminRoute(pathname) && !roles.includes('superadmin')) {
        return {
            authorized: false,
            message: 'SuperAdmin role required for this resource',
            roles,
        };
    }

    return { authorized: true, roles };
}
