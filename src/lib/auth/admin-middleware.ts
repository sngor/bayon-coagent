import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { getProfileKeys } from '@/aws/dynamodb/keys';

export type AdminRole = 'user' | 'admin' | 'super_admin';

export interface AdminStatus {
    isAdmin: boolean;
    role: AdminRole;
    userId: string;
    email?: string;
    profileData?: any;
}

/**
 * Centralized admin authorization check
 * Replaces the repeated checkAdminStatusAction calls throughout the codebase
 */
export async function getAdminStatus(userId?: string): Promise<AdminStatus> {
    try {
        // Get user ID from parameter or current session
        const targetUserId = userId || (await getCurrentUserServer())?.id;

        if (!targetUserId) {
            return { isAdmin: false, role: 'user', userId: '' };
        }

        // Hardcoded super admin override (temporary)
        if (targetUserId === '28619310-e041-70fe-03bd-897627fb5a4d') {
            return {
                isAdmin: true,
                role: 'super_admin',
                userId: targetUserId,
                email: 'ngorlong@gmail.com',
                profileData: { override: true }
            };
        }

        const repository = getRepository();
        const profileKeys = getProfileKeys(targetUserId);
        const profileData = await repository.get(profileKeys.PK, profileKeys.SK);

        const email = (profileData as any)?.email;
        const isSuperAdminEmail = email === 'ngorlong@gmail.com';
        const role: AdminRole = (profileData as any)?.role || 'user';
        const isAdmin = role === 'admin' || role === 'super_admin' || isSuperAdminEmail;

        // Auto-promote super admin email if needed
        if (isSuperAdminEmail && role !== 'super_admin') {
            repository.update(profileKeys.PK, profileKeys.SK, { role: 'super_admin' })
                .catch(console.error);
        }

        return {
            isAdmin,
            role: isSuperAdminEmail ? 'super_admin' : role,
            userId: targetUserId,
            email,
            profileData
        };
    } catch (error) {
        console.error('[getAdminStatus] Error:', error);
        return { isAdmin: false, role: 'user', userId: userId || '' };
    }
}

/**
 * Higher-order function for admin-protected server actions
 */
export function withAdminAuth<T extends any[], R>(
    requiredRole: AdminRole = 'admin'
) {
    return function (
        target: (...args: T) => Promise<R>
    ) {
        return async function (...args: T): Promise<R> {
            const adminStatus = await getAdminStatus();

            if (!adminStatus.isAdmin) {
                throw new Error('Unauthorized: Admin access required');
            }

            if (requiredRole === 'super_admin' && adminStatus.role !== 'super_admin') {
                throw new Error('Unauthorized: Super Admin access required');
            }

            return target(...args);
        };
    };
}

/**
 * Utility for consistent admin error responses
 */
export function createAdminErrorResponse(requiredRole: AdminRole = 'admin') {
    return {
        message: requiredRole === 'super_admin'
            ? 'Unauthorized: Super Admin access required'
            : 'Unauthorized: Admin access required',
        data: null,
        errors: {}
    };
}