'use client';

/**
 * User Role Hook
 * 
 * Provides client-side access to the current user's role for
 * conditional rendering and feature visibility controls.
 */

import { useEffect, useState } from 'react';
import { useSession } from '@/aws/auth/use-user';
import { extractRoleFromToken, hasAdminAccess, hasSuperAdminAccess, canManageRoles } from '@/aws/auth/role-utils';
import { UserRole } from '@/aws/dynamodb/admin-types';

export interface UserRoleState {
    role: UserRole;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    canManageRoles: boolean;
    isLoading: boolean;
}

/**
 * Hook for accessing the current user's role and permissions
 * 
 * This hook extracts the role from the JWT token and provides
 * convenient permission checks for conditional rendering.
 * 
 * @returns {UserRoleState} Object with role, permission flags, and loading state
 * 
 * @example
 * ```tsx
 * function AdminFeature() {
 *   const { role, isAdmin, isSuperAdmin, isLoading } = useUserRole();
 * 
 *   if (isLoading) return <Spinner />;
 *   if (!isAdmin) return <AccessDenied />;
 * 
 *   return (
 *     <div>
 *       <h1>Admin Feature</h1>
 *       {isSuperAdmin && <SuperAdminControls />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserRole(): UserRoleState {
    const session = useSession();
    const [role, setRole] = useState<UserRole>('user');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session) {
            setRole('user');
            setIsLoading(false);
            return;
        }

        try {
            const extractedRole = extractRoleFromToken(session.idToken);
            setRole(extractedRole);
        } catch (error) {
            console.error('Failed to extract role from token:', error);
            setRole('user');
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    return {
        role,
        isAdmin: hasAdminAccess(role),
        isSuperAdmin: hasSuperAdminAccess(role),
        canManageRoles: canManageRoles(role),
        isLoading,
    };
}
