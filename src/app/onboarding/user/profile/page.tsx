'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { ProfileForm } from '@/components/onboarding/profile-form';
import { completeOnboardingStepAction, skipOnboardingStepAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { ProfileFormData } from '@/lib/schemas/profile-schema';

/**
 * Profile Setup Page
 * 
 * Second step in the onboarding flow - collects user profile information.
 */
export default function ProfilePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const userId = user?.id || '';

    const handleFormSubmit = async (data: ProfileFormData) => {
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
            // TODO: Save profile data to DynamoDB here

            // Complete the profile step
            const result = await completeOnboardingStepAction(userId, 'profile');
            if (result.errors) {
                throw new Error(result.errors);
            }

            toast({
                title: 'Success',
                description: 'Profile saved successfully!',
            });

            // Navigate to next step (tour)
            router.push('/onboarding/user/tour');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save profile. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        // Trigger form submission
        if (formRef.current) {
            const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.click();
            }
        }
    };

    const handleBack = () => {
        router.push('/onboarding/welcome');
    };

    const handleSkip = async () => {
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
            // Skip the profile step
            const result = await skipOnboardingStepAction(userId, 'profile');
            if (result.errors) {
                throw new Error(result.errors);
            }

            // Navigate to next step (tour)
            router.push('/onboarding/user/tour');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to skip profile setup. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <OnboardingContainer
            currentStep={2}
            totalSteps={5}
            stepId="profile"
            title="Set Up Your Profile"
            description="Tell us about yourself so we can personalize your experience."
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            nextLabel="Continue"
            isLoading={isLoading}
        >
            <div className="max-w-2xl mx-auto">
                <div ref={formRef}>
                    <ProfileForm
                        onSubmit={handleFormSubmit}
                        isSubmitting={isLoading}
                        userEmail={user?.email}
                    />
                </div>
            </div>
        </OnboardingContainer>
    );
}