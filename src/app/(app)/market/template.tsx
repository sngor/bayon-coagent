'use client';

import { HubLayout } from '@/components/hub';
import { TrendingUp, Search, Target, BarChart3 } from 'lucide-react';

const tabs = [
    { id: 'research', label: 'Research', href: '/market/research', icon: Search },
    { id: 'opportunities', label: 'Opportunities', href: '/market/opportunities', icon: Target },
    { id: 'trends', label: 'Trends', href: '/market/trends', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', href: '/market/analytics', icon: BarChart3 },
];

export default function MarketTemplate({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Market"
            description="Know your market better than anyone else"
            icon={TrendingUp}
            tabs={tabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}