'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Wand2, PenTool, Image, Sparkles, Gift, Home } from 'lucide-react';

const studioTabs = [
    { id: 'write', label: 'Write', href: '/studio/write', icon: PenTool },
    { id: 'describe', label: 'Listing Generator', href: '/studio/describe', icon: Sparkles },
    { id: 'reimagine', label: 'Reimagine', href: '/studio/reimagine', icon: Image },
    { id: 'post-cards', label: 'Post Cards', href: '/studio/post-cards', icon: Gift },
    { id: 'open-house', label: 'Open House', href: '/studio/open-house', icon: Home },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="studio">
            <HubLayoutWithFavorites
                title="Content Studio"
                description="Turn ideas into polished content in minutes with AI-powered writing and creative tools"
                icon={Wand2}
                tabs={studioTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="studio"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
