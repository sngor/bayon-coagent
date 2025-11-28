import { Suspense } from 'react';
import { SetupPasswordForm } from '@/components/client-portal/setup-password-form';

/**
 * Client Portal - Setup Password Page
 * 
 * This page allows clients to set their password after receiving an invitation.
 * The invitation token is passed as a URL parameter.
 * 
 * Requirements: 2.1, 2.2
 */
export default function SetupPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <SetupPasswordForm />
            </Suspense>
        </div>
    );
}

export const metadata = {
    title: 'Setup Password - Client Portal',
    description: 'Create your password to access your personalized client portal',
    robots: 'noindex, nofollow',
};
