"use client";

/**
 * Enhanced Error Boundary Component
 * 
 * Catches React errors and displays user-friendly error messages
 * with recovery actions using the comprehensive error handling framework.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Mail, Bug, Copy, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    detectErrorPattern,
    createRecoveryActions,
    getErrorSeverity,
    type ErrorPattern,
} from "@/lib/error-handling";
import { serviceWrapper, type ServiceError } from "@/lib/error-handling-framework";

export interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    pattern: ErrorPattern | null;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            pattern: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const pattern = detectErrorPattern(error);

        this.setState({
            errorInfo,
            pattern,
        });

        // Log to error reporting service
        console.error("Error Boundary caught an error:", {
            error,
            errorInfo,
            pattern,
            severity: getErrorSeverity(pattern.category),
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            pattern: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
            }

            // Default error UI
            return (
                <DefaultErrorFallback
                    error={this.state.error}
                    pattern={this.state.pattern}
                    reset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

// ============================================================================
// Default Error Fallback Component
// ============================================================================

export interface DefaultErrorFallbackProps {
    error: Error;
    pattern: ErrorPattern | null;
    reset: () => void;
}

function DefaultErrorFallback({
    error,
    pattern,
    reset,
}: DefaultErrorFallbackProps) {
    const [errorReported, setErrorReported] = React.useState(false);
    const [errorCopied, setErrorCopied] = React.useState(false);

    const recoveryActions = pattern
        ? createRecoveryActions(pattern, [
            {
                label: "Reset",
                action: reset,
                primary: false,
            },
        ])
        : [];

    const severity = pattern ? getErrorSeverity(pattern.category) : "medium";
    const isServiceError = 'code' in error && 'category' in error;
    const serviceError = isServiceError ? error as ServiceError : null;

    // Get circuit breaker status for debugging
    const circuitBreakerStatus = serviceWrapper.getCircuitBreakerStatus();

    const handleCopyError = async () => {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...(serviceError && {
                code: serviceError.code,
                category: serviceError.category,
                severity: serviceError.severity,
                context: serviceError.context
            })
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
            setErrorCopied(true);
            setTimeout(() => setErrorCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy error details:', err);
        }
    };

    const handleReportError = async () => {
        // In production, this would send to error reporting service
        console.log('Error reported:', {
            error: error.message,
            pattern: pattern?.category,
            timestamp: new Date().toISOString()
        });
        setErrorReported(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="max-w-3xl w-full">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-3 rounded-full ${severity === "critical"
                                    ? "bg-red-100 dark:bg-red-900/20"
                                    : severity === "high"
                                        ? "bg-orange-100 dark:bg-orange-900/20"
                                        : "bg-yellow-100 dark:bg-yellow-900/20"
                                    }`}
                            >
                                <AlertTriangle
                                    className={`w-6 h-6 ${severity === "critical"
                                        ? "text-red-600 dark:text-red-400"
                                        : severity === "high"
                                            ? "text-orange-600 dark:text-orange-400"
                                            : "text-yellow-600 dark:text-yellow-400"
                                        }`}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle>Something went wrong</CardTitle>
                                    {serviceError && (
                                        <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                                            {serviceError.code}
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>
                                    {pattern?.userMessage || serviceError?.userMessage || "An unexpected error occurred"}
                                </CardDescription>
                            </div>
                        </div>

                        {/* Error Actions */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopyError}
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                            >
                                {errorCopied ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                {errorCopied ? 'Copied' : 'Copy Details'}
                            </Button>

                            <Button
                                onClick={handleReportError}
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                disabled={errorReported}
                            >
                                <Bug className="w-4 h-4" />
                                {errorReported ? 'Reported' : 'Report Bug'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Service Error Details */}
                    {serviceError && (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">Error Category:</span>
                                        <Badge variant="outline">{serviceError.category}</Badge>
                                        <span className="font-medium">Severity:</span>
                                        <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                                            {serviceError.severity}
                                        </Badge>
                                        {serviceError.retryable && (
                                            <Badge variant="outline" className="text-blue-600">
                                                Retryable
                                            </Badge>
                                        )}
                                    </div>
                                    {serviceError.context && (
                                        <div className="text-sm text-muted-foreground">
                                            Operation: {serviceError.context.operation}
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Suggested Actions */}
                    {(pattern?.suggestedActions.length > 0 || serviceError?.suggestedActions.length > 0) && (
                        <div className="space-y-2">
                            <h3 className="font-headline font-semibold text-sm">What you can do:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {(serviceError?.suggestedActions || pattern?.suggestedActions || []).map((action, index) => (
                                    <li key={index}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Circuit Breaker Status */}
                    {Object.keys(circuitBreakerStatus).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground transition-colors">
                                Service Status
                            </summary>
                            <div className="mt-2 space-y-1">
                                {Object.entries(circuitBreakerStatus).map(([service, status]) => (
                                    <div key={service} className="flex items-center gap-2">
                                        <span className="font-mono">{service}:</span>
                                        <Badge
                                            variant={status.state === 'open' ? 'destructive' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {status.state}
                                        </Badge>
                                        {status.failures > 0 && (
                                            <span className="text-xs">({status.failures} failures)</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    {/* Error Details (collapsed by default) */}
                    <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground transition-colors">
                            Technical details
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono overflow-auto max-h-64">
                            <div className="space-y-2">
                                <div>
                                    <p className="font-semibold mb-1">Error:</p>
                                    <p className="mb-2">{error.message}</p>
                                </div>

                                {serviceError?.originalError && (
                                    <div>
                                        <p className="font-semibold mb-1">Original Error:</p>
                                        <p className="mb-2">{serviceError.originalError.message}</p>
                                    </div>
                                )}

                                {error.stack && (
                                    <div>
                                        <p className="font-semibold mb-1">Stack trace:</p>
                                        <pre className="whitespace-pre-wrap text-xs">
                                            {error.stack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </details>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2">
                    {/* Primary recovery actions */}
                    {recoveryActions
                        .filter((action) => action.primary)
                        .map((action, index) => (
                            <Button
                                key={index}
                                onClick={action.action}
                                variant="default"
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {action.label}
                            </Button>
                        ))}

                    {/* Reset button */}
                    <Button
                        onClick={reset}
                        variant="default"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>

                    {/* Secondary actions */}
                    <Button
                        onClick={() => (window.location.href = "/dashboard")}
                        variant="outline"
                        className="gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Button>

                    <Button
                        onClick={() => (window.location.href = "mailto:support@bayoncoagent.com?subject=Error Report&body=" + encodeURIComponent(`Error: ${error.message}\nTimestamp: ${new Date().toISOString()}\nURL: ${window.location.href}`))}
                        variant="ghost"
                        className="gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

/**
 * Page-level error boundary for catching errors in page components
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            fallback={({ error, reset }) => (
                <div className="container mx-auto py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Error</CardTitle>
                            <CardDescription>
                                This page encountered an error and couldn't load properly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {error.message}
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={reset} variant="default">
                                    Try Again
                                </Button>
                                <Button
                                    onClick={() => (window.location.href = "/dashboard")}
                                    variant="outline"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        >
            {children}
        </ErrorBoundary>
    );
}

/**
 * Component-level error boundary for catching errors in specific components
 */
export function ComponentErrorBoundary({
    children,
    componentName,
}: {
    children: React.ReactNode;
    componentName?: string;
}) {
    return (
        <ErrorBoundary
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-sm">
                            {componentName || "Component"} Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-2">
                            {error.message}
                        </p>
                        <Button onClick={reset} size="sm" variant="outline">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}
        >
            {children}
        </ErrorBoundary>
    );
}
