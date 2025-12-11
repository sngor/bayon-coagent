import AuditLogsClient from './audit-logs-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function AuditLogsPage() {
    return <AuditLogsClient />;
}