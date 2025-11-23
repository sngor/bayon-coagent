'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSectionProps {
    title?: string;
    description?: string;
    className?: string;
    variant?: 'default' | 'card' | 'minimal';
    size?: 'sm' | 'default' | 'lg';
}

export function LoadingSection({
    title = 'Loading...',
    description,
    className,
    variant = 'default',
    size = 'default'
}: LoadingSectionProps) {
    const variants = {
        default: 'flex flex-col items-center justify-center py-12',
        card: 'flex flex-col items-center justify-center py-12 rounded-lg border bg-card',
        minimal: 'flex items-center justify-center py-6'
    };

    const sizes = {
        sm: {
            icon: 'h-4 w-4',
            title: 'text-sm',
            description: 'text-xs'
        },
        default: {
            icon: 'h-6 w-6',
            title: 'text-base',
            description: 'text-sm'
        },
        lg: {
            icon: 'h-8 w-8',
            title: 'text-lg',
            description: 'text-base'
        }
    };

    const sizeStyles = sizes[size];

    return (
        <div className={cn(variants[variant], className)}>
            <Loader2 className={cn('animate-spin text-muted-foreground mb-3', sizeStyles.icon)} />
            {variant !== 'minimal' && (
                <div className="text-center space-y-1">
                    <p className={cn('font-medium text-muted-foreground', sizeStyles.title)}>
                        {title}
                    </p>
                    {description && (
                        <p className={cn('text-muted-foreground', sizeStyles.description)}>
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}