'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { WelcomeCard } from '@/components/onboarding/welcome-card';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import {
    Wand2,
    Target,
    Search,
    BarChart3,
    Calculator,
    Library
} from 'lucide-react';

/**
 * Welcome Page
 * 
 * First step in the onboarding flow - introduces the platform.
 * Shared by both user and admin flows.
 * 
 * Features:
 * - Platform overview with key benefits organized by hub
 * - Clear call-to-action to begin setup
 * - Skip option with state preservation
 * - Mobile-first responsive design
 * - Touch-optimized for mobile devices
 * - Analytics tracking
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.4, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export default function WelcomePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();
    const [isLoading, setIsLoading] = useState(false);
    const [onboardingState, setOnboardingState] = useState<any>(null);

    const userId = user?.id || '';

    const {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
    } = useOnboardingSkip(userId, 'welcome');

    // Hub benefits organized by hub
    const hubs = [
        {
            icon: Wand2,
            name: 'Studio',
            description: 'Turn ideas into polished content',
            features: [
                'AI Writing for blog posts and social media',
                'Listing Descriptions with persona-driven copy',
                'Image Editing with virtual staging and enhancement'
            ],
        },
        {
            icon: Target,
            name: 'Brand',
            description: 'Own your market and outshine competitors',
            features: [
                'Profile Setup to get found and trusted online',
                'NAP Audit for consistent business information',
                'Competitor Tracking with keyword rankings',
                'Marketing Strategy with personalized game plans'
            ],
        },
        {
            icon: Search,
            name: 'Research',
            description: 'Get research-backed answers in minutes',
            features: [
                'Research Agent for any market question',
                'Reports with comprehensive analyses',
                'Knowledge Base for centralized insights'
            ],
        },
        {
            icon: BarChart3,
            name: 'Market',
            description: 'Track trends and identify opportunities',
            features: [
                'Life Event Predictions to find potential clients',
                'Market Trend Analysis for data-driven decisions',
                'Real Estate News filtered by location',
                'Investment Opportunities identification'
            ],
        },
        {
            icon: Calculator,
            name: 'Tools',
            description: 'Analyze deals like a pro',
            features: [
                'Mortgage Calculator for payment estimates',
                'Renovation ROI Calculator for investment analysis',
                'Property Valuation with AI-powered estimates'
            ],
        },
        {
            icon: Library,
            name: 'Library',
            description: 'Everything you\'ve created, ready when you need it',
            features: [
                'Content Management for all created materials',
                'Research Reports saved and organized',
                'Media Library for images and documents',
                'Templates for reusable content'
            ],
        },
    ];

    // Load onboarding state on mount and check for dual role
    useEffect(() => {
        const loadState = async () => {
            if (!userId) return;

            try {
                const state = await onboardingService.getOnboardingState(userId);
                setOnboardingState(state);

                // If no state exists, check if user should see flow choice
                if (!state) {
                    const { detectOnboardingFlow, shouldShowFlowChoice } = await import('@/services/onboarding/role-detection');
                    const roleDetection = await detectOnboardingFlow(userId);

                    // Redirect to flow choice if dual role user
                    if (shouldShowFlowChoice(roleDetection, false)) {
                        router.push('/onboarding/flow-choice');
                        return;
                    }
                }

                // Track analytics if this is the first time viewing welcome
                if (!state || !state.completedSteps.includes('welcome')) {
                    await onboardingAnalytics.trackOnboardingStarted(
                        userId,
                        state?.flowType || 'user'
                    );
                }
            } catch (error) {
                console.error('[WELCOME_PAGE] Error loading onboarding state:', error);
            }
        };

        loadState();
    }, [userId, router]);

    /**
     * Handle next button click
     * Requirement 1.4: Transition to first onboarding step
     */
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
            // Initialize onboarding if not already initialized
            let state = onboardingState;
            if (!state) {
                // Detect flow type based on user role
                // For now, default to 'user' - this will be enhanced in task 3
                state = await onboardingService.initializeOnboarding(userId, 'user');
            }

            // Mark welcome step as completed
            await onboardingService.completeStep(userId, 'welcome');

            // Navigate to next step (profile setup)
            router.push('/onboarding/user/profile');
        } catch (error) {
            console.error('[WELCOME_PAGE] Error proceeding to next step:', error);
            toast({
                title: 'Error',
                description: 'Failed to proceed. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <OnboardingContainer
                currentStep={1}
                totalSteps={5}
                stepId="welcome"
                title="Welcome to Bayon Coagent"
                description="Your AI-powered success platform for real estate. Let's get you set up in just a few minutes."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Begin Setup"
                isLoading={isLoading}
            >
                {/* Responsive grid: 1 column on mobile, 2 on tablet+, with optimized gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {hubs.map((hub) => (
                        <WelcomeCard
                            key={hub.name}
                            icon={hub.icon}
                            name={hub.name}
                            description={hub.description}
                            features={hub.features}
                        />
                    ))}
                </div>

                {/* Additional context for mobile users */}
                {isMobile && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                            Swipe through the cards above to explore all features
                        </p>
                    </div>
                )}
            </OnboardingContainer>

            {/* Skip confirmation dialog - Requirement 1.5, 10.3 */}
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
