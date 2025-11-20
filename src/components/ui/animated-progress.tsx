/**
 * Animated Progress Component
 * Progress bars and indicators with smooth animations
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedProgressProps {
    value: number;
    max?: number;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}

export const AnimatedProgress = React.forwardRef<HTMLDivElement, AnimatedProgressProps>(
    (
        {
            value,
            max = 100,
            variant = 'default',
            size = 'md',
            showLabel = false,
            animated = true,
            className,
        },
        ref
    ) => {
        const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

        const sizeClasses = {
            sm: 'h-1',
            md: 'h-2',
            lg: 'h-3',
        };

        const variantClasses = {
            default: 'bg-primary',
            success: 'bg-success',
            warning: 'bg-warning',
            error: 'bg-destructive',
            gradient: 'bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%]',
        };

        return (
            <div ref={ref} className={cn('w-full', className)}>
                <div className={cn('w-full bg-secondary rounded-full overflow-hidden', sizeClasses[size])}>
                    <motion.div
                        className={cn('h-full rounded-full', variantClasses[variant])}
                        initial={{ width: 0 }}
                        animate={{
                            width: `${percentage}%`,
                            ...(variant === 'gradient' && animated
                                ? { backgroundPosition: ['0% 0', '200% 0'] }
                                : {}),
                        }}
                        transition={{
                            width: { duration: 0.5, ease: 'easeOut' },
                            ...(variant === 'gradient' && animated
                                ? {
                                    backgroundPosition: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    },
                                }
                                : {}),
                        }}
                    />
                </div>
                {showLabel && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-sm text-muted-foreground text-center"
                    >
                        {Math.round(percentage)}%
                    </motion.p>
                )}
            </div>
        );
    }
);

AnimatedProgress.displayName = 'AnimatedProgress';

// Circular progress indicator
export interface CircularProgressProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    variant?: 'default' | 'success' | 'warning' | 'error';
    showLabel?: boolean;
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'default',
    showLabel = true,
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const variantColors = {
        default: 'hsl(var(--primary))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--destructive))',
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="hsl(var(--secondary))"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={variantColors[variant]}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            {showLabel && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
                </motion.div>
            )}
        </div>
    );
};

// Step progress indicator
export interface StepProgressProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep, className }) => {
    return (
        <div className={cn('w-full', className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                                        isCompleted && 'bg-success text-success-foreground',
                                        isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                                        !isCompleted && !isCurrent && 'bg-secondary text-muted-foreground'
                                    )}
                                >
                                    {isCompleted ? '✓' : index + 1}
                                </motion.div>
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        isCurrent && 'text-primary',
                                        !isCurrent && 'text-muted-foreground'
                                    )}
                                >
                                    {step}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-0.5 bg-secondary mx-2 relative overflow-hidden">
                                    {isCompleted && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="absolute inset-0 bg-success"
                                        />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
