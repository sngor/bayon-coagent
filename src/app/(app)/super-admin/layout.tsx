import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { checkAdminStatusAction } from '@/app/actions';
import { HubLayout } from '@/components/hub/hub-layout';
import { Shield } from 'lucide-react';

const SUPER_ADMIN_TABS = [
    { id: 'overview', label: 'Overview', href: '/super-admin' },
    { id: 'users', label: 'Users', href: '/super-admin/users' },
    { id: 'teams', label: 'Teams', href: '/super-admin/teams' },
    { id: 'content', label: 'Content', href: '/super-admin/content' },
    { id: 'analytics', label: 'Analytics', href: '/super-admin/analytics' },
    { id: 'health', label: 'System', href: '/super-admin/health' },
    { id: 'features', label: 'Features', href: '/super-admin/features' },
    { id: 'billing', label: 'Billing', href: '/super-admin/billing' },
];

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TEMPORARY: Disable all checks for testing
    console.log('Super Admin layout accessed');

    // const user = await getCurrentUser();
    // if (!user) {
    //     redirect('/login');
    // }
    // 
    // // Check if user has super admin privileges
    // const adminStatus = await checkAdminStatusAction();
    // if (!adminStatus.success || adminStatus.data?.role !== 'super_admin') {
    //     redirect('/dashboard');
    // }

    return (
        <HubLayout
            title="Super Admin"
            description="System administration and management"
            icon={Shield}
            tabs={SUPER_ADMIN_TABS}
        >
            {children}
        </HubLayout>
    );
}