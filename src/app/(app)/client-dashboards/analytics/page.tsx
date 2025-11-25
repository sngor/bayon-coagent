'use client';

import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { BarChart3 } from 'lucide-react';

export default function ClientDashboardAnalyticsPage() {
    return (
        <div className="space-y-6">
            <IntelligentEmptyState
                icon={BarChart3}
                title="Analytics Coming Soon"
                description="Aggregate analytics across all client dashboards will be available here. Track engagement, views, and client activity."
            />
        </div>
    );
}
