/**
 * Role utilities for user authentication and authorization
 */

export type UserRole = 'user' | 'admin' | 'super_admin';

export function extractRoleFromToken(token: any): UserRole {
    // Extract role from JWT token or user attributes
    const role = token?.['custom:role'] || token?.role || 'user';
    return role as UserRole;
}

export function hasAdminAccess(role: UserRole): boolean {
    return role === 'admin' || role === 'super_admin';
}

export function hasSuperAdminAccess(role: UserRole): boolean {
    return role === 'super_admin';
}

export function canManageRoles(role: UserRole): boolean {
    return role === 'super_admin';
}

export function getRoleColor(role: UserRole): string {
    switch (role) {
        case 'super_admin':
            return 'bg-red-100 text-red-800';
        case 'admin':
            return 'bg-blue-100 text-blue-800';
        case 'user':
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function getRoleLabel(role: UserRole): string {
    switch (role) {
        case 'super_admin':
            return 'Super Admin';
        case 'admin':
            return 'Admin';
        case 'user':
        default:
            return 'User';
    }
}