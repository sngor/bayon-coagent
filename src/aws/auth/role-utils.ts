/**
 * Role utilities for user role management
 */

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface RolePermissions {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canAccessAdmin: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    user: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canManageUsers: false,
        canAccessAdmin: false,
    },
    admin: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageUsers: true,
        canAccessAdmin: true,
    },
    superadmin: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageUsers: true,
        canAccessAdmin: true,
    },
};

export function getRolePermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
    return ROLE_PERMISSIONS[role][permission];
}

export function isAdmin(role: UserRole): boolean {
    return role === 'admin' || role === 'superadmin';
}

export function isSuperAdmin(role: UserRole): boolean {
    return role === 'superadmin';
}

export async function getUserRole(userId: string): Promise<UserRole> {
    // Mock implementation for testing
    // In real implementation, this would query the user's role from the database
    return 'user';
}

export function validateRole(role: string): role is UserRole {
    return ['user', 'admin', 'superadmin'].includes(role);
}