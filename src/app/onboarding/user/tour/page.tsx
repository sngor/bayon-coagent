'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { completeOnboardingStepAction, skipOnboardingStepAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

/**
 * Feature Tour Page
 * 
 * Third step in the onboarding flow - introduces platform features.
 */
export default function TourPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const userId = user?.id || '';

    const handleNext = async () => {
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
            // Complete the tour step
            const result = await completeOnboardingStepAction(userId, 'tour');
            if (result.errors) {
                throw new Error(result.errors);
            }

            // Navigate to next step (selection)
            router.push('/onboarding/user/selection');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to complete tour. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
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
            // Skip the tour step
            const result = await skipOnboardingStepAction(userId, 'tour');
            if (result.errors) {
                throw new Error(result.errors);
            }

            // Navigate to next step (selection)
            router.push('/onboarding/user/selection');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to skip tour. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/onboarding/user/profile');
    };

    return (
        <OnboardingContainer
            currentStep={3}
            totalSteps={5}
            stepId="tour"
            title="Explore Your New Platform"
            description="Take a quick tour of the key features that will help you succeed."
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            nextLabel="Continue"
            isLoading={isLoading}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Message */}
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-semibold mb-4">Welcome to Bayon Coagent!</h3>
                    <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Your AI-powered success platform for real estate. Everything you need to build authority,
                        create content, and grow your business - all in one place.
                    </p>
                </div>

                {/* Key Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6">
                        <div className="text-4xl mb-3">⚡</div>
                        <h4 className="font-semibold mb-2">Save Hours Daily</h4>
                        <p className="text-sm text-muted-foreground">
                            AI-powered content creation and automation tools that work 24/7
                        </p>
                    </div>
                    <div className="text-center p-6">
                        <div className="text-4xl mb-3">🎯</div>
                        <h4 className="font-semibold mb-2">Stand Out</h4>
                        <p className="text-sm text-muted-foreground">
                            Professional branding and market positioning that gets you noticed
                        </p>
                    </div>
                    <div className="text-center p-6">
                        <div className="text-4xl mb-3">📈</div>
                        <h4 className="font-semibold mb-2">Grow Faster</h4>
                        <p className="text-sm text-muted-foreground">
                            Data-driven insights and tools to accelerate your success
                        </p>
                    </div>
                </div>

                {/* What's Inside */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8">
                    <h4 className="text-xl font-semibold mb-6 text-center">What's Inside Your Platform</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎨</span>
                            <span>AI Content Studio</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span>Brand Builder</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔍</span>
                            <span>Research Agent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <span>Market Intelligence</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🧮</span>
                            <span>Deal Calculators</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📁</span>
                            <span>Content Library</span>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="text-center bg-muted/30 rounded-lg p-6">
                    <h4 className="font-semibold mb-3">🚀 Ready to dive in?</h4>
                    <p className="text-muted-foreground mb-4">
                        Next, you'll choose where to start based on your immediate needs.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Don't worry - you can explore everything once you're inside!
                    </p>
                </div>
            </div>
        </OnboardingContainer>
    );
}