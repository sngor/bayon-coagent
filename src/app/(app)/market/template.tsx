'use client';

import { HubLayout } from '@/components/hub';
import { TrendingUp, Search, Lightbulb, Calculator, Wrench } from 'lucide-react';

const tabs = [
    { id: 'research', label: 'Research', href: '/market/research', icon: Search },
    { id: 'insights', label: 'Insights', href: '/market/insights', icon: Lightbulb },
    { id: 'calculator', label: 'Calculator', href: '/market/calculator', icon: Calculator },
    { id: 'tools', label: 'Analysis', href: '/market/tools', icon: Wrench },
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