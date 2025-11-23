import { useUser } from '@/aws/auth/use-user';
import { getRepository } from '@/aws/dynamodb/repository';
import { getProfileKeys } from '@/aws/dynamodb/keys';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AdminProfile {
    role: UserRole;
    permissions: string[];
    adminSince?: string;
}

// Admin permissions
export const ADMIN_PERMISSIONS = {
    VIEW_FEEDBACK: 'view_feedback',
    MANAGE_FEEDBACK: 'manage_feedback',
    VIEW_USERS: 'view_users',
    MANAGE_USERS: 'manage_users',
    VIEW_ANALYTICS: 'view_analytics',
    SYSTEM_SETTINGS: 'system_settings',
} as const;

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    user: [],
    admin: [
        ADMIN_PERMISSIONS.VIEW_FEEDBACK,
        ADMIN_PERMISSIONS.MANAGE_FEEDBACK,
        ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    ],
    super_admin: Object.values(ADMIN_PERMISSIONS),
};

/**
 * Check if user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const repository = getRepository();
        const profileKeys = getProfileKeys(userId);
        const result = await repository.get(profileKeys.PK, profileKeys.SK);

        const profile = (result as any)?.Data;
        return profile?.role === 'admin' || profile?.role === 'super_admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
        const repository = getRepository();
        const profileKeys = getProfileKeys(userId);
        const result = await repository.get(profileKeys.PK, profileKeys.SK);

        const profile = (result as any)?.Data;
        const userRole = profile?.role || 'user';
        const permissions = ROLE_PERMISSIONS[userRole as UserRole] || [];

        return permissions.includes(permission);
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * React hook for admin checks
 */
export function useAdmin() {
    const { user } = useUser();

    const checkIsAdmin = async () => {
        if (!user?.id) return false;
        return isUserAdmin(user.id);
    };

    const checkPermission = async (permission: string) => {
        if (!user?.id) return false;
        return hasPermission(user.id, permission);
    };

    return {
        checkIsAdmin,
        checkPermission,
    };
}