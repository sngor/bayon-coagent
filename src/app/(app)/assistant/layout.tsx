'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { Bot } from 'lucide-react';

export default function AssistantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="AI Assistant"
            description="Get instant answers, research insights, and personalized content recommendations"
            icon={Bot}
            tabs={[]}
        >
            {children}
        </HubLayout>
    );
}
