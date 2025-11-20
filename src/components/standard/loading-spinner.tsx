'use client';

import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

export interface StandardLoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'overlay' | 'ai';
    message?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

export function StandardLoadingSpinner({
    size = 'md',
    variant = 'default',
    message,
    className,
}: StandardLoadingSpinnerProps) {
    if (variant === 'overlay') {
        return (
            <div
                className={cn(
                    'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
                    className
                )}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} aria-hidden="true" />
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                    {!message && (
                        <span className="sr-only">Loading...</span>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'ai') {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center text-center p-12',
                    className
                )}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="relative mb-8" aria-hidden="true">
                    {/* Outer pulsing ring */}
                    <div className="absolute inset-0 w-20 h-20 -left-2 -top-2 border-4 border-primary/10 rounded-full animate-ping" />
                    {/* Middle rotating ring */}
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                    {/* Inner spinning ring */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    {/* Sparkles icon with pulse */}
                    <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-primary animate-pulse" />
                    {/* Floating sparkles */}
                    <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
                {message && (
                    <div className="space-y-3 max-w-md">
                        <p className="font-semibold text-lg animate-pulse bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            {message}
                        </p>
                        <div className="flex justify-center gap-1 mt-4" aria-hidden="true">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                {!message && (
                    <span className="sr-only">AI processing in progress...</span>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn('flex items-center justify-center', className)}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="flex flex-col items-center gap-2">
                <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} aria-hidden="true" />
                {message && (
                    <p className="text-sm text-muted-foreground">{message}</p>
                )}
                {!message && (
                    <span className="sr-only">Loading...</span>
                )}
            </div>
        </div>
    );
}
