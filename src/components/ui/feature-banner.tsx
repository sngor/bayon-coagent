'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, X, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { useState } from 'react';

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
    onDismiss
}: FeatureBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    const variants = {
        default: {
            container: 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20',
            icon: 'text-primary',
            title: 'text-foreground',
            description: 'text-muted-foreground'
        },
        tip: {
            container: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400',
            title: 'text-blue-900 dark:text-blue-100',
            description: 'text-blue-700 dark:text-blue-300'
        },
        onboarding: {
            container: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800',
            icon: 'text-green-600 dark:text-green-400',
            title: 'text-green-900 dark:text-green-100',
            description: 'text-green-700 dark:text-green-300'
        },
        success: {
            container: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800',
            icon: 'text-green-600 dark:text-green-400',
            title: 'text-green-900 dark:text-green-100',
            description: 'text-green-700 dark:text-green-300'
        },
        warning: {
            container: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800',
            icon: 'text-amber-600 dark:text-amber-400',
            title: 'text-amber-900 dark:text-amber-100',
            description: 'text-amber-700 dark:text-amber-300'
        }
    };

    const styles = variants[variant];
    const DefaultIcon = variant === 'tip' ? Lightbulb : variant === 'success' ? CheckCircle : Icon;

    return (
        <div className={cn(
            'relative rounded-lg border p-6 shadow-sm',
            styles.container,
            className
        )}>
            {dismissible && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={handleDismiss}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}

            <div className="flex items-start gap-4">
                {DefaultIcon && (
                    <div className="flex-shrink-0 mt-0.5">
                        <DefaultIcon className={cn('h-5 w-5', styles.icon)} />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className={cn('font-semibold text-sm', styles.title)}>
                                {title}
                            </h3>
                            <p className={cn('text-sm mt-1', styles.description)}>
                                {description}
                            </p>
                        </div>

                        {actions && (
                            <div className="flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>

                    {tips && tips.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {tips.map((tip, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <ArrowRight className={cn('h-3 w-3 mt-0.5 flex-shrink-0', styles.icon)} />
                                    <span className={cn('text-xs', styles.description)}>
                                        {tip}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}