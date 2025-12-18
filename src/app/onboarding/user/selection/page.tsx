'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { completeOnboardingStepAction, skipOnboardingStepAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

/**
 * Hub Selection Page
 * 
 * Fourth step in the onboarding flow - choose where to start.
 */
export default function SelectionPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHub, setSelectedHub] = useState<string | null>(null);

    const userId = user?.id || '';

    // Stable label calculation to avoid hook order issues
    const nextLabel = selectedHub ? "Start Here" : "Continue";

    const hubs = [
        {
            id: 'studio',
            name: 'Studio - Content Creation',
            icon: '🎨',
            description: 'Turn ideas into polished content in minutes',
            features: ['AI blog posts and social media', 'Listing descriptions', 'Image editing and virtual staging'],
            route: '/studio'
        },
        {
            id: 'brand',
            name: 'Brand - Market Position',
            icon: '🎯',
            description: 'Build your professional presence and outshine competition',
            features: ['Professional profile setup', 'NAP consistency audit', 'Competitor analysis'],
            route: '/brand'
        },
        {
            id: 'research',
            name: 'Research - Market Insights',
            icon: '🔍',
            description: 'Get comprehensive research on any market topic',
            features: ['AI research agent', 'Market analysis reports', 'Knowledge base'],
            route: '/research'
        },
        {
            id: 'tools',
            name: 'Tools - Deal Analysis',
            icon: '🧮',
            description: 'Analyze deals and crunch numbers like a pro',
            features: ['Mortgage calculator', 'ROI analysis', 'Property valuation'],
            route: '/tools'
        }
    ];

    const handleHubSelect = (hubId: string) => {
        setSelectedHub(hubId);
    };

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
            // Complete the selection step
            const result = await completeOnboardingStepAction(userId, 'selection');
            if (result.errors) {
                throw new Error(result.errors);
            }

            // Navigate to selected hub or completion page
            if (selectedHub) {
                const hub = hubs.find(h => h.id === selectedHub);
                if (hub) {
                    toast({
                        title: 'Welcome!',
                        description: `Taking you to ${hub.name.split(' - ')[0]} to get started.`,
                    });
                    router.push(hub.route);
                    return;
                }
            }

            // Default to completion page if no hub selected
            router.push('/onboarding/user/complete');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to complete selection. Please try again.',
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
            // Skip the selection step
            const result = await skipOnboardingStepAction(userId, 'selection');
            if (result.errors) {
                throw new Error(result.errors);
            }

            // Navigate to completion
            router.push('/onboarding/user/complete');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to skip selection. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/onboarding/user/tour');
    };

    return (
        <OnboardingContainer
            currentStep={4}
            totalSteps={5}
            stepId="selection"
            title="Choose Where to Start"
            description="Select the hub you'd like to explore first."
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            nextLabel={nextLabel}
            isLoading={isLoading}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Introduction */}
                <div className="text-center">
                    <p className="text-muted-foreground mb-6">
                        Choose which hub you'd like to explore first based on your immediate needs.
                    </p>
                </div>

                {/* Hub Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hubs.map((hub) => (
                        <div
                            key={hub.id}
                            onClick={() => handleHubSelect(hub.id)}
                            className={`group p-6 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer ${selectedHub === hub.id ? 'border-primary bg-primary/5 shadow-md' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">{hub.icon}</div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold text-lg mb-2 transition-colors ${selectedHub === hub.id ? 'text-primary' : 'group-hover:text-primary'
                                        }`}>
                                        {hub.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {hub.description}
                                    </p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {hub.features.map((feature, index) => (
                                            <li key={index}>• {feature}</li>
                                        ))}
                                    </ul>
                                    <div className={`mt-4 text-xs font-medium transition-opacity ${selectedHub === hub.id
                                        ? 'text-primary opacity-100'
                                        : 'text-primary opacity-0 group-hover:opacity-100'
                                        }`}>
                                        {selectedHub === hub.id ? '✓ Selected' : 'Click to start here →'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommendation */}
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <h4 className="font-semibold mb-2">💡 New to real estate marketing?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        We recommend starting with <strong>Brand</strong> to establish your professional presence,
                        then moving to <strong>Studio</strong> to create your first content.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Don't worry - you can explore all hubs anytime from the main navigation.
                    </p>
                </div>
            </div>
        </OnboardingContainer>
    );
}