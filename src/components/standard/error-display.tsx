'use client';

import { cn } from '@/lib/utils/common';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * StandardErrorDisplay - Consistent error messaging with appropriate severity levels
 *
 * @example
 * <StandardErrorDisplay
 *   title="Failed to Load"
 *   message="Unable to fetch data. Please try again."
 *   variant="error"
 *   action={{ label: "Retry", onClick: handleRetry }}
 * />
 *
 * Provides consistent error, warning, and info displays across the application
 */
export interface StandardErrorDisplayProps {
    title: string;
    message: string;
    variant?: 'error' | 'warning' | 'info';
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const variantConfig = {
    error: {
        icon: AlertCircle,
        alertVariant: 'destructive' as const,
        colorClasses: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    },
    warning: {
        icon: AlertTriangle,
        alertVariant: 'default' as const,
        colorClasses: 'border-warning/50 bg-warning/5 text-warning-foreground [&>svg]:text-warning',
    },
    info: {
        icon: Info,
        alertVariant: 'default' as const,
        colorClasses: 'border-primary/50 bg-primary/5 text-foreground [&>svg]:text-primary',
    },
};

export function StandardErrorDisplay({
    title,
    message,
    variant = 'error',
    action,
    className,
}: StandardErrorDisplayProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <Alert
            variant={config.alertVariant}
            className={cn(config.colorClasses, className)}
            role="alert"
            aria-live="assertive"
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2">
                <p className="mb-4">{message}</p>
                {action && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-2"
                    >
                        {action.label}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
