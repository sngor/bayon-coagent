'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils/common';
import { createKeyboardHandler } from '@/lib/accessibility/keyboard-navigation';
import { announceNavigation } from '@/lib/accessibility/announcer';

export interface OnboardingNavigationProps {
    onNext?: () => void | Promise<void>;
    onSkip?: () => void | Promise<void>;
    onBack?: () => void;
    nextLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    showBack?: boolean;
    isLoading?: boolean;
}

/**
 * OnboardingNavigation Component
 * 
 * Provides navigation buttons for onboarding flow.
 * Features:
 * - Back button (when applicable)
 * - Skip button (optional)
 * - Next/Continue button
 * - Loading states
 * - Mobile-first responsive layout
 * - Touch-optimized buttons (min 44x44px on mobile)
 * 
 * Requirements: 7.4, 10.1
 */
export function OnboardingNavigation({
    onNext,
    onSkip,
    onBack,
    nextLabel = 'Continue',
    skipLabel = 'Skip',
    allowSkip = true,
    showBack = false,
    isLoading = false,
}: OnboardingNavigationProps) {
    const [isNextLoading, setIsNextLoading] = useState(false);
    const [isSkipLoading, setIsSkipLoading] = useState(false);
    const isMobile = useIsMobile();

    const handleNext = async () => {
        if (!onNext || isNextLoading) return;

        setIsNextLoading(true);
        announceNavigation('forward', nextLabel);
        try {
            await onNext();
        } finally {
            setIsNextLoading(false);
        }
    };

    const handleSkip = async () => {
        if (!onSkip || isSkipLoading) return;

        setIsSkipLoading(true);
        announceNavigation('skip', skipLabel);
        try {
            await onSkip();
        } finally {
            setIsSkipLoading(false);
        }
    };

    const handleBack = () => {
        if (!onBack) return;
        announceNavigation('back', 'previous step');
        onBack();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = createKeyboardHandler([
            {
                key: 'Enter',
                handler: (e) => {
                    // Only trigger if not focused on a button or input
                    const target = e.target as HTMLElement;
                    if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                        if (onNext && !isNextLoading && !isSkipLoading) {
                            handleNext();
                        }
                    }
                },
            },
        ]);

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [onNext, isNextLoading, isSkipLoading]);

    return (
        <nav
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-border/20"
            role="navigation"
            aria-label="Onboarding navigation"
        >
            {/* Back Button - Hidden on mobile when not needed */}
            <div className="flex-shrink-0 order-3 sm:order-1">
                {showBack && onBack ? (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isLoading || isNextLoading || isSkipLoading}
                        className={cn(
                            "w-full sm:w-auto",
                            // Touch target optimization for mobile (min 44x44px)
                            isMobile && "min-h-[44px] touch-manipulation"
                        )}
                        aria-label="Go back to previous step"
                        title="Go back to previous step"
                    >
                        <ArrowLeft className={ICON_SIZES.sm} aria-hidden="true" />
                        Back
                    </Button>
                ) : (
                    <div className="hidden sm:block" aria-hidden="true" />
                )}
            </div>

            {/* Skip and Next Buttons - Optimized for mobile touch */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
                {allowSkip && onSkip && (
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isLoading || isNextLoading || isSkipLoading}
                        loading={isSkipLoading}
                        className={cn(
                            "w-full sm:w-auto",
                            // Touch target optimization for mobile (min 44x44px)
                            isMobile && "min-h-[44px] touch-manipulation"
                        )}
                        aria-label={`Skip this step: ${skipLabel}. Press Escape to skip.`}
                        title={`Skip this step: ${skipLabel}`}
                    >
                        <SkipForward className={ICON_SIZES.sm} aria-hidden="true" />
                        {skipLabel}
                    </Button>
                )}
                {onNext && (
                    <Button
                        onClick={handleNext}
                        disabled={isLoading || isNextLoading || isSkipLoading}
                        loading={isNextLoading}
                        className={cn(
                            "w-full sm:w-auto",
                            // Touch target optimization for mobile (min 44x44px)
                            isMobile && "min-h-[44px] touch-manipulation font-semibold"
                        )}
                        aria-label={`Continue to next step: ${nextLabel}. Press Enter to continue.`}
                        title={`Continue to next step: ${nextLabel}`}
                    >
                        {nextLabel}
                        <ArrowRight className={ICON_SIZES.sm} aria-hidden="true" />
                    </Button>
                )}
            </div>
        </nav>
    );
}
