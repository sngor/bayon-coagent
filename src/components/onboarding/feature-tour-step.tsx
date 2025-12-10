'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';

/**
 * Feature Tour Step Component
 * 
 * Displays a single hub in the feature tour with:
 * - Hub icon and name
 * - Description
 * - Key features list
 * - Visual styling with gradient accents
 * - Smooth animations
 * - Mobile-responsive layout
 * 
 * Requirements: 3.1, 3.2, 7.1, 7.4
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

interface FeatureTourStepProps {
    step: TourStep;
    stepNumber: number;
    totalSteps: number;
}

export function FeatureTourStep({ step, stepNumber, totalSteps }: FeatureTourStepProps) {
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();
    const Icon = step.icon;

    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                duration: 0.3,
            }}
            className="w-full"
        >
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color}`} />

                <div className="p-6 sm:p-8 md:p-10">
                    {/* Header with icon and badge */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Icon with gradient background */}
                            <div
                                className={`
                                    flex items-center justify-center
                                    w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                                    rounded-2xl
                                    bg-gradient-to-br ${step.color}
                                    shadow-lg
                                `}
                            >
                                <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                            </div>

                            {/* Hub name and title */}
                            <div>
                                <Badge
                                    variant="secondary"
                                    className="mb-2 text-xs font-medium"
                                >
                                    {step.hub}
                                </Badge>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-headline tracking-tight">
                                    {step.title}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                        {step.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                            Key Features
                        </h3>
                        <div className="grid gap-3 sm:gap-4">
                            {step.features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.1,
                                        duration: 0.3,
                                    }}
                                    className="flex items-start gap-3 group"
                                >
                                    {/* Check icon with gradient background */}
                                    <div
                                        className={`
                                            flex-shrink-0
                                            flex items-center justify-center
                                            w-6 h-6 sm:w-7 sm:h-7
                                            rounded-full
                                            bg-gradient-to-br ${step.color}
                                            group-hover:scale-110
                                            transition-transform
                                        `}
                                    >
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                    </div>

                                    {/* Feature text */}
                                    <p className="text-sm sm:text-base text-foreground leading-relaxed pt-0.5">
                                        {feature}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile-optimized touch target hint */}
                    {isMobile && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                                Swipe or use the buttons below to navigate
                            </p>
                        </div>
                    )}
                </div>

                {/* Decorative gradient overlay */}
                <div
                    className={`
                        absolute -bottom-20 -right-20
                        w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56
                        bg-gradient-to-br ${step.color}
                        opacity-5
                        rounded-full
                        blur-3xl
                        pointer-events-none
                    `}
                />
            </Card>

            {/* Step indicator dots for mobile */}
            {isMobile && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <div
                            key={index}
                            className={`
                                w-2 h-2 rounded-full transition-all duration-300
                                ${index === stepNumber - 1
                                    ? 'bg-primary w-6'
                                    : 'bg-muted-foreground/30'
                                }
                            `}
                            aria-label={`Step ${index + 1}${index === stepNumber - 1 ? ' (current)' : ''}`}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
