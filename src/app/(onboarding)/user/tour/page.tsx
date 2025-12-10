'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { FeatureTourStep } from '@/components/onboarding/feature-tour-step';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Wand2,
    Target,
    Search,
    BarChart3,
    Calculator,
    Library
} from 'lucide-react';

/**
 * Feature Tour Page
 * 
 * Third step in the user onboarding flow - interactive tour of platform hubs.
 * 
 * Features:
 * - Interactive overview of hub navigation structure
 * - Brief description and primary use cases for each hub
 * - Visual progress indicators (step X of 6)
 * - Tour completion tracking in state
 * - Option to access tour later from settings
 * - Mobile-responsive layout
 * - Keyboard navigation support
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.4
 */

interface TourStep {
    id: string;
    hub: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    features: string[];
    color: string;
}

const tourSteps: TourStep[] = [
    {
        id: 'studio',
        hub: 'Studio',
        icon: Wand2,
        title: 'Create Content in Minutes',
        description: 'Turn ideas into polished content with AI-powered tools',
        features: [
            'AI Writing for blog posts, social media, and market updates',
            'Listing Descriptions with persona-driven copy',
            'Image Editing with virtual staging and day-to-dusk conversion',
            'Video Scripts for engaging property tours'
        ],
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'brand',
        hub: 'Brand',
        icon: Target,
        title: 'Build Your Market Position',
        description: 'Own your market and outshine the competition',
        features: [
            'Profile Setup to get found and trusted online',
            'NAP Audit for consistent business information across platforms',
            'Competitor Tracking with Google keyword rankings',
            'Marketing Strategy with personalized 3-step game plans'
        ],
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'research',
        hub: 'Research',
        icon: Search,
        title: 'Get Research-Backed Answers',
        description: 'Ask any question about your market and get comprehensive insights',
        features: [
            'Research Agent for any market question',
            'Reports with comprehensive analyses and citations',
            'Knowledge Base for centralized research materials',
            'Market Insights powered by real-time data'
        ],
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: 'market',
        hub: 'Market',
        icon: BarChart3,
        title: 'Track Trends and Opportunities',
        description: 'Stay ahead with market intelligence and predictive analytics',
        features: [
            'Life Event Predictions to identify potential clients',
            'Market Trend Analysis for data-driven decisions',
            'Real Estate News filtered by your location',
            'Investment Opportunities identification'
        ],
        color: 'from-orange-500 to-red-500',
    },
    {
        id: 'tools',
        hub: 'Tools',
        icon: Calculator,
        title: 'Analyze Deals Like a Pro',
        description: 'Crunch numbers and evaluate investment opportunities',
        features: [
            'Mortgage Calculator for payment estimates and amortization',
            'Renovation ROI Calculator for investment analysis',
            'Property Valuation with AI-powered estimates',
            'Deal Analysis tools for comprehensive evaluations'
        ],
        color: 'from-yellow-500 to-amber-500',
    },
    {
        id: 'library',
        hub: 'Library',
        icon: Library,
        title: 'Everything You\'ve Created',
        description: 'All your content, research, and media in one place',
        features: [
            'Content Management for all created materials',
            'Research Reports saved and organized',
            'Media Library for images and documents',
            'Templates for reusable content'
        ],
        color: 'from-indigo-500 to-purple-500',
    },
];

export default function FeatureTourPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);
    const [onboardingState, setOnboardingState] = useState<any>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const userId = user?.id || '';

    const {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
    } = useOnboardingSkip(userId, 'tour');

    // Load onboarding state on mount
    useEffect(() => {
        const loadState = async () => {
            if (!userId) return;

            try {
                const state = await onboardingService.getOnboardingState(userId);
                setOnboardingState(state);
            } catch (error) {
                console.error('[TOUR_PAGE] Error loading onboarding state:', error);
            }
        };

        loadState();
    }, [userId]);

    /**
     * Handle next button click
     * Requirement 3.4: Mark tour as complete when finished
     */
    const handleNext = async () => {
        if (currentStepIndex < tourSteps.length - 1) {
            // Move to next tour step
            setCurrentStepIndex(currentStepIndex + 1);
            return;
        }

        // Last step - complete tour and navigate to next onboarding step
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
            // Mark tour step as completed
            await onboardingService.completeStep(userId, 'tour');

            // Update metadata to mark tour as complete
            // Requirement 3.4: Mark tour step as complete in state
            await onboardingService.updateMetadata(userId, {
                tourCompleted: true,
            });

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                onboardingState?.flowType || 'user',
                'tour'
            );

            // Show success message
            toast({
                title: 'Tour Complete',
                description: 'You can access this tour anytime from settings.',
            });

            // Navigate to next step (hub selection)
            router.push('/onboarding/user/selection');
        } catch (error) {
            console.error('[TOUR_PAGE] Error completing tour:', error);
            toast({
                title: 'Error',
                description: 'Failed to save progress. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle back button click
     */
    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        } else {
            // First step - go back to profile page
            router.push('/onboarding/user/profile');
        }
    };

    /**
     * Keyboard navigation
     * Requirement 7.1: Keyboard navigation support
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && currentStepIndex < tourSteps.length - 1) {
                setCurrentStepIndex(currentStepIndex + 1);
            } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
                setCurrentStepIndex(currentStepIndex - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStepIndex]);

    const currentTourStep = tourSteps[currentStepIndex];
    const isLastStep = currentStepIndex === tourSteps.length - 1;

    return (
        <>
            <OnboardingContainer
                currentStep={3}
                totalSteps={5}
                stepId="tour"
                title="Explore the Platform"
                description="Take a quick tour of the main features and discover what Bayon Coagent can do for you."
                onNext={handleNext}
                onSkip={openSkipDialog}
                onBack={handleBack}
                nextLabel={isLastStep ? 'Complete Tour' : 'Next Hub'}
                isLoading={isLoading}
            >
                {/* Progress indicator - Requirement 3.3 */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Hub {currentStepIndex + 1} of {tourSteps.length}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                            {Math.round(((currentStepIndex + 1) / tourSteps.length) * 100)}% Complete
                        </p>
                    </div>
                    <div
                        className="h-2 bg-muted rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={currentStepIndex + 1}
                        aria-valuemin={0}
                        aria-valuemax={tourSteps.length}
                        aria-label={`Tour progress: ${currentStepIndex + 1} of ${tourSteps.length} hubs`}
                    >
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${((currentStepIndex + 1) / tourSteps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Feature tour step - Requirement 3.1, 3.2 */}
                <FeatureTourStep
                    step={currentTourStep}
                    stepNumber={currentStepIndex + 1}
                    totalSteps={tourSteps.length}
                />

                {/* Navigation buttons for mobile - Requirement 7.4 */}
                {isMobile && (
                    <div className="flex items-center justify-between mt-6 gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className="flex-1 min-h-[44px]"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleNext}
                            disabled={isLoading}
                            className="flex-1 min-h-[44px]"
                        >
                            {isLastStep ? 'Complete' : 'Next'}
                            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                )}

                {/* Keyboard hint for desktop */}
                {!isMobile && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Use arrow keys to navigate between hubs
                        </p>
                    </div>
                )}

                {/* Access later hint - Requirement 3.5 */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                        You can access this tour anytime from your settings
                    </p>
                </div>
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
