'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { CompletionCelebration } from '@/components/onboarding/completion-celebration';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useToast } from '@/hooks/use-toast';

/**
 * User Onboarding Completion Page
 * 
 * Final step in the user onboarding flow.
 * Features:
 * - Celebration animation with confetti
 * - Success message and welcome text
 * - Auto-redirect to Dashboard after 3 seconds
 * - Marks user onboarding as complete in state
 * - Analytics tracking
 * 
 * Requirements: 6.4, 9.5
 */
export default function UserCompletePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCompleting, setIsCompleting] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);

    const userId = user?.id || '';
    const userName = (user as any)?.firstName || (user as any)?.name?.split(' ')[0];

    useEffect(() => {
        const completeOnboarding = async () => {
            if (!userId || isCompleting) return;

            setIsCompleting(true);

            try {
                // Get current state to calculate total time
                const state = await onboardingService.getOnboardingState(userId);

                if (!state) {
                    console.error('[COMPLETE_PAGE] No onboarding state found');
                    toast({
                        title: 'Error',
                        description: 'Unable to complete onboarding. Please try again.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Mark complete step as completed
                await onboardingService.completeStep(userId, 'complete');

                // Update metadata to track user flow completion
                await onboardingService.updateMetadata(userId, {
                    userFlowComplete: true,
                });

                // For dual role users, check if both flows are complete
                if (state.flowType === 'both') {
                    const adminFlowComplete = state.metadata?.adminFlowComplete || false;

                    if (adminFlowComplete) {
                        // Both flows complete - mark entire onboarding as complete
                        await onboardingService.completeOnboarding(userId);

                        // Calculate total time spent
                        const startTime = new Date(state.startedAt).getTime();
                        const endTime = Date.now();
                        const totalTime = endTime - startTime;

                        // Track completion analytics
                        await onboardingAnalytics.trackOnboardingCompleted(
                            userId,
                            'both',
                            totalTime
                        );
                    }
                } else {
                    // Single user role - mark entire onboarding as complete
                    const completedState = await onboardingService.completeOnboarding(userId);

                    // Calculate total time spent
                    const startTime = new Date(state.startedAt).getTime();
                    const endTime = new Date(completedState.completedAt || new Date().toISOString()).getTime();
                    const totalTime = endTime - startTime;

                    // Track completion analytics
                    await onboardingAnalytics.trackOnboardingCompleted(
                        userId,
                        state.flowType,
                        totalTime
                    );
                }

                console.log('[COMPLETE_PAGE] Onboarding completed successfully for user:', userId);
            } catch (error) {
                console.error('[COMPLETE_PAGE] Error completing onboarding:', error);
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
            router.push('/dashboard');
            return;
        }

        const timer = setTimeout(() => {
            setRedirectCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [redirectCountdown, router]);

    // Handle animation complete
    const handleAnimationComplete = () => {
        console.log('[COMPLETE_PAGE] Celebration animation completed');
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
