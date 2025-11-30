/**
 * Skeleton Loader Component
 * Animated skeleton screens for loading states
 */

'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/common';

export interface SkeletonProps extends HTMLMotionProps<"div"> {
    variant?: 'default' | 'shimmer' | 'pulse';
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = 'shimmer', rounded = 'md', ...props }, ref) => {
        const roundedClasses = {
            none: 'rounded-none',
            sm: 'rounded-sm',
            md: 'rounded-md',
            lg: 'rounded-lg',
            full: 'rounded-full',
        };

        const variantClasses = {
            default: 'bg-muted',
            shimmer: 'bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]',
            pulse: 'bg-muted',
        };

        const animationProps = {
            default: {},
            shimmer: {
                animate: {
                    backgroundPosition: ['200% 0', '-200% 0'],
                },
                transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                },
            },
            pulse: {
                animate: {
                    opacity: [0.5, 1, 0.5],
                },
                transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            },
        };

        return (
            <motion.div
                ref={ref}
                className={cn(variantClasses[variant], roundedClasses[rounded], className)}
                {...animationProps[variant]}
                {...props}
            />
        );
    }
);

Skeleton.displayName = 'Skeleton';

// Preset skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('space-y-3 p-4', className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
    </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className,
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return <Skeleton rounded="full" className={cn(sizeClasses[size], className)} />;
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className,
}) => (
    <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
            />
        ))}
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
    rows = 5,
    columns = 4,
    className,
}) => (
    <div className={cn('space-y-3', className)}>
        {/* Header */}
        <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-8 flex-1" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-12 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
    items = 5,
    className,
}) => (
    <div className={cn('space-y-3', className)}>
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                <SkeletonAvatar size="md" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);
