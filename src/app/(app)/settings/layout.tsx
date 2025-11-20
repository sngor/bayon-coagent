'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { Settings } from 'lucide-react';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="Settings"
            description="Manage your account, integrations, and preferences"
            icon={Settings}
            tabs={[]}
        >
            {children}
        </HubLayout>
    );
}
