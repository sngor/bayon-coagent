'use client';

import { StandardEmptyState } from '@/components/standard';
import { BarChart3 } from 'lucide-react';

export default function MarketAnalyticsPage() {
    return (
        <div className="space-y-6">
            <StandardEmptyState
                icon={<BarChart3 className="h-12 w-12 text-primary" />}
                title="Market Analytics Coming Soon"
                description="Track market metrics, neighborhood data, pricing trends, and more. This feature is currently in development."
                variant="card"
            />
        </div>
    );
}
