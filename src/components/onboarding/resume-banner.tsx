'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface ResumeBannerProps {
    /** Name of the next step to resume */
    nextStepName: string;
    /** Progress percentage (0-100) */
    progress: number;
    /** Callback when resume button is clicked */
    onResume: () => void;
    /** Callback when banner is dismissed */
    onDismiss: () => void;
    /** Optional custom className */
    className?: string;
}

/**
 * ResumeBanner Component
 * 
 * Displays a dismissible banner prompting users to continue incomplete onboarding.
 * Features:
 * - Progress display with percentage and visual bar
 * - Dismissible for current session (uses sessionStorage)
 * - Shows banner on incomplete onboarding
 * - Resume button navigates to next step
 * - Mobile-responsive design
 * - Smooth animations with Framer Motion
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */
export function ResumeBanner({
    nextStepName,
    progress,
    onResume,
    onDismiss,
    className,
}: ResumeBannerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const isMobile = useIsMobile();

    // Session storage key for tracking dismissal
    const DISMISSAL_KEY = 'onboarding-banner-dismissed';

    /**
     * Check if banner was dismissed in current session
     * Requirement 5.4: Dismissal hides banner for current session
     */
    useEffect(() => {
        const dismissed = sessionStorage.getItem(DISMISSAL_KEY);
        if (dismissed === 'true') {
            setIsDismissed(true);
        } else {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    /**
     * Handle banner dismissal
     * Requirement 5.4: Dismissible banner for current session
     */
    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        // Store dismissal in session storage (not localStorage)
        // Requirement 5.5: Banner reappears in new sessions
        sessionStorage.setItem(DISMISSAL_KEY, 'true');
        onDismiss();
    };

    /**
     * Handle resume button click
     * Requirement 5.3: Resume button navigates to next step
     */
    const handleResume = () => {
        setIsVisible(false);
        onResume();
    };

    // Don't render if dismissed
    if (isDismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                    }}
                    className={cn(
                        'fixed top-0 left-0 right-0 z-50 safe-area-inset-top',
                        className
                    )}
                    role="banner"
                    aria-label="Resume onboarding banner"
                >
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
                        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="py-3 sm:py-4">
                                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                    {/* Icon - Hidden on mobile to save space */}
                                    {!isMobile && (
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                                                    {isMobile ? 'Continue Setup' : 'Continue Your Onboarding'}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                                    {isMobile ? (
                                                        <>Next: {nextStepName}</>
                                                    ) : (
                                                        <>
                                                            You're {progress}% complete. Next step: <span className="font-medium">{nextStepName}</span>
                                                        </>
                                                    )}
                                                </p>

                                                {/* Progress Bar */}
                                                <div className="flex items-center gap-2">
                                                    <Progress
                                                        value={progress}
                                                        className="h-2 flex-1"
                                                        aria-label={`Onboarding progress: ${progress}%`}
                                                    />
                                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                        {progress}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    onClick={handleResume}
                                                    size={isMobile ? 'sm' : 'default'}
                                                    className="gap-2"
                                                    aria-label="Resume onboarding"
                                                >
                                                    {isMobile ? 'Resume' : 'Continue Setup'}
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dismiss Button */}
                                    <button
                                        onClick={handleDismiss}
                                        className={cn(
                                            'flex-shrink-0 p-1 rounded-md',
                                            'text-muted-foreground hover:text-foreground',
                                            'hover:bg-muted/50 transition-colors',
                                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                            // Touch target size for mobile
                                            'min-w-[44px] min-h-[44px] flex items-center justify-center'
                                        )}
                                        aria-label="Dismiss banner"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
