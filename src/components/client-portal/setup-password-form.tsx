'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Setup Password Form Component
 * 
 * Allows clients to set their password after receiving an invitation.
 * Validates password complexity and provides real-time feedback.
 * 
 * Requirements: 2.1, 2.2
 */
export function SetupPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password validation state
    const [validations, setValidations] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
    });

    // Validate password in real-time
    useEffect(() => {
        setValidations({
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
        });
    }, [password]);

    const isPasswordValid = Object.values(validations).every(v => v);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid invitation link. Please request a new invitation from your agent.');
            return;
        }

        if (!isPasswordValid) {
            setError('Please ensure your password meets all requirements.');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Import the client auth functions
            const { getClientAuthClient } = await import('@/aws/auth/client-auth');
            const { getRepository } = await import('@/aws/dynamodb/repository');

            // Get the invitation from DynamoDB
            const repository = getRepository();

            // Query for the invitation by token
            // We need to scan or use GSI since we only have the token
            // For now, we'll use a simple approach - in production, you'd want a GSI
            const invitationPK = `INVITATION#${token}`;

            // Try to get invitation - this is a simplified approach
            // In production, you'd want to add a GSI for token lookups
            let invitation: any = null;

            // For now, we'll need to get the email from the token validation
            // This is a temporary solution - proper implementation would use GSI
            const response = await fetch('/api/client-portal/validate-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                throw new Error('Invalid or expired invitation');
            }

            const data = await response.json();
            const email = data.email;

            // Set the password
            const clientAuth = getClientAuthClient();
            await clientAuth.setClientPassword(email, password);

            // Update invitation status
            // This would be done via an API route in production
            await fetch('/api/client-portal/complete-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/portal/login');
            }, 2000);
        } catch (err) {
            console.error('Failed to set password:', err);
            setError(err instanceof Error ? err.message : 'Failed to set password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600">Invalid Link</CardTitle>
                    <CardDescription>
                        This invitation link is invalid. Please request a new invitation from your agent.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                        <Check className="h-6 w-6" />
                        Password Set Successfully!
                    </CardTitle>
                    <CardDescription>
                        Your account is now ready. Redirecting you to the login page...
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-6 w-6" />
                    Create Your Password
                </CardTitle>
                <CardDescription>
                    Set a secure password to access your personalized client portal
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Password Input */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="pr-10"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password Requirements:
                        </p>
                        <div className="space-y-1">
                            <ValidationItem
                                valid={validations.minLength}
                                text="At least 8 characters"
                            />
                            <ValidationItem
                                valid={validations.hasUppercase}
                                text="One uppercase letter"
                            />
                            <ValidationItem
                                valid={validations.hasLowercase}
                                text="One lowercase letter"
                            />
                            <ValidationItem
                                valid={validations.hasNumber}
                                text="One number"
                            />
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="pr-10"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {confirmPassword && (
                            <p className={`text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Setting Password...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {valid ? (
                <Check className="h-4 w-4 text-green-600" />
            ) : (
                <X className="h-4 w-4 text-gray-400" />
            )}
            <span className={valid ? 'text-green-600' : 'text-gray-500'}>
                {text}
            </span>
        </div>
    );
}
