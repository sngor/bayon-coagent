/**
 * Client-side Admin Authorization Hook
 * 
 * Use this hook in client components to check admin access
 * and conditionally render UI elements
 */

import { useAdmin } from '@/contexts/admin-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface UseAdminAuthOptions {
    /**
     * Require SuperAdmin role
     */
    requireSuperAdmin?: boolean;

    /**
     * Redirect to this path if unauthorized
     */
    redirectTo?: string;

    /**
     * Show error toast if unauthorized
     */
    showError?: boolean;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}) {
    const { isAdmin, isSuperAdmin, isLoading, role } = useAdmin();
    const router = useRouter();

    const isAuthorized = options.requireSuperAdmin ? isSuperAdmin : isAdmin;

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthorized && options.redirectTo) {
            router.push(options.redirectTo);
        }
    }, [isLoading, isAuthorized, options.redirectTo, router]);

    return {
        isAuthorized,
        isAdmin,
        isSuperAdmin,
        role,
        isLoading,
    };
}

/**
 * Hook to require admin access
 * Redirects to dashboard if not authorized
 */
export function useRequireAdmin() {
    return useAdminAuth({
        redirectTo: '/dashboard',
    });
}

/**
 * Hook to require SuperAdmin access
 * Redirects to dashboard if not authorized
 */
export function useRequireSuperAdmin() {
    return useAdminAuth({
        requireSuperAdmin: true,
        redirectTo: '/dashboard',
    });
}
