'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/common';
import { type ServiceError } from '@/lib/error-handling-framework';
import { type FallbackOption } from '@/lib/mobile/error-handler';

// ============================================================================
// Error Toast Component
// ============================================================================

export interface ErrorToastProps {
    error: ServiceError;
    onDismiss: () => void;
    onRetry?: () => void;
    className?: string;
}

export function ErrorToast({ error, onDismiss, onRetry, className }: ErrorToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 10 seconds for non-critical errors
        if (error.severity !== 'critical' && error.severity !== 'high') {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [error.severity, onDismiss]);

    const getIcon = () => {
        switch (error.severity) {
            case 'critical':
            case 'high':
                return <AlertCircle className="h-5 w-5" />;
            case 'medium':
                return <AlertTriangle className="h-5 w-5" />;
            default:
                return <Info className="h-5 w-5" />;
        }
    };

    const getVariant = (): 'default' | 'destructive' => {
        return error.severity === 'critical' || error.severity === 'high'
            ? 'destructive'
            : 'default';
    };

    if (!isVisible) return null;

    return (
        <Alert
            variant={getVariant()}
            className={cn(
                'fixed bottom-4 left-4 right-4 z-50 shadow-lg animate-in slide-in-from-bottom-5',
                'md:left-auto md:right-4 md:max-w-md',
                className
            )}
        >
            <div className="flex items-start gap-3">
                {getIcon()}
                <div className="flex-1 space-y-1">
                    <AlertTitle className="text-sm font-semibold">
                        {error.userMessage}
                    </AlertTitle>
                    {error.suggestedActions && error.suggestedActions.length > 0 && (
                        <AlertDescription className="text-xs">
                            {error.suggestedActions[0]}
                        </AlertDescription>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {error.retryable && onRetry && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onRetry}
                            className="h-8 w-8 p-0"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onDismiss, 300);
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Alert>
    );
}

// ============================================================================
// Error Details Modal
// ============================================================================

export interface ErrorDetailsProps {
    error: ServiceError;
    onClose: () => void;
    onRetry?: () => void;
    fallbackOptions?: FallbackOption[];
}

export function ErrorDetails({ error, onClose, onRetry, fallbackOptions }: ErrorDetailsProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in">
            <Card className="w-full max-w-lg rounded-t-2xl rounded-b-none animate-in slide-in-from-bottom-5">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'rounded-full p-2',
                                    error.severity === 'critical' || error.severity === 'high'
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-warning/10 text-warning'
                                )}
                            >
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">{error.userMessage}</CardTitle>
                        </div>
                        <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Suggested Actions */}
                    {error.suggestedActions && error.suggestedActions.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">What you can do:</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {error.suggestedActions.map((action, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Fallback Options */}
                    {fallbackOptions && fallbackOptions.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Alternative options:</h4>
                            <div className="space-y-2">
                                {fallbackOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            option.action();
                                            onClose();
                                        }}
                                        className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                                    >
                                        <div className="font-medium text-sm">{option.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Technical Details (Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-xs">
                            <summary className="cursor-pointer font-semibold text-muted-foreground">
                                Technical Details
                            </summary>
                            <div className="mt-2 space-y-1 rounded-lg bg-muted p-2 font-mono">
                                <div>
                                    <span className="font-semibold">Code:</span> {error.code}
                                </div>
                                <div>
                                    <span className="font-semibold">Category:</span> {error.category}
                                </div>
                                <div>
                                    <span className="font-semibold">Operation:</span>{' '}
                                    {error.context.operation}
                                </div>
                                {error.message && (
                                    <div>
                                        <span className="font-semibold">Message:</span> {error.message}
                                    </div>
                                )}
                            </div>
                        </details>
                    )}
                </CardContent>

                <CardFooter className="flex gap-2">
                    {error.retryable && onRetry && (
                        <Button onClick={onRetry} className="flex-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    )}
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Close
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// ============================================================================
// Error Feedback Manager Component
// ============================================================================

export function ErrorFeedbackManager() {
    const [currentError, setCurrentError] = useState<ServiceError | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const handleError = (event: CustomEvent) => {
            setCurrentError(event.detail.error);
        };

        window.addEventListener('mobile-error', handleError as EventListener);

        return () => {
            window.removeEventListener('mobile-error', handleError as EventListener);
        };
    }, []);

    if (!currentError) return null;

    return (
        <>
            {!showDetails && (
                <ErrorToast
                    error={currentError}
                    onDismiss={() => setCurrentError(null)}
                    onRetry={
                        currentError.retryable
                            ? () => {
                                // Dispatch retry event
                                window.dispatchEvent(
                                    new CustomEvent('retry-operation', {
                                        detail: { error: currentError },
                                    })
                                );
                                setCurrentError(null);
                            }
                            : undefined
                    }
                />
            )}

            {showDetails && (
                <ErrorDetails
                    error={currentError}
                    onClose={() => {
                        setShowDetails(false);
                        setCurrentError(null);
                    }}
                    onRetry={
                        currentError.retryable
                            ? () => {
                                window.dispatchEvent(
                                    new CustomEvent('retry-operation', {
                                        detail: { error: currentError },
                                    })
                                );
                                setShowDetails(false);
                                setCurrentError(null);
                            }
                            : undefined
                    }
                />
            )}
        </>
    );
}
