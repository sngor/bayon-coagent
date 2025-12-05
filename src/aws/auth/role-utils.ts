/**
 * Role Utility Functions
 * 
 * Provides utility functions for role-based access control (RBAC).
 * These functions help with role extraction from JWT tokens and
 * permission checking for admin features.
 */

import { UserRole } from '../dynamodb/admin-types';

/**
 * Extracts the role from a JWT ID token
 * 
 * @param idToken - The JWT ID token from Cognito
 * @returns The user's role (defaults to 'user' if not found or invalid)
 */
export function extractRoleFromToken(idToken: string): UserRole {
    try {
        // JWT tokens are base64 encoded and have 3 parts separated by dots
        const parts = idToken.split('.');

        if (parts.length !== 3) {
            console.warn('Invalid JWT token format');
            return 'user';
        }

        // Decode the payload (second part)
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
        );

        // Extract the custom:role claim
        const role = payload['custom:role'];

        // Validate the role value
        if (role === 'admin' || role === 'superadmin' || role === 'user') {
            return role as UserRole;
        }

        // Default to 'user' if role is missing or invalid
        return 'user';
    } catch (error) {
        console.error('Failed to extract role from token:', error);
        return 'user';
    }
}

/**
 * Checks if a user has admin access (Admin or SuperAdmin)
 * 
 * @param role - The user's role
 * @returns True if the user has admin access
 */
export function hasAdminAccess(role: UserRole): boolean {
    return role === 'admin' || role === 'superadmin';
}

/**
 * Checks if a user has SuperAdmin access
 * 
 * @param role - The user's role
 * @returns True if the user is a SuperAdmin
 */
export function hasSuperAdminAccess(role: UserRole): boolean {
    return role === 'superadmin';
}

/**
 * Checks if a user can manage roles (assign/revoke)
 * Only SuperAdmins can manage roles
 * 
 * @param role - The user's role
 * @returns True if the user can manage roles
 */
export function canManageRoles(role: UserRole): boolean {
    return role === 'superadmin';
}

/**
 * Gets a human-readable label for a role
 * 
 * @param role - The user's role
 * @returns A formatted label for the role
 */
export function getRoleLabel(role: UserRole): string {
    switch (role) {
        case 'superadmin':
            return 'Super Admin';
        case 'admin':
            return 'Admin';
        case 'user':
            return 'User';
        default:
            return 'User';
    }
}

/**
 * Gets a description for a role
 * 
 * @param role - The user's role
 * @returns A description of the role's permissions
 */
export function getRoleDescription(role: UserRole): string {
    switch (role) {
        case 'superadmin':
            return 'Full system access including user management, role assignment, billing, and security settings';
        case 'admin':
            return 'Access to user management, content moderation, and platform monitoring features';
        case 'user':
            return 'Standard access to platform features';
        default:
            return 'Standard access to platform features';
    }
}

/**
 * Gets the color scheme for a role badge
 * 
 * @param role - The user's role
 * @returns Tailwind CSS color classes for the role
 */
export function getRoleColor(role: UserRole): {
    bg: string;
    text: string;
    border: string;
} {
    switch (role) {
        case 'superadmin':
            return {
                bg: 'bg-purple-100 dark:bg-purple-900/20',
                text: 'text-purple-700 dark:text-purple-300',
                border: 'border-purple-200 dark:border-purple-800',
            };
        case 'admin':
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/20',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-800',
            };
        case 'user':
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-700 dark:text-gray-300',
                border: 'border-gray-200 dark:border-gray-700',
            };
        default:
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-700 dark:text-gray-300',
                border: 'border-gray-200 dark:border-gray-700',
            };
    }
}
