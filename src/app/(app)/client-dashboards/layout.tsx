'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Users, LayoutDashboard, BarChart3 } from 'lucide-react';

const clientDashboardTabs = [
    { id: 'dashboards', label: 'Dashboards', href: '/client-dashboards', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', href: '/client-dashboards/analytics', icon: BarChart3 },
];

export default function ClientDashboardsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="client-dashboards">
            <HubLayoutWithFavorites
                title="Client Dashboards"
                description="Create personalized dashboards for your clients with market reports, property search, and more"
                icon={Users}
                tabs={clientDashboardTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="client-dashboards"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
