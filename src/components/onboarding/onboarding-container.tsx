'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { OnboardingProgress } from './onboarding-progress';
import { OnboardingNavigation } from './onboarding-navigation';
import { FlowIndicator } from './flow-indicator';
import { Logo } from '@/components/logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import { SkipLink } from '@/lib/accessibility/skip-link';
import { manageFocusForStepTransition, createKeyboardHandler } from '@/lib/accessibility';
import { announceProgress } from '@/lib/accessibility/announcer';
import type { OnboardingFlowType } from '@/types/onboarding';

export interface OnboardingContainerProps {
    currentStep: number;
    totalSteps: number;
    stepId: string;
    title: string;
    description: string;
    children: React.ReactNode;
    onNext?: () => void | Promise<void>;
    onSkip?: () => void | Promise<void>;
    onBack?: () => void;
    nextLabel?: string;
    skipLabel?: string;
    showProgress?: boolean;
    allowSkip?: boolean;
    isLoading?: boolean;
    /** Flow type for dual role users - shows flow indicator */
    flowType?: OnboardingFlowType;
    /** Whether to show flow indicator */
    showFlowIndicator?: boolean;
}

/**
 * OnboardingContainer Component
 * 
 * Provides consistent layout and navigation for all onboarding steps.
 * Features:
 * - Progress bar at top
 * - Consistent header with title and description
 * - Navigation buttons (Back, Skip, Next)
 * - Responsive layout with mobile-first design
 * - Framer Motion page transitions
 * - Touch-optimized for mobile devices
 * 
 * Requirements: 7.1, 7.4, 9.1, 9.2, 10.1
 */
export function OnboardingContainer({
    currentStep,
    totalSteps,
    stepId,
    title,
    description,
    children,
    onNext,
    onSkip,
    onBack,
    nextLabel = 'Continue',
    skipLabel = 'Skip',
    showProgress = true,
    allowSkip = true,
    isLoading = false,
    flowType,
    showFlowIndicator = false,
}: OnboardingContainerProps) {
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();
    const mainRef = useRef<HTMLElement>(null);

    // Announce progress updates to screen readers
    useEffect(() => {
        announceProgress(currentStep, totalSteps, title);
    }, [currentStep, totalSteps, title]);

    // Manage focus on step transitions
    useEffect(() => {
        manageFocusForStepTransition(stepId);
    }, [stepId]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyboard = createKeyboardHandler([
            {
                key: 'Escape',
                handler: () => {
                    if (onSkip && allowSkip) {
                        onSkip();
                    }
                },
                preventDefault: true,
            },
        ]);

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [onSkip, allowSkip]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Skip Link for keyboard users */}
            <SkipLink targetId="onboarding-main-content" text="Skip to onboarding content" />

            {/* Header with Logo and Progress - Mobile optimized */}
            <header
                className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/20 safe-area-inset-top"
                role="banner"
            >
                <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        {/* Logo - Scaled for mobile */}
                        <div className="scale-90 sm:scale-100 origin-left">
                            <Logo />
                        </div>
                        {showProgress && (
                            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                {isMobile ? `${currentStep}/${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
                            </div>
                        )}
                    </div>
                    {showProgress && (
                        <OnboardingProgress
                            currentStep={currentStep}
                            totalSteps={totalSteps}
                        />
                    )}
                </div>
            </header>

            {/* Main Content - Mobile-first responsive padding */}
            <main
                id="onboarding-main-content"
                ref={mainRef}
                className="flex-1 container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 safe-area-inset-bottom"
                role="main"
                aria-label="Onboarding content"
            >
                <motion.div
                    key={stepId}
                    initial={{ opacity: 0, x: isMobile ? 10 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isMobile ? -10 : -20 }}
                    transition={{
                        type: 'tween',
                        ease: 'easeInOut',
                        duration: isMobile ? 0.2 : 0.3,
                    }}
                    className="space-y-6 sm:space-y-8"
                >
                    {/* Step Header - Responsive text alignment and sizing */}
                    <div className="space-y-2 sm:space-y-3 text-center md:text-left">
                        {/* Flow Indicator for dual role users */}
                        {showFlowIndicator && flowType && (
                            <div className="flex justify-center md:justify-start mb-3">
                                <FlowIndicator
                                    flowType={flowType}
                                    currentStepId={stepId}
                                    compact={isMobile}
                                />
                            </div>
                        )}

                        <h1
                            className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline tracking-tight leading-tight px-2 sm:px-0"
                            id="onboarding-step-title"
                        >
                            {title}
                        </h1>
                        <p
                            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0 px-2 sm:px-0"
                            id="onboarding-step-description"
                        >
                            {description}
                        </p>
                    </div>

                    {/* Step Content - Responsive spacing */}
                    <div
                        className="py-2 sm:py-4"
                        role="region"
                        aria-labelledby="onboarding-step-title"
                        aria-describedby="onboarding-step-description"
                    >
                        {children}
                    </div>

                    {/* Navigation - Mobile-optimized layout */}
                    <OnboardingNavigation
                        onNext={onNext}
                        onSkip={onSkip}
                        onBack={onBack}
                        nextLabel={nextLabel}
                        skipLabel={skipLabel}
                        allowSkip={allowSkip}
                        showBack={currentStep > 1}
                        isLoading={isLoading}
                    />
                </motion.div>
            </main>
        </div>
    );
}
