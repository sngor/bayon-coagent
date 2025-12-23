'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Bot } from 'lucide-react';

export default function AssistantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="AI Chat"
            description="Get instant answers, research insights, and personalized content recommendations"
            icon={Bot}
            tabs={[]}
        >
            {children}
            <EnhancedAgentIntegration
                hubContext="assistant"
                position="bottom-right"
                showNotifications={true}
            />
        </HubLayout>
    );
}
