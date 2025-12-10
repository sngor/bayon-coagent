'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for handling onboarding skip functionality
 * 
 * Provides:
 * - Skip confirmation dialog state management
 * - Skip action with error handling
 * - Navigation to dashboard after skip
 * - Toast notifications
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export function useOnboardingSkip(userId: string, stepId?: string) {
    const router = useRouter();
    const { toast } = useToast();
    const [showSkipDialog, setShowSkipDialog] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    /**
     * Opens the skip confirmation dialog
     */
    const openSkipDialog = () => {
        setShowSkipDialog(true);
    };

    /**
     * Closes the skip confirmation dialog
     */
    const closeSkipDialog = () => {
        setShowSkipDialog(false);
    };

    /**
     * Handles the skip confirmation
     * Marks the entire onboarding as skipped and navigates to dashboard
     * Requirement 10.3: Update state to mark onboarding as skipped
     * Requirement 10.4: Navigate to Dashboard on skip
     */
    const handleSkipConfirm = async () => {
        setIsSkipping(true);
        try {
            // Mark the entire onboarding as complete (skipped)
            // This prevents the resume banner from showing again
            await onboardingService.completeOnboarding(userId);

            // Navigate to dashboard
            router.push('/dashboard');

            toast({
                title: 'Onboarding Skipped',
                description: 'You can access setup steps anytime from your settings.',
            });
        } catch (error) {
            console.error('[USE_ONBOARDING_SKIP] Error skipping onboarding:', error);
            toast({
                title: 'Error',
                description: 'Failed to skip onboarding. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSkipping(false);
            setShowSkipDialog(false);
        }
    };

    /**
     * Handles skip all - marks entire onboarding as skipped
     */
    const handleSkipAll = async () => {
        setIsSkipping(true);
        try {
            // Mark onboarding as complete (skipped)
            await onboardingService.completeOnboarding(userId);

            // Navigate to dashboard
            router.push('/dashboard');

            toast({
                title: 'Onboarding Skipped',
                description: 'You can access setup steps anytime from your settings.',
            });
        } catch (error) {
            console.error('[USE_ONBOARDING_SKIP] Error skipping all onboarding:', error);
            toast({
                title: 'Error',
                description: 'Failed to skip onboarding. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSkipping(false);
            setShowSkipDialog(false);
        }
    };

    return {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
        handleSkipAll,
    };
}
