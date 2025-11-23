'use client';

import { BookOpen, Upload, Search, FileText, Database, Brain, Newspaper } from 'lucide-react';
import { PageLayout, FeatureCardGrid, StepList } from '@/components/ui/reusable';
import { NewsFeed } from '@/components/news-feed';
import { NewsFilters } from '@/components/news-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function KnowledgeBasePage() {
    const [newsLocation, setNewsLocation] = useState('');

    const knowledgeFeatures = [
        {
            icon: Newspaper,
            title: 'Real Estate News',
            description: 'Stay updated with the latest real estate news and market trends',
            action: {
                label: 'View News Feed',
                onClick: () => {
                    const newsSection = document.getElementById('news-feed-section');
                    newsSection?.scrollIntoView({ behavior: 'smooth' });
                },
                variant: 'outline' as const,
            },
        },
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

            {/* News Feed Section */}
            <div id="news-feed-section" className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Real Estate News Feed</h2>
                        <p className="text-muted-foreground">
                            Stay updated with the latest real estate news and market trends
                        </p>
                    </div>
                </div>

                {/* News Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filter News</CardTitle>
                        <CardDescription>
                            Customize your news feed by location or topic
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NewsFilters
                            onFilterChange={setNewsLocation}
                            defaultLocation={newsLocation}
                        />
                    </CardContent>
                </Card>

                {/* News Feed */}
                <NewsFeed location={newsLocation} />
            </div>
        </PageLayout>
    );
}