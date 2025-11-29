'use client';

import { cn } from '@/lib/utils/common';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

export interface EmptySectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'default' | 'outline' | 'ai';
    };
    className?: string;
    variant?: 'default' | 'card' | 'minimal';
}

export function EmptySection({
    title,
    description,
    icon: Icon,
    action,
    className,
    variant = 'default'
}: EmptySectionProps) {
    const variants = {
        default: 'flex flex-col items-center justify-center py-12 text-center',
        card: 'flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card',
        minimal: 'flex flex-col items-center justify-center py-8 text-center'
    };

    return (
        <div className={cn(variants[variant], className)}>
            {Icon && (
                <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            )}
            <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-muted-foreground max-w-md">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <Button
                    onClick={action.onClick}
                    variant={action.variant || 'default'}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}