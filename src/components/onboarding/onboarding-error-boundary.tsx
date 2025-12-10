/**
 * Onboarding Error Boundary
 * 
 * Catches errors in onboarding components and displays user-friendly error messages.
 * Provides recovery options and prevents the entire app from crashing.
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getErrorInfo } from '@/services/onboarding/onboarding-error-handler';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Optional fallback UI */
    fallback?: (error: Error, reset: () => void) => ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary for onboarding components
 */
export class OnboardingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ONBOARDING_ERROR_BOUNDARY] Caught error:', error, errorInfo);

        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to CloudWatch or other monitoring service
        }
    }

    reset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.reset);
            }

            // Default error UI
            const errorInfo = getErrorInfo(this.state.error);

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <div className="max-w-md w-full space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle className="text-lg font-semibold">
                                {errorInfo.title}
                            </AlertTitle>
                            <AlertDescription className="mt-2 space-y-2">
                                <p>{errorInfo.description}</p>

                                {errorInfo.actions.length > 0 && (
                                    <div className="mt-4">
                                        <p className="font-medium mb-2">What you can do:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {errorInfo.actions.map((action, index) => (
                                                <li key={index}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {process.env.NODE_ENV === 'development' && (
                                    <details className="mt-4 text-xs">
                                        <summary className="cursor-pointer font-medium">
                                            Technical Details
                                        </summary>
                                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                                            {this.state.error.stack}
                                        </pre>
                                    </details>
                                )}
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                            <Button
                                onClick={this.reset}
                                variant="default"
                                className="flex-1"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>

                            <Button
                                onClick={() => window.location.href = '/dashboard'}
                                variant="outline"
                                className="flex-1"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            Error Code: {errorInfo.code}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: (error: Error, reset: () => void) => ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <OnboardingErrorBoundary fallback={fallback}>
                <Component {...props} />
            </OnboardingErrorBoundary>
        );
    };
}
