import { useMemo, useCallback } from 'react';
import type { Profile } from '@/lib/types/common';

interface ProfileCompletionResult {
    completionPercentage: number;
    missingFields: string[];
    completedFields: string[];
    isComplete: boolean;
    nextSteps: Array<{
        field: string;
        label: string;
        href: string;
        priority: 'high' | 'medium' | 'low';
    }>;
}

const PROFILE_FIELDS = [
    { key: 'name', label: 'Full Name', required: true, priority: 'high' as const },
    { key: 'agencyName', label: 'Agency Name', required: true, priority: 'high' as const },
    { key: 'phone', label: 'Phone Number', required: true, priority: 'high' as const },
    { key: 'address', label: 'Address', required: true, priority: 'high' as const },
    { key: 'bio', label: 'Bio', required: true, priority: 'medium' as const },
    { key: 'yearsOfExperience', label: 'Years of Experience', required: false, priority: 'medium' as const },
    { key: 'licenseNumber', label: 'License Number', required: false, priority: 'low' as const },
    { key: 'website', label: 'Website', required: false, priority: 'low' as const },
    { key: 'photoURL', label: 'Profile Photo', required: false, priority: 'medium' as const },
] as const;

function isFieldComplete(value: any): boolean {
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (typeof value === 'string') {
        return value.trim() !== '';
    }
    if (typeof value === 'number') {
        return value > 0;
    }
    return !!value;
}

export function useProfileCompletion(agentProfile: Profile | null): ProfileCompletionResult {
    return useMemo(() => {
        if (!agentProfile) {
            return {
                completionPercentage: 0,
                missingFields: PROFILE_FIELDS.map(f => f.key),
                completedFields: [],
                isComplete: false,
                nextSteps: PROFILE_FIELDS.slice(0, 3).map(field => ({
                    field: field.key,
                    label: field.label,
                    href: '/brand/profile',
                    priority: field.priority,
                })),
            };
        }

        const completedFields = PROFILE_FIELDS.filter(field => {
            const value = agentProfile[field.key as keyof Profile];
            return isFieldComplete(value);
        });

        const missingFields = PROFILE_FIELDS.filter(field => {
            const value = agentProfile[field.key as keyof Profile];
            return !isFieldComplete(value);
        });

        const completionPercentage = Math.round((completedFields.length / PROFILE_FIELDS.length) * 100);
        const isComplete = completionPercentage === 100;

        // Generate next steps based on missing fields, prioritized
        const nextSteps = missingFields
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, 3)
            .map(field => ({
                field: field.key,
                label: field.label,
                href: '/brand/profile',
                priority: field.priority,
            }));

        return {
            completionPercentage,
            missingFields: missingFields.map(f => f.key),
            completedFields: completedFields.map(f => f.key),
            isComplete,
            nextSteps,
        };
    }, [agentProfile]);
}

export function useProfileCompletionActions(userId: string | undefined) {
    const handleBannerDismiss = useCallback(() => {
        if (!userId) return;

        const dismissedKey = `profile-banner-dismissed-${userId}`;
        localStorage.setItem(dismissedKey, 'true');
    }, [userId]);

    const handleBannerShow = useCallback(() => {
        if (!userId) return;

        const dismissedKey = `profile-banner-dismissed-${userId}`;
        localStorage.removeItem(dismissedKey);
    }, [userId]);

    const getBannerDismissedState = useCallback(() => {
        if (!userId) return false;

        const dismissedKey = `profile-banner-dismissed-${userId}`;
        return localStorage.getItem(dismissedKey) === 'true';
    }, [userId]);

    return {
        handleBannerDismiss,
        handleBannerShow,
        getBannerDismissedState,
    };
}