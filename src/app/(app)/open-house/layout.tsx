'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { FeatureGuard } from '@/components/feature-guard';
import { DoorOpen, Users, BarChart3, FileText, Repeat, Webhook } from 'lucide-react';

const openHouseTabs = [
    { id: 'sessions', label: 'Sessions', href: '/open-house/sessions', icon: DoorOpen },
    { id: 'analytics', label: 'Analytics', href: '/open-house/analytics', icon: BarChart3 },
    { id: 'sequences', label: 'Sequences', href: '/open-house/sequences', icon: Repeat },
    { id: 'templates', label: 'Templates', href: '/open-house/templates', icon: FileText },
    { id: 'webhooks', label: 'Webhooks', href: '/open-house/webhooks', icon: Webhook },
];

export default function OpenHouseLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="open-house">
            <HubLayout
                title="Open House Management"
                description="Manage open house events, track visitor engagement, and generate personalized follow-ups"
                icon={DoorOpen}
                tabs={openHouseTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayout>
        </FeatureGuard>
    );
}
