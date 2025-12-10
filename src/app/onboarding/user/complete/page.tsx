'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { completeOnboardingStepAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

/**
 * Onboarding Completion Page
 * 
 * Final step in the onboarding flow - marks onboarding as complete.
 */
export default function CompletePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const userId = user?.id || '';

    // Auto-complete the onboarding when page loads
    useEffect(() => {
        const completeOnboarding = async () => {
            if (!userId || isCompleted) return;

            setIsLoading(true);
            try {
                const result = await completeOnboardingStepAction(userId, 'complete');
                if (result.errors) {
                    throw new Error(result.errors);
                }
                setIsCompleted(true);
            } catch (error) {
                console.error('[COMPLETE_PAGE] Error completing onboarding:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to complete onboarding. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        completeOnboarding();
    }, [userId, isCompleted, toast]);

    const handleGetStarted = () => {
        // Navigate to dashboard
        router.push('/dashboard');
    };

    const handleBack = () => {
        router.push('/onboarding/user/selection');
    };

    return (
        <OnboardingContainer
            currentStep={5}
            totalSteps={5}
            stepId="complete"
            title="Welcome to Bayon Coagent!"
            description="You're all set up and ready to start building your real estate success."
            onNext={handleGetStarted}
            onBack={handleBack}
            nextLabel="Get Started"
            isLoading={isLoading}
            allowSkip={false}
        >
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="mb-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-4">Congratulations!</h3>
                    <p className="text-muted-foreground text-lg mb-8">
                        Your account is now set up and ready to use. Here's what you can do next:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 border rounded-lg text-left">
                        <h4 className="font-semibold mb-2 flex items-center">
                            🎨 <span className="ml-2">Create Content</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Use the Studio to generate blog posts, social media content, and listing descriptions.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg text-left">
                        <h4 className="font-semibold mb-2 flex items-center">
                            🎯 <span className="ml-2">Build Your Brand</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Set up your profile, audit your online presence, and analyze competitors.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg text-left">
                        <h4 className="font-semibold mb-2 flex items-center">
                            🔍 <span className="ml-2">Research Markets</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Get AI-powered research and insights on any market topic or trend.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg text-left">
                        <h4 className="font-semibold mb-2 flex items-center">
                            🧮 <span className="ml-2">Analyze Deals</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Use calculators and tools to analyze properties and investment opportunities.
                        </p>
                    </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2">Need Help Getting Started?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Visit our Training section for guides and tutorials, or use the Assistant for instant help.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/training')}
                        >
                            View Training
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/assistant')}
                        >
                            Ask Assistant
                        </Button>
                    </div>
                </div>
            </div>
        </OnboardingContainer>
    );
}