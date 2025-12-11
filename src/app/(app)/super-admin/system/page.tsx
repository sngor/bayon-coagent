import { SystemClient } from './system-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function SuperAdminSystemPage() {
    return <SystemClient />;
}