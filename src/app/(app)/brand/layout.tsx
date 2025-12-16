'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { Target, User, Shield, Users, Zap, Calendar, MessageSquareQuote, Sparkles, Settings } from 'lucide-react';

const brandTabs = [
    { id: 'profile', label: 'Profile', href: '/brand/profile', icon: User },
    { id: 'audit', label: 'Audit', href: '/brand/audit', icon: Shield },
    { id: 'ai-visibility', label: 'AI Visibility', href: '/brand/audit/ai-visibility', icon: Sparkles },
    { id: 'competitors', label: 'Competitors', href: '/brand/competitors', icon: Users },
    { id: 'strategy', label: 'Strategy', href: '/brand/strategy', icon: Zap },
    { id: 'integrations', label: 'Integrations', href: '/brand/integrations', icon: Settings },
    { id: 'testimonials', label: 'Testimonials', href: '/brand/testimonials', icon: MessageSquareQuote },
    { id: 'calendar', label: 'Calendar', href: '/brand/calendar', icon: Calendar },
];

export default function BrandLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="brand">
            <HubLayoutWithFavorites
                title="Brand Identity & Strategy"
                description="Own your market position and outshine the competition with professional branding tools"
                icon={Target}
                tabs={brandTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="brand"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
