import UsersClient from './users-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
    return <UsersClient />;
}