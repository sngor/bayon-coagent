'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Search, Bot, BookOpen, TrendingUp, Newspaper, Bell, Target, BarChart3 } from 'lucide-react';

const researchTabs = [
    { id: 'agent', label: 'Research Agent', href: '/research/agent', icon: Bot },
    { id: 'insights', label: 'Market Insights', href: '/research/insights', icon: TrendingUp },
    { id: 'news', label: 'News', href: '/research/news', icon: Newspaper },
    { id: 'opportunities', label: 'Opportunities', href: '/research/opportunities', icon: Target },
    { id: 'analytics', label: 'Analytics', href: '/research/analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', href: '/research/alerts', icon: Bell },
    { id: 'knowledge', label: 'Knowledge Base', href: '/research/knowledge', icon: BookOpen },
];

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="research">
            <HubLayoutWithFavorites
                title="Research Hub"
                description="Get comprehensive research and insights on any market topic with AI-powered research capabilities and market intelligence"
                icon={Search}
                tabs={researchTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="research"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}