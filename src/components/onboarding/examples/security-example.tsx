/**
 * Security Implementation Example
 * 
 * This file demonstrates how to use the onboarding security features
 * in React components. It shows proper usage of:
 * - Server actions with JWT verification
 * - CSRF protection
 * - Input sanitization
 * - Error handling
 * 
 * Requirements: 11.1, 2.2
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    initializeOnboardingAction,
    completeStepAction,
    getOnboardingStateAction,
} from '@/services/onboarding/onboarding-actions';
import {
    validateAndSanitizeProfileForm,
    type ProfileFormData,
} from '@/services/onboarding/onboarding-security';
import { getCSRFToken } from '@/lib/security/csrf-protection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

/**
 * Example: Initialize Onboarding with Role Validation
 */
export function InitializeOnboardingExample() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleInitialize = async (flowType: 'user' | 'admin' | 'both') => {
        setLoading(true);

        try {
            // Server action automatically:
            // 1. Verifies JWT token
            // 2. Validates admin role (if admin/both flow)
            // 3. Checks rate limit
            const result = await initializeOnboardingAction(flowType);

            if (result.message === 'success') {
                toast({
                    title: 'Success',
                    description: 'Onboarding initialized successfully',
                });
                router.push('/onboarding/welcome');
            } else {
                // Handle errors
                if (result.errors.auth) {
                    toast({
                        title: 'Unauthorized',
                        description: result.errors.auth[0],
                        variant: 'destructive',
                    });
                } else if (result.errors.rateLimit) {
                    toast({
                        title: 'Rate Limit Exceeded',
                        description: result.errors.rateLimit[0],
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Error',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Initialize Onboarding</h3>
            <div className="flex gap-2">
                <Button
                    onClick={() => handleInitialize('user')}
                    disabled={loading}
                >
                    User Flow
                </Button>
                <Button
                    onClick={() => handleInitialize('admin')}
                    disabled={loading}
                >
                    Admin Flow (Requires Admin Role)
                </Button>
                <Button
                    onClick={() => handleInitialize('both')}
                    disabled={loading}
                >
                    Both Flows (Requires Admin Role)
                </Button>
            </div>
        </div>
    );
}

/**
 * Example: Complete Step with CSRF Protection
 */
export function CompleteStepExample() {
    const [loading, setLoading] = useState(false);

    const handleCompleteStep = async (stepId: string) => {
        setLoading(true);

        try {
            // Get CSRF token for protection
            const csrfToken = await getCSRFToken();

            // Server action automatically:
            // 1. Validates CSRF token
            // 2. Verifies JWT token
            // 3. Sanitizes step ID
            // 4. Checks rate limit
            const result = await completeStepAction(stepId, csrfToken);

            if (result.message === 'success') {
                toast({
                    title: 'Success',
                    description: 'Step completed successfully',
                });
            } else {
                // Handle specific errors
                if (result.errors.csrf) {
                    toast({
                        title: 'Security Error',
                        description: 'CSRF validation failed. Please refresh the page.',
                        variant: 'destructive',
                    });
                } else if (result.errors.rateLimit) {
                    toast({
                        title: 'Too Many Requests',
                        description: result.errors.rateLimit[0],
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Error',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Complete Step</h3>
            <Button
                onClick={() => handleCompleteStep('welcome')}
                disabled={loading}
            >
                Complete Welcome Step
            </Button>
        </div>
    );
}

/**
 * Example: Profile Form with Input Sanitization
 */
export function ProfileFormExample() {
    const [formData, setFormData] = useState<Partial<ProfileFormData>>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        brokerage: '',
        location: {
            city: '',
            state: '',
            zipCode: '',
        },
        specialties: [],
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Validate and sanitize form data
            // This automatically:
            // 1. Sanitizes all text inputs (removes XSS, SQL injection, etc.)
            // 2. Validates email format
            // 3. Validates phone format
            // 4. Validates location data
            // 5. Checks for suspicious patterns
            const result = validateAndSanitizeProfileForm(formData);

            if (!result.success) {
                // Show validation errors
                setErrors(result.errors);
                toast({
                    title: 'Validation Error',
                    description: 'Please check the form for errors',
                    variant: 'destructive',
                });
                return;
            }

            // Use validated and sanitized data
            const validatedData = result.data;

            // Save to backend (would use a server action here)

            toast({
                title: 'Success',
                description: 'Profile saved successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Form with Security</h3>

            <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                />
                {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                />
                {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="brokerage">Brokerage</Label>
                <Input
                    id="brokerage"
                    value={formData.brokerage}
                    onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                    placeholder="ABC Realty"
                />
                {errors.brokerage && (
                    <p className="text-sm text-red-500">{errors.brokerage[0]}</p>
                )}
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
            </Button>
        </form>
    );
}

/**
 * Example: Get Onboarding State (Read-Only, No CSRF)
 */
export function GetStateExample() {
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<any>(null);

    const handleGetState = async () => {
        setLoading(true);

        try {
            // Server action automatically:
            // 1. Verifies JWT token
            // 2. No rate limit (read-only operation)
            // 3. No CSRF needed (read-only)
            const result = await getOnboardingStateAction();

            if (result.message === 'success') {
                setState(result.data);
                toast({
                    title: 'Success',
                    description: 'State retrieved successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Get Onboarding State</h3>
            <Button onClick={handleGetState} disabled={loading}>
                Get State
            </Button>
            {state && (
                <pre className="p-4 bg-gray-100 rounded-md overflow-auto">
                    {JSON.stringify(state, null, 2)}
                </pre>
            )}
        </div>
    );
}

/**
 * Example: Complete Component with All Security Features
 */
export function CompleteSecurityExample() {
    return (
        <div className="space-y-8 p-6">
            <h2 className="text-2xl font-bold">Onboarding Security Examples</h2>

            <div className="space-y-6">
                <InitializeOnboardingExample />
                <hr />
                <CompleteStepExample />
                <hr />
                <ProfileFormExample />
                <hr />
                <GetStateExample />
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-md">
                <h4 className="font-semibold mb-2">Security Features Demonstrated:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>JWT token verification (automatic in all server actions)</li>
                    <li>Server-side role validation (admin flow initialization)</li>
                    <li>Input sanitization (profile form)</li>
                    <li>Rate limiting (all state-changing operations)</li>
                    <li>CSRF protection (complete step action)</li>
                    <li>Error handling (all examples)</li>
                    <li>Validation feedback (profile form)</li>
                </ul>
            </div>
        </div>
    );
}
