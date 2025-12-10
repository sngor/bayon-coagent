'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Dashboard Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                        <p className="text-muted-foreground mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false })}
                            variant="outline"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

// Error state component for specific sections
export function DashboardSectionError({
    title,
    error,
    onRetry
}: {
    title: string;
    error: string;
    onRetry?: () => void;
}) {
    return (
        <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Failed to load {title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                {onRetry && (
                    <Button onClick={onRetry} size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}