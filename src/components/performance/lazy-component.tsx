'use client';

/**
 * LazyComponent - Dynamic import wrapper with loading fallback and error boundary
 * 
 * Features:
 * - Supports dynamic imports with loading fallback
 * - Built-in error boundary for graceful error handling
 * - Prop forwarding to lazy-loaded component
 * - Prevents layout shift during loading
 * 
 * Requirements: 2.4 - Lazy load non-critical components
 * 
 * @example
 * ```tsx
 * <LazyComponent
 *   loader={() => import('./HeavyChart')}
 *   fallback={<StandardLoadingState variant="skeleton" />}
 *   props={{ data: chartData }}
 * />
 * ```
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { StandardLoadingState } from '@/components/standard/loading-state';
import { StandardErrorDisplay } from '@/components/standard/error-display';

interface LazyComponentProps<P = any> {
    /**
     * Function that returns a dynamic import promise
     */
    loader: () => Promise<{ default: ComponentType<P> }>;

    /**
     * Loading fallback component (defaults to StandardLoadingState)
     */
    fallback?: React.ReactNode;

    /**
     * Props to forward to the lazy-loaded component
     */
    props?: P;

    /**
     * Custom error message
     */
    errorMessage?: string;

    /**
     * Callback when component loads successfully
     */
    onLoad?: () => void;

    /**
     * Callback when component fails to load
     */
    onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component<
    {
        children: React.ReactNode;
        fallback: (error: Error) => React.ReactNode;
        onError?: (error: Error) => void;
    },
    ErrorBoundaryState
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('LazyComponent error:', error, errorInfo);
        this.props.onError?.(error);
    }

    render() {
        if (this.state.hasError && this.state.error) {
            return this.props.fallback(this.state.error);
        }

        return this.props.children;
    }
}

/**
 * LazyComponent wrapper for dynamic imports
 */
export function LazyComponent<P = any>({
    loader,
    fallback,
    props,
    errorMessage = 'Failed to load component',
    onLoad,
    onError,
}: LazyComponentProps<P>) {
    // Create lazy component
    const LazyLoadedComponent = React.useMemo(() => {
        return lazy(() => {
            return loader()
                .then((module) => {
                    onLoad?.();
                    return module;
                })
                .catch((error) => {
                    onError?.(error);
                    throw error;
                });
        });
    }, [loader, onLoad, onError]);

    // Default fallback
    const defaultFallback = (
        <div className="flex items-center justify-center p-8">
            <StandardLoadingState variant="spinner" size="md" />
        </div>
    );

    // Error fallback
    const errorFallback = (error: Error) => (
        <StandardErrorDisplay
            title="Component Load Error"
            message={errorMessage}
            variant="error"
            action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
            }}
        />
    );

    return (
        <LazyErrorBoundary fallback={errorFallback} onError={onError}>
            <Suspense fallback={fallback || defaultFallback}>
                <LazyLoadedComponent {...(props as any)} />
            </Suspense>
        </LazyErrorBoundary>
    );
}

/**
 * Hook for creating lazy components with consistent configuration
 */
export function useLazyComponent<P = any>(
    loader: () => Promise<{ default: ComponentType<P> }>,
    options?: {
        fallback?: React.ReactNode;
        errorMessage?: string;
    }
) {
    return React.useCallback(
        (props?: P) => (
            <LazyComponent
                loader={loader}
                fallback={options?.fallback}
                errorMessage={options?.errorMessage}
                props={props}
            />
        ),
        [loader, options?.fallback, options?.errorMessage]
    );
}

/**
 * Utility function to create a lazy component with default configuration
 */
export function createLazyComponent<P = any>(
    loader: () => Promise<{ default: ComponentType<P> }>,
    options?: {
        fallback?: React.ReactNode;
        errorMessage?: string;
    }
): React.FC<P> {
    return (props: P) => (
        <LazyComponent
            loader={loader}
            fallback={options?.fallback}
            errorMessage={options?.errorMessage}
            props={props}
        />
    );
}
