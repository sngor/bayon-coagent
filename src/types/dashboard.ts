import type { Review, Profile, MarketingPlan, BrandAudit, Competitor } from '@/lib/types/common';

export interface DashboardData {
    agentProfile: Profile | null;
    allReviews: Review[];
    recentReviews: Review[];
    latestPlan: MarketingPlan | null;
    brandAudit: BrandAudit | null;
    competitors: Competitor[];
    announcements: Announcement[];
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    senderName: string;
    createdAt: string;
    userId?: string;
}

export interface DashboardMetrics {
    averageRating: string;
    totalReviews: number;
    recentReviewsCount: number;
    parsedAverageRating: number;
    planStepsCount: number;
    completionPercentage: number;
}

export interface SuggestedStep {
    title: string;
    description: string;
    href: string;
    priority: 'high' | 'medium' | 'low';
    category: 'profile' | 'strategy' | 'audit' | 'competitors';
}

export interface DashboardState {
    data: DashboardData | null;
    workflowInstances: any[];
    isLoading: boolean;
    error: string | null;
}

export interface DashboardSectionProps {
    isLoading: boolean;
    error?: string | null;
    className?: string;
    onRetry?: () => void;
}

// Props for specific dashboard sections
export interface PerformanceOverviewProps extends DashboardSectionProps {
    agentProfile: Profile | null;
    completionPercentage: number;
    planStepsCount: number;
    competitorsCount: number;
    brandAuditCompleted: boolean;
}

export interface PriorityActionsProps extends DashboardSectionProps {
    latestPlan: MarketingPlan | null;
}

export interface ReputationSnapshotProps extends DashboardSectionProps {
    metrics: Pick<DashboardMetrics, 'averageRating' | 'totalReviews' | 'recentReviewsCount' | 'parsedAverageRating'>;
    recentReviews: Review[];
}

export interface TodaysFocusProps extends DashboardSectionProps {
    suggestedSteps: SuggestedStep[];
}