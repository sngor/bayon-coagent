'use client';

import { useUser } from '@/aws/auth/use-user';

/**
 * Hook to get the current user's basic profile data
 * 
 * Note: This hook provides basic user information without making DynamoDB calls.
 * For full profile data, use server actions like getAgentProfile() instead.
 */
export function useUserProfile() {
    const { user } = useUser();

    return {
        profile: null, // Deprecated - use server actions instead
        isLoading: false,
        error: null,
        userName: user?.email?.split('@')[0] || user?.email || 'You',
    };
}