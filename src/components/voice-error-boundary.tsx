'use client';

import React from 'react';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface VoiceErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface VoiceErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * Error boundary specifically for voice-related components
 * Follows the error handling pattern used throughout the codebase
 */
export class VoiceErrorBoundary extends React.Component<
    VoiceErrorBoundaryProps,
    VoiceErrorBoundaryState
> {
    constructor(props: VoiceErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): VoiceErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Voice component error:', error, errorInfo);

        // Track error for analytics
        if (typeof window !== 'undefined') {
            // Integration with existing analytics system
            console.log('Voice Error Analytics:', {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
            });
        }
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback;

            if (FallbackComponent) {
                return <FallbackComponent error={this.state.error} retry={this.retry} />;
            }

            return (
                <div className="p-6 space-y-4">
                    <ErrorAlert
                        title="Voice Feature Error"
                        message={
                            this.state.error?.message ||
                            'An unexpected error occurred with the voice feature.'
                        }
                    />
                    <Button onClick={this.retry} variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook version for functional components
 */
export function useVoiceErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((error: Error) => {
        setError(error);
        console.error('Voice hook error:', error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    return { error, handleError, clearError };
}