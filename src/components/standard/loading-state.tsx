'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * StandardLoadingState - Unified loading indicators with consistent styling and behavior
 *
 * @example
 * <StandardLoadingState variant="spinner" size="md" text="Loading content..." />
 * <StandardLoadingState variant="skeleton" size="lg" />
 * <StandardLoadingState variant="pulse" fullScreen />
 *
 * Provides consistent loading feedback across the application with multiple variants
 */
export interface StandardLoadingStateProps {
    variant?: 'spinner' | 'skeleton' | 'pulse' | 'shimmer';
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

const skeletonSizeClasses = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32',
};

export function StandardLoadingState({
    variant = 'spinner',
    size = 'md',
    text,
    fullScreen = false,
    className,
}: StandardLoadingStateProps) {
    // Spinner variant
    if (variant === 'spinner') {
        const content = (
            <div
                className={cn('flex flex-col items-center justify-center gap-3', className)}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 className={cn('text-primary', sizeClasses[size])} aria-hidden="true" />
                </motion.div>
                {text && <p className="text-sm text-muted-foreground">{text}</p>}
                {!text && <span className="sr-only">Loading...</span>}
            </div>
        );

        if (fullScreen) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    {content}
                </div>
            );
        }

        return content;
    }

    // Skeleton variant
    if (variant === 'skeleton') {
        const content = (
            <div
                className={cn('space-y-3', className)}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className={cn('animate-pulse rounded-md bg-muted', skeletonSizeClasses[size])} />
                <div className="space-y-2">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                </div>
                <span className="sr-only">{text || 'Loading content...'}</span>
            </div>
        );

        if (fullScreen) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8">
                    <div className="w-full max-w-2xl">{content}</div>
                </div>
            );
        }

        return content;
    }

    // Pulse variant
    if (variant === 'pulse') {
        const content = (
            <div
                className={cn('flex flex-col items-center justify-center gap-3', className)}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <motion.div
                    className={cn('rounded-full bg-primary', sizeClasses[size])}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    aria-hidden="true"
                />
                {text && <p className="text-sm text-muted-foreground">{text}</p>}
                {!text && <span className="sr-only">Loading...</span>}
            </div>
        );

        if (fullScreen) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    {content}
                </div>
            );
        }

        return content;
    }

    // Shimmer variant
    if (variant === 'shimmer') {
        const content = (
            <div
                className={cn('relative overflow-hidden', className)}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className={cn('rounded-md bg-muted', skeletonSizeClasses[size])}>
                    <motion.div
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                            translateX: ['100%', '100%'],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        aria-hidden="true"
                    />
                </div>
                {text && <p className="mt-3 text-sm text-muted-foreground text-center">{text}</p>}
                {!text && <span className="sr-only">Loading...</span>}
            </div>
        );

        if (fullScreen) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8">
                    <div className="w-full max-w-2xl">{content}</div>
                </div>
            );
        }

        return content;
    }

    return null;
}
