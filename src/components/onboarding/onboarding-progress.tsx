'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/common';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import { Check } from 'lucide-react';

export interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
    className?: string;
}

/**
 * OnboardingProgress Component
 * 
 * Displays a visual progress indicator showing completion percentage.
 * Features:
 * - Animated progress bar
 * - Step indicators (responsive)
 * - Mobile-first responsive design
 * - Touch-friendly on mobile devices
 * 
 * Requirements: 7.1, 9.1, 9.2, 9.3
 */
export function OnboardingProgress({
    currentStep,
    totalSteps,
    className,
}: OnboardingProgressProps) {
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();

    // Calculate progress percentage
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div
            className={cn('space-y-2 sm:space-y-3', className)}
            role="region"
            aria-label="Onboarding progress"
        >
            {/* Progress Bar - Responsive height */}
            <div className="relative">
                <Progress
                    value={progress}
                    className={cn(
                        "transition-all duration-300",
                        isMobile ? "h-1.5" : "h-2"
                    )}
                    aria-label={`Onboarding progress: Step ${currentStep} of ${totalSteps}, ${Math.round(progress)}% complete`}
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                    role="progressbar"
                />
            </div>

            {/* Step Indicators - Responsive display */}
            {/* Mobile: Simplified dots */}
            {isMobile && (
                <div
                    className="flex justify-center items-center gap-1.5"
                    aria-label="Step indicators"
                >
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                        <motion.div
                            key={step}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: step * 0.03 }}
                            className={cn(
                                'rounded-full transition-all duration-300',
                                step < currentStep && 'w-2 h-2 bg-primary',
                                step === currentStep && 'w-2.5 h-2.5 bg-primary',
                                step > currentStep && 'w-2 h-2 bg-muted'
                            )}
                            aria-label={`Step ${step}${step === currentStep ? ' (current)' : step < currentStep ? ' (completed)' : ' (upcoming)'}`}
                            aria-current={step === currentStep ? 'step' : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Tablet: Medium-sized indicators */}
            {isTablet && !isMobile && (
                <div
                    className="flex justify-between items-center px-2"
                    aria-label="Step indicators"
                >
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                        <motion.div
                            key={step}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: step * 0.04 }}
                            className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300',
                                step < currentStep && 'bg-primary text-primary-foreground',
                                step === currentStep && 'bg-primary text-primary-foreground ring-3 ring-primary/20',
                                step > currentStep && 'bg-muted text-muted-foreground'
                            )}
                            aria-label={`Step ${step}${step === currentStep ? ' (current)' : step < currentStep ? ' (completed)' : ' (upcoming)'}`}
                            aria-current={step === currentStep ? 'step' : undefined}
                        >
                            {step < currentStep ? (
                                <Check className="w-3 h-3" aria-hidden="true" />
                            ) : (
                                step
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Desktop: Full-sized indicators with checkmarks */}
            {!isMobile && !isTablet && (
                <div
                    className="flex justify-between items-center"
                    aria-label="Step indicators"
                >
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                        <motion.div
                            key={step}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: step * 0.05 }}
                            className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300',
                                step < currentStep && 'bg-primary text-primary-foreground',
                                step === currentStep && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                                step > currentStep && 'bg-muted text-muted-foreground'
                            )}
                            aria-label={`Step ${step}${step === currentStep ? ' (current)' : step < currentStep ? ' (completed)' : ' (upcoming)'}`}
                            aria-current={step === currentStep ? 'step' : undefined}
                        >
                            {step < currentStep ? (
                                <Check className="w-4 h-4" aria-hidden="true" />
                            ) : (
                                step
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
