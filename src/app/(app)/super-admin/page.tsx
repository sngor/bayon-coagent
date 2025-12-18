import SuperAdminClient from './super-admin-client';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

function SuperAdminLoading() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Loading system administration overview...</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please wait while we load the super admin dashboard...</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SuperAdminPage() {
    return (
        <Suspense fallback={<SuperAdminLoading />}>
            <SuperAdminClient />
        </Suspense>
    );
}