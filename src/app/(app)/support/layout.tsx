'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { HelpCircle } from 'lucide-react';

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="Support"
            description="Find answers to common questions or reach out to our support team"
            icon={HelpCircle}
            tabs={[]}
        >
            {children}
        </HubLayout>
    );
}
