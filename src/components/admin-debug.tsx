'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/aws/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkAdminStatusAction, fixMyAdminStatusAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export function AdminDebug() {
    const { user } = useUser();
    const { toast } = useToast();
    const [adminStatus, setAdminStatus] = useState<{
        isAdmin: boolean;
        loading: boolean;
        error?: string;
        profileData?: any;
        role?: string;
    }>({
        isAdmin: false,
        loading: true,
    });
    const [isFixing, setIsFixing] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            if (!user?.id) {
                setAdminStatus({ isAdmin: false, loading: false });
                return;
            }

            try {
                const result = await checkAdminStatusAction(user.id);
                setAdminStatus({
                    isAdmin: result.isAdmin,
                    loading: false,
                    profileData: result.profileData,
                    role: result.role,
                    error: result.error,
                });
            } catch (error: any) {
                setAdminStatus({
                    isAdmin: false,
                    loading: false,
                    error: error.message,
                });
            }
        }

        checkAdmin();
    }, [user?.id]);

    const handleFixAdminStatus = async () => {
        if (!user?.id || !user?.email) {
            toast({
                title: 'Error',
                description: 'User information not available',
                variant: 'destructive',
            });
            return;
        }

        setIsFixing(true);
        try {
            const result = await fixMyAdminStatusAction(user.id, user.email);
            if (result.message === 'success') {
                toast({
                    title: 'Admin Status Fixed!',
                    description: 'Your super admin status has been restored. Refresh the page.',
                });
                // Refresh the admin status
                if (user?.id) {
                    const newStatus = await checkAdminStatusAction(user.id);
                    setAdminStatus({
                        isAdmin: newStatus.isAdmin,
                        loading: false,
                        profileData: newStatus.profileData,
                        role: newStatus.role,
                        error: newStatus.error,
                    });
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsFixing(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Admin Status Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="font-medium">User ID:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{user.id}</code>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-medium">Admin Status:</span>
                    {adminStatus.loading ? (
                        <Badge variant="secondary">Loading...</Badge>
                    ) : adminStatus.isAdmin ? (
                        <Badge variant="default">✅ {adminStatus.role?.toUpperCase()}</Badge>
                    ) : (
                        <Badge variant="destructive">❌ Not Admin</Badge>
                    )}
                </div>

                {adminStatus.error && (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Error:</span>
                        <span className="text-destructive text-sm">{adminStatus.error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <span className="font-medium">Profile Data:</span>
                    {adminStatus.profileData ? (
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(adminStatus.profileData, null, 2)}
                        </pre>
                    ) : (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            No profile data found. This might be the issue!
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <span className="font-medium">Database Keys Being Used:</span>
                    <div className="text-xs bg-muted p-3 rounded">
                        <div>PK: USER#{user.id}</div>
                        <div>SK: PROFILE</div>
                    </div>
                </div>

                <div className="pt-2 border-t space-y-3">
                    {!adminStatus.isAdmin && !adminStatus.loading && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                If you ran the CLI script but don't see admin status, click to fix:
                            </p>
                            <Button
                                onClick={handleFixAdminStatus}
                                disabled={isFixing}
                                variant="outline"
                                size="sm"
                            >
                                {isFixing ? 'Fixing...' : 'Fix My Admin Status'}
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Test admin access directly:
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => window.location.href = '/super-admin/feedback'}
                                variant="outline"
                                size="sm"
                            >
                                Go to Admin Panel
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                size="sm"
                            >
                                Hard Refresh
                            </Button>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground">
                            If you're a super admin but don't see admin features, try:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Sign out and sign back in</li>
                            <li>• Clear browser cache</li>
                            <li>• Check the user dropdown menu for "Admin Panel"</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}