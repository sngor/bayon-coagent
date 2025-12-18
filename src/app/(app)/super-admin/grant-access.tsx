'use client';

import { useState } from 'react';
import { useUser } from '@/aws/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export default function GrantAccessPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const grantSuperAdminAccess = async () => {
        if (!user?.id) {
            setError('No user ID found');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/admin/cognito-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'make-superadmin',
                    userId: user.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMessage('Super admin access granted! Please refresh the page.');
            } else {
                setError(result.error || 'Failed to grant access');
            }
        } catch (err) {
            console.error('Error granting access:', err);
            setError('Failed to grant access');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                <h1 className="text-3xl font-bold mb-2">Grant Super Admin Access</h1>
                <p className="text-muted-foreground">
                    Use this page to grant yourself super admin access if you don't have it yet.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>User ID</Label>
                        <Input value={user?.id || 'Not loaded'} readOnly />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input value={user?.email || 'Not loaded'} readOnly />
                    </div>
                </CardContent>
            </Card>

            {message && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {message}
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Grant Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        This will add your user to the 'superadmin' Cognito group, granting you full system access.
                    </p>
                    <Button 
                        onClick={grantSuperAdminAccess}
                        disabled={loading || !user?.id}
                        className="w-full"
                    >
                        {loading ? 'Granting Access...' : 'Grant Super Admin Access'}
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center">
                <Button variant="outline" asChild>
                    <a href="/super-admin">
                        Back to Super Admin Dashboard
                    </a>
                </Button>
            </div>
        </div>
    );
}