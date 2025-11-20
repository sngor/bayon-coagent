'use client';

import { HubLayout } from '@/components/hub';
import { TrendingUp, Search, Target, BarChart3 } from 'lucide-react';

const tabs = [
    { id: 'research', label: 'Research', href: '/market/research', icon: Search },
    { id: 'opportunities', label: 'Opportunities', href: '/market/opportunities', icon: Target },
    { id: 'trends', label: 'Trends', href: '/market/trends', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', href: '/market/analytics', icon: BarChart3 },
];

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Market"
            description="Data-driven insights for smarter decisions"
            icon={TrendingUp}
            tabs={tabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}
