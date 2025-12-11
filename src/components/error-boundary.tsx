'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

/**
 * Error Boundary component for catching and handling React component errors
 * Provides a fallback UI when components crash
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error?: Error;
    resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">Something went wrong</CardTitle>
                </div>
                <CardDescription>
                    An unexpected error occurred. Please try refreshing the page.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <details className="text-sm text-muted-foreground">
                        <summary className="cursor-pointer">Error details</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {error.message}
                        </pre>
                    </details>
                )}
                <Button onClick={resetError} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </CardContent>
        </Card>
    );
}