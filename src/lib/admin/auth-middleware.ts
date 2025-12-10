/**
 * Admin Authentication Middleware
 * 
 * Provides reusable authentication and authorization logic for admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { checkAdminStatusAction } from '@/app/actions';

export interface AuthenticatedRequest extends NextRequest {
    user: {
        id: string;
        email: string;
        role: 'admin' | 'super_admin';
    };
}

export type AdminRouteHandler = (
    request: AuthenticatedRequest
) => Promise<NextResponse>;

/**
 * Wraps admin route handlers with authentication and authorization
 */
export function withAdminAuth(
    handler: AdminRouteHandler,
    options: {
        requireSuperAdmin?: boolean;
    } = {}
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        try {
            // Check authentication
            const currentUser = await getCurrentUserServer();
            if (!currentUser) {
                return NextResponse.json(
                    { success: false, error: 'Not authenticated' },
                    { status: 401 }
                );
            }

            // Check admin status
            const adminStatus = await checkAdminStatusAction(currentUser.id);
            if (!adminStatus.isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized: Admin access required' },
                    { status: 403 }
                );
            }

            // Check super admin requirement
            if (options.requireSuperAdmin && adminStatus.role !== 'super_admin') {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized: Super Admin access required' },
                    { status: 403 }
                );
            }

            // Add user info to request
            const authenticatedRequest = request as AuthenticatedRequest;
            authenticatedRequest.user = {
                id: currentUser.id,
                email: currentUser.email || '',
                role: adminStatus.role as 'admin' | 'super_admin',
            };

            return await handler(authenticatedRequest);
        } catch (error: any) {
            console.error('Admin auth middleware error:', error);
            return NextResponse.json(
                { success: false, error: 'Authentication failed' },
                { status: 500 }
            );
        }
    };
}