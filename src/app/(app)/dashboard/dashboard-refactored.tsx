'use client';

import { useMemo, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui';
import { InvitationBanner } from '@/components/invitation-banner';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { DashboardQuickActions } from '@/components/dashboard-quick-actions';
import { DashboardWorkflowSection } from '@/components/dashboard-workflow-section';
import { ProactiveSuggestionsPanel } from '@/components/enhanced-agents';
import { DashboardErrorBoundary, DashboardSectionError } from '@/components/dashboard/dashboard-error-boundary';
import { DashboardLoadingState } from '@/components/dashboard/dashboard-loading-states';
import { DashboardSectionWrapper, DashboardSkipLinks } from '@/components/dashboard/dashboard-accessibility';
import {
    PerformanceOverviewSection,
    PriorityActionsSection,
    ReputationSnapshotSection,
    TodaysFocusSection
} from '@/components/dashboard/dashboard-sections';

import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
    const { user } = useUser();
    const { dashboardData, workflowInstances, isLoading, error } = useDashboardData(user?.id);

    const metrics = useDashboardMetrics(
        dashboardData?.allReviews || [],
        dashboardData?.agentProfile || null,
        dashboardData?.latestPlan ? [dashboardData.latestPlan] : [],
        dashboardData?.brandAudit || null,
        dashboardData?.competitors || []
    );

    // Banner state management
    const handleBannerDismiss = useCallback(() => {
        if (!user) return;

        const dismissedKey = `profile-banner-dismissed-${user.id}`;
        localStorage.setItem(dismissedKey, 'true');

        toast({
            title: "Banner dismissed",
            description: "You can always complete your profile later from the Brand section.",
        });
    }, [user]);

    // Show error state if dashboard failed to load
    if (error && !dashboardData) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <DashboardSectionError
                        title="Dashboard"
                        error={error}
                        onRetry={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    return (
        <DashboardErrorBoundary>
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
                <DashboardSkipLinks />

                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                    <InvitationBanner />

                    {/* Welcome Section for New Users */}
                    {!isLoading && metrics.completionPercentage < 100 && (
                        <DashboardSectionWrapper title="Welcome" description="Get started with Bayon Coagent">
                            <div className="p-6 text-center">
                                <h3 className="text-lg font-semibold mb-2">
                                    Welcome{dashboardData?.agentProfile?.name ? `, ${dashboardData.agentProfile.name.split(' ')[0]}` : ''}!
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Your profile is {metrics.completionPercentage}% complete. Let's finish setting up your brand presence.
                                </p>
                            </div>
                        </DashboardSectionWrapper>
                    )}

                    {/* Profile Completion Banner */}
                    {dashboardData?.agentProfile &&
                        metrics.completionPercentage >= 50 &&
                        metrics.completionPercentage < 100 && (
                            <ProfileCompletionBanner
                                profile={dashboardData.agentProfile}
                                onDismiss={handleBannerDismiss}
                            />
                        )}

                    {/* Quick Actions */}
                    <DashboardSectionWrapper title="Quick Actions" description="Common tasks and shortcuts">
                        <div id="quick-actions" tabIndex={-1}>
                            {isLoading ? (
                                <DashboardLoadingState variant="actions" />
                            ) : (
                                <DashboardQuickActions />
                            )}
                        </div>
                    </DashboardSectionWrapper>

                    {/* Guided Workflows */}
                    {user && (
                        <DashboardSectionWrapper title="Guided Workflows" description="Step-by-step processes">
                            {isLoading ? (
                                <DashboardLoadingState variant="workflows" />
                            ) : (
                                <DashboardWorkflowSection
                                    userId={user.id}
                                    initialInstances={workflowInstances}
                                />
                            )}
                        </DashboardSectionWrapper>
                    )}

                    <DataGrid columns={3} className="orientation-transition gap-6 md:gap-8">
                        <div className="col-span-3 tablet:col-span-2 lg:col-span-2 space-y-6 md:space-y-8">

                            {/* Performance Overview */}
                            <DashboardSectionWrapper title="Performance Overview" description="Track your progress and key metrics">
                                <div id="performance-overview" tabIndex={-1}>
                                    {isLoading ? (
                                        <DashboardLoadingState variant="metrics" />
                                    ) : (
                                        <PerformanceOverviewSection
                                            isLoading={false}
                                            data={{
                                                agentProfile: dashboardData?.agentProfile || null,
                                                completionPercentage: metrics.completionPercentage,
                                                planStepsCount: metrics.planStepsCount,
                                                competitorsCount: dashboardData?.competitors?.length || 0,
                                                brandAuditCompleted: !!dashboardData?.brandAudit
                                            }}
                                        />
                                    )}
                                </div>
                            </DashboardSectionWrapper>

                            {/* Priority Actions */}
                            <DashboardSectionWrapper title="Priority Actions" description="High-impact activities">
                                <div id="priority-actions" tabIndex={-1}>
                                    {isLoading ? (
                                        <DashboardLoadingState variant="actions" />
                                    ) : (
                                        <PriorityActionsSection
                                            isLoading={false}
                                            data={{
                                                latestPlan: dashboardData?.latestPlan || null
                                            }}
                                        />
                                    )}
                                </div>
                            </DashboardSectionWrapper>

                            {/* Reputation Snapshot */}
                            <DashboardSectionWrapper title="Reputation Snapshot" description="Client testimonials and reviews">
                                {isLoading ? (
                                    <DashboardLoadingState variant="reviews" />
                                ) : (
                                    <ReputationSnapshotSection
                                        isLoading={false}
                                        data={{
                                            metrics: {
                                                averageRating: metrics.averageRating,
                                                totalReviews: metrics.totalReviews,
                                                recentReviewsCount: metrics.recentReviewsCount,
                                                parsedAverageRating: metrics.parsedAverageRating,
                                            },
                                            recentReviews: dashboardData?.recentReviews || []
                                        }}
                                    />
                                )}
                            </DashboardSectionWrapper>
                        </div>

                        <div className="col-span-3 tablet:col-span-1 lg:col-span-1 space-y-6 md:space-y-8">
                            {/* AI Suggestions Panel */}
                            <ProactiveSuggestionsPanel
                                maxHeight="500px"
                                showFilters={true}
                                autoRefresh={true}
                                refreshInterval={300000}
                                className="border-0 shadow-xl bg-gradient-to-br from-card to-purple-500/5"
                            />

                            {/* Announcements */}
                            {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Announcements</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {dashboardData.announcements.map((announcement: any, index: number) => (
                                                <div key={index} className="p-3 bg-muted rounded-lg">
                                                    <p className="text-sm">{announcement.message || announcement.title}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Today's Focus */}
                            <TodaysFocusSection
                                isLoading={isLoading}
                                data={{
                                    suggestedSteps: metrics.suggestedSteps
                                }}
                            />
                        </div>
                    </DataGrid>
                </div>
            </div>
        </DashboardErrorBoundary>
    );
}