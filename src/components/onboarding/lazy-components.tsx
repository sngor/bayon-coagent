/**
 * Lazy-Loaded Onboarding Components
 * 
 * Provides lazy-loaded versions of heavy onboarding components
 * to improve initial load performance and reduce bundle size.
 * 
 * Requirements: 7.1
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Loading fallback for onboarding components
 */
function OnboardingComponentLoader() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                            <Skeleton className="h-5 w-24 mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Loading fallback for form components
 */
function FormComponentLoader() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

/**
 * Loading fallback for celebration animations
 */
function CelebrationLoader() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
    );
}

/**
 * Lazy-loaded Skip Confirmation Dialog
 * Heavy component with animations and state management
 */
export const LazySkipConfirmationDialog = dynamic(
    () => import('./skip-confirmation-dialog').then((mod) => ({ default: mod.SkipConfirmationDialog })),
    {
        loading: () => null, // Dialog doesn't need a loader
        ssr: false,
    }
);

/**
 * Lazy-loaded Profile Form
 * Heavy component with validation and form state
 * TODO: Implement in task 7
 */
// export const LazyProfileForm = dynamic(
//     () => import('./profile-form').then((mod) => ({ default: mod.ProfileForm })),
//     {
//         loading: () => <FormComponentLoader />,
//         ssr: false,
//     }
// );

/**
 * Lazy-loaded Feature Tour
 * Heavy component with animations and illustrations
 * TODO: Implement in task 8
 */
// export const LazyFeatureTour = dynamic(
//     () => import('./feature-tour').then((mod) => ({ default: mod.FeatureTour })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );

/**
 * Lazy-loaded Hub Selection
 * Heavy component with cards and animations
 * TODO: Implement in task 9
 */
// export const LazyHubSelection = dynamic(
//     () => import('./hub-selection').then((mod) => ({ default: mod.HubSelection })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );

/**
 * Lazy-loaded Completion Celebration
 * Heavy component with confetti animation
 * TODO: Implement in task 10
 */
// export const LazyCompletionCelebration = dynamic(
//     () => import('./completion-celebration').then((mod) => ({ default: mod.CompletionCelebration })),
//     {
//         loading: () => <CelebrationLoader />,
//         ssr: false,
//     }
// );

/**
 * Lazy-loaded Resume Banner
 * Shown conditionally, can be lazy loaded
 * TODO: Implement in task 13
 */
// export const LazyResumeBanner = dynamic(
//     () => import('./resume-banner').then((mod) => ({ default: mod.ResumeBanner })),
//     {
//         loading: () => null, // Banner doesn't need a loader
//         ssr: false,
//     }
// );

/**
 * Lazy-loaded Admin Flow Components
 * Admin-specific components that can be code-split
 * TODO: Implement in task 11
 */
// export const LazyAdminWelcome = dynamic(
//     () => import('./admin/admin-welcome').then((mod) => ({ default: mod.AdminWelcome })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );

// export const LazyAdminUserManagement = dynamic(
//     () => import('./admin/admin-user-management').then((mod) => ({ default: mod.AdminUserManagement })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );

// export const LazyAdminAnalytics = dynamic(
//     () => import('./admin/admin-analytics').then((mod) => ({ default: mod.AdminAnalytics })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );

// export const LazyAdminConfiguration = dynamic(
//     () => import('./admin/admin-configuration').then((mod) => ({ default: mod.AdminConfiguration })),
//     {
//         loading: () => <OnboardingComponentLoader />,
//         ssr: false,
//     }
// );
