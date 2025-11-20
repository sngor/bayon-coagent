'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface StandardFormFieldProps {
    label: string;
    id: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

export function StandardFormField({
    label,
    id,
    required = false,
    error,
    hint,
    children,
    className,
}: StandardFormFieldProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
            {error && (
                <p
                    id={`${id}-error`}
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="polite"
                >
                    {error}
                </p>
            )}
            {hint && !error && (
                <p
                    id={`${id}-hint`}
                    className="text-xs text-muted-foreground"
                >
                    {hint}
                </p>
            )}
        </div>
    );
}
