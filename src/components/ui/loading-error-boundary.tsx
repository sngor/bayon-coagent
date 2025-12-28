'use client';

import { Component, type ReactNode } from 'react';
import { PageLoading } from './page-loading';
import { ErrorState } from './error-state';

interface LoadingErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    loadingText?: string;
    errorTitle?: string;
    errorDescription?: string;
}

interface LoadingErrorBoundaryState {
    hasError: boolean;
    isLoading: boolean;
}

/**
 * Error boundary that handles loading states and errors gracefully
 * Provides consistent error handling across the application
 */
export class LoadingErrorBoundary extends Component<
    LoadingErrorBoundaryProps,
    LoadingErrorBoundaryState
> {
    constructor(props: LoadingErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, isLoading: false };
    }

    static getDerivedStateFromError(): LoadingErrorBoundaryState {
        return { hasError: true, isLoading: false };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('LoadingErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorState
                    title={this.props.errorTitle || 'Something went wrong'}
                    description={this.props.errorDescription || 'Please try refreshing the page'}
                    showRetry
                    onRetry={() => this.setState({ hasError: false })}
                />
            );
        }

        if (this.state.isLoading) {
            return this.props.fallback || (
                <PageLoading text={this.props.loadingText || 'Loading...'} />
            );
        }

        return this.props.children;
    }
}