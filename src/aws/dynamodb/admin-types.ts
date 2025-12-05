/**
 * Admin Role Management Type Definitions
 * 
 * Defines TypeScript types for admin role management features.
 */

/**
 * User role types
 */
export type UserRole = 'user' | 'admin' | 'superadmin';

/**
 * Extended UserProfile with role fields
 */
export interface UserProfile {
    userId: string;
    email: string;
    givenName?: string;
    familyName?: string;
    role: UserRole;
    roleAssignedAt?: number; // timestamp
    roleAssignedBy?: string; // userId of assigner
    createdAt: number;
    updatedAt: number;
}

/**
 * Role audit log entry
 */
export interface RoleAuditLog {
    auditId: string;
    timestamp: number;
    actingAdminId: string;
    actingAdminEmail: string;
    affectedUserId: string;
    affectedUserEmail: string;
    oldRole: UserRole;
    newRole: UserRole;
    ipAddress: string;
    userAgent: string;
    action: 'assign' | 'revoke';
}
