'use client';

import { HubLayout } from '@/components/hub';
import { Brain, Search, Users, TrendingUp } from 'lucide-react';

const tabs = [
    { id: 'research', label: 'Research', href: '/intelligence/research', icon: Search },
    { id: 'competitors', label: 'Competitors', href: '/intelligence/competitors', icon: Users },
    { id: 'market-insights', label: 'Market Insights', href: '/intelligence/market-insights', icon: TrendingUp },
];

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Intelligence"
            description="AI-powered research and market insights"
            icon={Brain}
            tabs={tabs}
        >
            {children}
        </HubLayout>
    );
}
