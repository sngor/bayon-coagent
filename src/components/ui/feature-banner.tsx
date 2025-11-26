'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, X, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

export interface FeatureBannerProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    variant?: 'default' | 'tip' | 'onboarding' | 'success' | 'warning';
    dismissible?: boolean;
    actions?: React.ReactNode;
    tips?: string[];
    className?: string;
    onDismiss?: () => void;
    buttonClassName?: string; // Optional custom button styling
}

export function FeatureBanner({
    title,
    description,
    icon: Icon,
    variant = 'default',
    dismissible = false,
    actions,
    tips,
    className,
    onDismiss,
    buttonClassName
}: FeatureBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    const variants = {
        default: {
            container: 'bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/60 transition-colors',
            icon: 'text-primary',
            title: 'text-foreground',
            description: 'text-muted-foreground',
            button: 'border-2 border-border/50 text-foreground hover:bg-accent hover:border-primary/50 active:bg-accent active:border-primary'
        },
        tip: {
            container: 'bg-blue-500/5 border-blue-500/20 backdrop-blur-sm hover:bg-blue-500/10 transition-colors',
            icon: 'text-blue-600 dark:text-blue-400',
            title: 'text-blue-950 dark:text-blue-50',
            description: 'text-blue-900/80 dark:text-blue-100/80',
            button: 'border-2 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50 active:bg-blue-500 active:text-white active:border-blue-500'
        },
        onboarding: {
            container: 'bg-violet-500/5 border-violet-500/20 backdrop-blur-sm hover:bg-violet-500/10 transition-colors',
            icon: 'text-violet-600 dark:text-violet-400',
            title: 'text-violet-950 dark:text-violet-50',
            description: 'text-violet-900/80 dark:text-violet-100/80',
            button: 'border-2 border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/50 active:bg-violet-500 active:text-white active:border-violet-500'
        },
        success: {
            container: 'bg-emerald-500/5 border-emerald-500/20 backdrop-blur-sm hover:bg-emerald-500/10 transition-colors',
            icon: 'text-emerald-600 dark:text-emerald-400',
            title: 'text-emerald-950 dark:text-emerald-50',
            description: 'text-emerald-900/80 dark:text-emerald-100/80',
            button: 'border-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 active:bg-emerald-500 active:text-white active:border-emerald-500'
        },
        warning: {
            container: 'bg-amber-500/5 border-amber-500/20 backdrop-blur-sm hover:bg-amber-500/10 transition-colors',
            icon: 'text-amber-600 dark:text-amber-400',
            title: 'text-amber-950 dark:text-amber-50',
            description: 'text-amber-900/80 dark:text-amber-100/80',
            button: 'border-2 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50 active:bg-amber-500 active:text-white active:border-amber-500'
        }
    };

    const styles = variants[variant];
    const DefaultIcon = variant === 'tip' ? Lightbulb : variant === 'success' ? CheckCircle : Icon;

    return (
        <div className={cn(
            'relative rounded-xl border shadow-sm overflow-hidden',
            styles.container,
            className
        )}>
            {/* Close button with better positioning */}
            {dismissible && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 h-7 w-7 p-0 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={handleDismiss}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}

            {/* Main content */}
            <div className="p-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    {DefaultIcon && (
                        <div className="flex-shrink-0 mt-1">
                            <div className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                'bg-gradient-to-br from-white/50 to-white/20 dark:from-white/10 dark:to-white/5',
                                'border border-white/20'
                            )}>
                                <DefaultIcon className={cn('h-5 w-5', styles.icon)} />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Header section */}
                        <div>
                            <h3 className={cn('font-semibold text-base leading-tight', styles.title)}>
                                {title}
                            </h3>
                            <p className={cn('text-sm mt-1.5 leading-relaxed', styles.description)}>
                                {description}
                            </p>
                        </div>

                        {/* Tips section */}
                        {tips && tips.length > 0 && (
                            <div className="space-y-2.5">
                                {tips.map((tip, index) => (
                                    <div key={index} className="flex items-start gap-2.5">
                                        <ArrowRight className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', styles.icon)} />
                                        <span className={cn('text-sm leading-relaxed', styles.description)}>
                                            {tip}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action buttons at bottom */}
                        {actions && (
                            <div className="pt-2">
                                {React.isValidElement(actions)
                                    ? React.cloneElement(actions as React.ReactElement<any>, {
                                        variant: undefined, // Remove default button variant
                                        className: cn(
                                            // Base button styles
                                            'inline-flex items-center justify-center gap-2 whitespace-nowrap',
                                            'bg-transparent', // Override default background
                                            'rounded-lg px-4 py-2 text-sm font-medium',
                                            'transition-all duration-200',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                            'disabled:pointer-events-none disabled:opacity-50',
                                            'active:scale-[0.97]',
                                            // Variant-specific styles
                                            styles.button,
                                            // Custom overrides
                                            buttonClassName,
                                            // Preserve original className if any
                                            (actions as React.ReactElement<any>).props?.className
                                        )
                                    })
                                    : actions
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}