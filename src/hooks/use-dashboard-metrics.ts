import { useMemo } from 'react';
import { getSuggestedNextActions } from '@/hooks/use-profile-completion';
import type { Profile } from '@/lib/types/common';

interface DashboardMetrics {
    averageRating: string;
    totalReviews: number;
    recentReviewsCount: number;
    parsedAverageRating: number;
    planStepsCount: number;
    completionPercentage: number;
    suggestedSteps: any[];
}

export function useDashboardMetrics(
    allReviews: any[],
    agentProfile: Profile | null,
    latestPlanData: any[],
    brandAuditData: any,
    competitorsData: any[]
): DashboardMetrics {
    // Memoize review calculations
    const reviewMetrics = useMemo(() => {
        if (!allReviews || allReviews.length === 0) {
            return { averageRating: '0.0', totalReviews: 0, recentReviewsCount: 0 };
        }

        const total = allReviews.reduce((acc, review) => acc + review.rating, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recent = allReviews.filter(review => new Date(review.date) > thirtyDaysAgo).length;

        return {
            averageRating: (total / allReviews.length).toFixed(1),
            totalReviews: allReviews.length,
            recentReviewsCount: recent,
        };
    }, [allReviews]);

    // Memoize profile completion calculation
    const completionPercentage = useMemo(() => {
        if (!agentProfile) return 0;

        const profileFields = [
            { key: 'name', required: true },
            { key: 'agencyName', required: true },
            { key: 'phone', required: true },
            { key: 'address', required: true },
            { key: 'bio', required: true },
            { key: 'yearsOfExperience', required: false },
            { key: 'licenseNumber', required: false },
            { key: 'website', required: false },
            { key: 'photoURL', required: false },
        ];

        const completed = profileFields.filter((field) => {
            const value = agentProfile[field.key as keyof Profile];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return value > 0;
            return !!value;
        });

        return Math.round((completed.length / profileFields.length) * 100);
    }, [agentProfile]);

    // Memoize suggested steps calculation
    const suggestedSteps = useMemo(() => {
        return getSuggestedNextActions(
            agentProfile,
            !!(latestPlanData && latestPlanData.length > 0),
            !!brandAuditData,
            !!(competitorsData && competitorsData.length > 0)
        );
    }, [agentProfile, latestPlanData, brandAuditData, competitorsData]);

    // Memoize other derived values
    const parsedAverageRating = useMemo(() =>
        parseFloat(reviewMetrics.averageRating),
        [reviewMetrics.averageRating]
    );

    const planStepsCount = useMemo(() =>
        latestPlanData.length > 0 ? latestPlanData[0].steps.length : 0,
        [latestPlanData]
    );

    return {
        ...reviewMetrics,
        parsedAverageRating,
        planStepsCount,
        completionPercentage,
        suggestedSteps,
    };
}