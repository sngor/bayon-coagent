'use client';

import { HubLayout } from '@/components/hub';
import { AISparkleIcon } from '@/components/ui/real-estate-icons';
import { Search, Lightbulb, Target, TrendingUp } from 'lucide-react';

const marketTabs = [
    { id: 'research', label: 'Research', href: '/market/research', icon: Search },
    { id: 'insights', label: 'Insights', href: '/market/insights', icon: Lightbulb },
    { id: 'opportunities', label: 'Opportunities', href: '/market/opportunities', icon: Target },
];

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Market Intelligence"
            description="Know your market better than anyone else with AI-powered research and insights"
            icon={AISparkleIcon}
            tabs={marketTabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}
