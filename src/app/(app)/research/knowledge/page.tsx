'use client';

import { BookOpen, Upload, Search, FileText, Database, Brain } from 'lucide-react';
import { PageLayout, FeatureCardGrid, StepList } from '@/components/ui/reusable';

export default function KnowledgeBasePage() {
    const knowledgeFeatures = [
        {
            icon: FileText,
            title: 'Research Reports',
            description: 'All your AI-generated research reports and market analyses',
            action: {
                label: 'View Reports',
                href: '/research/reports',
                variant: 'outline' as const,
            },
        },
        {
            icon: Database,
            title: 'Market Data',
            description: 'Historical market trends, pricing data, and analytics',
            comingSoon: true,
        },
        {
            icon: Upload,
            title: 'Document Library',
            description: 'Upload and organize your own research documents and files',
            comingSoon: true,
        },
        {
            icon: Brain,
            title: 'AI Insights',
            description: 'Automatically generated insights from your research data',
            comingSoon: true,
        },
        {
            icon: Search,
            title: 'Smart Search',
            description: 'AI-powered search across all your research materials',
            comingSoon: true,
        },
        {
            icon: BookOpen,
            title: 'Learning Resources',
            description: 'Curated educational content and best practices',
            action: {
                label: 'View Training',
                href: '/training',
                variant: 'outline' as const,
            },
        },
    ];

    const gettingStartedSteps = [
        {
            title: 'Start Research Projects',
            description: 'Use the Research Agent to generate comprehensive reports on market topics',
            status: 'active' as const,
        },
        {
            title: 'Upload Documents',
            description: 'Add your own research materials and documents (coming soon)',
            status: 'pending' as const,
        },
        {
            title: 'Discover Insights',
            description: 'Let AI analyze your data to surface actionable insights (coming soon)',
            status: 'pending' as const,
        },
    ];

    return (
        <PageLayout
            title="Knowledge Base"
            description="Centralized repository for all your research materials and insights"
        >
            <FeatureCardGrid cards={knowledgeFeatures} />

            <StepList
                title="Getting Started with Knowledge Base"
                description="Build your research repository with these steps"
                steps={gettingStartedSteps}
                variant="card"
            />
        </PageLayout>
    );
}