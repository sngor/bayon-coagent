"use client";

/**
 * Kiro AI Assistant Error Boundary Components
 * 
 * Specialized error boundaries for different Kiro AI Assistant components:
 * - Chat interface errors
 * - Vision analysis errors
 * - Profile management errors
 * - AI operation errors
 * 
 * Validates: Requirements 4.5
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertTriangle,
    RefreshCw,
    MessageSquare,
    Eye,
    User,
    Sparkles,
    Home,
} from "lucide-react";
import { kiroLogger } from "@/aws/bedrock/kiro-logger";

// ============================================================================
// Base Kiro Error Boundary
// ============================================================================

export interface KiroErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
    componentName: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface KiroErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class KiroErrorBoundary extends React.Component<
    KiroErrorBoundaryProps,
    KiroErrorBoundaryState
> {
    constructor(props: KiroErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<KiroErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });

        // Log to Kiro logger
        kiroLogger.error(
            `Error in ${this.props.componentName}`,
            error,
            {
                component: 'error-boundary',
                errorInfo: errorInfo.componentStack,
            }
        );

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
            }

            return (
                <DefaultKiroErrorFallback
                    error={this.state.error}
                    componentName={this.props.componentName}
                    reset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

// ============================================================================
// Default Fallback Component
// ============================================================================

interface DefaultKiroErrorFallbackProps {
    error: Error;
    componentName: string;
    reset: () => void;
}

function DefaultKiroErrorFallback({
    error,
    componentName,
    reset,
}: DefaultKiroErrorFallbackProps) {
    return (
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error in {componentName}</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm">{error.message}</p>
                <Button onClick={reset} size="sm" variant="outline" className="gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Try Again
                </Button>
            </AlertDescription>
        </Alert>
    );
}

// ============================================================================
// Chat Interface Error Boundary
// ============================================================================

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <KiroErrorBoundary
            componentName="Chat Interface"
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                                <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Chat Error</CardTitle>
                                <CardDescription>
                                    The chat interface encountered an error
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                        <Alert>
                            <AlertDescription className="text-xs">
                                <strong>What you can do:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Try refreshing the chat</li>
                                    <li>Check your internet connection</li>
                                    <li>Simplify your query if it was complex</li>
                                    <li>Contact support if this persists</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={reset} variant="default" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Retry Chat
                        </Button>
                        <Button
                            onClick={() => (window.location.href = "/dashboard")}
                            variant="outline"
                            className="gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Go to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            )}
        >
            {children}
        </KiroErrorBoundary>
    );
}

// ============================================================================
// Vision Analysis Error Boundary
// ============================================================================

export function VisionErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <KiroErrorBoundary
            componentName="Vision Analysis"
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                                <Eye className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Vision Analysis Error</CardTitle>
                                <CardDescription>
                                    Failed to analyze the image
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                        <Alert>
                            <AlertDescription className="text-xs">
                                <strong>What you can do:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Try uploading a different image</li>
                                    <li>Ensure the image is in JPEG, PNG, or WebP format</li>
                                    <li>Check that the image file size is under 5MB</li>
                                    <li>Try a simpler question about the image</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={reset} variant="default" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button
                            onClick={() => (window.location.href = "/assistant")}
                            variant="outline"
                        >
                            Back to Assistant
                        </Button>
                    </CardFooter>
                </Card>
            )}
        >
            {children}
        </KiroErrorBoundary>
    );
}

// ============================================================================
// Profile Management Error Boundary
// ============================================================================

export function ProfileErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <KiroErrorBoundary
            componentName="Profile Management"
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                                <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Profile Error</CardTitle>
                                <CardDescription>
                                    Failed to load or save your profile
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                        <Alert>
                            <AlertDescription className="text-xs">
                                <strong>What you can do:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Check your internet connection</li>
                                    <li>Ensure all required fields are filled</li>
                                    <li>Try refreshing the page</li>
                                    <li>Contact support if you can't save your profile</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={reset} variant="default" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Reload Profile
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                        >
                            Refresh Page
                        </Button>
                    </CardFooter>
                </Card>
            )}
        >
            {children}
        </KiroErrorBoundary>
    );
}

// ============================================================================
// AI Operation Error Boundary
// ============================================================================

export function AIOperationErrorBoundary({
    children,
    operationName,
}: {
    children: React.ReactNode;
    operationName?: string;
}) {
    return (
        <KiroErrorBoundary
            componentName={operationName || "AI Operation"}
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                                <Sparkles className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">AI Operation Failed</CardTitle>
                                <CardDescription>
                                    {operationName || "The AI operation"} encountered an error
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                        <Alert>
                            <AlertDescription className="text-xs">
                                <strong>What you can do:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Try again in a moment (AI services may be temporarily busy)</li>
                                    <li>Simplify your request if it was complex</li>
                                    <li>Check that your input is valid</li>
                                    <li>Contact support if this continues</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={reset} variant="default" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button
                            onClick={() => (window.location.href = "/dashboard")}
                            variant="outline"
                            className="gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Go to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            )}
        >
            {children}
        </KiroErrorBoundary>
    );
}

// ============================================================================
// Inline Error Display (for smaller components)
// ============================================================================

export function InlineErrorDisplay({
    error,
    onRetry,
    componentName,
}: {
    error: Error;
    onRetry?: () => void;
    componentName?: string;
}) {
    return (
        <Alert variant="destructive" className="my-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">
                {componentName ? `${componentName} Error` : "Error"}
            </AlertTitle>
            <AlertDescription className="text-xs mt-1">
                <p className="mb-2">{error.message}</p>
                {onRetry && (
                    <Button onClick={onRetry} size="sm" variant="outline" className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Retry
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

// ============================================================================
// Workflow Error Boundary (for orchestrator)
// ============================================================================

export function WorkflowErrorBoundary({
    children,
    workflowId,
}: {
    children: React.ReactNode;
    workflowId?: string;
}) {
    return (
        <KiroErrorBoundary
            componentName="Workflow Orchestrator"
            onError={(error, errorInfo) => {
                kiroLogger.error(
                    "Workflow orchestration error",
                    error,
                    {
                        workflowId,
                        component: 'orchestrator',
                        errorInfo: errorInfo.componentStack,
                    }
                );
            }}
            fallback={({ error, reset }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-lg">Workflow Error</CardTitle>
                        <CardDescription>
                            The AI workflow encountered an error during execution
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                        {workflowId && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Workflow ID: <code className="bg-muted px-1 py-0.5 rounded">{workflowId}</code>
                            </p>
                        )}
                        <Alert>
                            <AlertDescription className="text-xs">
                                <strong>This usually means:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>One or more AI workers failed to complete their tasks</li>
                                    <li>The request may have been too complex</li>
                                    <li>A temporary service issue occurred</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={reset} variant="default" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Retry Workflow
                        </Button>
                        <Button
                            onClick={() => (window.location.href = "/assistant")}
                            variant="outline"
                        >
                            Start New Query
                        </Button>
                    </CardFooter>
                </Card>
            )}
        >
            {children}
        </KiroErrorBoundary>
    );
}
