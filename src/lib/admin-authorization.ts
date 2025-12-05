/**
 * Server-side Admin Authorization Utilities
 * 
 * Use these functions in server actions and server components
 * to validate admin access and log audit trails
 */

import { getCurrentUser } from '@/aws/auth/cognito-client';
import { getRepository } from '@/aws/dynamodb/repository';
import { UserRole } from '@/aws/dynamodb/admin-types';

/**
 * Get the current user's admin role
 */
export async function getCurrentUserRole(): Promise<{
    userId: string | null;
    role: UserRole;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}> {
    try {
        const user = await getCurrentUser();

        if (!user?.id) {
            return {
                userId: null,
                role: 'user',
                isAdmin: false,
                isSuperAdmin: false,
            };
        }

        const repository = getRepository();
        const profile = await repository.getItem(user.id, 'PROFILE');

        const role = ((profile as any)?.role as UserRole) || 'user';

        return {
            userId: user.id,
            role,
            isAdmin: role === 'admin' || role === 'superadmin',
            isSuperAdmin: role === 'superadmin',
        };
    } catch (error) {
        console.error('Error getting user role:', error);
        return {
            userId: null,
            role: 'user',
            isAdmin: false,
            isSuperAdmin: false,
        };
    }
}

/**
 * Require admin role for a server action or page
 * Throws an error if user is not an admin
 */
export async function requireAdmin(): Promise<{
    userId: string;
    role: UserRole;
    isSuperAdmin: boolean;
}> {
    const { userId, role, isAdmin, isSuperAdmin } = await getCurrentUserRole();

    if (!userId || !isAdmin) {
        throw new Error('Unauthorized: Admin role required');
    }

    return { userId, role, isSuperAdmin };
}

/**
 * Require SuperAdmin role for a server action or page
 * Throws an error if user is not a SuperAdmin
 */
export async function requireSuperAdmin(): Promise<{
    userId: string;
    role: UserRole;
}> {
    const { userId, role, isSuperAdmin } = await getCurrentUserRole();

    if (!userId || !isSuperAdmin) {
        throw new Error('Unauthorized: SuperAdmin role required');
    }

    return { userId, role };
}

/**
 * Check if current user has admin access
 * Returns boolean without throwing
 */
export async function hasAdminAccess(): Promise<boolean> {
    const { isAdmin } = await getCurrentUserRole();
    return isAdmin;
}

/**
 * Check if current user has SuperAdmin access
 * Returns boolean without throwing
 */
export async function hasSuperAdminAccess(): Promise<boolean> {
    const { isSuperAdmin } = await getCurrentUserRole();
    return isSuperAdmin;
}

/**
 * Log an admin action for audit trail
 */
export async function logAdminAction(
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
): Promise<void> {
    try {
        const { userId, role } = await getCurrentUserRole();

        if (!userId) {
            console.warn('Attempted to log admin action without user context');
            return;
        }

        // Import audit service dynamically to avoid circular dependencies
        const { AuditLogService } = await import('@/services/admin/audit-log-service');
        const auditService = new AuditLogService();

        await auditService.createAuditLog({
            adminId: userId,
            adminEmail: '', // Will be filled by the service
            adminRole: role === 'superadmin' ? 'superadmin' : 'admin',
            actionType: action,
            resourceType,
            resourceId,
            description: `${action} on ${resourceType} ${resourceId}`,
            ipAddress: 'server-side', // In a real implementation, get from request headers
            userAgent: 'server-side',
            metadata: details,
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
        // Don't throw - audit logging failures shouldn't break the main operation
    }
}

/**
 * Wrapper for admin server actions that automatically checks authorization
 * and logs the action
 */
export function withAdminAuth<T extends any[], R>(
    action: (...args: T) => Promise<R>,
    options?: {
        requireSuperAdmin?: boolean;
        logAction?: {
            action: string;
            resourceType: string;
            getResourceId: (...args: T) => string;
        };
    }
) {
    return async (...args: T): Promise<R> => {
        // Check authorization
        if (options?.requireSuperAdmin) {
            await requireSuperAdmin();
        } else {
            await requireAdmin();
        }

        // Execute the action
        const result = await action(...args);

        // Log the action if configured
        if (options?.logAction) {
            const resourceId = options.logAction.getResourceId(...args);
            await logAdminAction(
                options.logAction.action,
                options.logAction.resourceType,
                resourceId
            );
        }

        return result;
    };
}
