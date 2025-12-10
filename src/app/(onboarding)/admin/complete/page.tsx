'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { CompletionCelebration } from '@/components/onboarding/completion-celebration';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useToast } from '@/hooks/use-toast';

/**
 * Admin Onboarding Completion Page
 * 
 * Final step in the admin onboarding flow.
 * Features:
 * - Celebration animation with confetti
 * - Success message and welcome text
 * - Auto-redirect to Admin Dashboard after 3 seconds
 * - Marks admin onboarding as complete in state
 * - For dual role users, checks if user flow also needs completion
 * - Analytics tracking
 * 
 * Requirements: 11.5, 15.5
 */
export default function AdminCompletePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCompleting, setIsCompleting] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);
    const [redirectPath, setRedirectPath] = useState('/admin');

    const userId = user?.id || '';
    const userName = user?.attributes?.given_name || user?.attributes?.name?.split(' ')[0] || user?.email?.split('@')[0];

    useEffect(() => {
        const completeOnboarding = async () => {
            if (!userId || isCompleting) return;

            setIsCompleting(true);

            try {
                // Get current state to check flow type and calculate total time
                const state = await onboardingService.getOnboardingState(userId);

                if (!state) {
                    console.error('[ADMIN_COMPLETE] No onboarding state found');
                    toast({
                        title: 'Error',
                        description: 'Unable to complete onboarding. Please try again.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Mark admin complete step as completed
                await onboardingService.completeStep(userId, 'admin-complete');

                // Update metadata to track admin flow completion
                await onboardingService.updateMetadata(userId, {
                    adminFlowComplete: true,
                });

                // Check if this is a dual role user
                if (state.flowType === 'both') {
                    // Check if user flow is also complete
                    const userFlowComplete = state.metadata?.userFlowComplete || false;

                    if (!userFlowComplete) {
                        // User still needs to complete user flow
                        console.log('[ADMIN_COMPLETE] Dual role user - redirecting to user flow');
                        setRedirectPath('/onboarding/welcome');
                        toast({
                            title: 'Admin Setup Complete!',
                            description: 'Now let\'s set up your user profile.',
                        });
                    } else {
                        // Both flows complete - mark entire onboarding as complete
                        await onboardingService.completeOnboarding(userId);
                        setRedirectPath('/admin');
                    }
                } else {
                    // Single admin role - mark entire onboarding as complete
                    const completedState = await onboardingService.completeOnboarding(userId);

                    // Calculate total time spent
                    const startTime = new Date(state.startedAt).getTime();
                    const endTime = new Date(completedState.completedAt || new Date().toISOString()).getTime();
                    const totalTime = endTime - startTime;

                    // Track completion analytics
                    await onboardingAnalytics.trackOnboardingCompleted(
                        userId,
                        'admin',
                        totalTime
                    );

                    setRedirectPath('/admin');
                }

                console.log('[ADMIN_COMPLETE] Admin onboarding completed successfully for user:', userId);
            } catch (error) {
                console.error('[ADMIN_COMPLETE] Error completing onboarding:', error);
                toast({
                    title: 'Error',
                    description: 'Unable to save completion status. Redirecting anyway...',
                    variant: 'destructive',
                });
            }
        };

        completeOnboarding();
    }, [userId, isCompleting, toast]);

    // Countdown timer for redirect
    useEffect(() => {
        if (redirectCountdown <= 0) {
            router.push(redirectPath);
            return;
        }

        const timer = setTimeout(() => {
            setRedirectCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [redirectCountdown, router, redirectPath]);

    // Handle animation complete
    const handleAnimationComplete = () => {
        console.log('[ADMIN_COMPLETE] Celebration animation completed');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <CompletionCelebration
                userName={userName}
                showConfetti={true}
                onAnimationComplete={handleAnimationComplete}
            />
        </div>
    );
}
