/**
 * Validation Error Display Component
 * 
 * Displays field-specific validation errors in a user-friendly format.
 * Requirement 2.3: Display specific validation errors for each invalid field
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidationErrorDisplayProps {
    /** Field-specific errors */
    errors: Record<string, string[]>;
    /** Optional title for the error section */
    title?: string;
    /** Optional className for styling */
    className?: string;
}

/**
 * Displays validation errors in a structured format
 */
export function ValidationErrorDisplay({
    errors,
    title = 'Please correct the following errors',
    className = '',
}: ValidationErrorDisplayProps) {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length === 0) {
        return null;
    }

    // Check if there's a general error
    const generalErrors = errors['_general'] || [];
    const fieldErrors = errorEntries.filter(([key]) => key !== '_general');

    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {generalErrors.length > 0 && (
                    <div className="mb-2">
                        {generalErrors.map((error, index) => (
                            <p key={index} className="text-sm">
                                {error}
                            </p>
                        ))}
                    </div>
                )}

                {fieldErrors.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                        {fieldErrors.map(([field, messages]) => (
                            <li key={field} className="text-sm">
                                <span className="font-medium capitalize">
                                    {formatFieldName(field)}:
                                </span>{' '}
                                {messages.join(', ')}
                            </li>
                        ))}
                    </ul>
                )}
            </AlertDescription>
        </Alert>
    );
}

/**
 * Formats field names for display
 * Converts camelCase and dot notation to readable format
 */
function formatFieldName(field: string): string {
    return field
        .split('.')
        .map(part =>
            part
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase()
        )
        .join(' > ');
}

/**
 * Field-level error display for inline validation
 */
interface FieldErrorProps {
    /** Error message(s) for the field */
    error?: string | string[];
    /** Optional className for styling */
    className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
    if (!error) {
        return null;
    }

    const errors = Array.isArray(error) ? error : [error];

    return (
        <div className={`text-sm text-destructive mt-1 ${className}`}>
            {errors.map((err, index) => (
                <p key={index}>{err}</p>
            ))}
        </div>
    );
}
