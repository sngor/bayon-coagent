import { Suspense } from 'react';
import { ClientLoginForm } from '@/components/client-portal/client-login-form';

/**
 * Client Portal - Login Page
 * 
 * This page allows clients with accounts to sign in to access their dashboard.
 * 
 * Requirements: 2.3
 */
export default function ClientLoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ClientLoginForm />
            </Suspense>
        </div>
    );
}

export const metadata = {
    title: 'Sign In - Client Portal',
    description: 'Sign in to access your personalized client portal',
    robots: 'noindex, nofollow',
};
