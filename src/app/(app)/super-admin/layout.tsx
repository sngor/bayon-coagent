'use client';

import { useUser } from '@/aws/auth/use-user';
import { useAdmin } from '@/contexts/admin-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuperAdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isSuperAdmin, isLoading: adminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !adminLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            
            if (!isSuperAdmin) {
                router.push('/dashboard');
                return;
            }
        }
    }, [user, isSuperAdmin, isUserLoading, adminLoading, router]);

    // Show loading state
    if (isUserLoading || adminLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Verifying Super Admin Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Checking your permissions...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show access denied if not super admin
    if (!isSuperAdmin) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            You don't have permission to access the Super Admin panel.
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SuperAdminGuard>
            <div className="space-y-6">
                {children}
            </div>
        </SuperAdminGuard>
    );
}