'use client';

import { cn } from '@/lib/utils/common';
import { Button, ButtonProps } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

/**
 * StandardEmptyState - Consistent empty state patterns with call-to-action
 *
 * @example
 * <StandardEmptyState
 *   icon={FileText}
 *   title="No Content Yet"
 *   description="Create your first piece of content to get started"
 *   action={{ label: "Create Content", onClick: handleCreate }}
 * />
 *
 * Provides consistent empty state displays across the application with optional actions
 */
export interface StandardEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: ButtonProps['variant'];
    };
    className?: string;
}

export function StandardEmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: StandardEmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center',
                'rounded-lg border border-dashed border-border',
                'bg-muted/30 px-6 py-12 sm:px-8 sm:py-16',
                className
            )}
            role="status"
            aria-live="polite"
        >
            <div
                className="mb-4 rounded-full bg-muted p-3 text-muted-foreground"
                aria-hidden="true"
            >
                <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                {title}
            </h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
                {description}
            </p>
            {action && (
                <Button
                    variant={action.variant || 'default'}
                    onClick={action.onClick}
                    size="lg"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}
