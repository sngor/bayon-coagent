import * as React from 'react';
import { cn } from '@/lib/utils/common';
import { Label } from '@/components/ui/label';

/**
 * StandardFormField - Consistent form field wrapper
 * 
 * Server Component - Converted from Client Component.
 * Uses composition instead of React.cloneElement for better performance.
 *
 * @example
 * <StandardFormField label="Email" id="email" error={errors.email} helpText="We'll never share your email">
 *   <Input 
 *     type="email" 
 *     id="email"
 *     aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
 *     aria-required={required}
 *     aria-invalid={!!error}
 *   />
 * </StandardFormField>
 *
 * @accessibility
 * - Associates label with input via htmlFor
 * - Announces errors to screen readers via aria-describedby
 * - Indicates required fields with aria-required
 * - Note: Child components must handle their own aria attributes
 */
export interface StandardFormFieldProps {
    label: string;
    id: string;
    required?: boolean;
    error?: string;
    helpText?: string;
    children: React.ReactNode;
    className?: string;
}

export function StandardFormField({
    label,
    id,
    required = false,
    error,
    helpText,
    children,
    className,
}: StandardFormFieldProps) {
    const errorId = `${id}-error`;
    const helpTextId = `${id}-help`;

    return (
        <div className={cn('space-y-2', className)}>
            <Label
                htmlFor={id}
                className="text-sm font-medium"
            >
                {label}
                {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </Label>
            {/* 
              Children are rendered as-is. 
              Parent components should pass aria attributes directly to input elements.
              This avoids React.cloneElement and allows Server Component usage.
            */}
            {children}
            {error && (
                <p
                    id={errorId}
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="polite"
                >
                    {error}
                </p>
            )}
            {helpText && !error && (
                <p
                    id={helpTextId}
                    className="text-xs text-muted-foreground"
                >
                    {helpText}
                </p>
            )}
        </div>
    );
}

/**
 * Helper function to generate aria attributes for form inputs
 * Use this in parent components to add proper accessibility attributes
 */
export function getFormFieldAriaProps(
    id: string,
    { required = false, error, helpText }: { required?: boolean; error?: string; helpText?: string }
) {
    const errorId = `${id}-error`;
    const helpTextId = `${id}-help`;
    const describedBy = error ? errorId : helpText ? helpTextId : undefined;

    return {
        'aria-describedby': describedBy,
        'aria-required': required,
        'aria-invalid': !!error,
    };
}
