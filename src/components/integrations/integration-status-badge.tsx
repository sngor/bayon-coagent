/**
 * Integration status badge component
 */

import { Badge } from '@/components/ui/badge';
import type { IntegrationStatus } from '@/types/integrations';

interface IntegrationStatusBadgeProps {
    status: IntegrationStatus;
}

export function IntegrationStatusBadge({ status }: IntegrationStatusBadgeProps) {
    switch (status) {
        case 'active':
            return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
        case 'inactive':
            return <Badge variant="secondary">Inactive</Badge>;
        case 'error':
            return <Badge variant="destructive">Error</Badge>;
        case 'pending':
            return <Badge variant="outline">Pending Setup</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}