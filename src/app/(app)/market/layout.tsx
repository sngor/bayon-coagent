'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { Lightbulb, Target, TrendingUp, BarChart3 } from 'lucide-react';

const marketTabs = [
    { id: 'insights', label: 'Insights', href: '/market/insights', icon: Lightbulb },
    { id: 'opportunities', label: 'Opportunities', href: '/market/opportunities', icon: Target },
    { id: 'analytics', label: 'Analytics', href: '/market/analytics', icon: TrendingUp },
];

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="market">
            <HubLayoutWithFavorites
                title="Market Intelligence"
                description="Track market trends, opportunities, and analytics for your area"
                icon={BarChart3}
                tabs={marketTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
