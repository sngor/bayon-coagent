'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { GraduationCap } from 'lucide-react';

const trainingTabs = [
    { id: 'lessons', label: 'Lessons', href: '/training/lessons' },
    { id: 'ai-plan', label: 'AI Plan', href: '/training/ai-plan' },
    { id: 'practice', label: 'Practice', href: '/training/practice' },
];

export default function TrainingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="Training Hub"
            description="Sharpen your skills with proven strategies and personalized AI coaching"
            icon={GraduationCap}
            tabs={trainingTabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}
