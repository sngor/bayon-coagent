'use client';

import {
    PageLayout,
    Section,
    FeatureCardGrid,
    ComingSoonGrid,
    StepList,
    StandardEmptyState,
    IntelligentEmptyState,
    StandardSkeleton
} from '@/components/ui/reusable';
import {
    TrendingUp,
    BarChart3,
    PieChart,
    FileText,
    Plus,
    Search,
    Database,
    Brain,
    Upload
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ReusableComponentsDemo() {
    const [showSkeleton, setShowSkeleton] = useState(false);

    // Example feature cards with mixed states
    const mixedFeatures = [
        {
            icon: FileText,
            title: 'Active Feature',
            description: 'This feature is fully functional and ready to use',
            action: {
                label: 'Get Started',
                onClick: () => alert('Feature clicked!'),
                variant: 'default' as const,
            },
        },
        {
            icon: Search,
            title: 'Coming Soon Feature',
            description: 'This feature will be available in the next release',
            comingSoon: true,
        },
        {
            icon: Database,
            title: 'External Link Feature',
            description: 'This feature links to an external resource',
            action: {
                label: 'Learn More',
                href: '/external-resource',
                variant: 'outline' as const,
            },
        },
    ];

    // Example coming soon cards with priorities
    const comingSoonFeatures = [
        {
            icon: TrendingUp,
            title: 'High Priority Feature',
            description: 'Critical feature coming in the next sprint',
            timeline: 'Next 2 weeks',
            priority: 'high' as const,
        },
        {
            icon: BarChart3,
            title: 'Medium Priority Feature',
            description: 'Important feature scheduled for next quarter',
            timeline: 'Q2 2025',
            priority: 'medium' as const,
        },
        {
            icon: PieChart,
            title: 'Low Priority Feature',
            description: 'Nice-to-have feature for future consideration',
            timeline: 'Future release',
            priority: 'low' as const,
        },
    ];

    // Example steps with different statuses
    const processSteps = [
        {
            title: 'Completed Step',
            description: 'This step has been successfully completed',
            status: 'completed' as const,
        },
        {
            title: 'Active Step',
            description: 'This is the current step in progress',
            status: 'active' as const,
        },
        {
            title: 'Pending Step',
            description: 'This step is waiting to be started',
            status: 'pending' as const,
        },
        {
            title: 'Another Pending Step',
            description: 'This step will come after the previous one',
            status: 'pending' as const,
        },
    ];

    return (
        <PageLayout
            title="Reusable Components Demo"
            description="Showcase of all reusable UI components and patterns"
            actions={[
                {
                    label: 'Toggle Skeleton',
                    onClick: () => setShowSkeleton(!showSkeleton),
                    variant: 'outline',
                    icon: showSkeleton ? FileText : Search,
                },
                {
                    label: 'Add New',
                    onClick: () => alert('Add new clicked!'),
                    icon: Plus,
                },
            ]}
        >
            <Section
                title="Mixed Feature Cards"
                description="Feature cards with different states and actions"
            >
                {showSkeleton ? (
                    <StandardSkeleton variant="feature-grid" count={3} />
                ) : (
                    <FeatureCardGrid cards={mixedFeatures} />
                )}
            </Section>

            <Section
                title="Coming Soon Features"
                description="Features in development with priority indicators"
            >
                {showSkeleton ? (
                    <StandardSkeleton variant="feature-grid" count={3} />
                ) : (
                    <ComingSoonGrid cards={comingSoonFeatures} />
                )}
            </Section>

            <Section
                title="Process Steps"
                description="Step-by-step processes with status indicators"
            >
                {showSkeleton ? (
                    <StandardSkeleton variant="step-list" count={4} />
                ) : (
                    <StepList
                        title="Implementation Process"
                        description="Follow these steps to complete the implementation"
                        steps={processSteps}
                        variant="card"
                    />
                )}
            </Section>

            <Section
                title="Empty States"
                description="Different empty state variations"
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <StandardEmptyState
                        icon={<FileText className="h-12 w-12 text-primary" />}
                        title="No Data Available"
                        description="There's no data to display right now. Try creating some content first."
                        action={{
                            label: 'Create Content',
                            onClick: () => alert('Create clicked!'),
                            variant: 'default',
                        }}
                    />

                    <IntelligentEmptyState
                        icon={Brain}
                        title="AI Analysis Ready"
                        description="Upload your data to get AI-powered insights and recommendations."
                        actions={[
                            {
                                label: 'Upload Data',
                                onClick: () => alert('Upload clicked!'),
                                icon: Upload,
                            },
                            {
                                label: 'Learn More',
                                onClick: () => alert('Learn more clicked!'),
                                variant: 'outline',
                            },
                        ]}
                        variant="card"
                    />
                </div>
            </Section>

            <Section
                title="Loading States"
                description="Various skeleton loading patterns"
            >
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium mb-3">Card Grid Skeleton</h4>
                        <StandardSkeleton variant="card" count={3} />
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">List Skeleton</h4>
                        <StandardSkeleton variant="list" count={3} />
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">Form Skeleton</h4>
                        <StandardSkeleton variant="form" count={4} />
                    </div>
                </div>
            </Section>
        </PageLayout>
    );
}