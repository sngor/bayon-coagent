import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { checkAdminStatusAction } from '@/app/actions';
import { AdminPageHeader } from '@/components/admin-page-header';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TEMPORARY: Disable all checks for testing
    console.log('Admin layout accessed');

    // const user = await getCurrentUser();
    // if (!user) {
    //     redirect('/login');
    // }
    // if (user.id !== '24589458-5041-7041-a202-29ac2fd374b5') {
    //     redirect('/dashboard');
    // }

    return (
        <div className="space-y-6">
            <AdminPageHeader />
            {children}
        </div>
    );
}