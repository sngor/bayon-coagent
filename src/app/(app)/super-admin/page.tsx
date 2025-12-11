import SuperAdminClient from './super-admin-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function AdminPage() {
    return <SuperAdminClient />;
}