'use client';

import { cn } from '@/lib/utils/common';
import { Button } from '@/components/ui/button';

export interface StandardEmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'default' | 'ai' | 'outline' | 'ghost';
    };
    variant?: 'default' | 'compact';
    className?: string;
}

export function StandardEmptyState({
    icon,
    title,
    description,
    action,
    variant = 'default',
    className,
}: StandardEmptyStateProps) {
    const padding = variant === 'compact' ? 'py-8' : 'py-12';

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center border rounded-lg',
                padding,
                className
            )}
            role="status"
            aria-live="polite"
        >
            <div className="mb-4 text-muted-foreground" aria-hidden="true">
                {icon}
            </div>
            <h3 className="font-headline text-heading-2 mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
                {description}
            </p>
            {action && (
                <Button
                    variant={action.variant || 'default'}
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
