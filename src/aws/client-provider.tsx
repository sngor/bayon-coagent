'use client';

/**
 * AWS Client Provider
 * 
 * This component provides AWS authentication context to the entire application.
 * It replaces the Firebase client provider with AWS Cognito authentication.
 */

import React, { type ReactNode } from 'react';
import { AuthProvider } from '@/aws/auth/auth-provider';

interface AWSClientProviderProps {
    children: ReactNode;
}

/**
 * AWS Client Provider Component
 * 
 * Wraps the application with AWS authentication context.
 * This provides authentication state and methods to all child components.
 */
export function AWSClientProvider({ children }: AWSClientProviderProps) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
