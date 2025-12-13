'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to monitoring service
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler
        this.props.onError?.(error, errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback } = this.props;

            if (Fallback && this.state.error) {
                return <Fallback error={this.state.error} retry={this.retry} />;
            }

            return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
            <div className="max-w-md w-full">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error?.message || 'An unexpected error occurred. Please try again.'}
                    </AlertDescription>
                </Alert>

                <div className="mt-4 flex gap-2">
                    <Button onClick={retry} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="ghost"
                        size="sm"
                    >
                        Refresh Page
                    </Button>
                </div>

                {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-4 text-sm text-muted-foreground">
                        <summary className="cursor-pointer">Error Details</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words">
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

// Specific error boundary for AI operations
export function AIErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallback={({ error, retry }) => (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Generation Failed</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error.message.includes('timeout')
                            ? 'The AI request timed out. Please try again with a shorter prompt.'
                            : error.message.includes('rate limit')
                                ? 'Too many requests. Please wait a moment and try again.'
                                : 'Failed to generate content. Please check your input and try again.'
                        }
                    </AlertDescription>
                    <div className="mt-3">
                        <Button onClick={retry} size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </Alert>
            )}
            onError={(error) => {
                // Track AI errors specifically
                console.error('AI Operation Error:', {
                    message: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
            }}
        >
            {children}
        </ErrorBoundary>
    );
}