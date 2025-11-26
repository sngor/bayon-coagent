'use client';

import React from 'react';
import SettingsPage from '../(app)/settings/page';
import { AuthContext } from '@/aws/auth/auth-provider';

// Mock user
const mockUser = {
    id: 'preview-user-id',
    email: 'preview@example.com',
    emailVerified: true,
    attributes: {
        name: 'Preview User',
        given_name: 'Preview'
    }
};

// Mock context value
const mockAuthContext = {
    user: mockUser,
    session: {
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000
    },
    isLoading: false,
    error: null,
    signIn: async () => { },
    signUp: async () => ({ userConfirmed: true }),
    confirmSignUp: async () => { },
    resendConfirmationCode: async () => { },
    signOut: async () => { },
    refreshSession: async () => { }
};

import { ThemeProvider } from '@/components/theme-provider';
import { AccessibilityProvider } from '@/contexts/accessibility-context';
import { TooltipProvider } from '@/contexts/tooltip-context';
import { Toaster } from '@/components/ui/toaster';

export default function PreviewSettingsPage() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthContext.Provider value={mockAuthContext}>
                <AccessibilityProvider>
                    <TooltipProvider>
                        <div className="p-8">
                            <h1 className="text-2xl font-bold mb-4">Settings Preview</h1>
                            <div className="border rounded-lg p-4 bg-background">
                                <SettingsPage />
                            </div>
                        </div>
                        <Toaster />
                    </TooltipProvider>
                </AccessibilityProvider>
            </AuthContext.Provider>
        </ThemeProvider>
    );
}
