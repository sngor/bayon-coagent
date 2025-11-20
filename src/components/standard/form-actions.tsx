'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface StandardFormActionsProps {
    primaryAction: {
        label: string;
        onClick?: () => void;
        loading?: boolean;
        disabled?: boolean;
        type?: 'button' | 'submit';
        variant?: 'default' | 'ai' | 'outline' | 'ghost' | 'destructive';
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
    };
    alignment?: 'left' | 'right' | 'between';
    className?: string;
}

const alignmentClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
};

export function StandardFormActions({
    primaryAction,
    secondaryAction,
    alignment = 'right',
    className,
}: StandardFormActionsProps) {
    return (
        <div className={cn(
            'flex items-center gap-2',
            alignmentClasses[alignment],
            className
        )}>
            {secondaryAction && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={secondaryAction.onClick}
                    disabled={secondaryAction.disabled || primaryAction.loading}
                >
                    {secondaryAction.label}
                </Button>
            )}
            <Button
                type={primaryAction.type || 'button'}
                variant={primaryAction.loading ? 'shimmer' : (primaryAction.variant || 'default')}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
            >
                {primaryAction.loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {primaryAction.loading ? 'Loading...' : primaryAction.label}
            </Button>
        </div>
    );
}
