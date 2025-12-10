/**
 * Error Handling Examples
 * 
 * Demonstrates various error handling scenarios in the onboarding system.
 * This file is for documentation and testing purposes.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ValidationErrorDisplay,
    FieldError,
    OnboardingErrorBoundary,
} from '@/components/onboarding';
import {
    getErrorInfo,
    retryWithBackoff,
    formatValidationErrors,
    OnboardingErrorCategory,
} from '@/services/onboarding/onboarding-error-handler';
import { OnboardingError } from '@/services/onboarding/onboarding-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Example 1: Network Error with Retry
 */
export function NetworkErrorExample() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);

    const simulateNetworkError = async () => {
        setIsLoading(true);
        setAttemptCount(0);

        try {
            await retryWithBackoff(
                async () => {
                    // Simulate network failure for first 2 attempts
                    if (attemptCount < 2) {
                        throw new OnboardingError(
                            'Network connection failed',
                            'NETWORK_ERROR',
                            true
                        );
                    }
                    return 'Success!';
                },
                {
                    maxRetries: 3,
                    initialDelay: 1000,
                    maxDelay: 5000,
                    backoffMultiplier: 2,
                    jitter: true,
                },
                (attempt) => {
                    setAttemptCount(attempt);
                    toast({
                        title: 'Retrying...',
                        description: `Attempt ${attempt} of 3`,
                    });
                }
            );

            toast({
                title: 'Success!',
                description: 'Operation completed after retries',
            });
        } catch (error) {
            const errorInfo = getErrorInfo(error);
            toast({
                title: errorInfo.title,
                description: errorInfo.description,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Network Error with Retry</CardTitle>
                <CardDescription>
                    Demonstrates automatic retry with exponential backoff
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={simulateNetworkError}
                    disabled={isLoading}
                >
                    {isLoading ? `Retrying... (${attemptCount}/3)` : 'Simulate Network Error'}
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Example 2: Validation Errors
 */
export function ValidationErrorExample() {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        location: { city: '' },
    });

    const validateForm = () => {
        const newErrors: Record<string, string[]> = {};

        if (!formData.firstName) {
            newErrors.firstName = ['First name is required'];
        }

        if (!formData.email) {
            newErrors.email = ['Email is required'];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = ['Invalid email format'];
        }

        if (!formData.location.city) {
            newErrors['location.city'] = ['City is required'];
        }

        setErrors(newErrors);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Validation Errors</CardTitle>
                <CardDescription>
                    Demonstrates field-specific validation error display
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.keys(errors).length > 0 && (
                    <ValidationErrorDisplay errors={errors} />
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <FieldError error={errors.firstName} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <FieldError error={errors.email} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <input
                        type="text"
                        value={formData.location.city}
                        onChange={(e) => setFormData({
                            ...formData,
                            location: { city: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <FieldError error={errors['location.city']} />
                </div>

                <Button onClick={validateForm}>
                    Validate Form
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Example 3: Error Boundary
 */
function ComponentThatThrows() {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
        throw new OnboardingError(
            'Component error occurred',
            'COMPONENT_ERROR',
            false
        );
    }

    return (
        <div className="space-y-4">
            <p>This component is working normally.</p>
            <Button
                onClick={() => setShouldThrow(true)}
                variant="destructive"
            >
                Trigger Error
            </Button>
        </div>
    );
}

export function ErrorBoundaryExample() {
    const [key, setKey] = useState(0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Boundary</CardTitle>
                <CardDescription>
                    Demonstrates error boundary catching component errors
                </CardDescription>
            </CardHeader>
            <CardContent>
                <OnboardingErrorBoundary key={key}>
                    <ComponentThatThrows />
                </OnboardingErrorBoundary>

                <Button
                    onClick={() => setKey(k => k + 1)}
                    variant="outline"
                    className="mt-4"
                >
                    Reset Component
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Example 4: Error Info Display
 */
export function ErrorInfoExample() {
    const [selectedCategory, setSelectedCategory] = useState<OnboardingErrorCategory>(
        OnboardingErrorCategory.NETWORK
    );

    const createError = (category: OnboardingErrorCategory) => {
        switch (category) {
            case OnboardingErrorCategory.NETWORK:
                return new OnboardingError('Network timeout', 'NETWORK_TIMEOUT', true);
            case OnboardingErrorCategory.VALIDATION:
                return new OnboardingError('Invalid input', 'VALIDATION_ERROR', false);
            case OnboardingErrorCategory.STATE:
                return new OnboardingError('State corrupted', 'STATE_CORRUPTED', false);
            case OnboardingErrorCategory.NAVIGATION:
                return new OnboardingError('Invalid step', 'NAVIGATION_ERROR', false);
            case OnboardingErrorCategory.AUTHENTICATION:
                return new OnboardingError('Session expired', 'AUTH_ERROR', false);
            default:
                return new Error('Unknown error');
        }
    };

    const error = createError(selectedCategory);
    const errorInfo = getErrorInfo(error);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Info Display</CardTitle>
                <CardDescription>
                    Shows how errors are converted to user-friendly messages
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Error Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as OnboardingErrorCategory)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        {Object.values(OnboardingErrorCategory).map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="p-4 border rounded space-y-2">
                    <div>
                        <span className="font-medium">Title:</span> {errorInfo.title}
                    </div>
                    <div>
                        <span className="font-medium">Description:</span> {errorInfo.description}
                    </div>
                    <div>
                        <span className="font-medium">Severity:</span> {errorInfo.severity}
                    </div>
                    <div>
                        <span className="font-medium">Retryable:</span> {errorInfo.retryable ? 'Yes' : 'No'}
                    </div>
                    <div>
                        <span className="font-medium">Code:</span> {errorInfo.code}
                    </div>
                    <div>
                        <span className="font-medium">Actions:</span>
                        <ul className="list-disc list-inside ml-4">
                            {errorInfo.actions.map((action, index) => (
                                <li key={index}>{action}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Main Examples Page
 */
export function ErrorHandlingExamples() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Error Handling Examples</h1>
                <p className="text-muted-foreground">
                    Interactive examples demonstrating error handling in the onboarding system
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <NetworkErrorExample />
                <ValidationErrorExample />
                <ErrorBoundaryExample />
                <ErrorInfoExample />
            </div>
        </div>
    );
}
