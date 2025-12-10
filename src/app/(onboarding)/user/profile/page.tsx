'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { ProfileForm } from '@/components/onboarding/profile-form';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import type { ProfileFormData } from '@/lib/schemas/profile-schema';

/**
 * Profile Setup Page
 * 
 * Second step in the user onboarding flow - collects essential profile information.
 * 
 * Features:
 * - Profile form with validation
 * - DynamoDB persistence
 * - Profile completion percentage calculation
 * - Field-level validation with error messages
 * - Mobile-responsive layout
 * - Analytics tracking
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.4
 */
export default function ProfileSetupPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [onboardingState, setOnboardingState] = useState<any>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const userId = user?.id || '';
    const userEmail = user?.email || '';

    const {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
    } = useOnboardingSkip(userId, 'profile');

    // Load onboarding state on mount
    useEffect(() => {
        const loadState = async () => {
            if (!userId) return;

            try {
                const state = await onboardingService.getOnboardingState(userId);
                setOnboardingState(state);
            } catch (error) {
                console.error('[PROFILE_PAGE] Error loading onboarding state:', error);
            }
        };

        loadState();
    }, [userId]);

    /**
     * Calculate profile completion percentage
     * Requirement 2.5: Profile completion percentage
     */
    const calculateProfileCompletion = (data: ProfileFormData): number => {
        const totalFields = 10; // Total number of fields
        let completedFields = 0;

        // Required fields (always count as completed if we reach this point due to validation)
        completedFields += 5; // firstName, lastName, brokerage, location (city, state, zipCode count as 1), specialties

        // Optional fields
        if (data.email) completedFields++;
        if (data.phone) completedFields++;
        if (data.licenseNumber) completedFields++;
        if (data.yearsExperience !== undefined) completedFields++;
        if (data.website) completedFields++;

        return Math.round((completedFields / totalFields) * 100);
    };

    /**
     * Handle form submission
     * Requirements: 2.4, 2.5
     */
    const handleSubmit = async (data: ProfileFormData) => {
        if (!userId) {
            toast({
                title: 'Error',
                description: 'User not authenticated. Please sign in again.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Calculate profile completion percentage
            const profileCompletion = calculateProfileCompletion(data);

            // Store profile data in onboarding metadata
            // Requirement 2.4: Persist profile data to DynamoDB
            await onboardingService.updateMetadata(userId, {
                profileData: data,
                profileCompletion,
            });

            // Mark profile step as completed
            await onboardingService.completeStep(userId, 'profile');

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                onboardingState?.flowType || 'user',
                'profile'
            );

            // Show success message
            toast({
                title: 'Profile Saved',
                description: `Your profile is ${profileCompletion}% complete.`,
            });

            // Navigate to next step (feature tour)
            router.push('/onboarding/user/tour');
        } catch (error) {
            console.error('[PROFILE_PAGE] Error saving profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to save profile. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle next button click
     * Triggers form submission
     */
    const handleNext = () => {
        // Trigger form submission by clicking the hidden submit button
        const form = document.querySelector('form');
        if (form) {
            form.requestSubmit();
        }
    };

    return (
        <>
            <OnboardingContainer
                currentStep={2}
                totalSteps={5}
                stepId="profile"
                title="Set Up Your Profile"
                description="Tell us about yourself so we can personalize your experience and generate content tailored to your market."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Continue"
                isLoading={isLoading}
            >
                <ProfileForm
                    onSubmit={handleSubmit}
                    isSubmitting={isLoading}
                    userEmail={userEmail}
                />
            </OnboardingContainer>

            {/* Skip confirmation dialog */}
            {showSkipDialog && (
                <LazySkipConfirmationDialog
                    open={showSkipDialog}
                    onOpenChange={closeSkipDialog}
                    onConfirm={handleSkipConfirm}
                    isLoading={isSkipping}
                />
            )}
        </>
    );
}
