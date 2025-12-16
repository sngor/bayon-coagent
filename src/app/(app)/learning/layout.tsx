'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';
import { GraduationCap, BookOpen, Video, Award, CheckCircle, Users, Brain, Play } from 'lucide-react';

const learningTabs = [
    { id: 'lessons', label: 'Lessons', href: '/learning/lessons', icon: BookOpen },
    { id: 'tutorials', label: 'Tutorials', href: '/learning/tutorials', icon: Video },
    { id: 'role-play', label: 'Role-Play', href: '/learning/role-play', icon: Play },
    { id: 'ai-lesson-plan', label: 'AI Lesson Plan', href: '/learning/ai-lesson-plan', icon: Brain },
    { id: 'best-practices', label: 'Best Practices', href: '/learning/best-practices', icon: CheckCircle },
    { id: 'certification', label: 'Certification', href: '/learning/certification', icon: Award },
    { id: 'community', label: 'Community', href: '/learning/community', icon: Users },
];

export default function LearningLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="learning">
            <HubLayoutWithFavorites
                title="Learning & Development"
                description="Master real estate marketing with interactive lessons, role-play practice, and AI-powered learning plans"
                icon={GraduationCap}
                tabs={learningTabs}
                tabsVariant="pills"
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="learning"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}