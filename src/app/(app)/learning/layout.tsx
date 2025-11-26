'use client';

import { HubLayout } from '@/components/hub';
import { FeatureGuard } from '@/components/feature-guard';
import { GraduationCap, BookOpen, Brain, Target } from 'lucide-react';

const trainingTabs = [
    { id: 'lessons', label: 'Lessons', href: '/learning/lessons', icon: BookOpen },
    { id: 'ai-plan', label: 'AI Plan', href: '/learning/ai-plan', icon: Brain },
    { id: 'practice', label: 'Practice', href: '/learning/practice', icon: Target },
];

export default function TrainingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FeatureGuard featureId="training">
            <HubLayout
                title="Learning Hub"
                description="Sharpen your skills with proven strategies and personalized AI coaching"
                icon={GraduationCap}
                tabs={trainingTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayout>
        </FeatureGuard>
    );
}
