'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Loader2, Brain, Zap, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils/common';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadingProps {
    variant?: 'default' | 'ai' | 'minimal' | 'skeleton' | 'dots' | 'pulse';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    message?: string;
    showSubtext?: boolean;
    className?: string;
    fullScreen?: boolean;
    featureType?: 'content' | 'image' | 'research' | 'analysis' | 'default';
}

export interface SkeletonProps {
    className?: string;
    lines?: number;
    showAvatar?: boolean;
    showHeader?: boolean;
    animated?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FEATURE_MESSAGES = {
    content: [
        'Crafting compelling content...',
        'Analyzing market trends...',
        'Optimizing for engagement...',
        'Building your unique voice...',
        'Researching insights...',
    ],
    image: [
        'Processing your image...',
        'Applying AI enhancements...',
        'Analyzing visual elements...',
        'Optimizing composition...',
        'Finalizing improvements...',
    ],
    research: [
        'Gathering market data...',
        'Analyzing trends...',
        'Compiling insights...',
        'Validating information...',
        'Preparing your report...',
    ],
    analysis: [
        'Crunching numbers...',
        'Running calculations...',
        'Analyzing data points...',
        'Generating insights...',
        'Preparing results...',
    ],
    default: [
        'Processing your request...',
        'Almost ready...',
        'Working on it...',
        'Just a moment...',
        'Finalizing...',
    ],
};

const SIZE_CLASSES = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', container: 'p-4' },
    md: { icon: 'w-6 h-6', text: 'text-base', container: 'p-6' },
    lg: { icon: 'w-8 h-8', text: 'text-lg', container: 'p-8' },
    xl: { icon: 'w-12 h-12', text: 'text-xl', container: 'p-12' },
};

// ============================================================================
// MAIN LOADING COMPONENT
// ============================================================================

export function Loading({
    variant = 'default',
    size = 'md',
    message,
    showSubtext = false,
    className,
    fullScreen = false,
    featureType = 'default',
}: LoadingProps) {
    const shouldReduceMotion = useReducedMotion();
    const [subtextIndex, setSubtextIndex] = useState(0);
    const subtexts = FEATURE_MESSAGES[featureType];
    const sizeConfig = SIZE_CLASSES[size];

    // Cycle through subtexts
    useEffect(() => {
        if (showSubtext && subtexts.length > 1) {
            const interval = setInterval(() => {
                setSubtextIndex((prev) => (prev + 1) % subtexts.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [showSubtext, subtexts.length]);

    const content = (
        <div className={cn(
            'flex flex-col items-center justify-center text-center w-full h-full min-h-[200px]',
            sizeConfig.container,
            className
        )}>
            <div className="flex flex-col items-center justify-center">
                {variant === 'ai' && <AILoadingContent size={size} shouldReduceMotion={shouldReduceMotion} />}
                {variant === 'minimal' && <MinimalLoadingContent size={size} shouldReduceMotion={shouldReduceMotion} />}
                {variant === 'dots' && <DotsLoadingContent size={size} />}
                {variant === 'pulse' && <PulseLoadingContent size={size} shouldReduceMotion={shouldReduceMotion} />}
                {variant === 'default' && <DefaultLoadingContent size={size} shouldReduceMotion={shouldReduceMotion} />}

                {/* Message and subtext */}
                {(message || showSubtext) && (
                    <div className="mt-6 text-center space-y-3 max-w-md mx-auto">
                        {message && (
                            <motion.p
                                className={cn('font-medium text-foreground', sizeConfig.text)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {message}
                            </motion.p>
                        )}

                        <AnimatePresence mode="wait">
                            {showSubtext && (
                                <motion.p
                                    key={subtextIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-sm text-muted-foreground"
                                >
                                    {subtexts[subtextIndex]}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card border rounded-2xl shadow-xl max-w-sm w-full mx-4">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}

// ============================================================================
// LOADING VARIANTS
// ============================================================================

function AILoadingContent({ size, shouldReduceMotion }: { size: string; shouldReduceMotion: boolean | null }) {
    const iconSize = SIZE_CLASSES[size as keyof typeof SIZE_CLASSES].icon;
    const containerSize = size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-20 h-20' : size === 'lg' ? 'w-24 h-24' : 'w-32 h-32';

    return (
        <div className="relative flex items-center justify-center">
            {/* Animated background gradient */}
            {!shouldReduceMotion && (
                <motion.div
                    className={cn("absolute rounded-full opacity-20", containerSize)}
                    style={{
                        background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
                        transform: 'scale(1.5)',
                    }}
                    animate={{
                        scale: [1.5, 1.8, 1.5],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Main icon */}
            <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={shouldReduceMotion ? {} : {
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <div className={cn('rounded-full bg-primary/10 p-4 flex items-center justify-center', containerSize)}>
                    <Sparkles className={cn(iconSize, 'text-primary')} />
                </div>
            </motion.div>

            {/* Floating particles */}
            {!shouldReduceMotion && (
                <>
                    {[
                        { delay: 0, x: -20, y: -20 },
                        { delay: 0.5, x: 20, y: -15 },
                        { delay: 1, x: -15, y: 20 },
                        { delay: 1.5, x: 15, y: 15 },
                    ].map((particle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                            style={{ left: '50%', top: '50%' }}
                            animate={{
                                x: [0, particle.x, 0],
                                y: [0, particle.y, 0],
                                opacity: [0.3, 1, 0.3],
                                scale: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

function MinimalLoadingContent({ size, shouldReduceMotion }: { size: string; shouldReduceMotion: boolean | null }) {
    const iconSize = SIZE_CLASSES[size as keyof typeof SIZE_CLASSES].icon;

    return (
        <motion.div
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
            }}
        >
            <Loader2 className={cn(iconSize, 'text-primary')} />
        </motion.div>
    );
}

function DotsLoadingContent({ size }: { size: string }) {
    const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

    return (
        <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={cn(dotSize, 'bg-primary rounded-full animate-loading-dots')}
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </div>
    );
}

function PulseLoadingContent({ size, shouldReduceMotion }: { size: string; shouldReduceMotion: boolean | null }) {
    const iconSize = SIZE_CLASSES[size as keyof typeof SIZE_CLASSES].icon;

    return (
        <motion.div
            className={cn('rounded-full bg-primary/20 p-4 flex items-center justify-center')}
            animate={shouldReduceMotion ? {} : {
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            <Brain className={cn(iconSize, 'text-primary')} />
        </motion.div>
    );
}

function DefaultLoadingContent({ size, shouldReduceMotion }: { size: string; shouldReduceMotion: boolean | null }) {
    const iconSize = SIZE_CLASSES[size as keyof typeof SIZE_CLASSES].icon;

    return (
        <div className="relative">
            <motion.div
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            >
                <Loader2 className={cn(iconSize, 'text-primary')} />
            </motion.div>
        </div>
    );
}

// ============================================================================
// SKELETON LOADING
// ============================================================================

export function Skeleton({ className, lines = 3, showAvatar = false, showHeader = false, animated = true }: SkeletonProps) {
    const baseClass = cn(
        'bg-muted rounded',
        animated && 'animate-pulse',
        className
    );

    return (
        <div className="space-y-3">
            {showHeader && (
                <div className="flex items-center space-x-3">
                    {showAvatar && <div className={cn(baseClass, 'w-10 h-10 rounded-full')} />}
                    <div className="space-y-2 flex-1">
                        <div className={cn(baseClass, 'h-4 w-1/3')} />
                        <div className={cn(baseClass, 'h-3 w-1/2')} />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClass,
                            'h-4',
                            i === lines - 1 ? 'w-3/4' : 'w-full'
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SPECIALIZED LOADING COMPONENTS
// ============================================================================

export function LoadingCard({ className, ...props }: SkeletonProps) {
    return (
        <div className={cn('rounded-2xl border bg-card p-6', className)}>
            <Skeleton showHeader showAvatar lines={4} {...props} />
        </div>
    );
}

export function LoadingButton({ children, isLoading, ...props }: any) {
    return (
        <button disabled={isLoading} {...props}>
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <Loading variant="minimal" size="sm" />
                    <span>Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}

// ============================================================================
// PROGRESS LOADING
// ============================================================================

interface ProgressLoadingProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function ProgressLoading({ steps, currentStep, className }: ProgressLoadingProps) {
    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
                <span className="text-muted-foreground">
                    {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
                <div className="flex gap-1">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                'h-2 rounded-full flex-1 transition-all duration-300',
                                index <= currentStep ? 'bg-primary' : 'bg-muted'
                            )}
                        />
                    ))}
                </div>

                <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground"
                >
                    {steps[currentStep]}
                </motion.p>
            </div>

            {/* Loading indicator */}
            <div className="flex justify-center">
                <Loading variant="ai" size="md" />
            </div>
        </div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { LoadingCard as SkeletonCard };
export default Loading;