'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface BillingErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface BillingErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class BillingErrorBoundary extends React.Component<
    BillingErrorBoundaryProps,
    BillingErrorBoundaryState
> {
    constructor(props: BillingErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): BillingErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Billing component error:', error, errorInfo);

        // In production, you might want to send this to an error reporting service
        // errorReportingService.captureException(error, { extra: errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback } = this.props;

            if (Fallback && this.state.error) {
                return <Fallback error={this.state.error} retry={this.handleRetry} />;
            }

            return (
                <div className="p-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                            <span>
                                Something went wrong loading the billing data.
                                {this.state.error?.message && (
                                    <span className="block text-sm text-muted-foreground mt-1">
                                        {this.state.error.message}
                                    </span>
                                )}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={this.handleRetry}
                                className="ml-4"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useBillingErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((error: Error) => {
        console.error('Billing error:', error);
        setError(error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    return { error, handleError, clearError };
}