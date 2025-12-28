'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

interface FormFieldProps {
    label: string;
    id: string;
    required?: boolean;
    optional?: boolean;
    helpText?: string;
    error?: string;
    success?: string;
    info?: string;
    children: React.ReactNode;
    className?: string;
}

export function EnhancedFormField({
    label,
    id,
    required = false,
    optional = false,
    helpText,
    error,
    success,
    info,
    children,
    className
}: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between">
                <Label
                    htmlFor={id}
                    className={cn(
                        "text-sm font-medium",
                        error && "text-destructive",
                        success && "text-green-600 dark:text-green-400"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {optional && (
                    <Badge variant="secondary" className="text-xs">
                        Optional
                    </Badge>
                )}
            </div>

            <div className="relative">
                {children}

                {/* Status indicators */}
                {error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                )}
                {success && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                )}
            </div>

            {/* Help text and messages */}
            {(helpText || error || success || info) && (
                <div className="space-y-1">
                    {error && (
                        <div className="flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}
                    {info && (
                        <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{info}</span>
                        </div>
                    )}
                    {helpText && !error && !success && !info && (
                        <p className="text-sm text-muted-foreground">{helpText}</p>
                    )}
                </div>
            )}
        </div>
    );
}

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    className?: string;
}

export function EnhancedFormSection({
    title,
    description,
    icon: Icon,
    children,
    className
}: FormSectionProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold font-headline mb-1">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            <div className="space-y-4 pl-13">
                {children}
            </div>
        </div>
    );
}

interface FormActionsProps {
    primaryAction?: {
        label: string;
        onClick?: () => void;
        type?: 'button' | 'submit';
        loading?: boolean;
        disabled?: boolean;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'ai';
    };
    secondaryAction?: {
        label: string;
        onClick?: () => void;
        type?: 'button' | 'submit';
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    };
    alignment?: 'left' | 'right' | 'center' | 'between';
    className?: string;
}

export function EnhancedFormActions({
    primaryAction,
    secondaryAction,
    alignment = 'right',
    className
}: FormActionsProps) {
    const alignmentClasses = {
        left: 'justify-start',
        right: 'justify-end',
        center: 'justify-center',
        between: 'justify-between'
    };

    return (
        <div className={cn(
            "flex items-center gap-3 pt-6 border-t border-border/50",
            alignmentClasses[alignment],
            className
        )}>
            {secondaryAction && (
                <Button
                    type={secondaryAction.type || 'button'}
                    variant={secondaryAction.variant || 'outline'}
                    onClick={secondaryAction.onClick}
                >
                    {secondaryAction.label}
                </Button>
            )}

            {primaryAction && (
                <Button
                    type={primaryAction.type || 'button'}
                    variant={primaryAction.variant || 'default'}
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    className="min-w-[120px]"
                >
                    {primaryAction.loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        primaryAction.label
                    )}
                </Button>
            )}
        </div>
    );
}

// Enhanced input components with better styling
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    success?: boolean;
}

export function EnhancedInput({
    className,
    error,
    success,
    ...props
}: EnhancedInputProps) {
    return (
        <Input
            className={cn(
                "transition-all duration-200",
                error && "border-destructive focus-visible:ring-destructive",
                success && "border-green-500 focus-visible:ring-green-500",
                className
            )}
            {...props}
        />
    );
}

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    success?: boolean;
}

export function EnhancedTextarea({
    className,
    error,
    success,
    ...props
}: EnhancedTextareaProps) {
    return (
        <Textarea
            className={cn(
                "transition-all duration-200 resize-none",
                error && "border-destructive focus-visible:ring-destructive",
                success && "border-green-500 focus-visible:ring-green-500",
                className
            )}
            {...props}
        />
    );
}

// Form validation helpers
export function validateRequired(value: string | undefined | null, fieldName: string): string | undefined {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    return undefined;
}

export function validateEmail(email: string | undefined | null): string | undefined {
    if (!email) return undefined;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return undefined;
}

export function validatePhone(phone: string | undefined | null): string | undefined {
    if (!phone) return undefined;

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\(\)\-\.]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
        return 'Please enter a valid phone number';
    }
    return undefined;
}

export function validateUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;

    try {
        new URL(url);
        return undefined;
    } catch {
        return 'Please enter a valid URL';
    }
}