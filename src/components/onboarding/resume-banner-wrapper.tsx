'use client';

import { ResumeBanner } from './resume-banner';
import { useResumeBanner } from '@/hooks/use-resume-banner';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useUser } from '@/aws/auth/use-user';

/**
 * ResumeBannerWrapper Component
 * 
 * Wrapper component that integrates the ResumeBanner with the onboarding system.
 * This component handles all the logic for determining when to show the banner
 * and provides the necessary callbacks.
 * 
 * Usage: Add this component to your main layout (e.g., src/app/(app)/layout.tsx)
 * 
 * ```tsx
 * import { ResumeBannerWrapper } from '@/components/onboarding/resume-banner-wrapper';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <div>
 *       <ResumeBannerWrapper />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function ResumeBannerWrapper() {
    const { user } = useUser();

    // Get onboarding state
    const { state, isLoading } = useOnboarding({
        userId: user?.userId || '',
        autoSync: true,
    });

    // Get banner state and handlers
    const {
        shouldShowBanner,
        nextStepName,
        progress,
        handleResume,
        handleDismiss,
    } = useResumeBanner({ state, isLoading });

    // Don't render if banner shouldn't be shown
    if (!shouldShowBanner) {
        return null;
    }

    return (
        <ResumeBanner
            nextStepName={nextStepName}
            progress={progress}
            onResume={handleResume}
            onDismiss={handleDismiss}
        />
    );
}
