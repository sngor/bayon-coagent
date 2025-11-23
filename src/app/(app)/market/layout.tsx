'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { Target, TrendingUp, BarChart3, Newspaper, Bell } from 'lucide-react';

const marketTabs = [
    { id: 'trends', label: 'Trends', href: '/market/trends', icon: TrendingUp },
    { id: 'news', label: 'News', href: '/market/news', icon: Newspaper },
    { id: 'alerts', label: 'Alerts', href: '/market/alerts', icon: Bell },
    { id: 'opportunities', label: 'Opportunities', href: '/market/opportunities', icon: Target },
    { id: 'analytics', label: 'Analytics', href: '/market/analytics', icon: BarChart3 },
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
