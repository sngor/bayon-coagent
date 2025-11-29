'use client';

import { cn } from '@/lib/utils/common';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ServerCrash, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StandardErrorDisplayProps {
    title?: string;
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
        icon: ServerCrash,
        title: 'Error',
        variant: 'destructive' as const,
    },
    warning: {
        icon: ShieldAlert,
        title: 'Warning',
        variant: 'default' as const,
    },
    info: {
        icon: AlertCircle,
        title: 'Information',
        variant: 'default' as const,
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
            variant={config.variant}
            className={cn(className)}
            role="alert"
            aria-live="assertive"
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>{title || config.title}</AlertTitle>
            <AlertDescription className="mt-2">
                {message}
                {action && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-4"
                    >
                        {action.label}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
