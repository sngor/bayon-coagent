'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { HubSelectionCard, type HubOption } from '@/components/onboarding/hub-selection-card';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Wand2,
    Target,
    Search,
    BarChart3,
    Calculator,
    Library,
} from 'lucide-react';

/**
 * Hub Selection Page
 * 
 * Fourth step in the user onboarding flow - choose which hub to explore first.
 * 
 * Features:
 * - Display cards for each major hub
 * - Record selection in onboarding state
 * - Navigate to selected hub with contextual tips
 * - Default navigation to Dashboard if no selection
 * - Mobile-responsive grid layout
 * - Touch-optimized selection
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.4
 */

const hubOptions: HubOption[] = [
    {
        id: 'studio',
        name: 'Studio',
        description: 'Turn ideas into polished content with AI-powered tools',
        icon: Wand2,
        color: 'from-purple-500 to-pink-500',
        features: [
            'AI Writing for blog posts and social media',
            'Listing Descriptions with persona-driven copy',
            'Image Editing with virtual staging',
        ],
        path: '/studio',
        recommendedFor: ['Content Creators', 'Marketing Focused'],
    },
    {
        id: 'brand',
        name: 'Brand',
        description: 'Own your market and outshine the competition',
        icon: Target,
        color: 'from-blue-500 to-cyan-500',
        features: [
            'Profile Setup to get found online',
            'NAP Audit for consistent information',
            'Competitor Tracking with keyword rankings',
        ],
        path: '/brand',
        recommendedFor: ['New Agents', 'Brand Building'],
    },
    {
        id: 'research',
        name: 'Research',
        description: 'Get research-backed answers about your market',
        icon: Search,
        color: 'from-green-500 to-emerald-500',
        features: [
            'Research Agent for any market question',
            'Comprehensive reports with citations',
            'Knowledge Base for research materials',
        ],
        path: '/research',
        recommendedFor: ['Market Experts', 'Data Driven'],
    },
    {
        id: 'market',
        name: 'Market',
        description: 'Stay ahead with market intelligence and analytics',
        icon: BarChart3,
        color: 'from-orange-500 to-red-500',
        features: [
            'Life Event Predictions for potential clients',
            'Market Trend Analysis for decisions',
            'Real Estate News filtered by location',
        ],
        path: '/market',
        recommendedFor: ['Investors', 'Market Analysts'],
    },
    {
        id: 'tools',
        name: 'Tools',
        description: 'Analyze deals and crunch numbers like a pro',
        icon: Calculator,
        color: 'from-yellow-500 to-amber-500',
        features: [
            'Mortgage Calculator for payment estimates',
            'Renovation ROI Calculator',
            'Property Valuation with AI estimates',
        ],
        path: '/tools',
        recommendedFor: ['Investors', 'Deal Analyzers'],
    },
    {
        id: 'library',
        name: 'Library',
        description: 'All your content, research, and media in one place',
        icon: Library,
        color: 'from-indigo-500 to-purple-500',
        features: [
            'Content Management for all materials',
            'Research Reports saved and organized',
            'Media Library for images and documents',
        ],
        path: '/library',
        recommendedFor: ['Organized Agents', 'Content Managers'],
    },
];

export default function HubSelectionPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);
    const [onboardingState, setOnboardingState] = useState<any>(null);
    const [selectedHub, setSelectedHub] = useState<string | null>(null);

    const userId = user?.id || '';

    const {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
    } = useOnboardingSkip(userId, 'selection');

    // Load onboarding state on mount
    useEffect(() => {
        const loadState = async () => {
            if (!userId) return;

            try {
                const state = await onboardingService.getOnboardingState(userId);
                setOnboardingState(state);

                // Restore previously selected hub if any
                if (state?.metadata?.selectedHub) {
                    setSelectedHub(state.metadata.selectedHub);
                }
            } catch (error) {
                console.error('[HUB_SELECTION_PAGE] Error loading onboarding state:', error);
            }
        };

        loadState();
    }, [userId]);

    /**
     * Handle hub selection
     * Requirement 4.2: Record selection in onboarding state
     */
    const handleHubSelect = (hubId: string) => {
        setSelectedHub(hubId);
    };

    /**
     * Handle next button click
     * Requirement 4.3: Navigate to selected hub
     * Requirement 4.4: Display contextual tips for selected hub
     * Requirement 4.5: Default to Dashboard if no selection
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
            // Mark selection step as completed
            await onboardingService.completeStep(userId, 'selection');

            // Save selected hub to metadata
            // Requirement 4.2: Record selection in state
            if (selectedHub) {
                await onboardingService.updateMetadata(userId, {
                    selectedHub,
                });
            }

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                onboardingState?.flowType || 'user',
                'selection'
            );

            // Show success message
            toast({
                title: 'Selection Saved',
                description: selectedHub
                    ? `Great choice! Let's explore ${hubOptions.find(h => h.id === selectedHub)?.name}.`
                    : 'You can explore any hub from the dashboard.',
            });

            // Navigate to completion screen
            // The completion screen will handle the final navigation
            router.push('/onboarding/user/complete');
        } catch (error) {
            console.error('[HUB_SELECTION_PAGE] Error completing selection:', error);
            toast({
                title: 'Error',
                description: 'Failed to save selection. Please try again.',
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
        router.push('/onboarding/user/tour');
    };

    return (
        <>
            <OnboardingContainer
                currentStep={4}
                totalSteps={5}
                stepId="selection"
                title="Choose Your Starting Point"
                description="Select a hub to explore first. Don't worry, you'll have access to all features."
                onNext={handleNext}
                onSkip={openSkipDialog}
                onBack={handleBack}
                nextLabel={selectedHub ? 'Continue' : 'Skip to Dashboard'}
                isLoading={isLoading}
            >
                {/* Hub selection grid - Requirement 4.1 */}
                <div
                    className={cn(
                        'grid gap-4 sm:gap-6',
                        isMobile
                            ? 'grid-cols-1'
                            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    )}
                    role="radiogroup"
                    aria-label="Select a hub to explore"
                >
                    {hubOptions.map((hub) => (
                        <HubSelectionCard
                            key={hub.id}
                            hub={hub}
                            isSelected={selectedHub === hub.id}
                            onSelect={handleHubSelect}
                        />
                    ))}
                </div>

                {/* Selection hint */}
                <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {selectedHub ? (
                            <>
                                You selected{' '}
                                <span className="font-semibold text-foreground">
                                    {hubOptions.find(h => h.id === selectedHub)?.name}
                                </span>
                                . Click Continue to explore it with contextual tips.
                            </>
                        ) : (
                            'Select a hub above or skip to explore the dashboard first.'
                        )}
                    </p>
                </div>

                {/* Contextual tips preview - Requirement 4.4 */}
                {selectedHub && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <div
                                    className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center',
                                        'bg-gradient-to-br',
                                        hubOptions.find(h => h.id === selectedHub)?.color
                                    )}
                                >
                                    {(() => {
                                        const Hub = hubOptions.find(h => h.id === selectedHub);
                                        return Hub ? <Hub.icon className="w-4 h-4 text-white" /> : null;
                                    })()}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold mb-1">
                                    What's Next?
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    We'll show you around{' '}
                                    {hubOptions.find(h => h.id === selectedHub)?.name} with
                                    helpful tips to get you started quickly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Access all hubs hint */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                        <strong>Remember:</strong> You'll have access to all hubs from the
                        navigation menu. This just helps us show you around your preferred
                        starting point.
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

// Helper function for className concatenation
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
