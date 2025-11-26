'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/aws/auth';
import { forceCreateAdminProfile, verifyAdminProfile } from '@/app/actions';

export default function AdminSetupPage() {
    const { user } = useUser();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);

    const handleSetup = async () => {
        if (!user) {
            setMessage('Please log in first');
            return;
        }

        setStatus('loading');
        try {
            await forceCreateAdminProfile(user.id, user.email || 'ngorlong@gmail.com');

            // Verify immediately
            const verification = await verifyAdminProfile(user.id);
            setDebugInfo(verification);

            // Note: repository.get returns the Data object directly
            if (verification.found && (verification.data as any)?.role === 'super_admin') {
                setStatus('success');
                setMessage('Admin profile created and verified successfully! Please refresh the page.');
            } else {
                setStatus('error');
                setMessage('Profile created but verification failed. See debug info.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Failed to create admin profile: ' + (error as Error).message);
        }
    };

    return (
        <div className="container max-w-md py-12 space-y-6">
            <h1 className="text-2xl font-bold">Admin Setup</h1>
            <p className="text-muted-foreground">
                Click the button below to force-create your admin profile in DynamoDB.
            </p>

            {user ? (
                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-sm">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                    </div>

                    <Button
                        onClick={handleSetup}
                        disabled={status === 'loading'}
                        className="w-full"
                    >
                        {status === 'loading' ? 'Creating & Verifying...' : 'Create Admin Profile'}
                    </Button>

                    {message && (
                        <p className={status === 'error' ? 'text-destructive' : 'text-green-600'}>
                            {message}
                        </p>
                    )}

                    {debugInfo && (
                        <div className="mt-4 p-4 bg-slate-100 rounded text-xs font-mono overflow-auto max-h-60">
                            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                    Please log in to continue.
                </div>
            )}
        </div>
    );
}
