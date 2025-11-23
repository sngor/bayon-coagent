'use client';

import { HubLayout } from '@/components/hub';
import { FeatureGuard } from '@/components/feature-guard';
import { Search, FileText, BookOpen } from 'lucide-react';

const researchTabs = [
    { id: 'agent', label: 'Research Agent', href: '/research/agent', icon: Search },
    { id: 'reports', label: 'Reports', href: '/research/reports', icon: FileText },
    { id: 'knowledge', label: 'Knowledge Base', href: '/research/knowledge', icon: BookOpen },
];

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="research">
            <HubLayout
                title="Research Hub"
                description="AI-powered research and knowledge management for real estate professionals"
                icon={Search}
                tabs={researchTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayout>
        </FeatureGuard>
    );
}