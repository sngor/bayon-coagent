'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Search, FileText, BookOpen, TrendingUp, Newspaper, Bell, Target, BarChart3, Sparkles } from 'lucide-react';

const researchTabs = [
    { id: 'agent', label: 'Research', href: '/intelligence/agent', icon: Search },
    { id: 'trends', label: 'Market Trends', href: '/intelligence/trends', icon: TrendingUp },
    { id: 'news', label: 'News', href: '/intelligence/news', icon: Newspaper },
    { id: 'alerts', label: 'Alerts', href: '/intelligence/alerts', icon: Bell },
    { id: 'opportunities', label: 'Opportunities', href: '/intelligence/opportunities', icon: Target },
    { id: 'analytics', label: 'Analytics', href: '/intelligence/analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', href: '/intelligence/reports', icon: FileText },
    { id: 'knowledge', label: 'Knowledge Base', href: '/intelligence/knowledge', icon: BookOpen },
];

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="research">
            <HubLayoutWithFavorites
                title="Intelligence Hub"
                description="AI-powered research, market intelligence, and insights for real estate professionals"
                icon={Sparkles}
                tabs={researchTabs}
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