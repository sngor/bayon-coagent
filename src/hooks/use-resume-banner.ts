'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingState } from '@/types/onboarding';
import { getStepsForFlow, calculateProgress } from '@/types/onboarding';

/**
 * Custom hook for managing resume banner state and behavior
 * 
 * Provides:
 * - Logic to show banner on incomplete onboarding
 * - Progress calculation
 * - Next step information
 * - Resume navigation
 * - Dismissal handling with session storage
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface UseResumeBannerOptions {
    /** Current onboarding state */
    state: OnboardingState | null;
    /** Whether state is loading */
    isLoading?: boolean;
}

interface UseResumeBannerReturn {
    /** Whether to show the banner */
    shouldShowBanner: boolean;
    /** Name of the next step */
    nextStepName: string;
    /** Progress percentage (0-100) */
    progress: number;
    /** Path to the next step */
    nextStepPath: string;
    /** Handle resume button click */
    handleResume: () => void;
    /** Handle banner dismissal */
    handleDismiss: () => void;
}

/**
 * Hook for managing resume banner
 * 
 * Requirement 5.1: Incomplete onboarding detection
 * Requirement 5.2: Resume banner for incomplete flows
 * Requirement 5.3: Resume navigation correctness
 * Requirement 5.4: Dismissible banner for current session
 * Requirement 5.5: Banner reappears in new sessions
 */
export function useResumeBanner(options: UseResumeBannerOptions): UseResumeBannerReturn {
    const { state, isLoading = false } = options;
    const router = useRouter();
    const [isDismissed, setIsDismissed] = useState(false);

    // Session storage key for tracking dismissal
    const DISMISSAL_KEY = 'onboarding-banner-dismissed';

    /**
     * Check if banner was dismissed in current session
     * Requirement 5.4: Dismissal hides banner for current session
     * Requirement 5.5: Banner reappears in new sessions (sessionStorage, not localStorage)
     */
    useEffect(() => {
        const dismissed = sessionStorage.getItem(DISMISSAL_KEY);
        setIsDismissed(dismissed === 'true');
    }, []);

    /**
     * Determine if banner should be shown
     * Requirement 5.1: Incomplete onboarding detection
     * Requirement 5.2: Resume banner for incomplete flows
     */
    const shouldShowBanner = !isLoading &&
        state !== null &&
        !state.isComplete &&
        !isDismissed &&
        state.completedSteps.length > 0; // Only show if user has started onboarding

    /**
     * Get next step information
     * Requirement 5.3: Resume navigation correctness
     */
    const getNextStepInfo = useCallback(() => {
        if (!state) {
            return {
                name: '',
                path: '',
            };
        }

        const steps = getStepsForFlow(state.flowType);

        // Find first incomplete step
        const nextStep = steps.find(
            step => !state.completedSteps.includes(step.id) && !state.skippedSteps.includes(step.id)
        );

        if (nextStep) {
            return {
                name: nextStep.name,
                path: nextStep.path,
            };
        }

        // If all steps are completed or skipped, go to completion
        const completionStep = steps.find(step => step.id.includes('complete'));
        return {
            name: completionStep?.name || 'Complete',
            path: completionStep?.path || '/dashboard',
        };
    }, [state]);

    const nextStepInfo = getNextStepInfo();

    /**
     * Calculate progress percentage
     */
    const progress = state ? calculateProgress(state.completedSteps, state.flowType) : 0;

    /**
     * Handle resume button click
     * Requirement 5.3: Resume button navigates to next step
     */
    const handleResume = useCallback(() => {
        if (nextStepInfo.path) {
            // Track analytics
            if (state) {
                // We could add analytics tracking here if needed
                console.log('[RESUME_BANNER] Resuming onboarding to:', nextStepInfo.path);
            }
            router.push(nextStepInfo.path);
        }
    }, [nextStepInfo.path, router, state]);

    /**
     * Handle banner dismissal
     * Requirement 5.4: Dismissible banner for current session
     */
    const handleDismiss = useCallback(() => {
        setIsDismissed(true);
        // Store dismissal in session storage (not localStorage)
        // Requirement 5.5: Banner reappears in new sessions
        sessionStorage.setItem(DISMISSAL_KEY, 'true');
    }, []);

    return {
        shouldShowBanner,
        nextStepName: nextStepInfo.name,
        progress,
        nextStepPath: nextStepInfo.path,
        handleResume,
        handleDismiss,
    };
}
