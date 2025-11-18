"use client";

/**
 * Error Handling Demo Page
 * 
 * Demonstrates the smart error handling system with various error scenarios,
 * recovery actions, and retry mechanisms.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertTriangle,
    Wifi,
    Lock,
    Database,
    Zap,
    RefreshCw,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    useErrorHandler,
    useAsyncWithRetry,
    useFormWithErrorHandling,
    useApiCall,
} from "@/hooks/use-error-handler";
import {
    ErrorCategory,
    getErrorStatistics,
    isRecurringError,
} from "@/lib/error-handling";
import { ErrorBoundary, ComponentErrorBoundary } from "@/components/error-boundary";

export default function ErrorHandlingDemoPage() {
    return (
        <ErrorBoundary>
            <div className="container mx-auto py-8 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Error Handling Demo</h1>
                    <p className="text-muted-foreground">
                        Test the smart error handling system with various error scenarios
                    </p>
                </div>

                <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="basic">Basic Errors</TabsTrigger>
                        <TabsTrigger value="retry">Retry Mechanism</TabsTrigger>
                        <TabsTrigger value="forms">Form Handling</TabsTrigger>
                        <TabsTrigger value="api">API Calls</TabsTrigger>
                        <TabsTrigger value="stats">Error Statistics</TabsTrigger>
                    </TabsList>

                    {/* Basic Error Handling */}
                    <TabsContent value="basic" className="space-y-4">
                        <BasicErrorDemo />
                    </TabsContent>

                    {/* Retry Mechanism */}
                    <TabsContent value="retry" className="space-y-4">
                        <RetryMechanismDemo />
                    </TabsContent>

                    {/* Form Handling */}
                    <TabsContent value="forms" className="space-y-4">
                        <FormErrorDemo />
                    </TabsContent>

                    {/* API Calls */}
                    <TabsContent value="api" className="space-y-4">
                        <ApiCallDemo />
                    </TabsContent>

                    {/* Error Statistics */}
                    <TabsContent value="stats" className="space-y-4">
                        <ErrorStatisticsDemo />
                    </TabsContent>
                </Tabs>
            </div>
        </ErrorBoundary>
    );
}

// ============================================================================
// Basic Error Demo
// ============================================================================

function BasicErrorDemo() {
    const { error, pattern, handleError, clearError } = useErrorHandler();

    const triggerError = (type: string) => {
        clearError();

        switch (type) {
            case "network":
                handleError(new Error("Failed to fetch: Network request failed"));
                break;
            case "auth":
                handleError(new Error("NotAuthorizedException: Incorrect username or password"));
                break;
            case "validation":
                handleError(new Error("Validation failed: Invalid email format"));
                break;
            case "rate-limit":
                handleError(new Error("TooManyRequestsException: Rate limit exceeded"));
                break;
            case "ai":
                handleError(new Error("Bedrock AI generation failed: Service unavailable"));
                break;
            case "database":
                handleError(new Error("DynamoDB query failed: Resource not found"));
                break;
            default:
                handleError(new Error("Unknown error occurred"));
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ErrorTriggerCard
                title="Network Error"
                description="Simulate a network connection failure"
                icon={<Wifi className="w-5 h-5" />}
                category={ErrorCategory.NETWORK}
                onClick={() => triggerError("network")}
            />

            <ErrorTriggerCard
                title="Authentication Error"
                description="Simulate incorrect credentials"
                icon={<Lock className="w-5 h-5" />}
                category={ErrorCategory.AUTHENTICATION}
                onClick={() => triggerError("auth")}
            />

            <ErrorTriggerCard
                title="Validation Error"
                description="Simulate invalid form input"
                icon={<AlertTriangle className="w-5 h-5" />}
                category={ErrorCategory.VALIDATION}
                onClick={() => triggerError("validation")}
            />

            <ErrorTriggerCard
                title="Rate Limit Error"
                description="Simulate too many requests"
                icon={<RefreshCw className="w-5 h-5" />}
                category={ErrorCategory.RATE_LIMIT}
                onClick={() => triggerError("rate-limit")}
            />

            <ErrorTriggerCard
                title="AI Operation Error"
                description="Simulate AI generation failure"
                icon={<Zap className="w-5 h-5" />}
                category={ErrorCategory.AI_OPERATION}
                onClick={() => triggerError("ai")}
            />

            <ErrorTriggerCard
                title="Database Error"
                description="Simulate database query failure"
                icon={<Database className="w-5 h-5" />}
                category={ErrorCategory.DATABASE}
                onClick={() => triggerError("database")}
            />

            {/* Error Display */}
            {error && pattern && (
                <Card className="md:col-span-2 lg:col-span-3 border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-destructive" />
                            Error Detected
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold mb-1">User Message:</p>
                            <p className="text-sm text-muted-foreground">{pattern.userMessage}</p>
                        </div>

                        <div>
                            <p className="font-semibold mb-2">Suggested Actions:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {pattern.suggestedActions.map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{pattern.category}</Badge>
                            {isRecurringError(error) && (
                                <Badge variant="destructive">Recurring</Badge>
                            )}
                        </div>

                        <Button onClick={clearError} variant="outline" size="sm">
                            Clear Error
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Retry Mechanism Demo
// ============================================================================

function RetryMechanismDemo() {
    const [attemptCount, setAttemptCount] = useState(0);
    const [shouldSucceed, setShouldSucceed] = useState(false);

    const simulateOperation = async () => {
        setAttemptCount((prev) => prev + 1);

        // Fail first 2 attempts, then succeed
        if (!shouldSucceed && attemptCount < 2) {
            throw new Error("Network request failed: Connection timeout");
        }

        return { success: true, data: "Operation completed successfully!" };
    };

    const { data, error, pattern, isLoading, execute, retry } = useAsyncWithRetry(
        simulateOperation,
        {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 5000,
        }
    );

    const handleExecute = () => {
        setAttemptCount(0);
        execute();
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Exponential Backoff Retry</CardTitle>
                    <CardDescription>
                        Test automatic retry with exponential backoff for transient failures
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={handleExecute} disabled={isLoading}>
                            {isLoading ? "Retrying..." : "Execute Operation"}
                        </Button>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={shouldSucceed}
                                onChange={(e) => setShouldSucceed(e.target.checked)}
                                className="rounded"
                            />
                            Succeed on first attempt
                        </label>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm">
                            <span className="font-semibold">Attempts:</span> {attemptCount}
                        </p>

                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Retrying with exponential backoff...
                            </div>
                        )}

                        {data && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                {data.data}
                            </div>
                        )}

                        {error && pattern && (
                            <div className="p-3 bg-destructive/10 rounded-md">
                                <p className="text-sm font-semibold text-destructive mb-1">
                                    {pattern.userMessage}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    All retry attempts exhausted
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// Form Error Demo
// ============================================================================

function FormErrorDemo() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { error, pattern, isSubmitting, handleSubmit, clearError } =
        useFormWithErrorHandling();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await handleSubmit(async () => {
            // Simulate validation
            if (!formData.email.includes("@")) {
                throw new Error("Validation failed: Invalid email format");
            }

            if (formData.password.length < 8) {
                throw new Error(
                    "InvalidPasswordException: Password must be at least 8 characters"
                );
            }

            // Simulate success
            return { success: true };
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Form Error Handling</CardTitle>
                <CardDescription>
                    Test form validation and submission error handling
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="text"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                clearError();
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter email"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                clearError();
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter password"
                        />
                    </div>

                    {error && pattern && (
                        <div className="p-3 bg-destructive/10 rounded-md">
                            <p className="text-sm font-semibold text-destructive mb-1">
                                {pattern.userMessage}
                            </p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                                {pattern.suggestedActions.slice(0, 2).map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// API Call Demo
// ============================================================================

function ApiCallDemo() {
    const [shouldFail, setShouldFail] = useState(true);

    const simulateApiCall = async () => {
        if (shouldFail) {
            throw new Error("Network request failed: Unable to reach server");
        }
        return { data: "API call successful!", timestamp: new Date().toISOString() };
    };

    const { data, error, pattern, isLoading, execute } = useApiCall(
        simulateApiCall,
        {
            retryOnNetworkError: true,
            maxRetries: 3,
        }
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>API Call with Auto-Retry</CardTitle>
                <CardDescription>
                    Test API calls with automatic retry on network errors
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Button onClick={execute} disabled={isLoading}>
                        {isLoading ? "Calling API..." : "Make API Call"}
                    </Button>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={!shouldFail}
                            onChange={(e) => setShouldFail(!e.target.checked)}
                            className="rounded"
                        />
                        Succeed immediately
                    </label>
                </div>

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Making API call with auto-retry...
                    </div>
                )}

                {data && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-sm font-semibold text-green-600 mb-1">
                            Success!
                        </p>
                        <p className="text-xs text-muted-foreground">{data.data}</p>
                    </div>
                )}

                {error && pattern && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                        <p className="text-sm font-semibold text-destructive mb-1">
                            {pattern.userMessage}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Retries exhausted after 3 attempts
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Error Statistics Demo
// ============================================================================

function ErrorStatisticsDemo() {
    const [stats, setStats] = useState<Array<[string, any]>>([]);

    const refreshStats = () => {
        const errorStats = getErrorStatistics();
        setStats(Array.from(errorStats.entries()));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Statistics</CardTitle>
                <CardDescription>
                    View tracked error patterns and occurrence counts
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={refreshStats} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Statistics
                </Button>

                {stats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No errors tracked yet. Trigger some errors to see statistics.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {stats.map(([key, stat]) => (
                            <div
                                key={key}
                                className="p-3 border rounded-md flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium truncate">{stat.pattern}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            {stat.category}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(stat.lastOccurrence).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="secondary">{stat.count}x</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Helper Components
// ============================================================================

interface ErrorTriggerCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    category: ErrorCategory;
    onClick: () => void;
}

function ErrorTriggerCard({
    title,
    description,
    icon,
    category,
    onClick,
}: ErrorTriggerCardProps) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                            {category}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
