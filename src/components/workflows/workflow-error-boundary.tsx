'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { logError } from '@/aws/logging/client';

/**
 * Props for WorkflowErrorBoundary
 */
interface WorkflowErrorBoundaryProps {
    children: ReactNode;
    /** Callback when user clicks "Restart Workflow" */
    onRestart?: () => void;
    /** Callback when user clicks "Return to Dashboard" */
    onReturnToDashboard?: () => void;
    /** Optional fallback UI */
    fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

/**
 * State for WorkflowErrorBoundary
 */
interface WorkflowErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Workflow Components
 * 
 * Catches React errors in workflow components and displays a fallback UI
 * with recovery options.
 * 
 * Requirements: 12.5
 * 
 * Features:
 * - Catches and displays React errors
 * - Logs errors to CloudWatch
 * - Provides "Restart Workflow" option
 * - Provides "Return to Dashboard" option
 * - Customizable fallback UI
 * 
 * @example
 * ```tsx
 * <WorkflowErrorBoundary
 *   onRestart={() => router.push('/dashboard')}
 *   onReturnToDashboard={() => router.push('/dashboard')}
 * >
 *   <WorkflowComponent />
 * </WorkflowErrorBoundary>
 * ```
 */
export class WorkflowErrorBoundary extends Component<
    WorkflowErrorBoundaryProps,
    WorkflowErrorBoundaryState
> {
    constructor(props: WorkflowErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<WorkflowErrorBoundaryState> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to CloudWatch
        this.logErrorToCloudWatch(error, errorInfo);

        // Update state with error info
        this.setState({
            errorInfo,
        });

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('WorkflowErrorBoundary caught an error:', error, errorInfo);
        }
    }

    /**
     * Logs error to CloudWatch
     */
    private async logErrorToCloudWatch(error: Error, errorInfo: ErrorInfo): Promise<void> {
        try {
            await logError('WorkflowError', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
            });
        } catch (loggingError) {
            // Silently fail if logging fails - don't want to cause more errors
            console.error('Failed to log error to CloudWatch:', loggingError);
        }
    }

    /**
     * Resets the error boundary state
     */
    private resetErrorBoundary = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    /**
     * Handles restart workflow action
     */
    private handleRestart = (): void => {
        this.resetErrorBoundary();
        this.props.onRestart?.();
    };

    /**
     * Handles return to dashboard action
     */
    private handleReturnToDashboard = (): void => {
        this.resetErrorBoundary();
        this.props.onReturnToDashboard?.();
    };

    render(): ReactNode {
        const { hasError, error, errorInfo } = this.state;
        const { children, fallback } = this.props;

        if (hasError && error) {
            // Use custom fallback if provided
            if (fallback && errorInfo) {
                return fallback(error, errorInfo);
            }

            // Default fallback UI
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <div className="max-w-md w-full space-y-6 text-center">
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="rounded-full bg-destructive/10 p-4">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Something went wrong
                            </h2>
                            <p className="text-muted-foreground">
                                We encountered an error while processing your workflow.
                                Don't worry, your progress has been saved.
                            </p>
                        </div>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="text-left">
                                <details className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                    <summary className="cursor-pointer text-sm font-medium text-destructive">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="mt-2 space-y-2 text-xs">
                                        <div>
                                            <strong>Error:</strong>
                                            <pre className="mt-1 overflow-auto rounded bg-black/5 p-2">
                                                {error.message}
                                            </pre>
                                        </div>
                                        {error.stack && (
                                            <div>
                                                <strong>Stack Trace:</strong>
                                                <pre className="mt-1 overflow-auto rounded bg-black/5 p-2 max-h-32">
                                                    {error.stack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {this.props.onRestart && (
                                <Button
                                    onClick={this.handleRestart}
                                    variant="default"
                                    className="gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restart Workflow
                                </Button>
                            )}
                            {this.props.onReturnToDashboard && (
                                <Button
                                    onClick={this.handleReturnToDashboard}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Home className="h-4 w-4" />
                                    Return to Dashboard
                                </Button>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-sm text-muted-foreground">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return children;
    }
}

/**
 * Hook-based wrapper for WorkflowErrorBoundary
 * 
 * Provides a simpler API for using the error boundary with hooks.
 * 
 * @example
 * ```tsx
 * function MyWorkflowPage() {
 *   const router = useRouter();
 *   
 *   return (
 *     <WorkflowErrorBoundary
 *       onRestart={() => router.push('/dashboard')}
 *       onReturnToDashboard={() => router.push('/dashboard')}
 *     >
 *       <MyWorkflowContent />
 *     </WorkflowErrorBoundary>
 *   );
 * }
 * ```
 */
export function useWorkflowErrorBoundary() {
    return {
        WorkflowErrorBoundary,
    };
}
