'use client';

import { ResumeBanner } from '../resume-banner';
import { useResumeBanner } from '@/hooks/use-resume-banner';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useUser } from '@/aws/auth/use-user';

/**
 * Example: Resume Banner Integration
 * 
 * This example shows how to integrate the ResumeBanner component
 * into your application layout (e.g., dashboard or main layout).
 * 
 * The banner will:
 * - Show only when onboarding is incomplete
 * - Display progress and next step
 * - Be dismissible for the current session
 * - Reappear in new sessions if still incomplete
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function ResumeBannerExample() {
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

/**
 * Example: Integration in Layout
 * 
 * Add this to your main layout or dashboard layout:
 * 
 * ```tsx
 * import { ResumeBannerExample } from '@/components/onboarding/examples/resume-banner-example';
 * 
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <div>
 *       <ResumeBannerExample />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Example: Custom Integration
 * 
 * For more control, you can use the hooks directly:
 * 
 * ```tsx
 * import { ResumeBanner } from '@/components/onboarding/resume-banner';
 * import { useResumeBanner } from '@/hooks/use-resume-banner';
 * import { useOnboarding } from '@/hooks/use-onboarding';
 * 
 * export function CustomResumeBanner() {
 *   const { state, isLoading } = useOnboarding({ userId: 'user-123' });
 *   const banner = useResumeBanner({ state, isLoading });
 * 
 *   if (!banner.shouldShowBanner) return null;
 * 
 *   return (
 *     <ResumeBanner
 *       nextStepName={banner.nextStepName}
 *       progress={banner.progress}
 *       onResume={banner.handleResume}
 *       onDismiss={banner.handleDismiss}
 *       className="custom-class"
 *     />
 *   );
 * }
 * ```
 */
