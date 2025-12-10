'use server';

import { getAdminStatus, createAdminErrorResponse } from '@/lib/auth/admin-middleware';

/**
 * Centralized admin status check - replaces checkAdminStatusAction
 * @deprecated Use getAdminStatus from admin-middleware instead
 */
export async function checkAdminStatusAction(userId: string) {
    const status = await getAdminStatus(userId);
    return {
        isAdmin: status.isAdmin,
        role: status.role,
        profileData: status.profileData,
        error: status.isAdmin ? undefined : 'Not authorized'
    };
}

/**
 * Example of how to refactor admin-protected actions
 */
export async function exampleAdminAction() {
    const adminStatus = await getAdminStatus();

    if (!adminStatus.isAdmin) {
        return createAdminErrorResponse();
    }

    // Action logic here
    return { message: 'success', data: null, errors: {} };
}

/**
 * Example of super admin protected action
 */
export async function exampleSuperAdminAction() {
    const adminStatus = await getAdminStatus();

    if (adminStatus.role !== 'super_admin') {
        return createAdminErrorResponse('super_admin');
    }

    // Action logic here
    return { message: 'success', data: null, errors: {} };
}