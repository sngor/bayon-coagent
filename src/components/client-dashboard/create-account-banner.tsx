'use client';

import { useState } from 'react';
import { UserPlus, Check, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkClientAccountExists, convertLinkToAccount } from '@/features/client-dashboards/actions/client-dashboard-actions';

interface CreateAccountBannerProps {
    token: string;
    primaryColor: string;
    clientName: string;
}

/**
 * Create Account Banner Component
 * 
 * Displays a prominent banner on the client dashboard offering to convert
 * the secured link access to a full authenticated account.
 * 
 * Features:
 * - Checks if account already exists
 * - Converts link to account with one click
 * - Shows success message with next steps
 * - Handles errors gracefully
 * 
 * Requirements: 1.1, 2.1
 */
export function CreateAccountBanner({ token, primaryColor, clientName }: CreateAccountBannerProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [accountExists, setAccountExists] = useState<boolean | null>(null);
    const [conversionComplete, setConversionComplete] = useState(false);
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Check if account exists on mount
    useState(() => {
        checkAccount();
    });

    const checkAccount = async () => {
        setIsChecking(true);
        setError('');
        try {
            const result = await checkClientAccountExists(token);
            if (result.message === 'success' && result.data) {
                setAccountExists(result.data.exists);
                setEmail(result.data.email);
            } else {
                setError('Unable to check account status');
            }
        } catch (err) {
            console.error('Failed to check account:', err);
            setError('Unable to check account status');
        } finally {
            setIsChecking(false);
        }
    };

    const handleCreateAccount = async () => {
        setIsConverting(true);
        setError('');
        try {
            const result = await convertLinkToAccount(token);
            if (result.message === 'success') {
                setConversionComplete(true);
            } else {
                setError(result.message || 'Failed to create account');
            }
        } catch (err) {
            console.error('Failed to create account:', err);
            setError('Failed to create account. Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    // Don't show banner if account already exists
    if (accountExists === true) {
        return null;
    }

    // Don't show banner if conversion is complete
    if (conversionComplete) {
        return (
            <Card className="border-2 shadow-lg mb-6" style={{ borderColor: primaryColor }}>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}20` }}
                        >
                            <Check className="h-6 w-6" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Account Created Successfully!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We've sent an email to <strong>{email}</strong> with instructions to set your password.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="h-4 w-4" />
                                <span>Check your email to complete your account setup</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show loading state while checking
    if (isChecking) {
        return (
            <Card className="border-2 shadow-lg mb-6" style={{ borderColor: primaryColor }}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Checking account status...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show error state
    if (error) {
        return (
            <Card className="border-2 border-red-200 shadow-lg mb-6">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                                Unable to Create Account
                            </h3>
                            <p className="text-red-600 dark:text-red-400 mb-4">
                                {error}
                            </p>
                            <Button
                                onClick={checkAccount}
                                variant="outline"
                                size="sm"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show create account banner
    return (
        <Card className="border-2 shadow-lg mb-6" style={{ borderColor: primaryColor }}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div
                        className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                    >
                        <UserPlus className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Create Your Account
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Hi {clientName}! Create an account to access your dashboard anytime without needing this link.
                            You'll be able to sign in with your email and password.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleCreateAccount}
                                disabled={isConverting}
                                className="shadow-md hover:shadow-lg transition-all"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: '#ffffff',
                                }}
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create Account
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                You'll receive an email to set your password
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
