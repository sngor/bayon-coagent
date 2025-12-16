'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { TrendingUp, Newspaper, Bell, Target, BarChart3 } from 'lucide-react';

const marketTabs = [
    { id: 'insights', label: 'Insights', href: '/market/insights', icon: TrendingUp },
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
                description="Track market trends, opportunities, and analytics to stay ahead of the competition"
                icon={TrendingUp}
                tabs={marketTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="market"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}