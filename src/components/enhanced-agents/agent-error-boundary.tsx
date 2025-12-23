'use client';

/**
 * Agent Error Boundary
 * 
 * Error boundary component specifically for AI agent components
 * to prevent cascading failures and provide graceful degradation.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AgentErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface AgentErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    AI Agent Error
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    The AI agent encountered an error and couldn't load properly.
                </p>
                {error && (
                    <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                            Error Details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {error.message}
                        </pre>
                    </details>
                )}
                <Button onClick={retry} variant="outline" size="sm" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Agent Error Boundary Component
 */
export class AgentErrorBoundary extends React.Component<
    AgentErrorBoundaryProps,
    AgentErrorBoundaryState
> {
    constructor(props: AgentErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): AgentErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Agent Error Boundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            
            return (
                <FallbackComponent 
                    error={this.state.error} 
                    retry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Hook version for functional components
 */
export function useAgentErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((error: Error) => {
        console.error('Agent error:', error);
        setError(error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        handleError,
        clearError,
        hasError: !!error
    };
}